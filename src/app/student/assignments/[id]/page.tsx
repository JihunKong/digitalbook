'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Send, 
  Save,
  Clock, 
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Sparkles,
  BarChart,
  Target,
  PenTool,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { WritingEvaluator } from '@/components/writing/WritingEvaluator'
import { WritingGuide } from '@/components/writing/WritingGuide'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api'

interface Assignment {
  id: string
  title: string
  description: string
  type: string
  dueDate: string
  points: number
  class?: {
    id: string
    name: string
  }
  submissions?: Array<{
    id: string
    content?: any
    status: string
  }>
}

export default function WritingAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const assignmentId = params?.id as string || ''
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isLoading, setIsLoading] = useState(true)

  // 과제 데이터 불러오기
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const response = await apiClient.getAssignments()
        const assignments = Array.isArray(response?.data) ? response.data : []
        const found = assignments.find((a: Assignment) => a.id === assignmentId)
        if (found) {
          setAssignment(found)
          // 기존 제출물이 있으면 불러오기
          if (found.submissions?.[0]?.content?.text) {
            setContent(found.submissions[0].content.text)
          }
        }
      } catch (error) {
        console.error('Failed to load assignment:', error)
        toast({
          title: '과제를 불러오는데 실패했습니다',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAssignment()
  }, [assignmentId])

  // 글자수 계산
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
    const chars = content.replace(/\s/g, '').length
    setWordCount(words)
    setCharCount(chars)
  }, [content])

  // 자동 저장
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && autoSaveStatus !== 'saving') {
        handleAutoSave()
      }
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timer)
  }, [content])

  const handleAutoSave = async () => {
    if (!assignment) return
    
    setAutoSaveStatus('saving')
    try {
      // 실제 API 호출
      const submissionData = {
        content: { text: content },
        status: 'DRAFT' as const
      }
      
      await apiClient.submitAssignment(assignment.id, submissionData)
      
      setAutoSaveStatus('saved')
    } catch (error) {
      setAutoSaveStatus('error')
    }
  }

  const handleSaveDraft = async () => {
    if (!assignment) return
    
    setIsSaving(true)
    try {
      const submissionData = {
        content: { text: content },
        status: 'DRAFT' as const
      }
      
      await apiClient.submitAssignment(assignment.id, submissionData)
      
      toast({
        title: '임시 저장 완료',
        description: '작성 중인 내용이 저장되었습니다.',
      })
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignment) return
    
    // 최소 글자수 검증 (500자 기본값)
    const minLength = 500
    if (charCount < minLength) {
      toast({
        title: '글자 수 부족',
        description: `최소 ${minLength}자 이상 작성해주세요.`,
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const submissionData = {
        content: { text: content },
        status: 'SUBMITTED' as const
      }
      
      await apiClient.submitAssignment(assignment.id, submissionData)
      
      setShowEvaluation(true)
      toast({
        title: '제출 완료',
        description: '과제가 성공적으로 제출되었습니다.',
      })
      
      // 2초 후 과제 목록으로 이동
      setTimeout(() => {
        router.push('/student/assignments')
      }, 2000)
    } catch (error) {
      toast({
        title: '제출 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">과제를 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/student/assignments')}>
            과제 목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const timeRemaining = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // 과제 요구사항 (임시값)
  const requirements = {
    minLength: 500,
    maxLength: 1000,
    includeElements: ['서론', '본론', '결론']
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="text-gray-600">클래스: {assignment.class?.name || '우리반'}</p>
          </div>
          <Badge variant={timeRemaining > 3 ? 'default' : 'destructive'}>
            <Clock className="w-3 h-3 mr-1" />
            {timeRemaining}일 남음
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Writing Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>과제 내용</CardTitle>
                <CardDescription className="text-base mt-2">
                  {assignment.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Writing Requirements */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      작성 요구사항
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• 글자 수: {requirements.minLength} ~ {requirements.maxLength}자</li>
                      <li>• 필수 포함 요소: {requirements.includeElements.join(', ')}</li>
                      <li>• 과제 유형: {assignment.type === 'WRITING' ? '글쓰기' : assignment.type}</li>
                    </ul>
                  </div>

                  {/* Writing Tabs */}
                  <Tabs defaultValue="write" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="write">작성</TabsTrigger>
                      <TabsTrigger value="preview">미리보기</TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="mt-4">
                      <div className="relative">
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="여기에 글을 작성하세요..."
                          className="min-h-[400px] resize-none font-serif text-lg leading-relaxed"
                        />
                        
                        {/* Auto-save indicator */}
                        <div className="absolute top-2 right-2 text-xs text-gray-500">
                          {autoSaveStatus === 'saving' && (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              저장 중...
                            </span>
                          )}
                          {autoSaveStatus === 'saved' && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              자동 저장됨
                            </span>
                          )}
                          {autoSaveStatus === 'error' && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              저장 실패
                            </span>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                      <div className="prose prose-lg max-w-none p-6 bg-gray-50 rounded-lg min-h-[400px]">
                        {content ? (
                          <div className="whitespace-pre-wrap font-serif">{content}</div>
                        ) : (
                          <p className="text-gray-400 text-center">아직 작성된 내용이 없습니다.</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Word Count & Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>글자 수: {charCount}자</span>
                      <span>{requirements.minLength}자 ~ {requirements.maxLength}자</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (charCount / requirements.minLength) * 100)} 
                      className="h-2"
                    />
                    {charCount < requirements.minLength && (
                      <p className="text-xs text-orange-600">
                        최소 {requirements.minLength - charCount}자 더 작성해야 합니다.
                      </p>
                    )}
                    {charCount > requirements.maxLength && (
                      <p className="text-xs text-red-600">
                        최대 글자 수를 {charCount - requirements.maxLength}자 초과했습니다.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSaving || !content}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      임시 저장
                    </Button>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || charCount < requirements.minLength}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      제출하기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Writing Guide */}
            <WritingGuide genre={assignment.type === 'WRITING' ? 'narrative' : 'expository'} />

            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI 작문 도우미
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <PenTool className="w-4 h-4" />
                    문장 다듬기
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <MessageSquare className="w-4 h-4" />
                    피드백 받기
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <BarChart className="w-4 h-4" />
                    구조 분석
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Evaluation Modal */}
        {showEvaluation && (
          <WritingEvaluator
            content={content}
            assignment={{
              title: assignment.title,
              prompt: assignment.description,
              genre: assignment.type === 'WRITING' ? 'narrative' : 'expository'
            }}
            onClose={() => setShowEvaluation(false)}
          />
        )}
      </motion.div>
    </div>
  )
}