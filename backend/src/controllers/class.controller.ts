import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PDFExtract } from 'pdf-extract';

const prisma = new PrismaClient();

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// 6자리 코드 생성
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 문서 내용 추출
async function extractDocumentContent(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      // PDF 처리
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extract(filePath, {});
      return data.pages.map(page => 
        page.content.map(item => item.str).join(' ')
      ).join('\n\n');
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      // 텍스트 파일 처리
      return await fs.readFile(filePath, 'utf-8');
    } else {
      // 기타 형식 (추후 확장)
      return '문서 내용을 추출할 수 없습니다.';
    }
  } catch (error) {
    console.error('문서 추출 오류:', error);
    return '';
  }
}

// 수업 생성
export const createClass = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { name, expiresIn } = req.body;
    
    // 유니크한 코드 생성
    let code: string;
    let isUnique = false;
    do {
      code = generateClassCode();
      const existing = await prisma.class.findUnique({ where: { code } });
      isUnique = !existing;
    } while (!isUnique);

    // 만료 시간 설정 (기본 7일)
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newClass = await prisma.class.create({
      data: {
        code,
        name,
        teacherId,
        expiresAt,
      },
      include: {
        teacher: {
          select: { name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      class: newClass,
      message: `수업이 생성되었습니다. 코드: ${code}`
    });
  } catch (error) {
    console.error('수업 생성 오류:', error);
    return res.status(500).json({ error: '수업 생성에 실패했습니다.' });
  }
};

// 문서 업로드
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    // 수업 확인
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true }
    });

    if (!classData) {
      return res.status(404).json({ error: '수업을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (classData.teacherId !== req.user?.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 문서 내용 추출
    const content = await extractDocumentContent(file.path, file.mimetype);

    // 기존 문서가 있으면 삭제
    if (classData.documentId) {
      await prisma.document.delete({
        where: { id: classData.documentId }
      });
    }

    // 새 문서 저장
    const document = await prisma.document.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        content,
        fileUrl: `/uploads/documents/${file.filename}`,
        metadata: {
          size: file.size,
          uploadedBy: req.user.name
        }
      }
    });

    // 수업에 문서 연결
    await prisma.class.update({
      where: { id: classId },
      data: { documentId: document.id }
    });

    return res.json({
      success: true,
      document: {
        id: document.id,
        name: document.originalName,
        type: document.mimeType,
        uploadedAt: document.uploadedAt
      },
      message: '문서가 업로드되었습니다.'
    });
  } catch (error) {
    console.error('문서 업로드 오류:', error);
    return res.status(500).json({ error: '문서 업로드에 실패했습니다.' });
  }
};

// 교사의 수업 목록 조회
export const getTeacherClasses = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const classes = await prisma.class.findMany({
      where: { 
        teacherId,
        isActive: true 
      },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            uploadedAt: true
          }
        },
        _count: {
          select: {
            students: true,
            questions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      classes: classes.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        document: c.document,
        studentCount: c._count.students,
        questionCount: c._count.questions,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt
      }))
    });
  } catch (error) {
    console.error('수업 목록 조회 오류:', error);
    return res.status(500).json({ error: '수업 목록 조회에 실패했습니다.' });
  }
};

// 수업 질문 모니터링
export const getClassQuestions = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // 수업 확인 및 권한 체크
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return res.status(404).json({ error: '수업을 찾을 수 없습니다.' });
    }

    if (classData.teacherId !== req.user?.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 질문 조회
    const questions = await prisma.question.findMany({
      where: { classId },
      include: {
        student: {
          select: { name: true, studentId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.question.count({
      where: { classId }
    });

    return res.json({
      success: true,
      questions: questions.map(q => ({
        id: q.id,
        student: q.student.name,
        studentId: q.student.studentId,
        question: q.question,
        type: q.questionType,
        aiResponse: q.aiResponse,
        context: q.context,
        timestamp: q.createdAt
      })),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('질문 조회 오류:', error);
    return res.status(500).json({ error: '질문 조회에 실패했습니다.' });
  }
};

// 수업 삭제
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return res.status(404).json({ error: '수업을 찾을 수 없습니다.' });
    }

    if (classData.teacherId !== req.user?.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // Soft delete
    await prisma.class.update({
      where: { id: classId },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: '수업이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('수업 삭제 오류:', error);
    return res.status(500).json({ error: '수업 삭제에 실패했습니다.' });
  }
};