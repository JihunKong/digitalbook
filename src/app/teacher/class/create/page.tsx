'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Users, Calendar, Clock, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

// 임시 교과서 목록 (실제로는 API에서 가져옴)
const availableTextbooks = [
  {
    id: 'korean-5',
    title: '미래엔 고등학교 1학년 공통국어',
    chapter: '5단원 - 세상과 나를 분석하라',
    subject: '국어',
    grade: '고1'
  },
  {
    id: 'korean-6',
    title: '미래엔 고등학교 1학년 공통국어',
    chapter: '6단원 - 문학과 삶',
    subject: '국어',
    grade: '고1'
  }
]

export default function CreateClassPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    textbookId: '',
    duration: '90', // 분 단위
  })

  // 6자리 영숫자 코드 생성
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.textbookId) {
      toast.error('수업명과 교과서를 선택해주세요.')
      return
    }

    setLoading(true)

    try {
      const code = generateClassCode()
      
      // API 호출 (임시로 setTimeout 사용)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 실제로는 API 응답에서 받은 코드 사용
      setClassCode(code)
      
      toast.success('수업이 생성되었습니다!')
      
      // 생성 완료 후 상태 표시
    } catch (error) {
      console.error('수업 생성 오류:', error)
      toast.error('수업 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode)
    setCopied(true)
    toast.success('수업 코드가 복사되었습니다.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoToClass = () => {
    router.push('/teacher/class/' + classCode)
  }

  if (classCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">수업이 생성되었습니다!</CardTitle>
            <CardDescription>
              학생들에게 아래 코드를 공유해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">수업 코드</p>
              <p className="text-4xl font-mono font-bold tracking-wider">{classCode}</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleCopyCode}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    코드 복사하기
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleGoToClass}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                수업 관리 페이지로 이동
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">💡 Tip:</span> 수업 코드는 칠판에 크게 적어두거나 
                화면에 띄워두면 학생들이 쉽게 입력할 수 있어요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">새 수업 만들기</h1>
          <p className="text-gray-600 mt-2">
            수업을 생성하면 6자리 코드가 발급됩니다. 학생들은 이 코드로 수업에 참여할 수 있어요.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>수업 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 수업명 */}
              <div className="space-y-2">
                <Label htmlFor="name">수업명 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="예: 1학년 3반 국어"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* 수업 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">수업 설명 (선택)</Label>
                <Textarea
                  id="description"
                  placeholder="수업에 대한 간단한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* 교과서 선택 */}
              <div className="space-y-2">
                <Label htmlFor="textbook">교과서 선택 *</Label>
                <Select
                  value={formData.textbookId}
                  onValueChange={(value) => setFormData({ ...formData, textbookId: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="사용할 교과서를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTextbooks.map((textbook) => (
                      <SelectItem key={textbook.id} value={textbook.id}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{textbook.title}</p>
                            <p className="text-sm text-gray-500">
                              {textbook.chapter} ({textbook.grade} {textbook.subject})
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 수업 시간 */}
              <div className="space-y-2">
                <Label htmlFor="duration">수업 시간 (분)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45분</SelectItem>
                    <SelectItem value="50">50분</SelectItem>
                    <SelectItem value="90">90분 (2교시)</SelectItem>
                    <SelectItem value="120">120분</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 제출 버튼 */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    수업 생성 중...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    수업 생성하기
                  </>
                )}
              </Button>
            </form>

            {/* 안내 사항 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                수업 운영 안내
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• 수업 코드는 생성 후 언제든지 확인할 수 있습니다</li>
                <li>• 학생들은 코드 입력만으로 바로 수업에 참여할 수 있습니다</li>
                <li>• 수업 중 실시간으로 학생들의 학습 현황을 모니터링할 수 있습니다</li>
                <li>• 수업 종료 후에도 학습 기록과 분석 자료를 확인할 수 있습니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}