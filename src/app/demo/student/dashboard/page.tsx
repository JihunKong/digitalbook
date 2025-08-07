'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { StudentDemoTour } from '@/components/demo/StudentDemoTour'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, Target, Trophy, Clock, Sparkles,
  ChevronRight, GraduationCap, User, MessageSquare,
  FileText, Play, CheckCircle, Star, ArrowLeft,
  Calendar, Award
} from 'lucide-react'

interface StudentStats {
  completedLessons: number
  totalLessons: number
  currentStreak: number
  weeklyProgress: number
  recentActivities: Activity[]
  upcomingTasks: Task[]
  achievements: Achievement[]
}

interface Activity {
  id: string
  type: 'lesson' | 'quiz' | 'assignment' | 'achievement'
  title: string
  timestamp: string
  icon?: any
}

interface Task {
  id: string
  title: string
  subject: string
  dueDate: string
  progress: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
}

export default function DemoStudentDashboard() {
  const { navigateInDemo, exitDemoMode } = useDemoMode()
  const [stats, setStats] = useState<StudentStats>({
    completedLessons: 15,
    totalLessons: 20,
    currentStreak: 5,
    weeklyProgress: 75,
    recentActivities: [
      {
        id: '1',
        type: 'lesson',
        title: '시의 화자와 상황 이해하기 완료',
        timestamp: '10분 전',
        icon: BookOpen
      },
      {
        id: '2',
        type: 'quiz',
        title: '문법 퀴즈에서 95점 달성',
        timestamp: '30분 전',
        icon: Target
      },
      {
        id: '3',
        type: 'achievement',
        title: '연속 학습 5일 달성!',
        timestamp: '1시간 전',
        icon: Trophy
      }
    ],
    upcomingTasks: [
      {
        id: '1',
        title: '독서 감상문 작성',
        subject: '국어',
        dueDate: '2024-03-25',
        progress: 60
      },
      {
        id: '2',
        title: '시 낭송 연습',
        subject: '국어',
        dueDate: '2024-03-27',
        progress: 30
      }
    ],
    achievements: [
      {
        id: '1',
        title: '꾸준한 학습자',
        description: '5일 연속 학습 완료',
        icon: '🔥',
        earned: true,
        earnedDate: '오늘'
      },
      {
        id: '2',
        title: '퀴즈 마스터',
        description: '10개 퀴즈 90점 이상',
        icon: '🎯',
        earned: true,
        earnedDate: '2일 전'
      },
      {
        id: '3',
        title: '독서왕',
        description: '20권 읽기 완료',
        icon: '📚',
        earned: false
      }
    ]
  })

  const quickActions = [
    {
      title: 'AI 튜터와 대화',
      description: '궁금한 것을 AI 튜터에게 물어보세요',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-600',
      href: '/demo/student/ai-tutor'
    },
    {
      title: '학습 계속하기',
      description: '현재 진행 중인 단원 학습',
      icon: Play,
      color: 'bg-green-100 text-green-600', 
      href: '/demo/student/textbooks'
    },
    {
      title: '과제 확인',
      description: '제출할 과제와 진행 상황',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
      href: '/demo/student/assignments'
    },
    {
      title: '학습 기록',
      description: '내 학습 진도와 성취도',
      icon: Trophy,
      color: 'bg-purple-100 text-purple-600',
      href: '/demo/student/progress'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <StudentDemoTour />
      
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
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <User className="w-3 h-3 mr-1" />
                학생 데모 모드
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
            안녕하세요, 데모 학생! 🌟
          </h1>
          <p className="text-lg text-gray-600">
            AI 튜터와 함께 즐겁게 학습해보세요
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  학습 진도
                </CardTitle>
                <BookOpen className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.completedLessons}/{stats.totalLessons}
              </div>
              <Progress value={(stats.completedLessons / stats.totalLessons) * 100} className="mt-2" />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  연속 학습
                </CardTitle>
                <Trophy className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 flex items-center">
                {stats.currentStreak}일 🔥
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  주간 활동
                </CardTitle>
                <Target className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.weeklyProgress}%
              </div>
              <Progress value={stats.weeklyProgress} className="mt-2" />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  획득 배지
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.achievements.filter(a => a.earned).length}개
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 학습</h2>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                최근 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-green-600" />
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

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                배지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`border rounded-lg p-3 ${achievement.earned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{achievement.title}</h4>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                        {achievement.earned && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            {achievement.earnedDate} 획득
                          </p>
                        )}
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예정된 과제
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {stats.upcomingTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{task.title}</h4>
                      <Badge variant="outline">{task.subject}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>마감: {task.dueDate}</span>
                      <span>진행률: {task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2 mb-3" />
                    <Button size="sm" variant="outline" className="w-full">
                      계속하기
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tips */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Sparkles className="w-5 h-5 mr-2" />
              데모 체험 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🎮 체험할 수 있는 기능들</h4>
                <ul className="text-sm space-y-1">
                  <li>• AI 튜터와의 실시간 대화</li>
                  <li>• 인터랙티브 학습 활동</li>
                  <li>• 게임화된 진도 관리</li>
                  <li>• 개인 맞춤형 퀴즈</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💡 데모 팁</h4>
                <ul className="text-sm space-y-1">
                  <li>• AI 튜터에게 궁금한 것을 물어보세요</li>
                  <li>• 모든 진도는 샘플 데이터입니다</li>
                  <li>• 배지와 성취도는 데모용입니다</li>
                  <li>• "데모 종료"로 언제든 나갈 수 있습니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}