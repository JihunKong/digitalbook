'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  BookOpen,
  MessageCircle,
  Clock,
  Users,
  Download,
  Search,
  Navigation
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api'
import { PDFChatBot } from './PDFChatBot'
import { PageTracking } from './PageTracking'

interface PDFInfo {
  id: string
  filename: string
  totalPages: number
  status: string
  classId: string
}

interface PageContent {
  pageNumber: number
  text: string
  metadata?: any
}

interface StudentTracking {
  studentId: string
  pageNumber: number
  name?: string
}

interface EnhancedPDFViewerProps {
  pdfId: string
  classId?: string
  isTeacher?: boolean
  onPageChange?: (pageNumber: number) => void
  onTextExtract?: (text: string, pageNumber: number) => void
}

export function EnhancedPDFViewer({ 
  pdfId, 
  classId, 
  isTeacher = false,
  onPageChange,
  onTextExtract 
}: EnhancedPDFViewerProps) {
  // State management
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [studentTracking, setStudentTracking] = useState<StudentTracking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Refs
  const viewerRef = useRef<HTMLDivElement>(null)
  const pageStartTime = useRef<number>(Date.now())

  // Load PDF information
  useEffect(() => {
    loadPDFInfo()
  }, [pdfId])

  // Track page changes
  useEffect(() => {
    if (pdfInfo && currentPage > 0) {
      loadPageContent(currentPage)
      trackPageView(currentPage)
      pageStartTime.current = Date.now()
      onPageChange?.(currentPage)
    }
  }, [currentPage, pdfInfo])

  // Load real-time tracking for teachers
  useEffect(() => {
    if (isTeacher && pdfId) {
      const interval = setInterval(loadStudentTracking, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isTeacher, pdfId])

  const loadPDFInfo = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getPDFInfo(pdfId)
      
      if (response.error) {
        setError(response.error.message)
        return
      }

      const info = response.data
      setPdfInfo(info)
      setTotalPages(info.totalPages || 1)
      setError(null)
    } catch (err) {
      setError('PDF 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPageContent = async (pageNum: number) => {
    try {
      const response = await apiClient.getPDFPageContent(pdfId, pageNum)
      
      if (response.data) {
        setPageContent(response.data)
        onTextExtract?.(response.data.text, pageNum)
      }
    } catch (err) {
      console.error('페이지 내용 로드 실패:', err)
    }
  }

  const trackPageView = async (pageNum: number) => {
    try {
      await apiClient.trackPDFPageView(pdfId, pageNum)
    } catch (err) {
      console.error('페이지 추적 실패:', err)
    }
  }

  const loadStudentTracking = async () => {
    if (!isTeacher) return
    
    try {
      const response = await apiClient.getPDFTracking(pdfId)
      if (response.data) {
        setStudentTracking(response.data)
      }
    } catch (err) {
      console.error('학생 추적 로드 실패:', err)
    }
  }

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }, [totalPages])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await apiClient.searchPDF(pdfId, searchQuery)
      setSearchResults(response.data || [])
    } catch (err) {
      console.error('검색 실패:', err)
    }
  }

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
      const newScale = direction === 'in' 
        ? Math.min(2.0, prev + 0.1)
        : Math.max(0.5, prev - 0.1)
      return newScale
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 animate-pulse mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">PDF를 불러오는 중...</p>
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">오류 발생</p>
          <p>{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main PDF Viewer */}
      <div className="lg:col-span-3">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CardTitle className="text-lg">
                  📖 {pdfInfo?.filename}
                </CardTitle>
                <Badge variant={pdfInfo?.status === 'completed' ? 'default' : 'secondary'}>
                  {pdfInfo?.status === 'completed' ? '처리 완료' : '처리 중'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="PDF 내 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="px-2 py-1 text-sm border rounded"
                  />
                  <Button variant="outline" size="sm" onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Zoom Controls */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('out')}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('in')}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                {/* Chat Toggle */}
                <Button
                  variant={showChat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="w-4 h-4" />
                  AI 코칭
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/pdf/${pdfId}/download`, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="relative">
              {/* PDF Display Area */}
              <div 
                ref={viewerRef}
                className="w-full h-[600px] border rounded-lg overflow-auto bg-gray-50 relative"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                {/* Enhanced PDF viewer with page content */}
                <div className="p-8 bg-white min-h-full">
                  {pageContent ? (
                    <div className="prose max-w-none">
                      <h2 className="text-xl font-bold mb-4">
                        페이지 {currentPage}
                      </h2>
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {pageContent.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4" />
                        <p>페이지 내용을 불러오는 중...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">
                    페이지 {currentPage} / {totalPages}
                  </span>
                  
                  {/* Page Input */}
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page)
                      }
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded text-center"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">🔍 검색 결과 ({searchResults.length}개)</h4>
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                        onClick={() => handlePageChange(result.pageNumber)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            페이지 {result.pageNumber}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Navigation className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{result.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* Teacher: Student Tracking */}
        {isTeacher && (
          <PageTracking 
            studentTracking={studentTracking}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        )}

        {/* AI Chatbot */}
        {showChat && (
          <PDFChatBot 
            pdfId={pdfId}
            currentPage={currentPage}
            pageContent={pageContent?.text}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Page Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              페이지 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>현재 페이지:</span>
              <span className="font-medium">{currentPage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>전체 페이지:</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>진행률:</span>
              <span className="font-medium">
                {Math.round((currentPage / totalPages) * 100)}%
              </span>
            </div>
            <Separator />
            <div className="text-xs text-gray-500">
              💡 이 페이지에서 AI 코칭을 받으려면 우상단의 'AI 코칭' 버튼을 클릭하세요.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}