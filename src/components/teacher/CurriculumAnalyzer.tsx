'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Target, 
  Users, 
  Lightbulb, 
  PenTool,
  Plus,
  X
} from 'lucide-react';

interface LearningObjective {
  id: string;
  description: string;
  competencies: string[];
}

interface TeachingStrategy {
  id: string;
  activity: string;
  purpose: string;
  materials: string[];
}

interface CurriculumAnalysis {
  grade: number;
  subject: string;
  unit: string;
  coreCompetencies: string[];
  objectives: LearningObjective[];
  strategies: TeachingStrategy[];
  assessmentPlan: string;
  notes: string;
}

export function CurriculumAnalyzer() {
  const [analysis, setAnalysis] = useState<CurriculumAnalysis>({
    grade: 5,
    subject: '국어',
    unit: '',
    coreCompetencies: [],
    objectives: [],
    strategies: [],
    assessmentPlan: '',
    notes: ''
  });

  const [newCompetency, setNewCompetency] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const addCompetency = () => {
    if (newCompetency.trim()) {
      setAnalysis({
        ...analysis,
        coreCompetencies: [...analysis.coreCompetencies, newCompetency.trim()]
      });
      setNewCompetency('');
    }
  };

  const removeCompetency = (index: number) => {
    setAnalysis({
      ...analysis,
      coreCompetencies: analysis.coreCompetencies.filter((_, i) => i !== index)
    });
  };

  const addObjective = () => {
    const newObjective: LearningObjective = {
      id: Date.now().toString(),
      description: '',
      competencies: []
    };
    setAnalysis({
      ...analysis,
      objectives: [...analysis.objectives, newObjective]
    });
  };

  const updateObjective = (id: string, field: keyof LearningObjective, value: any) => {
    setAnalysis({
      ...analysis,
      objectives: analysis.objectives.map(obj =>
        obj.id === id ? { ...obj, [field]: value } : obj
      )
    });
  };

  const removeObjective = (id: string) => {
    setAnalysis({
      ...analysis,
      objectives: analysis.objectives.filter(obj => obj.id !== id)
    });
  };

  const addStrategy = () => {
    const newStrategy: TeachingStrategy = {
      id: Date.now().toString(),
      activity: '',
      purpose: '',
      materials: []
    };
    setAnalysis({
      ...analysis,
      strategies: [...analysis.strategies, newStrategy]
    });
  };

  const updateStrategy = (id: string, field: keyof TeachingStrategy, value: any) => {
    setAnalysis({
      ...analysis,
      strategies: analysis.strategies.map(str =>
        str.id === id ? { ...str, [field]: value } : str
      )
    });
  };

  const removeStrategy = (id: string) => {
    setAnalysis({
      ...analysis,
      strategies: analysis.strategies.filter(str => str.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            교육과정 분석 및 수업 설계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="objectives">학습 목표</TabsTrigger>
              <TabsTrigger value="strategies">교수 전략</TabsTrigger>
              <TabsTrigger value="assessment">평가 계획</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grade">학년</Label>
                  <Input
                    id="grade"
                    type="number"
                    value={analysis.grade}
                    onChange={(e) => setAnalysis({ ...analysis, grade: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">과목</Label>
                  <Input
                    id="subject"
                    value={analysis.subject}
                    onChange={(e) => setAnalysis({ ...analysis, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">단원</Label>
                  <Input
                    id="unit"
                    value={analysis.unit}
                    onChange={(e) => setAnalysis({ ...analysis, unit: e.target.value })}
                    placeholder="예: 1. 마음을 전하는 글"
                  />
                </div>
              </div>

              <div>
                <Label>핵심 역량</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newCompetency}
                    onChange={(e) => setNewCompetency(e.target.value)}
                    placeholder="예: 의사소통 역량"
                    onKeyPress={(e) => e.key === 'Enter' && addCompetency()}
                  />
                  <Button onClick={addCompetency} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.coreCompetencies.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                      <span className="text-sm">{comp}</span>
                      <button onClick={() => removeCompetency(idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">교육과정 분석 노트</Label>
                <Textarea
                  id="notes"
                  value={analysis.notes}
                  onChange={(e) => setAnalysis({ ...analysis, notes: e.target.value })}
                  placeholder="교육과정을 분석하며 떠오른 생각, 수업 아이디어 등을 자유롭게 기록하세요."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  학습 목표 설정
                </h3>
                <Button onClick={addObjective} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  목표 추가
                </Button>
              </div>

              {analysis.objectives.map((objective) => (
                <Card key={objective.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>학습 목표</Label>
                      <button onClick={() => removeObjective(objective.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    <Textarea
                      value={objective.description}
                      onChange={(e) => updateObjective(objective.id, 'description', e.target.value)}
                      placeholder="예: 일상생활에서 경험한 일을 일기로 표현할 수 있다."
                      rows={2}
                    />
                    <div>
                      <Label>관련 역량</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {analysis.coreCompetencies.map((comp) => (
                          <label key={comp} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={objective.competencies.includes(comp)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...objective.competencies, comp]
                                  : objective.competencies.filter(c => c !== comp);
                                updateObjective(objective.id, 'competencies', updated);
                              }}
                            />
                            <span className="text-sm">{comp}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  교수 학습 전략
                </h3>
                <Button onClick={addStrategy} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  활동 추가
                </Button>
              </div>

              {analysis.strategies.map((strategy) => (
                <Card key={strategy.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>학습 활동</Label>
                      <button onClick={() => removeStrategy(strategy.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    <Input
                      value={strategy.activity}
                      onChange={(e) => updateStrategy(strategy.id, 'activity', e.target.value)}
                      placeholder="예: 모둠별 일기 나누기 활동"
                    />
                    <div>
                      <Label>활동 목적</Label>
                      <Textarea
                        value={strategy.purpose}
                        onChange={(e) => updateStrategy(strategy.id, 'purpose', e.target.value)}
                        placeholder="이 활동을 통해 학생들이 무엇을 배우고 경험하게 될까요?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>필요한 자료</Label>
                      <Input
                        value={strategy.materials.join(', ')}
                        onChange={(e) => updateStrategy(strategy.id, 'materials', e.target.value.split(', ').filter(m => m.trim()))}
                        placeholder="예: 일기장, 색연필, 감정 카드"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <PenTool className="h-5 w-5" />
                평가 계획
              </h3>
              <div>
                <Label htmlFor="assessmentPlan">평가 방법 및 기준</Label>
                <Textarea
                  id="assessmentPlan"
                  value={analysis.assessmentPlan}
                  onChange={(e) => setAnalysis({ ...analysis, assessmentPlan: e.target.value })}
                  placeholder="학생들의 학습 과정과 결과를 어떻게 평가할 것인지 구체적으로 계획하세요.
예: 
- 과정 평가: 일기 쓰기 과정에서의 자기 표현 노력도
- 결과 평가: 완성된 일기의 구조와 표현의 적절성
- 동료 평가: 모둠 활동 시 상호 피드백의 질"
                  rows={8}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowAISuggestions(!showAISuggestions)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showAISuggestions ? 'AI 제안 숨기기' : 'AI 제안 보기'}
            </Button>
            <div className="space-x-2">
              <Button variant="outline">임시 저장</Button>
              <Button>분석 완료</Button>
            </div>
          </div>

          {showAISuggestions && (
            <Card className="mt-4 p-4 bg-blue-50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI 참고 자료
              </h4>
              <p className="text-sm text-gray-600">
                선생님의 교육과정 분석을 바탕으로 다음과 같은 자료를 참고하실 수 있습니다:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• 해당 단원의 성취기준 해설</li>
                <li>• 다른 교사들의 수업 사례</li>
                <li>• 관련 교수학습 자료 링크</li>
                <li>• 평가 도구 예시</li>
              </ul>
              <Button size="sm" variant="ghost" className="mt-2">
                자세히 보기
              </Button>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}