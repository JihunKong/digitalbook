'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText,
  Image,
  Video,
  Music,
  Link,
  PenTool,
  MessageSquare,
  Users,
  Brain,
  Lightbulb,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorksheetElement {
  id: string;
  type: 'text' | 'question' | 'activity' | 'media' | 'drawing' | 'discussion' | 'reflection' | 'project';
  content: any;
  settings: any;
}

interface WorksheetBuilderProps {
  pageId?: string;
  onSave: (worksheet: any) => void;
}

export function WorksheetBuilder({ pageId, onSave }: WorksheetBuilderProps) {
  const [elements, setElements] = useState<WorksheetElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [worksheetTitle, setWorksheetTitle] = useState('');
  const [worksheetDescription, setWorksheetDescription] = useState('');
  const [templateMode, setTemplateMode] = useState<'blank' | 'template'>('blank');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const elementTypes = [
    { type: 'text', icon: FileText, label: '텍스트' },
    { type: 'question', icon: MessageSquare, label: '질문' },
    { type: 'activity', icon: Lightbulb, label: '활동' },
    { type: 'media', icon: Image, label: '미디어' },
    { type: 'drawing', icon: PenTool, label: '그리기' },
    { type: 'discussion', icon: Users, label: '토론' },
    { type: 'reflection', icon: Brain, label: '성찰' },
    { type: 'project', icon: FileText, label: '프로젝트' },
  ];

  const templates = [
    {
      name: '탐구 활동지',
      description: '과학적 탐구 과정을 단계별로 기록',
      elements: [
        { type: 'text', content: { title: '탐구 주제', text: '' } },
        { type: 'question', content: { question: '탐구 문제는 무엇인가요?' } },
        { type: 'activity', content: { title: '실험 설계', instructions: '변인 통제와 실험 과정을 설계하세요' } },
        { type: 'drawing', content: { title: '실험 도구 그리기' } },
        { type: 'reflection', content: { prompt: '실험 결과를 통해 알게 된 점은?' } },
      ],
    },
    {
      name: '독서 활동지',
      description: '책을 읽고 다양한 활동 수행',
      elements: [
        { type: 'text', content: { title: '도서 정보', fields: ['제목', '저자', '출판사'] } },
        { type: 'question', content: { question: '가장 인상 깊었던 부분은?' } },
        { type: 'drawing', content: { title: '인상 깊은 장면 그리기' } },
        { type: 'activity', content: { title: '등장인물 분석', type: 'character-map' } },
        { type: 'discussion', content: { topic: '이 책이 전하고자 하는 메시지는?' } },
      ],
    },
    {
      name: '프로젝트 계획서',
      description: '장기 프로젝트 수행을 위한 계획',
      elements: [
        { type: 'project', content: { phases: ['계획', '조사', '제작', '발표'] } },
        { type: 'activity', content: { title: '역할 분담', type: 'team-roles' } },
        { type: 'text', content: { title: '일정 계획', type: 'timeline' } },
        { type: 'reflection', content: { checkpoints: ['1주차', '2주차', '3주차', '4주차'] } },
      ],
    },
  ];

  const addElement = (type: string) => {
    const newElement: WorksheetElement = {
      id: `elem-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      settings: getDefaultSettings(type),
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: '', formatting: 'normal' };
      case 'question':
        return { question: '', answerType: 'short', answerLines: 3 };
      case 'activity':
        return { title: '', instructions: '', materials: [], duration: '' };
      case 'media':
        return { url: '', caption: '', type: 'image' };
      case 'drawing':
        return { title: '', gridSize: 'medium', showRuler: false };
      case 'discussion':
        return { topic: '', roles: [], structure: 'free' };
      case 'reflection':
        return { prompt: '', guidingQuestions: [] };
      case 'project':
        return { title: '', objectives: [], deliverables: [], rubric: [] };
      default:
        return {};
    }
  };

  const getDefaultSettings = (type: string) => {
    return {
      width: '100%',
      marginTop: 20,
      marginBottom: 20,
      alignment: 'left',
      required: false,
    };
  };

  const updateElement = (id: string, updates: Partial<WorksheetElement>) => {
    setElements(elements.map(elem => 
      elem.id === id ? { ...elem, ...updates } : elem
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(elem => elem.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(elem => elem.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `elem-${Date.now()}`,
      };
      const index = elements.findIndex(elem => elem.id === id);
      const newElements = [...elements];
      newElements.splice(index + 1, 0, newElement);
      setElements(newElements);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const loadTemplate = (template: any) => {
    const newElements = template.elements.map((elem: any, index: number) => ({
      id: `elem-${Date.now()}-${index}`,
      type: elem.type,
      content: elem.content,
      settings: getDefaultSettings(elem.type),
    }));
    setElements(newElements);
    setWorksheetTitle(template.name);
    toast.success(`${template.name} 템플릿이 로드되었습니다`);
  };

  const saveWorksheet = () => {
    if (!worksheetTitle) {
      toast.error('워크시트 제목을 입력해주세요');
      return;
    }

    const worksheet = {
      id: `ws-${Date.now()}`,
      title: worksheetTitle,
      description: worksheetDescription,
      pageId,
      elements,
      createdAt: new Date().toISOString(),
    };

    onSave(worksheet);
    toast.success('워크시트가 저장되었습니다');
  };

  const exportWorksheet = () => {
    const data = {
      title: worksheetTitle,
      description: worksheetDescription,
      elements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${worksheetTitle || 'worksheet'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 왼쪽: 도구 패널 */}
      <div className="col-span-3">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">워크시트 도구</h3>
          
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input
                value={worksheetTitle}
                onChange={(e) => setWorksheetTitle(e.target.value)}
                placeholder="워크시트 제목"
                className="mt-1"
              />
            </div>

            <div>
              <Label>설명</Label>
              <Textarea
                value={worksheetDescription}
                onChange={(e) => setWorksheetDescription(e.target.value)}
                placeholder="워크시트 설명 (선택사항)"
                rows={2}
                className="mt-1"
              />
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">요소 추가</h4>
              <div className="grid grid-cols-2 gap-2">
                {elementTypes.map((type) => (
                  <Button
                    key={type.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(type.type)}
                    className="justify-start"
                  >
                    <type.icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">템플릿</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card
                      key={template.name}
                      className="p-3 cursor-pointer hover:bg-accent"
                      onClick={() => loadTemplate(template)}
                    >
                      <h5 className="font-medium text-sm">{template.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Card>
      </div>

      {/* 중앙: 워크시트 캔버스 */}
      <div className="col-span-6">
        <Card className="p-6 min-h-[800px]">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold">{worksheetTitle || '제목 없는 워크시트'}</h2>
            {worksheetDescription && (
              <p className="text-muted-foreground mt-1">{worksheetDescription}</p>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={elements.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {elements.map((element) => (
                  <SortableElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElement === element.id}
                    onSelect={() => setSelectedElement(element.id)}
                    onDelete={() => deleteElement(element.id)}
                    onDuplicate={() => duplicateElement(element.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {elements.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              왼쪽 패널에서 요소를 추가하여 워크시트를 만들어보세요
            </div>
          )}
        </Card>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={exportWorksheet}>
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={saveWorksheet}>
            워크시트 저장
          </Button>
        </div>
      </div>

      {/* 오른쪽: 속성 패널 */}
      <div className="col-span-3">
        {selectedElement && (
          <ElementProperties
            element={elements.find(e => e.id === selectedElement)!}
            onUpdate={(updates: any) => updateElement(selectedElement, updates)}
          />
        )}
      </div>
    </div>
  );
}

// 정렬 가능한 요소 컴포넌트
function SortableElement({ element, isSelected, onSelect, onDelete, onDuplicate }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${isSelected ? 'border-primary' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1">
          <ElementRenderer element={element} />
        </div>

        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// 요소 렌더러
function ElementRenderer({ element }: { element: WorksheetElement }) {
  switch (element.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none">
          <p>{element.content.text || '텍스트를 입력하세요'}</p>
        </div>
      );
    
    case 'question':
      return (
        <div>
          <p className="font-medium mb-2">{element.content.question || '질문을 입력하세요'}</p>
          {element.content.answerType === 'short' && (
            <div className="space-y-1">
              {Array.from({ length: element.content.answerLines || 3 }).map((_, i) => (
                <div key={i} className="border-b border-gray-300 h-6" />
              ))}
            </div>
          )}
        </div>
      );
    
    case 'activity':
      return (
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-medium">
            {element.content.title || '활동 제목'}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {element.content.instructions || '활동 지시사항을 입력하세요'}
          </p>
        </div>
      );
    
    case 'drawing':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <PenTool className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {element.content.title || '그리기 영역'}
          </p>
        </div>
      );
    
    case 'discussion':
      return (
        <div className="bg-accent/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5" />
            <h4 className="font-medium">토론 주제</h4>
          </div>
          <p className="text-sm">{element.content.topic || '토론 주제를 입력하세요'}</p>
        </div>
      );
    
    case 'reflection':
      return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium">성찰하기</h4>
          </div>
          <p className="text-sm">{element.content.prompt || '성찰 질문을 입력하세요'}</p>
        </div>
      );
    
    default:
      return <div>알 수 없는 요소 유형</div>;
  }
}

// 요소 속성 편집 패널
function ElementProperties({ element, onUpdate }: any) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">요소 속성</h3>
      
      <div className="space-y-4">
        {element.type === 'text' && (
          <>
            <div>
              <Label>텍스트 내용</Label>
              <Textarea
                value={element.content.text}
                onChange={(e) => onUpdate({
                  content: { ...element.content, text: e.target.value }
                })}
                rows={4}
                className="mt-1"
              />
            </div>
          </>
        )}

        {element.type === 'question' && (
          <>
            <div>
              <Label>질문</Label>
              <Textarea
                value={element.content.question}
                onChange={(e) => onUpdate({
                  content: { ...element.content, question: e.target.value }
                })}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>답변 유형</Label>
              <Select
                value={element.content.answerType}
                onValueChange={(value) => onUpdate({
                  content: { ...element.content, answerType: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">단답형</SelectItem>
                  <SelectItem value="long">서술형</SelectItem>
                  <SelectItem value="multiple">객관식</SelectItem>
                  <SelectItem value="checkbox">체크박스</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {element.content.answerType === 'short' && (
              <div>
                <Label>답변 줄 수</Label>
                <Input
                  type="number"
                  value={element.content.answerLines}
                  onChange={(e) => onUpdate({
                    content: { ...element.content, answerLines: parseInt(e.target.value) }
                  })}
                  min={1}
                  max={10}
                  className="mt-1"
                />
              </div>
            )}
          </>
        )}

        {element.type === 'activity' && (
          <>
            <div>
              <Label>활동 제목</Label>
              <Input
                value={element.content.title}
                onChange={(e) => onUpdate({
                  content: { ...element.content, title: e.target.value }
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>활동 지시사항</Label>
              <Textarea
                value={element.content.instructions}
                onChange={(e) => onUpdate({
                  content: { ...element.content, instructions: e.target.value }
                })}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>예상 소요 시간</Label>
              <Input
                value={element.content.duration}
                onChange={(e) => onUpdate({
                  content: { ...element.content, duration: e.target.value }
                })}
                placeholder="예: 20분"
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* 공통 설정 */}
        <Separator />
        <div>
          <Label>정렬</Label>
          <Select
            value={element.settings.alignment}
            onValueChange={(value) => onUpdate({
              settings: { ...element.settings, alignment: value }
            })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">왼쪽</SelectItem>
              <SelectItem value="center">가운데</SelectItem>
              <SelectItem value="right">오른쪽</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

// 필요한 import 추가
import { Separator } from '@/components/ui/separator';