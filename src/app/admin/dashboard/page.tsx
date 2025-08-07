'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Shield, 
  Activity,
  AlertCircle,
  TrendingUp,
  UserPlus,
  GraduationCap,
  Clock,
  Database
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalTextbooks: number;
  totalClasses: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastBackup: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // 권한 확인
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    // 통계 데이터 로드 (실제로는 API 호출)
    loadDashboardData();
  }, [user, isLoading, router]);

  const loadDashboardData = async () => {
    // TODO: 실제 API 호출로 교체
    setStats({
      totalUsers: 1250,
      activeUsers: 892,
      totalTeachers: 45,
      totalStudents: 1205,
      totalTextbooks: 156,
      totalClasses: 38,
      systemHealth: 'healthy',
      lastBackup: '2024-08-07 03:00:00'
    });

    setRecentActivities([
      { id: 1, type: 'user_registration', description: '새 교사 등록: 김민정', time: '5분 전' },
      { id: 2, type: 'textbook_created', description: '새 교과서 생성: 5학년 국어', time: '15분 전' },
      { id: 3, type: 'class_started', description: '수업 시작: 6학년 수학 (박영희)', time: '30분 전' },
      { id: 4, type: 'system_backup', description: '시스템 백업 완료', time: '3시간 전' }
    ]);
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">시스템 전체 현황 및 관리</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => router.push('/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
              <Button variant="default" onClick={() => router.push('/admin/users/new')}>
                <UserPlus className="w-4 h-4 mr-2" />
                사용자 추가
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Banner */}
        <div className={`rounded-lg p-4 mb-6 ${
          stats.systemHealth === 'healthy' ? 'bg-green-50 border-green-200' :
          stats.systemHealth === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center">
            {stats.systemHealth === 'healthy' ? (
              <Activity className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            )}
            <div>
              <p className="font-semibold">
                시스템 상태: {stats.systemHealth === 'healthy' ? '정상' : '주의 필요'}
              </p>
              <p className="text-sm text-gray-600">
                마지막 백업: {stats.lastBackup}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">전체 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <span className="ml-2 text-sm text-green-600">+12.5%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">활성: {stats.activeUsers.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">교사</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                <GraduationCap className="ml-auto w-8 h-8 text-blue-200" />
              </div>
              <p className="text-xs text-gray-500 mt-1">승인 대기: 3</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">학생</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                <Users className="ml-auto w-8 h-8 text-green-200" />
              </div>
              <p className="text-xs text-gray-500 mt-1">오늘 가입: 28</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">교과서</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold">{stats.totalTextbooks}</p>
                <BookOpen className="ml-auto w-8 h-8 text-purple-200" />
              </div>
              <p className="text-xs text-gray-500 mt-1">활성 수업: {stats.totalClasses}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="content">콘텐츠 관리</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>최근 활동</CardTitle>
                  <CardDescription>시스템 전체 최근 이벤트</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="mt-4 p-0">
                    모든 활동 보기 →
                  </Button>
                </CardContent>
              </Card>

              {/* System Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>시스템 성능</CardTitle>
                  <CardDescription>실시간 시스템 모니터링</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU 사용률</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>메모리 사용률</span>
                        <span>62%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '62%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>디스크 사용률</span>
                        <span>38%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '38%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>데이터베이스 연결</span>
                        <span>24/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{width: '24%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
                <CardDescription>자주 사용하는 관리 기능</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-24 flex-col" onClick={() => router.push('/admin/backup')}>
                    <Database className="w-6 h-6 mb-2" />
                    <span className="text-xs">백업 실행</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col" onClick={() => router.push('/admin/users')}>
                    <Users className="w-6 h-6 mb-2" />
                    <span className="text-xs">사용자 관리</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col" onClick={() => router.push('/admin/logs')}>
                    <Activity className="w-6 h-6 mb-2" />
                    <span className="text-xs">로그 확인</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col" onClick={() => router.push('/admin/security')}>
                    <Shield className="w-6 h-6 mb-2" />
                    <span className="text-xs">보안 설정</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
                <CardDescription>전체 사용자 목록 및 권한 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">사용자 관리 인터페이스가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>콘텐츠 관리</CardTitle>
                <CardDescription>교과서 및 학습 자료 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">콘텐츠 관리 인터페이스가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>분석 대시보드</CardTitle>
                <CardDescription>사용 통계 및 성과 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">분석 차트와 보고서가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>보안 설정</CardTitle>
                <CardDescription>시스템 보안 및 권한 설정</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">보안 설정 인터페이스가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}