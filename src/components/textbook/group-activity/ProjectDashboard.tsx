'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react'
import { 
  GroupProject, 
  getProjectProgress, 
  getPhaseProgress,
  getUpcomingDeadlines,
  getBlockedTasks 
} from './ProjectData'

interface ProjectDashboardProps {
  project: GroupProject
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const projectProgress = getProjectProgress(project)
  const upcomingDeadlines = getUpcomingDeadlines(project, 3)
  const blockedTasks = getBlockedTasks(project)
  
  const getPhaseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">완료</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">진행중</Badge>
      case 'not_started':
        return <Badge variant="outline">시작 전</Badge>
      case 'delayed':
        return <Badge className="bg-red-100 text-red-700">지연</Badge>
      default:
        return null
    }
  }
  
  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'at_risk':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'missed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  const getDaysRemaining = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }
  
  return (
    <div className="space-y-4">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {project.subject}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{projectProgress}%</p>
              <p className="text-xs text-gray-600">전체 진행률</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={projectProgress} className="h-2" />
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">총 작업</p>
                <p className="text-xl font-bold">
                  {project.phases.reduce((sum, p) => sum + p.tasks.length, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">완료된 작업</p>
                <p className="text-xl font-bold">
                  {project.phases.reduce(
                    (sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length,
                    0
                  )}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">팀원</p>
                <p className="text-xl font-bold">{project.team.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">남은 기간</p>
                <p className="text-xl font-bold">
                  {getDaysRemaining(project.endDate)}일
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            프로젝트 단계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.phases.map((phase, idx) => {
              const phaseProgress = getPhaseProgress(phase)
              return (
                <div key={phase.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{phase.title}</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{phaseProgress}%</span>
                      {getPhaseStatusBadge(phase.status)}
                    </div>
                  </div>
                  <Progress value={phaseProgress} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Team & Contributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5" />
            팀원 기여도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.team.map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-gray-600">
                      {member.role === 'leader' && '조장'}
                      {member.role === 'researcher' && '연구원'}
                      {member.role === 'writer' && '작성자'}
                      {member.role === 'designer' && '디자이너'}
                      {member.role === 'reviewer' && '검토자'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {member.tasksCompleted}/{member.tasksAssigned}
                  </p>
                  <Progress 
                    value={(member.tasksCompleted / member.tasksAssigned) * 100} 
                    className="w-20 h-1.5 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5" />
            주요 마일스톤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.milestones.map(milestone => (
              <div key={milestone.id} className="flex items-start gap-3">
                {getMilestoneStatusIcon(milestone.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{milestone.title}</p>
                    <span className="text-xs text-gray-600">
                      {formatDate(milestone.date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Alerts Section */}
      {(upcomingDeadlines.length > 0 || blockedTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                  <Clock className="w-5 h-5" />
                  다가오는 마감일
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 3).map(task => (
                    <div key={task.id} className="text-sm">
                      <p className="font-medium text-yellow-900">{task.title}</p>
                      <p className="text-xs text-yellow-700">
                        {formatDate(task.dueDate)} ({getDaysRemaining(task.dueDate)}일 남음)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Blocked Tasks */}
          {blockedTasks.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  대기 중인 작업
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="text-sm">
                      <p className="font-medium text-red-900">{task.title}</p>
                      <p className="text-xs text-red-700">
                        선행 작업 완료 필요
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}