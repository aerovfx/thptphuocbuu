import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@thptphuocbuu.edu.vn' },
    update: {},
    create: {
      email: 'admin@thptphuocbuu.edu.vn',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'THPT Phước Bửu',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff',
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create a teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10)

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@thptphuocbuu.edu.vn' },
    update: {},
    create: {
      email: 'teacher@thptphuocbuu.edu.vn',
      password: teacherPassword,
      firstName: 'Giáo viên',
      lastName: 'Mẫu',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      avatar: 'https://ui-avatars.com/api/?name=Teacher&background=10B981&color=fff',
    },
  })

  console.log('✅ Created teacher user:', teacher.email)

  // Create a student user
  const studentPassword = await bcrypt.hash('student123', 10)

  const student = await prisma.user.upsert({
    where: { email: 'student@thptphuocbuu.edu.vn' },
    update: {},
    create: {
      email: 'student@thptphuocbuu.edu.vn',
      password: studentPassword,
      firstName: 'Học sinh',
      lastName: 'Mẫu',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      avatar: 'https://ui-avatars.com/api/?name=Student&background=F59E0B&color=fff',
    },
  })

  console.log('✅ Created student user:', student.email)

  // Create sample posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Chào mừng các bạn đến với hệ thống LMS của THPT Phước Bửu! 🎉\n\nHệ thống đã được khôi phục và hoạt động trở lại với database mới trên Neon PostgreSQL.',
      type: 'TEXT',
      authorId: admin.id,
    },
  })

  console.log('✅ Created sample post 1')

  const post2 = await prisma.post.create({
    data: {
      content: 'Thông báo: Hệ thống đã migrate sang database mới. Mọi chức năng hoạt động bình thường. 📚',
      type: 'TEXT',
      authorId: teacher.id,
    },
  })

  console.log('✅ Created sample post 2')

  // Create a sample like
  await prisma.like.create({
    data: {
      postId: post1.id,
      userId: student.id,
    },
  })

  console.log('✅ Created sample like')

  // Create a sample comment
  await prisma.comment.create({
    data: {
      content: 'Rất vui được tham gia hệ thống mới! 😊',
      postId: post1.id,
      authorId: student.id,
    },
  })

  console.log('✅ Created sample comment')

  console.log('\n🎉 Seed completed successfully!\n')
  console.log('📝 Login credentials:')
  console.log('━'.repeat(50))
  console.log('👤 Admin:')
  console.log('   Email:    admin@thptphuocbuu.edu.vn')
  console.log('   Password: admin123')
  console.log('')
  console.log('👨‍🏫 Teacher:')
  console.log('   Email:    teacher@thptphuocbuu.edu.vn')
  console.log('   Password: teacher123')
  console.log('')
  console.log('👨‍🎓 Student:')
  console.log('   Email:    student@thptphuocbuu.edu.vn')
  console.log('   Password: student123')
  console.log('━'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
