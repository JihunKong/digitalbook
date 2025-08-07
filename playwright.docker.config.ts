import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration optimized for Docker environment
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: parseInt(process.env.RETRY_COUNT || '2'),
  workers: parseInt(process.env.WORKERS || '4'),
  
  // Timeouts
  timeout: parseInt(process.env.TEST_TIMEOUT || '60000'),
  expect: {
    timeout: 10000,
  },
  
  // Reporting
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report',
      open: 'never' // Don't try to open browser in container
    }],
    ['json', { 
      outputFile: path.join(
        process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report',
        'results.json'
      )
    }],
    ['junit', { 
      outputFile: path.join(
        process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report',
        'junit.xml'
      )
    }]
  ],
  
  // Output directory for test artifacts
  outputDir: process.env.PLAYWRIGHT_ARTIFACTS_PATH || 'test-results',
  
  // Global test settings
  use: {
    // Base URL from environment
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Artifact collection
    trace: 'on-first-retry',
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    video: {
      mode: 'on-first-retry',
      size: { width: 1280, height: 720 }
    },
    
    // Browser context options
    contextOptions: {
      ignoreHTTPSErrors: true,
      // Set viewport for consistent testing
      viewport: { width: 1280, height: 720 },
      // Locale settings for Korean platform
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      // Permission settings
      permissions: ['clipboard-read', 'clipboard-write'],
    },
    
    // Action timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Custom headers for API requests
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  },
  
  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome-specific settings for container
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  
  // Global setup and teardown
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',
  
  // Web server configuration (disabled in Docker as services run separately)
  webServer: undefined,
  
  // Preserve test artifacts
  preserveOutput: 'always',
  
  // Shard configuration for distributed testing
  shard: process.env.SHARD ? {
    current: parseInt(process.env.SHARD.split('/')[0]),
    total: parseInt(process.env.SHARD.split('/')[1])
  } : undefined,
});