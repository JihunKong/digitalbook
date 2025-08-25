'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  PlusCircle,
  Trash2,
  Edit,
  Save,
  FileText,
  CheckCircle2,
  MessageSquare,
  PenTool,
  Settings,
  Eye,
  Copy
} from 'lucide-react';

import QuestionBuilder from './QuestionBuilder';
import ActivityPreview from './ActivityPreview';

export interface Question {
  id: string;
  text: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  blanks?: { id: string; position: number; correctAnswer: string }[];
  points: number;
  explanation?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'essay' | 'mixed';
  pageNumber: number;
  questions: Question[];
  timeLimit?: number;
  attempts?: number;
  isRequired: boolean;
  publishDate?: Date;
  dueDate?: Date;
  settings: {
    allowPartialCredit: boolean;
    shuffleQuestions: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
  };
}

interface ActivityBuilderProps {
  pdfId: string;
  currentPage: number;
  existingActivities?: Activity[];
  onSave: (activity: Activity) => Promise<void>;
  onDelete: (activityId: string) => Promise<void>;
  onClose: () => void;
}

export default function ActivityBuilder({
  pdfId,
  currentPage,
  existingActivities = [],
  onSave,
  onDelete,
  onClose
}: ActivityBuilderProps) {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    id: '',
    title: '',
    description: '',
    type: 'multiple_choice',
    pageNumber: currentPage,
    questions: [],
    timeLimit: 0,
    attempts: 0,
    isRequired: false,
    settings: {
      allowPartialCredit: true,
      shuffleQuestions: false,
      showCorrectAnswers: true,
      showExplanations: true
    }
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pageActivities = existingActivities.filter(activity => 
    activity.pageNumber === currentPage
  );

  const resetActivity = useCallback(() => {
    setCurrentActivity({
      id: '',
      title: '',
      description: '',
      type: 'multiple_choice',
      pageNumber: currentPage,
      questions: [],
      timeLimit: 0,
      attempts: 0,
      isRequired: false,
      settings: {
        allowPartialCredit: true,
        shuffleQuestions: false,
        showCorrectAnswers: true,
        showExplanations: true
      }
    });
    setSelectedActivityId(null);
  }, [currentPage]);

  const loadActivity = useCallback((activity: Activity) => {
    setCurrentActivity({ ...activity });
    setSelectedActivityId(activity.id);
    setActiveTab('create');
  }, []);

  const duplicateActivity = useCallback((activity: Activity) => {
    const duplicated = {
      ...activity,
      id: '',
      title: `${activity.title} (복사본)`,
      questions: activity.questions.map(q => ({
        ...q,
        id: crypto.randomUUID()
      }))
    };
    setCurrentActivity(duplicated);
    setSelectedActivityId(null);
    setActiveTab('create');
  }, []);

  const handleSave = async () => {
    if (!currentActivity.title || currentActivity.questions.length === 0) {
      alert('제목과 최소 하나의 문제가 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const activityToSave = {
        ...currentActivity,
        id: currentActivity.id || crypto.randomUUID(),
        type: currentActivity.questions.length === 1 
          ? currentActivity.questions[0].type 
          : 'mixed' as const
      };
      
      await onSave(activityToSave);
      setCurrentActivity(activityToSave);
      setSelectedActivityId(activityToSave.id);
      setActiveTab('manage');
    } catch (error) {
      console.error('Activity save error:', error);
      alert('활동 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('이 활동을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
      try {
        await onDelete(activityId);
        if (selectedActivityId === activityId) {
          resetActivity();
        }
      } catch (error) {
        console.error('Activity delete error:', error);
        alert('활동 삭제에 실패했습니다.');
      }
    }
  };

  const updateActivity = (updates: Partial<Activity>) => {
    setCurrentActivity(prev => ({ ...prev, ...updates }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: currentActivity.type === 'mixed' ? 'multiple_choice' : currentActivity.type,
      points: 1,
      options: currentActivity.type === 'multiple_choice' || currentActivity.type === 'mixed' 
        ? ['', '', '', ''] 
        : undefined,
      blanks: currentActivity.type === 'fill_in_blank' 
        ? [{ id: crypto.randomUUID(), position: 0, correctAnswer: '' }] 
        : undefined
    };
    
    setCurrentActivity(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setCurrentActivity(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setCurrentActivity(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'fill_in_blank': return <PenTool className="h-4 w-4" />;
      case 'multiple_choice': return <CheckCircle2 className="h-4 w-4" />;
      case 'essay': return <MessageSquare className="h-4 w-4" />;
      case 'mixed': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'fill_in_blank': return '빈칸 채우기';
      case 'multiple_choice': return '객관식';
      case 'essay': return '서술형';
      case 'mixed': return '혼합형';
      default: return '활동';
    }
  };

  if (isPreviewMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">활동 미리보기</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              편집으로 돌아가기
            </Button>
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <ActivityPreview 
            activity={currentActivity} 
            isTeacherView={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">
          활동 빌더 - 페이지 {currentPage}
        </h3>
        <div className="flex gap-2">
          {currentActivity.questions.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(true)}>
              <Eye className="h-4 w-4 mr-1" />
              미리보기
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">활동 만들기</TabsTrigger>
            <TabsTrigger value="manage">활동 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="h-full">
            <div className="p-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        기본 정보
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">활동 제목 *</Label>
                        <Input
                          id="title"
                          value={currentActivity.title}
                          onChange={(e) => updateActivity({ title: e.target.value })}
                          placeholder="활동 제목을 입력하세요"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Textarea
                          id="description"
                          value={currentActivity.description}
                          onChange={(e) => updateActivity({ description: e.target.value })}
                          placeholder="활동에 대한 간단한 설명을 입력하세요"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="timeLimit">제한 시간 (분)</Label>
                          <Input
                            id="timeLimit"
                            type="number"
                            min="0"
                            value={currentActivity.timeLimit || 0}
                            onChange={(e) => updateActivity({ 
                              timeLimit: parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="attempts">허용 시도 횟수</Label>
                          <Input
                            id="attempts"
                            type="number"
                            min="0"
                            value={currentActivity.attempts || 0}
                            onChange={(e) => updateActivity({ 
                              attempts: parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          문제 ({currentActivity.questions.length})
                        </span>
                        <Button size="sm" onClick={addQuestion}>
                          <PlusCircle className="h-4 w-4 mr-1" />
                          문제 추가
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentActivity.questions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>아직 문제가 없습니다.</p>
                          <p className="text-sm">위의 "문제 추가" 버튼을 클릭하여 시작하세요.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentActivity.questions.map((question, index) => (
                            <QuestionBuilder
                              key={question.id}
                              question={question}
                              index={index}
                              onUpdate={(updates) => updateQuestion(question.id, updates)}
                              onDelete={() => deleteQuestion(question.id)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={resetActivity}>
                      초기화
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? '저장 중...' : '활동 저장'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="h-full">
            <div className="p-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {pageActivities.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-gray-500 mb-4">
                          페이지 {currentPage}에 활동이 없습니다.
                        </p>
                        <Button onClick={() => setActiveTab('create')}>
                          첫 번째 활동 만들기
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    pageActivities.map((activity) => (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getActivityTypeIcon(activity.type)}
                                <h4 className="font-medium">{activity.title}</h4>
                                <Badge variant="outline">
                                  {getActivityTypeLabel(activity.type)}
                                </Badge>
                                {activity.isRequired && (
                                  <Badge variant="default">필수</Badge>
                                )}
                              </div>
                              
                              {activity.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {activity.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{activity.questions.length}개 문제</span>
                                {activity.timeLimit && activity.timeLimit > 0 && (
                                  <span>제한시간 {activity.timeLimit}분</span>
                                )}
                                {activity.attempts && activity.attempts > 0 && (
                                  <span>시도 {activity.attempts}회</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadActivity(activity)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => duplicateActivity(activity)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(activity.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}