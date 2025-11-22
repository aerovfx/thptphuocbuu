import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Admin Account
  const adminPassword = await bcrypt.hash('Admin@123!Secure', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
    },
  })
  console.log('✅ Created Admin account: admin@test.com')

  // 2. Teacher Account
  const teacherPassword = await bcrypt.hash('Teacher@456!Secure', 10)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      password: teacherPassword,
      firstName: 'Nguyễn Văn',
      lastName: 'Giáo',
      role: 'TEACHER',
    },
  })
  console.log('✅ Created Teacher account: teacher@test.com')

  // 3. Student Account
  const studentPassword = await bcrypt.hash('Student@789!Secure', 10)
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      password: studentPassword,
      firstName: 'Trần Thị',
      lastName: 'Học',
      role: 'STUDENT',
    },
  })
  console.log('✅ Created Student account: student@test.com')

  // 4. Parent Account
  const parentPassword = await bcrypt.hash('Parent@012!Secure', 10)
  const parent = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {},
    create: {
      email: 'parent@test.com',
      password: parentPassword,
      firstName: 'Lê Văn',
      lastName: 'Phụ',
      role: 'PARENT',
    },
  })
  console.log('✅ Created Parent account: parent@test.com')

  // 5. Visitor Account (using STUDENT role as requested)
  const visitorPassword = await bcrypt.hash('Visitor@345!Secure', 10)
  const visitor = await prisma.user.upsert({
    where: { email: 'visitor@test.com' },
    update: {},
    create: {
      email: 'visitor@test.com',
      password: visitorPassword,
      firstName: 'Phạm Thị',
      lastName: 'Khách',
      role: 'STUDENT', // Using STUDENT role as VISITOR doesn't exist
    },
  })
  console.log('✅ Created Visitor account: visitor@test.com')

  // Create a class (optional - for testing)
  const class1 = await prisma.class.upsert({
    where: { code: 'TOAN10A1' },
    update: {},
    create: {
      name: 'Toán 10A1',
      code: 'TOAN10A1',
      subject: 'Toán học',
      grade: '10',
      description: 'Lớp toán nâng cao khối 10',
      teacherId: teacher.id,
    },
  })

  // Enroll student in class
  await prisma.classEnrollment.upsert({
    where: {
      userId_classId: {
        userId: student.id,
        classId: class1.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      classId: class1.id,
    },
  })

  console.log('✅ Seeding completed!')
  console.log('\n📝 Test accounts:')
  console.log('1. Admin: admin@test.com / Admin@123!Secure')
  console.log('   Name: Admin System')
  console.log('   Role: ADMIN')
  console.log('')
  console.log('2. Teacher: teacher@test.com / Teacher@456!Secure')
  console.log('   Name: Nguyễn Văn Giáo')
  console.log('   Role: TEACHER')
  console.log('')
  console.log('3. Student: student@test.com / Student@789!Secure')
  console.log('   Name: Trần Thị Học')
  console.log('   Role: STUDENT')
  console.log('')
  console.log('4. Parent: parent@test.com / Parent@012!Secure')
  console.log('   Name: Lê Văn Phụ')
  console.log('   Role: PARENT')
  console.log('')
  console.log('5. Visitor: visitor@test.com / Visitor@345!Secure')
  console.log('   Name: Phạm Thị Khách')
  console.log('   Role: STUDENT (VISITOR uses STUDENT role)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

