'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TeacherDemoTour } from '@/components/demo/TeacherDemoTour'
import { DemoModeToggle } from '@/components/DemoModeBanner'
import { PDFUploadModal } from '@/components/PDFUploadModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, BarChart, Calendar, TrendingUp, Award, Sparkles,
  Clock, ChevronRight, GraduationCap, Activity, Users,
  MessageSquare, FileText, Plus, Eye, Upload, Zap, Settings,
  Library, Bookmark
} from 'lucide-react'
import { apiClient } from '@/lib/api'

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    BookOpen,
    Award,
    Sparkles,
    GraduationCap,
    Users,
    Activity,
    MessageSquare,
    FileText
  }
  return iconMap[iconName] || BookOpen
}

interface DashboardStats {
  totalTextbooks: number
  totalStudents: number
  totalClasses: number
  weeklyProgress: number
  recentActivities: Activity[]
  upcomingAssignments: Assignment[]
}

interface Activity {
  id: string
  type: 'textbook' | 'student' | 'assignment' | 'ai'
  title: string
  timestamp: string
  icon?: any
}

interface Assignment {
  id: string
  title: string
  className: string
  dueDate: string
  submissions: number
  total: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<Array<{ id: string; name: string }>>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTextbooks: 0,
    totalStudents: 0,
    totalClasses: 0,
    weeklyProgress: 0,
    recentActivities: [],
    upcomingAssignments: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if demo mode and fetch teacher classes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      localStorage.setItem('isDemo', 'true')
    }
    
    // Fetch teacher's data
    fetchTeacherClasses()
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getTeacherDashboardData()
      if (response.data) {
        setStats(response.data)
      } else if (response.error) {
        setError(response.error.message)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeacherClasses = async () => {
    try {
      const response = await apiClient.getTeacherClasses()
      if (response.data && Array.isArray(response.data)) {
        setTeacherClasses(response.data.map((cls: any) => ({
          id: cls.id,
          name: cls.name
        })))
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handlePDFUploadSuccess = (pdfId: string) => {
    // Update recent activities
    const newActivity = {
      id: `pdf-${Date.now()}`,
      type: 'textbook' as const,
      title: 'PDF 교과서가 업로드되고 활동이 생성되었습니다',
      timestamp: '방금 전',
      icon: BookOpen
    }
    
    setStats(prev => ({
      ...prev,
      recentActivities: [newActivity, ...prev.recentActivities.slice(0, 2)]
    }))
  }

  const quickActions = [
    {
      title: '새 교과서 만들기',
      description: 'AI로 교과서 생성',
      icon: Plus,
      color: 'bg-blue-500',
      href: '/teacher/textbooks/create',
      id: 'create-textbook-btn',
      isLink: true
    },
    {
      title: 'PDF 업로드',
      description: 'PDF를 교과서로 변환',
      icon: Upload,
      color: 'bg-indigo-500',
      onClick: () => setIsPDFModalOpen(true),
      id: 'upload-pdf-btn',
      isLink: false
    },
    {
      title: '학급 관리',
      description: '학급 및 학생 관리',
      icon: Users,
      color: 'bg-green-500',
      href: '/teacher/classes',
      id: 'class-management',
      isLink: true
    },
    {
      title: '학습 분석',
      description: '성과 및 진도 확인',
      icon: BarChart,
      color: 'bg-purple-500',
      href: '/teacher/analytics',
      id: 'analytics-dashboard',
      isLink: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherDemoTour />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div id="welcome">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                안녕하세요, 선생님! 
                <span className="text-lg">👋</span>
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                오늘도 AI와 함께 멋진 수업을 만들어보세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Sparkles className="w-4 h-4 mr-1" />
                AI 크레딧: 1,000
              </Badge>
              <div className="flex items-center gap-2">
                <Link href="/teacher/library">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Library className="w-4 h-4" />
                    라이브러리
                  </Button>
                </Link>
                <Link href="/teacher/assignments">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    과제
                  </Button>
                </Link>
                <Link href="/teacher/settings">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    설정
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 교과서</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTextbooks}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+1</span> 이번 주
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">95%</span> 활성 사용자
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">주간 진도율</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyProgress}%</div>
              <Progress value={stats.weeklyProgress} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI 활용도</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">높음</div>
              <p className="text-xs text-muted-foreground">
                콘텐츠 생성 15회
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">빠른 실행</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              const CardComponent = (
                <Card 
                  id={action.id}
                  className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  onClick={action.onClick}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              )

              if (action.isLink && action.href) {
                return (
                  <Link key={action.id} href={action.href}>
                    {CardComponent}
                  </Link>
                )
              }
              
              return <div key={action.id}>{CardComponent}</div>
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                최근 활동
                <Button variant="ghost" size="sm">
                  전체 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500">
                    로딩 중...
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-red-500">
                    {error}
                  </div>
                ) : stats.recentActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    최근 활동이 없습니다.
                  </div>
                ) : (
                  stats.recentActivities.map((activity) => {
                    const Icon = getIconComponent(activity.icon || 'BookOpen')
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                다가오는 과제
                <Link href="/teacher/assignments">
                  <Button variant="ghost" size="sm">
                    전체 보기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{assignment.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{assignment.className}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(assignment.submissions / assignment.total) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-gray-600">
                          {assignment.submissions}/{assignment.total} 제출
                        </span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI 인사이트
            </CardTitle>
            <CardDescription>
              AI가 분석한 이번 주 학습 현황입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                AI 분석 데이터를 불러오는 중...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                AI 인사이트를 불러올 수 없습니다.
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                충분한 데이터가 쌓이면 AI 인사이트를 제공해드릴게요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Demo Mode Toggle */}
      <DemoModeToggle />

      {/* PDF Upload Modal */}
      <PDFUploadModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onSuccess={handlePDFUploadSuccess}
        classes={teacherClasses}
      />
    </div>
  )
}