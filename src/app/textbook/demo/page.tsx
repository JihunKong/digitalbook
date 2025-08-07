'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ClientOnly } from '@/components/ClientOnly'
import { useTTS } from '@/hooks/useTTS'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Home,
  PenTool,
  Users,
  Volume2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Dynamic imports for client-only components
const AITutor = dynamic(
  () => import('@/components/textbook/AITutor').then(mod => mod.AITutor),
  { ssr: false }
)

const StudyActivity = dynamic(
  () => import('@/components/textbook/StudyActivity').then(mod => mod.StudyActivity),
  { ssr: false }
)

const GroupActivity = dynamic(
  () => import('@/components/textbook/GroupActivity').then(mod => mod.GroupActivity),
  { ssr: false }
)

interface TextbookContent {
  page: number
  title: string
  content: string
}

interface TextbookMetadata {
  id: string
  title: string
  chapter: string
  author: string
  grade: string
  subject: string
  description: string
  learningObjectives: string[]
  contents: TextbookContent[]
}

interface CoachingQuestion {
  level: string
  question: string
  hint?: string
}

interface PageEmbeddings {
  page: number
  title: string
  chunks: any[]
}

interface EmbeddingsData {
  textbookId: string
  pageEmbeddings: PageEmbeddings[]
  coachingQuestions: {
    byPage: Record<string, CoachingQuestion[]>
  }
}

export default function TextbookDemoPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [textbookData, setTextbookData] = useState<TextbookMetadata | null>(null)
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData | null>(null)
  const [currentContent, setCurrentContent] = useState<TextbookContent | null>(null)
  const [currentPageQuestions, setCurrentPageQuestions] = useState<CoachingQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('textbook')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { speak: speakTTS, stop: stopTTS, isLoading: isTTSLoading } = useTTS()
  
  // 학생 정보 (데모용)
  const studentInfo = {
    name: '홍길동',
    studentId: 'demo-student',
    classCode: 'DEMO01'
  }

  useEffect(() => {
    // 미리 저장된 교과서 데이터 로드
    const loadTextbookData = async () => {
      try {
        // 메타데이터 로드
        const metadataResponse = await fetch('/textbooks/korean-5-metadata.json')
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json()
          setTextbookData(metadata)
          setCurrentContent(metadata.contents[0])
        }

        // 임베딩 및 코칭 질문 로드
        const embeddingsResponse = await fetch('/textbooks/korean-5-embeddings.json')
        if (embeddingsResponse.ok) {
          const embeddings = await embeddingsResponse.json()
          setEmbeddingsData(embeddings)
          // 첫 페이지 코칭 질문 설정
          const pageQuestions = embeddings.coachingQuestions.byPage['1'] || []
          setCurrentPageQuestions(pageQuestions)
        }
      } catch (error) {
        console.error('Failed to load textbook data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTextbookData()
  }, [])

  const handlePageChange = (newPage: number) => {
    if (!textbookData) return
    
    const pageIndex = newPage - 1
    if (pageIndex >= 0 && pageIndex < textbookData.contents.length) {
      setCurrentPage(newPage)
      setCurrentContent(textbookData.contents[pageIndex])
      
      // 해당 페이지의 코칭 질문 업데이트
      if (embeddingsData) {
        const pageQuestions = embeddingsData.coachingQuestions.byPage[String(newPage)] || []
        setCurrentPageQuestions(pageQuestions)
      }
    }
  }

  const handleTTS = async () => {
    if (isSpeaking) {
      stopTTS()
      setIsSpeaking(false)
    } else {
      const textContent = currentContent?.content || ''
      if (!textContent) {
        alert('읽을 내용이 없습니다.')
        return
      }

      setIsSpeaking(true)
      
      try {
        // Use OpenAI TTS with Korean-optimized settings
        await speakTTS(textContent, {
          voice: 'shimmer',  // Better for Korean
          model: 'tts-1',    // Standard quality (tts-1-hd may not be available)
          speed: 0.9,        // Slightly slower for clarity
          language: 'ko',
          autoPlay: true
        })
      } catch (error) {
        console.error('TTS error:', error)
        // Browser TTS will be used as fallback automatically
      } finally {
        setIsSpeaking(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  홈
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold">디지털 교과서 학습</h1>
              </div>
            </div>
            {textbookData && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {textbookData.grade}
                </Badge>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {textbookData.subject}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Textbook Content Section with Tabs - 70% */}
        <div className="lg:w-[70%] p-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="space-y-1">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-base">{textbookData?.title || '교과서'}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    {currentPage} / {textbookData?.contents.length || 0} 페이지
                  </Badge>
                </CardTitle>
                {textbookData && (
                  <p className="text-xs text-gray-600">
                    {textbookData.chapter}
                  </p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <ClientOnly
                fallback={
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">교과서를 불러오는 중...</p>
                    </div>
                  </div>
                }
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between border-b px-4">
                    <TabsList className="h-12 bg-transparent border-0">
                      <TabsTrigger value="textbook" className="data-[state=active]:bg-white">
                        <BookOpen className="w-4 h-4 mr-2" />
                        교재 보기
                      </TabsTrigger>
                      <TabsTrigger value="activity" className="data-[state=active]:bg-white">
                        <PenTool className="w-4 h-4 mr-2" />
                        학습활동
                      </TabsTrigger>
                      <TabsTrigger value="group" className="data-[state=active]:bg-white">
                        <Users className="w-4 h-4 mr-2" />
                        모둠활동
                      </TabsTrigger>
                    </TabsList>
                    
                    {activeTab === 'textbook' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTTS}
                        className="ml-2"
                        disabled={isTTSLoading}
                        title={isSpeaking ? '읽기 중지' : '음성으로 읽기'}
                      >
                        {isTTSLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            생성 중...
                          </>
                        ) : isSpeaking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            중지
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-1" />
                            읽기
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="textbook" className="h-full m-0 overflow-hidden">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">교과서를 불러오는 중...</p>
                          </div>
                        </div>
                      ) : currentContent ? (
                        <div className="h-full flex flex-col">
                          {/* Content Area */}
                          <div className="flex-1 overflow-y-auto p-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">
                              {currentContent.title}
                            </h2>
                            <div className="prose prose-lg max-w-none">
                              {currentContent.content.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                          
                          {/* Navigation */}
                          <div className="border-t px-6 py-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                이전 페이지
                              </Button>
                              
                              <div className="flex items-center gap-2">
                                {textbookData?.contents.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handlePageChange(idx + 1)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                      currentPage === idx + 1
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    aria-label={`${idx + 1} 페이지로 이동`}
                                  />
                                ))}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === textbookData?.contents.length}
                              >
                                다음 페이지
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">교과서 데이터를 불러올 수 없습니다.</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="activity" className="h-full m-0 overflow-hidden">
                      <StudyActivity 
                        pageNumber={currentPage}
                        studentId={studentInfo.studentId}
                        classCode={studentInfo.classCode}
                        studentName={studentInfo.name}
                      />
                    </TabsContent>
                    
                    <TabsContent value="group" className="h-full m-0 overflow-hidden">
                      <GroupActivity 
                        groupId={`${studentInfo.classCode}-group1`}
                        studentName={studentInfo.name}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </ClientOnly>
            </CardContent>
          </Card>
        </div>

        {/* AI Tutor Section - 30% */}
        <div className="lg:w-[30%] p-4 pl-0">
          <ClientOnly
            fallback={
              <Card className="h-full flex items-center justify-center">
                <CardContent>
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </CardContent>
              </Card>
            }
          >
            <AITutor
              context={currentContent?.content || ''}
              pageNumber={currentPage}
              subject={textbookData?.subject || '국어'}
              pageQuestions={currentPageQuestions}
              className="h-full"
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  )
}