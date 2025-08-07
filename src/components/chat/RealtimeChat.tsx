'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Wifi,
  WifiOff,
  Users,
  Circle
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    profileImage?: string
  }
  content: string
  createdAt: string
  context?: any
}

interface ChatUser {
  userId: string
  userName: string
  isTyping: boolean
  isOnline: boolean
}

interface RealtimeChatProps {
  chatRoomId: string
  textbookId?: string
  className?: string
}

export function RealtimeChat({ chatRoomId, textbookId, className }: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatUsers, setChatUsers] = useState<Map<string, ChatUser>>(new Map())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { emit, on, off, isConnected } = useSocket()
  const { user } = useAuth()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Join chat room and handle events
  useEffect(() => {
    if (!isConnected || !chatRoomId) return

    emit('chat:join', { chatRoomId, textbookId })

    const handleChatHistory = (history: ChatMessage[]) => {
      setMessages(history)
    }

    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      
      // Show notification if message is from another user
      if (message.userId !== user?.id) {
        toast.info(`${message.user.name}: ${message.content.substring(0, 50)}...`)
      }
    }

    const handleUserJoined = (data: { userId: string; userName: string }) => {
      setChatUsers(prev => {
        const newUsers = new Map(prev)
        newUsers.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          isTyping: false,
          isOnline: true
        })
        return newUsers
      })
    }

    const handleUserLeft = (data: { userId: string; userName: string }) => {
      setChatUsers(prev => {
        const newUsers = new Map(prev)
        newUsers.delete(data.userId)
        return newUsers
      })
    }

    const handleUserTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return
      
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (data.isTyping) {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    }

    const cleanup1 = on('chat:history', handleChatHistory)
    const cleanup2 = on('chat:message', handleNewMessage)
    const cleanup3 = on('user:joined-chat', handleUserJoined)
    const cleanup4 = on('user:left-chat', handleUserLeft)
    const cleanup5 = on('chat:typing', handleUserTyping)

    return () => {
      emit('chat:leave', { chatRoomId })
      cleanup1?.()
      cleanup2?.()
      cleanup3?.()
      cleanup4?.()
      cleanup5?.()
    }
  }, [emit, on, off, isConnected, chatRoomId, textbookId, user])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return

    emit('chat:message', {
      chatRoomId,
      message: newMessage.trim(),
      context: textbookId ? { textbookId } : null
    })

    setNewMessage('')
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
      emit('chat:typing', { chatRoomId, isTyping: true })
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      emit('chat:typing', { chatRoomId, isTyping: false })
    }, 1000)
  }

  const getTypingText = () => {
    const typingUsersList = Array.from(typingUsers).map(userId => {
      const user = chatUsers.get(userId)
      return user?.userName || 'Someone'
    })
    
    if (typingUsersList.length === 0) return null
    if (typingUsersList.length === 1) return `${typingUsersList[0]} is typing...`
    if (typingUsersList.length === 2) return `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`
    return `${typingUsersList[0]} and ${typingUsersList.length - 1} others are typing...`
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    }
    return format(date, 'MM/dd HH:mm')
  }

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Chat</CardTitle>
            {isConnected ? (
              <Badge variant="outline" className="text-xs gap-1">
                <Wifi className="w-3 h-3 text-green-500" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1">
                <WifiOff className="w-3 h-3 text-red-500" />
                Offline
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{chatUsers.size + 1}</span>
            <Button size="sm" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwnMessage = message.userId === user?.id
                const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${isOwnMessage ? 'justify-end' : ''}`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.user.profileImage} />
                        <AvatarFallback>{message.user.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwnMessage && !showAvatar && <div className="w-8" />}
                    
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.user.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                    
                    {isOwnMessage && showAvatar && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.profileImage} />
                        <AvatarFallback>{user?.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    {isOwnMessage && !showAvatar && <div className="w-8" />}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <div className="flex gap-1">
                  <Circle className="w-2 h-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <Circle className="w-2 h-2 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <Circle className="w-2 h-2 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>{getTypingText()}</span>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Message input */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Button type="button" size="icon" variant="ghost">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!isConnected}
            />
            <Button type="button" size="icon" variant="ghost">
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}