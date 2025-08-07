import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get backend API URL from environment or default to local
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    // Forward query parameters to backend
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Call backend API
    const response = await fetch(`${backendUrl}/api/textbooks/public/list${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for real-time data
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      // Return fallback mock data if backend is not available
      return NextResponse.json(getFallbackTextbooks(searchParams));
    }

    const data = await response.json();
    
    // If no data from backend, return sample textbooks
    if (!data || data.length === 0) {
      return NextResponse.json(getFallbackTextbooks(searchParams));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching public textbooks:', error);
    // Return fallback mock data on error
    const { searchParams } = new URL(request.url);
    return NextResponse.json(getFallbackTextbooks(searchParams));
  }
}

function getFallbackTextbooks(searchParams: URLSearchParams) {
  // Sample textbooks for demonstration
  const mockTextbooks = [
    {
      id: '1',
      title: '재미있는 국어 여행',
      subject: '국어',
      grade: 3,
      description: 'AI 기반 맞춤형 국어 학습 교과서입니다. 읽기, 쓰기, 말하기 능력을 종합적으로 향상시킬 수 있습니다.',
      coverImage: null,
      isPublic: true,
      teacher: {
        name: '김선생님'
      },
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2', 
      title: '창의적 글쓰기',
      subject: '국어',
      grade: 4,
      description: '창의력과 표현력을 기르는 글쓰기 중심 교과서입니다. 다양한 장르의 글쓰기를 체험할 수 있습니다.',
      coverImage: null,
      isPublic: true,
      teacher: {
        name: '이선생님'
      },
      createdAt: '2024-02-01T00:00:00Z'
    },
    {
      id: '3',
      title: '문학의 세계',
      subject: '국어', 
      grade: 5,
      description: '고전과 현대 문학을 아우르는 종합 문학 교과서입니다. 문학 감상과 비평 능력을 기를 수 있습니다.',
      coverImage: null,
      isPublic: true,
      teacher: {
        name: '박선생님'
      },
      createdAt: '2024-02-15T00:00:00Z'
    },
    {
      id: '4',
      title: '수학의 기초',
      subject: '수학',
      grade: 3,
      description: '기초 연산과 도형을 재미있게 배우는 수학 교과서입니다. 실생활 문제 해결 능력을 기를 수 있습니다.',
      coverImage: null,
      isPublic: true,
      teacher: {
        name: '최선생님'
      },
      createdAt: '2024-03-01T00:00:00Z'
    },
    {
      id: '5',
      title: '과학 탐구',
      subject: '과학',
      grade: 4,
      description: '실험과 관찰을 통해 과학적 사고력을 기르는 교과서입니다. 자연 현상을 탐구하는 즐거움을 느낄 수 있습니다.',
      coverImage: null,
      isPublic: true,
      teacher: {
        name: '정선생님'
      },
      createdAt: '2024-03-15T00:00:00Z'
    }
  ];

  // Apply filters if provided
  const subject = searchParams.get('subject');
  const grade = searchParams.get('grade');
  const search = searchParams.get('search');

  let filteredTextbooks = [...mockTextbooks];

  if (subject && subject !== 'all') {
    filteredTextbooks = filteredTextbooks.filter(t => t.subject === subject);
  }

  if (grade && grade !== 'all') {
    filteredTextbooks = filteredTextbooks.filter(t => t.grade === parseInt(grade));
  }

  if (search) {
    filteredTextbooks = filteredTextbooks.filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.teacher.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    );
  }

  return filteredTextbooks;
}