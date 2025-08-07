import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessCode, studentId, studentName } = body;
    
    // Mock validation - accept TEST123 as valid code
    if (accessCode === 'TEST123') {
      const mockResponse = {
        token: 'mock-guest-token-12345',
        guest: {
          id: 'guest-123',
          studentId,
          studentName,
          sessionId: 'session-123'
        },
        textbook: {
          id: 'textbook-123',
          title: '테스트 국어 교과서',
          subject: '국어',
          grade: 3,
          teacher: {
            name: '테스트 선생님',
            email: 'teacher@test.com'
          },
          coverImage: null
        }
      };
      
      return NextResponse.json(mockResponse);
    } else {
      return NextResponse.json(
        { message: '유효하지 않은 접근 코드입니다' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Guest access error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}