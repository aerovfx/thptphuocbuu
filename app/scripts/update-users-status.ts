/**
 * Update existing users to set default status
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating existing users...')

  // Update all users without status to ACTIVE
  const result = await prisma.user.updateMany({
    where: {
      status: undefined as any, // This will match users where status is null/undefined
    },
    data: {
      status: 'ACTIVE',
    },
  })

  console.log(`✅ Updated ${result.count} users to ACTIVE status`)
  console.log('✅ Finished updating users')
}

main()
  .catch((error) => {
    console.error('Error updating users:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

