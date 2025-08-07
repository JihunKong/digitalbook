'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MoreVertical,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlertTriangle,
  Users,
  ChevronRight,
  Eye
} from 'lucide-react'
import { Task, GroupProject } from './ProjectData'
import { TaskDetail } from './TaskDetail'

interface KanbanBoardProps {
  project: GroupProject
}

interface KanbanColumn {
  id: string
  title: string
  status: Task['status']
  color: string
  wipLimit?: number
}

const columns: KanbanColumn[] = [
  { 
    id: 'todo', 
    title: '할 일', 
    status: 'todo', 
    color: 'bg-gray-100',
    wipLimit: 8
  },
  { 
    id: 'in_progress', 
    title: '진행 중', 
    status: 'in_progress', 
    color: 'bg-blue-100',
    wipLimit: 3
  },
  { 
    id: 'in_review', 
    title: '검토 중', 
    status: 'in_review', 
    color: 'bg-yellow-100',
    wipLimit: 2
  },
  { 
    id: 'completed', 
    title: '완료', 
    status: 'completed', 
    color: 'bg-green-100'
  }
]

export function KanbanBoard({ project }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  
  // Collect all tasks from all phases
  const allTasks = project.phases.reduce<Task[]>((tasks, phase) => {
    return [...tasks, ...phase.tasks]
  }, [])
  
  // Group tasks by status
  const tasksByStatus = columns.reduce<Record<string, Task[]>>((acc, column) => {
    acc[column.status] = allTasks.filter(task => task.status === column.status)
    return acc
  }, {} as Record<string, Task[]>)
  
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }
  
  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return '긴급'
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return priority
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
  
  const isOverdue = (task: Task) => {
    if (task.status === 'completed') return false
    const daysRemaining = getDaysRemaining(task.dueDate)
    return daysRemaining < 0
  }
  
  const isUrgent = (task: Task) => {
    if (task.status === 'completed') return false
    const daysRemaining = getDaysRemaining(task.dueDate)
    return daysRemaining >= 0 && daysRemaining <= 2
  }
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }
  
  const getSubtaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) return 0
    const completed = task.subtasks.filter(st => st.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }
  
  return (
    <>
      <div className="h-full flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => {
          const tasks = tasksByStatus[column.status] || []
          const isOverLimit = column.wipLimit && tasks.length > column.wipLimit
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className="h-full flex flex-col">
                <CardHeader className={`${column.color} border-b`}>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {column.title}
                      <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                      </Badge>
                    </span>
                    {column.wipLimit && (
                      <span className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
                        WIP: {tasks.length}/{column.wipLimit}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
                  {tasks.map(task => {
                    const subtaskProgress = getSubtaskProgress(task)
                    const overdue = isOverdue(task)
                    const urgent = isUrgent(task)
                    
                    return (
                      <Card 
                        key={task.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          overdue ? 'border-red-300 bg-red-50' : 
                          urgent ? 'border-yellow-300 bg-yellow-50' : ''
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Priority and Options */}
                          <div className="flex items-start justify-between">
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Task Title */}
                          <h4 className="text-sm font-medium line-clamp-2">
                            {task.title}
                          </h4>
                          
                          {/* Task Description */}
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          {/* Subtasks Progress */}
                          {task.subtasks.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <CheckSquare className="w-3 h-3" />
                                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                </span>
                                <span className="text-gray-600">{subtaskProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-blue-500 h-1 rounded-full transition-all"
                                  style={{ width: `${subtaskProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Task Meta */}
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {/* Due Date */}
                            <span className={`flex items-center gap-1 ${
                              overdue ? 'text-red-600 font-medium' : 
                              urgent ? 'text-yellow-600 font-medium' : ''
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                              {overdue && ' (지남)'}
                              {urgent && ` (${getDaysRemaining(task.dueDate)}일)`}
                            </span>
                            
                            {/* Time Tracking */}
                            {task.timeTracking.actual > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.timeTracking.actual}h
                              </span>
                            )}
                          </div>
                          
                          {/* Assignees and Indicators */}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {task.assignees.slice(0, 3).map((assignee, idx) => (
                                <Avatar key={idx} className="w-6 h-6 border border-white">
                                  <AvatarFallback className="text-xs">
                                    {assignee.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {task.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                                  <span className="text-xs">+{task.assignees.length - 3}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {/* Comments */}
                              {task.comments.length > 0 && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MessageSquare className="w-3 h-3" />
                                  <span className="text-xs">{task.comments.length}</span>
                                </div>
                              )}
                              
                              {/* Attachments */}
                              {task.attachments.length > 0 && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Paperclip className="w-3 h-3" />
                                  <span className="text-xs">{task.attachments.length}</span>
                                </div>
                              )}
                              
                              {/* Dependencies */}
                              {task.dependencies.length > 0 && (
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                  
                  {/* Empty State */}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">작업이 없습니다</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
      
      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          project={project}
          onClose={() => {
            setShowTaskDetail(false)
            setSelectedTask(null)
          }}
        />
      )}
    </>
  )
}