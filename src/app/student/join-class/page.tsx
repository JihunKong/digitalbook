'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Users, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentJoinClassPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code || !name) {
      toast.error('코드와 이름을 입력해주세요.')
      return
    }

    if (code.length !== 6) {
      toast.error('수업 코드는 6자리여야 합니다.')
      return
    }

    setLoading(true)

    try {
      // 데모용 - 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 임시로 로컬 스토리지에 저장
      const studentInfo = {
        name,
        studentId: studentId || `guest_${Date.now()}`,
        classCode: code.toUpperCase(),
        joinedAt: new Date().toISOString()
      }
      
      localStorage.setItem('studentInfo', JSON.stringify(studentInfo))
      
      toast.success('수업에 참여했습니다!')
      
      // 텍스트북 데모 페이지로 이동
      router.push('/textbook/demo')
    } catch (error) {
      console.error('수업 참여 오류:', error)
      toast.error('수업 참여에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeInput = (value: string) => {
    const filtered = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (filtered.length <= 6) {
      setCode(filtered)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">디지털 교과서 수업 참여</CardTitle>
          <CardDescription>
            선생님이 알려준 6자리 코드를 입력하고 수업에 참여하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="space-y-4">
            {/* 수업 코드 */}
            <div className="space-y-2">
              <Label htmlFor="code">수업 코드</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABC123"
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                className="text-center text-2xl font-mono tracking-wider uppercase"
                maxLength={6}
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 text-center">
                {code.length}/6
              </p>
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            {/* 학번 (선택) */}
            <div className="space-y-2">
              <Label htmlFor="studentId">학번 (선택)</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="20240001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                학번이 없다면 비워두셔도 됩니다
              </p>
            </div>

            {/* 참여 버튼 */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || !code || !name}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  입장 중...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  수업 참여하기
                </>
              )}
            </Button>
          </form>

          {/* 추가 정보 */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">디지털 교과서로 학습</p>
                  <p className="text-gray-600">교과서를 보며 AI 선생님과 함께 공부해요</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI 코칭</p>
                  <p className="text-gray-600">페이지별로 맞춤형 학습 도움을 받을 수 있어요</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">함께 학습</p>
                  <p className="text-gray-600">같은 수업의 친구들과 함께 공부해요</p>
                </div>
              </div>
            </div>
          </div>

          {/* 데모 안내 */}
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">📌 데모 안내:</span> 테스트를 위해 코드 
              <span className="font-mono mx-1 font-bold">DEMO01</span>을 입력해보세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}