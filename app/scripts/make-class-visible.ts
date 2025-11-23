/**
 * Script to make the AI class visible to all users
 * - Assigns class to first ADMIN/TEACHER user
 * - Enrolls all users as students
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeClassVisible() {
  try {
    // Find the AI class
    const allClasses = await prisma.class.findMany()
    const aiClass = allClasses.find(
      (c) => c.name.toLowerCase().includes('ai')
    ) || allClasses[0]

    if (!aiClass) {
      console.log('Không tìm thấy lớp học AI')
      return
    }

    console.log(`Tìm thấy lớp học: ${aiClass.name} (ID: ${aiClass.id})`)

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    console.log(`\nTìm thấy ${allUsers.length} users trong hệ thống`)

    // Assign class to first ADMIN or TEACHER
    const adminOrTeacher = allUsers.find(
      (u) => u.role === 'ADMIN' || u.role === 'TEACHER'
    )

    if (adminOrTeacher && aiClass.teacherId !== adminOrTeacher.id) {
      await prisma.class.update({
        where: { id: aiClass.id },
        data: { teacherId: adminOrTeacher.id },
      })
      console.log(
        `\n✅ Đã gán lớp học cho: ${adminOrTeacher.firstName} ${adminOrTeacher.lastName} (${adminOrTeacher.email}) - Role: ${adminOrTeacher.role}`
      )
    } else if (adminOrTeacher) {
      console.log(
        `\n✅ Lớp học đã được gán cho: ${adminOrTeacher.firstName} ${adminOrTeacher.lastName} (${adminOrTeacher.email})`
      )
    }

    // Enroll all users as students
    let enrolledCount = 0
    for (const user of allUsers) {
      // Check if already enrolled
      const existing = await prisma.classEnrollment.findUnique({
        where: {
          userId_classId: {
            userId: user.id,
            classId: aiClass.id,
          },
        },
      })

      if (!existing) {
        await prisma.classEnrollment.create({
          data: {
            userId: user.id,
            classId: aiClass.id,
          },
        })
        enrolledCount++
        console.log(
          `  ✓ Đã enroll: ${user.firstName} ${user.lastName} (${user.email})`
        )
      }
    }

    console.log(`\n✅ Đã enroll ${enrolledCount} users vào lớp học`)
    console.log(`\n📝 Tóm tắt:`)
    console.log(`   - Lớp học: ${aiClass.name}`)
    console.log(`   - Giáo viên: ${adminOrTeacher?.firstName} ${adminOrTeacher?.lastName || 'N/A'}`)
    console.log(`   - Tổng số học viên: ${allUsers.length}`)
    console.log(`\n💡 Bây giờ tất cả users đều có thể xem lớp học này!`)
  } catch (error) {
    console.error('Lỗi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeClassVisible()

