import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash passwords
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  // Create teacher user with profile
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: teacherPassword,
      name: '김선생',
      role: 'TEACHER',
      isActive: true,
      teacherProfile: {
        create: {
          school: '서울고등학교',
          subject: '국어',
          grade: '1학년',
          bio: '국어 교육 전문가입니다.',
        }
      }
    },
    include: {
      teacherProfile: true
    }
  })

  // Create student users with profiles
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      password: studentPassword,
      name: '박학생',
      role: 'STUDENT',
      isActive: true,
      studentProfile: {
        create: {
          studentId: '20240001',
          school: '서울고등학교',
          grade: '1학년',
          className: '1반',
        }
      }
    },
    include: {
      studentProfile: true
    }
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      password: studentPassword,
      name: '이학생',
      role: 'STUDENT',
      isActive: true,
      studentProfile: {
        create: {
          studentId: '20240002',
          school: '서울고등학교',
          grade: '1학년',
          className: '1반',
        }
      }
    },
    include: {
      studentProfile: true
    }
  })

  // Create a class
  const class1 = await prisma.class.upsert({
    where: { code: 'DEMO2024' },
    update: {},
    create: {
      name: '국어 1학년',
      description: '데모 국어 수업',
      code: 'DEMO2024',
      teacherId: teacher.teacherProfile!.id,
      subject: '국어',
      grade: '1학년',
      semester: '1학기',
    },
  })

  // Enroll students in class
  await prisma.classEnrollment.upsert({
    where: { 
      classId_studentId: {
        classId: class1.id,
        studentId: student1.studentProfile!.id
      }
    },
    update: {},
    create: {
      classId: class1.id,
      studentId: student1.studentProfile!.id,
    },
  })

  await prisma.classEnrollment.upsert({
    where: { 
      classId_studentId: {
        classId: class1.id,
        studentId: student2.studentProfile!.id
      }
    },
    update: {},
    create: {
      classId: class1.id,
      studentId: student2.studentProfile!.id,
    },
  })

  // Create a sample textbook
  const textbook = await prisma.textbook.upsert({
    where: { id: 'demo-textbook-1' },
    update: {},
    create: {
      id: 'demo-textbook-1',
      title: '현대문학의 이해',
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
      authorId: teacher.teacherProfile!.id,
      isPublic: true,
      aiGenerated: false,
    },
  })

  // Create textbook pages
  await prisma.textbookPage.upsert({
    where: {
      textbookId_pageNumber: {
        textbookId: textbook.id,
        pageNumber: 1
      }
    },
    update: {},
    create: {
      textbookId: textbook.id,
      pageNumber: 1,
      title: '현대시의 이해',
      content: {
        type: 'text',
        content: '현대시는 근대 이후 한국문학의 중요한 갈래입니다. 자유시와 정형시의 특징을 살펴보고, 대표 작품들을 감상해보겠습니다.'
      },
      contentType: 'TEXT',
      textContent: '현대시는 근대 이후 한국문학의 중요한 갈래입니다.'
    }
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
      type: 'ESSAY',
      classId: class1.id,
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
    textbook: { title: textbook.title },
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