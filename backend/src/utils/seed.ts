import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    // Create demo teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@example.com',
        password: teacherPassword,
        name: '김선생',
        role: 'TEACHER',
        teacherProfile: {
          create: {
            school: '데모초등학교',
            subject: '국어',
            grade: '3학년',
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });
    
    // Create demo students
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = await Promise.all([
      prisma.user.create({
        data: {
          email: 'student1@example.com',
          password: studentPassword,
          name: '이학생',
          role: 'STUDENT',
          studentProfile: {
            create: {
              studentId: 'STU001',
              school: '데모초등학교',
              grade: '3학년',
              className: '1반'
            }
          }
        },
        include: {
          studentProfile: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'student2@example.com',
          password: studentPassword,
          name: '박학생',
          role: 'STUDENT',
          studentProfile: {
            create: {
              studentId: 'STU002',
              school: '데모초등학교',
              grade: '3학년',
              className: '1반'
            }
          }
        },
        include: {
          studentProfile: true
        }
      }),
    ]);
    
    // Create demo class
    const demoClass = await prisma.class.create({
      data: {
        name: '3학년 1반',
        description: '2024학년도 3학년 1반 국어 수업',
        code: 'KOR301',
        teacherId: teacher.teacherProfile!.id,
        subject: '국어',
        grade: '3학년'
      },
    });
    
    // Add students to class via enrollments
    await prisma.classEnrollment.createMany({
      data: students.map(student => ({
        studentId: student.studentProfile!.id,
        classId: demoClass.id,
      })),
    });
    
    // Create demo textbook
    const textbook = await prisma.textbook.create({
      data: {
        title: '국어 3-1',
        authorId: teacher.teacherProfile!.id,
        isPublic: true,
        content: {
          chapters: [
            {
              id: 'ch1',
              title: '1. 재미있는 낱말',
              sections: [
                {
                  id: 'sec1-1',
                  title: '낱말의 뜻',
                  content: '낱말은 우리가 생각을 나타내는 가장 작은 단위입니다...',
                  pages: [
                    {
                      pageNumber: 1,
                      content: '낱말의 세계로 떠나는 여행',
                      exercises: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        aiSettings: {
          difficulty: 'medium',
          includeExercises: true,
          includeImages: true,
        },
      },
    });
    
    // Assign textbook to class
    await prisma.classTextbook.create({
      data: {
        classId: demoClass.id,
        textbookId: textbook.id,
      },
    });
    
    // Create demo assignment
    await prisma.assignment.create({
      data: {
        title: '일기 쓰기',
        description: '오늘 있었던 일을 일기로 써 보세요',
        type: 'ESSAY',
        classId: demoClass.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        points: 100,
      },
    });
    
    logger.info('Database seeding completed successfully');
    logger.info('Demo accounts created:');
    logger.info('Teacher - email: teacher@example.com, password: teacher123');
    logger.info('Student - email: student1@example.com, password: student123');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}