import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  textbookId: string;
  startedAt: Date;
}

export const chatAPI = {
  // Send message to AI tutor
  sendMessage: async (
    message: string,
    sessionId: string,
    pageContent: string,
    pageNumber: number,
    textbookTitle: string,
    token: string
  ) => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/message`,
      {
        message,
        sessionId,
        pageContent,
        pageNumber,
        textbookTitle,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Get chat history
  getChatHistory: async (sessionId: string, token: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/chat/history/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Get suggested questions
  getSuggestions: async (
    pageContent: string,
    currentTopic: string,
    token: string
  ) => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/suggestions`,
      {
        pageContent,
        currentTopic,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.suggestions;
  },
};