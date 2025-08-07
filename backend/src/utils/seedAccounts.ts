import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed default accounts for testing and admin access
 * Admin: purusil55@gmail.com
 * Homepage: classapphub.com
 */
async function seedAccounts() {
  try {
    console.log('🌱 Creating default accounts...');

    // Admin account
    const adminPassword = await bcrypt.hash('alsk2004A!@#', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'purusil55@gmail.com' },
      update: {},
      create: {
        email: 'purusil55@gmail.com',
        password: adminPassword,
        name: '시스템 관리자',
        role: 'ADMIN',
        isActive: true,
        adminProfile: {
          create: {
            permissions: ['ALL'],
            lastAccessAt: new Date(),
            systemNotes: 'Primary system administrator - ClassAppHub.com'
          }
        }
      }
    });
    console.log('✅ Admin account created:', admin.email);

    // Teacher accounts
    for (let i = 1; i <= 3; i++) {
      const teacherPassword = await bcrypt.hash('teacher123!', 10);
      const teacher = await prisma.user.upsert({
        where: { email: `teacher${i}@test.com` },
        update: {},
        create: {
          email: `teacher${i}@test.com`,
          password: teacherPassword,
          name: `테스트 교사 ${i}`,
          role: 'TEACHER',
          isActive: true,
          teacherProfile: {
            create: {
              school: '테스트 초등학교',
              subject: i === 1 ? '국어' : i === 2 ? '수학' : '과학',
              grade: [5, 6],
              bio: `${i}번 테스트 교사 계정입니다.`,
              experience: 5 + i,
              certifications: ['초등교육 자격증', 'AI 활용 교육 수료']
            }
          }
        }
      });
      console.log(`✅ Teacher account created: ${teacher.email}`);
    }

    // Student accounts
    for (let i = 1; i <= 5; i++) {
      const studentPassword = await bcrypt.hash('student123!', 10);
      const student = await prisma.user.upsert({
        where: { email: `student${i}@test.com` },
        update: {},
        create: {
          email: `student${i}@test.com`,
          password: studentPassword,
          name: `테스트 학생 ${i}`,
          role: 'STUDENT',
          isActive: true,
          studentProfile: {
            create: {
              school: '테스트 초등학교',
              grade: 5,
              className: `5학년 ${Math.ceil(i / 2)}반`,
              studentId: `2024${String(i).padStart(4, '0')}`,
              parentEmail: `parent${i}@test.com`,
              parentPhone: `010-1234-${String(5000 + i).padStart(4, '0')}`
            }
          }
        }
      });
      console.log(`✅ Student account created: ${student.email}`);
    }

    // Create demo textbook for testing
    const teacher1 = await prisma.user.findUnique({
      where: { email: 'teacher1@test.com' }
    });

    if (teacher1) {
      const textbook = await prisma.textbook.upsert({
        where: { 
          id: 'demo-textbook-1'
        },
        update: {},
        create: {
          id: 'demo-textbook-1',
          title: 'AI 시대의 한국어 교육',
          description: 'OpenAI TTS를 활용한 차세대 한국어 학습 교재',
          subject: '국어',
          grade: 5,
          chapters: {
            create: [
              {
                order: 1,
                title: '1장: 한글의 아름다움',
                content: '한글은 세종대왕이 창제한 우리나라의 고유 문자입니다. 과학적이고 체계적인 원리로 만들어진 한글은 세계에서 가장 우수한 문자 체계 중 하나로 인정받고 있습니다.',
                questions: []
              },
              {
                order: 2,
                title: '2장: 시와 함께하는 감성 여행',
                content: '시는 짧은 문장 속에 깊은 의미와 감정을 담은 문학 장르입니다. 시를 읽으면서 우리는 작가의 마음을 이해하고, 우리 자신의 감정을 돌아볼 수 있습니다.',
                questions: []
              }
            ]
          },
          userId: teacher1.id,
          isPublic: true,
          metadata: {
            ttsEnabled: true,
            defaultVoice: 'nova',
            homepage: 'classapphub.com'
          }
        }
      });
      console.log('✅ Demo textbook created:', textbook.title);
    }

    console.log('\n📋 Account Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Account:');
    console.log('  Email: purusil55@gmail.com');
    console.log('  Password: alsk2004A!@#');
    console.log('  Homepage: classapphub.com');
    console.log('');
    console.log('Teacher Accounts:');
    console.log('  teacher1@test.com // teacher123!');
    console.log('  teacher2@test.com // teacher123!');
    console.log('  teacher3@test.com // teacher123!');
    console.log('');
    console.log('Student Accounts:');
    console.log('  student1@test.com // student123!');
    console.log('  student2@test.com // student123!');
    console.log('  student3@test.com // student123!');
    console.log('  student4@test.com // student123!');
    console.log('  student5@test.com // student123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedAccounts()
    .then(() => {
      console.log('✅ Account seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Account seeding failed:', error);
      process.exit(1);
    });
}

export default seedAccounts;