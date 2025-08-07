import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { logger } from './logger'

const prisma = new PrismaClient()

/**
 * 데모 데이터 시더
 * 프로덕션과 동일한 스키마를 사용하되, 풍부한 샘플 데이터 제공
 */
export async function seedDemoData() {
  try {
    logger.info('🌱 Starting demo data seeding...')

    // 트랜잭션으로 모든 데모 데이터 생성
    await prisma.$transaction(async (tx) => {
      // 1. 데모 사용자 생성
      const users = await createDemoUsers(tx)
      
      // 2. 데모 교과서 생성
      const textbooks = await createDemoTextbooks(tx, users)
      
      // 3. 데모 클래스 생성
      const classes = await createDemoClasses(tx, users, textbooks)
      
      // 4. 데모 과제 생성
      await createDemoAssignments(tx, classes, users)
      
      // 5. 데모 학습 기록 생성
      await createDemoStudyRecords(tx, users, textbooks)
      
      // 6. 데모 채팅 메시지 생성
      await createDemoChatMessages(tx, users)
    })

    logger.info('✅ Demo data seeding completed successfully')
  } catch (error) {
    logger.error('❌ Demo data seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function createDemoUsers(tx: any) {
  const password = await bcrypt.hash('demo123!', 10)
  
  // 교사 계정들
  const teachers = []
  for (let i = 1; i <= 3; i++) {
    const teacher = await tx.user.upsert({
      where: { email: `teacher${i}@demo.com` },
      update: {},
      create: {
        email: `teacher${i}@demo.com`,
        password,
        name: `데모 교사 ${i}`,
        role: 'TEACHER',
        isActive: true,
        teacherProfile: {
          create: {
            school: '데모 초등학교',
            subject: ['국어', '수학', '과학'][i - 1],
            grade: [4, 5, 6],
            bio: `${i}번째 데모 교사입니다. 다양한 교육 콘텐츠를 체험해보세요.`,
            experience: 5 + i,
            certifications: ['초등교육 자격증', 'AI 활용 교육 수료'],
          }
        }
      },
      include: { teacherProfile: true }
    })
    teachers.push(teacher)
  }
  
  // 학생 계정들
  const students = []
  for (let i = 1; i <= 10; i++) {
    const student = await tx.user.upsert({
      where: { email: `student${i}@demo.com` },
      update: {},
      create: {
        email: `student${i}@demo.com`,
        password,
        name: `데모 학생 ${i}`,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            school: '데모 초등학교',
            grade: 4 + (i % 3),
            className: `${4 + (i % 3)}학년 ${Math.ceil(i / 3)}반`,
            studentId: `DEMO${String(i).padStart(4, '0')}`,
          }
        }
      },
      include: { studentProfile: true }
    })
    students.push(student)
  }
  
  // 관리자 계정
  const admin = await tx.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password,
      name: '데모 관리자',
      role: 'ADMIN',
      isActive: true,
      adminProfile: {
        create: {
          permissions: ['VIEW_ONLY'],  // 데모 관리자는 보기만 가능
          systemNotes: 'Demo administrator account'
        }
      }
    }
  })
  
  return { teachers, students, admin }
}

async function createDemoTextbooks(tx: any, users: any) {
  const textbooks = []
  
  const subjects = [
    { name: '국어', grade: 5, chapters: 12 },
    { name: '수학', grade: 5, chapters: 10 },
    { name: '과학', grade: 5, chapters: 8 },
    { name: '사회', grade: 5, chapters: 8 },
  ]
  
  for (let index = 0; index < subjects.length; index++) {
    const subject = subjects[index]
    const teacher = users.teachers[index % users.teachers.length]
    
    const textbook = await tx.textbook.create({
      data: {
        title: `${subject.grade}학년 ${subject.name} (데모)`,
        description: `${subject.name} 교과서 데모 버전입니다. 다양한 학습 콘텐츠를 체험해보세요.`,
        subject: subject.name,
        grade: subject.grade,
        authorId: teacher.id,
        isPublic: true,
        metadata: {
          demoContent: true,
          createdFor: 'demo',
          features: ['AI 생성 콘텐츠', '대화형 학습', '멀티미디어 자료'],
        },
        content: generateDemoContent(subject.name, subject.grade, subject.chapters),
      }
    })
    
    textbooks.push(textbook)
  }
  
  return textbooks
}

async function createDemoClasses(tx: any, users: any, textbooks: any) {
  const classes = []
  
  for (let i = 0; i < 3; i++) {
    const teacher = users.teachers[i]
    const classStudents = users.students.slice(i * 3, (i + 1) * 3)
    
    const demoClass = await tx.class.create({
      data: {
        name: `${5}학년 ${i + 1}반 (데모)`,
        description: '데모 클래스입니다. 다양한 기능을 체험해보세요.',
        teacherId: teacher.id,
        grade: 5,
        subject: teacher.teacherProfile.subject,
        code: `DEMO${String(i + 1).padStart(3, '0')}`,
        isActive: true,
        settings: {
          allowStudentInteraction: true,
          enableAITutor: true,
          autoGrading: true,
        },
        members: {
          create: classStudents.map((student: any) => ({
            userId: student.id,
            role: 'STUDENT',
            joinedAt: new Date(),
          }))
        },
        textbooks: {
          connect: textbooks.slice(0, 2).map((t: any) => ({ id: t.id }))
        }
      }
    })
    
    classes.push(demoClass)
  }
  
  return classes
}

async function createDemoAssignments(tx: any, classes: any, users: any) {
  const assignments = []
  
  for (const demoClass of classes) {
    // 각 클래스당 3개의 과제 생성
    for (let i = 1; i <= 3; i++) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (i * 7))
      
      const assignment = await tx.assignment.create({
        data: {
          title: `데모 과제 ${i}: ${['독서 감상문', '수학 문제 풀이', '과학 실험 보고서'][i - 1]}`,
          description: `데모 과제입니다. 자유롭게 체험해보세요.`,
          classId: demoClass.id,
          teacherId: demoClass.teacherId,
          dueDate,
          maxScore: 100,
          type: ['ESSAY', 'QUIZ', 'PROJECT'][i - 1],
          content: {
            instructions: '데모 과제 지시사항입니다.',
            resources: ['참고 자료 1', '참고 자료 2'],
            rubric: {
              criteria: ['내용', '구성', '창의성'],
              points: [40, 30, 30],
            }
          }
        }
      })
      
      assignments.push(assignment)
    }
  }
  
  return assignments
}

async function createDemoStudyRecords(tx: any, users: any, textbooks: any) {
  const records = []
  
  for (const student of users.students) {
    for (const textbook of textbooks.slice(0, 2)) {
      const record = await tx.studyRecord.create({
        data: {
          userId: student.id,
          textbookId: textbook.id,
          progress: Math.floor(Math.random() * 100),
          lastAccessedAt: new Date(),
          totalStudyTime: Math.floor(Math.random() * 3600),
          completedPages: Math.floor(Math.random() * 50),
          notes: {
            bookmarks: [1, 5, 10],
            highlights: ['중요한 내용', '복습 필요'],
          }
        }
      })
      
      records.push(record)
    }
  }
  
  return records
}

async function createDemoChatMessages(tx: any, users: any) {
  const messages = [
    '안녕하세요! AI 튜터입니다. 무엇을 도와드릴까요?',
    '오늘 배운 내용 중 궁금한 점이 있나요?',
    '정답입니다! 잘하셨어요.',
    '조금 더 생각해보세요. 힌트를 드릴까요?',
    '훌륭한 질문이네요! 함께 알아봅시다.',
  ]
  
  const chatSessions = []
  
  for (const student of users.students.slice(0, 3)) {
    const session = await tx.chatSession.create({
      data: {
        userId: student.id,
        type: 'AI_TUTOR',
        startedAt: new Date(),
        messages: {
          create: messages.map((content, index) => ({
            role: index % 2 === 0 ? 'assistant' : 'user',
            content,
            timestamp: new Date(Date.now() - (5 - index) * 60000),
          }))
        }
      }
    })
    
    chatSessions.push(session)
  }
  
  return chatSessions
}

function generateDemoContent(subject: string, grade: number, chapters: number) {
  const content = []
  
  for (let i = 1; i <= chapters; i++) {
    content.push({
      chapter: i,
      title: `${i}단원: ${subject} 기초 ${i}`,
      pages: [
        {
          pageNumber: (i - 1) * 10 + 1,
          title: '단원 소개',
          content: `${i}단원에서는 ${subject}의 기초 개념을 학습합니다.`,
          type: 'introduction',
        },
        {
          pageNumber: (i - 1) * 10 + 2,
          title: '핵심 개념',
          content: `중요한 개념과 용어를 설명합니다.`,
          type: 'concept',
        },
        {
          pageNumber: (i - 1) * 10 + 3,
          title: '연습 문제',
          content: `배운 내용을 확인하는 문제입니다.`,
          type: 'exercise',
          questions: [
            {
              id: `q${i}_1`,
              question: `문제 ${i}-1: 기초 문제`,
              answer: '정답 예시',
              difficulty: 'easy',
            },
            {
              id: `q${i}_2`,
              question: `문제 ${i}-2: 응용 문제`,
              answer: '정답 예시',
              difficulty: 'medium',
            },
          ]
        }
      ]
    })
  }
  
  return content
}

// 데모 데이터 리셋 함수
export async function resetDemoData() {
  try {
    logger.info('🔄 Resetting demo data...')
    
    // 데모 계정과 관련된 모든 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 데모 이메일 패턴
      const demoEmailPattern = '%@demo.com'
      
      // 관련 데이터 삭제 (cascade 설정에 따라 자동 삭제될 수도 있음)
      await tx.user.deleteMany({
        where: {
          email: {
            endsWith: '@demo.com'
          }
        }
      })
    })
    
    // 새로운 데모 데이터 생성
    await seedDemoData()
    
    logger.info('✅ Demo data reset completed')
  } catch (error) {
    logger.error('❌ Demo data reset failed:', error)
    throw error
  }
}

// CLI에서 직접 실행 가능
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Demo data seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Demo data seeding failed:', error)
      process.exit(1)
    })
}