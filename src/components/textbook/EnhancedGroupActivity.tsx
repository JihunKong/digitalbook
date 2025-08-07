'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  MessageSquare,
  FileText,
  Activity as ActivityIcon,
  Loader2
} from 'lucide-react'
import { criticalThinkingProject } from './group-activity/ProjectData'

// Dynamic imports to avoid SSR issues
const ProjectDashboard = dynamic(
  () => import('./group-activity/ProjectDashboard').then(mod => mod.ProjectDashboard),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const KanbanBoard = dynamic(
  () => import('./group-activity/KanbanBoard').then(mod => mod.KanbanBoard),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const CalendarView = dynamic(
  () => Promise.resolve({ default: CalendarViewComponent }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const FilesView = dynamic(
  () => Promise.resolve({ default: FilesViewComponent }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const DiscussionView = dynamic(
  () => Promise.resolve({ default: DiscussionViewComponent }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

const ActivityLog = dynamic(
  () => Promise.resolve({ default: ActivityLogComponent }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

interface GroupActivityProps {
  groupId?: string
  studentName?: string
}

export function EnhancedGroupActivity({ groupId = 'demo-group', studentName = '홍길동' }: GroupActivityProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Use the comprehensive project data
  const project = {
    ...criticalThinkingProject,
    team: criticalThinkingProject.team.map(member => 
      member.name === '홍길동' ? { ...member, name: studentName } : member
    )
  }
  
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="dashboard" className="text-xs">
            <LayoutDashboard className="w-4 h-4 mr-1" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="kanban" className="text-xs">
            <Kanban className="w-4 h-4 mr-1" />
            칸반보드
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">
            <Calendar className="w-4 h-4 mr-1" />
            일정
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <FileText className="w-4 h-4 mr-1" />
            파일
          </TabsTrigger>
          <TabsTrigger value="discussion" className="text-xs">
            <MessageSquare className="w-4 h-4 mr-1" />
            토론
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            <ActivityIcon className="w-4 h-4 mr-1" />
            활동
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="flex-1 overflow-y-auto p-4">
          <ProjectDashboard project={project} />
        </TabsContent>
        
        <TabsContent value="kanban" className="flex-1 overflow-hidden p-4">
          <KanbanBoard project={project} />
        </TabsContent>
        
        <TabsContent value="calendar" className="flex-1 overflow-y-auto p-4">
          <CalendarView project={project} />
        </TabsContent>
        
        <TabsContent value="files" className="flex-1 overflow-y-auto p-4">
          <FilesView project={project} />
        </TabsContent>
        
        <TabsContent value="discussion" className="flex-1 overflow-y-auto p-4">
          <DiscussionView project={project} />
        </TabsContent>
        
        <TabsContent value="activity" className="flex-1 overflow-y-auto p-4">
          <ActivityLog project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Calendar View Component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function CalendarViewComponent({ project }: { project: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            프로젝트 일정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.milestones.map((milestone: any) => (
              <div key={milestone.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  milestone.status === 'completed' ? 'bg-green-500' :
                  milestone.status === 'at_risk' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <span className="text-sm text-gray-600">
                      {milestone.date.toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주간 일정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date('2025-08-11')
              date.setDate(date.getDate() + i)
              const hasTask = project.phases
                .flatMap((p: any) => p.tasks)
                .some((t: any) => 
                  t.dueDate.toDateString() === date.toDateString()
                )
              
              return (
                <div
                  key={i}
                  className={`p-2 text-xs rounded ${
                    hasTask ? 'bg-blue-100' : 'bg-gray-50'
                  }`}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Files View Component
function FilesViewComponent({ project }: { project: any }) {
  const allFiles = project.phases.flatMap((phase: any) => 
    phase.tasks.flatMap((task: any) => 
      task.attachments.map((att: any) => ({ ...att, taskTitle: task.title }))
    )
  )
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            공유 파일
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allFiles.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-600">
                      {file.taskTitle} • {file.uploadedBy} • {file.size}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">다운로드</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">리소스</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {project.resources.map((resource: any) => (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{resource.title}</p>
                  <p className="text-xs text-gray-600">{resource.description}</p>
                </div>
                <Button variant="outline" size="sm">열기</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Discussion View Component
function DiscussionViewComponent({ project }: { project: any }) {
  const allComments = project.phases.flatMap((phase: any) => 
    phase.tasks.flatMap((task: any) => 
      task.comments.map((comment: any) => ({ ...comment, taskTitle: task.title }))
    )
  ).sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            팀 토론
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allComments.slice(0, 10).map((comment: any) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                  {comment.author.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.author}</span>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp.toLocaleString('ko-KR')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {comment.taskTitle}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  {comment.reactions && (
                    <div className="flex gap-1 mt-2">
                      {comment.reactions.map((reaction: string, idx: number) => (
                        <span key={idx}>{reaction}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Activity Log Component
function ActivityLogComponent({ project }: { project: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            활동 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.activityLog.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.user}</span>
                    <span className="text-gray-600">
                      {log.action === 'created' && '생성함'}
                      {log.action === 'updated' && '수정함'}
                      {log.action === 'completed' && '완료함'}
                      {log.action === 'commented' && '댓글 작성'}
                      {log.action === 'uploaded' && '업로드함'}
                      {log.action === 'started' && '시작함'}
                      {log.action === 'reviewed' && '검토함'}
                    </span>
                    <span className="text-gray-600">{log.target}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.timestamp.toLocaleString('ko-KR')} • {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}