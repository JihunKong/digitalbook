'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// import { Calendar } from '@/components/ui/calendar' // Component not available
import { 
  Search, 
  Filter, 
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Upload,
  Eye,
  Edit3,
  BookOpen,
  PenTool,
  Users,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  description: string
  type: 'WRITING' | 'READING' | 'QUIZ' | 'PROJECT'
  dueDate: string
  classId: string
  points: number
  createdAt: string
  updatedAt: string
  class?: {
    id: string
    name: string
  }
  submissions?: Array<{
    id: string
    status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED'
    grade?: number
    feedback?: any
    submittedAt?: string
  }>
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getAssignments()
        
        if (response.data && Array.isArray(response.data)) {
          // Transform the backend data to match our frontend structure
          const transformedAssignments: Assignment[] = response.data.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            type: assignment.type || 'WRITING',
            dueDate: assignment.dueDate,
            classId: assignment.classId,
            points: assignment.points || 100,
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt,
            class: assignment.class,
            submissions: assignment.submissions || []
          }))
          
          setAssignments(transformedAssignments)
        } else {
          // If no data from API, use fallback data
          console.log('No assignments from API, using fallback data')
          setAssignments([])
        }
      } catch (error) {
        console.error('Failed to load assignments:', error)
        toast.error('과제 목록을 불러오는데 실패했습니다')
        // Don't set empty array on error - keep any existing data
      } finally {
        setIsLoading(false)
      }
    }

    loadAssignments()
  }, [])

  // Use only real assignments from API
  const displayAssignments = assignments

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return 'not-started'
    }
    const submission = assignment.submissions[0]
    switch (submission.status) {
      case 'DRAFT': return 'in-progress'
      case 'SUBMITTED': return 'submitted'
      case 'GRADED': return 'graded'
      default: return 'not-started'
    }
  }

  const filteredAssignments = displayAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
    const status = getSubmissionStatus(assignment)
    const matchesFilter = filterStatus === 'all' || status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-started':
        return <Badge variant="outline" className="text-gray-600"><Clock className="w-3 h-3 mr-1" />시작 전</Badge>
      case 'in-progress':
        return <Badge variant="outline" className="text-blue-600"><Edit3 className="w-3 h-3 mr-1" />진행중</Badge>
      case 'submitted':
        return <Badge variant="outline" className="text-yellow-600"><CheckCircle className="w-3 h-3 mr-1" />제출완료</Badge>
      case 'graded':
        return <Badge variant="outline" className="text-green-600"><BarChart3 className="w-3 h-3 mr-1" />채점완료</Badge>
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'writing':
        return <PenTool className="w-4 h-4" />
      case 'reading':
        return <BookOpen className="w-4 h-4" />
      case 'quiz':
        return <FileText className="w-4 h-4" />
      case 'project':
        return <Users className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'writing':
        return '글쓰기'
      case 'reading':
        return '독서'
      case 'quiz':
        return '퀴즈'
      case 'project':
        return '프로젝트'
      default:
        return type
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const upcomingAssignments = displayAssignments
    .filter(a => {
      const status = getSubmissionStatus(a)
      return status !== 'graded' && getDaysUntilDue(a.dueDate) >= 0
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">과제 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">전체 과제</p>
                        <p className="text-2xl font-bold">{displayAssignments.length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">진행중</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {displayAssignments.filter(a => getSubmissionStatus(a) === 'in-progress').length}
                        </p>
                      </div>
                      <Edit3 className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">제출완료</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {displayAssignments.filter(a => getSubmissionStatus(a) === 'submitted').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">평균 점수</p>
                        <p className="text-2xl font-bold text-green-600">85</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Assignment List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>과제 목록</CardTitle>
                    <CardDescription>모든 과제를 확인하고 관리하세요</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="과제 검색..."
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">전체</TabsTrigger>
                    <TabsTrigger value="not-started">시작 전</TabsTrigger>
                    <TabsTrigger value="in-progress">진행중</TabsTrigger>
                    <TabsTrigger value="submitted">제출완료</TabsTrigger>
                    <TabsTrigger value="graded">채점완료</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterStatus} className="mt-6">
                    <div className="space-y-4">
                      {filteredAssignments.map((assignment) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {getTypeIcon(assignment.type.toLowerCase())}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{assignment.title}</h3>
                                  <p className="text-sm text-gray-600">
                                    {assignment.class?.name || '학급'}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-3">
                                {assignment.description}
                              </p>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <CalendarIcon className="w-3 h-3" />
                                  마감: {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}
                                  {(() => {
                                    const status = getSubmissionStatus(assignment)
                                    return status !== 'graded' && status !== 'submitted' && (
                                    <span className={`ml-1 font-medium ${
                                      getDaysUntilDue(assignment.dueDate) <= 2 ? 'text-red-600' : ''
                                    }`}>
                                      (D-{getDaysUntilDue(assignment.dueDate)})
                                    </span>
                                  )
                                  })()}
                                </span>
                                <Badge variant="secondary">
                                  {getTypeLabel(assignment.type.toLowerCase())}
                                </Badge>
                                {getStatusBadge(getSubmissionStatus(assignment))}
                              </div>

                              {assignment.submissions?.[0]?.grade !== undefined && (
                                <div className="mt-3 flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">점수:</span>
                                    <span className="font-semibold text-lg">
                                      {assignment.submissions[0].grade}/{assignment.points}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={(assignment.submissions[0].grade / assignment.points) * 100} 
                                    className="w-32 h-2"
                                  />
                                </div>
                              )}

                              {assignment.submissions?.[0]?.feedback && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    <span className="font-medium">선생님 피드백:</span> {assignment.submissions[0].feedback}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex flex-col gap-2">
                              {(() => {
                                const status = getSubmissionStatus(assignment)
                                return status === 'not-started' || status === 'in-progress' ? (
                                <Link href={`/student/assignments/${assignment.id}`}>
                                  <Button size="sm">
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    과제 하기
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={`/student/assignments/${assignment.id}?view=true`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-3 h-3 mr-1" />
                                    확인하기
                                  </Button>
                                </Link>
                              )
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>과제 캘린더</CardTitle>
                <CardDescription>마감일을 한눈에 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-4 text-center text-gray-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">캘린더 컴포넌트 준비 중</p>
                  <p className="text-xs mt-1">마감일은 각 과제 카드에서 확인할 수 있습니다</p>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>다가오는 과제</CardTitle>
                <CardDescription>마감이 임박한 과제들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-gray-600">
                          {assignment.class?.name || '학급'} • D-{getDaysUntilDue(assignment.dueDate)}
                        </p>
                      </div>
                      {getDaysUntilDue(assignment.dueDate) <= 2 && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      const inProgressAssignments = displayAssignments.filter(a => 
                        getSubmissionStatus(a) === 'in-progress' || getSubmissionStatus(a) === 'not-started'
                      )
                      if (inProgressAssignments.length > 0) {
                        router.push(`/student/assignments/${inProgressAssignments[0].id}`)
                      } else {
                        toast.info('진행 중인 과제가 없습니다')
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    과제 제출하기
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      const gradedAssignments = displayAssignments.filter(a => 
                        getSubmissionStatus(a) === 'graded'
                      )
                      if (gradedAssignments.length > 0) {
                        // Calculate average score
                        const totalScore = gradedAssignments.reduce((sum, a) => {
                          const score = a.submissions?.[0]?.grade || 0
                          return sum + score
                        }, 0)
                        const avgScore = Math.round(totalScore / gradedAssignments.length)
                        toast.info(`평균 점수: ${avgScore}점 (채점 완료: ${gradedAssignments.length}개)`)
                      } else {
                        toast.info('아직 채점된 과제가 없습니다')
                      }
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    성적 확인하기
                  </Button>
                  <Link href="/student/ai-tutor">
                    <Button className="w-full justify-start" variant="outline">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      도움 요청하기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}