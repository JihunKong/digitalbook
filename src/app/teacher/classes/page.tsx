'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft,
  Plus,
  Users,
  BookOpen,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Download,
  FileText,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'

interface Class {
  id: string
  name: string
  grade: string
  subject: string
  description: string
  studentCount: number
  activeTextbooks: number
  averageScore: number
  completionRate: number
  createdAt: string
  lastActive: string
  color: string
  teacher: string
  status: 'active' | 'inactive' | 'archived'
}

interface Student {
  id: string
  name: string
  email: string
  joinedAt: string
  lastActive: string
  averageScore: number
  completionRate: number
  status: 'active' | 'inactive'
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadClasses = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockClasses: Class[] = [
        {
          id: 'class1',
          name: '3학년 1반',
          grade: '3학년',
          subject: '국어',
          description: '즐겁게 배우는 한국어 수업',
          studentCount: 25,
          activeTextbooks: 3,
          averageScore: 87.5,
          completionRate: 78,
          createdAt: '2024-03-01',
          lastActive: '10분 전',
          color: 'bg-blue-500',
          teacher: '김선생님',
          status: 'active'
        },
        {
          id: 'class2',
          name: '3학년 2반',
          grade: '3학년',
          subject: '국어',
          description: '창의적 사고력을 기르는 국어 시간',
          studentCount: 24,
          activeTextbooks: 2,
          averageScore: 82.3,
          completionRate: 85,
          createdAt: '2024-03-01',
          lastActive: '1시간 전',
          color: 'bg-green-500',
          teacher: '김선생님',
          status: 'active'
        },
        {
          id: 'class3',
          name: '4학년 수학반',
          grade: '4학년',
          subject: '수학',
          description: '수학의 재미를 발견하는 시간',
          studentCount: 20,
          activeTextbooks: 1,
          averageScore: 75.8,
          completionRate: 65,
          createdAt: '2024-02-15',
          lastActive: '2일 전',
          color: 'bg-purple-500',
          teacher: '김선생님',
          status: 'active'
        },
        {
          id: 'class4',
          name: '2023년 3학년 1반',
          grade: '3학년',
          subject: '국어',
          description: '지난해 담당했던 학급',
          studentCount: 23,
          activeTextbooks: 0,
          averageScore: 89.2,
          completionRate: 100,
          createdAt: '2023-03-01',
          lastActive: '3개월 전',
          color: 'bg-gray-400',
          teacher: '김선생님',
          status: 'archived'
        }
      ]
      
      const mockStudents: Student[] = [
        {
          id: 's1',
          name: '김민수',
          email: 'minsu@school.edu',
          joinedAt: '2024-03-01',
          lastActive: '5분 전',
          averageScore: 95,
          completionRate: 88,
          status: 'active'
        },
        {
          id: 's2',
          name: '이서연',
          email: 'seoyeon@school.edu',
          joinedAt: '2024-03-01',
          lastActive: '10분 전',
          averageScore: 92,
          completionRate: 92,
          status: 'active'
        },
        {
          id: 's3',
          name: '박준호',
          email: 'junho@school.edu',
          joinedAt: '2024-03-02',
          lastActive: '2시간 전',
          averageScore: 78,
          completionRate: 65,
          status: 'active'
        },
        {
          id: 's4',
          name: '최유진',
          email: 'yujin@school.edu',
          joinedAt: '2024-03-01',
          lastActive: '1일 전',
          averageScore: 85,
          completionRate: 75,
          status: 'active'
        }
      ]
      
      setClasses(mockClasses)
      setStudents(mockStudents)
      setSelectedClass(mockClasses[0])
      setIsLoading(false)
    }

    loadClasses()
  }, [])

  const activeClasses = classes.filter(c => c.status === 'active')
  const archivedClasses = classes.filter(c => c.status === 'archived')

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'archived': return '보관됨'
      default: return status
    }
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
              <h1 className="text-xl font-semibold">학급 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/teacher/class/create">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  새 학급 만들기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 학급</p>
                  <p className="text-2xl font-bold">{activeClasses.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 학생수</p>
                  <p className="text-2xl font-bold">{activeClasses.reduce((sum, cls) => sum + cls.studentCount, 0)}</p>
                </div>
                <UserPlus className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 성취도</p>
                  <p className="text-2xl font-bold">
                    {Math.round(activeClasses.reduce((sum, cls) => sum + cls.averageScore, 0) / activeClasses.length)}점
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">완료율</p>
                  <p className="text-2xl font-bold">
                    {Math.round(activeClasses.reduce((sum, cls) => sum + cls.completionRate, 0) / activeClasses.length)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  내 학급 ({classes.length})
                  <Button size="sm" variant="outline">
                    <Filter className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="학급 검색..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        selectedClass?.id === cls.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 ${cls.color} rounded-full`} />
                          <h3 className="font-semibold">{cls.name}</h3>
                        </div>
                        <Badge className={getStatusColor(cls.status)}>
                          {getStatusText(cls.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {cls.grade} · {cls.subject}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{cls.studentCount}명</span>
                        <span>{cls.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClass ? (
              <>
                {/* Class Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${selectedClass.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                          {selectedClass.name.slice(-2)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                          <p className="text-gray-600">{selectedClass.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{selectedClass.grade}</span>
                            <span>{selectedClass.subject}</span>
                            <span>{selectedClass.studentCount}명</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Settings className="w-4 h-4" />
                          설정
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="w-4 h-4" />
                          내보내기
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{selectedClass.averageScore}</p>
                        <p className="text-xs text-gray-600">평균 점수</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{selectedClass.completionRate}%</p>
                        <p className="text-xs text-gray-600">완료율</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{selectedClass.activeTextbooks}</p>
                        <p className="text-xs text-gray-600">활성 교재</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="students">학생 ({selectedClass.studentCount})</TabsTrigger>
                    <TabsTrigger value="textbooks">교재 ({selectedClass.activeTextbooks})</TabsTrigger>
                    <TabsTrigger value="analytics">분석</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">최근 활동</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="text-sm font-medium">김민수 학생이 과제 완료</p>
                                <p className="text-xs text-gray-500">10분 전</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">새 교재가 배정됨</p>
                                <p className="text-xs text-gray-500">2시간 전</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Award className="w-5 h-5 text-yellow-500" />
                              <div>
                                <p className="text-sm font-medium">이서연 학생이 뱃지 획득</p>
                                <p className="text-xs text-gray-500">1일 전</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">주간 성취도</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>읽기</span>
                                <span>85%</span>
                              </div>
                              <Progress value={85} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>쓰기</span>
                                <span>72%</span>
                              </div>
                              <Progress value={72} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>문법</span>
                                <span>90%</span>
                              </div>
                              <Progress value={90} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="students" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>학생 목록</CardTitle>
                          <Button size="sm" className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            학생 초대
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {student.name[0]}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{student.name}</h3>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                  <p className="text-xs text-gray-500">
                                    가입: {new Date(student.joinedAt).toLocaleDateString('ko-KR')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <p className="font-semibold">{student.averageScore}점</p>
                                  <p className="text-xs text-gray-500">평균</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold">{student.completionRate}%</p>
                                  <p className="text-xs text-gray-500">완료율</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                                  <p className="text-xs text-gray-500">활성</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="textbooks" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>사용 중인 교재</CardTitle>
                          <Button size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            교재 추가
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-blue-500" />
                                <div>
                                  <h3 className="font-semibold">3학년 1학기 국어</h3>
                                  <p className="text-sm text-gray-600">한글의 아름다움과 우리말</p>
                                  <p className="text-xs text-gray-500">24명이 사용 중</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">78%</p>
                                <p className="text-xs text-gray-500">평균 진도</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">성취도 분포</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">우수 (90점 이상)</span>
                              <span className="text-sm font-semibold">8명 (32%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">보통 (70-89점)</span>
                              <span className="text-sm font-semibold">14명 (56%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">개선 필요 (70점 미만)</span>
                              <span className="text-sm font-semibold">3명 (12%)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">참여도 현황</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>일일 활성 학생</span>
                                <span>20/25 (80%)</span>
                              </div>
                              <Progress value={80} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>과제 제출률</span>
                                <span>22/25 (88%)</span>
                              </div>
                              <Progress value={88} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">학급을 선택해주세요</h3>
                  <p className="text-gray-600">왼쪽에서 확인하고 싶은 학급을 클릭하세요</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}