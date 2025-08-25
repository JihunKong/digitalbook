'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CheckCircle2, 
  Circle, 
  PenTool, 
  MessageSquare 
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  blanks?: { id: string; position: number }[];
}

interface Activity {
  id: string;
  title: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'essay';
  questions: Question[];
  pageNumber?: number;
  description?: string;
  timeLimit?: number;
}

interface ActivityPanelProps {
  activities: Activity[];
  isStudent: boolean;
  onActivitySubmit: (activityId: string, answers: any) => void;
  currentPage: number;
}

export default function ActivityPanel({
  activities,
  isStudent,
  onActivitySubmit,
  currentPage
}: ActivityPanelProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submittedActivities, setSubmittedActivities] = useState<Set<string>>(new Set());

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = (activityId: string) => {
    const activityAnswers = {};
    const activity = activities.find(a => a.id === activityId);
    
    if (activity) {
      activity.questions.forEach(q => {
        if (answers[q.id] !== undefined) {
          activityAnswers[q.id] = answers[q.id];
        }
      });
      
      onActivitySubmit(activityId, activityAnswers);
      setSubmittedActivities(prev => new Set(prev).add(activityId));
      
      // Clear answers for this activity
      const newAnswers = { ...answers };
      activity.questions.forEach(q => {
        delete newAnswers[q.id];
      });
      setAnswers(newAnswers);
      
      setSelectedActivity(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'fill_in_blank':
        return <PenTool className="h-4 w-4" />;
      case 'multiple_choice':
        return <Circle className="h-4 w-4" />;
      case 'essay':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'fill_in_blank':
        return '빈칸 채우기';
      case 'multiple_choice':
        return '객관식';
      case 'essay':
        return '서술형';
      default:
        return '활동';
    }
  };

  const renderQuestion = (question: Question, activityId: string) => {
    const questionKey = question.id;
    const currentAnswer = answers[questionKey];

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div key={question.id} className="space-y-3">
            <p className="font-medium">{question.text}</p>
            <RadioGroup
              value={currentAnswer || ''}
              onValueChange={(value) => handleAnswerChange(questionKey, value)}
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${questionKey}-${index}`} />
                  <Label htmlFor={`${questionKey}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'fill_in_blank':
        const textParts = question.text.split('___');
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-2">
              {textParts.map((part, index) => (
                <span key={index} className="inline-flex items-center">
                  {part}
                  {index < textParts.length - 1 && (
                    <Input
                      className="mx-2 w-24 inline-block"
                      value={currentAnswer?.[index] || ''}
                      onChange={(e) => {
                        const newAnswer = { ...currentAnswer };
                        newAnswer[index] = e.target.value;
                        handleAnswerChange(questionKey, newAnswer);
                      }}
                      placeholder="답"
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        );

      case 'essay':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="font-medium">{question.text}</Label>
            <Textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              placeholder="답안을 입력하세요..."
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!activities.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            페이지 {currentPage} 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">이 페이지에는 활동이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentActivity = selectedActivity 
    ? activities.find(a => a.id === selectedActivity)
    : null;

  if (currentActivity) {
    const isSubmitted = submittedActivities.has(currentActivity.id);
    const hasAnswers = currentActivity.questions.some(q => answers[q.id] !== undefined);
    
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedActivity(null)}
            >
              ← 뒤로
            </Button>
            {!isStudent && (
              <Badge variant="secondary">교사 보기</Badge>
            )}
          </div>
          <CardTitle className="text-sm flex items-center gap-2">
            {getActivityIcon(currentActivity.type)}
            {currentActivity.title}
          </CardTitle>
          {currentActivity.description && (
            <p className="text-sm text-gray-600">{currentActivity.description}</p>
          )}
        </CardHeader>

        <CardContent className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {currentActivity.questions.map((question) =>
                renderQuestion(question, currentActivity.id)
              )}
            </div>
          </ScrollArea>

          {isStudent && !isSubmitted && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => handleSubmit(currentActivity.id)}
                disabled={!hasAnswers}
                className="w-full"
              >
                {hasAnswers ? '제출하기' : '답안을 입력하세요'}
              </Button>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">제출 완료</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          페이지 {currentPage} 활동 ({activities.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const isSubmitted = submittedActivities.has(activity.id);
              
              return (
                <Card 
                  key={activity.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span className="font-medium text-sm">{activity.title}</span>
                      </div>
                      {isStudent && isSubmitted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        문제 {activity.questions.length}개
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}