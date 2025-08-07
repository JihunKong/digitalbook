'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (selector: string | HTMLElement) => void
  skipToContent: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  screenReader: false,
  keyboardNavigation: true,
  focusIndicators: true,
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error)
      }
    }

    // Detect system preferences
    detectSystemPreferences()
    
    // Create screen reader announcer
    createScreenReaderAnnouncer()
    
    // Setup keyboard navigation
    setupKeyboardNavigation()
    
    // Setup focus management
    setupFocusManagement()
  }, [])

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
    
    // Apply settings to document
    applySettingsToDocument()
  }, [settings])

  const detectSystemPreferences = () => {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }))
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }))
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }))
    })

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }))
    })
  }

  const createScreenReaderAnnouncer = () => {
    const announcer = document.createElement('div')
    announcer.id = 'screen-reader-announcer'
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    
    document.body.appendChild(announcer)
    setAnnouncer(announcer)
  }

  const setupKeyboardNavigation = () => {
    // Skip links
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = '본문으로 바로가기'
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 1000;
      text-decoration: none;
      border-radius: 4px;
      transition: top 0.3s;
    `
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })
    
    document.body.insertBefore(skipLink, document.body.firstChild)

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts)
    
    // Tab trap for modals
    document.addEventListener('keydown', handleTabTrap)
  }

  const setupFocusManagement = () => {
    // Focus restoration for SPA navigation
    let lastFocusedElement: HTMLElement | null = null
    
    const handleRouteChange = () => {
      lastFocusedElement = document.activeElement as HTMLElement
      
      // Focus the main heading after route change
      setTimeout(() => {
        const mainHeading = document.querySelector('h1')
        if (mainHeading) {
          ;(mainHeading as HTMLElement).focus({ preventScroll: true })
          announceToScreenReader(`페이지가 로드되었습니다: ${document.title}`)
        }
      }, 100)
    }

    // Listen for route changes (Next.js specific)
    window.addEventListener('popstate', handleRouteChange)
    
    // Focus visible elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          if (element.hasAttribute('data-auto-focus')) {
            element.focus({ preventScroll: true })
          }
        }
      })
    })

    // Observe elements with auto-focus
    document.querySelectorAll('[data-auto-focus]').forEach((el) => {
      observer.observe(el)
    })
  }

  const handleKeyboardShortcuts = (event: KeyboardEvent) => {
    // Alt + 1: Skip to main content
    if (event.altKey && event.key === '1') {
      event.preventDefault()
      skipToContent()
    }
    
    // Alt + 2: Skip to navigation
    if (event.altKey && event.key === '2') {
      event.preventDefault()
      const nav = document.querySelector('nav')
      if (nav) {
        ;(nav as HTMLElement).focus()
      }
    }
    
    // Alt + H: Go to homepage
    if (event.altKey && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      window.location.href = '/'
    }
    
    // Escape: Close modals/overlays
    if (event.key === 'Escape') {
      const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]')
      if (openModal) {
        const closeButton = openModal.querySelector('[data-close-modal]')
        if (closeButton) {
          ;(closeButton as HTMLElement).click()
        }
      }
    }
  }

  const handleTabTrap = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const modal = document.querySelector('[role="dialog"][aria-hidden="false"]')
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }

  const applySettingsToDocument = () => {
    const root = document.documentElement
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast)
    
    // Reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion)
    
    // Font size
    root.setAttribute('data-font-size', settings.fontSize)
    
    // Focus indicators
    root.classList.toggle('show-focus-indicators', settings.focusIndicators)
    
    // Apply CSS custom properties
    root.style.setProperty('--accessibility-font-scale', getFontScale(settings.fontSize))
  }

  const getFontScale = (size: AccessibilitySettings['fontSize']) => {
    const scales = {
      'small': '0.875',
      'medium': '1',
      'large': '1.125',
      'extra-large': '1.25'
    }
    return scales[size]
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Announce setting change
    announceToScreenReader(`설정이 변경되었습니다: ${key}이(가) ${value}(으)로 설정되었습니다.`)
  }

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) return

    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = ''
    }, 1000)
  }

  const focusElement = (selector: string | HTMLElement) => {
    let element: HTMLElement | null = null
    
    if (typeof selector === 'string') {
      element = document.querySelector(selector)
    } else {
      element = selector
    }
    
    if (element) {
      element.focus({ preventScroll: false })
      
      // Ensure element is visible
      element.scrollIntoView({
        behavior: settings.reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      })
    }
  }

  const skipToContent = () => {
    const mainContent = document.querySelector('#main-content, main, [role="main"]')
    if (mainContent) {
      ;(mainContent as HTMLElement).focus()
      announceToScreenReader('본문 영역으로 이동했습니다.')
    }
  }

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    announceToScreenReader,
    focusElement,
    skipToContent,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Accessibility utility hooks
export function useAnnounceOnMount(message: string, priority?: 'polite' | 'assertive') {
  const { announceToScreenReader } = useAccessibility()
  
  useEffect(() => {
    announceToScreenReader(message, priority)
  }, [message, priority, announceToScreenReader])
}

export function useFocusOnMount(selector?: string) {
  const { focusElement } = useAccessibility()
  
  useEffect(() => {
    if (selector) {
      setTimeout(() => focusElement(selector), 100)
    }
  }, [selector, focusElement])
}