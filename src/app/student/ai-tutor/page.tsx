'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send, 
  Bot, 
  User,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ChevronLeft,
  MoreVertical,
  Paperclip,
  Mic,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Array<{
    type: 'image' | 'document'
    url: string
    name: string
  }>
  suggestions?: string[]
}

interface QuickAction {
  icon: any
  label: string
  prompt: string
  color: string
}

export default function StudentAITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 저는 여러분의 AI 학습 도우미입니다. 🌟 궁금한 점이나 어려운 문제가 있다면 언제든지 물어보세요!',
      timestamp: new Date(),
      suggestions: [
        '오늘 배운 내용 정리해줘',
        '이 문제 어떻게 풀어?',
        '글쓰기 팁 알려줘',
        '시험 준비 방법은?'
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions: QuickAction[] = [
    {
      icon: BookOpen,
      label: '오늘의 학습',
      prompt: '오늘 배운 내용을 정리해줘',
      color: 'text-blue-600'
    },
    {
      icon: HelpCircle,
      label: '문제 해결',
      prompt: '이 문제를 어떻게 접근해야 할까?',
      color: 'text-green-600'
    },
    {
      icon: Lightbulb,
      label: '학습 팁',
      prompt: '효과적인 학습 방법을 알려줘',
      color: 'text-yellow-600'
    },
    {
      icon: Sparkles,
      label: '창의적 글쓰기',
      prompt: '글쓰기 아이디어를 제안해줘',
      color: 'text-purple-600'
    }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (question: string): string => {
    // 간단한 응답 로직 (실제로는 AI API 호출)
    if (question.includes('글쓰기')) {
      return '글쓰기를 잘하기 위한 팁을 알려드릴게요:\n\n1. **주제 명확히 하기**: 글을 쓰기 전에 무엇에 대해 쓸지 명확히 정하세요.\n2. **개요 작성**: 서론-본론-결론의 구조를 미리 계획하세요.\n3. **구체적인 예시**: 추상적인 설명보다 구체적인 예시를 활용하세요.\n4. **퇴고하기**: 처음 쓴 글을 여러 번 읽고 수정하세요.\n\n더 구체적인 도움이 필요하시면 말씀해주세요! 📝'
    } else if (question.includes('시험')) {
      return '효과적인 시험 준비 방법을 소개해드릴게요:\n\n📚 **계획 세우기**\n- 시험 범위를 파악하고 일정을 계획하세요\n- 하루에 공부할 분량을 정하세요\n\n🧠 **능동적 학습**\n- 단순 암기보다는 이해 위주로 공부하세요\n- 스스로 문제를 만들어보세요\n\n⏰ **시간 관리**\n- 50분 공부, 10분 휴식의 뽀모도로 기법 활용\n- 충분한 수면 시간 확보\n\n어떤 과목 시험을 준비하시나요?'
    } else if (question.includes('문제')) {
      return '문제를 해결하는 체계적인 접근법을 알려드릴게요:\n\n1️⃣ **문제 이해하기**\n- 문제가 무엇을 묻고 있는지 정확히 파악\n- 주어진 조건들을 정리\n\n2️⃣ **계획 세우기**\n- 어떤 개념이나 공식을 사용할지 결정\n- 풀이 순서를 계획\n\n3️⃣ **실행하기**\n- 차근차근 단계별로 풀이\n- 중간 과정을 꼼꼼히 확인\n\n어떤 문제를 풀고 계신가요? 구체적으로 알려주시면 더 도움을 드릴 수 있어요!'
    } else {
      return '네, 이해했습니다! 그것에 대해 더 자세히 설명해 드릴게요. 학습하면서 궁금한 점이 있다면 언제든지 물어보세요. 함께 공부하면서 성장해나가요! 💪'
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt)
    inputRef.current?.focus()
  }

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">AI 학습 도우미</h1>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    온라인
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        {/* Quick Actions */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
                onClick={() => handleQuickAction(action)}
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="py-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                        <Bot className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${
                    message.role === 'user' ? 'order-1' : 'order-2'
                  }`}>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-600 hover:text-gray-900 justify-start"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-right text-gray-600' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 shrink-0 order-2">
                      <AvatarFallback className="bg-gray-200">
                        <User className="w-5 h-5 text-gray-600" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                    <Bot className="w-5 h-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="궁금한 점을 물어보세요..."
                className="pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={!inputValue.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI는 학습을 도와주는 도구입니다. 항상 스스로 생각하고 검증해보세요!
          </p>
        </div>
      </div>
    </div>
  )
}