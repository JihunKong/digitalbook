'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Save, 
  Send, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Target,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { ActivityTemplate, CompletedActivity, ActivitySection } from './ActivityTemplates'
import { toast } from 'sonner'

interface ActivityWorkspaceProps {
  template: ActivityTemplate
  pageNumber: number
  studentId: string
  onComplete: (activity: CompletedActivity) => void
  onBack: () => void
}

export function ActivityWorkspace({
  template,
  pageNumber,
  studentId,
  onComplete,
  onBack
}: ActivityWorkspaceProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [sectionResponses, setSectionResponses] = useState<Record<string, any>>({})
  const [startTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const currentSection = template.structure.sections[currentSectionIndex]
  const progress = ((currentSectionIndex + 1) / template.structure.sections.length) * 100
  
  const [mounted, setMounted] = useState(false)
  
  // Editor for text sections
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: currentSection?.prompts[0] || '여기에 답변을 작성하세요...',
      }),
    ],
    content: sectionResponses[currentSection?.id] || '',
    onUpdate: ({ editor }) => {
      if (currentSection) {
        setSectionResponses(prev => ({
          ...prev,
          [currentSection.id]: editor.getHTML()
        }))
      }
    },
  })
  
  // Ensure client-side only rendering for editor
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update editor content when section changes
  useEffect(() => {
    if (editor && currentSection) {
      editor.commands.setContent(sectionResponses[currentSection.id] || '')
    }
  }, [currentSectionIndex])

  const handleChecklistChange = (prompt: string, checked: boolean) => {
    setSectionResponses(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [prompt]: checked
      }
    }))
  }

  const handleTextAreaChange = (value: string) => {
    setSectionResponses(prev => ({
      ...prev,
      [currentSection.id]: value
    }))
  }

  const validateCurrentSection = (): boolean => {
    if (!currentSection.required) return true
    
    const response = sectionResponses[currentSection.id]
    if (!response) {
      toast.error('이 섹션은 필수 항목입니다.')
      return false
    }
    
    if (currentSection.type === 'text' && currentSection.constraints) {
      const text = editor?.getText() || ''
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
      
      if (currentSection.constraints.minWords && wordCount < currentSection.constraints.minWords) {
        toast.error(`최소 ${currentSection.constraints.minWords}단어 이상 작성해주세요. (현재: ${wordCount}단어)`)
        return false
      }
      
      if (currentSection.constraints.maxWords && wordCount > currentSection.constraints.maxWords) {
        toast.error(`최대 ${currentSection.constraints.maxWords}단어까지만 작성 가능합니다. (현재: ${wordCount}단어)`)
        return false
      }
    }
    
    return true
  }

  const handleNextSection = () => {
    if (!validateCurrentSection()) return
    
    if (currentSectionIndex < template.structure.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage (only on client)
      if (typeof window !== 'undefined') {
        const activityData = {
          templateId: template.id,
          responses: sectionResponses,
          timestamp: Date.now(),
          pageNumber,
          currentSection: currentSectionIndex
        }
        localStorage.setItem(`activity-${template.id}-${pageNumber}`, JSON.stringify(activityData))
        toast.success('진행 상황이 저장되었습니다.')
      }
    } catch (error) {
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    // Validate all required sections
    for (let i = 0; i < template.structure.sections.length; i++) {
      const section = template.structure.sections[i]
      if (section.required && !sectionResponses[section.id]) {
        toast.error(`'${section.title}' 섹션을 완료해주세요.`)
        setCurrentSectionIndex(i)
        return
      }
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate time spent
      const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60)
      
      // Simulate AI evaluation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const completedActivity: CompletedActivity = {
        id: `activity-${Date.now()}`,
        templateId: template.id,
        activityType: template.type,
        pageNumber,
        studentId,
        title: template.title,
        completedAt: new Date(),
        timeSpent,
        content: sectionResponses,
        evaluation: {
          score: Math.floor(Math.random() * 20) + 80, // Random score 80-100
          feedback: 'AI가 생성한 피드백: 전반적으로 잘 작성했습니다! 특히 비판적 사고를 적용한 부분이 인상적입니다.',
          strengths: ['논리적 구성', '구체적 예시 제시', '명확한 표현'],
          improvements: ['더 다양한 관점 고려하기']
        },
        status: 'evaluated'
      }
      
      // Clear localStorage (only on client)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`activity-${template.id}-${pageNumber}`)
      }
      
      onComplete(completedActivity)
      toast.success('활동이 제출되었습니다!')
    } catch (error) {
      toast.error('제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSectionContent = (section: ActivitySection) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="space-y-3">
            {section.prompts.map((prompt, idx) => (
              <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{prompt}</span>
              </div>
            ))}
            <div className="border rounded-lg p-3 min-h-[120px]">
              {mounted && editor ? (
                <EditorContent 
                  editor={editor}
                  className="prose prose-sm max-w-none focus:outline-none"
                />
              ) : (
                <div className="text-gray-400">로딩 중...</div>
              )}
            </div>
            {section.constraints && (
              <div className="text-xs text-gray-500">
                {section.constraints.minWords && `최소 ${section.constraints.minWords}단어`}
                {section.constraints.minWords && section.constraints.maxWords && ' ~ '}
                {section.constraints.maxWords && `최대 ${section.constraints.maxWords}단어`}
              </div>
            )}
          </div>
        )
      
      case 'checklist':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{section.prompts[0]}</p>
            <div className="space-y-2">
              {section.prompts.slice(1).map((prompt, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={sectionResponses[section.id]?.[prompt] || false}
                    onChange={(e) => handleChecklistChange(prompt, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm flex-1 cursor-pointer">
                    {prompt}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div className="space-y-3">
            {section.prompts.map((prompt, idx) => (
              <div key={idx}>
                <p className="text-sm text-gray-600 mb-2">{prompt}</p>
                <Textarea
                  placeholder="여기에 답변을 작성하세요..."
                  value={sectionResponses[section.id]?.[`prompt_${idx}`] || ''}
                  onChange={(e) => {
                    setSectionResponses(prev => ({
                      ...prev,
                      [section.id]: {
                        ...prev[section.id],
                        [`prompt_${idx}`]: e.target.value
                      }
                    }))
                  }}
                  className="min-h-[100px]"
                />
              </div>
            ))}
          </div>
        )
      
      default:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{section.prompts[0]}</p>
            <Textarea
              placeholder="여기에 답변을 작성하세요..."
              value={sectionResponses[section.id] || ''}
              onChange={(e) => handleTextAreaChange(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col p-2 overflow-y-auto">
      {/* Header */}
      <Card className="mb-2 flex-shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                뒤로
              </Button>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  {template.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.type === 'critical_thinking' && '비판적 사고'}
                    {template.type === 'concept_map' && '개념 지도'}
                    {template.type === 'summary' && '요약'}
                    {template.type === 'reflection' && '성찰'}
                    {template.type === 'quiz' && '퀴즈'}
                  </Badge>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    예상 시간: {template.estimatedTime}분
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">진행률</p>
              <Progress value={progress} className="w-24 h-2 mt-1" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Learning Objectives */}
      <Card className="mb-2 flex-shrink-0">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-2">학습 목표</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {template.learningObjectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card className="flex flex-col min-h-[400px]">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              섹션 {currentSectionIndex + 1} / {template.structure.sections.length}: {currentSection.title}
            </CardTitle>
            {currentSection.required && (
              <Badge variant="destructive" className="text-xs">
                필수
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-y-auto max-h-[500px]">
          {renderSectionContent(currentSection)}
        </CardContent>
        <div className="border-t p-3 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousSection}
                disabled={currentSectionIndex === 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {currentSectionIndex < template.structure.sections.length - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNextSection}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  다음 섹션
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      제출하기
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Helper Hint */}
      <Card className="mt-2 bg-blue-50 border-blue-200 flex-shrink-0">
        <CardContent className="p-2">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Sparkles className="w-4 h-4" />
            <span>
              <strong>AI 도우미:</strong> {currentSection.prompts[0]}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}