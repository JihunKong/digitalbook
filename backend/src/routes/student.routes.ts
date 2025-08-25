import { Router } from 'express';
import { authenticateStudent } from '../middlewares/auth';
import { studentController } from '../controllers/student.controller';
import { AIChatService } from '../services/ai-chat.service';

const router = Router();
const aiChatService = new AIChatService();

// 공개 라우트 (인증 불필요)
router.post('/signup', studentController.createStudent.bind(studentController));
router.post('/join', studentController.joinClass.bind(studentController));
router.post('/session/validate', studentController.validateSession.bind(studentController));

// 학생 인증 필요 라우트
router.get('/questions/:classId', authenticateStudent, studentController.getMyQuestions.bind(studentController));
router.post('/questions', authenticateStudent, studentController.saveQuestion.bind(studentController));

// AI 채팅 라우트
router.post('/student/chat', authenticateStudent, async (req, res) => {
  try {
    const { question, classId, context } = req.body;
    const studentId = req.student?.id;

    if (!studentId || !classId || !question) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    const result = await aiChatService.processChat(
      question,
      classId,
      studentId,
      context
    );

    return res.json({
      success: true,
      response: result.response,
      questionType: result.questionType,
      questionId: result.questionId
    });
  } catch (error) {
    console.error('AI 채팅 오류:', error);
    return res.status(500).json({ error: 'AI 응답 생성에 실패했습니다.' });
  }
});

// 교사용 질문 요약 (교사 인증 필요)
router.get('/teacher/class/:classId/questions/summary', authenticateStudent, async (req, res) => {
  try {
    const { classId } = req.params;
    const summary = await aiChatService.generateQuestionSummary(classId);
    
    return res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('요약 생성 오류:', error);
    return res.status(500).json({ error: '요약 생성에 실패했습니다.' });
  }
});

export default router;