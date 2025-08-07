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
  Trophy,
  Star,
  Award,
  Medal,
  Crown,
  Flame,
  Target,
  BookOpen,
  Brain,
  Timer,
  Users,
  Heart,
  Zap,
  Gift,
  Sparkles,
  Calendar,
  TrendingUp,
  CheckCircle,
  Lock,
  Share,
  Download,
  Eye,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  category: 'study' | 'streak' | 'score' | 'special' | 'social' | 'time'
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  points: number
  isEarned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
  requirements: string[]
}

interface Badge {
  id: string
  name: string
  description: string
  icon: any
  color: string
  earnedDate: string
  category: string
}

interface Milestone {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  category: string
  reward: string
  isCompleted: boolean
  completedDate?: string
}

export default function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [activeTab, setActiveTab] = useState('achievements')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAchievementData = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockAchievements: Achievement[] = [
        {
          id: 'a1',
          title: '첫 걸음',
          description: '첫 번째 수업을 완료했습니다!',
          icon: Trophy,
          category: 'study',
          difficulty: 'bronze',
          points: 50,
          isEarned: true,
          earnedDate: '2024-01-10',
          requirements: ['첫 번째 수업 완료']
        },
        {
          id: 'a2',
          title: '일주일 연속',
          description: '7일 연속으로 학습을 완료했습니다!',
          icon: Flame,
          category: 'streak',
          difficulty: 'silver',
          points: 100,
          isEarned: true,
          earnedDate: '2024-01-20',
          requirements: ['7일 연속 학습 완료']
        },
        {
          id: 'a3',
          title: '완벽주의자',
          description: '퀴즈에서 100점을 10번 획득했습니다!',
          icon: Star,
          category: 'score',
          difficulty: 'gold',
          points: 200,
          isEarned: false,
          progress: 8,
          maxProgress: 10,
          requirements: ['퀴즈 100점 10회 달성']
        },
        {
          id: 'a4',
          title: 'AI 마스터',
          description: 'AI 튜터와 100번 대화했습니다!',
          icon: Brain,
          category: 'special',
          difficulty: 'platinum',
          points: 300,
          isEarned: false,
          progress: 67,
          maxProgress: 100,
          requirements: ['AI 튜터 대화 100회']
        },
        {
          id: 'a5',
          title: '시간 관리왕',
          description: '총 100시간 학습을 완료했습니다!',
          icon: Timer,
          category: 'time',
          difficulty: 'gold',
          points: 250,
          isEarned: false,
          progress: 78,
          maxProgress: 100,
          requirements: ['총 100시간 학습 완료']
        },
        {
          id: 'a6',
          title: '도전자',
          description: '어려운 난이도 문제 50개를 해결했습니다!',
          icon: Target,
          category: 'study',
          difficulty: 'silver',
          points: 150,
          isEarned: true,
          earnedDate: '2024-01-18',
          requirements: ['어려운 문제 50개 해결']
        },
        {
          id: 'a7',
          title: '전설의 학습자',
          description: '모든 교과목에서 평균 95점 이상 달성!',
          icon: Crown,
          category: 'score',
          difficulty: 'diamond',
          points: 500,
          isEarned: false,
          progress: 2,
          maxProgress: 5,
          requirements: ['모든 과목 평균 95점 이상']
        },
        {
          id: 'a8',
          title: '친구 도우미',
          description: '다른 학생의 질문에 10번 답변했습니다!',
          icon: Heart,
          category: 'social',
          difficulty: 'bronze',
          points: 80,
          isEarned: false,
          progress: 4,
          maxProgress: 10,
          requirements: ['다른 학생 도움 10회']
        }
      ]

      const mockBadges: Badge[] = [
        {
          id: 'b1',
          name: '국어왕',
          description: '국어 과목에서 우수한 성취를 보였습니다',
          icon: BookOpen,
          color: 'bg-blue-500',
          earnedDate: '2024-01-15',
          category: '과목별'
        },
        {
          id: 'b2',
          name: '연속학습자',
          description: '꾸준한 학습 습관을 보여주었습니다',
          icon: Flame,
          color: 'bg-orange-500',
          earnedDate: '2024-01-20',
          category: '학습습관'
        },
        {
          id: 'b3',
          name: '창의적 사고자',
          description: '창의적인 답변과 아이디어를 제시했습니다',
          icon: Sparkles,
          color: 'bg-purple-500',
          earnedDate: '2024-01-12',
          category: '특별'
        },
        {
          id: 'b4',
          name: '질문왕',
          description: 'AI 튜터에게 좋은 질문을 많이 했습니다',
          icon: Brain,
          color: 'bg-green-500',
          earnedDate: '2024-01-08',
          category: 'AI 활용'
        }
      ]

      const mockMilestones: Milestone[] = [
        {
          id: 'm1',
          title: '학습 시간 마스터',
          description: '총 학습 시간 목표를 달성하세요',
          targetValue: 200,
          currentValue: 156,
          unit: '시간',
          category: '시간 관리',
          reward: '특별 배지 + 200 포인트',
          isCompleted: false
        },
        {
          id: 'm2',
          title: '퀴즈 마스터',
          description: '퀴즈 문제를 많이 풀어보세요',
          targetValue: 500,
          currentValue: 500,
          unit: '문제',
          category: '문제 해결',
          reward: '퀴즈 마스터 타이틀',
          isCompleted: true,
          completedDate: '2024-01-15'
        },
        {
          id: 'm3',
          title: '교재 완주자',
          description: '교재를 끝까지 완주해보세요',
          targetValue: 5,
          currentValue: 2,
          unit: '권',
          category: '학습 완주',
          reward: '독서왕 배지',
          isCompleted: false
        },
        {
          id: 'm4',
          title: '연속 학습 챔피언',
          description: '연속 학습 기록을 세워보세요',
          targetValue: 30,
          currentValue: 7,
          unit: '일',
          category: '학습 습관',
          reward: '습관 형성 마스터 타이틀',
          isCompleted: false
        }
      ]
      
      setAchievements(mockAchievements)
      setBadges(mockBadges)
      setMilestones(mockMilestones)
      setIsLoading(false)
    }

    loadAchievementData()
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'diamond': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return '브론즈'
      case 'silver': return '실버'
      case 'gold': return '골드'
      case 'platinum': return '플래티넘'
      case 'diamond': return '다이아몬드'
      default: return difficulty
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-800'
      case 'streak': return 'bg-orange-100 text-orange-800'
      case 'score': return 'bg-green-100 text-green-800'
      case 'special': return 'bg-purple-100 text-purple-800'
      case 'social': return 'bg-pink-100 text-pink-800'
      case 'time': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'study': return '학습'
      case 'streak': return '연속성'
      case 'score': return '성취도'
      case 'special': return '특별'
      case 'social': return '소셜'
      case 'time': return '시간'
      default: return category
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || achievement.difficulty === selectedDifficulty
    return matchesCategory && matchesDifficulty
  })

  const earnedAchievements = achievements.filter(a => a.isEarned)
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0)
  const completedMilestones = milestones.filter(m => m.isCompleted).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
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
                <Trophy className="w-5 h-5 text-yellow-600" />
                나의 성취
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share className="w-4 h-4" />
                공유하기
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                인증서
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">획득한 업적</p>
                  <p className="text-2xl font-bold">{earnedAchievements.length}</p>
                  <p className="text-xs opacity-80">총 {achievements.length}개</p>
                </div>
                <Trophy className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">총 포인트</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-xs opacity-80">업적 포인트</p>
                </div>
                <Star className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">보유 배지</p>
                  <p className="text-2xl font-bold">{badges.length}</p>
                  <p className="text-xs opacity-80">특별 배지</p>
                </div>
                <Medal className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">달성 목표</p>
                  <p className="text-2xl font-bold">{completedMilestones}</p>
                  <p className="text-xs opacity-80">완료된 목표</p>
                </div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="achievements">업적 ({achievements.length})</TabsTrigger>
            <TabsTrigger value="badges">배지 ({badges.length})</TabsTrigger>
            <TabsTrigger value="milestones">목표 ({milestones.length})</TabsTrigger>
            <TabsTrigger value="progress">진행상황</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">모든 카테고리</option>
                      <option value="study">학습</option>
                      <option value="streak">연속성</option>
                      <option value="score">성취도</option>
                      <option value="special">특별</option>
                      <option value="social">소셜</option>
                      <option value="time">시간</option>
                    </select>
                    
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                    >
                      <option value="all">모든 난이도</option>
                      <option value="bronze">브론즈</option>
                      <option value="silver">실버</option>
                      <option value="gold">골드</option>
                      <option value="platinum">플래티넘</option>
                      <option value="diamond">다이아몬드</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {filteredAchievements.length}개 업적 표시 중
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => {
                const Icon = achievement.icon
                
                return (
                  <Card 
                    key={achievement.id} 
                    className={`hover:shadow-lg transition-all ${
                      achievement.isEarned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'opacity-60'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          achievement.isEarned 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {achievement.isEarned ? (
                            <Icon className="w-8 h-8" />
                          ) : (
                            <Lock className="w-8 h-8" />
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Badge className={getDifficultyColor(achievement.difficulty)}>
                            {getDifficultyText(achievement.difficulty)}
                          </Badge>
                          <Badge className={getCategoryColor(achievement.category)}>
                            {getCategoryText(achievement.category)}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {!achievement.isEarned && achievement.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span>진행률</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress value={(achievement.progress! / achievement.maxProgress!) * 100} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-yellow-600">
                          <Star className="w-4 h-4 fill-yellow-400" />
                          {achievement.points} 포인트
                        </div>
                        
                        {achievement.isEarned && achievement.earnedDate && (
                          <div className="text-xs text-gray-500">
                            {new Date(achievement.earnedDate).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </div>
                      
                      {achievement.isEarned && (
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <p className="text-green-800 font-semibold text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            달성 완료!
                          </p>
                        </div>
                      )}
                      
                      {!achievement.isEarned && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-sm mb-2">달성 조건:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {achievement.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map((badge) => {
                const Icon = badge.icon
                
                return (
                  <Card key={badge.id} className="hover:shadow-lg transition-shadow text-center">
                    <CardContent className="p-6">
                      <div className={`w-20 h-20 ${badge.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                        <Icon className="w-10 h-10" />
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{badge.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                      
                      <Badge variant="outline" className="mb-3">
                        {badge.category}
                      </Badge>
                      
                      <p className="text-xs text-gray-500">
                        획득일: {new Date(badge.earnedDate).toLocaleDateString('ko-KR')}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6 mt-6">
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className={`${milestone.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{milestone.title}</h3>
                          {milestone.isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{milestone.description}</p>
                        <Badge variant="outline">{milestone.category}</Badge>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {milestone.currentValue}/{milestone.targetValue}
                        </p>
                        <p className="text-sm text-gray-600">{milestone.unit}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>진행률</span>
                        <span>{Math.round((milestone.currentValue / milestone.targetValue) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(milestone.currentValue / milestone.targetValue) * 100} 
                        className={`h-3 ${milestone.isCompleted ? 'bg-green-200' : ''}`}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-purple-600 font-semibold">
                          보상: {milestone.reward}
                        </span>
                      </div>
                      
                      {milestone.isCompleted && milestone.completedDate && (
                        <p className="text-xs text-gray-500">
                          완료일: {new Date(milestone.completedDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                    
                    {milestone.isCompleted && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-semibold text-sm">🎉 목표 달성 완료!</p>
                        <p className="text-green-600 text-xs">축하합니다! 보상을 받으셨습니다.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    주간 성취 현황
                  </CardTitle>
                  <CardDescription>
                    이번 주 업적 달성 활동을 확인해보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">새로운 업적</span>
                      <Badge className="bg-blue-100 text-blue-800">2개</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">획득 포인트</span>
                      <Badge className="bg-yellow-100 text-yellow-800">+150점</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">진행 중인 목표</span>
                      <Badge className="bg-green-100 text-green-800">3개</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">완료율</span>
                      <Badge className="bg-purple-100 text-purple-800">65%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    카테고리별 현황
                  </CardTitle>
                  <CardDescription>
                    분야별 업적 달성 현황을 살펴보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: '학습', earned: 3, total: 5, color: 'bg-blue-500' },
                      { category: '연속성', earned: 2, total: 3, color: 'bg-orange-500' },
                      { category: '성취도', earned: 1, total: 4, color: 'bg-green-500' },
                      { category: '특별', earned: 1, total: 2, color: 'bg-purple-500' },
                      { category: '소셜', earned: 0, total: 1, color: 'bg-pink-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.category}</span>
                          <span>{item.earned}/{item.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${(item.earned / item.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Achievements */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    곧 달성할 수 있는 업적
                  </CardTitle>
                  <CardDescription>
                    조금만 더 노력하면 얻을 수 있는 업적들입니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements
                      .filter(a => !a.isEarned && a.progress !== undefined && a.progress! >= 70)
                      .map((achievement) => {
                        const Icon = achievement.icon
                        const progressPercent = (achievement.progress! / achievement.maxProgress!) * 100
                        
                        return (
                          <div key={achievement.id} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                                <Icon className="w-6 h-6 text-yellow-700" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                <p className="text-xs text-gray-600">{achievement.description}</p>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>진행률</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Badge className={getDifficultyColor(achievement.difficulty)}>
                                {getDifficultyText(achievement.difficulty)}
                              </Badge>
                              <span className="text-xs text-yellow-600 font-semibold">
                                {achievement.points} 포인트
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}