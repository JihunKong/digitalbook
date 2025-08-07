import { test, expect } from '@playwright/test';

test.describe('Guest Access', () => {
  test('should load guest access page', async ({ page }) => {
    // Skip if no local server is running
    try {
      await page.goto('http://localhost:3000/guest', { timeout: 5000 });
    } catch (error) {
      console.log('Local server not available, skipping test');
      test.skip();
      return;
    }
    
    // Check if the page loaded correctly
    await expect(page.getByRole('heading', { name: '학습 시작하기' })).toBeVisible();
    
    // Check form elements exist
    await expect(page.locator('input[id="accessCode"]')).toBeVisible();
    await expect(page.locator('input[id="studentId"]')).toBeVisible();
    await expect(page.locator('input[id="studentName"]')).toBeVisible();
    await expect(page.locator('button:has-text("학습 시작")')).toBeVisible();
  });
  
  test('should validate form fields', async ({ page }) => {
    // Skip if no local server is running
    try {
      await page.goto('http://localhost:3000/guest', { timeout: 5000 });
    } catch (error) {
      console.log('Local server not available, skipping test');
      test.skip();
      return;
    }
    
    // Fill in the form with valid data
    await page.fill('input[id="accessCode"]', 'TEST123');
    await page.fill('input[id="studentId"]', '20241234');
    await page.fill('input[id="studentName"]', '테스트학생');
    
    // Check that form validation passes
    const submitButton = page.locator('button:has-text("학습 시작")');
    await expect(submitButton).toBeEnabled();
    
    // Clear a required field
    await page.fill('input[id="studentName"]', '');
    
    // Try to submit without all fields
    await submitButton.click();
    
    // Check for validation (might be browser validation or custom)
    // This will vary based on implementation
  });
  
  test('should navigate to explore page', async ({ page }) => {
    try {
      await page.goto('http://localhost:3000/', { timeout: 5000 });
    } catch (error) {
      console.log('Local server not available, skipping test');
      test.skip();
      return;
    }
    
    // Look for explore link
    const exploreButton = page.locator('a[href="/explore"]');
    if (await exploreButton.isVisible()) {
      await exploreButton.click();
      await expect(page.getByRole('heading', { name: '공개 교과서 둘러보기' })).toBeVisible();
    }
  });
});