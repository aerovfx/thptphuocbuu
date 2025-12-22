import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixModuleDateTimeISO() {
  try {
    console.log('Đang chuyển đổi createdAt/updatedAt sang ISO format...')

    // Lấy tất cả modules bằng raw query
    const modules = await prisma.$queryRaw<Array<{ id: string; createdAt: string; updatedAt: string }>>`
      SELECT id, createdAt, updatedAt FROM modules
    `

    console.log(`Tìm thấy ${modules.length} modules`)

    for (const module of modules) {
      let createdAtISO = module.createdAt
      let updatedAtISO = module.updatedAt

      // Chuyển đổi format SQLite datetime sang ISO
      // Format: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS.000Z"
      if (createdAtISO && !createdAtISO.includes('T') && !createdAtISO.includes('Z')) {
        createdAtISO = createdAtISO.replace(' ', 'T') + '.000Z'
      }
      if (updatedAtISO && !updatedAtISO.includes('T') && !updatedAtISO.includes('Z')) {
        updatedAtISO = updatedAtISO.replace(' ', 'T') + '.000Z'
      }

      // Cập nhật bằng raw SQL
      await prisma.$executeRaw`
        UPDATE modules 
        SET createdAt = ${createdAtISO}, updatedAt = ${updatedAtISO}
        WHERE id = ${module.id}
      `

      console.log(`Đã sửa module ${module.id}`)
    }

    console.log(`\nHoàn thành! Đã sửa ${modules.length} modules.`)
  } catch (error) {
    console.error('Lỗi khi sửa dữ liệu:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixModuleDateTimeISO()
  .then(() => {
    console.log('Script hoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script thất bại:', error)
    process.exit(1)
  })

