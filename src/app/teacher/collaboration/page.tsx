'use client'

import { useState, useEffect } from 'react'
import { GroupDocument } from '@/components/collaboration/GroupDocument'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft,
  Users,
  FileText,
  MessageSquare,
  Activity,
  Calendar,
  Eye,
  Edit3,
  Download,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface GroupProject {
  id: string
  groupName: string
  title: string
  subject: string
  members: {
    id: string
    name: string
    role: string
    avatar?: string
  }[]
  progress: number
  lastActivity: string
  status: 'active' | 'completed' | 'draft'
  documents: number
  comments: number
}

export default function TeacherCollaborationPage() {
  const [selectedProject, setSelectedProject] = useState<GroupProject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [projects, setProjects] = useState<GroupProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from localStorage or create from API data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        
        // First check localStorage for saved projects
        const savedProjects = localStorage.getItem('collaborationProjects')
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects))
        } else {
          // If no saved projects, fetch data from API and create projects
          const [classesRes, studentsRes, assignmentsRes] = await Promise.all([
            apiClient.getClasses().catch(() => ({ data: [] })),
            apiClient.getStudents().catch(() => ({ data: [] })),
            apiClient.getAssignments().catch(() => ({ data: [] }))
          ])

          // Create sample projects based on real data
          const sampleProjects: GroupProject[] = []
          
          if (Array.isArray(classesRes?.data) && Array.isArray(studentsRes?.data)) {
            // Group students into teams of 4-5
            const students = studentsRes.data || []
            const groupSize = 4
            
            for (let i = 0; i < Math.min(4, Math.ceil(students.length / groupSize)); i++) {
              const groupStudents = students.slice(i * groupSize, (i + 1) * groupSize)
              
              if (groupStudents.length > 0) {
                const projectTitles = ['환경 보호 프로젝트', '우리 지역 문화재', '미래 직업 탐구', '건강한 생활 습관']
                const subjects = ['통합교과', '사회', '진로', '체육']
                const roles = ['조장', '서기', '자료조사', '발표자', '디자인']
                
                sampleProjects.push({
                  id: `project-${i + 1}`,
                  groupName: `${i + 1}모둠`,
                  title: projectTitles[i] || `프로젝트 ${i + 1}`,
                  subject: subjects[i] || '통합교과',
                  members: groupStudents.map((student: any, idx: number) => ({
                    id: student.id,
                    name: student.name || student.email.split('@')[0],
                    role: roles[idx] || '팀원',
                    avatar: student.avatar
                  })),
                  progress: Math.floor(Math.random() * 100),
                  lastActivity: i === 0 ? '10분 전' : i === 1 ? '2시간 전' : '1일 전',
                  status: i === 3 ? 'completed' : 'active',
                  documents: Math.floor(Math.random() * 7) + 1,
                  comments: Math.floor(Math.random() * 30) + 5
                })
              }
            }
          }
          
          // If still no projects, use default sample data
          if (sampleProjects.length === 0) {
            sampleProjects.push(...getDefaultProjects())
          }
          
          setProjects(sampleProjects)
          // Save to localStorage for persistence
          localStorage.setItem('collaborationProjects', JSON.stringify(sampleProjects))
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
        toast.error('프로젝트를 불러오는데 실패했습니다')
        // Use default projects on error
        setProjects(getDefaultProjects())
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Default sample projects
  const getDefaultProjects = (): GroupProject[] => [
      {
        id: '1',
        groupName: '1모둠',
        title: '환경 보호 프로젝트',
        subject: '통합교과',
        members: [
          { id: '1', name: '김민수', role: '조장' },
          { id: '2', name: '이서연', role: '서기' },
          { id: '3', name: '박준호', role: '자료조사' },
          { id: '4', name: '최지우', role: '발표자' }
        ],
        progress: 65,
        lastActivity: '10분 전',
        status: 'active',
        documents: 3,
        comments: 12
      },
      {
        id: '2',
        groupName: '2모둠',
        title: '우리 지역 문화재',
        subject: '사회',
        members: [
          { id: '5', name: '정하늘', role: '조장' },
          { id: '6', name: '강민지', role: '서기' },
          { id: '7', name: '조현우', role: '자료조사' },
          { id: '8', name: '윤서아', role: '디자인' },
          { id: '9', name: '한지민', role: '발표자' }
        ],
        progress: 80,
        lastActivity: '2시간 전',
        status: 'active',
        documents: 5,
        comments: 23
      },
      {
        id: '3',
        groupName: '3모둠',
        title: '미래 직업 탐구',
        subject: '진로',
        members: [
          { id: '10', name: '송민준', role: '조장' },
          { id: '11', name: '김서현', role: '서기' },
          { id: '12', name: '이도윤', role: '자료조사' },
          { id: '13', name: '박지후', role: '발표자' }
        ],
        progress: 45,
        lastActivity: '1일 전',
        status: 'active',
        documents: 2,
        comments: 8
      },
      {
        id: '4',
        groupName: '4모둠',
        title: '건강한 생활 습관',
        subject: '체육',
        members: [
          { id: '14', name: '최서준', role: '조장' },
          { id: '15', name: '홍예은', role: '서기' },
          { id: '16', name: '장현서', role: '자료조사' },
          { id: '17', name: '윤지호', role: '실습담당' },
          { id: '18', name: '임채원', role: '발표자' }
        ],
        progress: 100,
        lastActivity: '3일 전',
        status: 'completed',
        documents: 7,
        comments: 31
      }
    ]

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.includes(searchTerm) || 
                         project.groupName.includes(searchTerm) ||
                         project.subject.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleProjectUpdate = (projectData: any) => {
    console.log('Project updated:', projectData)
    
    // Update project in state and localStorage
    const updatedProjects = projects.map(p => 
      p.id === selectedProject?.id 
        ? { ...p, ...projectData, lastActivity: '방금 전' }
        : p
    )
    
    setProjects(updatedProjects)
    localStorage.setItem('collaborationProjects', JSON.stringify(updatedProjects))
    toast.success('프로젝트가 업데이트되었습니다')
  }
  
  const createNewProject = () => {
    const newProject: GroupProject = {
      id: `project-${Date.now()}`,
      groupName: `새 모둠`,
      title: '새 프로젝트',
      subject: '통합교과',
      members: [],
      progress: 0,
      lastActivity: '방금 전',
      status: 'draft',
      documents: 0,
      comments: 0
    }
    
    const updatedProjects = [...projects, newProject]
    setProjects(updatedProjects)
    localStorage.setItem('collaborationProjects', JSON.stringify(updatedProjects))
    setSelectedProject(newProject)
    toast.success('새 프로젝트가 생성되었습니다')
  }
  
  const exportAllProjects = () => {
    const dataStr = JSON.stringify(projects, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `collaboration-projects-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('프로젝트 데이터를 내보냈습니다')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-blue-600"><Activity className="w-3 h-3 mr-1" />진행중</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><FileText className="w-3 h-3 mr-1" />완료</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-gray-600"><Edit3 className="w-3 h-3 mr-1" />초안</Badge>
      default:
        return null
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
              <h1 className="text-xl font-semibold">협업 문서 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportAllProjects}>
                <Download className="w-4 h-4 mr-2" />
                전체 내보내기
              </Button>
              <Button onClick={createNewProject}>
                <Plus className="w-4 h-4 mr-2" />
                새 프로젝트
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : selectedProject ? (
          <div className="space-y-6">
            {/* 선택된 프로젝트 편집 화면 */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedProject(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                목록으로
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedProject.groupName} • {selectedProject.members.length}명
                </span>
                {getStatusBadge(selectedProject.status)}
              </div>
            </div>

            <GroupDocument
              groupId={selectedProject.id}
              documentId={selectedProject.id}
              currentUser={{
                id: '1',
                name: '홍길동 선생님',
                avatar: undefined
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 프로젝트 목록 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>협업 프로젝트</CardTitle>
                    <CardDescription>학생들의 모둠 활동과 협업 문서를 관리하세요</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="프로젝트 또는 모둠 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      필터
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList>
                    <TabsTrigger value="all">전체 ({projects.length})</TabsTrigger>
                    <TabsTrigger value="active">진행중 ({projects.filter(p => p.status === 'active').length})</TabsTrigger>
                    <TabsTrigger value="completed">완료 ({projects.filter(p => p.status === 'completed').length})</TabsTrigger>
                    <TabsTrigger value="draft">초안 ({projects.filter(p => p.status === 'draft').length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterStatus} className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredProjects.map((project) => (
                        <Card
                          key={project.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setSelectedProject(project)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{project.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {project.groupName} • {project.subject}
                                </p>
                              </div>
                              {getStatusBadge(project.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* 멤버 목록 */}
                              <div>
                                <p className="text-sm font-medium mb-2">참여 학생</p>
                                <div className="flex -space-x-2">
                                  {project.members.slice(0, 4).map((member, idx) => (
                                    <div
                                      key={member.id}
                                      className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                                      title={member.name}
                                    >
                                      <span className="text-xs font-medium">
                                        {member.name.charAt(0)}
                                      </span>
                                    </div>
                                  ))}
                                  {project.members.length > 4 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                      <span className="text-xs text-gray-600">
                                        +{project.members.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 진행률 */}
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>진행률</span>
                                  <span className="font-medium">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                              </div>

                              {/* 활동 정보 */}
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {project.documents}개 문서
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {project.comments}개 댓글
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-3 h-3" />
                                마지막 활동: {project.lastActivity}
                              </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // 미리보기 로직
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                미리보기
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // 공유 로직
                                }}
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                공유
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 통계 카드 */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">활성 프로젝트</p>
                      <p className="text-2xl font-bold">
                        {projects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">참여 학생</p>
                      <p className="text-2xl font-bold">
                        {new Set(projects.flatMap(p => p.members.map(m => m.id))).size}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">완료된 프로젝트</p>
                      <p className="text-2xl font-bold">
                        {projects.filter(p => p.status === 'completed').length}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}