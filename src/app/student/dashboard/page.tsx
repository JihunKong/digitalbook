'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StudentDemoTour, InteractiveLearningDemo } from '@/components/demo/StudentDemoTour'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, Clock, CheckCircle, TrendingUp, LogOut, Play, FileText,
  Trophy, MessageSquare, Sparkles, Target, Zap, Award, Star,
  Flame, Heart, Gift
} from 'lucide-react'

interface StudentStats {
  totalPoints: number
  streak: number
  completedLessons: number
  quizScore: number
  achievements: Achievement[]
  level: number
  experience: number
  nextLevelExp: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  unlocked: boolean
  date?: string
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [showDemo, setShowDemo] = useState(false)
  const router = useRouter()
  
  const [stats] = useState<StudentStats>({
    totalPoints: 1250,
    streak: 7,
    completedLessons: 23,
    quizScore: 92,
    level: 5,
    experience: 450,
    nextLevelExp: 600,
    achievements: [
      {
        id: '1',
        title: '첫 걸음',
        description: '첫 번째 수업 완료',
        icon: Trophy,
        unlocked: true,
        date: '2024-01-10'
      },
      {
        id: '2',
        title: '일주일 연속',
        description: '7일 연속 학습',
        icon: Flame,
        unlocked: true,
        date: '2024-01-15'
      },
      {
        id: '3',
        title: 'AI 마스터',
        description: 'AI 튜터 100회 사용',
        icon: Sparkles,
        unlocked: false
      }
    ]
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Check if demo mode
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('demo') === 'true') {
        setUser({ name: '김민수', role: 'STUDENT' })
        localStorage.setItem('isStudentDemo', 'true')
        setShowDemo(true)
      } else {
        router.push('/auth/login')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isStudentDemo')
    window.location.href = '/'
  }

  const myBooks = [
    {
      id: '1',
      title: '3학년 1학기 국어',
      teacher: '김선생님',
      progress: 68,
      totalChapters: 12,
      completedChapters: 8,
      lastAccessed: '30분 전',
      nextLesson: '한글의 아름다움',
      difficulty: 'easy'
    },
    {
      id: '2',
      title: '수학의 즐거움',
      teacher: '박선생님',
      progress: 45,
      totalChapters: 10,
      completedChapters: 4,
      lastAccessed: '2시간 전',
      nextLesson: '분수의 이해',
      difficulty: 'medium'
    },
    {
      id: '3',
      title: '과학 탐험대',
      teacher: '이선생님',
      progress: 92,
      totalChapters: 8,
      completedChapters: 7,
      lastAccessed: '어제',
      nextLesson: '우주의 신비',
      difficulty: 'hard'
    }
  ]

  const upcomingAssignments = [
    {
      id: '1',
      title: '한글 받아쓰기',
      subject: '국어',
      dueDate: '내일',
      points: 50,
      status: 'pending'
    },
    {
      id: '2',
      title: '수학 문제 풀이',
      subject: '수학',
      dueDate: '3일 후',
      points: 30,
      status: 'pending'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <StudentDemoTour />
      {showDemo && <InteractiveLearningDemo />}
      
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                내책 - 나의 학습 공간
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  레벨 {stats.level}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  {stats.streak}일 연속
                </Badge>
              </div>
              <span className="text-sm text-gray-600">안녕하세요, {user?.name || '학생'}님!</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8" id="welcome">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            오늘도 즐겁게 공부해요! <span className="text-2xl">🎒</span>
          </h2>
          <p className="text-gray-600 mt-2">매일 조금씩 성장하는 나를 만나보세요</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">총 포인트</p>
                  <p className="text-xl font-bold text-green-600">{stats.totalPoints}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">연속 학습</p>
                  <p className="text-xl font-bold text-orange-600">{stats.streak}일</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">완료 수업</p>
                  <p className="text-xl font-bold text-blue-600">{stats.completedLessons}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">평균 점수</p>
                  <p className="text-xl font-bold text-purple-600">{stats.quizScore}점</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card id="progress-tracker">
            <CardContent className="p-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">레벨 {stats.level}</p>
                  <p className="text-xs text-gray-600">{stats.experience}/{stats.nextLevelExp}</p>
                </div>
                <Progress value={(stats.experience / stats.nextLevelExp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Textbooks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle id="my-textbooks" className="flex items-center justify-between">
                  내 교과서
                  <Link href="/student/textbooks">
                    <Button variant="ghost" size="sm">
                      전체 보기
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>오늘 공부할 교과서를 선택하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myBooks.map((book) => (
                    <div key={book.id} className="border rounded-lg p-4 hover:shadow-md transition-all hover:scale-[1.02]">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            book.difficulty === 'easy' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                            book.difficulty === 'medium' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                            'bg-gradient-to-br from-purple-400 to-purple-600'
                          }`}>
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{book.title}</h4>
                            <p className="text-sm text-gray-600">
                              {book.teacher} · {book.completedChapters}/{book.totalChapters}장 완료
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              다음 수업: {book.nextLesson}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                          <Play className="w-3 h-3 mr-1" />
                          계속하기
                        </Button>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">진행률</span>
                          <span className="font-medium">{book.progress}%</span>
                        </div>
                        <Progress value={book.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Tutor Card */}
            <Card className="mt-6" id="ai-tutor">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI 튜터와 대화하기</h3>
                      <p className="text-sm text-gray-600">궁금한 것이 있으면 언제든 물어보세요!</p>
                    </div>
                  </div>
                  <Link href="/student/ai-tutor">
                    <Button>
                      <Sparkles className="w-4 h-4 mr-2" />
                      시작하기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Assignments */}
            <Card id="assignments">
              <CardHeader>
                <CardTitle className="text-lg">오늘의 과제</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-gray-600">{assignment.subject} · {assignment.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            <Gift className="w-3 h-3 mr-1" />
                            {assignment.points}점
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card id="achievements">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  나의 성취
                  <Badge variant="secondary">{stats.achievements.filter(a => a.unlocked).length}/{stats.achievements.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {stats.achievements.map((achievement) => {
                    const Icon = achievement.icon
                    return (
                      <div
                        key={achievement.id}
                        className={`text-center p-3 rounded-lg transition-all ${
                          achievement.unlocked 
                            ? 'bg-yellow-50 hover:bg-yellow-100' 
                            : 'bg-gray-100 opacity-50'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-1 ${
                          achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                        }`} />
                        <p className="text-xs font-medium">{achievement.title}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Study Tip */}
            <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-blue-900">오늘의 학습 팁</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      매일 30분씩 꾸준히 공부하면 한 달 후에는 놀라운 변화를 경험할 수 있어요!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}