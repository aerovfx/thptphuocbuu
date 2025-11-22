/**
 * Add enrollments and assignments to existing demo classes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Enriching demo classes with enrollments and assignments...')

  // Get all classes
  const classes = await prisma.class.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
    },
  })

  console.log(`📊 Found ${classes.length} classes`)

  // Get all students
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  })

  console.log(`📊 Found ${students.length} students`)

  if (students.length === 0) {
    console.log('⚠️  No students found. Creating some demo students...')
    
    // Create some demo students
    const demoStudents = [
      { firstName: 'Nguyễn', lastName: 'Văn A', email: 'student1@test.com' },
      { firstName: 'Trần', lastName: 'Thị B', email: 'student2@test.com' },
      { firstName: 'Lê', lastName: 'Văn C', email: 'student3@test.com' },
      { firstName: 'Phạm', lastName: 'Thị D', email: 'student4@test.com' },
      { firstName: 'Hoàng', lastName: 'Văn E', email: 'student5@test.com' },
    ]

    for (const studentData of demoStudents) {
      try {
        await prisma.user.create({
          data: {
            ...studentData,
            role: 'STUDENT',
            password: '$2a$10$dummy', // Dummy password
          },
        })
      } catch (error: any) {
        if (!error.message?.includes('Unique constraint')) {
          console.error(`Error creating student ${studentData.email}:`, error.message)
        }
      }
    }

    // Re-fetch students
    const newStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
    })
    console.log(`✅ Now have ${newStudents.length} students`)
  }

  // Re-fetch students
  const allStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  })

  for (const classItem of classes) {
    try {
      // Add enrollments (20-70 students per class)
      const enrollmentCount = Math.floor(Math.random() * 50) + 20
      const studentsToEnroll = allStudents.slice(0, Math.min(enrollmentCount, allStudents.length))
      
      let enrolledCount = 0
      for (const student of studentsToEnroll) {
        try {
          await prisma.classEnrollment.create({
            data: {
              userId: student.id,
              classId: classItem.id,
            },
          })
          enrolledCount++
        } catch (error: any) {
          // Skip if already enrolled
          if (!error.message?.includes('Unique constraint')) {
            throw error
          }
        }
      }

      if (enrolledCount > 0) {
        console.log(`✅ ${classItem.name}: Enrolled ${enrolledCount} students`)
      }

      // Add assignments (5-15 per class)
      const currentAssignmentCount = classItem._count.assignments
      const targetAssignmentCount = Math.floor(Math.random() * 10) + 5
      const assignmentsToCreate = Math.max(0, targetAssignmentCount - currentAssignmentCount)

      if (assignmentsToCreate > 0) {
        const teacher = await prisma.user.findFirst({
          where: { id: classItem.teacherId },
        })

        if (teacher) {
          for (let i = 1; i <= assignmentsToCreate; i++) {
            await prisma.assignment.create({
              data: {
                title: `Bài tập ${currentAssignmentCount + i} - ${classItem.name}`,
                description: `Mô tả bài tập ${currentAssignmentCount + i} cho lớp ${classItem.name}`,
                classId: classItem.id,
                teacherId: teacher.id,
                dueDate: new Date(Date.now() + (currentAssignmentCount + i) * 7 * 24 * 60 * 60 * 1000), // i weeks from now
              },
            })
          }
          console.log(`   └─ Created ${assignmentsToCreate} assignments`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Error enriching ${classItem.name}:`, error.message)
    }
  }

  console.log(`\n✅ Finished enriching demo classes`)
}

main()
  .catch((error) => {
    console.error('Error enriching demo classes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

