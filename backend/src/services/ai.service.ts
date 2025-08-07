import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { getRedis } from '../config/redis';

class AIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      const reply = response.choices[0].message.content || '';
      
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
}

export const aiService = new AIService();