'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  X,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlertTriangle,
  Download,
  Send,
  Plus,
  Edit2,
  Trash2,
  ThumbsUp,
  Pin
} from 'lucide-react'
import { Task, GroupProject, Comment } from './ProjectData'

interface TaskDetailProps {
  task: Task
  project: GroupProject
  onClose: () => void
}

export function TaskDetail({ task, project, onClose }: TaskDetailProps) {
  const [newComment, setNewComment] = useState('')
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null)
  const [newSubtask, setNewSubtask] = useState('')
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  
  const getSubtaskProgress = () => {
    if (task.subtasks.length === 0) return 0
    const completed = task.subtasks.filter(st => st.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    })
  }
  
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getDaysRemaining = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }
  
  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Badge variant="outline">할 일</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">진행 중</Badge>
      case 'in_review':
        return <Badge className="bg-yellow-100 text-yellow-700">검토 중</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">완료</Badge>
      case 'blocked':
        return <Badge className="bg-red-100 text-red-700">차단됨</Badge>
      default:
        return null
    }
  }
  
  const getPriorityBadge = (priority: Task['priority']) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    }
    const labels = {
      critical: '긴급',
      high: '높음',
      medium: '보통',
      low: '낮음'
    }
    return (
      <Badge className={colors[priority]}>
        {labels[priority]}
      </Badge>
    )
  }
  
  const handleAddComment = () => {
    if (!newComment.trim()) return
    // In real app, would add comment to task
    setNewComment('')
  }
  
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    // In real app, would add subtask to task
    setNewSubtask('')
    setShowAddSubtask(false)
  }
  
  const subtaskProgress = getSubtaskProgress()
  const daysRemaining = getDaysRemaining(task.dueDate)
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
                {task.tags?.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">설명</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              )}
              
              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    세부 작업
                    <span className="text-gray-500">
                      ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                    </span>
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSubtask(!showAddSubtask)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    추가
                  </Button>
                </div>
                
                {subtaskProgress > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>{subtaskProgress}%</span>
                    </div>
                    <Progress value={subtaskProgress} className="h-2" />
                  </div>
                )}
                
                {showAddSubtask && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="새 세부 작업..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    />
                    <Button size="sm" onClick={handleAddSubtask}>추가</Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        readOnly
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                        {subtask.title}
                      </span>
                      {subtask.assignee && (
                        <span className="text-xs text-gray-600">{subtask.assignee}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Attachments */}
              {task.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    첨부파일
                  </h3>
                  <div className="space-y-2">
                    {task.attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                            <Paperclip className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-gray-600">
                              {attachment.size} • {attachment.uploadedBy} • v{attachment.version}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  댓글
                </h3>
                <div className="space-y-3 mb-4">
                  {task.comments.map(comment => (
                    <div key={comment.id} className={`flex gap-3 ${comment.isPinned ? 'bg-yellow-50 p-3 rounded-lg' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {comment.author.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-medium">{comment.author}</span>
                            <span className="text-xs text-gray-600 ml-2">
                              {formatDateTime(comment.timestamp)}
                            </span>
                            {comment.isPinned && (
                              <Pin className="w-3 h-3 text-yellow-600 inline-block ml-2" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {comment.reactions.map((reaction, idx) => (
                              <span key={idx} className="text-sm">{reaction}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="sm" onClick={handleAddComment}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Task Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">담당자</p>
                    <div className="flex -space-x-2">
                      {task.assignees.map((assignee, idx) => (
                        <Avatar key={idx} className="w-7 h-7 border-2 border-white">
                          <AvatarFallback className="text-xs">
                            {assignee.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600 mb-1">마감일</p>
                    <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                    <p className={`text-xs ${
                      daysRemaining < 0 ? 'text-red-600' :
                      daysRemaining <= 2 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)}일 지남` :
                       daysRemaining === 0 ? '오늘' :
                       `${daysRemaining}일 남음`}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600 mb-1">시간 추적</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">예상:</span>
                        <span>{task.timeTracking.estimated}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">실제:</span>
                        <span className="font-medium">{task.timeTracking.actual}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">남음:</span>
                        <span>{task.timeTracking.remaining}h</span>
                      </div>
                    </div>
                  </div>
                  
                  {task.dependencies.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        선행 작업
                      </p>
                      <div className="space-y-1">
                        {task.dependencies.map(depId => {
                          const depTask = project.phases
                            .flatMap(p => p.tasks)
                            .find(t => t.id === depId)
                          return depTask ? (
                            <div key={depId} className="text-xs text-gray-600">
                              • {depTask.title}
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  <Edit2 className="w-4 h-4 mr-1" />
                  작업 편집
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  상태 변경
                </Button>
                <Button variant="outline" className="w-full text-red-600" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}