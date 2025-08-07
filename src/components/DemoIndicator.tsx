'use client'

import { useDemoMode } from '@/contexts/DemoModeContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, X, ArrowRight } from 'lucide-react'

interface DemoIndicatorProps {
  variant?: 'floating' | 'banner' | 'badge'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showExitButton?: boolean
  className?: string
}

export function DemoIndicator({
  variant = 'badge',
  position = 'top-right',
  showExitButton = false,
  className = ''
}: DemoIndicatorProps) {
  const { isDemoMode, exitDemoMode } = useDemoMode()

  if (!isDemoMode) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4', 
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">데모 모드</span>
          {showExitButton && (
            <button
              onClick={exitDemoMode}
              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              현재 데모 모드입니다 - 모든 데이터는 샘플이며 주기적으로 초기화됩니다
            </span>
          </div>
          {showExitButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={exitDemoMode}
              className="text-white hover:bg-white/20 text-xs"
            >
              데모 종료
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Default badge variant
  return (
    <Badge 
      className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 ${className}`}
      variant="secondary"
    >
      <Zap className="w-3 h-3 mr-1" />
      데모 모드
      {showExitButton && (
        <button
          onClick={exitDemoMode}
          className="ml-2 hover:bg-white/20 rounded-full p-0.5"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </Badge>
  )
}

// Demo mode watermark for content areas
export function DemoWatermark({ className = '' }: { className?: string }) {
  const { isDemoMode } = useDemoMode()

  if (!isDemoMode) return null

  return (
    <div className={`absolute top-4 right-4 opacity-20 pointer-events-none ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded text-xs font-medium rotate-12">
        DEMO
      </div>
    </div>
  )
}

// Demo mode redirect helper
export function DemoRedirectButton({
  to,
  children,
  className = ''
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  const { navigateInDemo } = useDemoMode()

  return (
    <Button
      onClick={() => navigateInDemo(to)}
      className={className}
    >
      {children}
      <ArrowRight className="w-4 h-4 ml-1" />
    </Button>
  )
}