'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  Star, 
  Calendar,
  User,
  Tag,
  ArrowUpDown,
  ChevronDown,
  Filter,
  BookOpen,
  FileText,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccessibility } from './AccessibilityProvider'

interface SearchResult {
  id: string
  title: string
  type: 'textbook' | 'assignment' | 'quiz' | 'note'
  description: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  rating: number
  ratingCount: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
  hasAI: boolean
  hasMultimedia: boolean
  views: number
  isPublic: boolean
  price: number
  duration?: number // in minutes
}

interface SearchMetadata {
  query: string
  totalResults: number
  searchTime: number
  suggestions?: string[]
  filters: any
}

type SortOption = 'relevance' | 'date' | 'rating' | 'views' | 'title'
type ViewMode = 'grid' | 'list'

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: '중학교 국어 문법 기초',
    type: 'textbook',
    description: '중학교 1-3학년을 위한 국어 문법 기초 교과서입니다. AI 기반 맞춤 학습과 다양한 예제를 포함하고 있습니다.',
    author: {
      id: 'author1',
      name: '김선생',
      avatar: '/avatars/teacher1.jpg'
    },
    subject: '국어',
    difficulty: 'intermediate',
    rating: 4.8,
    ratingCount: 124,
    tags: ['문법', '중학교', 'AI'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
    hasAI: true,
    hasMultimedia: true,
    views: 1250,
    isPublic: true,
    price: 0,
    duration: 45
  },
  {
    id: '2',
    title: '고전 문학 작품 분석',
    type: 'assignment',
    description: '고등학교 국어 고전 문학 작품을 분석하는 과제입니다. 춘향전, 심청전 등을 다룹니다.',
    author: {
      id: 'author2',
      name: '이교수',
      avatar: '/avatars/teacher2.jpg'
    },
    subject: '국어',
    difficulty: 'advanced',
    rating: 4.6,
    ratingCount: 89,
    tags: ['고전문학', '고등학교', '작품분석'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-05-15'),
    hasAI: false,
    hasMultimedia: true,
    views: 892,
    isPublic: true,
    price: 5000,
    duration: 60
  },
  {
    id: '3',
    title: '어휘력 향상 퀴즈',
    type: 'quiz',
    description: '일상생활에서 자주 사용되는 어휘를 익힐 수 있는 퀴즈입니다. 난이도별로 구성되어 있습니다.',
    author: {
      id: 'author3',
      name: '박선생',
      avatar: '/avatars/teacher3.jpg'
    },
    subject: '국어',
    difficulty: 'beginner',
    rating: 4.9,
    ratingCount: 256,
    tags: ['어휘', '퀴즈', '초급'],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-06-20'),
    hasAI: true,
    hasMultimedia: false,
    views: 2150,
    isPublic: true,
    price: 0,
    duration: 20
  }
]

export function SearchResults({
  results = mockResults,
  metadata,
  isLoading = false,
  onResultClick,
  className
}: {
  results?: SearchResult[]
  metadata?: SearchMetadata
  isLoading?: boolean
  onResultClick?: (result: SearchResult) => void
  className?: string
}) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(results)
  
  const { announceToScreenReader } = useAccessibility()

  useEffect(() => {
    const sorted = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'rating':
          return b.rating - a.rating
        case 'views':
          return b.views - a.views
        case 'title':
          return a.title.localeCompare(b.title)
        default: // relevance
          return 0
      }
    })
    
    setFilteredResults(sorted)
  }, [results, sortBy])

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    announceToScreenReader(`검색 결과를 ${getSortLabel(newSort)}로 정렬했습니다.`)
  }

  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode)
    announceToScreenReader(`보기 모드를 ${newMode === 'grid' ? '격자' : '목록'}로 변경했습니다.`)
  }

  const getSortLabel = (sort: SortOption) => {
    const labels = {
      relevance: '관련도',
      date: '최신순',
      rating: '평점순',
      views: '조회수순',
      title: '제목순'
    }
    return labels[sort]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'textbook': return BookOpen
      case 'assignment': return FileText
      case 'quiz': return Award
      case 'note': return FileText
      default: return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      textbook: '교과서',
      assignment: '과제',
      quiz: '퀴즈',
      note: '노트'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급'
    }
    return labels[difficulty as keyof typeof labels] || difficulty
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}시간 ${mins}분`
    }
    return `${mins}분`
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Metadata */}
      {metadata && (
        <div className="flex flex-col gap-2 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              "<span className="font-medium text-foreground">{metadata.query}</span>"에 대한 
              <span className="font-medium text-foreground"> {metadata.totalResults.toLocaleString()}개</span> 결과 
              (<span className="font-medium">{metadata.searchTime}초</span>)
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    {getSortLabel(sortBy)}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSortChange('relevance')}>
                    관련도
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('date')}>
                    최신순
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('rating')}>
                    평점순
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('views')}>
                    조회수순
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('title')}>
                    제목순
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="rounded-r-none"
                  aria-label="격자 보기"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="rounded-l-none"
                  aria-label="목록 보기"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Suggestions */}
          {metadata.suggestions && metadata.suggestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">관련 검색:</span>
              {metadata.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-primary hover:text-primary"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filteredResults.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">검색 결과가 없습니다</CardTitle>
            <CardDescription>
              다른 검색어를 시도하거나 필터를 조정해보세요
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div 
          className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-4'
          }
          role="region"
          aria-label="검색 결과"
        >
          {filteredResults.map((result) => (
            <SearchResultCard
              key={result.id}
              result={result}
              viewMode={viewMode}
              onClick={() => onResultClick?.(result)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchResultCard({ 
  result, 
  viewMode, 
  onClick 
}: { 
  result: SearchResult
  viewMode: ViewMode
  onClick?: () => void 
}) {
  const TypeIcon = getTypeIcon(result.type)
  
  const cardContent = (
    <>
      <CardHeader className={viewMode === 'list' ? 'pb-3' : ''}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(result.type)}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getDifficultyColor(result.difficulty)}`}
            >
              {getDifficultyLabel(result.difficulty)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{result.rating}</span>
            <span>({result.ratingCount})</span>
          </div>
        </div>
        
        <CardTitle className="text-lg leading-tight">
          {result.title}
        </CardTitle>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{result.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(result.updatedAt)}</span>
          </div>
          {result.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(result.duration)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={viewMode === 'list' ? 'pt-0' : ''}>
        <CardDescription className="mb-4 line-clamp-3">
          {result.description}
        </CardDescription>
        
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {result.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {result.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{result.tags.length - 3}
              </Badge>
            )}
          </div>
          
          {/* Features */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {result.hasAI && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>AI 기능</span>
              </div>
            )}
            {result.hasMultimedia && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>멀티미디어</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{result.views.toLocaleString()} 조회</span>
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {result.price === 0 ? (
                <span className="text-green-600">무료</span>
              ) : (
                <span>{result.price.toLocaleString()}원</span>
              )}
            </div>
            
            {result.isPublic && (
              <Badge variant="outline" className="text-xs">
                공개
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </>
  )

  if (viewMode === 'list') {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex">
          <div className="flex-1">
            {cardContent}
          </div>
          {result.thumbnail && (
            <div className="w-24 h-24 m-4 bg-muted rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={result.thumbnail} 
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow h-full"
      onClick={onClick}
    >
      {cardContent}
    </Card>
  )
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'textbook': return BookOpen
    case 'assignment': return FileText
    case 'quiz': return Award
    case 'note': return FileText
    default: return FileText
  }
}

function getTypeLabel(type: string) {
  const labels = {
    textbook: '교과서',
    assignment: '과제',
    quiz: '퀴즈',
    note: '노트'
  }
  return labels[type as keyof typeof labels] || type
}

function getDifficultyLabel(difficulty: string) {
  const labels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatDuration(minutes?: number) {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`
  }
  return `${mins}분`
}