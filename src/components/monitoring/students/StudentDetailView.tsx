'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  User,
  Clock,
  BookOpen,
  Eye,
  PenTool,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Calendar,
  Timer
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface StudentDetailViewProps {
  student: ConnectedStudent;
  activities: StudentActivity[];
  onSendMessage?: (studentId: string, message: string) => void;
  onAlert?: (studentId: string) => void;
}

export default function StudentDetailView({
  student,
  activities,
  onSendMessage,
  onAlert
}: StudentDetailViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'progress'>('overview');

  // Filter activities for this student
  const studentActivities = useMemo(() => {
    return activities
      .filter(activity => activity.userId === student.userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, student.userId]);

  // Calculate engagement metrics
  const engagementMetrics = useMemo(() => {
    const totalActivities = studentActivities.length;
    const pageViews = studentActivities.filter(a => a.type === 'page_view');
    const submissions = studentActivities.filter(a => a.type === 'activity_submit');
    const totalTimeSpent = pageViews.reduce((sum, activity) => 
      sum + (activity.details?.timeSpent || 0), 0
    );
    
    // Activity timeline (last 24 hours)
    const now = new Date();
    const timeline = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const hourActivities = studentActivities.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime.getHours() === hour.getHours() && 
               activityTime.toDateString() === hour.toDateString();
      });
      
      return {
        hour: hour.getHours(),
        activities: hourActivities.length,
        pageViews: hourActivities.filter(a => a.type === 'page_view').length
      };
    });

    // Page engagement data
    const pageEngagement: { [key: number]: { views: number; timeSpent: number } } = {};
    pageViews.forEach(activity => {
      const page = activity.pageNumber || 0;
      if (!pageEngagement[page]) {
        pageEngagement[page] = { views: 0, timeSpent: 0 };
      }
      pageEngagement[page].views += 1;
      pageEngagement[page].timeSpent += activity.details?.timeSpent || 0;
    });

    return {
      totalActivities,
      pageViews: pageViews.length,
      submissions: submissions.length,
      totalTimeSpent,
      avgTimePerPage: pageViews.length > 0 ? totalTimeSpent / pageViews.length : 0,
      timeline,
      pageEngagement: Object.entries(pageEngagement).map(([page, data]) => ({
        page: parseInt(page),
        ...data
      })).sort((a, b) => a.page - b.page)
    };
  }, [studentActivities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viewing': return 'text-blue-600 bg-blue-100';
      case 'answering': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'viewing': return '학습중';
      case 'answering': return '문제풀이';
      case 'idle': return '대기중';
      case 'offline': return '오프라인';
      default: return '알 수 없음';
    }
  };

  const getEngagementLevel = () => {
    if (engagementMetrics.totalActivities > 50) return { level: '높음', color: 'text-green-600' };
    if (engagementMetrics.totalActivities > 20) return { level: '보통', color: 'text-yellow-600' };
    return { level: '낮음', color: 'text-red-600' };
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) return `${minutes}분 ${seconds}초`;
    return `${seconds}초`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  const handleSendMessage = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(student.userId, message.trim());
      setMessage('');
    }
  };

  const engagement = getEngagementLevel();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-sm">
                {student.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{student.userName}</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(student.status)}>
                  {getStatusText(student.status)}
                </Badge>
                <Badge variant="outline" className={engagement.color}>
                  참여도 {engagement.level}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info & Quick Actions */}
          <div className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">이메일</span>
                  <span className="text-sm font-medium">{student.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">현재 페이지</span>
                  <Badge variant="outline">
                    {student.currentPage ? `${student.currentPage}페이지` : '없음'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">최근 활동</span>
                  <span className="text-sm">{formatTimeAgo(student.lastActivity.toISOString())}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">접속 상태</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm">
                      {student.isOnline ? '온라인' : '오프라인'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">활동 통계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {engagementMetrics.pageViews}
                    </div>
                    <div className="text-xs text-blue-600">페이지뷰</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {engagementMetrics.submissions}
                    </div>
                    <div className="text-xs text-green-600">제출</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">총 학습 시간</span>
                    <span className="font-medium">
                      {formatDuration(engagementMetrics.totalTimeSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">평균 페이지 시간</span>
                    <span className="font-medium">
                      {formatDuration(engagementMetrics.avgTimePerPage)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => onAlert?.(student.userId)}
                >
                  <AlertTriangle className="w-3 h-3 mr-2" />
                  주의 알림 보내기
                </Button>
                
                <div className="flex space-x-1">
                  <input
                    type="text"
                    placeholder="메시지 입력..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 text-xs p-2 border rounded"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b">
              {[
                { id: 'overview', label: '개요', icon: User },
                { id: 'activity', label: '활동 기록', icon: Activity },
                { id: 'progress', label: '진도 분석', icon: TrendingUp }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={selectedTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTab(tab.id as any)}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Tab Content */}
            <ScrollArea className="h-96">
              {selectedTab === 'overview' && (
                <div className="space-y-4">
                  {/* Activity Timeline Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">24시간 활동 패턴</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engagementMetrics.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="activities" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Page Engagement */}
                  {engagementMetrics.pageEngagement.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">페이지별 참여도</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {engagementMetrics.pageEngagement.map(page => (
                            <div key={page.page} className="flex items-center space-x-3">
                              <div className="w-8 text-xs text-center">
                                {page.page}p
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{page.views}회 조회</span>
                                  <span>{formatDuration(page.timeSpent)}</span>
                                </div>
                                <Progress value={(page.views / Math.max(...engagementMetrics.pageEngagement.map(p => p.views))) * 100} className="h-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {selectedTab === 'activity' && (
                <div className="space-y-3">
                  {studentActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">활동 기록이 없습니다</p>
                    </div>
                  ) : (
                    studentActivities.map(activity => (
                      <Card key={activity.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {activity.type === 'page_view' && <Eye className="w-4 h-4 text-blue-600" />}
                              {activity.type === 'activity_submit' && <PenTool className="w-4 h-4 text-green-600" />}
                              {activity.type === 'student_joined' && <User className="w-4 h-4 text-purple-600" />}
                              {activity.type === 'pdf_opened' && <BookOpen className="w-4 h-4 text-orange-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.description}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(activity.timestamp)}
                                </span>
                                {activity.pageNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.pageNumber}페이지
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {selectedTab === 'progress' && (
                <div className="space-y-4">
                  {/* Progress Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">학습 진도</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">전체 진도율</span>
                          <span className="text-sm font-medium">
                            {student.currentPage ? Math.round((student.currentPage / 20) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={student.currentPage ? (student.currentPage / 20) * 100 : 0} 
                          className="h-2"
                        />
                        
                        {student.currentPage && (
                          <p className="text-xs text-gray-500">
                            현재 {student.currentPage}페이지 / 총 20페이지
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">학습 인사이트</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">
                              평균보다 {engagementMetrics.avgTimePerPage > 90000 ? '느린' : '빠른'} 학습 속도
                            </span>
                          </div>
                        </div>
                        
                        {engagementMetrics.submissions > 5 && (
                          <div className="p-2 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-green-800">
                                활발한 활동 참여 ({engagementMetrics.submissions}개 활동 완료)
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {!student.isActive && (
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3 text-yellow-600" />
                              <span className="text-xs font-medium text-yellow-800">
                                최근 5분간 비활성 상태
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}