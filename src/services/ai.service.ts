import { AIMessage, AIConversation } from '@/types'

interface TextSegmentOptions {
  targetLength: number
  gradeLevel: number
}

interface ImageGenerationOptions {
  style?: 'illustration' | 'photograph' | 'diagram'
  aspectRatio?: '16:9' | '4:3' | '1:1'
}

interface QuestionGenerationOptions {
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  count: number
  types?: ('multiple_choice' | 'short_answer' | 'essay' | 'true_false')[]
}

export class AIService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || ''
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  /**
   * 텍스트를 의미 단위로 분할
   */
  async segmentText(
    text: string,
    options: TextSegmentOptions
  ): Promise<string[]> {
    const { targetLength, gradeLevel } = options
    
    // 한국어 텍스트 특성을 고려한 분할 알고리즘
    const segments: string[] = []
    const paragraphs = text.split(/\n\n+/)
    
    let currentSegment = ''
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim()
      
      // 현재 세그먼트와 합쳤을 때 목표 길이를 초과하는 경우
      if (currentSegment.length + trimmedParagraph.length > targetLength * 1.2) {
        if (currentSegment) {
          segments.push(currentSegment.trim())
          currentSegment = trimmedParagraph
        } else {
          // 단일 문단이 너무 긴 경우 문장 단위로 분할
          const sentences = this.splitIntoSentences(trimmedParagraph)
          let tempSegment = ''
          
          for (const sentence of sentences) {
            if (tempSegment.length + sentence.length > targetLength) {
              if (tempSegment) segments.push(tempSegment.trim())
              tempSegment = sentence
            } else {
              tempSegment += ' ' + sentence
            }
          }
          
          if (tempSegment) currentSegment = tempSegment
        }
      } else {
        currentSegment += '\n\n' + trimmedParagraph
      }
    }
    
    if (currentSegment) {
      segments.push(currentSegment.trim())
    }
    
    return segments
  }

  /**
   * 텍스트를 문장 단위로 분할
   */
  private splitIntoSentences(text: string): string[] {
    // 한국어 문장 종결 패턴
    const sentenceEndings = /([.!?。？！]+)\s*/g
    const sentences = text.split(sentenceEndings).filter(s => s.trim())
    
    const result: string[] = []
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '')
      if (sentence.trim()) {
        result.push(sentence.trim())
      }
    }
    
    return result
  }

  /**
   * 텍스트에 맞는 이미지 프롬프트 생성
   */
  async generateImagePrompt(
    text: string,
    options?: ImageGenerationOptions
  ): Promise<string> {
    const prompt = `
다음 텍스트를 읽고, 학생들의 이해를 돕기 위한 교육적 이미지를 생성할 수 있는 프롬프트를 만들어주세요.
이미지는 텍스트의 핵심 내용을 시각적으로 표현해야 하며, 고등학생이 이해하기 쉬워야 합니다.

텍스트:
${text}

요구사항:
- 스타일: ${options?.style || 'illustration'}
- 교육적 가치가 있어야 함
- 텍스트의 핵심 개념을 시각화
- 한국 고등학생의 정서에 맞는 이미지

프롬프트 (영어로):
`

    try {
      const response = await this.callClaudeAPI(prompt)
      return response
    } catch (error) {
      console.error('Error generating image prompt:', error)
      return 'Educational illustration for Korean literature textbook'
    }
  }

  /**
   * 학습 문제 생성
   */
  async generateQuestions(
    text: string,
    options: QuestionGenerationOptions
  ): Promise<any[]> {
    const prompt = `
다음 텍스트를 읽고 학습 문제를 생성해주세요.

텍스트:
${text}

요구사항:
- 난이도: ${options.difficulty}
- 문제 수: ${options.count}개
- 문제 유형: ${options.types?.join(', ') || '모든 유형'}

각 문제는 다음 형식으로 생성해주세요:
1. 문제 텍스트
2. 정답
3. 해설
4. 힌트 (2개)

JSON 형식으로 응답해주세요.
`

    try {
      const response = await this.callClaudeAPI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating questions:', error)
      return []
    }
  }

  /**
   * AI 튜터 대화
   */
  async chat(
    message: string,
    context: {
      pageContent?: string
      previousMessages?: AIMessage[]
      studentLevel?: number
    }
  ): Promise<string> {
    const systemPrompt = `
당신은 한국 고등학생을 위한 친절한 국어 선생님입니다.
학생의 수준에 맞춰 쉽고 이해하기 쉽게 설명해주세요.
격려하고 긍정적인 피드백을 제공하세요.
${context.pageContent ? `현재 학습 내용: ${context.pageContent}` : ''}
`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.previousMessages || []).map(msg => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    try {
      const response = await this.callClaudeAPI(message, messages)
      return response
    } catch (error) {
      console.error('Error in AI chat:', error)
      return '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.'
    }
  }

  /**
   * 글쓰기 평가
   */
  async evaluateWriting(
    text: string,
    assignmentPrompt: string,
    genre: string
  ): Promise<any> {
    const prompt = `
다음 학생의 글을 평가해주세요.

과제: ${assignmentPrompt}
장르: ${genre}

학생의 글:
${text}

다음 항목을 평가해주세요:
1. 전체 구성 (서론-본론-결론)
2. 문법 및 맞춤법
3. 어휘 사용
4. 논리성과 일관성
5. 창의성

각 항목별로 점수(1-10)와 구체적인 피드백을 제공하고,
개선할 점과 잘한 점을 알려주세요.

JSON 형식으로 응답해주세요.
`

    try {
      const response = await this.callClaudeAPI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('Error evaluating writing:', error)
      throw error
    }
  }

  /**
   * Claude API 호출
   */
  private async callClaudeAPI(
    prompt: string,
    messages?: any[]
  ): Promise<string> {
    try {
      // Check if we have Claude API key
      const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
      
      if (!claudeApiKey) {
        console.warn('Claude API key not found, using fallback responses')
        return this.getFallbackResponse(prompt)
      }

      // Make actual API call to Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229', // or claude-3-sonnet-20240229 for faster responses
          max_tokens: 1024,
          messages: messages || [{
            role: 'user',
            content: prompt
          }],
          system: '당신은 한국 교육 전문가이며, 학생들의 학습을 돕는 AI 튜터입니다. 항상 교육적이고 친근한 톤으로 대화하며, 학생들의 이해를 돕기 위해 구체적인 예시를 제공합니다.'
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      return data.content[0].text

    } catch (error) {
      console.error('Claude API call failed:', error)
      // Fallback to mock responses if API fails
      return this.getFallbackResponse(prompt)
    }
  }

  /**
   * Fallback responses when Claude API is unavailable
   */
  private getFallbackResponse(prompt: string): string {
    if (prompt.includes('이미지 프롬프트')) {
      return 'A serene Korean traditional house (hanok) with students reading books under a large tree, warm sunlight filtering through leaves, educational atmosphere, illustration style'
    }
    
    if (prompt.includes('학습 문제')) {
      return JSON.stringify([
        {
          questionText: '본문에서 주인공이 느낀 감정의 변화를 설명하시오.',
          questionType: 'short_answer',
          suggestedAnswer: '주인공은 처음에는 두려움을 느꼈지만, 점차 용기를 내어 도전하게 되었다.',
          answerExplanation: '텍스트의 전반부와 후반부를 비교하면 감정의 변화를 알 수 있습니다.',
          hints: ['처음 부분의 감정 표현을 찾아보세요', '마지막 부분에서 어떤 행동을 했나요?'],
          difficulty: 3
        }
      ])
    }
    
    return '안녕하세요! 무엇을 도와드릴까요?'
  }

  /**
   * 텍스트 난이도 분석
   */
  async analyzeTextDifficulty(text: string): Promise<{
    difficulty: number
    readabilityScore: number
    vocabulary: {
      easy: number
      medium: number
      hard: number
    }
    recommendedGrade: number
  }> {
    // 한국어 텍스트 난이도 분석 로직
    const totalChars = text.length
    const sentences = this.splitIntoSentences(text)
    const avgSentenceLength = totalChars / sentences.length
    
    // 간단한 난이도 계산 (실제로는 더 복잡한 알고리즘 필요)
    const difficulty = Math.min(5, Math.max(1, avgSentenceLength / 50))
    
    return {
      difficulty: Math.round(difficulty),
      readabilityScore: 100 - (difficulty * 20),
      vocabulary: {
        easy: 60,
        medium: 30,
        hard: 10
      },
      recommendedGrade: difficulty < 2 ? 1 : difficulty < 4 ? 2 : 3
    }
  }
}