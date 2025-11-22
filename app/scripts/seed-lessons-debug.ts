/**
 * Seed demo lessons for classes - Debug version
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding lessons for classes...')

  // Get all classes
  const allClasses = await prisma.class.findMany()
  console.log(`📊 Found ${allClasses.length} total classes`)
  console.log(`   Classes: ${allClasses.map(c => c.code).join(', ')}`)

  // Check if chapters table exists
  try {
    const chapterCount = await prisma.chapter.count()
    console.log(`📚 Existing chapters: ${chapterCount}`)
  } catch (error: any) {
    console.error('❌ Error accessing chapters:', error.message)
    return
  }

  // Get JS101 class
  const js101Class = await prisma.class.findFirst({
    where: { code: 'JS101' },
  })

  if (!js101Class) {
    console.log('❌ JS101 class not found')
    return
  }

  console.log(`\n📚 Processing class: ${js101Class.name} (${js101Class.code})`)

  // Create a test chapter
  try {
    const chapter = await prisma.chapter.create({
      data: {
        title: 'Introduction',
        description: 'Introduction chapter',
        order: 0,
        classId: js101Class.id,
      },
    })
    console.log(`  ✅ Created chapter: ${chapter.title} (${chapter.id})`)

    // Create a test lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Introducing the library and how it works',
        description: 'Learn the fundamentals',
        content: '<h2>What is JavaScript?</h2><p>JavaScript is a programming language.</p>',
        order: 0,
        duration: 15,
        chapterId: chapter.id,
      },
    })
    console.log(`  ✅ Created lesson: ${lesson.title} (${lesson.id})`)
  } catch (error: any) {
    console.error('❌ Error creating chapter/lesson:', error.message)
  }

  console.log('\n✅ Finished!')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

