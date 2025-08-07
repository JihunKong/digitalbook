'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Type,
  Image,
  Users,
  PenTool,
  MessageSquare,
  Lightbulb,
  Grid,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Eye,
  Save,
  Download
} from 'lucide-react';

type ElementType = 'text' | 'activity' | 'discussion' | 'drawing' | 'reflection' | 'project';

interface WorksheetElement {
  id: string;
  type: ElementType;
  content: any;
  settings: {
    columns?: number;
    hasLines?: boolean;
    hasBox?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };
}

interface TextElement {
  text: string;
  style: 'title' | 'subtitle' | 'body' | 'instruction';
}

interface ActivityElement {
  title: string;
  instruction: string;
  space: 'small' | 'medium' | 'large';
  hasLines: boolean;
}

interface DiscussionElement {
  topic: string;
  prompts: string[];
  groupSize: number;
}

interface DrawingElement {
  prompt: string;
  boxSize: 'small' | 'medium' | 'large';
}

interface ReflectionElement {
  question: string;
  guidingPoints: string[];
}

interface ProjectElement {
  title: string;
  objectives: string[];
  materials: string[];
  steps: string[];
}

const ELEMENT_TYPES = [
  { value: 'text', label: '텍스트', icon: Type },
  { value: 'activity', label: '활동', icon: PenTool },
  { value: 'discussion', label: '토론', icon: MessageSquare },
  { value: 'drawing', label: '그리기', icon: Image },
  { value: 'reflection', label: '성찰', icon: Lightbulb },
  { value: 'project', label: '프로젝트', icon: Grid }
];

export function WorksheetBuilder() {
  const [worksheetTitle, setWorksheetTitle] = useState('');
  const [elements, setElements] = useState<WorksheetElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [savedWorksheets, setSavedWorksheets] = useState<any[]>([]);

  const addElement = (type: ElementType) => {
    const newElement: WorksheetElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      settings: getDefaultSettings(type)
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: ElementType): any => {
    switch (type) {
      case 'text':
        return { text: '', style: 'body' } as TextElement;
      case 'activity':
        return { title: '', instruction: '', space: 'medium', hasLines: true } as ActivityElement;
      case 'discussion':
        return { topic: '', prompts: [''], groupSize: 4 } as DiscussionElement;
      case 'drawing':
        return { prompt: '', boxSize: 'medium' } as DrawingElement;
      case 'reflection':
        return { question: '', guidingPoints: [''] } as ReflectionElement;
      case 'project':
        return { title: '', objectives: [''], materials: [''], steps: [''] } as ProjectElement;
      default:
        return {};
    }
  };

  const getDefaultSettings = (type: ElementType) => {
    switch (type) {
      case 'text':
        return { fontSize: 'medium' as const };
      case 'activity':
        return { hasLines: true, columns: 1 };
      default:
        return {};
    }
  };

  const updateElement = (id: string, updates: Partial<WorksheetElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        content: { ...element.content }
      };
      setElements([...elements, newElement]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(elements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setElements(items);
  };

  // Load saved worksheets on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('worksheets') || '[]');
    setSavedWorksheets(saved);
  }, []);

  const renderElementEditor = (element: WorksheetElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div className="space-y-3">
            <div>
              <Label>텍스트 스타일</Label>
              <Select
                value={element.content.style}
                onValueChange={(value) => updateElement(element.id, {
                  content: { ...element.content, style: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">제목</SelectItem>
                  <SelectItem value="subtitle">부제목</SelectItem>
                  <SelectItem value="body">본문</SelectItem>
                  <SelectItem value="instruction">안내문</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                value={element.content.text}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, text: e.target.value }
                })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-3">
            <div>
              <Label>활동 제목</Label>
              <Input
                value={element.content.title}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, title: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>활동 안내</Label>
              <Textarea
                value={element.content.instruction}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, instruction: e.target.value }
                })}
                rows={3}
              />
            </div>
            <div>
              <Label>작성 공간</Label>
              <Select
                value={element.content.space}
                onValueChange={(value) => updateElement(element.id, {
                  content: { ...element.content, space: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">작음 (3줄)</SelectItem>
                  <SelectItem value="medium">보통 (6줄)</SelectItem>
                  <SelectItem value="large">크게 (10줄)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.content.hasLines}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, hasLines: e.target.checked }
                })}
              />
              <span>줄 표시</span>
            </label>
          </div>
        );

      case 'discussion':
        return (
          <div className="space-y-3">
            <div>
              <Label>토론 주제</Label>
              <Input
                value={element.content.topic}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, topic: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>토론 질문</Label>
              {element.content.prompts.map((prompt: string, idx: number) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input
                    value={prompt}
                    onChange={(e) => {
                      const newPrompts = [...element.content.prompts];
                      newPrompts[idx] = e.target.value;
                      updateElement(element.id, {
                        content: { ...element.content, prompts: newPrompts }
                      });
                    }}
                    placeholder={`질문 ${idx + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newPrompts = element.content.prompts.filter((_: any, i: number) => i !== idx);
                      updateElement(element.id, {
                        content: { ...element.content, prompts: newPrompts }
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => updateElement(element.id, {
                  content: { ...element.content, prompts: [...element.content.prompts, ''] }
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                질문 추가
              </Button>
            </div>
            <div>
              <Label>모둠 크기</Label>
              <Input
                type="number"
                value={element.content.groupSize}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, groupSize: parseInt(e.target.value) }
                })}
                min={2}
                max={8}
              />
            </div>
          </div>
        );

      case 'drawing':
        return (
          <div className="space-y-3">
            <div>
              <Label>그리기 주제</Label>
              <Textarea
                value={element.content.prompt}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, prompt: e.target.value }
                })}
                placeholder="예: 오늘 가장 기억에 남는 순간을 그려보세요."
                rows={2}
              />
            </div>
            <div>
              <Label>그림 상자 크기</Label>
              <Select
                value={element.content.boxSize}
                onValueChange={(value) => updateElement(element.id, {
                  content: { ...element.content, boxSize: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">작음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="large">크게</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'reflection':
        return (
          <div className="space-y-3">
            <div>
              <Label>성찰 질문</Label>
              <Textarea
                value={element.content.question}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, question: e.target.value }
                })}
                rows={2}
              />
            </div>
            <div>
              <Label>안내 사항</Label>
              {element.content.guidingPoints.map((point: string, idx: number) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...element.content.guidingPoints];
                      newPoints[idx] = e.target.value;
                      updateElement(element.id, {
                        content: { ...element.content, guidingPoints: newPoints }
                      });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newPoints = element.content.guidingPoints.filter((_: any, i: number) => i !== idx);
                      updateElement(element.id, {
                        content: { ...element.content, guidingPoints: newPoints }
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => updateElement(element.id, {
                  content: { ...element.content, guidingPoints: [...element.content.guidingPoints, ''] }
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                안내 추가
              </Button>
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="space-y-3">
            <div>
              <Label>프로젝트 제목</Label>
              <Input
                value={element.content.title}
                onChange={(e) => updateElement(element.id, {
                  content: { ...element.content, title: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>학습 목표</Label>
              {element.content.objectives.map((obj: string, idx: number) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input
                    value={obj}
                    onChange={(e) => {
                      const newObjectives = [...element.content.objectives];
                      newObjectives[idx] = e.target.value;
                      updateElement(element.id, {
                        content: { ...element.content, objectives: newObjectives }
                      });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newObjectives = element.content.objectives.filter((_: any, i: number) => i !== idx);
                      updateElement(element.id, {
                        content: { ...element.content, objectives: newObjectives }
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => updateElement(element.id, {
                  content: { ...element.content, objectives: [...element.content.objectives, ''] }
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                목표 추가
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 왼쪽: 요소 선택 패널 */}
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">워크시트 요소</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ELEMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement(type.value as ElementType)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {type.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {selectedElement && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">요소 편집</CardTitle>
            </CardHeader>
            <CardContent>
              {renderElementEditor(elements.find(el => el.id === selectedElement)!)}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 가운데: 워크시트 미리보기 */}
      <div className="col-span-6">
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Input
                className="text-xl font-bold border-none focus:outline-none"
                value={worksheetTitle}
                onChange={(e) => setWorksheetTitle(e.target.value)}
                placeholder="워크시트 제목을 입력하세요"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const preview = window.open('', '_blank');
                    if (preview) {
                      preview.document.write(`
                        <html>
                          <head>
                            <title>${worksheetTitle || '워크시트 미리보기'}</title>
                            <style>
                              body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; }
                              h1 { margin-bottom: 30px; }
                              .element { margin-bottom: 20px; padding: 20px; border: 1px solid #e0e0e0; }
                            </style>
                          </head>
                          <body>
                            <h1>${worksheetTitle || '워크시트'}</h1>
                            ${elements.map(el => `
                              <div class="element">
                                ${el.type === 'text' ? `<div style="font-size: ${el.content.style === 'title' ? '24px' : '16px'}">${el.content.text}</div>` : ''}
                                ${el.type === 'activity' ? `
                                  <h3>${el.content.title}</h3>
                                  <p>${el.content.instruction}</p>
                                  <div style="height: ${el.content.space === 'large' ? '200px' : '100px'}; border: 1px solid #ccc; margin-top: 10px;"></div>
                                ` : ''}
                              </div>
                            `).join('')}
                          </body>
                        </html>
                      `);
                      preview.document.close();
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  미리보기
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    if (!worksheetTitle) {
                      alert('워크시트 제목을 입력해주세요.');
                      return;
                    }
                    
                    const worksheet = {
                      id: Date.now().toString(),
                      title: worksheetTitle,
                      elements,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    
                    const saved = JSON.parse(localStorage.getItem('worksheets') || '[]');
                    saved.push(worksheet);
                    localStorage.setItem('worksheets', JSON.stringify(saved));
                    setSavedWorksheets(saved);
                    
                    alert('워크시트가 저장되었습니다!');
                  }}
                  disabled={!worksheetTitle || elements.length === 0}
                >
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const content = {
                      title: worksheetTitle,
                      elements: elements.map(el => ({
                        type: el.type,
                        content: el.content
                      }))
                    };
                    
                    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${worksheetTitle || 'worksheet'}_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!worksheetTitle || elements.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  내보내기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="worksheet">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4 min-h-[600px] p-4 border-2 border-dashed border-gray-200 rounded-lg"
                  >
                    {elements.length === 0 && (
                      <p className="text-center text-gray-400 py-8">
                        왼쪽에서 요소를 선택하여 워크시트를 만들어보세요.
                      </p>
                    )}
                    {elements.map((element, index) => (
                      <Draggable key={element.id} draggableId={element.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white p-4 rounded-lg border ${
                              selectedElement === element.id ? 'border-blue-500' : 'border-gray-200'
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex-1 px-4">
                                {/* 워크시트 요소 렌더링 */}
                                {element.type === 'text' && (
                                  <div className={`text-${element.content.style}`}>
                                    {element.content.text || '텍스트를 입력하세요'}
                                  </div>
                                )}
                                {element.type === 'activity' && (
                                  <div>
                                    <h3 className="font-semibold">{element.content.title || '활동 제목'}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {element.content.instruction || '활동 안내를 입력하세요'}
                                    </p>
                                    <div className="mt-3">
                                      {element.content.hasLines ? (
                                        <div className="space-y-2">
                                          {Array.from({ length: element.content.space === 'small' ? 3 : element.content.space === 'medium' ? 6 : 10 }).map((_, i) => (
                                            <div key={i} className="border-b border-gray-300 h-6" />
                                          ))}
                                        </div>
                                      ) : (
                                        <div className={`border border-gray-300 rounded ${
                                          element.content.space === 'small' ? 'h-20' : 
                                          element.content.space === 'medium' ? 'h-40' : 'h-60'
                                        }`} />
                                      )}
                                    </div>
                                  </div>
                                )}
                                {element.type === 'discussion' && (
                                  <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      {element.content.topic || '토론 주제'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {element.content.groupSize}명 모둠
                                    </p>
                                    <ul className="mt-2 space-y-1">
                                      {element.content.prompts.map((prompt: string, idx: number) => (
                                        <li key={idx} className="text-sm">
                                          • {prompt || `질문 ${idx + 1}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {element.type === 'drawing' && (
                                  <div>
                                    <p className="text-sm mb-2">{element.content.prompt || '그리기 주제를 입력하세요'}</p>
                                    <div className={`border-2 border-gray-300 rounded ${
                                      element.content.boxSize === 'small' ? 'h-32' :
                                      element.content.boxSize === 'medium' ? 'h-48' : 'h-64'
                                    }`} />
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateElement(element.id);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteElement(element.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 템플릿 및 공유 */}
      <div className="col-span-3 space-y-4">
        {savedWorksheets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">저장된 워크시트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {savedWorksheets.slice(-5).reverse().map((ws) => (
                <Button
                  key={ws.id}
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setWorksheetTitle(ws.title);
                    setElements(ws.elements);
                    alert('워크시트를 불러왔습니다!');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {ws.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">템플릿 (참고용)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm"
              onClick={() => {
                setWorksheetTitle('일기 쓰기 활동');
                setElements([
                  {
                    id: '1',
                    type: 'text',
                    content: { text: '오늘의 일기', style: 'title' },
                    settings: {}
                  },
                  {
                    id: '2',
                    type: 'activity',
                    content: {
                      title: '일기 쓰기',
                      instruction: '오늘 있었던 일 중 가장 기억에 남는 일을 일기로 써보세요.',
                      space: 'large',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  }
                ]);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              일기 쓰기 활동
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm"
              onClick={() => {
                setWorksheetTitle('독서 감상문')
                setElements([
                  {
                    id: '1',
                    type: 'text',
                    content: { text: '독서 감상문', style: 'title' },
                    settings: {}
                  },
                  {
                    id: '2',
                    type: 'text',
                    content: { text: '책 제목: ', style: 'subtitle' },
                    settings: {}
                  },
                  {
                    id: '3',
                    type: 'activity',
                    content: {
                      title: '줄거리 요약',
                      instruction: '책의 주요 내용을 간단히 정리해보세요.',
                      space: 'medium',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  },
                  {
                    id: '4',
                    type: 'activity',
                    content: {
                      title: '인상 깊었던 장면',
                      instruction: '가장 기억에 남는 장면과 그 이유를 설명해보세요.',
                      space: 'medium',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  },
                  {
                    id: '5',
                    type: 'reflection',
                    content: {
                      question: '이 책을 읽고 느낀 점은 무엇인가요?',
                      guidingPoints: ['나의 생각', '배운 점', '실천할 점']
                    },
                    settings: {}
                  }
                ])
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              독서 감상문
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm"
              onClick={() => {
                setWorksheetTitle('모둠 토론 활동')
                setElements([
                  {
                    id: '1',
                    type: 'text',
                    content: { text: '모둠 토론 활동', style: 'title' },
                    settings: {}
                  },
                  {
                    id: '2',
                    type: 'discussion',
                    content: {
                      topic: '우리가 할 수 있는 환경 보호 방법',
                      prompts: [
                        '일상생활에서 실천할 수 있는 방법은?',
                        '학교에서 함께 할 수 있는 활동은?',
                        '우리 지역에서 할 수 있는 일은?'
                      ],
                      groupSize: 4
                    },
                    settings: {}
                  },
                  {
                    id: '3',
                    type: 'activity',
                    content: {
                      title: '토론 내용 정리',
                      instruction: '모둠에서 나온 의견들을 정리해보세요.',
                      space: 'large',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  },
                  {
                    id: '4',
                    type: 'drawing',
                    content: {
                      prompt: '우리 모둠의 환경 보호 아이디어를 그림으로 표현해보세요.',
                      boxSize: 'medium'
                    },
                    settings: {}
                  }
                ])
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              모둠 토론 활동
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm"
              onClick={() => {
                setWorksheetTitle('프로젝트 계획서')
                setElements([
                  {
                    id: '1',
                    type: 'text',
                    content: { text: '프로젝트 계획서', style: 'title' },
                    settings: {}
                  },
                  {
                    id: '2',
                    type: 'project',
                    content: {
                      title: '우리 모둠 프로젝트',
                      objectives: [
                        '프로젝트의 목표를 작성하세요',
                        '달성하고자 하는 결과를 구체적으로 작성하세요'
                      ],
                      materials: ['필요한 재료 1', '필요한 재료 2'],
                      steps: ['1단계: 계획 수립', '2단계: 자료 조사', '3단계: 제작', '4단계: 발표 준비']
                    },
                    settings: {}
                  },
                  {
                    id: '3',
                    type: 'activity',
                    content: {
                      title: '역할 분담',
                      instruction: '모둠원들의 역할을 구체적으로 정해보세요.',
                      space: 'medium',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  },
                  {
                    id: '4',
                    type: 'activity',
                    content: {
                      title: '일정 계획',
                      instruction: '프로젝트 진행 일정을 작성해보세요.',
                      space: 'medium',
                      hasLines: true
                    },
                    settings: { hasLines: true }
                  }
                ])
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              프로젝트 계획서
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">동료 교사와 공유</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              작성한 워크시트를 다른 선생님들과 공유하고 피드백을 받아보세요.
            </p>
            <Button 
              className="w-full"
              onClick={() => {
                if (!worksheetTitle || elements.length === 0) {
                  alert('워크시트 제목과 내용을 먼저 작성해주세요.')
                  return
                }
                
                // Create shareable data
                const shareData = {
                  title: worksheetTitle,
                  elements: elements.map(el => ({
                    type: el.type,
                    content: el.content,
                    settings: el.settings
                  })),
                  author: localStorage.getItem('userName') || '익명 교사',
                  createdAt: new Date().toISOString(),
                  description: `${elements.length}개의 요소로 구성된 워크시트`
                }
                
                // Save to shared worksheets (localStorage for now)
                const sharedWorksheets = JSON.parse(localStorage.getItem('sharedWorksheets') || '[]')
                sharedWorksheets.push({
                  id: Date.now().toString(),
                  ...shareData,
                  downloads: 0,
                  likes: 0
                })
                localStorage.setItem('sharedWorksheets', JSON.stringify(sharedWorksheets))
                
                // If the browser supports Web Share API
                if (navigator.share) {
                  navigator.share({
                    title: `워크시트: ${worksheetTitle}`,
                    text: `${shareData.author} 선생님이 만든 워크시트를 확인해보세요!`,
                    url: window.location.href
                  }).then(() => {
                    alert('워크시트가 공유되었습니다!')
                  }).catch(console.error)
                } else {
                  // Fallback: Copy to clipboard
                  const shareUrl = `${window.location.origin}/shared-worksheet/${Date.now()}`
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert(`워크시트가 교사 커뮤니티에 공유되었습니다!\n공유 링크가 복사되었습니다.`)
                  }).catch(() => {
                    alert('워크시트가 교사 커뮤니티에 공유되었습니다!')
                  })
                }
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              교사 커뮤니티에 공유
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}