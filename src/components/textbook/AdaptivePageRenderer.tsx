'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PDFViewer } from '@/components/multimedia/PDFViewer';
import { PageChatbot } from '../chat/PageChatbot';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File as FileIcon,
  Clock,
  BookOpen,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize
} from 'lucide-react';

export interface PageContent {
  id: string;
  pageNumber: number;
  title?: string;
  contentType: 'TEXT' | 'FILE' | 'MIXED';
  textContent?: string;
  file?: {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    extractedText?: string;
  };
  metadata?: {
    estimatedReadTime?: number;
    wordCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    section?: string;
  };
}

interface AdaptivePageRendererProps {
  page: PageContent;
  textbookId: string;
  onNavigate?: (direction: 'prev' | 'next') => void;
  showNavigation?: boolean;
  showChatbot?: boolean;
  className?: string;
}

export function AdaptivePageRenderer({
  page,
  textbookId,
  onNavigate,
  showNavigation = true,
  showChatbot = true,
  className = ''
}: AdaptivePageRendererProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // 콘텐츠 타입에 따른 아이콘 선택
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return <FileText className="w-5 h-5" />;
      case 'FILE': return <FileIcon className="w-5 h-5" />;
      case 'MIXED': return <BookOpen className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // 파일 타입에 따른 아이콘 선택
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  // 난이도에 따른 색상
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 텍스트 콘텐츠 렌더링
  const renderTextContent = (content: string) => (
    <ScrollArea className="h-full">
      <div className="prose prose-sm max-w-none p-6">
        <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
          {content}
        </div>
      </div>
    </ScrollArea>
  );

  // 파일 콘텐츠 렌더링
  const renderFileContent = (file: PageContent['file']) => {
    if (!file) return null;

    switch (file.mimeType) {
      case 'application/pdf':
        return (
          <PDFViewer
            fileUrl={file.url}
            fileName={file.name}
            onExtractText={() => {}} // 이미 추출된 텍스트가 있으므로 빈 함수
          />
        );
        
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return (
          <div className="flex justify-center p-6">
            <img 
              src={file.url} 
              alt={file.name}
              className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
            />
          </div>
        );
        
      case 'video/mp4':
      case 'video/webm':
        return (
          <div className="flex justify-center p-6">
            <video 
              controls 
              className="max-w-full max-h-96 rounded-lg shadow-md"
              preload="metadata"
            >
              <source src={file.url} type={file.mimeType} />
              이 브라우저는 비디오를 지원하지 않습니다.
            </video>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <FileIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">{file.name}</p>
            <p className="text-sm">{file.mimeType}</p>
            <Button variant="outline" className="mt-4" asChild>
              <a href={file.url} download={file.name}>
                파일 다운로드
              </a>
            </Button>
          </div>
        );
    }
  };

  // 혼합 콘텐츠 렌더링
  const renderMixedContent = (textContent?: string, file?: PageContent['file']) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="content" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          텍스트
        </TabsTrigger>
        <TabsTrigger value="file" className="flex items-center gap-2">
          {file && getFileIcon(file.mimeType)}
          {file?.name || '파일'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="h-full mt-4">
        {textContent ? renderTextContent(textContent) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            텍스트 콘텐츠가 없습니다.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="file" className="h-full mt-4">
        {file ? renderFileContent(file) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            파일이 없습니다.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  // 메인 콘텐츠 렌더링
  const renderMainContent = () => {
    switch (page.contentType) {
      case 'TEXT':
        return page.textContent ? 
          renderTextContent(page.textContent) : 
          <div className="flex items-center justify-center h-32 text-gray-500">
            텍스트 콘텐츠가 없습니다.
          </div>;
          
      case 'FILE':
        return renderFileContent(page.file);
        
      case 'MIXED':
        return renderMixedContent(page.textContent, page.file);
        
      default:
        return <div className="flex items-center justify-center h-32 text-gray-500">
          지원되지 않는 콘텐츠 타입입니다.
        </div>;
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* 메인 콘텐츠 영역 */}
      <div className={`flex-1 flex flex-col ${showChat ? 'mr-4' : ''}`}>
        {/* 헤더 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getContentIcon(page.contentType)}
                <div>
                  <CardTitle className="text-lg">
                    {page.title || `페이지 ${page.pageNumber}`}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {page.contentType}
                    </Badge>
                    {page.metadata?.difficulty && (
                      <Badge className={`text-xs ${getDifficultyColor(page.metadata.difficulty)}`}>
                        {page.metadata.difficulty === 'easy' ? '쉬움' :
                         page.metadata.difficulty === 'medium' ? '보통' : '어려움'}
                      </Badge>
                    )}
                    {page.metadata?.estimatedReadTime && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {page.metadata.estimatedReadTime}분
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 챗봇 토글 */}
                {showChatbot && (
                  <Button
                    variant={showChat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowChat(!showChat)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    AI 도우미
                  </Button>
                )}
                
                {/* 전체화면 토글 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 콘텐츠 영역 */}
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            {renderMainContent()}
          </CardContent>
        </Card>

        {/* 네비게이션 */}
        {showNavigation && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => onNavigate?.('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              이전 페이지
            </Button>
            
            <div className="text-sm text-gray-500">
              페이지 {page.pageNumber}
            </div>
            
            <Button
              variant="outline"
              onClick={() => onNavigate?.('next')}
              className="flex items-center gap-2"
            >
              다음 페이지
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 챗봇 사이드바 */}
      {showChat && showChatbot && (
        <>
          <Separator orientation="vertical" className="mx-4" />
          <div className="w-96">
            <PageChatbot 
              pageId={page.id}
              pageTitle={page.title || `페이지 ${page.pageNumber}`}
              onClose={() => setShowChat(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}