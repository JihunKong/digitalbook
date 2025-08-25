'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, GraduationCap, Users } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TEACHER'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    // 비밀번호 길이 검증 (백엔드에서 8자 이상 요구)
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          termsAccepted: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Registration error:', errorData)
        console.error('Response status:', response.status)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(errorData.message || '회원가입에 실패했습니다.')
      }

      const data = await response.json()
      
      // 사용자 역할에 따라 리다이렉트
      if (formData.role === 'TEACHER') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">내책</h1>
          </div>
          <p className="text-gray-600">교사가 만드는 디지털 교과서</p>
        </div>

        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">회원가입</h3>
            <p className="text-sm text-gray-600">
              새 계정을 만들어 디지털 교과서를 시작하세요
            </p>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">이름</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="example@school.edu"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">역할</label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="teacher"
                      name="role"
                      value="TEACHER"
                      checked={formData.role === 'TEACHER'}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="teacher" className="flex items-center cursor-pointer text-sm">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      교사
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="student"
                      name="role"
                      value="STUDENT"
                      checked={formData.role === 'STUDENT'}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="student" className="flex items-center cursor-pointer text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      학생
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="최소 8자 이상"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                {isLoading ? '가입 중...' : '회원가입'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  로그인
                </Link>
              </p>
              <Link href="/" className="text-sm text-gray-500 hover:underline">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}