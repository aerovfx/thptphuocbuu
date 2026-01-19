import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdminAccounts() {
  console.log('🔍 Đang kiểm tra các tài khoản Admin trong database...\n')

  try {
    // Tìm tất cả tài khoản có role ADMIN hoặc SUPER_ADMIN
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        password: true, // Check if has password
        failedLoginAttempts: true,
        lockedUntil: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('='.repeat(80))
    console.log(`📊 TỔNG SỐ TÀI KHOẢN ADMIN: ${adminUsers.length}`)
    console.log('='.repeat(80))

    if (adminUsers.length === 0) {
      console.log('\n⚠️  KHÔNG TÌM THẤY TÀI KHOẢN ADMIN NÀO!')
      console.log('\n💡 Để tạo tài khoản Admin, bạn có thể:')
      console.log('   1. Chạy: npm run create-admin')
      console.log('   2. Chạy: npm run db:seed (tạo admin@test.com)')
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Tên: ${user.firstName} ${user.lastName}`)
        console.log(`   Vai trò: ${user.role}`)
        console.log(`   Số điện thoại: ${user.phone || 'Chưa có'}`)
        console.log(`   Email đã xác thực: ${user.emailVerified ? '✅ Có' : '❌ Chưa'}`)
        console.log(`   Có mật khẩu: ${user.password ? '✅ Có' : '❌ Không (có thể là OAuth user)'}`)
        console.log(`   Số lần đăng nhập sai: ${user.failedLoginAttempts}`)
        if (user.lockedUntil) {
          const lockedUntil = new Date(user.lockedUntil)
          const now = new Date()
          if (lockedUntil > now) {
            console.log(`   ⚠️  Tài khoản bị khóa đến: ${lockedUntil.toLocaleString('vi-VN')}`)
          } else {
            console.log(`   ✅ Tài khoản đã được mở khóa`)
          }
        }
        console.log(`   Ngày tạo: ${user.createdAt.toLocaleString('vi-VN')}`)
        console.log(`   Cập nhật lần cuối: ${user.updatedAt.toLocaleString('vi-VN')}`)
      })
    }

    // Thống kê
    console.log('\n' + '='.repeat(80))
    console.log('📈 THỐNG KÊ:')
    const superAdminCount = adminUsers.filter((u) => u.role === 'SUPER_ADMIN').length
    const adminCount = adminUsers.filter((u) => u.role === 'ADMIN').length
    const withPassword = adminUsers.filter((u) => u.password).length
    const withoutPassword = adminUsers.filter((u) => !u.password).length
    const verified = adminUsers.filter((u) => u.emailVerified).length
    const locked = adminUsers.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length

    console.log(`   SUPER_ADMIN: ${superAdminCount}`)
    console.log(`   ADMIN: ${adminCount}`)
    console.log(`   Có mật khẩu: ${withPassword}`)
    console.log(`   Không có mật khẩu (OAuth): ${withoutPassword}`)
    console.log(`   Email đã xác thực: ${verified}`)
    console.log(`   Tài khoản bị khóa: ${locked}`)

    // Kiểm tra tài khoản test
    console.log('\n' + '='.repeat(80))
    console.log('🧪 KIỂM TRA TÀI KHOẢN TEST:')
    const testAdmin = adminUsers.find((u) => u.email === 'admin@test.com')
    if (testAdmin) {
      console.log('   ✅ Tài khoản test admin@test.com đã tồn tại')
      console.log(`      Mật khẩu mặc định: Admin@123!Secure`)
    } else {
      console.log('   ❌ Tài khoản test admin@test.com chưa tồn tại')
      console.log('   💡 Chạy: npm run db:seed để tạo tài khoản test')
    }

    console.log('\n' + '='.repeat(80))
  } catch (error: any) {
    console.error('❌ Lỗi khi kiểm tra:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminAccounts()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
