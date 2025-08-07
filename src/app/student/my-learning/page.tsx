'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft,
  BookOpen,
  Clock,
  Trophy,
  Target,
  Calendar,
  Play,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Flame,
  Brain,
  Timer,
  BarChart3,
  Eye,
  RefreshCw,
  Download,
  Share
} from 'lucide-react'

interface LearningProgress {
  subjectId: string
  subject: string
  textbookId: string
  textbookTitle: string
  totalChapters: number
  completedChapters: number
  currentChapter: string
  progressPercentage: number
  timeSpent: number
  averageScore: number
  lastStudied: string
  streakDays: number
}

interface StudySession {
  id: string
  date: string
  subject: string
  textbook: string
  chapter: string
  duration: number
  score: number
  activities: string[]
}

interface LearningGoal {
  id: string
  title: string
  description: string
  targetDate: string
  progress: number
  isCompleted: boolean
  subject: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  earnedDate: string
  points: number
  category: 'study' | 'achievement' | 'streak' | 'special'
}

export default function StudentMyLearningPage() {
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeRange, setSelectedTimeRange] = useState('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLearningData = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockProgress: LearningProgress[] = [
        {
          subjectId: 's1',
          subject: '국어',
          textbookId: 't1',
          textbookTitle: '3학년 1학기 국어',
          totalChapters: 12,
          completedChapters: 8,
          currentChapter: '9. 한글의 아름다움',
          progressPercentage: 67,
          timeSpent: 1240, // minutes
          averageScore: 89,
          lastStudied: '2024-01-20',
          streakDays: 7
        },
        {
          subjectId: 's2',
          subject: '수학',
          textbookId: 't2',
          textbookTitle: '수학의 즐거움',
          totalChapters: 10,
          completedChapters: 5,
          currentChapter: '6. 분수의 이해',
          progressPercentage: 50,
          timeSpent: 890,
          averageScore: 78,
          lastStudied: '2024-01-19',
          streakDays: 3
        },
        {
          subjectId: 's3',
          subject: '과학',
          textbookId: 't3',
          textbookTitle: '과학 탐험대',
          totalChapters: 8,
          completedChapters: 7,
          currentChapter: '8. 우주의 신비',
          progressPercentage: 88,
          timeSpent: 670,
          averageScore: 92,
          lastStudied: '2024-01-18',
          streakDays: 2
        }
      ]

      const mockSessions: StudySession[] = [
        {
          id: 'ss1',
          date: '2024-01-20',
          subject: '국어',
          textbook: '3학년 1학기 국어',
          chapter: '8. 우리말의 특징',
          duration: 45,
          score: 95,
          activities: ['읽기', '문제풀이', 'AI 튜터 대화']
        },
        {
          id: 'ss2',
          date: '2024-01-19',
          subject: '수학',
          textbook: '수학의 즐거움',
          chapter: '5. 곱셈과 나눗셈',
          duration: 35,
          score: 82,
          activities: ['개념학습', '연습문제']
        },
        {
          id: 'ss3',
          date: '2024-01-18',
          subject: '과학',
          textbook: '과학 탐험대',
          chapter: '7. 동물의 생활',
          duration: 50,
          score: 88,
          activities: ['관찰활동', '실험', '정리하기']
        }
      ]

      const mockGoals: LearningGoal[] = [
        {
          id: 'g1',
          title: '국어 교과서 완주하기',
          description: '3학년 1학기 국어 교과서 모든 단원 완료',
          targetDate: '2024-02-15',
          progress: 67,
          isCompleted: false,
          subject: '국어'
        },
        {
          id: 'g2',
          title: '구구단 마스터',
          description: '2단부터 9단까지 완벽하게 외우기',
          targetDate: '2024-01-30',
          progress: 85,
          isCompleted: false,
          subject: '수학'
        },
        {
          id: 'g3',
          title: '일주일 연속 학습',
          description: '7일 동안 매일 공부하기',
          targetDate: '2024-01-25',
          progress: 100,
          isCompleted: true,
          subject: '전체'
        }
      ]

      const mockAchievements: Achievement[] = [
        {
          id: 'a1',
          title: '일주일 연속',
          description: '7일 연속으로 학습을 완료했습니다!',
          icon: Flame,
          earnedDate: '2024-01-20',
          points: 100,
          category: 'streak'
        },
        {
          id: 'a2',
          title: '국어 마스터',
          description: '국어 과목에서 평균 90점 이상 달성',
          icon: BookOpen,
          earnedDate: '2024-01-19',
          points: 150,
          category: 'achievement'
        },
        {
          id: 'a3',
          title: '완벽한 점수',
          description: '퀴즈에서 100점을 획득했습니다!',
          icon: Trophy,
          earnedDate: '2024-01-18',
          points: 200,
          category: 'special'
        }
      ]
      
      setLearningProgress(mockProgress)
      setStudySessions(mockSessions)
      setLearningGoals(mockGoals)
      setRecentAchievements(mockAchievements)
      setIsLoading(false)
    }

    loadLearningData()
  }, [])

  const totalTimeSpent = learningProgress.reduce((sum, progress) => sum + progress.timeSpent, 0)
  const averageScore = Math.round(learningProgress.reduce((sum, progress) => sum + progress.averageScore, 0) / learningProgress.length)
  const totalProgress = Math.round(learningProgress.reduce((sum, progress) => sum + progress.progressPercentage, 0) / learningProgress.length)
  const currentStreak = Math.max(...learningProgress.map(p => p.streakDays))

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}시간 ${mins}분`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-800'
      case 'achievement': return 'bg-green-100 text-green-800'
      case 'streak': return 'bg-orange-100 text-orange-800'
      case 'special': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                내 학습 현황
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="all">전체</option>
              </select>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                보고서
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
                  <p className="text-sm text-gray-600">전체 진도율</p>
                  <p className="text-2xl font-bold text-blue-600">{totalProgress}%</p>
                  <p className="text-xs text-gray-500">3과목 평균</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 점수</p>
                  <p className="text-2xl font-bold text-green-600">{averageScore}점</p>
                  <p className="text-xs text-gray-500">최근 평가 기준</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">학습 시간</p>
                  <p className="text-2xl font-bold text-purple-600">{formatTime(totalTimeSpent)}</p>
                  <p className="text-xs text-gray-500">총 누적 시간</p>
                </div>
                <Timer className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">연속 학습</p>
                  <p className="text-2xl font-bold text-orange-600">{currentStreak}일</p>
                  <p className="text-xs text-gray-500">최고 기록!</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">학습 개요</TabsTrigger>
            <TabsTrigger value="progress">과목별 진도</TabsTrigger>
            <TabsTrigger value="goals">학습 목표</TabsTrigger>
            <TabsTrigger value="achievements">성취 기록</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Study Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    최근 학습 기록
                  </CardTitle>
                  <CardDescription>
                    지난 일주일간의 학습 활동을 확인해보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studySessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{session.chapter}</h4>
                            <p className="text-xs text-gray-600">{session.subject} · {session.textbook}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(session.date).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800 mb-1">
                              {session.score}점
                            </Badge>
                            <p className="text-xs text-gray-500">{session.duration}분</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {session.activities.map((activity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Goals Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    학습 목표 현황
                  </CardTitle>
                  <CardDescription>
                    설정한 목표들의 달성 현황을 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learningGoals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{goal.title}</h4>
                            <p className="text-xs text-gray-600">{goal.description}</p>
                          </div>
                          {goal.isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>진행률</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <Badge variant="outline">{goal.subject}</Badge>
                          <span>목표일: {new Date(goal.targetDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  주간 학습 패턴
                </CardTitle>
                <CardDescription>
                  이번 주 요일별 학습 시간과 성취도를 확인해보세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => {
                    const studyTime = Math.floor(Math.random() * 60) + 10
                    const height = (studyTime / 70) * 100
                    
                    return (
                      <div key={day} className="text-center">
                        <div className="h-24 flex items-end justify-center mb-2">
                          <div 
                            className="bg-blue-500 rounded-t w-8"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600">{day}</p>
                        <p className="text-xs font-semibold">{studyTime}분</p>
                      </div>
                    )
                  })}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">이번 주 총 학습시간: <span className="font-semibold">4시간 35분</span></p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 mt-6">
            <div className="space-y-4">
              {learningProgress.map((progress) => (
                <Card key={progress.subjectId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{progress.textbookTitle}</h3>
                          <p className="text-gray-600">{progress.subject}</p>
                          <p className="text-sm text-gray-500">
                            현재 학습: {progress.currentChapter}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 mb-2">
                          평균 {progress.averageScore}점
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {progress.completedChapters}/{progress.totalChapters}장 완료
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{progress.progressPercentage}%</p>
                        <p className="text-xs text-gray-600">진도율</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{formatTime(progress.timeSpent)}</p>
                        <p className="text-xs text-gray-600">총 학습시간</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{progress.streakDays}일</p>
                        <p className="text-xs text-gray-600">연속 학습</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>전체 진도</span>
                        <span>{progress.progressPercentage}%</span>
                      </div>
                      <Progress value={progress.progressPercentage} className="h-3" />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        마지막 학습: {new Date(progress.lastStudied).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          상세보기
                        </Button>
                        <Button size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          계속 학습
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">내 학습 목표</h2>
              <Button className="gap-2">
                <Target className="w-4 h-4" />
                새 목표 설정
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {learningGoals.map((goal) => (
                <Card key={goal.id} className={`hover:shadow-md transition-shadow ${goal.isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                      </div>
                      {goal.isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>진행률</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress 
                        value={goal.progress} 
                        className={`h-3 ${goal.isCompleted ? 'bg-green-200' : ''}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{goal.subject}</Badge>
                      <p className="text-gray-500">
                        목표일: {new Date(goal.targetDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    {goal.isCompleted && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-semibold text-sm">🎉 목표 달성 완료!</p>
                        <p className="text-green-600 text-xs">훌륭해요! 다음 목표도 화이팅!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">나의 성취</h2>
                <p className="text-sm text-gray-600">
                  지금까지 얻은 배지: {recentAchievements.length}개 
                  · 총 포인트: {recentAchievements.reduce((sum, a) => sum + a.points, 0)}점
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Share className="w-4 h-4" />
                성취 공유하기
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAchievements.map((achievement) => {
                const Icon = achievement.icon
                
                return (
                  <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={getCategoryColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold text-yellow-600">+{achievement.points}점</p>
                          <p className="text-xs text-gray-500">
                            {new Date(achievement.earnedDate).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  다음 성취를 향해
                </CardTitle>
                <CardDescription>
                  곧 달성할 수 있는 배지들을 확인해보세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 opacity-75">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">완벽주의자</h4>
                        <p className="text-sm text-gray-600">모든 퀴즈에서 100점 획득</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>진행률</span>
                        <span>8/10</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-500">2번 더 100점을 받으면 달성!</p>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">독서왕</h4>
                        <p className="text-sm text-gray-600">교과서 3권 완주</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>진행률</span>
                        <span>1/3</span>
                      </div>
                      <Progress value={33} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-500">교과서 2권을 더 완주하세요!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}