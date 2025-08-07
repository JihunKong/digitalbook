'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Image,
  Wand2,
  Split,
  Merge,
} from 'lucide-react';
import { toast } from 'sonner';

interface PageEditorProps {
  content: any;
  selectedPage: string | null;
  onChange: (content: any) => void;
  showPreview: boolean;
}

export function PageEditor({ content, selectedPage, onChange, showPreview }: PageEditorProps) {
  const [pageData, setPageData] = useState<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [splitPosition, setSplitPosition] = useState(0);

  useEffect(() => {
    if (selectedPage) {
      // Find the selected page in the content
      for (const chapter of content.chapters) {
        for (const section of chapter.sections) {
          const page = section.pages.find((p: any) => p.id === selectedPage);
          if (page) {
            setPageData(page);
            return;
          }
        }
      }
    }
  }, [selectedPage, content]);

  const updatePage = (updates: any) => {
    if (!selectedPage || !pageData) return;

    const updatedChapters = content.chapters.map((chapter: any) => ({
      ...chapter,
      sections: chapter.sections.map((section: any) => ({
        ...section,
        pages: section.pages.map((page: any) =>
          page.id === selectedPage ? { ...page, ...updates } : page
        ),
      })),
    }));

    onChange({ chapters: updatedChapters });
    setPageData({ ...pageData, ...updates });
  };

  const handleTextFormat = (format: string) => {
    if (!selectedText) {
      toast.error('텍스트를 선택해주세요');
      return;
    }

    let formattedText = selectedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'highlight':
        formattedText = `<mark>${selectedText}</mark>`;
        break;
    }

    const newContent = pageData.content.replace(selectedText, formattedText);
    updatePage({ content: newContent });
  };

  const splitPage = async () => {
    if (!pageData || splitPosition <= 0) return;

    const firstPartContent = pageData.content.substring(0, splitPosition);
    const secondPartContent = pageData.content.substring(splitPosition);

    // Update current page
    updatePage({ content: firstPartContent });

    // Create new page
    const newPage = {
      id: `page-${Date.now()}`,
      pageNumber: pageData.pageNumber + 1,
      title: `${pageData.title} (계속)`,
      content: secondPartContent,
      images: [],
      exercises: [],
    };

    // Add new page to the section
    toast.success('페이지가 분할되었습니다');
  };

  const generateWithAI = async (type: string) => {
    try {
      const response = await fetch('/api/textbooks/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          context: pageData.content,
          pageTitle: pageData.title,
        }),
      });

      const result = await response.json();
      
      if (type === 'summary') {
        updatePage({ summary: result.content });
      } else if (type === 'keyPoints') {
        updatePage({ keyPoints: result.content });
      }
      
      toast.success('AI 생성이 완료되었습니다');
    } catch (error) {
      toast.error('AI 생성 중 오류가 발생했습니다');
    }
  };

  if (!pageData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          편집할 페이지를 선택해주세요
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="page-title">페이지 제목</Label>
            <Input
              id="page-title"
              value={pageData.title}
              onChange={(e) => updatePage({ title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>페이지 내용</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTextFormat('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTextFormat('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTextFormat('underline')}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTextFormat('highlight')}
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={pageData.content}
              onChange={(e) => updatePage({ content: e.target.value })}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setSelectedText(
                  target.value.substring(
                    target.selectionStart,
                    target.selectionEnd
                  )
                );
                setSplitPosition(target.selectionStart);
              }}
              className="min-h-[400px] font-mono"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">AI 도구</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => generateWithAI('summary')}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                요약 생성
              </Button>
              <Button
                variant="outline"
                onClick={() => generateWithAI('keyPoints')}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                핵심 포인트
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">페이지 도구</h4>
            <Button
              variant="outline"
              onClick={splitPage}
              disabled={!selectedText || splitPosition === 0}
            >
              <Split className="h-4 w-4 mr-2" />
              현재 위치에서 페이지 분할
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">미리보기</h3>
        <ScrollArea className="h-[600px]">
          <div className="prose prose-sm max-w-none">
            <h2>{pageData.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
            {pageData.images?.map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`Page image ${index + 1}`}
                className="rounded-lg my-4"
              />
            ))}
            {pageData.exercises?.length > 0 && (
              <div className="mt-6 p-4 bg-accent rounded-lg">
                <h3>연습문제</h3>
                {pageData.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="mb-2">
                    <p className="font-medium">{index + 1}. {exercise.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}