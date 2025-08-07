'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Users,
  Share2,
  MessageSquare,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherCollaborationProps {
  textbookId: string;
  teacherId: string;
}

interface SharedResource {
  id: string;
  type: 'lesson-plan' | 'worksheet' | 'assessment' | 'reflection';
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    school: string;
    avatar?: string;
  };
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

interface TeacherCommunity {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  isJoined: boolean;
}

export function TeacherCollaboration({ textbookId, teacherId }: TeacherCollaborationProps) {
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([
    {
      id: '1',
      type: 'lesson-plan',
      title: '프로젝트 기반 국어 수업 계획',
      description: '학생들이 직접 단편 소설을 쓰고 출판하는 6주 프로젝트',
      author: {
        id: '1',
        name: '김선생',
        school: '서울초등학교',
      },
      tags: ['프로젝트학습', '창의적글쓰기', '협동학습'],
      likes: 24,
      comments: 8,
      createdAt: '2024-01-15',
    },
  ]);

  const [communities, setCommunities] = useState<TeacherCommunity[]>([
    {
      id: '1',
      name: '초등 국어 교사 모임',
      description: '초등학교 국어 교육에 관심 있는 교사들의 모임',
      members: 342,
      category: '교과별',
      isJoined: true,
    },
    {
      id: '2',
      name: '디지털 교육 혁신 그룹',
      description: '디지털 도구를 활용한 수업 혁신 사례 공유',
      members: 567,
      category: '주제별',
      isJoined: false,
    },
  ]);

  const [newResource, setNewResource] = useState<{
    type: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
  }>({
    type: 'lesson-plan',
    title: '',
    description: '',
    content: '',
    tags: [],
  });

  const shareResource = () => {
    if (!newResource.title || !newResource.description) {
      toast.error('제목과 설명을 입력해주세요');
      return;
    }

    const resource: SharedResource = {
      id: `resource-${Date.now()}`,
      type: newResource.type as any,
      title: newResource.title,
      description: newResource.description,
      author: {
        id: teacherId,
        name: '나',
        school: '우리학교',
      },
      tags: newResource.tags,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSharedResources([resource, ...sharedResources]);
    setNewResource({
      type: 'lesson-plan',
      title: '',
      description: '',
      content: '',
      tags: [],
    });
    toast.success('자료가 공유되었습니다');
  };

  const joinCommunity = (communityId: string) => {
    setCommunities(communities.map(c => 
      c.id === communityId ? { ...c, isJoined: true, members: c.members + 1 } : c
    ));
    toast.success('커뮤니티에 가입했습니다');
  };

  const likeResource = (resourceId: string) => {
    setSharedResources(sharedResources.map(r => 
      r.id === resourceId ? { ...r, likes: r.likes + 1 } : r
    ));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">교사 협업 공간</h2>
        
        <Tabs defaultValue="share">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="share">자료 공유</TabsTrigger>
            <TabsTrigger value="community">교사 커뮤니티</TabsTrigger>
            <TabsTrigger value="mentoring">멘토링</TabsTrigger>
            <TabsTrigger value="development">전문성 개발</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-6">
            <Card className="p-4 border-dashed">
              <h3 className="font-semibold mb-4">새 자료 공유하기</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>자료 유형</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lesson-plan">수업 계획</SelectItem>
                        <SelectItem value="worksheet">워크시트</SelectItem>
                        <SelectItem value="assessment">평가 도구</SelectItem>
                        <SelectItem value="reflection">수업 성찰</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>제목</Label>
                    <Input
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      placeholder="자료 제목"
                    />
                  </div>
                </div>
                <div>
                  <Label>설명</Label>
                  <Textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="이 자료에 대한 설명을 작성하세요"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>태그 (쉼표로 구분)</Label>
                  <Input
                    placeholder="예: 프로젝트학습, 협동학습, 창의성"
                    onChange={(e) => setNewResource({ 
                      ...newResource, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    })}
                  />
                </div>
                <Button onClick={shareResource}>
                  <Share2 className="h-4 w-4 mr-2" />
                  공유하기
                </Button>
              </div>
            </Card>

            <div>
              <h3 className="font-semibold mb-4">공유된 자료</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {sharedResources.map((resource) => (
                    <Card key={resource.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {resource.type === 'lesson-plan' && '수업 계획'}
                              {resource.type === 'worksheet' && '워크시트'}
                              {resource.type === 'assessment' && '평가 도구'}
                              {resource.type === 'reflection' && '수업 성찰'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {resource.createdAt}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={resource.author.avatar} />
                                <AvatarFallback>
                                  {resource.author.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{resource.author.name}</span>
                              <span className="text-muted-foreground">
                                · {resource.author.school}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {resource.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => likeResource(resource.id)}
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              {resource.likes}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {resource.comments}
                            </Button>
                          </div>
                          <Button size="sm" variant="outline">
                            자세히 보기
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {communities.map((community) => (
                <Card key={community.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline">{community.category}</Badge>
                    {community.isJoined ? (
                      <Badge variant="default">가입됨</Badge>
                    ) : null}
                  </div>
                  <h4 className="font-semibold mb-2">{community.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {community.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{community.members}명</span>
                    </div>
                    {!community.isJoined && (
                      <Button
                        size="sm"
                        onClick={() => joinCommunity(community.id)}
                      >
                        가입하기
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 bg-accent/50">
              <h4 className="font-semibold mb-2">💡 교사 학습 공동체의 힘</h4>
              <p className="text-sm">
                동료 교사들과 함께 성장하세요. 서로의 경험을 나누고, 
                새로운 교수법을 시도하며, 함께 문제를 해결해나갈 수 있습니다.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="mentoring" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">멘토 찾기</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  경험 많은 선배 교사들의 조언을 받아보세요
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>이</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">이멘토 선생님</p>
                      <p className="text-sm text-muted-foreground">
                        20년 경력 · 프로젝트 학습 전문
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    멘토링 신청
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">멘티 지원하기</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  당신의 경험을 나누어 후배 교사들을 도와주세요
                </p>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Award className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      3명의 멘티가 멘토링을 기다리고 있습니다
                    </p>
                  </div>
                  <Button className="w-full">
                    멘토 등록하기
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">나의 전문성 개발 포트폴리오</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">24</div>
                  <div className="text-sm text-muted-foreground">공유한 자료</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">156</div>
                  <div className="text-sm text-muted-foreground">받은 좋아요</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">8</div>
                  <div className="text-sm text-muted-foreground">참여 커뮤니티</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">전문성 개발 목표</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox checked />
                        <span className="text-sm">디지털 도구 활용 수업 설계</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">완료</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox />
                        <span className="text-sm">프로젝트 기반 학습 운영</span>
                      </div>
                      <Progress value={60} className="w-20" />
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  새로운 목표 설정하기
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

// 필요한 추가 imports
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';