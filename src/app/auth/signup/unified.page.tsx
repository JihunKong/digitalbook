'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, School, GraduationCap, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.unified'
import { toast } from '@/components/ui/use-toast'

type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  role: UserRole
  // Teacher profile
  school?: string
  subject?: string
  grade?: string
  // Student profile
  studentSchool?: string
  studentGrade?: string
  studentClass?: string
  // Admin profile
  department?: string
  adminCode?: string
}

export default function UnifiedSignupPage() {
  const router = useRouter()
  const { register } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'STUDENT',
    school: '',
    subject: '',
    grade: '',
    studentSchool: '',
    studentGrade: '',
    studentClass: '',
    department: '',
    adminCode: '',
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Role selection, 2: Basic info, 3: Profile info

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)'
    }
    return null
  }

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate basic info
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setError('')
    setStep(3)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Prepare profile data based on role
      let profileData = {}
      
      switch (formData.role) {
        case 'TEACHER':
          profileData = {
            school: formData.school,
            subject: formData.subject,
            grade: formData.grade,
          }
          break
        case 'STUDENT':
          profileData = {
            school: formData.studentSchool,
            grade: formData.studentGrade,
            class: formData.studentClass,
          }
          break
        case 'ADMIN':
          // Validate admin code
          if (formData.adminCode !== 'ADMIN2024SECRET') {
            setError('Invalid admin registration code')
            setIsLoading(false)
            return
          }
          profileData = {
            department: formData.department,
          }
          break
      }

      // Register user
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        profileData,
      })

      toast({
        title: 'Registration successful',
        description: 'Welcome to Digital Textbook Platform!',
      })

      // Redirect is handled by the auth hook
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose your role</h3>
      
      <button
        onClick={() => handleRoleSelect('STUDENT')}
        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <GraduationCap className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">학생</h4>
            <p className="text-sm text-gray-600">디지털 교과서로 학습하기</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => handleRoleSelect('TEACHER')}
        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <School className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">교사</h4>
            <p className="text-sm text-gray-600">디지털 교과서 만들고 관리하기</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => handleRoleSelect('ADMIN')}
        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">관리자</h4>
            <p className="text-sm text-gray-600">플랫폼 관리 (인증 코드 필요)</p>
          </div>
        </div>
      </button>
    </div>
  )

  const renderBasicInfo = () => (
    <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          이름
        </label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            id="name"
            type="text"
            placeholder="홍길동"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

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
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="8자 이상, 대소문자, 숫자, 특수문자 포함"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        <p className="text-xs text-gray-500">
          최소 8자, 대문자, 소문자, 숫자, 특수문자(!@#$%^&*) 포함
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          비밀번호 확인
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="pl-10 pr-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          이전
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          다음
        </button>
      </div>
    </form>
  )

  const renderProfileInfo = () => {
    if (formData.role === 'TEACHER') {
      return (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">교사 정보</h3>
          
          <div className="space-y-2">
            <label htmlFor="school" className="block text-sm font-medium text-gray-700">
              학교
            </label>
            <input
              id="school"
              type="text"
              placeholder="서울초등학교"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              담당 과목
            </label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">선택하세요</option>
              <option value="국어">국어</option>
              <option value="수학">수학</option>
              <option value="영어">영어</option>
              <option value="과학">과학</option>
              <option value="사회">사회</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
              담당 학년
            </label>
            <select
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">선택하세요</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
              <option value="4">4학년</option>
              <option value="5">5학년</option>
              <option value="6">6학년</option>
            </select>
          </div>

          {renderSubmitButtons()}
        </form>
      )
    }

    if (formData.role === 'STUDENT') {
      return (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">학생 정보</h3>
          
          <div className="space-y-2">
            <label htmlFor="studentSchool" className="block text-sm font-medium text-gray-700">
              학교
            </label>
            <input
              id="studentSchool"
              type="text"
              placeholder="서울초등학교"
              value={formData.studentSchool}
              onChange={(e) => setFormData({ ...formData, studentSchool: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="studentGrade" className="block text-sm font-medium text-gray-700">
              학년
            </label>
            <select
              id="studentGrade"
              value={formData.studentGrade}
              onChange={(e) => setFormData({ ...formData, studentGrade: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">선택하세요</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
              <option value="4">4학년</option>
              <option value="5">5학년</option>
              <option value="6">6학년</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700">
              반
            </label>
            <input
              id="studentClass"
              type="text"
              placeholder="1반"
              value={formData.studentClass}
              onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {renderSubmitButtons()}
        </form>
      )
    }

    if (formData.role === 'ADMIN') {
      return (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">관리자 정보</h3>
          
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              부서
            </label>
            <input
              id="department"
              type="text"
              placeholder="교육정보부"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">
              관리자 인증 코드
            </label>
            <input
              id="adminCode"
              type="password"
              placeholder="관리자 인증 코드를 입력하세요"
              value={formData.adminCode}
              onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500">
              관리자 등록은 인증 코드가 필요합니다. 시스템 관리자에게 문의하세요.
            </p>
          </div>

          {renderSubmitButtons()}
        </form>
      )
    }
  }

  const renderSubmitButtons = () => (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          disabled={isLoading}
        >
          이전
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              회원가입 중...
            </>
          ) : (
            '회원가입 완료'
          )}
        </button>
      </div>
    </>
  )

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
            <h2 className="text-xl font-semibold">회원가입</h2>
            <p className="text-sm text-gray-600 mt-1">
              디지털 교과서 플랫폼에 가입하세요
            </p>
            
            {/* Progress indicator */}
            <div className="flex items-center mt-4 gap-2">
              <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>역할 선택</span>
              <span>기본 정보</span>
              <span>프로필 정보</span>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && renderRoleSelection()}
            {step === 2 && renderBasicInfo()}
            {step === 3 && renderProfileInfo()}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                  로그인
                </Link>
              </p>
              <Link href="/" className="text-sm text-gray-500 hover:underline inline-block mt-2">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}