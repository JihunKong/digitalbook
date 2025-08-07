'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Play, 
  CheckCircle,
  BarChart,
  MessageSquare,
  ChevronRight,
  Eye
} from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const { exitDemoMode, isDemoMode } = useDemoMode()
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null)

  const handleTeacherDemo = () => {
    // Enable demo mode and redirect to teacher demo dashboard
    localStorage.setItem('demoMode', 'true')
    router.push('/demo/teacher/dashboard')
  }

  const handleStudentDemo = () => {
    // Enable demo mode and redirect to student demo dashboard
    localStorage.setItem('demoMode', 'true')
    router.push('/demo/student/dashboard')
  }



  const keyFeatures = [
    {
      title: 'AI 기반 콘텐츠 생성',
      description: '2022 개정 교육과정에 맞춘 자동 콘텐츠 생성',
      icon: Sparkles,
      color: 'text-purple-600'
    },
    {
      title: '실시간 학습 분석',
      description: '학생별 맞춤 학습 진도 및 성취도 추적',
      icon: BarChart,
      color: 'text-blue-600'
    },
    {
      title: '대화형 AI 튜터',
      description: '24시간 학습 도우미로 즉각적인 피드백 제공',
      icon: MessageSquare,
      color: 'text-green-600'
    },
    {
      title: '멀티미디어 통합',
      description: '동영상, 이미지, 인터랙티브 콘텐츠 쉽게 추가',
      icon: Play,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white relative flex flex-col">
      {/* Header with Back Button */}
      <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">내책 데모</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="hover:bg-gray-50"
          >
            랜딩페이지로 돌아가기
          </Button>
        </div>
      </header>

      {/* Digital Textbook Preview Section - Top Priority */}
      <section className="px-4 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Hero Message */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="w-4 h-4 mr-1" />
              AI 기반 디지털 교과서 플랫폼
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              디지털 교과서 미리보기
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              회원가입 없이도 우수한 교과서들을 바로 체험해보세요
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-center text-xl">공개 교과서 둘러보기</CardTitle>
                <CardDescription className="text-center">
                  선생님들이 공유한 우수 교과서를 찾아보고 미리보기
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• 과목별, 학년별 다양한 교과서</li>
                  <li>• 실제 콘텐츠 미리보기 가능</li>
                  <li>• 검색 및 필터 기능</li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/explore')}
                  variant="outline"
                >
                  공개 교과서 탐색하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-green-200 transition-colors">
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-center text-xl">AI 인터랙티브 교과서</CardTitle>
                <CardDescription className="text-center">
                  AI 튜터와 함께하는 차세대 디지털 교과서
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• AI 튜터 실시간 코칭</li>
                  <li>• 학습활동 & 모둠활동 탭</li>
                  <li>• 음성 읽기 및 대화형 학습</li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => router.push('/textbook/demo')}
                >
                  AI 교과서 체험하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Selection Cards */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">데모 체험 선택</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Teacher Demo Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleTeacherDemo}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>교사 대시보드</CardTitle>
                <CardDescription>
                  AI와 함께 교과서를 만들고 학생을 관리하는 경험
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    AI 교과서 생성 체험
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    학생 진도 관리 대시보드
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    과제 생성 및 평가 도구
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  교사로 시작하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Student Demo Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStudentDemo}>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>학생 대시보드</CardTitle>
                <CardDescription>
                  AI 튜터와 함께하는 인터랙티브 학습 경험
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    대화형 AI 튜터
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    게임화된 학습 진도
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    실시간 피드백
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  학생으로 시작하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>


      {/* Key Features */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">주요 기능</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Bottom */}
      <section className="mt-auto py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-lg text-gray-700 font-medium mb-2">
              더 많은 기능을 원하시나요?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              무료로 회원가입하고 모든 기능을 이용해보세요
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => router.push('/auth/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                무료 회원가입
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push('/auth/login')}
              >
                로그인
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}