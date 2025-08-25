'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/monitoring/layout/DashboardLayout';
import RealTimePanel from '@/components/monitoring/realtime/RealTimePanel';
import AnalyticsPanel from '@/components/monitoring/analytics/AnalyticsPanel';
import StudentPanel from '@/components/monitoring/students/StudentPanel';
import PDFTrackingPanel from '@/components/monitoring/pdf/PDFTrackingPanel';
import LiveActivityNotifications from '@/components/monitoring/notifications/LiveActivityNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  BarChart3, 
  Eye,
  Clock,
  AlertCircle,
  FileText,
  Bell
} from 'lucide-react';

import { useMonitoringSocket } from '@/hooks/useMonitoringSocket';
import LoadingSkeleton from '@/components/monitoring/shared/LoadingSkeleton';

export default function TeacherMonitoringPage() {
  const router = useRouter();
  const { 
    connectedStudents, 
    activeStudents, 
    recentActivities, 
    isConnected,
    connectionError 
  } = useMonitoringSocket();

  // Connection status indicator
  const connectionStatus = isConnected ? 'connected' : 'disconnected';
  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">교실 모니터링</h1>
            <p className="text-gray-600">실시간 학생 활동 및 참여도 추적</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="flex space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{connectedStudents.length}명 온라인</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>{activeStudents.length}명 활동중</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center space-x-2 p-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">연결 오류</p>
                <p className="text-red-600 text-sm">{connectionError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-12 gap-6 min-h-[80vh]">
          {/* Real-Time Activity Feed - Left Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <Suspense fallback={<LoadingSkeleton type="sidebar" />}>
              <RealTimePanel 
                connectedStudents={connectedStudents}
                recentActivities={recentActivities}
                isConnected={isConnected}
              />
            </Suspense>
          </div>

          {/* Main Content Area - Tabbed Interface */}
          <div className="col-span-12 lg:col-span-9">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>개요</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>학생</span>
                </TabsTrigger>
                <TabsTrigger value="pdf-tracking" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF 추적</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>분석</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>알림</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <Suspense fallback={<LoadingSkeleton type="grid" />}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student Status Grid */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">학생 현황</h3>
                        <StudentPanel 
                          students={connectedStudents}
                          activities={recentActivities}
                          mode="grid"
                          showDetails={false}
                        />
                      </CardContent>
                    </Card>
                    
                    {/* Recent Activity Summary */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
                        <div className="space-y-3">
                          {recentActivities.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.studentName}</p>
                                <p className="text-xs text-gray-500">{activity.description}</p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(activity.timestamp).toLocaleTimeString('ko-KR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Suspense>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-6">
                <Suspense fallback={<LoadingSkeleton type="list" />}>
                  <StudentPanel 
                    students={connectedStudents}
                    activities={recentActivities}
                    mode="detailed"
                    showDetails={true}
                  />
                </Suspense>
              </TabsContent>

              {/* PDF Tracking Tab */}
              <TabsContent value="pdf-tracking" className="mt-6">
                <Suspense fallback={<LoadingSkeleton type="charts" />}>
                  <PDFTrackingPanel 
                    students={connectedStudents}
                    activities={recentActivities}
                    currentPDF="sample-textbook.pdf"
                    totalPages={20}
                  />
                </Suspense>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-6">
                <Suspense fallback={<LoadingSkeleton type="charts" />}>
                  <AnalyticsPanel 
                    students={connectedStudents}
                    activities={recentActivities}
                  />
                </Suspense>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-6">
                <Suspense fallback={<LoadingSkeleton type="cards" />}>
                  <LiveActivityNotifications
                    students={connectedStudents}
                    activities={recentActivities}
                    isConnected={isConnected}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}