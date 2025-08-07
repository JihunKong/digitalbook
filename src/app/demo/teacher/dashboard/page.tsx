'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { TeacherDemoTour } from '@/components/demo/TeacherDemoTour'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, BarChart, Calendar, TrendingUp, Award, Sparkles,
  Clock, ChevronRight, GraduationCap, Activity, Users,
  MessageSquare, FileText, Plus, Eye, Upload, Zap, Settings,
  Library, Bookmark, ArrowLeft
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

export default function DemoTeacherDashboard() {
  const { navigateInDemo, exitDemoMode } = useDemoMode()
  const [stats, setStats] = useState<DashboardStats>({
    totalTextbooks: 3,
    totalStudents: 75,
    totalClasses: 3,
    weeklyProgress: 85,
    recentActivities: [
      {
        id: '1',
        type: 'textbook',
        title: '3학년 1학기 국어 교과서 생성 완료',
        timestamp: '5분 전',
        icon: BookOpen
      },
      {
        id: '2',
        type: 'student',
        title: '김철수 학생이 1단원 학습 완료',
        timestamp: '15분 전',
        icon: Users
      },
      {
        id: '3',
        type: 'assignment',
        title: '독서 감상문 과제 12건 제출됨',
        timestamp: '1시간 전',
        icon: FileText
      }
    ],
    upcomingAssignments: [
      {
        id: '1',
        title: '시 읽기와 느낌 표현하기',
        className: '3-1반',
        dueDate: '2024-03-25',
        submissions: 18,
        total: 25
      },
      {
        id: '2', 
        title: '독서 감상문 쓰기',
        className: '3-2반',
        dueDate: '2024-03-27',
        submissions: 22,
        total: 27
      }
    ]
  })

  const quickActions = [
    {
      title: 'AI 교과서 생성',
      description: '새로운 단원 교과서를 AI로 빠르게 생성',
      icon: Sparkles,
      color: 'bg-purple-100 text-purple-600',
      href: '/demo/teacher/textbooks/create'
    },
    {
      title: '과제 생성',
      description: '학습 진도에 맞는 과제 만들기',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600', 
      href: '/demo/teacher/assignments'
    },
    {
      title: '학생 진도 확인',
      description: '실시간 학습 현황 모니터링',
      icon: BarChart,
      color: 'bg-green-100 text-green-600',
      href: '/demo/teacher/analytics'
    },
    {
      title: '협업 도구',
      description: '다른 교사와 자료 공유 및 협업',
      icon: Users,
      color: 'bg-orange-100 text-orange-600',
      href: '/demo/teacher/collaboration'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <TeacherDemoTour />
      
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateInDemo('/')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                데모 홈으로
              </Button>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <GraduationCap className="w-3 h-3 mr-1" />
                교사 데모 모드
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exitDemoMode}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              데모 종료
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, 데모 교사님! 👋
          </h1>
          <p className="text-lg text-gray-600">
            AI 기반 디지털 교과서로 더 효과적인 수업을 만들어보세요
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  총 교과서
                </CardTitle>
                <BookOpen className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalTextbooks}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  담당 학생
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalStudents}명
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  담당 학급
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalClasses}개
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  주간 진도율
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.weeklyProgress}%
              </div>
              <Progress value={stats.weeklyProgress} className="mt-2" />
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader 
                    className="pb-2"
                    onClick={() => navigateInDemo(action.href)}
                  >
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{action.title}</CardTitle>
                    <CardDescription className="text-xs">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button size="sm" variant="ghost" className="p-0 h-auto">
                      시작하기 <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                최근 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
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
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예정된 과제
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{assignment.title}</h4>
                      <Badge variant="outline">{assignment.className}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>마감: {assignment.dueDate}</span>
                      <span>
                        제출: {assignment.submissions}/{assignment.total}
                      </span>
                    </div>
                    <Progress 
                      value={(assignment.submissions / assignment.total) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => navigateInDemo('/teacher/assignments')}
              >
                모든 과제 보기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tips */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Sparkles className="w-5 h-5 mr-2" />
              데모 체험 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🎯 체험할 수 있는 기능들</h4>
                <ul className="text-sm space-y-1">
                  <li>• AI 기반 교과서 자동 생성</li>
                  <li>• 학생 진도 실시간 모니터링</li>
                  <li>• 과제 생성 및 자동 평가</li>
                  <li>• 교사 간 협업 도구</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💡 데모 팁</h4>
                <ul className="text-sm space-y-1">
                  <li>• 모든 데이터는 샘플 데이터입니다</li>
                  <li>• 실제 이메일 발송은 되지 않습니다</li>
                  <li>• 데이터는 1시간마다 초기화됩니다</li>
                  <li>• 언제든 "데모 종료"로 나갈 수 있습니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}