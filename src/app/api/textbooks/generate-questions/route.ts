import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, pageNumber, difficulty = 'medium', questionCount = 3, questionTypes = ['multiple_choice', 'short_answer'] } = await request.json();

    // GPT-4o-mini를 사용한 문제 생성
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 한국 초등학생을 위한 교육용 문제를 생성하는 전문 AI입니다.
            주어진 텍스트를 바탕으로 다음 요구사항에 맞는 문제를 생성해주세요:
            
            1. 난이도: ${difficulty}
            2. 문제 수: ${questionCount}개
            3. 문제 유형: ${questionTypes.join(', ')}
            
            문제 유형 설명:
            - multiple_choice: 4지 선다형 (정답 1개 표시)
            - short_answer: 단답형
            - essay: 서술형
            - true_false: O/X 문제
            
            응답은 다음 JSON 형식으로 해주세요:
            {
              "questions": [
                {
                  "id": "q1",
                  "questionText": "문제 내용",
                  "questionType": "multiple_choice",
                  "options": [
                    {"id": "a", "text": "선택지1", "isCorrect": false},
                    {"id": "b", "text": "선택지2", "isCorrect": true},
                    {"id": "c", "text": "선택지3", "isCorrect": false},
                    {"id": "d", "text": "선택지4", "isCorrect": false}
                  ],
                  "correctAnswer": "b",
                  "explanation": "답 설명",
                  "hints": ["힘트1", "힘트2"],
                  "difficulty": "${difficulty}",
                  "cognitiveLevel": "understanding",
                  "category": "내용 분류"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `다음 내용을 바탕으로 문제를 생성해주세요:
            
            페이지 ${pageNumber}:
            ${content}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Fallback to mock questions
      const mockQuestions = [
        {
          id: 'q1',
          questionText: '주어진 내용의 주요 주제는 무엇인가요?',
          questionType: 'multiple_choice',
          options: [
            { id: 'a', text: '문학의 역사', isCorrect: false },
            { id: 'b', text: '현대 소설의 특징', isCorrect: true },
            { id: 'c', text: '작가의 생애', isCorrect: false },
            { id: 'd', text: '사회적 배경', isCorrect: false }
          ],
          correctAnswer: 'b',
          explanation: '이 내용은 현대 소설의 주요 특징에 대해 설명하고 있습니다.',
          hints: ['내용의 전반적인 주제를 생각해보세요', '제목과 첫 문단을 다시 읽어보세요'],
          difficulty: difficulty,
          cognitiveLevel: 'understanding',
          category: '문학 이해'
        },
        {
          id: 'q2',
          questionText: '이 내용에서 언급된 주요 개념을 설명하세요.',
          questionType: 'short_answer',
          correctAnswer: '내용에 따라 다름',
          explanation: '내용에서 제시된 주요 개념들을 자신의 말로 설명하면 됩니다.',
          hints: ['핵심 단어들을 찾아보세요', '예시와 함께 설명해보세요'],
          difficulty: difficulty,
          cognitiveLevel: 'application',
          category: '개념 이해'
        },
        {
          id: 'q3',
          questionText: '이 내용을 읽고 어떤 생각이 들었는지 자유롭게 써보세요.',
          questionType: 'essay',
          correctAnswer: '주관적 응답',
          explanation: '자신의 생각과 느낌을 진솔하게 표현하면 됩니다.',
          hints: ['개인적인 경험과 연결해보세요', '왜 그렇게 생각하는지 이유를 들어보세요'],
          difficulty: difficulty,
          cognitiveLevel: 'evaluation',
          category: '비판적 사고'
        }
      ];
      
      return NextResponse.json({
        questions: mockQuestions.slice(0, questionCount),
        metadata: {
          pageNumber,
          difficulty,
          generatedAt: new Date(),
          model: 'fallback',
          totalQuestions: Math.min(questionCount, mockQuestions.length)
        }
      });
    }

    const result = await response.json();
    
    try {
      // OpenAI 응답을 JSON으로 파싱
      const questionsData = JSON.parse(result.choices[0]?.message?.content || '{}');
      
      return NextResponse.json({
        ...questionsData,
        metadata: {
          pageNumber,
          difficulty,
          generatedAt: new Date(),
          model: 'gpt-4o-mini',
          totalQuestions: questionsData.questions?.length || 0
        }
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // 파싱 실패 시 기본 문제 반환
      return NextResponse.json({
        questions: [
          {
            id: 'q1',
            questionText: '이 내용에서 가장 중요한 내용은 무엇인가요?',
            questionType: 'short_answer',
            correctAnswer: '내용에 따라 다름',
            explanation: 'AI가 생성한 문제입니다.',
            hints: ['주요 내용을 다시 읽어보세요'],
            difficulty: difficulty,
            cognitiveLevel: 'understanding',
            category: '내용 이해'
          }
        ],
        metadata: {
          pageNumber,
          difficulty,
          generatedAt: new Date(),
          model: 'gpt-4o-mini-fallback',
          totalQuestions: 1,
          note: 'AI 응답 파싱 실패로 기본 문제를 사용합니다.'
        }
      });
    }

  } catch (error) {
    console.error('Question generation error:', error);
    
    return NextResponse.json(
      { 
        error: '문제 생성 중 오류가 발생했습니다.',
        questions: [],
        metadata: {
          pageNumber: 1,
          difficulty: 'medium',
          generatedAt: new Date(),
          model: 'error',
          totalQuestions: 0
        }
      },
      { status: 500 }
    );
  }
}