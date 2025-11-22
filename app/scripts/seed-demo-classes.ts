/**
 * Seed demo classes for testing the classes page UI
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
  console.log('🌱 Seeding demo classes...')

  // Get first teacher user (or create one if none exists)
  let teacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  })

  if (!teacher) {
    // Get first admin user as fallback
    teacher = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (!teacher) {
      console.error('❌ No TEACHER or ADMIN user found. Please create a user first.')
      process.exit(1)
    }
  }

  console.log(`✅ Using teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`)

  let created = 0
  let skipped = 0

  for (const classData of demoClasses) {
    try {
      // Check if class already exists
      const existing = await prisma.class.findUnique({
        where: { code: classData.code },
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${classData.name} (code: ${classData.code} already exists)`)
        skipped++
        continue
      }

      // Create class
      const newClass = await prisma.class.create({
        data: {
          ...classData,
          teacherId: teacher.id,
        },
      })

      console.log(`✅ Created: ${newClass.name} (code: ${newClass.code})`)
      created++

      // Create some enrollments (random students)
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        take: Math.floor(Math.random() * 50) + 20, // 20-70 students
      })

      if (students.length > 0) {
        // Create enrollments one by one to handle duplicates
        let enrolledCount = 0
        for (const student of students) {
          try {
            await prisma.classEnrollment.create({
              data: {
                userId: student.id,
                classId: newClass.id,
              },
            })
            enrolledCount++
          } catch (error: any) {
            // Skip if already enrolled (unique constraint violation)
            if (!error.message?.includes('Unique constraint')) {
              throw error
            }
          }
        }

        console.log(`   └─ Enrolled ${enrolledCount} students`)
      }

      // Create some assignments (materials)
      const assignmentCount = Math.floor(Math.random() * 10) + 5 // 5-15 assignments
      for (let i = 1; i <= assignmentCount; i++) {
        await prisma.assignment.create({
          data: {
            title: `Assignment ${i} - ${classData.name}`,
            description: `Bài tập ${i} cho lớp ${classData.name}`,
            classId: newClass.id,
            teacherId: teacher.id,
            dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000), // i weeks from now
          },
        })
      }

      console.log(`   └─ Created ${assignmentCount} assignments`)
    } catch (error: any) {
      console.error(`❌ Error creating ${classData.name}:`, error.message)
    }
  }

  console.log(`\n✅ Finished seeding demo classes`)
  console.log(`   - Created: ${created}`)
  console.log(`   - Skipped: ${skipped}`)
  console.log(`   - Total: ${demoClasses.length}`)
}

main()
  .catch((error) => {
    console.error('Error seeding demo classes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

