'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  MessageCircle, 
  HelpCircle,
  Clock,
  CheckCircle,
  Volume2,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TextbookViewer } from '@/components/textbook/TextbookViewer'
import { QuestionPanel } from '@/components/textbook/QuestionPanel'
import { AITutorChat } from '@/components/ai/AITutorChat'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { usePageViewTracker, useTextbookTracker } from '@/hooks/useActivityTracker'

interface Textbook {
  id: string
  title: string
  subject: string
  description?: string
  totalPages: number
  pages: TextbookPage[]
}

interface TextbookPage {
  pageNumber: number
  content: string
  imageUrl?: string
  estimatedReadingTime: number
  questions: Question[]
}

interface Question {
  id: string
  questionText: string
  questionType: 'short_answer' | 'multiple_choice' | 'essay'
  hints?: string[]
  options?: QuestionOption[]
}

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

export default function TextbookViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const textbookId = params?.id as string || ''
  
  const [textbook, setTextbook] = useState<Textbook | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showQuestions, setShowQuestions] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<{ pageNumber: number; note?: string }[]>([])
  
  // Activity tracking
  const { trackTimeSpent } = usePageViewTracker(`${textbookId}-${currentPage}`, 'textbook-page')
  const { trackTextbookOpen, trackBookmark, trackPageTurn } = useTextbookTracker()

  // 반응형 체크
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      }
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // 교과서 및 페이지 데이터 로드
  useEffect(() => {
    const loadTextbook = async () => {
      try {
        setIsLoading(true)
        const [textbookResponse, bookmarksResponse] = await Promise.all([
          apiClient.getTextbook(textbookId),
          apiClient.getBookmarks(textbookId)
        ])

        if (textbookResponse?.data && typeof textbookResponse.data === 'object') {
          setTextbook(textbookResponse.data as any)
          
          // Track textbook opening
          trackTextbookOpen(textbookId)
          
          // 페이지 데이터가 없으면 임시 데이터 사용
          const textbookData = textbookResponse.data as any
          if (!Array.isArray(textbookData?.pages) || textbookData.pages.length === 0) {
            const mockPages = [
              {
                pageNumber: 1,
                content: `제1장 ${textbookData?.subject || '과목'} 학습

이 교과서는 학생들의 학습을 도와주는 디지털 교재입니다.

1. 학습 목표
- 기본 개념 이해
- 실생활 적용 능력 향상
- 창의적 사고 개발

2. 학습 방법
- 교재를 차례대로 읽으며 학습합니다.
- AI 튜터와 대화하며 궁금한 점을 해결합니다.
- 학습 문제를 통해 이해도를 확인합니다.

함께 즐겁게 학습해보아요!`,
                estimatedReadingTime: 180,
                questions: [
                  {
                    id: 'q1',
                    questionText: '이 교과서의 주요 학습 목표 세 가지를 적어보세요.',
                    questionType: 'short_answer' as const,
                    hints: ['기본 개념', '실생활 적용', '창의적 사고']
                  },
                  {
                    id: 'q2',
                    questionText: '효과적인 학습 방법은 무엇인가요?',
                    questionType: 'multiple_choice' as const,
                    options: [
                      { id: 'a', text: '교재를 한 번만 읽기', isCorrect: false },
                      { id: 'b', text: 'AI 튜터와 상호작용하며 학습하기', isCorrect: true },
                      { id: 'c', text: '문제를 풀지 않고 넘어가기', isCorrect: false },
                      { id: 'd', text: '혼자서만 공부하기', isCorrect: false }
                    ]
                  }
                ]
              }
            ]
            setTextbook(prev => prev ? { ...prev, pages: mockPages, totalPages: mockPages.length } : null)
          }
        }

        if (Array.isArray(bookmarksResponse?.data)) {
          setBookmarks(bookmarksResponse.data)
        }
      } catch (error) {
        console.error('Failed to load textbook:', error)
        toast({
          title: '교과서를 불러오는데 실패했습니다',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (textbookId) {
      loadTextbook()
    }
  }, [textbookId])

  // 북마크 상태 확인
  useEffect(() => {
    setIsBookmarked(bookmarks.some(b => b.pageNumber === currentPage))
  }, [bookmarks, currentPage])

  const currentPageData = textbook?.pages?.find(p => p.pageNumber === currentPage)

  // 읽기 시간 추적
  useEffect(() => {
    const timer = setInterval(() => {
      setReadingTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentPage])

  const handleNextPage = () => {
    if (textbook && currentPage < textbook.totalPages) {
      const fromPage = currentPage
      const toPage = currentPage + 1
      trackPageTurn(textbook.id, fromPage, toPage)
      
      setCurrentPage(toPage)
      setShowQuestions(false)
      setReadingTime(0) // 새 페이지로 이동할 때 읽기 시간 초기화
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const fromPage = currentPage
      const toPage = currentPage - 1
      trackPageTurn(textbook?.id || textbookId, fromPage, toPage)
      
      setCurrentPage(toPage)
      setShowQuestions(false)
      setReadingTime(0) // 새 페이지로 이동할 때 읽기 시간 초기화
    }
  }

  const handleFontSizeChange = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleBookmark = async () => {
    if (!textbook) return
    
    try {
      if (isBookmarked) {
        await apiClient.removeBookmark(textbook.id, currentPage)
        setBookmarks(prev => prev.filter(b => b.pageNumber !== currentPage))
        trackBookmark(textbook.id, currentPage, 'remove')
        toast({
          title: '북마크가 제거되었습니다'
        })
      } else {
        await apiClient.addBookmark({
          textbookId: textbook.id,
          pageNumber: currentPage
        })
        setBookmarks(prev => [...prev, { pageNumber: currentPage }])
        trackBookmark(textbook.id, currentPage, 'add')
        toast({
          title: '북마크가 추가되었습니다'
        })
      }
      setIsBookmarked(!isBookmarked)
    } catch (error) {
      toast({
        title: '북마크 처리 중 오류가 발생했습니다',
        variant: 'destructive'
      })
    }
  }

  // 읽기 진도 저장
  useEffect(() => {
    if (textbook && readingTime > 10) { // 10초 이상 읽었을 때만 저장
      const saveProgress = async () => {
        try {
          await apiClient.saveReadingProgress({
            textbookId: textbook.id,
            pageNumber: currentPage,
            timeSpent: readingTime
          })
        } catch (error) {
          console.error('Failed to save reading progress:', error)
        }
      }
      
      saveProgress()
    }
  }, [currentPage, textbook])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{textbook?.title || '교과서'}</h1>
                <p className="text-sm text-gray-600">페이지 {currentPage} / {textbook?.totalPages || 1}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden"
                >
                  {isSidebarOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBookmark}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon">
                <Volume2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="hidden md:inline-flex"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-1 border rounded-lg px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFontSizeChange(-2)}
                  className="h-8 w-8"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2">{fontSize}px</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFontSizeChange(2)}
                  className="h-8 w-8"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={textbook ? (currentPage / textbook.totalPages) * 100 : 0} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Textbook */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isSidebarOpen && !isMobile ? "w-1/2 lg:w-3/5" : "w-full"
        )}>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : currentPageData ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl mx-auto"
                >
                  <Card className="bg-white">
                    <CardContent className="p-6 lg:p-8">
                      <TextbookViewer
                        content={currentPageData.content}
                        imageUrl={currentPageData.imageUrl}
                        fontSize={fontSize}
                      />
                      
                      {/* Reading Time */}
                      <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>예상 읽기 시간: {Math.ceil((currentPageData.estimatedReadingTime || 180) / 60)}분</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>현재까지 {Math.floor(readingTime / 60)}분 {readingTime % 60}초 학습</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">페이지를 불러올 수 없습니다</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-shrink-0 bg-white border-t p-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">이전 페이지</span>
              </Button>
              
              <Button
                onClick={() => setShowQuestions(!showQuestions)}
                variant="outline"
                className="gap-2"
                disabled={!currentPageData?.questions?.length}
              >
                <HelpCircle className="w-4 h-4" />
                학습 문제 {currentPageData?.questions?.length || 0}개
              </Button>
              
              <Button
                onClick={handleNextPage}
                disabled={!textbook || currentPage === textbook.totalPages}
                className="gap-2"
              >
                <span className="hidden sm:inline">다음 페이지</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Tutor Chat */}
        <AnimatePresence>
          {(isSidebarOpen || !isMobile) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? '100%' : '40%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "border-l bg-white flex flex-col overflow-hidden",
                isMobile && "absolute inset-0 z-50"
              )}
            >
              <div className="flex-shrink-0 border-b p-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  AI 튜터
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    온라인
                  </Badge>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <AITutorChat
                  pageContent={currentPageData?.content || ''}
                  pageNumber={currentPage}
                  textbookTitle={textbook?.title || '교과서'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question Panel Modal */}
      <AnimatePresence>
        {showQuestions && currentPageData?.questions && (
          <QuestionPanel
            questions={currentPageData.questions as any}
            onClose={() => setShowQuestions(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}