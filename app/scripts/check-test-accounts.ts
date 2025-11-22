import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testAccounts = [
  { email: 'admin@test.com', name: 'Admin System', role: 'ADMIN' },
  { email: 'teacher@test.com', name: 'Nguyễn Văn Giáo', role: 'TEACHER' },
  { email: 'student@test.com', name: 'Trần Thị Học', role: 'STUDENT' },
  { email: 'parent@test.com', name: 'Lê Văn Phụ', role: 'PARENT' },
  { email: 'visitor@test.com', name: 'Phạm Thị Khách', role: 'STUDENT' }, // VISITOR uses STUDENT role
]

async function checkTestAccounts() {
  console.log('🔍 Đang kiểm tra các tài khoản test trong database...\n')

  const results = []

  for (const account of testAccounts) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      })

      if (user) {
        results.push({
          email: account.email,
          status: '✅ TỒN TẠI',
          details: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            createdAt: user.createdAt.toLocaleString('vi-VN'),
          },
        })
      } else {
        results.push({
          email: account.email,
          status: '❌ KHÔNG TỒN TẠI',
          expected: {
            name: account.name,
            role: account.role,
          },
        })
      }
    } catch (error: any) {
      results.push({
        email: account.email,
        status: '⚠️ LỖI',
        error: error.message,
      })
    }
  }

  // Display results
  console.log('📊 KẾT QUẢ KIỂM TRA:\n')
  console.log('='.repeat(80))

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`)
    console.log(`   Trạng thái: ${result.status}`)

    if (result.details) {
      console.log(`   ID: ${result.details.id}`)
      console.log(`   Tên: ${result.details.name}`)
      console.log(`   Vai trò: ${result.details.role}`)
      console.log(`   Ngày tạo: ${result.details.createdAt}`)
    } else if (result.expected) {
      console.log(`   Mong đợi: ${result.expected.name} (${result.expected.role})`)
    } else if (result.error) {
      console.log(`   Lỗi: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(80))

  // Summary
  const existing = results.filter((r) => r.status === '✅ TỒN TẠI').length
  const missing = results.filter((r) => r.status === '❌ KHÔNG TỒN TẠI').length
  const errors = results.filter((r) => r.status === '⚠️ LỖI').length

  console.log('\n📈 TÓM TẮT:')
  console.log(`   ✅ Đã tồn tại: ${existing}/${testAccounts.length}`)
  console.log(`   ❌ Chưa tồn tại: ${missing}/${testAccounts.length}`)
  console.log(`   ⚠️ Lỗi: ${errors}/${testAccounts.length}`)

  if (missing > 0) {
    console.log('\n💡 Để tạo các tài khoản còn thiếu, chạy lệnh:')
    console.log('   npm run db:seed')
  }

  await prisma.$disconnect()
}

checkTestAccounts()
  .catch((error) => {
    console.error('❌ Lỗi khi kiểm tra:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

