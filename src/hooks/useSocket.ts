import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  reconnectAttempt: number;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempt: 0,
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionState(prev => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://xn--220bu63c.com', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });
      reconnectAttemptsRef.current = 0;
      
      // Join user-specific room
      if (user?.id) {
        socket.emit('user:join', { userId: user.id });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: new Error(error.message),
      }));
      
      handleReconnection();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));

      if (reason === 'io server disconnect') {
        // Server disconnected the client, don't automatically reconnect
        toast({
          title: 'Disconnected from server',
          description: 'You have been disconnected from the server.',
          variant: 'destructive',
        });
      } else {
        // Try to reconnect
        handleReconnection();
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: 'Connection error',
        description: error.message || 'An error occurred with the connection.',
        variant: 'destructive',
      });
    });

    socketRef.current = socket;
  }, [token, user]);

  const handleReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectionAttempts) {
      setConnectionState(prev => ({
        ...prev,
        error: new Error('Maximum reconnection attempts reached'),
      }));
      toast({
        title: 'Connection failed',
        description: 'Unable to reconnect to the server. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionState(prev => ({
      ...prev,
      reconnectAttempt: reconnectAttemptsRef.current,
    }));

    const delay = reconnectionDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${reconnectionAttempts}`);
      connect();
    }, delay);
  }, [connect, reconnectionAttempts, reconnectionDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempt: 0,
    });
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn(`Cannot emit '${event}': Socket not connected`);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn(`Cannot listen to '${event}': Socket not initialized`);
      return;
    }
    socketRef.current.on(event, handler);
    
    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    if (handler) {
      socketRef.current.off(event, handler);
    } else {
      socketRef.current.off(event);
    }
  }, []);

  // Auto-connect when component mounts if token is available
  useEffect(() => {
    if (autoConnect && token && !socketRef.current) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, token, connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (token && socketRef.current && !socketRef.current.connected) {
      disconnect();
      connect();
    }
  }, [token, connect, disconnect]);

  return {
    socket: socketRef.current,
    ...connectionState,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

// Specialized hooks for specific features
export function useNotifications() {
  const { on, off, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
      });
    };

    const handleNotificationRead = (notificationId: string) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const cleanup1 = on('notification:new', handleNewNotification);
    const cleanup2 = on('notification:marked-read', handleNotificationRead);

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, [on, off, isConnected]);

  return { notifications, unreadCount };
}

export function useOnlineUsers() {
  const { on, off, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleOnlineUsers = (users: any[]) => {
      setOnlineUsers(users);
    };

    const cleanup = on('users:online', handleOnlineUsers);

    return () => {
      cleanup?.();
    };
  }, [on, off, isConnected]);

  return { onlineUsers };
}

export function useClassRoom(classId: string) {
  const { emit, on, off, isConnected } = useSocket();
  const [classUsers, setClassUsers] = useState<any[]>([]);
  const [teacherOnline, setTeacherOnline] = useState(false);

  useEffect(() => {
    if (!isConnected || !classId) return;

    // Join class room
    emit('class:join', { classId });

    const handleClassUsers = (users: any[]) => {
      setClassUsers(users);
    };

    const handleTeacherOnline = (data: any) => {
      setTeacherOnline(true);
      toast({
        title: 'Teacher Online',
        description: `${data.teacherName} is now online`,
      });
    };

    const handleTeacherOffline = (data: any) => {
      setTeacherOnline(false);
    };

    const cleanup1 = on('class:online-users', handleClassUsers);
    const cleanup2 = on('teacher:online', handleTeacherOnline);
    const cleanup3 = on('teacher:offline', handleTeacherOffline);

    return () => {
      emit('class:leave', { classId });
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
    };
  }, [emit, on, off, isConnected, classId]);

  return { classUsers, teacherOnline };
}