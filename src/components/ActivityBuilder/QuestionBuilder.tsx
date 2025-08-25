'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Plus, 
  Minus,
  CheckCircle2,
  Circle,
  Edit,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

import { Question } from './index';

interface QuestionBuilderProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

export default function QuestionBuilder({
  question,
  index,
  onUpdate,
  onDelete
}: QuestionBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [previewText, setPreviewText] = useState('');

  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate(updates);
  };

  const addOption = () => {
    if (question.options) {
      updateQuestion({
        options: [...question.options, '']
      });
    } else {
      updateQuestion({
        options: ['', '', '', '']
      });
    }
  };

  const updateOption = (optionIndex: number, value: string) => {
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion({ options: newOptions });
    }
  };

  const removeOption = (optionIndex: number) => {
    if (question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion({ 
        options: newOptions,
        correctAnswer: question.correctAnswer === optionIndex 
          ? undefined 
          : (typeof question.correctAnswer === 'number' && question.correctAnswer > optionIndex)
            ? question.correctAnswer - 1
            : question.correctAnswer
      });
    }
  };

  const addBlank = () => {
    const newBlank = {
      id: crypto.randomUUID(),
      position: question.blanks?.length || 0,
      correctAnswer: ''
    };
    updateQuestion({
      blanks: [...(question.blanks || []), newBlank]
    });
  };

  const updateBlank = (blankId: string, correctAnswer: string) => {
    if (question.blanks) {
      const newBlanks = question.blanks.map(blank =>
        blank.id === blankId ? { ...blank, correctAnswer } : blank
      );
      updateQuestion({ blanks: newBlanks });
    }
  };

  const removeBlank = (blankId: string) => {
    if (question.blanks && question.blanks.length > 1) {
      updateQuestion({
        blanks: question.blanks.filter(blank => blank.id !== blankId)
      });
    }
  };

  const updateFillInBlankText = (text: string) => {
    updateQuestion({ text });
    
    // Count blanks in text
    const blankCount = (text.match(/___/g) || []).length;
    const currentBlanks = question.blanks || [];
    
    if (blankCount !== currentBlanks.length) {
      // Adjust blanks array to match text
      const newBlanks = [];
      for (let i = 0; i < blankCount; i++) {
        newBlanks.push(
          currentBlanks[i] || {
            id: crypto.randomUUID(),
            position: i,
            correctAnswer: ''
          }
        );
      }
      updateQuestion({ blanks: newBlanks });
    }
  };

  const renderQuestionTypeEditor = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`question-text-${question.id}`}>문제 *</Label>
              <Textarea
                id={`question-text-${question.id}`}
                value={question.text}
                onChange={(e) => updateQuestion({ text: e.target.value })}
                placeholder="문제를 입력하세요..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>선택지</Label>
                <Button size="sm" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  선택지 추가
                </Button>
              </div>
              
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                    onClick={() => updateQuestion({ correctAnswer: optionIndex })}
                    className="min-w-[32px] px-2"
                  >
                    {question.correctAnswer === optionIndex ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`선택지 ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  {(question.options?.length || 0) > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`question-text-${question.id}`}>
                문제 * 
                <span className="text-sm text-gray-500 ml-2">
                  빈칸은 ___로 표시하세요
                </span>
              </Label>
              <Textarea
                id={`question-text-${question.id}`}
                value={question.text}
                onChange={(e) => updateFillInBlankText(e.target.value)}
                placeholder="문제를 입력하세요. 빈칸은 ___ (언더바 3개)로 표시하세요."
                rows={3}
              />
            </div>

            {question.blanks && question.blanks.length > 0 && (
              <div className="space-y-2">
                <Label>정답</Label>
                {question.blanks.map((blank, blankIndex) => (
                  <div key={blank.id} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-[60px]">
                      빈칸 {blankIndex + 1}:
                    </span>
                    <Input
                      value={blank.correctAnswer}
                      onChange={(e) => updateBlank(blank.id, e.target.value)}
                      placeholder="정답을 입력하세요"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`question-text-${question.id}`}>문제 *</Label>
              <Textarea
                id={`question-text-${question.id}`}
                value={question.text}
                onChange={(e) => updateQuestion({ text: e.target.value })}
                placeholder="서술형 문제를 입력하세요..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`sample-answer-${question.id}`}>예시 답안 (선택사항)</Label>
              <Textarea
                id={`sample-answer-${question.id}`}
                value={question.explanation || ''}
                onChange={(e) => updateQuestion({ explanation: e.target.value })}
                placeholder="학생들에게 도움이 될 예시 답안을 입력하세요..."
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isExpanded) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {question.type === 'multiple_choice' && '객관식'}
                {question.type === 'fill_in_blank' && '빈칸 채우기'}
                {question.type === 'essay' && '서술형'}
              </Badge>
              <span className="font-medium">
                문제 {index + 1}: {question.text.slice(0, 50)}
                {question.text.length > 50 ? '...' : ''}
              </span>
              <span className="text-sm text-gray-500">
                ({question.points}점)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>문제 {index + 1}</span>
            <Badge variant="outline">
              {question.type === 'multiple_choice' && '객관식'}
              {question.type === 'fill_in_blank' && '빈칸 채우기'}
              {question.type === 'essay' && '서술형'}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question Type Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>문제 유형</Label>
            <Select
              value={question.type}
              onValueChange={(value: 'fill_in_blank' | 'multiple_choice' | 'essay') => {
                let updates: Partial<Question> = { type: value };
                
                // Reset type-specific fields
                if (value === 'multiple_choice') {
                  updates.options = ['', '', '', ''];
                  updates.correctAnswer = undefined;
                  updates.blanks = undefined;
                } else if (value === 'fill_in_blank') {
                  updates.blanks = [{ id: crypto.randomUUID(), position: 0, correctAnswer: '' }];
                  updates.options = undefined;
                  updates.correctAnswer = undefined;
                } else if (value === 'essay') {
                  updates.options = undefined;
                  updates.correctAnswer = undefined;
                  updates.blanks = undefined;
                }
                
                updateQuestion(updates);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">객관식</SelectItem>
                <SelectItem value="fill_in_blank">빈칸 채우기</SelectItem>
                <SelectItem value="essay">서술형</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>배점</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={question.points}
              onChange={(e) => updateQuestion({ 
                points: Math.max(1, parseInt(e.target.value) || 1) 
              })}
            />
          </div>
        </div>

        <Separator />

        {/* Question Type-specific Editor */}
        {renderQuestionTypeEditor()}

        {/* Explanation */}
        {question.type !== 'essay' && (
          <div className="space-y-2">
            <Label htmlFor={`explanation-${question.id}`}>해설 (선택사항)</Label>
            <Textarea
              id={`explanation-${question.id}`}
              value={question.explanation || ''}
              onChange={(e) => updateQuestion({ explanation: e.target.value })}
              placeholder="문제에 대한 해설을 입력하세요..."
              rows={2}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}