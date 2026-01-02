import OpenAI from 'openai';
import { logger } from '../utils/logger';
import FormData from 'form-data';
import fs from 'fs';

// Upstage API Types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ParsedDocument {
  content: string;
  pages: ParsedPage[];
  metadata: DocumentMetadata;
}

interface ParsedPage {
  pageNumber: number;
  text: string;
  elements?: DocumentElement[];
}

interface DocumentElement {
  type: 'text' | 'table' | 'image' | 'heading';
  content: string;
  coordinates?: { x: number; y: number; width: number; height: number };
}

interface DocumentMetadata {
  totalPages: number;
  language?: string;
  title?: string;
}

class UpstageService {
  private client: OpenAI;
  private mockMode: boolean;
  private baseUrl: string = 'https://api.upstage.ai/v1';

  constructor() {
    this.mockMode = !process.env.UPSTAGE_API_KEY;

    if (this.mockMode) {
      logger.warn('Upstage API key not found. Running in mock mode.');
      this.client = null as any;
    } else {
      this.client = new OpenAI({
        apiKey: process.env.UPSTAGE_API_KEY,
        baseURL: this.baseUrl,
      });
    }
  }

  /**
   * Chat completion using Solar Pro2
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    try {
      if (this.mockMode) {
        return this.getMockChatResponse(messages);
      }

      const response = await this.client.chat.completions.create({
        model: 'solar-pro2',
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Upstage chat error:', error);
      throw new Error('Failed to get chat response from Upstage');
    }
  }

  /**
   * Chat with streaming response
   */
  async chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<AsyncIterable<string>> {
    if (this.mockMode) {
      return this.getMockStreamResponse();
    }

    const stream = await this.client.chat.completions.create({
      model: 'solar-pro2',
      messages: messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    });

    return this.processStream(stream);
  }

  private async *processStream(stream: any): AsyncIterable<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Parse document using Upstage Document Parser
   */
  async parseDocument(filePath: string): Promise<ParsedDocument> {
    try {
      if (this.mockMode) {
        return this.getMockParsedDocument();
      }

      const formData = new FormData();
      formData.append('document', fs.createReadStream(filePath));

      const response = await fetch(
        `${this.baseUrl}/document-ai/document-parse`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTAGE_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData as any,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Upstage Document Parser error:', errorText);
        throw new Error(`Document parsing failed: ${response.status}`);
      }

      const result = await response.json();
      return this.transformParseResult(result);
    } catch (error) {
      logger.error('Document parsing error:', error);
      throw new Error('Failed to parse document with Upstage');
    }
  }

  /**
   * Parse document from buffer
   */
  async parseDocumentFromBuffer(
    buffer: Buffer,
    filename: string = 'document.pdf'
  ): Promise<ParsedDocument> {
    try {
      if (this.mockMode) {
        return this.getMockParsedDocument();
      }

      const formData = new FormData();
      formData.append('document', buffer, {
        filename,
        contentType: 'application/pdf',
      });

      const response = await fetch(
        `${this.baseUrl}/document-ai/document-parse`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTAGE_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData as any,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Upstage Document Parser error:', errorText);
        throw new Error(`Document parsing failed: ${response.status}`);
      }

      const result = await response.json();
      return this.transformParseResult(result);
    } catch (error) {
      logger.error('Document parsing from buffer error:', error);
      throw new Error('Failed to parse document buffer with Upstage');
    }
  }

  /**
   * Transform Upstage API response to our format
   */
  private transformParseResult(result: any): ParsedDocument {
    // Upstage returns content in HTML or Markdown format
    const content = result.content || result.text || '';
    const pages: ParsedPage[] = [];

    // If Upstage provides page-level information
    if (result.pages && Array.isArray(result.pages)) {
      result.pages.forEach((page: any, index: number) => {
        pages.push({
          pageNumber: index + 1,
          text: page.text || page.content || '',
          elements: page.elements || [],
        });
      });
    } else {
      // Split content by page markers if single content string
      const pageContents = this.splitContentByPages(content);
      pageContents.forEach((text, index) => {
        pages.push({
          pageNumber: index + 1,
          text: text,
        });
      });
    }

    return {
      content,
      pages,
      metadata: {
        totalPages: pages.length || 1,
        language: result.language || 'ko',
        title: result.title || undefined,
      },
    };
  }

  /**
   * Split content string into pages
   */
  private splitContentByPages(content: string): string[] {
    // Try to split by common page markers
    const pageMarkerRegex = /(?:^|\n)(?:---|\*\*\*|___|\[Page \d+\]|페이지 \d+)\n/gi;
    const parts = content.split(pageMarkerRegex).filter((p) => p.trim());

    if (parts.length > 1) {
      return parts;
    }

    // If no markers, split by approximate character count (about 1500 chars per page)
    const pages: string[] = [];
    const charsPerPage = 1500;
    let currentIndex = 0;

    while (currentIndex < content.length) {
      let endIndex = Math.min(currentIndex + charsPerPage, content.length);

      // Try to find a good break point (paragraph or sentence)
      if (endIndex < content.length) {
        const breakPoint = content.lastIndexOf('\n\n', endIndex);
        if (breakPoint > currentIndex) {
          endIndex = breakPoint;
        } else {
          const sentenceBreak = content.lastIndexOf('. ', endIndex);
          if (sentenceBreak > currentIndex) {
            endIndex = sentenceBreak + 1;
          }
        }
      }

      pages.push(content.slice(currentIndex, endIndex).trim());
      currentIndex = endIndex;
    }

    return pages.length > 0 ? pages : [content];
  }

  /**
   * Extract concepts from text using Solar Pro2
   */
  async extractConcepts(
    text: string,
    grade?: number,
    subject?: string
  ): Promise<any> {
    const systemPrompt = `당신은 한국 교육과정에 정통한 교육 전문가입니다.
주어진 텍스트에서 핵심 개념을 추출하고 구조화해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "concepts": [
    {
      "name": "개념 이름",
      "description": "개념 설명",
      "difficulty": 1-5 (난이도),
      "category": "카테고리",
      "keywords": ["키워드1", "키워드2"],
      "learningObjectives": ["학습목표1"],
      "inquiryQuestions": ["탐구질문1"]
    }
  ],
  "relationships": [
    {
      "fromConceptName": "개념A",
      "toConceptName": "개념B",
      "type": "PREREQUISITE|RELATED|EXTENDS|CONTRASTS|APPLIES",
      "strength": 0.0-1.0
    }
  ]
}`;

    const userPrompt = `다음 교과서 텍스트에서 핵심 개념을 추출해주세요.
${grade ? `학년: ${grade}학년` : ''}
${subject ? `과목: ${subject}` : ''}

텍스트:
${text.substring(0, 3000)}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3 });

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Failed to parse concept extraction response:', error);
      return {
        concepts: [],
        relationships: [],
      };
    }
  }

  /**
   * Generate quiz questions from content
   */
  async generateQuiz(
    content: string,
    count: number = 5,
    grade?: number
  ): Promise<any[]> {
    const systemPrompt = `당신은 교육 평가 전문가입니다.
주어진 내용을 바탕으로 학생들의 이해도를 평가할 수 있는 퀴즈를 생성해주세요.

다음 JSON 형식으로 응답해주세요:
[
  {
    "question": "질문 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctAnswer": 0,
    "explanation": "정답 설명",
    "difficulty": "easy|medium|hard"
  }
]`;

    const userPrompt = `다음 내용을 바탕으로 ${count}개의 4지선다 퀴즈를 만들어주세요.
${grade ? `대상 학년: ${grade}학년` : ''}

내용:
${content.substring(0, 2000)}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.5 });

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON array found in response');
    } catch (error) {
      logger.error('Failed to parse quiz generation response:', error);
      return [];
    }
  }

  /**
   * Analyze PDF metadata
   */
  async analyzePDFMetadata(
    extractedText: string,
    fileName?: string
  ): Promise<any> {
    const systemPrompt = `당신은 교육 자료 분석 전문가입니다.
PDF 교과서의 내용을 분석하여 메타데이터를 추출해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "교과서 제목",
  "subject": "과목명 (국어/수학/과학/사회/영어/도덕/체육/음악/미술/실과)",
  "grade": "학년 (1-6)",
  "description": "교과서 설명",
  "estimatedPages": 페이지 수,
  "mainTopics": ["주제1", "주제2"],
  "difficulty": "쉬움/보통/어려움",
  "confidence": 0-100
}`;

    const userPrompt = `다음 PDF 내용을 분석해주세요.
파일명: ${fileName || '알 수 없음'}

텍스트:
${extractedText.substring(0, 2000)}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Failed to parse metadata analysis response:', error);
      return {
        title: fileName?.replace(/\.[^/.]+$/, '') || '새 교과서',
        subject: '국어',
        grade: '3',
        description: '',
        estimatedPages: 1,
        mainTopics: [],
        difficulty: '보통',
        confidence: 20,
      };
    }
  }

  // Mock responses for development
  private getMockChatResponse(messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    return `[Mock Response] 질문 "${lastMessage?.content?.substring(0, 50)}..."에 대한 답변입니다. Upstage API 키가 설정되면 실제 응답을 받을 수 있습니다.`;
  }

  private async *getMockStreamResponse(): AsyncIterable<string> {
    const words = ['안녕하세요!', ' ', '이것은', ' ', 'Mock', ' ', '스트리밍', ' ', '응답입니다.'];
    for (const word of words) {
      yield word;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  private getMockParsedDocument(): ParsedDocument {
    return {
      content: '[Mock] PDF 문서 내용입니다. Upstage API 키가 설정되면 실제 파싱 결과를 받을 수 있습니다.',
      pages: [
        {
          pageNumber: 1,
          text: '[Mock] 첫 번째 페이지 내용',
        },
      ],
      metadata: {
        totalPages: 1,
        language: 'ko',
      },
    };
  }
}

export const upstageService = new UpstageService();
export default upstageService;
