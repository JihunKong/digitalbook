'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Volume2
} from 'lucide-react'
import { AIMessage } from '@/types'
import { useToast } from '@/components/ui/use-toast'
import { AIService } from '@/services/ai.service'

interface AITutorWidgetProps {
  pageContent?: string
  onClose: () => void
}

export function AITutorWidget({ pageContent, onClose }: AITutorWidgetProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: '안녕하세요! AI 튜터입니다. 📚 현재 학습 중인 내용에 대해 궁금한 점이 있으신가요? 무엇이든 물어보세요!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const aiService = new AIService()

  // 자동 스크롤
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // 추천 질문
  const suggestedQuestions = [
    '이 부분을 쉽게 설명해주세요',
    '예시를 들어 설명해주세요',
    '왜 이것이 중요한가요?',
    '실생활에서 어떻게 활용되나요?'
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'student',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // AI 응답 받기
      const response = await aiService.chat(inputValue, {
        pageContent,
        previousMessages: messages.slice(-5), // 최근 5개 메시지만 컨텍스트로 전달
        studentLevel: 2
      })

      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 500))

      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: response,
        timestamp: new Date(),
        metadata: {
          tokensUsed: response.length,
          responseTime: 1.2
        }
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: '복사되었습니다',
      description: '클립보드에 복사되었습니다.',
    })
  }

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    toast({
      title: '피드백 감사합니다',
      description: '더 나은 답변을 위해 노력하겠습니다.',
    })
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-2xl h-[80vh] max-h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/ai-tutor-avatar.png" />
                  <AvatarFallback className="bg-purple-100">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI 튜터</CardTitle>
                <p className="text-sm text-gray-500">항상 당신 곁에</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${
                      message.role === 'student' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      {message.role === 'ai' ? (
                        <>
                          <AvatarImage src="/ai-tutor-avatar.png" />
                          <AvatarFallback className="bg-purple-100">
                            <Bot className="w-5 h-5 text-purple-600" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-blue-100">
                          <User className="w-5 h-5 text-blue-600" />
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className={`flex-1 max-w-[80%] ${
                      message.role === 'student' ? 'flex justify-end' : ''
                    }`}>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.role === 'ai'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.role === 'ai' && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => handleCopyMessage(message.content)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="복사"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="읽어주기"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() => handleFeedback(message.id, 'up')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="도움이 됐어요"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, 'down')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="도움이 안 됐어요"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-purple-100">
                        <Bot className="w-5 h-5 text-purple-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs text-gray-500 mb-2">추천 질문</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="궁금한 점을 물어보세요..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI가 학습 내용을 바탕으로 답변합니다
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}