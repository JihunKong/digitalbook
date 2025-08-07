'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Trophy,
  BarChart,
  CheckCircle,
  Info,
  Sparkles,
  Target,
  Zap
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
    title: '환영합니다! 🎒',
    content: '디지털 교과서로 재미있게 공부해보세요. 이 투어를 통해 주요 기능을 안내해드릴게요!',
    position: 'bottom'
  },
  {
    target: 'my-textbooks',
    title: '내 교과서',
    content: '선생님이 준비한 디지털 교과서들이 여기 있어요. 클릭해서 학습을 시작하세요!',
    position: 'bottom'
  },
  {
    target: 'ai-tutor',
    title: 'AI 튜터',
    content: 'AI 튜터가 24시간 여러분의 질문에 답해드려요. 모르는 것이 있으면 언제든 물어보세요!',
    position: 'right'
  },
  {
    target: 'progress-tracker',
    title: '학습 진도',
    content: '얼마나 공부했는지, 어떤 부분이 부족한지 한눈에 볼 수 있어요.',
    position: 'left'
  },
  {
    target: 'achievements',
    title: '성취 배지',
    content: '열심히 공부하면 멋진 배지를 받을 수 있어요! 친구들과 경쟁해보세요.',
    position: 'bottom'
  },
  {
    target: 'assignments',
    title: '과제 목록',
    content: '선생님이 내준 과제들이 여기 표시돼요. 기한 내에 제출하는 것을 잊지 마세요!',
    position: 'top'
  }
]

export function StudentDemoTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if this is a demo session
    const urlParams = new URLSearchParams(window.location.search)
    const isDemo = urlParams.get('demo') === 'true' || localStorage.getItem('isStudentDemo') === 'true'
    
    if (isDemo && !localStorage.getItem('studentTourCompleted')) {
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
    localStorage.setItem('studentTourCompleted', 'true')
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
          <div class="font-semibold">투어 완료! 🎉</div>
          <div class="text-sm">이제 디지털 교과서로 재미있게 공부해보세요!</div>
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
                      index === currentStep ? 'bg-green-600' : 
                      index < currentStep ? 'bg-green-400' : 'bg-gray-300'
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
                  시작하기
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
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
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.5);
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

// Interactive Learning Demo Component
export function InteractiveLearningDemo() {
  const [showHint, setShowHint] = useState(false)
  const [answer, setAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  
  const checkAnswer = () => {
    const correct = answer.toLowerCase().includes('한글')
    setIsCorrect(correct)
    
    if (correct) {
      // Trigger achievement animation
      setTimeout(() => {
        showAchievement()
      }, 500)
    }
  }
  
  const showAchievement = () => {
    const achievement = document.createElement('div')
    achievement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-white p-8 rounded-full shadow-2xl z-50 animate-bounce'
    achievement.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-2">🏆</div>
        <div class="text-xl font-bold">첫 정답!</div>
        <div class="text-sm">+10 포인트</div>
      </div>
    `
    document.body.appendChild(achievement)
    
    setTimeout(() => {
      achievement.remove()
    }, 3000)
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-6 max-w-md z-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">대화형 학습 체험</h4>
        <Sparkles className="w-5 h-5 text-purple-600" />
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium mb-2">문제: 우리나라 고유의 문자는 무엇일까요?</p>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="답을 입력하세요"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      {showHint && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
          <p className="text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-1" />
            힌트: 세종대왕이 만든 문자예요!
          </p>
        </div>
      )}
      
      {isCorrect !== null && (
        <div className={`${isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'} border-l-4 p-3 mb-4`}>
          <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '🎉 정답입니다!' : '다시 한번 생각해보세요!'}
          </p>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={() => setShowHint(true)}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
        >
          <Zap className="w-4 h-4 inline mr-1" />
          힌트 보기
        </button>
        <button
          onClick={checkAnswer}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
        >
          <Target className="w-4 h-4 inline mr-1" />
          정답 확인
        </button>
      </div>
    </div>
  )
}