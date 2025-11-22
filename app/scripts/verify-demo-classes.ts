/**
 * Verify demo classes were created
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
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`📊 Found ${classes.length} demo classes:\n`)

  for (const cls of classes) {
    console.log(`${cls.name} (${cls.code})`)
    console.log(`  - Students: ${cls._count.enrollments}`)
    console.log(`  - Assignments: ${cls._count.assignments}`)
    console.log()
  }

  const allClasses = await prisma.class.findMany({
    orderBy: { createdAt: 'desc' },
  })

  console.log(`\n📊 Total classes in database: ${allClasses.length}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

