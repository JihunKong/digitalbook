'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Monitor,
  Smartphone,
  Volume2,
  Moon,
  Sun,
  Languages,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  phone: string
  school: string
  subject: string
  grade: string
  bio: string
  avatar?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  assignmentReminders: boolean
  studentProgress: boolean
  systemUpdates: boolean
  weeklyReports: boolean
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'school-only'
  shareProgress: boolean
  dataCollection: boolean
  marketingEmails: boolean
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'ko' | 'en'
  fontSize: 'small' | 'medium' | 'large'
  soundEnabled: boolean
}

export default function TeacherSettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '김선생님',
    email: 'teacher@school.edu',
    phone: '010-1234-5678',
    school: '서울초등학교',
    subject: '국어',
    grade: '3학년',
    bio: '아이들과 함께 성장하는 즐거운 교육을 추구합니다.'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    studentProgress: true,
    systemUpdates: false,
    weeklyReports: true
  })

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'school-only',
    shareProgress: true,
    dataCollection: true,
    marketingEmails: false
  })

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    language: 'ko',
    fontSize: 'medium',
    soundEnabled: true
  })

  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (section: string) => {
    setIsLoading(true)
    // Simulate saving
    setTimeout(() => {
      setIsLoading(false)
      // Show success message
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  대시보드
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">설정</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              프로필
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              알림
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              개인정보
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              화면설정
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="w-4 h-4" />
              데이터
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>
                  선생님의 프로필 정보를 수정할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name[0]}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="gap-2 mr-2">
                      <Camera className="w-4 h-4" />
                      사진 변경
                    </Button>
                    <Button variant="outline" size="sm">
                      제거
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">이름</label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">이메일</label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">전화번호</label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">학교</label>
                    <Input
                      value={profile.school}
                      onChange={(e) => setProfile({...profile, school: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">담당 과목</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={profile.subject}
                      onChange={(e) => setProfile({...profile, subject: e.target.value})}
                    >
                      <option value="국어">국어</option>
                      <option value="수학">수학</option>
                      <option value="과학">과학</option>
                      <option value="사회">사회</option>
                      <option value="영어">영어</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">담당 학년</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={profile.grade}
                      onChange={(e) => setProfile({...profile, grade: e.target.value})}
                    >
                      <option value="1학년">1학년</option>
                      <option value="2학년">2학년</option>
                      <option value="3학년">3학년</option>
                      <option value="4학년">4학년</option>
                      <option value="5학년">5학년</option>
                      <option value="6학년">6학년</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">소개</label>
                  <Textarea
                    placeholder="자신을 소개해보세요"
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={() => handleSave('profile')} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      저장
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>비밀번호 변경</CardTitle>
                <CardDescription>
                  보안을 위해 정기적으로 비밀번호를 변경해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">현재 비밀번호</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="현재 비밀번호를 입력하세요"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">새 비밀번호</label>
                  <Input type="password" placeholder="새 비밀번호를 입력하세요" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">비밀번호 확인</label>
                  <Input type="password" placeholder="새 비밀번호를 다시 입력하세요" />
                </div>
                <Button variant="outline" className="gap-2">
                  <Shield className="w-4 h-4" />
                  비밀번호 변경
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  받고 싶은 알림을 선택하여 설정할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">이메일 알림</h4>
                    <p className="text-sm text-gray-600">중요한 알림을 이메일로 받습니다</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, emailNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">푸시 알림</h4>
                    <p className="text-sm text-gray-600">모바일 앱에서 푸시 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, pushNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">과제 마감 알림</h4>
                    <p className="text-sm text-gray-600">과제 마감일이 다가오면 알려줍니다</p>
                  </div>
                  <Switch
                    checked={notifications.assignmentReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, assignmentReminders: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">학생 진도 알림</h4>
                    <p className="text-sm text-gray-600">학생의 학습 진도 상황을 알려줍니다</p>
                  </div>
                  <Switch
                    checked={notifications.studentProgress}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, studentProgress: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">시스템 업데이트</h4>
                    <p className="text-sm text-gray-600">새로운 기능이나 업데이트 소식을 알려줍니다</p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, systemUpdates: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">주간 리포트</h4>
                    <p className="text-sm text-gray-600">주간 학습 현황을 요약해서 보내줍니다</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, weeklyReports: checked})
                    }
                  />
                </div>

                <Button onClick={() => handleSave('notifications')} className="gap-2">
                  <Save className="w-4 h-4" />
                  알림 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>개인정보 보호</CardTitle>
                <CardDescription>
                  개인정보와 데이터 사용에 관한 설정을 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">프로필 공개 범위</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="public"
                        checked={privacy.profileVisibility === 'public'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                      />
                      <span className="text-sm">공개 - 모든 사용자에게 공개</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="school-only"
                        checked={privacy.profileVisibility === 'school-only'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                      />
                      <span className="text-sm">학교 내에서만 공개</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="private"
                        checked={privacy.profileVisibility === 'private'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                      />
                      <span className="text-sm">비공개 - 본인만 볼 수 있음</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">학습 진도 공유</h4>
                    <p className="text-sm text-gray-600">다른 선생님들과 학습 진도를 공유합니다</p>
                  </div>
                  <Switch
                    checked={privacy.shareProgress}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, shareProgress: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">사용 데이터 수집</h4>
                    <p className="text-sm text-gray-600">서비스 개선을 위한 사용 패턴 분석에 동의</p>
                  </div>
                  <Switch
                    checked={privacy.dataCollection}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, dataCollection: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">마케팅 이메일</h4>
                    <p className="text-sm text-gray-600">새로운 기능 소식이나 이벤트 정보를 받습니다</p>
                  </div>
                  <Switch
                    checked={privacy.marketingEmails}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, marketingEmails: checked})
                    }
                  />
                </div>

                <Button onClick={() => handleSave('privacy')} className="gap-2">
                  <Save className="w-4 h-4" />
                  개인정보 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>화면 및 언어 설정</CardTitle>
                <CardDescription>
                  앱의 모양과 언어를 설정할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">테마 설정</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={appearance.theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, theme: 'light'})}
                      className="gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      밝은 모드
                    </Button>
                    <Button
                      variant={appearance.theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, theme: 'dark'})}
                      className="gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      어두운 모드
                    </Button>
                    <Button
                      variant={appearance.theme === 'auto' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, theme: 'auto'})}
                      className="gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      자동
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">언어 설정</h4>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={appearance.language}
                    onChange={(e) => setAppearance({...appearance, language: e.target.value as any})}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <h4 className="font-medium mb-3">글자 크기</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={appearance.fontSize === 'small' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, fontSize: 'small'})}
                    >
                      작게
                    </Button>
                    <Button
                      variant={appearance.fontSize === 'medium' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, fontSize: 'medium'})}
                    >
                      보통
                    </Button>
                    <Button
                      variant={appearance.fontSize === 'large' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, fontSize: 'large'})}
                    >
                      크게
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">소리 효과</h4>
                    <p className="text-sm text-gray-600">버튼 클릭이나 알림 소리를 활성화합니다</p>
                  </div>
                  <Switch
                    checked={appearance.soundEnabled}
                    onCheckedChange={(checked) => 
                      setAppearance({...appearance, soundEnabled: checked})
                    }
                  />
                </div>

                <Button onClick={() => handleSave('appearance')} className="gap-2">
                  <Save className="w-4 h-4" />
                  화면 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>데이터 관리</CardTitle>
                <CardDescription>
                  개인 데이터를 백업하거나 계정을 관리할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">데이터 백업</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    교재, 과제, 학생 정보 등 모든 데이터를 백업할 수 있습니다
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    전체 데이터 다운로드
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">데이터 가져오기</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    이전에 백업한 데이터를 가져올 수 있습니다
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    백업 데이터 업로드
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    계정 삭제
                  </h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    계정 삭제 요청
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle>도움말 및 지원</CardTitle>
                <CardDescription>
                  문제가 있거나 도움이 필요하시면 언제든 연락하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2">
                    <HelpCircle className="w-4 h-4" />
                    자주 묻는 질문
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    고객 지원팀 연락
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 pt-4 border-t">
                  <p>버전: 2.1.0</p>
                  <p>마지막 업데이트: 2024년 1월 20일</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}