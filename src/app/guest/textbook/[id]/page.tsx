'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Home,
  Menu,
  X,
  Maximize,
  Minimize,
  MessageCircle,
  HelpCircle,
  Volume2,
  ZoomIn,
  ZoomOut,
  Eye,
  List
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface TextbookPage {
  pageNumber: number
  title: string
  content: string
  imageUrl?: string
  audioUrl?: string
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
  grade: number
  teacher: string
  totalPages: number
  pages: TextbookPage[]
}

export default function GuestTextbookViewerPage() {
  const params = useParams()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [guestInfo, setGuestInfo] = useState<any>(null)
  const [textbook, setTextbook] = useState<Textbook | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTextbook()
  }, [params?.id])

  const fetchTextbook = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/textbooks/${params?.id || '1'}/public`)
      if (response.ok) {
        const data = await response.json()
        setTextbook(data)
      } else {
        console.error('Failed to fetch textbook')
        setTextbook(getSampleTextbook())
      }
    } catch (error) {
      console.error('Error fetching textbook:', error)
      setTextbook(getSampleTextbook())
    } finally {
      setIsLoading(false)
    }
  }

  // 샘플 교과서 데이터 (fallback)
  const getSampleTextbook = (): Textbook => ({
    id: params?.id as string || '1',
    title: '재미있는 국어 여행',
    subject: '국어',
    grade: 3,
    teacher: '김선생님',
    totalPages: 5,
    pages: [
      {
        pageNumber: 1,
        title: '1장. 우리말의 아름다움',
        content: `우리말은 세계에서 가장 과학적이고 아름다운 언어 중 하나입니다.

한글은 1443년 세종대왕께서 창제하신 문자로, 백성들이 쉽게 익혀 사용할 수 있도록 만들어졌습니다. 한글의 자음과 모음은 발음기관의 모양을 본떠 만들어졌으며, 이는 매우 과학적인 원리입니다.

우리말의 특징:
• 다양한 높임법과 존댓말
• 풍부한 의성어와 의태어
• 섬세한 감정 표현

오늘은 우리말의 아름다움에 대해 함께 알아보겠습니다.`,
        imageUrl: '/images/korean-beauty.jpg',
        quiz: {
          question: '한글을 창제하신 분은 누구일까요?',
          options: ['세종대왕', '이순신', '김구', '안중근'],
          correctIndex: 0
        }
      },
      {
        pageNumber: 2,
        title: '2장. 의성어와 의태어',
        content: `의성어는 소리를 흉내 낸 말이고, 의태어는 모양이나 움직임을 흉내 낸 말입니다.

의성어 예시:
• 멍멍 - 개가 짖는 소리
• 야옹 - 고양이 울음소리
• 딩동 - 초인종 소리
• 쨍그랑 - 유리가 깨지는 소리

의태어 예시:
• 살금살금 - 조심스럽게 걷는 모양
• 반짝반짝 - 빛이 나는 모양
• 출렁출렁 - 물결이 움직이는 모양
• 둥실둥실 - 가볍게 떠다니는 모양

이러한 의성어와 의태어는 우리말을 더욱 생생하고 재미있게 만들어줍니다.`,
        quiz: {
          question: '다음 중 의성어는 무엇일까요?',
          options: ['살금살금', '반짝반짝', '멍멍', '출렁출렁'],
          correctIndex: 2
        }
      },
      {
        pageNumber: 3,
        title: '3장. 높임법 배우기',
        content: `우리말에는 상대방을 존중하는 높임법이 있습니다.

주체 높임법:
• 선생님께서 오셨습니다.
• 할머니께서 주무십니다.

상대 높임법:
• 해요체: 밥 먹어요?
• 합쇼체: 밥 드셨습니까?

객체 높임법:
• 선생님께 드렸어요.
• 부모님을 모시고 갔어요.

높임법을 올바르게 사용하면 예의 바른 사람이 될 수 있습니다.`,
        quiz: {
          question: '다음 중 주체 높임법이 사용된 문장은?',
          options: [
            '친구가 왔어요',
            '선생님께서 오셨어요',
            '동생이 밥을 먹어요',
            '강아지가 짖어요'
          ],
          correctIndex: 1
        }
      },
      {
        pageNumber: 4,
        title: '4장. 속담과 관용어',
        content: `속담과 관용어는 오랜 세월 동안 전해 내려온 지혜가 담긴 표현입니다.

자주 쓰는 속담:
• 가는 말이 고와야 오는 말이 곱다
  → 남에게 좋은 말을 해야 좋은 말을 듣는다
• 백지장도 맞들면 낫다
  → 아무리 쉬운 일도 혼자보다는 여럿이 하면 더 쉽다
• 우물 안 개구리
  → 견문이 좁은 사람

관용어 예시:
• 발이 넓다 → 아는 사람이 많다
• 귀가 얇다 → 남의 말을 쉽게 믿는다
• 손이 크다 → 씀씀이가 크다

속담과 관용어를 알면 우리말을 더 풍부하게 사용할 수 있습니다.`,
        quiz: {
          question: '"발이 넓다"의 의미는 무엇일까요?',
          options: [
            '발 크기가 크다',
            '아는 사람이 많다',
            '걸음이 빠르다',
            '신발이 많다'
          ],
          correctIndex: 1
        }
      },
      {
        pageNumber: 5,
        title: '5장. 정리하기',
        content: `오늘 배운 내용을 정리해봅시다.

1. 우리말의 특징
   - 과학적인 한글
   - 다양한 높임법
   - 풍부한 표현

2. 의성어와 의태어
   - 소리를 흉내 낸 말
   - 모양을 흉내 낸 말

3. 높임법
   - 주체 높임법
   - 상대 높임법
   - 객체 높임법

4. 속담과 관용어
   - 삶의 지혜가 담긴 표현
   - 우리말을 풍부하게 만드는 요소

우리말을 사랑하고 올바르게 사용하는 것은 우리 문화를 지키는 일입니다. 
앞으로도 아름다운 우리말을 잘 가꾸어 나가길 바랍니다.`,
        quiz: {
          question: '오늘 배운 내용 중 한글의 특징은?',
          options: [
            '복잡하고 어렵다',
            '과학적이고 체계적이다',
            '외국에서 만들어졌다',
            '최근에 만들어졌다'
          ],
          correctIndex: 1
        }
      }
    ]
  })

  useEffect(() => {
    // sample 경로인 경우 고급 교과서로 리디렉션
    if (params?.id === 'sample') {
      router.push('/textbook/demo')
      return
    }
    
    // demo 경로인 경우 게스트 정보 체크 건너뛰기
    if (params?.id === 'demo') {
      setGuestInfo({
        studentName: '체험 사용자',
        studentId: 'DEMO',
        isDemo: true
      })
      return
    }
    
    // 일반 게스트 접근 시 정보 확인
    const storedGuestInfo = localStorage.getItem('guestInfo')
    if (!storedGuestInfo) {
      router.push('/guest')
      return
    }
    setGuestInfo(JSON.parse(storedGuestInfo))
  }, [router, params?.id])

  // Loading state
  if (isLoading || !textbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">교과서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const currentPageData = textbook.pages[currentPage - 1]
  const progress = (currentPage / textbook.totalPages) * 100

  const handleNextPage = () => {
    if (currentPage < textbook.totalPages) {
      setCurrentPage(currentPage + 1)
      setShowQuiz(false)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setShowQuiz(false)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleQuizSubmit = () => {
    if (selectedAnswer !== null) {
      setShowResult(true)
    }
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

  if (!guestInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Link href="/guest">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  나가기
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{textbook.title}</h1>
                <p className="text-sm text-gray-600">
                  {guestInfo.studentName} ({guestInfo.studentId})
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">{fontSize}px</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(showSidebar || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed lg:relative w-72 h-[calc(100vh-4rem)] bg-white border-r z-10"
            >
              <div className="p-4">
                <h2 className="font-semibold mb-4">목차</h2>
                <div className="space-y-2">
                  {textbook.pages.map((page) => (
                    <button
                      key={page.pageNumber}
                      onClick={() => {
                        setCurrentPage(page.pageNumber)
                        setShowSidebar(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        currentPage === page.pageNumber
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{page.pageNumber}</span>
                        <span className="text-sm font-medium">{page.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">학습 진도</span>
                <span className="text-sm font-medium">
                  {currentPage} / {textbook.totalPages} 페이지
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Content Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{currentPageData.title}</CardTitle>
                <CardDescription>
                  {textbook.subject} • {textbook.grade}학년 • {textbook.teacher}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                >
                  <div className="whitespace-pre-wrap">{currentPageData.content}</div>
                </div>

                {currentPageData.imageUrl && (
                  <div className="mt-6">
                    <img
                      src={currentPageData.imageUrl}
                      alt={currentPageData.title}
                      className="rounded-lg w-full"
                    />
                  </div>
                )}

                {/* Quiz Section */}
                {currentPageData.quiz && (
                  <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">학습 확인</h3>
                    </div>
                    
                    {!showQuiz ? (
                      <Button onClick={() => setShowQuiz(true)}>
                        문제 풀어보기
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-medium">{currentPageData.quiz.question}</p>
                        <div className="space-y-2">
                          {currentPageData.quiz.options.map((option, index) => (
                            <label
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedAnswer === index
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 hover:bg-gray-50'
                              } ${
                                showResult && index === currentPageData.quiz!.correctIndex
                                  ? 'border-green-500 bg-green-100'
                                  : ''
                              } ${
                                showResult && selectedAnswer === index && index !== currentPageData.quiz!.correctIndex
                                  ? 'border-red-500 bg-red-100'
                                  : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="quiz"
                                value={index}
                                checked={selectedAnswer === index}
                                onChange={() => setSelectedAnswer(index)}
                                disabled={showResult}
                                className="w-4 h-4"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                        
                        {!showResult ? (
                          <Button 
                            onClick={handleQuizSubmit}
                            disabled={selectedAnswer === null}
                          >
                            정답 확인
                          </Button>
                        ) : (
                          <div className={`p-4 rounded-lg ${
                            selectedAnswer === currentPageData.quiz.correctIndex
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedAnswer === currentPageData.quiz.correctIndex
                              ? '🎉 정답입니다!'
                              : '❌ 틀렸습니다. 다시 한번 생각해보세요.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전 페이지
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === textbook.totalPages}
              >
                다음 페이지
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Completion Message */}
            {currentPage === textbook.totalPages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-green-50 rounded-lg text-center"
              >
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  🎊 학습을 완료했습니다!
                </h3>
                <p className="text-green-700">
                  {textbook.title}의 모든 내용을 학습했습니다. 수고하셨습니다!
                </p>
                <Link href="/guest">
                  <Button className="mt-4">
                    처음으로 돌아가기
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}