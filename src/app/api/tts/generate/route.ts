import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'shimmer', model = 'tts-1-hd', speed = 0.95 } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    try {
      // OpenAI TTS API 호출
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text.substring(0, 4096), // OpenAI TTS 최대 길이 제한
          voice,
          speed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI TTS API error:', response.status, errorText);
        
        // Check for common errors
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid OpenAI API key' },
            { status: 401 }
          );
        } else if (response.status === 429) {
          return NextResponse.json(
            { error: 'OpenAI API rate limit exceeded' },
            { status: 429 }
          );
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      
      // Base64로 인코딩
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      return NextResponse.json({
        data: {
          audioUrl,
          cached: false,
          duration: null,
        }
      });
    } catch (apiError) {
      console.error('OpenAI API call failed:', apiError);
      return NextResponse.json(
        { error: 'TTS generation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}