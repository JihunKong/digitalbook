import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pageContent, pageNumber, difficulty = 'medium', quizType = 'multiple_choice' } = await request.json();

    // GPT-4o-mini를 사용한 퀴즈 생성
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
            content: `당신은 한국 초등학생을 위한 인터랙티브 퀴즈를 생성하는 AI 튜터입니다.
            주어진 내용을 바탕으로 학생이 즐겁게 풀 수 있는 퀴즈를 1개 만들어주세요.
            
            요구사항:
            - 난이도: ${difficulty}
            - 퀴즈 유형: ${quizType}
            - 이모지와 친근한 말투 사용
            - 학삵 내용과 직접 관련된 문제
            
            응답 형식 (JSON):
            {
              "question": "퀴즈 문제",
              "type": "${quizType}",
              "options": ["1번 선택지", "2번 선택지", "3번 선택지", "4번 선택지"],
              "correctAnswer": 1,
              "explanation": "정답 설명",
              "hint": "힙트",
              "difficulty": "${difficulty}",
              "encouragement": "격려 메시지"
            }`
          },
          {
            role: 'user',
            content: `다음 내용을 바탕으로 혴즈를 만들어주세요:
            
            페이지 ${pageNumber} 내용:
            ${pageContent}`
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      // Fallback quiz
      const fallbackQuizzes = [
        {
          question: "현대 소설의 가장 중요한 특징은 무엇일까요? 🤔",
          type: "multiple_choice",
          options: [
            "시간 순서대로 이야기가 진행되어요",
            "인물의 마음속 생각을 중요하게 다룰어요",
            "항상 행복한 이야기만 다룰어요",
            "그림만 나오고 글이 없어요"
          ],
          correctAnswer: 1,
          explanation: "맞아요! 현대 소설은 인물의 내면 세계와 심리를 깊이 탐구하는 것이 가장 큰 특징이에요! 🎆",
          hint: "내면 의식의 탐구를 생각해보세요 🧠",
          difficulty: difficulty,
          encouragement: "다음에도 좋은 질문 기대할게요! 🚀"
        },
        {
          question: "의식의 흐름 기법이 무엇인지 알아볼까요? 🌊",
          type: "multiple_choice",
          options: [
            "물이 흐르는 것을 묘사하는 기법",
            "인물의 생각을 여과 없이 써내는 기법",
            "문장을 아름답게 장식하는 기법",
            "인물의 외모를 자세히 뭘사하는 기법"
          ],
          correctAnswer: 1,
          explanation: "정답이에요! 의식의 흐름은 인물의 마음속 생각들을 그대로 써내는 기법이에요! 🎉",
          hint: "인물의 마음속을 들여다보는 기법이에요 🔮",
          difficulty: difficulty,
          encouragement: "계속 호기심을 가지고 공부해요! 🌟"
        },
        {
          question: "이상 작가의 대표작 '날개'에 대해 알고 있나요? 🦅",
          type: "multiple_choice",
          options: [
            "새에 대한 이야기",
            "비행기에 대한 이야기",
            "인물의 내면 세계를 그린 작품",
            "전쟁에 대한 이야기"
          ],
          correctAnswer: 2,
          explanation: "맞습니다! '날개'는 인물의 내면적 고민과 심리를 세밀하게 그린 대표적인 현대 소설이에요! ✨",
          hint: "이상의 작품은 인물의 마음을 깊이 들여다보죠 👀",
          difficulty: difficulty,
          encouragement: "문학에 대한 관심이 높아지고 있네요! 📚"
        }
      ];
      
      const randomQuiz = fallbackQuizzes[Math.floor(Math.random() * fallbackQuizzes.length)];
      
      return NextResponse.json({
        ...randomQuiz,
        metadata: {
          pageNumber,
          generatedAt: new Date(),
          model: 'fallback',
          source: 'mock-data'
        }
      });
    }

    const result = await response.json();
    
    try {
      // OpenAI 응답을 JSON으로 파싱
      const quizData = JSON.parse(result.choices[0]?.message?.content || '{}');
      
      return NextResponse.json({
        ...quizData,
        metadata: {
          pageNumber,
          generatedAt: new Date(),
          model: 'gpt-4o-mini',
          source: 'ai-generated'
        }
      });
    } catch (parseError) {
      console.error('Failed to parse quiz response:', parseError);
      
      // 파싱 실패 시 기본 퀴즈 반환
      return NextResponse.json({
        question: "이 내용에서 가장 인상 깊은 부분은 무엇인가요? 🌟",
        type: quizType,
        options: [
          "첫 번째 문단",
          "가운데 문단",
          "마지막 문단",
          "전체 내용"
        ],
        correctAnswer: 3,
        explanation: "답은 개인의 생각에 따라 다를 수 있어요! 자신의 생각을 중요하게 생각해주세요! 💭",
        hint: "어떤 부분이 가장 기억에 남는지 생각해보세요 🤔",
        difficulty: difficulty,
        encouragement: "다음에도 좋은 질문 반복합니다! 🚀",
        metadata: {
          pageNumber,
          generatedAt: new Date(),
          model: 'gpt-4o-mini-fallback',
          source: 'parse-error-fallback',
          note: 'AI 응답 파싱 실패로 기본 퀴즈를 사용합니다.'
        }
      });
    }

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    return NextResponse.json(
      { 
        error: '퀴즈 생성 중 오류가 발생했습니다.',
        question: "지금 퀴즈를 만들 수 없어요. 잠시 후 다시 시도해주세요! 😅",
        type: "message",
        metadata: {
          pageNumber: 1,
          generatedAt: new Date(),
          model: 'error',
          source: 'error-response'
        }
      },
      { status: 500 }
    );
  }
}