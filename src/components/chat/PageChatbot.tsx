'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  liked?: boolean;
  disliked?: boolean;
}

interface PageChatbotProps {
  pageId: string;
  pageTitle?: string;
  onClose?: () => void;
  className?: string;
  minimized?: boolean;
  onMinimize?: () => void;
}

export function PageChatbot({
  pageId,
  pageTitle = '페이지',
  onClose,
  className = '',
  minimized = false,
  onMinimize
}: PageChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO 연결 설정
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(`${apiUrl}/chat`, {
      transports: ['websocket'],
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to chat server');
      setIsConnected(true);
      setError(null);
      
      // 페이지 룸에 참가
      socket.emit('join-page', {
        pageId,
        userId: user?.id,
        guestId: !user?.id ? `guest-${Date.now()}` : undefined
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server');
      setIsConnected(false);
    });

    socket.on('error', (errorData: { message: string }) => {
      console.error('Chat error:', errorData);
      setError(errorData.message);
      toast({
        title: '오류',
        description: errorData.message,
        variant: 'destructive'
      });
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      console.log('📜 Received chat history:', history.length, 'messages');
      setMessages(history.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    });

    socket.on('new-message', (message: ChatMessage) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    });

    socket.on('ai-thinking', (thinking: boolean) => {
      setAiThinking(thinking);
    });

    socket.on('user-typing', (data: { userId: string; typing: boolean }) => {
      // 다른 사용자의 타이핑 상태 (필요시 구현)
      console.log('User typing:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [pageId, user?.id, toast]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected || aiThinking) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // 로컬에서 즉시 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // 서버로 메시지 전송
    socketRef.current?.emit('chat-message', { message });
  };

  // 타이핑 상태 전송
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing-start', { pageId });
    }

    // 타이핑 중지 타이머 재설정
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing-stop', { pageId });
    }, 1000);
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 메시지 복사
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: '복사 완료',
      description: '메시지가 클립보드에 복사되었습니다.'
    });
  };

  // 메시지 재생성
  const regenerateMessage = (messageIndex: number) => {
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage.role === 'user') {
        // 마지막 AI 응답 제거하고 다시 요청
        setMessages(prev => prev.slice(0, messageIndex));
        socketRef.current?.emit('chat-message', { message: previousUserMessage.content });
      }
    }
  };

  // 피드백 처리
  const handleFeedback = async (messageId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            liked: type === 'like' ? !msg.liked : false,
            disliked: type === 'dislike' ? !msg.disliked : false
          }
        : msg
    ));

    // 서버에 피드백 전송 (구현 필요)
    console.log(`Feedback: ${type} for message ${messageId}`);
  };

  // 메시지 렌더링
  const renderMessage = (message: ChatMessage, index: number) => (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {message.role === 'assistant' && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            message.role === 'user'
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* AI 메시지 메타데이터 */}
          {message.role === 'assistant' && (
            <div className="mt-2 space-y-2">
              {message.confidence !== undefined && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    신뢰도: {Math.round(message.confidence * 100)}%
                  </div>
                </div>
              )}
              
              {message.sources && message.sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.sources.map((source, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 메시지 액션 */}
        <div className={`flex items-center gap-1 mt-1 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {message.role === 'assistant' && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleFeedback(message.id, 'like')}
              >
                <ThumbsUp className={`w-3 h-3 ${message.liked ? 'text-green-600' : 'text-gray-400'}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleFeedback(message.id, 'dislike')}
              >
                <ThumbsDown className={`w-3 h-3 ${message.disliked ? 'text-red-600' : 'text-gray-400'}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyMessage(message.content)}
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => regenerateMessage(index)}
              >
                <RefreshCw className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-green-100 text-green-600">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );

  if (minimized) {
    return (
      <Button
        onClick={onMinimize}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* 헤더 */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-sm">AI 학습 도우미</CardTitle>
              <p className="text-xs text-gray-500">{pageTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            
            {onMinimize && (
              <Button variant="ghost" size="sm" onClick={onMinimize}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* 메시지 영역 */}
      <CardContent className="flex-1 flex flex-col p-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Bot className="w-8 h-8 mb-2" />
                <p className="text-sm">안녕하세요! 이 페이지에 대해 궁금한 것이 있으면 언제든 물어보세요.</p>
              </div>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}
            
            {aiThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start mb-4"
              >
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    답변을 생성하고 있습니다...
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 입력 영역 */}
        <div className="flex items-center gap-2 mt-4">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={isConnected ? "질문을 입력하세요..." : "연결 중..."}
            disabled={!isConnected || aiThinking}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected || aiThinking}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-1 text-center">
          Enter를 눌러 전송 • AI가 생성한 답변은 틀릴 수 있습니다
        </p>
      </CardContent>
    </Card>
  );
}