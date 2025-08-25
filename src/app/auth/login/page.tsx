'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check for demo parameter on mount
  useEffect(() => {
    const demo = searchParams?.get('demo')
    if (demo === 'teacher' || demo === 'student') {
      handleDemoLogin(demo)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Call our API endpoint (which forwards to backend)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다.')
      }
      
      // Store user info and redirect
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        
        // 사용자 역할에 따라 리다이렉트
        if (data.user.role === 'TEACHER' || data.user.role === 'ADMIN') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'teacher' | 'student') => {
    setIsLoading(true)
    setError('')

    try {
      // 데모 계정 정보
      const demoCredentials = {
        teacher: { email: 'purusil@naver.com', password: 'rhdwlgns85' },
        student: { email: 'student1@test.com', password: 'student123!' }
      }

      const { email, password } = demoCredentials[role]
      
      // 데모 계정으로 로그인 시도
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다.')
      }
      
      // Store user info and redirect
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        
        // 사용자 역할에 따라 리다이렉트
        if (data.user.role === 'TEACHER' || data.user.role === 'ADMIN') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Demo login error:', error)
      // 데모 계정이 없을 경우 생성하도록 안내
      setError('데모 계정이 아직 생성되지 않았습니다. 회원가입을 통해 계정을 만들어주세요.')
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

        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">로그인</h2>
            <p className="text-sm text-gray-600 mt-1">
              계정에 로그인하여 디지털 교과서를 시작하세요
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="example@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">또는</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleDemoLogin('teacher')}
                  disabled={isLoading}
                >
                  교사 데모 계정으로 시작
                </button>
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleDemoLogin('student')}
                  disabled={isLoading}
                >
                  학생 데모 계정으로 시작
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:underline">
                  회원가입
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}