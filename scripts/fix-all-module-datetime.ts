import { prisma } from '../lib/prisma'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

async function fixAllModuleDateTime() {
  try {
    console.log('Đang kiểm tra và sửa tất cả dữ liệu DateTime trong bảng modules...\n')

    // Use raw SQL to get all modules
    const modules = await prisma.$queryRaw<Array<{ id: string; name: string; updatedAt: any; createdAt: any }>>`
      SELECT id, name, updatedAt, createdAt FROM modules
    `

    let fixedUpdatedAt = 0
    let fixedCreatedAt = 0
    let errors = 0

    for (const module of modules) {
      try {
        // Fix updatedAt
        let updatedAtValue: Date | null = null
        if (typeof module.updatedAt === 'number') {
          updatedAtValue = new Date(module.updatedAt)
        } else if (typeof module.updatedAt === 'string') {
          // Check if it's a timestamp (pure numbers, length > 10)
          if (/^\d+$/.test(module.updatedAt) && module.updatedAt.length > 10) {
            updatedAtValue = new Date(parseInt(module.updatedAt))
          } else {
            // Try to parse as ISO string
            updatedAtValue = new Date(module.updatedAt)
          }
        } else if (module.updatedAt instanceof Date) {
          updatedAtValue = module.updatedAt
        }

        if (updatedAtValue && !isNaN(updatedAtValue.getTime())) {
          const isoString = updatedAtValue.toISOString()
          await prisma.$executeRaw`
            UPDATE modules 
            SET updatedAt = ${isoString} 
            WHERE id = ${module.id}
          `
          if (typeof module.updatedAt === 'number' || (typeof module.updatedAt === 'string' && /^\d+$/.test(module.updatedAt))) {
            fixedUpdatedAt++
            console.log(`✓ Fixed updatedAt for module: ${module.name} (${module.id})`)
          }
        }

        // Fix createdAt if needed
        let createdAtValue: Date | null = null
        if (typeof module.createdAt === 'number') {
          createdAtValue = new Date(module.createdAt)
        } else if (typeof module.createdAt === 'string') {
          if (/^\d+$/.test(module.createdAt) && module.createdAt.length > 10) {
            createdAtValue = new Date(parseInt(module.createdAt))
          } else {
            createdAtValue = new Date(module.createdAt)
          }
        } else if (module.createdAt instanceof Date) {
          createdAtValue = module.createdAt
        }

        if (createdAtValue && !isNaN(createdAtValue.getTime())) {
          const isoString = createdAtValue.toISOString()
          await prisma.$executeRaw`
            UPDATE modules 
            SET createdAt = ${isoString} 
            WHERE id = ${module.id}
          `
          if (typeof module.createdAt === 'number' || (typeof module.createdAt === 'string' && /^\d+$/.test(module.createdAt))) {
            fixedCreatedAt++
            console.log(`✓ Fixed createdAt for module: ${module.name} (${module.id})`)
          }
        }
      } catch (error: any) {
        console.error(`✗ Error fixing module ${module.id}:`, error.message)
        errors++
      }
    }

    console.log(`\n✅ Hoàn tất!`)
    console.log(`   - Đã sửa updatedAt: ${fixedUpdatedAt} modules`)
    console.log(`   - Đã sửa createdAt: ${fixedCreatedAt} modules`)
    console.log(`   - Lỗi: ${errors}`)
    console.log(`\n⚠️  Vui lòng restart server để áp dụng thay đổi!`)
  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllModuleDateTime()

