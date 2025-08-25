import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export interface PageSegment {
  id: string;
  content: string;
  contentType: 'TEXT' | 'FILE' | 'MIXED';
  startIndex: number;
  endIndex: number;
  metadata: {
    pageNumber?: number;
    section?: string;
    estimatedReadTime?: number;
    wordCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface SegmentationOptions {
  targetPageLength: number;
  chunkSize: number;
  chunkOverlap: number;
  enableSemanticSplitting: boolean;
}

export class PageSegmentationService {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(options: SegmentationOptions = {
    targetPageLength: 500,
    chunkSize: 1000,
    chunkOverlap: 200,
    enableSemanticSplitting: true
  }) {
    // LangChain의 RecursiveCharacterTextSplitter 초기화
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize,
      chunkOverlap: options.chunkOverlap,
      separators: [
        '\n\n\n',  // 섹션 구분자
        '\n\n',    // 문단 구분자
        '\n',      // 줄바꿈
        '. ',      // 문장 구분자
        '! ',      // 느낌표
        '? ',      // 물음표
        '; ',      // 세미콜론
        ', ',      // 쉼표
        ' ',       // 공백
        '',        // 문자 단위
      ],
    });
  }

  /**
   * 텍스트 전용 콘텐츠 분할
   */
  async segmentTextContent(
    text: string, 
    options: Partial<SegmentationOptions> = {}
  ): Promise<PageSegment[]> {
    const segments: PageSegment[] = [];
    
    // LangChain으로 텍스트 분할
    const chunks = await this.textSplitter.createDocuments([text]);
    
    let currentIndex = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const content = chunk.pageContent;
      const wordCount = this.getWordCount(content);
      const estimatedReadTime = this.calculateReadTime(content);
      
      const segment: PageSegment = {
        id: `text-segment-${i + 1}`,
        content,
        contentType: 'TEXT',
        startIndex: currentIndex,
        endIndex: currentIndex + content.length,
        metadata: {
          pageNumber: i + 1,
          section: this.extractSectionTitle(content),
          estimatedReadTime,
          wordCount,
          difficulty: this.assessDifficulty(content)
        }
      };
      
      segments.push(segment);
      currentIndex += content.length;
    }
    
    return segments;
  }

  /**
   * 파일 기반 콘텐츠 분할 (PDF 페이지 기준)
   */
  async segmentFileContent(
    extractedText: string,
    fileType: string,
    originalPages?: number
  ): Promise<PageSegment[]> {
    const segments: PageSegment[] = [];
    
    if (fileType === 'application/pdf' && originalPages) {
      // PDF의 경우 페이지 경계를 유지하면서 분할
      const averageCharsPerPage = Math.ceil(extractedText.length / originalPages);
      
      for (let i = 0; i < originalPages; i++) {
        const startIndex = i * averageCharsPerPage;
        const endIndex = Math.min(startIndex + averageCharsPerPage, extractedText.length);
        const content = extractedText.slice(startIndex, endIndex);
        
        if (content.trim().length > 0) {
          const segment: PageSegment = {
            id: `pdf-page-${i + 1}`,
            content: content.trim(),
            contentType: 'FILE',
            startIndex,
            endIndex,
            metadata: {
              pageNumber: i + 1,
              section: `PDF 페이지 ${i + 1}`,
              estimatedReadTime: this.calculateReadTime(content),
              wordCount: this.getWordCount(content),
              difficulty: this.assessDifficulty(content)
            }
          };
          
          segments.push(segment);
        }
      }
    } else {
      // 다른 파일 형식은 텍스트와 동일하게 처리
      return this.segmentTextContent(extractedText);
    }
    
    return segments;
  }

  /**
   * 혼합 콘텐츠 분할 (텍스트 + 파일)
   */
  async segmentMixedContent(
    textContent: string,
    fileContent: string,
    fileType: string,
    options: Partial<SegmentationOptions> = {}
  ): Promise<PageSegment[]> {
    const segments: PageSegment[] = [];
    
    // 1. 텍스트 콘텐츠 분할
    const textSegments = await this.segmentTextContent(textContent, options);
    
    // 2. 파일 콘텐츠 분할
    const fileSegments = await this.segmentFileContent(fileContent, fileType);
    
    // 3. 의미적 병합 - 텍스트와 파일 콘텐츠를 적절히 섞어서 배치
    const mixedSegments = this.mergeMixedContent(textSegments, fileSegments);
    
    return mixedSegments;
  }

  /**
   * 텍스트와 파일 세그먼트를 의미적으로 병합
   */
  private mergeMixedContent(
    textSegments: PageSegment[], 
    fileSegments: PageSegment[]
  ): PageSegment[] {
    const merged: PageSegment[] = [];
    let textIndex = 0;
    let fileIndex = 0;
    let pageNumber = 1;
    
    // 교대로 텍스트와 파일 콘텐츠를 배치
    while (textIndex < textSegments.length || fileIndex < fileSegments.length) {
      // 텍스트 세그먼트 추가
      if (textIndex < textSegments.length) {
        const textSegment = { 
          ...textSegments[textIndex], 
          id: `mixed-text-${pageNumber}`,
          contentType: 'MIXED' as const,
          metadata: {
            ...textSegments[textIndex].metadata,
            pageNumber
          }
        };
        merged.push(textSegment);
        textIndex++;
        pageNumber++;
      }
      
      // 파일 세그먼트 추가
      if (fileIndex < fileSegments.length) {
        const fileSegment = { 
          ...fileSegments[fileIndex], 
          id: `mixed-file-${pageNumber}`,
          contentType: 'MIXED' as const,
          metadata: {
            ...fileSegments[fileIndex].metadata,
            pageNumber
          }
        };
        merged.push(fileSegment);
        fileIndex++;
        pageNumber++;
      }
    }
    
    return merged;
  }

  /**
   * 텍스트에서 섹션 제목 추출
   */
  private extractSectionTitle(content: string): string {
    // 첫 번째 줄이 제목일 가능성이 높음
    const firstLine = content.split('\n')[0]?.trim();
    
    if (firstLine && firstLine.length < 100) {
      // 제목 패턴 감지 (번호, 특수문자 등)
      if (/^[0-9]+\./.test(firstLine) || 
          /^[가-힣]+\s*[0-9]*[\.:]/.test(firstLine) ||
          firstLine.endsWith(':')) {
        return firstLine;
      }
    }
    
    return `내용 ${Date.now()}`;
  }

  /**
   * 읽기 시간 계산 (분 단위)
   */
  private calculateReadTime(text: string): number {
    const wordsPerMinute = 200; // 평균 한국어 읽기 속도
    const wordCount = this.getWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * 단어 수 계산
   */
  private getWordCount(text: string): number {
    // 한국어와 영어 단어 모두 고려
    const koreanWords = text.match(/[가-힣]+/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return koreanWords.length + englishWords.length;
  }

  /**
   * 텍스트 난이도 평가
   */
  private assessDifficulty(text: string): 'easy' | 'medium' | 'hard' {
    const wordCount = this.getWordCount(text);
    const sentenceCount = text.split(/[.!?]/).length;
    const averageWordsPerSentence = wordCount / sentenceCount;
    
    // 복잡한 단어 패턴 (한자, 전문용어 등)
    const complexWords = text.match(/[一-龯]/g) || []; // 한자
    const complexWordsRatio = complexWords.length / wordCount;
    
    if (averageWordsPerSentence > 15 || complexWordsRatio > 0.3) {
      return 'hard';
    } else if (averageWordsPerSentence > 10 || complexWordsRatio > 0.1) {
      return 'medium';
    } else {
      return 'easy';
    }
  }

  /**
   * 세그먼트 품질 검증
   */
  validateSegments(segments: PageSegment[]): boolean {
    return segments.every(segment => {
      return segment.content.trim().length > 0 &&
             segment.startIndex >= 0 &&
             segment.endIndex > segment.startIndex &&
             segment.metadata.wordCount !== undefined &&
             segment.metadata.estimatedReadTime !== undefined;
    });
  }
}

// 싱글톤 인스턴스
export const pageSegmentationService = new PageSegmentationService();