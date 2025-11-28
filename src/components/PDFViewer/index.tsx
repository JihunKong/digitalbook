'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ActivityPanel from './ActivityPanel';
import ProgressTracker from './ProgressTracker';
import { usePDFTracking } from '@/hooks/usePDFTracking';

// Configure PDF.js worker - use local worker to avoid CORS and version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';

interface PDFViewerProps {
  pdfUrl: string;
  pdfId: string;
  classId: string;
  activities?: Activity[];
  isStudent?: boolean;
  onPageChange?: (pageNumber: number) => void;
  onActivitySubmit?: (activityId: string, answers: any) => void;
}

interface Activity {
  id: string;
  title: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'essay';
  questions: any[];
  pageNumber?: number;
}

export default function PDFViewer({
  pdfUrl,
  pdfId,
  classId,
  activities = [],
  isStudent = false,
  onPageChange,
  onActivitySubmit
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivityPanel, setShowActivityPanel] = useState<boolean>(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Custom hook for PDF page tracking
  const { trackPageView, getCurrentTracking } = usePDFTracking(pdfId);

  // Pre-fetch PDF with credentials and create blob URL
  useEffect(() => {
    if (!pdfUrl) {
      setBlobUrl(null);
      return;
    }

    let currentBlobUrl: string | null = null;

    const fetchPDF = async () => {
      console.log('🔐 PDFViewer/index: Pre-fetching PDF with credentials');
      console.log('  - PDF URL:', pdfUrl);

      setIsLoading(true);
      setError(null);

      try {
        // Fetch PDF with credentials (cookies)
        const response = await fetch(pdfUrl, {
          credentials: 'include', // Send httpOnly cookies
          headers: {
            'Accept': 'application/pdf',
          }
        });

        console.log('📡 PDF fetch response:', {
          url: pdfUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          let errorMessage = `Failed to load PDF: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // Response wasn't JSON
          }
          throw new Error(errorMessage);
        }

        // Convert response to blob
        const blob = await response.blob();
        console.log('✅ PDF fetched successfully:', {
          size: blob.size,
          type: blob.type,
          sizeKB: (blob.size / 1024).toFixed(2)
        });

        // Create blob URL
        const url = URL.createObjectURL(blob);
        currentBlobUrl = url;
        setBlobUrl(url);
        console.log('✅ Blob URL created:', url);

      } catch (err) {
        console.error('❌ PDF fetch error:', err);
        setError(err instanceof Error ? err.message : 'PDF 파일을 불러오는 중 문제가 발생했습니다.');
        setIsLoading(false);
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
  }, [pdfUrl]);

  // Get activities for current page
  const currentPageActivities = activities.filter(
    activity => activity.pageNumber === pageNumber
  );

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error);
    setError('PDF를 불러오는데 실패했습니다. 파일이 손상되었거나 접근할 수 없습니다.');
    setIsLoading(false);
  }, []);

  const handlePageChange = useCallback((newPageNumber: number) => {
    if (newPageNumber >= 1 && newPageNumber <= (numPages || 1)) {
      setPageNumber(newPageNumber);
      
      // Track page view for students
      if (isStudent) {
        trackPageView(newPageNumber);
      }
      
      // Notify parent component
      onPageChange?.(newPageNumber);
    }
  }, [numPages, isStudent, trackPageView, onPageChange]);

  const handlePreviousPage = useCallback(() => {
    handlePageChange(pageNumber - 1);
  }, [pageNumber, handlePageChange]);

  const handleNextPage = useCallback(() => {
    handlePageChange(pageNumber + 1);
  }, [pageNumber, handlePageChange]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handleActivitySubmit = useCallback((activityId: string, answers: any) => {
    onActivitySubmit?.(activityId, answers);
  }, [onActivitySubmit]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle keyboard events when typing
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          handlePreviousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          handleNextPage();
          break;
        case '=':
        case '+':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousPage, handleNextPage, handleZoomIn, handleZoomOut, toggleFullscreen, isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <Card className="flex items-center justify-center h-96 text-center">
        <div className="text-red-500">
          <p className="text-lg font-semibold mb-2">PDF 로딩 오류</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* PDF Viewer Panel */}
      <div className={`flex flex-col ${showActivityPanel && !isFullscreen ? 'w-2/3' : 'w-full'}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              {pageNumber} / {numPages || 0}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pageNumber >= (numPages || 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            {!isFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivityPanel(!showActivityPanel)}
              >
                {showActivityPanel ? '활동 숨기기' : '활동 보기'}
              </Button>
            )}
          </div>
        </div>

        {/* PDF Document */}
        <ScrollArea className="flex-1">
          <div className="flex justify-center p-4">
            {/* Loading state while fetching PDF */}
            {isLoading && !blobUrl && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>PDF를 불러오는 중...</p>
                </div>
              </div>
            )}

            {/* PDF Document - only render when blob URL is ready */}
            {blobUrl && (
              <Document
                file={{ url: blobUrl }}
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p>PDF를 렌더링하는 중...</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </div>
        </ScrollArea>

        {/* Progress Tracker */}
        {isStudent && !isFullscreen && (
          <ProgressTracker
            currentPage={pageNumber}
            totalPages={numPages || 0}
            completedActivities={currentPageActivities.length}
          />
        )}
      </div>

      {/* Activity Panel */}
      {showActivityPanel && !isFullscreen && (
        <>
          <Separator orientation="vertical" />
          <div className="w-1/3 border-l">
            <ActivityPanel
              activities={currentPageActivities}
              isStudent={isStudent}
              onActivitySubmit={handleActivitySubmit}
              currentPage={pageNumber}
            />
          </div>
        </>
      )}
    </div>
  );
}