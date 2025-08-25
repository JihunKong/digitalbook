'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot,
  User,
  BookOpen,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  pageContext?: number
  messageType?: 'question' | 'explanation' | 'coaching' | 'summary'
}

interface PDFChatBotProps {
  pdfId: string
  currentPage: number
  pageContent?: string
  onClose?: () => void
  className?: string
}

// Pre-defined coaching prompts for quick access
const COACHING_PROMPTS = [
  {
    icon: <Lightbulb className="w-4 h-4" />,
    text: "이 페이지의 핵심 내용을 요약해주세요",
    prompt: "현재 페이지의 주요 내용과 핵심 포인트를 3-5개 요약해주세요."
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    text: "이해하기 어려운 부분을 설명해주세요", 
    prompt: "이 페이지에서 학습자가 이해하기 어려워할 수 있는 개념이나 내용을 찾아서 쉽게 설명해주세요."
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    text: "학습 점검 질문을 만들어주세요",
    prompt: "이 페이지 내용을 바탕으로 학습자의 이해도를 확인할 수 있는 질문 3개를 만들어주세요."
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    text: "관련 학습 활동을 제안해주세요",
    prompt: "이 페이지 내용과 관련된 실습 활동이나 추가 학습 방법을 제안해주세요."
  }
]

export function PDFChatBot({ 
  pdfId, 
  currentPage, 
  pageContent, 
  onClose,
  className = "" 
}: PDFChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize chat with page context
  useEffect(() => {
    if (currentPage && pageContent && !isInitialized) {
      initializeChat()
      setIsInitialized(true)
    }
  }, [currentPage, pageContent, isInitialized])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const initializeChat = async () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `📖 **페이지 ${currentPage} AI 코칭**

안녕하세요! 현재 페이지에 대해 궁금한 것이 있으면 언제든 질문해주세요.

다음과 같은 도움을 드릴 수 있습니다:
• 📝 내용 요약 및 핵심 포인트 설명
• 🤔 어려운 개념의 쉬운 설명  
• 💡 학습 팁 및 관련 활동 제안
• 📊 이해도 점검을 위한 질문 생성

아래 추천 질문을 클릭하거나 직접 질문을 입력해보세요!`,
      timestamp: new Date(),
      pageContext: currentPage,
      messageType: 'coaching'
    }

    setMessages([welcomeMessage])
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user', 
      content: content.trim(),
      timestamp: new Date(),
      pageContext: currentPage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call AI chat API with page context
      const response = await apiClient.chatWithAI({
        message: content,
        context: {
          pdfId,
          pageNumber: currentPage,
          pageContent: pageContent?.substring(0, 2000), // Limit content length
          chatHistory: messages.slice(-5) // Last 5 messages for context
        }
      })

      if (response.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.response || response.data.message,
          timestamp: new Date(),
          pageContext: currentPage,
          messageType: response.data.messageType || 'explanation'
        }

        setMessages(prev => [...prev, assistantMessage])
      } else if (response.error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: new Date(),
          pageContext: currentPage
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '연결에 문제가 발생했습니다. 네트워크를 확인하고 다시 시도해주세요.',
        timestamp: new Date(),
        pageContext: currentPage
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const getMessageTypeIcon = (messageType?: string) => {
    switch (messageType) {
      case 'question':
        return <HelpCircle className="w-4 h-4 text-blue-500" />
      case 'explanation':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />
      case 'coaching':
        return <Bot className="w-4 h-4 text-green-500" />
      case 'summary':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      default:
        return <Bot className="w-4 h-4 text-gray-500" />
    }
  }

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Card className={`h-[500px] flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              AI 코칭봇
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              페이지 {currentPage}
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {/* Chat Messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 pr-4"
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    getMessageTypeIcon(message.messageType)
                  )}
                </div>

                {/* Message */}
                <div className={`
                  flex-1 max-w-[80%]
                  ${message.type === 'user' ? 'text-right' : 'text-left'}
                `}>
                  <div className={`
                    inline-block p-3 rounded-lg text-sm
                    ${message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                  
                  <div className={`
                    text-xs text-gray-500 mt-1 flex items-center
                    ${message.type === 'user' ? 'justify-end' : 'justify-start'}
                  `}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatMessageTime(message.timestamp)}
                    {message.pageContext && (
                      <span className="ml-2">
                        페이지 {message.pageContext}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 text-gray-800 inline-block p-3 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-medium">💡 추천 질문:</div>
          <div className="grid grid-cols-1 gap-1">
            {COACHING_PROMPTS.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-8 p-2"
                onClick={() => handleQuickPrompt(prompt.prompt)}
                disabled={isLoading}
              >
                {prompt.icon}
                <span className="ml-1 truncate">{prompt.text}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}