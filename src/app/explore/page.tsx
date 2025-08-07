'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Filter, Heart, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PublicTextbook {
  id: string;
  title: string;
  subject: string;
  grade: number;
  coverImage?: string;
  teacher: {
    name: string;
  };
  createdAt: string;
}

export default function ExplorePage() {
  const [textbooks, setTextbooks] = useState<PublicTextbook[]>([]);
  const [filteredTextbooks, setFilteredTextbooks] = useState<PublicTextbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');

  useEffect(() => {
    fetchPublicTextbooks();
  }, []);

  useEffect(() => {
    filterTextbooks();
  }, [searchTerm, selectedSubject, selectedGrade, textbooks]);

  const fetchPublicTextbooks = async () => {
    try {
      const response = await fetch('/api/textbooks/public/list');
      if (!response.ok) throw new Error('Failed to fetch textbooks');
      
      const data = await response.json();
      setTextbooks(data);
      setFilteredTextbooks(data);
    } catch (error) {
      toast.error('공개 교과서를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTextbooks = () => {
    let filtered = [...textbooks];

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(textbook => 
        textbook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        textbook.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 과목 필터링
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(textbook => textbook.subject === selectedSubject);
    }

    // 학년 필터링
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(textbook => textbook.grade === parseInt(selectedGrade));
    }

    setFilteredTextbooks(filtered);
  };

  const subjects = ['국어', '수학', '영어', '과학', '사회', '기타'];
  const grades = [1, 2, 3, 4, 5, 6];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">공개 교과서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">공개 교과서 둘러보기</h1>
        <p className="text-gray-600">
          다른 선생님들이 만든 우수한 교과서를 찾아보고 활용해보세요
        </p>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="교과서 제목 또는 선생님 이름으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="과목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 과목</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 학년</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade.toString()}>{grade}학년</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 교과서 목록 */}
      {filteredTextbooks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">검색 결과가 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTextbooks.map((textbook) => (
            <Card key={textbook.id} className="hover:shadow-lg transition-shadow">
              {textbook.coverImage && (
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <img 
                    src={textbook.coverImage} 
                    alt={textbook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{textbook.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {textbook.teacher.name} 선생님
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{textbook.subject}</Badge>
                    <Badge variant="outline">{textbook.grade}학년</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{new Date(textbook.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      0
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      0
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    미리보기
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Copy className="h-4 w-4 mr-1" />
                    내 교과서로 복사
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}