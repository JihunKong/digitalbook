'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  BellRing,
  Users,
  BookOpen,
  PenTool,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

import { ConnectedStudent, StudentActivity } from '@/hooks/useMonitoringSocket';

interface LiveActivityNotificationsProps {
  students: ConnectedStudent[];
  activities: StudentActivity[];
  isConnected: boolean;
}

interface NotificationSettings {
  studentJoined: boolean;
  studentLeft: boolean;
  activitySubmitted: boolean;
  longPageView: boolean;
  idleWarning: boolean;
  soundEnabled: boolean;
  showToasts: boolean;
}

export default function LiveActivityNotifications({
  students,
  activities,
  isConnected
}: LiveActivityNotificationsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    studentJoined: true,
    studentLeft: true,
    activitySubmitted: true,
    longPageView: true,
    idleWarning: true,
    soundEnabled: true,
    showToasts: true
  });
  
  const [notificationHistory, setNotificationHistory] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    student?: string;
    priority: 'low' | 'medium' | 'high';
  }>>([]);
  
  const previousActivitiesRef = useRef<StudentActivity[]>([]);
  const previousStudentsRef = useRef<ConnectedStudent[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context for notification sounds
  useEffect(() => {
    if (settings.soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [settings.soundEnabled]);

  // Play notification sound
  const playNotificationSound = (priority: 'low' | 'medium' | 'high') => {
    if (!settings.soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different frequencies for different priorities
    switch (priority) {
      case 'low':
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        break;
      case 'medium':
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        break;
      case 'high':
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        break;
    }
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  // Add notification to history
  const addNotification = (
    type: string, 
    message: string, 
    student?: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date(),
      student,
      priority
    };
    
    setNotificationHistory(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    
    if (settings.showToasts) {
      const toastProps = {
        description: student ? `학생: ${student}` : undefined,
        duration: priority === 'high' ? 5000 : 3000,
      };

      switch (priority) {
        case 'high':
          toast.error(message, toastProps);
          break;
        case 'medium':
          toast.success(message, toastProps);
          break;
        case 'low':
          toast.info(message, toastProps);
          break;
      }
    }
    
    playNotificationSound(priority);
  };

  // Monitor new activities
  useEffect(() => {
    if (!isConnected) return;
    
    const previousActivities = previousActivitiesRef.current;
    const newActivities = activities.filter(activity => 
      !previousActivities.some(prev => prev.id === activity.id)
    );

    newActivities.forEach(activity => {
      switch (activity.type) {
        case 'student_joined':
          if (settings.studentJoined) {
            addNotification(
              'student_joined',
              `새로운 학생이 참여했습니다`,
              activity.studentName,
              'medium'
            );
          }
          break;
          
        case 'student_left':
          if (settings.studentLeft) {
            addNotification(
              'student_left',
              `학생이 나갔습니다`,
              activity.studentName,
              'low'
            );
          }
          break;
          
        case 'activity_submit':
          if (settings.activitySubmitted) {
            addNotification(
              'activity_submit',
              `활동을 완료했습니다 (페이지 ${activity.pageNumber})`,
              activity.studentName,
              'high'
            );
          }
          break;
          
        case 'page_view':
          // Check for long page views (>3 minutes)
          if (settings.longPageView && activity.details?.timeSpent > 180000) {
            addNotification(
              'long_page_view',
              `페이지 ${activity.pageNumber}에서 오래 머무르고 있습니다`,
              activity.studentName,
              'medium'
            );
          }
          break;
      }
    });

    previousActivitiesRef.current = activities;
  }, [activities, isConnected, settings]);

  // Monitor student status changes
  useEffect(() => {
    if (!isConnected) return;
    
    const previousStudents = previousStudentsRef.current;
    
    students.forEach(student => {
      const previousStudent = previousStudents.find(p => p.userId === student.userId);
      
      // Check for newly idle students
      if (settings.idleWarning && 
          previousStudent && 
          previousStudent.status !== 'idle' && 
          student.status === 'idle') {
        addNotification(
          'student_idle',
          `비활성 상태로 변경되었습니다`,
          student.userName,
          'medium'
        );
      }
      
      // Check for students coming back online
      if (previousStudent && 
          !previousStudent.isOnline && 
          student.isOnline) {
        addNotification(
          'student_online',
          `다시 접속했습니다`,
          student.userName,
          'low'
        );
      }
    });

    previousStudentsRef.current = students;
  }, [students, isConnected, settings]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'student_joined':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'student_left':
        return <Users className="w-4 h-4 text-red-600" />;
      case 'activity_submit':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'long_page_view':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'student_idle':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'student_online':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <BellRing className="w-4 h-4" />
            <span>실시간 알림</span>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? 'ON' : 'OFF'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            >
              {settings.soundEnabled ? 
                <Volume2 className="w-3 h-3" /> : 
                <VolumeX className="w-3 h-3" />
              }
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Quick Settings */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant={settings.showToasts ? "default" : "outline"}
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, showToasts: !prev.showToasts }))}
            className="text-xs"
          >
            토스트 알림
          </Button>
          <Button
            variant={settings.activitySubmitted ? "default" : "outline"}
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, activitySubmitted: !prev.activitySubmitted }))}
            className="text-xs"
          >
            활동 완료
          </Button>
        </div>
        
        {/* Live Activity Feed */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {notificationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">알림이 없습니다</p>
              {!isConnected && (
                <p className="text-xs text-red-500 mt-1">
                  연결이 끊어진 상태입니다
                </p>
              )}
            </div>
          ) : (
            notificationHistory.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-3 border-l-4 rounded-r-lg transition-all hover:shadow-sm
                  ${getPriorityColor(notification.priority)}
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                    {notification.student && (
                      <p className="text-xs text-gray-600 mt-1">
                        학생: {notification.student}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          notification.priority === 'high' ? 'text-red-600 border-red-300' :
                          notification.priority === 'medium' ? 'text-blue-600 border-blue-300' :
                          'text-gray-600 border-gray-300'
                        }`}
                      >
                        {notification.priority === 'high' ? '중요' : 
                         notification.priority === 'medium' ? '보통' : '일반'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer Statistics */}
        {notificationHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {notificationHistory.filter(n => n.priority === 'high').length}
                </div>
                <div className="text-xs text-gray-500">중요</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {notificationHistory.filter(n => n.priority === 'medium').length}
                </div>
                <div className="text-xs text-gray-500">보통</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {notificationHistory.length}
                </div>
                <div className="text-xs text-gray-500">전체</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}