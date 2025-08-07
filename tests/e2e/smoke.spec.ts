import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should be able to navigate to homepage', async ({ page }) => {
    // Test basic navigation to a simple website to verify Playwright works
    await page.goto('https://example.com');
    
    await expect(page.getByRole('heading', { name: 'Example Domain' })).toBeVisible();
  });
  
  test('should be able to fill forms', async ({ page }) => {
    await page.goto('data:text/html,<form><input type="text" id="test-input" placeholder="Test input"><button type="submit">Submit</button></form>');
    
    await page.fill('#test-input', 'Hello Playwright');
    await expect(page.locator('#test-input')).toHaveValue('Hello Playwright');
  });
  
  test('should capture screenshots on failure', async ({ page }) => {
    await page.goto('data:text/html,<h1>Test Page</h1>');
    
    // This should pass - just verifying the test infrastructure
    await expect(page.getByRole('heading', { name: 'Test Page' })).toBeVisible();
  });
});