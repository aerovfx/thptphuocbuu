/**
 * Seed demo lessons for classes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Demo lessons data for different class types
const lessonsData: Record<string, Array<{ chapter: string; lessons: Array<{ title: string; description: string; content: string; duration: number }> }>> = {
  JS101: [
    {
      chapter: 'Introduction',
      lessons: [
        {
          title: 'Introducing the library and how it works',
          description: 'Learn the fundamentals of JavaScript and its core concepts',
          content: `
            <h2>What is JavaScript?</h2>
            <p>JavaScript is a high-level, interpreted programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS.</p>
            <p>JavaScript enables interactive web pages and is an essential part of web applications. The vast majority of websites use it for client-side page behavior, and all major web browsers have a dedicated JavaScript engine to execute it.</p>
            <h3>Key Features:</h3>
            <ul>
              <li>Dynamic typing</li>
              <li>Prototype-based object orientation</li>
              <li>First-class functions</li>
              <li>Event-driven programming</li>
            </ul>
          `,
          duration: 15,
        },
        {
          title: 'Get the sample code',
          description: 'Where to find the sample code and how to access it',
          content: `
            <h2>Getting Started with Sample Code</h2>
            <p>To get started with JavaScript, you'll need access to sample code and examples. Here's how to find and use them:</p>
            <h3>GitHub Repository</h3>
            <p>All sample code is available in our GitHub repository. Clone it using:</p>
            <pre><code>git clone https://github.com/example/js-samples.git</code></pre>
            <h3>CodeSandbox</h3>
            <p>For quick experiments, use CodeSandbox. It provides an online editor with instant preview.</p>
          `,
          duration: 10,
        },
        {
          title: 'Create a Firebase project and Set up your app',
          description: 'How to create a basic Firebase project and how to run it locally',
          content: `
            <h2>Firebase Setup</h2>
            <p>Firebase is a platform developed by Google for creating mobile and web applications. Let's set up your first Firebase project.</p>
            <h3>Step 1: Create a Firebase Project</h3>
            <ol>
              <li>Go to the Firebase Console</li>
              <li>Click "Add Project"</li>
              <li>Enter your project name</li>
              <li>Follow the setup wizard</li>
            </ol>
            <h3>Step 2: Install Firebase SDK</h3>
            <pre><code>npm install firebase</code></pre>
            <h3>Step 3: Initialize Firebase</h3>
            <pre><code>import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);</code></pre>
          `,
          duration: 20,
        },
      ],
    },
    {
      chapter: 'JavaScript Basics',
      lessons: [
        {
          title: 'Variables and Data Types',
          description: 'Understanding variables, let, const, and data types',
          content: `<h2>Variables in JavaScript</h2><p>JavaScript has three ways to declare variables: var, let, and const.</p>`,
          duration: 15,
        },
        {
          title: 'Functions and Scope',
          description: 'Learn about function declarations, arrow functions, and scope',
          content: `<h2>Functions</h2><p>Functions are one of the fundamental building blocks in JavaScript.</p>`,
          duration: 20,
        },
      ],
    },
  ],
  PS201: [
    {
      chapter: 'Problem Solving Fundamentals',
      lessons: [
        {
          title: 'Introduction to Problem Solving',
          description: 'Learn the basic approach to solving complex problems',
          content: `<h2>Problem Solving Approach</h2><p>Effective problem solving requires a systematic approach.</p>`,
          duration: 15,
        },
        {
          title: 'Algorithm Design',
          description: 'Understanding algorithms and their design principles',
          content: `<h2>Algorithm Design</h2><p>Algorithms are step-by-step procedures for solving problems.</p>`,
          duration: 25,
        },
      ],
    },
  ],
  FE102: [
    {
      chapter: 'HTML Fundamentals',
      lessons: [
        {
          title: 'HTML Structure',
          description: 'Learn the basic structure of HTML documents',
          content: `<h2>HTML Basics</h2><p>HTML is the standard markup language for creating web pages.</p>`,
          duration: 15,
        },
        {
          title: 'CSS Styling',
          description: 'Introduction to CSS and styling web pages',
          content: `<h2>CSS Introduction</h2><p>CSS is used to style and layout web pages.</p>`,
          duration: 20,
        },
      ],
    },
  ],
}

async function main() {
  console.log('🌱 Seeding lessons for classes...')

  // Get all classes
  const allClasses = await prisma.class.findMany()

  // First, process classes with specific lesson data
  const classesWithSpecificLessons = allClasses.filter((c) => lessonsData[c.code])
  
  for (const classItem of classesWithSpecificLessons) {
    const classLessons = lessonsData[classItem.code]
    if (!classLessons) continue

    console.log(`\n📚 Processing class: ${classItem.name} (${classItem.code})`)

    // Delete existing chapters and lessons for this class
    await prisma.lesson.deleteMany({
      where: {
        chapter: {
          classId: classItem.id,
        },
      },
    })
    await prisma.chapter.deleteMany({
      where: {
        classId: classItem.id,
      },
    })

    // Create chapters and lessons
    for (let chapterIndex = 0; chapterIndex < classLessons.length; chapterIndex++) {
      const chapterData = classLessons[chapterIndex]
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.chapter,
          description: `Chapter ${chapterIndex + 1}: ${chapterData.chapter}`,
          order: chapterIndex,
          classId: classItem.id,
        },
      })

      console.log(`  ✅ Created chapter: ${chapter.title}`)

      for (let lessonIndex = 0; lessonIndex < chapterData.lessons.length; lessonIndex++) {
        const lessonData = chapterData.lessons[lessonIndex]
        await prisma.lesson.create({
          data: {
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            order: lessonIndex,
            duration: lessonData.duration,
            chapterId: chapter.id,
          },
        })
        console.log(`    ✅ Created lesson: ${lessonData.title}`)
      }
    }
  }

  // Create lessons for other classes with generic content
  const otherClasses = allClasses.filter((c) => !lessonsData[c.code])

  for (const classItem of otherClasses) {
    console.log(`\n📚 Processing class: ${classItem.name} (${classItem.code})`)

    // Create a default chapter
    const chapter = await prisma.chapter.create({
      data: {
        title: 'Introduction',
        description: 'Introduction to the course',
        order: 0,
        classId: classItem.id,
      },
    })

    // Create 3-5 default lessons
    const lessonTitles = [
      'Getting Started',
      'Core Concepts',
      'Advanced Topics',
      'Practice Exercises',
      'Final Project',
    ]

    for (let i = 0; i < Math.min(5, lessonTitles.length); i++) {
      await prisma.lesson.create({
        data: {
          title: lessonTitles[i],
          description: `Learn about ${lessonTitles[i].toLowerCase()}`,
          content: `<h2>${lessonTitles[i]}</h2><p>This lesson covers the fundamentals of ${lessonTitles[i].toLowerCase()}.</p>`,
          order: i,
          duration: 15 + i * 5,
          chapterId: chapter.id,
        },
      })
    }
    console.log(`  ✅ Created ${Math.min(5, lessonTitles.length)} lessons`)
  }

  console.log('\n✅ Finished seeding lessons!')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

