'use client'

import { useEffect, ReactNode } from 'react'
import { DemoModeBanner } from '@/components/DemoModeBanner'
import { useDemoMode } from '@/contexts/DemoModeContext'

interface DemoLayoutProps {
  children: ReactNode
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const { enableDemoMode, isDemoMode } = useDemoMode()

  // Automatically enable demo mode when accessing demo routes
  useEffect(() => {
    if (!isDemoMode) {
      enableDemoMode()
    }
  }, [isDemoMode, enableDemoMode])

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {isDemoMode && <DemoModeBanner />}
      
      {/* Demo Content with Top Margin for Banner */}
      <div className={isDemoMode ? 'pt-20' : ''}>
        {children}
      </div>
    </div>
  )
}