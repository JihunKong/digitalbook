'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { EnhancedFileUpload } from '@/components/multimedia/EnhancedFileUpload'
import { 
  FileText, 
  Upload, 
  Settings, 
  Sparkles,
  BookOpen,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
  HelpCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'

export default function CreateTextbookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '국어',
    gradeLevel: 2,
    content: '',
    description: '',
    targetPageLength: 500,
    generateImages: true,
    generateQuestions: true,
    questionDifficulty: 'medium',
  })
  
  const [analysisResult, setAnalysisResult] = useState<{
    totalWords: number;
    totalChars: number;
    estimatedPages: number;
    sections: Array<{
      title: string;
      content: string;
      startIndex: number;
      endIndex: number;
      estimatedReadTime: number;
    }>;
    difficulty: string;
    topics: string[];
  } | null>(null)

  const steps = [
    { number: 1, title: '기본 정보', icon: BookOpen },
    { number: 2, title: '텍스트 입력', icon: FileText },
    { number: 3, title: 'AI 설정', icon: Settings },
    { number: 4, title: '미리보기', icon: Sparkles },
  ]

  const handleNext = async () => {
    if (currentStep === 3 && !analysisResult) {
      // Perform analysis when moving to preview step
      setIsProcessing(true);
      try {
        const analysis = await analyzeContent();
        setAnalysisResult(analysis);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        toast({
          title: '분석 오류',
          description: '텍스트 분석 중 문제가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const analyzeContent = async () => {
    if (!formData.content.trim()) return null;
    
    // Simulate AI analysis
    const words = formData.content.split(/\s+/).length;
    const chars = formData.content.length;
    const estimatedPages = Math.ceil(chars / formData.targetPageLength);
    
    // Create suggested sections based on content length
    const sectionsPerPage = Math.max(1, Math.floor(words / (estimatedPages * 100)));
    const sections = [];
    
    for (let i = 0; i < estimatedPages; i++) {
      const startChar = Math.floor((chars / estimatedPages) * i);
      const endChar = Math.floor((chars / estimatedPages) * (i + 1));
      sections.push({
        title: `페이지 ${i + 1}: ${i === 0 ? '도입' : i === estimatedPages - 1 ? '정리' : '본문'}`,
        content: formData.content.substring(startChar, endChar),
        startIndex: startChar,
        endIndex: endChar,
        estimatedReadTime: Math.ceil((endChar - startChar) / 200) // chars per minute
      });
    }
    
    return {
      totalWords: words,
      totalChars: chars,
      estimatedPages,
      sections,
      difficulty: chars > 2000 ? 'hard' : chars > 1000 ? 'medium' : 'easy',
      topics: extractTopics(formData.content)
    };
  };
  
  const extractTopics = (content: string) => {
    // Simple keyword extraction simulation
    const commonWords = ['한글', '언어', '문학', '글쓰기', '읽기', '문법', '표현'];
    return commonWords.filter(word => content.includes(word)).slice(0, 5);
  };

  const handleSubmit = async () => {
    setIsProcessing(true)
    
    try {
      // 필수 필드 검증
      if (!formData.title || !formData.content) {
        toast({
          title: '필수 항목 누락',
          description: '제목과 텍스트를 입력해주세요.',
          variant: 'destructive',
        })
        return
      }

      // AI 설정 구성
      const aiSettings = {
        difficulty: formData.questionDifficulty,
        includeExercises: formData.generateQuestions,
        includeImages: formData.generateImages,
        targetPageLength: formData.targetPageLength
      }

      // 교과서 생성
      const newTextbook = await apiClient.createTextbook({
        title: formData.title,
        subject: formData.subject,
        grade: formData.gradeLevel,
        description: formData.description,
        content: formData.content,
        aiSettings
      })
      
      toast({
        title: '교재 생성 완료',
        description: '새로운 교재가 성공적으로 생성되었습니다.',
      })
      
      // 생성된 교과서 편집 페이지로 이동
      const textbookData = newTextbook.data as { id?: string }
      if (textbookData?.id) {
        router.push(`/teacher/textbooks/${textbookData.id}/edit`)
      } else {
        router.push('/teacher/textbooks')
      }
    } catch (error: any) {
      console.error('Textbook creation error:', error)
      toast({
        title: '오류 발생',
        description: error.message || '교재 생성 중 문제가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">새 교재 만들기</h1>
          <p className="text-gray-600">AI가 텍스트를 분석하여 최적의 디지털 교재를 생성합니다</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`ml-3 font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="title">교재 제목</Label>
                  <Input
                    id="title"
                    placeholder="예: 현대문학의 이해"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">과목</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="국어">국어</SelectItem>
                      <SelectItem value="문학">문학</SelectItem>
                      <SelectItem value="화법과작문">화법과 작문</SelectItem>
                      <SelectItem value="언어와매체">언어와 매체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gradeLevel">학년</Label>
                  <Select
                    value={formData.gradeLevel.toString()}
                    onValueChange={(value) => setFormData({ ...formData, gradeLevel: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1학년</SelectItem>
                      <SelectItem value="2">2학년</SelectItem>
                      <SelectItem value="3">3학년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">교재 설명 (선택사항)</Label>
                  <Textarea
                    id="description"
                    placeholder="교재에 대한 간단한 설명을 입력하세요"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="content">교재 내용</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    텍스트를 직접 입력하거나 파일을 업로드하세요
                  </p>
                  <Textarea
                    id="content"
                    placeholder="교재 내용을 입력하세요..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="mt-1 min-h-[400px] font-mono text-sm"
                  />
                </div>

                <div className="mt-4">
                  <Label>파일 업로드</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    PDF, TXT, DOCX 파일을 업로드하여 내용을 자동으로 불러올 수 있습니다
                  </p>
                  <EnhancedFileUpload
                    acceptedTypes={['.pdf', '.txt', '.docx', '.doc', 'application/pdf', 'text/plain', 
                                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                   'application/msword']}
                    maxFileSize={50}
                    maxFiles={1}
                    onUploadComplete={(files) => {
                      // Handle file upload and extract text content
                      if (files.length > 0) {
                        const file = files[0];
                        const extractedText = (file as any).extractedText;
                        
                        if (extractedText) {
                          // Update the content field with extracted text
                          setFormData(prev => ({
                            ...prev,
                            content: extractedText
                          }));
                          
                          toast({
                            title: '파일 업로드 완료',
                            description: `${file.name} 파일에서 텍스트를 성공적으로 추출했습니다.`,
                          });
                        } else {
                          toast({
                            title: '파일 업로드 완료',
                            description: `${file.name} 파일이 업로드되었습니다.`,
                          });
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label>페이지당 글자 수</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    학생이 한 번에 읽기 적절한 분량으로 설정하세요
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.targetPageLength]}
                      onValueChange={([value]) => setFormData({ ...formData, targetPageLength: value })}
                      min={300}
                      max={1000}
                      step={50}
                      className="flex-1"
                    />
                    <span className="w-20 text-right font-medium">
                      {formData.targetPageLength}자
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <Label>AI 이미지 생성</Label>
                        <p className="text-sm text-gray-600">
                          각 페이지에 맞는 이미지를 자동 생성합니다
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.generateImages}
                      onCheckedChange={(checked) => setFormData({ ...formData, generateImages: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <Label>학습 문제 생성</Label>
                        <p className="text-sm text-gray-600">
                          내용 이해를 위한 문제를 자동 생성합니다
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.generateQuestions}
                      onCheckedChange={(checked) => setFormData({ ...formData, generateQuestions: checked })}
                    />
                  </div>
                </div>

                {formData.generateQuestions && (
                  <div>
                    <Label>문제 난이도</Label>
                    <Select
                      value={formData.questionDifficulty}
                      onValueChange={(value) => setFormData({ ...formData, questionDifficulty: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">쉬움</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="hard">어려움</SelectItem>
                        <SelectItem value="mixed">혼합</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 4 && analysisResult && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">AI 분석 결과</h3>
                  <p className="text-gray-600">생성될 교재의 구조를 확인하세요</p>
                </div>

                {/* Analysis Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisResult.totalWords}</p>
                      <p className="text-sm text-gray-600">총 단어</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisResult.estimatedPages}</p>
                      <p className="text-sm text-gray-600">예상 페이지</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisResult.sections.length}</p>
                      <p className="text-sm text-gray-600">학습 섹션</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Settings className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className={`text-lg font-bold px-2 py-1 rounded ${
                        analysisResult.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        analysisResult.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysisResult.difficulty === 'easy' ? '쉬움' :
                         analysisResult.difficulty === 'medium' ? '보통' : '어려움'}
                      </p>
                      <p className="text-sm text-gray-600">난이도</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Section Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>페이지 구성 미리보기</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.sections.map((section, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{section.title}</h4>
                            <span className="text-sm text-gray-600">
                              {section.estimatedReadTime}분 읽기
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {section.content.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Topics */}
                {analysisResult.topics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>추출된 주요 주제</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.topics.map((topic, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generation Settings Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>생성 설정</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">이미지 생성</p>
                        <p className={formData.generateImages ? 'text-green-600' : 'text-gray-600'}>
                          {formData.generateImages ? '활성화' : '비활성화'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">문제 생성</p>
                        <p className={formData.generateQuestions ? 'text-green-600' : 'text-gray-600'}>
                          {formData.generateQuestions ? `활성화 (${formData.questionDifficulty})` : '비활성화'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isProcessing}
          >
            이전
          </Button>
          
          {currentStep < steps.length ? (
            <Button 
              onClick={handleNext}
              disabled={isProcessing || (currentStep === 3 && !formData.content.trim())}
            >
              {isProcessing && currentStep === 3 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  분석 중...
                </>
              ) : (
                '다음'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !formData.title || !formData.content}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  교재 생성하기
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}