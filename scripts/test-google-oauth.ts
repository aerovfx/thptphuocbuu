/**
 * Script kiểm tra cấu hình Google OAuth
 * Chạy: npx tsx scripts/test-google-oauth.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGoogleOAuthConfig() {
  console.log('🔍 Kiểm tra cấu hình Google OAuth...\n')

  // 1. Kiểm tra environment variables
  console.log('1. Kiểm tra Environment Variables:')
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  if (googleClientId) {
    console.log('   ✅ GOOGLE_CLIENT_ID: Đã được cấu hình')
    console.log(`      Value: ${googleClientId.substring(0, 20)}...`)
  } else {
    console.log('   ❌ GOOGLE_CLIENT_ID: Chưa được cấu hình')
    console.log('      → Thêm vào .env.local: GOOGLE_CLIENT_ID=your-client-id')
  }

  if (googleClientSecret) {
    console.log('   ✅ GOOGLE_CLIENT_SECRET: Đã được cấu hình')
    console.log(`      Value: ${googleClientSecret.substring(0, 10)}...`)
  } else {
    console.log('   ❌ GOOGLE_CLIENT_SECRET: Chưa được cấu hình')
    console.log('      → Thêm vào .env.local: GOOGLE_CLIENT_SECRET=your-client-secret')
  }

  if (nextAuthUrl) {
    console.log('   ✅ NEXTAUTH_URL: Đã được cấu hình')
    console.log(`      Value: ${nextAuthUrl}`)
  } else {
    console.log('   ❌ NEXTAUTH_URL: Chưa được cấu hình')
    console.log('      → Thêm vào .env.local: NEXTAUTH_URL=http://localhost:3000')
  }

  if (nextAuthSecret) {
    console.log('   ✅ NEXTAUTH_SECRET: Đã được cấu hình')
  } else {
    console.log('   ❌ NEXTAUTH_SECRET: Chưa được cấu hình')
    console.log('      → Thêm vào .env.local: NEXTAUTH_SECRET=your-secret')
    console.log('      → Generate: openssl rand -base64 32')
  }

  console.log('')

  // 2. Kiểm tra database schema
  console.log('2. Kiểm tra Database Schema:')
  try {
    const accountCount = await prisma.account.count({
      where: { provider: 'google' },
    })
    console.log(`   ✅ Accounts table: OK (${accountCount} Google accounts)`)
  } catch (error: any) {
    console.log('   ❌ Accounts table: Lỗi')
    console.log(`      Error: ${error.message}`)
    console.log('      → Chạy: npx prisma db push')
  }

  try {
    const userCount = await prisma.user.count()
    console.log(`   ✅ Users table: OK (${userCount} users)`)
  } catch (error: any) {
    console.log('   ❌ Users table: Lỗi')
    console.log(`      Error: ${error.message}`)
  }

  console.log('')

  // 3. Kiểm tra Google OAuth accounts
  console.log('3. Kiểm tra Google OAuth Accounts:')
  try {
    const googleAccounts = await prisma.account.findMany({
      where: { provider: 'google' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    if (googleAccounts.length === 0) {
      console.log('   ℹ️  Chưa có tài khoản Google nào được liên kết')
      console.log('      → Đăng nhập với Google để tạo tài khoản đầu tiên')
    } else {
      console.log(`   ✅ Tìm thấy ${googleAccounts.length} tài khoản Google:`)
      googleAccounts.forEach((account, index) => {
        console.log(`      ${index + 1}. ${account.user.email}`)
        console.log(`         Provider ID: ${account.providerAccountId}`)
        console.log(`         User: ${account.user.firstName} ${account.user.lastName}`)
      })
    }
  } catch (error: any) {
    console.log('   ❌ Lỗi khi truy vấn Google accounts')
    console.log(`      Error: ${error.message}`)
  }

  console.log('')

  // 4. Hướng dẫn test
  console.log('4. Hướng dẫn Test:')
  console.log('   1. Đảm bảo server đang chạy: npm run dev')
  console.log('   2. Mở browser: http://localhost:3000/login')
  console.log('   3. Click nút "Đăng nhập với Google"')
  console.log('   4. Chọn tài khoản Google')
  console.log('   5. Cho phép ứng dụng truy cập')
  console.log('   6. Kiểm tra redirect về /dashboard')
  console.log('')

  // 5. Kiểm tra redirect URI
  console.log('5. Kiểm tra Redirect URI trong Google Console:')
  const expectedCallbackUrl = `${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/google`
  console.log(`   Redirect URI phải là: ${expectedCallbackUrl}`)
  console.log('   → Kiểm tra trong Google Cloud Console > APIs & Services > Credentials')
  console.log('   → Đảm bảo redirect URI khớp chính xác (bao gồm http/https)')
  console.log('')

  // Summary
  console.log('📋 Tóm tắt:')
  const allConfigured = googleClientId && googleClientSecret && nextAuthUrl && nextAuthSecret
  if (allConfigured) {
    console.log('   ✅ Tất cả cấu hình đã sẵn sàng!')
    console.log('   → Bạn có thể test đăng nhập với Google ngay bây giờ')
  } else {
    console.log('   ⚠️  Một số cấu hình còn thiếu')
    console.log('   → Vui lòng cấu hình các biến môi trường còn thiếu')
  }
  console.log('')
}

testGoogleOAuthConfig()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

