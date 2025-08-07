import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const { textbookId, teacherId, timeRange, includeStudentProgress } = await request.json();

    // 실제로는 데이터베이스에서 데이터 조회
    const mockData = {
      textbookInfo: {
        title: '현대문학의 이해',
        createdAt: '2024-01-15',
        totalPages: 20
      },
      students: [
        {
          studentId: '1',
          studentName: '김민수',
          studentNumber: '20240101',
          totalPages: 20,
          completedPages: 18,
          timeSpent: 240,
          questionsAnswered: 25,
          questionsCorrect: 22,
          chatInteractions: 15,
          lastActive: '2024-01-20T10:30:00Z',
          strengths: ['현대문학', '글쓰기'],
          improvements: ['고전문학', '문법'],
          responses: [
            {
              questionId: 'q1',
              questionText: '현대 소설의 주요 특징 세 가지를 설명하시오.',
              response: '내면 의식 탐구, 실험적 기법, 현실 비판',
              isCorrect: true,
              submittedAt: '2024-01-20T10:15:00Z'
            },
            {
              questionId: 'q2',
              questionText: '의식의 흐름 기법이란 무엇인가?',
              response: '인물의 의식을 여과 없이 그대로 표현하는 기법',
              isCorrect: true,
              submittedAt: '2024-01-20T10:25:00Z'
            }
          ]
        },
        {
          studentId: '2',
          studentName: '이서연',
          studentNumber: '20240102',
          totalPages: 20,
          completedPages: 12,
          timeSpent: 180,
          questionsAnswered: 18,
          questionsCorrect: 14,
          chatInteractions: 22,
          lastActive: '2024-01-20T14:15:00Z',
          strengths: ['문학 이해', '창의적 사고'],
          improvements: ['속독', '요약'],
          responses: [
            {
              questionId: 'q1',
              questionText: '현대 소설의 주요 특징 세 가지를 설명하시오.',
              response: '사상적 내용, 새로운 기법, 사회 비판',
              isCorrect: false,
              submittedAt: '2024-01-20T14:10:00Z'
            },
            {
              questionId: 'q2',
              questionText: '의식의 흐름 기법이란 무엇인가?',
              response: '생각을 순서대로 써나가는 기법',
              isCorrect: false,
              submittedAt: '2024-01-20T14:20:00Z'
            }
          ]
        }
      ]
    };

    // Excel 워크북 생성
    const workbook = new ExcelJS.Workbook();
    
    // 워크시트 1: 학생 진도 요약
    const summarySheet = workbook.addWorksheet('학생 진도 요약');
    
    // 헤더 설정
    summarySheet.columns = [
      { header: '학번', key: 'studentNumber', width: 15 },
      { header: '이름', key: 'studentName', width: 15 },
      { header: '진도율(%)', key: 'progressRate', width: 12 },
      { header: '학습시간(분)', key: 'timeSpent', width: 15 },
      { header: '문제 수', key: 'questionsAnswered', width: 12 },
      { header: '정답 수', key: 'questionsCorrect', width: 12 },
      { header: '정답률(%)', key: 'accuracy', width: 12 },
      { header: 'AI 대화 수', key: 'chatInteractions', width: 15 },
      { header: '마지막 활동', key: 'lastActive', width: 20 },
      { header: '강점', key: 'strengths', width: 30 },
      { header: '개선점', key: 'improvements', width: 30 }
    ];

    // 데이터 추가
    mockData.students.forEach(student => {
      summarySheet.addRow({
        studentNumber: student.studentNumber,
        studentName: student.studentName,
        progressRate: Math.round((student.completedPages / student.totalPages) * 100),
        timeSpent: student.timeSpent,
        questionsAnswered: student.questionsAnswered,
        questionsCorrect: student.questionsCorrect,
        accuracy: Math.round((student.questionsCorrect / student.questionsAnswered) * 100),
        chatInteractions: student.chatInteractions,
        lastActive: new Date(student.lastActive).toLocaleDateString('ko-KR'),
        strengths: student.strengths.join(', '),
        improvements: student.improvements.join(', ')
      });
    });

    // 워크시트 2: 상세 응답 데이터
    const responseSheet = workbook.addWorksheet('학생 응답 데이터');
    
    responseSheet.columns = [
      { header: '학번', key: 'studentNumber', width: 15 },
      { header: '이름', key: 'studentName', width: 15 },
      { header: '문제 ID', key: 'questionId', width: 15 },
      { header: '문제 내용', key: 'questionText', width: 50 },
      { header: '학생 응답', key: 'response', width: 50 },
      { header: '정답 여부', key: 'isCorrect', width: 12 },
      { header: '제출 시간', key: 'submittedAt', width: 20 }
    ];

    // 응답 데이터 추가
    mockData.students.forEach(student => {
      student.responses.forEach(response => {
        responseSheet.addRow({
          studentNumber: student.studentNumber,
          studentName: student.studentName,
          questionId: response.questionId,
          questionText: response.questionText,
          response: response.response,
          isCorrect: response.isCorrect ? 'O' : 'X',
          submittedAt: new Date(response.submittedAt).toLocaleString('ko-KR')
        });
      });
    });

    // 워크시트 3: 통계 데이터
    const statsSheet = workbook.addWorksheet('통계 데이터');
    
    const totalStudents = mockData.students.length;
    const avgProgress = mockData.students.reduce((sum, s) => sum + (s.completedPages / s.totalPages * 100), 0) / totalStudents;
    const avgTimeSpent = mockData.students.reduce((sum, s) => sum + s.timeSpent, 0) / totalStudents;
    const avgAccuracy = mockData.students.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAnswered * 100), 0) / totalStudents;
    
    statsSheet.addRow(['', '', '', '', '']);
    statsSheet.addRow(['', '교과서 통계', '', '', '']);
    statsSheet.addRow(['', '교과서 제목', mockData.textbookInfo.title, '', '']);
    statsSheet.addRow(['', '생성 일자', mockData.textbookInfo.createdAt, '', '']);
    statsSheet.addRow(['', '전체 페이지', mockData.textbookInfo.totalPages, '', '']);
    statsSheet.addRow(['', '', '', '', '']);
    statsSheet.addRow(['', '학습 통계', '', '', '']);
    statsSheet.addRow(['', '총 학생 수', totalStudents, '', '']);
    statsSheet.addRow(['', '평균 진도율', `${Math.round(avgProgress)}%`, '', '']);
    statsSheet.addRow(['', '평균 학습시간', `${Math.round(avgTimeSpent)}분`, '', '']);
    statsSheet.addRow(['', '평균 정답률', `${Math.round(avgAccuracy)}%`, '', '']);

    // 스타일 설정
    [summarySheet, responseSheet, statsSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    // Excel 버퍼 생성
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Disposition', 'attachment; filename="학습분석_' + new Date().toISOString().split('T')[0] + '.xlsx"');
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Analytics export error:', error);
    
    return NextResponse.json(
      { error: '데이터 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}