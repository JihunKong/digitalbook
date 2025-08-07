/**
 * Feature Flag Configuration
 * 단일 DEMO_MODE 환경변수로 모든 데모 기능 제어
 */

export const isDemoMode = (): boolean => {
  // 서버 사이드
  if (typeof window === 'undefined') {
    return process.env.DEMO_MODE === 'true'
  }
  
  // 클라이언트 사이드 - URL 파라미터 또는 localStorage 체크
  const urlParams = new URLSearchParams(window.location.search)
  const urlDemo = urlParams.get('demo') === 'true'
  const storageDemo = localStorage.getItem('demoMode') === 'true'
  
  return urlDemo || storageDemo || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export const features = {
  // 데모 모드 활성화 여부
  DEMO_MODE: isDemoMode(),
  
  // 데모 모드일 때만 활성화되는 기능들
  DEMO_ACCOUNTS: isDemoMode(),           // 데모 계정 자동 로그인
  DEMO_TOURS: isDemoMode(),              // 데모 투어 가이드
  DEMO_RESET: isDemoMode(),              // 주기적 데이터 리셋
  DEMO_BANNER: isDemoMode(),             // 데모 모드 배너 표시
  DEMO_WATERMARK: isDemoMode(),          // 데모 워터마크
  
  // 데모 모드에서 제한되는 기능들
  REAL_PAYMENTS: !isDemoMode(),          // 실제 결제 비활성화
  EMAIL_NOTIFICATIONS: !isDemoMode(),    // 실제 이메일 발송 비활성화
  DATA_EXPORT: !isDemoMode(),            // 데이터 내보내기 제한
  ADMIN_FEATURES: !isDemoMode(),         // 관리자 기능 제한
}

// 데모 모드 설정/해제 헬퍼 함수
export const setDemoMode = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('demoMode', 'true')
    } else {
      localStorage.removeItem('demoMode')
    }
    // 페이지 새로고침으로 설정 적용
    window.location.reload()
  }
}

// 데모 데이터 리셋 간격 (1시간)
export const DEMO_RESET_INTERVAL = 60 * 60 * 1000

// 데모 계정 정보
export const DEMO_ACCOUNTS = {
  teacher: {
    email: 'teacher1@test.com',
    password: 'teacher123!',
    name: '데모 교사',
  },
  student: {
    email: 'student1@test.com', 
    password: 'student123!',
    name: '데모 학생',
  },
  admin: {
    email: 'admin@test.com',
    password: 'admin123!',
    name: '데모 관리자',
  },
}

// 데모 모드 메시지
export const DEMO_MESSAGES = {
  banner: '현재 데모 모드로 실행 중입니다. 모든 데이터는 1시간마다 초기화됩니다.',
  loginHint: '데모 계정으로 자동 로그인하려면 "데모 시작" 버튼을 클릭하세요.',
  resetWarning: '5분 후 데모 데이터가 초기화됩니다.',
  featureDisabled: '이 기능은 데모 모드에서 사용할 수 없습니다.',
}