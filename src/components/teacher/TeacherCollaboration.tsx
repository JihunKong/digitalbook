'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Share2,
  MessageSquare,
  Heart,
  BookOpen,
  Award,
  TrendingUp,
  FileText,
  Calendar,
  Filter,
  Plus
} from 'lucide-react';

interface SharedResource {
  id: string;
  title: string;
  type: 'worksheet' | 'lesson_plan' | 'assessment' | 'project';
  author: {
    name: string;
    avatar?: string;
    school: string;
  };
  subject: string;
  grade: number;
  description: string;
  likes: number;
  comments: number;
  downloads: number;
  tags: string[];
  createdAt: Date;
}

interface TeacherCommunity {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: 'subject' | 'grade' | 'region' | 'special';
}

interface ProfessionalGrowth {
  reflections: number;
  sharedResources: number;
  receivedFeedback: number;
  mentoringSessions: number;
  certificatesEarned: string[];
}

export function TeacherCollaboration() {
  const [activeTab, setActiveTab] = useState('share');
  const [selectedResource, setSelectedResource] = useState<SharedResource | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // 샘플 데이터
  const sharedResources: SharedResource[] = [
    {
      id: '1',
      title: '일기 쓰기를 통한 감정 표현 학습',
      type: 'worksheet',
      author: {
        name: '이은주 선생님',
        school: '햇살초등학교'
      },
      subject: '국어',
      grade: 5,
      description: '학생들이 자신의 감정을 구체적으로 표현할 수 있도록 돕는 단계별 일기 쓰기 워크시트입니다.',
      likes: 42,
      comments: 15,
      downloads: 128,
      tags: ['감정표현', '일기쓰기', '창의적글쓰기'],
      createdAt: new Date('2024-03-15')
    },
    {
      id: '2',
      title: '편지로 마음 전하기 프로젝트',
      type: 'project',
      author: {
        name: '김민수 선생님',
        school: '푸른초등학교'
      },
      subject: '국어',
      grade: 5,
      description: '실제 편지를 써서 전달하는 프로젝트 수업 계획안입니다. 디지털 시대에 손편지의 가치를 경험합니다.',
      likes: 38,
      comments: 12,
      downloads: 95,
      tags: ['편지쓰기', '프로젝트학습', '의사소통'],
      createdAt: new Date('2024-03-10')
    }
  ];

  const communities: TeacherCommunity[] = [
    {
      id: '1',
      name: '5학년 국어 교사 모임',
      description: '5학년 국어 수업 경험을 나누고 함께 성장하는 공간',
      memberCount: 342,
      category: 'grade'
    },
    {
      id: '2',
      name: '창의적 글쓰기 연구회',
      description: '학생들의 창의적 글쓰기 능력 향상을 위한 교수법 연구',
      memberCount: 256,
      category: 'subject'
    },
    {
      id: '3',
      name: '서울 초등 국어교사 네트워크',
      description: '서울 지역 초등 국어 교사들의 정보 교류',
      memberCount: 512,
      category: 'region'
    }
  ];

  const myGrowth: ProfessionalGrowth = {
    reflections: 24,
    sharedResources: 8,
    receivedFeedback: 45,
    mentoringSessions: 12,
    certificatesEarned: ['창의적 글쓰기 지도', '디지털 리터러시 교육']
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            교사 협업 플랫폼
          </CardTitle>
          <p className="text-sm text-gray-600">
            동료 교사들과 경험을 나누고 함께 성장하세요
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="share">자료 공유</TabsTrigger>
              <TabsTrigger value="communities">교사 커뮤니티</TabsTrigger>
              <TabsTrigger value="mentoring">멘토링</TabsTrigger>
              <TabsTrigger value="growth">나의 성장</TabsTrigger>
            </TabsList>

            <TabsContent value="share" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <select
                    className="border rounded px-3 py-1"
                    value={filterGrade || ''}
                    onChange={(e) => setFilterGrade(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">모든 학년</option>
                    {[1, 2, 3, 4, 5, 6].map(grade => (
                      <option key={grade} value={grade}>{grade}학년</option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-3 py-1"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">모든 과목</option>
                    <option value="국어">국어</option>
                    <option value="수학">수학</option>
                    <option value="사회">사회</option>
                    <option value="과학">과학</option>
                  </select>
                </div>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  내 자료 공유하기
                </Button>
              </div>

              <div className="grid gap-4">
                {sharedResources
                  .filter(resource => 
                    (!filterGrade || resource.grade === filterGrade) &&
                    (filterSubject === 'all' || resource.subject === filterSubject)
                  )
                  .map(resource => (
                  <Card key={resource.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedResource(resource)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {resource.type === 'worksheet' ? '워크시트' :
                               resource.type === 'lesson_plan' ? '수업계획' :
                               resource.type === 'assessment' ? '평가도구' : '프로젝트'}
                            </Badge>
                            <Badge variant="secondary">{resource.subject} {resource.grade}학년</Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{resource.author.name[0]}</AvatarFallback>
                              </Avatar>
                              {resource.author.name} · {resource.author.school}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className="flex gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {resource.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {resource.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {resource.downloads}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="communities" className="space-y-4">
              <div className="grid gap-4">
                {communities.map(community => (
                  <Card key={community.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{community.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {community.memberCount}명의 교사 참여중
                          </p>
                        </div>
                        <Button variant="outline">
                          참여하기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                새 커뮤니티 만들기
              </Button>
            </TabsContent>

            <TabsContent value="mentoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">멘토링 프로그램</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 bg-blue-50">
                      <h4 className="font-semibold mb-2">멘토로 참여하기</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        신규 교사들에게 경험과 노하우를 공유해주세요
                      </p>
                      <Button size="sm">멘토 신청</Button>
                    </Card>
                    <Card className="p-4 bg-green-50">
                      <h4 className="font-semibold mb-2">멘티로 참여하기</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        경험 많은 선배 교사에게 조언을 구해보세요
                      </p>
                      <Button size="sm">멘티 신청</Button>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">진행 중인 멘토링</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>박</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">박정희 선생님과의 멘토링</p>
                            <p className="text-sm text-gray-600">주제: 창의적 글쓰기 지도법</p>
                          </div>
                        </div>
                        <Badge>진행중</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{myGrowth.reflections}</p>
                        <p className="text-sm text-gray-600">수업 성찰 기록</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Share2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{myGrowth.sharedResources}</p>
                        <p className="text-sm text-gray-600">공유한 자료</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{myGrowth.receivedFeedback}</p>
                        <p className="text-sm text-gray-600">받은 피드백</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{myGrowth.mentoringSessions}</p>
                        <p className="text-sm text-gray-600">멘토링 세션</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    전문성 개발 이력
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myGrowth.certificatesEarned.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded">
                            <Award className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cert}</p>
                            <p className="text-sm text-gray-600">2024년 3월 취득</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          인증서 보기
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    나의 성장 그래프
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    지난 6개월간 교육 활동 및 전문성 개발 추이
                  </p>
                  {/* 실제로는 차트 컴포넌트 추가 */}
                  <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded mt-4">
                    <p className="text-gray-400">성장 그래프 표시 영역</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 자료 상세 보기 모달 */}
      {selectedResource && (
        <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
          <CardHeader>
            <CardTitle className="text-lg">{selectedResource.title}</CardTitle>
            <Button
              className="absolute top-2 right-2"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedResource(null)}
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>피드백 남기기</Label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="이 자료에 대한 의견을 남겨주세요. 사용 후기, 개선 제안 등을 공유해주시면 다른 선생님들께 큰 도움이 됩니다."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Heart className="h-4 w-4 mr-1" />
                  좋아요
                </Button>
                <Button size="sm" className="flex-1" variant="outline">
                  <FileText className="h-4 w-4 mr-1" />
                  다운로드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}