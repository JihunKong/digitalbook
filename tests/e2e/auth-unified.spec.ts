import { test, expect, Page, BrowserContext } from '@playwright/test';
import { UserRole } from '@prisma/client';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:4000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test accounts from TEST_ACCOUNTS.md
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    name: '시스템관리자',
    role: 'ADMIN' as UserRole,
    dashboard: '/admin'
  },
  teacher: {
    email: 'teacher1@test.com',
    password: 'Teacher123!',
    name: '김민정',
    role: 'TEACHER' as UserRole,
    dashboard: '/teacher',
    profileData: {
      school: '서울초등학교',
      subject: '국어',
      grade: '5학년'
    }
  },
  student: {
    email: 'student1@test.com',
    password: 'Student123!',
    name: '김학생',
    role: 'STUDENT' as UserRole,
    dashboard: '/student',
    profileData: {
      school: '서울초등학교',
      grade: '5학년',
      className: '1반',
      studentId: '2024001'
    }
  },
  newUser: {
    email: `test_${Date.now()}@test.com`,
    password: 'Test123!@#',
    name: '테스트사용자',
    role: 'STUDENT' as UserRole
  }
};

// Helper functions
class AuthHelper {
  constructor(private page: Page) {}

  /**
   * CSRF 토큰 가져오기
   */
  async getCsrfToken(): Promise<string> {
    const response = await this.page.request.get(`${API_URL}/api/csrf/token`);
    const data = await response.json();
    return data.csrfToken;
  }

  /**
   * 로그인 수행
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * API 로그인 (httpOnly 쿠키 테스트용)
   */
  async apiLogin(email: string, password: string): Promise<any> {
    const csrfToken = await this.getCsrfToken();
    const response = await this.page.request.post(`${API_URL}/api/auth/login`, {
      data: { email, password },
      headers: {
        'x-csrf-token': csrfToken,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * 회원가입 수행
   */
  async register(userData: any): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/register`);
    
    // 기본 정보 입력
    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[name="password"]', userData.password);
    await this.page.fill('input[name="passwordConfirm"]', userData.password);
    await this.page.fill('input[name="name"]', userData.name);
    
    // 역할 선택
    await this.page.selectOption('select[name="role"]', userData.role);
    
    // 역할별 추가 정보 입력
    if (userData.profileData) {
      await this.fillProfileData(userData.role, userData.profileData);
    }
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 역할별 프로필 데이터 입력
   */
  private async fillProfileData(role: string, profileData: any): Promise<void> {
    switch (role) {
      case 'TEACHER':
        await this.page.fill('input[name="school"]', profileData.school || '');
        await this.page.fill('input[name="subject"]', profileData.subject || '');
        await this.page.fill('input[name="grade"]', profileData.grade || '');
        break;
      case 'STUDENT':
        await this.page.fill('input[name="school"]', profileData.school || '');
        await this.page.fill('input[name="grade"]', profileData.grade || '');
        await this.page.fill('input[name="className"]', profileData.className || '');
        await this.page.fill('input[name="studentId"]', profileData.studentId || '');
        break;
      case 'ADMIN':
        await this.page.fill('input[name="department"]', profileData.department || '시스템 관리');
        break;
    }
  }

  /**
   * 로그아웃 수행
   */
  async logout(): Promise<void> {
    const csrfToken = await this.getCsrfToken();
    await this.page.request.post(`${API_URL}/api/auth/logout`, {
      headers: {
        'x-csrf-token': csrfToken
      }
    });
    await this.page.goto(`${BASE_URL}`);
  }

  /**
   * 현재 사용자 정보 확인
   */
  async getCurrentUser(): Promise<any> {
    const response = await this.page.request.get(`${API_URL}/api/auth/me`);
    if (response.ok()) {
      return response.json();
    }
    return null;
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(): Promise<boolean> {
    const response = await this.page.request.post(`${API_URL}/api/auth/refresh`);
    return response.ok();
  }
}

// Test suites
test.describe('통합 인증 시스템 E2E 테스트', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    // Clear cookies and storage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('1. 역할별 회원가입 및 로그인 플로우', () => {
    test('학생 회원가입 및 로그인', async ({ page }) => {
      const newStudent = {
        ...TEST_ACCOUNTS.newUser,
        email: `student_${Date.now()}@test.com`,
        role: 'STUDENT',
        profileData: TEST_ACCOUNTS.student.profileData
      };

      // 회원가입
      await authHelper.register(newStudent);
      
      // 회원가입 성공 확인
      await expect(page).toHaveURL(/.*\/auth\/login/);
      await expect(page.locator('.success-message')).toContainText('회원가입이 완료되었습니다');

      // 로그인
      await authHelper.login(newStudent.email, newStudent.password);
      
      // 학생 대시보드 리다이렉트 확인
      await expect(page).toHaveURL(/.*\/student/);
      await expect(page.locator('h1')).toContainText('학생 대시보드');
    });

    test('교사 회원가입 및 로그인', async ({ page }) => {
      const newTeacher = {
        ...TEST_ACCOUNTS.newUser,
        email: `teacher_${Date.now()}@test.com`,
        role: 'TEACHER',
        profileData: TEST_ACCOUNTS.teacher.profileData
      };

      // 회원가입
      await authHelper.register(newTeacher);
      
      // 로그인
      await authHelper.login(newTeacher.email, newTeacher.password);
      
      // 교사 대시보드 리다이렉트 확인
      await expect(page).toHaveURL(/.*\/teacher/);
      await expect(page.locator('h1')).toContainText('교사 대시보드');
    });

    test('관리자 로그인 (기존 계정)', async ({ page }) => {
      await authHelper.login(TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
      
      // 관리자 대시보드 리다이렉트 확인
      await expect(page).toHaveURL(/.*\/admin/);
      await expect(page.locator('h1')).toContainText('관리자 대시보드');
      
      // 관리자 메뉴 확인
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    });
  });

  test.describe('2. 역할별 대시보드 접근 권한 검증', () => {
    test('학생이 교사 대시보드 접근 시도', async ({ page }) => {
      // 학생으로 로그인
      await authHelper.login(TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
      
      // 교사 대시보드 직접 접근 시도
      await page.goto(`${BASE_URL}/teacher`);
      
      // 접근 거부 확인
      await expect(page).toHaveURL(/.*\/student/);
      await expect(page.locator('.error-message')).toContainText('접근 권한이 없습니다');
    });

    test('교사가 관리자 대시보드 접근 시도', async ({ page }) => {
      // 교사로 로그인
      await authHelper.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      
      // 관리자 대시보드 직접 접근 시도
      await page.goto(`${BASE_URL}/admin`);
      
      // 접근 거부 확인
      await expect(page).toHaveURL(/.*\/teacher/);
      await expect(page.locator('.error-message')).toContainText('접근 권한이 없습니다');
    });

    test('비로그인 사용자의 보호된 페이지 접근', async ({ page }) => {
      // 로그인 없이 대시보드 접근 시도
      await page.goto(`${BASE_URL}/student`);
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/.*\/auth\/login/);
      await expect(page.locator('[data-testid="login-required"]')).toContainText('로그인이 필요합니다');
    });
  });

  test.describe('3. 토큰 갱신 및 세션 관리', () => {
    test('액세스 토큰 자동 갱신', async ({ page }) => {
      // 로그인
      await authHelper.login(TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
      
      // 현재 사용자 정보 확인
      const userBefore = await authHelper.getCurrentUser();
      expect(userBefore.data.email).toBe(TEST_ACCOUNTS.student.email);
      
      // 액세스 토큰 만료 시뮬레이션 (시간 조작 필요)
      // 실제 테스트에서는 짧은 만료 시간 설정 권장
      await page.waitForTimeout(1000);
      
      // 토큰 갱신
      const refreshSuccess = await authHelper.refreshToken();
      expect(refreshSuccess).toBe(true);
      
      // 갱신 후 사용자 정보 재확인
      const userAfter = await authHelper.getCurrentUser();
      expect(userAfter.data.email).toBe(TEST_ACCOUNTS.student.email);
    });

    test('리프레시 토큰 만료 시 재로그인 요구', async ({ page }) => {
      // 로그인
      await authHelper.login(TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
      
      // 리프레시 토큰 무효화 (서버 API 호출 필요)
      await page.request.post(`${API_URL}/api/auth/invalidate-session`);
      
      // 보호된 리소스 접근 시도
      await page.goto(`${BASE_URL}/student/profile`);
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/.*\/auth\/login/);
      await expect(page.locator('.session-expired')).toContainText('세션이 만료되었습니다');
    });

    test('다중 디바이스 세션 관리', async ({ browser }) => {
      // 첫 번째 브라우저 컨텍스트 (디바이스 1)
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const authHelper1 = new AuthHelper(page1);
      
      // 두 번째 브라우저 컨텍스트 (디바이스 2)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      const authHelper2 = new AuthHelper(page2);
      
      // 디바이스 1에서 로그인
      await authHelper1.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      await expect(page1).toHaveURL(/.*\/teacher/);
      
      // 디바이스 2에서 동일 계정 로그인
      await authHelper2.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      await expect(page2).toHaveURL(/.*\/teacher/);
      
      // 두 세션 모두 유효한지 확인
      const user1 = await authHelper1.getCurrentUser();
      const user2 = await authHelper2.getCurrentUser();
      expect(user1.data.email).toBe(TEST_ACCOUNTS.teacher.email);
      expect(user2.data.email).toBe(TEST_ACCOUNTS.teacher.email);
      
      // 정리
      await context1.close();
      await context2.close();
    });
  });

  test.describe('4. CSRF 토큰 검증', () => {
    test('CSRF 토큰 없이 POST 요청 차단', async ({ page }) => {
      // 로그인
      await authHelper.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      
      // CSRF 토큰 없이 직접 API 호출
      const response = await page.request.post(`${API_URL}/api/textbooks`, {
        data: {
          title: '테스트 교과서',
          subject: '국어',
          grade: '5학년'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 요청 거부 확인
      expect(response.status()).toBe(403);
      const error = await response.json();
      expect(error.message).toContain('CSRF');
    });

    test('유효한 CSRF 토큰으로 POST 요청 성공', async ({ page }) => {
      // 로그인
      await authHelper.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      
      // CSRF 토큰 획득
      const csrfToken = await authHelper.getCsrfToken();
      
      // CSRF 토큰 포함하여 API 호출
      const response = await page.request.post(`${API_URL}/api/textbooks`, {
        data: {
          title: '테스트 교과서',
          subject: '국어',
          grade: '5학년'
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });
      
      // 요청 성공 확인
      expect(response.status()).toBe(201);
    });

    test('다른 세션의 CSRF 토큰 사용 차단', async ({ browser }) => {
      // 첫 번째 세션
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const authHelper1 = new AuthHelper(page1);
      
      // 두 번째 세션
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      const authHelper2 = new AuthHelper(page2);
      
      // 각각 다른 계정으로 로그인
      await authHelper1.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      await authHelper2.login(TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
      
      // 세션 1의 CSRF 토큰 획득
      const csrfToken1 = await authHelper1.getCsrfToken();
      
      // 세션 2에서 세션 1의 CSRF 토큰 사용 시도
      const response = await page2.request.post(`${API_URL}/api/assignments/submit`, {
        data: {
          assignmentId: '123',
          content: '과제 제출'
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken1 // 다른 세션의 토큰 사용
        }
      });
      
      // 요청 거부 확인
      expect(response.status()).toBe(403);
      
      // 정리
      await context1.close();
      await context2.close();
    });
  });

  test.describe('5. 게스트 액세스 기능', () => {
    test('게스트 액세스 코드로 임시 접근', async ({ page }) => {
      const guestCode = 'DEMO2024';
      
      // 게스트 액세스 페이지로 이동
      await page.goto(`${BASE_URL}/guest`);
      
      // 액세스 코드 입력
      await page.fill('input[name="accessCode"]', guestCode);
      await page.click('button[type="submit"]');
      
      // 게스트 대시보드 확인
      await expect(page).toHaveURL(/.*\/guest\/dashboard/);
      await expect(page.locator('.guest-banner')).toContainText('게스트 모드');
      await expect(page.locator('.access-limit')).toContainText('24시간');
    });

    test('게스트 사용자 제한 사항 확인', async ({ page }) => {
      const guestCode = 'DEMO2024';
      
      // 게스트로 접근
      await page.goto(`${BASE_URL}/guest`);
      await page.fill('input[name="accessCode"]', guestCode);
      await page.click('button[type="submit"]');
      
      // 공개 교과서 열람 가능
      await page.goto(`${BASE_URL}/textbooks/public`);
      await expect(page.locator('.textbook-list')).toBeVisible();
      
      // 교과서 생성 불가
      await page.goto(`${BASE_URL}/textbooks/create`);
      await expect(page).toHaveURL(/.*\/guest\/dashboard/);
      await expect(page.locator('.error-message')).toContainText('게스트는 교과서를 생성할 수 없습니다');
      
      // AI 튜터 제한적 사용
      await page.goto(`${BASE_URL}/ai-tutor`);
      await expect(page.locator('.question-limit')).toContainText('남은 질문: 50개');
    });

    test('게스트 세션 만료', async ({ page }) => {
      const guestCode = 'DEMO2024';
      
      // 게스트로 접근
      await page.goto(`${BASE_URL}/guest`);
      await page.fill('input[name="accessCode"]', guestCode);
      await page.click('button[type="submit"]');
      
      // 세션 정보 확인
      const response = await page.request.get(`${API_URL}/api/guest/session`);
      const session = await response.json();
      expect(session.data.expiresAt).toBeDefined();
      
      // 만료 시간 확인 (24시간)
      const expiresAt = new Date(session.data.expiresAt);
      const now = new Date();
      const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursRemaining).toBeLessThanOrEqual(24);
      expect(hoursRemaining).toBeGreaterThan(23);
    });

    test('유효하지 않은 게스트 코드', async ({ page }) => {
      const invalidCode = 'INVALID123';
      
      // 게스트 액세스 페이지로 이동
      await page.goto(`${BASE_URL}/guest`);
      
      // 잘못된 액세스 코드 입력
      await page.fill('input[name="accessCode"]', invalidCode);
      await page.click('button[type="submit"]');
      
      // 에러 메시지 확인
      await expect(page.locator('.error-message')).toContainText('유효하지 않은 액세스 코드입니다');
      await expect(page).toHaveURL(/.*\/guest$/);
    });
  });

  test.describe('6. 보안 기능 테스트', () => {
    test('비밀번호 정책 검증', async ({ page }) => {
      const weakPasswords = [
        'short',           // 너무 짧음
        'nouppercase123!', // 대문자 없음
        'NOLOWERCASE123!', // 소문자 없음
        'NoNumbers!',      // 숫자 없음
        'NoSpecial123',    // 특수문자 없음
      ];

      await page.goto(`${BASE_URL}/auth/register`);

      for (const password of weakPasswords) {
        await page.fill('input[name="password"]', password);
        await page.click('body'); // 포커스 이동으로 검증 트리거
        await expect(page.locator('.password-error')).toBeVisible();
      }

      // 유효한 비밀번호
      await page.fill('input[name="password"]', 'Valid123!@#');
      await page.click('body');
      await expect(page.locator('.password-error')).not.toBeVisible();
    });

    test('로그인 시도 제한 (Rate Limiting)', async ({ page }) => {
      const maxAttempts = 5;
      const wrongPassword = 'WrongPassword123!';

      // 여러 번 잘못된 로그인 시도
      for (let i = 0; i < maxAttempts + 1; i++) {
        await page.goto(`${BASE_URL}/auth/login`);
        await page.fill('input[name="email"]', TEST_ACCOUNTS.student.email);
        await page.fill('input[name="password"]', wrongPassword);
        await page.click('button[type="submit"]');
        
        if (i < maxAttempts - 1) {
          await expect(page.locator('.error-message')).toContainText('이메일 또는 비밀번호가 올바르지 않습니다');
        }
      }

      // Rate limit 에러 확인
      await expect(page.locator('.error-message')).toContainText('너무 많은 로그인 시도');
    });

    test('XSS 공격 방어', async ({ page }) => {
      // 로그인
      await authHelper.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
      
      // XSS 페이로드를 포함한 교과서 생성 시도
      const xssPayload = '<script>alert("XSS")</script>';
      const csrfToken = await authHelper.getCsrfToken();
      
      const response = await page.request.post(`${API_URL}/api/textbooks`, {
        data: {
          title: xssPayload,
          subject: '국어',
          grade: '5학년',
          content: `<img src=x onerror="alert('XSS')">`
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });

      // 생성은 성공하지만 스크립트는 실행되지 않음
      expect(response.status()).toBe(201);
      
      // 생성된 교과서 확인
      const textbook = await response.json();
      await page.goto(`${BASE_URL}/textbooks/${textbook.data.id}`);
      
      // XSS 페이로드가 이스케이프되어 표시되는지 확인
      const titleElement = page.locator('.textbook-title');
      await expect(titleElement).toContainText('<script>alert("XSS")</script>');
      
      // 실제 스크립트 실행 여부 확인 (alert 창이 뜨지 않음)
      const alerts: string[] = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(2000);
      expect(alerts).toHaveLength(0);
    });
  });

  test.describe('7. 성능 및 동시성 테스트', () => {
    test('동시 로그인 요청 처리', async ({ browser }) => {
      const contexts = [];
      const loginPromises = [];

      // 5개의 동시 로그인 시도
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const helper = new AuthHelper(page);
        
        contexts.push(context);
        loginPromises.push(
          helper.apiLogin(TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password)
        );
      }

      // 모든 로그인 완료 대기
      const results = await Promise.all(loginPromises);
      
      // 모든 로그인 성공 확인
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.user.email).toBe(TEST_ACCOUNTS.student.email);
      });

      // 정리
      await Promise.all(contexts.map(ctx => ctx.close()));
    });

    test('대량 회원가입 요청 처리', async ({ page }) => {
      const registrationPromises = [];
      const batchSize = 10;

      // 10개의 회원가입 요청 생성
      for (let i = 0; i < batchSize; i++) {
        const userData = {
          email: `batch_user_${Date.now()}_${i}@test.com`,
          password: 'BatchTest123!',
          name: `배치사용자${i}`,
          role: 'STUDENT'
        };

        registrationPromises.push(
          page.request.post(`${API_URL}/api/auth/signup`, {
            data: userData,
            headers: { 'Content-Type': 'application/json' }
          })
        );
      }

      // 모든 회원가입 완료 대기
      const responses = await Promise.all(registrationPromises);
      
      // 성공/실패 카운트
      const success = responses.filter(r => r.status() === 201).length;
      const rateLimit = responses.filter(r => r.status() === 429).length;
      
      // 최소한 일부는 성공해야 함
      expect(success).toBeGreaterThan(0);
      
      // Rate limiting이 적용되었는지 확인
      if (rateLimit > 0) {
        console.log(`Rate limiting applied: ${rateLimit} requests blocked`);
      }
    });
  });

  test.describe('8. 에러 처리 및 복구', () => {
    test('네트워크 오류 시 재시도', async ({ page }) => {
      // 네트워크 오프라인 시뮬레이션
      await page.context().setOffline(true);
      
      // 로그인 시도
      await page.goto(`${BASE_URL}/auth/login`);
      await page.fill('input[name="email"]', TEST_ACCOUNTS.student.email);
      await page.fill('input[name="password"]', TEST_ACCOUNTS.student.password);
      await page.click('button[type="submit"]');
      
      // 오프라인 에러 메시지 확인
      await expect(page.locator('.error-message')).toContainText('네트워크 연결을 확인해주세요');
      
      // 네트워크 복구
      await page.context().setOffline(false);
      
      // 재시도 버튼 클릭
      await page.click('button[data-testid="retry-login"]');
      
      // 로그인 성공 확인
      await expect(page).toHaveURL(/.*\/student/);
    });

    test('서버 오류 시 사용자 친화적 메시지', async ({ page }) => {
      // 잘못된 API 엔드포인트로 요청 (500 에러 유발)
      const response = await page.request.post(`${API_URL}/api/auth/invalid-endpoint`, {
        data: { test: 'data' }
      });
      
      expect(response.status()).toBe(404);
      
      // UI에서 에러 처리 확인
      await page.goto(`${BASE_URL}/auth/login`);
      
      // 서버 에러 시뮬레이션을 위해 잘못된 데이터 전송
      await page.evaluate(() => {
        // @ts-ignore
        window.fetch = () => Promise.reject(new Error('Server Error'));
      });
      
      await page.fill('input[name="email"]', TEST_ACCOUNTS.student.email);
      await page.fill('input[name="password"]', TEST_ACCOUNTS.student.password);
      await page.click('button[type="submit"]');
      
      // 사용자 친화적 에러 메시지 확인
      await expect(page.locator('.error-message')).toContainText('일시적인 오류가 발생했습니다');
    });
  });
});

// Performance monitoring tests
test.describe('성능 모니터링', () => {
  test('로그인 응답 시간 측정', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', TEST_ACCOUNTS.student.email);
    await page.fill('input[name="password"]', TEST_ACCOUNTS.student.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/student/);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 로그인 완료까지 3초 이내
    expect(responseTime).toBeLessThan(3000);
    console.log(`Login response time: ${responseTime}ms`);
  });

  test('페이지 로드 성능 측정', async ({ page }) => {
    // 로그인
    const authHelper = new AuthHelper(page);
    await authHelper.login(TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
    
    // 성능 메트릭 수집
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    // 성능 기준 확인
    expect(metrics.domInteractive).toBeLessThan(2000);
    expect(metrics.loadComplete).toBeLessThan(5000);
    
    console.log('Page performance metrics:', metrics);
  });
});