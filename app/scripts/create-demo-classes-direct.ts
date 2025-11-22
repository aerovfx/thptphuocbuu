/**
 * Create demo classes directly (force create)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const demoClasses = [
  {
    name: 'JavaScript Essentials',
    code: 'JS101',
    subject: 'Lập trình Web',
    grade: '10',
    description: 'In this course, you will learn web front-end development through the development of applications that run on a single browser.',
  },
  {
    name: 'Problem Solving',
    code: 'PS201',
    subject: 'Toán học',
    grade: '11',
    description: 'Học cách giải quyết các bài toán phức tạp và phát triển tư duy logic.',
  },
  {
    name: 'Front End Fundamentals',
    code: 'FE102',
    subject: 'Lập trình Web',
    grade: '10',
    description: 'Nền tảng về HTML, CSS và JavaScript cơ bản cho phát triển web front-end.',
  },
  {
    name: 'JavaScript',
    code: 'JS202',
    subject: 'Lập trình Web',
    grade: '11',
    description: 'Nâng cao về JavaScript, ES6+, async/await, và các framework hiện đại.',
  },
  {
    name: 'Learning Soft Skills',
    code: 'SS301',
    subject: 'Kỹ năng mềm',
    grade: '12',
    description: 'Phát triển kỹ năng giao tiếp, làm việc nhóm và quản lý thời gian.',
  },
  {
    name: 'PHP 101',
    code: 'PHP101',
    subject: 'Lập trình Backend',
    grade: '11',
    description: 'Học lập trình PHP cơ bản, xử lý form, database và tạo web động.',
  },
  {
    name: 'Intro to JS',
    code: 'JS103',
    subject: 'Lập trình Web',
    grade: '10',
    description: 'Giới thiệu về JavaScript cho người mới bắt đầu.',
  },
  {
    name: 'SQL Essentials',
    code: 'SQL201',
    subject: 'Cơ sở dữ liệu',
    grade: '11',
    description: 'Học về cơ sở dữ liệu quan hệ và SQL để quản lý dữ liệu.',
  },
  {
    name: 'Python Programming',
    code: 'PY101',
    subject: 'Lập trình',
    grade: '10',
    description: 'Học lập trình Python từ cơ bản đến nâng cao, bao gồm OOP và data structures.',
  },
  {
    name: 'Web Development',
    code: 'WD301',
    subject: 'Lập trình Web',
    grade: '12',
    description: 'Phát triển ứng dụng web full-stack với React và Node.js.',
  },
]

async function main() {
  console.log('🌱 Creating demo classes...')

  // Get or create teacher
  let teacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  })

  if (!teacher) {
    teacher = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })
  }

  if (!teacher) {
    console.error('❌ No TEACHER or ADMIN found')
    process.exit(1)
  }

  console.log(`✅ Using teacher: ${teacher.firstName} ${teacher.lastName}`)

  // Delete existing demo classes
  const codes = demoClasses.map((c) => c.code)
  await prisma.class.deleteMany({
    where: { code: { in: codes } },
  })
  console.log('🗑️  Deleted existing demo classes')

  // Create classes
  for (const classData of demoClasses) {
    try {
      const newClass = await prisma.class.create({
        data: {
          ...classData,
          teacherId: teacher.id,
        },
      })
      console.log(`✅ Created: ${newClass.name} (${newClass.code})`)
    } catch (error: any) {
      console.error(`❌ Error creating ${classData.name}:`, error.message)
    }
  }

  // Get students
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  })

  if (students.length === 0) {
    console.log('⚠️  No students found. Creating demo students...')
    const demoStudents = [
      { firstName: 'Nguyễn', lastName: 'Văn A', email: 'student1@demo.com' },
      { firstName: 'Trần', lastName: 'Thị B', email: 'student2@demo.com' },
      { firstName: 'Lê', lastName: 'Văn C', email: 'student3@demo.com' },
      { firstName: 'Phạm', lastName: 'Thị D', email: 'student4@demo.com' },
      { firstName: 'Hoàng', lastName: 'Văn E', email: 'student5@demo.com' },
    ]

    for (const s of demoStudents) {
      try {
        await prisma.user.create({
          data: {
            ...s,
            role: 'STUDENT',
            password: '$2a$10$dummy',
          },
        })
      } catch (e: any) {
        // Ignore duplicates
      }
    }
  }

  // Re-fetch students
  const allStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  })

  // Add enrollments and assignments
  const classes = await prisma.class.findMany({
    where: { code: { in: codes } },
  })

  for (const classItem of classes) {
    // Enrollments (20-70 students)
    const enrollmentCount = Math.min(Math.floor(Math.random() * 50) + 20, allStudents.length)
    const studentsToEnroll = allStudents.slice(0, enrollmentCount)

    let enrolled = 0
    for (const student of studentsToEnroll) {
      try {
        await prisma.classEnrollment.create({
          data: {
            userId: student.id,
            classId: classItem.id,
          },
        })
        enrolled++
      } catch (e: any) {
        // Skip duplicates
      }
    }

    // Assignments (5-15)
    const assignmentCount = Math.floor(Math.random() * 10) + 5
    for (let i = 1; i <= assignmentCount; i++) {
      try {
        await prisma.assignment.create({
          data: {
            title: `Bài tập ${i} - ${classItem.name}`,
            description: `Mô tả bài tập ${i}`,
            classId: classItem.id,
            teacherId: teacher.id,
            dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
          },
        })
      } catch (e: any) {
        // Skip errors
      }
    }

    console.log(`   └─ ${classItem.name}: ${enrolled} students, ${assignmentCount} assignments`)
  }

  console.log(`\n✅ Finished! Created ${classes.length} demo classes`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

