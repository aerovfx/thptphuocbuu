/**
 * Script để đồng bộ tất cả văn bản hiện có từ DMS vào Spaces và Departments
 * Chạy: npx tsx app/scripts/sync-all-documents.ts
 */

import { prisma } from '@/lib/prisma'
import { syncDocumentToSpacesAndDepartments, autoSyncDocument } from '@/lib/document-sync'

async function syncAllDocuments() {
  try {
    console.log('🔄 Bắt đầu đồng bộ văn bản...\n')

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
            documentId: doc.id,
            documentType: 'INCOMING',
          },
        })

        if (!existingSync && doc.createdById) {
          await autoSyncDocument(doc.id, 'INCOMING', doc.createdById, null)
          incomingSynced++
        }
      } catch (error) {
        console.error(`❌ Lỗi đồng bộ văn bản đến ${doc.id}:`, error)
        incomingErrors++
      }
    }

    // 2. Lấy tất cả văn bản đi
    const outgoingDocs = await prisma.outgoingDocument.findMany({
      select: {
        id: true,
        createdById: true,
        targetSpaces: true,
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
            documentId: doc.id,
            documentType: 'OUTGOING',
          },
        })

        if (!existingSync && doc.createdById) {
          await autoSyncDocument(doc.id, 'OUTGOING', doc.createdById, doc.targetSpaces || null)
          outgoingSynced++
        }
      } catch (error) {
        console.error(`❌ Lỗi đồng bộ văn bản đi ${doc.id}:`, error)
        outgoingErrors++
      }
    }

    // 3. Đồng bộ với Space "Văn bản" cho tất cả văn bản
    const vanBanSpace = await prisma.space.findFirst({
      where: {
        code: 'VAN_BAN_SPACE',
      },
    })

    if (vanBanSpace) {
      console.log(`\n📋 Đồng bộ với Space "Văn bản"...`)

      let spaceSynced = 0
      let spaceErrors = 0

      // Đồng bộ văn bản đến
      for (const doc of incomingDocs) {
        try {
          await prisma.spaceDocument.upsert({
            where: {
              spaceId_documentId_documentType: {
                spaceId: vanBanSpace.id,
                documentId: doc.id,
                documentType: 'INCOMING',
              },
            },
            update: {
              assignedAt: new Date(),
            },
            create: {
              spaceId: vanBanSpace.id,
              documentId: doc.id,
              documentType: 'INCOMING',
            },
          })
          spaceSynced++
        } catch (error) {
          spaceErrors++
        }
      }

      // Đồng bộ văn bản đi
      for (const doc of outgoingDocs) {
        try {
          await prisma.spaceDocument.upsert({
            where: {
              spaceId_documentId_documentType: {
                spaceId: vanBanSpace.id,
                documentId: doc.id,
                documentType: 'OUTGOING',
              },
            },
            update: {
              assignedAt: new Date(),
            },
            create: {
              spaceId: vanBanSpace.id,
              documentId: doc.id,
              documentType: 'OUTGOING',
            },
          })
          spaceSynced++
        } catch (error) {
          spaceErrors++
        }
      }

      console.log(`✅ Đã đồng bộ ${spaceSynced} văn bản vào Space "Văn bản"`)
      if (spaceErrors > 0) {
        console.log(`⚠️  ${spaceErrors} lỗi khi đồng bộ`)
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
    console.error('❌ Lỗi khi đồng bộ:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy script
syncAllDocuments()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

