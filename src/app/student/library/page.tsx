'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft,
  Search,
  Filter,
  BookOpen,
  Play,
  Star,
  Heart,
  Clock,
  Users,
  Eye,
  Bookmark,
  Grid,
  List,
  TrendingUp,
  Award,
  Download,
  Share,
  CheckCircle,
  Timer,
  Target,
  Sparkles,
  Globe,
  Plus
} from 'lucide-react'

interface Book {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  difficulty: 'easy' | 'medium' | 'hard'
  chapters: number
  readingTime: number // in minutes
  rating: number
  reviews: number
  author: string
  publisher: string
  isMyBook: boolean
  progress: number
  completedChapters: number
  lastRead?: string
  isFavorite: boolean
  isPublic: boolean
  thumbnail: string
}

interface Collection {
  id: string
  name: string
  description: string
  bookCount: number
  totalChapters: number
  completionRate: number
  category: string
  thumbnail: string
}

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('my-books')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLibraryData = async () => {
      setIsLoading(true)
      
      // Mock data for demo
      const mockBooks: Book[] = [
        {
          id: 'b1',
          title: '3학년 1학기 국어',
          description: '우리말의 아름다움을 배우고 한글의 소중함을 깨달아보는 교과서입니다.',
          subject: '국어',
          grade: '3학년',
          difficulty: 'medium',
          chapters: 12,
          readingTime: 180,
          rating: 4.5,
          reviews: 128,
          author: '교육부',
          publisher: '천재교육',
          isMyBook: true,
          progress: 68,
          completedChapters: 8,
          lastRead: '2024-01-20',
          isFavorite: true,
          isPublic: true,
          thumbnail: '📚'
        },
        {
          id: 'b2',
          title: '수학의 즐거움',
          description: '놀이를 통해 수학의 재미를 발견하고 논리적 사고력을 기르는 책입니다.',
          subject: '수학',
          grade: '3학년',
          difficulty: 'hard',
          chapters: 10,
          readingTime: 150,
          rating: 4.2,
          reviews: 95,
          author: '김수학',
          publisher: '미래엔',
          isMyBook: true,
          progress: 45,
          completedChapters: 5,
          lastRead: '2024-01-19',
          isFavorite: false,
          isPublic: true,
          thumbnail: '🔢'
        },
        {
          id: 'b3',
          title: '과학 탐험대',
          description: '호기심 많은 아이들을 위한 신나는 과학 여행 이야기입니다.',
          subject: '과학',
          grade: '3학년',
          difficulty: 'medium',
          chapters: 8,
          readingTime: 120,
          rating: 4.7,
          reviews: 156,
          author: '이과학',
          publisher: '비상교육',
          isMyBook: true,
          progress: 92,
          completedChapters: 7,
          lastRead: '2024-01-18',
          isFavorite: true,
          isPublic: true,
          thumbnail: '🔬'
        },
        {
          id: 'b4',
          title: '영어와 친해지기',
          description: '기초 영어를 재미있게 배울 수 있는 초급자용 교재입니다.',
          subject: '영어',
          grade: '3학년',
          difficulty: 'easy',
          chapters: 15,
          readingTime: 200,
          rating: 4.1,
          reviews: 82,
          author: 'Sarah Kim',
          publisher: 'YBM',
          isMyBook: false,
          progress: 0,
          completedChapters: 0,
          isFavorite: false,
          isPublic: true,
          thumbnail: '🌍'
        },
        {
          id: 'b5',
          title: '한국사 이야기',
          description: '우리나라의 역사를 어린이의 눈높이에 맞춰 쉽게 풀어낸 책입니다.',
          subject: '사회',
          grade: '4학년',
          difficulty: 'medium',
          chapters: 20,
          readingTime: 300,
          rating: 4.6,
          reviews: 203,
          author: '박역사',
          publisher: '금성출판사',
          isMyBook: false,
          progress: 0,
          completedChapters: 0,
          isFavorite: true,
          isPublic: true,
          thumbnail: '🏛️'
        }
      ]

      const mockCollections: Collection[] = [
        {
          id: 'c1',
          name: '3학년 필수 교과서',
          description: '3학년 학습에 꼭 필요한 핵심 교과서들을 모았습니다',
          bookCount: 4,
          totalChapters: 45,
          completionRate: 62,
          category: '교과서',
          thumbnail: '📖'
        },
        {
          id: 'c2',
          name: '과학 실험 시리즈',
          description: '재미있는 과학 실험과 관찰 활동을 담은 책들입니다',
          bookCount: 3,
          totalChapters: 24,
          completionRate: 80,
          category: '과학',
          thumbnail: '🧪'
        },
        {
          id: 'c3',
          name: '창의적 사고력 기르기',
          description: '논리적이고 창의적인 사고를 기를 수 있는 도서 모음',
          bookCount: 5,
          totalChapters: 60,
          completionRate: 35,
          category: '사고력',
          thumbnail: '💡'
        }
      ]
      
      setBooks(mockBooks)
      setCollections(mockCollections)
      setIsLoading(false)
    }

    loadLibraryData()
  }, [])

  const myBooks = books.filter(book => book.isMyBook)
  const allBooks = books
  const favoriteBooks = books.filter(book => book.isFavorite)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움'
      case 'medium': return '보통'
      case 'hard': return '어려움'
      default: return difficulty
    }
  }

  const getTabBooks = () => {
    let baseBooks = []
    switch (activeTab) {
      case 'my-books':
        baseBooks = myBooks
        break
      case 'all-books':
        baseBooks = allBooks
        break
      case 'favorites':
        baseBooks = favoriteBooks
        break
      default:
        baseBooks = myBooks
    }

    return baseBooks.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject
      const matchesDifficulty = selectedDifficulty === 'all' || book.difficulty === selectedDifficulty
      
      return matchesSearch && matchesSubject && matchesDifficulty
    }).sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!a.lastRead && !b.lastRead) return 0
          if (!a.lastRead) return 1
          if (!b.lastRead) return -1
          return new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        case 'progress':
          return b.progress - a.progress
        case 'rating':
          return b.rating - a.rating
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
  }

  const subjects = Array.from(new Set(books.map(b => b.subject)))

  const toggleFavorite = (bookId: string) => {
    setBooks(prev => 
      prev.map(book => 
        book.id === bookId ? {...book, isFavorite: !book.isFavorite} : book
      )
    )
  }

  const totalBooks = myBooks.length
  const averageProgress = Math.round(myBooks.reduce((sum, book) => sum + book.progress, 0) / myBooks.length)
  const completedBooks = myBooks.filter(book => book.progress === 100).length
  const totalReadingTime = myBooks.reduce((sum, book) => sum + (book.readingTime * book.progress / 100), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                내 도서관
              </h1>
            </div>
            <div className="flex items-center gap-2">
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">내 책</p>
                  <p className="text-2xl font-bold text-blue-600">{totalBooks}권</p>
                  <p className="text-xs text-gray-500">읽고 있는 책</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 진도</p>
                  <p className="text-2xl font-bold text-green-600">{averageProgress}%</p>
                  <p className="text-xs text-gray-500">전체 평균</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">완주한 책</p>
                  <p className="text-2xl font-bold text-purple-600">{completedBooks}권</p>
                  <p className="text-xs text-gray-500">100% 달성</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">읽은 시간</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.floor(totalReadingTime / 60)}h {Math.round(totalReadingTime % 60)}m
                  </p>
                  <p className="text-xs text-gray-500">총 누적</p>
                </div>
                <Timer className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-books">내 책 ({myBooks.length})</TabsTrigger>
            <TabsTrigger value="all-books">전체 도서 ({allBooks.length})</TabsTrigger>
            <TabsTrigger value="collections">컬렉션 ({collections.length})</TabsTrigger>
            <TabsTrigger value="favorites">즐겨찾기 ({favoriteBooks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6 mt-6">
            {activeTab !== 'collections' && (
              <>
                {/* Filters and Search */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="책 제목 검색..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        
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
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                        >
                          <option value="all">모든 난이도</option>
                          <option value="easy">쉬움</option>
                          <option value="medium">보통</option>
                          <option value="hard">어려움</option>
                        </select>
                      </div>
                      
                      <select
                        className="border rounded-md px-3 py-2 text-sm"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="recent">최근 읽은 순</option>
                        <option value="progress">진도율 순</option>
                        <option value="rating">평점 순</option>
                        <option value="alphabetical">가나다 순</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Books Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getTabBooks().map((book) => (
                      <Card key={book.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl mb-2">{book.thumbnail}</div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(book.id)}
                            >
                              <Heart className={`w-4 h-4 ${book.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <h3 className="font-semibold text-lg line-clamp-2">{book.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">{book.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary">{book.subject}</Badge>
                            <Badge variant="secondary">{book.grade}</Badge>
                            <Badge className={getDifficultyColor(book.difficulty)}>
                              {getDifficultyText(book.difficulty)}
                            </Badge>
                          </div>
                          
                          {book.isMyBook && book.progress > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>진행률</span>
                                <span>{book.progress}%</span>
                              </div>
                              <Progress value={book.progress} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">
                                {book.completedChapters}/{book.chapters}장 완료
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {book.rating} ({book.reviews})
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {book.readingTime}분
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="flex-1 gap-2">
                              {book.isMyBook ? (
                                <>
                                  <Play className="w-4 h-4" />
                                  {book.progress > 0 ? '계속 읽기' : '읽기 시작'}
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  내 책에 추가
                                </>
                              )}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {book.lastRead && (
                            <p className="text-xs text-gray-500 mt-3">
                              마지막 읽음: {new Date(book.lastRead).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {getTabBooks().map((book) => (
                          <div key={book.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-6">
                              <div className="text-3xl">{book.thumbnail}</div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{book.title}</h3>
                                  <Badge variant="secondary">{book.subject}</Badge>
                                  <Badge className={getDifficultyColor(book.difficulty)}>
                                    {getDifficultyText(book.difficulty)}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3">{book.description}</p>
                                
                                {book.isMyBook && book.progress > 0 && (
                                  <div className="mb-3">
                                    <Progress value={book.progress} className="h-2 mb-1" />
                                    <p className="text-xs text-gray-500">
                                      진행률: {book.progress}% ({book.completedChapters}/{book.chapters}장)
                                    </p>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {book.rating}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {book.readingTime}분
                                  </span>
                                  <span>{book.author} · {book.publisher}</span>
                                  {book.lastRead && (
                                    <span>마지막 읽음: {new Date(book.lastRead).toLocaleDateString('ko-KR')}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleFavorite(book.id)}
                                >
                                  <Heart className={`w-4 h-4 ${book.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2">
                                  <Eye className="w-4 h-4" />
                                  보기
                                </Button>
                                <Button size="sm" className="gap-2">
                                  <Play className="w-4 h-4" />
                                  {book.isMyBook ? '읽기' : '추가'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeTab === 'collections' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-3">{collection.thumbnail}</div>
                        <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                        <p className="text-sm text-gray-600">{collection.description}</p>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>완료율</span>
                          <span>{collection.completionRate}%</span>
                        </div>
                        <Progress value={collection.completionRate} className="h-2" />
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{collection.bookCount}권의 책</span>
                          <span>{collection.totalChapters}개 단원</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button className="flex-1 gap-2">
                          <BookOpen className="w-4 h-4" />
                          컬렉션 보기
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}