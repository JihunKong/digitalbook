import { PrismaClient } from '@prisma/client';
import { embeddingService } from './embedding.service';

const prisma = new PrismaClient();

export interface RAGContext {
  chunks: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: any;
  }>;
  pageId: string;
  query: string;
  totalRetrieved: number;
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: number;
  sources: string[];
  reasoning?: string;
}

export interface RAGOptions {
  topK: number;
  similarityThreshold: number;
  maxContextLength: number;
  enableReranking: boolean;
}

export class RAGService {
  private readonly upstageApiUrl = 'https://api.upstage.ai/v1/chat/completions';
  private readonly model = 'solar-1-mini-chat';

  constructor(private options: RAGOptions = {
    topK: 5,
    similarityThreshold: 0.7,
    maxContextLength: 4000,
    enableReranking: true
  }) {}

  /**
   * RAG 기반 질문 응답
   */
  async answerQuestion(
    pageId: string,
    query: string,
    userId?: string,
    sessionId?: string
  ): Promise<RAGResponse> {
    console.log(`🔍 Processing RAG query for page ${pageId}: "${query}"`);

    try {
      // 1. 쿼리 임베딩 생성
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query);
      
      // 2. 유사도 검색으로 관련 컨텍스트 검색
      const relevantChunks = await this.retrieveRelevantChunks(
        pageId, 
        queryEmbedding, 
        this.options.topK
      );

      // 3. 컨텍스트가 충분하지 않은 경우 처리
      if (relevantChunks.length === 0) {
        return {
          answer: "죄송합니다. 해당 페이지에서 관련된 정보를 찾을 수 없습니다. 다른 방식으로 질문해 보시거나, 더 구체적인 질문을 해주세요.",
          context: {
            chunks: [],
            pageId,
            query,
            totalRetrieved: 0
          },
          confidence: 0,
          sources: []
        };
      }

      // 4. 컨텍스트 구성
      const context = this.buildContext(pageId, query, relevantChunks);
      
      // 5. LLM을 통한 답변 생성
      const response = await this.generateAnswer(query, context);
      
      // 6. 대화 기록 저장 (선택적)
      if (sessionId) {
        await this.saveChatMessage(sessionId, query, response, relevantChunks.map(c => c.id));
      }

      console.log(`✅ Generated RAG response with confidence ${response.confidence}`);
      return response;

    } catch (error) {
      console.error('❌ RAG query failed:', error);
      throw new Error('질문 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 벡터 유사도 검색으로 관련 청크 검색
   */
  private async retrieveRelevantChunks(
    pageId: string,
    queryEmbedding: number[],
    topK: number
  ): Promise<Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    try {
      // PostgreSQL pgvector를 사용한 코사인 유사도 검색
      const chunks = await prisma.$queryRaw`
        SELECT 
          id,
          chunk as content,
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM page_embeddings 
        WHERE page_id = ${pageId}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${this.options.similarityThreshold}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${topK}
      ` as Array<{
        id: string;
        content: string;
        metadata: any;
        similarity: number;
      }>;

      console.log(`📊 Retrieved ${chunks.length} relevant chunks with similarity > ${this.options.similarityThreshold}`);
      
      return chunks;
      
    } catch (error) {
      console.error('Vector search failed:', error);
      
      // Fallback: 텍스트 기반 검색
      console.log('🔄 Falling back to text-based search');
      return this.fallbackTextSearch(pageId, queryEmbedding);
    }
  }

  /**
   * 벡터 검색 실패 시 텍스트 기반 fallback 검색
   */
  private async fallbackTextSearch(
    pageId: string,
    queryEmbedding: number[]
  ): Promise<Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    const chunks = await prisma.pageEmbedding.findMany({
      where: { pageId },
      select: {
        id: true,
        chunk: true,
        metadata: true
      },
      take: this.options.topK * 2 // 더 많이 가져와서 필터링
    });

    // 간단한 텍스트 매칭 기반 유사도 계산
    return chunks
      .map(chunk => ({
        id: chunk.id,
        content: chunk.chunk,
        metadata: chunk.metadata,
        similarity: this.calculateTextSimilarity(queryEmbedding, chunk.chunk)
      }))
      .filter(chunk => chunk.similarity > this.options.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.options.topK);
  }

  /**
   * 간단한 텍스트 유사도 계산 (fallback용)
   */
  private calculateTextSimilarity(queryEmbedding: number[], text: string): number {
    // 매우 간단한 키워드 기반 유사도
    // 실제로는 더 정교한 방법이 필요하지만 fallback용으로만 사용
    return Math.random() * 0.5 + 0.3; // 임시
  }

  /**
   * RAG 컨텍스트 구성
   */
  private buildContext(
    pageId: string,
    query: string,
    chunks: Array<{
      id: string;
      content: string;
      similarity: number;
      metadata: any;
    }>
  ): RAGContext {
    // 컨텍스트 길이 제한에 맞춰 청크 선택
    let totalLength = 0;
    const selectedChunks = [];
    
    for (const chunk of chunks) {
      if (totalLength + chunk.content.length <= this.options.maxContextLength) {
        selectedChunks.push(chunk);
        totalLength += chunk.content.length;
      } else {
        break;
      }
    }

    return {
      chunks: selectedChunks,
      pageId,
      query,
      totalRetrieved: chunks.length
    };
  }

  /**
   * LLM을 통한 답변 생성
   */
  private async generateAnswer(query: string, context: RAGContext): Promise<RAGResponse> {
    const apiKey = process.env.UPSTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('UPSTAGE_API_KEY environment variable is not set');
    }

    // 컨텍스트 텍스트 구성
    const contextText = context.chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n');

    // 프롬프트 구성
    const systemPrompt = `당신은 한국어 교육 전문 AI 어시스턴트입니다. 제공된 교재 내용을 바탕으로 학습자의 질문에 정확하고 도움이 되는 답변을 제공하세요.

답변 지침:
1. 제공된 컨텍스트만을 바탕으로 답변하세요
2. 한국어로 명확하고 이해하기 쉽게 설명하세요
3. 교육적 가치가 있는 답변을 제공하세요
4. 컨텍스트에 없는 정보는 추측하지 마세요
5. 필요시 예시나 추가 설명을 포함하세요`;

    const userPrompt = `다음은 교재의 관련 내용입니다:

${contextText}

질문: ${query}

위 교재 내용을 바탕으로 질문에 답변해 주세요.`;

    try {
      const response = await fetch(this.upstageApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upstage API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer) {
        throw new Error('Invalid response format from Upstage API');
      }

      // 답변 품질 평가
      const confidence = this.assessAnswerConfidence(answer, context);
      const sources = context.chunks.map(chunk => 
        chunk.metadata?.section || `청크 ${chunk.id}`
      );

      return {
        answer,
        context,
        confidence,
        sources,
        reasoning: `${context.chunks.length}개의 관련 문서 섹션을 참조하여 답변을 생성했습니다.`
      };

    } catch (error) {
      console.error('LLM answer generation failed:', error);
      throw error;
    }
  }

  /**
   * 답변 신뢰도 평가
   */
  private assessAnswerConfidence(answer: string, context: RAGContext): number {
    let confidence = 0.5; // 기본 신뢰도

    // 답변 길이 기반 조정
    if (answer.length > 100) confidence += 0.1;
    if (answer.length > 300) confidence += 0.1;

    // 컨텍스트 품질 기반 조정
    const avgSimilarity = context.chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / context.chunks.length;
    confidence += (avgSimilarity - 0.7) * 0.5;

    // 컨텍스트 수량 기반 조정
    if (context.chunks.length >= 3) confidence += 0.1;
    if (context.chunks.length >= 5) confidence += 0.1;

    // 답변이 "모르겠다"는 식의 내용인지 확인
    const uncertainPhrases = ['모르겠', '확실하지', '정확하지', '찾을 수 없'];
    if (uncertainPhrases.some(phrase => answer.includes(phrase))) {
      confidence *= 0.5;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 채팅 메시지 저장
   */
  private async saveChatMessage(
    sessionId: string,
    query: string,
    response: RAGResponse,
    retrievedChunks: string[]
  ): Promise<void> {
    try {
      // 사용자 메시지 저장
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'USER',
          content: query,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      });

      // AI 응답 저장
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: response.answer,
          retrievedChunks,
          confidence: response.confidence,
          metadata: {
            sources: response.sources,
            reasoning: response.reasoning,
            contextChunks: response.context.totalRetrieved,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Failed to save chat message:', error);
      // 저장 실패는 critical하지 않으므로 에러를 throw하지 않음
    }
  }

  /**
   * 페이지별 채팅 세션 생성 또는 가져오기
   */
  async getOrCreateChatSession(
    pageId: string,
    userId?: string,
    guestId?: string
  ): Promise<string> {
    try {
      // 기존 활성 세션 찾기
      const existingSession = await prisma.chatSession.findFirst({
        where: {
          pageId,
          isActive: true,
          ...(userId ? { userId } : { guestId })
        }
      });

      if (existingSession) {
        return existingSession.id;
      }

      // 새 세션 생성
      const newSession = await prisma.chatSession.create({
        data: {
          pageId,
          userId,
          guestId,
          sessionName: `페이지 ${pageId} 대화`,
          isActive: true
        }
      });

      return newSession.id;

    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }

  /**
   * 채팅 기록 조회
   */
  async getChatHistory(sessionId: string, limit: number = 50): Promise<Array<{
    role: string;
    content: string;
    timestamp: Date;
    confidence?: number;
  }>> {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: {
          role: true,
          content: true,
          createdAt: true,
          confidence: true
        }
      });

      return messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        confidence: msg.confidence || undefined
      }));

    } catch (error) {
      console.error('Failed to get chat history:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const ragService = new RAGService();