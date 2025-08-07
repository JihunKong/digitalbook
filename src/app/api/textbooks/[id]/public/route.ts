import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get backend API URL from environment or default to local
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    // Call backend API to get textbook details
    const response = await fetch(`${backendUrl}/api/textbooks/${id}/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      // Return fallback sample textbook if backend is not available
      return NextResponse.json(getSampleTextbook(id));
    }

    const data = await response.json();
    
    // If no data from backend, return sample textbook
    if (!data) {
      return NextResponse.json(getSampleTextbook(id));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching textbook:', error);
    // Return sample textbook on error
    return NextResponse.json(getSampleTextbook(params.id));
  }
}

function getSampleTextbook(id: string) {
  // Sample textbooks for demonstration
  const sampleTextbooks: Record<string, any> = {
    '1': {
      id: '1',
      title: '재미있는 국어 여행',
      subject: '국어',
      grade: 3,
      teacher: '김선생님',
      description: 'AI 기반 맞춤형 국어 학습 교과서입니다. 읽기, 쓰기, 말하기 능력을 종합적으로 향상시킬 수 있습니다.',
      totalPages: 5,
      pages: [
        {
          pageNumber: 1,
          title: '1장. 우리말의 아름다움',
          content: `한글은 세종대왕께서 백성을 위해 만드신 과학적인 문자입니다.

우리말의 특징:
• 다양한 높임법과 존댓말
• 풍부한 의성어와 의태어
• 섬세한 감정 표현

오늘은 우리말의 아름다움에 대해 함께 알아보겠습니다.`,
          quiz: {
            question: '한글을 창제하신 분은 누구일까요?',
            options: ['세종대왕', '이순신', '김구', '안중근'],
            correctIndex: 0
          }
        },
        {
          pageNumber: 2,
          title: '2장. 의성어와 의태어',
          content: `의성어는 소리를 흉내 낸 말이고, 의태어는 모양이나 움직임을 흉내 낸 말입니다.

의성어 예시:
• 멍멍 - 개가 짖는 소리
• 야옹 - 고양이 울음소리

의태어 예시:
• 살금살금 - 조심스럽게 걷는 모양
• 반짝반짝 - 빛이 나는 모양`,
          quiz: {
            question: '다음 중 의성어는 무엇일까요?',
            options: ['살금살금', '반짝반짝', '멍멍', '출렁출렁'],
            correctIndex: 2
          }
        },
        {
          pageNumber: 3,
          title: '3장. 높임법 배우기',
          content: `우리말에는 상대방을 존중하는 높임법이 있습니다.

주체 높임법:
• 선생님께서 오셨습니다.
• 할머니께서 주무십니다.

상대 높임법:
• 해요체: 밥 먹어요?
• 합쇼체: 밥 드셨습니까?`,
        },
        {
          pageNumber: 4,
          title: '4장. 재미있는 동시 읽기',
          content: `동시를 읽으며 운율과 리듬을 느껴보세요.

<봄비>
봄비가 내려요
살며시 살며시
꽃잎에 속삭이듯
나뭇잎을 간지럽히듯
봄비가 내려요`,
        },
        {
          pageNumber: 5,
          title: '5장. 정리하기',
          content: `오늘 배운 내용을 정리해보겠습니다.

✓ 한글의 우수성과 특징
✓ 의성어와 의태어의 차이
✓ 높임법의 종류와 사용법
✓ 동시의 운율과 리듬

다음 시간에는 글쓰기를 배워보겠습니다!`,
        }
      ]
    },
    '2': {
      id: '2',
      title: '창의적 글쓰기',
      subject: '국어',
      grade: 4,
      teacher: '이선생님',
      description: '창의력과 표현력을 기르는 글쓰기 중심 교과서입니다.',
      totalPages: 4,
      pages: [
        {
          pageNumber: 1,
          title: '1장. 글쓰기의 시작',
          content: `좋은 글을 쓰기 위한 첫걸음!

글쓰기 전 준비:
• 무엇을 쓸지 정하기
• 누구에게 쓸지 생각하기
• 어떻게 쓸지 계획하기`,
        },
        {
          pageNumber: 2,
          title: '2장. 일기 쓰기',
          content: `오늘 있었던 일을 일기로 써보세요.

일기 쓰기 팁:
• 날짜와 날씨 쓰기
• 중요한 일 기록하기
• 느낌과 생각 표현하기`,
        },
        {
          pageNumber: 3,
          title: '3장. 편지 쓰기',
          content: `마음을 전하는 편지 쓰기

편지의 구성:
• 받는 사람
• 인사말
• 본문
• 맺음말
• 보내는 사람`,
        },
        {
          pageNumber: 4,
          title: '4장. 상상하여 쓰기',
          content: `상상의 날개를 펼쳐보세요!

상상 글쓰기:
• 미래 여행
• 동물과 대화하기
• 마법사가 되어보기

창의적인 이야기를 만들어보세요.`,
        }
      ]
    },
    '3': {
      id: '3',
      title: '문학의 세계',
      subject: '국어',
      grade: 5,
      teacher: '박선생님',
      description: '고전과 현대 문학을 아우르는 종합 문학 교과서입니다.',
      totalPages: 3,
      pages: [
        {
          pageNumber: 1,
          title: '1장. 시의 세계',
          content: `시는 마음을 표현하는 아름다운 문학입니다.

시의 특징:
• 운율과 리듬
• 비유와 상징
• 압축된 표현`,
        },
        {
          pageNumber: 2,
          title: '2장. 이야기의 세계',
          content: `소설과 동화의 구성 요소

이야기의 3요소:
• 인물 - 누가
• 사건 - 무엇을
• 배경 - 언제, 어디서`,
        },
        {
          pageNumber: 3,
          title: '3장. 옛이야기',
          content: `우리 조상들의 지혜가 담긴 옛이야기

전래동화:
• 흥부와 놀부
• 콩쥐 팥쥐
• 해와 달이 된 오누이

교훈과 재미가 함께 있습니다.`,
        }
      ]
    },
    '4': {
      id: '4',
      title: '수학의 기초',
      subject: '수학',
      grade: 3,
      teacher: '최선생님',
      description: '기초 연산과 도형을 재미있게 배우는 수학 교과서입니다.',
      totalPages: 3,
      pages: [
        {
          pageNumber: 1,
          title: '1장. 덧셈과 뺄셈',
          content: `큰 수의 덧셈과 뺄셈을 배워봅시다.

세 자리 수 덧셈:
  234
+ 567
-----
  801

받아올림을 잊지 마세요!`,
        },
        {
          pageNumber: 2,
          title: '2장. 곱셈 구구',
          content: `곱셈구구를 완벽하게 익혀봅시다.

7단:
7 × 1 = 7
7 × 2 = 14
7 × 3 = 21
7 × 4 = 28
7 × 5 = 35`,
        },
        {
          pageNumber: 3,
          title: '3장. 도형 알아보기',
          content: `여러 가지 도형의 특징

삼각형: 변이 3개, 꼭짓점이 3개
사각형: 변이 4개, 꼭짓점이 4개
원: 둥근 모양, 모든 점이 중심에서 같은 거리`,
        }
      ]
    },
    '5': {
      id: '5',
      title: '과학 탐구',
      subject: '과학',
      grade: 4,
      teacher: '정선생님',
      description: '실험과 관찰을 통해 과학적 사고력을 기르는 교과서입니다.',
      totalPages: 3,
      pages: [
        {
          pageNumber: 1,
          title: '1장. 물의 순환',
          content: `물은 어떻게 순환할까요?

물의 순환 과정:
1. 증발 - 물이 수증기로 변함
2. 응결 - 수증기가 구름이 됨
3. 강수 - 비나 눈이 내림
4. 다시 바다나 강으로`,
        },
        {
          pageNumber: 2,
          title: '2장. 식물의 한살이',
          content: `식물이 자라는 과정

식물의 한살이:
• 씨앗
• 발아
• 성장
• 꽃 피기
• 열매 맺기`,
        },
        {
          pageNumber: 3,
          title: '3장. 자석의 성질',
          content: `자석의 신기한 성질

자석의 특징:
• N극과 S극이 있음
• 같은 극끼리는 밀어냄
• 다른 극끼리는 끌어당김
• 철을 끌어당김`,
        }
      ]
    }
  };

  return sampleTextbooks[id] || sampleTextbooks['1'];
}