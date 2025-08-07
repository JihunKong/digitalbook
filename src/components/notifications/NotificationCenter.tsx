'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  BellRing,
  Check,
  CheckCheck,
  X,
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  Megaphone,
  TrendingUp,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useNotifications, type Notification } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all')

  const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
    const iconProps = {
      className: `w-5 h-5 ${priority === 'high' ? 'text-red-500' : 
                              priority === 'medium' ? 'text-yellow-500' : 
                              'text-blue-500'}`
    }

    switch (type) {
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />
      case 'assignment':
        return <FileText {...iconProps} />
      case 'announcement':
        return <Megaphone {...iconProps} />
      case 'progress':
        return <TrendingUp {...iconProps} />
      default:
        return <Info {...iconProps} />
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'assignment':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'announcement':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'progress':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead
      case 'high':
        return notification.priority === 'high'
      default:
        return true
    }
  })

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <CardTitle>알림 센터</CardTitle>
                <CardDescription>
                  {unreadCount}개의 읽지 않은 알림이 있습니다
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  모두 읽음
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                전체 ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                읽지 않음 ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="high">
                중요 ({notifications.filter(n => n.priority === 'high').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>알림이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`relative p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                            notification.isRead ? 'bg-gray-50' : 'bg-white border-blue-200'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {/* Priority indicator */}
                          {notification.priority === 'high' && (
                            <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          )}

                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type, notification.priority)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                      {notification.title}
                                    </h4>
                                    <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                                      {notification.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                        locale: ko
                                      })}
                                    </span>
                                    {notification.actionUrl && (
                                      <Link href={notification.actionUrl}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1 h-6 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {notification.actionText || '보기'}
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead(notification.id)
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}