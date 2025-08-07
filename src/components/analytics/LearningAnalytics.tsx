'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target, 
  Users, 
  Brain,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Star,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentProgress {
  studentId: string;
  studentName: string;
  totalPages: number;
  completedPages: number;
  timeSpent: number; // in minutes
  questionsAnswered: number;
  questionsCorrect: number;
  chatInteractions: number;
  lastActive: string;
  strengths: string[];
  improvements: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ClassAnalytics {
  totalStudents: number;
  averageProgress: number;
  averageTimeSpent: number;
  averageAccuracy: number;
  mostActiveStudents: StudentProgress[];
  strugglingStudents: StudentProgress[];
  popularTopics: string[];
  difficultConcepts: string[];
}

interface LearningAnalyticsProps {
  textbookId: string;
  teacherId: string;
}

export function LearningAnalytics({ textbookId, teacherId }: LearningAnalyticsProps) {
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  useEffect(() => {
    loadAnalyticsData();
  }, [textbookId, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock data - 실제로는 API 호출
      const mockStudentProgress: StudentProgress[] = [
        {
          studentId: '1',
          studentName: '김민수',
          totalPages: 20,
          completedPages: 18,
          timeSpent: 240, // 4시간
          questionsAnswered: 25,
          questionsCorrect: 22,
          chatInteractions: 15,
          lastActive: '2024-01-20T10:30:00Z',
          strengths: ['현대문학', '글쓰기'],
          improvements: ['고전문학', '문법'],
          difficulty: 'easy'
        },
        {
          studentId: '2',
          studentName: '이서연',
          totalPages: 20,
          completedPages: 12,
          timeSpent: 180,
          questionsAnswered: 18,
          questionsCorrect: 14,
          chatInteractions: 22,
          lastActive: '2024-01-20T14:15:00Z',
          strengths: ['문학 이해', '창의적 사고'],
          improvements: ['속독', '요약'],
          difficulty: 'medium'
        },
        {
          studentId: '3',
          studentName: '박준호',
          totalPages: 20,
          completedPages: 8,
          timeSpent: 120,
          questionsAnswered: 12,
          questionsCorrect: 8,
          chatInteractions: 30,
          lastActive: '2024-01-19T16:45:00Z',
          strengths: ['질문하기', '토론'],
          improvements: ['읽기 속도', '집중력'],
          difficulty: 'hard'
        }
      ];

      const mockClassAnalytics: ClassAnalytics = {
        totalStudents: mockStudentProgress.length,
        averageProgress: Math.round(mockStudentProgress.reduce((sum, s) => sum + (s.completedPages / s.totalPages * 100), 0) / mockStudentProgress.length),
        averageTimeSpent: Math.round(mockStudentProgress.reduce((sum, s) => sum + s.timeSpent, 0) / mockStudentProgress.length),
        averageAccuracy: Math.round(mockStudentProgress.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAnswered * 100), 0) / mockStudentProgress.length),
        mostActiveStudents: mockStudentProgress.filter(s => s.chatInteractions > 20),
        strugglingStudents: mockStudentProgress.filter(s => s.difficulty === 'hard' || (s.completedPages / s.totalPages) < 0.5),
        popularTopics: ['현대문학', '글쓰기', '문학 감상'],
        difficultConcepts: ['고전문학', '문법', '한자어']
      };

      setStudentProgress(mockStudentProgress);
      setClassAnalytics(mockClassAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textbookId,
          teacherId,
          timeRange: selectedTimeRange,
          includeStudentProgress: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `학습분석_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading || !classAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">학습 분석</h2>
          <p className="text-gray-600">학생들의 학습 패턴과 성과를 분석합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
            <option value="quarter">최근 3개월</option>
          </select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 진도율</p>
                  <p className="text-3xl font-bold text-blue-600">{classAnalytics.averageProgress}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <Progress value={classAnalytics.averageProgress} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 학습시간</p>
                  <p className="text-3xl font-bold text-green-600">{Math.floor(classAnalytics.averageTimeSpent / 60)}h {classAnalytics.averageTimeSpent % 60}m</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 정답률</p>
                  <p className="text-3xl font-bold text-purple-600">{classAnalytics.averageAccuracy}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 학생</p>
                  <p className="text-3xl font-bold text-orange-600">{classAnalytics.totalStudents}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">학생별 분석</TabsTrigger>
          <TabsTrigger value="topics">주제별 분석</TabsTrigger>
          <TabsTrigger value="interactions">상호작용 분석</TabsTrigger>
          <TabsTrigger value="recommendations">추천사항</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>개별 학생 진도</CardTitle>
              <CardDescription>각 학생의 상세한 학습 현황을 확인할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentProgress.map((student, index) => (
                  <motion.div
                    key={student.studentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.studentName}</h3>
                          <p className="text-sm text-gray-600">
                            마지막 활동: {new Date(student.lastActive).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.difficulty === 'easy' ? 'default' : student.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                          {student.difficulty === 'easy' ? '수월함' : student.difficulty === 'medium' ? '보통' : '어려움'}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round((student.completedPages / student.totalPages) * 100)}% 완료
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">진도율</p>
                        <div className="flex items-center gap-2">
                          <Progress value={(student.completedPages / student.totalPages) * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {student.completedPages}/{student.totalPages}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">학습시간</p>
                        <p className="text-sm font-semibold">{Math.floor(student.timeSpent / 60)}시간 {student.timeSpent % 60}분</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">정답률</p>
                        <p className="text-sm font-semibold">{Math.round((student.questionsCorrect / student.questionsAnswered) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">AI 상호작용</p>
                        <p className="text-sm font-semibold">{student.chatInteractions}회</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">강점</p>
                        <div className="flex flex-wrap gap-1">
                          {student.strengths.map((strength, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">개선점</p>
                        <div className="flex flex-wrap gap-1">
                          {student.improvements.map((improvement, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              {improvement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  인기 주제
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classAnalytics.popularTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{topic}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-yellow-500 rounded-full"
                            style={{ width: `${100 - (index * 20)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{100 - (index * 20)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-red-600" />
                  어려운 개념
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classAnalytics.difficultConcepts.map((concept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{concept}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-red-500 rounded-full"
                            style={{ width: `${80 - (index * 15)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{80 - (index * 15)}% 어려움</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI 튜터 상호작용 분석</CardTitle>
              <CardDescription>학생들의 AI 튜터 사용 패턴을 분석합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {studentProgress.reduce((sum, s) => sum + s.chatInteractions, 0)}
                  </div>
                  <p className="text-sm text-gray-600">총 대화 수</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(studentProgress.reduce((sum, s) => sum + s.chatInteractions, 0) / studentProgress.length)}
                  </div>
                  <p className="text-sm text-gray-600">학생당 평균 대화</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {classAnalytics.mostActiveStudents.length}
                  </div>
                  <p className="text-sm text-gray-600">활발한 사용자</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  우수 학생
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classAnalytics.mostActiveStudents.map((student, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-gray-600">
                          진도율 {Math.round((student.completedPages / student.totalPages) * 100)}%, 
                          정답률 {Math.round((student.questionsCorrect / student.questionsAnswered) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  지원 필요 학생
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classAnalytics.strugglingStudents.map((student, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Brain className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-gray-600">
                          추가 지원이 필요합니다 - {student.improvements.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}