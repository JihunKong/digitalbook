'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ChevronLeft,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Clock,
  BookOpen,
  Brain,
  Zap,
  Star,
  CheckCircle,
  Trophy,
  Flame,
  BarChart3,
  PieChart,
  Activity,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

export default function StudentProgressPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [selectedSubject, setSelectedSubject] = useState('all')

  // 학습 시간 데이터
  const studyTimeData = [
    { date: '월', hours: 2.5 },
    { date: '화', hours: 3 },
    { date: '수', hours: 2 },
    { date: '목', hours: 4 },
    { date: '금', hours: 3.5 },
    { date: '토', hours: 5 },
    { date: '일', hours: 4.5 }
  ]

  // 과목별 진도 데이터
  const subjectProgressData = [
    { subject: '국어', progress: 75, color: '#3B82F6' },
    { subject: '문학', progress: 60, color: '#10B981' },
    { subject: '화법과작문', progress: 85, color: '#F59E0B' },
    { subject: '언어와매체', progress: 45, color: '#8B5CF6' }
  ]

  // 성취도 레이더 차트 데이터
  const skillsData = [
    { skill: '읽기', score: 85 },
    { skill: '쓰기', score: 70 },
    { skill: '문법', score: 90 },
    { skill: '문학감상', score: 75 },
    { skill: '화법', score: 60 },
    { skill: '작문', score: 80 }
  ]

  // 주간 활동 데이터
  const weeklyActivityData = [
    { activity: '학습', value: 24.5, color: '#3B82F6' },
    { activity: '과제', value: 8, color: '#10B981' },
    { activity: 'AI튜터', value: 3.5, color: '#F59E0B' },
    { activity: '복습', value: 6, color: '#8B5CF6' }
  ]

  // 성과 통계
  const stats = {
    totalStudyHours: 156,
    weeklyAverage: 24.5,
    completedAssignments: 42,
    averageScore: 85,
    currentStreak: 7,
    longestStreak: 14,
    totalPoints: 2450,
    ranking: 3
  }

  // 최근 성취
  const achievements = [
    { id: 1, title: '7일 연속 학습', icon: '🔥', date: '2024-03-20', points: 50 },
    { id: 2, title: '첫 만점 획득', icon: '💯', date: '2024-03-18', points: 100 },
    { id: 3, title: '주간 목표 달성', icon: '🎯', date: '2024-03-17', points: 30 },
    { id: 4, title: '문학 마스터', icon: '📚', date: '2024-03-15', points: 200 }
  ]

  // 학습 목표
  const learningGoals = [
    { id: 1, title: '주 20시간 학습', current: 24.5, target: 20, unit: '시간' },
    { id: 2, title: '과제 완료율 90%', current: 85, target: 90, unit: '%' },
    { id: 3, title: '평균 점수 85점', current: 85, target: 85, unit: '점' }
  ]

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
              <h1 className="text-xl font-semibold">학습 기록</h1>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              리포트 다운로드
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 학습 시간</p>
                    <p className="text-2xl font-bold">{stats.totalStudyHours}시간</p>
                    <p className="text-xs text-gray-500 mt-1">주 평균 {stats.weeklyAverage}시간</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 점수</p>
                    <p className="text-2xl font-bold">{stats.averageScore}점</p>
                    <p className="text-xs text-green-600 mt-1">+5% 향상</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">연속 학습</p>
                    <p className="text-2xl font-bold">{stats.currentStreak}일</p>
                    <p className="text-xs text-gray-500 mt-1">최고 {stats.longestStreak}일</p>
                  </div>
                  <Flame className="w-8 h-8 text-orange-600" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 순위</p>
                    <p className="text-2xl font-bold">{stats.ranking}위</p>
                    <p className="text-xs text-purple-600 mt-1">{stats.totalPoints} 포인트</p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="subjects">과목별</TabsTrigger>
            <TabsTrigger value="achievements">성취</TabsTrigger>
            <TabsTrigger value="goals">목표</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Study Time Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>학습 시간 추이</CardTitle>
                      <CardDescription>일별 학습 시간 기록</CardDescription>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">주간</SelectItem>
                        <SelectItem value="month">월간</SelectItem>
                        <SelectItem value="year">연간</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studyTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>주간 활동 분석</CardTitle>
                  <CardDescription>활동별 시간 분포</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={weeklyActivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {weeklyActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Skills Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>학습 역량 분석</CardTitle>
                  <CardDescription>영역별 성취도</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={skillsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="점수" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>최근 학습 활동</CardTitle>
                  <CardDescription>지난 7일간의 주요 활동</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: '2024-03-20', activity: '현대문학 3장 완료', type: 'study', points: 20 },
                      { date: '2024-03-19', activity: '글쓰기 과제 제출', type: 'assignment', points: 30 },
                      { date: '2024-03-18', activity: '문법 퀴즈 만점', type: 'quiz', points: 50 },
                      { date: '2024-03-17', activity: 'AI 튜터 질문 5개', type: 'ai', points: 10 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === 'study' ? 'bg-blue-600' :
                          item.type === 'assignment' ? 'bg-green-600' :
                          item.type === 'quiz' ? 'bg-yellow-600' :
                          'bg-purple-600'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium">{item.activity}</p>
                          <p className="text-sm text-gray-600">{item.date}</p>
                        </div>
                        <Badge variant="secondary">+{item.points}p</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {/* Subject Progress */}
            <Card>
              <CardHeader>
                <CardTitle>과목별 진도율</CardTitle>
                <CardDescription>각 과목의 학습 진행 상황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {subjectProgressData.map((subject, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{subject.subject}</span>
                        <span className="text-sm text-gray-600">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>과목별 성적 추이</CardTitle>
                <CardDescription>최근 3개월 성적 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { month: '1월', 국어: 80, 문학: 75, 화법과작문: 85, 언어와매체: 70 },
                      { month: '2월', 국어: 82, 문학: 78, 화법과작문: 88, 언어와매체: 73 },
                      { month: '3월', 국어: 85, 문학: 80, 화법과작문: 90, 언어와매체: 75 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="국어" fill="#3B82F6" />
                    <Bar dataKey="문학" fill="#10B981" />
                    <Bar dataKey="화법과작문" fill="#F59E0B" />
                    <Bar dataKey="언어와매체" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Achievement List */}
              <Card>
                <CardHeader>
                  <CardTitle>획득한 성취</CardTitle>
                  <CardDescription>노력의 결과를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{achievement.icon}</span>
                          <div>
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.date}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">+{achievement.points}p</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>성취 통계</CardTitle>
                  <CardDescription>전체 성취 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-semibold">전체 성취</p>
                          <p className="text-sm text-gray-600">획득한 모든 성취</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">24</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold">희귀 성취</p>
                          <p className="text-sm text-gray-600">특별한 성취</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-600">5</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-semibold">연속 성취</p>
                          <p className="text-sm text-gray-600">연속으로 달성</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle>학습 목표</CardTitle>
                <CardDescription>설정한 목표와 달성 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {learningGoals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{goal.title}</h4>
                        <span className={`text-sm font-medium ${
                          goal.current >= goal.target ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {goal.current}{goal.unit} / {goal.target}{goal.unit}
                        </span>
                      </div>
                      <Progress 
                        value={(goal.current / goal.target) * 100} 
                        className="h-3"
                      />
                      {goal.current >= goal.target && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          목표 달성!
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI 추천 학습 방향</CardTitle>
                <CardDescription>학습 데이터 분석을 통한 맞춤 추천</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">문법 강화 필요</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          최근 문법 관련 문제에서 정답률이 70% 미만입니다. 문법 기초 복습을 추천합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900">문학 감상 능력 우수</h4>
                        <p className="text-sm text-green-700 mt-1">
                          문학 작품 해석 능력이 뛰어납니다. 심화 학습을 통해 더 발전시켜보세요.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-900">주말 학습 시간 확대</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          평일 대비 주말 학습 시간이 부족합니다. 주말에도 꾸준한 학습을 권장합니다.
                        </p>
                      </div>
                    </div>
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