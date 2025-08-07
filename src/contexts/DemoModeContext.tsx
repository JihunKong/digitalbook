'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface DemoModeContextType {
  isDemoMode: boolean
  isInDemoRoute: boolean
  enableDemoMode: () => void
  exitDemoMode: () => void
  navigateInDemo: (path: string) => void
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isInDemoRoute, setIsInDemoRoute] = useState(false)
  const router = useRouter()

  // Check demo mode from localStorage and URL on mount
  useEffect(() => {
    // Check if we're in a demo route
    const isCurrentlyInDemoRoute = window.location.pathname.startsWith('/demo')
    setIsInDemoRoute(isCurrentlyInDemoRoute)

    // Check demo mode from various sources
    const urlParams = new URLSearchParams(window.location.search)
    const urlDemo = urlParams.get('demo') === 'true'
    const storageDemo = localStorage.getItem('demoMode') === 'true'
    const envDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    
    const shouldBeDemoMode = urlDemo || storageDemo || envDemo || isCurrentlyInDemoRoute
    
    if (shouldBeDemoMode) {
      setIsDemoMode(true)
      localStorage.setItem('demoMode', 'true')
    } else {
      setIsDemoMode(false)
      localStorage.removeItem('demoMode')
    }
  }, [])

  // Listen for route changes to update demo route status
  useEffect(() => {
    const handleRouteChange = () => {
      const isCurrentlyInDemoRoute = window.location.pathname.startsWith('/demo')
      setIsInDemoRoute(isCurrentlyInDemoRoute)
    }

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const enableDemoMode = () => {
    setIsDemoMode(true)
    localStorage.setItem('demoMode', 'true')
    
    // Redirect to demo landing page
    router.push('/demo')
  }

  const exitDemoMode = () => {
    setIsDemoMode(false)
    localStorage.removeItem('demoMode')
    
    // Always redirect to main landing page when exiting demo
    router.push('/')
  }

  const navigateInDemo = (path: string) => {
    if (isDemoMode) {
      // Ensure path starts with /demo if we're in demo mode and not already prefixed
      const demoPath = path.startsWith('/demo') ? path : `/demo${path}`
      router.push(demoPath)
    } else {
      router.push(path)
    }
  }

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        isInDemoRoute,
        enableDemoMode,
        exitDemoMode,
        navigateInDemo,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

// Utility function for checking demo mode without hook
export function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') {
    return process.env.DEMO_MODE === 'true'
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  const urlDemo = urlParams.get('demo') === 'true'
  const storageDemo = localStorage.getItem('demoMode') === 'true'
  const isInDemoRoute = window.location.pathname.startsWith('/demo')
  
  return urlDemo || storageDemo || isInDemoRoute || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}