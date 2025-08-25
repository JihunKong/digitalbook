'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  BookOpen,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  Lightbulb,
  Award,
  Timer,
  Eye
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface LearningPatternsAnalyzerProps {
  students: ConnectedStudent[];
  activities: StudentActivity[];
}

interface LearningPattern {
  id: string;
  studentId: string;
  studentName: string;
  pattern: 'steady-learner' | 'burst-learner' | 'struggling' | 'advanced' | 'inconsistent';
  confidence: number;
  characteristics: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  engagementScore: number;
  progressRate: number;
  attentionSpan: number; // in minutes
  preferredActivityTypes: string[];
}

interface ConceptDifficulty {
  page: number;
  concept: string;
  avgTimeSpent: number;
  completionRate: number;
  strugglingStudents: number;
  difficultyScore: number;
  recommendations: string[];
}

interface LearningVelocity {
  studentId: string;
  studentName: string;
  pagesPerHour: number;
  activitiesPerHour: number;
  accuracyRate: number;
  consistencyScore: number;
  timePattern: 'morning' | 'afternoon' | 'evening' | 'mixed';
  velocityTrend: 'accelerating' | 'decelerating' | 'stable';
}

export default function LearningPatternsAnalyzer({
  students,
  activities
}: LearningPatternsAnalyzerProps) {
  const [selectedView, setSelectedView] = useState<'patterns' | 'difficulties' | 'velocity' | 'insights'>('patterns');
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // Analyze learning patterns for each student
  const learningPatterns = useMemo((): LearningPattern[] => {
    return students.map(student => {
      const studentActivities = activities.filter(a => a.userId === student.userId);
      
      // Calculate engagement metrics
      const totalTime = studentActivities
        .filter(a => a.type === 'page_view')
        .reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0);
      
      const totalActivities = studentActivities.length;
      const submissions = studentActivities.filter(a => a.type === 'activity_submit').length;
      const pageViews = studentActivities.filter(a => a.type === 'page_view').length;
      
      const avgTimePerPage = pageViews > 0 ? totalTime / pageViews : 0;
      const completionRate = pageViews > 0 ? (submissions / pageViews) * 100 : 0;
      
      // Activity type preferences
      const activityTypeCount = studentActivities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const preferredActivityTypes = Object.entries(activityTypeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Time pattern analysis
      const hourlyActivity = studentActivities.reduce((acc, activity) => {
        const hour = new Date(activity.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakHour = Object.entries(hourlyActivity)
        .reduce((max, [hour, count]) => count > max[1] ? [parseInt(hour), count] : max, [0, 0]);

      // Activity consistency (variance in activity timing)
      const activityTimes = studentActivities.map(a => new Date(a.timestamp).getTime());
      const avgInterval = activityTimes.length > 1 ? 
        (Math.max(...activityTimes) - Math.min(...activityTimes)) / (activityTimes.length - 1) : 0;
      const consistencyScore = avgInterval > 0 ? Math.min(100, 100 / (avgInterval / (60 * 60 * 1000))) : 50; // Higher score = more consistent

      // Determine learning pattern
      let pattern: LearningPattern['pattern'] = 'steady-learner';
      let characteristics: string[] = [];
      let recommendations: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      if (completionRate < 30 && avgTimePerPage > 180000) { // >3 minutes per page, low completion
        pattern = 'struggling';
        characteristics = ['페이지당 오래 머뭄', '낮은 완료율', '도움 필요'];
        recommendations = ['개별 지도 필요', '기초 개념 재설명', '학습 속도 조절'];
        riskLevel = 'high';
      } else if (completionRate > 80 && avgTimePerPage < 60000) { // <1 minute per page, high completion
        pattern = 'advanced';
        characteristics = ['빠른 학습 속도', '높은 완료율', '우수한 이해력'];
        recommendations = ['심화 문제 제공', '도전적인 활동', '다른 학생 멘토링'];
        riskLevel = 'low';
      } else if (consistencyScore < 30) {
        pattern = 'inconsistent';
        characteristics = ['불규칙한 학습 패턴', '집중력 산만', '예측 어려운 진도'];
        recommendations = ['학습 스케줄 수립', '집중력 향상 방법', '규칙적인 확인'];
        riskLevel = 'medium';
      } else if (totalActivities > students.length && avgTimePerPage < 120000) { // High activity, reasonable time
        pattern = 'burst-learner';
        characteristics = ['집중적 학습', '단기간 많은 활동', '효율적 진도'];
        recommendations = ['꾸준한 학습 유도', '복습 시간 확보', '과로 방지'];
        riskLevel = 'low';
      }

      const engagementScore = Math.min(100, 
        (totalActivities * 5) + 
        (completionRate * 0.5) + 
        (consistencyScore * 0.3)
      );

      return {
        id: student.userId,
        studentId: student.userId,
        studentName: student.userName,
        pattern,
        confidence: Math.min(95, Math.max(60, totalActivities * 5 + consistencyScore * 0.5)),
        characteristics,
        recommendations,
        riskLevel,
        engagementScore,
        progressRate: pageViews,
        attentionSpan: Math.round(avgTimePerPage / 60000), // in minutes
        preferredActivityTypes
      };
    });
  }, [students, activities]);

  // Analyze concept difficulties
  const conceptDifficulties = useMemo((): ConceptDifficulty[] => {
    const pageData: { [page: number]: { times: number[]; completions: number; total: number } } = {};
    
    activities.forEach(activity => {
      const page = activity.pageNumber;
      if (!page) return;
      
      if (!pageData[page]) {
        pageData[page] = { times: [], completions: 0, total: 0 };
      }
      
      if (activity.type === 'page_view') {
        pageData[page].times.push(activity.details?.timeSpent || 0);
        pageData[page].total++;
      } else if (activity.type === 'activity_submit') {
        pageData[page].completions++;
      }
    });

    return Object.entries(pageData)
      .map(([pageStr, data]) => {
        const page = parseInt(pageStr);
        const avgTimeSpent = data.times.length > 0 ? 
          data.times.reduce((sum, time) => sum + time, 0) / data.times.length : 0;
        const completionRate = data.total > 0 ? (data.completions / data.total) * 100 : 0;
        const strugglingStudents = data.times.filter(time => time > avgTimeSpent * 1.5).length;
        
        // Difficulty score based on time spent and completion rate
        const difficultyScore = Math.min(100, 
          (avgTimeSpent / 120000) * 40 + // Time factor (2 minutes = 40 points)
          (100 - completionRate) * 0.4 + // Completion factor  
          (strugglingStudents / data.total) * 20 // Struggling students factor
        );

        const recommendations: string[] = [];
        if (avgTimeSpent > 180000) recommendations.push('추가 설명 필요');
        if (completionRate < 50) recommendations.push('연습 문제 추가');
        if (strugglingStudents > data.total * 0.3) recommendations.push('개별 지도 강화');
        if (difficultyScore > 70) recommendations.push('개념 재설명');

        return {
          page,
          concept: `페이지 ${page} 개념`,
          avgTimeSpent,
          completionRate,
          strugglingStudents,
          difficultyScore,
          recommendations
        };
      })
      .sort((a, b) => b.difficultyScore - a.difficultyScore);
  }, [activities]);

  // Calculate learning velocities
  const learningVelocities = useMemo((): LearningVelocity[] => {
    return students.map(student => {
      const studentActivities = activities.filter(a => a.userId === student.userId);
      
      if (studentActivities.length === 0) {
        return {
          studentId: student.userId,
          studentName: student.userName,
          pagesPerHour: 0,
          activitiesPerHour: 0,
          accuracyRate: 0,
          consistencyScore: 0,
          timePattern: 'mixed' as const,
          velocityTrend: 'stable' as const
        };
      }

      // Calculate time span of activities
      const timestamps = studentActivities.map(a => new Date(a.timestamp).getTime());
      const timeSpanHours = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60);
      
      const pageViews = studentActivities.filter(a => a.type === 'page_view');
      const uniquePages = new Set(pageViews.map(a => a.pageNumber)).size;
      const submissions = studentActivities.filter(a => a.type === 'activity_submit');
      
      const pagesPerHour = timeSpanHours > 0 ? uniquePages / timeSpanHours : 0;
      const activitiesPerHour = timeSpanHours > 0 ? studentActivities.length / timeSpanHours : 0;
      const accuracyRate = pageViews.length > 0 ? (submissions.length / pageViews.length) * 100 : 0;

      // Determine peak activity time
      const hourlyActivity = studentActivities.reduce((acc, activity) => {
        const hour = new Date(activity.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakHour = Object.entries(hourlyActivity)
        .reduce((max, [hour, count]) => count > max[1] ? [parseInt(hour), count] : max, [0, 0])[0];

      const timePattern = 
        peakHour < 12 ? 'morning' as const :
        peakHour < 18 ? 'afternoon' as const :
        'evening' as const;

      // Calculate consistency (lower variance = higher consistency)
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
      }
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const consistencyScore = Math.max(0, 100 - Math.sqrt(variance) / (1000 * 60)); // Normalize variance

      // Velocity trend (simplified)
      const recentHalf = studentActivities.filter(a => 
        new Date(a.timestamp).getTime() > Math.min(...timestamps) + (Math.max(...timestamps) - Math.min(...timestamps)) / 2
      );
      const olderHalf = studentActivities.filter(a => 
        new Date(a.timestamp).getTime() <= Math.min(...timestamps) + (Math.max(...timestamps) - Math.min(...timestamps)) / 2
      );

      const velocityTrend = 
        recentHalf.length > olderHalf.length * 1.2 ? 'accelerating' as const :
        recentHalf.length < olderHalf.length * 0.8 ? 'decelerating' as const :
        'stable' as const;

      return {
        studentId: student.userId,
        studentName: student.userName,
        pagesPerHour,
        activitiesPerHour,
        accuracyRate,
        consistencyScore,
        timePattern,
        velocityTrend
      };
    });
  }, [students, activities]);

  const getPatternColor = (pattern: LearningPattern['pattern']) => {
    switch (pattern) {
      case 'advanced': return 'bg-green-100 text-green-800 border-green-200';
      case 'steady-learner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'burst-learner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inconsistent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'struggling': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPatternLabel = (pattern: LearningPattern['pattern']) => {
    switch (pattern) {
      case 'advanced': return '우수 학습자';
      case 'steady-learner': return '꾸준한 학습자';
      case 'burst-learner': return '집중형 학습자';
      case 'inconsistent': return '불규칙 학습자';
      case 'struggling': return '도움 필요';
      default: return '분석중';
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>학습 패턴 분석</span>
          </h3>
          <p className="text-sm text-gray-600">AI 기반 개별 학습자 분석 및 맞춤형 추천</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">우수 학습자</p>
                <p className="text-2xl font-bold text-green-600">
                  {learningPatterns.filter(p => p.pattern === 'advanced').length}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">도움 필요</p>
                <p className="text-2xl font-bold text-red-600">
                  {learningPatterns.filter(p => p.pattern === 'struggling').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 참여도</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(learningPatterns.reduce((sum, p) => sum + p.engagementScore, 0) / learningPatterns.length || 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">어려운 개념</p>
                <p className="text-2xl font-bold text-orange-600">
                  {conceptDifficulties.filter(c => c.difficultyScore > 70).length}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView as any} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">학습 패턴</TabsTrigger>
          <TabsTrigger value="difficulties">개념 난이도</TabsTrigger>
          <TabsTrigger value="velocity">학습 속도</TabsTrigger>
          <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
        </TabsList>

        {/* Learning Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {learningPatterns.map(pattern => (
              <Card key={pattern.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pattern.studentName}</CardTitle>
                    <Badge className={getPatternColor(pattern.pattern)} variant="outline">
                      {getPatternLabel(pattern.pattern)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold">{Math.round(pattern.engagementScore)}</div>
                      <div className="text-xs text-gray-500">참여도</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{pattern.attentionSpan}분</div>
                      <div className="text-xs text-gray-500">집중시간</div>
                    </div>
                    <div className={`text-lg font-bold ${getRiskColor(pattern.riskLevel)}`}>
                      {pattern.riskLevel.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">위험도</div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>분석 신뢰도</span>
                      <span>{Math.round(pattern.confidence)}%</span>
                    </div>
                    <Progress value={pattern.confidence} className="h-2" />
                  </div>

                  {/* Characteristics */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">특성</h4>
                    <div className="space-y-1">
                      {pattern.characteristics.map((char, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-blue-600" />
                          <span>{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>추천사항</span>
                    </h4>
                    <div className="space-y-1">
                      {pattern.recommendations.map((rec, index) => (
                        <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Concept Difficulties Tab */}
        <TabsContent value="difficulties" className="space-y-4">
          <div className="space-y-3">
            {conceptDifficulties.slice(0, 10).map(concept => (
              <Card key={concept.page}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{concept.concept}</h4>
                    <Badge variant={concept.difficultyScore > 70 ? 'destructive' : concept.difficultyScore > 40 ? 'secondary' : 'default'}>
                      난이도 {Math.round(concept.difficultyScore)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(concept.avgTimeSpent / 60000)}분</div>
                      <div className="text-xs text-gray-500">평균 소요시간</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(concept.completionRate)}%</div>
                      <div className="text-xs text-gray-500">완료율</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{concept.strugglingStudents}</div>
                      <div className="text-xs text-gray-500">어려워하는 학생</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Progress value={concept.difficultyScore} className="h-2" />
                  </div>

                  {concept.recommendations.length > 0 && (
                    <div className="space-y-1">
                      {concept.recommendations.map((rec, index) => (
                        <div key={index} className="text-xs bg-yellow-50 p-2 rounded flex items-center space-x-2">
                          <Lightbulb className="w-3 h-3 text-yellow-600" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Learning Velocity Tab */}
        <TabsContent value="velocity" className="space-y-4">
          <div className="space-y-3">
            {learningVelocities
              .filter(v => v.pagesPerHour > 0)
              .sort((a, b) => b.pagesPerHour - a.pagesPerHour)
              .map(velocity => (
                <Card key={velocity.studentId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{velocity.studentName}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{velocity.timePattern}</Badge>
                        <Badge variant={
                          velocity.velocityTrend === 'accelerating' ? 'default' :
                          velocity.velocityTrend === 'decelerating' ? 'destructive' : 'secondary'
                        }>
                          {velocity.velocityTrend === 'accelerating' ? '가속' :
                           velocity.velocityTrend === 'decelerating' ? '감속' : '안정'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {velocity.pagesPerHour.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">페이지/시간</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {velocity.activitiesPerHour.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">활동/시간</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(velocity.accuracyRate)}%
                        </div>
                        <div className="text-xs text-gray-500">정확도</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {Math.round(velocity.consistencyScore)}
                        </div>
                        <div className="text-xs text-gray-500">일관성</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Overview Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>수업 전체 인사이트</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">전체적인 학습 진도</p>
                        <p className="text-xs text-blue-600">
                          {Math.round((learningPatterns.reduce((sum, p) => sum + p.progressRate, 0) / learningPatterns.length) * 100) / 100}페이지/학생 평균 진도율
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">잘하는 영역</p>
                        <p className="text-xs text-green-600">
                          {conceptDifficulties.filter(c => c.difficultyScore < 30).length}개 개념이 잘 이해되고 있습니다
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">개선이 필요한 영역</p>
                        <p className="text-xs text-yellow-600">
                          {conceptDifficulties.filter(c => c.difficultyScore > 70).length}개 개념에서 추가 지도가 필요합니다
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>AI 추천사항</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningPatterns.filter(p => p.riskLevel === 'high').length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">우선 조치 필요</h4>
                      <ul className="text-xs text-red-600 space-y-1">
                        {learningPatterns
                          .filter(p => p.riskLevel === 'high')
                          .slice(0, 3)
                          .map(p => (
                            <li key={p.id}>• {p.studentName}님 개별 상담 필요</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">수업 개선 제안</h4>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• 어려운 개념 ({conceptDifficulties.slice(0, 2).map(c => `페이지 ${c.page}`).join(', ')}) 추가 설명</li>
                      <li>• 상호작용 활동 증가로 참여도 향상</li>
                      <li>• 개별 학습 속도에 맞춘 맞춤형 과제 제공</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">긍정적 요소</h4>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• {learningPatterns.filter(p => p.pattern === 'advanced').length}명의 우수 학습자 발견</li>
                      <li>• 전체적으로 안정적인 학습 패턴</li>
                      <li>• 높은 수업 참여도 유지</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}