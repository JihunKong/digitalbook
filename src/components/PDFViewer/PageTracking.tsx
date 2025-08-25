'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  Navigation, 
  Clock,
  TrendingUp,
  Eye,
  UserCheck,
  BookOpen
} from 'lucide-react'

interface StudentTracking {
  studentId: string
  pageNumber: number
  name?: string
  avatar?: string
  lastActive?: Date
  totalTimeSpent?: number
}

interface PageTrackingProps {
  studentTracking: StudentTracking[]
  currentPage: number
  totalPages: number
  className?: string
}

export function PageTracking({ 
  studentTracking, 
  currentPage, 
  totalPages,
  className = "" 
}: PageTrackingProps) {
  // Calculate statistics
  const activeStudents = studentTracking.length
  const studentsOnCurrentPage = studentTracking.filter(s => s.pageNumber === currentPage).length
  const studentsAhead = studentTracking.filter(s => s.pageNumber > currentPage).length
  const studentsBehind = studentTracking.filter(s => s.pageNumber < currentPage).length

  // Group students by page
  const studentsByPage = studentTracking.reduce((acc, student) => {
    const page = student.pageNumber
    if (!acc[page]) acc[page] = []
    acc[page].push(student)
    return acc
  }, {} as Record<number, StudentTracking[]>)

  // Get page distribution for progress visualization
  const pageDistribution = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1
    const studentsOnPage = studentsByPage[page] || []
    return {
      page,
      studentCount: studentsOnPage.length,
      percentage: activeStudents > 0 ? (studentsOnPage.length / activeStudents) * 100 : 0
    }
  })

  const getPageStatusColor = (page: number) => {
    if (page === currentPage) return 'bg-blue-500'
    if (page < currentPage) return 'bg-green-500'
    return 'bg-gray-300'
  }

  const getStudentStatusBadge = (student: StudentTracking) => {
    if (student.pageNumber === currentPage) {
      return <Badge variant="default" className="text-xs">현재 페이지</Badge>
    } else if (student.pageNumber > currentPage) {
      return <Badge variant="secondary" className="text-xs text-green-700">앞선 페이지</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">이전 페이지</Badge>
    }
  }

  const formatTimeSpent = (milliseconds?: number) => {
    if (!milliseconds) return '0분'
    const minutes = Math.floor(milliseconds / 60000)
    if (minutes < 60) return `${minutes}분`
    const hours = Math.floor(minutes / 60)
    return `${hours}시간 ${minutes % 60}분`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overview Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Users className="w-4 h-4 mr-2" />
            실시간 학습 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{activeStudents}</div>
              <div className="text-xs text-blue-500">활성 학생</div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{studentsOnCurrentPage}</div>
              <div className="text-xs text-green-500">현재 페이지</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                앞선 학생: {studentsAhead}명
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1 text-orange-500" />
                뒤처진 학생: {studentsBehind}명
              </span>
            </div>
            
            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-center text-gray-500">
              수업 진행률: {Math.round((currentPage / totalPages) * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Distribution Visualization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            페이지별 분포
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pageDistribution.slice(Math.max(0, currentPage - 3), currentPage + 3).map((pageInfo) => (
              <div key={pageInfo.page} className="flex items-center space-x-2">
                <div className={`
                  w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium
                  ${pageInfo.page === currentPage ? 'bg-blue-500' : 
                    pageInfo.page < currentPage ? 'bg-green-500' : 'bg-gray-400'}
                `}>
                  {pageInfo.page}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pageInfo.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium min-w-[30px]">
                      {pageInfo.studentCount}명
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Student Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            개별 학생 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {activeStudents === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">현재 활성 학생이 없습니다</p>
                <p className="text-xs">학생들이 PDF를 열면 여기에 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentTracking.map((student) => (
                  <div 
                    key={student.studentId}
                    className={`
                      p-3 rounded-lg border transition-colors
                      ${student.pageNumber === currentPage 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm">
                            {student.name || `학생 ${student.studentId.slice(0, 8)}`}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Navigation className="w-3 h-3 mr-1" />
                            페이지 {student.pageNumber}
                            {student.lastActive && (
                              <span className="ml-2">
                                • {formatTimeSpent(student.totalTimeSpent)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {getStudentStatusBadge(student)}
                        
                        {student.lastActive && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(student.lastActive).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}