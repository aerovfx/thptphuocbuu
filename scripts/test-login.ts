import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  console.log('🔍 Đang kiểm tra đăng nhập với các tài khoản test...\n')

  const testAccounts = [
    {
      email: 'admin@test.com',
      password: 'Admin@123!Secure',
      name: 'Admin System',
    },
    {
      email: 'teacher@test.com',
      password: 'Teacher@456!Secure',
      name: 'Nguyễn Văn Giáo',
    },
    {
      email: 'student@test.com',
      password: 'Student@789!Secure',
      name: 'Trần Thị Học',
    },
    {
      email: 'parent@test.com',
      password: 'Parent@012!Secure',
      name: 'Lê Văn Phụ',
    },
    {
      email: 'visitor@test.com',
      password: 'Visitor@345!Secure',
      name: 'Phạm Thị Khách',
    },
  ]

  for (const account of testAccounts) {
    console.log(`\n📧 Testing: ${account.email}`)
    console.log('─'.repeat(60))

    try {
      // Normalize email
      const normalizedEmail = account.email.trim().toLowerCase()
      console.log(`   Normalized email: ${normalizedEmail}`)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        console.log(`   ❌ User not found in database`)
        continue
      }

      console.log(`   ✅ User found: ${user.firstName} ${user.lastName}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Has password: ${!!user.password}`)

      if (!user.password) {
        console.log(`   ⚠️  User has no password set`)
        continue
      }

      // Test password
      const isPasswordValid = await bcrypt.compare(
        account.password,
        user.password
      )

      if (isPasswordValid) {
        console.log(`   ✅ Password is VALID`)
      } else {
        console.log(`   ❌ Password is INVALID`)
        console.log(`   Expected password: ${account.password}`)
        console.log(`   Stored hash: ${user.password.substring(0, 20)}...`)
        
        // Try to rehash and check
        const newHash = await bcrypt.hash(account.password, 10)
        const testCompare = await bcrypt.compare(account.password, newHash)
        console.log(`   Test hash comparison: ${testCompare ? '✅' : '❌'}`)
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Kiểm tra hoàn tất')
}

testLogin()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

