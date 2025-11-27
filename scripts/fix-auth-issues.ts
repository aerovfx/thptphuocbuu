import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Script để kiểm tra và sửa các vấn đề authentication:
 * 1. Kiểm tra NEXTAUTH_SECRET
 * 2. Kiểm tra users trong database
 * 3. Reset password cho user test nếu cần
 */

async function checkAuthIssues() {
  console.log('🔍 Đang kiểm tra các vấn đề authentication...\n')

  // 1. Kiểm tra NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('❌ NEXTAUTH_SECRET không được set trong .env')
    console.log('💡 Tạo NEXTAUTH_SECRET bằng lệnh: openssl rand -base64 32')
    return
  } else {
    console.log('✅ NEXTAUTH_SECRET đã được set')
  }

  // 2. Kiểm tra users trong database
  console.log('\n📊 Kiểm tra users trong database...')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      password: true,
      createdAt: true,
    },
    take: 10,
  })

  console.log(`\nTìm thấy ${users.length} user(s):`)
  users.forEach((user, index) => {
    const hasPassword = !!user.password
    console.log(`  ${index + 1}. ${user.email}`)
    console.log(`     - Tên: ${user.firstName} ${user.lastName}`)
    console.log(`     - Role: ${user.role}`)
    console.log(`     - Có password: ${hasPassword ? '✅' : '❌ (chỉ OAuth)'}`)
    console.log(`     - Tạo: ${user.createdAt.toLocaleDateString()}`)
  })

  // 3. Kiểm tra users có password
  const usersWithPassword = users.filter(u => u.password)
  console.log(`\n📈 Thống kê:`)
  console.log(`  - Tổng users: ${users.length}`)
  console.log(`  - Users có password: ${usersWithPassword.length}`)
  console.log(`  - Users chỉ OAuth: ${users.length - usersWithPassword.length}`)

  // 4. Test password hash
  if (usersWithPassword.length > 0) {
    console.log('\n🔐 Test password hash...')
    const testUser = usersWithPassword[0]
    console.log(`  Testing với user: ${testUser.email}`)
    
    // Test với password mặc định
    const testPasswords = ['password', '123456', 'admin', 'test']
    for (const testPwd of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPwd, testUser.password!)
        if (isValid) {
          console.log(`  ✅ Password hợp lệ: "${testPwd}"`)
          break
        }
      } catch (error) {
        console.log(`  ❌ Lỗi khi test password: ${error}`)
      }
    }
  }

  // 5. Gợi ý sửa lỗi
  console.log('\n💡 Gợi ý sửa lỗi:')
  console.log('  1. Nếu JWT_SESSION_ERROR: Xóa cookies trong browser và đăng nhập lại')
  console.log('  2. Nếu CredentialsSignin: Kiểm tra email/password có đúng không')
  console.log('  3. Nếu user không có password: Sử dụng OAuth hoặc reset password')
  console.log('  4. Để reset password, chạy: npx tsx scripts/reset-admin-password.ts')

  await prisma.$disconnect()
}

checkAuthIssues()
  .catch((error) => {
    console.error('Lỗi:', error)
    process.exit(1)
  })

