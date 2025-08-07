'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('이메일과 비밀번호를 모두 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      // Mock authentication for demo
      if (formData.email === 'teacher@test.com' && formData.password === 'password123') {
        const mockToken = 'mock-teacher-token-12345';
        const mockUser = {
          id: 'teacher-123',
          email: formData.email,
          name: '김선생님',
          role: 'TEACHER'
        };

        // Store auth data
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('userInfo', JSON.stringify(mockUser));

        toast.success('로그인되었습니다');
        router.push('/teacher/dashboard');
      } else {
        toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
      }
    } catch (error) {
      toast.error('로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">교사 로그인</CardTitle>
          <CardDescription>
            AI 디지털 교과서 플랫폼에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">데모 계정</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-blue-900">테스트 계정:</p>
              <p className="text-sm text-blue-700">
                이메일: teacher@test.com<br />
                비밀번호: password123
              </p>
            </div>

            <div className="text-center space-y-2">
              <Link href="/teacher/signup" className="text-blue-600 hover:underline text-sm">
                계정이 없으신가요? 회원가입
              </Link>
              <br />
              <Link href="/" className="text-gray-600 hover:underline text-sm">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}