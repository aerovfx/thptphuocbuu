import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAuthDB() {
  console.log('🔍 Testing database connection from auth context...\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  console.log('')

  try {
    // Test 1: Find admin user
    const normalizedEmail = 'admin@test.com'.trim().toLowerCase()
    console.log(`Looking for user with email: ${normalizedEmail}`)
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (user) {
      console.log('✅ User found:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.firstName} ${user.lastName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Has password: ${!!user.password}`)
    } else {
      console.log('❌ User NOT found!')
      
      // List all users
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
        take: 10,
      })
      
      console.log(`\n📋 Found ${allUsers.length} users in database:`)
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} - ${u.firstName} ${u.lastName}`)
      })
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthDB()

