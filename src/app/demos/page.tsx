'use client'

import Link from 'next/link'
import { 
  BookOpen, GraduationCap, Users, Sparkles, FileText, 
  ArrowRight, Play, ChevronLeft, Brain, MessageSquare,
  Target, BarChart
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const demos = [
  {
    id: 'textbook',
    title: '디지털 교과서',
    description: '실제 고등학교 국어 교과서를 활용한 AI 학습 도우미',
    icon: BookOpen,
    color: 'bg-blue-500',
    href: '/textbook/demo',
    features: ['PDF 교과서 뷰어', 'AI 학습 도우미', '실시간 질의응답', '페이지별 학습'],
    badge: 'NEW',
    badgeColor: 'bg-red-500'
  },
  {
    id: 'teacher',
    title: '교사 대시보드',
    description: 'AI로 교과서를 제작하고 학생을 관리하는 교사 환경',
    icon: GraduationCap,
    color: 'bg-purple-500',
    href: '/auth/login?demo=teacher',
    features: ['AI 교과서 생성', '학생 관리', '학습 분석', '과제 관리'],
    badge: '인기',
    badgeColor: 'bg-yellow-500'
  },
  {
    id: 'student',
    title: '학생 학습 환경',
    description: '게임화된 학습 경험과 AI 튜터가 함께하는 학생 환경',
    icon: Users,
    color: 'bg-green-500',
    href: '/auth/login?demo=student',
    features: ['대화형 학습', '진도 추적', '성취 배지', 'AI 튜터'],
    badge: '추천',
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'ai-tools',
    title: 'AI 도구 모음',
    description: '교육 콘텐츠 생성을 위한 다양한 AI 도구들',
    icon: Sparkles,
    color: 'bg-orange-500',
    href: '/teacher/ai-tools',
    features: ['콘텐츠 생성', '이미지 생성', '퀴즈 생성', '학습 자료 추천'],
  },
  {
    id: 'analytics',
    title: '학습 분석',
    description: '학생들의 학습 패턴과 성과를 분석하는 대시보드',
    icon: BarChart,
    color: 'bg-indigo-500',
    href: '/teacher/analytics',
    features: ['실시간 분석', '개인별 리포트', '학습 패턴', '성취도 예측'],
  },
  {
    id: 'chat',
    title: 'AI 채팅',
    description: '학습 내용에 대해 자유롭게 대화하는 AI 튜터',
    icon: MessageSquare,
    color: 'bg-pink-500',
    href: '/student/ai-tutor',
    features: ['24시간 지원', '맞춤형 답변', '학습 가이드', '심화 학습'],
  }
]

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  홈으로
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold">내책 데모 체험</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            다양한 기능을 체험해보세요
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI 기반 디지털 교육 플랫폼의 핵심 기능들을 직접 경험해보세요.
            교사와 학생 모두를 위한 혁신적인 학습 도구를 제공합니다.
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => {
            const Icon = demo.icon
            return (
              <Link key={demo.id} href={demo.href}>
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer hover:scale-105 relative overflow-hidden">
                  {demo.badge && (
                    <Badge 
                      className={`absolute top-4 right-4 ${demo.badgeColor} text-white border-0`}
                    >
                      {demo.badge}
                    </Badge>
                  )}
                  <CardHeader>
                    <div className={`w-12 h-12 ${demo.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{demo.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {demo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {demo.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="w-3 h-3 text-gray-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      체험하기
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-semibold mb-4">
            데모 계정 정보
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">교사 계정</h4>
              <p className="text-sm text-gray-600">
                이메일: purusil@naver.com<br />
                비밀번호: rhdwlgns85
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">학생 계정</h4>
              <p className="text-sm text-gray-600">
                이메일: student1@test.com<br />
                비밀번호: student123!
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            데모 계정으로 로그인하여 모든 기능을 자유롭게 체험해보세요
          </p>
        </div>
      </section>
    </div>
  )
}