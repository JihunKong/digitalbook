'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'

export interface Activity {
  id: string
  userId: string
  userType: 'student' | 'teacher'
  type: 'page_view' | 'assignment_submit' | 'login' | 'logout' | 'chat_message' | 'textbook_open' | 'bookmark_add'
  resourceId?: string
  resourceType?: 'textbook' | 'assignment' | 'page'
  metadata?: Record<string, any>
  timestamp: string
}

export interface ActivityTrackerOptions {
  enableTracking?: boolean
  batchSize?: number
  flushInterval?: number
}

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const {
    enableTracking = true,
    batchSize = 10,
    flushInterval = 30000 // 30 seconds
  } = options

  const [isOnline, setIsOnline] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const batchRef = useRef<Activity[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Track page visibility and online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Flush activities to server
  const flushActivities = async () => {
    if (batchRef.current.length === 0 || !isOnline) return

    try {
      const batch = [...batchRef.current]
      batchRef.current = []

      await apiClient.trackActivities(batch)
      
      // Remove sent activities from local state
      setActivities(prev => prev.filter(activity => 
        !batch.some(sent => sent.id === activity.id)
      ))
    } catch (error) {
      console.error('Failed to flush activities:', error)
      // Put activities back in batch for retry
      batchRef.current = [...batchRef.current, ...batchRef.current]
    }
  }

  // Set up periodic flush
  useEffect(() => {
    if (!enableTracking) return

    timerRef.current = setInterval(flushActivities, flushInterval)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [enableTracking, flushInterval, isOnline])

  // Flush on batch size reached
  useEffect(() => {
    if (batchRef.current.length >= batchSize) {
      flushActivities()
    }
  }, [activities, batchSize])

  // Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (batchRef.current.length > 0) {
        // Use sendBeacon for reliable sending on page unload
        const data = JSON.stringify({ activities: batchRef.current })
        navigator.sendBeacon('/api/activities/track', data)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const trackActivity = (
    type: Activity['type'],
    resourceId?: string,
    resourceType?: string,
    metadata?: Record<string, any>
  ) => {
    if (!enableTracking) return

    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: '', // Will be filled by API
      userType: 'student', // Will be determined by API
      type,
      resourceId,
      resourceType: resourceType as 'page' | 'assignment' | 'textbook' | undefined,
      metadata,
      timestamp: new Date().toISOString()
    }

    setActivities(prev => [...prev, activity])
    batchRef.current.push(activity)
  }

  return {
    trackActivity,
    activities,
    isOnline,
    flushActivities
  }
}

// Specific tracking functions
export function usePageViewTracker(pageId: string, pageType: string = 'textbook') {
  const { trackActivity } = useActivityTracker()
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    // Track page open
    trackActivity('page_view', pageId, pageType, { 
      action: 'open',
      startTime: startTimeRef.current
    })

    return () => {
      // Track page close with duration
      const duration = Date.now() - startTimeRef.current
      trackActivity('page_view', pageId, pageType, {
        action: 'close',
        duration,
        endTime: Date.now()
      })
    }
  }, [pageId, pageType, trackActivity])

  const trackTimeSpent = (additionalMetadata?: Record<string, any>) => {
    const currentTime = Date.now()
    const duration = currentTime - startTimeRef.current
    
    trackActivity('page_view', pageId, pageType, {
      action: 'time_update',
      duration,
      currentTime,
      ...additionalMetadata
    })
  }

  return { trackTimeSpent }
}

export function useAssignmentTracker() {
  const { trackActivity } = useActivityTracker()

  const trackAssignmentStart = (assignmentId: string) => {
    trackActivity('assignment_submit', assignmentId, 'assignment', {
      action: 'start',
      startTime: Date.now()
    })
  }

  const trackAssignmentSave = (assignmentId: string, isDraft: boolean = true) => {
    trackActivity('assignment_submit', assignmentId, 'assignment', {
      action: isDraft ? 'save_draft' : 'submit',
      timestamp: Date.now()
    })
  }

  const trackAssignmentSubmit = (assignmentId: string, score?: number) => {
    trackActivity('assignment_submit', assignmentId, 'assignment', {
      action: 'final_submit',
      score,
      timestamp: Date.now()
    })
  }

  return {
    trackAssignmentStart,
    trackAssignmentSave,
    trackAssignmentSubmit
  }
}

export function useTextbookTracker() {
  const { trackActivity } = useActivityTracker()

  const trackTextbookOpen = (textbookId: string) => {
    trackActivity('textbook_open', textbookId, 'textbook', {
      action: 'open',
      timestamp: Date.now()
    })
  }

  const trackBookmark = (textbookId: string, pageNumber: number, action: 'add' | 'remove') => {
    trackActivity('bookmark_add', textbookId, 'textbook', {
      action,
      pageNumber,
      timestamp: Date.now()
    })
  }

  const trackPageTurn = (textbookId: string, fromPage: number, toPage: number) => {
    trackActivity('page_view', textbookId, 'textbook', {
      action: 'page_turn',
      fromPage,
      toPage,
      timestamp: Date.now()
    })
  }

  return {
    trackTextbookOpen,
    trackBookmark,
    trackPageTurn
  }
}