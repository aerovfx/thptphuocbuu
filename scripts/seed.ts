import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
    },
  })

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      password: teacherPassword,
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      role: 'TEACHER',
    },
  })

  // Create student
  const studentPassword = await bcrypt.hash('student123', 10)
  const student = await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: {},
    create: {
      email: 'student@school.com',
      password: studentPassword,
      firstName: 'Trần',
      lastName: 'Thị B',
      role: 'STUDENT',
    },
  })

  // Create a class
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
  console.log('Admin: admin@school.com / admin123')
  console.log('Teacher: teacher@school.com / teacher123')
  console.log('Student: student@school.com / student123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

