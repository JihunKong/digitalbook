import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';
import { authenticateFlexible } from '../middlewares/flexibleAuth';
import { validateRequest } from '../middlewares/validator';
import { chatSchemas } from '../utils/validation/chat.schemas';
import { ragService } from '../services/rag.service';
import { embeddingService } from '../services/embedding.service';
import { pageSegmentationService } from '../services/pageSegmentation.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Socket.IO 서버 인스턴스를 저장할 변수
let io: SocketIOServer;

/**
 * Socket.IO 서버 설정 함수
 */
export function setupChatSocket(ioServer: SocketIOServer) {
  io = ioServer;
  
  // 네임스페이스 설정
  const chatNamespace = io.of('/chat');
  
  chatNamespace.on('connection', (socket) => {
    console.log(`🔌 Client connected to chat: ${socket.id}`);
    
    // 페이지별 룸 참가
    socket.on('join-page', async (data: { pageId: string; userId?: string; guestId?: string }) => {
      try {
        const { pageId, userId, guestId } = data;
        
        // 페이지 존재 확인
        const page = await prisma.textbookPage.findUnique({
          where: { id: pageId }
        });
        
        if (!page) {
          socket.emit('error', { message: '페이지를 찾을 수 없습니다.' });
          return;
        }
        
        // 룸 참가
        socket.join(`page-${pageId}`);
        
        // 채팅 세션 생성 또는 가져오기
        const sessionId = await ragService.getOrCreateChatSession(pageId, userId, guestId);
        socket.data.sessionId = sessionId;
        socket.data.pageId = pageId;
        socket.data.userId = userId;
        socket.data.guestId = guestId;
        
        // 기존 채팅 기록 전송
        const chatHistory = await ragService.getChatHistory(sessionId, 20);
        socket.emit('chat-history', chatHistory);
        
        console.log(`👤 User joined page ${pageId}, session: ${sessionId}`);
        
      } catch (error) {
        console.error('Join page error:', error);
        socket.emit('error', { message: '페이지 참가 중 오류가 발생했습니다.' });
      }
    });
    
    // 채팅 메시지 처리
    socket.on('chat-message', async (data: { message: string }) => {
      try {
        const { message } = data;
        const { sessionId, pageId, userId, guestId } = socket.data;
        
        if (!sessionId || !pageId) {
          socket.emit('error', { message: '세션이 설정되지 않았습니다.' });
          return;
        }
        
        // 메시지 검증
        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: '메시지를 입력해주세요.' });
          return;
        }
        
        if (message.length > 1000) {
          socket.emit('error', { message: '메시지가 너무 깁니다. (최대 1000자)' });
          return;
        }
        
        // 사용자 메시지 즉시 브로드캐스트
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date(),
          id: `user-${Date.now()}`
        };
        
        socket.to(`page-${pageId}`).emit('new-message', userMessage);
        socket.emit('new-message', userMessage);
        
        // AI 응답 생성 시작 알림
        socket.emit('ai-thinking', true);
        
        // RAG 기반 응답 생성
        const ragResponse = await ragService.answerQuestion(
          pageId,
          message,
          userId,
          sessionId
        );
        
        // AI 응답 브로드캐스트
        const aiMessage = {
          role: 'assistant',
          content: ragResponse.answer,
          timestamp: new Date(),
          confidence: ragResponse.confidence,
          sources: ragResponse.sources,
          id: `ai-${Date.now()}`
        };
        
        socket.emit('ai-thinking', false);
        socket.to(`page-${pageId}`).emit('new-message', aiMessage);
        socket.emit('new-message', aiMessage);
        
        console.log(`💬 Chat response generated for page ${pageId} (confidence: ${ragResponse.confidence})`);
        
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('ai-thinking', false);
        socket.emit('error', { 
          message: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
      }
    });
    
    // 타이핑 상태 처리
    socket.on('typing-start', (data: { pageId: string }) => {
      socket.to(`page-${data.pageId}`).emit('user-typing', { 
        userId: socket.data.userId || socket.data.guestId,
        typing: true 
      });
    });
    
    socket.on('typing-stop', (data: { pageId: string }) => {
      socket.to(`page-${data.pageId}`).emit('user-typing', { 
        userId: socket.data.userId || socket.data.guestId,
        typing: false 
      });
    });
    
    // 연결 해제 처리
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from chat: ${socket.id}`);
      
      if (socket.data.pageId) {
        socket.to(`page-${socket.data.pageId}`).emit('user-typing', { 
          userId: socket.data.userId || socket.data.guestId,
          typing: false 
        });
      }
    });
  });
}

// 기존 REST API 엔드포인트들 유지
router.post(
  '/message',
  authenticateFlexible,
  validateRequest(chatSchemas.sendMessage),
  chatController.sendMessage
);

router.get(
  '/history/:sessionId',
  authenticateFlexible,
  chatController.getChatHistory
);

router.post(
  '/suggestions',
  authenticateFlexible,
  validateRequest(chatSchemas.getSuggestions),
  chatController.getSuggestions
);

// RAG 관련 새로운 엔드포인트들

// 페이지별 채팅 세션 생성
router.post('/sessions', authenticateFlexible, async (req, res, next) => {
  try {
    const { pageId } = req.body;
    const userId = req.user?.id;
    const guestId = req.guestId;
    
    if (!pageId) {
      return res.status(400).json({ error: '페이지 ID가 필요합니다.' });
    }
    
    // 페이지 존재 확인
    const page = await prisma.textbookPage.findUnique({
      where: { id: pageId }
    });
    
    if (!page) {
      return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    }
    
    const sessionId = await ragService.getOrCreateChatSession(pageId, userId, guestId);
    
    res.json({
      sessionId,
      pageId,
      message: '채팅 세션이 생성되었습니다.'
    });
    
  } catch (error) {
    next(error);
  }
});

// 페이지 임베딩 생성 (관리자/교사용)
router.post('/pages/:pageId/embeddings', authenticate, async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { forceRegenerate = false } = req.body;
    
    // 권한 확인 (교사 또는 관리자만)
    if (req.user?.role !== 'TEACHER' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    
    // 페이지 조회
    const page = await prisma.textbookPage.findUnique({
      where: { id: pageId },
      include: { file: true }
    });
    
    if (!page) {
      return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    }
    
    // 기존 임베딩 확인
    const existingEmbeddings = await prisma.pageEmbedding.count({
      where: { pageId }
    });
    
    if (existingEmbeddings > 0 && !forceRegenerate) {
      return res.status(409).json({ 
        error: '이미 임베딩이 존재합니다. forceRegenerate=true로 재생성하세요.',
        existingCount: existingEmbeddings
      });
    }
    
    // 기존 임베딩 삭제 (재생성인 경우)
    if (forceRegenerate) {
      await embeddingService.deletePageEmbeddings(pageId);
    }
    
    // 콘텐츠 준비
    let segments;
    
    switch (page.contentType) {
      case 'TEXT':
        if (!page.textContent) {
          return res.status(400).json({ error: '텍스트 콘텐츠가 없습니다.' });
        }
        segments = await pageSegmentationService.segmentTextContent(page.textContent);
        break;
        
      case 'FILE':
        if (!page.file?.extractedText) {
          return res.status(400).json({ error: '파일 텍스트가 추출되지 않았습니다.' });
        }
        segments = await pageSegmentationService.segmentFileContent(
          page.file.extractedText,
          page.file.mimeType
        );
        break;
        
      case 'MIXED':
        if (!page.textContent || !page.file?.extractedText) {
          return res.status(400).json({ error: '텍스트 또는 파일 콘텐츠가 없습니다.' });
        }
        segments = await pageSegmentationService.segmentMixedContent(
          page.textContent,
          page.file.extractedText,
          page.file.mimeType
        );
        break;
        
      default:
        return res.status(400).json({ error: '지원되지 않는 콘텐츠 타입입니다.' });
    }
    
    // 임베딩 생성
    const embeddings = await embeddingService.generatePageEmbeddings(pageId, segments);
    
    // 통계 조회
    const stats = await embeddingService.getPageEmbeddingStats(pageId);
    
    res.json({
      pageId,
      contentType: page.contentType,
      segments: segments.length,
      embeddings: embeddings.length,
      stats,
      message: '임베딩이 성공적으로 생성되었습니다.'
    });
    
  } catch (error) {
    console.error('Embedding generation error:', error);
    next(error);
  }
});

// 직접 RAG 질문 (비 WebSocket)
router.post('/pages/:pageId/ask', authenticateFlexible, async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { question } = req.body;
    const userId = req.user?.id;
    const guestId = req.guestId;
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }
    
    // 세션 생성
    const sessionId = await ragService.getOrCreateChatSession(pageId, userId, guestId);
    
    // RAG 응답 생성
    const response = await ragService.answerQuestion(pageId, question, userId, sessionId);
    
    res.json({
      question,
      answer: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      sessionId
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;