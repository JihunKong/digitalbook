'use client'

import { useState } from 'react'
import { MultimediaStudio } from '@/components/multimedia/MultimediaStudio'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft,
  Video,
  Image,
  Music,
  FileText,
  Calendar,
  Eye,
  Edit3,
  Download,
  Share2,
  Play,
  Upload,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface MultimediaProject {
  id: string
  title: string
  type: 'video' | 'image' | 'audio' | 'presentation'
  creator: string
  creatorId: string
  subject: string
  thumbnail?: string
  duration?: string
  size: string
  createdAt: string
  lastModified: string
  status: 'draft' | 'published' | 'processing'
  views: number
  likes: number
  tags: string[]
}

export default function TeacherMultimediaPage() {
  const [selectedProject, setSelectedProject] = useState<MultimediaProject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showStudio, setShowStudio] = useState(false)

  // 샘플 데이터
  const projects: MultimediaProject[] = [
    {
      id: '1',
      title: '과학 실험 영상 - 물의 순환',
      type: 'video',
      creator: '김민수',
      creatorId: '2024001',
      subject: '과학',
      duration: '5:32',
      size: '124MB',
      createdAt: '2024-03-19',
      lastModified: '2024-03-20',
      status: 'published',
      views: 156,
      likes: 23,
      tags: ['과학', '실험', '물의순환']
    },
    {
      id: '2',
      title: '역사 인포그래픽 - 조선시대',
      type: 'image',
      creator: '이서연',
      creatorId: '2024002',
      subject: '역사',
      size: '2.4MB',
      createdAt: '2024-03-18',
      lastModified: '2024-03-18',
      status: 'published',
      views: 89,
      likes: 15,
      tags: ['역사', '인포그래픽', '조선시대']
    },
    {
      id: '3',
      title: '음악 창작 - 봄의 멜로디',
      type: 'audio',
      creator: '박준호',
      creatorId: '2024003',
      subject: '음악',
      duration: '3:15',
      size: '8.2MB',
      createdAt: '2024-03-17',
      lastModified: '2024-03-17',
      status: 'published',
      views: 67,
      likes: 12,
      tags: ['음악', '창작', '멜로디']
    },
    {
      id: '4',
      title: '환경 보호 발표 자료',
      type: 'presentation',
      creator: '최지우',
      creatorId: '2024004',
      subject: '통합교과',
      size: '5.6MB',
      createdAt: '2024-03-16',
      lastModified: '2024-03-19',
      status: 'draft',
      views: 0,
      likes: 0,
      tags: ['환경', '발표', '프레젠테이션']
    },
    {
      id: '5',
      title: '체육 활동 영상 - 축구 기술',
      type: 'video',
      creator: '정하늘',
      creatorId: '2024005',
      subject: '체육',
      duration: '8:45',
      size: '256MB',
      createdAt: '2024-03-15',
      lastModified: '2024-03-15',
      status: 'processing',
      views: 0,
      likes: 0,
      tags: ['체육', '축구', '운동']
    }
  ]

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === 'all' || project.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleProjectSave = (projectData: any) => {
    console.log('Project saved:', projectData)
    setShowStudio(false)
    // 여기서 실제 저장 로직 구현
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'presentation':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="outline" className="text-green-600">게시됨</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-gray-600">초안</Badge>
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">처리중</Badge>
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return '동영상'
      case 'image':
        return '이미지'
      case 'audio':
        return '오디오'
      case 'presentation':
        return '발표자료'
      default:
        return type
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
              <h1 className="text-xl font-semibold">멀티미디어 스튜디오</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                가져오기
              </Button>
              <Button onClick={() => setShowStudio(true)}>
                <Plus className="w-4 h-4 mr-2" />
                새 프로젝트
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showStudio ? (
          <div className="space-y-6">
            {/* 멀티미디어 스튜디오 */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowStudio(false)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                목록으로
              </Button>
              <h2 className="text-lg font-semibold">새 멀티미디어 프로젝트</h2>
            </div>

            <MultimediaStudio />
          </div>
        ) : selectedProject ? (
          <div className="space-y-6">
            {/* 선택된 프로젝트 상세 화면 */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedProject(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                목록으로
              </Button>
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedProject.status)}
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-1" />
                  편집
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  공유
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedProject.title}</CardTitle>
                    <CardDescription>
                      {selectedProject.creator} ({selectedProject.creatorId}) • {selectedProject.subject}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    {getTypeIcon(selectedProject.type)}
                    {getTypeLabel(selectedProject.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 미디어 미리보기 영역 */}
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {selectedProject.type === 'video' ? (
                      <Play className="w-16 h-16 text-gray-400" />
                    ) : (
                      getTypeIcon(selectedProject.type)
                    )}
                  </div>

                  {/* 프로젝트 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">생성일</p>
                      <p className="font-medium">{selectedProject.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">크기</p>
                      <p className="font-medium">{selectedProject.size}</p>
                    </div>
                    {selectedProject.duration && (
                      <div>
                        <p className="text-sm text-gray-600">길이</p>
                        <p className="font-medium">{selectedProject.duration}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">조회수</p>
                      <p className="font-medium">{selectedProject.views}회</p>
                    </div>
                  </div>

                  {/* 태그 */}
                  <div>
                    <p className="text-sm font-medium mb-2">태그</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 프로젝트 목록 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>멀티미디어 프로젝트</CardTitle>
                    <CardDescription>학생들과 함께 만든 창의적인 멀티미디어 콘텐츠</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="프로젝트 검색..."
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
                <Tabs value={filterType} onValueChange={setFilterType}>
                  <TabsList>
                    <TabsTrigger value="all">전체 ({projects.length})</TabsTrigger>
                    <TabsTrigger value="video">동영상 ({projects.filter(p => p.type === 'video').length})</TabsTrigger>
                    <TabsTrigger value="image">이미지 ({projects.filter(p => p.type === 'image').length})</TabsTrigger>
                    <TabsTrigger value="audio">오디오 ({projects.filter(p => p.type === 'audio').length})</TabsTrigger>
                    <TabsTrigger value="presentation">발표자료 ({projects.filter(p => p.type === 'presentation').length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterType} className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredProjects.map((project) => (
                        <Card
                          key={project.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                          onClick={() => setSelectedProject(project)}
                        >
                          {/* 썸네일 영역 */}
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              {getTypeIcon(project.type)}
                            </div>
                            {project.duration && (
                              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {project.duration}
                              </span>
                            )}
                            <div className="absolute top-2 left-2">
                              {getStatusBadge(project.status)}
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {project.creator} • {project.subject}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {project.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {project.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {project.createdAt}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
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
                                  // 다운로드 로직
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                다운로드
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
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">총 프로젝트</p>
                      <p className="text-2xl font-bold">{projects.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">총 조회수</p>
                      <p className="text-2xl font-bold">
                        {projects.reduce((sum, p) => sum + p.views, 0)}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">게시된 콘텐츠</p>
                      <p className="text-2xl font-bold">
                        {projects.filter(p => p.status === 'published').length}
                      </p>
                    </div>
                    <Share2 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">총 용량</p>
                      <p className="text-2xl font-bold">426MB</p>
                    </div>
                    <Download className="w-8 h-8 text-orange-600" />
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