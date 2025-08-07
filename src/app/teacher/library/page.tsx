'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft,
  Search,
  Filter,
  BookOpen,
  Plus,
  Star,
  Download,
  Eye,
  Share,
  Heart,
  Clock,
  Users,
  Tag,
  Grid,
  List,
  SortAsc,
  FileText,
  Image,
  Video,
  Headphones,
  Archive,
  Bookmark,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'textbook' | 'worksheet' | 'image' | 'video' | 'audio' | 'document'
  subject: string
  grade: string
  author: string
  createdAt: string
  updatedAt: string
  downloads: number
  likes: number
  rating: number
  tags: string[]
  isPublic: boolean
  isFavorite: boolean
  thumbnail?: string
  fileSize?: string
  duration?: string
}

interface Collection {
  id: string
  name: string
  description: string
  resourceCount: number
  isPublic: boolean
  createdAt: string
  thumbnail: string
}

export default function TeacherLibraryPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('resources')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLibraryData = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockResources: Resource[] = [
        {
          id: 'r1',
          title: '3학년 한글 기초 워크시트',
          description: '한글 자모음 학습을 위한 기본 워크시트입니다. 받아쓰기와 단어 연습이 포함되어 있습니다.',
          type: 'worksheet',
          subject: '국어',
          grade: '3학년',
          author: '김선생님',
          createdAt: '2024-01-20',
          updatedAt: '2024-01-20',
          downloads: 142,
          likes: 28,
          rating: 4.5,
          tags: ['한글', '기초', '워크시트', '받아쓰기'],
          isPublic: true,
          isFavorite: true,
          fileSize: '2.5MB'
        },
        {
          id: 'r2',
          title: '우리나라 전통문화 이미지 모음',
          description: '한국의 전통문화를 소개하는 고품질 이미지 컬렉션입니다.',
          type: 'image',
          subject: '사회',
          grade: '4학년',
          author: '박선생님',
          createdAt: '2024-01-18',
          updatedAt: '2024-01-19',
          downloads: 89,
          likes: 15,
          rating: 4.2,
          tags: ['전통문화', '한국사', '이미지'],
          isPublic: true,
          isFavorite: false,
          fileSize: '45.2MB'
        },
        {
          id: 'r3',
          title: '곱셈 구구단 노래',
          description: '아이들이 쉽게 외울 수 있는 구구단 노래 MP3 파일입니다.',
          type: 'audio',
          subject: '수학',
          grade: '2학년',
          author: '이선생님',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          downloads: 256,
          likes: 47,
          rating: 4.8,
          tags: ['구구단', '암송', '노래', '수학'],
          isPublic: true,
          isFavorite: true,
          duration: '3분 25초'
        },
        {
          id: 'r4',
          title: '과학 실험 동영상 - 물의 상태 변화',
          description: '물이 얼음, 물, 수증기로 변하는 과정을 보여주는 실험 영상입니다.',
          type: 'video',
          subject: '과학',
          grade: '3학년',
          author: '최선생님',
          createdAt: '2024-01-12',
          updatedAt: '2024-01-12',
          downloads: 178,
          likes: 32,
          rating: 4.6,
          tags: ['과학', '실험', '물', '상태변화'],
          isPublic: false,
          isFavorite: false,
          duration: '8분 15초'
        },
        {
          id: 'r5',
          title: '초등 영어 단어카드',
          description: '기초 영어 단어 학습을 위한 플래시카드 세트입니다.',
          type: 'document',
          subject: '영어',
          grade: '1학년',
          author: '김선생님',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-11',
          downloads: 203,
          likes: 38,
          rating: 4.4,
          tags: ['영어', '단어', '플래시카드', '기초'],
          isPublic: true,
          isFavorite: true,
          fileSize: '1.8MB'
        }
      ]

      const mockCollections: Collection[] = [
        {
          id: 'c1',
          name: '3학년 국어 완전정복',
          description: '3학년 국어 교육과정에 필요한 모든 자료를 담았습니다',
          resourceCount: 15,
          isPublic: true,
          createdAt: '2024-01-15',
          thumbnail: '📚'
        },
        {
          id: 'c2',
          name: '과학 실험 모음집',
          description: '쉽고 재미있는 과학 실험들을 모았습니다',
          resourceCount: 8,
          isPublic: false,
          createdAt: '2024-01-10',
          thumbnail: '🔬'
        },
        {
          id: 'c3',
          name: '창의적 미술 활동',
          description: '아이들의 창의성을 기르는 미술 활동 자료',
          resourceCount: 12,
          isPublic: true,
          createdAt: '2024-01-08',
          thumbnail: '🎨'
        }
      ]
      
      setResources(mockResources)
      setCollections(mockCollections)
      setIsLoading(false)
    }

    loadLibraryData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'textbook': return BookOpen
      case 'worksheet': return FileText
      case 'image': return Image
      case 'video': return Video
      case 'audio': return Headphones
      case 'document': return FileText
      default: return FileText
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'textbook': return '교과서'
      case 'worksheet': return '워크시트'
      case 'image': return '이미지'
      case 'video': return '동영상'
      case 'audio': return '오디오'
      case 'document': return '문서'
      default: return type
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'all' || resource.type === selectedType
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject
    const matchesGrade = selectedGrade === 'all' || resource.grade === selectedGrade
    
    return matchesSearch && matchesType && matchesSubject && matchesGrade
  })

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'popular':
        return b.downloads - a.downloads
      case 'rating':
        return b.rating - a.rating
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const subjects = Array.from(new Set(resources.map(r => r.subject)))
  const grades = Array.from(new Set(resources.map(r => r.grade)))

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
              <h1 className="text-xl font-semibold">교육자료 라이브러리</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                업로드
              </Button>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                새 컬렉션
              </Button>
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
                  <p className="text-sm text-gray-600">총 자료</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">컬렉션</p>
                  <p className="text-2xl font-bold">{collections.length}</p>
                </div>
                <Archive className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">즐겨찾기</p>
                  <p className="text-2xl font-bold">{resources.filter(r => r.isFavorite).length}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 다운로드</p>
                  <p className="text-2xl font-bold">{resources.reduce((sum, r) => sum + r.downloads, 0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resources">교육자료 ({resources.length})</TabsTrigger>
            <TabsTrigger value="collections">컬렉션 ({collections.length})</TabsTrigger>
            <TabsTrigger value="favorites">즐겨찾기 ({resources.filter(r => r.isFavorite).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="space-y-6 mt-6">
            {/* Filters and Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="자료 검색..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="all">모든 유형</option>
                      <option value="textbook">교과서</option>
                      <option value="worksheet">워크시트</option>
                      <option value="image">이미지</option>
                      <option value="video">동영상</option>
                      <option value="audio">오디오</option>
                      <option value="document">문서</option>
                    </select>
                    
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="all">모든 과목</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                    >
                      <option value="all">모든 학년</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="recent">최근 순</option>
                      <option value="popular">인기 순</option>
                      <option value="rating">평점 순</option>
                      <option value="alphabetical">가나다 순</option>
                    </select>
                    
                    <div className="flex items-center border rounded-md">
                      <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedResources.map((resource) => {
                  const TypeIcon = getTypeIcon(resource.type)
                  
                  return (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TypeIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {getTypeText(resource.type)}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Toggle favorite
                              setResources(prev => 
                                prev.map(r => 
                                  r.id === resource.id ? {...r, isFavorite: !r.isFavorite} : r
                                )
                              )
                            }}
                          >
                            <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                        
                        <h3 className="font-semibold mb-2 line-clamp-2">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary">{resource.subject}</Badge>
                          <Badge variant="secondary">{resource.grade}</Badge>
                          {resource.isPublic && (
                            <Badge className="bg-green-100 text-green-800">공개</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span>by {resource.author}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {resource.rating}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {resource.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {resource.likes}
                            </span>
                          </div>
                          {resource.fileSize && <span>{resource.fileSize}</span>}
                          {resource.duration && <span>{resource.duration}</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="flex-1 gap-2">
                            <Eye className="w-4 h-4" />
                            보기
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {sortedResources.map((resource) => {
                      const TypeIcon = getTypeIcon(resource.type)
                      
                      return (
                        <div key={resource.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <TypeIcon className="w-8 h-8 text-blue-500" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{resource.title}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {getTypeText(resource.type)}
                                  </Badge>
                                  {resource.isPublic && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">공개</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{resource.subject} · {resource.grade}</span>
                                  <span>by {resource.author}</span>
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {resource.rating}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {resource.downloads}
                                  </span>
                                  {resource.fileSize && <span>{resource.fileSize}</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setResources(prev => 
                                    prev.map(r => 
                                      r.id === resource.id ? {...r, isFavorite: !r.isFavorite} : r
                                    )
                                  )
                                }}
                              >
                                <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Eye className="w-4 h-4" />
                                보기
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                다운로드
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{collection.thumbnail}</div>
                      <h3 className="font-semibold text-lg">{collection.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{collection.resourceCount}개 자료</span>
                      <Badge className={collection.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {collection.isPublic ? '공개' : '비공개'}
                      </Badge>
                    </div>
                    
                    <Button className="w-full gap-2">
                      <Eye className="w-4 h-4" />
                      컬렉션 보기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources
                .filter(resource => resource.isFavorite)
                .map((resource) => {
                  const TypeIcon = getTypeIcon(resource.type)
                  
                  return (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <TypeIcon className="w-6 h-6 text-red-600" />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTypeText(resource.type)}
                            </Badge>
                          </div>
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                        </div>
                        
                        <h3 className="font-semibold mb-2">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary">{resource.subject}</Badge>
                          <Badge variant="secondary">{resource.grade}</Badge>
                        </div>
                        
                        <Button size="sm" className="w-full gap-2">
                          <Eye className="w-4 h-4" />
                          보기
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}