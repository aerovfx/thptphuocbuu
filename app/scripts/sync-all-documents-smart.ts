/**
 * Script thông minh để đồng bộ tự động tất cả văn bản vào Spaces và Tổ chuyên môn
 * Sử dụng Prisma để đảm bảo tính nhất quán
 * Chạy: npx tsx app/scripts/sync-all-documents-smart.ts
 */

import { prisma } from '@/lib/prisma'
import { syncDocumentToSpacesAndDepartments } from '@/lib/document-sync'

/**
 * Tìm các spaces phù hợp với văn bản dựa trên tag matching
 */
async function findMatchingSpacesForDocument(
  title: string,
  sender: string | null,
  recipient: string | null
): Promise<Array<{ spaceId: string; spaceName: string; score: number }>> {
  const allSpaces = await prisma.space.findMany({
    where: { isActive: true },
    include: {
      departments: {
        select: {
          name: true,
          code: true,
          subject: true,
        },
      },
    },
  })

  const searchText = (title + ' ' + (sender || '') + ' ' + (recipient || '')).toLowerCase()
  const matches: Array<{ spaceId: string; spaceName: string; score: number }> = []

  for (const space of allSpaces) {
    let score = 0

    // Kiểm tra tên space
    if (searchText.includes(space.name.toLowerCase())) {
      score += 10
    }
    if (searchText.includes(space.code.toLowerCase())) {
      score += 8
    }

    // Kiểm tra tên/code/subject của departments trong space
    for (const dept of space.departments) {
      if (searchText.includes(dept.name.toLowerCase())) {
        score += 8
      }
      if (searchText.includes(dept.code.toLowerCase())) {
        score += 6
      }
      if (dept.subject && searchText.includes(dept.subject.toLowerCase())) {
        score += 6
      }
    }

    if (score > 0) {
      matches.push({
        spaceId: space.id,
        spaceName: space.name,
        score,
      })
    }
  }

  // Sắp xếp theo điểm và trả về top 3
  return matches.sort((a, b) => b.score - a.score).slice(0, 3)
}

/**
 * Tìm các departments phù hợp với văn bản
 */
async function findMatchingDepartmentsForDocument(
  title: string,
  sender: string | null,
  recipient: string | null,
  createdById: string | null
): Promise<Array<{ departmentId: string; departmentName: string; score: number }>> {
  const allDepartments = await prisma.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      subject: true,
    },
  })

  const searchText = (title + ' ' + (sender || '') + ' ' + (recipient || '')).toLowerCase()
  const matches: Array<{ departmentId: string; departmentName: string; score: number }> = []

  for (const dept of allDepartments) {
    let score = 0

    // Kiểm tra tên/code/subject trong title
    if (searchText.includes(dept.name.toLowerCase())) {
      score += 10
    }
    if (searchText.includes(dept.code.toLowerCase())) {
      score += 8
    }
    if (dept.subject && searchText.includes(dept.subject.toLowerCase())) {
      score += 6
    }

    // Ưu tiên department của người tạo
    if (createdById) {
      const userDept = await prisma.departmentMember.findFirst({
        where: {
          departmentId: dept.id,
          userId: createdById,
          isActive: true,
        },
      })
      if (userDept) {
        score += 5
      }
    }

    if (score > 0) {
      matches.push({
        departmentId: dept.id,
        departmentName: dept.name,
        score,
      })
    }
  }

  // Sắp xếp theo điểm và trả về top 5
  return matches.sort((a, b) => b.score - a.score).slice(0, 5)
}

async function syncAllDocumentsSmart() {
  try {
    console.log('🔄 Bắt đầu đồng bộ thông minh tất cả văn bản...\n')

    // Lấy Space "Văn bản"
    const vanBanSpace = await prisma.space.findFirst({
      where: { code: 'VAN_BAN_SPACE' },
    })

    // 1. Đồng bộ văn bản đến
    const incomingDocs = await prisma.incomingDocument.findMany({
      select: {
        id: true,
        title: true,
        sender: true,
        createdById: true,
      },
    })

    console.log(`📥 Tìm thấy ${incomingDocs.length} văn bản đến`)

    let incomingSynced = 0
    let incomingErrors = 0

    for (const doc of incomingDocs) {
      try {
        const spaceIds: string[] = []
        const departmentIds: string[] = []

        // Tìm spaces phù hợp
        const matchingSpaces = await findMatchingSpacesForDocument(
          doc.title || '',
          doc.sender,
          null
        )

        matchingSpaces.forEach((m) => {
          if (!spaceIds.includes(m.spaceId)) {
            spaceIds.push(m.spaceId)
          }
        })

        // Luôn thêm Space "Văn bản"
        if (vanBanSpace && !spaceIds.includes(vanBanSpace.id)) {
          spaceIds.push(vanBanSpace.id)
        }

        // Tìm departments phù hợp
        const matchingDepts = await findMatchingDepartmentsForDocument(
          doc.title || '',
          doc.sender,
          null,
          doc.createdById
        )

        matchingDepts.forEach((m) => {
          if (!departmentIds.includes(m.departmentId)) {
            departmentIds.push(m.departmentId)
          }
        })

        // Thêm departments của người tạo
        if (doc.createdById) {
          const userDepts = await prisma.departmentMember.findMany({
            where: {
              userId: doc.createdById,
              isActive: true,
            },
            select: { departmentId: true },
          })

          userDepts.forEach((ud) => {
            if (!departmentIds.includes(ud.departmentId)) {
              departmentIds.push(ud.departmentId)
            }
          })
        }

        // Đồng bộ
        if (spaceIds.length > 0 || departmentIds.length > 0) {
          await syncDocumentToSpacesAndDepartments({
            documentId: doc.id,
            documentType: 'INCOMING',
            spaceIds,
            departmentIds,
          })

          incomingSynced++
          if (matchingSpaces.length > 0 || matchingDepts.length > 0) {
            console.log(`  ✅ ${(doc.title || '').substring(0, 50)}...`)
            if (matchingSpaces.length > 0) {
              console.log(`     📍 Spaces: ${matchingSpaces.map((m) => m.spaceName).join(', ')}`)
            }
            if (matchingDepts.length > 0) {
              console.log(`     🏢 Tổ: ${matchingDepts.map((m) => m.departmentName).join(', ')}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Lỗi: ${error.message}`)
        incomingErrors++
      }
    }

    // 2. Đồng bộ văn bản đi
    const outgoingDocs = await prisma.outgoingDocument.findMany({
      select: {
        id: true,
        title: true,
        recipient: true,
        targetSpaces: true,
        createdById: true,
      },
    })

    console.log(`\n📤 Tìm thấy ${outgoingDocs.length} văn bản đi`)

    let outgoingSynced = 0
    let outgoingErrors = 0

    for (const doc of outgoingDocs) {
      try {
        const spaceIds: string[] = []
        const departmentIds: string[] = []

        // Parse targetSpaces
        if (doc.targetSpaces) {
          try {
            const parsed = typeof doc.targetSpaces === 'string' ? JSON.parse(doc.targetSpaces) : doc.targetSpaces
            if (Array.isArray(parsed)) {
              spaceIds.push(...parsed)
            }
          } catch (e) {
            // Ignore
          }
        }

        // Tìm spaces phù hợp
        const matchingSpaces = await findMatchingSpacesForDocument(
          doc.title || '',
          null,
          doc.recipient
        )

        matchingSpaces.forEach((m) => {
          if (!spaceIds.includes(m.spaceId)) {
            spaceIds.push(m.spaceId)
          }
        })

        // Luôn thêm Space "Văn bản"
        if (vanBanSpace && !spaceIds.includes(vanBanSpace.id)) {
          spaceIds.push(vanBanSpace.id)
        }

        // Tìm departments phù hợp
        const matchingDepts = await findMatchingDepartmentsForDocument(
          doc.title || '',
          null,
          doc.recipient,
          doc.createdById
        )

        matchingDepts.forEach((m) => {
          if (!departmentIds.includes(m.departmentId)) {
            departmentIds.push(m.departmentId)
          }
        })

        // Thêm departments của người tạo
        if (doc.createdById) {
          const userDepts = await prisma.departmentMember.findMany({
            where: {
              userId: doc.createdById,
              isActive: true,
            },
            select: { departmentId: true },
          })

          userDepts.forEach((ud) => {
            if (!departmentIds.includes(ud.departmentId)) {
              departmentIds.push(ud.departmentId)
            }
          })
        }

        // Đồng bộ
        if (spaceIds.length > 0 || departmentIds.length > 0) {
          await syncDocumentToSpacesAndDepartments({
            documentId: doc.id,
            documentType: 'OUTGOING',
            spaceIds,
            departmentIds,
          })

          outgoingSynced++
          if (matchingSpaces.length > 0 || matchingDepts.length > 0) {
            console.log(`  ✅ ${(doc.title || '').substring(0, 50)}...`)
            if (matchingSpaces.length > 0) {
              console.log(`     📍 Spaces: ${matchingSpaces.map((m) => m.spaceName).join(', ')}`)
            }
            if (matchingDepts.length > 0) {
              console.log(`     🏢 Tổ: ${matchingDepts.map((m) => m.departmentName).join(', ')}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Lỗi: ${error.message}`)
        outgoingErrors++
      }
    }

    // Tóm tắt
    console.log('\n' + '='.repeat(60))
    console.log('📊 TÓM TẮT ĐỒNG BỘ:')
    console.log('='.repeat(60))
    console.log(`📥 Văn bản đến: ${incomingSynced} đã đồng bộ, ${incomingErrors} lỗi`)
    console.log(`📤 Văn bản đi: ${outgoingSynced} đã đồng bộ, ${outgoingErrors} lỗi`)
    console.log(`📋 Tổng cộng: ${incomingSynced + outgoingSynced} văn bản đã được đồng bộ`)
    console.log('='.repeat(60))
    console.log('\n✅ Hoàn tất đồng bộ!')
  } catch (error) {
    console.error('❌ Lỗi:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

syncAllDocumentsSmart()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

