'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, Eye, Sparkles, Clock, ChevronRight, 
  ArrowLeft, Play, FileText, Users, MessageSquare,
  Star, Target, Trophy, Calendar
} from 'lucide-react'

function DemoGuestContent() {
  const searchParams = useSearchParams()
  const { navigateInDemo, exitDemoMode } = useDemoMode()
  const [demoCode] = useState(searchParams?.get('code') || '')
  const [selectedTextbook, setSelectedTextbook] = useState<string | null>(null)

  const sampleTextbooks = [
    {
      id: '1',
      title: '3학년 1학기 국어',
      description: '시와 이야기의 세계',
      grade: '초등 3학년',
      lessons: 12,
      duration: '45분',
      thumbnail: '/textbook-thumb-1.jpg',
      preview: true
    },
    {
      id: '2', 
      title: '4학년 2학기 국어',
      description: '생각을 나누는 글쓰기',
      grade: '초등 4학년',
      lessons: 15,
      duration: '50분',
      thumbnail: '/textbook-thumb-2.jpg',
      preview: true
    },
    {
      id: '3',
      title: '5학년 1학기 국어', 
      description: '문학과 언어의 아름다움',
      grade: '초등 5학년',
      lessons: 18,
      duration: '55분',
      thumbnail: '/textbook-thumb-3.jpg',
      preview: true
    }
  ]

  const demoFeatures = [
    {
      title: 'AI 기반 학습',
      description: '개인 맞춤형 AI 튜터가 학습을 도와드려요',
      icon: Sparkles,
      color: 'text-purple-600'
    },
    {
      title: '실시간 피드백',
      description: '학습 과정에서 즉각적인 피드백 제공',
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      title: '진도 추적',
      description: '학습 진도와 성취도를 한눈에 확인',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: '게임화 학습',
      description: '재미있는 게임 요소로 동기 부여',
      icon: Trophy,
      color: 'text-yellow-600'
    }
  ]

  const handleTextbookPreview = (textbookId: string) => {
    setSelectedTextbook(textbookId)
    // 실제로는 textbook viewer로 이동
    navigateInDemo(`/textbook/${textbookId}?preview=true`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
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
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Eye className="w-3 h-3 mr-1" />
                게스트 데모 모드
              </Badge>
              {demoCode && (
                <Badge variant="outline">
                  코드: {demoCode}
                </Badge>
              )}
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            디지털 교과서 체험 🚀
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI 기반 맞춤형 학습 플랫폼을 미리 경험해보세요
          </p>
        </div>

        {/* Demo Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">주요 기능</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Sample Textbooks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">샘플 교과서 둘러보기</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleTextbooks.map((textbook) => (
              <Card key={textbook.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{textbook.title}</CardTitle>
                    <Badge variant="outline">{textbook.grade}</Badge>
                  </div>
                  <CardDescription>{textbook.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {textbook.lessons}개 단원
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {textbook.duration}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleTextbookPreview(textbook.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      미리보기 시작
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      목차 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Demo Section */}
        <Card className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-800">
              🎯 인터랙티브 데모 체험
            </CardTitle>
            <CardDescription className="text-blue-600 text-lg">
              실제 학습 환경을 시뮬레이션으로 체험해보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle>AI 튜터 체험</CardTitle>
                  <CardDescription>
                    AI와 대화하며 궁금한 것들을 물어보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigateInDemo('/ai-tutor?demo=true')}
                  >
                    AI 튜터와 대화하기
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-green-300 hover:border-green-500 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle>퀴즈 체험</CardTitle>
                  <CardDescription>
                    AI가 생성한 맞춤형 퀴즈를 풀어보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigateInDemo('/quiz?demo=true')}
                  >
                    퀴즈 풀어보기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Demo Limitations Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Clock className="w-5 h-5 mr-2" />
              게스트 데모 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🔍 체험 가능한 기능</h4>
                <ul className="text-sm space-y-1">
                  <li>• 샘플 교과서 미리보기</li>
                  <li>• AI 튜터 간단 대화</li>
                  <li>• 퀴즈 샘플 풀어보기</li>
                  <li>• 학습 인터페이스 둘러보기</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚠️ 제한사항</h4>
                <ul className="text-sm space-y-1">
                  <li>• 학습 진도는 저장되지 않습니다</li>
                  <li>• 일부 기능은 제한적으로 동작합니다</li>
                  <li>• 데모 코드는 임시 접근용입니다</li>
                  <li>• 회원가입 후 모든 기능 이용 가능</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-yellow-300">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={() => navigateInDemo('/teacher/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  교사 데모 체험
                </Button>
                <Button 
                  onClick={() => navigateInDemo('/student/dashboard')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  학생 데모 체험
                </Button>
                <Button 
                  variant="outline"
                  onClick={exitDemoMode}
                  className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                >
                  회원가입하고 시작하기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DemoGuestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <DemoGuestContent />
    </Suspense>
  )
}