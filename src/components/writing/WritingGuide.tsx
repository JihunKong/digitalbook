'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Lightbulb, PenTool, Target } from 'lucide-react'

interface WritingGuideProps {
  genre: 'narrative' | 'argumentative' | 'expository' | 'descriptive' | 'creative'
}

export function WritingGuide({ genre }: WritingGuideProps) {
  const guides = {
    narrative: {
      title: '서사문 작성 가이드',
      icon: BookOpen,
      tips: [
        {
          title: '서론',
          points: [
            '상황 설정과 배경 소개',
            '독자의 관심을 끄는 첫 문장',
            '이야기의 방향 제시'
          ]
        },
        {
          title: '본론',
          points: [
            '사건의 전개를 시간 순서대로',
            '구체적인 묘사와 감정 표현',
            '갈등과 절정의 구성'
          ]
        },
        {
          title: '결론',
          points: [
            '사건의 해결과 마무리',
            '깨달음이나 교훈 제시',
            '여운을 남기는 마무리'
          ]
        }
      ]
    },
    argumentative: {
      title: '논설문 작성 가이드',
      icon: Target,
      tips: [
        {
          title: '서론',
          points: [
            '논제 제시',
            '자신의 입장 명확히',
            '논의의 필요성 설명'
          ]
        },
        {
          title: '본론',
          points: [
            '주장을 뒷받침하는 근거',
            '예시와 통계 자료 활용',
            '반대 의견 반박'
          ]
        },
        {
          title: '결론',
          points: [
            '주장 재강조',
            '실천 방안 제시',
            '미래 전망'
          ]
        }
      ]
    },
    expository: {
      title: '설명문 작성 가이드',
      icon: Lightbulb,
      tips: [
        {
          title: '서론',
          points: [
            '주제 소개',
            '설명의 범위 제시',
            '독자의 이해도 고려'
          ]
        },
        {
          title: '본론',
          points: [
            '개념을 쉽게 풀어서 설명',
            '예시와 비유 활용',
            '단계별 설명'
          ]
        },
        {
          title: '결론',
          points: [
            '핵심 내용 요약',
            '중요성 강조',
            '추가 학습 방향 제시'
          ]
        }
      ]
    },
    descriptive: {
      title: '묘사문 작성 가이드',
      icon: PenTool,
      tips: [
        {
          title: '서론',
          points: [
            '대상 소개',
            '첫인상 묘사',
            '관찰 관점 제시'
          ]
        },
        {
          title: '본론',
          points: [
            '오감을 활용한 묘사',
            '구체적인 세부 사항',
            '비유와 은유 활용'
          ]
        },
        {
          title: '결론',
          points: [
            '전체적인 인상',
            '개인적 감상',
            '여운있는 마무리'
          ]
        }
      ]
    },
    creative: {
      title: '창작문 작성 가이드',
      icon: BookOpen,
      tips: [
        {
          title: '서론',
          points: [
            '독특한 시작',
            '상상력 자극',
            '분위기 조성'
          ]
        },
        {
          title: '본론',
          points: [
            '창의적인 전개',
            '예상치 못한 반전',
            '생동감 있는 표현'
          ]
        },
        {
          title: '결론',
          points: [
            '인상적인 마무리',
            '열린 결말 가능',
            '독자에게 생각거리 제공'
          ]
        }
      ]
    }
  }

  const guide = guides[genre] || guides.narrative
  const Icon = guide.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          {guide.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {guide.tips.map((section, index) => (
            <div key={index}>
              <h4 className="font-medium mb-2 text-sm">{section.title}</h4>
              <ul className="space-y-1">
                {section.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}