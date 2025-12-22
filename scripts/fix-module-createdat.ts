import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma'

async function fixModuleCreatedAt() {
  try {
    console.log('🔍 Checking for modules with invalid createdAt...')

    // Get all modules using raw SQL to avoid Prisma conversion errors
    const modules = await prisma.$queryRaw<Array<{ id: string; key: string; createdAt: string }>>`
      SELECT id, key, createdAt FROM modules
    `

    let fixedCount = 0
    const errors: string[] = []

    for (const module of modules) {
      try {
        // Check if createdAt is a number (timestamp)
        const createdAtValue = module.createdAt
        const isNumber = !isNaN(Number(createdAtValue)) && createdAtValue.length < 20

        if (isNumber) {
          const timestamp = Number(createdAtValue)
          // Convert timestamp (milliseconds) to ISO string
          const date = new Date(timestamp)
          const isoString = date.toISOString()

          console.log(`🔧 Fixing module ${module.key}: ${createdAtValue} -> ${isoString}`)

          // Update using raw SQL to avoid Prisma conversion
          await prisma.$executeRaw`
            UPDATE modules 
            SET createdAt = ${isoString}
            WHERE id = ${module.id}
          `

          fixedCount++
        }
      } catch (error: any) {
        errors.push(`Error fixing module ${module.key}: ${error.message}`)
        console.error(`❌ Error fixing module ${module.key}:`, error)
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} modules`)
    if (errors.length > 0) {
      console.log(`\n❌ Errors:`)
      errors.forEach((error) => console.log(`  - ${error}`))
    }
  } catch (error) {
    console.error('❌ Error fixing modules:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixModuleCreatedAt()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })

