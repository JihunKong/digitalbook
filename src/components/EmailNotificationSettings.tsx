'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Bell, 
  Settings, 
  Check, 
  AlertCircle, 
  Info,
  Calendar,
  BookOpen,
  Users,
  Award,
  MessageSquare,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccessibility } from './AccessibilityProvider'
import { useToast } from '@/components/ui/use-toast'

interface NotificationPreferences {
  assignments: boolean
  grades: boolean
  announcements: boolean
  reminders: boolean
  collaboration: boolean
  system: boolean
  weeklyDigest: boolean
}

interface EmailTemplate {
  id: string
  name: string
  description: string
  lastSent?: Date
  enabled: boolean
}

const notificationTypes = [
  {
    key: 'assignments' as keyof NotificationPreferences,
    title: '과제 알림',
    description: '새로운 과제 생성, 마감일 알림, 채점 완료 알림',
    icon: BookOpen,
    category: 'academic',
    examples: ['새 과제가 등록되었습니다', '과제 마감 24시간 전 알림', '과제가 채점되었습니다']
  },
  {
    key: 'grades' as keyof NotificationPreferences,
    title: '성적 알림',
    description: '시험 결과, 과제 점수, 성적 변동사항',
    icon: Award,
    category: 'academic',
    examples: ['퀴즈 결과가 나왔습니다', '성적이 업데이트되었습니다']
  },
  {
    key: 'announcements' as keyof NotificationPreferences,
    title: '공지사항',
    description: '중요 공지, 일정 변경, 학사 공지',
    icon: Bell,
    category: 'general',
    examples: ['중요 공지사항이 있습니다', '수업 일정이 변경되었습니다']
  },
  {
    key: 'reminders' as keyof NotificationPreferences,
    title: '리마인더',
    description: '마감일 알림, 수업 시간 알림',
    icon: Calendar,
    category: 'general',
    examples: ['수업 시작 30분 전입니다', '과제 제출 마감 1일 전']
  },
  {
    key: 'collaboration' as keyof NotificationPreferences,
    title: '협업 알림',
    description: '팀 프로젝트, 그룹 활동, 댓글 알림',
    icon: Users,
    category: 'social',
    examples: ['팀 프로젝트에 초대되었습니다', '새로운 댓글이 달렸습니다']
  },
  {
    key: 'system' as keyof NotificationPreferences,
    title: '시스템 알림',
    description: '보안 알림, 계정 관련, 시스템 점검',
    icon: Shield,
    category: 'system',
    examples: ['비밀번호가 변경되었습니다', '시스템 점검 안내']
  },
  {
    key: 'weeklyDigest' as keyof NotificationPreferences,
    title: '주간 요약',
    description: '주간 학습 활동 요약, 성과 리포트',
    icon: MessageSquare,
    category: 'digest',
    examples: ['이번 주 학습 활동 요약', '월간 성과 리포트']
  }
]

export function EmailNotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    assignments: true,
    grades: true,
    announcements: true,
    reminders: true,
    collaboration: true,
    system: false,
    weeklyDigest: true,
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [emailFrequency, setEmailFrequency] = useState('immediate')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const { announceToScreenReader } = useAccessibility()
  const { toast } = useToast()

  useEffect(() => {
    loadPreferences()
    loadTemplates()
  }, [])

  const loadPreferences = async () => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/email/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.data)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast({
        title: '설정 로드 실패',
        description: '이메일 알림 설정을 불러올 수 없습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      // Mock API call - replace with actual API
      const mockTemplates: EmailTemplate[] = [
        {
          id: 'assignmentCreated',
          name: '과제 생성 알림',
          description: '새로운 과제가 생성되었을 때 발송',
          lastSent: new Date('2024-06-20'),
          enabled: true
        },
        {
          id: 'weeklyDigest',
          name: '주간 학습 요약',
          description: '매주 금요일 학습 활동 요약 발송',
          lastSent: new Date('2024-06-21'),
          enabled: true
        },
        {
          id: 'assignmentDue',
          name: '과제 마감 알림',
          description: '과제 마감 24시간 전 알림',
          lastSent: new Date('2024-06-19'),
          enabled: true
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    
    announceToScreenReader(
      `${notificationTypes.find(n => n.key === key)?.title} 알림이 ${value ? '활성화' : '비활성화'}되었습니다.`
    )

    // Auto-save preferences
    await savePreferences(newPreferences)
  }

  const savePreferences = async (newPreferences?: NotificationPreferences) => {
    setIsSaving(true)
    try {
      const dataToSave = newPreferences || preferences
      
      // Mock API call - replace with actual API
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        setLastSaved(new Date())
        toast({
          title: '설정 저장 완료',
          description: '이메일 알림 설정이 저장되었습니다.'
        })
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast({
        title: '저장 실패',
        description: '설정을 저장할 수 없습니다. 다시 시도해 주세요.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const sendTestEmail = async (templateId: string) => {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'user@example.com', // Replace with actual user email
          template: templateId,
          data: {
            title: '테스트 과제',
            subject: '국어',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            description: '테스트용 과제입니다.'
          }
        })
      })

      if (response.ok) {
        toast({
          title: '테스트 이메일 발송',
          description: '테스트 이메일이 발송되었습니다.'
        })
      } else {
        throw new Error('Failed to send test email')
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      toast({
        title: '테스트 이메일 발송 실패',
        description: '테스트 이메일을 발송할 수 없습니다.',
        variant: 'destructive'
      })
    }
  }

  const getEnabledCount = () => {
    return Object.values(preferences).filter(Boolean).length
  }

  const groupedNotifications = notificationTypes.reduce((groups, notification) => {
    const category = notification.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(notification)
    return groups
  }, {} as Record<string, typeof notificationTypes>)

  const categoryTitles = {
    academic: '학습 관련',
    general: '일반 알림',
    social: '소셜 활동',
    system: '시스템',
    digest: '요약 리포트'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">이메일 알림 설정</h2>
          <p className="text-muted-foreground">
            받고 싶은 이메일 알림을 선택하세요 ({getEnabledCount()}개 활성화됨)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              {lastSaved.toLocaleTimeString('ko-KR')} 저장됨
            </div>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                고급 설정
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>고급 이메일 설정</DialogTitle>
                <DialogDescription>
                  이메일 발송 빈도와 형식을 설정하세요
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="frequency">알림 빈도</Label>
                  <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">즉시</SelectItem>
                      <SelectItem value="hourly">1시간마다</SelectItem>
                      <SelectItem value="daily">하루 한 번</SelectItem>
                      <SelectItem value="weekly">주 1회</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allEnabled = {
              assignments: true,
              grades: true,
              announcements: true,
              reminders: true,
              collaboration: true,
              system: true,
              weeklyDigest: true
            } as NotificationPreferences
            setPreferences(allEnabled)
            savePreferences(allEnabled)
          }}
        >
          모두 켜기
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allDisabled = {
              assignments: false,
              grades: false,
              announcements: false,
              reminders: false,
              collaboration: false,
              system: false,
              weeklyDigest: false
            } as NotificationPreferences
            setPreferences(allDisabled)
            savePreferences(allDisabled)
          }}
        >
          모두 끄기
        </Button>
      </div>

      {/* Notification Categories */}
      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([category, notifications]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </CardTitle>
              <CardDescription>
                {category === 'academic' && '학습과 직접 관련된 알림입니다'}
                {category === 'general' && '일반적인 서비스 알림입니다'}
                {category === 'social' && '다른 사용자와의 상호작용 알림입니다'}
                {category === 'system' && '시스템 보안 및 관리 알림입니다'}
                {category === 'digest' && '주기적으로 발송되는 요약 정보입니다'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {notifications.map((notification) => {
                const Icon = notification.icon
                const isEnabled = preferences[notification.key]
                
                return (
                  <div key={notification.key} className="flex items-start space-x-4">
                    <div className="mt-1">
                      <Icon className={`h-5 w-5 ${
                        isEnabled ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={notification.key}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {notification.title}
                            </Label>
                            {isEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                활성화
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                        </div>
                        
                        <Switch
                          id={notification.key}
                          checked={isEnabled}
                          onCheckedChange={(checked) => 
                            updatePreference(notification.key, checked)
                          }
                          disabled={isSaving}
                          aria-describedby={`${notification.key}-description`}
                        />
                      </div>
                      
                      {/* Examples */}
                      {isEnabled && notification.examples && (
                        <div className="ml-2 pl-3 border-l-2 border-muted">
                          <p className="text-xs text-muted-foreground mb-1">예시:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {notification.examples.map((example, index) => (
                              <li key={index}>• {example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            이메일 템플릿
          </CardTitle>
          <CardDescription>
            시스템에서 사용되는 이메일 템플릿을 확인하고 테스트할 수 있습니다
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  {template.lastSent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      마지막 발송: {template.lastSent.toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={template.enabled ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {template.enabled ? '활성화' : '비활성화'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestEmail(template.id)}
                  >
                    테스트 발송
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          이메일 알림 설정은 즉시 적용됩니다. 스팸 폴더도 확인해 주세요. 
          알림을 받지 못하는 경우 <a href="mailto:support@digitalbook.kr" className="underline">고객지원</a>으로 문의해 주세요.
        </AlertDescription>
      </Alert>

      {/* Status indicators */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            설정 저장 중...
          </div>
        </div>
      )}
    </div>
  )
}