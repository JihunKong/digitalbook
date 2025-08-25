'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  BookOpen,
  Target,
  Eye,
  Activity,
  BarChart3
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';
import EngagementHeatmap from '@/components/monitoring/analytics/EngagementHeatmap';
import LearningPatternsAnalyzer from '@/components/monitoring/analytics/LearningPatternsAnalyzer';

interface AnalyticsPanelProps {
  students: ConnectedStudent[];
  activities: StudentActivity[];
}

export default function AnalyticsPanel({ students, activities }: AnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState('today');
  const [chartType, setChartType] = useState('engagement');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    // Engagement data over time (mock data for now)
    const engagementData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      activeUsers: Math.floor(Math.random() * students.length),
      pageViews: Math.floor(Math.random() * 100),
      activities: Math.floor(Math.random() * 20)
    }));

    // Page popularity data
    const pageData = Array.from({ length: 10 }, (_, i) => ({
      page: i + 1,
      views: Math.floor(Math.random() * 50) + 10,
      avgTime: Math.floor(Math.random() * 300) + 30
    }));

    // Student status distribution
    const statusData = [
      { name: '학습중', value: students.filter(s => s.status === 'viewing').length, color: '#3B82F6' },
      { name: '문제풀이', value: students.filter(s => s.status === 'answering').length, color: '#10B981' },
      { name: '대기중', value: students.filter(s => s.status === 'idle').length, color: '#F59E0B' },
      { name: '오프라인', value: students.filter(s => !s.isOnline).length, color: '#6B7280' }
    ];

    return {
      engagementData,
      pageData,
      statusData,
      totalStudents: students.length,
      activeStudents: students.filter(s => s.isActive).length,
      averageProgress: students.reduce((acc, s) => acc + (s.currentPage || 0), 0) / students.length,
      totalActivities: activities.length
    };
  }, [students, activities]);

  // Key metrics cards
  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <Badge variant={change > 0 ? "default" : "destructive"} className="text-xs">
                  {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(change)}%
                </Badge>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">학습 분석</h3>
          <p className="text-sm text-gray-600">실시간 학습 데이터 및 인사이트</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="총 학생 수"
          value={analyticsData.totalStudents}
          change={5}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="활동중인 학생"
          value={analyticsData.activeStudents}
          change={12}
          icon={Activity}
          color="bg-green-500"
        />
        <MetricCard
          title="평균 진도율"
          value={`${Math.round(analyticsData.averageProgress * 5)}%`}
          change={-3}
          icon={Target}
          color="bg-yellow-500"
        />
        <MetricCard
          title="총 활동 수"
          value={analyticsData.totalActivities}
          change={8}
          icon={BarChart3}
          color="bg-purple-500"
        />
      </div>

      {/* Analytics Charts */}
      <Tabs value={chartType} onValueChange={setChartType} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="engagement">참여도</TabsTrigger>
          <TabsTrigger value="progress">진도율</TabsTrigger>
          <TabsTrigger value="pages">페이지별</TabsTrigger>
          <TabsTrigger value="status">현황</TabsTrigger>
          <TabsTrigger value="heatmap">히트맵</TabsTrigger>
          <TabsTrigger value="patterns">학습패턴</TabsTrigger>
        </TabsList>

        {/* Engagement Chart */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>시간별 참여도</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="활동 사용자"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="페이지 뷰"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Chart */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>학습 진도율</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="activities"
                      stroke="#8884d8"
                      strokeWidth={3}
                      name="완료된 활동"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Analytics */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>페이지별 분석</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.pageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#3B82F6" name="조회 수" />
                    <Bar dataKey="avgTime" fill="#10B981" name="평균 시간 (초)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>학생 상태 분포</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Legend & Details */}
            <Card>
              <CardHeader>
                <CardTitle>상태별 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.statusData.map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{status.value}명</div>
                        <div className="text-sm text-gray-500">
                          {analyticsData.totalStudents > 0 
                            ? Math.round((status.value / analyticsData.totalStudents) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <EngagementHeatmap
            students={students}
            activities={activities}
            timeRange="24h"
          />
        </TabsContent>

        {/* Learning Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <LearningPatternsAnalyzer
            students={students}
            activities={activities}
          />
        </TabsContent>
      </Tabs>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📈 참여도 인사이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • 현재 {analyticsData.activeStudents}명의 학생이 적극적으로 학습 중입니다.
              </p>
              <p className="text-sm text-gray-600">
                • 평균 진도율이 지난주 대비 5% 증가했습니다.
              </p>
              <p className="text-sm text-gray-600">
                • 오후 2-4시에 가장 활발한 활동을 보입니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">⚠️ 주의 필요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • {students.filter(s => s.status === 'idle').length}명의 학생이 5분 이상 비활성 상태입니다.
              </p>
              <p className="text-sm text-gray-600">
                • 3페이지에서 평균 체류 시간이 길어지고 있습니다.
              </p>
              {students.filter(s => !s.isActive).length > 3 && (
                <p className="text-sm text-red-600">
                  • 참여도가 낮은 학생들에게 관심이 필요합니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">💡 권장사항</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • 더 많은 상호작용 활동을 3-5페이지에 추가하세요.
              </p>
              <p className="text-sm text-gray-600">
                • 비활성 학생들에게 개별 메시지를 보내보세요.
              </p>
              <p className="text-sm text-gray-600">
                • 현재 참여도가 높은 시간대를 활용하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}