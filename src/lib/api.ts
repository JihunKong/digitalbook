const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    statusCode: number
  }
}

class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  private isDemoMode(): boolean {
    if (typeof window === 'undefined') return false
    
    const urlParams = new URLSearchParams(window.location.search)
    const urlDemo = urlParams.get('demo') === 'true'
    const storageDemo = localStorage.getItem('demoMode') === 'true'
    const isInDemoRoute = window.location.pathname.startsWith('/demo')
    
    return urlDemo || storageDemo || isInDemoRoute || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const token = this.getToken()
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(this.isDemoMode() && { 'X-Demo-Mode': 'true' }),
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || data.message || 'API Error',
            statusCode: response.status,
          },
        }
      }

      return { data }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network Error',
          statusCode: 0,
        },
      }
    }
  }

  // Auth APIs
  async register(userData: {
    email: string
    password: string
    name: string
    role: 'TEACHER' | 'STUDENT'
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    const responseData = response.data as { token?: string }
    if (responseData?.token) {
      this.setToken(responseData.token)
    }

    return response
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })
    this.removeToken()
    return response
  }

  // User APIs
  async getProfile() {
    return this.request('/users/profile')
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Textbook APIs
  async getTextbooks() {
    return this.request('/textbooks')
  }

  async getTextbook(id: string) {
    return this.request(`/textbooks/${id}`)
  }

  async createTextbook(data: any) {
    return this.request('/textbooks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTextbook(id: string, data: any) {
    return this.request(`/textbooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTextbook(id: string) {
    return this.request(`/textbooks/${id}`, {
      method: 'DELETE',
    })
  }

  // Guest APIs
  async guestAccess(accessCode: string) {
    return this.request('/guest/access', {
      method: 'POST',
      body: JSON.stringify({ accessCode }),
    })
  }

  async getPublicTextbooks() {
    return this.request('/textbooks/public/list')
  }

  // Chat APIs
  async sendChatMessage(data: {
    message: string
    sessionId?: string
    textbookId?: string
    pdfId?: string
    pageNumber?: number
    pageContent?: string
  }) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getChatHistory(sessionId: string) {
    return this.request(`/chat/history/${sessionId}`)
  }

  async getChatSuggestions(data: {
    pageContent?: string
    currentTopic?: string
  }) {
    return this.request('/chat/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Class APIs
  async getClasses() {
    return this.request('/classes')
  }

  async createClass(data: any) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async joinClass(data: { classCode: string }) {
    return this.request('/classes/join', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async enrollWithCode(classCode: string) {
    return this.request('/classes/enroll', {
      method: 'POST',
      body: JSON.stringify({ classCode }),
    })
  }

  async getMyClasses() {
    return this.request('/classes/my-classes')
  }

  async getTeacherClasses() {
    return this.request('/classes/teacher/classes')
  }

  async getClassDetails(classId: string) {
    return this.request(`/classes/${classId}/details`)
  }

  async leaveClass(classId: string) {
    return this.request(`/classes/${classId}/leave`, {
      method: 'POST',
    })
  }

  // Assignment APIs
  async getAssignments(classId?: string): Promise<ApiResponse<any[]>> {
    if (classId) {
      return this.request(`/assignments/class/${classId}`)
    }
    
    // If no classId provided, get all assignments from all classes
    try {
      const classesRes = await this.getClasses()
      if (!classesRes.data || !Array.isArray(classesRes.data)) {
        return { data: [] }
      }
      
      // Get assignments for each class
      const assignmentPromises = classesRes.data.map(cls => 
        this.request(`/assignments/class/${cls.id}`).catch(() => ({ data: [] }))
      )
      
      const assignmentResponses = await Promise.all(assignmentPromises)
      const allAssignments = assignmentResponses.flatMap(res => res.data || [])
      
      return { data: allAssignments }
    } catch (error) {
      console.error('Failed to get assignments:', error)
      return { data: [] }
    }
  }

  async getAssignment(id: string) {
    return this.request(`/assignments/${id}`)
  }

  async createAssignment(data: any) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitAssignment(assignmentId: string, data: any) {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAssignmentSubmissions(assignmentId: string) {
    return this.request(`/assignments/${assignmentId}/submissions`)
  }

  async deleteAssignment(id: string) {
    return this.request(`/assignments/${id}`, {
      method: 'DELETE',
    })
  }

  // Textbook Page APIs
  async getTextbookPages(textbookId: string) {
    return this.request(`/textbooks/${textbookId}/pages`)
  }

  async getTextbookPage(textbookId: string, pageNumber: number) {
    return this.request(`/textbooks/${textbookId}/pages/${pageNumber}`)
  }

  // Progress APIs
  async saveReadingProgress(data: {
    textbookId: string
    pageNumber: number
    timeSpent: number
  }) {
    return this.request('/progress/reading', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getReadingProgress(textbookId: string) {
    return this.request(`/progress/reading/${textbookId}`)
  }

  // Bookmark APIs
  async addBookmark(data: {
    textbookId: string
    pageNumber: number
    note?: string
  }) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async removeBookmark(textbookId: string, pageNumber: number) {
    return this.request(`/bookmarks/${textbookId}/${pageNumber}`, {
      method: 'DELETE',
    })
  }

  async getBookmarks(textbookId: string) {
    return this.request(`/bookmarks/${textbookId}`)
  }

  // Student Management APIs
  async getStudents(classId?: string) {
    if (classId) {
      return this.request(`/students/class/${classId}`)
    }
    return this.request('/students')
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`)
  }

  async inviteStudent(data: {
    email: string
    classId: string
    message?: string
  }) {
    return this.request('/students/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async removeStudent(studentId: string, classId: string) {
    return this.request(`/students/${studentId}/class/${classId}`, {
      method: 'DELETE',
    })
  }

  async sendMessage(data: {
    studentIds: string[]
    message: string
    subject?: string
  }) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getStudentProgress(studentId: string) {
    return this.request(`/students/${studentId}/progress`)
  }

  async exportStudentData(classId?: string) {
    return this.request(`/students/export${classId ? `?classId=${classId}` : ''}`)
  }

  // Analytics APIs
  async getAnalytics(timeRange: string = '7d', filters?: any) {
    const params = new URLSearchParams({ timeRange })
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })
    }
    return this.request(`/analytics?${params.toString()}`)
  }

  async getStudentPerformance(studentId?: string) {
    if (studentId) {
      return this.request(`/analytics/students/${studentId}`)
    }
    return this.request('/analytics/students')
  }

  async getEngagementMetrics(timeRange: string = '7d') {
    return this.request(`/analytics/engagement?timeRange=${timeRange}`)
  }

  async getProgressAnalytics(classId?: string) {
    return this.request(`/analytics/progress${classId ? `?classId=${classId}` : ''}`)
  }

  async exportAnalyticsData(type: 'excel' | 'csv' = 'excel', filters?: any) {
    const params = new URLSearchParams({ type })
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })
    }
    return this.request(`/analytics/export?${params.toString()}`)
  }

  // Activity Tracking APIs
  async trackActivity(activity: {
    type: string
    resourceId?: string
    resourceType?: string
    metadata?: Record<string, any>
  }) {
    return this.request('/activities/track', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  }

  async trackActivities(activities: Array<{
    id: string
    type: string
    resourceId?: string
    resourceType?: string
    metadata?: Record<string, any>
    timestamp: string
  }>) {
    return this.request('/activities/track/batch', {
      method: 'POST',
      body: JSON.stringify({ activities }),
    })
  }

  async getRecentActivities(limit: number = 50) {
    return this.request(`/activities/recent?limit=${limit}`)
  }

  async getActivityStream(filters?: {
    userId?: string
    type?: string
    resourceType?: string
    startDate?: string
    endDate?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters]) {
          params.append(key, filters[key as keyof typeof filters]!)
        }
      })
    }
    return this.request(`/activities/stream?${params.toString()}`)
  }

  async getLiveActivities() {
    return this.request('/activities/live')
  }

  // PDF APIs
  async uploadPDF(file: File, classId: string) {
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('classId', classId)

    // Debug logging
    console.log('uploadPDF called with:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      classId,
      uploadUrl: `${this.baseURL}/pdf/upload`
    })
    
    // Log FormData contents
    console.log('FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    try {
      const token = this.getToken()
      const response = await fetch(`${this.baseURL}/pdf/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'PDF upload failed')
      }

      return response.json()
    } catch (error) {
      throw error
    }
  }

  async getPDFStatus(pdfId: string) {
    return this.request(`/pdf/status/${pdfId}`)
  }

  async getPDFContent(pdfId: string, pageNumber?: number) {
    if (pageNumber) {
      return this.request(`/pdf/${pdfId}/page/${pageNumber}`)
    }
    return this.request(`/pdf/${pdfId}/content`)
  }

  async getPDFInfo(pdfId: string) {
    return this.request(`/pdf/${pdfId}`)
  }

  async getPDFPageContent(pdfId: string, pageNumber: number) {
    return this.request(`/pdf/${pdfId}/page/${pageNumber}`)
  }

  async trackPDFPageView(pdfId: string, pageNumber: number) {
    return this.request(`/pdf/${pdfId}/track`, {
      method: 'POST',
      body: JSON.stringify({ pageNumber }),
    })
  }

  async getPDFTracking(pdfId: string) {
    return this.request(`/pdf/${pdfId}/tracking`)
  }

  async searchPDF(pdfId: string, query: string) {
    return this.request(`/pdf/${pdfId}/search?query=${encodeURIComponent(query)}`)
  }

  // AI Chat with PDF context
  async chatWithAI(data: {
    message: string
    context?: {
      pdfId?: string
      pageNumber?: number
      pageContent?: string
      chatHistory?: any[]
    }
  }) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Activity APIs
  async generateActivities(pdfId: string, autoGenerate: boolean = true) {
    return this.request(`/activities/generate/${pdfId}`, {
      method: 'POST',
      body: JSON.stringify({ autoGenerate }),
    })
  }

  async getActivities(classId: string) {
    return this.request(`/activities/class/${classId}`)
  }

  async getActivity(activityId: string) {
    return this.request(`/activities/${activityId}`)
  }

  async getPageActivities(pdfId: string, pageNumber: number) {
    return this.request(`/activities/pdf/${pdfId}/page/${pageNumber}`)
  }

  async submitActivityResponse(activityId: string, answers: any) {
    return this.request(`/activities/${activityId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
  }

  async getActivityResponses(activityId: string) {
    return this.request(`/activities/${activityId}/responses`)
  }

  // Multimedia APIs
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)

    // For progress tracking, we'd need a more complex implementation
    // This is a simplified version
    try {
      const token = this.getToken()
      const response = await fetch(`${this.baseURL}/multimedia/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return response.json()
    } catch (error) {
      throw error
    }
  }

  async getMediaLibrary(filters?: {
    type?: string
    userId?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters]) {
          params.append(key, filters[key as keyof typeof filters]!.toString())
        }
      })
    }
    return this.request(`/multimedia/library?${params.toString()}`)
  }

  async deleteMedia(mediaId: string) {
    return this.request(`/multimedia/${mediaId}`, {
      method: 'DELETE',
    })
  }

  async updateMedia(mediaId: string, data: {
    name?: string
    description?: string
    tags?: string[]
  }) {
    return this.request(`/multimedia/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async generateThumbnail(mediaId: string) {
    return this.request(`/multimedia/${mediaId}/thumbnail`, {
      method: 'POST',
    })
  }

  async compressMedia(mediaId: string, options: {
    quality?: number
    format?: string
    resolution?: string
  }) {
    return this.request(`/multimedia/${mediaId}/compress`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  // Notification APIs
  async getNotifications(filters?: {
    type?: string
    isRead?: boolean
    priority?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] !== undefined) {
          params.append(key, filters[key as keyof typeof filters]!.toString())
        }
      })
    }
    return this.request(`/notifications?${params.toString()}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    })
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    })
  }

  async sendNotification(data: {
    userId?: string
    userIds?: string[]
    type: string
    title: string
    message: string
    priority?: 'low' | 'medium' | 'high'
    actionUrl?: string
    actionText?: string
    metadata?: Record<string, any>
  }) {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getNotificationSettings() {
    return this.request('/notifications/settings')
  }

  async updateNotificationSettings(settings: {
    emailNotifications?: boolean
    pushNotifications?: boolean
    assignments?: boolean
    announcements?: boolean
    progress?: boolean
  }) {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  // Student-specific APIs
  async getStudentTextbooks() {
    return this.request('/students/textbooks')
  }

  async getStudentLearningStats() {
    return this.request('/students/stats/learning')
  }

  async getStudentAchievements(limit: number = 10) {
    return this.request(`/students/achievements?limit=${limit}`)
  }

  async getStudentGoals(date?: string) {
    const params = date ? `?date=${date}` : ''
    return this.request(`/students/goals${params}`)
  }

  async updateStudentGoal(goalId: string, completed: boolean) {
    return this.request(`/students/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    })
  }

  async getStudentDashboardData() {
    return this.request('/students/dashboard')
  }

  async getTeacherDashboardData() {
    return this.request('/dashboard/teacher')
  }

  // Demo Mode APIs
  async getDemoStatus() {
    return this.request('/demo/status')
  }

  async resetDemoData() {
    return this.request('/demo/reset', {
      method: 'POST'
    })
  }

  async getDemoAccounts() {
    return this.request('/demo/accounts')
  }

  async loginWithDemoAccount(role: 'teacher' | 'student' | 'admin') {
    return this.request(`/demo/login/${role}`, {
      method: 'POST'
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient