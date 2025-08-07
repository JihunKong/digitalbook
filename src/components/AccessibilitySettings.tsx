'use client'

import { useState } from 'react'
import { 
  Settings, 
  Eye, 
  Type, 
  Zap, 
  Volume2, 
  Keyboard, 
  Focus,
  Contrast,
  Moon,
  Sun,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAccessibility } from './AccessibilityProvider'

export function AccessibilitySettings() {
  const { settings, updateSetting, announceToScreenReader } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false)

  const handleSettingChange = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    updateSetting(key, value)
  }

  const resetToDefaults = () => {
    updateSetting('highContrast', false)
    updateSetting('reducedMotion', false)
    updateSetting('fontSize', 'medium')
    updateSetting('screenReader', false)
    updateSetting('keyboardNavigation', true)
    updateSetting('focusIndicators', true)
    
    announceToScreenReader('모든 접근성 설정이 기본값으로 재설정되었습니다.')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="접근성 설정 열기"
        >
          <Settings className="h-4 w-4" />
          접근성
          <Badge variant="secondary" className="text-xs">
            A11Y
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="accessibility-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            접근성 설정
          </DialogTitle>
          <DialogDescription id="accessibility-description">
            더 나은 사용 경험을 위해 접근성 옵션을 조정하세요. 
            변경사항은 자동으로 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                시각적 설정
              </CardTitle>
              <CardDescription>
                화면 표시 및 시각적 요소 관련 설정
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="high-contrast" className="text-sm font-medium">
                    고대비 모드
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    텍스트와 배경의 대비를 높여 가독성을 개선합니다
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                  aria-describedby="high-contrast-description"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-sm font-medium">
                  글자 크기
                </Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) => handleSettingChange('fontSize', value as any)}
                >
                  <SelectTrigger id="font-size" aria-label="글자 크기 선택">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">작게</SelectItem>
                    <SelectItem value="medium">보통 (기본)</SelectItem>
                    <SelectItem value="large">크게</SelectItem>
                    <SelectItem value="extra-large">매우 크게</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  현재 크기: <span className="font-medium">{getFontSizeLabel(settings.fontSize)}</span>
                </p>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="focus-indicators" className="text-sm font-medium">
                    포커스 표시기 강화
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    키보드 탐색 시 현재 선택된 요소를 더 명확하게 표시합니다
                  </p>
                </div>
                <Switch
                  id="focus-indicators"
                  checked={settings.focusIndicators}
                  onCheckedChange={(checked) => handleSettingChange('focusIndicators', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Motion Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                모션 설정
              </CardTitle>
              <CardDescription>
                애니메이션 및 화면 전환 효과 관련 설정
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reduced-motion" className="text-sm font-medium">
                    모션 감소
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    애니메이션과 화면 전환 효과를 최소화합니다
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                탐색 설정
              </CardTitle>
              <CardDescription>
                키보드 탐색 및 화면 리더 지원 설정
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="keyboard-navigation" className="text-sm font-medium">
                    키보드 탐색 지원
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    키보드만으로 모든 기능에 접근할 수 있도록 지원합니다
                  </p>
                </div>
                <Switch
                  id="keyboard-navigation"
                  checked={settings.keyboardNavigation}
                  onCheckedChange={(checked) => handleSettingChange('keyboardNavigation', checked)}
                />
              </div>

              {/* Screen Reader */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="screen-reader" className="text-sm font-medium">
                    화면 리더 최적화
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    화면 리더 사용자를 위한 추가 설명과 알림을 제공합니다
                  </p>
                </div>
                <Switch
                  id="screen-reader"
                  checked={settings.screenReader}
                  onCheckedChange={(checked) => handleSettingChange('screenReader', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Focus className="h-5 w-5" />
                키보드 단축키
              </CardTitle>
              <CardDescription>
                빠른 탐색을 위한 키보드 단축키 안내
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>본문으로 이동:</span>
                  <Badge variant="outline">Alt + 1</Badge>
                </div>
                <div className="flex justify-between">
                  <span>탐색 메뉴로 이동:</span>
                  <Badge variant="outline">Alt + 2</Badge>
                </div>
                <div className="flex justify-between">
                  <span>홈페이지로 이동:</span>
                  <Badge variant="outline">Alt + H</Badge>
                </div>
                <div className="flex justify-between">
                  <span>모달 닫기:</span>
                  <Badge variant="outline">Esc</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="gap-2"
            >
              기본값으로 재설정
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              설정이 자동 저장됩니다
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getFontSizeLabel(size: string) {
  const labels = {
    'small': '작게',
    'medium': '보통',
    'large': '크게',
    'extra-large': '매우 크게'
  }
  return labels[size as keyof typeof labels] || '보통'
}

// Quick accessibility toggle component
export function AccessibilityQuickActions() {
  const { settings, updateSetting } = useAccessibility()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateSetting('highContrast', !settings.highContrast)}
        aria-label={`고대비 모드 ${settings.highContrast ? '끄기' : '켜기'}`}
        className={settings.highContrast ? 'bg-accent' : ''}
      >
        <Contrast className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
        aria-label={`모션 감소 ${settings.reducedMotion ? '끄기' : '켜기'}`}
        className={settings.reducedMotion ? 'bg-accent' : ''}
      >
        <Zap className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const sizes = ['small', 'medium', 'large', 'extra-large'] as const
          const currentIndex = sizes.indexOf(settings.fontSize)
          const nextIndex = (currentIndex + 1) % sizes.length
          updateSetting('fontSize', sizes[nextIndex])
        }}
        aria-label="글자 크기 변경"
      >
        <Type className="h-4 w-4" />
      </Button>
    </div>
  )
}