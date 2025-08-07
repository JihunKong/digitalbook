'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Award,
  FileText,
  Sparkles,
  BarChart3,
  MessageSquare,
  Target,
  Loader2
} from 'lucide-react'
import { AIService } from '@/services/ai.service'
import { WritingAssignment, AIEvaluation } from '@/types'

interface WritingEvaluatorProps {
  content: string
  assignment: Pick<WritingAssignment, 'title' | 'prompt' | 'genre'>
  onClose: () => void
}

export function WritingEvaluator({ content, assignment, onClose }: WritingEvaluatorProps) {
  const [isEvaluating, setIsEvaluating] = useState(true)
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const aiService = new AIService()

  useEffect(() => {
    evaluateWriting()
  }, [])

  const evaluateWriting = async () => {
    try {
      // 실제로는 AI 서비스 호출
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock evaluation data
      const mockEvaluation: AIEvaluation = {
        overallScore: 82,
        strengths: [
          '논리적인 구성이 돋보입니다',
          '적절한 어휘를 사용했습니다',
          '주제에 맞는 구체적인 예시를 제시했습니다'
        ],
        improvements: [
          '문단 간 연결을 더 자연스럽게 만들어보세요',
          '결론 부분을 좀 더 구체적으로 작성하면 좋겠습니다'
        ],
        detailedFeedback: {
          structure: {
            score: 85,
            comment: '서론-본론-결론의 구조가 명확하고 논리적입니다.',
            examples: ['서론에서 주제를 명확히 제시했습니다', '본론의 전개가 체계적입니다']
          },
          grammar: {
            score: 90,
            comment: '문법적 오류가 거의 없고 문장이 매끄럽습니다.',
            examples: ['조사 사용이 정확합니다', '문장 호응이 잘 맞습니다']
          },
          coherence: {
            score: 78,
            comment: '전반적으로 일관성이 있으나 일부 개선이 필요합니다.',
            examples: ['2번째 문단과 3번째 문단의 연결이 부자연스럽습니다']
          },
          creativity: {
            score: 75,
            comment: '독창적인 시각이 더 필요합니다.',
            examples: ['일반적인 예시보다 개인적 경험을 더 활용해보세요']
          },
          vocabulary: {
            score: 88,
            comment: '수준에 맞는 어휘를 적절히 사용했습니다.',
            examples: ['전문 용어를 적절히 사용했습니다', '다양한 표현을 활용했습니다']
          }
        },
        suggestions: [
          '첫 문단에 좀 더 강렬한 도입부를 작성해보세요',
          '구체적인 수치나 사례를 추가하면 설득력이 높아집니다',
          '마지막 문단에서 미래 전망을 제시하면 좋겠습니다'
        ],
        evaluatedAt: new Date()
      }
      
      setEvaluation(mockEvaluation)
    } catch (error) {
      console.error('Evaluation error:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '우수'
    if (score >= 80) return '양호'
    if (score >= 70) return '보통'
    return '미흡'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-xl">AI 글쓰기 평가</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6">
              {isEvaluating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                    <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-medium">AI가 글을 평가하고 있습니다</h3>
                  <p className="text-sm text-gray-600">잠시만 기다려주세요...</p>
                </div>
              ) : evaluation && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">종합 평가</TabsTrigger>
                    <TabsTrigger value="details">상세 분석</TabsTrigger>
                    <TabsTrigger value="feedback">피드백</TabsTrigger>
                    <TabsTrigger value="improvements">개선 방향</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* Overall Score */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4"
                      >
                        <div className="text-center">
                          <p className={`text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                            {evaluation.overallScore}
                          </p>
                          <p className="text-sm text-gray-600">점</p>
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2">
                        {getScoreLabel(evaluation.overallScore)} 수준입니다
                      </h3>
                      <p className="text-gray-600">
                        전반적으로 좋은 글이에요! 몇 가지만 보완하면 더 좋아질 거예요.
                      </p>
                    </div>

                    {/* Strengths and Improvements */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            잘한 점
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {evaluation.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span className="text-sm">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="bg-orange-50 border-orange-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            개선할 점
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {evaluation.improvements.map((improvement, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">!</span>
                                <span className="text-sm">{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-6">
                    <div className="space-y-4">
                      {Object.entries(evaluation.detailedFeedback).map(([key, detail]) => (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium capitalize">
                                {key === 'structure' ? '구성' :
                                 key === 'grammar' ? '문법' :
                                 key === 'coherence' ? '일관성' :
                                 key === 'creativity' ? '창의성' :
                                 key === 'vocabulary' ? '어휘' : key}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Progress value={detail.score} className="w-24 h-2" />
                                <span className={`font-bold ${getScoreColor(detail.score)}`}>
                                  {detail.score}점
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{detail.comment}</p>
                            {detail.examples && detail.examples.length > 0 && (
                              <div className="bg-gray-50 rounded p-3 mt-2">
                                <p className="text-xs font-medium mb-1">예시:</p>
                                <ul className="space-y-1">
                                  {detail.examples.map((example, index) => (
                                    <li key={index} className="text-xs text-gray-600">
                                      • {example}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          AI 튜터의 조언
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {evaluation.suggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex gap-3 p-4 bg-blue-50 rounded-lg"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </div>
                              </div>
                              <p className="text-sm">{suggestion}</p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="improvements" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          다음 단계 학습 목표
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium mb-2">단기 목표 (1주일)</h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li>• 문단 간 연결 어구 5개 이상 익히기</li>
                              <li>• 매일 10분씩 좋은 글 필사하기</li>
                              <li>• 주제문 작성 연습하기</li>
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium mb-2">장기 목표 (1개월)</h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li>• 다양한 글쓰기 구조 익히기</li>
                              <li>• 어휘력 확장 (하루 5개 새로운 단어)</li>
                              <li>• 주 1회 에세이 작성 및 피드백 받기</li>
                            </ul>
                          </div>

                          <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                            <Award className="w-6 h-6 text-purple-600" />
                            <div>
                              <p className="font-medium">다음 레벨까지</p>
                              <p className="text-sm text-gray-600">18점 더 필요해요! 꾸준히 연습하면 충분히 달성할 수 있어요.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>

            {!isEvaluating && (
              <div className="border-t p-4 flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  닫기
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    평가 저장
                  </Button>
                  <Button className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    수정하기
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}