'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  onExtractText?: (text: string) => void
}

export function PDFViewer({ fileUrl, fileName, onExtractText }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1.0)

  // For now, use iframe as a simple PDF viewer
  // In production, you'd want to use react-pdf or PDF.js
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
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.min(2.0, scale + 0.1))}
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
        <div className="relative w-full h-[600px] border rounded-lg overflow-hidden">
          {/* Simple iframe-based PDF viewer */}
          <iframe
            src={`${fileUrl}#zoom=${Math.round(scale * 100)}`}
            className="w-full h-full"
            title={`PDF 뷰어: ${fileName}`}
          />
        </div>
        
        {/* PDF 페이지 네비게이션 (향후 react-pdf 구현시 사용) */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
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
            disabled={currentPage >= totalPages}
          >
            다음 페이지
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* 텍스트 추출 정보 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>팁:</strong> PDF에서 텍스트가 자동으로 추출되어 교재 내용으로 사용됩니다. 
            추출된 텍스트를 수정하려면 아래 텍스트 입력 영역에서 편집하세요.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}