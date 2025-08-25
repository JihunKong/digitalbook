const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createStudents() {
  try {
    console.log('👩‍🎓 Creating student accounts...');
    
    const students = [
      {
        email: 'student1@test.com',
        name: '이학생',
        studentId: 'S2025001',
        className: '5학년 1반'
      },
      {
        email: 'student2@test.com',
        name: '박학생',
        studentId: 'S2025002',
        className: '5학년 1반'
      },
      {
        email: 'student3@test.com',
        name: '김학생',
        studentId: 'S2025003',
        className: '5학년 1반'
      }
    ];
    
    const hashedPassword = await bcrypt.hash('Student123!', 12);
    const createdStudents = [];
    
    for (const studentData of students) {
      // Check if student already exists
      const existing = await prisma.user.findUnique({
        where: { email: studentData.email }
      });
      
      if (existing) {
        console.log(`✓ Student ${studentData.name} already exists`);
        createdStudents.push(existing);
        continue;
      }
      
      // Create new student
      const student = await prisma.user.create({
        data: {
          email: studentData.email,
          password: hashedPassword,
          name: studentData.name,
          role: 'STUDENT',
          isActive: true,
          studentProfile: {
            create: {
              studentId: studentData.studentId,
              school: '서울초등학교',
              grade: '5',
              className: studentData.className
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
      
      createdStudents.push(student);
      console.log(`✅ Created student: ${student.name} (${student.email})`);
    }
    
    console.log('\n===================================');
    console.log('📚 Student Accounts Summary:');
    console.log('===================================');
    console.log('Password for all: Student123!\n');
    
    createdStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Student ID: ${student.studentProfile?.studentId}`);
      console.log(`  Class: ${student.studentProfile?.className}`);
      console.log(`  User ID: ${student.id}`);
      console.log('');
    });
    
    console.log('===================================');
    
    return createdStudents;
  } catch (error) {
    console.error('❌ Error creating students:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createStudents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createStudents };