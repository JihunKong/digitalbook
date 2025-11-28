'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  onExtractText?: (text: string) => void
}

export function PDFViewer({ fileUrl, fileName, onExtractText }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [iframeError, setIframeError] = useState(false)
  const [useObjectTag, setUseObjectTag] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Pre-fetch PDF with credentials and create blob URL
  useEffect(() => {
    let currentBlobUrl: string | null = null

    const fetchPDF = async () => {
      console.log('🔐 PDFViewer: Pre-fetching PDF with credentials')
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

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`)
        }

        // Convert response to blob
        const blob = await response.blob()
        console.log('✅ PDF fetched successfully, size:', blob.size, 'bytes')

        // Create blob URL
        const url = URL.createObjectURL(blob)
        currentBlobUrl = url
        setBlobUrl(url)
        setLoading(false)
        console.log('✅ Blob URL created:', url)

      } catch (err) {
        console.error('❌ PDF fetch error:', err)
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

  // Handle iframe loading errors
  const handleIframeError = () => {
    console.warn('❌ Iframe failed to load PDF, trying object tag fallback')
    setIframeError(true)
    setUseObjectTag(true)
  }

  // Handle iframe load success
  const handleIframeLoad = () => {
    console.log('✅ PDF iframe loaded successfully')
    setIframeError(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">PDF 미리보기: {fileName}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              disabled={loading}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.min(2.0, scale + 0.1))}
              disabled={loading}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <Download className="w-4 h-4" />
              다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error alert */}
        {(iframeError || error) && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'PDF 미리보기에 문제가 발생했습니다. 다운로드 버튼을 사용하여 파일을 확인하세요.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">PDF 로딩 중...</span>
            </div>
          )}

          {!loading && blobUrl && (
            <>
              {!useObjectTag ? (
                /* Primary: iframe-based PDF viewer */
                <iframe
                  ref={iframeRef}
                  src={`${blobUrl}#zoom=${Math.round(scale * 100)}`}
                  className="w-full h-full"
                  title={`PDF 뷰어: ${fileName}`}
                  onError={handleIframeError}
                  onLoad={handleIframeLoad}
                  sandbox="allow-same-origin"
                />
              ) : (
                /* Fallback: object tag */
                <object
                  data={`${blobUrl}#zoom=${Math.round(scale * 100)}`}
                  type="application/pdf"
                  className="w-full h-full"
                  title={`PDF 뷰어: ${fileName}`}
                >
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium mb-2">PDF를 미리보기할 수 없습니다</p>
                    <p className="text-sm mb-4 text-center">
                      브라우저가 PDF 미리보기를 지원하지 않거나<br/>
                      보안 정책으로 인해 차단되었습니다.
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
                </object>
              )}
            </>
          )}
        </div>

        {/* PDF 페이지 네비게이션 (향후 react-pdf 구현시 사용) */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전 페이지
          </Button>

          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
          >
            다음 페이지
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* 텍스트 추출 정보 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ <strong>보안 PDF 뷰어</strong>: 이 뷰어는 쿠키 기반 인증을 사용하여 안전하게 PDF를 로드합니다.
            텍스트는 자동으로 추출되어 교재 내용으로 사용됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
