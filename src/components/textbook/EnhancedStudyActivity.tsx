'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles,
  FileText,
  Trophy,
  Plus,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

// Dynamic imports to avoid SSR issues
const ActivityGenerator = dynamic(
  () => import('./study-activity/ActivityGenerator').then(mod => mod.ActivityGenerator),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const ActivityWorkspace = dynamic(
  () => import('./study-activity/ActivityWorkspace').then(mod => mod.ActivityWorkspace),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const Portfolio = dynamic(
  () => import('./study-activity/Portfolio').then(mod => mod.Portfolio),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

import { 
  ActivityTemplate, 
  CompletedActivity, 
  sampleCompletedActivities 
} from './study-activity/ActivityTemplates'

interface StudyActivityProps {
  pageNumber: number
  studentId?: string
  classCode?: string
  studentName?: string
}

export function EnhancedStudyActivity({ 
  pageNumber, 
  studentId = 'demo-student', 
  classCode = 'demo',
  studentName = '홍길동'
}: StudyActivityProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('generator')
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([])
  const [currentActivityIds, setCurrentActivityIds] = useState<string[]>([])
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Load saved activities and sample data on mount
  useEffect(() => {
    if (!mounted) return
    
    // Load from localStorage
    const savedActivities = localStorage.getItem(`portfolio-${studentId}`)
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities)
        setCompletedActivities(parsed)
      } catch (error) {
        console.error('Failed to load portfolio:', error)
      }
    } else {
      // Load sample data for demo
      setCompletedActivities(sampleCompletedActivities)
    }
    
    // Track which activities have been completed for this page
    const pageActivities = completedActivities
      .filter(a => a.pageNumber === pageNumber)
      .map(a => a.templateId)
    setCurrentActivityIds(pageActivities)
  }, [mounted, studentId, pageNumber])
  
  const handleSelectActivity = (template: ActivityTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('workspace')
  }
  
  const handleCompleteActivity = (activity: CompletedActivity) => {
    // Add to completed activities
    const newActivities = [...completedActivities, activity]
    setCompletedActivities(newActivities)
    
    // Save to localStorage
    localStorage.setItem(`portfolio-${studentId}`, JSON.stringify(newActivities))
    
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
  
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  // Show workspace if template is selected
  if (selectedTemplate && activeTab === 'workspace') {
    return (
      <div className="h-full">
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
    <div className="h-full flex flex-col p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
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
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
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
            
            <TabsContent value="generator" className="flex-1 overflow-y-auto">
              <ActivityGenerator
                pageNumber={pageNumber}
                onSelectActivity={handleSelectActivity}
                currentActivities={currentActivityIds}
              />
            </TabsContent>
            
            <TabsContent value="workspace" className="flex-1">
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
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">활동을 선택해주세요</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
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