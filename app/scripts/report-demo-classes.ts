/**
 * Report on demo classes in database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const classes = await prisma.class.findMany({
    where: {
      code: {
        in: ['JS101', 'PS201', 'FE102', 'JS202', 'SS301', 'PHP101', 'JS103', 'SQL201', 'PY101', 'WD301'],
      },
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
      teacher: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log('📊 BÁO CÁO DEMO CLASSES\n')
  console.log('='.repeat(60))
  console.log(`Tổng số classes: ${classes.length}`)
  
  const totalEnrollments = classes.reduce((sum, c) => sum + c._count.enrollments, 0)
  const totalAssignments = classes.reduce((sum, c) => sum + c._count.assignments, 0)
  
  console.log(`Tổng số enrollments: ${totalEnrollments}`)
  console.log(`Tổng số assignments: ${totalAssignments}`)
  console.log('='.repeat(60))
  console.log('\n📚 Chi tiết từng class:\n')

  classes.forEach((cls, idx) => {
    console.log(`${idx + 1}. ${cls.name} (${cls.code})`)
    console.log(`   - Teacher: ${cls.teacher.firstName} ${cls.teacher.lastName}`)
    console.log(`   - Students: ${cls._count.enrollments}`)
    console.log(`   - Materials: ${cls._count.assignments}`)
    console.log(`   - Description: ${cls.description || 'N/A'}`)
    console.log()
  })

  // Check total classes in database
  const allClasses = await prisma.class.findMany()
  console.log(`\n📊 Tổng số classes trong database: ${allClasses.length}`)
  
  // Check students
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  })
  console.log(`📊 Tổng số students: ${students.length}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

