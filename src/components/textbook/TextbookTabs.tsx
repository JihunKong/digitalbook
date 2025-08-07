'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, PenTool, Users, Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TextbookTabsProps {
  children: React.ReactNode
  onTabChange?: (value: string) => void
  activeTab?: string
}

export function TextbookTabs({ children, onTabChange, activeTab: externalActiveTab }: TextbookTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('textbook')
  const activeTab = externalActiveTab || internalActiveTab
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleTabChange = (value: string) => {
    setInternalActiveTab(value)
    onTabChange?.(value)
    
    // TTS 중지
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleTTS = () => {
    if (!window.speechSynthesis) {
      alert('이 브라우저는 음성 읽기를 지원하지 않습니다.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      // 현재 페이지의 텍스트 가져오기
      const textContent = document.querySelector('.textbook-content')?.textContent || ''
      if (!textContent) {
        alert('읽을 내용이 없습니다.')
        return
      }

      const utterance = new SpeechSynthesisUtterance(textContent)
      utterance.lang = 'ko-KR'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      
      utterance.onend = () => {
        setIsSpeaking(false)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        alert('음성 읽기 중 오류가 발생했습니다.')
      }

      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between border-b px-4">
        <TabsList className="h-12 bg-transparent border-0">
          <TabsTrigger value="textbook" className="data-[state=active]:bg-white">
            <BookOpen className="w-4 h-4 mr-2" />
            교재 보기
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white">
            <PenTool className="w-4 h-4 mr-2" />
            학습활동
          </TabsTrigger>
          <TabsTrigger value="group" className="data-[state=active]:bg-white">
            <Users className="w-4 h-4 mr-2" />
            모둠활동
          </TabsTrigger>
        </TabsList>
        
        {activeTab === 'textbook' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTTS}
            className="ml-2"
            title={isSpeaking ? '읽기 중지' : '음성으로 읽기'}
          >
            {isSpeaking ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                중지
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-1" />
                읽기
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <TabsContent value="textbook" className="h-full m-0">
          <div className="textbook-content h-full">
            {children}
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="h-full m-0">
          <div className="h-full">
            {/* 학습활동 컴포넌트가 여기 들어갑니다 */}
          </div>
        </TabsContent>
        
        <TabsContent value="group" className="h-full m-0">
          <div className="h-full">
            {/* 모둠활동 컴포넌트가 여기 들어갑니다 */}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}