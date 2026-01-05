import { PrismaClient } from '@prisma/client'

// Production database
const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require'
    }
  }
})

// Local database (from .env.local)
const localDb = new PrismaClient()

async function syncUsers() {
  try {
    console.log('📊 Checking production database...')
    const prodUsers = await prodDb.user.findMany({
      include: {
        accounts: true,
        sessions: true,
      }
    })
    console.log(`✅ Found ${prodUsers.length} users in production`)

    console.log('\n📊 Checking local database...')
    const localUsers = await localDb.user.findMany()
    console.log(`📝 Found ${localUsers.length} users in localhost`)

    console.log('\n🔄 Starting sync...')
    let created = 0
    let updated = 0
    let skipped = 0

    for (const user of prodUsers) {
      const { accounts, sessions, ...userData } = user
      
      try {
        // Check if user exists locally
        const existingUser = await localDb.user.findUnique({
          where: { email: user.email }
        })

        if (existingUser) {
          // Update existing user
          await localDb.user.update({
            where: { email: user.email },
            data: userData
          })
          updated++
          console.log(`✏️  Updated: ${user.email}`)
        } else {
          // Create new user
          await localDb.user.create({
            data: userData
          })
          created++
          console.log(`✅ Created: ${user.email}`)
        }

        // Sync OAuth accounts
        for (const account of accounts) {
          const existingAccount = await localDb.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            }
          })

          if (!existingAccount) {
            await localDb.account.create({
              data: {
                ...account,
                id: undefined // Let DB generate new ID
              }
            })
          }
        }

      } catch (error: any) {
        console.error(`❌ Error syncing ${user.email}:`, error.message)
        skipped++
      }
    }

    console.log('\n✅ Sync completed!')
    console.log(`   Created: ${created}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Total:   ${prodUsers.length}`)

  } catch (error) {
    console.error('❌ Sync failed:', error)
  } finally {
    await prodDb.$disconnect()
    await localDb.$disconnect()
  }
}

syncUsers()
