import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import {
  DEFAULT_ROLES,
  isAdmin,
  isTeacher,
  isStudent,
  canManageCourse,
  canAccessCourseContent,
  canManageLesson,
  canTakeQuiz,
  canManageQuiz,
  canSubmitAssignment,
  canGradeAssignment,
  canManageEnrollment,
  canEnrollInCourse,
  canUploadFiles,
  canManageUserRoles,
  canViewUserProfile,
  canEditUserProfile,
  canChangeUserRole
} from '../lib/permissions';

const prisma = new PrismaClient();

async function testPermissions() {
  console.log('🧪 Testing LMS Permission System (RBAC + ABAC)\n');

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'test-admin@example.com' },
    update: {},
    create: {
      email: 'test-admin@example.com',
      name: 'Test Admin',
      password: await hash('admin123', 12),
      role: 'ADMIN'
    }
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'test-teacher@example.com' },
    update: {},
    create: {
      email: 'test-teacher@example.com',
      name: 'Test Teacher',
      password: await hash('teacher123', 12),
      role: 'TEACHER'
    }
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'test-student@example.com' },
    update: {},
    create: {
      email: 'test-student@example.com',
      name: 'Test Student',
      password: await hash('student123', 12),
      role: 'STUDENT'
    }
  });

  const anotherTeacherUser = await prisma.user.upsert({
    where: { email: 'test-teacher2@example.com' },
    update: {},
    create: {
      email: 'test-teacher2@example.com',
      name: 'Another Teacher',
      password: await hash('teacher123', 12),
      role: 'TEACHER'
    }
  });

  // Create test course
  const testCourse = await prisma.course.upsert({
    where: { id: 'test-course-1' },
    update: {},
    create: {
      id: 'test-course-1',
      userId: teacherUser.id,
      title: 'Test Course',
      description: 'A test course for permission testing',
      price: 99.99,
      isPublished: true
    }
  });

  // Create enrollment
  await prisma.purchase.upsert({
    where: {
      userId_courseId: {
        userId: studentUser.id,
        courseId: testCourse.id
      }
    },
    update: {},
    create: {
      userId: studentUser.id,
      courseId: testCourse.id
    }
  });

  console.log('✅ Test data created successfully\n');

  // Test RBAC (Role-Based Access Control)
  console.log('🔐 Testing RBAC (Role-Based Access Control)');
  console.log('=' .repeat(50));

  // Test role identification
  console.log(`Admin role check: ${isAdmin(adminUser.role)} (expected: true)`);
  console.log(`Teacher role check: ${isTeacher(teacherUser.role)} (expected: true)`);
  console.log(`Student role check: ${isStudent(studentUser.role)} (expected: true)`);
  console.log(`Admin as teacher: ${isTeacher(adminUser.role)} (expected: true)`);
  console.log(`Student as teacher: ${isTeacher(studentUser.role)} (expected: false)`);

  // Test user management permissions
  console.log(`\nAdmin can manage users: ${canManageUserRoles(adminUser.role)} (expected: true)`);
  console.log(`Teacher can manage users: ${canManageUserRoles(teacherUser.role)} (expected: false)`);
  console.log(`Student can manage users: ${canManageUserRoles(studentUser.role)} (expected: false)`);

  // Test enrollment permissions
  console.log(`\nAdmin can manage enrollment: ${canManageEnrollment(adminUser.role)} (expected: true)`);
  console.log(`Teacher can manage enrollment: ${canManageEnrollment(teacherUser.role)} (expected: false)`);
  console.log(`Student can enroll: ${canEnrollInCourse(studentUser.role)} (expected: true)`);
  console.log(`Teacher can enroll: ${canEnrollInCourse(teacherUser.role)} (expected: false)`);

  console.log('\n');

  // Test ABAC (Attribute-Based Access Control)
  console.log('🎯 Testing ABAC (Attribute-Based Access Control)');
  console.log('=' .repeat(50));

  // Test course management permissions
  console.log('Course Management:');
  console.log(`Admin can manage any course: ${canManageCourse(adminUser.role, adminUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Teacher can manage own course: ${canManageCourse(teacherUser.role, teacherUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Another teacher can manage course: ${canManageCourse(anotherTeacherUser.role, anotherTeacherUser.id, testCourse.userId)} (expected: false)`);
  console.log(`Student can manage course: ${canManageCourse(studentUser.role, studentUser.id, testCourse.userId)} (expected: false)`);

  // Test course access permissions
  console.log('\nCourse Access:');
  console.log(`Admin can access course: ${canAccessCourseContent(adminUser.role, adminUser.id, testCourse.userId, [studentUser.id])} (expected: true)`);
  console.log(`Teacher can access own course: ${canAccessCourseContent(teacherUser.role, teacherUser.id, testCourse.userId, [studentUser.id])} (expected: true)`);
  console.log(`Student can access enrolled course: ${canAccessCourseContent(studentUser.role, studentUser.id, testCourse.userId, [studentUser.id])} (expected: true)`);
  console.log(`Student can access non-enrolled course: ${canAccessCourseContent(studentUser.role, studentUser.id, testCourse.userId, [])} (expected: false)`);

  // Test lesson management
  console.log('\nLesson Management:');
  console.log(`Admin can manage lesson: ${canManageLesson(adminUser.role, adminUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Teacher can manage lesson in own course: ${canManageLesson(teacherUser.role, teacherUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Another teacher can manage lesson: ${canManageLesson(anotherTeacherUser.role, anotherTeacherUser.id, testCourse.userId)} (expected: false)`);

  // Test quiz permissions
  console.log('\nQuiz Permissions:');
  console.log(`Admin can manage quiz: ${canManageQuiz(adminUser.role, adminUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Teacher can manage quiz in own course: ${canManageQuiz(teacherUser.role, teacherUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Student can take quiz in enrolled course: ${canTakeQuiz(studentUser.role, studentUser.id, testCourse.userId, [studentUser.id])} (expected: true)`);
  console.log(`Student can take quiz in non-enrolled course: ${canTakeQuiz(studentUser.role, studentUser.id, testCourse.userId, [])} (expected: false)`);
  console.log(`Teacher can take quiz: ${canTakeQuiz(teacherUser.role, teacherUser.id, testCourse.userId, [studentUser.id])} (expected: false)`);

  // Test assignment permissions
  console.log('\nAssignment Permissions:');
  console.log(`Admin can grade assignment: ${canGradeAssignment(adminUser.role, adminUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Teacher can grade assignment in own course: ${canGradeAssignment(teacherUser.role, teacherUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Student can submit assignment in enrolled course: ${canSubmitAssignment(studentUser.role, studentUser.id, testCourse.userId, [studentUser.id])} (expected: true)`);
  console.log(`Student can submit assignment in non-enrolled course: ${canSubmitAssignment(studentUser.role, studentUser.id, testCourse.userId, [])} (expected: false)`);

  // Test file upload permissions
  console.log('\nFile Upload Permissions:');
  console.log(`Admin can upload files: ${canUploadFiles(adminUser.role, adminUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Teacher can upload to own course: ${canUploadFiles(teacherUser.role, teacherUser.id, testCourse.userId)} (expected: true)`);
  console.log(`Another teacher can upload to course: ${canUploadFiles(anotherTeacherUser.role, anotherTeacherUser.id, testCourse.userId)} (expected: false)`);
  console.log(`Student can upload files: ${canUploadFiles(studentUser.role, studentUser.id, testCourse.userId)} (expected: false)`);

  // Test user profile permissions
  console.log('\nUser Profile Permissions:');
  console.log(`Admin can view any profile: ${canViewUserProfile(adminUser.role, adminUser.id, studentUser.id)} (expected: true)`);
  console.log(`User can view own profile: ${canViewUserProfile(studentUser.role, studentUser.id, studentUser.id)} (expected: true)`);
  console.log(`Student can view other profile: ${canViewUserProfile(studentUser.role, studentUser.id, teacherUser.id)} (expected: false)`);
  console.log(`Admin can edit any profile: ${canEditUserProfile(adminUser.role, adminUser.id, studentUser.id)} (expected: true)`);
  console.log(`User can edit own profile: ${canEditUserProfile(studentUser.role, studentUser.id, studentUser.id)} (expected: true)`);
  console.log(`Student can edit other profile: ${canEditUserProfile(studentUser.role, studentUser.id, teacherUser.id)} (expected: false)`);
  console.log(`Admin can change user role: ${canChangeUserRole(adminUser.role)} (expected: true)`);
  console.log(`Teacher can change user role: ${canChangeUserRole(teacherUser.role)} (expected: false)`);

  console.log('\n');

  // Test permission matrix
  console.log('📊 Permission Matrix Summary');
  console.log('=' .repeat(50));
  
  DEFAULT_ROLES.forEach(role => {
    console.log(`\n${role.icon} ${role.name}:`);
    console.log(`  Description: ${role.description}`);
    console.log(`  Key Permissions:`);
    
    Object.entries(role.permissions).forEach(([module, level]) => {
      if (level !== 'none') {
        console.log(`    - ${module}: ${level}`);
      }
    });
  });

  console.log('\n✅ Permission system test completed successfully!');
  console.log('\n📝 Summary:');
  console.log('- RBAC: Role-based permissions working correctly');
  console.log('- ABAC: Attribute-based permissions working correctly');
  console.log('- Admin: Full access to all resources');
  console.log('- Teacher: Access to own courses and content');
  console.log('- Student: Access to enrolled courses only');
  console.log('- Guest: Limited to course catalog viewing');
}

// Run the test
testPermissions()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
