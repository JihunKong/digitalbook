import { useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface ErrorOptions {
  title?: string
  fallbackMessage?: string
  showToast?: boolean
  logToConsole?: boolean
  reportToBackend?: boolean
}

interface APIError {
  message: string
  statusCode?: number
  code?: string
}

export function useErrorHandler() {
  const handleError = useCallback(async (
    error: Error | APIError | unknown,
    options: ErrorOptions = {}
  ) => {
    const {
      title = '오류가 발생했습니다',
      fallbackMessage = '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      showToast = true,
      logToConsole = true,
      reportToBackend = true,
    } = options

    let errorMessage: string
    let statusCode: number | undefined
    let errorCode: string | undefined

    // 에러 타입 파싱
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      const apiError = error as APIError
      errorMessage = apiError.message
      statusCode = apiError.statusCode
      errorCode = apiError.code
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      errorMessage = fallbackMessage
    }

    // 사용자 친화적인 메시지로 변환
    const userMessage = getUserFriendlyMessage(errorMessage, statusCode)

    // 콘솔에 로깅
    if (logToConsole) {
      console.error('Error caught:', {
        originalError: error,
        message: errorMessage,
        statusCode,
        errorCode,
        timestamp: new Date().toISOString(),
      })
    }

    // 토스트 알림 표시
    if (showToast) {
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                            errorMessage.toLowerCase().includes('fetch')
      const isFallbackData = errorMessage.toLowerCase().includes('fallback') ||
                             errorMessage.toLowerCase().includes('mock')

      if (isFallbackData) {
        // AI 폴백 데이터 사용 시 경고
        toast({
          title: '제한된 기능',
          description: 'AI 서비스를 사용할 수 없어 샘플 데이터를 표시합니다.',
          variant: 'warning',
          duration: 5000,
        })
      } else if (isNetworkError) {
        // 네트워크 에러
        toast({
          title: '연결 오류',
          description: '인터넷 연결을 확인해주세요.',
          variant: 'destructive',
          duration: 5000,
        })
      } else {
        // 일반 에러
        toast({
          title,
          description: userMessage,
          variant: 'destructive',
          duration: 5000,
        })
      }
    }

    // 백엔드에 에러 리포트
    if (reportToBackend && typeof window !== 'undefined') {
      try {
        await fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: errorMessage,
            statusCode,
            errorCode,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (reportError) {
        console.error('Failed to report error:', reportError)
      }
    }

    return {
      message: userMessage,
      originalError: error,
      statusCode,
      errorCode,
    }
  }, [])

  return { handleError }
}

// 사용자 친화적인 에러 메시지 매핑
function getUserFriendlyMessage(errorMessage: string, statusCode?: number): string {
  // HTTP 상태 코드별 메시지
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return '잘못된 요청입니다. 입력 내용을 확인해주세요.'
      case 401:
        return '로그인이 필요합니다. 다시 로그인해주세요.'
      case 403:
        return '접근 권한이 없습니다.'
      case 404:
        return '요청한 정보를 찾을 수 없습니다.'
      case 408:
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      case 429:
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 502:
      case 503:
        return '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
      case 504:
        return '서버 응답 시간이 초과되었습니다.'
    }
  }

  // 특정 에러 메시지 패턴 매칭
  const lowerMessage = errorMessage.toLowerCase()

  if (lowerMessage.includes('network')) {
    return '네트워크 연결을 확인해주세요.'
  }
  if (lowerMessage.includes('timeout')) {
    return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
  }
  if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
    return '권한이 없습니다. 관리자에게 문의해주세요.'
  }
  if (lowerMessage.includes('not found')) {
    return '요청한 정보를 찾을 수 없습니다.'
  }
  if (lowerMessage.includes('invalid') || lowerMessage.includes('validation')) {
    return '입력한 정보가 올바르지 않습니다. 다시 확인해주세요.'
  }
  if (lowerMessage.includes('expired')) {
    return '세션이 만료되었습니다. 다시 로그인해주세요.'
  }
  if (lowerMessage.includes('duplicate')) {
    return '이미 존재하는 정보입니다.'
  }
  if (lowerMessage.includes('limit') || lowerMessage.includes('quota')) {
    return '사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }

  // AI 관련 에러
  if (lowerMessage.includes('claude') || lowerMessage.includes('openai')) {
    return 'AI 서비스를 일시적으로 사용할 수 없습니다.'
  }
  if (lowerMessage.includes('api key')) {
    return 'AI 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.'
  }

  // 기본 메시지
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}