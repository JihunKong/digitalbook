'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, BookOpen, HelpCircle, PenTool, RotateCcw, Trash2, Lightbulb, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageContent } from './MessageContent'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface CoachingQuestion {
  level: string
  question: string
  hint?: string
}

interface AITutorProps {
  context?: string
  pageNumber?: number
  subject?: string
  className?: string
  pageQuestions?: CoachingQuestion[]
}

export function AITutor({ 
  context = '', 
  pageNumber = 1,
  subject = '국어',
  className = '',
  pageQuestions = []
}: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! AI 국어 선생님입니다. 🎓 "세상과 나를 분석하라" 단원을 함께 공부해봐요. 궁금한 점이 있으면 언제든 물어보세요!',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCoachingQuestions, setShowCoachingQuestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'ko-KR'
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('')
        
        setInput(transcript)
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          alert('음성이 감지되지 않았습니다. 다시 시도해주세요.')
        } else if (event.error === 'not-allowed') {
          alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.')
        }
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  const quickQuestions = [
    { icon: HelpCircle, text: '이 부분이 이해가 안 돼요' },
    { icon: BookOpen, text: '더 자세히 설명해주세요' },
    { icon: PenTool, text: '연습 문제를 풀어보고 싶어요' },
    { icon: Lightbulb, text: '학습 도움 질문 보기' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepare conversation history (exclude system messages from UI)
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }))

      // System prompt with context and RAG
      const systemPrompt = `당신은 고등학교 1학년 국어 교사입니다. 현재 미래엔 교과서 5단원 "세상과 나를 분석하라"를 가르치고 있습니다.

현재 페이지: ${pageNumber}
${context ? `현재 학습 내용:\n${context}` : ''}

교수법:
1. 학생의 수준에 맞춰 단계적으로 설명하세요
2. 구체적인 예시를 들어 설명하세요
3. 학생이 스스로 생각할 수 있도록 유도하세요
4. 격려와 긍정적인 피드백을 제공하세요
5. 페이지 내용과 관련된 답변을 우선적으로 제공하세요

학생의 질문에 친근하고 이해하기 쉽게 답변해주세요.`

      // Call Upstage API through our backend
      const response = await fetch('/api/upstage/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: input }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to get response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                assistantMessage.content += content
                
                setMessages(prev => 
                  prev.map(m => m.id === assistantMessage.id 
                    ? { ...m, content: assistantMessage.content }
                    : m
                  )
                )
              } catch (e) {
                console.error('Error parsing stream:', e)
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      
      // More specific error messages
      let errorContent = '죄송해요, 오류가 발생했어요.'
      if (error.message?.includes('API key')) {
        errorContent = '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.'
      } else if (error.message?.includes('network')) {
        errorContent = '네트워크 연결을 확인해주세요.'
      } else {
        errorContent = `오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Set the failed input back for retry
      setInput(input)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    if (question === '학습 도움 질문 보기') {
      setShowCoachingQuestions(!showCoachingQuestions)
    } else {
      setInput(question)
    }
  }

  const handleCoachingQuestion = (question: CoachingQuestion) => {
    const fullQuestion = question.hint 
      ? `${question.question}\n(힌트: ${question.hint})`
      : question.question
    setInput(fullQuestion)
    setShowCoachingQuestions(false)
  }

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '안녕하세요! AI 국어 선생님입니다. 🎓 "세상과 나를 분석하라" 단원을 함께 공부해봐요. 궁금한 점이 있으면 언제든 물어보세요!',
        timestamp: new Date()
      }
    ])
    setInput('')
  }

  // 음성 인식 토글
  const toggleListening = () => {
    if (!recognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.')
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg">AI 국어 선생님</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {pageNumber}페이지 학습 중
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="대화 초기화"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <MessageContent content={message.content} role={message.role} />
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {quickQuestions.map((q, idx) => {
              const Icon = q.icon
              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(q.text)}
                  className={`flex-shrink-0 text-xs ${
                    q.text === '학습 도움 질문 보기' && showCoachingQuestions
                      ? 'bg-purple-100 border-purple-300'
                      : ''
                  }`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {q.text}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Coaching Questions */}
        {showCoachingQuestions && pageQuestions.length > 0 && (
          <div className="px-4 py-3 border-t bg-purple-50">
            <p className="text-xs font-medium text-purple-900 mb-2">
              💡 이 페이지의 학습 도움 질문
            </p>
            <div className="space-y-2">
              {pageQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCoachingQuestion(q)}
                  className="w-full text-left p-2 rounded-lg bg-white hover:bg-purple-100 transition-colors border border-purple-200 group"
                >
                  <div className="flex items-start gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs shrink-0 mt-0.5"
                    >
                      {q.level}
                    </Badge>
                    <p className="text-sm text-gray-700 group-hover:text-purple-900">
                      {q.question}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? '듣고 있어요...' : '궁금한 점을 물어보세요...'}
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleListening}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                disabled={isLoading}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
            {input && messages[messages.length - 1]?.content.includes('오류') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSubmit(new Event('submit') as any)}
                disabled={isLoading}
                title="재시도"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}