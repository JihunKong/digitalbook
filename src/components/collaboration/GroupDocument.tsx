'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  FileText,
  MessageSquare,
  Clock,
  Edit3,
  Save,
  Download,
  Share2,
  Lock,
  Unlock,
  History,
  ChevronRight,
  UserPlus,
  Settings,
  Plus
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'leader' | 'member';
  isOnline: boolean;
  lastActive: Date;
  color: string;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  author: GroupMember;
  lastModified: Date;
  isLocked: boolean;
  lockedBy?: GroupMember;
}

interface Comment {
  id: string;
  sectionId: string;
  author: GroupMember;
  content: string;
  timestamp: Date;
  resolved: boolean;
}

interface EditHistory {
  id: string;
  sectionId: string;
  author: GroupMember;
  action: 'created' | 'edited' | 'deleted';
  timestamp: Date;
  previousContent?: string;
}

const MEMBER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD'
];

export function GroupDocument({
  groupId,
  documentId,
  currentUser
}: {
  groupId: string;
  documentId: string;
  currentUser: { id: string; name: string; avatar?: string };
}) {
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: 'leader',
      isOnline: true,
      lastActive: new Date(),
      color: MEMBER_COLORS[0]
    }
  ]);

  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: '1',
      title: '서론',
      content: '',
      author: members[0],
      lastModified: new Date(),
      isLocked: false
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [activeSection, setActiveSection] = useState<string>('1');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('우리 모둠의 프로젝트');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 실시간 저장을 위한 디바운스
  const [tempContent, setTempContent] = useState<{ [key: string]: string }>({});
  const debouncedContent = useDebounce(tempContent, 1000);

  useEffect(() => {
    // 디바운스된 내용 저장
    Object.entries(debouncedContent).forEach(([sectionId, content]) => {
      updateSectionContent(sectionId, content);
    });
  }, [debouncedContent]);

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const updated = {
          ...section,
          content,
          lastModified: new Date()
        };
        
        // 편집 기록 추가
        addEditHistory(sectionId, 'edited', section.content);
        
        return updated;
      }
      return section;
    }));
  };

  const addEditHistory = (sectionId: string, action: EditHistory['action'], previousContent?: string) => {
    const member = members.find(m => m.id === currentUser.id)!;
    setEditHistory(prev => [{
      id: Date.now().toString(),
      sectionId,
      author: member,
      action,
      timestamp: new Date(),
      previousContent
    }, ...prev]);
  };

  const lockSection = (sectionId: string) => {
    const member = members.find(m => m.id === currentUser.id)!;
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isLocked: true, lockedBy: member }
        : section
    ));
    setIsEditing(sectionId);
  };

  const unlockSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isLocked: false, lockedBy: undefined }
        : section
    ));
    setIsEditing(null);
  };

  const addSection = () => {
    const member = members.find(m => m.id === currentUser.id)!;
    const newSection: DocumentSection = {
      id: Date.now().toString(),
      title: `새 섹션 ${sections.length + 1}`,
      content: '',
      author: member,
      lastModified: new Date(),
      isLocked: false
    };
    setSections([...sections, newSection]);
    addEditHistory(newSection.id, 'created');
  };

  const deleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSections(prev => prev.filter(s => s.id !== sectionId));
      addEditHistory(sectionId, 'deleted', section.content);
    }
  };

  const addComment = (sectionId: string, content: string) => {
    const member = members.find(m => m.id === currentUser.id)!;
    const newComment: Comment = {
      id: Date.now().toString(),
      sectionId,
      author: member,
      content,
      timestamp: new Date(),
      resolved: false
    };
    setComments([...comments, newComment]);
  };

  const inviteMember = (email: string) => {
    // 실제로는 초대 이메일 발송
    const newMember: GroupMember = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      role: 'member',
      isOnline: false,
      lastActive: new Date(),
      color: MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    };
    setMembers([...members, newMember]);
    setShowInviteModal(false);
  };

  const exportDocument = () => {
    // 문서 내보내기 로직
    const content = sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* 문서 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="text-2xl font-bold border-none focus:outline-none"
              />
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {members.length}명 참여중
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                초대
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                공유
              </Button>
              <Button variant="outline" size="sm" onClick={exportDocument}>
                <Download className="h-4 w-4 mr-1" />
                내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* 왼쪽: 섹션 목록 및 멤버 */}
        <div className="col-span-3 space-y-4">
          {/* 섹션 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                문서 구조
                <Button size="sm" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeSection === section.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {section.isLocked && (
                      <Lock className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: section.author.color }}
                    />
                    <span className="text-xs text-gray-500">
                      {section.author.name}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 온라인 멤버 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">모둠원</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.isOnline ? '온라인' : '오프라인'}
                    </p>
                  </div>
                  {member.role === 'leader' && (
                    <Badge variant="outline" className="text-xs">
                      모둠장
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 가운데: 문서 편집 영역 */}
        <div className="col-span-6">
          <Card className="h-full">
            <CardContent className="p-6">
              {sections.find(s => s.id === activeSection) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={sections.find(s => s.id === activeSection)?.title}
                      onChange={(e) => {
                        setSections(prev => prev.map(s => 
                          s.id === activeSection 
                            ? { ...s, title: e.target.value }
                            : s
                        ));
                      }}
                      className="text-xl font-semibold border-none focus:outline-none"
                      disabled={sections.find(s => s.id === activeSection)?.isLocked && 
                               sections.find(s => s.id === activeSection)?.lockedBy?.id !== currentUser.id}
                    />
                    <div className="flex items-center gap-2">
                      {isEditing === activeSection ? (
                        <Button
                          size="sm"
                          onClick={() => unlockSection(activeSection)}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          편집 완료
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => lockSection(activeSection)}
                          disabled={sections.find(s => s.id === activeSection)?.isLocked}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          편집 시작
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSection(activeSection)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={tempContent[activeSection] ?? sections.find(s => s.id === activeSection)?.content}
                      onChange={(e) => setTempContent(prev => ({
                        ...prev,
                        [activeSection]: e.target.value
                      }))}
                      placeholder="내용을 입력하세요..."
                      className="min-h-[400px] resize-none"
                      disabled={sections.find(s => s.id === activeSection)?.isLocked && 
                               sections.find(s => s.id === activeSection)?.lockedBy?.id !== currentUser.id}
                    />
                    
                    {/* 실시간 편집 표시 */}
                    {sections.find(s => s.id === activeSection)?.isLocked && 
                     sections.find(s => s.id === activeSection)?.lockedBy?.id !== currentUser.id && (
                      <div className="absolute top-2 right-2 flex items-center gap-2 bg-orange-100 px-3 py-1 rounded">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sections.find(s => s.id === activeSection)?.lockedBy?.color }}
                        />
                        <span className="text-sm">
                          {sections.find(s => s.id === activeSection)?.lockedBy?.name}님이 편집 중
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      마지막 수정: {new Date(sections.find(s => s.id === activeSection)?.lastModified || '').toLocaleString()}
                    </span>
                    <span>
                      작성자: {sections.find(s => s.id === activeSection)?.author.name}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 댓글 및 기록 */}
        <div className="col-span-3 space-y-4">
          <Tabs defaultValue="comments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">댓글</TabsTrigger>
              <TabsTrigger value="history">편집 기록</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">섹션 댓글</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {comments
                      .filter(c => c.sectionId === activeSection)
                      .map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-6 h-6 rounded-full mt-1"
                              style={{ backgroundColor: comment.author.color }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{comment.author.name}</p>
                              <p className="text-sm text-gray-600">{comment.content}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4">
                    <Textarea
                      placeholder="댓글을 입력하세요..."
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            addComment(activeSection, value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">편집 기록</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {editHistory
                        .filter(h => h.sectionId === activeSection)
                        .map((history) => (
                          <div key={history.id} className="flex items-start gap-3 pb-3 border-b">
                            <div
                              className="w-6 h-6 rounded-full mt-1"
                              style={{ backgroundColor: history.author.color }}
                            />
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{history.author.name}</span>
                                {history.action === 'created' && '님이 섹션을 생성했습니다'}
                                {history.action === 'edited' && '님이 섹션을 수정했습니다'}
                                {history.action === 'deleted' && '님이 섹션을 삭제했습니다'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(history.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>모둠원 초대</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>이메일 주소</Label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        inviteMember(e.currentTarget.value);
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                    취소
                  </Button>
                  <Button onClick={() => {
                    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
                    if (input?.value) {
                      inviteMember(input.value);
                    }
                  }}>
                    초대
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}