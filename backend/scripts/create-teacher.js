const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTeacher() {
  try {
    console.log('🎓 Creating teacher account...');
    
    // Check if teacher already exists
    const existingTeacher = await prisma.user.findUnique({
      where: { email: 'teacher@digitalbook.com' }
    });
    
    if (existingTeacher) {
      console.log('✅ Teacher account already exists');
      console.log('Email: teacher@digitalbook.com');
      console.log('ID:', existingTeacher.id);
      return existingTeacher;
    }
    
    // Create teacher account
    const hashedPassword = await bcrypt.hash('Teacher123!', 12);
    
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@digitalbook.com',
        password: hashedPassword,
        name: '김선생님',
        role: 'TEACHER',
        isActive: true,
        teacherProfile: {
          create: {
            school: '서울초등학교',
            subject: '국어',
            grade: '5학년',
            bio: '10년 경력의 국어 교사입니다. 학생들과 함께 성장하는 것을 좋아합니다.'
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });
    
    console.log('✅ Teacher account created successfully!');
    console.log('===================================');
    console.log('Email: teacher@digitalbook.com');
    console.log('Password: Teacher123!');
    console.log('Name:', teacher.name);
    console.log('ID:', teacher.id);
    console.log('School:', teacher.teacherProfile.school);
    console.log('Subject:', teacher.teacherProfile.subject);
    console.log('Grade:', teacher.teacherProfile.grade);
    console.log('===================================');
    
    return teacher;
  } catch (error) {
    console.error('❌ Error creating teacher:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createTeacher()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createTeacher };