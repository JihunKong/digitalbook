import { test, expect } from '@playwright/test';

test.describe('Basic Application Check', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // 홈페이지 타이틀 확인
    await expect(page).toHaveTitle(/내책/);
    
    // 메인 헤딩 확인
    await expect(page.getByRole('heading', { name: /내책 - 교사가 만드는 디지털 교과서/ })).toBeVisible();
    
    // 주요 버튼들 확인
    await expect(page.getByRole('button', { name: '교사로 시작하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '학생으로 시작하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '접근 코드로 입장' })).toBeVisible();
    await expect(page.getByRole('button', { name: '공개 교과서 둘러보기' })).toBeVisible();
  });

  test('should navigate to guest access page', async ({ page }) => {
    await page.goto('/');
    
    // 접근 코드로 입장 버튼 클릭
    await page.getByRole('button', { name: '접근 코드로 입장' }).click();
    
    // URL 변경 확인
    await expect(page).toHaveURL('/guest');
    
    // 게스트 접속 페이지 요소 확인
    await expect(page.getByRole('heading', { name: /게스트 접속/ })).toBeVisible();
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.goto('/');
    
    // 공개 교과서 둘러보기 버튼 클릭
    await page.getByRole('button', { name: '공개 교과서 둘러보기' }).click();
    
    // URL 변경 확인
    await expect(page).toHaveURL('/explore');
  });

  test('should show teacher dashboard after selecting teacher', async ({ page }) => {
    await page.goto('/');
    
    // 교사로 시작하기 클릭
    await page.getByRole('button', { name: '교사로 시작하기' }).click();
    
    // 대시보드로 이동 버튼 표시 확인
    await expect(page.getByRole('button', { name: '대시보드로 이동' })).toBeVisible();
    
    // 대시보드로 이동
    await page.getByRole('button', { name: '대시보드로 이동' }).click();
    
    // 교사 대시보드 URL 확인
    await expect(page).toHaveURL('/teacher/dashboard');
  });

  test('should show student dashboard after selecting student', async ({ page }) => {
    await page.goto('/');
    
    // 학생으로 시작하기 클릭
    await page.getByRole('button', { name: '학생으로 시작하기' }).click();
    
    // 대시보드로 이동 버튼 표시 확인
    await expect(page.getByRole('button', { name: '대시보드로 이동' })).toBeVisible();
    
    // 대시보드로 이동
    await page.getByRole('button', { name: '대시보드로 이동' }).click();
    
    // 학생 대시보드 URL 확인
    await expect(page).toHaveURL('/student/dashboard');
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    
    // 주요 기능 섹션 확인
    await expect(page.getByRole('heading', { name: '주요 기능' })).toBeVisible();
    
    // 각 기능 카드 확인
    await expect(page.getByText('교사 주도 교과서 제작')).toBeVisible();
    await expect(page.getByText('선택적 AI 지원')).toBeVisible();
    await expect(page.getByText('교사의 평가 주권')).toBeVisible();
    await expect(page.getByText('교사 학습 공동체')).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    await page.goto('/');
    
    // 사용자 후기 섹션으로 스크롤
    await page.getByRole('heading', { name: '사용자 후기' }).scrollIntoViewIfNeeded();
    
    // 사용자 후기 확인
    await expect(page.getByText('김은주 선생님')).toBeVisible();
    await expect(page.getByText('박민수 선생님')).toBeVisible();
    await expect(page.getByText('이정희 선생님')).toBeVisible();
  });

  test('should display CTA section', async ({ page }) => {
    await page.goto('/');
    
    // CTA 섹션으로 스크롤
    await page.getByText('교사님의 수업 철학을 담은 교과서를 만들어보세요').scrollIntoViewIfNeeded();
    
    // CTA 버튼 확인
    await expect(page.getByRole('link', { name: '무료로 시작하기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '데모 체험하기' })).toBeVisible();
  });
});