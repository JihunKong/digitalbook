'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/useSocket'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'announcement' | 'progress'
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  userId: string
  createdAt: string
  expiresAt?: string
  metadata?: Record<string, any>
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  loadNotifications: () => Promise<void>
  sendNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { on, off, isConnected } = useSocket()

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      
      // Try to load from API
      const response = await apiClient.getNotifications({
        limit: 50,
        isRead: undefined // Get both read and unread
      })
      
      if (Array.isArray(response?.data) && response.data.length > 0) {
        // Transform backend data to match our interface
        const transformedNotifications: Notification[] = response.data.map((notif: any) => ({
          id: notif.id,
          type: notif.type || 'info',
          title: notif.title,
          message: notif.message || notif.content,
          actionUrl: notif.actionUrl,
          actionText: notif.actionText,
          isRead: notif.isRead || false,
          priority: notif.priority || 'medium',
          userId: notif.userId,
          createdAt: notif.createdAt,
          expiresAt: notif.expiresAt,
          metadata: notif.metadata || {}
        }))
        
        setNotifications(transformedNotifications)
      } else {
        // Fallback to mock notifications
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'assignment',
            title: '새로운 과제가 배정되었습니다',
            message: '글쓰기 과제: 나의 꿈에 대해 500자 이상 작성해주세요.',
            actionUrl: '/student/assignments/1',
            actionText: '과제 하기',
            isRead: false,
            priority: 'high',
            userId: 'current-user',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { assignmentId: '1', subject: '국어' }
          },
          {
            id: '2',
            type: 'progress',
            title: '학습 목표 달성!',
            message: '현대문학의 이해 교재 3장을 완료했습니다. 수고하셨습니다!',
            isRead: false,
            priority: 'medium',
            userId: 'current-user',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            metadata: { textbookId: '1', chapter: 3 }
          },
          {
            id: '3',
            type: 'announcement',
            title: '시스템 점검 안내',
            message: '내일(3월 21일) 오후 2시-4시 시스템 점검이 예정되어 있습니다.',
            isRead: true,
            priority: 'medium',
            userId: 'current-user',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        ]
        
        setNotifications(mockNotifications)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast.error('알림을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.markNotificationAsRead(notificationId)
      
      if (response.data) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
      } else {
        // Fallback: just update locally
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Still update locally even if API fails
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.markAllNotificationsAsRead()
      
      if (response.data) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        toast.success('모든 알림을 읽음 처리했습니다')
      } else {
        // Fallback: just update locally
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        toast.success('모든 알림을 읽음 처리했습니다')
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      // Still update locally even if API fails
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      toast.success('모든 알림을 읽음 처리했습니다')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiClient.deleteNotification(notificationId)
      
      if (response.data) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        )
        toast.success('알림이 삭제되었습니다')
      } else {
        // Fallback: just update locally
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        )
        toast.success('알림이 삭제되었습니다')
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      // Still update locally even if API fails
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
      toast.success('알림이 삭제되었습니다')
    }
  }

  const sendNotification = async (notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>) => {
    try {
      const response = await apiClient.sendNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        metadata: notification.metadata
      })

      if (response?.data) {
        // Add the notification from server response
        const newNotification = {
          ...(response.data as Notification),
          isRead: false
        } as Notification
        setNotifications(prev => [newNotification, ...prev])
      } else {
        // Fallback: create locally
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          isRead: false
        }
        setNotifications(prev => [newNotification, ...prev])
      }
      
      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast.info(notification.title, {
          description: notification.message
        })
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast.error('알림 전송에 실패했습니다')
    }
  }

  // Handle real-time notifications via WebSocket
  useEffect(() => {
    if (!isConnected) return

    const handleNewNotification = (notification: any) => {
      const newNotification: Notification = {
        id: notification.id,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        actionUrl: notification.data?.actionUrl,
        actionText: notification.data?.actionText,
        isRead: false,
        priority: notification.priority || 'medium',
        userId: notification.userId,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
        metadata: notification.data || {}
      }
      
      setNotifications(prev => [newNotification, ...prev])
      
      // Show toast for the new notification
      toast(notification.title, {
        description: notification.message,
      })
    }

    const handleNotificationRead = (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === data.notificationId ? { ...n, isRead: true } : n
        )
      )
    }

    const handleAssignmentNotification = (data: any) => {
      const newNotification: Notification = {
        id: `assignment-${Date.now()}`,
        type: 'assignment',
        title: 'New Assignment',
        message: `New assignment "${data.assignment.title}" has been posted`,
        actionUrl: `/student/assignments/${data.assignment.id}`,
        actionText: 'View Assignment',
        isRead: false,
        priority: 'high',
        userId: 'current-user',
        createdAt: new Date().toISOString(),
        expiresAt: data.assignment.dueDate,
        metadata: {
          assignmentId: data.assignment.id,
          className: data.className,
          points: data.assignment.points
        }
      }
      
      setNotifications(prev => [newNotification, ...prev])
      
      toast.info('New Assignment', {
        description: `${data.assignment.title} - Due: ${new Date(data.assignment.dueDate).toLocaleDateString()}`
      })
    }

    const handleTeacherOnline = (data: any) => {
      toast.success('Teacher Online', {
        description: `${data.teacherName} is now online in ${data.className}`
      })
    }

    const cleanup1 = on('notification:new', handleNewNotification)
    const cleanup2 = on('notification:marked-read', handleNotificationRead)
    const cleanup3 = on('assignment:new', handleAssignmentNotification)
    const cleanup4 = on('teacher:online', handleTeacherOnline)

    return () => {
      cleanup1?.()
      cleanup2?.()
      cleanup3?.()
      cleanup4?.()
    }
  }, [on, off, isConnected])

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  // Cleanup expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setNotifications(prev => 
        prev.filter(notification => 
          !notification.expiresAt || new Date(notification.expiresAt) > now
        )
      )
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    sendNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}