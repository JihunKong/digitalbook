'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Save, 
  Eye, 
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  BookOpen,
  Edit3,
  Move,
  Copy,
  Settings,
  Sparkles,
  Users,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface TextbookPage {
  id: string
  pageNumber: number
  title: string
  content: string
  imageUrl?: string
  quiz?: {
    question: string
    options: string[]
    correctIndex: number
  }
}

interface Textbook {
  id: string
  title: string
  subject: string
  grade: string
  description?: string
  isPublic: boolean
  accessCode: string
  pages: TextbookPage[]
}

export default function EditTextbookPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<string | null>(null)
  
  // 샘플 교과서 데이터
  const [textbook, setTextbook] = useState<Textbook>({
    id: (params?.id as string) || '',
    title: '재미있는 국어 여행',
    subject: '국어',
    grade: '3',
    description: '초등학교 3학년을 위한 국어 교과서입니다.',
    isPublic: true,
    accessCode: 'KOR001',
    pages: [
      {
        id: '1',
        pageNumber: 1,
        title: '1장. 우리말의 아름다움',
        content: `우리말은 세계에서 가장 과학적이고 아름다운 언어 중 하나입니다.

한글은 1443년 세종대왕께서 창제하신 문자로, 백성들이 쉽게 익혀 사용할 수 있도록 만들어졌습니다.`,
        imageUrl: '/images/korean-beauty.jpg',
        quiz: {
          question: '한글을 창제하신 분은 누구일까요?',
          options: ['세종대왕', '이순신', '김구', '안중근'],
          correctIndex: 0
        }
      },
      {
        id: '2',
        pageNumber: 2,
        title: '2장. 의성어와 의태어',
        content: `의성어는 소리를 흉내 낸 말이고, 의태어는 모양이나 움직임을 흉내 낸 말입니다.`,
        quiz: {
          question: '다음 중 의성어는 무엇일까요?',
          options: ['살금살금', '반짝반짝', '멍멍', '출렁출렁'],
          correctIndex: 2
        }
      }
    ]
  })

  const selectedPage = textbook.pages.find(p => p.id === selectedPageId)

  const handleTextbookChange = (field: string, value: any) => {
    setTextbook(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handlePageChange = (field: string, value: any) => {
    if (!selectedPageId) return
    
    setTextbook(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === selectedPageId 
          ? { ...page, [field]: value }
          : page
      )
    }))
    setHasUnsavedChanges(true)
  }

  const handleQuizChange = (field: string, value: any) => {
    if (!selectedPageId) return
    
    setTextbook(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === selectedPageId 
          ? { 
              ...page, 
              quiz: page.quiz 
                ? { ...page.quiz, [field]: value }
                : { question: '', options: ['', '', '', ''], correctIndex: 0, [field]: value }
            }
          : page
      )
    }))
    setHasUnsavedChanges(true)
  }

  const handleQuizOptionChange = (index: number, value: string) => {
    if (!selectedPageId || !selectedPage?.quiz) return
    
    const newOptions = [...selectedPage.quiz.options]
    newOptions[index] = value
    handleQuizChange('options', newOptions)
  }

  const addNewPage = () => {
    const newPage: TextbookPage = {
      id: Date.now().toString(),
      pageNumber: textbook.pages.length + 1,
      title: `${textbook.pages.length + 1}장. 새로운 페이지`,
      content: ''
    }
    
    setTextbook(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }))
    setSelectedPageId(newPage.id)
    setHasUnsavedChanges(true)
  }

  const deletePage = (pageId: string) => {
    setTextbook(prev => ({
      ...prev,
      pages: prev.pages
        .filter(p => p.id !== pageId)
        .map((p, index) => ({ ...p, pageNumber: index + 1 }))
    }))
    
    if (selectedPageId === pageId) {
      setSelectedPageId(textbook.pages[0]?.id || null)
    }
    setHasUnsavedChanges(true)
    setShowDeleteDialog(false)
    setPageToDelete(null)
    toast.success('페이지가 삭제되었습니다')
  }

  const handleSave = () => {
    // 실제로는 API 호출
    toast.success('교과서가 저장되었습니다')
    setHasUnsavedChanges(false)
    setShowSaveDialog(false)
  }

  const handlePublish = () => {
    // 실제로는 API 호출
    toast.success('교과서가 발행되었습니다')
    router.push('/teacher/dashboard?tab=textbooks')
  }

  useEffect(() => {
    // 첫 페이지 선택
    if (textbook.pages.length > 0 && !selectedPageId) {
      setSelectedPageId(textbook.pages[0].id)
    }
  }, [textbook.pages, selectedPageId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/teacher/dashboard?tab=textbooks">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  교재 목록
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{textbook.title} 편집</h1>
                <p className="text-sm text-gray-600">
                  {textbook.subject} • {textbook.grade}학년
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? '편집' : '미리보기'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                disabled={!hasUnsavedChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
              <Button onClick={handlePublish}>
                발행하기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="pages">페이지 편집</TabsTrigger>
            <TabsTrigger value="quiz">문제 관리</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
            <TabsTrigger value="ai">AI 도우미</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>교과서 기본 정보</CardTitle>
                <CardDescription>교과서의 기본 정보를 설정합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">교과서 제목</Label>
                    <Input
                      id="title"
                      value={textbook.title}
                      onChange={(e) => handleTextbookChange('title', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessCode">접근 코드</Label>
                    <Input
                      id="accessCode"
                      value={textbook.accessCode}
                      onChange={(e) => handleTextbookChange('accessCode', e.target.value)}
                      className="mt-1"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="subject">과목</Label>
                    <Select
                      value={textbook.subject}
                      onValueChange={(value) => handleTextbookChange('subject', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="국어">국어</SelectItem>
                        <SelectItem value="문학">문학</SelectItem>
                        <SelectItem value="화법과작문">화법과 작문</SelectItem>
                        <SelectItem value="언어와매체">언어와 매체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="grade">학년</Label>
                    <Select
                      value={textbook.grade}
                      onValueChange={(value) => handleTextbookChange('grade', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1학년</SelectItem>
                        <SelectItem value="2">2학년</SelectItem>
                        <SelectItem value="3">3학년</SelectItem>
                        <SelectItem value="4">4학년</SelectItem>
                        <SelectItem value="5">5학년</SelectItem>
                        <SelectItem value="6">6학년</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={textbook.description || ''}
                    onChange={(e) => handleTextbookChange('description', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="public"
                      checked={textbook.isPublic}
                      onCheckedChange={(checked) => handleTextbookChange('isPublic', checked)}
                    />
                    <Label htmlFor="public">공개 교과서로 설정</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    공개 교과서는 다른 교사들도 사용할 수 있습니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Page List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>페이지 목록</CardTitle>
                    <Button size="sm" onClick={addNewPage}>
                      <Plus className="w-4 h-4 mr-1" />
                      새 페이지
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {textbook.pages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPageId === page.id
                            ? 'bg-blue-50 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPageId(page.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{page.title}</p>
                            <p className="text-xs text-gray-600">
                              페이지 {page.pageNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {page.quiz && (
                              <Badge variant="secondary" className="text-xs">
                                퀴즈
                              </Badge>
                            )}
                            {page.imageUrl && (
                              <Badge variant="secondary" className="text-xs">
                                이미지
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Page Editor */}
              <div className="lg:col-span-2">
                {selectedPage ? (
                  showPreview ? (
                    // Preview Mode
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedPage.title}</CardTitle>
                        <CardDescription>미리보기 모드</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap">{selectedPage.content}</div>
                          {selectedPage.imageUrl && (
                            <img
                              src={selectedPage.imageUrl}
                              alt={selectedPage.title}
                              className="mt-4 rounded-lg w-full"
                            />
                          )}
                        </div>
                        
                        {selectedPage.quiz && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold mb-2">{selectedPage.quiz.question}</h4>
                            <div className="space-y-2">
                              {selectedPage.quiz.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded ${
                                    index === selectedPage.quiz!.correctIndex
                                      ? 'bg-green-100'
                                      : 'bg-white'
                                  }`}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    // Edit Mode
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>페이지 편집</CardTitle>
                            <CardDescription>페이지 {selectedPage.pageNumber}</CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPageToDelete(selectedPage.id)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label htmlFor="pageTitle">페이지 제목</Label>
                          <Input
                            id="pageTitle"
                            value={selectedPage.title}
                            onChange={(e) => handlePageChange('title', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pageContent">내용</Label>
                          <Textarea
                            id="pageContent"
                            value={selectedPage.content}
                            onChange={(e) => handlePageChange('content', e.target.value)}
                            className="mt-1"
                            rows={10}
                          />
                        </div>

                        <div>
                          <Label htmlFor="pageImage">이미지 URL</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="pageImage"
                              value={selectedPage.imageUrl || ''}
                              onChange={(e) => handlePageChange('imageUrl', e.target.value)}
                              placeholder="이미지 URL을 입력하세요"
                            />
                            <Button variant="outline">
                              <Upload className="w-4 h-4 mr-1" />
                              업로드
                            </Button>
                          </div>
                        </div>

                        {selectedPage.imageUrl && (
                          <div className="border rounded-lg p-4">
                            <img
                              src={selectedPage.imageUrl}
                              alt="Preview"
                              className="w-full rounded"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">페이지를 선택하여 편집하세요</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>퀴즈 관리</CardTitle>
                <CardDescription>각 페이지에 퀴즈를 추가하여 학습 효과를 높이세요</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPage ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{selectedPage.title} - 퀴즈 설정</h3>
                      {!selectedPage.quiz ? (
                        <Button
                          onClick={() => handleQuizChange('question', '')}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          퀴즈 추가
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange('quiz', undefined)}
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          퀴즈 삭제
                        </Button>
                      )}
                    </div>

                    {selectedPage.quiz && (
                      <>
                        <div>
                          <Label htmlFor="question">문제</Label>
                          <Input
                            id="question"
                            value={selectedPage.quiz.question}
                            onChange={(e) => handleQuizChange('question', e.target.value)}
                            className="mt-1"
                            placeholder="문제를 입력하세요"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>보기</Label>
                          {selectedPage.quiz.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => handleQuizOptionChange(index, e.target.value)}
                                placeholder={`보기 ${index + 1}`}
                              />
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={selectedPage.quiz!.correctIndex === index}
                                onChange={() => handleQuizChange('correctIndex', index)}
                                className="w-4 h-4"
                              />
                              <Label className="text-sm">정답</Label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">페이지를 선택하여 퀴즈를 관리하세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>고급 설정</CardTitle>
                <CardDescription>교과서의 고급 기능을 설정합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch id="autoSave" defaultChecked />
                      <Label htmlFor="autoSave">자동 저장</Label>
                    </div>
                    <p className="text-sm text-gray-600">5분마다 자동으로 저장됩니다</p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch id="studentFeedback" defaultChecked />
                      <Label htmlFor="studentFeedback">학생 피드백 허용</Label>
                    </div>
                    <p className="text-sm text-gray-600">학생들이 질문을 남길 수 있습니다</p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch id="analytics" defaultChecked />
                      <Label htmlFor="analytics">학습 분석</Label>
                    </div>
                    <p className="text-sm text-gray-600">학생들의 학습 데이터를 수집합니다</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI 교수 지원 도구
                </CardTitle>
                <CardDescription>AI가 교과서 제작을 도와드립니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">교사 전문성을 존중하는 AI</h4>
                  <p className="text-sm text-blue-800">
                    AI는 교사님의 전문성과 경험을 대체하지 않습니다. 
                    교사님이 주도적으로 수업을 설계하고, AI는 요청하실 때만 보조적인 제안을 드립니다.
                  </p>
                </div>

                <div className="grid gap-4">
                  <Button variant="outline" className="justify-start">
                    <Sparkles className="w-4 h-4 mr-2" />
                    현재 페이지 내용 개선 제안
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    학습 활동 아이디어 생성
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    평가 문항 초안 생성
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    관련 이미지 추천
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경사항 저장</AlertDialogTitle>
            <AlertDialogDescription>
              교과서의 변경사항을 저장하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>저장</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Page Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>페이지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pageToDelete && deletePage(pageToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}