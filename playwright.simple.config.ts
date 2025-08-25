import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright configuration for focused authentication testing
 * Minimal setup to avoid complex global setup issues
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Test timeouts */
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  
  /* Run tests sequentially for debugging */
  fullyParallel: false,
  workers: 1,
  
  /* Retry settings */
  retries: 1,
  
  /* Reporters */
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never' 
    }]
  ],
  
  /* Test configuration */
  use: {
    /* Base URL for tests */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Debug settings */
    headless: false, // Show browser for debugging
    viewport: { width: 1280, height: 720 },
    
    /* Capture settings */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    /* Timeouts */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* Locale */
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    
    /* Accept self-signed certificates */
    ignoreHTTPSErrors: true,
  },

  /* Browser configuration */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        }
      },
    },
  ],

  /* Output directory */
  outputDir: 'test-results',
});