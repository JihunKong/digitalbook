'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  Download,
  Search,
  Bell,
  HelpCircle
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard data...');
  };

  // Mock class data - replace with actual data from API
  const classes = [
    { id: 'all', name: '전체 학급' },
    { id: '1', name: '1학년 1반 (수학)' },
    { id: '2', name: '1학년 2반 (수학)' },
    { id: '3', name: '2학년 1반 (과학)' },
  ];

  const dateRanges = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
    { value: 'custom', label: '사용자 정의' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>뒤로가기</span>
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Class Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">학급:</span>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="학급 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="학생 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>내보내기</span>
              </Button>

              {/* Notification Bell */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
                >
                  3
                </Badge>
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>

              {/* Help */}
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-6 py-6">
        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">필터:</span>
              </div>
              
              {/* Quick Filter Badges */}
              <div className="flex space-x-2">
                <Badge variant="secondary" className="cursor-pointer">
                  활동중 학생만
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  PDF 보는 중
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  문제 풀이 중
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  5분 이상 비활성
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>마지막 업데이트:</span>
              <span>{new Date().toLocaleTimeString('ko-KR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        {children}
      </div>

      {/* Footer Information */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>© 2024 디지털 교과서 플랫폼</span>
              <Separator orientation="vertical" className="h-4" />
              <span>실시간 모니터링 v1.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>서버 상태: 정상</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>실시간 연결됨</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}