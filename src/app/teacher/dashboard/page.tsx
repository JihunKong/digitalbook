'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TeacherDemoTour } from '@/components/demo/TeacherDemoTour'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, BarChart, Calendar, TrendingUp, Award, Sparkles,
  Clock, ChevronRight, GraduationCap, Activity, Users,
  MessageSquare, FileText, Plus, Eye, Upload, Zap
} from 'lucide-react'

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
  const [stats, setStats] = useState<DashboardStats>({
    totalTextbooks: 3,
    totalStudents: 75,
    totalClasses: 3,
    weeklyProgress: 85,
    recentActivities: [
      {
        id: '1',
        type: 'textbook',
        title: '3학년 1학기 국어 교과서 생성됨',
        timestamp: '10분 전',
        icon: BookOpen
      },
      {
        id: '2',
        type: 'student',
        title: '김민수 학생이 퀴즈 완료 (95점)',
        timestamp: '30분 전',
        icon: Award
      },
      {
        id: '3',
        type: 'ai',
        title: 'AI가 새로운 학습 인사이트 생성',
        timestamp: '1시간 전',
        icon: Sparkles
      }
    ],
    upcomingAssignments: [
      {
        id: '1',
        title: '한글의 아름다움 - 받아쓰기',
        className: '3학년 1반',
        dueDate: '2024-01-20',
        submissions: 15,
        total: 25
      },
      {
        id: '2',
        title: '수학 문제 풀이',
        className: '3학년 2반',
        dueDate: '2024-01-22',
        submissions: 20,
        total: 23
      }
    ]
  })

  // Check if demo mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      localStorage.setItem('isDemo', 'true')
    }
  }, [])

  const quickActions = [
    {
      title: '새 교과서 만들기',
      description: 'AI로 교과서 생성',
      icon: Plus,
      color: 'bg-blue-500',
      href: '/teacher/textbooks/create',
      id: 'create-textbook-btn'
    },
    {
      title: '학생 관리',
      description: '학급 및 학생 관리',
      icon: Users,
      color: 'bg-green-500',
      href: '/teacher/students',
      id: 'class-management'
    },
    {
      title: '학습 분석',
      description: '성과 및 진도 확인',
      icon: BarChart,
      color: 'bg-purple-500',
      href: '/teacher/analytics',
      id: 'analytics-dashboard'
    },
    {
      title: 'AI 도구',
      description: '콘텐츠 생성 도구',
      icon: Sparkles,
      color: 'bg-orange-500',
      href: '/teacher/ai-tools',
      id: 'ai-features'
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
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                지원
              </Button>
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
              return (
                <Link key={action.href} href={action.href}>
                  <Card 
                    id={action.id}
                    className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
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
                {stats.recentActivities.map((activity) => {
                  const Icon = activity.icon
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
                })}
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-1">우수 학생</h4>
                <p className="text-sm text-blue-700">
                  김민수, 이서연 학생이 이번 주 가장 높은 학습 성취도를 보였습니다.
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-1">주의 필요</h4>
                <p className="text-sm text-yellow-700">
                  3명의 학생이 진도를 따라가는데 어려움을 겪고 있습니다.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-1">추천 활동</h4>
                <p className="text-sm text-green-700">
                  다음 주에는 그룹 토론 활동을 추가하면 참여도가 높아질 것으로 예상됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}