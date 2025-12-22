/**
 * Run database migration to simplify UserStatus enum
 * This script runs the migration SQL directly using Prisma
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database migration...\n')

  try {
    // Step 1: Count users by status before migration
    const [deletedCount, pendingCount, activeCount, suspendedCount] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM users WHERE status = 'DELETED'
      `.then(r => Number(r[0]?.count || 0)),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM users WHERE status = 'PENDING'
      `.then(r => Number(r[0]?.count || 0)),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM users WHERE status = 'ACTIVE'
      `.then(r => Number(r[0]?.count || 0)),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM users WHERE status = 'SUSPENDED'
      `.then(r => Number(r[0]?.count || 0)),
    ])

    console.log('📊 Current user status distribution:')
    console.log(`   ACTIVE: ${activeCount}`)
    console.log(`   SUSPENDED: ${suspendedCount}`)
    console.log(`   DELETED: ${deletedCount}`)
    console.log(`   PENDING: ${pendingCount}\n`)

    if (deletedCount === 0 && pendingCount === 0) {
      console.log('✅ No users need status conversion.\n')
    } else {
      // Step 2: Convert DELETED to SUSPENDED
      if (deletedCount > 0) {
        console.log(`🔄 Converting ${deletedCount} DELETED users to SUSPENDED...`)
        await prisma.$executeRaw`
          UPDATE users SET status = 'SUSPENDED' WHERE status = 'DELETED'
        `
        console.log(`   ✅ Updated ${deletedCount} users\n`)
      }

      // Step 3: Convert PENDING to SUSPENDED
      if (pendingCount > 0) {
        console.log(`🔄 Converting ${pendingCount} PENDING users to SUSPENDED...`)
        await prisma.$executeRaw`
          UPDATE users SET status = 'SUSPENDED' WHERE status = 'PENDING'
        `
        console.log(`   ✅ Updated ${pendingCount} users\n`)
      }
    }

    // Step 4: Update enum type in PostgreSQL
    console.log('🔄 Updating PostgreSQL enum type...')
    
    try {
      // Step 1: Remove default value first
      await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN status DROP DEFAULT`
      
      // Step 2: Convert column to text temporarily
      await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN status TYPE text`
      
      // Step 3: Drop old enum with CASCADE to handle dependencies
      await prisma.$executeRaw`DROP TYPE IF EXISTS "UserStatus" CASCADE`
      
      // Step 4: Create new enum with only ACTIVE and SUSPENDED
      await prisma.$executeRaw`CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED')`
      
      // Step 5: Convert column back to enum
      await prisma.$executeRaw`
        ALTER TABLE users 
        ALTER COLUMN status TYPE "UserStatus" 
        USING status::"UserStatus"
      `
      
      // Step 6: Set default
      await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN status SET DEFAULT 'ACTIVE'`
      
      // Step 7: Safety check - convert any NULL values
      await prisma.$executeRaw`UPDATE users SET status = 'ACTIVE' WHERE status IS NULL`
      
      console.log('   ✅ Enum type updated successfully\n')
    } catch (error: any) {
      console.error('   ⚠️  Error updating enum type:', error.message)
      console.log('   ℹ️  This might be because:')
      console.log('      - Database connection uses Prisma Accelerate (which may not support DDL)')
      console.log('      - You need to run the SQL migration directly on the database\n')
      throw error
    }

    // Verify final state
    const [finalActive, finalSuspended] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ])

    console.log('📊 Final user status distribution:')
    console.log(`   ACTIVE: ${finalActive}`)
    console.log(`   SUSPENDED: ${finalSuspended}\n`)

    console.log('✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Restart your application to use the new enum')
    console.log('   2. Verify the changes in your admin panel\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

