/**
 * Script để đồng bộ tất cả văn bản vào Space "Stem"
 * Chạy: npx tsx app/scripts/sync-documents-to-stem-space.ts
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { syncDocumentToSpacesAndDepartments } from '@/lib/document-sync'

async function syncDocumentsToStemSpace() {
  try {
    console.log('🔄 Bắt đầu đồng bộ văn bản vào Space "Stem"...\n')

    // Tìm Space "Stem" bằng ID đã biết
    const stemSpaceId = 'cmib4fgyu0000gqkd446vqqmn'
    let stemSpace = await prisma.space.findUnique({
      where: { id: stemSpaceId },
    })

    // Nếu không tìm thấy bằng ID, thử tìm bằng code
    if (!stemSpace) {
      stemSpace = await prisma.space.findFirst({
        where: { code: 'STEM01' },
      })
    }

    // Nếu vẫn không tìm thấy, thử tìm bằng name
    if (!stemSpace) {
      const allSpaces = await prisma.space.findMany()
      stemSpace = allSpaces.find((s) => s.name === 'Stem' || s.code === 'STEM01')
    }

    if (!stemSpace) {
      console.error('❌ Không tìm thấy Space "Stem"')
      return
    }

    console.log(`✅ Tìm thấy Space: ${stemSpace.name} (${stemSpace.code})`)
    console.log(`   ID: ${stemSpace.id}\n`)

    // 1. Lấy tất cả văn bản đến
    const incomingDocs = await prisma.incomingDocument.findMany({
      select: {
        id: true,
        createdById: true,
      },
    })

    console.log(`📥 Tìm thấy ${incomingDocs.length} văn bản đến`)

    let incomingSynced = 0
    let incomingErrors = 0

    for (const doc of incomingDocs) {
      try {
        // Kiểm tra xem đã được đồng bộ chưa
        const existingSync = await prisma.spaceDocument.findFirst({
          where: {
            spaceId: stemSpace.id,
            documentId: doc.id,
            documentType: 'INCOMING',
          },
        })

        if (!existingSync) {
          await syncDocumentToSpacesAndDepartments({
            documentId: doc.id,
            documentType: 'INCOMING',
            spaceIds: [stemSpace.id],
          })
          incomingSynced++
          console.log(`  ✅ Đã đồng bộ văn bản đến: ${doc.id}`)
        } else {
          console.log(`  ⏭️  Văn bản đến ${doc.id} đã được đồng bộ`)
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
        createdById: true,
      },
    })

    console.log(`\n📤 Tìm thấy ${outgoingDocs.length} văn bản đi`)

    let outgoingSynced = 0
    let outgoingErrors = 0

    for (const doc of outgoingDocs) {
      try {
        // Kiểm tra xem đã được đồng bộ chưa
        const existingSync = await prisma.spaceDocument.findFirst({
          where: {
            spaceId: stemSpace.id,
            documentId: doc.id,
            documentType: 'OUTGOING',
          },
        })

        if (!existingSync) {
          await syncDocumentToSpacesAndDepartments({
            documentId: doc.id,
            documentType: 'OUTGOING',
            spaceIds: [stemSpace.id],
          })
          outgoingSynced++
          console.log(`  ✅ Đã đồng bộ văn bản đi: ${doc.id}`)
        } else {
          console.log(`  ⏭️  Văn bản đi ${doc.id} đã được đồng bộ`)
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
    console.log(`📋 Tổng cộng: ${incomingSynced + outgoingSynced} văn bản đã được đồng bộ vào Space "Stem"`)
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
syncDocumentsToStemSpace()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

