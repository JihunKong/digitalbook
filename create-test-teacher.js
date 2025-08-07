const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestTeacher() {
  try {
    const hashedPassword = await bcrypt.hash('Teacher123!', 10);
    
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher1@test.com',
        password: hashedPassword,
        name: '김민정',
        role: 'TEACHER',
        isActive: true,
        teacherProfile: {
          create: {
            school: '서울초등학교',
            subject: '국어',
            grade: '5학년'
          }
        }
      }
    });
    
    console.log('✅ Teacher account created:', teacher.email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Teacher account already exists');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestTeacher();