import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for Korean Digital Textbook Platform
 * Optimized for authentication testing with comprehensive debugging
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Global test settings */
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  
  /* Run tests in files in parallel */
  fullyParallel: !process.env.CI, // Sequential in CI for stability
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry configuration */
  retries: process.env.CI ? 3 : 1, // More retries in CI
  
  /* Worker configuration */
  workers: process.env.CI ? 2 : undefined, // Limited workers in CI
  
  /* Enhanced reporter configuration */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  /* Global test configuration */
  use: {
    /* Base URL for navigation */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Enhanced tracing for debugging */
    trace: 'retain-on-failure',
    
    /* Video recording for failed tests */
    video: 'retain-on-failure',
    
    /* Screenshot settings */
    screenshot: 'only-on-failure',
    
    /* Browser settings */
    headless: process.env.CI ? true : false, // Show browser in development
    viewport: { width: 1280, height: 720 },
    
    /* Network settings */
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
    },
    
    /* Timeouts */
    actionTimeout: 15 * 1000,      // 15 seconds for actions
    navigationTimeout: 30 * 1000,  // 30 seconds for navigation
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Locale setting for Korean content */
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },

  /* Multiple browser configurations */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      },
    },
    
    // Mobile testing for responsive design
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    
    // Firefox for cross-browser testing
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
  ],

  /* Output directories */
  outputDir: 'test-results',
  
  /* Global setup and teardown */
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',

  /* Web server configuration for local testing - disabled since we handle this in test runner */
  // webServer: process.env.CI ? undefined : [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   },
  //   {
  //     command: 'cd backend && npm run dev',
  //     url: 'http://localhost:4000/api/health',
  //     reuseExistingServer: true,
  //     timeout: 120 * 1000,
  //   }
  // ]
});