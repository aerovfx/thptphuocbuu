/**
 * Migration script: Simplify UserStatus enum to only ACTIVE and SUSPENDED
 * 
 * This script:
 * 1. Converts all DELETED users to SUSPENDED
 * 2. Converts all PENDING users to SUSPENDED
 * 3. Updates the enum type in PostgreSQL
 * 
 * Run with: npx tsx app/scripts/migrate-user-status.ts
 */

import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting UserStatus migration...\n')

  try {
    // Step 1: Count users by status
    const [deletedCount, pendingCount, activeCount, suspendedCount] = await Promise.all([
      prisma.user.count({ where: { status: 'DELETED' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ])

    console.log('📊 Current user status distribution:')
    console.log(`   ACTIVE: ${activeCount}`)
    console.log(`   SUSPENDED: ${suspendedCount}`)
    console.log(`   DELETED: ${deletedCount}`)
    console.log(`   PENDING: ${pendingCount}\n`)

    if (deletedCount === 0 && pendingCount === 0) {
      console.log('✅ No users need status conversion. Skipping data migration.\n')
    } else {
      // Step 2: Convert DELETED to SUSPENDED
      if (deletedCount > 0) {
        console.log(`🔄 Converting ${deletedCount} DELETED users to SUSPENDED...`)
        const deletedResult = await prisma.user.updateMany({
          where: { status: 'DELETED' },
          data: { status: 'SUSPENDED' },
        })
        console.log(`   ✅ Updated ${deletedResult.count} users\n`)
      }

      // Step 3: Convert PENDING to SUSPENDED
      if (pendingCount > 0) {
        console.log(`🔄 Converting ${pendingCount} PENDING users to SUSPENDED...`)
        const pendingResult = await prisma.user.updateMany({
          where: { status: 'PENDING' },
          data: { status: 'SUSPENDED' },
        })
        console.log(`   ✅ Updated ${pendingResult.count} users\n`)
      }
    }

    // Step 4: Update enum type in PostgreSQL
    console.log('🔄 Updating PostgreSQL enum type...')
    
    // Read DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Extract connection details from DATABASE_URL
    const url = new URL(databaseUrl)
    const dbName = url.pathname.slice(1) // Remove leading /
    const dbHost = url.hostname
    const dbPort = url.port || '5432'
    const dbUser = url.username
    const dbPassword = url.password

    // Build psql command
    const psqlCommand = `
      PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} <<EOF
      -- Step 1: Convert column to text temporarily
      ALTER TABLE users ALTER COLUMN status TYPE text;
      
      -- Step 2: Drop old enum
      DROP TYPE IF EXISTS "UserStatus";
      
      -- Step 3: Create new enum with only ACTIVE and SUSPENDED
      CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
      
      -- Step 4: Convert column back to enum
      ALTER TABLE users 
        ALTER COLUMN status TYPE "UserStatus" 
        USING status::"UserStatus";
      
      -- Step 5: Set default
      ALTER TABLE users 
        ALTER COLUMN status SET DEFAULT 'ACTIVE';
      
      -- Step 6: Safety check - convert any invalid values
      UPDATE users 
      SET status = 'ACTIVE' 
      WHERE status IS NULL OR status NOT IN ('ACTIVE', 'SUSPENDED');
      
      EOF
    `

    console.log('   ⚠️  Note: Enum update requires direct PostgreSQL access.')
    console.log('   Please run the SQL migration manually or use Prisma migrate.\n')
    console.log('   SQL to run:')
    console.log('   ──────────────────────────────────────────────────────────')
    console.log(`
      ALTER TABLE users ALTER COLUMN status TYPE text;
      DROP TYPE IF EXISTS "UserStatus";
      CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
      ALTER TABLE users ALTER COLUMN status TYPE "UserStatus" USING status::"UserStatus";
      ALTER TABLE users ALTER COLUMN status SET DEFAULT 'ACTIVE';
      UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;
    `)
    console.log('   ──────────────────────────────────────────────────────────\n')

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
    console.log('   1. Run the SQL migration above to update the enum type')
    console.log('   2. Run: npx prisma generate')
    console.log('   3. Restart your application\n')

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

