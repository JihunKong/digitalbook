'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'react-pdf/dist/Page/TextLayer.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react'

// Dynamic import for PDF.js components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(mod => ({ default: mod.Document })),
  { ssr: false }
)

const Page = dynamic(
  () => import('react-pdf').then(mod => ({ default: mod.Page })),
  { ssr: false }
)

// Configure PDF.js worker (client-side only)
if (typeof window !== 'undefined') {
  import('react-pdf').then((mod) => {
    // Use local worker to avoid CORS and ensure version match
    mod.pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js'
  })
}

interface SecurePDFViewerProps {
  fileUrl: string
  fileName: string
  onExtractText?: (text: string) => void
  onPageChange?: (pageNumber: number) => void
  initialPage?: number
  showControls?: boolean
  onLoadSuccess?: () => void
}

export function SecurePDFViewer({
  fileUrl,
  fileName,
  onExtractText,
  onPageChange,
  initialPage = 1,
  showControls = true,
  onLoadSuccess
}: SecurePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(initialPage)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  // Pre-fetch PDF with credentials and create blob URL
  useEffect(() => {
    let currentBlobUrl: string | null = null

    const fetchPDF = async () => {
      console.log('🔐 SecurePDFViewer: Pre-fetching PDF with credentials')
      console.log('  - File URL:', fileUrl)
      console.log('  - File Name:', fileName)

      setLoading(true)
      setError(null)

      try {
        // Fetch PDF with credentials (cookies)
        const response = await fetch(fileUrl, {
          credentials: 'include', // Send httpOnly cookies
          headers: {
            'Accept': 'application/pdf',
          }
        })

        console.log('📡 PDF fetch response:', {
          url: fileUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType: response.headers.get('content-type')
        })

        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `Failed to load PDF: ${response.status} ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
            console.error('📡 Error response body:', errorData)
          } catch {
            // Response wasn't JSON, use status text
          }

          throw new Error(errorMessage)
        }

        // Convert response to blob
        const blob = await response.blob()
        console.log('✅ PDF fetched successfully:', {
          size: blob.size,
          type: blob.type,
          sizeKB: (blob.size / 1024).toFixed(2)
        })

        // Create blob URL
        const url = URL.createObjectURL(blob)
        currentBlobUrl = url
        setBlobUrl(url)
        console.log('✅ Blob URL created:', url)

      } catch (err) {
        console.error('❌ PDF fetch error:', {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          fileUrl,
          fileName
        })
        setError(err instanceof Error ? err.message : 'PDF 파일을 불러오는 중 문제가 발생했습니다.')
        setLoading(false)
      }
    }

    fetchPDF()

    // Cleanup: revoke blob URL to free memory
    return () => {
      if (currentBlobUrl) {
        console.log('🧹 Cleaning up blob URL:', currentBlobUrl)
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [fileUrl, fileName])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    console.log('✅ PDF loaded successfully with', numPages, 'pages')
    onLoadSuccess?.()
  }, [onLoadSuccess])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error)
    setError('PDF 파일을 불러오는 중 문제가 발생했습니다.')
    setLoading(false)
  }, [])

  const onPageLoadError = useCallback((error: Error) => {
    console.error('❌ PDF page load error:', error)
    setError('PDF 페이지를 렌더링하는 중 문제가 발생했습니다.')
  }, [])

  const goToPrevPage = () => {
    setPageNumber(page => {
      const newPage = Math.max(1, page - 1)
      onPageChange?.(newPage)
      return newPage
    })
  }

  const goToNextPage = () => {
    setPageNumber(page => {
      const newPage = Math.min(numPages, page + 1)
      onPageChange?.(newPage)
      return newPage
    })
  }

  // External page change support
  useEffect(() => {
    if (initialPage !== pageNumber && initialPage >= 1 && initialPage <= numPages) {
      setPageNumber(initialPage)
    }
  }, [initialPage, numPages])

  const zoomIn = () => {
    setScale(scale => Math.min(3.0, scale + 0.2))
  }

  const zoomOut = () => {
    setScale(scale => Math.max(0.5, scale - 0.2))
  }

  return (
    <Card className="w-full">
      {showControls && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">PDF 미리보기: {fileName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                <Download className="w-4 h-4" />
                다운로드
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center">
          <div className="relative border rounded-lg overflow-auto bg-white p-4 pdf-viewer-container" style={{ maxHeight: '600px' }}>
            {/* CSS to fix PDF black text rendering issues */}
            <style jsx>{`
              .pdf-viewer-container canvas {
                /* Ensure PDF canvas renders with proper colors and contrast */
                filter: contrast(1) brightness(1) !important;
                opacity: 1 !important;
                mix-blend-mode: normal !important;
                background: white !important;
              }
              .pdf-viewer-container .react-pdf__Page {
                /* Fix page background */
                background: white !important;
              }
              .pdf-viewer-container .react-pdf__Page__canvas {
                /* Prevent canvas filtering issues that cause black text to disappear */
                filter: none !important;
                -webkit-filter: none !important;
                image-rendering: auto !important;
              }
              .pdf-viewer-container .react-pdf__Page__textContent {
                /* Ensure text layer visibility */
                color: black !important;
                opacity: 1 !important;
                mix-blend-mode: normal !important;
              }
              .pdf-viewer-container .react-pdf__Page__textContent .textLayer {
                color: black !important;
              }
            `}</style>

            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">PDF 로딩 중...</span>
              </div>
            )}

            {blobUrl && (
              <Document
                file={{
                  url: blobUrl, // Use blob URL (no authentication needed)
                }}
                options={{
                  cMapUrl: '/pdfjs/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: '/pdfjs/standard_fonts/',
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error={
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium mb-2">PDF를 불러올 수 없습니다</p>
                    <p className="text-sm mb-4 text-center">
                      파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(fileUrl, '_blank')}
                      className="mb-2"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      새 탭에서 열기
                    </Button>
                  </div>
                }
              >
                {numPages > 0 && (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadError={onPageLoadError}
                    renderTextLayer={true} // Enable text layer for better text visibility
                    renderAnnotationLayer={false} // Disable annotations to avoid conflicts
                    loading={
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    }
                  />
                )}
              </Document>
            )}
          </div>

          {/* Page Navigation */}
          {showControls && numPages > 1 && (
            <div className="flex items-center justify-between mt-4 gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>

              <span className="text-sm text-gray-600 font-medium">
                {pageNumber} / {numPages} 페이지
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ <strong>보안 PDF 뷰어</strong>: 이 뷰어는 쿠키 기반 인증을 사용하여 안전하게 PDF를 로드합니다.
            텍스트는 자동으로 추출되어 교재 생성에 사용됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
