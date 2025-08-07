'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AccessibilityProvider } from './AccessibilityProvider'
import { AuthProvider } from '@/hooks/useAuth'
import { DemoModeProvider } from '@/contexts/DemoModeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 2 times for mutations
              return failureCount < 2;
            },
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DemoModeProvider>
          <AuthProvider>
            <AccessibilityProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AccessibilityProvider>
          </AuthProvider>
        </DemoModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}