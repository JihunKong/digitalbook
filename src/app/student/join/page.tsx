'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentJoin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    // 유효성 검사
    if (!code || !name || !studentId) {
      toast.error('모든 정보를 입력해주세요.');
      return;
    }

    if (code.length !== 6) {
      toast.error('수업 코드는 6자리여야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/student/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          name,
          studentId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 세션 토큰 저장
        localStorage.setItem('studentSession', data.session.token);
        localStorage.setItem('studentInfo', JSON.stringify({
          id: data.student.id,
          name: data.student.name,
          studentId: data.student.studentId,
          classId: data.class.id,
          className: data.class.name
        }));

        toast.success(`${data.class.name} 수업에 입장했습니다!`);
        router.push('/student/classroom');
      } else {
        toast.error(data.error || '수업 참여에 실패했습니다.');
      }
    } catch (error) {
      console.error('수업 참여 오류:', error);
      toast.error('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (value: string) => {
    // 영문자와 숫자만 허용, 대문자로 변환
    const filtered = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (filtered.length <= 6) {
      setCode(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">수업 참여하기</CardTitle>
          <CardDescription>
            선생님이 알려준 6자리 코드를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="space-y-4">
            {/* 수업 코드 */}
            <div className="space-y-2">
              <Label htmlFor="code">수업 코드</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABC123"
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                className="text-center text-2xl font-mono tracking-wider uppercase"
                maxLength={6}
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 text-center">
                {code.length}/6
              </p>
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            {/* 학번 */}
            <div className="space-y-2">
              <Label htmlFor="studentId">학번</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="20240001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                학번이 없다면 닉네임을 입력하세요
              </p>
            </div>

            {/* 참여 버튼 */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || !code || !name || !studentId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  입장 중...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  수업 참여
                </>
              )}
            </Button>
          </form>

          {/* 추가 정보 */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-primary font-semibold">💡</span>
                수업 코드는 선생님께서 칠판이나 화면에 보여주실 거예요.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary font-semibold">📚</span>
                수업에 참여하면 학습 자료를 보며 AI 선생님과 대화할 수 있어요.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary font-semibold">🤔</span>
                모르는 것이 있으면 언제든지 질문하세요!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}