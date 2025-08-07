'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Award,
  FileText,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react'
import { CompletedActivity, calculatePortfolioStats } from './ActivityTemplates'

interface PortfolioProps {
  activities: CompletedActivity[]
  studentName: string
}

export function Portfolio({ activities, studentName }: PortfolioProps) {
  const [selectedActivity, setSelectedActivity] = useState<CompletedActivity | null>(null)
  const stats = calculatePortfolioStats(activities)
  
  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      critical_thinking: '🔍',
      concept_map: '🗺️',
      summary: '📝',
      reflection: '💭',
      quiz: '✅'
    }
    return icons[type] || '📚'
  }
  
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      critical_thinking: '비판적 사고',
      concept_map: '개념 지도',
      summary: '요약',
      reflection: '성찰',
      quiz: '퀴즈'
    }
    return labels[type] || type
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return <Badge className="bg-green-100 text-green-700">평가 완료</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700">제출됨</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">작성 중</Badge>
      default:
        return null
    }
  }
  
  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Portfolio Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {studentName}님의 학습 포트폴리오
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              PDF 다운로드
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
      
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">총 활동</p>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">완료율</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">평균 점수</p>
                <p className="text-2xl font-bold">{stats.averageScore}점</p>
              </div>
              <Award className="w-8 h-8 text-yellow-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">학습 시간</p>
                <p className="text-2xl font-bold">{stats.totalTimeSpent}분</p>
              </div>
              <Clock className="w-8 h-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5" />
            활동 유형별 진행 상황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.activityTypeCount).map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{getActivityIcon(type)}</span>
                    {getActivityTypeLabel(type)}
                  </span>
                  <span className="text-gray-600">{count}개</span>
                </div>
                <Progress 
                  value={(count / stats.totalActivities) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            최근 학습 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getActivityIcon(activity.activityType)}</span>
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(activity.completedAt).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.timeSpent}분
                      </span>
                      {activity.evaluation?.score && (
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {activity.evaluation.score}점
                        </span>
                      )}
                    </div>
                    {activity.evaluation?.feedback && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {activity.evaluation.feedback}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Learning Achievements */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            획득한 배지
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                🌟
              </div>
              <p className="text-xs mt-1">첫 활동</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                🎯
              </div>
              <p className="text-xs mt-1">완벽 점수</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">
                📚
              </div>
              <p className="text-xs mt-1">5개 완료</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <p className="text-xs mt-1">10개 완료</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                💎
              </div>
              <p className="text-xs mt-1">마스터</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                👑
              </div>
              <p className="text-xs mt-1">전문가</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">학습 여정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {activities.slice(0, 3).map((activity, idx) => (
              <div key={activity.id} className="relative flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
                  <span className="text-xs font-bold">{idx + 1}</span>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(activity.completedAt).toLocaleDateString('ko-KR')} • 
                    페이지 {activity.pageNumber}
                  </p>
                  {activity.evaluation?.strengths && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activity.evaluation.strengths.map((strength, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" size="sm">
            전체 학습 기록 보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}