import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { aiService } from './ai.service';
import pdfService from './pdf.service';
import { getRedis } from '../config/redis';

const prisma = new PrismaClient();

interface Question {
  type: 'fill_in_blank' | 'multiple_choice' | 'short_answer' | 'essay';
  question: string;
  answer?: string;
  options?: string[];
  correctOption?: number;
  hint?: string;
  points?: number;
}

interface ActivityData {
  pageNumber: number;
  fillInBlanks: Question[];
  comprehension: Question[];
  vocabulary: Question[];
}

export class ActivityService {
  /**
   * Generate activities from PDF content
   */
  async generateActivitiesFromPDF(pdfId: string, teacherId: string, autoGenerate: boolean = true) {
    try {
      logger.info(`Generating activities for PDF: ${pdfId}`);
      
      // Get PDF information
      const pdf = await prisma.pDFTextbook.findUnique({
        where: { id: pdfId },
        include: { class: true }
      });
      
      if (!pdf) {
        throw new Error('PDF not found');
      }
      
      if (!pdf.parsedContent) {
        throw new Error('PDF content not yet processed');
      }
      
      const content = pdf.parsedContent as any;
      const activities: ActivityData[] = [];
      
      // Generate activities for each page
      for (const page of content.pages || []) {
        logger.info(`Generating activities for page ${page.pageNumber}`);
        
        // Skip if page has too little content
        if (!page.text || page.text.length < 100) {
          continue;
        }
        
        const pageActivities = await this.generatePageActivities(
          page.text,
          page.pageNumber,
          pdf.class.grade || '5',
          pdf.class.subject || '국어'
        );
        
        activities.push(pageActivities);
        
        // Cache activities for quick access
        try {
          const redis = getRedis();
          await redis.set(
            `activities:${pdfId}:page:${page.pageNumber}`,
            JSON.stringify(pageActivities),
            'EX',
            86400 // 24 hours
          );
        } catch (redisError) {
          logger.warn('Failed to cache activities in Redis:', redisError);
        }
      }
      
      // Save activities to database
      const savedActivities = [];
      for (const activity of activities) {
        // Create fill-in-the-blank activity
        if (activity.fillInBlanks.length > 0) {
          const fillInBlankActivity = await prisma.activity.create({
            data: {
              classId: pdf.classId,
              textbookId: pdfId,
              title: `Page ${activity.pageNumber} - 빈칸 채우기`,
              description: `${activity.pageNumber}페이지의 핵심 내용을 빈칸에 채워보세요.`,
              type: 'fill_in_blank',
              questions: activity.fillInBlanks as any,
              createdBy: teacherId,
              modifiable: true
            }
          });
          savedActivities.push(fillInBlankActivity);
        }
        
        // Create comprehension activity
        if (activity.comprehension.length > 0) {
          const comprehensionActivity = await prisma.activity.create({
            data: {
              classId: pdf.classId,
              textbookId: pdfId,
              title: `Page ${activity.pageNumber} - 이해도 확인`,
              description: `${activity.pageNumber}페이지 내용을 잘 이해했는지 확인해보세요.`,
              type: 'multiple_choice',
              questions: activity.comprehension as any,
              createdBy: teacherId,
              modifiable: true
            }
          });
          savedActivities.push(comprehensionActivity);
        }
        
        // Create vocabulary activity
        if (activity.vocabulary.length > 0) {
          const vocabActivity = await prisma.activity.create({
            data: {
              classId: pdf.classId,
              textbookId: pdfId,
              title: `Page ${activity.pageNumber} - 어휘 학습`,
              description: `${activity.pageNumber}페이지의 중요 어휘를 학습해보세요.`,
              type: 'short_answer',
              questions: activity.vocabulary as any,
              createdBy: teacherId,
              modifiable: true
            }
          });
          savedActivities.push(vocabActivity);
        }
      }
      
      logger.info(`Generated ${savedActivities.length} activities for PDF ${pdfId}`);
      
      return {
        success: true,
        pdfId,
        totalActivities: savedActivities.length,
        activities: savedActivities.map(a => ({
          id: a.id,
          title: a.title,
          type: a.type
        }))
      };
    } catch (error) {
      logger.error('Activity generation error:', error);
      throw error;
    }
  }
  
  /**
   * Generate activities for a single page
   */
  private async generatePageActivities(
    pageText: string,
    pageNumber: number,
    grade: string,
    subject: string
  ): Promise<ActivityData> {
    try {
      // Generate fill-in-the-blank questions
      const fillInBlanks = await this.generateFillInBlanks(pageText, grade);
      
      // Generate comprehension questions
      const comprehension = await this.generateComprehensionQuestions(pageText, grade);
      
      // Generate vocabulary exercises
      const vocabulary = await this.generateVocabularyExercises(pageText, grade);
      
      return {
        pageNumber,
        fillInBlanks,
        comprehension,
        vocabulary
      };
    } catch (error) {
      logger.error(`Error generating activities for page ${pageNumber}:`, error);
      
      // Return empty activities on error
      return {
        pageNumber,
        fillInBlanks: [],
        comprehension: [],
        vocabulary: []
      };
    }
  }
  
  /**
   * Generate fill-in-the-blank questions
   */
  private async generateFillInBlanks(text: string, grade: string): Promise<Question[]> {
    try {
      const prompt = `
다음 텍스트를 읽고 ${grade}학년 학생을 위한 빈칸 채우기 문제 3개를 만들어주세요.
중요한 개념이나 핵심 단어를 빈칸으로 만들어주세요.

텍스트:
${text.substring(0, 1500)}

다음 JSON 형식으로 정확히 응답해주세요:
[
  {
    "type": "fill_in_blank",
    "question": "문장에서 _____ 부분을 채우세요",
    "answer": "정답",
    "hint": "힌트",
    "points": 10
  }
]
`;
      
      const response = await aiService.generateTextbookContent(prompt, {
        grade: parseInt(grade),
        subject: '국어',
        length: 'short'
      });
      
      // Check if mock response
      if (response.model === 'mock') {
        return this.createFallbackFillInBlanks(text);
      }
      
      try {
        // Extract JSON from response
        const jsonMatch = response.content?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return questions.slice(0, 3); // Limit to 3 questions
        }
      } catch (parseError) {
        logger.warn('Failed to parse fill-in-blank questions:', parseError);
      }
      
      // Fallback: Create simple fill-in-blank questions
      return this.createFallbackFillInBlanks(text);
    } catch (error) {
      logger.error('Fill-in-blank generation error:', error);
      return this.createFallbackFillInBlanks(text);
    }
  }
  
  /**
   * Generate comprehension questions
   */
  private async generateComprehensionQuestions(text: string, grade: string): Promise<Question[]> {
    try {
      const prompt = `
다음 텍스트를 읽고 ${grade}학년 학생을 위한 객관식 이해도 문제 3개를 만들어주세요.

텍스트:
${text.substring(0, 1500)}

다음 JSON 형식으로 정확히 응답해주세요:
[
  {
    "type": "multiple_choice",
    "question": "질문",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctOption": 0,
    "hint": "힌트",
    "points": 10
  }
]
`;
      
      const response = await aiService.generateTextbookContent(prompt, {
        grade: parseInt(grade),
        subject: '국어',
        length: 'short'
      });
      
      try {
        const jsonMatch = response.content?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return questions.slice(0, 3);
        }
      } catch (parseError) {
        logger.warn('Failed to parse comprehension questions:', parseError);
      }
      
      return this.createFallbackComprehensionQuestions(text);
    } catch (error) {
      logger.error('Comprehension question generation error:', error);
      return this.createFallbackComprehensionQuestions(text);
    }
  }
  
  /**
   * Generate vocabulary exercises
   */
  private async generateVocabularyExercises(text: string, grade: string): Promise<Question[]> {
    try {
      const prompt = `
다음 텍스트에서 ${grade}학년 학생이 알아야 할 중요 어휘 3개를 찾아 문제를 만들어주세요.

텍스트:
${text.substring(0, 1500)}

다음 JSON 형식으로 정확히 응답해주세요:
[
  {
    "type": "vocabulary",
    "question": "다음 단어의 뜻은 무엇인가요: [단어]",
    "answer": "단어의 뜻",
    "hint": "문맥상 힌트",
    "points": 5
  }
]
`;
      
      const response = await aiService.generateTextbookContent(prompt, {
        grade: parseInt(grade),
        subject: '국어',
        length: 'short'
      });
      
      try {
        const jsonMatch = response.content?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return questions.slice(0, 3);
        }
      } catch (parseError) {
        logger.warn('Failed to parse vocabulary questions:', parseError);
      }
      
      return [];
    } catch (error) {
      logger.error('Vocabulary exercise generation error:', error);
      return [];
    }
  }
  
  /**
   * Fallback methods for question generation
   */
  private createFallbackFillInBlanks(text: string): Question[] {
    // Extract sentences and create simple fill-in-blanks
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    const questions: Question[] = [];
    
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ');
      
      if (words.length > 5) {
        // Hide a word in the middle
        const indexToHide = Math.floor(words.length / 2);
        const answer = words[indexToHide];
        words[indexToHide] = '_____';
        
        questions.push({
          type: 'fill_in_blank',
          question: words.join(' '),
          answer: answer,
          hint: `${answer.length}글자입니다`,
          points: 10
        });
      }
    }
    
    return questions;
  }
  
  private createFallbackComprehensionQuestions(text: string): Question[] {
    return [
      {
        type: 'multiple_choice',
        question: '이 페이지의 주요 내용은 무엇인가요?',
        options: [
          '내용을 요약한 선택지',
          '관련 없는 선택지 1',
          '관련 없는 선택지 2',
          '관련 없는 선택지 3'
        ],
        correctOption: 0,
        hint: '본문을 다시 읽어보세요',
        points: 10
      }
    ];
  }
  
  /**
   * Get activities for a specific page
   */
  async getPageActivities(pdfId: string, pageNumber: number) {
    try {
      // Try to get from cache first
      try {
        const redis = getRedis();
        const cached = await redis.get(`activities:${pdfId}:page:${pageNumber}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (redisError) {
        logger.warn('Failed to get activities from Redis cache:', redisError);
      }
      
      // Get from database
      const activities = await prisma.activity.findMany({
        where: {
          textbookId: pdfId,
          title: {
            contains: `Page ${pageNumber}`
          }
        }
      });
      
      return activities;
    } catch (error) {
      logger.error('Get page activities error:', error);
      return [];
    }
  }
  
  /**
   * Submit activity response
   */
  async submitResponse(activityId: string, studentId: string, answers: any) {
    try {
      // Get activity details
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });
      
      if (!activity) {
        throw new Error('Activity not found');
      }
      
      // Calculate score
      const score = this.calculateScore(activity.questions as any, answers);
      
      // Save response
      const response = await prisma.activityResponse.create({
        data: {
          activityId,
          studentId,
          answers,
          score,
          submittedAt: new Date()
        }
      });
      
      // Update Redis with submission
      try {
        const redis = getRedis();
        await redis.set(
          `response:${activityId}:${studentId}`,
          JSON.stringify(response),
          'EX',
          86400
        );
      } catch (redisError) {
        logger.warn('Failed to cache response in Redis:', redisError);
      }
      
      logger.info(`Activity response submitted: ${response.id}`);
      
      return response;
    } catch (error) {
      logger.error('Submit response error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate score for activity
   */
  private calculateScore(questions: Question[], answers: any): number {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    questions.forEach((question, index) => {
      const points = question.points || 10;
      totalPoints += points;
      
      const studentAnswer = answers[index];
      
      if (question.type === 'fill_in_blank' || question.type === 'short_answer') {
        if (studentAnswer && question.answer) {
          // Check if answer matches (case-insensitive)
          if (studentAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
            earnedPoints += points;
          }
        }
      } else if (question.type === 'multiple_choice') {
        if (studentAnswer === question.correctOption) {
          earnedPoints += points;
        }
      }
    });
    
    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  }
}

export const activityService = new ActivityService();