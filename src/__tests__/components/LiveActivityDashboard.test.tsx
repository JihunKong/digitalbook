/**
 * Tests for LiveActivityDashboard component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LiveActivityDashboard } from '@/components/teacher/LiveActivityDashboard'
import { apiClient } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getRecentActivities: jest.fn(),
    getLiveActivities: jest.fn(),
  },
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('LiveActivityDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render loading state initially', () => {
    mockApiClient.getRecentActivities.mockReturnValue(new Promise(() => {}))
    mockApiClient.getLiveActivities.mockReturnValue(new Promise(() => {}))

    render(<LiveActivityDashboard />)
    
    expect(screen.getByText('현재 접속자')).toBeInTheDocument()
    expect(screen.getByText('총 활동')).toBeInTheDocument()
  })

  test('should display activity statistics', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'textbook_read',
        userId: '1',
        userName: '김철수',
        resourceName: '국어 교과서',
        timestamp: new Date().toISOString(),
        metadata: { page: 5 }
      },
      {
        id: '2',
        type: 'assignment_submit',
        userId: '2',
        userName: '이영희',
        resourceName: '글쓰기 과제',
        timestamp: new Date().toISOString(),
      }
    ]

    const mockLiveData = {
      currentUsers: 15
    }

    mockApiClient.getRecentActivities.mockResolvedValue({ data: mockActivities })
    mockApiClient.getLiveActivities.mockResolvedValue({ data: mockLiveData })

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument() // current users
      expect(screen.getByText('2')).toBeInTheDocument() // total activities
    })
  })

  test('should display recent activities', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'textbook_open',
        userId: '1',
        userName: '김철수',
        resourceName: '국어 교과서',
        timestamp: new Date().toISOString(),
        metadata: { page: 5 }
      }
    ]

    mockApiClient.getRecentActivities.mockResolvedValue({ data: mockActivities })
    mockApiClient.getLiveActivities.mockResolvedValue({ data: null })

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument()
      expect(screen.getByText(/국어 교과서.*교재를 열었습니다/)).toBeInTheDocument()
    })
  })

  test('should handle API errors gracefully', async () => {
    mockApiClient.getRecentActivities.mockRejectedValue(new Error('API Error'))
    mockApiClient.getLiveActivities.mockRejectedValue(new Error('API Error'))

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      // Should not crash and should show some default content
      expect(screen.getByText('현재 접속자')).toBeInTheDocument()
    })
  })

  test('should format activity timestamps correctly', async () => {
    const recentTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    const mockActivities = [
      {
        id: '1',
        type: 'textbook_open',
        userId: '1',
        userName: '김철수',
        resourceName: '국어 교과서',
        timestamp: recentTime.toISOString(),
        metadata: { page: 5 }
      }
    ]

    mockApiClient.getRecentActivities.mockResolvedValue({ data: mockActivities })
    mockApiClient.getLiveActivities.mockResolvedValue({ data: null })

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/분 전/)).toBeInTheDocument()
    })
  })

  test('should categorize different activity types', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'textbook_open',
        userId: '1',
        userName: '김철수',
        resourceName: '국어 교과서',
        timestamp: new Date().toISOString(),
        metadata: { page: 5 }
      },
      {
        id: '2',
        type: 'assignment_submit',
        userId: '2',
        userName: '이영희',
        resourceName: '글쓰기 과제',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'login',
        userId: '3',
        userName: '박준호',
        resourceName: '',
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ]

    mockApiClient.getRecentActivities.mockResolvedValue({ data: mockActivities })
    mockApiClient.getLiveActivities.mockResolvedValue({ data: null })

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument()
      expect(screen.getByText('이영희')).toBeInTheDocument()
      expect(screen.getByText('박준호')).toBeInTheDocument()
    })
  })

  test('should show mock data when no activities from API', async () => {
    mockApiClient.getRecentActivities.mockResolvedValue({ data: [] })
    mockApiClient.getLiveActivities.mockResolvedValue({ data: null })

    render(<LiveActivityDashboard />)

    await waitFor(() => {
      // When no activities from API, the component falls back to mock data
      expect(screen.getByText('총 활동')).toBeInTheDocument()
      expect(screen.getAllByText('3')).toHaveLength(2) // Shows mock values for current users and total activities
      expect(screen.getByText('김민수')).toBeInTheDocument() // Shows mock activity
    })
  })
})