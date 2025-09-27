// 1️⃣ Load environment variables từ file .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

// 2️⃣ Khởi tạo Prisma Client
const prisma = new PrismaClient();

const studentNames = [
  "Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown",
  "Frank Miller", "Grace Lee", "Henry Taylor", "Ivy Chen", "Jack Anderson",
  "Kate Martinez", "Liam Thompson", "Maya Rodriguez", "Noah Garcia", "Olivia White",
  "Paul Jackson", "Quinn Harris", "Ruby Clark", "Sam Lewis", "Tina Walker",
  "Uma Hall", "Victor Young", "Wendy King", "Xavier Wright", "Yara Lopez",
  "Zoe Hill", "Adam Green", "Bella Adams", "Caleb Nelson", "Diana Carter",
  "Ethan Mitchell", "Fiona Perez", "Gabriel Roberts", "Hannah Turner", "Ian Phillips",
  "Julia Campbell", "Kyle Parker", "Luna Evans", "Max Edwards", "Nina Collins",
  "Oscar Stewart", "Penelope Sanchez", "Quentin Morris", "Riley Rogers", "Sophia Reed"
];

const generateEmail = (name) => {
  const [firstName, lastName] = name.toLowerCase().split(' ');
  return `${firstName}.${lastName}@student.test`;
};

async function createTestStudents() {
  try {
    console.log('🚀 Creating 45 test students...');
    
    // Check if students already exist
    const existingStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        email: {
          contains: '@student.test'
        }
      }
    });

    if (existingStudents > 0) {
      console.log(`⚠️  Found ${existingStudents} existing test students. Skipping creation.`);
      return;
    }

    const studentsData = studentNames.map((name, index) => ({
      name: name,
      email: generateEmail(name),
      password: 'password123', // Simple password for testing
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    console.log(`📝 Creating ${studentsData.length} students...`);
    
    // Create students in batches
    const batchSize = 10;
    for (let i = 0; i < studentsData.length; i += batchSize) {
      const batch = studentsData.slice(i, i + batchSize);
      
      await prisma.user.createMany({
        data: batch,
        skipDuplicates: true
      });
      
      console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(studentsData.length / batchSize)} (${batch.length} students)`);
    }

    console.log('🎉 Successfully created 45 test students!');
    
    // Verify creation
    const totalStudents = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });
    
    console.log(`📊 Total students in database: ${totalStudents}`);
    
    // Show some sample students
    const sampleStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        email: {
          contains: '@student.test'
        }
      },
      take: 5,
      select: {
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log('👥 Sample students created:');
    sampleStudents.forEach(student => {
      console.log(`   - ${student.name} (${student.email}) - Password: password123`);
    });
    
    console.log('');
    console.log('🔑 Login credentials for testing:');
    console.log('   Email: alice.johnson@student.test');
    console.log('   Password: password123');
    console.log('');
    console.log('📚 Next steps:');
    console.log('1. Visit /sign-in to login as student');
    console.log('2. Visit /dashboard to see student dashboard');
    console.log('3. Visit /search to browse courses');
    console.log('4. Enroll in the free tutorial course');
    
  } catch (error) {
    console.error('❌ Error creating test students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestStudents()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
