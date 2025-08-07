'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Brain,
  Upload,
  BookOpen,
  MessageSquare,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface AITrainingPanelProps {
  textbookId: string;
  content: any;
}

interface TrainingData {
  id: string;
  type: 'context' | 'faq' | 'objective' | 'vocabulary';
  title: string;
  content: string;
  status: 'pending' | 'training' | 'completed' | 'error';
}

export function AITrainingPanel({ textbookId, content }: AITrainingPanelProps) {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [additionalContext, setAdditionalContext] = useState('');
  const [faqs, setFaqs] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [vocabulary, setVocabulary] = useState('');

  const addTrainingData = (type: TrainingData['type'], title: string, content: string) => {
    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    const newData: TrainingData = {
      id: `train-${Date.now()}`,
      type,
      title,
      content,
      status: 'pending',
    };

    setTrainingData([...trainingData, newData]);
    
    // Clear the input
    switch (type) {
      case 'context':
        setAdditionalContext('');
        break;
      case 'faq':
        setFaqs('');
        break;
      case 'objective':
        setLearningObjectives('');
        break;
      case 'vocabulary':
        setVocabulary('');
        break;
    }
    
    toast.success('학습 데이터가 추가되었습니다');
  };

  const startTraining = async () => {
    if (trainingData.length === 0) {
      toast.error('학습할 데이터를 추가해주세요');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Process each training data
      for (let i = 0; i < trainingData.length; i++) {
        const data = trainingData[i];
        
        // Update status to training
        setTrainingData(prev => prev.map(d => 
          d.id === data.id ? { ...d, status: 'training' } : d
        ));

        // Simulate API call
        await fetch('/api/textbooks/train-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textbookId,
            trainingData: data,
            content: content,
          }),
        });

        // Update status to completed
        setTrainingData(prev => prev.map(d => 
          d.id === data.id ? { ...d, status: 'completed' } : d
        ));

        setTrainingProgress(((i + 1) / trainingData.length) * 100);
      }

      toast.success('AI 학습이 완료되었습니다');
    } catch (error) {
      toast.error('AI 학습 중 오류가 발생했습니다');
      setTrainingData(prev => prev.map(d => ({ ...d, status: 'error' })));
    } finally {
      setIsTraining(false);
    }
  };

  const extractDataFromContent = () => {
    // Extract key information from textbook content
    let extractedObjectives = '';
    let extractedVocabulary = '';

    // Simple extraction logic (can be enhanced)
    content.chapters.forEach((chapter: any) => {
      chapter.sections.forEach((section: any) => {
        section.pages.forEach((page: any) => {
          // Extract learning objectives
          if (page.content.includes('학습 목표')) {
            extractedObjectives += page.content.split('학습 목표')[1].split('\n')[0] + '\n';
          }
          
          // Extract vocabulary (simple pattern matching)
          const vocabPattern = /【(.+?)】/g;
          const matches = page.content.match(vocabPattern);
          if (matches) {
            extractedVocabulary += matches.join('\n') + '\n';
          }
        });
      });
    });

    if (extractedObjectives) {
      setLearningObjectives(extractedObjectives);
      toast.success('학습 목표가 추출되었습니다');
    }
    
    if (extractedVocabulary) {
      setVocabulary(extractedVocabulary);
      toast.success('핵심 어휘가 추출되었습니다');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <Card className="p-6">
          <Tabs defaultValue="context" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="context">추가 맥락</TabsTrigger>
              <TabsTrigger value="faq">자주 묻는 질문</TabsTrigger>
              <TabsTrigger value="objectives">학습 목표</TabsTrigger>
              <TabsTrigger value="vocabulary">핵심 어휘</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="space-y-4">
              <div>
                <Label>추가 학습 자료</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  AI 튜터가 참고할 추가적인 배경 지식이나 관련 정보를 입력하세요
                </p>
                <Textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="예: 이 단원은 조선시대 후기의 사회 변화를 다룹니다. 특히 실학 사상의 등장 배경과..."
                  rows={8}
                />
                <Button
                  className="mt-2"
                  onClick={() => addTrainingData('context', '추가 맥락', additionalContext)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  추가하기
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <div>
                <Label>자주 묻는 질문과 답변</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  학생들이 자주 묻는 질문과 모범 답변을 입력하세요 (Q: 질문 / A: 답변 형식)
                </p>
                <Textarea
                  value={faqs}
                  onChange={(e) => setFaqs(e.target.value)}
                  placeholder="Q: 실학이 등장하게 된 배경은 무엇인가요?&#10;A: 조선 후기 사회의 모순과 문제점을 해결하고자..."
                  rows={8}
                />
                <Button
                  className="mt-2"
                  onClick={() => addTrainingData('faq', 'FAQ', faqs)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  추가하기
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>학습 목표</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={extractDataFromContent}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    콘텐츠에서 추출
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  각 단원별 학습 목표를 명확히 입력하세요
                </p>
                <Textarea
                  value={learningObjectives}
                  onChange={(e) => setLearningObjectives(e.target.value)}
                  placeholder="1. 실학 사상의 등장 배경을 설명할 수 있다.&#10;2. 주요 실학자들의 사상을 비교할 수 있다."
                  rows={8}
                />
                <Button
                  className="mt-2"
                  onClick={() => addTrainingData('objective', '학습 목표', learningObjectives)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  추가하기
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="vocabulary" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>핵심 어휘 및 개념</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={extractDataFromContent}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    콘텐츠에서 추출
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  중요한 용어와 그 정의를 입력하세요
                </p>
                <Textarea
                  value={vocabulary}
                  onChange={(e) => setVocabulary(e.target.value)}
                  placeholder="실학: 조선 후기에 나타난 실용적이고 개혁적인 학문&#10;북학: 청나라의 선진 문물을 받아들이자는 주장"
                  rows={8}
                />
                <Button
                  className="mt-2"
                  onClick={() => addTrainingData('vocabulary', '핵심 어휘', vocabulary)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  추가하기
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="col-span-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">학습 데이터 목록</h3>
          
          <ScrollArea className="h-[300px] mb-4">
            <div className="space-y-2">
              {trainingData.map((data) => (
                <div
                  key={data.id}
                  className="p-3 border rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{data.title}</span>
                    {data.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {data.status === 'training' && (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {data.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {data.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {isTraining && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>학습 진행률</span>
                <span>{Math.round(trainingProgress)}%</span>
              </div>
              <Progress value={trainingProgress} />
            </div>
          )}

          <Button
            className="w-full"
            onClick={startTraining}
            disabled={isTraining || trainingData.length === 0}
          >
            {isTraining ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                학습 중...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                AI 학습 시작
              </>
            )}
          </Button>
        </Card>

        <Alert className="mt-4">
          <Brain className="h-4 w-4" />
          <AlertTitle>AI 학습 안내</AlertTitle>
          <AlertDescription>
            추가한 학습 데이터는 AI 튜터가 학생들의 질문에 더 정확하고 
            맥락에 맞는 답변을 제공하는 데 사용됩니다.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}