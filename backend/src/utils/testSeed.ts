import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testSeed() {
  try {
    console.log('🌱 Starting test database seeding...');

    // Clean existing data
    await prisma.guestAccess.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.studyRecord.deleteMany();
    await prisma.classTextbook.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.textbook.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        password: hashedPassword,
        name: '테스트 선생님',
        role: 'TEACHER',
        teacherProfile: {
          create: {
            school: '테스트초등학교',
            subject: '국어',
            grade: '3학년'
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password: hashedPassword,
        name: '테스트 학생',
        role: 'STUDENT',
        studentProfile: {
          create: {
            studentId: 'TEST001',
            school: '테스트초등학교',
            grade: '3학년',
            className: '1반'
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    // Create test textbook
    const textbook = await prisma.textbook.create({
      data: {
        title: '테스트 국어 교과서',
        authorId: teacher.teacherProfile!.id,
        isPublic: true,
        content: {
          chapters: [
            {
              id: 'chapter1',
              title: '첫 번째 단원',
              pages: [
                {
                  id: 'page1',
                  title: '시작하기',
                  content: '안녕하세요! 첫 번째 페이지입니다.',
                  type: 'text',
                },
                {
                  id: 'page2',
                  title: '계속하기',
                  content: '두 번째 페이지입니다.',
                  type: 'text',
                },
              ],
            },
          ],
        },
        aiSettings: {
          difficulty: 'medium',
          includeExercises: true,
          includeImages: false,
        },
      },
    });

    // Create test class
    const testClass = await prisma.class.create({
      data: {
        name: '테스트 3학년 1반',
        description: '테스트용 학급입니다',
        code: 'TEST3-1',
        teacherId: teacher.teacherProfile!.id,
        subject: '국어',
        grade: '3학년'
      },
    });

    // Add student to class
    await prisma.classEnrollment.create({
      data: {
        studentId: student.studentProfile!.id,
        classId: testClass.id,
      },
    });

    // Assign textbook to class
    await prisma.classTextbook.create({
      data: {
        classId: testClass.id,
        textbookId: textbook.id,
      },
    });

    // Create guest access for testing
    await prisma.guestAccess.create({
      data: {
        accessCode: 'TESTGUEST123',
        textbookId: textbook.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        maxQuestions: 10,
        metadata: {
          studentName: '테스트 게스트',
          sessionId: 'test-session-123'
        }
      },
    });

    console.log('✅ Test database seeded successfully!');
    console.log('📚 Created:');
    console.log(`  - Teacher: ${teacher.email}`);
    console.log(`  - Student: ${student.email}`);
    console.log(`  - Textbook: ${textbook.title}`);
    console.log(`  - Class: ${testClass.name}`);
  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default testSeed;