'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  X, 
  HelpCircle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Send,
  Loader2
} from 'lucide-react'
import { Question, QuestionOption } from '@/types'
import { useToast } from '@/components/ui/use-toast'

interface QuestionPanelProps {
  questions: Question[]
  onClose: () => void
}

export function QuestionPanel({ questions, onClose }: QuestionPanelProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showHint, setShowHint] = useState(false)
  const [showResult, setShowResult] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    })
  }

  const handleSubmitAnswer = async () => {
    if (!answers[currentQuestion.id]) {
      toast({
        title: '답변을 입력해주세요',
        description: '문제에 대한 답변을 작성한 후 제출해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    // API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 정답 체크 (실제로는 서버에서 처리)
    let isCorrect = false
    if (currentQuestion.questionType === 'multiple_choice') {
      const selectedOption = currentQuestion.options?.find(opt => opt.id === answers[currentQuestion.id])
      isCorrect = selectedOption?.isCorrect || false
    } else {
      // 단답형이나 서술형은 AI 평가 필요 - TODO: AI 평가 구현
      isCorrect = false // 평가 시스템이 없을 때는 기본적으로 재검토 필요
    }

    setShowResult({
      ...showResult,
      [currentQuestion.id]: isCorrect
    })
    
    setIsSubmitting(false)
    
    toast({
      title: isCorrect ? '정답입니다! 🎉' : '다시 한번 생각해보세요',
      description: isCorrect 
        ? '훌륭해요! 다음 문제로 넘어가세요.'
        : '힌트를 참고해서 다시 도전해보세요.',
      variant: isCorrect ? 'default' : 'destructive'
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowHint(false)
    } else {
      // 모든 문제 완료
      const correctCount = Object.values(showResult).filter(r => r).length
      toast({
        title: '학습 완료! 🎊',
        description: `${questions.length}문제 중 ${correctCount}문제를 맞추셨습니다.`,
      })
      onClose()
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setShowHint(false)
    }
  }

  return (
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
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="max-h-[80vh] overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              학습 문제 {currentQuestionIndex + 1} / {questions.length}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 rounded-full ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600'
                        : showResult[questions[index].id] !== undefined
                        ? showResult[questions[index].id]
                          ? 'bg-green-600'
                          : 'bg-red-600'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Question */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1">
                      {currentQuestion.questionText}
                    </h3>
                    <p className="text-sm text-gray-600">
                      난이도: {'⭐'.repeat(currentQuestion.difficulty || 3)}
                    </p>
                  </div>
                </div>

                {/* Answer Input */}
                {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options ? (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={handleAnswerChange}
                    disabled={showResult[currentQuestion.id] !== undefined}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => (
                        <div key={option.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label 
                            htmlFor={option.id}
                            className={`flex-1 cursor-pointer ${
                              showResult[currentQuestion.id] !== undefined
                                ? option.isCorrect
                                  ? 'text-green-600 font-medium'
                                  : answers[currentQuestion.id] === option.id
                                  ? 'text-red-600'
                                  : ''
                                : ''
                            }`}
                          >
                            {option.text}
                          </Label>
                          {showResult[currentQuestion.id] !== undefined && (
                            option.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : answers[currentQuestion.id] === option.id ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : null
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="답변을 입력하세요..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    disabled={showResult[currentQuestion.id] !== undefined}
                    rows={4}
                    className="resize-none"
                  />
                )}

                {/* Hint */}
                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <div>
                    {!showHint ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHint(true)}
                        className="gap-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        힌트 보기
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          힌트
                        </p>
                        <ul className="space-y-1">
                          {currentQuestion.hints.map((hint, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              • {hint}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Result Feedback */}
                {showResult[currentQuestion.id] !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      showResult[currentQuestion.id]
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <p className="font-medium mb-2">
                      {showResult[currentQuestion.id] ? '정답입니다! 🎉' : '틀렸습니다 😢'}
                    </p>
                    {currentQuestion.answerExplanation && (
                      <p className="text-sm text-gray-700">
                        {currentQuestion.answerExplanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>

          {/* Actions */}
          <div className="border-t p-4 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              이전 문제
            </Button>
            
            <div className="flex gap-2">
              {showResult[currentQuestion.id] === undefined ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answers[currentQuestion.id] || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  제출하기
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex === questions.length - 1 ? '완료' : '다음 문제'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}