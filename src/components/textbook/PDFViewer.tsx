'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Set worker for PDF.js - use local worker to avoid CORS and version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js'

interface PDFViewerProps {
  url?: string
  file?: File
  onPageChange?: (page: number) => void
  onTextExtracted?: (text: string) => void
  className?: string
}

export function PDFViewer({ 
  url, 
  file,
  onPageChange, 
  onTextExtracted,
  className = ''
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (onPageChange) {
      onPageChange(pageNumber)
    }
  }, [pageNumber, onPageChange])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF loading error:', error)
    setError('PDF 파일을 불러올 수 없습니다.')
    setIsLoading(false)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset
      if (newPage >= 1 && numPages && newPage <= numPages) {
        return newPage
      }
      return prevPageNumber
    })
  }

  function handleZoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0))
  }

  function handleZoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5))
  }

  function onPageLoadSuccess() {
    // Extract text from the current page if needed
    if (onTextExtracted && (url || file)) {
      // This would require additional implementation for text extraction
      // For now, we'll pass a placeholder
      onTextExtracted(`페이지 ${pageNumber} 내용`)
    }
  }

  const pdfSource = file || (url ? { url } : null)

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">
            {numPages ? `${pageNumber} / ${numPages} 페이지` : '로딩 중...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          {url && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={url} download>
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          {pdfSource && (
            <Document
              file={pdfSource}
              options={{
                cMapUrl: '/pdfjs/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: '/pdfjs/standard_fonts/',
              }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">PDF 로딩 중...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center text-red-600">
                    <p className="mb-2">PDF 로딩 실패</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
          {!pdfSource && (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">PDF 파일을 선택해주세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <Button
          variant="outline"
          onClick={() => changePage(-1)}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          이전
        </Button>
        
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              if (!isNaN(value) && value >= 1 && numPages && value <= numPages) {
                setPageNumber(value)
              }
            }}
            className="w-16 px-2 py-1 text-center border rounded"
            min="1"
            max={numPages || 1}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => changePage(1)}
          disabled={numPages !== null && pageNumber >= numPages}
        >
          다음
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  )
}