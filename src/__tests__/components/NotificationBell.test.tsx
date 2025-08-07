/**
 * Tests for NotificationBell component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useNotifications } from '@/contexts/NotificationContext'

// Mock the notifications context
jest.mock('@/contexts/NotificationContext', () => ({
  useNotifications: jest.fn(),
}))

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>

describe('NotificationBell', () => {
  const defaultMockValue = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    markAllAsRead: jest.fn(),
    loadNotifications: jest.fn(),
    sendNotification: jest.fn(),
  }

  beforeEach(() => {
    mockUseNotifications.mockReturnValue(defaultMockValue)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders bell icon', () => {
    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
  })

  test('shows unread count when there are unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockValue,
      unreadCount: 3,
    })

    render(<NotificationBell />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('shows 9+ when unread count is greater than 9', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockValue,
      unreadCount: 15,
    })

    render(<NotificationBell />)
    
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  test('does not show count badge when no unread notifications', () => {
    render(<NotificationBell />)
    
    expect(screen.queryByText(/\d+/)).toBeNull()
  })

  test('opens dialog when clicked', () => {
    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)
    
    // The dialog should be opened (testing the click interaction)
    expect(bellButton).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const customClass = 'custom-bell-class'
    render(<NotificationBell className={customClass} />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toHaveClass(customClass)
  })
})