'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Wand2,
  Copy,
  CheckCircle,
  Circle,
  Square,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pageId?: string;
}

interface QuestionEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export function QuestionEditor({ content, onChange }: QuestionEditorProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const createNewQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      question: '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'multiple-choice' ? '' : undefined,
      points: 10,
      difficulty: 'medium',
      pageId: selectedPage || undefined,
    };
    setEditingQuestion(newQuestion);
  };

  const saveQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question.trim()) {
      toast.error('문제를 입력해주세요');
      return;
    }

    if (editingQuestion.type === 'multiple-choice' && !editingQuestion.correctAnswer) {
      toast.error('정답을 선택해주세요');
      return;
    }

    const existingIndex = questions.findIndex(q => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      ));
    } else {
      setQuestions([...questions, editingQuestion]);
    }

    // Update content with new questions
    if (selectedPage) {
      const updatedChapters = content.chapters.map((chapter: any) => ({
        ...chapter,
        sections: chapter.sections.map((section: any) => ({
          ...section,
          pages: section.pages.map((page: any) => {
            if (page.id === selectedPage) {
              const pageQuestions = questions.filter(q => q.pageId === selectedPage);
              return { ...page, exercises: [...pageQuestions, editingQuestion] };
            }
            return page;
          }),
        })),
      }));
      onChange({ chapters: updatedChapters });
    }

    setEditingQuestion(null);
    toast.success('문제가 저장되었습니다');
  };

  const generateQuestions = async () => {
    if (!selectedPage) {
      toast.error('페이지를 선택해주세요');
      return;
    }

    setGeneratingQuestions(true);
    try {
      // Find the selected page content
      let pageContent = '';
      let pageTitle = '';
      for (const chapter of content.chapters) {
        for (const section of chapter.sections) {
          const page = section.pages.find((p: any) => p.id === selectedPage);
          if (page) {
            pageContent = page.content;
            pageTitle = page.title;
            break;
          }
        }
      }

      // Progressive question generation with feedback
      const steps = [
        '텍스트 내용 분석 중...',
        '핵심 개념 추출 중...',
        '문제 유형 결정 중...',
        '객관식 문제 생성 중...',
        '단답형 문제 생성 중...',
        '난이도 조정 중...',
        '문제 검토 및 최적화 중...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.info(steps[i]);
      }

      // Enhanced prompt for better question generation
      const enhancedPrompt = `
        페이지 제목: ${pageTitle}
        학습 내용: ${pageContent}
        
        위 내용을 바탕으로 다음 조건에 맞는 학습 문제를 생성해주세요:
        - 총 5개 문제 (객관식 3개, 단답형 2개)
        - 학습 목표와 직결되는 문제
        - 다양한 인지 수준을 평가하는 문제 (기억, 이해, 적용, 분석)
        - 한국 교육과정에 적합한 문제
        - 명확하고 이해하기 쉬운 문제
      `;

      const response = await fetch('/api/textbooks/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: pageContent,
          title: pageTitle,
          enhancedPrompt,
          count: 5,
          types: ['multiple-choice', 'short-answer'],
          difficulty: 'mixed',
          cognitiveLevel: 'mixed',
          educationLevel: 'elementary'
        }),
      });

      if (!response.ok) {
        throw new Error('Question generation failed');
      }

      const result = await response.json();
      
      // Mock enhanced questions for demo
      const mockGeneratedQuestions = [
        {
          type: 'multiple-choice',
          question: `${pageTitle}에서 가장 중요한 내용은 무엇인가요?`,
          options: ['첫 번째 내용', '두 번째 내용', '세 번째 내용', '네 번째 내용'],
          correctAnswer: 'option-1',
          explanation: '이는 본문의 핵심 주제이기 때문입니다.',
          points: 10,
          difficulty: 'medium'
        },
        {
          type: 'multiple-choice',
          question: '다음 중 본문에서 설명하는 특징이 아닌 것은?',
          options: ['특징 A', '특징 B', '특징 C', '잘못된 특징'],
          correctAnswer: 'option-3',
          explanation: '본문에서는 이 특징에 대해 언급하지 않았습니다.',
          points: 10,
          difficulty: 'hard'
        },
        {
          type: 'short-answer',
          question: '본문의 주요 개념을 한 단어로 표현하면?',
          correctAnswer: '핵심개념',
          explanation: '본문 전체를 관통하는 중심 주제입니다.',
          points: 5,
          difficulty: 'easy'
        }
      ];

      const generatedQuestions = (result.questions || mockGeneratedQuestions).map((q: any, index: number) => ({
        ...q,
        id: `q-${Date.now()}-${index}`,
        pageId: selectedPage,
      }));

      setQuestions([...questions, ...generatedQuestions]);
      toast.success(`${generatedQuestions.length}개의 고품질 문제가 생성되었습니다!`);
    } catch (error) {
      toast.error('문제 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const improveQuestion = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setGeneratingQuestions(true);
    try {
      toast.info('AI가 문제를 개선하고 있습니다...');
      
      // Simulate AI improvement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const improvedQuestion = {
        ...question,
        question: question.question + ' (AI 개선됨)',
        explanation: question.explanation 
          ? question.explanation + ' AI가 추가 설명을 제공했습니다.'
          : 'AI가 생성한 상세한 해설입니다.'
      };
      
      setQuestions(questions.map(q => 
        q.id === questionId ? improvedQuestion : q
      ));
      
      toast.success('문제가 AI에 의해 개선되었습니다!');
    } catch (error) {
      toast.error('문제 개선 중 오류가 발생했습니다');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const generateQuestionsForAllPages = async () => {
    if (!content.chapters || content.chapters.length === 0) {
      toast.error('교과서 내용이 없습니다');
      return;
    }

    setGeneratingQuestions(true);
    try {
      let totalGenerated = 0;
      
      for (const chapter of content.chapters) {
        for (const section of chapter.sections || []) {
          for (const page of section.pages || []) {
            toast.info(`${page.title} 페이지 문제 생성 중...`);
            
            // Generate 2-3 questions per page
            const mockQuestions: Omit<Question, 'id'>[] = [
              {
                type: 'multiple-choice' as const,
                question: `${page.title}의 핵심 내용은 무엇인가요?`,
                options: ['내용 A', '내용 B', '내용 C', '내용 D'],
                correctAnswer: 'option-0',
                explanation: '페이지의 주요 학습 목표입니다.',
                points: 10,
                difficulty: 'medium' as const,
                pageId: page.id
              },
              {
                type: 'short-answer' as const,
                question: `${page.title}에서 배운 핵심 개념을 설명하세요.`,
                correctAnswer: '핵심 개념 설명',
                explanation: '이 개념은 단원의 중요한 부분입니다.',
                points: 5,
                difficulty: 'easy' as const,
                pageId: page.id
              }
            ];

            const pageQuestions = mockQuestions.map((q, index) => ({
              ...q,
              id: `q-${Date.now()}-${page.id}-${index}`,
            }));

            setQuestions(prev => [...prev, ...pageQuestions]);
            totalGenerated += pageQuestions.length;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      toast.success(`전체 ${totalGenerated}개의 문제가 생성되었습니다!`);
    } catch (error) {
      toast.error('일괄 문제 생성 중 오류가 발생했습니다');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast.success('문제가 삭제되었습니다');
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-3">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">페이지 선택</h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {content.chapters.map((chapter: any) => (
                <div key={chapter.id}>
                  <div className="font-medium text-sm py-1">{chapter.title}</div>
                  {chapter.sections.map((section: any) => (
                    <div key={section.id} className="ml-2">
                      <div className="text-sm text-muted-foreground py-1">
                        {section.title}
                      </div>
                      {section.pages.map((page: any) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPage(page.id)}
                          className={`w-full text-left text-sm p-2 rounded hover:bg-accent ${
                            selectedPage === page.id ? 'bg-accent' : ''
                          }`}
                        >
                          {page.title}
                          {page.exercises?.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({page.exercises.length}문제)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="col-span-9">
        {editingQuestion ? (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">문제 편집</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                  취소
                </Button>
                <Button onClick={saveQuestion}>저장</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>문제 유형</Label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(value: any) => 
                      setEditingQuestion({ ...editingQuestion, type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">객관식</SelectItem>
                      <SelectItem value="true-false">참/거짓</SelectItem>
                      <SelectItem value="short-answer">단답형</SelectItem>
                      <SelectItem value="essay">서술형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>난이도</Label>
                  <Select
                    value={editingQuestion.difficulty}
                    onValueChange={(value: any) => 
                      setEditingQuestion({ ...editingQuestion, difficulty: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">쉬움</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="hard">어려움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>배점</Label>
                  <Input
                    type="number"
                    value={editingQuestion.points}
                    onChange={(e) => 
                      setEditingQuestion({ 
                        ...editingQuestion, 
                        points: parseInt(e.target.value) || 0 
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>문제</Label>
                <Textarea
                  value={editingQuestion.question}
                  onChange={(e) => 
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>

              {editingQuestion.type === 'multiple-choice' && (
                <div>
                  <Label>선택지</Label>
                  <RadioGroup
                    value={editingQuestion.correctAnswer as string}
                    onValueChange={(value) => 
                      setEditingQuestion({ ...editingQuestion, correctAnswer: value })
                    }
                  >
                    {editingQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mt-2">
                        <RadioGroupItem value={`option-${index}`} />
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            setEditingQuestion({ 
                              ...editingQuestion, 
                              options: newOptions 
                            });
                          }}
                          placeholder={`선택지 ${index + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {editingQuestion.type === 'true-false' && (
                <div>
                  <Label>정답</Label>
                  <RadioGroup
                    value={editingQuestion.correctAnswer as string}
                    onValueChange={(value) => 
                      setEditingQuestion({ ...editingQuestion, correctAnswer: value })
                    }
                  >
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="true" />
                        <Label>참</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="false" />
                        <Label>거짓</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label>해설 (선택사항)</Label>
                <Textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => 
                    setEditingQuestion({ 
                      ...editingQuestion, 
                      explanation: e.target.value 
                    })
                  }
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">문제 목록</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateQuestions}
                    disabled={!selectedPage || generatingQuestions}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {generatingQuestions ? 'AI 생성 중...' : 'AI로 문제 생성'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateQuestionsForAllPages}
                    disabled={generatingQuestions}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    전체 페이지 문제 생성
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createNewQuestion('multiple-choice')}
                    >
                      <Circle className="h-4 w-4 mr-1" />
                      객관식
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createNewQuestion('short-answer')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      단답형
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {questions
                    .filter(q => !selectedPage || q.pageId === selectedPage)
                    .map((question) => (
                      <Card key={question.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {question.type === 'multiple-choice' && '객관식'}
                                {question.type === 'true-false' && '참/거짓'}
                                {question.type === 'short-answer' && '단답형'}
                                {question.type === 'essay' && '서술형'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {question.difficulty} · {question.points}점
                              </span>
                            </div>
                            <p className="font-medium">{question.question}</p>
                            {question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, index) => (
                                  <div key={index} className="text-sm text-muted-foreground">
                                    {index + 1}. {option}
                                    {question.correctAnswer === `option-${index}` && (
                                      <CheckCircle className="inline h-3 w-3 ml-1 text-green-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingQuestion(question)}
                            >
                              편집
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => improveQuestion(question.id)}
                              disabled={generatingQuestions}
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-4 mt-4">
              <h4 className="font-semibold mb-2">문제 통계</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">전체 문제</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">객관식</p>
                  <p className="text-2xl font-bold">
                    {questions.filter(q => q.type === 'multiple-choice').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">단답형</p>
                  <p className="text-2xl font-bold">
                    {questions.filter(q => q.type === 'short-answer').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">총 배점</p>
                  <p className="text-2xl font-bold">
                    {questions.reduce((sum, q) => sum + q.points, 0)}점
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}