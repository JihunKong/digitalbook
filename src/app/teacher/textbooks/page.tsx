'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TeacherDemoTour } from '@/components/demo/TeacherDemoTour'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  BookOpen, 
  Users, 
  Eye, 
  Edit, 
  Copy,
  MoreVertical,
  Calendar,
  ChevronRight,
  Sparkles,
  Globe,
  Lock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Textbook {
  id: string
  title: string
  subject: string
  grade: string
  isPublic: boolean
  coverImage?: string
  chapters: number
  students: number
  lastModified: string
  createdAt: string
  aiGenerated: boolean
}

export default function TeacherTextbooksPage() {
  const router = useRouter()
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchTextbooks()
  }, [])

  const fetchTextbooks = async () => {
    try {
      const response = await fetch('/api/textbooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTextbooks(data.textbooks || [])
      }
    } catch (error) {
      console.error('Failed to fetch textbooks:', error)
      // 데모 데이터
      setTextbooks([
        {
          id: '1',
          title: '3학년 1학기 국어',
          subject: '국어',
          grade: '3학년',
          isPublic: true,
          chapters: 8,
          students: 25,
          lastModified: '2024-01-15',
          createdAt: '2024-01-10',
          aiGenerated: true
        },
        {
          id: '2',
          title: '수학의 즐거움',
          subject: '수학',
          grade: '3학년',
          isPublic: false,
          chapters: 10,
          students: 23,
          lastModified: '2024-01-14',
          createdAt: '2024-01-05',
          aiGenerated: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (textbook: Textbook) => {
    try {
      const response = await fetch(`/api/textbooks/${textbook.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        fetchTextbooks()
      }
    } catch (error) {
      console.error('Failed to duplicate textbook:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherDemoTour />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div id="welcome">
              <h1 className="text-2xl font-bold text-gray-900">내 교과서</h1>
              <p className="mt-1 text-sm text-gray-600">
                AI로 만든 디지털 교과서를 관리하고 학생들과 공유하세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/explore">
                <Button variant="outline">
                  <Globe className="w-4 h-4 mr-2" />
                  공개 교과서 둘러보기
                </Button>
              </Link>
              <Link href="/teacher/textbooks/create">
                <Button id="create-textbook-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  새 교과서 만들기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 교과서</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{textbooks.length}</div>
              <p className="text-xs text-muted-foreground">AI 생성 {textbooks.filter(t => t.aiGenerated).length}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {textbooks.reduce((sum, t) => sum + t.students, 0)}
              </div>
              <p className="text-xs text-muted-foreground">활성 사용자</p>
            </CardContent>
          </Card>
          <Card id="ai-features">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI 기능</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">활성화</div>
              <p className="text-xs text-muted-foreground">콘텐츠 생성, 평가 도구</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Textbooks Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div id="textbook-list" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {textbooks.map((textbook) => (
            <Card key={textbook.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{textbook.title}</CardTitle>
                    <CardDescription>
                      {textbook.subject} · {textbook.grade}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/teacher/textbooks/${textbook.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        편집
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(textbook)}>
                        <Copy className="mr-2 h-4 w-4" />
                        복제
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Cover Image Placeholder */}
                  <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-blue-600 opacity-50" />
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        {textbook.chapters}개 단원
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        {textbook.students}명
                      </span>
                    </div>
                    <Badge variant={textbook.isPublic ? 'default' : 'secondary'}>
                      {textbook.isPublic ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          공개
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          비공개
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex gap-2">
                    {textbook.aiGenerated && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI 생성
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(textbook.lastModified).toLocaleDateString('ko-KR')}
                    </Badge>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => router.push(`/teacher/textbooks/${textbook.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      미리보기
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/teacher/textbooks/${textbook.id}/edit`)}
                    >
                      편집하기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add New Card */}
          <Card className="border-dashed border-2 hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => router.push('/teacher/textbooks/create')}>
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">새 교과서 만들기</h3>
              <p className="text-sm text-gray-600">AI가 교육과정에 맞춰 자동으로 생성해드립니다</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}