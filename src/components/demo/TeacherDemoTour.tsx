'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Users,
  BarChart,
  Sparkles,
  CheckCircle,
  Info
} from 'lucide-react'

interface TourStep {
  target: string
  title: string
  content: string
  action?: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: 'welcome',
    title: '환영합니다! 👋',
    content: '한국형 디지털 교과서 플랫폼에 오신 것을 환영합니다. 이 투어를 통해 주요 기능을 안내해드리겠습니다.',
    position: 'bottom'
  },
  {
    target: 'create-textbook-btn',
    title: 'AI로 교과서 만들기',
    content: 'AI가 2022 개정 교육과정에 맞춰 교과서를 자동으로 생성해드립니다. 클릭해서 시작해보세요!',
    position: 'bottom'
  },
  {
    target: 'textbook-list',
    title: '내 교과서 관리',
    content: '생성한 교과서들을 한눈에 보고 관리할 수 있습니다. 공개/비공개 설정도 가능합니다.',
    position: 'top'
  },
  {
    target: 'class-management',
    title: '학급 관리',
    content: '학생들을 초대하고, 학습 진도를 실시간으로 확인할 수 있습니다.',
    position: 'right'
  },
  {
    target: 'analytics-dashboard',
    title: '학습 분석',
    content: 'AI가 학생들의 학습 패턴을 분석해 맞춤형 인사이트를 제공합니다.',
    position: 'left'
  },
  {
    target: 'ai-features',
    title: 'AI 기능 활용',
    content: 'AI 튜터, 자동 문제 생성, 에세이 평가 등 다양한 AI 기능을 활용해보세요.',
    position: 'bottom'
  }
]

export function TeacherDemoTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if this is a demo session
    const urlParams = new URLSearchParams(window.location.search)
    const isDemo = urlParams.get('demo') === 'true' || localStorage.getItem('isDemo') === 'true'
    
    if (isDemo && !localStorage.getItem('tourCompleted')) {
      setTimeout(() => setIsActive(true), 1000)
    }
  }, [])

  useEffect(() => {
    if (isActive && tourSteps[currentStep]) {
      highlightElement(tourSteps[currentStep].target)
    }
  }, [currentStep, isActive])

  const highlightElement = (targetId: string) => {
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('demo-highlight')
    }

    // Add new highlight
    const element = document.getElementById(targetId)
    if (element) {
      element.classList.add('demo-highlight')
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedElement(element)
    }
  }

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    setIsActive(false)
    localStorage.setItem('tourCompleted', 'true')
    if (highlightedElement) {
      highlightedElement.classList.remove('demo-highlight')
    }
    
    // Show completion message
    showCompletionMessage()
  }

  const showCompletionMessage = () => {
    const message = document.createElement('div')
    message.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-in'
    message.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div class="font-semibold">투어 완료!</div>
          <div class="text-sm">이제 자유롭게 플랫폼을 탐색해보세요.</div>
        </div>
      </div>
    `
    document.body.appendChild(message)
    
    setTimeout(() => {
      message.remove()
    }, 5000)
  }

  const getTooltipPosition = (position?: string) => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2'
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2'
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2'
      default:
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2'
    }
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={completeTour} />
      
      {/* Tour Tooltip */}
      <div className="fixed z-50" style={{ inset: 0, pointerEvents: 'none' }}>
        <div id={`tour-step-${currentStep}`} className="relative">
          <div 
            className={`absolute ${getTooltipPosition(step.position)} bg-white rounded-lg shadow-xl p-4 max-w-sm pointer-events-auto`}
            style={{ width: '320px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <button
                onClick={completeTour}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <p className="text-gray-600 mb-4">{step.content}</p>
            
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-blue-600' : 
                      index < currentStep ? 'bg-blue-400' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {currentStep + 1} / {tourSteps.length}
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </button>
              
              {currentStep === tourSteps.length - 1 ? (
                <button
                  onClick={completeTour}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  완료
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Styles */}
      <style jsx global>{`
        .demo-highlight {
          position: relative;
          z-index: 45 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .8;
          }
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// Demo scenario component for structured walkthroughs
export function DemoScenario({ scenarioId }: { scenarioId: string }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  
  const scenarios = {
    'first-day': {
      title: '새 학기 준비 시나리오',
      steps: [
        {
          title: '교육과정 선택',
          instruction: '3학년 1학기 국어 교육과정을 선택하세요',
          validation: () => true,
          hint: '학년과 과목을 먼저 선택한 후 단원을 고르세요'
        },
        {
          title: 'AI 콘텐츠 생성',
          instruction: 'AI가 생성한 콘텐츠를 검토하고 수정하세요',
          validation: () => true,
          hint: '원하는 부분을 클릭해서 직접 편집할 수 있습니다'
        },
        {
          title: '학습 활동 추가',
          instruction: '퀴즈나 토론 주제를 추가해보세요',
          validation: () => true,
          hint: '+ 버튼을 클릭해서 다양한 활동을 추가할 수 있습니다'
        },
        {
          title: '교과서 발행',
          instruction: '교과서를 저장하고 학생들과 공유하세요',
          validation: () => true,
          hint: '공개 설정을 통해 다른 선생님들과도 공유할 수 있습니다'
        }
      ]
    }
  }
  
  const scenario = scenarios[scenarioId as keyof typeof scenarios]
  if (!scenario) return null
  
  const currentStepData = scenario.steps[currentStep]
  
  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
        <span className="text-sm text-gray-500">
          단계 {currentStep + 1}/{scenario.steps.length}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="font-medium text-gray-800 mb-1">{currentStepData.title}</p>
        <p className="text-sm text-gray-600">{currentStepData.instruction}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <button className="text-sm text-blue-600 hover:underline flex items-center">
          <Info className="w-4 h-4 mr-1" />
          힌트 보기
        </button>
        
        <button
          onClick={() => {
            if (currentStep < scenario.steps.length - 1) {
              setCurrentStep(currentStep + 1)
            } else {
              setIsComplete(true)
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          {currentStep < scenario.steps.length - 1 ? '다음 단계' : '완료'}
        </button>
      </div>
    </div>
  )
}