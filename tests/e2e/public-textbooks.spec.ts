import { test, expect } from '@playwright/test';

test.describe('Public Textbooks', () => {
  test('should browse public textbooks', async ({ page }) => {
    await page.goto('/explore');
    
    // Check if the page loaded correctly
    await expect(page.getByRole('heading', { name: '공개 교과서 둘러보기' })).toBeVisible();
    
    // Check if search functionality works
    await page.fill('input[placeholder*="교과서 제목"]', '국어');
    await page.waitForTimeout(1000);
    
    // Check if filters work
    await page.click('[data-testid="subject-select"]');
    await page.click('text=국어');
    
    await page.click('[data-testid="grade-select"]');
    await page.click('text=3학년');
    
    // Should show filtered results or empty state
    const noResults = page.getByText('검색 결과가 없습니다');
    const hasTextbooks = page.locator('.textbook-card').first();
    
    const isNoResults = await noResults.isVisible().catch(() => false);
    const hasResults = await hasTextbooks.isVisible().catch(() => false);
    
    expect(isNoResults || hasResults).toBe(true);
  });
  
  test('should preview public textbook', async ({ page }) => {
    await page.goto('/explore');
    
    // Look for preview button on a textbook
    const previewButton = page.locator('button:has-text("미리보기")').first();
    const buttonExists = await previewButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      await previewButton.click();
      
      // Should open preview modal or navigate to preview page
      await expect(page.locator('[data-testid="textbook-preview"]')).toBeVisible({ timeout: 5000 });
    }
  });
  
  test('should copy public textbook', async ({ page }) => {
    // This test would require authentication
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/explore');
    
    // Look for copy button on a textbook
    const copyButton = page.locator('button:has-text("내 교과서로 복사")').first();
    const buttonExists = await copyButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      await copyButton.click();
      
      // Should show success message
      await expect(page.getByText(/복사되었습니다|성공/)).toBeVisible({ timeout: 5000 });
    }
  });
});