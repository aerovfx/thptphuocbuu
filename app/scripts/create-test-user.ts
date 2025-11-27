import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for existing users...')
  
  const existingUsers = await prisma.user.findMany({
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      password: true,
    },
  })

  console.log(`Found ${existingUsers.length} users in database:`)
  existingUsers.forEach((u) => {
    console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - ${u.role} - Has password: ${!!u.password}`)
  })

  // Check if admin user exists
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@example.com' },
        { role: 'ADMIN' },
      ],
    },
  })

  if (!adminUser) {
    console.log('\n📝 Creating default admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })

    console.log(`✅ Created admin user: ${newAdmin.email}`)
    console.log('   Password: admin123')
  } else {
    console.log(`\n✅ Admin user already exists: ${adminUser.email}`)
    
    // Check if admin has password
    if (!adminUser.password) {
      console.log('⚠️  Admin user has no password. Setting password...')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword },
      })
      console.log('✅ Password set for admin user: admin123')
    } else {
      console.log('✅ Admin user has password set')
    }
  }

  // Create a test student user
  const testStudent = await prisma.user.findUnique({
    where: { email: 'student@example.com' },
  })

  if (!testStudent) {
    console.log('\n📝 Creating test student user...')
    const hashedPassword = await bcrypt.hash('student123', 10)
    
    const newStudent = await prisma.user.create({
      data: {
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
        password: hashedPassword,
        role: 'STUDENT',
        emailVerified: new Date(),
      },
    })

    console.log(`✅ Created student user: ${newStudent.email}`)
    console.log('   Password: student123')
  } else {
    console.log(`\n✅ Test student user already exists: ${testStudent.email}`)
  }

  console.log('\n🎉 Done!')
  console.log('\n📋 Test credentials:')
  console.log('   Admin: admin@example.com / admin123')
  console.log('   Student: student@example.com / student123')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

