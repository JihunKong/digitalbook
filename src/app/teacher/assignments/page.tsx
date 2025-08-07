'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft,
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  BarChart3,
  BookOpen,
  Award
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  textbookId: string
  textbookTitle: string
  classId: string
  className: string
  dueDate: string
  createdAt: string
  maxScore: number
  submissions: number
  totalStudents: number
  status: 'draft' | 'active' | 'closed'
  type: 'quiz' | 'essay' | 'project' | 'reading'
}

export default function TeacherAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAssignments = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockAssignments: Assignment[] = [
        {
          id: '1',
          title: '한글의 아름다움 - 받아쓰기',
          description: '3학년 1학기 국어 교과서 1단원 받아쓰기 과제',
          textbookId: 'tb1',
          textbookTitle: '3학년 국어',
          classId: 'class1',
          className: '3학년 1반',
          dueDate: '2024-01-25',
          createdAt: '2024-01-18',
          maxScore: 100,
          submissions: 18,
          totalStudents: 25,
          status: 'active',
          type: 'quiz'
        },
        {
          id: '2',
          title: '우리나라 전통문화 탐구',
          description: '한국의 전통문화에 대해 조사하고 발표 자료 만들기',
          textbookId: 'tb2',
          textbookTitle: '사회 탐구',
          classId: 'class1',
          className: '3학년 1반',
          dueDate: '2024-01-30',
          createdAt: '2024-01-20',
          maxScore: 50,
          submissions: 12,
          totalStudents: 25,
          status: 'active',
          type: 'project'
        },
        {
          id: '3',
          title: '곱셈표 외우기 테스트',
          description: '구구단 전체 암송 및 문제 풀이',
          textbookId: 'tb3',
          textbookTitle: '수학의 기초',
          classId: 'class2',
          className: '3학년 2반',
          dueDate: '2024-01-22',
          createdAt: '2024-01-15',
          maxScore: 100,
          submissions: 23,
          totalStudents: 24,
          status: 'closed',
          type: 'quiz'
        },
        {
          id: '4',
          title: '과학 실험 보고서',
          description: '물의 상태 변화 실험 관찰 기록',
          textbookId: 'tb4',
          textbookTitle: '과학 탐험',
          classId: 'class1',
          className: '3학년 1반',
          dueDate: '2024-02-05',
          createdAt: '2024-01-22',
          maxScore: 80,
          submissions: 0,
          totalStudents: 25,
          status: 'draft',
          type: 'essay'
        }
      ]
      
      setAssignments(mockAssignments)
      setIsLoading(false)
    }

    loadAssignments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중'
      case 'closed': return '마감됨'
      case 'draft': return '임시저장'
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return FileText
      case 'essay': return Edit
      case 'project': return BookOpen
      case 'reading': return Eye
      default: return FileText
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'quiz': return '퀴즈'
      case 'essay': return '서술형'
      case 'project': return '프로젝트'
      case 'reading': return '독서'
      default: return type
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesTab = selectedTab === 'all' || assignment.status === selectedTab
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = filterClass === 'all' || assignment.classId === filterClass
    return matchesTab && matchesSearch && matchesClass
  })

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'active').length,
    draft: assignments.filter(a => a.status === 'draft').length,
    closed: assignments.filter(a => a.status === 'closed').length
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
              <h1 className="text-xl font-semibold">과제 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 과제 만들기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 과제</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">진행중</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">임시저장</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                </div>
                <Edit className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">완료</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                </div>
                <Award className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="과제 검색..."
                    className="pl-10 pr-4 py-2 border rounded-md w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="border rounded-md px-3 py-2"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="all">전체 학급</option>
                  <option value="class1">3학년 1반</option>
                  <option value="class2">3학년 2반</option>
                </select>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                내보내기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">전체 ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">진행중 ({stats.active})</TabsTrigger>
            <TabsTrigger value="draft">임시저장 ({stats.draft})</TabsTrigger>
            <TabsTrigger value="closed">완료 ({stats.closed})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p>과제를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const TypeIcon = getTypeIcon(assignment.type)
                  const completionRate = (assignment.submissions / assignment.totalStudents) * 100
                  
                  return (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TypeIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                <Badge className={getStatusColor(assignment.status)}>
                                  {getStatusText(assignment.status)}
                                </Badge>
                                <Badge variant="outline">
                                  {getTypeText(assignment.type)}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-600 mb-3">{assignment.description}</p>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {assignment.textbookTitle}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {assignment.className}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  마감: {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Award className="w-4 h-4" />
                                  {assignment.maxScore}점
                                </div>
                              </div>
                              
                              {assignment.status !== 'draft' && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>제출률</span>
                                    <span>{assignment.submissions}/{assignment.totalStudents} ({Math.round(completionRate)}%)</span>
                                  </div>
                                  <Progress value={completionRate} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="w-4 h-4" />
                              보기
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <BarChart3 className="w-4 h-4" />
                              결과
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Edit className="w-4 h-4" />
                              수정
                            </Button>
                            {assignment.status === 'draft' && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                삭제
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {filteredAssignments.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">과제가 없습니다</h3>
                      <p className="text-gray-600 mb-4">
                        {selectedTab === 'all' ? '아직 생성된 과제가 없습니다.' : `${getStatusText(selectedTab)} 과제가 없습니다.`}
                      </p>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        첫 번째 과제 만들기
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}