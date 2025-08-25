import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const startTime = Date.now();
  
  // Environment validation
  validateEnvironment();
  
  // Create artifact directories
  createArtifactDirectories();
  
  // Wait for services to be ready
  await waitForServices(config);
  
  // Seed test data if needed
  await seedTestData(config);
  
  // Warm up the application
  await warmupApplication(config);
  
  // Store auth state for reuse
  await setupAuthState(config);
  
  const duration = Date.now() - startTime;
  console.log(`✅ Global setup completed in ${duration}ms`);
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'BASE_URL',
    'API_URL',
    'TEST_ADMIN_EMAIL',
    'TEST_ADMIN_PASSWORD',
    'TEST_TEACHER_EMAIL',
    'TEST_TEACHER_PASSWORD',
    'TEST_STUDENT_EMAIL',
    'TEST_STUDENT_PASSWORD',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('   Using default values from TEST_ACCOUNTS.md');
    
    // Set defaults
    process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    process.env.API_URL = process.env.API_URL || 'http://localhost:4000';
    process.env.TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
    process.env.TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123!@#';
    process.env.TEST_TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacher1@test.com';
    process.env.TEST_TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || 'Teacher123!';
    process.env.TEST_STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'student1@test.com';
    process.env.TEST_STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Student123!';
  }
}

/**
 * Create directories for test artifacts
 */
function createArtifactDirectories() {
  const dirs = [
    process.env.PLAYWRIGHT_ARTIFACTS_PATH || 'test-results',
    process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report',
    process.env.PLAYWRIGHT_TRACE_DIR || 'trace',
    process.env.PLAYWRIGHT_VIDEO_DIR || 'videos',
    process.env.PLAYWRIGHT_SCREENSHOT_DIR || 'screenshots',
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Wait for all services to be ready
 */
async function waitForServices(config: FullConfig) {
  console.log('⏳ Waiting for services to be ready...');
  
  const baseURL = config.use?.baseURL || process.env.BASE_URL;
  const apiURL = process.env.API_URL;
  
  const maxRetries = 10;
  const retryDelay = 1000;
  
  // Check frontend
  await waitForService(baseURL!, 'Frontend', maxRetries, retryDelay);
  
  // Check backend
  await waitForService(`${apiURL}/api/health`, 'Backend API', maxRetries, retryDelay);
}

/**
 * Wait for a specific service to be ready using browser context
 */
async function waitForService(
  url: string,
  serviceName: string,
  maxRetries: number,
  retryDelay: number
) {
  console.log(`   Checking ${serviceName} at ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  try {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await page.request.get(url);
        
        if (response.ok()) {
          console.log(`   ✅ ${serviceName} is ready`);
          return;
        }
        
        console.log(`   ⏳ ${serviceName} returned ${response.status()}, retrying... (${i + 1}/${maxRetries})`);
      } catch (error) {
        console.log(`   ⏳ ${serviceName} not ready, retrying... (${i + 1}/${maxRetries})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    throw new Error(`${serviceName} failed to start after ${maxRetries} retries`);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Seed test data
 */
async function seedTestData(config: FullConfig) {
  console.log('🌱 Checking test data...');
  console.log('   ⏭️  Skipping automatic seeding, assuming test data exists');
  console.log('   💡 Tests will create data as needed');
}

/**
 * Warm up the application by making initial requests
 */
async function warmupApplication(config: FullConfig) {
  console.log('🔥 Warming up application...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    // Load main pages to warm up Next.js
    const baseURL = config.use?.baseURL || process.env.BASE_URL;
    const pages = [
      '/',
      '/auth/login',
      '/auth/register',
      '/guest',
    ];
    
    for (const path of pages) {
      await page.goto(`${baseURL}${path}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      console.log(`   ✅ Warmed up ${path}`);
    }
    
    // Make API calls to warm up backend
    const apiURL = process.env.API_URL;
    const apiEndpoints = [
      '/api/health',
      '/api/csrf/token',
    ];
    
    for (const endpoint of apiEndpoints) {
      await page.request.get(`${apiURL}${endpoint}`);
      console.log(`   ✅ Warmed up API ${endpoint}`);
    }
  } catch (error) {
    console.log('   ⚠️  Warmup failed:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup authentication states for different user roles
 */
async function setupAuthState(config: FullConfig) {
  console.log('🔐 Setting up authentication states...');
  console.log('   ⏭️  Skipping pre-auth setup, tests will authenticate as needed');
}

export default globalSetup;