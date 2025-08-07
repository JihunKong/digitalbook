'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, FileText, User, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// PDF 뷰어 동적 임포트
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
});

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: string;
}

interface DocumentData {
  id: string;
  name: string;
  type: string;
  content: string;
  fileUrl?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  teacher: string;
}

export default function StudentClassroom() {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // 세션 토큰 확인
    const token = localStorage.getItem('studentSession');
    if (!token) {
      window.location.href = '/student/join';
      return;
    }
    setSessionToken(token);
    fetchClassData(token);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchClassData = async (token: string) => {
    try {
      // 세션 검증 및 수업 정보 가져오기
      const sessionResponse = await fetch('/api/student/session/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('세션이 만료되었습니다.');
      }

      const sessionData = await sessionResponse.json();
      setClassInfo(sessionData.student.class);

      // 문서 가져오기
      const docResponse = await fetch(`/api/student/class/${sessionData.student.class.id}/document`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (docResponse.ok) {
        const docData = await docResponse.json();
        setDocument(docData.document);
      }

      // 환영 메시지
      setMessages([{
        id: '1',
        content: `안녕하세요! ${sessionData.student.name}님, ${sessionData.student.class.name} 수업에 오신 것을 환영합니다. 궁금한 점이 있으면 언제든지 물어보세요!`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('수업 데이터 로드 실패:', error);
      toast.error('수업 정보를 불러오는데 실패했습니다.');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(`/api/student/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          question: inputMessage,
          classId: classInfo?.id,
          context: {
            currentPage,
            documentSection: document?.content.substring(
              currentPage * 1000 - 1000, 
              currentPage * 1000
            )
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage: Message = {
          id: Date.now().toString(),
          content: data.response,
          sender: 'bot',
          timestamp: new Date(),
          type: data.questionType
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('응답 생성 실패');
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      toast.error('메시지 전송에 실패했습니다.');
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderDocument = () => {
    if (!document) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FileText className="h-12 w-12 mb-4" />
          <p>문서를 불러오는 중...</p>
        </div>
      );
    }

    if (document.type === 'application/pdf' && document.fileUrl) {
      return <PDFViewer fileUrl={document.fileUrl} onPageChange={setCurrentPage} />;
    }

    // 텍스트 문서 렌더링
    return (
      <ScrollArea className="h-full p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{document.content}</pre>
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측: 문서 뷰어 */}
      <div className="flex-1 bg-white border-r">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document?.name || '학습 자료'}
            </h2>
            {classInfo && (
              <p className="text-sm text-gray-600 mt-1">
                {classInfo.name} | {classInfo.teacher} 선생님
              </p>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {renderDocument()}
          </div>
        </div>
      </div>

      {/* 우측: AI 챗봇 */}
      <div className="w-[480px] flex flex-col bg-white">
        <div className="p-4 border-b bg-primary text-white">
          <h2 className="font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI 학습 도우미
          </h2>
          <p className="text-sm opacity-90 mt-1">
            궁금한 점을 물어보세요
          </p>
        </div>

        {/* 메시지 영역 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[320px] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.type && (
                    <p className="text-xs mt-1 opacity-70">
                      {message.type === 'KNOWLEDGE' && '💡 지식'}
                      {message.type === 'REASONING' && '🤔 추론'}
                      {message.type === 'CRITICAL' && '🎯 비판적 사고'}
                      {message.type === 'CREATIVE' && '✨ 창의적 사고'}
                      {message.type === 'REFLECTION' && '🔍 성찰'}
                    </p>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 입력 영역 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="질문을 입력하세요..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            AI가 학습을 도와드립니다. 단순 답변보다는 스스로 생각할 수 있도록 안내해드려요.
          </p>
        </div>
      </div>
    </div>
  );
}