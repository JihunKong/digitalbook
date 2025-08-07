/**
 * Tests for useChat hook
 */

import { renderHook, act } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'
import { chatAPI } from '@/lib/api/chat'

// Mock the chat API
jest.mock('@/lib/api/chat', () => ({
  chatAPI: {
    sendMessage: jest.fn(),
  },
}))

const mockChatAPI = chatAPI as jest.Mocked<typeof chatAPI>

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with welcome message', () => {
    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }
    
    const { result } = renderHook(() => useChat(mockOptions))
    
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].role).toBe('assistant')
    expect(result.current.messages[0].content).toContain('안녕하세요!')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.sessionId).toBeDefined()
  })

  test('should send message and update state', async () => {
    const mockResponse = {
      assistantMessage: {
        id: '1',
        content: 'AI response',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      }
    }
    
    mockChatAPI.sendMessage.mockResolvedValue(mockResponse)

    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }

    const { result } = renderHook(() => useChat(mockOptions))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.messages).toHaveLength(3) // Welcome message + User message + AI response
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String),
      role: 'user',
      content: 'Hello',
      timestamp: expect.any(Date),
    })
    expect(result.current.messages[2]).toEqual({
      id: '1',
      role: 'assistant',
      content: 'AI response',
      timestamp: expect.any(Date),
    })
  })

  test('should handle API errors gracefully', async () => {
    mockChatAPI.sendMessage.mockRejectedValue(new Error('API Error'))

    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }

    const { result } = renderHook(() => useChat(mockOptions))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    // Should have welcome message, user message, and error message
    expect(result.current.messages).toHaveLength(3)
    expect(result.current.messages[0].role).toBe('assistant') // welcome message
    expect(result.current.messages[1].role).toBe('user')
    expect(result.current.messages[2].role).toBe('assistant') // error message
  })

  test('should set loading state during API call', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockChatAPI.sendMessage.mockReturnValue(promise)

    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }

    const { result } = renderHook(() => useChat(mockOptions))

    act(() => {
      result.current.sendMessage('Hello')
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolvePromise!({ assistantMessage: { id: '1', content: 'Response', role: 'assistant', createdAt: new Date().toISOString() } })
      await promise
    })

    expect(result.current.isLoading).toBe(false)
  })

  test('should clear messages', () => {
    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }

    const { result } = renderHook(() => useChat(mockOptions))

    // Should start with welcome message
    expect(result.current.messages).toHaveLength(1)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toHaveLength(0)
  })

  test('should handle empty message', async () => {
    const mockOptions = {
      pageContent: 'Test page content',
      pageNumber: 1,
      textbookTitle: 'Test Textbook'
    }

    const { result } = renderHook(() => useChat(mockOptions))

    await act(async () => {
      await result.current.sendMessage('')
    })

    expect(result.current.messages).toHaveLength(1) // Only welcome message
    expect(mockChatAPI.sendMessage).not.toHaveBeenCalled()
  })

  test('should include context in messages', async () => {
    const mockResponse = {
      assistantMessage: {
        id: '1',
        content: 'AI response',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      }
    }
    
    mockChatAPI.sendMessage.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat({
      textbookTitle: 'Test Textbook',
      pageNumber: 1,
      pageContent: 'Test page content'
    }))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(mockChatAPI.sendMessage).toHaveBeenCalledWith(
      'Hello',
      expect.any(String), // sessionId
      'Test page content', // pageContent
      1, // pageNumber
      'Test Textbook', // textbookTitle
      '' // token
    )
  })
})