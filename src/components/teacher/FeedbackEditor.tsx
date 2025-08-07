'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import {
  MessageSquare,
  Highlighter,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Edit3,
  Save,
  Undo,
  Redo,
  Type,
  Palette,
  MousePointer
} from 'lucide-react';

interface TextSelection {
  text: string;
  start: number;
  end: number;
}

interface Feedback {
  id: string;
  type: 'correction' | 'suggestion' | 'praise' | 'question';
  text: string;
  comment: string;
  position: {
    start: number;
    end: number;
  };
  color?: string;
  createdAt: Date;
}

interface FeedbackTemplate {
  id: string;
  name: string;
  type: 'correction' | 'suggestion' | 'praise' | 'question';
  text: string;
}

const FEEDBACK_TYPES = [
  { value: 'correction', label: '수정', icon: AlertCircle, color: 'text-red-500' },
  { value: 'suggestion', label: '제안', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'praise', label: '칭찬', icon: CheckCircle, color: 'text-green-500' },
  { value: 'question', label: '질문', icon: MessageSquare, color: 'text-blue-500' }
];

const HIGHLIGHT_COLORS = [
  { name: '빨강', value: '#ff6b6b' },
  { name: '노랑', value: '#ffd93d' },
  { name: '초록', value: '#6bcf7f' },
  { name: '파랑', value: '#4dabf7' },
  { name: '보라', value: '#9775fa' }
];

export function FeedbackEditor({ 
  studentText, 
  studentName,
  onSave 
}: { 
  studentText: string;
  studentName: string;
  onSave: (feedbacks: Feedback[]) => void;
}) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [feedbackType, setFeedbackType] = useState<string>('suggestion');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ffd93d');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [history, setHistory] = useState<Feedback[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  // 교사가 자주 사용하는 피드백 템플릿
  const [templates] = useState<FeedbackTemplate[]>([
    { id: '1', name: '맞춤법 확인', type: 'correction', text: '맞춤법을 다시 확인해보세요.' },
    { id: '2', name: '문장 연결', type: 'suggestion', text: '문장을 더 자연스럽게 연결해보면 어떨까요?' },
    { id: '3', name: '표현력 우수', type: 'praise', text: '매우 생생한 표현이네요! 잘했어요.' },
    { id: '4', name: '구체적 설명', type: 'question', text: '이 부분을 좀 더 구체적으로 설명해줄 수 있나요?' },
    { id: '5', name: '어휘 선택', type: 'suggestion', text: '다른 어휘를 사용하면 더 정확하게 표현할 수 있을 것 같아요.' }
  ]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    if (selectedText.trim()) {
      const textElement = textRef.current;
      if (!textElement) return;

      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(textElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;

      setSelectedText({
        text: selectedText,
        start,
        end: start + selectedText.length
      });
    }
  };

  const addFeedback = (template?: FeedbackTemplate) => {
    if (!selectedText) return;

    const newFeedback: Feedback = {
      id: Date.now().toString(),
      type: (template?.type || feedbackType) as any,
      text: selectedText.text,
      comment: template?.text || feedbackComment,
      position: {
        start: selectedText.start,
        end: selectedText.end
      },
      color: highlightColor,
      createdAt: new Date()
    };

    const newFeedbacks = [...feedbacks, newFeedback];
    setFeedbacks(newFeedbacks);
    addToHistory(newFeedbacks);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText(null);
    setFeedbackComment('');
  };

  const removeFeedback = (id: string) => {
    const newFeedbacks = feedbacks.filter(f => f.id !== id);
    setFeedbacks(newFeedbacks);
    addToHistory(newFeedbacks);
  };

  const addToHistory = (newFeedbacks: Feedback[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFeedbacks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFeedbacks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFeedbacks(history[historyIndex + 1]);
    }
  };

  const renderTextWithHighlights = () => {
    if (!studentText) return null;

    let lastIndex = 0;
    const elements: JSX.Element[] = [];
    
    // Sort feedbacks by position
    const sortedFeedbacks = [...feedbacks].sort((a, b) => a.position.start - b.position.start);

    sortedFeedbacks.forEach((feedback, index) => {
      // Add text before feedback
      if (feedback.position.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {studentText.substring(lastIndex, feedback.position.start)}
          </span>
        );
      }

      // Add highlighted text
      const feedbackType = FEEDBACK_TYPES.find(t => t.value === feedback.type);
      elements.push(
        <span
          key={`feedback-${feedback.id}`}
          className="relative inline-block cursor-pointer group"
          style={{ backgroundColor: feedback.color + '40' }}
        >
          {studentText.substring(feedback.position.start, feedback.position.end)}
          <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
            <div className="bg-white border rounded-lg shadow-lg p-3 w-64">
              <div className="flex items-center gap-2 mb-2">
                {feedbackType && <feedbackType.icon className={`h-4 w-4 ${feedbackType.color}`} />}
                <Badge variant="outline" className="text-xs">
                  {feedbackType?.label}
                </Badge>
              </div>
              <p className="text-sm">{feedback.comment}</p>
              <button
                onClick={() => removeFeedback(feedback.id)}
                className="text-xs text-red-500 mt-2 hover:underline"
              >
                피드백 삭제
              </button>
            </div>
          </span>
        </span>
      );

      lastIndex = feedback.position.end;
    });

    // Add remaining text
    if (lastIndex < studentText.length) {
      elements.push(
        <span key="text-final">
          {studentText.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              {studentName} 학생 글 첨삭
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={historyIndex === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onSave(feedbacks)}
              >
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-6">
            {/* 왼쪽: 첨삭 도구 */}
            <div className="col-span-3 space-y-4">
              <div>
                <Label>피드백 유형</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {FEEDBACK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Toggle
                        key={type.value}
                        pressed={feedbackType === type.value}
                        onPressedChange={() => setFeedbackType(type.value)}
                        className="flex flex-col gap-1 h-auto py-2"
                      >
                        <Icon className={`h-5 w-5 ${type.color}`} />
                        <span className="text-xs">{type.label}</span>
                      </Toggle>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>강조 색상</Label>
                <div className="flex gap-2 mt-2">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setHighlightColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        highlightColor === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>자주 사용하는 피드백</Label>
                <div className="space-y-2 mt-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => selectedText && addFeedback(template)}
                      disabled={!selectedText}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                AI 참고 의견
              </Button>
            </div>

            {/* 가운데: 학생 글 */}
            <div className="col-span-6">
              <Card>
                <CardContent className="p-6">
                  <div 
                    ref={textRef}
                    className="prose prose-lg max-w-none leading-loose select-text"
                    onMouseUp={handleTextSelection}
                  >
                    {renderTextWithHighlights()}
                  </div>
                </CardContent>
              </Card>
              
              {selectedText && (
                <Card className="mt-4 p-4 border-blue-200 bg-blue-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">선택한 텍스트:</p>
                      <Badge variant="outline">{selectedText.text.length}자</Badge>
                    </div>
                    <p className="text-sm bg-white p-2 rounded border">
                      "{selectedText.text}"
                    </p>
                    <Textarea
                      placeholder="피드백을 입력하세요..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={() => addFeedback()}
                      disabled={!feedbackComment.trim()}
                      className="w-full"
                    >
                      피드백 추가
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* 오른쪽: 피드백 목록 */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">피드백 목록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {feedbacks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      텍스트를 선택하여 피드백을 추가하세요
                    </p>
                  ) : (
                    feedbacks.map((feedback) => {
                      const type = FEEDBACK_TYPES.find(t => t.value === feedback.type);
                      const Icon = type?.icon || MessageSquare;
                      
                      return (
                        <div key={feedback.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${type?.color}`} />
                              <Badge variant="outline" className="text-xs">
                                {type?.label}
                              </Badge>
                            </div>
                            <button
                              onClick={() => removeFeedback(feedback.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              삭제
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 italic">
                            "{feedback.text}"
                          </p>
                          <p className="text-sm">{feedback.comment}</p>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {showAISuggestions && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      AI 참고 의견
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      선생님의 첨삭을 돕기 위한 참고 의견입니다. 
                      최종 판단은 선생님께서 해주세요.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-yellow-50 rounded">
                        <p className="font-medium">문장 구조</p>
                        <p className="text-gray-600">복문이 많아 읽기 어려울 수 있습니다.</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-medium">어휘 사용</p>
                        <p className="text-gray-600">학년 수준에 적절한 어휘를 사용했습니다.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 첨삭 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">첨삭 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {FEEDBACK_TYPES.map((type) => {
              const count = feedbacks.filter(f => f.type === type.value).length;
              const Icon = type.icon;
              return (
                <div key={type.value} className="text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-600">{type.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}