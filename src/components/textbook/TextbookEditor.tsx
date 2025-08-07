'use client';

import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Trash2,
  Copy,
  FileText,
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  pages: Page[];
}

interface Page {
  id: string;
  pageNumber: number;
  title: string;
  content: string;
  images?: string[];
  exercises?: any[];
}

interface TextbookEditorProps {
  content: { chapters: Chapter[] };
  onChange: (content: any) => void;
  onPageSelect: (pageId: string) => void;
}

export function TextbookEditor({ content, onChange, onPageSelect }: TextbookEditorProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: '새 단원',
      sections: [],
    };
    onChange({
      chapters: [...content.chapters, newChapter],
    });
  };

  const addSection = (chapterId: string) => {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: '새 섹션',
      pages: [],
    };
    const updatedChapters = content.chapters.map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, sections: [...ch.sections, newSection] };
      }
      return ch;
    });
    onChange({ chapters: updatedChapters });
  };

  const addPage = (chapterId: string, sectionId: string) => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      pageNumber: 1,
      title: '새 페이지',
      content: '',
      images: [],
      exercises: [],
    };
    
    const updatedChapters = content.chapters.map(ch => {
      if (ch.id === chapterId) {
        const updatedSections = ch.sections.map(sec => {
          if (sec.id === sectionId) {
            const pageNumber = sec.pages.length + 1;
            return { 
              ...sec, 
              pages: [...sec.pages, { ...newPage, pageNumber }] 
            };
          }
          return sec;
        });
        return { ...ch, sections: updatedSections };
      }
      return ch;
    });
    onChange({ chapters: updatedChapters });
  };

  const moveChapter = (dragIndex: number, dropIndex: number) => {
    const newChapters = [...content.chapters];
    const [draggedChapter] = newChapters.splice(dragIndex, 1);
    newChapters.splice(dropIndex, 0, draggedChapter);
    onChange({ chapters: newChapters });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">교과서 구조</h3>
            <Button size="sm" onClick={addChapter}>
              <Plus className="h-4 w-4 mr-1" />
              단원 추가
            </Button>
          </div>
          
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {content.chapters.map((chapter, index) => (
                <DraggableChapter
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  isExpanded={expandedChapters.has(chapter.id)}
                  onToggle={() => toggleChapter(chapter.id)}
                  onMove={moveChapter}
                  onAddSection={() => addSection(chapter.id)}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                  onAddPage={addPage}
                  onPageSelect={onPageSelect}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="col-span-8">
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            좌측에서 편집할 페이지를 선택하세요
          </div>
        </Card>
      </div>
    </div>
  );
}

interface DraggableChapterProps {
  chapter: Chapter;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onMove: (dragIndex: number, dropIndex: number) => void;
  onAddSection: () => void;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  onAddPage: (chapterId: string, sectionId: string) => void;
  onPageSelect: (pageId: string) => void;
}

function DraggableChapter({
  chapter,
  index,
  isExpanded,
  onToggle,
  onMove,
  onAddSection,
  expandedSections,
  onToggleSection,
  onAddPage,
  onPageSelect,
}: DraggableChapterProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'chapter',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'chapter',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => {
        dragPreview(drop(node));
      }}
      className={`border rounded-lg p-3 ${isDragging ? 'opacity-50' : ''} ${
        isOver ? 'border-primary' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div ref={drag as any} className="cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <button onClick={onToggle} className="p-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <span className="font-medium flex-1">{chapter.title}</span>
        <Button size="sm" variant="ghost" onClick={onAddSection}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {isExpanded && (
        <div className="ml-8 mt-2 space-y-1">
          {chapter.sections.map((section) => (
            <div key={section.id} className="border-l-2 pl-3">
              <div className="flex items-center gap-2 py-1">
                <button
                  onClick={() => onToggleSection(section.id)}
                  className="p-1"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <span className="text-sm flex-1">{section.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddPage(chapter.id, section.id)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {expandedSections.has(section.id) && (
                <div className="ml-6 space-y-1">
                  {section.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => onPageSelect(page.id)}
                      className="flex items-center gap-2 p-1 hover:bg-accent rounded text-sm w-full text-left"
                    >
                      <FileText className="h-3 w-3" />
                      <span>{page.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        p.{page.pageNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}