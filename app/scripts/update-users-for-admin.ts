/**
 * Update existing users to ensure they have status and are ready for admin panel
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating existing users for admin panel...')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    console.log(`📊 Found ${users.length} users`)

    let updated = 0
    let skipped = 0

    for (const user of users) {
      try {
        // Try to update user with status
        // If status column doesn't exist, this will fail gracefully
        const updateData: any = {
          // Ensure status is set
          status: 'ACTIVE',
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })

        updated++
        console.log(`✅ Updated user: ${user.email} (${user.firstName} ${user.lastName})`)
      } catch (error: any) {
        // If status column doesn't exist, skip
        if (error.message?.includes('status') || error.message?.includes('Unknown column')) {
          console.log(`⚠️  Skipped user ${user.email}: status column may not exist`)
          skipped++
        } else {
          console.error(`❌ Error updating user ${user.email}:`, error.message)
        }
      }
    }

    console.log(`\n✅ Finished updating users`)
    console.log(`   - Updated: ${updated}`)
    console.log(`   - Skipped: ${skipped}`)
    console.log(`   - Total: ${users.length}`)

    // Also check if we need to add status column
    if (skipped > 0) {
      console.log(`\n⚠️  Note: Some users were skipped because status column may not exist.`)
      console.log(`   Run: npx prisma db push`)
      console.log(`   Or: ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE';`)
    }
  } catch (error) {
    console.error('❌ Error updating users:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

