'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Edit, 
  Share2,
  Download,
  BookOpen, 
  Users, 
  Calendar,
  Globe,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { PDFViewer } from '@/components/multimedia/PDFViewer'

interface TextbookData {
  id: string
  title: string
  description?: string
  content?: any
  metadata?: {
    subject?: string
    grade?: string
  }
  isPublic: boolean
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  author: {
    user: {
      name: string
      email: string
    }
  }
  pages?: Array<{
    id: string
    pageNumber: number
    title: string
    content: any
  }>
  classes?: Array<{
    class: {
      id: string
      name: string
    }
  }>
}

export default function TextbookViewPage() {
  const router = useRouter()
  const params = useParams()
  const textbookId = params.id as string

  const [textbook, setTextbook] = useState<TextbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (textbookId) {
      fetchTextbook()
    }
  }, [textbookId])

  const fetchTextbook = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getTextbook(textbookId)
      
      if (response.data) {
        setTextbook(response.data)
        
        // Check if textbook has an associated file
        if (response.data.content?.fileId) {
          const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/files/${response.data.content.fileId}/serve`
          setFileUrl(fileUrl)
        }
      } else if (response.error) {
        setError(response.error.message || 'Failed to load textbook')
      }
    } catch (error) {
      console.error('Failed to fetch textbook:', error)
      setError(error instanceof Error ? error.message : 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/textbooks/${textbookId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTextbook(prev => prev ? { ...prev, isPublic: true } : null)
      } else {
        throw new Error('Failed to publish textbook')
      }
    } catch (error) {
      console.error('Failed to share textbook:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="w-full h-96 rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Textbook</AlertTitle>
            <AlertDescription className="mt-2">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={fetchTextbook}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!textbook) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Textbook Not Found</AlertTitle>
            <AlertDescription>
              The textbook you're looking for doesn't exist or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-4 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/teacher/textbooks')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Textbooks
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{textbook.title}</h1>
              <p className="text-gray-600 mb-4">{textbook.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {textbook.metadata?.subject || 'Unknown Subject'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {textbook.metadata?.grade || 'Unknown Grade'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(textbook.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
              {textbook.aiGenerated && (
                <Badge variant="outline">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI 생성
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  교과서 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fileUrl ? (
                  <div className="space-y-4">
                    <PDFViewer
                      fileUrl={fileUrl}
                      fileName={textbook.title}
                    />
                  </div>
                ) : textbook.content ? (
                  <div className="prose max-w-none">
                    {typeof textbook.content === 'string' ? (
                      <div className="whitespace-pre-wrap">
                        {textbook.content}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {textbook.content.chapters?.map((chapter: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h3 className="text-lg font-semibold mb-2">{chapter.title}</h3>
                            <p className="text-gray-700">{chapter.content}</p>
                          </div>
                        )) || (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">교과서 내용이 준비 중입니다.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">교과서 내용이 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/teacher/textbooks/${textbook.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  편집하기
                </Button>
                
                {!textbook.isPublic && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    공개하기
                  </Button>
                )}
                
                {fileUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>상세 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">저자</label>
                  <p className="text-sm">{textbook.author.user.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">생성일</label>
                  <p className="text-sm">{new Date(textbook.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">수정일</label>
                  <p className="text-sm">{new Date(textbook.updatedAt).toLocaleDateString('ko-KR')}</p>
                </div>
                
                {textbook.pages && textbook.pages.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">페이지 수</label>
                    <p className="text-sm">{textbook.pages.length}개</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Classes */}
            {textbook.classes && textbook.classes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>연결된 클래스</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {textbook.classes.map((classItem) => (
                      <div
                        key={classItem.class.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{classItem.class.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}