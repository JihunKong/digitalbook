'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 통합 대시보드 라우터
 * 사용자의 역할에 따라 적절한 대시보드로 리다이렉션
 */
export default function DashboardRouter() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // 인증되지 않은 사용자는 로그인 페이지로
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    // 역할별 리다이렉션
    switch (user.role) {
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'TEACHER':
        router.push('/teacher/dashboard');
        break;
      case 'STUDENT':
        router.push('/student/dashboard');
        break;
      case 'GUEST':
        router.push('/guest');
        break;
      default:
        // 역할이 정의되지 않은 경우 기본 페이지로
        router.push('/');
    }
  }, [user, isLoading, router]);

  // 로딩 중일 때 표시할 UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center space-y-4">
            {/* 로고 또는 아이콘 */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse" />
            
            <h2 className="text-2xl font-bold text-gray-800">
              대시보드 로딩 중...
            </h2>
            
            <p className="text-gray-600 text-center">
              사용자 정보를 확인하고 있습니다.
            </p>
            
            {/* 스켈레톤 로더 */}
            <div className="w-full space-y-3 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
        
        {/* 추가 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            문제가 지속되면 다시 로그인해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}