'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Timer,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';

import { Activity, Question } from './index';

interface ActivityPreviewProps {
  activity: Activity;
  isTeacherView: boolean;
  showAnswers?: boolean;
}

export default function ActivityPreview({
  activity,
  isTeacherView,
  showAnswers = false
}: ActivityPreviewProps) {
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(showAnswers);
  const [timeRemaining, setTimeRemaining] = useState(activity.timeLimit ? activity.timeLimit * 60 : 0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateAnswer = (questionId: string, answer: any) => {
    setStudentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (activity.settings.showCorrectAnswers) {
      setShowCorrectAnswers(true);
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    activity.questions.forEach(question => {
      totalPoints += question.points;
      const studentAnswer = studentAnswers[question.id];

      if (studentAnswer !== undefined) {
        switch (question.type) {
          case 'multiple_choice':
            if (studentAnswer === question.options?.[question.correctAnswer as number]) {
              earnedPoints += question.points;
            } else if (activity.settings.allowPartialCredit && studentAnswer) {
              // Partial credit for attempting
              earnedPoints += question.points * 0.1;
            }
            break;

          case 'fill_in_blank':
            if (question.blanks) {
              let correctBlanks = 0;
              question.blanks.forEach((blank, index) => {
                if (studentAnswer?.[index]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim()) {
                  correctBlanks++;
                }
              });
              
              if (correctBlanks === question.blanks.length) {
                earnedPoints += question.points;
              } else if (activity.settings.allowPartialCredit && correctBlanks > 0) {
                earnedPoints += question.points * (correctBlanks / question.blanks.length);
              }
            }
            break;

          case 'essay':
            // Essays require manual grading
            if (studentAnswer && studentAnswer.trim()) {
              earnedPoints += activity.settings.allowPartialCredit ? question.points * 0.8 : 0;
            }
            break;
        }
      }
    });

    return { earnedPoints: Math.round(earnedPoints * 10) / 10, totalPoints };
  };

  const renderQuestion = (question: Question, index: number) => {
    const studentAnswer = studentAnswers[question.id];
    const isCorrect = checkAnswer(question, studentAnswer);

    return (
      <Card key={question.id} className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Question Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">문제 {index + 1}</Badge>
                  <Badge variant="secondary">{question.points}점</Badge>
                  {isSubmitted && showCorrectAnswers && (
                    <Badge variant={isCorrect ? "default" : "destructive"}>
                      {isCorrect ? '정답' : '오답'}
                    </Badge>
                  )}
                </div>
                <p className="font-medium">{question.text}</p>
              </div>
            </div>

            {/* Question Content */}
            {renderQuestionContent(question, studentAnswer)}

            {/* Show correct answer and explanation */}
            {isSubmitted && showCorrectAnswers && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    정답
                  </div>
                  {renderCorrectAnswer(question)}
                  
                  {question.explanation && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">해설</div>
                      <p className="text-sm text-gray-600">{question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuestionContent = (question: Question, studentAnswer: any) => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={studentAnswer || ''}
            onValueChange={(value) => updateAnswer(question.id, value)}
            disabled={isSubmitted}
          >
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option} 
                  id={`${question.id}-${optionIndex}`} 
                />
                <Label 
                  htmlFor={`${question.id}-${optionIndex}`}
                  className={
                    isSubmitted && showCorrectAnswers
                      ? optionIndex === question.correctAnswer
                        ? 'text-green-600 font-medium'
                        : studentAnswer === option
                        ? 'text-red-600'
                        : ''
                      : ''
                  }
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'fill_in_blank':
        const textParts = question.text.split('___');
        return (
          <div className="space-y-2">
            {textParts.map((part, index) => (
              <span key={index} className="inline-flex items-center">
                {part}
                {index < textParts.length - 1 && (
                  <Input
                    className="mx-2 w-32 inline-block"
                    value={studentAnswer?.[index] || ''}
                    onChange={(e) => {
                      const newAnswer = { ...studentAnswer };
                      newAnswer[index] = e.target.value;
                      updateAnswer(question.id, newAnswer);
                    }}
                    disabled={isSubmitted}
                    placeholder="답"
                  />
                )}
              </span>
            ))}
          </div>
        );

      case 'essay':
        return (
          <Textarea
            value={studentAnswer || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={isSubmitted}
            placeholder="답안을 입력하세요..."
            rows={6}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question: Question) => {
    switch (question.type) {
      case 'multiple_choice':
        const correctOption = question.options?.[question.correctAnswer as number];
        return (
          <p className="text-sm text-green-600 font-medium">
            {correctOption}
          </p>
        );

      case 'fill_in_blank':
        return (
          <div className="space-y-1">
            {question.blanks?.map((blank, index) => (
              <p key={blank.id} className="text-sm text-green-600">
                빈칸 {index + 1}: <span className="font-medium">{blank.correctAnswer}</span>
              </p>
            ))}
          </div>
        );

      case 'essay':
        return (
          <p className="text-sm text-gray-600">
            서술형 문제는 교사가 직접 채점합니다.
          </p>
        );

      default:
        return null;
    }
  };

  const checkAnswer = (question: Question, studentAnswer: any) => {
    if (studentAnswer === undefined) return false;

    switch (question.type) {
      case 'multiple_choice':
        return studentAnswer === question.options?.[question.correctAnswer as number];

      case 'fill_in_blank':
        if (!question.blanks) return false;
        return question.blanks.every((blank, index) => 
          studentAnswer?.[index]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim()
        );

      case 'essay':
        return studentAnswer && studentAnswer.trim().length > 0;

      default:
        return false;
    }
  };

  const { earnedPoints, totalPoints } = isSubmitted ? calculateScore() : { earnedPoints: 0, totalPoints: 0 };
  const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  return (
    <div className="h-full">
      {/* Activity Header */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {activity.title}
            </div>
            {isTeacherView && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                >
                  {showCorrectAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showCorrectAnswers ? '정답 숨기기' : '정답 보기'}
                </Button>
                <Badge variant="secondary">교사 미리보기</Badge>
              </div>
            )}
          </CardTitle>
          {activity.description && (
            <p className="text-sm text-gray-600">{activity.description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {activity.questions.length}개 문제
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              총 {activity.questions.reduce((sum, q) => sum + q.points, 0)}점
            </div>
            {activity.timeLimit && activity.timeLimit > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                제한시간 {activity.timeLimit}분
              </div>
            )}
            {activity.attempts && activity.attempts > 0 && (
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                {activity.attempts}회 시도 가능
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Display (after submission) */}
      {isSubmitted && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {earnedPoints} / {totalPoints}점
              </div>
              <div className="text-lg text-gray-600">
                {Math.round(scorePercentage)}점
              </div>
              <Progress value={scorePercentage} className="w-full" />
              <p className="text-sm text-gray-500">
                {scorePercentage >= 80 ? '우수' : scorePercentage >= 60 ? '보통' : '더 노력하세요'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {activity.questions.map((question, index) => 
            renderQuestion(question, index)
          )}
        </div>
      </ScrollArea>

      {/* Submit Button */}
      {!isSubmitted && !isTeacherView && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSubmit} size="lg">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            제출하기
          </Button>
        </div>
      )}

      {/* Teacher View Controls */}
      {isTeacherView && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-700">
              교사 미리보기 모드
            </p>
            <p className="text-xs text-gray-500">
              학생들은 이 화면과 동일한 인터페이스로 활동을 진행합니다.
            </p>
            {!isSubmitted && (
              <Button size="sm" onClick={() => setIsSubmitted(true)}>
                제출된 상태 미리보기
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}