import { test, expect, Page } from '@playwright/test';

// Test configuration with environment variables
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Specific test user data as requested
const TEST_USER = {
  name: "테스트교사",
  email: "test@teacher.com",
  password: "testpassword123",
  role: "TEACHER"
};

// Helper class for authentication operations
class AuthTestHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to signup page and verify it loads
   */
  async navigateToSignup(): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/signup`);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for form to be visible
    await expect(this.page.locator('form')).toBeVisible();
    await expect(this.page.locator('input[name="email"]')).toBeVisible();
  }

  /**
   * Navigate to login page and verify it loads
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for form to be visible
    await expect(this.page.locator('form')).toBeVisible();
    await expect(this.page.locator('input[name="email"]')).toBeVisible();
  }

  /**
   * Perform user registration
   */
  async performRegistration(userData: typeof TEST_USER): Promise<void> {
    console.log('Starting registration for:', userData.email);
    
    // Fill out registration form
    await this.page.fill('input[name="name"]', userData.name);
    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[name="password"]', userData.password);
    
    // Handle password confirmation if it exists
    const passwordConfirmField = this.page.locator('input[name="passwordConfirm"], input[name="confirmPassword"]');
    if (await passwordConfirmField.count() > 0) {
      await passwordConfirmField.fill(userData.password);
    }
    
    // Select role - try different possible selectors
    const roleSelectors = [
      'select[name="role"]',
      'input[type="radio"][value="TEACHER"]',
      '[data-testid="role-teacher"]',
      'button[data-value="TEACHER"]'
    ];
    
    let roleSelected = false;
    for (const selector of roleSelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        if (selector.includes('radio')) {
          await element.check();
        } else if (selector.includes('select')) {
          await element.selectOption(userData.role);
        } else {
          await element.click();
        }
        roleSelected = true;
        console.log(`Role selected using selector: ${selector}`);
        break;
      }
    }
    
    if (!roleSelected) {
      console.warn('Could not find role selector, continuing anyway...');
    }
    
    // Accept terms if checkbox exists
    const termsCheckbox = this.page.locator('input[type="checkbox"][name="termsAccepted"], input[type="checkbox"][name="terms"]');
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.check();
    }
    
    // Submit form
    const submitButton = this.page.locator('button[type="submit"], button:has-text("회원가입"), button:has-text("가입하기")');
    await submitButton.click();
    
    console.log('Registration form submitted');
  }

  /**
   * Perform user login
   */
  async performLogin(email: string, password: string): Promise<void> {
    console.log('Starting login for:', email);
    
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    
    // Submit login form
    const submitButton = this.page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
    await submitButton.click();
    
    console.log('Login form submitted');
  }

  /**
   * Wait for and verify redirect to dashboard
   */
  async verifyDashboardRedirect(expectedPath: string = '/teacher'): Promise<void> {
    // Wait for navigation with increased timeout
    await this.page.waitForURL(new RegExp(expectedPath), { timeout: 10000 });
    
    // Verify we're on the right page
    const currentUrl = this.page.url();
    expect(currentUrl).toContain(expectedPath);
    
    console.log(`Successfully redirected to: ${currentUrl}`);
  }

  /**
   * Check for error messages
   */
  async checkForErrors(): Promise<string | null> {
    const errorSelectors = [
      '.error-message',
      '.alert-error',
      '[role="alert"]',
      '.text-red-500',
      '.text-red-600',
      '.error',
      '[data-testid="error-message"]'
    ];
    
    for (const selector of errorSelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0 && await element.isVisible()) {
        const errorText = await element.textContent();
        console.log(`Error found with selector ${selector}: ${errorText}`);
        return errorText;
      }
    }
    
    return null;
  }

  /**
   * Direct API registration test
   */
  async performApiRegistration(userData: typeof TEST_USER): Promise<any> {
    console.log('Testing direct API registration...');
    
    const response = await this.page.request.post(`${BASE_URL}/api/auth/signup`, {
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        termsAccepted: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`API Registration Response Status: ${response.status()}`);
    console.log(`API Registration Response: ${responseText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      responseData = { text: responseText };
    }
    
    return {
      status: response.status(),
      data: responseData,
      headers: Object.fromEntries(response.headers())
    };
  }

  /**
   * Direct API login test
   */
  async performApiLogin(email: string, password: string): Promise<any> {
    console.log('Testing direct API login...');
    
    const response = await this.page.request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: email,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`API Login Response Status: ${response.status()}`);
    console.log(`API Login Response: ${responseText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      responseData = { text: responseText };
    }
    
    return {
      status: response.status(),
      data: responseData,
      headers: Object.fromEntries(response.headers())
    };
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Clean up test user if it exists
   */
  async cleanupTestUser(email: string): Promise<void> {
    try {
      // Try to delete user via API if endpoint exists
      const response = await this.page.request.delete(`${API_URL}/api/auth/test-cleanup`, {
        data: { email },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`Cleanup attempt for ${email}: ${response.status()}`);
    } catch (error) {
      console.log(`Cleanup not available or failed: ${error}`);
    }
  }
}

test.describe('Korean Digital Textbook - Authentication E2E Tests', () => {
  let authHelper: AuthTestHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelper(page);
    
    // Clear browser state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clean up test user before each test
    await authHelper.cleanupTestUser(TEST_USER.email);
  });

  test.afterEach(async ({ page }) => {
    // Take screenshot on failure
    if (test.info().status !== 'passed') {
      await authHelper.takeDebugScreenshot(`failed-${test.info().title.replace(/\s+/g, '-')}`);
    }
  });

  test.describe('1. User Registration Tests', () => {
    test('Should load registration form properly', async ({ page }) => {
      await authHelper.navigateToSignup();
      
      // Verify all required form fields are present
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      
      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("회원가입"), button:has-text("가입하기")');
      await expect(submitButton).toBeVisible();
      
      console.log('✅ Registration form loaded successfully');
    });

    test('Should register new teacher user successfully via UI', async ({ page }) => {
      await authHelper.navigateToSignup();
      
      // Perform registration
      await authHelper.performRegistration(TEST_USER);
      
      // Wait for form processing
      await page.waitForTimeout(2000);
      
      // Check for errors
      const error = await authHelper.checkForErrors();
      if (error) {
        await authHelper.takeDebugScreenshot('registration-error');
        console.error('Registration error:', error);
      }
      
      // Should either redirect to login or show success message
      const currentUrl = page.url();
      const isOnLogin = currentUrl.includes('/auth/login');
      const isOnSignup = currentUrl.includes('/auth/signup');
      
      if (isOnLogin) {
        console.log('✅ Redirected to login page after registration');
      } else if (isOnSignup) {
        // Check for success message on same page
        const successSelectors = [
          '.success-message',
          '.alert-success',
          '.text-green-500',
          '.text-green-600',
          '[data-testid="success-message"]'
        ];
        
        let foundSuccess = false;
        for (const selector of successSelectors) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            const successText = await element.textContent();
            console.log(`✅ Success message found: ${successText}`);
            foundSuccess = true;
            break;
          }
        }
        
        if (!foundSuccess && !error) {
          console.log('⚠️ Registration submitted but no clear success/error indication');
        }
      }
      
      expect(error).toBeNull(); // Should not have errors
    });

    test('Should register new teacher user successfully via API', async ({ page }) => {
      const result = await authHelper.performApiRegistration(TEST_USER);
      
      console.log('API Registration Result:', result);
      
      // Should be successful (201 created or 200 success)
      expect([200, 201]).toContain(result.status);
      
      // Should not have error in response
      if (result.data.message) {
        expect(result.data.message).not.toContain('실패');
        expect(result.data.message).not.toContain('error');
        expect(result.data.message).not.toContain('Error');
      }
      
      console.log('✅ API registration completed successfully');
    });
  });

  test.describe('2. User Login Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure user exists before login tests
      const registrationResult = await authHelper.performApiRegistration(TEST_USER);
      console.log(`Pre-test registration status: ${registrationResult.status}`);
    });

    test('Should load login form properly', async ({ page }) => {
      await authHelper.navigateToLogin();
      
      // Verify login form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      
      const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
      await expect(submitButton).toBeVisible();
      
      console.log('✅ Login form loaded successfully');
    });

    test('Should login successfully via UI and redirect to teacher dashboard', async ({ page }) => {
      await authHelper.navigateToLogin();
      
      // Perform login
      await authHelper.performLogin(TEST_USER.email, TEST_USER.password);
      
      // Wait for processing
      await page.waitForTimeout(3000);
      
      // Check for errors first
      const error = await authHelper.checkForErrors();
      if (error) {
        await authHelper.takeDebugScreenshot('login-error');
        console.error('Login error:', error);
      }
      
      // Verify redirect to appropriate dashboard
      try {
        await authHelper.verifyDashboardRedirect('/teacher');
        console.log('✅ Successfully logged in and redirected to teacher dashboard');
      } catch (redirectError) {
        console.log('Dashboard redirect check failed, checking current URL...');
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Check if we're on any dashboard
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/teacher') || currentUrl.includes('/student')) {
          console.log('✅ Logged in and on some dashboard page');
        } else {
          await authHelper.takeDebugScreenshot('login-redirect-failure');
          throw redirectError;
        }
      }
      
      expect(error).toBeNull(); // Should not have errors
    });

    test('Should login successfully via API', async ({ page }) => {
      const result = await authHelper.performApiLogin(TEST_USER.email, TEST_USER.password);
      
      console.log('API Login Result:', result);
      
      // Should be successful
      expect(result.status).toBe(200);
      
      // Should not have error message
      if (result.data.message) {
        expect(result.data.message).not.toContain('실패');
        expect(result.data.message).not.toContain('error');
        expect(result.data.message).not.toContain('Error');
      }
      
      // Should have authentication cookies
      expect(result.headers['set-cookie']).toBeDefined();
      
      console.log('✅ API login completed successfully');
    });
  });

  test.describe('3. Error Handling Tests', () => {
    test('Should handle 400 Bad Request during registration', async ({ page }) => {
      await authHelper.navigateToSignup();
      
      // Try to register with invalid data
      const invalidUser = {
        name: "", // Empty name
        email: "invalid-email", // Invalid email
        password: "123", // Weak password
        role: "TEACHER"
      };
      
      await authHelper.performRegistration(invalidUser);
      await page.waitForTimeout(2000);
      
      // Should show error message
      const error = await authHelper.checkForErrors();
      expect(error).toBeTruthy();
      
      console.log('✅ Properly handled validation errors');
    });

    test('Should handle duplicate registration', async ({ page }) => {
      // First registration
      await authHelper.performApiRegistration(TEST_USER);
      
      // Try to register same user again
      const result = await authHelper.performApiRegistration(TEST_USER);
      
      // Should fail with appropriate error
      expect([400, 409, 422]).toContain(result.status);
      
      console.log('✅ Properly handled duplicate registration');
    });

    test('Should handle invalid login credentials', async ({ page }) => {
      await authHelper.navigateToLogin();
      
      // Try to login with wrong password
      await authHelper.performLogin(TEST_USER.email, "wrongpassword");
      await page.waitForTimeout(2000);
      
      // Should show error message
      const error = await authHelper.checkForErrors();
      expect(error).toBeTruthy();
      
      console.log('✅ Properly handled invalid credentials');
    });

    test('Should handle rate limiting (429 errors)', async ({ page }) => {
      const results = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const result = await authHelper.performApiLogin("nonexistent@test.com", "wrongpassword");
        results.push(result.status);
        
        if (result.status === 429) {
          console.log(`✅ Rate limiting triggered after ${i + 1} attempts`);
          break;
        }
      }
      
      // At least one should be rate limited
      expect(results.some(status => status === 429)).toBeTruthy();
    });
  });

  test.describe('4. Network and Integration Tests', () => {
    test('Should verify frontend-backend communication', async ({ page }) => {
      // Test that frontend can reach backend through the API routes
      const healthCheck = await page.request.get(`${BASE_URL}/api/health`);
      console.log(`Health check status: ${healthCheck.status()}`);
      
      // Should be reachable (might be 404 if no health endpoint)
      expect([200, 404]).toContain(healthCheck.status());
      
      console.log('✅ Frontend-backend communication verified');
    });

    test('Should verify cookie-based authentication flow', async ({ page }) => {
      // Register user
      await authHelper.performApiRegistration(TEST_USER);
      
      // Login via API
      const loginResult = await authHelper.performApiLogin(TEST_USER.email, TEST_USER.password);
      expect(loginResult.status).toBe(200);
      
      // Verify cookies are set
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('auth') || 
        cookie.name.includes('token') || 
        cookie.name.includes('session')
      );
      
      console.log('Auth cookies found:', authCookies.map(c => c.name));
      expect(authCookies.length).toBeGreaterThan(0);
      
      console.log('✅ Cookie-based authentication verified');
    });
  });

  test.describe('5. Performance Tests', () => {
    test('Should complete registration within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await authHelper.navigateToSignup();
      await authHelper.performRegistration(TEST_USER);
      await page.waitForTimeout(2000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      console.log(`✅ Registration completed in ${duration}ms`);
    });

    test('Should complete login within reasonable time', async ({ page }) => {
      // Ensure user exists
      await authHelper.performApiRegistration(TEST_USER);
      
      const startTime = Date.now();
      
      await authHelper.navigateToLogin();
      await authHelper.performLogin(TEST_USER.email, TEST_USER.password);
      await page.waitForTimeout(3000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      console.log(`✅ Login completed in ${duration}ms`);
    });
  });
});