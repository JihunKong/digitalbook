'use client'

import Link from 'next/link'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Brain, BarChart3, Sparkles, GraduationCap, UserCheck, Eye, LogIn, UserPlus } from 'lucide-react'

export default function HomePage() {
  const { enableDemoMode } = useDemoMode()

  const features = [
    {
      icon: BookOpen,
      title: '교사 주도 교과서 제작',
      description: '교육과정을 분석하고 학생 특성에 맞는 교과서를 직접 설계합니다',
      color: 'text-blue-600',
    },
    {
      icon: Brain,
      title: '선택적 AI 지원',
      description: '필요할 때만 AI가 제안하며, 모든 결정은 교사가 합니다',
      color: 'text-purple-600',
    },
    {
      icon: BarChart3,
      title: '교사의 평가 주권',
      description: '학습 데이터는 참고용, 평가와 해석은 교사의 전문 영역입니다',
      color: 'text-green-600',
    },
    {
      icon: Users,
      title: '교사 학습 공동체',
      description: '동료 교사와 경험을 나누고 함께 성장하는 전문적 학습 공동체',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">내책</span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </Link>
            <Link 
              href="/auth/signup" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              회원가입
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI 기반 맞춤형 교육 플랫폼
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            교사가 만드는 디지털 교과서
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            교사의 전문성과 자율성을 존중하는 교육 플랫폼
            <br />
            AI는 교사를 돕는 도구, 주인공은 언제나 교사와 학생입니다
          </p>
          
          {/* Main CTA Section - Simplified */}
          <div className="space-y-8">
            {/* Primary Action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
              <Button 
                onClick={enableDemoMode} 
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                데모 체험 시작하기
              </Button>
            </div>
            
            {/* Secondary Actions - Clear Separation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link 
                href="/textbook/demo" 
                className="group p-6 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">학습 체험</h3>
                    <p className="text-sm text-gray-600">AI 튜터와 대화형 학습</p>
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/guest" 
                className="group p-6 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">코드 입장</h3>
                    <p className="text-sm text-gray-600">발급받은 코드로 접속</p>
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/explore" 
                className="group p-6 bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">둘러보기</h3>
                    <p className="text-sm text-gray-600">공개 교과서 탐색</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="h-full hover:shadow-lg transition-shadow rounded-lg border bg-white shadow-sm p-6">
              <div className="flex flex-col space-y-1.5">
                <feature.icon className={`w-12 h-12 mb-4 ${feature.color}`} />
                <h3 className="text-xl font-semibold leading-none tracking-tight">{feature.title}</h3>
              </div>
              <div className="pt-0">
                <p className="text-base text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              선생님의 수업 철학을 담은 교과서를 만들어보세요
            </h2>
            <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
              학생들의 특성을 가장 잘 아는 선생님이 직접 만드는 맞춤형 교과서
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 font-semibold transition-colors shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                무료로 시작하기
              </Link>
              <Button 
                onClick={enableDemoMode} 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white border-2 border-white bg-white/10 hover:bg-white hover:text-blue-600 rounded-xl font-semibold transition-all"
              >
                <Sparkles className="w-5 h-5" />
                지금 체험하기
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900">내책</span>
              <span className="text-gray-600">- AI 기반 디지털 교과서 플랫폼</span>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 내책. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}