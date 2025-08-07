import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash passwords
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  // Create teacher user
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: teacherPassword,
      name: '김선생',
      role: 'TEACHER',
    },
  })

  // Create student users
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      password: studentPassword,
      name: '박학생',
      role: 'STUDENT',
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      password: studentPassword,
      name: '이학생',
      role: 'STUDENT',
    },
  })

  // Create a class
  const class1 = await prisma.class.upsert({
    where: { code: 'DEMO2024' },
    update: {},
    create: {
      name: '국어 1학년',
      description: '데모 국어 수업',
      code: 'DEMO2024',
    },
  })

  // Add teacher as class member
  await prisma.classMember.upsert({
    where: { 
      userId_classId: {
        userId: teacher.id,
        classId: class1.id
      }
    },
    update: {},
    create: {
      userId: teacher.id,
      classId: class1.id,
      role: 'TEACHER',
    },
  })

  // Add students as class members
  await prisma.classMember.upsert({
    where: { 
      userId_classId: {
        userId: student1.id,
        classId: class1.id
      }
    },
    update: {},
    create: {
      userId: student1.id,
      classId: class1.id,
      role: 'STUDENT',
    },
  })

  await prisma.classMember.upsert({
    where: { 
      userId_classId: {
        userId: student2.id,
        classId: class1.id
      }
    },
    update: {},
    create: {
      userId: student2.id,
      classId: class1.id,
      role: 'STUDENT',
    },
  })

  // Create a sample textbook
  const textbook = await prisma.textbook.upsert({
    where: { id: 'demo-textbook-1' },
    update: {},
    create: {
      id: 'demo-textbook-1',
      title: '현대문학의 이해',
      subject: '국어',
      grade: 1,
      description: '현대문학 작품을 통해 문학적 사고력을 기르는 교과서',
      content: {
        chapters: [
          {
            id: 'chapter-1',
            title: '현대시의 특징',
            pages: [
              {
                id: 'page-1',
                title: '자유시와 정형시',
                content: '현대시는 자유시와 정형시로 나뉩니다...'
              }
            ]
          }
        ]
      },
      teacherId: teacher.id,
      isPublished: true,
      isPublic: true,
      accessCode: 'DEMO123',
      aiSettings: {
        style: 'educational',
        difficulty: 'beginner'
      },
    },
  })

  // Assign textbook to class
  await prisma.classTextbook.upsert({
    where: {
      classId_textbookId: {
        classId: class1.id,
        textbookId: textbook.id
      }
    },
    update: {},
    create: {
      classId: class1.id,
      textbookId: textbook.id,
    },
  })

  // Create a sample assignment
  const assignment = await prisma.assignment.upsert({
    where: { id: 'demo-assignment-1' },
    update: {},
    create: {
      id: 'demo-assignment-1',
      title: '현대시 감상문 작성',
      description: '좋아하는 현대시를 선택하여 감상문을 작성하세요.',
      type: 'WRITING',
      content: {
        instructions: '500자 이상 작성',
        rubric: ['내용의 충실성', '표현의 적절성', '창의성']
      },
      classId: class1.id,
      teacherId: teacher.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      points: 100,
    },
  })

  console.log('✅ Database seeding completed!')
  console.log({
    teacher: { email: teacher.email, name: teacher.name },
    students: [
      { email: student1.email, name: student1.name },
      { email: student2.email, name: student2.name }
    ],
    class: { name: class1.name, code: class1.code },
    textbook: { title: textbook.title, accessCode: textbook.accessCode },
    assignment: { title: assignment.title }
  })
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })