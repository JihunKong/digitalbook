'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity,
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare,
  Clock,
  Eye,
  TrendingUp,
  Zap,
  RefreshCw,
  Filter,
  Wifi,
  WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useOnlineUsers, useSocket } from '@/hooks/useSocket'

interface LiveActivity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: 'page_view' | 'assignment_submit' | 'login' | 'logout' | 'chat_message' | 'textbook_open' | 'bookmark_add'
  resourceId?: string
  resourceName?: string
  resourceType?: 'textbook' | 'assignment' | 'page'
  metadata?: Record<string, any>
  timestamp: string
}

interface LiveStats {
  currentUsers: number
  totalActivities: number
  popularResources: Array<{
    id: string
    name: string
    type: string
    activityCount: number
  }>
  recentLogins: number
}

export function LiveActivityDashboard() {
  const [activities, setActivities] = useState<LiveActivity[]>([])
  const [stats, setStats] = useState<LiveStats>({
    currentUsers: 0,
    totalActivities: 0,
    popularResources: [],
    recentLogins: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  
  const { onlineUsers } = useOnlineUsers()
  const { on, off, isConnected } = useSocket()

  // Load live activities
  const loadLiveActivities = async () => {
    try {
      // Try to fetch real activities from API
      const [activitiesResponse, liveActivitiesResponse] = await Promise.all([
        apiClient.getRecentActivities(50),
        apiClient.getLiveActivities().catch(() => ({ data: null }))
      ])

      if (Array.isArray(activitiesResponse?.data) && activitiesResponse.data.length > 0) {
        // Transform backend activities to match our frontend structure
        const transformedActivities: LiveActivity[] = (activitiesResponse.data || []).map((activity: any) => ({
          id: activity.id,
          userId: activity.userId,
          userName: activity.userName || activity.user?.name || 'Unknown User',
          userAvatar: activity.userAvatar || activity.user?.avatar,
          type: activity.type || 'page_view',
          resourceId: activity.resourceId,
          resourceName: activity.resourceName || activity.resource?.title || 'Unknown Resource',
          resourceType: activity.resourceType,
          metadata: activity.metadata || {},
          timestamp: activity.timestamp || activity.createdAt || new Date().toISOString()
        }))

        setActivities(transformedActivities)

        // Calculate stats from activities
        const uniqueUsers = new Set(transformedActivities.map(a => a.userId))
        const responseData = liveActivitiesResponse?.data as { currentUsers?: number }
        const currentUsers = responseData?.currentUsers || uniqueUsers.size
        const recentLogins = transformedActivities.filter(a => a.type === 'login').length
        
        // Group activities by resource to find popular ones
        const resourceCounts = transformedActivities.reduce((acc, activity) => {
          if (activity.resourceId && activity.resourceName) {
            const key = `${activity.resourceId}-${activity.resourceType}`
            if (!acc[key]) {
              acc[key] = {
                id: activity.resourceId,
                name: activity.resourceName,
                type: activity.resourceType || 'unknown',
                activityCount: 0
              }
            }
            acc[key].activityCount++
          }
          return acc
        }, {} as Record<string, any>)

        const popularResources = Object.values(resourceCounts)
          .sort((a, b) => b.activityCount - a.activityCount)
          .slice(0, 5)

        setStats({
          currentUsers,
          totalActivities: transformedActivities.length,
          popularResources,
          recentLogins
        })
      } else {
        // Fallback to mock data
        const mockActivities: LiveActivity[] = [
          {
            id: '1',
            userId: '1',
            userName: '김민수',
            type: 'textbook_open',
            resourceId: '1',
            resourceName: '현대문학의 이해',
            resourceType: 'textbook',
            timestamp: new Date(Date.now() - 2 * 60000).toISOString()
          },
          {
            id: '2',
            userId: '2',
            userName: '이서연',
            type: 'assignment_submit',
            resourceId: '2',
            resourceName: '글쓰기 과제',
            resourceType: 'assignment',
            metadata: { action: 'submit' },
            timestamp: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            id: '3',
            userId: '3',
            userName: '박준호',
            type: 'page_view',
            resourceId: '1',
            resourceName: '3장 현대소설',
            resourceType: 'page',
            metadata: { pageNumber: 3, duration: 120000 },
            timestamp: new Date(Date.now() - 1 * 60000).toISOString()
          }
        ]

        const mockStats: LiveStats = {
          currentUsers: 3,
          totalActivities: 3,
          popularResources: [
            { id: '1', name: '현대문학의 이해', type: 'textbook', activityCount: 2 },
            { id: '2', name: '글쓰기 과제', type: 'assignment', activityCount: 1 }
          ],
          recentLogins: 1
        }

        setActivities(mockActivities)
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to load live activities:', error)
      toast.error('실시간 활동을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle real-time activity updates via WebSocket
  useEffect(() => {
    if (!isConnected) return

    const handleStudentActivity = (data: any) => {
      const newActivity: LiveActivity = {
        id: `rt-${Date.now()}`,
        userId: data.studentId,
        userName: data.studentName,
        type: data.activity.type || 'page_view',
        resourceId: data.activity.textbookId,
        resourceName: data.activity.textbookName || 'Unknown',
        resourceType: 'textbook',
        metadata: {
          pageNumber: data.activity.pageNumber,
          className: data.className
        },
        timestamp: new Date().toISOString()
      }
      
      setActivities(prev => [newActivity, ...prev].slice(0, 50)) // Keep last 50 activities
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalActivities: prev.totalActivities + 1,
        currentUsers: onlineUsers.length
      }))
    }

    const handleUserJoined = (data: any) => {
      toast.success(`${data.userName} joined the textbook`)
    }

    const handleUserLeft = (data: any) => {
      toast.info(`${data.userName} left the textbook`)
    }

    const cleanup1 = on('student:activity', handleStudentActivity)
    const cleanup2 = on('user:joined-textbook', handleUserJoined)
    const cleanup3 = on('user:left-textbook', handleUserLeft)

    return () => {
      cleanup1?.()
      cleanup2?.()
      cleanup3?.()
    }
  }, [on, off, isConnected, onlineUsers])

  // Update current users count when online users change
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      currentUsers: onlineUsers.length
    }))
  }, [onlineUsers])

  // Auto-refresh effect
  useEffect(() => {
    loadLiveActivities()

    if (autoRefresh && !isConnected) {
      const interval = setInterval(loadLiveActivities, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isConnected])

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'all') return true
    return activity.type === selectedFilter
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'textbook_open':
      case 'page_view':
        return <BookOpen className="w-4 h-4" />
      case 'assignment_submit':
        return <FileText className="w-4 h-4" />
      case 'chat_message':
        return <MessageSquare className="w-4 h-4" />
      case 'login':
        return <Users className="w-4 h-4" />
      case 'bookmark_add':
        return <Eye className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'textbook_open':
      case 'page_view':
        return 'bg-blue-100 text-blue-600'
      case 'assignment_submit':
        return 'bg-green-100 text-green-600'
      case 'chat_message':
        return 'bg-purple-100 text-purple-600'
      case 'login':
        return 'bg-yellow-100 text-yellow-600'
      case 'bookmark_add':
        return 'bg-pink-100 text-pink-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getActivityDescription = (activity: LiveActivity) => {
    switch (activity.type) {
      case 'textbook_open':
        return `"${activity.resourceName}" 교재를 열었습니다`
      case 'page_view':
        return `"${activity.resourceName}" 페이지를 ${activity.metadata?.duration ? Math.floor(activity.metadata.duration / 1000) + '초간 ' : ''}읽었습니다`
      case 'assignment_submit':
        return `"${activity.resourceName}" 과제를 ${activity.metadata?.action === 'submit' ? '제출' : '저장'}했습니다`
      case 'chat_message':
        return `AI 튜터와 대화했습니다`
      case 'login':
        return '로그인했습니다'
      case 'bookmark_add':
        return `"${activity.resourceName}"에 북마크를 추가했습니다`
      default:
        return '활동했습니다'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}시간 전`
    return time.toLocaleDateString('ko-KR')
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">현재 접속자</p>
                  <p className="text-2xl font-bold text-green-600">{stats.currentUsers}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 활동</p>
                  <p className="text-2xl font-bold">{stats.totalActivities}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">최근 로그인</p>
                  <p className="text-2xl font-bold">{stats.recentLogins}</p>
                </div>
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">실시간 업데이트</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={autoRefresh ? "default" : "outline"}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className="text-xs"
                    >
                      {autoRefresh ? '켜짐' : '꺼짐'}
                    </Button>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Activity Stream */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    실시간 활동
                    {isConnected ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Wifi className="w-3 h-3 text-green-500" />
                        실시간
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1">
                        <WifiOff className="w-3 h-3 text-red-500" />
                        오프라인
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>학생들의 최신 학습 활동</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                  >
                    <option value="all">모든 활동</option>
                    <option value="textbook_open">교재 열기</option>
                    <option value="page_view">페이지 조회</option>
                    <option value="assignment_submit">과제 제출</option>
                    <option value="chat_message">AI 대화</option>
                    <option value="login">로그인</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadLiveActivities}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.userAvatar} />
                        <AvatarFallback>{activity.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{activity.userName}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getActivityDescription(activity)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(activity.timestamp)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Resources */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>인기 자료</CardTitle>
              <CardDescription>가장 많이 사용되는 자료</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.popularResources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{resource.name}</p>
                        <p className="text-xs text-gray-600">{resource.type}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{resource.activityCount}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}