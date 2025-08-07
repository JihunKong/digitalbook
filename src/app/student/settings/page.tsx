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
  Volume2,
  HelpCircle,
  Mail,
  Phone,
  Camera,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Languages,
  Accessibility,
  BookOpen,
  Target,
  Zap,
  Heart,
  Star,
  Clock,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  Gift,
  Sparkles
} from 'lucide-react'

interface StudentProfile {
  name: string
  grade: string
  school: string
  parentEmail: string
  parentPhone: string
  interests: string[]
  bio: string
  avatar?: string
}

interface NotificationSettings {
  assignmentReminders: boolean
  achievementAlerts: boolean
  dailyGoalReminders: boolean
  parentNotifications: boolean
  friendActivity: boolean
  systemUpdates: boolean
}

interface LearningPreferences {
  studyGoalMinutes: number
  preferredSubjects: string[]
  difficultyLevel: 'easy' | 'medium' | 'hard'
  reminderTime: string
  soundEnabled: boolean
  animationsEnabled: boolean
  autoSave: boolean
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends-only' | 'private'
  shareProgress: boolean
  showInLeaderboard: boolean
  allowFriendRequests: boolean
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  colorScheme: 'default' | 'colorful' | 'high-contrast'
  language: 'ko' | 'en'
}

export default function StudentSettingsPage() {
  const [profile, setProfile] = useState<StudentProfile>({
    name: '김민수',
    grade: '3학년',
    school: '서울초등학교',
    parentEmail: 'parent@example.com',
    parentPhone: '010-1234-5678',
    interests: ['독서', '과학실험', '그림그리기'],
    bio: '매일 조금씩 성장하는 것이 목표입니다!'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    assignmentReminders: true,
    achievementAlerts: true,
    dailyGoalReminders: true,
    parentNotifications: true,
    friendActivity: false,
    systemUpdates: false
  })

  const [learningPrefs, setLearningPrefs] = useState<LearningPreferences>({
    studyGoalMinutes: 60,
    preferredSubjects: ['국어', '과학'],
    difficultyLevel: 'medium',
    reminderTime: '19:00',
    soundEnabled: true,
    animationsEnabled: true,
    autoSave: true
  })

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'friends-only',
    shareProgress: true,
    showInLeaderboard: true,
    allowFriendRequests: true
  })

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'medium',
    colorScheme: 'colorful',
    language: 'ko'
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

  const availableInterests = [
    '독서', '수학', '과학실험', '음악', '미술', '체육', '요리', '게임',
    '영화감상', '여행', '동물', '자연관찰', '블록조립', '그림그리기'
  ]

  const toggleInterest = (interest: string) => {
    if (profile.interests.includes(interest)) {
      setProfile({
        ...profile,
        interests: profile.interests.filter(i => i !== interest)
      })
    } else {
      setProfile({
        ...profile,
        interests: [...profile.interests, interest]
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
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
            <TabsTrigger value="learning" className="gap-2">
              <BookOpen className="w-4 h-4" />
              학습
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              알림
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              화면
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              개인정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>내 정보</CardTitle>
                <CardDescription>
                  프로필 정보를 확인하고 수정할 수 있어요
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
                    <p className="text-xs text-gray-500 mt-1">
                      부모님의 허락을 받고 사진을 변경하세요
                    </p>
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
                    <label className="block text-sm font-medium mb-2">학년</label>
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
                  <div>
                    <label className="block text-sm font-medium mb-2">학교</label>
                    <Input
                      value={profile.school}
                      onChange={(e) => setProfile({...profile, school: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">부모님 이메일</label>
                    <Input
                      type="email"
                      value={profile.parentEmail}
                      onChange={(e) => setProfile({...profile, parentEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">자기소개</label>
                  <Textarea
                    placeholder="자신을 소개해보세요"
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    100자 이내로 작성해주세요
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">관심사</label>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map((interest) => (
                      <Button
                        key={interest}
                        size="sm"
                        variant={profile.interests.includes(interest) ? 'default' : 'outline'}
                        onClick={() => toggleInterest(interest)}
                        className="gap-2"
                      >
                        {profile.interests.includes(interest) && <Heart className="w-3 h-3" />}
                        {interest}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    좋아하는 것들을 선택해주세요 (최대 5개)
                  </p>
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
          </TabsContent>

          <TabsContent value="learning" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>학습 설정</CardTitle>
                <CardDescription>
                  나에게 맞는 학습 환경을 설정해보세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">하루 학습 목표 시간</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="180"
                      step="15"
                      value={learningPrefs.studyGoalMinutes}
                      onChange={(e) => setLearningPrefs({
                        ...learningPrefs, 
                        studyGoalMinutes: parseInt(e.target.value)
                      })}
                      className="flex-1"
                    />
                    <Badge className="bg-blue-100 text-blue-800">
                      {learningPrefs.studyGoalMinutes}분
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    매일 달성하고 싶은 학습 시간을 정해보세요
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">선호하는 과목</label>
                  <div className="flex flex-wrap gap-2">
                    {['국어', '수학', '과학', '사회', '영어', '체육', '음악', '미술'].map((subject) => (
                      <Button
                        key={subject}
                        size="sm"
                        variant={learningPrefs.preferredSubjects.includes(subject) ? 'default' : 'outline'}
                        onClick={() => {
                          if (learningPrefs.preferredSubjects.includes(subject)) {
                            setLearningPrefs({
                              ...learningPrefs,
                              preferredSubjects: learningPrefs.preferredSubjects.filter(s => s !== subject)
                            })
                          } else {
                            setLearningPrefs({
                              ...learningPrefs,
                              preferredSubjects: [...learningPrefs.preferredSubjects, subject]
                            })
                          }
                        }}
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">문제 난이도 선호도</label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={learningPrefs.difficultyLevel === 'easy' ? 'default' : 'outline'}
                      onClick={() => setLearningPrefs({...learningPrefs, difficultyLevel: 'easy'})}
                      className="gap-2"
                    >
                      😊 쉬움
                    </Button>
                    <Button
                      variant={learningPrefs.difficultyLevel === 'medium' ? 'default' : 'outline'}
                      onClick={() => setLearningPrefs({...learningPrefs, difficultyLevel: 'medium'})}
                      className="gap-2"
                    >
                      🤔 보통
                    </Button>
                    <Button
                      variant={learningPrefs.difficultyLevel === 'hard' ? 'default' : 'outline'}
                      onClick={() => setLearningPrefs({...learningPrefs, difficultyLevel: 'hard'})}
                      className="gap-2"
                    >
                      🤓 어려움
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">학습 알림 시간</label>
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <Input
                      type="time"
                      value={learningPrefs.reminderTime}
                      onChange={(e) => setLearningPrefs({
                        ...learningPrefs,
                        reminderTime: e.target.value
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600">매일 이 시간에 알려드릴게요</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">소리 효과</h4>
                      <p className="text-sm text-gray-600">정답을 맞혔을 때 소리가 나요</p>
                    </div>
                    <Switch
                      checked={learningPrefs.soundEnabled}
                      onCheckedChange={(checked) => 
                        setLearningPrefs({...learningPrefs, soundEnabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">애니메이션 효과</h4>
                      <p className="text-sm text-gray-600">재미있는 움직임 효과를 보여줘요</p>
                    </div>
                    <Switch
                      checked={learningPrefs.animationsEnabled}
                      onCheckedChange={(checked) => 
                        setLearningPrefs({...learningPrefs, animationsEnabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">자동 저장</h4>
                      <p className="text-sm text-gray-600">학습 진도를 자동으로 저장해요</p>
                    </div>
                    <Switch
                      checked={learningPrefs.autoSave}
                      onCheckedChange={(checked) => 
                        setLearningPrefs({...learningPrefs, autoSave: checked})
                      }
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('learning')} className="gap-2">
                  <Save className="w-4 h-4" />
                  학습 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  어떤 알림을 받을지 선택해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      과제 알림
                    </h4>
                    <p className="text-sm text-gray-600">과제가 있을 때 알려드려요</p>
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
                    <h4 className="font-medium flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      성취 알림
                    </h4>
                    <p className="text-sm text-gray-600">새로운 배지나 업적을 얻으면 알려드려요</p>
                  </div>
                  <Switch
                    checked={notifications.achievementAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, achievementAlerts: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      학습 목표 알림
                    </h4>
                    <p className="text-sm text-gray-600">매일 정한 시간에 학습을 알려드려요</p>
                  </div>
                  <Switch
                    checked={notifications.dailyGoalReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, dailyGoalReminders: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-500" />
                      부모님 알림
                    </h4>
                    <p className="text-sm text-gray-600">학습 현황을 부모님께 알려드려요</p>
                  </div>
                  <Switch
                    checked={notifications.parentNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, parentNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-500" />
                      친구 활동 알림
                    </h4>
                    <p className="text-sm text-gray-600">친구들의 학습 활동을 알려드려요</p>
                  </div>
                  <Switch
                    checked={notifications.friendActivity}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, friendActivity: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      업데이트 알림
                    </h4>
                    <p className="text-sm text-gray-600">새로운 기능이나 업데이트 소식을 알려드려요</p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, systemUpdates: checked})
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

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>화면 설정</CardTitle>
                <CardDescription>
                  보기 편한 화면으로 바꿔보세요
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
                  <p className="text-xs text-gray-500 mt-2">
                    글자가 작아서 읽기 어려우면 크게 설정해보세요
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">색상 테마</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={appearance.colorScheme === 'default' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, colorScheme: 'default'})}
                      className="gap-2"
                    >
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      기본
                    </Button>
                    <Button
                      variant={appearance.colorScheme === 'colorful' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, colorScheme: 'colorful'})}
                      className="gap-2"
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" />
                      알록달록
                    </Button>
                    <Button
                      variant={appearance.colorScheme === 'high-contrast' ? 'default' : 'outline'}
                      onClick={() => setAppearance({...appearance, colorScheme: 'high-contrast'})}
                      className="gap-2"
                    >
                      <div className="w-3 h-3 bg-black rounded-full border-2" />
                      고대비
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">언어</h4>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={appearance.language}
                    onChange={(e) => setAppearance({...appearance, language: e.target.value as any})}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    부모님과 함께 언어를 선택해보세요
                  </p>
                </div>

                <Button onClick={() => handleSave('appearance')} className="gap-2">
                  <Save className="w-4 h-4" />
                  화면 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>개인정보 보호</CardTitle>
                <CardDescription>
                  안전한 학습을 위한 설정이에요. 부모님과 함께 확인해주세요
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
                      <span className="text-sm">모든 사람에게 공개</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="friends-only"
                        checked={privacy.profileVisibility === 'friends-only'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                      />
                      <span className="text-sm">친구들에게만 공개 (추천)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="private"
                        checked={privacy.profileVisibility === 'private'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                      />
                      <span className="text-sm">나만 볼 수 있게</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">학습 진도 공유</h4>
                    <p className="text-sm text-gray-600">친구들과 서로의 학습 현황을 볼 수 있어요</p>
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
                    <h4 className="font-medium">순위표 참여</h4>
                    <p className="text-sm text-gray-600">학습 점수로 친구들과 순위를 겨뤄요</p>
                  </div>
                  <Switch
                    checked={privacy.showInLeaderboard}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, showInLeaderboard: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">친구 요청 받기</h4>
                    <p className="text-sm text-gray-600">다른 학생들이 친구 요청을 보낼 수 있어요</p>
                  </div>
                  <Switch
                    checked={privacy.allowFriendRequests}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, allowFriendRequests: checked})
                    }
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">안전 수칙</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 개인정보(이름, 주소, 전화번호)는 절대 공유하지 마세요</li>
                        <li>• 모르는 사람의 친구 요청은 받지 마세요</li>
                        <li>• 이상한 메시지를 받으면 부모님께 말씀드리세요</li>
                        <li>• 만나자는 제안은 무시하고 신고해주세요</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSave('privacy')} className="gap-2">
                  <Save className="w-4 h-4" />
                  개인정보 설정 저장
                </Button>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle>도움이 필요하면</CardTitle>
                <CardDescription>
                  궁금한 것이 있으면 언제든 물어보세요
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
                    선생님께 문의
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 pt-4 border-t">
                  <p>앱 버전: 2.1.0 (학생용)</p>
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