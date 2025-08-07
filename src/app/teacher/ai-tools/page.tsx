'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft,
  Sparkles,
  FileText,
  PenTool,
  BookOpen,
  MessageSquare,
  Image,
  Mic,
  Video,
  BarChart3,
  Zap,
  Download,
  Copy,
  RefreshCw,
  Play,
  Settings,
  Lightbulb,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface AITool {
  id: string
  name: string
  description: string
  category: 'content' | 'assessment' | 'analysis' | 'multimedia'
  icon: any
  status: 'available' | 'premium' | 'coming-soon'
  usage: number
  maxUsage: number
}

interface GeneratedContent {
  id: string
  type: string
  title: string
  content: string
  timestamp: string
}

export default function TeacherAIToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('tools')
  
  const aiTools: AITool[] = [
    {
      id: 'content-generator',
      name: '교육 콘텐츠 생성기',
      description: '주제에 맞는 교육 자료와 설명을 자동으로 생성합니다',
      category: 'content',
      icon: FileText,
      status: 'available',
      usage: 45,
      maxUsage: 100
    },
    {
      id: 'question-generator',
      name: '문제 생성기',
      description: '다양한 유형의 문제와 퀴즈를 자동으로 만들어줍니다',
      category: 'assessment',
      icon: Target,
      status: 'available',
      usage: 23,
      maxUsage: 50
    },
    {
      id: 'lesson-planner',
      name: '수업 계획 도우미',
      description: '교육 목표에 따른 체계적인 수업 계획을 수립해줍니다',
      category: 'content',
      icon: BookOpen,
      status: 'available',
      usage: 12,
      maxUsage: 30
    },
    {
      id: 'writing-evaluator',
      name: '글쓰기 평가기',
      description: '학생의 작문을 분석하고 개선점을 제안합니다',
      category: 'assessment',
      icon: PenTool,
      status: 'available',
      usage: 8,
      maxUsage: 40
    },
    {
      id: 'image-generator',
      name: '교육용 이미지 생성',
      description: '교육 자료에 활용할 맞춤 이미지를 생성합니다',
      category: 'multimedia',
      icon: Image,
      status: 'premium',
      usage: 0,
      maxUsage: 20
    },
    {
      id: 'voice-generator',
      name: '음성 생성기',
      description: '텍스트를 자연스러운 음성으로 변환합니다',
      category: 'multimedia',
      icon: Mic,
      status: 'available',
      usage: 5,
      maxUsage: 25
    },
    {
      id: 'analytics-assistant',
      name: '학습 분석 도우미',
      description: '학생 성취도 데이터를 분석하고 인사이트를 제공합니다',
      category: 'analysis',
      icon: BarChart3,
      status: 'available',
      usage: 3,
      maxUsage: 15
    },
    {
      id: 'video-summarizer',
      name: '영상 요약기',
      description: '교육 영상의 핵심 내용을 요약해줍니다',
      category: 'multimedia',
      icon: Video,
      status: 'coming-soon',
      usage: 0,
      maxUsage: 10
    }
  ]

  const mockGeneratedContent: GeneratedContent[] = [
    {
      id: '1',
      type: '교육 콘텐츠',
      title: '한글의 역사와 의미',
      content: '한글은 1443년 세종대왕이 창제한 우리나라 고유의 문자입니다. 당시에는 "훈민정음"이라고 불렸으며...',
      timestamp: '2024-01-20 14:30'
    },
    {
      id: '2',
      type: '문제 생성',
      title: '국어 이해 문제 5개',
      content: '1. 다음 중 한글을 창제한 임금은? ① 태종 ② 세종 ③ 문종 ④ 단종\n2. 훈민정음의 뜻은?...',
      timestamp: '2024-01-20 15:15'
    }
  ]

  const handleGenerate = async () => {
    if (!selectedTool || !inputText.trim()) return
    
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      const tool = aiTools.find(t => t.id === selectedTool)
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: tool?.name || '',
        title: `${tool?.name} 결과`,
        content: `입력: "${inputText}"\n\n생성된 내용:\n이것은 AI가 생성한 샘플 콘텐츠입니다. 실제 구현에서는 OpenAI API를 통해 실제 콘텐츠가 생성됩니다.`,
        timestamp: new Date().toLocaleString('ko-KR')
      }
      
      setGeneratedContent(prev => [newContent, ...prev])
      setInputText('')
      setIsGenerating(false)
    }, 2000)
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content': return 'bg-blue-100 text-blue-800'
      case 'assessment': return 'bg-green-100 text-green-800'
      case 'analysis': return 'bg-purple-100 text-purple-800'
      case 'multimedia': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'premium': return 'bg-yellow-100 text-yellow-800'
      case 'coming-soon': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '사용 가능'
      case 'premium': return '프리미엄'
      case 'coming-soon': return '준비중'
      default: return status
    }
  }

  useEffect(() => {
    setGeneratedContent(mockGeneratedContent)
  }, [])

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
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI 도구
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                AI 크레딧: 850/1000
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">AI 도구</TabsTrigger>
            <TabsTrigger value="history">생성 기록</TabsTrigger>
            <TabsTrigger value="tips">사용 팁</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* AI Tools List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid gap-4">
                  {aiTools.map((tool) => {
                    const Icon = tool.icon
                    const usagePercentage = (tool.usage / tool.maxUsage) * 100
                    
                    return (
                      <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTool === tool.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedTool(tool.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Icon className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{tool.name}</h3>
                                  <Badge className={getCategoryColor(tool.category)}>
                                    {tool.category}
                                  </Badge>
                                  <Badge className={getStatusColor(tool.status)}>
                                    {getStatusText(tool.status)}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{tool.description}</p>
                                
                                {tool.status === 'available' && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>사용량</span>
                                      <span>{tool.usage}/{tool.maxUsage}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-purple-600 h-2 rounded-full"
                                        style={{ width: `${usagePercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {tool.status === 'available' && (
                              <Button size="sm" className="gap-2">
                                <Play className="w-4 h-4" />
                                사용
                              </Button>
                            )}
                            
                            {tool.status === 'premium' && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <Zap className="w-4 h-4" />
                                업그레이드
                              </Button>
                            )}
                            
                            {tool.status === 'coming-soon' && (
                              <Button size="sm" variant="outline" disabled>
                                준비중
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* AI Tool Interface */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI 도구 사용</CardTitle>
                    <CardDescription>
                      왼쪽에서 도구를 선택하고 내용을 입력하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTool ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            입력 내용
                          </label>
                          <Textarea
                            placeholder="생성하고 싶은 내용에 대해 자세히 설명해주세요..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={6}
                          />
                        </div>
                        
                        <Button
                          onClick={handleGenerate}
                          disabled={!inputText.trim() || isGenerating}
                          className="w-full gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              생성 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              AI로 생성하기
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>왼쪽에서 사용할 AI 도구를 선택해주세요</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">오늘의 AI 활용</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">콘텐츠 생성</span>
                        <span className="font-semibold">12회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">문제 생성</span>
                        <span className="font-semibold">8회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 절약 시간</span>
                        <span className="font-semibold text-green-600">2시간 30분</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>생성 기록</CardTitle>
                <CardDescription>
                  최근 AI로 생성한 콘텐츠들을 확인하고 재사용할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedContent.map((content) => (
                    <div key={content.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{content.type}</Badge>
                          <h3 className="font-semibold">{content.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {content.timestamp}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {content.content.length > 200 
                            ? content.content.substring(0, 200) + '...'
                            : content.content
                          }
                        </pre>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(content.content)}
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          복사
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="w-4 h-4" />
                          내보내기
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <FileText className="w-4 h-4" />
                          전체보기
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    효과적인 AI 활용 팁
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">구체적으로 요청하기</h4>
                      <p className="text-sm text-gray-600">
                        "3학년 대상 한글 창제 원리를 설명하는 200자 내외의 교육 자료"처럼 구체적으로 요청하세요.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">단계적 접근</h4>
                      <p className="text-sm text-gray-600">
                        복잡한 내용은 여러 단계로 나누어 생성하면 더 좋은 결과를 얻을 수 있습니다.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">검토하고 수정하기</h4>
                      <p className="text-sm text-gray-600">
                        AI가 생성한 내용은 항상 검토하고 필요시 수정하여 사용하세요.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    주의사항
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">내용 검증 필요</h4>
                      <p className="text-sm text-gray-600">
                        AI가 생성한 내용의 정확성을 항상 확인하고 검증하세요.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">개인정보 보호</h4>
                      <p className="text-sm text-gray-600">
                        학생들의 개인정보가 포함된 내용은 AI 도구에 입력하지 마세요.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">저작권 확인</h4>
                      <p className="text-sm text-gray-600">
                        생성된 이미지나 텍스트의 저작권 관련 이슈를 확인하세요.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}