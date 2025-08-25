'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Users,
  Eye,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface PDFTrackingPanelProps {
  students: ConnectedStudent[];
  activities: StudentActivity[];
  currentPDF?: string;
  totalPages?: number;
}

interface PageHeatmapData {
  page: number;
  viewCount: number;
  totalTime: number;
  avgTime: number;
  studentsViewing: ConnectedStudent[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function PDFTrackingPanel({ 
  students, 
  activities, 
  currentPDF = "sample-textbook.pdf",
  totalPages = 20 
}: PDFTrackingPanelProps) {
  const [selectedView, setSelectedView] = useState('heatmap');
  const [timeRange, setTimeRange] = useState('live');
  const [isLiveMode, setIsLiveMode] = useState(true);
  
  // Calculate page heatmap data
  const pageHeatmapData = useMemo(() => {
    const pages: PageHeatmapData[] = Array.from({ length: totalPages }, (_, i) => {
      const pageNumber = i + 1;
      const pageActivities = activities.filter(activity => 
        activity.pageNumber === pageNumber && activity.type === 'page_view'
      );
      const studentsOnPage = students.filter(student => student.currentPage === pageNumber);
      
      // Calculate metrics
      const viewCount = pageActivities.length;
      const totalTime = pageActivities.reduce((sum, activity) => 
        sum + (activity.details?.timeSpent || 0), 0
      );
      const avgTime = viewCount > 0 ? totalTime / viewCount : 0;
      
      // Determine difficulty based on time spent
      let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
      if (avgTime > 120000) difficulty = 'hard'; // >2 minutes
      else if (avgTime > 60000) difficulty = 'medium'; // >1 minute
      
      return {
        page: pageNumber,
        viewCount,
        totalTime,
        avgTime,
        studentsViewing: studentsOnPage,
        difficulty
      };
    });
    
    return pages;
  }, [students, activities, totalPages]);

  // Get most viewed pages
  const topPages = pageHeatmapData
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  // Get pages where students are struggling (high time spent)
  const strugglingPages = pageHeatmapData
    .filter(page => page.difficulty === 'hard' && page.viewCount > 0)
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 3);

  // Current page distribution
  const currentPageDistribution = useMemo(() => {
    const distribution: { [key: number]: number } = {};
    students.forEach(student => {
      if (student.currentPage && student.isActive) {
        distribution[student.currentPage] = (distribution[student.currentPage] || 0) + 1;
      }
    });
    return distribution;
  }, [students]);

  const getHeatmapIntensity = (viewCount: number) => {
    const maxViews = Math.max(...pageHeatmapData.map(p => p.viewCount));
    if (maxViews === 0) return 0;
    return (viewCount / maxViews) * 100;
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const PageHeatmap = () => (
    <div className="space-y-4">
      {/* Live Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={isLiveMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
          >
            {isLiveMode ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isLiveMode ? '실시간' : '일시정지'}
          </Button>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span>{isLiveMode ? '실시간 업데이트 중' : '업데이트 일시정지'}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <RefreshCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </div>

      {/* Page Grid Heatmap */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {pageHeatmapData.map((pageData) => {
          const intensity = getHeatmapIntensity(pageData.viewCount);
          const currentStudents = currentPageDistribution[pageData.page] || 0;
          
          return (
            <div
              key={pageData.page}
              className={`
                relative aspect-square border-2 rounded-lg cursor-pointer transition-all hover:scale-105
                ${currentStudents > 0 ? 'border-blue-500 shadow-md' : 'border-gray-200'}
              `}
              style={{
                backgroundColor: intensity > 0 
                  ? `rgba(59, 130, 246, ${intensity / 100})` 
                  : 'transparent'
              }}
              title={`페이지 ${pageData.page}: ${pageData.viewCount}회 조회, 평균 ${Math.round(pageData.avgTime / 1000)}초`}
            >
              {/* Page Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-medium ${
                  intensity > 50 ? 'text-white' : 'text-gray-700'
                }`}>
                  {pageData.page}
                </span>
              </div>
              
              {/* Current Viewers Badge */}
              {currentStudents > 0 && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="text-xs px-1 py-0 bg-blue-500 text-white">
                    {currentStudents}
                  </Badge>
                </div>
              )}
              
              {/* Difficulty Indicator */}
              {pageData.difficulty !== 'easy' && pageData.viewCount > 0 && (
                <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full
                  ${pageData.difficulty === 'hard' ? 'bg-red-500' : 'bg-yellow-500'}
                `}></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
            <span>현재 보는 중</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>자주 본 페이지</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>보통 난이도</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>어려운 페이지</span>
          </div>
        </div>
      </div>
    </div>
  );

  const PageAnalytics = () => (
    <div className="space-y-6">
      {/* Top Viewed Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>인기 페이지</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={page.page} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">페이지 {page.page}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {page.viewCount}회
                      </Badge>
                      <Badge className={getDifficultyColor(page.difficulty)} variant="outline">
                        {page.difficulty === 'easy' ? '쉬움' : page.difficulty === 'medium' ? '보통' : '어려움'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={getHeatmapIntensity(page.viewCount)} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Struggling Pages */}
      {strugglingPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>주의 필요 페이지</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strugglingPages.map((page) => (
                <div key={page.page} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">페이지 {page.page}</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      평균 {Math.round(page.avgTime / 1000)}초
                    </Badge>
                  </div>
                  <p className="text-xs text-yellow-700">
                    학생들이 오랜 시간 머물고 있는 페이지입니다. 추가 설명이 필요할 수 있습니다.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">PDF 추적 현황</h3>
          <p className="text-sm text-gray-600">
            실시간 페이지 조회 및 학생 활동 분석
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">실시간</SelectItem>
              <SelectItem value="1h">1시간</SelectItem>
              <SelectItem value="1d">오늘</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{students.filter(s => s.currentPDF === currentPDF).length}</div>
            <div className="text-xs text-gray-600">현재 PDF 조회</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{Object.keys(currentPageDistribution).length}</div>
            <div className="text-xs text-gray-600">활성 페이지</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{strugglingPages.length}</div>
            <div className="text-xs text-gray-600">주의 필요</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activities.filter(a => a.type === 'page_view').length}
            </div>
            <div className="text-xs text-gray-600">총 페이지뷰</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="heatmap">페이지 히트맵</TabsTrigger>
          <TabsTrigger value="analytics">상세 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>실시간 페이지 히트맵</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PageHeatmap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}