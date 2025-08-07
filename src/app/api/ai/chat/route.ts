import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, model = 'gpt-4o-mini', systemPrompt } = await request.json();

    // OpenAI API 호출 시뮬레이션
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || `당신은 한국 초등학생을 위한 전문 AI 튜터입니다. 
            친근하고 이해하기 쉬운 설명을 제공하며, 적절한 이모지를 사용하고, 
            학습 단계에 맞는 난이도로 조절하여 답변해주세요.`
          },
          {
            role: 'user',
            content: `페이지 내용: ${context?.pageContent || ''}
            
            학생 질문: ${message}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Fallback to mock response if API fails
      const mockResponses = [
        `좋은 질문이네요! 📚 ${message}에 대해 설명드릴게요. 이는 우리가 배우고 있는 내용과 관련이 깊어요. 더 자세히 알고 싶은 부분이 있으면 언제든 물어보세요!`,
        `와! 정말 흥미로운 질문이에요. 😊 ${message}에 대해서는 여러 가지 관점에서 생각해볼 수 있어요. 어떤 부분이 가장 궁금하신가요?`,
        `훌륭한 질문입니다! 🌟 이 주제는 정말 중요한 부분이에요. 차근차근 설명해드릴게요.`
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return NextResponse.json({
        message: randomResponse,
        type: 'text',
        confidence: 0.9,
        difficulty: 'medium'
      });
    }

    const result = await response.json();
    
    return NextResponse.json({
      message: result.choices[0]?.message?.content || '죄송합니다. 다시 질문해주세요.',
      type: 'text',
      confidence: 0.95,
      difficulty: 'medium'
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    // Fallback response
    return NextResponse.json({
      message: '죄송합니다. 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요. 😊',
      type: 'text',
      confidence: 0.5
    });
  }
}