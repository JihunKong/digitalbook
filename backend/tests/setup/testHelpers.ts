import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './testDatabase';

export interface TestUser {
  user: User;
  token: string;
}

export async function createTestUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
}): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );

  return { user, token };
}

export async function createTestClass(teacherId: string, data?: {
  name?: string;
  description?: string;
}) {
  const classData = await prisma.class.create({
    data: {
      name: data?.name || 'Test Class',
      description: data?.description || 'Test class description',
      code: `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`,
      members: {
        create: {
          userId: teacherId,
          role: 'TEACHER',
        },
      },
    },
    include: {
      members: true,
    },
  });

  return classData;
}

export async function createTestTextbook(teacherId: string, data?: {
  title?: string;
  subject?: string;
  grade?: number;
  isPublic?: boolean;
}) {
  const textbook = await prisma.textbook.create({
    data: {
      title: data?.title || 'Test Textbook',
      subject: data?.subject || 'Korean',
      grade: data?.grade || 5,
      isPublic: data?.isPublic || false,
      isPublished: true,
      teacherId,
      content: {
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            sections: [
              {
                id: 'section-1',
                title: 'Section 1',
                content: 'Test content',
              },
            ],
          },
        ],
      },
      aiSettings: {
        model: 'gpt-4',
        temperature: 0.7,
      },
    },
  });

  return textbook;
}

export async function createTestAssignment(
  teacherId: string,
  classId: string,
  data?: {
    title?: string;
    description?: string;
    type?: 'WRITING' | 'READING' | 'QUIZ' | 'PROJECT';
    points?: number;
  }
) {
  const assignment = await prisma.assignment.create({
    data: {
      title: data?.title || 'Test Assignment',
      description: data?.description || 'Complete this assignment',
      type: data?.type || 'WRITING',
      points: data?.points || 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      classId,
      teacherId,
      content: {
        instructions: 'Write an essay about your favorite book',
        requirements: ['Minimum 500 words', 'Include 3 examples'],
      },
    },
  });

  return assignment;
}

export async function cleanupTestData() {
  const deleteOperations = [
    prisma.notification.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.guestChatMessage.deleteMany(),
    prisma.guestStudyRecord.deleteMany(),
    prisma.guestAccess.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.studentGoal.deleteMany(),
    prisma.userPoints.deleteMany(),
    prisma.readingProgress.deleteMany(),
    prisma.bookmark.deleteMany(),
    prisma.highlight.deleteMany(),
    prisma.studyRecord.deleteMany(),
    prisma.media.deleteMany(),
    prisma.textbookPage.deleteMany(),
    prisma.classTextbook.deleteMany(),
    prisma.textbook.deleteMany(),
    prisma.classMember.deleteMany(),
    prisma.class.deleteMany(),
    prisma.user.deleteMany(),
  ];

  await prisma.$transaction(deleteOperations);
}