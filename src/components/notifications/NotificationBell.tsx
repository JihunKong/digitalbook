'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  BellRing,
  Check,
  X,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useNotifications, type Notification } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    deleteNotification
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-4 h-4"
    
    switch (type) {
      case 'assignment':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case 'announcement':
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />
      case 'progress':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const recentNotifications = notifications
    .slice(0, 5) // Show only 5 most recent
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ 
              duration: 0.5, 
              repeat: unreadCount > 0 ? Infinity : 0, 
              repeatDelay: 3 
            }}
          >
            {unreadCount > 0 ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">알림</h4>
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="text-xs">
                모두 보기
              </Button>
            </Link>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount}개의 새로운 알림
            </p>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {recentNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      handleNotificationClick(notification)
                      if (notification.actionUrl) {
                        setIsOpen(false)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className={`text-sm font-medium line-clamp-1 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h5>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
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
                                    variant="ghost"
                                    className="h-5 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setIsOpen(false)
                                    }}
                                  >
                                    보기
                                    <ExternalLink className="w-2 h-2 ml-1" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="h-5 w-5 p-0 hover:bg-green-100"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="h-5 w-5 p-0 hover:bg-red-100"
                            >
                              <X className="w-3 h-3 text-red-600" />
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

        {recentNotifications.length > 0 && (
          <div className="p-3 border-t">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                모든 알림 보기
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}