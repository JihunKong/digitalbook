'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Brain, BarChart3, ArrowRight, Star } from 'lucide-react'

export default function HomePage() {
  const [userType, setUserType] = useState<'teacher' | 'student' | null>(null)

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
        <div className="flex justify-end items-center gap-4">
          <Link href="/auth/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md">
            로그인
          </Link>
          <Link href="/auth/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            회원가입
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            내책 - 교사가 만드는 디지털 교과서
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            교사의 전문성과 자율성을 존중하는 교육 플랫폼
            <br />
            AI는 교사를 돕는 도구, 주인공은 언제나 교사와 학생입니다
          </p>
          
          {!userType ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Link href="/demos" className="h-14 text-base font-medium px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  데모 체험하기
                </Link>
                <Link href="/auth/login" className="h-14 text-base font-medium px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  로그인
                </Link>
                <Link href="/guest" className="h-14 text-base font-medium px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  접근 코드로 입장
                </Link>
                <Link href="/explore" className="h-14 text-base font-medium px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <Star className="w-4 h-4 mr-2" />
                  공개 교과서 둘러보기
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <Link href={userType === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                대시보드로 이동 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
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
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            선생님의 수업 철학을 담은 교과서를 만들어보세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            학생들의 특성을 가장 잘 아는 선생님이 직접 만드는 맞춤형 교과서
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup" className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium">
              무료로 시작하기
            </Link>
            <Link href="/demo" className="px-6 py-3 text-white border border-white bg-white/10 hover:bg-white hover:text-blue-600 rounded-lg font-medium">
              데모 체험하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}