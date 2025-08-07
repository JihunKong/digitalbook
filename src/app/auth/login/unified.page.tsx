'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.unified'
import { toast } from '@/components/ui/use-toast'

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionWarning, setSessionWarning] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user } = useAuth()
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard')
          break
        case 'TEACHER':
          router.push('/teacher/dashboard')
          break
        case 'STUDENT':
          router.push('/student/dashboard')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, router])
  
  // Check for session expiry or demo parameter
  useEffect(() => {
    const expired = searchParams?.get('expired')
    const demo = searchParams?.get('demo')
    
    if (expired === 'true') {
      setSessionWarning(true)
      toast({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        variant: 'destructive',
      })
    }
    
    if (demo === 'teacher' || demo === 'student' || demo === 'admin') {
      handleDemoLogin(demo)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSessionWarning(false)

    try {
      await login(email, password)
      
      // Successful login is handled by the auth hook
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      })
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Invalid credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Too many login attempts')) {
        setError('Too many login attempts. Please try again later.')
      } else if (error.message?.includes('Account locked')) {
        setError('Your account has been locked. Please contact support.')
      } else {
        setError(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'teacher' | 'student' | 'admin') => {
    setIsLoading(true)
    setError('')

    try {
      // Demo account credentials (from TEST_ACCOUNTS.md)
      const demoCredentials = {
        admin: { email: 'admin@test.com', password: 'Admin123!@#' },
        teacher: { email: 'teacher1@test.com', password: 'Teacher123!' },
        student: { email: 'student1@test.com', password: 'Student123!' }
      }

      const { email, password } = demoCredentials[role]
      
      await login(email, password)
      
      toast({
        title: 'Demo Login Successful',
        description: `Logged in as ${role} demo account`,
      })
    } catch (error: any) {
      console.error('Demo login error:', error)
      setError('Demo account login failed. Please try again or use your own credentials.')
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
          
          {/* Security Notice */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <Shield className="h-3 w-3" />
              <span>Secure login with encrypted connection</span>
            </div>
          </div>

          <div className="p-6">
            {sessionWarning && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Session expired</p>
                  <p className="text-xs mt-1">For your security, please log in again.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="example@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    비밀번호
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  로그인 상태 유지
                </label>
              </div>

              {error && (
                <div 
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" 
                  role="alert"
                >
                  <span className="block sm:inline text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
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

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                >
                  관리자 데모 계정으로 시작
                </button>
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => handleDemoLogin('teacher')}
                  disabled={isLoading}
                >
                  교사 데모 계정으로 시작
                </button>
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => handleDemoLogin('student')}
                  disabled={isLoading}
                >
                  학생 데모 계정으로 시작
                </button>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                  회원가입
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                또는{' '}
                <Link href="/guest" className="text-blue-600 hover:underline font-medium">
                  게스트로 체험하기
                </Link>
              </p>
              <Link href="/" className="text-sm text-gray-500 hover:underline inline-block mt-2">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex justify-center items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>SSL 암호화</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>CSRF 보호</span>
          </div>
        </div>
      </div>
    </div>
  )
}