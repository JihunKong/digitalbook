'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  BarChart3, 
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Clock,
  Download,
  Filter,
  Calendar,
  Award,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'

interface AnalyticsData {
  studentPerformance: {
    totalStudents: number
    activeStudents: number
    averageScore: number
    improvementRate: number
  }
  engagement: {
    dailyActiveUsers: Array<{ date: string; users: number }>
    readingTime: Array<{ week: string; minutes: number }>
    pageViews: Array<{ page: string; views: number }>
  }
  progress: {
    completionRates: Array<{ textbook: string; rate: number }>
    assignmentStats: Array<{ subject: string; completed: number; total: number }>
  }
  timeAnalysis: {
    peakHours: Array<{ hour: number; activity: number }>
    weeklyPatterns: Array<{ day: string; sessions: number }>
  }
}

interface StudentAnalytics {
  id: string
  name: string
  totalScore: number
  completionRate: number
  engagementScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

export default function TeacherAnalyticsPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true)
        
        // Try to load real data from API
        try {
          const [analyticsRes, performanceRes, engagementRes, progressRes] = await Promise.all([
            apiClient.getAnalytics(selectedTimeRange, { classId: undefined }),
            apiClient.getStudentPerformance(),
            apiClient.getEngagementMetrics(selectedTimeRange),
            apiClient.getProgressAnalytics(undefined)
          ])

          const analyticsData = analyticsRes.data as Record<string, any>
          if (analyticsData && typeof analyticsData === 'object' && Object.keys(analyticsData).length > 0) {
            setAnalyticsData(analyticsData as AnalyticsData)
          }

          const studentData = performanceRes?.data
          if (Array.isArray(studentData)) {
            setStudentAnalytics(studentData as StudentAnalytics[])
          }
        } catch (apiError) {
          // If API fails, set empty states instead of mock data
          console.log('Analytics API not available yet, showing empty state')
          setAnalyticsData(null)
          setStudentAnalytics([])
        }

      } catch (error) {
        console.error('Failed to load analytics data:', error)
        setAnalyticsData(null)
        setStudentAnalytics([])
        toast.error('분석 데이터를 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyticsData()
  }, [selectedTimeRange])

  // Helper function to determine risk level
  const determineRiskLevel = (score: number, completion: number, engagement: number): 'low' | 'medium' | 'high' => {
    const average = (score + completion + engagement) / 3
    if (average >= 80) return 'low'
    if (average >= 60) return 'medium'
    return 'high'
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">안정</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">주의</Badge>
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">위험</Badge>
      default:
        return null
    }
  }

  const exportData = async () => {
    try {
      toast.info('분석 데이터를 내보내기 중입니다...')
      
      const response = await apiClient.exportAnalyticsData('excel', {
        timeRange: selectedTimeRange,
        classId: undefined
      })
      
      const responseData = response?.data as { url?: string }
      if (responseData?.url) {
        // Download the file from URL
        const link = document.createElement('a')
        link.href = responseData.url
        link.download = `analytics_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('분석 데이터를 내보냈습니다')
      } else {
        // Fallback: Create CSV from current data
        const csvContent = createCSVFromData(analyticsData, studentAnalytics)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        URL.revokeObjectURL(url)
        
        toast.success('분석 데이터를 CSV로 내보냈습니다')
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('내보내기에 실패했습니다')
    }
  }

  // Helper function to create CSV from data
  const createCSVFromData = (analytics: AnalyticsData | null, students: StudentAnalytics[]) => {
    if (!analytics) return ''
    
    let csv = '전체 학생 분석\n'
    csv += '전체 학생,활동 학생,평균 점수,향상률\n'
    csv += `${analytics.studentPerformance.totalStudents},${analytics.studentPerformance.activeStudents},${analytics.studentPerformance.averageScore},${analytics.studentPerformance.improvementRate}%\n\n`
    
    csv += '학생별 분석\n'
    csv += '이름,총 점수,완료율,참여도,위험 수준\n'
    students.forEach(student => {
      csv += `${student.name},${student.totalScore},${student.completionRate}%,${student.engagementScore},${student.riskLevel}\n`
    })
    
    return csv
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">데이터를 불러올 수 없습니다</h2>
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
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
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">학습 분석</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md px-3 py-2 bg-white"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="90d">최근 90일</option>
              </select>
              <Button onClick={exportData} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                내보내기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 학생</p>
                    <p className="text-2xl font-bold">{analyticsData.studentPerformance.totalStudents}</p>
                    <p className="text-xs text-green-600">
                      활성: {analyticsData.studentPerformance.activeStudents}명
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
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
                    <p className="text-2xl font-bold">{analyticsData.studentPerformance.averageScore}점</p>
                    <p className="text-xs text-green-600">
                      +{analyticsData.studentPerformance.improvementRate}% 향상
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
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
                    <p className="text-sm text-gray-600">완료율</p>
                    <p className="text-2xl font-bold">76%</p>
                    <p className="text-xs text-blue-600">교과서 기준</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
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
                    <p className="text-sm text-gray-600">참여도</p>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-purple-600">주간 평균</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="engagement">참여도</TabsTrigger>
            <TabsTrigger value="progress">진도</TabsTrigger>
            <TabsTrigger value="students">개별 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>일일 활성 사용자</CardTitle>
                  <CardDescription>최근 7일간 학습 활동</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.engagement.dailyActiveUsers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                          formatter={(value) => [`${value}명`, '활성 사용자']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Reading Time */}
              <Card>
                <CardHeader>
                  <CardTitle>주간 학습 시간</CardTitle>
                  <CardDescription>주차별 평균 학습 시간 (분)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.engagement.readingTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}분`, '학습 시간']} />
                        <Area 
                          type="monotone" 
                          dataKey="minutes" 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>과목별 과제 완료 현황</CardTitle>
                  <CardDescription>과목별 과제 제출률</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.progress.assignmentStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#3B82F6" name="완료" />
                        <Bar dataKey="total" fill="#E5E7EB" name="전체" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Activity Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>시간대별 활동</CardTitle>
                  <CardDescription>가장 활발한 학습 시간대</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.timeAnalysis.peakHours}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(value) => `${value}시`}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value}회`, '활동']}
                          labelFormatter={(value) => `${value}시`}
                        />
                        <Bar dataKey="activity" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Page Views Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>교재별 조회수</CardTitle>
                  <CardDescription>가장 많이 읽힌 장</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.engagement.pageViews}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="views"
                        >
                          {analyticsData.engagement.pageViews.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}회`, '조회수']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>요일별 학습 패턴</CardTitle>
                  <CardDescription>요일별 세션 수</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.timeAnalysis.weeklyPatterns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}회`, '세션']} />
                        <Bar dataKey="sessions" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>교재별 완료율</CardTitle>
                <CardDescription>각 교재의 학습 진도</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.progress.completionRates.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{item.textbook}</h3>
                          <p className="text-sm text-gray-600">완료율: {item.rate}%</p>
                        </div>
                      </div>
                      <div className="w-32">
                        <Progress value={item.rate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>개별 학생 분석</CardTitle>
                <CardDescription>각 학생의 성과 및 위험도 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAnalytics.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getRiskLevelBadge(student.riskLevel)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">총점</p>
                          <p className="font-semibold">{student.totalScore}점</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">완료율</p>
                          <p className="font-semibold">{student.completionRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">참여도</p>
                          <p className="font-semibold">{student.engagementScore}%</p>
                        </div>
                        <Button size="sm" variant="outline">
                          상세 보기
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}