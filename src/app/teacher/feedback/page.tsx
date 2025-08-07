'use client'

import { useState } from 'react'
import { FeedbackEditor } from '@/components/teacher/FeedbackEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface StudentSubmission {
  id: string
  studentName: string
  studentId: string
  title: string
  content: string
  submittedAt: string
  status: 'pending' | 'in-progress' | 'completed'
  subject: string
  type: string
}

export default function TeacherFeedbackPage() {
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 샘플 데이터
  const submissions: StudentSubmission[] = [
    {
      id: '1',
      studentName: '김민수',
      studentId: '2024001',
      title: '나의 꿈',
      content: `저의 꿈은 의사가 되는 것입니다. 어릴 때부터 아픈 사람들을 도와주고 싶다는 생각을 많이 했습니다. 특히 할머니께서 병원에 자주 가시는 것을 보면서, 의사가 되어 할머니와 같은 분들을 도와드리고 싶다는 마음이 들었습니다.

의사가 되기 위해서는 공부를 열심히 해야 한다는 것을 알고 있습니다. 그래서 저는 매일 학교 수업을 열심히 듣고, 집에 와서도 복습을 하고 있습니다. 특히 과학 과목을 좋아해서 더 열심히 공부하고 있습니다.

앞으로도 제 꿈을 이루기 위해 최선을 다할 것입니다. 힘들 때도 있겠지만, 포기하지 않고 꾸준히 노력하겠습니다.`,
      submittedAt: '2024-03-20 14:30',
      status: 'pending',
      subject: '국어',
      type: '수필'
    },
    {
      id: '2',
      studentName: '이서연',
      studentId: '2024002',
      title: '독서 감상문 - 어린 왕자',
      content: `'어린 왕자'는 정말 특별한 책이었습니다. 처음에는 그저 아이들을 위한 동화책이라고 생각했지만, 읽으면 읽을수록 깊은 의미가 담겨 있다는 것을 알게 되었습니다.

특히 여우가 한 말이 기억에 남습니다. "가장 중요한 것은 눈에 보이지 않아"라는 말이 정말 인상적이었습니다. 우리가 평소에 놓치고 있는 소중한 것들에 대해 다시 생각해보게 되었습니다.

어린 왕자가 자신의 별에 있는 장미를 그리워하는 모습을 보면서, 저도 제 주변의 소중한 사람들을 더 아껴야겠다는 생각이 들었습니다.`,
      submittedAt: '2024-03-19 16:45',
      status: 'completed',
      subject: '국어',
      type: '독후감'
    },
    {
      id: '3',
      studentName: '박준호',
      studentId: '2024003',
      title: '환경 보호의 중요성',
      content: `최근 기후 변화와 환경 오염이 심각한 문제로 대두되고 있습니다. 우리 모두가 환경 보호에 관심을 가져야 할 때입니다.

첫째, 일상생활에서 에너지를 절약해야 합니다. 사용하지 않는 전기 제품의 플러그를 뽑고, 대중교통을 이용하는 것이 중요합니다.

둘째, 재활용을 생활화해야 합니다. 플라스틱, 종이, 유리 등을 분리수거하여 자원을 재활용할 수 있도록 해야 합니다.

셋째, 일회용품 사용을 줄여야 합니다. 텀블러와 에코백을 사용하여 불필요한 쓰레기를 줄일 수 있습니다.

우리 모두가 작은 실천부터 시작한다면, 더 나은 환경을 만들 수 있을 것입니다.`,
      submittedAt: '2024-03-18 10:20',
      status: 'in-progress',
      subject: '국어',
      type: '논설문'
    }
  ]

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.studentName.includes(searchTerm) || 
                         submission.title.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || submission.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleSaveFeedback = (feedbacks: any[]) => {
    console.log('Saved feedbacks:', feedbacks)
    // 여기서 실제 저장 로직 구현
    if (selectedSubmission) {
      setSelectedSubmission({
        ...selectedSubmission,
        status: 'completed'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />대기중</Badge>
      case 'in-progress':
        return <Badge variant="outline" className="text-blue-600"><AlertCircle className="w-3 h-3 mr-1" />진행중</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">첨삭 피드백 관리</h1>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              전체 내보내기
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedSubmission ? (
          <div className="space-y-6">
            {/* 선택된 제출물 편집 화면 */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedSubmission(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                목록으로
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedSubmission.studentName} ({selectedSubmission.studentId})
                </span>
                {getStatusBadge(selectedSubmission.status)}
              </div>
            </div>

            <FeedbackEditor
              studentText={selectedSubmission.content}
              studentName={selectedSubmission.studentName}
              onSave={handleSaveFeedback}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 제출물 목록 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>학생 제출물</CardTitle>
                    <CardDescription>학생들이 제출한 글쓰기 과제를 확인하고 피드백을 제공하세요</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="학생 이름 또는 제목 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      필터
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList>
                    <TabsTrigger value="all">전체 ({submissions.length})</TabsTrigger>
                    <TabsTrigger value="pending">대기중 ({submissions.filter(s => s.status === 'pending').length})</TabsTrigger>
                    <TabsTrigger value="in-progress">진행중 ({submissions.filter(s => s.status === 'in-progress').length})</TabsTrigger>
                    <TabsTrigger value="completed">완료 ({submissions.filter(s => s.status === 'completed').length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterStatus} className="mt-6">
                    <div className="space-y-4">
                      {filteredSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{submission.title}</h3>
                                <Badge variant="secondary">{submission.type}</Badge>
                                <Badge variant="outline">{submission.subject}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {submission.studentName} ({submission.studentId})
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {submission.content}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {submission.submittedAt}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {submission.content.length}자
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {getStatusBadge(submission.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}