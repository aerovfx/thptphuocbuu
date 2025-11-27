import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

const prisma = new PrismaClient()

async function deleteAllSpacesSQL() {
  try {
    console.log('🚀 Bắt đầu xóa tất cả dữ liệu của module Space bằng SQL...\n')
    
    // Get database path
    const dbPath = join(process.cwd(), 'prisma', 'dev.db')
    
    // First, check what's in the database
    console.log('📊 Kiểm tra database...')
    const checkResult = execSync(
      `sqlite3 "${dbPath}" "SELECT COUNT(*) FROM spaces;"`,
      { encoding: 'utf-8' }
    ).trim()
    console.log(`Tìm thấy ${checkResult} space(s) trong database\n`)
    
    if (checkResult === '0') {
      console.log('✅ Không có space nào để xóa.')
      return
    }

    // Get space IDs
    const spaceIds = execSync(
      `sqlite3 "${dbPath}" "SELECT id FROM spaces;"`,
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean)
    
    console.log(`📋 Danh sách Space IDs: ${spaceIds.length}`)
    spaceIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`)
    })

    console.log('\n🗑️  Đang xóa dữ liệu liên quan...')

    // Delete in order (respecting foreign keys)
    const deleteQueries = [
      // 1. Delete Space Task Comments
      `DELETE FROM space_task_comments WHERE taskId IN (SELECT id FROM space_tasks WHERE spaceId IN (${spaceIds.map(() => '?').join(',')}));`,
      
      // 2. Delete Space Tasks
      `DELETE FROM space_tasks WHERE spaceId IN (${spaceIds.map(() => '?').join(',')});`,
      
      // 3. Delete Space Progress Logs
      `DELETE FROM space_progress_logs WHERE spaceId IN (${spaceIds.map(() => '?').join(',')});`,
      
      // 4. Delete Space Documents
      `DELETE FROM space_documents WHERE spaceId IN (${spaceIds.map(() => '?').join(',')});`,
      
      // 5. Delete Space Members
      `DELETE FROM space_members WHERE spaceId IN (${spaceIds.map(() => '?').join(',')});`,
      
      // 6. Update Departments (set spaceId to NULL)
      `UPDATE departments SET spaceId = NULL WHERE spaceId IN (${spaceIds.map(() => '?').join(',')});`,
      
      // 7. Delete Spaces
      `DELETE FROM spaces WHERE id IN (${spaceIds.map(() => '?').join(',')});`,
    ]

    // Use Prisma to execute raw SQL
    for (let i = 0; i < deleteQueries.length; i++) {
      const query = deleteQueries[i]
      try {
        const result = await prisma.$executeRawUnsafe(query, ...spaceIds)
        console.log(`  ✅ Query ${i + 1} executed: ${result} rows affected`)
      } catch (error: any) {
        // If error, try with Prisma deleteMany
        console.log(`  ⚠️  Query ${i + 1} failed, trying Prisma method...`)
        if (i === 0) {
          // Space Task Comments
          await prisma.$executeRawUnsafe(
            `DELETE FROM space_task_comments WHERE taskId IN (SELECT id FROM space_tasks WHERE spaceId IN (${spaceIds.map(() => '?').join(',')}))`,
            ...spaceIds
          )
        } else if (i === 1) {
          await prisma.spaceTask.deleteMany({ where: { spaceId: { in: spaceIds } } })
        } else if (i === 2) {
          await prisma.spaceProgressLog.deleteMany({ where: { spaceId: { in: spaceIds } } })
        } else if (i === 3) {
          await prisma.spaceDocument.deleteMany({ where: { spaceId: { in: spaceIds } } })
        } else if (i === 4) {
          await prisma.spaceMember.deleteMany({ where: { spaceId: { in: spaceIds } } })
        } else if (i === 5) {
          await prisma.department.updateMany({
            where: { spaceId: { in: spaceIds } },
            data: { spaceId: null }
          })
        } else if (i === 6) {
          await prisma.space.deleteMany({ where: { id: { in: spaceIds } } })
        }
        console.log(`  ✅ Completed using Prisma method`)
      }
    }

    // Verify deletion
    const finalCount = execSync(
      `sqlite3 "${dbPath}" "SELECT COUNT(*) FROM spaces;"`,
      { encoding: 'utf-8' }
    ).trim()
    
    console.log(`\n📊 Kiểm tra lại: Còn ${finalCount} space(s) trong database`)
    
    if (finalCount === '0') {
      console.log(`\n✅ Hoàn thành! Đã xóa thành công tất cả dữ liệu của module Space!`)
    } else {
      console.log(`\n⚠️  Vẫn còn ${finalCount} space(s). Thử xóa trực tiếp bằng SQL...`)
      
      // Force delete using raw SQL
      await prisma.$executeRawUnsafe(`DELETE FROM spaces;`)
      console.log(`  ✅ Đã force delete tất cả spaces`)
    }
  } catch (error) {
    console.error('\n❌ Lỗi khi xóa spaces:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllSpacesSQL()
  .then(() => {
    console.log('\nHoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Lỗi:', error)
    process.exit(1)
  })

