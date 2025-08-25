'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  BookOpen, 
  Play, 
  Pause,
  Settings,
  MessageCircle,
  Monitor,
  FileText,
  Activity,
  Eye,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { apiClient } from '@/lib/api'

// Dynamic import of Enhanced PDF viewer
const EnhancedPDFViewer = dynamic(() => import('@/components/PDFViewer/EnhancedPDFViewer').then(mod => ({ default: mod.EnhancedPDFViewer })), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64">Loading PDF viewer...</div>
});

interface ClassInfo {
  id: string
  name: string
  subject: string
  grade: string
  studentCount: number
  isLive: boolean
  currentPdf?: {
    id: string
    name: string
    status: string
  }
}

interface Student {
  id: string
  name: string
  isOnline: boolean
  currentPage: number
  lastActive: Date
}

export default function TeacherClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [currentTab, setCurrentTab] = useState('classroom')
  const [isLive, setIsLive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (classId) {
      fetchClassInfo()
      fetchStudents()
    }
  }, [classId])

  // Poll for student updates when class is live
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(fetchStudents, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isLive])

  const fetchClassInfo = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getClass(classId)
      if (response.data) {
        setClassInfo(response.data)
        setIsLive(response.data.isLive || false)
      } else if (response.error) {
        setError(response.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch class info:', err)
      setError('수업 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await apiClient.getClassStudents(classId)
      if (response.data) {
        setStudents(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    }
  }

  const handleStartClass = async () => {
    try {
      const response = await apiClient.startClass(classId)
      if (response.success) {
        setIsLive(true)
        toast.success('수업이 시작되었습니다!')
      } else {
        toast.error('수업 시작에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to start class:', err)
      toast.error('수업 시작 중 오류가 발생했습니다.')
    }
  }

  const handleEndClass = async () => {
    try {
      const response = await apiClient.endClass(classId)
      if (response.success) {
        setIsLive(false)
        toast.success('수업이 종료되었습니다.')
      } else {
        toast.error('수업 종료에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to end class:', err)
      toast.error('수업 종료 중 오류가 발생했습니다.')
    }
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Optionally sync page with students
    // await apiClient.syncPageWithStudents(classId, pageNumber)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="w-12 h-12 animate-pulse mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">수업실을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !classInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">오류 발생</p>
          <p>{error || '수업 정보를 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-blue-600" />
                {classInfo.name}
                {isLive && (
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE
                  </Badge>
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {classInfo.subject} · {classInfo.grade} · 학생 {classInfo.studentCount}명
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  온라인: {students.filter(s => s.isOnline).length}/{students.length}
                </span>
              </div>
              
              {!isLive ? (
                <Button 
                  onClick={handleStartClass}
                  className="gap-2"
                  disabled={!classInfo.currentPdf}
                >
                  <Play className="w-4 h-4" />
                  수업 시작
                </Button>
              ) : (
                <Button 
                  onClick={handleEndClass}
                  variant="destructive"
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  수업 종료
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classroom" className="gap-2">
              <Monitor className="w-4 h-4" />
              수업실
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              학생 현황
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="w-4 h-4" />
              학습 활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classroom" className="mt-6">
            {classInfo.currentPdf ? (
              <EnhancedPDFViewer
                pdfId={classInfo.currentPdf.id}
                classId={classId}
                isTeacher={true}
                onPageChange={handlePageChange}
                onTextExtract={(text, pageNumber) => {
                  console.log(`Teacher - Page ${pageNumber} loaded`)
                }}
              />
            ) : (
              <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">교재를 선택해주세요</h3>
                    <p className="mb-4">수업을 진행할 PDF 교재를 업로드하거나 선택하세요.</p>
                    <Button onClick={() => router.push('/teacher/textbooks')}>
                      교재 선택하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    학생 현황
                  </span>
                  <Badge variant="outline">
                    {students.filter(s => s.isOnline).length}명 온라인
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className={`p-4 rounded-lg border ${
                        student.isOnline ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="font-medium">{student.name}</span>
                        </div>
                        {student.isOnline && (
                          <Badge variant="secondary" className="text-xs">
                            페이지 {student.currentPage}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {student.isOnline ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            활성
                          </span>
                        ) : (
                          <span>오프라인</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {students.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>등록된 학생이 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  학습 활동 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>학습 활동 기능이 곧 추가될 예정입니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}