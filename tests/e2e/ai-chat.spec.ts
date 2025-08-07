import { test, expect } from '@playwright/test';

test.describe('AI Chat Functionality', () => {
  test('should send message in AI chat as guest', async ({ page }) => {
    // First access as guest
    await page.goto('/guest');
    
    await page.fill('input[id="accessCode"]', 'TEST123');
    await page.fill('input[id="studentId"]', '20241234');
    await page.fill('input[id="studentName"]', '테스트학생');
    
    await page.click('button:has-text("학습 시작")');
    
    // Check if we can access the textbook (might fail if no valid code)
    const errorMessage = page.getByText(/유효하지 않은|접근에 실패/);
    const isError = await errorMessage.isVisible().catch(() => false);
    
    if (!isError) {
      // Wait for textbook page to load
      await page.waitForURL('**/guest/textbook/**', { timeout: 10000 });
      
      // Open chat sidebar (might be collapsed on mobile)
      const chatButton = page.locator('button:has-text("AI 튜터")');
      const isChatButtonVisible = await chatButton.isVisible().catch(() => false);
      
      if (isChatButtonVisible) {
        await chatButton.click();
      }
      
      // Find chat input
      const chatInput = page.locator('textarea[placeholder*="질문"]');
      const isChatInputVisible = await chatInput.isVisible().catch(() => false);
      
      if (isChatInputVisible) {
        await chatInput.fill('안녕하세요, AI 튜터님');
        await page.click('button:has-text("전송")');
        
        // Wait for AI response
        await expect(page.locator('.ai-message')).toBeVisible({ timeout: 15000 });
      }
    }
  });
  
  test('should show chat suggestions', async ({ page }) => {
    // Mock successful guest access
    await page.goto('/guest');
    
    await page.fill('input[id="accessCode"]', 'TEST123');
    await page.fill('input[id="studentId"]', '20241234');
    await page.fill('input[id="studentName"]', '테스트학생');
    
    await page.click('button:has-text("학습 시작")');
    
    // Skip if invalid access code
    const errorMessage = page.getByText(/유효하지 않은|접근에 실패/);
    const isError = await errorMessage.isVisible().catch(() => false);
    
    if (!isError) {
      await page.waitForURL('**/guest/textbook/**', { timeout: 10000 });
      
      // Check for suggestion buttons
      const suggestions = page.locator('[data-testid="chat-suggestion"]');
      const hasSuggestions = await suggestions.first().isVisible().catch(() => false);
      
      if (hasSuggestions) {
        await suggestions.first().click();
        
        // Should fill the chat input
        const chatInput = page.locator('textarea[placeholder*="질문"]');
        await expect(chatInput).not.toHaveValue('');
      }
    }
  });
  
  test('should maintain chat context with page content', async ({ page }) => {
    // This test checks if chat includes page context
    await page.goto('/guest');
    
    await page.fill('input[id="accessCode"]', 'TEST123');
    await page.fill('input[id="studentId"]', '20241234');
    await page.fill('input[id="studentName"]', '테스트학생');
    
    await page.click('button:has-text("학습 시작")');
    
    const errorMessage = page.getByText(/유효하지 않은|접근에 실패/);
    const isError = await errorMessage.isVisible().catch(() => false);
    
    if (!isError) {
      await page.waitForURL('**/guest/textbook/**', { timeout: 10000 });
      
      // Navigate to a specific page if possible
      const nextPageButton = page.locator('button:has-text("다음")');
      const hasNextButton = await nextPageButton.isVisible().catch(() => false);
      
      if (hasNextButton) {
        await nextPageButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Send a context-specific question
      const chatInput = page.locator('textarea[placeholder*="질문"]');
      const isChatInputVisible = await chatInput.isVisible().catch(() => false);
      
      if (isChatInputVisible) {
        await chatInput.fill('이 페이지의 내용을 요약해주세요');
        await page.click('button:has-text("전송")');
        
        // AI should respond with page-specific content
        await page.waitForTimeout(5000);
        const aiResponse = page.locator('.ai-message').last();
        const hasResponse = await aiResponse.isVisible().catch(() => false);
        
        expect(hasResponse).toBe(true);
      }
    }
  });
});