/**
 * Script để đồng bộ tự động tất cả văn bản vào tất cả Spaces và Tổ chuyên môn
 * Phân loại và ưu tiên văn bản theo tag (tên space/tổ trong title, sender, recipient)
 * Chạy: npx tsx app/scripts/sync-all-documents-to-all-spaces.ts
 */

import { prisma } from '@/lib/prisma'

interface MatchResult {
  spaceId: string
  spaceName: string
  score: number
  reason: string
}

/**
 * Tính điểm phù hợp của văn bản với space/department
 */
function calculateRelevanceScore(
  text: string,
  spaceName: string,
  spaceCode: string,
  deptNames: string[],
  deptCodes: string[],
  deptSubjects: string[]
): { score: number; reasons: string[] } {
  const lowerText = text.toLowerCase()
  const lowerSpaceName = spaceName.toLowerCase()
  const lowerSpaceCode = spaceCode.toLowerCase()
  let score = 0
  const reasons: string[] = []

  // Kiểm tra tên space
  if (lowerText.includes(lowerSpaceName)) {
    score += 10
    reasons.push(`Chứa tên space "${spaceName}"`)
  }
  if (lowerText.includes(lowerSpaceCode)) {
    score += 8
    reasons.push(`Chứa mã space "${spaceCode}"`)
  }

  // Kiểm tra tên department
  deptNames.forEach((deptName) => {
    const lowerDeptName = deptName.toLowerCase()
    if (lowerText.includes(lowerDeptName)) {
      score += 8
      reasons.push(`Chứa tên tổ "${deptName}"`)
    }
  })

  deptCodes.forEach((deptCode) => {
    const lowerDeptCode = deptCode.toLowerCase()
    if (lowerText.includes(lowerDeptCode)) {
      score += 6
      reasons.push(`Chứa mã tổ "${deptCode}"`)
    }
  })

  // Kiểm tra subject của tổ
  deptSubjects.forEach((subject) => {
    if (subject) {
      const lowerSubject = subject.toLowerCase()
      if (lowerText.includes(lowerSubject)) {
        score += 6
        reasons.push(`Chứa môn học "${subject}"`)
      }
    }
  })

  return { score, reasons }
}

/**
 * Tìm các spaces phù hợp với văn bản
 */
async function findMatchingSpaces(
  title: string,
  sender: string | null,
  recipient: string | null
): Promise<MatchResult[]> {
  const allSpaces = await prisma.space.findMany({
    where: {
      isActive: true,
    },
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

  const matches: MatchResult[] = []

  for (const space of allSpaces) {
    const deptNames = space.departments.map((d) => d.name)
    const deptCodes = space.departments.map((d) => d.code)
    const deptSubjects = space.departments
      .map((d) => d.subject)
      .filter((s): s is string => s !== null)

    // Tính điểm cho title
    const titleMatch = calculateRelevanceScore(
      title,
      space.name,
      space.code,
      deptNames,
      deptCodes,
      deptSubjects
    )

    // Tính điểm cho sender (nếu có)
    let senderMatch = { score: 0, reasons: [] as string[] }
    if (sender) {
      senderMatch = calculateRelevanceScore(
        sender,
        space.name,
        space.code,
        deptNames,
        deptCodes,
        deptSubjects
      )
    }

    // Tính điểm cho recipient (nếu có)
    let recipientMatch = { score: 0, reasons: [] as string[] }
    if (recipient) {
      recipientMatch = calculateRelevanceScore(
        recipient,
        space.name,
        space.code,
        deptNames,
        deptCodes,
        deptSubjects
      )
    }

    const totalScore = titleMatch.score + senderMatch.score * 0.5 + recipientMatch.score * 0.5
    const allReasons = [
      ...titleMatch.reasons,
      ...senderMatch.reasons.map((r) => `[Người gửi] ${r}`),
      ...recipientMatch.reasons.map((r) => `[Người nhận] ${r}`),
    ]

    if (totalScore > 0) {
      matches.push({
        spaceId: space.id,
        spaceName: space.name,
        score: totalScore,
        reason: allReasons.join(', '),
      })
    }
  }

  // Sắp xếp theo điểm (cao nhất trước)
  matches.sort((a, b) => b.score - a.score)

  return matches
}

/**
 * Tìm các departments phù hợp với văn bản
 */
async function findMatchingDepartments(
  title: string,
  sender: string | null,
  recipient: string | null,
  createdById: string | null
): Promise<Array<{ departmentId: string; departmentName: string; score: number; reason: string }>> {
  const allDepartments = await prisma.department.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      subject: true,
    },
  })

  const matches: Array<{ departmentId: string; departmentName: string; score: number; reason: string }> = []

  for (const dept of allDepartments) {
    const lowerTitle = title.toLowerCase()
    const lowerDeptName = dept.name.toLowerCase()
    const lowerDeptCode = dept.code.toLowerCase()
    const lowerDeptSubject = dept.subject?.toLowerCase() || ''
    let score = 0
    const reasons: string[] = []

    // Kiểm tra tên department trong title
    if (lowerTitle.includes(lowerDeptName)) {
      score += 10
      reasons.push(`Chứa tên tổ "${dept.name}"`)
    }
    if (lowerTitle.includes(lowerDeptCode)) {
      score += 8
      reasons.push(`Chứa mã tổ "${dept.code}"`)
    }
    if (lowerDeptSubject && lowerTitle.includes(lowerDeptSubject)) {
      score += 6
      reasons.push(`Chứa môn học "${dept.subject}"`)
    }

    // Kiểm tra trong sender/recipient
    if (sender) {
      const lowerSender = sender.toLowerCase()
      if (lowerSender.includes(lowerDeptName) || lowerSender.includes(lowerDeptCode)) {
        score += 4
        reasons.push(`[Người gửi] Chứa tên/mã tổ`)
      }
    }

    if (recipient) {
      const lowerRecipient = recipient.toLowerCase()
      if (lowerRecipient.includes(lowerDeptName) || lowerRecipient.includes(lowerDeptCode)) {
        score += 4
        reasons.push(`[Người nhận] Chứa tên/mã tổ`)
      }
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
        reasons.push(`Người tạo là thành viên của tổ`)
      }
    }

    if (score > 0) {
      matches.push({
        departmentId: dept.id,
        departmentName: dept.name,
        score,
        reason: reasons.join(', '),
      })
    }
  }

  // Sắp xếp theo điểm (cao nhất trước)
  matches.sort((a, b) => b.score - a.score)

  return matches
}

async function syncAllDocumentsToAllSpaces() {
  try {
    console.log('🔄 Bắt đầu đồng bộ tự động tất cả văn bản vào Spaces và Tổ chuyên môn...\n')

    // 1. Lấy tất cả văn bản đến
    const incomingDocs = await prisma.incomingDocument.findMany({
      select: {
        id: true,
        title: true,
        sender: true,
        createdById: true,
      },
    })

    console.log(`📥 Tìm thấy ${incomingDocs.length} văn bản đến\n`)

    let incomingSynced = 0
    let incomingErrors = 0

    for (const doc of incomingDocs) {
      try {
        // Tìm spaces phù hợp
        const matchingSpaces = await findMatchingSpaces(
          doc.title || '',
          doc.sender,
          null
        )

        // Tìm departments phù hợp
        const matchingDepartments = await findMatchingDepartments(
          doc.title || '',
          doc.sender,
          null,
          doc.createdById
        )

        // Lấy top 3 spaces có điểm cao nhất
        const topSpaces = matchingSpaces.slice(0, 3).map((m) => m.spaceId)

        // Lấy top 5 departments có điểm cao nhất
        const topDepartments = matchingDepartments.slice(0, 5).map((m) => m.departmentId)

        // Luôn thêm vào Space "Văn bản"
        const vanBanSpace = await prisma.space.findFirst({
          where: { code: 'VAN_BAN_SPACE' },
        })
        if (vanBanSpace && !topSpaces.includes(vanBanSpace.id)) {
          topSpaces.push(vanBanSpace.id)
        }

        // Đồng bộ với spaces và departments
        if (topSpaces.length > 0 || topDepartments.length > 0) {
          // Đồng bộ với spaces
          for (const spaceId of topSpaces) {
            await prisma.spaceDocument.upsert({
              where: {
                spaceId_documentId_documentType: {
                  spaceId,
                  documentId: doc.id,
                  documentType: 'INCOMING',
                },
              },
              update: {
                assignedAt: new Date(),
              },
              create: {
                spaceId,
                documentId: doc.id,
                documentType: 'INCOMING',
              },
            })
          }

          // Đồng bộ với departments
          for (const deptId of topDepartments) {
            await prisma.departmentDocument.upsert({
              where: {
                departmentId_documentId_documentType: {
                  departmentId: deptId,
                  documentId: doc.id,
                  documentType: 'INCOMING',
                },
              },
              update: {
                assignedAt: new Date(),
              },
              create: {
                departmentId: deptId,
                documentId: doc.id,
                documentType: 'INCOMING',
              },
            })
          }

          incomingSynced++
          if (matchingSpaces.length > 0 || matchingDepartments.length > 0) {
            console.log(`  ✅ ${doc.title?.substring(0, 50)}...`)
            if (matchingSpaces.length > 0) {
              console.log(`     📍 Spaces: ${matchingSpaces.slice(0, 3).map((m) => m.spaceName).join(', ')}`)
            }
            if (matchingDepartments.length > 0) {
              console.log(`     🏢 Tổ: ${matchingDepartments.slice(0, 3).map((m) => m.departmentName).join(', ')}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Lỗi đồng bộ văn bản đến ${doc.id}:`, error.message)
        incomingErrors++
      }
    }

    // 2. Lấy tất cả văn bản đi
    const outgoingDocs = await prisma.outgoingDocument.findMany({
      select: {
        id: true,
        title: true,
        recipient: true,
        targetSpaces: true,
        createdById: true,
      },
    })

    console.log(`\n📤 Tìm thấy ${outgoingDocs.length} văn bản đi\n`)

    let outgoingSynced = 0
    let outgoingErrors = 0

    for (const doc of outgoingDocs) {
      try {
        // Parse targetSpaces nếu có
        let targetSpaceIds: string[] = []
        if (doc.targetSpaces) {
          try {
            const parsed = typeof doc.targetSpaces === 'string' ? JSON.parse(doc.targetSpaces) : doc.targetSpaces
            targetSpaceIds = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            // Ignore parse error
          }
        }

        // Tìm spaces phù hợp
        const matchingSpaces = await findMatchingSpaces(
          doc.title || '',
          null,
          doc.recipient
        )

        // Thêm targetSpaces vào danh sách (ưu tiên cao)
        targetSpaceIds.forEach((spaceId) => {
          if (!matchingSpaces.find((m) => m.spaceId === spaceId)) {
            matchingSpaces.unshift({
              spaceId,
              spaceName: 'Target Space',
              score: 20, // Điểm cao cho targetSpaces
              reason: 'Được chỉ định trong targetSpaces',
            })
          } else {
            // Tăng điểm nếu đã có trong matching
            const existing = matchingSpaces.find((m) => m.spaceId === spaceId)
            if (existing) {
              existing.score += 15
            }
          }
        })

        // Tìm departments phù hợp
        const matchingDepartments = await findMatchingDepartments(
          doc.title || '',
          null,
          doc.recipient,
          doc.createdById
        )

        // Lấy top 3 spaces có điểm cao nhất
        const topSpaces = matchingSpaces
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((m) => m.spaceId)

        // Lấy top 5 departments có điểm cao nhất
        const topDepartments = matchingDepartments.slice(0, 5).map((m) => m.departmentId)

        // Luôn thêm vào Space "Văn bản"
        const vanBanSpace = await prisma.space.findFirst({
          where: { code: 'VAN_BAN_SPACE' },
        })
        if (vanBanSpace && !topSpaces.includes(vanBanSpace.id)) {
          topSpaces.push(vanBanSpace.id)
        }

        // Đồng bộ với spaces và departments
        if (topSpaces.length > 0 || topDepartments.length > 0) {
          // Đồng bộ với spaces
          for (const spaceId of topSpaces) {
            await prisma.spaceDocument.upsert({
              where: {
                spaceId_documentId_documentType: {
                  spaceId,
                  documentId: doc.id,
                  documentType: 'OUTGOING',
                },
              },
              update: {
                assignedAt: new Date(),
              },
              create: {
                spaceId,
                documentId: doc.id,
                documentType: 'OUTGOING',
              },
            })
          }

          // Đồng bộ với departments
          for (const deptId of topDepartments) {
            await prisma.departmentDocument.upsert({
              where: {
                departmentId_documentId_documentType: {
                  departmentId: deptId,
                  documentId: doc.id,
                  documentType: 'OUTGOING',
                },
              },
              update: {
                assignedAt: new Date(),
              },
              create: {
                departmentId: deptId,
                documentId: doc.id,
                documentType: 'OUTGOING',
              },
            })
          }

          outgoingSynced++
          if (matchingSpaces.length > 0 || matchingDepartments.length > 0) {
            console.log(`  ✅ ${doc.title?.substring(0, 50)}...`)
            if (matchingSpaces.length > 0) {
              console.log(`     📍 Spaces: ${matchingSpaces.slice(0, 3).map((m) => m.spaceName).join(', ')}`)
            }
            if (matchingDepartments.length > 0) {
              console.log(`     🏢 Tổ: ${matchingDepartments.slice(0, 3).map((m) => m.departmentName).join(', ')}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Lỗi đồng bộ văn bản đi ${doc.id}:`, error.message)
        outgoingErrors++
      }
    }

    // Tóm tắt
    console.log('\n' + '='.repeat(60))
    console.log('📊 TÓM TẮT ĐỒNG BỘ:')
    console.log('='.repeat(60))
    console.log(`📥 Văn bản đến: ${incomingSynced} đã đồng bộ, ${incomingErrors} lỗi`)
    console.log(`📤 Văn bản đi: ${outgoingSynced} đã đồng bộ, ${outgoingErrors} lỗi`)
    console.log(`📋 Tổng cộng: ${incomingSynced + outgoingSynced} văn bản đã được đồng bộ tự động`)
    console.log('='.repeat(60))
    console.log('\n✅ Hoàn tất đồng bộ!')
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy script
syncAllDocumentsToAllSpaces()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

