import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAdminLogin() {
  console.log('🔐 Đang kiểm tra đăng nhập Admin...\n')

  const adminEmail = 'admin@test.com'
  const adminPassword = 'Admin@123!Secure'

  try {
    // 1. Tìm user
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
      },
    })

    if (!user) {
      console.log('❌ Không tìm thấy user với email:', adminEmail)
      await prisma.$disconnect()
      return
    }

    console.log('✅ Tìm thấy user:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Tên: ${user.firstName} ${user.lastName}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Có mật khẩu: ${user.password ? 'Có' : 'Không'}`)

    if (!user.password) {
      console.log('\n❌ User không có mật khẩu! Cần tạo lại mật khẩu.')
      await prisma.$disconnect()
      return
    }

    // 2. Kiểm tra mật khẩu
    console.log('\n🔑 Đang kiểm tra mật khẩu...')
    console.log(`   Mật khẩu nhập vào: ${adminPassword}`)
    console.log(`   Hash trong DB: ${user.password.substring(0, 20)}...`)

    const isPasswordValid = await bcrypt.compare(adminPassword, user.password)

    if (isPasswordValid) {
      console.log('\n✅ Mật khẩu KHỚP! Đăng nhập sẽ thành công.')
    } else {
      console.log('\n❌ Mật khẩu KHÔNG KHỚP!')
      console.log('\n💡 Đang tạo lại mật khẩu...')

      // Tạo lại mật khẩu
      const newPasswordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newPasswordHash },
      })

      console.log('✅ Đã cập nhật mật khẩu mới!')
      console.log('   Bây giờ bạn có thể đăng nhập với:')
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
    }

    // 3. Test với các mật khẩu khác có thể
    console.log('\n🧪 Đang test các mật khẩu khác...')
    const testPasswords = [
      'Admin@123!Secure',
      'admin@123!secure',
      'Admin123!Secure',
      'Admin@123Secure',
    ]

    for (const testPwd of testPasswords) {
      if (testPwd === adminPassword) continue
      const matches = await bcrypt.compare(testPwd, user.password)
      if (matches) {
        console.log(`   ⚠️ Mật khẩu "${testPwd}" cũng khớp!`)
      }
    }
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminLogin()

