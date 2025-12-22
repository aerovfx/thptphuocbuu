import { prisma } from '../lib/prisma'

async function fixModuleDateTime() {
  try {
    console.log('Đang kiểm tra và sửa dữ liệu updatedAt trong bảng modules...')

    // Get all modules
    const modules = await prisma.$queryRaw<Array<{ id: string; updatedAt: any }>>`
      SELECT id, updatedAt FROM modules
    `

    let fixed = 0
    let errors = 0

    for (const module of modules) {
      try {
        let updatedAtValue: Date | null = null

        // Check if updatedAt is a number (timestamp) or string
        if (typeof module.updatedAt === 'number') {
          // Convert milliseconds timestamp to Date
          updatedAtValue = new Date(module.updatedAt)
        } else if (typeof module.updatedAt === 'string') {
          // Try to parse as number first
          const numValue = Number(module.updatedAt)
          if (!isNaN(numValue) && numValue > 1000000000000) {
            // It's a timestamp in milliseconds
            updatedAtValue = new Date(numValue)
          } else {
            // Try to parse as ISO string
            updatedAtValue = new Date(module.updatedAt)
          }
        } else if (module.updatedAt instanceof Date) {
          updatedAtValue = module.updatedAt
        }

        if (updatedAtValue && !isNaN(updatedAtValue.getTime())) {
          // Update with proper DateTime
          await prisma.$executeRaw`
            UPDATE modules 
            SET updatedAt = ${updatedAtValue.toISOString()} 
            WHERE id = ${module.id}
          `
          fixed++
          console.log(`✓ Fixed module ${module.id}`)
        } else {
          console.log(`⚠ Skipped module ${module.id} - invalid date`)
        }
      } catch (error: any) {
        console.error(`✗ Error fixing module ${module.id}:`, error.message)
        errors++
      }
    }

    console.log(`\nHoàn tất! Đã sửa ${fixed} modules, ${errors} lỗi`)
  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixModuleDateTime()
