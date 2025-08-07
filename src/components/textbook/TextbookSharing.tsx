'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Copy, 
  RefreshCw, 
  Globe, 
  Lock,
  Users,
  BookOpen,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface TextbookSharingProps {
  textbook: {
    id: string;
    isPublic: boolean;
    accessCode?: string;
    isPublished: boolean;
  };
  onUpdate: (updates: any) => void;
}

export function TextbookSharing({ textbook, onUpdate }: TextbookSharingProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePublicToggle = async (checked: boolean) => {
    try {
      const response = await fetch(`/api/textbooks/${textbook.id}/public`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: checked })
      });

      if (!response.ok) throw new Error('설정 변경 실패');

      onUpdate({ isPublic: checked });
      toast.success(checked ? '교과서가 공개되었습니다' : '교과서가 비공개로 변경되었습니다');
    } catch (error) {
      toast.error('설정 변경에 실패했습니다');
    }
  };

  const generateAccessCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch(`/api/textbooks/${textbook.id}/access-code`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('코드 생성 실패');

      const data = await response.json();
      onUpdate({ accessCode: data.accessCode });
      toast.success('새로운 접근 코드가 생성되었습니다');
    } catch (error) {
      toast.error('접근 코드 생성에 실패했습니다');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyAccessCode = () => {
    if (textbook.accessCode) {
      navigator.clipboard.writeText(textbook.accessCode);
      setCopied(true);
      toast.success('접근 코드가 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAccessLink = () => {
    const link = `${window.location.origin}/guest?code=${textbook.accessCode}`;
    navigator.clipboard.writeText(link);
    toast.success('접근 링크가 복사되었습니다');
  };

  if (!textbook.isPublished) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            공유 설정
          </CardTitle>
          <CardDescription>
            교과서를 먼저 발행해야 공유할 수 있습니다
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            공개 설정
          </CardTitle>
          <CardDescription>
            다른 선생님들과 교과서를 공유하여 교육 자료를 나눌 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="public-toggle" className="text-base">
                교과서 공개
              </Label>
              <p className="text-sm text-muted-foreground">
                공개하면 다른 선생님들이 이 교과서를 검색하고 활용할 수 있습니다
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={textbook.isPublic}
              onCheckedChange={handlePublicToggle}
            />
          </div>
          
          {textbook.isPublic && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  이 교과서는 공개 상태입니다
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 학생 접근 코드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            학생 접근 코드
          </CardTitle>
          <CardDescription>
            학생들이 로그인 없이 교과서에 접근할 수 있는 코드입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {textbook.accessCode ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={textbook.accessCode}
                  readOnly
                  className="font-mono text-lg text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyAccessCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generateAccessCode}
                  disabled={isGeneratingCode}
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyAccessLink}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  접근 링크 복사
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  학생 접근 방법:
                </p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>접근 코드 또는 링크를 학생에게 전달</li>
                  <li>학생이 코드, 학번, 이름 입력</li>
                  <li>바로 학습 시작 가능</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                아직 접근 코드가 생성되지 않았습니다
              </p>
              <Button onClick={generateAccessCode} disabled={isGeneratingCode}>
                {isGeneratingCode ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                접근 코드 생성
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용 통계 */}
      {textbook.accessCode && (
        <Card>
          <CardHeader>
            <CardTitle>접근 통계</CardTitle>
            <CardDescription>
              학생들의 교과서 접근 현황을 확인할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">전체 접속 학생</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">오늘 접속 학생</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}