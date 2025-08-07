import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export enum QuestionType {
  KNOWLEDGE = 'KNOWLEDGE',
  REASONING = 'REASONING',
  CRITICAL = 'CRITICAL',
  CREATIVE = 'CREATIVE',
  REFLECTION = 'REFLECTION'
}

interface ChatContext {
  documentContent: string;
  studentName: string;
  previousQuestions?: any[];
  currentPage?: number;
}

export class AIChatService {
  // 질문 유형 분류
  async classifyQuestion(question: string): Promise<QuestionType> {
    try {
      const prompt = `다음 질문을 분류해주세요:
      
질문: "${question}"

분류 카테고리:
- KNOWLEDGE: 사실, 정의, 개념에 대한 단순 질문 (뭐예요?, 무엇인가요?, 언제?, 어디서?)
- REASONING: 추론, 인과관계, 논리적 사고가 필요한 질문 (왜?, 어떻게?, 그래서?)
- CRITICAL: 비판적 사고, 평가, 판단이 필요한 질문 (어떻게 생각해?, 맞나요?, 문제점은?)
- CREATIVE: 창의적 사고, 상상력이 필요한 질문 (만약에?, 새로운 방법은?, 다르게 한다면?)
- REFLECTION: 성찰, 자기 반성, 메타인지 질문 (내가 이해한 게 맞나요?, 더 알아야 할 것은?)

한 단어로만 답하세요: KNOWLEDGE, REASONING, CRITICAL, CREATIVE, 또는 REFLECTION`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.3,
      });

      const classification = response.choices[0]?.message?.content?.trim().toUpperCase();
      
      if (Object.values(QuestionType).includes(classification as QuestionType)) {
        return classification as QuestionType;
      }
      
      return QuestionType.KNOWLEDGE;
    } catch (error) {
      console.error('질문 분류 오류:', error);
      return QuestionType.KNOWLEDGE;
    }
  }

  // 소크라테스식 코칭 응답 생성
  async generateCoachingResponse(
    question: string, 
    questionType: QuestionType, 
    context: ChatContext
  ): Promise<string> {
    try {
      let systemPrompt = this.getSystemPrompt(questionType);
      let userPrompt = this.buildUserPrompt(question, context);

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // 이전 대화 컨텍스트 추가
      if (context.previousQuestions && context.previousQuestions.length > 0) {
        const recentQuestions = context.previousQuestions.slice(-3); // 최근 3개만
        recentQuestions.forEach(q => {
          messages.push({ role: 'user', content: q.question });
          if (q.aiResponse) {
            messages.push({ role: 'assistant', content: q.aiResponse });
          }
        });
      }

      messages.push({ role: 'user', content: question });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('AI 응답 생성 오류:', error);
      throw error;
    }
  }

  // 질문 유형별 시스템 프롬프트
  private getSystemPrompt(questionType: QuestionType): string {
    const basePrompt = `당신은 소크라테스식 교육 방법을 사용하는 AI 튜터입니다. 
학생이 스스로 답을 찾을 수 있도록 안내하는 것이 목표입니다.
친근하고 격려하는 톤으로 대화하세요.
한국어로 응답하고, 학생 수준에 맞춰 설명하세요.`;

    const typeSpecificPrompts = {
      [QuestionType.KNOWLEDGE]: `
${basePrompt}
단순 지식 질문에는 명확하고 간결한 답변을 제공하세요.
하지만 단순히 답만 주지 말고, 관련된 흥미로운 정보나 예시를 추가하세요.
"~는 ~입니다. 예를 들어..." 형식을 사용하세요.`,

      [QuestionType.REASONING]: `
${basePrompt}
추론 질문에는 직접 답하지 말고, 단계적으로 생각할 수 있도록 유도하세요.
"먼저 ~를 생각해볼까요?", "그렇다면 다음은 어떨까요?" 같은 질문을 사용하세요.
학생이 스스로 연결고리를 찾도록 도와주세요.`,

      [QuestionType.CRITICAL]: `
${basePrompt}
비판적 사고 질문에는 다양한 관점을 제시하세요.
"한편으로는 ~일 수 있고, 다른 관점에서는 ~일 수도 있어요"
"어떤 기준으로 판단하면 좋을까요?" 같은 방식으로 안내하세요.
정답이 하나가 아님을 강조하세요.`,

      [QuestionType.CREATIVE]: `
${basePrompt}
창의적 질문에는 상상력을 자극하는 응답을 하세요.
"흥미로운 생각이네요! 그렇다면..."으로 시작하세요.
"만약 ~라면 어떨까요?", "다른 방법도 있을까요?" 같은 확장 질문을 하세요.
틀에 박히지 않은 사고를 격려하세요.`,

      [QuestionType.REFLECTION]: `
${basePrompt}
성찰적 질문에는 학생의 이해도를 점검하고 깊이 있는 사고를 유도하세요.
"좋은 질문이에요. 지금까지 이해한 내용을 정리해볼까요?"
"이 부분에서 가장 중요한 것은 무엇일까요?"
메타인지를 발달시키는 질문을 하세요.`
    };

    return typeSpecificPrompts[questionType] || basePrompt;
  }

  // 사용자 프롬프트 구성
  private buildUserPrompt(question: string, context: ChatContext): string {
    let prompt = '';

    if (context.documentContent) {
      // 문서 내용이 너무 길면 요약 또는 관련 부분만 포함
      const relevantContent = this.extractRelevantContent(
        context.documentContent, 
        question,
        context.currentPage
      );
      prompt += `[학습 자료 내용]\n${relevantContent}\n\n`;
    }

    prompt += `[학생 정보]\n이름: ${context.studentName}\n\n`;
    prompt += `[현재 질문]\n${question}`;

    return prompt;
  }

  // 관련 내용 추출 (간단한 구현)
  private extractRelevantContent(
    fullContent: string, 
    question: string,
    currentPage?: number
  ): string {
    // 페이지 기반 추출
    if (currentPage !== undefined) {
      const pages = fullContent.split('\n\n');
      const startPage = Math.max(0, currentPage - 1);
      const endPage = Math.min(pages.length, currentPage + 2);
      return pages.slice(startPage, endPage).join('\n\n');
    }

    // 키워드 기반 추출 (간단한 구현)
    const lines = fullContent.split('\n');
    const keywords = question.split(' ').filter(word => word.length > 2);
    
    const relevantLines = lines.filter(line => 
      keywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))
    );

    if (relevantLines.length > 0) {
      return relevantLines.slice(0, 10).join('\n');
    }

    // 기본값: 처음 1000자
    return fullContent.substring(0, 1000);
  }

  // 대화 처리 메인 함수
  async processChat(
    question: string,
    classId: string,
    studentId: string,
    context?: any
  ): Promise<{
    response: string;
    questionType: QuestionType;
    questionId: string;
  }> {
    try {
      // 학생 정보 조회
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          class: {
            include: {
              document: true
            }
          }
        }
      });

      if (!student) {
        throw new Error('학생 정보를 찾을 수 없습니다.');
      }

      // 질문 유형 분류
      const questionType = await this.classifyQuestion(question);

      // 이전 질문들 조회 (컨텍스트용)
      const previousQuestions = await prisma.question.findMany({
        where: {
          classId,
          studentId
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // AI 응답 생성
      const chatContext: ChatContext = {
        documentContent: student.class.document?.content || '',
        studentName: student.name,
        previousQuestions: previousQuestions.reverse(),
        currentPage: context?.currentPage
      };

      const aiResponse = await this.generateCoachingResponse(
        question,
        questionType,
        chatContext
      );

      // 질문과 응답 저장
      const savedQuestion = await prisma.question.create({
        data: {
          classId,
          studentId,
          question,
          aiResponse,
          questionType,
          context
        }
      });

      return {
        response: aiResponse,
        questionType,
        questionId: savedQuestion.id
      };
    } catch (error) {
      console.error('채팅 처리 오류:', error);
      throw error;
    }
  }

  // 요약 생성 (교사용)
  async generateQuestionSummary(classId: string): Promise<string> {
    try {
      const questions = await prisma.question.findMany({
        where: { classId },
        include: {
          student: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      if (questions.length === 0) {
        return '아직 학생들의 질문이 없습니다.';
      }

      const questionList = questions.map(q => 
        `- ${q.student.name}: ${q.question} (${q.questionType})`
      ).join('\n');

      const prompt = `다음은 학생들의 질문 목록입니다:

${questionList}

이 질문들을 분석하여:
1. 가장 많이 나온 주제
2. 학생들이 어려워하는 부분
3. 추가 설명이 필요한 개념
4. 교사가 주목해야 할 사항

위 4가지를 간단히 요약해주세요.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.';
    } catch (error) {
      console.error('요약 생성 오류:', error);
      throw error;
    }
  }
}