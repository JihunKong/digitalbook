'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정 - use local worker to avoid CORS and version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';

interface PDFViewerProps {
  fileUrl: string;
  onPageChange?: (page: number) => void;
}

export default function PDFViewer({ fileUrl, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pre-fetch PDF with credentials and create blob URL
  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const fetchPDF = async () => {
      console.log('🔐 PDFViewer: Pre-fetching PDF with credentials');
      console.log('  - File URL:', fileUrl);

      setLoading(true);
      setError(null);

      try {
        // Fetch PDF with credentials (cookies)
        const response = await fetch(fileUrl, {
          credentials: 'include', // Send httpOnly cookies
          headers: {
            'Accept': 'application/pdf',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        // Convert response to blob
        const blob = await response.blob();
        console.log('✅ PDF fetched successfully, size:', blob.size, 'bytes');

        // Create blob URL
        const url = URL.createObjectURL(blob);
        currentBlobUrl = url;
        setBlobUrl(url);
        setLoading(false);
        console.log('✅ Blob URL created:', url);

      } catch (err) {
        console.error('❌ PDF fetch error:', err);
        setError(err instanceof Error ? err.message : 'PDF 파일을 불러올 수 없습니다.');
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup: revoke blob URL to free memory
    return () => {
      if (currentBlobUrl) {
        console.log('🧹 Cleaning up blob URL:', currentBlobUrl);
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    if (onPageChange) {
      onPageChange(pageNumber);
    }
  }, [pageNumber, onPageChange]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF 로드 오류:', error);
    setError('PDF 파일을 불러올 수 없습니다.');
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      if (newPage >= 1 && numPages && newPage <= numPages) {
        return newPage;
      }
      return prevPageNumber;
    });
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta;
      if (newScale >= 0.5 && newScale <= 2.0) {
        return newScale;
      }
      return prevScale;
    });
  };

  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            {pageNumber} / {numPages || '-'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeScale(-0.1)}
            disabled={scale <= 0.5 || loading}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeScale(0.1)}
            disabled={scale >= 2.0 || loading}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rotate}
            disabled={loading}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-4 bg-gray-100">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">PDF 로딩 중...</span>
          </div>
        )}

        {!loading && blobUrl && (
          <Document
            file={{ url: blobUrl }} // Use blob URL (no authentication needed)
            options={{
              cMapUrl: '/pdfjs/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: '/pdfjs/standard_fonts/',
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
