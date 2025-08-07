'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TEST_ACCOUNTS = [
  { email: 'purusil55@gmail.com', password: 'alsk2004A!@#', name: '관리자', role: 'ADMIN' },
  { email: 'purusil@naver.com', password: 'rhdwlgns85', name: '홍길동 선생님', role: 'TEACHER' },
  { email: 'student1@test.com', password: 'student123!', name: '김민수', role: 'STUDENT' },
  { email: 'student2@test.com', password: 'student123!', name: '이서연', role: 'STUDENT' },
  { email: 'student3@test.com', password: 'student123!', name: '박준호', role: 'STUDENT' },
  { email: 'student4@test.com', password: 'student123!', name: '최지우', role: 'STUDENT' },
  { email: 'student5@test.com', password: 'student123!', name: '정다은', role: 'STUDENT' },
]

export default function TestAccountsPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const testLogin = async (account: any) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      })

      const data = await response.json()
      
      return {
        email: account.email,
        name: account.name,
        role: account.role,
        success: response.ok,
        status: response.status,
        message: data.message || 'Success',
      }
    } catch (error: any) {
      return {
        email: account.email,
        name: account.name,
        role: account.role,
        success: false,
        status: 0,
        message: error.message,
      }
    }
  }

  const testAllAccounts = async () => {
    setIsLoading(true)
    setTestResults([])

    const results = []
    for (const account of TEST_ACCOUNTS) {
      const result = await testLogin(account)
      results.push(result)
      setTestResults([...results])
    }

    setIsLoading(false)
  }

  const quickLogin = async (account: any) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    })

    const data = await response.json()
    
    if (response.ok && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      
      if (data.user.role === 'TEACHER' || data.user.role === 'ADMIN') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">계정 테스트 페이지</h1>
        <p className="text-gray-600 mb-8">요청하신 계정들이 정상적으로 생성되었습니다.</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">생성된 계정 목록</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비밀번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">바로 로그인</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {TEST_ACCOUNTS.map((account, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{account.password}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{account.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        account.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => quickLogin(account)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        로그인 →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">로그인 테스트</h2>
          <button
            onClick={testAllAccounts}
            disabled={isLoading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '테스트 중...' : '모든 계정 테스트'}
          </button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{result.email}</span>
                      <span className="ml-2 text-sm text-gray-600">({result.name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✓ 성공' : '✗ 실패'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Status: {result.status}
                      </span>
                    </div>
                  </div>
                  {!result.success && (
                    <p className="text-sm text-red-600 mt-1">{result.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  )
}