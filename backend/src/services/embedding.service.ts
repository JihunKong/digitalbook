import { PrismaClient } from '@prisma/client';
import { PageSegment } from './pageSegmentation.service';

const prisma = new PrismaClient();

export interface EmbeddingChunk {
  id: string;
  pageId: string;
  chunk: string;
  embedding: number[];
  chunkIndex: number;
  metadata: {
    pageNumber?: number;
    section?: string;
    wordCount?: number;
    difficulty?: string;
    [key: string]: any;
  };
}

export interface EmbeddingOptions {
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
}

export class EmbeddingService {
  private readonly upstageApiUrl = 'https://api.upstage.ai/v1/embeddings';
  private readonly model = 'embedding-query';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1초

  constructor(private options: EmbeddingOptions = {
    chunkSize: 500,
    chunkOverlap: 50,
    batchSize: 10
  }) {}

  /**
   * 페이지 세그먼트에서 임베딩 생성 및 저장
   */
  async generatePageEmbeddings(
    pageId: string,
    segments: PageSegment[]
  ): Promise<EmbeddingChunk[]> {
    const chunks: EmbeddingChunk[] = [];
    
    console.log(`🔥 Generating embeddings for page ${pageId} with ${segments.length} segments`);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // 세그먼트를 더 작은 청크로 분할
      const textChunks = this.splitIntoChunks(
        segment.content, 
        this.options.chunkSize, 
        this.options.chunkOverlap
      );

      // 각 청크에 대해 임베딩 생성
      for (let j = 0; j < textChunks.length; j++) {
        const chunkText = textChunks[j];
        
        try {
          const embedding = await this.generateEmbedding(chunkText);
          
          const chunk: EmbeddingChunk = {
            id: `${pageId}-chunk-${i}-${j}`,
            pageId,
            chunk: chunkText,
            embedding,
            chunkIndex: chunks.length,
            metadata: {
              ...segment.metadata,
              segmentId: segment.id,
              chunkInSegment: j,
              totalChunksInSegment: textChunks.length
            }
          };
          
          chunks.push(chunk);
          
          // 데이터베이스에 저장
          await this.saveEmbeddingToDatabase(chunk);
          
          console.log(`✅ Generated embedding for chunk ${chunks.length} (${chunkText.length} chars)`);
          
        } catch (error) {
          console.error(`❌ Failed to generate embedding for chunk ${i}-${j}:`, error);
          // 실패한 청크는 건너뛰고 계속 진행
        }
      }
    }

    console.log(`🎉 Generated ${chunks.length} embeddings for page ${pageId}`);
    return chunks;
  }

  /**
   * Upstage API를 사용하여 단일 임베딩 생성
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.UPSTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('UPSTAGE_API_KEY environment variable is not set');
    }

    // 텍스트 전처리
    const cleanText = this.preprocessText(text);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.upstageApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: cleanText,
            model: this.model
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upstage API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
          throw new Error('Invalid response format from Upstage API');
        }

        return data.data[0].embedding;
        
      } catch (error) {
        console.error(`Embedding attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw new Error('Failed to generate embedding after all retries');
  }

  /**
   * 배치로 여러 임베딩 생성
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // 배치 크기로 나누어 처리
    for (let i = 0; i < texts.length; i += this.options.batchSize) {
      const batch = texts.slice(i, i + this.options.batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      
      try {
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);
        
        console.log(`📦 Processed batch ${Math.floor(i / this.options.batchSize) + 1}/${Math.ceil(texts.length / this.options.batchSize)}`);
        
        // API 레이트 리밋 방지를 위한 지연
        if (i + this.options.batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ Batch embedding failed for batch starting at index ${i}:`, error);
        throw error;
      }
    }
    
    return embeddings;
  }

  /**
   * 데이터베이스에 임베딩 저장
   */
  private async saveEmbeddingToDatabase(chunk: EmbeddingChunk): Promise<void> {
    try {
      await prisma.pageEmbedding.create({
        data: {
          pageId: chunk.pageId,
          chunk: chunk.chunk,
          embedding: chunk.embedding,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata
        }
      });
    } catch (error) {
      console.error('Failed to save embedding to database:', error);
      throw error;
    }
  }

  /**
   * 페이지의 모든 임베딩 삭제
   */
  async deletePageEmbeddings(pageId: string): Promise<void> {
    try {
      await prisma.pageEmbedding.deleteMany({
        where: { pageId }
      });
      console.log(`🗑️ Deleted all embeddings for page ${pageId}`);
    } catch (error) {
      console.error(`Failed to delete embeddings for page ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * 유사도 검색을 위한 쿼리 임베딩 생성
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    const cleanQuery = this.preprocessText(query);
    return this.generateEmbedding(cleanQuery);
  }

  /**
   * 텍스트를 청크로 분할
   */
  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);
      
      // 단어 경계에서 자르기
      if (end < text.length) {
        const lastSpaceIndex = chunk.lastIndexOf(' ');
        if (lastSpaceIndex > chunkSize * 0.8) {
          chunk = chunk.slice(0, lastSpaceIndex);
        }
      }
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      // 다음 시작점 계산 (오버랩 고려)
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * 텍스트 전처리
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')  // 연속된 공백을 하나로
      .replace(/\n+/g, '\n') // 연속된 줄바꿈을 하나로
      .slice(0, 8000);       // Upstage API 제한에 맞춰 자르기
  }

  /**
   * 임베딩 품질 검증
   */
  validateEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return false;
    }
    
    // 임베딩 차원 확인 (Upstage는 보통 1024차원)
    if (embedding.length !== 1024) {
      console.warn(`Unexpected embedding dimension: ${embedding.length}`);
    }
    
    // 모든 값이 숫자인지 확인
    return embedding.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * 페이지 임베딩 통계 조회
   */
  async getPageEmbeddingStats(pageId: string): Promise<{
    totalChunks: number;
    avgChunkLength: number;
    totalTokens: number;
  }> {
    const embeddings = await prisma.pageEmbedding.findMany({
      where: { pageId },
      select: { chunk: true }
    });
    
    const totalChunks = embeddings.length;
    const totalChars = embeddings.reduce((sum, emb) => sum + emb.chunk.length, 0);
    const avgChunkLength = totalChunks > 0 ? Math.round(totalChars / totalChunks) : 0;
    
    // 대략적인 토큰 수 (한국어 기준)
    const totalTokens = Math.ceil(totalChars * 0.75);
    
    return {
      totalChunks,
      avgChunkLength,
      totalTokens
    };
  }
}

// 싱글톤 인스턴스
export const embeddingService = new EmbeddingService();