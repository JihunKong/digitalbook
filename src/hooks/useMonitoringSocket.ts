'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Types for monitoring data
export interface ConnectedStudent {
  userId: string;
  userName: string;
  email: string;
  role: string;
  isOnline: boolean;
  lastActivity: Date;
  currentPage?: number;
  currentPDF?: string;
  timeOnPage?: number;
  isActive: boolean;
  status: 'viewing' | 'answering' | 'idle' | 'offline';
}

export interface StudentActivity {
  id: string;
  type: 'page_view' | 'activity_submit' | 'student_joined' | 'student_left' | 'pdf_opened';
  userId: string;
  studentName: string;
  description: string;
  details?: any;
  timestamp: string;
  pdfId?: string;
  pageNumber?: number;
  activityId?: string;
}

interface UseMonitoringSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // Student data
  connectedStudents: ConnectedStudent[];
  activeStudents: ConnectedStudent[];
  
  // Activity data
  recentActivities: StudentActivity[];
  
  // Methods
  refreshData: () => void;
  getStudentById: (userId: string) => ConnectedStudent | undefined;
  getStudentActivities: (userId: string) => StudentActivity[];
}

export function useMonitoringSocket(): UseMonitoringSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([]);
  const [recentActivities, setRecentActivities] = useState<StudentActivity[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    try {
      // Get auth token from localStorage or cookies
      const token = localStorage.getItem('authToken') || document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        setConnectionError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('📡 Monitoring socket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Join teacher monitoring room for this user's classes
        socket.emit('teacher:start-monitoring', {
          timestamp: new Date().toISOString()
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('📡 Monitoring socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('📡 Monitoring socket connection error:', error);
        setConnectionError(error.message || 'WebSocket 연결에 실패했습니다.');
        setIsConnected(false);
        
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('서버에 연결할 수 없습니다. 페이지를 새로고침해주세요.');
        }
      });

      // Student tracking events
      socket.on('users:online', (onlineUsers: any[]) => {
        console.log('👥 Online users updated:', onlineUsers.length);
        const students = onlineUsers
          .filter(user => user.role === 'STUDENT')
          .map(user => ({
            userId: user.userId,
            userName: user.email?.split('@')[0] || 'Student',
            email: user.email,
            role: user.role,
            isOnline: true,
            lastActivity: new Date(user.lastActivity),
            currentPage: user.currentPage,
            currentPDF: user.currentTextbook,
            isActive: Date.now() - new Date(user.lastActivity).getTime() < 5 * 60 * 1000, // Active if last activity < 5 min
            status: user.currentPage ? 'viewing' : 'idle'
          } as ConnectedStudent));
        
        setConnectedStudents(students);
      });

      // PDF tracking events
      socket.on('pdf:student-activity', (activity: any) => {
        console.log('📚 PDF student activity:', activity);
        
        const newActivity: StudentActivity = {
          id: `${activity.userId}-${Date.now()}`,
          type: activity.type,
          userId: activity.userId,
          studentName: activity.userName,
          description: getActivityDescription(activity),
          details: activity,
          timestamp: activity.timestamp,
          pdfId: activity.pdfId,
          pageNumber: activity.pageNumber,
          activityId: activity.activityId,
        };

        // Add to recent activities
        setRecentActivities(prev => {
          const updated = [newActivity, ...prev].slice(0, 100); // Keep last 100 activities
          return updated;
        });

        // Update student status if it's a page view
        if (activity.type === 'page_view') {
          setConnectedStudents(prev => prev.map(student => 
            student.userId === activity.userId
              ? {
                  ...student,
                  currentPage: activity.pageNumber,
                  currentPDF: activity.pdfId,
                  timeOnPage: activity.timeSpent,
                  lastActivity: new Date(activity.timestamp),
                  isActive: true,
                  status: 'viewing' as const
                }
              : student
          ));
        }

        // Show toast notification for important activities
        if (activity.type === 'activity_submit') {
          toast.success(`${activity.userName}님이 활동을 제출했습니다`, {
            description: `페이지 ${activity.pageNumber}의 활동 완료`,
            duration: 3000,
          });
        }
      });

      // Teacher notifications
      socket.on('teacher:online', (data) => {
        console.log('👨‍🏫 Teacher online:', data);
      });

      socket.on('teacher:offline', (data) => {
        console.log('👨‍🏫 Teacher offline:', data);
      });

      // Student activity notifications
      socket.on('student:activity', (activity) => {
        console.log('🎯 Student activity:', activity);
        
        // Update student's last activity
        setConnectedStudents(prev => prev.map(student => 
          student.userId === activity.studentId
            ? {
                ...student,
                lastActivity: new Date(),
                isActive: true,
                currentPage: activity.activity?.pageNumber || student.currentPage,
                currentPDF: activity.activity?.pdfId || student.currentPDF
              }
            : student
        ));
      });

    } catch (error) {
      console.error('Failed to initialize monitoring socket:', error);
      setConnectionError('WebSocket 연결 초기화에 실패했습니다.');
    }
  }, []);

  // Helper function to generate activity descriptions
  const getActivityDescription = (activity: any): string => {
    switch (activity.type) {
      case 'student_joined':
        return `PDF 학습에 참여했습니다`;
      case 'page_view':
        return `페이지 ${activity.pageNumber}를 ${Math.round(activity.timeSpent / 1000)}초 동안 보았습니다`;
      case 'activity_submit':
        return `페이지 ${activity.pageNumber}의 활동을 완료했습니다`;
      case 'pdf_opened':
        return `PDF 문서를 열었습니다`;
      default:
        return `활동을 수행했습니다`;
    }
  };

  // Get active students (active within last 5 minutes)
  const activeStudents = connectedStudents.filter(student => student.isActive);

  // Refresh data manually
  const refreshData = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('teacher:request-update', {
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  // Get student by ID
  const getStudentById = useCallback((userId: string) => {
    return connectedStudents.find(student => student.userId === userId);
  }, [connectedStudents]);

  // Get activities for specific student
  const getStudentActivities = useCallback((userId: string) => {
    return recentActivities.filter(activity => activity.userId === userId);
  }, [recentActivities]);

  // Initialize socket connection on mount
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        console.log('📡 Disconnecting monitoring socket');
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  // Update student active status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedStudents(prev => prev.map(student => ({
        ...student,
        isActive: Date.now() - student.lastActivity.getTime() < 5 * 60 * 1000,
        status: Date.now() - student.lastActivity.getTime() > 10 * 60 * 1000 
          ? 'idle' as const
          : student.status
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    connectionError,
    connectedStudents,
    activeStudents,
    recentActivities,
    refreshData,
    getStudentById,
    getStudentActivities,
  };
}