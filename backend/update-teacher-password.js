const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateTeacherPassword() {
  try {
    // 비밀번호를 teacher123!로 변경
    const hashedPassword = await bcrypt.hash('teacher123!', 10);
    
    const teacher = await prisma.user.update({
      where: {
        email: 'teacher1@test.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Teacher password updated to: teacher123!');
    console.log('   Email: teacher1@test.com');
    console.log('   Password: teacher123!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTeacherPassword();