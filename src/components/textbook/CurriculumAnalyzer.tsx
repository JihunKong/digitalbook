'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Plus,
  X,
  Brain,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface CurriculumAnalyzerProps {
  subject: string;
  grade: number;
  onAnalysisComplete: (analysis: CurriculumAnalysis) => void;
}

interface CurriculumAnalysis {
  coreCompetencies: string[];
  learningGoals: LearningGoal[];
  teachingStrategies: TeachingStrategy[];
  assessmentCriteria: AssessmentCriterion[];
  studentProfiles: StudentProfile[];
}

interface LearningGoal {
  id: string;
  category: 'knowledge' | 'skill' | 'attitude';
  description: string;
  subGoals: string[];
  relatedCompetencies: string[];
}

interface TeachingStrategy {
  id: string;
  name: string;
  description: string;
  activities: string[];
  materials: string[];
}

interface AssessmentCriterion {
  id: string;
  type: 'formative' | 'summative';
  description: string;
  criteria: string[];
  weight: number;
}

interface StudentProfile {
  id: string;
  type: string;
  characteristics: string[];
  strategies: string[];
}

export function CurriculumAnalyzer({ subject, grade, onAnalysisComplete }: CurriculumAnalyzerProps) {
  const [curriculumText, setCurriculumText] = useState('');
  const [analysis, setAnalysis] = useState<CurriculumAnalysis>({
    coreCompetencies: [],
    learningGoals: [],
    teachingStrategies: [],
    assessmentCriteria: [],
    studentProfiles: [],
  });
  const [activeTab, setActiveTab] = useState('input');
  const [newCompetency, setNewCompetency] = useState('');
  const [currentGoal, setCurrentGoal] = useState<Partial<LearningGoal>>({
    category: 'knowledge',
    description: '',
    subGoals: [],
    relatedCompetencies: [],
  });

  // 교사가 직접 교육과정을 분석하고 해석
  const analyzeManually = () => {
    if (!curriculumText) {
      toast.error('교육과정 내용을 입력해주세요');
      return;
    }
    setActiveTab('competencies');
    toast.success('이제 핵심 역량을 추출해주세요');
  };

  // AI는 교사의 분석을 지원하는 역할만 수행
  const requestAISuggestions = async (type: string) => {
    try {
      toast.info('AI가 참고 자료를 준비하고 있습니다...');
      
      // AI는 제안만 하고, 최종 결정은 교사가 수행
      const response = await fetch('/api/textbooks/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          curriculumText,
          currentAnalysis: analysis,
          context: { subject, grade },
        }),
      });

      const suggestions = await response.json();
      toast.success('AI 제안을 참고하여 직접 선택해주세요');
      
      // 제안된 내용을 표시하되, 교사가 선택할 수 있도록 함
      return suggestions;
    } catch (error) {
      toast.error('AI 제안을 불러오는데 실패했습니다');
    }
  };

  const addCompetency = () => {
    if (!newCompetency.trim()) return;
    setAnalysis({
      ...analysis,
      coreCompetencies: [...analysis.coreCompetencies, newCompetency],
    });
    setNewCompetency('');
  };

  const addLearningGoal = () => {
    if (!currentGoal.description) {
      toast.error('학습 목표를 입력해주세요');
      return;
    }

    const newGoal: LearningGoal = {
      id: `goal-${Date.now()}`,
      category: currentGoal.category as any,
      description: currentGoal.description,
      subGoals: currentGoal.subGoals || [],
      relatedCompetencies: currentGoal.relatedCompetencies || [],
    };

    setAnalysis({
      ...analysis,
      learningGoals: [...analysis.learningGoals, newGoal],
    });

    setCurrentGoal({
      category: 'knowledge',
      description: '',
      subGoals: [],
      relatedCompetencies: [],
    });
  };

  const addTeachingStrategy = (strategy: TeachingStrategy) => {
    setAnalysis({
      ...analysis,
      teachingStrategies: [...analysis.teachingStrategies, strategy],
    });
  };

  const completeAnalysis = () => {
    if (analysis.coreCompetencies.length === 0 || analysis.learningGoals.length === 0) {
      toast.error('핵심 역량과 학습 목표를 최소 1개 이상 입력해주세요');
      return;
    }
    onAnalysisComplete(analysis);
    toast.success('교육과정 분석이 완료되었습니다');
  };

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="input">교육과정 입력</TabsTrigger>
          <TabsTrigger value="competencies">핵심 역량</TabsTrigger>
          <TabsTrigger value="goals">학습 목표</TabsTrigger>
          <TabsTrigger value="strategies">교수 전략</TabsTrigger>
          <TabsTrigger value="assessment">평가 계획</TabsTrigger>
          <TabsTrigger value="students">학습자 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <div>
            <Label>교육과정 내용</Label>
            <p className="text-sm text-muted-foreground mb-2">
              {subject} {grade}학년 교육과정의 성취기준과 학습 요소를 입력하세요
            </p>
            <Textarea
              value={curriculumText}
              onChange={(e) => setCurriculumText(e.target.value)}
              placeholder="예: [6국01-02] 의견을 제시하고 함께 조정하며 토의한다..."
              rows={10}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={analyzeManually}>
              <BookOpen className="h-4 w-4 mr-2" />
              직접 분석 시작
            </Button>
            <Button variant="outline" onClick={() => requestAISuggestions('overview')}>
              <Brain className="h-4 w-4 mr-2" />
              AI 참고자료 요청
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">핵심 역량 도출</h3>
            <p className="text-sm text-muted-foreground mb-4">
              교육과정에서 강조하는 핵심 역량을 교사의 관점에서 해석하여 추출하세요
            </p>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                placeholder="예: 비판적 사고력, 의사소통 능력..."
                onKeyPress={(e) => e.key === 'Enter' && addCompetency()}
              />
              <Button onClick={addCompetency}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {analysis.coreCompetencies.map((comp, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {comp}
                  <button
                    onClick={() => setAnalysis({
                      ...analysis,
                      coreCompetencies: analysis.coreCompetencies.filter((_, i) => i !== idx)
                    })}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => requestAISuggestions('competencies')}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI에게 다른 관점 요청하기
          </Button>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">학습 목표 설정</h3>
            <p className="text-sm text-muted-foreground mb-4">
              교사의 교육 철학을 반영한 구체적인 학습 목표를 설정하세요
            </p>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2">
                <Label>
                  <input
                    type="radio"
                    name="category"
                    value="knowledge"
                    checked={currentGoal.category === 'knowledge'}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, category: 'knowledge' })}
                  />
                  <span className="ml-2">지식</span>
                </Label>
                <Label>
                  <input
                    type="radio"
                    name="category"
                    value="skill"
                    checked={currentGoal.category === 'skill'}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, category: 'skill' })}
                  />
                  <span className="ml-2">기능</span>
                </Label>
                <Label>
                  <input
                    type="radio"
                    name="category"
                    value="attitude"
                    checked={currentGoal.category === 'attitude'}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, category: 'attitude' })}
                  />
                  <span className="ml-2">태도</span>
                </Label>
              </div>

              <div>
                <Label>학습 목표</Label>
                <Textarea
                  value={currentGoal.description || ''}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
                  placeholder="구체적이고 측정 가능한 학습 목표를 작성하세요"
                  rows={3}
                />
              </div>

              <Button onClick={addLearningGoal}>
                <Target className="h-4 w-4 mr-2" />
                학습 목표 추가
              </Button>
            </div>

            <ScrollArea className="h-[200px] mt-4">
              <div className="space-y-2">
                {analysis.learningGoals.map((goal) => (
                  <Card key={goal.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {goal.category === 'knowledge' && '지식'}
                          {goal.category === 'skill' && '기능'}
                          {goal.category === 'attitude' && '태도'}
                        </Badge>
                        <p className="text-sm">{goal.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAnalysis({
                          ...analysis,
                          learningGoals: analysis.learningGoals.filter(g => g.id !== goal.id)
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <TeachingStrategyBuilder 
            onAdd={addTeachingStrategy}
            learningGoals={analysis.learningGoals}
          />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <AssessmentPlanBuilder 
            learningGoals={analysis.learningGoals}
            onUpdate={(criteria: any) => setAnalysis({ ...analysis, assessmentCriteria: criteria })}
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentProfileBuilder
            onUpdate={(profiles: any) => setAnalysis({ ...analysis, studentProfiles: profiles })}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-between">
        <div className="text-sm text-muted-foreground">
          완성도: {Object.values(analysis).filter(v => Array.isArray(v) && v.length > 0).length}/5
        </div>
        <Button onClick={completeAnalysis} disabled={activeTab === 'input'}>
          분석 완료
        </Button>
      </div>
    </Card>
  );
}

// 교수 전략 설계 컴포넌트
function TeachingStrategyBuilder({ onAdd, learningGoals }: any) {
  const [strategy, setStrategy] = useState<Partial<TeachingStrategy>>({
    name: '',
    description: '',
    activities: [],
    materials: [],
  });

  const teachingMethods = [
    { name: '프로젝트 학습', icon: Lightbulb },
    { name: '협동 학습', icon: Users },
    { name: '탐구 학습', icon: Brain },
    { name: '토론 학습', icon: FileText },
  ];

  return (
    <div>
      <h3 className="font-semibold mb-2">교수-학습 전략 설계</h3>
      <p className="text-sm text-muted-foreground mb-4">
        학습 목표 달성을 위한 교사만의 창의적인 교수 전략을 설계하세요
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {teachingMethods.map((method) => (
          <Button
            key={method.name}
            variant={strategy.name === method.name ? 'default' : 'outline'}
            onClick={() => setStrategy({ ...strategy, name: method.name })}
            className="justify-start"
          >
            <method.icon className="h-4 w-4 mr-2" />
            {method.name}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label>전략 설명</Label>
          <Textarea
            value={strategy.description || ''}
            onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
            placeholder="이 전략을 선택한 이유와 구체적인 실행 방법을 설명하세요"
            rows={3}
          />
        </div>

        <div>
          <Label>주요 활동</Label>
          <p className="text-xs text-muted-foreground mb-2">
            학생들이 수행할 구체적인 활동을 순서대로 입력하세요
          </p>
          {/* 활동 입력 UI */}
        </div>

        <Button onClick={() => {
          if (strategy.name && strategy.description) {
            onAdd({
              ...strategy,
              id: `strategy-${Date.now()}`,
            });
            setStrategy({ name: '', description: '', activities: [], materials: [] });
          }
        }}>
          전략 추가
        </Button>
      </div>
    </div>
  );
}

// 평가 계획 수립 컴포넌트
function AssessmentPlanBuilder({ learningGoals, onUpdate }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-2">평가 계획 수립</h3>
      <p className="text-sm text-muted-foreground mb-4">
        학습 목표에 맞는 다양한 평가 방법을 계획하세요
      </p>
      {/* 평가 계획 UI */}
    </div>
  );
}

// 학습자 분석 컴포넌트
function StudentProfileBuilder({ onUpdate }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-2">학습자 특성 분석</h3>
      <p className="text-sm text-muted-foreground mb-4">
        교실의 다양한 학습자 특성을 고려한 맞춤형 전략을 수립하세요
      </p>
      {/* 학습자 프로필 UI */}
    </div>
  );
}