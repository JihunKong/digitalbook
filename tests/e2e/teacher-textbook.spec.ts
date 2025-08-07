import { test, expect } from '@playwright/test';

test.describe('Teacher Textbook Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login - in real tests, you'd have proper authentication
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/teacher/dashboard', { timeout: 5000 }).catch(() => {});
  });
  
  test('should create a new textbook', async ({ page }) => {
    await page.goto('/teacher/textbooks');
    
    // Click create new textbook button
    await page.click('button:has-text("새 교과서 만들기")');
    
    // Fill in textbook details
    await page.fill('input[name="title"]', 'E2E 테스트 교과서');
    await page.selectOption('select[name="subject"]', '국어');
    await page.selectOption('select[name="grade"]', '3');
    
    // Submit form
    await page.click('button:has-text("생성")');
    
    // Check if textbook was created
    await expect(page.getByText('E2E 테스트 교과서')).toBeVisible({ timeout: 10000 });
  });
  
  test('should generate access code for textbook', async ({ page }) => {
    await page.goto('/teacher/textbooks');
    
    // Click on a textbook (assuming one exists)
    const textbookCard = page.locator('.textbook-card').first();
    await textbookCard.click();
    
    // Navigate to sharing settings
    await page.click('button:has-text("공유 설정")');
    
    // Generate access code
    await page.click('button:has-text("접근 코드 생성")');
    
    // Check if code was generated
    await expect(page.locator('input[readonly]')).toHaveValue(/.{6}/);
  });
  
  test('should toggle public visibility', async ({ page }) => {
    await page.goto('/teacher/textbooks');
    
    // Click on a textbook
    const textbookCard = page.locator('.textbook-card').first();
    await textbookCard.click();
    
    // Navigate to sharing settings
    await page.click('button:has-text("공유 설정")');
    
    // Toggle public switch
    const publicSwitch = page.locator('#public-toggle');
    await publicSwitch.click();
    
    // Check for confirmation
    await expect(page.getByText(/교과서가 공개되었습니다|교과서가 비공개로/)).toBeVisible();
  });
});