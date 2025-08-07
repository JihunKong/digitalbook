'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Brain, 
  FileText, 
  MessageSquare, 
  CheckSquare,
  Clock,
  Target,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { activityTemplates, ActivityTemplate } from './ActivityTemplates'
import { toast } from 'sonner'

interface ActivityGeneratorProps {
  pageNumber: number
  onSelectActivity: (template: ActivityTemplate) => void
  currentActivities?: string[] // IDs of already completed activities
}

export function ActivityGenerator({ 
  pageNumber, 
  onSelectActivity,
  currentActivities = []
}: ActivityGeneratorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const getIconForType = (type: string) => {
    switch (type) {
      case 'critical_thinking':
        return <Brain className="w-5 h-5" />
      case 'concept_map':
        return <BookOpen className="w-5 h-5" />
      case 'summary':
        return <FileText className="w-5 h-5" />
      case 'reflection':
        return <MessageSquare className="w-5 h-5" />
      case 'quiz':
        return <CheckSquare className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700'
      case 'advanced':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '기초'
      case 'intermediate':
        return '중급'
      case 'advanced':
        return '고급'
      default:
        return difficulty
    }
  }

  const handleGenerateActivity = async (template: ActivityTemplate) => {
    setIsGenerating(true)
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onSelectActivity(template)
    toast.success(`'${template.title}' 활동이 생성되었습니다!`)
    setIsGenerating(false)
  }

  const isActivityCompleted = (templateId: string) => {
    return currentActivities.includes(templateId)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI 학습활동 생성기
            </CardTitle>
            <p className="text-sm text-gray-600">
              {pageNumber}페이지 내용을 바탕으로 맞춤형 학습활동을 생성합니다
            </p>
          </CardHeader>
        </Card>

      {/* Activity Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activityTemplates.map((template) => {
          const isCompleted = isActivityCompleted(template.id)
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === template.id ? 'ring-2 ring-blue-500' : ''
              } ${isCompleted ? 'opacity-75' : ''}`}
              onClick={() => setSelectedType(template.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {getIconForType(template.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        {template.title}
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs">
                            완료됨
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                          {getDifficultyLabel(template.difficulty)}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.estimatedTime}분
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {template.description}
                </p>
                
                {/* Learning Objectives */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    학습 목표
                  </p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {template.learningObjectives.slice(0, 2).map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Action Button */}
                {selectedType === template.id && (
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGenerateActivity(template)
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        이 활동 시작하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recommendation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">AI 추천</h4>
              <p className="text-xs text-blue-700 mt-1">
                현재 페이지의 내용을 고려할 때, <strong>비판적 사고 활동</strong>을 추천합니다. 
                가짜뉴스 판별 능력을 기르는 데 가장 효과적인 활동입니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}