import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllSpaces() {
  try {
    console.log('🚀 Bắt đầu xóa tất cả dữ liệu của module Space...\n')
    
    // Get all spaces first to count
    const allSpaces = await prisma.space.findMany({
      select: { id: true, name: true, code: true },
    })

    console.log(`📊 Tìm thấy ${allSpaces.length} space(s):`)
    allSpaces.forEach((space, index) => {
      console.log(`  ${index + 1}. ${space.name} (${space.code}) - ${space.id}`)
    })

    if (allSpaces.length === 0) {
      console.log('\n✅ Không có space nào để xóa.')
      return
    }

    // Count related data
    const spaceIds = allSpaces.map(s => s.id)
    
    const [
      spaceMembersCount,
      spaceDocumentsCount,
      spaceProgressLogsCount,
      spaceTasksCount,
      spaceTaskCommentsCount,
      departmentsCount
    ] = await Promise.all([
      prisma.spaceMember.count({ where: { spaceId: { in: spaceIds } } }),
      prisma.spaceDocument.count({ where: { spaceId: { in: spaceIds } } }),
      prisma.spaceProgressLog.count({ where: { spaceId: { in: spaceIds } } }),
      prisma.spaceTask.count({ where: { spaceId: { in: spaceIds } } }),
      prisma.spaceTaskComment.count({ 
        where: { task: { spaceId: { in: spaceIds } } } 
      }),
      prisma.department.count({ where: { spaceId: { in: spaceIds } } })
    ])

    console.log('\n📈 Thống kê dữ liệu liên quan:')
    console.log(`  - Space Members: ${spaceMembersCount}`)
    console.log(`  - Space Documents: ${spaceDocumentsCount}`)
    console.log(`  - Space Progress Logs: ${spaceProgressLogsCount}`)
    console.log(`  - Space Tasks: ${spaceTasksCount}`)
    console.log(`  - Space Task Comments: ${spaceTaskCommentsCount}`)
    console.log(`  - Departments (có spaceId): ${departmentsCount}`)

    console.log('\n🗑️  Đang xóa dữ liệu...')

    // 1. Xóa Space Task Comments (cascade từ SpaceTask, nhưng xóa trước để chắc chắn)
    if (spaceTaskCommentsCount > 0) {
      await prisma.spaceTaskComment.deleteMany({
        where: { task: { spaceId: { in: spaceIds } } }
      })
      console.log(`  ✅ Đã xóa ${spaceTaskCommentsCount} Space Task Comments`)
    }

    // 2. Xóa Space Tasks
    if (spaceTasksCount > 0) {
      await prisma.spaceTask.deleteMany({
        where: { spaceId: { in: spaceIds } }
      })
      console.log(`  ✅ Đã xóa ${spaceTasksCount} Space Tasks`)
    }

    // 3. Xóa Space Progress Logs
    if (spaceProgressLogsCount > 0) {
      await prisma.spaceProgressLog.deleteMany({
        where: { spaceId: { in: spaceIds } }
      })
      console.log(`  ✅ Đã xóa ${spaceProgressLogsCount} Space Progress Logs`)
    }

    // 4. Xóa Space Documents
    if (spaceDocumentsCount > 0) {
      await prisma.spaceDocument.deleteMany({
        where: { spaceId: { in: spaceIds } }
      })
      console.log(`  ✅ Đã xóa ${spaceDocumentsCount} Space Documents`)
    }

    // 5. Xóa Space Members
    if (spaceMembersCount > 0) {
      await prisma.spaceMember.deleteMany({
        where: { spaceId: { in: spaceIds } }
      })
      console.log(`  ✅ Đã xóa ${spaceMembersCount} Space Members`)
    }

    // 6. Cập nhật Departments: set spaceId = null (không xóa departments, chỉ bỏ liên kết)
    if (departmentsCount > 0) {
      await prisma.department.updateMany({
        where: { spaceId: { in: spaceIds } },
        data: { spaceId: null }
      })
      console.log(`  ✅ Đã cập nhật ${departmentsCount} Departments (bỏ liên kết với Space)`)
    }

    // 7. Cuối cùng xóa tất cả Spaces
    await prisma.space.deleteMany({})
    console.log(`  ✅ Đã xóa ${allSpaces.length} Spaces`)

    console.log(`\n✅ Hoàn thành! Đã xóa thành công tất cả dữ liệu của module Space!`)
  } catch (error) {
    console.error('\n❌ Lỗi khi xóa spaces:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllSpaces()
  .then(() => {
    console.log('\nHoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Lỗi:', error)
    process.exit(1)
  })

