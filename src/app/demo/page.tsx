'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Play, 
  CheckCircle,
  Clock,
  BarChart,
  MessageSquare,
  Zap,
  School,
  ChevronRight
} from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const [demoCode, setDemoCode] = useState('')
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'guest' | null>(null)

  const handleTeacherDemo = () => {
    // 교사 데모 계정으로 자동 로그인
    router.push('/auth/login?demo=teacher')
  }

  const handleStudentDemo = () => {
    // 학생 데모 계정으로 자동 로그인
    router.push('/auth/login?demo=student')
  }

  const handleGuestDemo = () => {
    if (demoCode === 'DEMO2024' || demoCode === 'TEST123') {
      router.push('/guest?code=' + demoCode)
    } else {
      alert('올바른 데모 코드를 입력해주세요. (힌트: DEMO2024)')
    }
  }

  const demoScenarios = [
    {
      id: 'first-day',
      title: '새 학기 준비',
      description: '3학년 국어 교과서를 AI로 빠르게 생성하고 맞춤 설정하기',
      duration: '5-7분',
      features: ['AI 교과서 생성', '학습 활동 추가', '학생 명단 관리'],
      icon: School
    },
    {
      id: 'homework',
      title: '숙제 도우미',
      description: 'AI 튜터와 함께 대화형 학습으로 숙제 완성하기',
      duration: '3-5분',
      features: ['AI 튜터 대화', '실시간 피드백', '진도 추적'],
      icon: MessageSquare
    },
    {
      id: 'collaborative',
      title: '협업 교과서',
      description: '다른 선생님들과 우수 교과서 공유 및 커스터마이징',
      duration: '4-6분',
      features: ['교과서 공유', '커뮤니티 협업', '베스트 프랙티스'],
      icon: Users
    }
  ]

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-4 h-4 mr-1" />
            AI 기반 디지털 교과서 플랫폼
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            한국형 디지털 교과서의 미래를 경험하세요
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            교사의 자율성과 AI의 효율성이 만나 최고의 교육 경험을 만듭니다
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" onClick={() => setSelectedRole('teacher')}>
              <GraduationCap className="mr-2" />
              교사 데모 시작
            </Button>
            <Button size="lg" variant="outline" onClick={() => setSelectedRole('student')}>
              <BookOpen className="mr-2" />
              학생 데모 시작
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            서울시 50개 학교에서 사용 중 · 학생 만족도 95%
          </p>
        </div>
      </section>

      {/* Demo Selection Cards */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">데모 체험 선택</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Teacher Demo Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleTeacherDemo}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>교사 데모</CardTitle>
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
                <CardTitle>학생 데모</CardTitle>
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

            {/* Guest Demo Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>게스트 체험</CardTitle>
                <CardDescription>
                  데모 코드로 빠르게 플랫폼 둘러보기
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  아래 데모 코드를 입력하여 바로 체험해보세요
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="데모 코드 입력 (예: DEMO2024)"
                    value={demoCode}
                    onChange={(e) => setDemoCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuestDemo()}
                  />
                  <Button className="w-full" onClick={handleGuestDemo}>
                    게스트로 시작하기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  힌트: DEMO2024 또는 TEST123
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">시나리오별 데모 체험</h2>
          <p className="text-center text-gray-600 mb-8">
            실제 교육 현장의 상황을 바탕으로 한 체험형 데모
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {demoScenarios.map((scenario) => {
              const Icon = scenario.icon
              return (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {scenario.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scenario.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      시나리오 체험하기
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
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

      {/* CTA Section */}
      <section className="px-4 py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 디지털 교육의 미래를 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            30일 무료 체험 · 신용카드 불필요 · 언제든 취소 가능
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary">
              무료로 시작하기
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
              학교 단위 도입 문의
            </Button>
          </div>
        </div>
      </section>

      {/* Alternative: Direct to demo.html */}
      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/demo.html'}
          className="shadow-lg"
        >
          기존 데모 보기
        </Button>
      </div>
    </div>
  )
}