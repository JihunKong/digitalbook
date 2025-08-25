'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Send, 
  Bot, 
  User,
  Sparkles,
  RotateCcw,
  Volume2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  BookOpen,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTTS } from '@/hooks/useTTS'
import { apiClient } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  type?: 'text' | 'suggestion' | 'quiz' | 'explanation'
  metadata?: {
    confidence?: number
    sources?: string[]
    difficulty?: 'easy' | 'medium' | 'hard'
  }
}

interface AITutorChatProps {
  pageContent: string
  pageNumber: number
  textbookTitle: string
  pdfId?: string
  textbookId?: string
}

export function AITutorChat({ pageContent, pageNumber, textbookTitle, pdfId, textbookId }: AITutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `안녕하세요! 저는 AI 튜터입니다. 📚 

현재 "${textbookTitle}"의 ${pageNumber}페이지를 학습 중이시네요. 이 페이지에 대해 궁금한 점이 있으시면 편하게 질문해주세요!

도움이 필요한 내용:
• 어려운 개념 설명
• 추가 예시
• 연습 문제 풀이
• 관련 지식 확장`,
      timestamp: new Date(),
      type: 'text',
      metadata: { confidence: 1.0 }
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [learningProgress, setLearningProgress] = useState(0)
  const [interactionCount, setInteractionCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { speak: speakTTS, stop: stopTTS, isSpeaking } = useTTS()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // 페이지가 변경되면 새로운 환영 메시지 추가
    const welcomeMessage: Message = {
      id: `welcome-${pageNumber}`,
      role: 'assistant',
      content: `${pageNumber}페이지로 이동하셨네요! 이 페이지의 내용에 대해 궁금한 점이 있으시면 알려주세요. 😊`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, welcomeMessage])
  }, [pageNumber])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      // Use the enhanced backend API with PDF context
      const sessionId = `session-${textbookId || pdfId || 'default'}-${Date.now()}`
      
      const response = await apiClient.sendChatMessage({
        message: currentInput,
        sessionId: sessionId,
        pdfId: pdfId,
        pageNumber: pageNumber,
        pageContent: pageContent,
        textbookId: textbookId
      })

      if (response.error) {
        throw new Error(response.error.message || 'API call failed')
      }

      const result = response.data
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result?.assistantMessage?.content || getAIResponse(currentInput, pageContent),
        timestamp: result?.assistantMessage?.timestamp || new Date(),
        type: 'text',
        metadata: {
          confidence: 0.95,
          difficulty: 'medium'
        }
      }
      
      setMessages(prev => [...prev, aiResponse])
      setInteractionCount(prev => prev + 1)
      setLearningProgress(prev => Math.min(100, prev + 5))
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Fallback to local AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(currentInput, pageContent),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const getAIResponse = (question: string, content: string): string => {
    // 실제로는 API 호출로 대체
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('현대 소설') || lowerQuestion.includes('특징')) {
      return `현대 소설의 주요 특징을 설명드리겠습니다:

1. **내면 의식의 탐구** 🧠
   - 인물의 심리와 의식의 흐름을 중심으로 이야기가 전개됩니다
   - 외적 사건보다 내적 갈등이 중요해집니다

2. **실험적 기법** 🎨
   - 의식의 흐름, 몽타주, 다중 시점 등 새로운 서사 기법을 사용합니다
   - 전통적인 시간 순서를 파괴하기도 합니다

3. **현실 비판** 🌍
   - 사회 문제와 인간 소외를 주요 주제로 다룹니다
   - 개인과 사회의 관계를 탐구합니다

더 자세한 설명이 필요하신가요?`
    } else if (lowerQuestion.includes('의식의 흐름')) {
      return `'의식의 흐름(Stream of Consciousness)' 기법에 대해 설명드릴게요:

📌 **정의**: 인물의 의식 속 생각과 감정을 여과 없이 그대로 표현하는 기법

🔍 **특징**:
- 논리적 연결 없이 생각이 이어집니다
- 과거와 현재가 뒤섞여 나타납니다
- 문장이 완성되지 않을 수도 있습니다

📚 **예시 작가**:
- 제임스 조이스 『율리시스』
- 버지니아 울프 『댈러웨이 부인』
- 이상 『날개』

이 기법을 사용한 구체적인 문장 예시를 보여드릴까요?`
    } else if (lowerQuestion.includes('이상') || lowerQuestion.includes('작가')) {
      return `한국 현대 소설의 주요 작가들을 소개해드릴게요:

👤 **이상 (1910-1937)**
- 대표작: 『날개』, 『오감도』
- 실험적이고 전위적인 작품 세계
- 의식의 흐름 기법을 한국 문학에 도입

👤 **김동인 (1900-1951)**
- 대표작: 『감자』, 『배따라기』
- 자연주의 문학의 선구자
- 인간의 본능과 욕망을 사실적으로 묘사

👤 **염상섭 (1897-1963)**
- 대표작: 『삼대』, 『만세전』
- 리얼리즘 문학의 대표 작가
- 일제강점기 한국인의 삶을 깊이 있게 그려냄

어느 작가에 대해 더 자세히 알고 싶으신가요?`
    }
    
    return `네, 좋은 질문이네요! "${question}"에 대해 설명드리겠습니다.

이 페이지의 내용을 바탕으로 보면, 이는 현대 문학의 중요한 특징 중 하나입니다. 

더 구체적인 예시나 설명이 필요하시면 말씀해주세요! 😊`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // 복사 완료 피드백 추가 가능
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'ko-KR'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const speakMessage = async (text: string) => {
    // Use OpenAI TTS with Korean-optimized settings
    await speakTTS(text, {
      voice: 'shimmer',  // Better for Korean
      model: 'tts-1-hd', // High quality
      speed: 0.9,        // Slightly slower for clarity
      language: 'ko',
      autoPlay: true
    })
  }

  const generateQuiz = async () => {
    setIsTyping(true)
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageContent,
          pageNumber,
          difficulty: 'medium'
        })
      })

      if (response.ok) {
        const result = await response.json()
        const quizMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📝 **미니 퀴즈**\n\n${result.question}\n\n${result.options?.map((opt: string, idx: number) => 
            `${idx + 1}. ${opt}`).join('\n') || ''}`,
          timestamp: new Date(),
          type: 'quiz',
          metadata: { difficulty: result.difficulty }
        }
        setMessages(prev => [...prev, quizMessage])
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const suggestedQuestions = [
    "현대 소설의 특징을 요약해주세요",
    "의식의 흐름 기법이란?",
    "이 내용과 관련된 예시를 들어주세요",
    "연습 문제를 풀어주세요"
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Learning Progress Header */}
      <div className="border-b p-3 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">학습 진도</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {interactionCount}번 대화
            </Badge>
            <Badge variant="outline" className="text-xs">
              페이지 {pageNumber}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={learningProgress} className="flex-1 h-2" />
          <span className="text-xs text-gray-600">{learningProgress}%</span>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] ${
                message.role === 'user' ? 'order-1' : 'order-2'
              }`}>
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'quiz'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-100'
                }`}>
                  {message.type === 'quiz' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">퀴즈</span>
                      {message.metadata?.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {message.metadata.difficulty}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.confidence && message.metadata.confidence < 0.8 && (
                    <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>확신도: {Math.round(message.metadata.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => speakMessage(message.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 order-2">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-100">
                  <Bot className="h-5 w-5 text-purple-600" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Smart Actions */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">스마트 액션</p>
          <Badge variant="outline" className="text-xs">
            AI 추천
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={generateQuiz}
            disabled={isTyping}
          >
            <Target className="h-3 w-3 mr-1" />
            퀴즈 생성
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setInput("이 내용을 쉽게 설명해주세요")}
          >
            <Brain className="h-3 w-3 mr-1" />
            쉽게 설명
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mb-2">추천 질문</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setInput(question)
                inputRef.current?.focus()
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {question}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "음성을 인식하고 있습니다..." : "질문을 입력하세요..."}
            className="flex-1"
            disabled={isListening}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={startVoiceInput}
            disabled={isListening || isTyping}
            className={isListening ? "bg-red-50 border-red-200" : ""}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-red-600" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={handleSend} disabled={!input.trim() || isTyping || isListening}>
            <Send className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        {isListening && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-600 rounded-full"
            />
            음성 인식 중... 마이크에 대고 말씀해주세요
          </div>
        )}
      </div>
    </div>
  )
}