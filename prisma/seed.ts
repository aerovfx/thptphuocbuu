import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const algebraCategory = await prisma.category.upsert({
    where: { name: 'Algebra' },
    update: {},
    create: {
      name: 'Algebra',
    },
  })

  const geometryCategory = await prisma.category.upsert({
    where: { name: 'Geometry' },
    update: {},
    create: {
      name: 'Geometry',
    },
  })

  const calculusCategory = await prisma.category.upsert({
    where: { name: 'Calculus' },
    update: {},
    create: {
      name: 'Calculus',
    },
  })

  // Create multiple test users
  const users = [
    {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123',
      role: 'ADMIN' as const,
    },
    {
      email: 'teacher@example.com',
      name: 'John Teacher',
      password: 'teacher123',
      role: 'TEACHER' as const,
    },
    {
      email: 'teacher2@example.com',
      name: 'Sarah Teacher',
      password: 'teacher123',
      role: 'TEACHER' as const,
    },
    {
      email: 'student@example.com',
      name: 'Alice Student',
      password: 'student123',
      role: 'STUDENT' as const,
    },
    {
      email: 'student2@example.com',
      name: 'Bob Student',
      password: 'student123',
      role: 'STUDENT' as const,
    },
    {
      email: 'student3@example.com',
      name: 'Charlie Student',
      password: 'student123',
      role: 'STUDENT' as const,
    },
    {
      email: 'student4@example.com',
      name: 'Diana Student',
      password: 'student123',
      role: 'STUDENT' as const,
    },
  ]

  const createdUsers = []
  for (const user of users) {
    const hashedPassword = await hash(user.password, 12)
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    })
    createdUsers.push(createdUser)
    console.log(`✅ Created user: ${user.name} (${user.role})`)
  }

  const teacher = createdUsers.find(u => u.email === 'teacher@example.com')!
  const student = createdUsers.find(u => u.email === 'student@example.com')!

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course-1' },
    update: {},
    create: {
      id: 'course-1',
      title: 'Introduction to Algebra',
      description: 'Learn the fundamentals of algebra including variables, equations, and functions.',
      price: 49.99,
      isPublished: true,
      userId: teacher.id,
      categoryId: algebraCategory.id,
    },
  })

  const course2 = await prisma.course.upsert({
    where: { id: 'course-2' },
    update: {},
    create: {
      id: 'course-2',
      title: 'Basic Geometry',
      description: 'Explore shapes, angles, and spatial relationships in geometry.',
      price: 39.99,
      isPublished: true,
      userId: teacher.id,
      categoryId: geometryCategory.id,
    },
  })

  // Create sample chapters
  await prisma.chapter.upsert({
    where: { id: 'chapter-1' },
    update: {},
    create: {
      id: 'chapter-1',
      title: 'Variables and Expressions',
      description: 'Understanding what variables are and how to work with algebraic expressions.',
      position: 1,
      isPublished: true,
      isFree: true,
      courseId: course1.id,
    },
  })

  await prisma.chapter.upsert({
    where: { id: 'chapter-2' },
    update: {},
    create: {
      id: 'chapter-2',
      title: 'Solving Linear Equations',
      description: 'Learn how to solve equations with one variable.',
      position: 2,
      isPublished: true,
      isFree: false,
      courseId: course1.id,
    },
  })

  await prisma.chapter.upsert({
    where: { id: 'chapter-3' },
    update: {},
    create: {
      id: 'chapter-3',
      title: 'Points and Lines',
      description: 'Understanding basic geometric concepts of points and lines.',
      position: 1,
      isPublished: true,
      isFree: true,
      courseId: course2.id,
    },
  })

  console.log('🎉 Database seeded successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('   Admin: admin@example.com / admin123')
  console.log('   Teacher: teacher@example.com / teacher123')
  console.log('   Teacher 2: teacher2@example.com / teacher123')
  console.log('   Student: student@example.com / student123')
  console.log('   Student 2: student2@example.com / student123')
  console.log('   Student 3: student3@example.com / student123')
  console.log('   Student 4: student4@example.com / student123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
