'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function GuestAccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accessCode: '',
    studentId: '',
    studentName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accessCode || !formData.studentId || !formData.studentName) {
      toast.error('모든 정보를 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/guest/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '접근 실패');
      }

      const data = await response.json();
      
      // 게스트 토큰 저장
      localStorage.setItem('guestToken', data.token);
      localStorage.setItem('guestInfo', JSON.stringify({
        studentId: data.guest.studentId,
        studentName: data.guest.studentName,
        textbookId: data.textbook.id,
        textbookTitle: data.textbook.title
      }));

      toast.success(`${data.textbook.title} 교과서에 접속했습니다`);
      router.push(`/guest/textbook/${data.textbook.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '접근에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">학습 시작하기</CardTitle>
          <CardDescription>
            선생님이 제공한 접근 코드와 학생 정보를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">접근 코드</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="예: ABC123"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                className="uppercase"
                maxLength={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentId">학번</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="예: 20241234"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentName">이름</Label>
              <Input
                id="studentName"
                type="text"
                placeholder="홍길동"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  접속 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  학습 시작
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>접근 코드가 없으신가요?</p>
            <p>선생님께 문의하세요</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}