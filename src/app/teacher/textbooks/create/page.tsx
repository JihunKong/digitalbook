'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
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
import { SecurePDFViewer } from '@/components/multimedia/SecurePDFViewer'
import { ConceptReviewPanel } from '@/components/concepts/review/ConceptReviewPanel'
import { useConceptReviewStore } from '@/stores/conceptReviewStore'
import {
  FileText,
  Upload,
  Settings,
  Sparkles,
  BookOpen,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
  HelpCircle,
  Type,
  File as FileIcon,
  Layers,
  Brain
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'

export default function CreateTextbookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 4단계에서 isProcessing 상태 디버깅
  useEffect(() => {
    if (currentStep === 4) {
      console.log('🟦 STEP 4 - isProcessing state:', isProcessing);
    }
  }, [currentStep, isProcessing]);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '국어',
    gradeLevel: 2,
    content: '',
    description: '',
    contentType: 'TEXT' as 'TEXT' | 'FILE' | 'MIXED',
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

  const [uploadedFile, setUploadedFile] = useState<{
    id: string;
    url: string;
    name: string;
    type: string;
  } | null>(null)

  // Concept extraction state
  const [isExtractingConcepts, setIsExtractingConcepts] = useState(false)
  const [conceptsExtracted, setConceptsExtracted] = useState(false)
  const [tempTextbookId, setTempTextbookId] = useState<string | null>(null)
  const {
    concepts,
    extractionStatus,
    setTextbookId,
    setConcepts,
    reset: resetConceptStore
  } = useConceptReviewStore()

  // Stable callback for file upload completion
  const handleUploadComplete = useCallback(async (files: Array<{ id: string; url: string; type: string; name: string; extractedText?: string }>) => {
    console.log('🔥 Upload complete callback received:', files);
    
    // Handle file upload and extract text content
    if (files.length > 0) {
      const file = files[0];
      const extractedText = file.extractedText;
      
      console.log('🔥 Extracted text length:', extractedText?.length || 0);
      console.log('🔥 File object keys:', Object.keys(file));
      
      // Store uploaded file info for PDF viewer - ALWAYS set this regardless of content type
      const uploadedFileInfo = {
        id: file.id,
        url: file.url,
        name: file.name,
        type: file.type
      };
      
      console.log('🔥 Setting uploadedFile state:', uploadedFileInfo);
      setUploadedFile(uploadedFileInfo);
      
      // Add debug log to check state after update
      setTimeout(() => {
        console.log('🔥 uploadedFile state after update:', uploadedFileInfo);
      }, 100);
      
      // If extracted text is available, call AI analysis
      let aiAnalysis = null;
      if (extractedText && extractedText.trim() && extractedText.length > 100) {
        try {
          console.log('🧠 Requesting AI analysis for extracted text...');
          const analysisResponse = await apiClient.analyzePDFMetadata({
            extractedText: extractedText,
            fileName: file.name
          });
          
          if (analysisResponse.data) {
            aiAnalysis = analysisResponse.data;
            console.log('🧠 AI analysis result:', aiAnalysis);
            
            toast({
              title: '🧠 AI 분석 완료',
              description: `파일을 분석하여 교과서 정보를 자동으로 채웠습니다.`,
            });
          }
        } catch (error) {
          console.error('AI analysis failed:', error);
          // Don't show error toast, just continue without AI analysis
        }
      }
      
      // Get current content type for conditional logic
      setFormData(prev => {
        const currentContentType = prev.contentType;
        console.log('🔥 Current content type:', currentContentType);
        
        // TEXT 모드와 FILE 모드 모두에서 추출된 텍스트를 content 필드에 설정
        // MIXED 모드에서도 기본 콘텐츠로 사용
        if (extractedText && extractedText.trim()) {
          console.log('🔥 Setting formData.content with extracted text for', currentContentType, 'mode');
          
          const newFormData = {
            ...prev,
            content: extractedText
          };
          
          // Apply AI analysis results if available
          if (aiAnalysis) {
            if (aiAnalysis.title && !prev.title.trim()) {
              newFormData.title = aiAnalysis.title;
            }
            if (aiAnalysis.subject && prev.subject === '국어') { // Only update if still default
              newFormData.subject = aiAnalysis.subject;
            }
            if (aiAnalysis.grade && prev.gradeLevel === 2) { // Only update if still default
              newFormData.gradeLevel = parseInt(aiAnalysis.grade) || 2;
            }
            if (aiAnalysis.description && !prev.description.trim()) {
              newFormData.description = aiAnalysis.description;
            }
          }
          
          if (!aiAnalysis) {
            toast({
              title: '파일 업로드 완료',
              description: `${file.name} 파일에서 텍스트를 성공적으로 추출했습니다. (${extractedText.length}자)`,
            });
          }
          
          return newFormData;
        } else {
          console.log('🔥 No extracted text available, keeping existing content');
          
          toast({
            title: '파일 업로드 완료',
            description: `${file.name} 파일이 성공적으로 업로드되었습니다.`,
          });
          
          return prev; // No content change if no extracted text
        }
      });
    } else {
      console.log('🔥 No files in callback!');
    }
  }, [toast]) // Remove contentType dependency to avoid stale closure

  const steps = [
    { number: 1, title: '기본 정보', icon: BookOpen },
    { number: 2, title: '콘텐츠 타입', icon: Layers },
    { number: 3, title: '콘텐츠 입력', icon: FileText },
    { number: 4, title: '개념 추출', icon: Brain },
    { number: 5, title: 'AI 설정', icon: Settings },
    { number: 6, title: '미리보기', icon: Sparkles },
  ]

  const handleNext = async () => {
    console.log('handleNext called:', {
      currentStep,
      contentType: formData.contentType,
      contentLength: formData.content.length,
      uploadedFile: uploadedFile,
      hasUploadedFile: !!uploadedFile
    });

    if (currentStep === 5 && !analysisResult) {
      // Perform analysis when moving to preview step (Step 6)
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
    console.log('🔍 Analyzing content:', {
      contentType: formData.contentType,
      hasContent: !!formData.content.trim(),
      hasUploadedFile: !!uploadedFile,
      uploadedFileName: uploadedFile?.name
    });

    // FILE 전용 모드에서는 업로드된 파일 정보 기반 분석
    if (formData.contentType === 'FILE' && uploadedFile) {
      console.log('📄 Creating FILE mode analysis result');
      return {
        totalWords: 0,
        totalChars: 0,
        estimatedPages: 1,
        sections: [{
          title: `파일: ${uploadedFile.name}`,
          content: `파일 기반 콘텐츠 (${uploadedFile.type})`,
          startIndex: 0,
          endIndex: 0,
          estimatedReadTime: 5
        }],
        difficulty: 'medium',
        topics: ['파일 콘텐츠']
      };
    }

    // 텍스트 콘텐츠가 없으면 기본 분석 결과 반환
    if (!formData.content.trim()) {
      console.log('📝 No content available, returning default analysis');
      return {
        totalWords: 0,
        totalChars: 0,
        estimatedPages: 1,
        sections: [{
          title: '기본 콘텐츠',
          content: '콘텐츠가 설정되지 않았습니다.',
          startIndex: 0,
          endIndex: 0,
          estimatedReadTime: 1
        }],
        difficulty: 'easy',
        topics: ['기본']
      };
    }
    
    // 텍스트 기반 분석
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

  const handleExtractConcepts = async () => {
    if (!formData.content.trim()) {
      toast({
        title: '콘텐츠 없음',
        description: '개념을 추출할 콘텐츠가 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setIsExtractingConcepts(true)

    try {
      // Generate a valid UUID for the textbook
      const tempId = uuidv4()
      setTempTextbookId(tempId)
      setTextbookId(tempId)

      // Truncate text if it exceeds the backend limit
      const MAX_CONCEPT_EXTRACTION_LENGTH = 50000
      const textToExtract = formData.content.substring(0, MAX_CONCEPT_EXTRACTION_LENGTH)

      // Warn user if text was truncated
      if (formData.content.length > MAX_CONCEPT_EXTRACTION_LENGTH) {
        toast({
          title: '텍스트 길이 제한',
          description: `전체 ${formData.content.length.toLocaleString()}자 중 처음 ${MAX_CONCEPT_EXTRACTION_LENGTH.toLocaleString()}자만 분석합니다.`,
          variant: 'default',
        })
      }

      toast({
        title: '개념 추출 시작',
        description: 'AI가 콘텐츠에서 개념을 추출하고 있습니다...',
      })

      // Call concept extraction API
      const response = await apiClient.extractConcepts({
        textbookId: tempId,
        text: textToExtract,
        subject: formData.subject,
        grade: formData.gradeLevel,
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      if (response.data) {
        const extractedConcepts = Array.isArray(response.data)
          ? response.data
          : (response.data as any).concepts || []

        setConcepts(extractedConcepts)
        setConceptsExtracted(true)

        toast({
          title: '개념 추출 완료',
          description: `${extractedConcepts.length}개의 개념이 추출되었습니다.`,
        })
      }
    } catch (error) {
      console.error('Concept extraction error:', error)
      toast({
        title: '개념 추출 실패',
        description: error instanceof Error ? error.message : '개념 추출 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsExtractingConcepts(false)
    }
  }

  const handleSkipConceptExtraction = () => {
    setConceptsExtracted(true)
    toast({
      title: '개념 추출 건너뛰기',
      description: '개념 추출을 건너뛰었습니다. 나중에 추가할 수 있습니다.',
    })
  }

  const [creationProgress, setCreationProgress] = useState({
    step: '',
    message: '',
    progress: 0
  })

  const handleSubmit = async () => {
    setIsProcessing(true)
    setCreationProgress({ step: 'validating', message: '입력 데이터를 검증하고 있습니다...', progress: 10 })
    
    try {
      // 필수 필드 검증
      if (!formData.title) {
        toast({
          title: '필수 항목 누락',
          description: '제목을 입력해주세요.',
          variant: 'destructive',
        })
        return
      }

      if (formData.contentType !== 'FILE' && !formData.content.trim()) {
        toast({
          title: '필수 항목 누락',
          description: '콘텐츠를 입력해주세요.',
          variant: 'destructive',
        })
        return
      }

      if (formData.contentType === 'FILE' && !uploadedFile) {
        toast({
          title: '필수 항목 누락',
          description: '파일을 업로드해주세요.',
          variant: 'destructive',
        })
        return
      }

      setCreationProgress({ step: 'preparing', message: '교과서 데이터를 준비하고 있습니다...', progress: 30 })

      // AI 설정 구성
      const aiSettings = {
        difficulty: formData.questionDifficulty,
        includeExercises: formData.generateQuestions,
        includeImages: formData.generateImages,
        targetPageLength: formData.targetPageLength
      }

      // 교과서 생성 데이터 구성
      const textbookData = {
        title: formData.title,
        subject: formData.subject,
        grade: formData.gradeLevel,
        description: formData.description,
        contentType: formData.contentType,
        content: formData.content,
        fileId: uploadedFile?.id,
        aiSettings
      }

      setCreationProgress({ step: 'creating', message: '교과서를 생성하고 있습니다...', progress: 50 })

      // 교과서 생성
      const newTextbook = await apiClient.createTextbook(textbookData)
      
      setCreationProgress({ step: 'ai-generating', message: 'AI가 콘텐츠를 생성하고 있습니다...', progress: 80 })
      
      // AI 생성이 활성화된 경우 잠깐 대기 (백그라운드에서 처리됨)
      if (formData.generateQuestions || formData.generateImages) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      setCreationProgress({ step: 'complete', message: '교과서 생성이 완료되었습니다!', progress: 100 })
      
      toast({
        title: '교재 생성 완료',
        description: '새로운 교재가 성공적으로 생성되었습니다.',
      })
      
      // 생성된 교과서 미리보기 페이지로 이동
      const textbookResponse = newTextbook.data as { id?: string }
      if (textbookResponse?.id) {
        router.push(`/teacher/textbooks/${textbookResponse.id}`)
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
      setCreationProgress({ step: '', message: '', progress: 0 })
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
          <p className="text-gray-600">AI가 콘텐츠를 분석하여 최적의 디지털 교재를 생성합니다</p>
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
                  <Label>콘텐츠 타입 선택</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    교재의 콘텐츠 구성 방식을 선택하세요
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        type: 'TEXT' as const,
                        icon: Type,
                        title: '텍스트 전용',
                        description: '순수 텍스트 콘텐츠로만 구성',
                        example: '텍스트 기반 설명, 이론, 개념 정리'
                      },
                      {
                        type: 'FILE' as const,
                        icon: FileIcon,
                        title: '파일 전용',
                        description: 'PDF, 이미지, 동영상 등 파일 중심',
                        example: 'PDF 문서, 이미지 자료, 동영상 강의'
                      },
                      {
                        type: 'MIXED' as const,
                        icon: Layers,
                        title: '혼합 콘텐츠',
                        description: '텍스트와 파일을 함께 활용',
                        example: '설명 텍스트 + 참고 자료, 이론 + 실습 파일'
                      }
                    ].map((option) => {
                      const isSelected = formData.contentType === option.type;
                      return (
                        <div
                          key={option.type}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, contentType: option.type })}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <option.icon className={`w-8 h-8 ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <h3 className={`font-medium ${
                              isSelected ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {option.title}
                            </h3>
                            <p className={`text-xs ${
                              isSelected ? 'text-blue-700' : 'text-gray-600'
                            }`}>
                              {option.description}
                            </p>
                            <p className={`text-xs italic ${
                              isSelected ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              예: {option.example}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                {/* 텍스트 전용 또는 혼합 모드에서 텍스트 입력 */}
                {(formData.contentType === 'TEXT' || formData.contentType === 'MIXED') && (
                  <div>
                    <Label htmlFor="content">
                      {formData.contentType === 'TEXT' ? '교재 내용' : '텍스트 콘텐츠'}
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.contentType === 'TEXT' 
                        ? '교재의 텍스트 내용을 입력하세요'
                        : '파일과 함께 표시될 텍스트 설명을 입력하세요'
                      }
                    </p>
                    <Textarea
                      id="content"
                      placeholder={
                        formData.contentType === 'TEXT'
                          ? "교재 내용을 입력하세요..."
                          : "파일에 대한 설명이나 보충 설명을 입력하세요..."
                      }
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="mt-1 min-h-[300px] font-mono text-sm"
                    />
                  </div>
                )}

                {/* 파일 전용 또는 혼합 모드에서 파일 업로드 */}
                {(formData.contentType === 'FILE' || formData.contentType === 'MIXED') && (
                  <div>
                    <Label>
                      {formData.contentType === 'FILE' ? '메인 파일 업로드' : '참고 파일 업로드'}
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.contentType === 'FILE'
                        ? 'PDF, 이미지, 동영상 등 교재의 메인 콘텐츠 파일을 업로드하세요'
                        : 'PDF, 이미지, 동영상 등 텍스트와 함께 표시할 참고 자료를 업로드하세요'
                      }
                    </p>
                    <EnhancedFileUpload
                      acceptedTypes={
                        formData.contentType === 'FILE'
                          ? ['.pdf', '.txt', '.md', '.markdown', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm',
                             'application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown',
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/msword', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
                          : ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm',
                             'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
                      }
                      maxFileSize={formData.contentType === 'FILE' ? 100 : 50}
                      maxFiles={1}
                      onUploadComplete={handleUploadComplete}
                    />
                  </div>
                )}
                
                {/* 텍스트 전용 모드에서 텍스트 자동 추출용 파일 업로드 */}
                {formData.contentType === 'TEXT' && (
                  <div>
                    <Label>텍스트 파일 업로드 (선택사항)</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      PDF, TXT, MD, DOCX 파일을 업로드하여 텍스트를 자동으로 추출할 수 있습니다
                    </p>
                    <EnhancedFileUpload
                      acceptedTypes={['.pdf', '.txt', '.md', '.markdown', '.docx', '.doc', 
                                     'application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown',
                                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                     'application/msword']}
                      maxFileSize={50}
                      maxFiles={1}
                      onUploadComplete={handleUploadComplete}
                    />
                  </div>
                )}

                {/* PDF 뷰어 - PDF 파일이 업로드된 경우에만 표시 */}
                {uploadedFile && uploadedFile.type === 'application/pdf' && (() => {
                  // Force relative URL to avoid browser cache issues with localhost:4000
                  const fileId = uploadedFile.id || uploadedFile.url.match(/\/files\/([^\/]+)\//)?.[1];
                  const correctedUrl = fileId ? `/api/files/${fileId}/serve` : uploadedFile.url;
                  console.log('🔧 PDF URL correction:', {
                    original: uploadedFile.url,
                    fileId,
                    corrected: correctedUrl
                  });
                  
                  // FILE 전용 모드에서는 PDF를 더 크게 표시
                  const isFileOnlyMode = formData.contentType === 'FILE';
                  
                  return (
                    <div className={`mt-6 ${isFileOnlyMode ? 'pdf-primary-display' : ''}`}>
                      {isFileOnlyMode && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">PDF 파일 중심 모드</h4>
                              <p className="text-sm text-blue-700">
                                업로드된 PDF 파일이 교재의 메인 콘텐츠로 사용됩니다. 아래에서 미리보기를 확인하세요.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <SecurePDFViewer
                        fileUrl={correctedUrl}
                        fileName={uploadedFile.name}
                        onExtractText={(text) => {
                          // PDF 뷰어에서 추가 텍스트 추출이 가능한 경우
                          if (formData.contentType === 'TEXT') {
                            setFormData(prev => ({
                              ...prev,
                              content: text
                            }));
                          }
                        }}
                      />
                      {isFileOnlyMode && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ <strong>PDF 파일이 성공적으로 로드되었습니다.</strong> 
                            이 PDF가 교재의 주요 학습 자료로 사용됩니다.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 업로드된 파일 정보 표시 */}
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">업로드된 파일: {uploadedFile.name}</p>
                        <p className="text-xs text-gray-600">
                          {uploadedFile.type === 'application/pdf' ? 'PDF 문서' : 
                           uploadedFile.type.startsWith('image/') ? '이미지 파일' :
                           uploadedFile.type.startsWith('video/') ? '동영상 파일' :
                           uploadedFile.type === 'text/plain' ? '텍스트 파일' : 
                           '문서 파일'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null);
                          if (formData.contentType === 'TEXT') {
                            setFormData(prev => ({ ...prev, content: '' }));
                          }
                        }}
                      >
                        파일 제거
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">개념 추출 및 검토</h3>
                  <p className="text-gray-600">
                    AI가 콘텐츠에서 핵심 개념을 추출하고 관계를 분석합니다
                  </p>
                </div>

                {!conceptsExtracted ? (
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <p className="text-sm text-blue-800">
                            개념 추출은 선택사항입니다. 나중에 교과서 편집 페이지에서도 추출할 수 있습니다.
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={handleExtractConcepts}
                              disabled={isExtractingConcepts || !formData.content.trim()}
                              className="gap-2"
                            >
                              {isExtractingConcepts ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  개념 추출 중...
                                </>
                              ) : (
                                <>
                                  <Brain className="w-4 h-4" />
                                  개념 추출하기
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleSkipConceptExtraction}
                              disabled={isExtractingConcepts}
                            >
                              건너뛰기
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {!formData.content.trim() && (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-4">
                          <p className="text-sm text-yellow-800 text-center">
                            개념을 추출하려면 Step 3에서 콘텐츠를 입력해주세요.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-green-800">
                            ✓ {concepts.length > 0 ? `${concepts.length}개의 개념이 추출되었습니다.` : '개념 추출을 건너뛰었습니다.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {concepts.length > 0 && tempTextbookId && (
                      <div className="h-[500px] border rounded-lg overflow-hidden">
                        <ConceptReviewPanel
                          textbookId={tempTextbookId}
                          isTeacher={true}
                        />
                      </div>
                    )}

                    {concepts.length > 0 && (
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setConceptsExtracted(false)
                            resetConceptStore()
                          }}
                        >
                          다시 추출
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 5 && (
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

            {currentStep === 6 && analysisResult && (
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

                {/* Content Type Summary */}
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {formData.contentType === 'TEXT' && <Type className="w-6 h-6 text-blue-600" />}
                      {formData.contentType === 'FILE' && <FileIcon className="w-6 h-6 text-green-600" />}
                      {formData.contentType === 'MIXED' && <Layers className="w-6 h-6 text-purple-600" />}
                      <span className="text-lg font-semibold">
                        {formData.contentType === 'TEXT' && '텍스트 전용'}
                        {formData.contentType === 'FILE' && '파일 전용'}
                        {formData.contentType === 'MIXED' && '혼합 콘텐츠'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formData.contentType === 'TEXT' && '순수 텍스트 기반 교재'}
                      {formData.contentType === 'FILE' && '파일 중심 교재'}
                      {formData.contentType === 'MIXED' && '텍스트와 파일을 결합한 교재'}
                    </p>
                  </CardContent>
                </Card>

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
                        <p className="font-medium">콘텐츠 타입</p>
                        <p className="text-blue-600">
                          {formData.contentType === 'TEXT' && '텍스트 전용'}
                          {formData.contentType === 'FILE' && '파일 전용'}
                          {formData.contentType === 'MIXED' && '혼합 콘텐츠'}
                        </p>
                      </div>
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
                      <div>
                        <p className="font-medium">페이지 길이</p>
                        <p className="text-gray-700">{formData.targetPageLength}자</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 mx-4">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">교과서 생성 중...</h3>
                    <p className="text-gray-600">{creationProgress.message}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${creationProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">{creationProgress.progress}% 완료</p>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    {creationProgress.step === 'validating' && (
                      <p>✓ 데이터 검증 중</p>
                    )}
                    {creationProgress.step === 'preparing' && (
                      <>
                        <p>✓ 데이터 검증 완료</p>
                        <p>• 교과서 구조 준비 중</p>
                      </>
                    )}
                    {creationProgress.step === 'creating' && (
                      <>
                        <p>✓ 데이터 검증 완료</p>
                        <p>✓ 교과서 구조 준비 완료</p>
                        <p>• 교과서 생성 중</p>
                      </>
                    )}
                    {creationProgress.step === 'ai-generating' && (
                      <>
                        <p>✓ 데이터 검증 완료</p>
                        <p>✓ 교과서 구조 준비 완료</p>
                        <p>✓ 교과서 생성 완료</p>
                        <p>• AI 콘텐츠 생성 중</p>
                      </>
                    )}
                    {creationProgress.step === 'complete' && (
                      <>
                        <p>✓ 데이터 검증 완료</p>
                        <p>✓ 교과서 구조 준비 완료</p>
                        <p>✓ 교과서 생성 완료</p>
                        <p>✓ AI 콘텐츠 생성 완료</p>
                        <p>• 페이지 이동 중</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              disabled={(() => {
                // 4단계: 개념 추출 - 추출 완료 또는 건너뛰기 필요
                if (currentStep === 4) {
                  return isExtractingConcepts || !conceptsExtracted;
                }

                // 5단계: AI 설정은 항상 활성화 (선택사항)
                if (currentStep === 5) {
                  return false;
                }

                // 1단계: 제목 필수
                const isStep1Invalid = currentStep === 1 && !formData.title.trim();

                // 3단계: 콘텐츠 타입별 검증
                const isStep3TextModeInvalid = currentStep === 3 && formData.contentType !== 'FILE' && !formData.content.trim();
                const isStep3FileModeInvalid = currentStep === 3 && formData.contentType === 'FILE' && !uploadedFile;

                const shouldDisable = isProcessing || isStep1Invalid || isStep3TextModeInvalid || isStep3FileModeInvalid;

                return shouldDisable;
              })()}
              className="gap-2"
            >
              {isProcessing && currentStep === 5 ? (
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
              disabled={isProcessing || !formData.title || 
                       (formData.contentType !== 'FILE' && !formData.content) ||
                       (formData.contentType === 'FILE' && !uploadedFile)}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {creationProgress.step === 'validating' ? '검증 중...' :
                   creationProgress.step === 'preparing' ? '준비 중...' :
                   creationProgress.step === 'creating' ? '생성 중...' :
                   creationProgress.step === 'ai-generating' ? 'AI 생성 중...' :
                   creationProgress.step === 'complete' ? '완료!' :
                   '처리 중...'}
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