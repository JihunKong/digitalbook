'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  HeatmapChart,
  CalendarChart,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Eye,
  Activity,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Timer,
  BookOpen
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface EngagementHeatmapProps {
  students: ConnectedStudent[];
  activities: StudentActivity[];
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
}

interface HeatmapCell {
  x: number; // Hour or day
  y: number; // Student index or page
  value: number; // Engagement intensity
  student?: string;
  page?: number;
  activities?: number;
  timeSpent?: number;
}

interface EngagementMetrics {
  totalEngagement: number;
  avgSessionLength: number;
  peakHours: number[];
  strugglingStudents: string[];
  topPerformers: string[];
  engagementTrend: 'up' | 'down' | 'stable';
  activityDistribution: { type: string; count: number; percentage: number }[];
}

export default function EngagementHeatmap({ 
  students, 
  activities, 
  timeRange = '24h' 
}: EngagementHeatmapProps) {
  const [viewMode, setViewMode] = useState<'student-time' | 'page-time' | 'activity-type' | 'engagement-flow'>('student-time');
  const [selectedMetric, setSelectedMetric] = useState<'activity-count' | 'time-spent' | 'page-views' | 'submissions'>('activity-count');

  // Calculate comprehensive engagement metrics
  const engagementMetrics = useMemo((): EngagementMetrics => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange];

    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp).getTime() > now.getTime() - timeRangeMs
    );

    // Calculate engagement scores per student
    const studentEngagement = students.map(student => {
      const studentActivities = recentActivities.filter(a => a.userId === student.userId);
      const timeSpent = studentActivities
        .filter(a => a.type === 'page_view')
        .reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0);
      
      return {
        student: student.userName,
        activities: studentActivities.length,
        timeSpent,
        engagementScore: (studentActivities.length * 10) + (timeSpent / 60000), // Composite score
        isActive: student.isActive
      };
    });

    // Activity type distribution
    const activityTypes = recentActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalActivities = Object.values(activityTypes).reduce((sum, count) => sum + count, 0);
    const activityDistribution = Object.entries(activityTypes).map(([type, count]) => ({
      type,
      count,
      percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0
    }));

    // Peak hours analysis
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourActivities = recentActivities.filter(activity => 
        new Date(activity.timestamp).getHours() === hour
      );
      return { hour, count: hourActivities.length };
    });

    const maxActivity = Math.max(...hourlyActivity.map(h => h.count));
    const peakHours = hourlyActivity
      .filter(h => h.count > maxActivity * 0.8)
      .map(h => h.hour);

    // Identify struggling and top-performing students
    const sortedByEngagement = studentEngagement
      .filter(s => s.activities > 0)
      .sort((a, b) => b.engagementScore - a.engagementScore);

    const strugglingStudents = sortedByEngagement
      .slice(-Math.min(3, Math.floor(sortedByEngagement.length * 0.3)))
      .map(s => s.student);

    const topPerformers = sortedByEngagement
      .slice(0, Math.min(3, Math.ceil(sortedByEngagement.length * 0.3)))
      .map(s => s.student);

    // Engagement trend (simplified calculation)
    const recentHalf = recentActivities.filter(a => 
      new Date(a.timestamp).getTime() > now.getTime() - (timeRangeMs / 2)
    );
    const olderHalf = recentActivities.filter(a => 
      new Date(a.timestamp).getTime() <= now.getTime() - (timeRangeMs / 2)
    );

    let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentHalf.length > olderHalf.length * 1.1) {
      engagementTrend = 'up';
    } else if (recentHalf.length < olderHalf.length * 0.9) {
      engagementTrend = 'down';
    }

    return {
      totalEngagement: studentEngagement.reduce((sum, s) => sum + s.engagementScore, 0),
      avgSessionLength: studentEngagement.length > 0 
        ? studentEngagement.reduce((sum, s) => sum + s.timeSpent, 0) / studentEngagement.length / 60000
        : 0,
      peakHours,
      strugglingStudents,
      topPerformers,
      engagementTrend,
      activityDistribution
    };
  }, [students, activities, timeRange]);

  // Generate heatmap data based on view mode
  const heatmapData = useMemo((): HeatmapCell[] => {
    const now = new Date();
    const cells: HeatmapCell[] = [];

    if (viewMode === 'student-time') {
      // Students (Y-axis) vs Time periods (X-axis)
      const timeSlots = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
      
      students.forEach((student, studentIndex) => {
        for (let timeSlot = 0; timeSlot < timeSlots; timeSlot++) {
          const slotStart = new Date(now.getTime() - (timeSlots - timeSlot) * (
            timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour slots
            timeRange === '7d' ? 24 * 60 * 60 * 1000 : // 1 day slots  
            24 * 60 * 60 * 1000 // 1 day slots for 30d too
          ));
          const slotEnd = new Date(slotStart.getTime() + (
            timeRange === '24h' ? 60 * 60 * 1000 :
            24 * 60 * 60 * 1000
          ));

          const slotActivities = activities.filter(activity => 
            activity.userId === student.userId &&
            new Date(activity.timestamp) >= slotStart &&
            new Date(activity.timestamp) < slotEnd
          );

          const value = selectedMetric === 'activity-count' ? slotActivities.length :
                       selectedMetric === 'time-spent' ? slotActivities.reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0) / 60000 :
                       selectedMetric === 'page-views' ? slotActivities.filter(a => a.type === 'page_view').length :
                       slotActivities.filter(a => a.type === 'activity_submit').length;

          cells.push({
            x: timeSlot,
            y: studentIndex,
            value,
            student: student.userName,
            activities: slotActivities.length,
            timeSpent: slotActivities.reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0)
          });
        }
      });
    } else if (viewMode === 'page-time') {
      // Pages (Y-axis) vs Time periods (X-axis)
      const timeSlots = 24; // Hours
      const maxPage = Math.max(...activities.map(a => a.pageNumber || 0));
      
      for (let page = 1; page <= Math.min(maxPage, 20); page++) {
        for (let hour = 0; hour < timeSlots; hour++) {
          const hourStart = new Date(now.getTime() - (timeSlots - hour) * 60 * 60 * 1000);
          const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

          const pageActivities = activities.filter(activity =>
            activity.pageNumber === page &&
            new Date(activity.timestamp) >= hourStart &&
            new Date(activity.timestamp) < hourEnd &&
            activity.type === 'page_view'
          );

          const value = selectedMetric === 'activity-count' ? pageActivities.length :
                       selectedMetric === 'time-spent' ? pageActivities.reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0) / 60000 :
                       pageActivities.length;

          cells.push({
            x: hour,
            y: page - 1,
            value,
            page,
            activities: pageActivities.length,
            timeSpent: pageActivities.reduce((sum, a) => sum + (a.details?.timeSpent || 0), 0)
          });
        }
      }
    }

    return cells;
  }, [students, activities, viewMode, selectedMetric, timeRange]);

  // Get color intensity for heatmap cell
  const getColorIntensity = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.min((value / maxValue) * 100, 100);
  };

  const maxValue = Math.max(...heatmapData.map(cell => cell.value));

  const getTimeLabel = (index: number) => {
    if (timeRange === '24h') {
      const hour = (new Date().getHours() - (23 - index)) % 24;
      return `${hour}:00`;
    } else if (timeRange === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toLocaleDateString('ko-KR', { weekday: 'short' });
    }
    return `${index + 1}일`;
  };

  const MetricCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center space-x-1 mt-1">
                {trend.direction === 'up' ? 
                  <TrendingUp className="w-3 h-3 text-green-600" /> :
                  trend.direction === 'down' ?
                  <TrendingDown className="w-3 h-3 text-red-600" /> :
                  <BarChart3 className="w-3 h-3 text-gray-600" />
                }
                <span className={`text-xs ${
                  trend.direction === 'up' ? 'text-green-600' :
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.text}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-4 h-4 text-white" />
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
          <h3 className="text-lg font-semibold">참여도 히트맵</h3>
          <p className="text-sm text-gray-600">학생별 시간대별 참여도 시각화</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={setViewMode as any}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student-time">학생-시간</SelectItem>
              <SelectItem value="page-time">페이지-시간</SelectItem>
              <SelectItem value="activity-type">활동 유형</SelectItem>
              <SelectItem value="engagement-flow">참여 흐름</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric as any}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity-count">활동 수</SelectItem>
              <SelectItem value="time-spent">소요 시간</SelectItem>
              <SelectItem value="page-views">페이지뷰</SelectItem>
              <SelectItem value="submissions">제출</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="총 참여도 점수"
          value={Math.round(engagementMetrics.totalEngagement)}
          icon={Zap}
          trend={{ 
            direction: engagementMetrics.engagementTrend, 
            text: engagementMetrics.engagementTrend === 'up' ? '상승 중' : 
                  engagementMetrics.engagementTrend === 'down' ? '하락 중' : '안정'
          }}
          color="bg-purple-500"
        />
        <MetricCard
          title="평균 세션 길이"
          value={`${Math.round(engagementMetrics.avgSessionLength)}분`}
          icon={Clock}
          color="bg-blue-500"
        />
        <MetricCard
          title="피크 시간대"
          value={`${engagementMetrics.peakHours.length}개 구간`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <MetricCard
          title="주의 필요 학생"
          value={`${engagementMetrics.strugglingStudents.length}명`}
          icon={AlertTriangle}
          color="bg-yellow-500"
        />
      </div>

      {/* Main Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>참여도 히트맵 - {viewMode === 'student-time' ? '학생별' : '페이지별'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="space-y-4">
              {/* Heatmap Grid */}
              <div className="relative overflow-x-auto">
                <div className="min-w-full">
                  {/* Time labels */}
                  <div className="flex mb-2">
                    <div className="w-24"></div> {/* Space for Y-axis labels */}
                    {Array.from({ length: viewMode === 'student-time' && timeRange === '24h' ? 24 : 24 }, (_, i) => (
                      <div key={i} className="w-8 text-xs text-center text-gray-500">
                        {getTimeLabel(i)}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap rows */}
                  <div className="space-y-1">
                    {viewMode === 'student-time' ? 
                      students.map((student, studentIndex) => (
                        <div key={student.userId} className="flex items-center">
                          <div className="w-24 text-xs text-right pr-2 truncate">
                            {student.userName}
                          </div>
                          <div className="flex">
                            {Array.from({ length: timeRange === '24h' ? 24 : 24 }, (_, timeIndex) => {
                              const cell = heatmapData.find(c => c.x === timeIndex && c.y === studentIndex);
                              const intensity = getColorIntensity(cell?.value || 0, maxValue);
                              
                              return (
                                <Tooltip key={timeIndex}>
                                  <TooltipTrigger>
                                    <div
                                      className="w-8 h-6 border border-gray-200 cursor-pointer transition-all hover:border-gray-400"
                                      style={{
                                        backgroundColor: intensity > 0 
                                          ? `rgba(59, 130, 246, ${intensity / 100})` 
                                          : 'transparent'
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <p className="font-medium">{student.userName}</p>
                                      <p>시간: {getTimeLabel(timeIndex)}</p>
                                      <p>활동: {cell?.activities || 0}개</p>
                                      <p>시간: {Math.round((cell?.timeSpent || 0) / 60000)}분</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      )) :
                      Array.from({ length: 20 }, (_, pageIndex) => (
                        <div key={pageIndex} className="flex items-center">
                          <div className="w-24 text-xs text-right pr-2">
                            페이지 {pageIndex + 1}
                          </div>
                          <div className="flex">
                            {Array.from({ length: 24 }, (_, timeIndex) => {
                              const cell = heatmapData.find(c => c.x === timeIndex && c.y === pageIndex);
                              const intensity = getColorIntensity(cell?.value || 0, maxValue);
                              
                              return (
                                <Tooltip key={timeIndex}>
                                  <TooltipTrigger>
                                    <div
                                      className="w-8 h-6 border border-gray-200 cursor-pointer transition-all hover:border-gray-400"
                                      style={{
                                        backgroundColor: intensity > 0 
                                          ? `rgba(16, 185, 129, ${intensity / 100})` 
                                          : 'transparent'
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <p className="font-medium">페이지 {pageIndex + 1}</p>
                                      <p>시간: {getTimeLabel(timeIndex)}</p>
                                      <p>조회: {cell?.activities || 0}회</p>
                                      <p>시간: {Math.round((cell?.timeSpent || 0) / 60000)}분</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 border"></div>
                    <span>활동 없음</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-300"></div>
                    <span>보통 활동</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-600"></div>
                    <span>활발한 활동</span>
                  </div>
                </div>
                <span>
                  최대값: {selectedMetric === 'time-spent' ? `${Math.round(maxValue)}분` : `${maxValue}회`}
                </span>
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>우수 학생</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {engagementMetrics.topPerformers.map((student, index) => (
                <div key={student} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge className="w-5 h-5 text-xs bg-green-500 text-white flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{student}</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>주의 필요 학생</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {engagementMetrics.strugglingStudents.map((student, index) => (
                <div key={student} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge className="w-5 h-5 text-xs bg-yellow-500 text-white flex items-center justify-center">
                      !
                    </Badge>
                    <span className="text-sm font-medium">{student}</span>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}