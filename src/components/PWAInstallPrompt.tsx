'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Download, Smartphone, Monitor, Zap, Wifi, Bell } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installSource, setInstallSource] = useState<'browser' | 'ios' | null>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }

      // Check if running in PWA mode (iOS)
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent
      e.preventDefault()
      setDeferredPrompt(event)
      setInstallSource('browser')
      
      // Show prompt after a delay if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone

    if (isIOS && !isInStandaloneMode) {
      setInstallSource('ios')
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
        setIsInstalled(true)
        // Track installation analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'pwa_install', {
            method: 'prompt'
          })
        }
      } else {
        console.log('PWA installation dismissed')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error during PWA installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-prompt-dismissed', 'true')
    }
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || 
      (typeof window !== 'undefined' && sessionStorage.getItem('pwa-prompt-dismissed')) || 
      !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  앱으로 설치하기
                </CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  더 빠르고 편리하게
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-sm">
            디지털 교과서를 앱으로 설치하여 더욱 편리하게 사용하세요
          </CardDescription>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-3 w-3 text-green-500" />
              빠른 실행
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wifi className="h-3 w-3 text-blue-500" />
              오프라인 지원
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="h-3 w-3 text-purple-500" />
              알림 받기
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Monitor className="h-3 w-3 text-orange-500" />
              전체화면
            </div>
          </div>

          {/* Install buttons */}
          <div className="flex gap-2">
            {installSource === 'browser' && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                지금 설치
              </Button>
            )}
            
            {installSource === 'ios' && (
              <div className="flex-1 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    // Show iOS install instructions
                    alert(`iOS에서 설치하기:\n1. Safari 하단의 공유 버튼 탭\n2. "홈 화면에 추가" 선택\n3. "추가" 탭`)
                  }}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  설치 방법 보기
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
              className="px-4"
            >
              나중에
            </Button>
          </div>

          {/* Progressive loading indicator */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-indigo-600 h-1 rounded-full transition-all duration-1000"
              style={{ width: '100%' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for checking PWA installation status
export function usePWAInstallStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }
    }

    // Check if can install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }

    checkInstalled()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => setIsInstalled(true))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return { isInstalled, canInstall }
}