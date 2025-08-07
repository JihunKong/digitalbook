'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  Users, 
  Search, 
  Filter,
  UserPlus,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  AlertCircle,
  Eye,
  Edit3,
  MoreHorizontal,
  Download,
  Send,
  Loader2,
  Calendar,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  enrolledDate: string
  classIds: string[]
  progress: {
    totalTextbooks: number
    completedTextbooks: number
    totalAssignments: number
    completedAssignments: number
    averageScore: number
  }
  recentActivity: {
    lastLoginDate: string
    currentTextbook?: string
    currentPage?: number
  }
  status: 'active' | 'inactive' | 'pending'
}

interface Class {
  id: string
  name: string
  subject: string
  grade: number
  studentCount: number
  textbookId: string
  createdAt: string
}

export default function StudentsManagementPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [classesResponse, studentsResponse] = await Promise.all([
          apiClient.getClasses(),
          apiClient.getStudents()
        ])

        if (Array.isArray(classesResponse?.data)) {
          setClasses(classesResponse.data)
        }
        
        if (Array.isArray(studentsResponse?.data)) {
          // Transform backend data to match our frontend structure
          const transformedStudents: Student[] = studentsResponse.data.map((student: any) => ({
            id: student.id,
            name: student.name || student.email.split('@')[0],
            email: student.email,
            avatar: student.avatar,
            enrolledDate: student.createdAt || student.enrolledDate || new Date().toISOString(),
            classIds: student.classIds || student.classes?.map((c: any) => c.id) || [],
            progress: {
              totalTextbooks: student.progress?.totalTextbooks || 5,
              completedTextbooks: student.progress?.completedTextbooks || 0,
              totalAssignments: student.progress?.totalAssignments || 10,
              completedAssignments: student.progress?.completedAssignments || 0,
              averageScore: student.progress?.averageScore || 0
            },
            recentActivity: {
              lastLoginDate: student.lastLogin || student.createdAt || new Date().toISOString(),
              currentTextbook: student.currentTextbook?.title,
              currentPage: student.currentTextbook?.currentPage
            },
            status: student.isActive ? 'active' : 'inactive'
          }))
          
          setStudents(transformedStudents)
        } else {
          // Fallback to default data if API doesn't provide students
          const mockStudents: Student[] = [
            {
              id: '1',
              name: '김민수',
              email: 'minsu.kim@student.school.kr',
              enrolledDate: '2024-03-01',
              classIds: Array.isArray(classesResponse?.data) && classesResponse.data[0]?.id ? [classesResponse.data[0].id] : [],
              progress: {
                totalTextbooks: 5,
                completedTextbooks: 3,
                totalAssignments: 12,
                completedAssignments: 8,
                averageScore: 85
              },
              recentActivity: {
                lastLoginDate: new Date().toISOString(),
                currentTextbook: '현대문학의 이해',
                currentPage: 15
              },
              status: 'active'
            },
            {
              id: '2',
              name: '이서연',
              email: 'seoyeon.lee@student.school.kr',
              enrolledDate: '2024-03-01',
              classIds: Array.isArray(classesResponse?.data) && classesResponse.data[0]?.id ? [classesResponse.data[0].id] : [],
              progress: {
                totalTextbooks: 5,
                completedTextbooks: 4,
                totalAssignments: 12,
                completedAssignments: 11,
                averageScore: 92
              },
              recentActivity: {
                lastLoginDate: new Date().toISOString(),
                currentTextbook: '고전문학 감상',
                currentPage: 8
              },
              status: 'active'
            }
          ]
          setStudents(mockStudents)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('데이터를 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || student.classIds.includes(selectedClass)
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    return matchesSearch && matchesClass && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">활성</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">비활성</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">대기중</Badge>
      default:
        return null
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const sendMessage = async () => {
    if (selectedStudents.length === 0) {
      toast.error('메시지를 보낼 학생을 선택해주세요')
      return
    }
    
    try {
      const message = prompt('보낼 메시지를 입력하세요:')
      if (!message) return
      
      const response = await apiClient.sendMessage({
        studentIds: selectedStudents,
        message: message,
        subject: '선생님으로부터 메시지'
      })
      
      if (response?.data) {
        toast.success(`${selectedStudents.length}명의 학생에게 메시지를 보냈습니다`)
        setSelectedStudents([])
      } else {
        toast.error('메시지 전송에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('메시지 전송 중 오류가 발생했습니다')
    }
  }
  
  const inviteStudent = async () => {
    const email = prompt('초대할 학생의 이메일을 입력하세요:')
    if (!email) return
    
    try {
      const classId = selectedClass === 'all' ? classes[0]?.id : selectedClass
      if (!classId) {
        toast.error('먼저 반을 선택해주세요')
        return
      }
      
      const response = await apiClient.inviteStudent({
        email,
        classId,
        message: `${classes.find(c => c.id === classId)?.name || '우리'} 반에 초대합니다.`
      })
      
      if (response?.data) {
        toast.success('학생 초대 이메일을 발송했습니다')
      } else {
        toast.error('학생 초대에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to invite student:', error)
      toast.error('학생 초대 중 오류가 발생했습니다')
    }
  }
  
  const exportStudentData = async () => {
    try {
      const response = await apiClient.exportStudentData(selectedClass === 'all' ? undefined : selectedClass)
      
      const responseData = response?.data as { url?: string }
      if (responseData?.url) {
        window.open(responseData.url, '_blank')
      } else {
        // Fallback to client-side CSV generation
        const csvContent = generateCSV(filteredStudents)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast.success('학생 데이터를 내보냈습니다')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('데이터 내보내기에 실패했습니다')
    }
  }
  
  const generateCSV = (students: Student[]) => {
    const headers = ['이름', '이메일', '가입일', '상태', '교과서 진도', '과제 완료율', '평균 점수', '최근 활동']
    const rows = students.map(s => [
      s.name,
      s.email,
      new Date(s.enrolledDate).toLocaleDateString('ko-KR'),
      s.status === 'active' ? '활성' : '비활성',
      `${s.progress.completedTextbooks}/${s.progress.totalTextbooks}`,
      `${Math.round((s.progress.completedAssignments / s.progress.totalAssignments) * 100)}%`,
      s.progress.averageScore ? `${s.progress.averageScore}점` : '-',
      new Date(s.recentActivity.lastLoginDate).toLocaleDateString('ko-KR')
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">학생 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              {selectedStudents.length > 0 && (
                <Button onClick={sendMessage} className="gap-2">
                  <Send className="w-4 h-4" />
                  선택한 학생들에게 메시지 ({selectedStudents.length})
                </Button>
              )}
              <Button onClick={inviteStudent} className="gap-2">
                <UserPlus className="w-4 h-4" />
                학생 초대
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 학생 수</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                    <p className="text-xs text-green-600">+2 이번 주</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">활성 학생</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.status === 'active').length}</p>
                    <p className="text-xs text-green-600">최근 활동</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 성취도</p>
                    <p className="text-2xl font-bold">84%</p>
                    <p className="text-xs text-blue-600">전체 과제 기준</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">이번 주 제출</p>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-xs text-yellow-600">과제 제출 건수</p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="학생 이름 또는 이메일 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="border rounded-md px-3 py-2 bg-white"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="all">모든 반</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <select
                  className="border rounded-md px-3 py-2 bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="pending">대기중</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="gap-2"
                >
                  {selectedStudents.length === filteredStudents.length ? '선택 해제' : '전체 선택'}
                </Button>
                <Button variant="outline" onClick={exportStudentData} className="gap-2">
                  <Download className="w-4 h-4" />
                  내보내기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>학생 목록</CardTitle>
            <CardDescription>
              총 {filteredStudents.length}명의 학생이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4"
                      />
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{student.name}</h3>
                          {getStatusBadge(student.status)}
                          {student.progress.averageScore >= 90 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500">
                          가입일: {new Date(student.enrolledDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      {/* Progress */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">교과서 진도</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(student.progress.completedTextbooks / student.progress.totalTextbooks) * 100} 
                            className="w-16 h-2"
                          />
                          <span className="text-xs">
                            {student.progress.completedTextbooks}/{student.progress.totalTextbooks}
                          </span>
                        </div>
                      </div>

                      {/* Assignments */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">과제 완료</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(student.progress.completedAssignments / student.progress.totalAssignments) * 100} 
                            className="w-16 h-2"
                          />
                          <span className="text-xs">
                            {student.progress.completedAssignments}/{student.progress.totalAssignments}
                          </span>
                        </div>
                      </div>

                      {/* Average Score */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">평균 점수</p>
                        <p className={`font-semibold ${getScoreColor(student.progress.averageScore)}`}>
                          {student.progress.averageScore || '-'}점
                        </p>
                      </div>

                      {/* Last Activity */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">최근 활동</p>
                        <p className="text-xs">
                          {new Date(student.recentActivity.lastLoginDate).toLocaleDateString('ko-KR')}
                        </p>
                        {student.recentActivity.currentTextbook && (
                          <p className="text-xs text-blue-600">
                            {student.recentActivity.currentTextbook} p.{student.recentActivity.currentPage}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => router.push(`/teacher/students/${student.id}`)}
                        >
                          <Eye className="w-3 h-3" />
                          상세
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={async () => {
                            const message = prompt('학생에게 보낼 메시지를 입력하세요:')
                            if (!message) return
                            
                            try {
                              const response = await apiClient.sendMessage({
                                studentIds: [student.id],
                                message: message,
                                subject: '선생님으로부터 메시지'
                              })
                              
                              if (response?.data) {
                                toast.success('메시지를 보냈습니다')
                              } else {
                                toast.error('메시지 전송에 실패했습니다')
                              }
                            } catch (error) {
                              console.error('Failed to send message:', error)
                              toast.error('메시지 전송 중 오류가 발생했습니다')
                            }
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          메시지
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}