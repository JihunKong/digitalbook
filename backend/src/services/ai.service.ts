import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { getRedis } from '../config/redis';

class AIService {
  private openai: OpenAI | null;
  private mockMode: boolean;
  
  constructor() {
    this.mockMode = !process.env.OPENAI_API_KEY;
    
    if (this.mockMode) {
      logger.warn('OpenAI API key not found. Running in mock mode.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }
  
  // Generate textbook content based on prompt
  async generateTextbookContent(prompt: string, options?: {
    grade?: number;
    subject?: string;
    length?: 'short' | 'medium' | 'long';
  }) {
    try {
      const systemPrompt = `You are an expert educational content creator specializing in Korean textbooks.
        Create engaging, age-appropriate educational content that follows Korean curriculum standards.
        ${options?.grade ? `Target grade level: ${options.grade}` : ''}
        ${options?.subject ? `Subject: ${options.subject}` : ''}
        ${options?.length ? `Content length: ${options.length}` : 'medium'}
        
        Format the content with clear sections, examples, and activities.
        Use Korean language appropriately for the grade level.`;

      if (this.mockMode) {
        return {
          content: `[Mock Response] 교과서 내용이 생성되었습니다. Grade: ${options?.grade}, Subject: ${options?.subject}`,
          model: 'mock',
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      }

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: options?.length === 'long' ? 4000 : 
                     options?.length === 'short' ? 1000 : 2000,
      });

      return {
        content: response.choices[0].message.content,
        model: 'gpt-4o-mini',
        usage: response.usage,
      };
    } catch (error) {
      logger.error('Failed to generate textbook content:', error);
      throw new Error('Failed to generate textbook content');
    }
  }
  
  // 교사의 요청에 따라 참고 자료를 제공하는 지원 도구로 변경
  async suggestContentEnhancements(
    teacherContent: string,
    requestType: 'vocabulary' | 'examples' | 'activities' | 'connections' | 'differentiation',
    context: {
      grade: number;
      subject: string;
      learningGoals: string[];
      studentNeeds?: string[];
    }
  ) {
    try {
      const prompts = {
        vocabulary: `
교사가 작성한 내용을 분석하여 학생들이 이해하기 어려울 수 있는 어휘를 찾고,
학년 수준에 맞는 설명 방법을 제안해주세요.

교사 작성 내용:
${teacherContent}

학년: ${context.grade}
과목: ${context.subject}

다음 형식으로 제안해주세요:
- 어려운 어휘와 쉬운 설명
- 시각적 설명이 도움이 될 어휘
- 실생활 연결 예시`,
        
        examples: `
교사가 작성한 내용을 보완할 수 있는 구체적인 예시를 제안해주세요.
학생들의 일상생활과 연결된 예시를 우선적으로 제시해주세요.

교사 작성 내용:
${teacherContent}

학습 목표:
${context.learningGoals.join('\n')}

다양한 관점의 예시를 3-5개 제안해주세요.`,
        
        activities: `
교사가 설계한 수업 내용에 적합한 학습 활동을 제안해주세요.
교사의 의도를 존중하면서 보완할 수 있는 활동을 제시해주세요.

교사 작성 내용:
${teacherContent}

다음 유형의 활동을 각 1개씩 제안:
- 개별 활동
- 모둠 활동
- 전체 활동
- 심화 활동`,
        
        connections: `
교사가 작성한 내용과 연결할 수 있는 다른 교과나 단원을 제안해주세요.
융합적 사고를 촉진할 수 있는 연결점을 찾아주세요.

교사 작성 내용:
${teacherContent}

- 타 교과 연계 방안
- 이전/이후 학습과의 연결
- 실생활 적용 방안`,
        
        differentiation: `
다양한 학습 수준의 학생들을 위한 차별화 전략을 제안해주세요.

교사 작성 내용:
${teacherContent}

학생 특성:
${context.studentNeeds?.join('\n') || '일반적인 학급'}

- 기초 수준 학생을 위한 지원
- 심화 학습이 필요한 학생을 위한 도전 과제
- 다양한 학습 스타일을 위한 대안`
      };
      
      const prompt = prompts[requestType];
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: '당신은 경험 많은 교육 전문가입니다. 교사의 자율성과 전문성을 존중하며, 참고할 수 있는 아이디어와 제안을 제공합니다. 교사를 대체하지 않고 지원하는 역할임을 명심하세요.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      return {
        type: requestType,
        suggestions: response.choices[0].message.content || '',
        disclaimer: '이 제안은 참고용입니다. 교사님의 판단에 따라 선택적으로 활용하세요.',
      };
    } catch (error) {
      logger.error('Failed to generate suggestions:', error);
      throw error;
    }
  }
  
  // 교사가 요청한 이미지 생성을 지원
  async generateImage(teacherPrompt: string, style: string = 'educational') {
    try {
      const styleGuides = {
        educational: '교육적이고 명확한 일러스트레이션 스타일',
        realistic: '사실적이고 상세한 표현',
        diagram: '도식화되고 단순화된 다이어그램 스타일',
        cartoon: '친근하고 재미있는 만화 스타일',
      };
      
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: `${teacherPrompt}. Style: ${styleGuides[style as keyof typeof styleGuides] || styleGuides.educational}`,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      });
      
      return {
        url: response.data?.[0]?.url || '',
        prompt: teacherPrompt,
        style: style,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to generate image:', error);
      throw error;
    }
  }
  
  async chatWithTutor(
    message: string,
    context: any,
    sessionId: string
  ) {
    try {
      const redis = getRedis();
      const cacheKey = `chat:${sessionId}:history`;
      
      // Get chat history from Redis
      const historyStr = await redis.get(cacheKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      const systemPrompt = `
당신은 친절하고 인내심 있는 한국어 선생님입니다.
학생의 질문에 대해 명확하고 이해하기 쉽게 답변해주세요.
현재 학습 중인 내용: ${JSON.stringify(context)}

답변 지침:
- 학생의 수준에 맞춰 쉽게 설명하세요
- 구체적인 예시를 들어 설명하세요
- 격려와 긍정적인 피드백을 포함하세요
- 이모지를 적절히 사용하여 친근감을 주세요
`;

      // Convert history format for OpenAI
      const openAIMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
      
      let reply: string;
      
      if (this.mockMode) {
        reply = `안녕하세요! 저는 AI 선생님입니다. "${message}"에 대한 답변입니다: 
        현재 학습 중인 내용을 잘 이해하고 계시는군요! 계속 열심히 공부하세요. 📚`;
      } else {
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openAIMessages,
          max_tokens: 1000,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });
        
        reply = response.choices[0].message.content || '';
      }
      
      // Update chat history
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      );
      
      // Keep only last 20 messages
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      await redis.setex(cacheKey, 3600, JSON.stringify(history));
      
      return reply;
    } catch (error) {
      logger.error('Failed to chat with tutor:', error);
      throw error;
    }
  }
  
  // Enhanced chat with PDF context
  async chatWithPDFContext(
    message: string,
    pdfId: string,
    pageNumber: number,
    studentId: string
  ) {
    try {
      const redis = getRedis();
      
      // Import PDF service dynamically to avoid circular dependency
      const { default: pdfService } = await import('./pdf.service');
      
      // Get current page content
      const pageContent = await pdfService.getPageContent(pdfId, pageNumber);
      
      if (!pageContent) {
        throw new Error('Page content not found');
      }
      
      // Get page insights from Redis cache
      const insightsKey = `pdf:${pdfId}:insights:${pageNumber}`;
      const insightsStr = await redis.get(insightsKey);
      const insights = insightsStr ? JSON.parse(insightsStr) : null;
      
      // Get student's recent page views
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const recentViews = await prisma.pageView.findMany({
        where: {
          studentId: studentId,
          textbookId: pdfId
        },
        orderBy: {
          viewedAt: 'desc'
        },
        take: 5
      });
      
      // Build context-aware prompt
      const systemPrompt = `
당신은 5학년 국어 선생님입니다. 학생이 현재 PDF 교과서를 보며 학습 중입니다.

현재 학습 페이지: ${pageNumber}
페이지 내용:
${pageContent.text}

${insights ? `핵심 개념: ${JSON.stringify(insights)}` : ''}

학생의 최근 학습 진도: ${recentViews.map(v => `${v.pageNumber}페이지`).join(', ')}

답변 지침:
1. 현재 페이지 내용을 기반으로 답변하세요
2. 학생이 이해하기 쉬운 5학년 수준의 언어를 사용하세요
3. 구체적인 예시를 페이지 내용에서 찾아 설명하세요
4. 격려하고 친근하게 대화하세요
5. 학습 내용과 관련된 추가 질문을 유도하세요
`;
      
      const sessionId = `pdf-${pdfId}-${studentId}`;
      const cacheKey = `chat:${sessionId}:history`;
      
      // Get chat history
      const historyStr = await redis.get(cacheKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      // Create messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
      
      let reply: string;
      
      if (this.mockMode) {
        reply = `안녕하세요! ${pageNumber}페이지에 대한 질문이군요. "${message}"
        
        이 페이지에서는 우리말의 아름다움과 한글의 과학적 우수성에 대해 배우고 있습니다.
        특히 존댓말과 반말의 차이를 이해하는 것이 중요해요.
        
        더 궁금한 점이 있으면 언제든지 물어보세요! 😊`;
      } else {
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1500,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });
        
        reply = response.choices[0].message.content || '';
      }
      
      // Update history
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      );
      
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      await redis.setex(cacheKey, 3600, JSON.stringify(history));
      
      // Save question to database for teacher review
      await prisma.question.create({
        data: {
          studentId: studentId,
          question: message,
          aiResponse: reply,
          context: {
            pdfId,
            pageNumber,
            pageContent: pageContent.text.substring(0, 500) // Save first 500 chars
          },
          questionType: this.classifyQuestionType(message),
          aiModel: 'gpt-4o-mini'
        }
      });
      
      await prisma.$disconnect();
      
      return reply;
    } catch (error) {
      logger.error('Failed to chat with PDF context:', error);
      throw error;
    }
  }
  
  // Helper method to classify question types
  private classifyQuestionType(question: string) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('뜻') || lowerQuestion.includes('의미')) {
      return 'KNOWLEDGE';
    } else if (lowerQuestion.includes('왜') || lowerQuestion.includes('이유')) {
      return 'REASONING';
    } else if (lowerQuestion.includes('예시') || lowerQuestion.includes('예를')) {
      return 'CREATIVE';
    } else if (lowerQuestion.includes('어떻게') || lowerQuestion.includes('방법')) {
      return 'REASONING';
    } else if (lowerQuestion.includes('생각') || lowerQuestion.includes('의견')) {
      return 'CRITICAL';
    } else {
      return 'KNOWLEDGE';
    }
  }
  
  // Generate page insights for better context
  async generatePageInsights(pageText: string, grade: string, subject: string) {
    try {
      const prompt = `
다음 교과서 페이지를 분석하여 핵심 정보를 추출해주세요.

페이지 내용:
${pageText.substring(0, 2000)}

다음 JSON 형식으로 응답해주세요:
{
  "mainTopic": "페이지의 주제",
  "keyWords": ["핵심어1", "핵심어2", "핵심어3"],
  "learningObjectives": ["학습목표1", "학습목표2"],
  "importantConcepts": ["중요개념1", "중요개념2"],
  "difficulty": "쉬움/보통/어려움"
}
`;
      
      if (this.mockMode) {
        return {
          mainTopic: '우리말의 아름다움',
          keyWords: ['한글', '존댓말', '반말', '세종대왕'],
          learningObjectives: ['우리말의 특징 이해하기', '높임법 사용하기'],
          importantConcepts: ['언어의 과학성', '존중의 표현'],
          difficulty: '보통'
        };
      }

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `당신은 ${grade}학년 ${subject} 교육 전문가입니다.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });
      
      const content = response.choices[0].message.content || '{}';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          mainTopic: '페이지 분석 중',
          keyWords: [],
          learningObjectives: [],
          importantConcepts: [],
          difficulty: '보통'
        };
      }
    } catch (error) {
      logger.error('Failed to generate page insights:', error);
      return null;
    }
  }
  
  // 교사의 평가를 지원하는 도구로 변경
  async assistTeacherEvaluation(
    studentWork: string,
    teacherCriteria: {
      focusAreas: string[];
      rubric: any;
      specificConcerns?: string[];
    },
    evaluationType: 'initial-review' | 'detailed-feedback' | 'peer-review-guide'
  ) {
    try {
      const prompts = {
        'initial-review': `
교사의 평가를 돕기 위해 학생 작품의 주요 특징을 분석해주세요.
최종 평가는 교사가 수행합니다.

학생 작품:
${studentWork}

교사가 주목하고자 하는 영역:
${teacherCriteria.focusAreas.join('\n')}

다음을 간단히 정리해주세요:
- 작품의 주요 특징
- 평가 기준과의 연관성
- 교사가 추가로 살펴볼 만한 부분`,
        
        'detailed-feedback': `
교사가 학생에게 제공할 피드백 작성을 지원해주세요.
건설적이고 격려하는 톤을 유지해주세요.

학생 작품:
${studentWork}

교사의 평가 기준:
${JSON.stringify(teacherCriteria.rubric)}

교사의 특별 관심사:
${teacherCriteria.specificConcerns?.join('\n') || '없음'}

피드백 초안을 제시해주세요. 교사가 수정할 수 있도록 [  ] 표시로 선택 옵션을 제공해주세요.`,
        
        'peer-review-guide': `
학생들이 서로의 작품을 평가할 수 있도록 가이드를 만들어주세요.

샘플 작품:
${studentWork}

교사의 학습 목표:
${teacherCriteria.focusAreas.join('\n')}

동료 평가를 위한:
- 체크리스트 (3-5개 항목)
- 건설적 피드백 작성 가이드
- 토론 질문 (2-3개)`
      };
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 교사의 평가 업무를 지원하는 도우미입니다. 최종 평가 권한은 교사에게 있으며, 당신은 참고 자료와 초안을 제공합니다.'
          },
          { role: 'user', content: prompts[evaluationType] }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      return {
        type: evaluationType,
        analysis: response.choices[0].message.content || '',
        note: '이 분석은 교사님의 평가를 지원하기 위한 참고 자료입니다.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to assist evaluation:', error);
      throw error;
    }
  }
  // 교사의 교수 설계를 지원하는 메타인지 도구
  async supportTeacherReflection(
    _lessonPlan: any,
    reflectionType: 'pre-lesson' | 'post-lesson' | 'improvement'
  ) {
    try {
      const prompts = {
        'pre-lesson': `
수업 전 점검을 위한 성찰 질문을 제공합니다:

1. 이 수업의 핵심 목표는 무엇인가요?
2. 학생들이 가장 어려워할 부분은 어디일까요?
3. 준비한 활동이 모든 학생을 포함하나요?
4. 시간 배분은 적절한가요?
5. 평가 방법이 학습 목표와 일치하나요?`,
        
        'post-lesson': `
수업 후 성찰을 위한 가이드:

1. 계획대로 진행된 부분과 그렇지 않은 부분
2. 학생들의 반응과 참여도
3. 예상치 못한 질문이나 상황
4. 가장 효과적이었던 순간
5. 다음에 개선하고 싶은 점`,
        
        'improvement': `
지속적 개선을 위한 체크리스트:

□ 학생 피드백 수집 방법
□ 동료 교사와의 협의 계획  
□ 교수법 실험 아이디어
□ 전문성 개발 필요 영역
□ 성공 사례 기록 방법`
      };
      
      return {
        type: reflectionType,
        guide: prompts[reflectionType],
        additionalResources: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to support reflection:', error);
      throw error;
    }
  }

  // 교사 간 협업을 지원하는 도구
  async facilitateTeacherCollaboration(
    _sharedContent: any,
    collaborationType: 'lesson-sharing' | 'co-planning' | 'peer-feedback'
  ) {
    try {
      // 교사들이 서로의 전문성을 공유할 수 있도록 지원
      const templates = {
        'lesson-sharing': {
          format: 'lesson_summary',
          sections: ['objectives', 'activities', 'materials', 'reflections'],
          sharingTips: ['핵심 성공 요인', '주의사항', '변형 가능성'],
        },
        'co-planning': {
          format: 'collaborative_plan',
          sections: ['shared_goals', 'division_of_roles', 'timeline', 'resources'],
          collaborationTools: ['공동 문서', '회의 일정', '피드백 채널'],
        },
        'peer-feedback': {
          format: 'feedback_framework',
          sections: ['strengths', 'questions', 'suggestions', 'resources'],
          guidelines: ['구체적 예시 포함', '긍정적 톤 유지', '실행 가능한 제안'],
        },
      };
      
      return {
        type: collaborationType,
        template: templates[collaborationType],
        tips: '동료 교사의 관점은 소중한 전문적 자산입니다.',
      };
    } catch (error) {
      logger.error('Failed to facilitate collaboration:', error);
      throw error;
    }
  }

  // PDF 교과서 메타데이터 자동 분석 및 추출
  async analyzePDFMetadata(extractedText: string, fileName?: string) {
    try {
      const systemPrompt = `당신은 교육 자료 분석 전문가입니다. 
      PDF 교과서의 내용을 분석하여 교사가 교과서 정보를 쉽게 설정할 수 있도록 메타데이터를 추출해주세요.
      
      한국의 교육과정에 맞춰 분석하고, 정확하지 않은 정보보다는 추론 가능한 범위에서 제안해주세요.`;

      const analysisPrompt = `다음 PDF 교과서 내용을 분석하여 메타데이터를 추출해주세요:

파일명: ${fileName || '알 수 없음'}
추출된 텍스트 (처음 2000자):
${extractedText.substring(0, 2000)}

다음 JSON 형식으로 응답해주세요:
{
  "title": "교과서 제목 추천 (최대 50자)",
  "subject": "과목 (국어/수학/과학/사회/영어/도덕/체육/음악/미술/실과 중 하나)",
  "grade": "학년 (1-6 중 하나, 숫자만)",
  "description": "교과서 설명 (2-3줄, 최대 200자)",
  "estimatedPages": "예상 페이지 수 (숫자)",
  "mainTopics": ["주요 주제1", "주요 주제2", "주요 주제3"],
  "difficulty": "난이도 (쉬움/보통/어려움)",
  "confidence": "분석 확신도 (0-100 숫자)"
}

주의사항:
- 제목이 명확하지 않으면 내용을 바탕으로 적절한 제목을 생성하세요
- 과목은 내용을 분석하여 가장 적합한 것을 선택하세요
- 학년은 어휘 수준과 내용 복잡도로 판단하세요
- 확신이 없는 항목은 confidence를 낮게 설정하세요`;

      if (this.mockMode) {
        // Mock response for development
        return {
          title: fileName ? fileName.replace(/\.[^/.]+$/, "") : "교과서 제목",
          subject: "국어",
          grade: "3",
          description: "AI가 분석한 교과서입니다. 실제 분석을 위해 OpenAI API 키가 필요합니다.",
          estimatedPages: 20,
          mainTopics: ["읽기", "쓰기", "말하기"],
          difficulty: "보통",
          confidence: 50
        };
      }

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('AI 분석 결과가 없습니다.');
      }

      // Parse JSON response
      const analysis = JSON.parse(content);
      
      // Validate and normalize the response
      return {
        title: analysis.title || "새 교과서",
        subject: this.validateSubject(analysis.subject),
        grade: this.validateGrade(analysis.grade),
        description: analysis.description || "",
        estimatedPages: Math.max(1, parseInt(analysis.estimatedPages) || 1),
        mainTopics: Array.isArray(analysis.mainTopics) ? analysis.mainTopics.slice(0, 5) : [],
        difficulty: this.validateDifficulty(analysis.difficulty),
        confidence: Math.max(0, Math.min(100, parseInt(analysis.confidence) || 50))
      };

    } catch (error) {
      logger.error('Failed to analyze PDF metadata:', error);
      
      // Fallback analysis based on filename and basic text analysis
      return this.createFallbackAnalysis(extractedText, fileName);
    }
  }

  private validateSubject(subject: string): string {
    const validSubjects = ['국어', '수학', '과학', '사회', '영어', '도덕', '체육', '음악', '미술', '실과'];
    return validSubjects.includes(subject) ? subject : '국어';
  }

  private validateGrade(grade: string | number): string {
    const gradeNum = typeof grade === 'string' ? parseInt(grade) : grade;
    return (gradeNum >= 1 && gradeNum <= 6) ? gradeNum.toString() : '3';
  }

  private validateDifficulty(difficulty: string): string {
    const validDifficulties = ['쉬움', '보통', '어려움'];
    return validDifficulties.includes(difficulty) ? difficulty : '보통';
  }

  private createFallbackAnalysis(extractedText: string, fileName?: string) {
    const wordCount = extractedText.split(/\s+/).length;
    const estimatedPages = Math.ceil(wordCount / 300); // Rough estimate
    
    return {
      title: fileName ? fileName.replace(/\.[^/.]+$/, "") : "새 교과서",
      subject: "국어",
      grade: "3",
      description: "업로드된 PDF 교과서입니다. 세부 정보를 수정해 주세요.",
      estimatedPages: Math.max(1, estimatedPages),
      mainTopics: [],
      difficulty: "보통",
      confidence: 20
    };
  }
}

export const aiService = new AIService();