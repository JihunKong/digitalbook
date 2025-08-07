import { useState, useCallback, useEffect } from 'react';
import { chatAPI } from '@/lib/api/chat';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatOptions {
  pageContent: string;
  pageNumber: number;
  textbookTitle: string;
  onError?: (error: Error) => void;
}

export function useChat({ pageContent, pageNumber, textbookTitle, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  
  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: `안녕하세요! 저는 AI 튜터입니다. 📚 

현재 "${textbookTitle}"의 ${pageNumber}페이지를 학습 중이시네요. 이 페이지에 대해 궁금한 점이 있으시면 편하게 질문해주세요!

도움이 필요한 내용:
• 어려운 개념 설명
• 추가 예시
• 연습 문제 풀이
• 관련 지식 확장`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Add context message when page changes
  useEffect(() => {
    if (messages.length > 1) {
      const contextMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `${pageNumber}페이지로 이동하셨네요! 이 페이지의 내용에 대해 궁금한 점이 있으시면 알려주세요. 😊`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, contextMessage]);
    }
  }, [pageNumber]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get token from session storage or auth context
      const token = sessionStorage.getItem('authToken') || '';
      
      const response = await chatAPI.sendMessage(
        content,
        sessionId,
        pageContent,
        pageNumber,
        textbookTitle,
        token
      );

      const assistantMessage: Message = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: new Date(response.assistantMessage.createdAt),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, pageContent, pageNumber, textbookTitle, isLoading, onError]);

  const getSuggestions = useCallback(async (currentTopic: string) => {
    try {
      const token = sessionStorage.getItem('authToken') || '';
      const suggestions = await chatAPI.getSuggestions(pageContent, currentTopic, token);
      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, [pageContent]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    getSuggestions,
    clearMessages,
  };
}