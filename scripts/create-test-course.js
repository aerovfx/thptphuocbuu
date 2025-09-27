// 1️⃣ Load environment variables từ file .env.local
require('dotenv').config({ path: '.env.local' });  // Load từ .env.local

const { PrismaClient } = require('@prisma/client');

// 2️⃣ Khởi tạo Prisma Client, sử dụng DATABASE_URL từ .env
const prisma = new PrismaClient();

async function createTestCourse() {
  try {
    console.log('🚀 Setting up test course...');

    // Category
    const categoryId = 'tutorial';
    let category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
       category = await prisma.category.create({
         data: { id: categoryId, name: 'Hướng Dẫn' },
       });
      console.log(`✅ Created category "${category.name}"`);
    } else {
      console.log(`✅ Category "${category.name}" already exists`);
    }

    // Teacher
    let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          name: 'Giáo viên mẫu',
          email: 'teacher@example.com',
          password: process.env.DEFAULT_TEACHER_PASSWORD || '123456', // password từ .env
          role: 'TEACHER',
        },
      });
      console.log(`✅ Created test teacher: ${teacher.name} (${teacher.email})`);
    } else {
      console.log(`👨‍🏫 Using existing teacher: ${teacher.name} (${teacher.email})`);
    }

    // Create test course
    const testCourse = await prisma.course.create({
      data: {
        title: 'Hướng Dẫn Sử Dụng LMS - Học Toán Online',
        description: 'Khóa học hướng dẫn sử dụng LMS...',
        imageUrl: 'https://storage.googleapis.com/mathvideostore/course-images/tutorial-course.jpg',
         price: 0,
         categoryId,
         userId: teacher.id,
         isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        chapters: {
          create: [
            {
              title: 'Chào mừng và Giới thiệu',
              description: 'Video chào mừng và giới thiệu tổng quan về nền tảng học tập',
              position: 1,
              isPublished: true,
              isFree: true,
              videoUrl: 'https://storage.googleapis.com/mathvideostore/videos/welcome-video.mp4',
            },
            {
              title: 'Hướng dẫn Dashboard Học sinh',
              description: 'Tìm hiểu cách sử dụng dashboard để theo dõi tiến độ học tập',
              position: 2,
              isPublished: true,
              isFree: true,
              videoUrl: 'https://storage.googleapis.com/mathvideostore/videos/dashboard-tutorial.mp4',
            },
          ],
        },
       }
     });

    console.log('✅ Test course created successfully!');
    console.log(`📚 Course: ${testCourse.title}`);
    console.log(`💰 Price: $${testCourse.price}`);
    console.log(`🔗 Course ID: ${testCourse.id}`);

  } catch (error) {
    console.error('❌ Error creating test course:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
createTestCourse()
  .then(() => console.log('✨ Script completed successfully!'))
  .catch(() => process.exit(1));