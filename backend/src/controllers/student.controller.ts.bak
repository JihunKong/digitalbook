import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 수업 참여 (6자리 코드로)
export const joinClass = async (req: Request, res: Response) => {
  try {
    const { code, name, studentId } = req.body;

    if (!code || !name || !studentId) {
      return res.status(400).json({ 
        error: '코드, 이름, 학번을 모두 입력해주세요.' 
      });
    }

    // 수업 찾기
    const classData = await prisma.class.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        document: true,
        teacher: {
          select: { name: true }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ 
        error: '유효하지 않은 수업 코드입니다.' 
      });
    }

    // 수업 활성 상태 확인
    if (!classData.isActive) {
      return res.status(400).json({ 
        error: '종료된 수업입니다.' 
      });
    }

    // 만료 확인
    if (classData.expiresAt && new Date() > classData.expiresAt) {
      return res.status(400).json({ 
        error: '수업 기간이 만료되었습니다.' 
      });
    }

    // 문서 확인
    if (!classData.document) {
      return res.status(400).json({ 
        error: '아직 수업 자료가 준비되지 않았습니다.' 
      });
    }

    // 이미 참여한 학생인지 확인
    let student = await prisma.student.findUnique({
      where: {
        classId_studentId: {
          classId: classData.id,
          studentId
        }
      }
    });

    if (!student) {
      // 새 학생 등록
      student = await prisma.student.create({
        data: {
          classId: classData.id,
          studentId,
          name
        }
      });
    } else {
      // 기존 학생 - 마지막 활동 시간 업데이트
      student = await prisma.student.update({
        where: { id: student.id },
        data: { lastActiveAt: new Date() }
      });
    }

    // 세션 토큰 생성
    const sessionToken = uuidv4();
    const session = await prisma.session.create({
      data: {
        token: sessionToken,
        studentId: student.id,
        data: {
          classId: classData.id,
          studentName: name
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
      }
    });

    return res.json({
      success: true,
      session: {
        token: sessionToken,
        expiresAt: session.expiresAt
      },
      class: {
        id: classData.id,
        name: classData.name,
        teacher: classData.teacher.name
      },
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId
      },
      document: {
        id: classData.document.id,
        name: classData.document.originalName,
        type: classData.document.mimeType
      }
    });
  } catch (error) {
    console.error('수업 참여 오류:', error);
    return res.status(500).json({ 
      error: '수업 참여에 실패했습니다.' 
    });
  }
};

// 문서 내용 가져오기
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const studentId = req.student?.id;

    if (!studentId) {
      return res.status(401).json({ 
        error: '학생 인증이 필요합니다.' 
      });
    }

    // 수업 및 학생 확인
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classId
      },
      include: {
        class: {
          include: {
            document: true
          }
        }
      }
    });

    if (!student) {
      return res.status(403).json({ 
        error: '이 수업에 참여하지 않았습니다.' 
      });
    }

    if (!student.class.document) {
      return res.status(404).json({ 
        error: '수업 자료가 없습니다.' 
      });
    }

    // 활동 시간 업데이트
    await prisma.student.update({
      where: { id: studentId },
      data: { lastActiveAt: new Date() }
    });

    return res.json({
      success: true,
      document: {
        id: student.class.document.id,
        name: student.class.document.originalName,
        type: student.class.document.mimeType,
        content: student.class.document.content,
        fileUrl: student.class.document.fileUrl,
        metadata: student.class.document.metadata
      }
    });
  } catch (error) {
    console.error('문서 조회 오류:', error);
    return res.status(500).json({ 
      error: '문서 조회에 실패했습니다.' 
    });
  }
};

// 질문 저장
export const saveQuestion = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { question, context, type = 'KNOWLEDGE' } = req.body;
    const studentId = req.student?.id;

    if (!studentId) {
      return res.status(401).json({ 
        error: '학생 인증이 필요합니다.' 
      });
    }

    if (!question) {
      return res.status(400).json({ 
        error: '질문을 입력해주세요.' 
      });
    }

    // 학생이 해당 수업에 속해있는지 확인
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classId
      }
    });

    if (!student) {
      return res.status(403).json({ 
        error: '이 수업에 참여하지 않았습니다.' 
      });
    }

    // 질문 저장
    const newQuestion = await prisma.question.create({
      data: {
        classId,
        studentId,
        question,
        context,
        questionType: type,
      },
      include: {
        student: {
          select: { name: true }
        }
      }
    });

    // 활동 시간 업데이트
    await prisma.student.update({
      where: { id: studentId },
      data: { lastActiveAt: new Date() }
    });

    return res.status(201).json({
      success: true,
      question: {
        id: newQuestion.id,
        question: newQuestion.question,
        type: newQuestion.questionType,
        timestamp: newQuestion.createdAt
      }
    });
  } catch (error) {
    console.error('질문 저장 오류:', error);
    return res.status(500).json({ 
      error: '질문 저장에 실패했습니다.' 
    });
  }
};

// 내 질문 기록 조회
export const getMyQuestions = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const studentId = req.student?.id;

    if (!studentId) {
      return res.status(401).json({ 
        error: '학생 인증이 필요합니다.' 
      });
    }

    const questions = await prisma.question.findMany({
      where: {
        classId,
        studentId
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({
      success: true,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        aiResponse: q.aiResponse,
        type: q.questionType,
        context: q.context,
        timestamp: q.createdAt
      }))
    });
  } catch (error) {
    console.error('질문 기록 조회 오류:', error);
    return res.status(500).json({ 
      error: '질문 기록 조회에 실패했습니다.' 
    });
  }
};

// 세션 검증
export const validateSession = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: '세션 토큰이 필요합니다.' 
      });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        student: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({ 
        error: '유효하지 않은 세션입니다.' 
      });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ 
        error: '세션이 만료되었습니다.' 
      });
    }

    return res.json({
      success: true,
      session: {
        valid: true,
        expiresAt: session.expiresAt
      },
      student: session.student ? {
        id: session.student.id,
        name: session.student.name,
        studentId: session.student.studentId,
        class: session.student.class
      } : null
    });
  } catch (error) {
    console.error('세션 검증 오류:', error);
    return res.status(500).json({ 
      error: '세션 검증에 실패했습니다.' 
    });
  }
};