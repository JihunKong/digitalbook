import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const textbookId = params.id;
  
  // Mock textbook data
  const mockTextbook = {
    id: textbookId,
    title: '테스트 국어 교과서',
    subject: '국어',
    grade: 3,
    teacher: {
      name: '테스트 선생님',
      email: 'teacher@test.com'
    },
    content: {
      chapters: [
        {
          id: 'chapter1',
          title: '첫 번째 단원: 우리말의 아름다움',
          pages: [
            {
              id: 'page1',
              title: '한글의 역사',
              content: `
                <h2>한글의 창제</h2>
                <p>세종대왕은 1443년(세종 25년)에 훈민정음을 창제하였습니다.</p>
                <p>한글은 세계에서 가장 과학적인 문자 중 하나로 인정받고 있습니다.</p>
                
                <h3>한글의 특징</h3>
                <ul>
                  <li>표음문자: 소리를 나타내는 문자</li>
                  <li>자음과 모음의 조합</li>
                  <li>쉽고 간편한 학습</li>
                </ul>
              `,
              type: 'text',
              questions: [
                {
                  id: 'q1',
                  type: 'multiple-choice',
                  question: '한글을 창제한 왕은 누구인가요?',
                  options: ['태종', '세종대왕', '세조', '성종'],
                  correctAnswer: 1
                }
              ]
            },
            {
              id: 'page2', 
              title: '한글의 우수성',
              content: `
                <h2>한글의 과학적 원리</h2>
                <p>한글은 발음기관을 본떠서 만들어진 과학적인 문자입니다.</p>
                
                <h3>자음의 원리</h3>
                <p>ㄱ, ㄴ, ㅁ, ㅅ, ㅇ 등은 발음할 때의 입 모양을 본떠 만들었습니다.</p>
                
                <h3>모음의 원리</h3>
                <p>하늘, 땅, 사람을 나타내는 ·, ㅡ, ㅣ를 기본으로 합니다.</p>
              `,
              type: 'text',
              questions: [
                {
                  id: 'q2',
                  type: 'short-answer',
                  question: '한글 모음의 기본 원리는 무엇인가요?'
                }
              ]
            }
          ]
        },
        {
          id: 'chapter2',
          title: '두 번째 단원: 올바른 국어 생활',
          pages: [
            {
              id: 'page3',
              title: '표준어와 방언',
              content: `
                <h2>표준어란?</h2>
                <p>교양 있는 사람들이 두루 쓰는 현대 서울말을 기준으로 정한 규범적 언어입니다.</p>
                
                <h2>방언의 가치</h2>
                <p>방언은 각 지역의 문화와 역사를 담고 있는 소중한 언어 자산입니다.</p>
              `,
              type: 'text'
            }
          ]
        }
      ]
    },
    isPublished: true,
    studyRecords: [],
    highlights: [],
    bookmarks: []
  };

  return NextResponse.json(mockTextbook);
}