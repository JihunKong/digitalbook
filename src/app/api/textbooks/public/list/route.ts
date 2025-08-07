import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Mock data for public textbooks
  const mockTextbooks = [
    {
      id: '1',
      title: '재미있는 국어 여행',
      subject: '국어',
      grade: 3,
      coverImage: null,
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
      coverImage: null,
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
      coverImage: null,
      teacher: {
        name: '박선생님'
      },
      createdAt: '2024-02-15T00:00:00Z'
    }
  ];

  // Apply filters if provided
  const { searchParams } = new URL(request.url);
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
      t.teacher.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  return NextResponse.json(filteredTextbooks);
}