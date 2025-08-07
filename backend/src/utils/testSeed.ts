import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testSeed() {
  try {
    console.log('🌱 Starting test database seeding...');

    // Clean existing data
    await prisma.guestChatMessage.deleteMany();
    await prisma.guestStudyRecord.deleteMany();
    await prisma.guestAccess.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.assignmentSubmission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.studyRecord.deleteMany();
    await prisma.classTextbook.deleteMany();
    await prisma.classMember.deleteMany();
    await prisma.class.deleteMany();
    await prisma.textbook.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        password: hashedPassword,
        name: '테스트 선생님',
        role: 'TEACHER',
      },
    });

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password: hashedPassword,
        name: '테스트 학생',
        role: 'STUDENT',
      },
    });

    // Create test textbook
    const textbook = await prisma.textbook.create({
      data: {
        title: '테스트 국어 교과서',
        subject: '국어',
        grade: 3,
        teacherId: teacher.id,
        isPublished: true,
        isPublic: true,
        accessCode: 'TEST123',
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
      },
    });

    // Add members to class
    await prisma.classMember.createMany({
      data: [
        {
          userId: teacher.id,
          classId: testClass.id,
          role: 'TEACHER',
        },
        {
          userId: student.id,
          classId: testClass.id,
          role: 'STUDENT',
        },
      ],
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
        textbookId: textbook.id,
        studentId: '20241234',
        studentName: '테스트 게스트',
        sessionId: 'test-session-123',
      },
    });

    console.log('✅ Test database seeded successfully!');
    console.log('📚 Created:');
    console.log(`  - Teacher: ${teacher.email}`);
    console.log(`  - Student: ${student.email}`);
    console.log(`  - Textbook: ${textbook.title} (Access Code: ${textbook.accessCode})`);
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