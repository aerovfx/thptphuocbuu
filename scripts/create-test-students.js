const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

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

const generateStudentData = () => {
  return studentNames.map((name, index) => ({
    name: name,
    email: generateEmail(name),
    password: bcrypt.hashSync('password123', 10),
    role: 'STUDENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add some random student data
    studentData: {
      studentId: `STU${String(index + 1).padStart(3, '0')}`,
      enrollmentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
      grade: Math.floor(Math.random() * 12) + 1, // Grade 1-12
      major: ['Mathematics', 'Computer Science', 'Engineering', 'Physics', 'Chemistry'][Math.floor(Math.random() * 5)],
      gpa: (Math.random() * 2 + 2).toFixed(2), // GPA between 2.0-4.0
      credits: Math.floor(Math.random() * 60) + 30, // 30-90 credits
      status: ['Active', 'Active', 'Active', 'Probation'][Math.floor(Math.random() * 4)], // Mostly active
      phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      address: `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak Ave', 'Pine Rd', 'Cedar Blvd', 'Maple Dr'][Math.floor(Math.random() * 5)]}`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'][Math.floor(Math.random() * 8)],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA'][Math.floor(Math.random() * 8)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      emergencyContact: `${name.split(' ')[0]} Parent`,
      emergencyPhone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      notes: `Test student created for system testing - ${new Date().toISOString()}`
    }
  }));
};

async function createTestStudents() {
  try {
    console.log('🚀 Starting to create 45 test students...');
    
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

    const studentsData = generateStudentData();
    
    console.log(`📝 Creating ${studentsData.length} students...`);
    
    // Create students in batches to avoid overwhelming the database
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
      console.log(`   - ${student.name} (${student.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test students:', error);
    throw error;
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


