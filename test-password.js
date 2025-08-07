const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'teacher1@test.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    const password = 'teacher123!';
    const isValid = await bcrypt.compare(password, user.password);
    
    console.log('Password test:');
    console.log('- Input:', password);
    console.log('- Hash valid:', isValid);
    
    // 새로운 해시 생성해서 업데이트
    if (!isValid) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email: 'teacher1@test.com' },
        data: { password: newHash }
      });
      console.log('✅ Password updated with new hash');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();