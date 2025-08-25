'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Activity,
  Clock,
  Eye,
  BookOpen,
  PenTool,
  AlertCircle,
  RefreshCw,
  Circle,
  User
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface RealTimePanelProps {
  connectedStudents: ConnectedStudent[];
  recentActivities: StudentActivity[];
  isConnected: boolean;
}

export default function RealTimePanel({
  connectedStudents,
  recentActivities,
  isConnected
}: RealTimePanelProps) {
  const [showOfflineStudents, setShowOfflineStudents] = useState(false);

  const onlineStudents = connectedStudents.filter(student => student.isOnline);
  const activeStudents = connectedStudents.filter(student => student.isActive);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'viewing':
        return <Eye className="w-3 h-3 text-blue-600" />;
      case 'answering':
        return <PenTool className="w-3 h-3 text-green-600" />;
      case 'idle':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viewing':
        return 'bg-blue-500';
      case 'answering':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'activity_submit':
        return <PenTool className="w-4 h-4 text-green-600" />;
      case 'student_joined':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'pdf_opened':
        return <Eye className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}시간 전`;
    } else if (minutes > 0) {
      return `${minutes}분 전`;
    } else {
      return '방금 전';
    }
  };

  const getLastActivityTime = (student: ConnectedStudent) => {
    const diff = Date.now() - student.lastActivity.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes === 0) return '지금';
    if (minutes < 60) return `${minutes}분 전`;
    return `${Math.floor(minutes / 60)}시간 전`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? '실시간 연결됨' : '연결 끊김'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{onlineStudents.length}</div>
              <div className="text-xs text-blue-600">온라인</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activeStudents.length}</div>
              <div className="text-xs text-green-600">활동중</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Students */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>접속중인 학생</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOfflineStudents(!showOfflineStudents)}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {onlineStudents.map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Status Indicator */}
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(student.status)}`}></div>
                    {student.isActive && (
                      <div className={`absolute inset-0 rounded-full ${getStatusColor(student.status)} animate-ping opacity-75`}></div>
                    )}
                  </div>
                  
                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{student.userName}</div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {getStatusIcon(student.status)}
                      <span>
                        {student.currentPage ? `${student.currentPage}페이지` : '대기중'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Last Activity */}
                  <div className="text-xs text-gray-400">
                    {getLastActivityTime(student)}
                  </div>
                </div>
              ))}
              
              {onlineStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">접속중인 학생이 없습니다</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>실시간 활동</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {recentActivities.slice(0, 20).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium truncate">{activity.studentName}</span>
                      {activity.type === 'activity_submit' && (
                        <Badge variant="secondary" className="text-xs">완료</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      {activity.pageNumber && (
                        <Badge variant="outline" className="text-xs">
                          {activity.pageNumber}p
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">최근 활동이 없습니다</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span>주의사항</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Idle students alert */}
            {connectedStudents.filter(s => s.status === 'idle').length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {connectedStudents.filter(s => s.status === 'idle').length}명 학생이 비활성 상태
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  5분 이상 활동이 없는 학생들이 있습니다.
                </p>
              </div>
            )}
            
            {/* Connection issues alert */}
            {!isConnected && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">연결 상태 불안정</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  실시간 데이터가 지연될 수 있습니다.
                </p>
              </div>
            )}
            
            {/* No alerts */}
            {isConnected && connectedStudents.filter(s => s.status === 'idle').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <div className="text-xs">현재 특별한 주의사항이 없습니다</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}