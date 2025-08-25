'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Search,
  Filter,
  Eye,
  Clock,
  BookOpen,
  PenTool,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Circle,
  MoreVertical,
  User
} from 'lucide-react';

import { ConnectedStudent } from '@/hooks/useMonitoringSocket';
import StudentDetailView from '@/components/monitoring/students/StudentDetailView';

interface StudentPanelProps {
  students: ConnectedStudent[];
  activities?: any[]; // Activities for detailed student view
  mode: 'grid' | 'detailed';
  showDetails: boolean;
}

export default function StudentPanel({ students, activities = [], mode, showDetails }: StudentPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('activity');

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => {
        switch (statusFilter) {
          case 'online':
            return student.isOnline;
          case 'active':
            return student.isActive;
          case 'viewing':
            return student.status === 'viewing';
          case 'idle':
            return student.status === 'idle';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'activity':
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        case 'page':
          return (b.currentPage || 0) - (a.currentPage || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [students, searchQuery, statusFilter, sortBy]);

  const getStatusBadgeProps = (student: ConnectedStudent) => {
    switch (student.status) {
      case 'viewing':
        return { variant: 'default' as const, text: '학습중', color: 'bg-blue-500' };
      case 'answering':
        return { variant: 'default' as const, text: '문제풀이', color: 'bg-green-500' };
      case 'idle':
        return { variant: 'secondary' as const, text: '대기중', color: 'bg-yellow-500' };
      case 'offline':
        return { variant: 'outline' as const, text: '오프라인', color: 'bg-gray-400' };
      default:
        return { variant: 'outline' as const, text: '알 수 없음', color: 'bg-gray-400' };
    }
  };

  const getProgressPercentage = (student: ConnectedStudent) => {
    // Mock progress calculation - replace with actual logic
    if (!student.currentPage) return 0;
    return Math.min((student.currentPage / 20) * 100, 100); // Assuming 20 pages total
  };

  const StudentCard = ({ student }: { student: ConnectedStudent }) => {
    const statusProps = getStatusBadgeProps(student);
    const progress = getProgressPercentage(student);

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Avatar & Status */}
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="text-sm">
                  {student.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusProps.color}`}></div>
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm truncate">{student.userName}</h4>
                <Badge variant={statusProps.variant} className="text-xs">
                  {statusProps.text}
                </Badge>
              </div>

              {showDetails && (
                <>
                  {/* Current Activity */}
                  <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600">
                    {student.status === 'viewing' && <Eye className="w-3 h-3" />}
                    {student.status === 'answering' && <PenTool className="w-3 h-3" />}
                    {student.status === 'idle' && <Clock className="w-3 h-3" />}
                    <span>
                      {student.currentPage ? `${student.currentPage}페이지` : '대기중'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">진도율</span>
                      <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>최근 활동</span>
                    <span>{student.lastActivity.toLocaleTimeString('ko-KR')}</span>
                  </div>
                </>
              )}

              {!showDetails && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{student.currentPage ? `${student.currentPage}페이지` : '대기중'}</span>
                    <Circle className="w-1 h-1 fill-current" />
                    <span>{student.isActive ? '활동중' : '비활성'}</span>
                  </div>
                  <StudentDetailView
                    student={student}
                    activities={activities}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const StudentListItem = ({ student }: { student: ConnectedStudent }) => {
    const statusProps = getStatusBadgeProps(student);
    const progress = getProgressPercentage(student);
    const lastActivityMinutes = Math.floor((Date.now() - student.lastActivity.getTime()) / 60000);

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Avatar & Status */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {student.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusProps.color}`}></div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium truncate">{student.userName}</h4>
                <Badge variant={statusProps.variant} className="text-xs">
                  {statusProps.text}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 truncate">{student.email}</p>
            </div>

            {/* Current Activity */}
            <div className="flex-shrink-0 text-center">
              <div className="flex items-center space-x-1 mb-1">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {student.currentPage ? `${student.currentPage}p` : '--'}
                </span>
              </div>
              <span className="text-xs text-gray-500">현재 페이지</span>
            </div>

            {/* Progress */}
            <div className="flex-shrink-0 w-24">
              <div className="text-center mb-1">
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Last Activity */}
            <div className="flex-shrink-0 text-center">
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {lastActivityMinutes === 0 ? '지금' : `${lastActivityMinutes}분`}
                </span>
              </div>
              <span className="text-xs text-gray-500">최근 활동</span>
            </div>

            {/* Performance Indicator */}
            <div className="flex-shrink-0 text-center">
              {student.isActive ? (
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
              )}
              <span className="text-xs text-gray-500">참여도</span>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex space-x-1">
              <StudentDetailView
                student={student}
                activities={activities}
              />
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">학생 현황</h3>
          <p className="text-sm text-gray-600">
            총 {students.length}명 ({students.filter(s => s.isOnline).length}명 온라인)
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="학생 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="online">온라인</SelectItem>
                <SelectItem value="active">활동중</SelectItem>
                <SelectItem value="viewing">학습중</SelectItem>
                <SelectItem value="idle">대기중</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">최근 활동순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
                <SelectItem value="page">페이지순</SelectItem>
                <SelectItem value="status">상태순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Display */}
      {mode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.userId} student={student} />
          ))}
        </div>
      ) : (
        <div>
          {filteredStudents.map((student) => (
            <StudentListItem key={student.userId} student={student} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? '검색 결과가 없습니다' 
                : '접속중인 학생이 없습니다'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? '다른 검색어나 필터를 사용해보세요.'
                : '학생들이 접속하면 여기에 표시됩니다.'
              }
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                필터 초기화
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}