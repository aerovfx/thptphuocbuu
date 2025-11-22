import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdmin() {
  console.log('🔐 Tạo tài khoản Admin mới\n')

  try {
    const email = await question('Email: ')
    if (!email || !email.includes('@')) {
      console.error('❌ Email không hợp lệ')
      process.exit(1)
    }

    const password = await question('Mật khẩu (tối thiểu 6 ký tự): ')
    if (!password || password.length < 6) {
      console.error('❌ Mật khẩu phải có ít nhất 6 ký tự')
      process.exit(1)
    }

    const firstName = await question('Tên: ')
    if (!firstName) {
      console.error('❌ Tên không được để trống')
      process.exit(1)
    }

    const lastName = await question('Họ: ')
    if (!lastName) {
      console.error('❌ Họ không được để trống')
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingUser) {
      console.error(`❌ Email ${email} đã tồn tại trong hệ thống`)
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'ADMIN',
      },
    })

    console.log('\n✅ Tạo tài khoản Admin thành công!')
    console.log(`\n📝 Thông tin tài khoản:`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Tên: ${admin.firstName} ${admin.lastName}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   ID: ${admin.id}`)
    console.log(`\n💡 Bạn có thể đăng nhập ngay bây giờ!`)
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

createAdmin()

