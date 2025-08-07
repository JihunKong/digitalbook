import { test, expect } from '@playwright/test';

test.describe('Docker Environment Verification', () => {
  test('should verify Playwright can run tests in Docker environment', async ({ page }) => {
    // Create a simple HTML page to test
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Docker Test Page</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Docker 테스트 환경</h1>
        <form id="test-form">
          <input type="text" id="name" placeholder="이름을 입력하세요" required>
          <input type="text" id="code" placeholder="코드를 입력하세요" required>
          <button type="submit">제출</button>
        </form>
        <div id="result" style="display: none;">
          <p>테스트 성공!</p>
        </div>
        <script>
          document.getElementById('test-form').addEventListener('submit', function(e) {
            e.preventDefault();
            document.getElementById('result').style.display = 'block';
          });
        </script>
      </body>
      </html>
    `;
    
    // Navigate to a data URL with our test page
    await page.goto(`data:text/html,${encodeURIComponent(testHTML)}`);
    
    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'Docker 테스트 환경' })).toBeVisible();
    
    // Test form interaction
    await page.fill('#name', '테스트 사용자');
    await page.fill('#code', 'TEST123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify result appears
    await expect(page.getByText('테스트 성공!')).toBeVisible();
  });
  
  test('should verify browser capabilities', async ({ page }) => {
    // Test basic browser functionality
    await page.goto('data:text/html,<h1>브라우저 테스트</h1><button onclick="this.textContent=\'클릭됨\'">클릭</button>');
    
    await expect(page.getByRole('heading', { name: '브라우저 테스트' })).toBeVisible();
    await page.click('button');
    await expect(page.getByText('클릭됨')).toBeVisible();
  });
  
  test('should test Korean text handling', async ({ page }) => {
    // Test Korean text input and display
    const koreanHTML = `
      <div>
        <h1>한국어 테스트</h1>
        <input type="text" id="korean-input" placeholder="한국어를 입력하세요">
        <div id="output"></div>
        <script>
          document.getElementById('korean-input').addEventListener('input', function(e) {
            document.getElementById('output').textContent = '입력된 텍스트: ' + e.target.value;
          });
        </script>
      </div>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(koreanHTML)}`);
    
    await expect(page.getByRole('heading', { name: '한국어 테스트' })).toBeVisible();
    await page.fill('#korean-input', '안녕하세요');
    await expect(page.getByText('입력된 텍스트: 안녕하세요')).toBeVisible();
  });
});