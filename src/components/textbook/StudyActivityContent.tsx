'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles,
  FileText,
  Trophy,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

// Import the components
import { ActivityGenerator } from './study-activity/ActivityGenerator'
import { ActivityWorkspace } from './study-activity/ActivityWorkspace'
import { Portfolio } from './study-activity/Portfolio'
import { 
  ActivityTemplate, 
  CompletedActivity, 
  sampleCompletedActivities 
} from './study-activity/ActivityTemplates'

interface StudyActivityContentProps {
  pageNumber: number
  studentId?: string
  classCode?: string
  studentName?: string
}

export function StudyActivityContent({ 
  pageNumber, 
  studentId = 'demo-student', 
  classCode = 'demo',
  studentName = '홍길동'
}: StudyActivityContentProps) {
  const [activeTab, setActiveTab] = useState('generator')
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([])
  const [currentActivityIds, setCurrentActivityIds] = useState<string[]>([])
  
  // Load saved activities - only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const savedActivities = localStorage.getItem(`portfolio-${studentId}`)
      if (savedActivities) {
        const parsed = JSON.parse(savedActivities)
        setCompletedActivities(parsed)
      } else {
        // Load sample data for demo
        setCompletedActivities(sampleCompletedActivities)
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error)
      // Use sample data as fallback
      setCompletedActivities(sampleCompletedActivities)
    }
  }, [studentId])
  
  // Update current activity IDs when completedActivities or pageNumber changes
  useEffect(() => {
    const pageActivities = completedActivities
      .filter(a => a.pageNumber === pageNumber)
      .map(a => a.templateId)
    setCurrentActivityIds(pageActivities)
  }, [completedActivities, pageNumber])
  
  const handleSelectActivity = (template: ActivityTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('workspace')
  }
  
  const handleCompleteActivity = (activity: CompletedActivity) => {
    // Add to completed activities
    const newActivities = [...completedActivities, activity]
    setCompletedActivities(newActivities)
    
    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`portfolio-${studentId}`, JSON.stringify(newActivities))
      } catch (error) {
        console.error('Failed to save portfolio:', error)
      }
    }
    
    // Update current page activity IDs
    if (activity.pageNumber === pageNumber) {
      setCurrentActivityIds([...currentActivityIds, activity.templateId])
    }
    
    // Show success message and switch to portfolio
    toast.success('활동이 성공적으로 완료되었습니다!')
    setSelectedTemplate(null)
    setActiveTab('portfolio')
  }
  
  const handleBackToGenerator = () => {
    setSelectedTemplate(null)
    setActiveTab('generator')
  }
  
  // Show workspace if template is selected
  if (selectedTemplate && activeTab === 'workspace') {
    return (
      <div className="h-full overflow-hidden">
        <ActivityWorkspace
          template={selectedTemplate}
          pageNumber={pageNumber}
          studentId={studentId}
          onComplete={handleCompleteActivity}
          onBack={handleBackToGenerator}
        />
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col p-2 overflow-hidden">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">학습활동 - {pageNumber}페이지</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('generator')}
              >
                <Plus className="w-4 h-4 mr-1" />
                새 활동
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                활동 생성
              </TabsTrigger>
              <TabsTrigger value="workspace" className="flex items-center gap-2" disabled={!selectedTemplate}>
                <FileText className="w-4 h-4" />
                작업 공간
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                포트폴리오
                {completedActivities.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {completedActivities.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generator" className="flex-1 overflow-y-auto p-3">
              <ActivityGenerator
                pageNumber={pageNumber}
                onSelectActivity={handleSelectActivity}
                currentActivities={currentActivityIds}
              />
            </TabsContent>
            
            <TabsContent value="workspace" className="flex-1 overflow-hidden">
              {selectedTemplate ? (
                <ActivityWorkspace
                  template={selectedTemplate}
                  pageNumber={pageNumber}
                  studentId={studentId}
                  onComplete={handleCompleteActivity}
                  onBack={handleBackToGenerator}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">활동을 선택해주세요</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setActiveTab('generator')}
                    >
                      활동 선택하기
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="portfolio" className="flex-1 overflow-hidden">
              <Portfolio
                activities={completedActivities}
                studentName={studentName}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}