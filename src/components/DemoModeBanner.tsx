'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { features, DEMO_MESSAGES, setDemoMode, DEMO_RESET_INTERVAL } from '@/config/features'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [timeUntilReset, setTimeUntilReset] = useState<number | null>(null)
  
  useEffect(() => {
    // 데모 모드가 아니면 컴포넌트 렌더링하지 않음
    if (!features.DEMO_MODE) return
    
    // 로컬 스토리지에서 배너 숨김 상태 확인
    const hidden = localStorage.getItem('demoBannerHidden') === 'true'
    if (hidden) {
      setIsVisible(false)
    }
    
    // 리셋 타이머 설정
    const resetTime = localStorage.getItem('demoResetTime')
    if (resetTime) {
      const timeLeft = parseInt(resetTime) - Date.now()
      if (timeLeft > 0) {
        setTimeUntilReset(timeLeft)
      } else {
        // 리셋 시간이 지났으면 새로운 리셋 시간 설정
        const newResetTime = Date.now() + DEMO_RESET_INTERVAL
        localStorage.setItem('demoResetTime', newResetTime.toString())
        setTimeUntilReset(DEMO_RESET_INTERVAL)
      }
    } else {
      // 최초 리셋 시간 설정
      const newResetTime = Date.now() + DEMO_RESET_INTERVAL
      localStorage.setItem('demoResetTime', newResetTime.toString())
      setTimeUntilReset(DEMO_RESET_INTERVAL)
    }
  }, [])
  
  useEffect(() => {
    if (!features.DEMO_MODE || timeUntilReset === null) return
    
    // 매초마다 남은 시간 업데이트
    const interval = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev === null || prev <= 1000) {
          // 리셋 시간 도달
          handleDemoReset()
          return DEMO_RESET_INTERVAL
        }
        return prev - 1000
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [timeUntilReset])
  
  if (!features.DEMO_MODE || !isVisible) {
    return null
  }
  
  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('demoBannerHidden', 'true')
  }
  
  const handleExitDemo = () => {
    if (confirm('데모 모드를 종료하시겠습니까?')) {
      setDemoMode(false)
    }
  }
  
  const handleDemoReset = async () => {
    try {
      // 백엔드 API 호출하여 데모 데이터 리셋
      const response = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // 새로운 리셋 시간 설정
        const newResetTime = Date.now() + DEMO_RESET_INTERVAL
        localStorage.setItem('demoResetTime', newResetTime.toString())
        
        // 페이지 새로고침
        window.location.reload()
      }
    } catch (error) {
      console.error('Demo reset failed:', error)
    }
  }
  
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}분 ${seconds}초`
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{DEMO_MESSAGES.banner}</p>
              {timeUntilReset && (
                <p className="text-sm opacity-90 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  다음 리셋까지: {formatTime(timeUntilReset)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDemoReset}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              지금 리셋
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitDemo}
              className="text-white hover:bg-white/20"
            >
              데모 종료
            </Button>
            
            <button
              onClick={handleClose}
              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="배너 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 프로그레스 바 */}
      {timeUntilReset && (
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white/60 transition-all duration-1000"
            style={{
              width: `${((DEMO_RESET_INTERVAL - timeUntilReset) / DEMO_RESET_INTERVAL) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  )
}

// 데모 모드 플로팅 버튼 (데모 모드가 아닐 때 표시)
export function DemoModeToggle() {
  const [isHovered, setIsHovered] = useState(false)
  
  if (features.DEMO_MODE) {
    return null
  }
  
  const handleEnableDemo = () => {
    if (confirm('데모 모드를 활성화하시겠습니까? 샘플 데이터가 로드됩니다.')) {
      setDemoMode(true)
    }
  }
  
  return (
    <button
      onClick={handleEnableDemo}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-4 left-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="데모 모드 활성화"
    >
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5" />
        {isHovered && (
          <span className="ml-2 whitespace-nowrap animate-in slide-in-from-left-2">
            데모 체험하기
          </span>
        )}
      </div>
    </button>
  )
}