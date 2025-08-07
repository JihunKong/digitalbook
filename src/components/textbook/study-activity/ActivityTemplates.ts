export interface ActivityTemplate {
  id: string
  type: 'concept_map' | 'critical_thinking' | 'summary' | 'reflection' | 'quiz'
  title: string
  description: string
  icon: string
  estimatedTime: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives: string[]
  structure: ActivityStructure
  exampleContent?: any
}

export interface ActivityStructure {
  sections: ActivitySection[]
}

export interface ActivitySection {
  id: string
  title: string
  type: 'text' | 'diagram' | 'table' | 'multiple_choice' | 'checklist'
  required: boolean
  prompts: string[]
  constraints?: {
    minWords?: number
    maxWords?: number
    requiredElements?: string[]
  }
}

export interface CompletedActivity {
  id: string
  templateId: string
  activityType: string
  pageNumber: number
  studentId: string
  title: string
  completedAt: Date
  timeSpent: number // minutes
  content: any
  evaluation?: {
    score?: number
    feedback: string
    strengths: string[]
    improvements: string[]
  }
  status: 'draft' | 'submitted' | 'evaluated'
}

export const activityTemplates: ActivityTemplate[] = [
  {
    id: 'act-critical-thinking',
    type: 'critical_thinking',
    title: '가짜뉴스 탐정이 되어보자',
    description: '실제 뉴스와 가짜뉴스를 구별하는 비판적 사고 활동',
    icon: '🔍',
    estimatedTime: 20,
    difficulty: 'intermediate',
    learningObjectives: [
      '정보의 출처 확인하기',
      '사실과 의견 구분하기',
      '논리적 오류 찾아내기',
      '증거 기반 판단하기'
    ],
    structure: {
      sections: [
        {
          id: 's1',
          title: '뉴스 분석하기',
          type: 'text',
          required: true,
          prompts: [
            '이 뉴스의 제목과 내용이 일치하나요?',
            '기자의 이름과 날짜가 명시되어 있나요?',
            '인용된 전문가나 자료가 실제로 존재하나요?',
            '감정적인 표현이 과도하게 사용되었나요?'
          ],
          constraints: {
            minWords: 50,
            requiredElements: ['출처', '날짜', '증거']
          }
        },
        {
          id: 's2',
          title: '신뢰도 평가표',
          type: 'checklist',
          required: true,
          prompts: [
            '명확한 출처가 있다',
            '객관적인 어조를 사용한다',
            '구체적인 증거를 제시한다',
            '양쪽 입장을 균형있게 다룬다',
            '사실 확인이 가능하다'
          ]
        },
        {
          id: 's3',
          title: '나의 판단',
          type: 'text',
          required: true,
          prompts: [
            '이 뉴스가 진짜인지 가짜인지 판단한 이유를 설명해주세요.',
            '앞으로 뉴스를 볼 때 주의할 점은 무엇인가요?'
          ],
          constraints: {
            minWords: 30
          }
        }
      ]
    }
  },
  {
    id: 'act-concept-map',
    type: 'concept_map',
    title: '비판적 사고의 요소들',
    description: '5단원에서 배운 비판적 사고의 핵심 개념을 시각화하기',
    icon: '🗺️',
    estimatedTime: 15,
    difficulty: 'beginner',
    learningObjectives: [
      '핵심 개념 파악하기',
      '개념 간 관계 이해하기',
      '시각적 표현 능력 기르기'
    ],
    structure: {
      sections: [
        {
          id: 's1',
          title: '중심 개념',
          type: 'text',
          required: true,
          prompts: ['비판적 사고의 가장 중요한 개념은 무엇인가요?'],
          constraints: {
            maxWords: 10
          }
        },
        {
          id: 's2',
          title: '주요 요소들',
          type: 'table',
          required: true,
          prompts: [
            '비판적 사고의 4가지 주요 요소를 적어보세요',
            '각 요소의 정의를 간단히 설명해보세요'
          ]
        },
        {
          id: 's3',
          title: '관계 설명',
          type: 'text',
          required: true,
          prompts: ['위의 요소들이 어떻게 연결되어 있는지 설명해보세요'],
          constraints: {
            minWords: 40
          }
        }
      ]
    }
  },
  {
    id: 'act-summary',
    type: 'summary',
    title: '오늘 배운 내용 정리하기',
    description: '핵심 내용을 체계적으로 요약하는 활동',
    icon: '📝',
    estimatedTime: 10,
    difficulty: 'beginner',
    learningObjectives: [
      '핵심 내용 추출하기',
      '논리적으로 구성하기',
      '간결하게 표현하기'
    ],
    structure: {
      sections: [
        {
          id: 's1',
          title: '핵심 개념 3가지',
          type: 'table',
          required: true,
          prompts: ['오늘 배운 가장 중요한 개념 3가지를 적어보세요']
        },
        {
          id: 's2',
          title: '한 문단 요약',
          type: 'text',
          required: true,
          prompts: ['오늘 배운 내용을 한 문단으로 요약해보세요'],
          constraints: {
            minWords: 50,
            maxWords: 100
          }
        },
        {
          id: 's3',
          title: '실생활 적용',
          type: 'text',
          required: false,
          prompts: ['오늘 배운 내용을 실생활에서 어떻게 활용할 수 있을까요?'],
          constraints: {
            minWords: 30
          }
        }
      ]
    }
  },
  {
    id: 'act-reflection',
    type: 'reflection',
    title: '학습 성찰 일지',
    description: '오늘의 학습을 되돌아보고 느낀 점을 기록하기',
    icon: '💭',
    estimatedTime: 10,
    difficulty: 'beginner',
    learningObjectives: [
      '메타인지 능력 기르기',
      '학습 과정 성찰하기',
      '개선점 찾아내기'
    ],
    structure: {
      sections: [
        {
          id: 's1',
          title: '오늘의 학습 목표',
          type: 'text',
          required: true,
          prompts: ['오늘 무엇을 배우려고 했나요?'],
          constraints: {
            maxWords: 30
          }
        },
        {
          id: 's2',
          title: '새롭게 알게 된 점',
          type: 'text',
          required: true,
          prompts: [
            '가장 흥미로웠던 내용은 무엇인가요?',
            '예상과 달랐던 점이 있나요?'
          ],
          constraints: {
            minWords: 40
          }
        },
        {
          id: 's3',
          title: '어려웠던 점',
          type: 'text',
          required: true,
          prompts: [
            '이해하기 어려웠던 부분이 있나요?',
            '더 알아보고 싶은 내용은 무엇인가요?'
          ],
          constraints: {
            minWords: 30
          }
        },
        {
          id: 's4',
          title: '다음 학습 계획',
          type: 'text',
          required: false,
          prompts: ['다음에는 어떤 부분을 더 공부하고 싶나요?']
        }
      ]
    }
  },
  {
    id: 'act-quiz',
    type: 'quiz',
    title: '스스로 확인하기',
    description: '오늘 배운 내용을 퀴즈로 확인해보기',
    icon: '✅',
    estimatedTime: 5,
    difficulty: 'beginner',
    learningObjectives: [
      '학습 내용 확인하기',
      '자가 평가하기'
    ],
    structure: {
      sections: [
        {
          id: 's1',
          title: '객관식 문제',
          type: 'multiple_choice',
          required: true,
          prompts: [
            '비판적 사고란 무엇인가요?',
            '가짜뉴스의 특징이 아닌 것은?'
          ]
        },
        {
          id: 's2',
          title: '참/거짓 판단',
          type: 'checklist',
          required: true,
          prompts: [
            '모든 정보를 의심해야 한다 (참/거짓)',
            '출처가 명확하면 믿을 수 있다 (참/거짓)',
            '감정적 표현이 많으면 주의해야 한다 (참/거짓)'
          ]
        },
        {
          id: 's3',
          title: '단답형 문제',
          type: 'text',
          required: true,
          prompts: ['가짜뉴스를 구별하는 가장 중요한 방법 한 가지는?'],
          constraints: {
            maxWords: 20
          }
        }
      ]
    }
  }
]

// 완료된 활동 예시 데이터
export const sampleCompletedActivities: CompletedActivity[] = [
  {
    id: 'comp-001',
    templateId: 'act-critical-thinking',
    activityType: 'critical_thinking',
    pageNumber: 42,
    studentId: 'demo-student',
    title: '가짜뉴스 탐정이 되어보자',
    completedAt: new Date('2025-08-06T14:30:00'),
    timeSpent: 18,
    content: {
      s1: `이 뉴스는 '모든 학생'이라는 과장된 표현을 사용하고 있어요. 실제로는 설문조사에 참여한 100명의 학생만을 대상으로 했는데, 마치 전체 학생인 것처럼 써있어요. 
      
      또한 기자 이름이 없고 '관계자'라는 불명확한 출처만 나와있어서 신뢰하기 어려워요. 날짜도 정확하지 않고 '최근'이라고만 표현되어 있습니다.
      
      증거로 제시된 통계도 출처가 불분명하고, 감정적인 표현들이 많이 사용되었어요.`,
      s2: {
        '명확한 출처가 있다': false,
        '객관적인 어조를 사용한다': false,
        '구체적인 증거를 제시한다': false,
        '양쪽 입장을 균형있게 다룬다': true,
        '사실 확인이 가능하다': false
      },
      s3: `이 뉴스는 가짜뉴스라고 판단됩니다. 출처가 불명확하고, 과장된 표현을 사용하며, 검증 가능한 증거가 없기 때문입니다.
      
      앞으로 뉴스를 볼 때는 반드시 기자 이름과 날짜를 확인하고, 인용된 자료의 출처를 찾아보겠습니다.`
    },
    evaluation: {
      score: 85,
      feedback: '가짜뉴스의 특징을 정확히 파악했어요! 특히 과장된 표현과 불명확한 출처를 찾아낸 점이 훌륭합니다.',
      strengths: ['논리적 분석', '구체적 증거 제시', '체크리스트 활용'],
      improvements: ['더 많은 예시를 추가하면 좋겠어요']
    },
    status: 'evaluated'
  },
  {
    id: 'comp-002',
    templateId: 'act-concept-map',
    activityType: 'concept_map',
    pageNumber: 40,
    studentId: 'demo-student',
    title: '비판적 사고의 요소들',
    completedAt: new Date('2025-08-05T10:15:00'),
    timeSpent: 12,
    content: {
      s1: '비판적 사고',
      s2: {
        요소1: { name: '분석', definition: '정보를 작은 부분으로 나누어 살펴보기' },
        요소2: { name: '평가', definition: '정보의 신뢰성과 가치 판단하기' },
        요소3: { name: '추론', definition: '주어진 정보로부터 결론 도출하기' },
        요소4: { name: '설명', definition: '자신의 생각을 명확히 표현하기' }
      },
      s3: '이 네 가지 요소는 서로 연결되어 있습니다. 먼저 분석을 통해 정보를 이해하고, 평가로 신뢰성을 판단한 후, 추론으로 결론을 내리고, 마지막으로 설명을 통해 다른 사람과 소통합니다.'
    },
    evaluation: {
      score: 90,
      feedback: '개념 간의 관계를 명확하게 이해하고 있네요!',
      strengths: ['체계적 구성', '명확한 정의'],
      improvements: ['시각적 다이어그램을 추가하면 더 좋겠어요']
    },
    status: 'evaluated'
  },
  {
    id: 'comp-003',
    templateId: 'act-reflection',
    activityType: 'reflection',
    pageNumber: 41,
    studentId: 'demo-student',
    title: '학습 성찰 일지',
    completedAt: new Date('2025-08-05T15:45:00'),
    timeSpent: 8,
    content: {
      s1: '비판적 사고를 통해 정보를 올바르게 판단하는 방법 배우기',
      s2: `가장 흥미로웠던 것은 우리 주변에 생각보다 많은 가짜뉴스가 있다는 점이었어요. 
      
      특히 SNS에서 빠르게 퍼지는 정보들이 대부분 검증되지 않은 것이라는 게 놀라웠습니다.`,
      s3: `'확증편향'이라는 개념이 어려웠어요. 자신이 믿고 싶은 것만 믿는다는 게 정확히 무슨 의미인지 잘 모르겠어요.
      
      실제 사례를 더 많이 보고 싶습니다.`,
      s4: '다음에는 실제 뉴스를 가지고 직접 팩트체크를 해보고 싶어요.'
    },
    status: 'submitted'
  }
]

// 활동 생성을 위한 헬퍼 함수
export function generateActivityFromTemplate(
  template: ActivityTemplate,
  pageNumber: number,
  studentId: string
): CompletedActivity {
  return {
    id: `activity-${Date.now()}`,
    templateId: template.id,
    activityType: template.type,
    pageNumber,
    studentId,
    title: template.title,
    completedAt: new Date(),
    timeSpent: 0,
    content: {},
    status: 'draft'
  }
}

// 포트폴리오 통계 계산
export function calculatePortfolioStats(activities: CompletedActivity[]) {
  const totalActivities = activities.length
  const completedActivities = activities.filter(a => a.status === 'evaluated').length
  const totalTimeSpent = activities.reduce((sum, a) => sum + a.timeSpent, 0)
  const averageScore = activities
    .filter(a => a.evaluation?.score)
    .reduce((sum, a, _, arr) => sum + (a.evaluation?.score || 0) / arr.length, 0)
  
  const activityTypeCount = activities.reduce((acc, a) => {
    acc[a.activityType] = (acc[a.activityType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalActivities,
    completedActivities,
    totalTimeSpent,
    averageScore: Math.round(averageScore),
    activityTypeCount,
    completionRate: Math.round((completedActivities / totalActivities) * 100)
  }
}