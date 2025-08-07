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
  
  const maxRetries = 30;
  const retryDelay = 2000;
  
  // Check frontend
  await waitForService(baseURL!, 'Frontend', maxRetries, retryDelay);
  
  // Check backend
  await waitForService(`${apiURL}/api/health`, 'Backend API', maxRetries, retryDelay);
}

/**
 * Wait for a specific service to be ready
 */
async function waitForService(
  url: string,
  serviceName: string,
  maxRetries: number,
  retryDelay: number
) {
  console.log(`   Checking ${serviceName} at ${url}`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`   ✅ ${serviceName} is ready`);
        return;
      }
      
      console.log(`   ⏳ ${serviceName} returned ${response.status}, retrying... (${i + 1}/${maxRetries})`);
    } catch (error) {
      console.log(`   ⏳ ${serviceName} not ready, retrying... (${i + 1}/${maxRetries})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error(`${serviceName} failed to start after ${maxRetries} retries`);
}

/**
 * Seed test data
 */
async function seedTestData(config: FullConfig) {
  console.log('🌱 Checking test data...');
  
  const apiURL = process.env.API_URL;
  
  try {
    // Check if test accounts exist
    const response = await fetch(`${apiURL}/api/auth/check-test-accounts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 404) {
      console.log('   Test accounts endpoint not found, assuming data is seeded');
      return;
    }
    
    const data = await response.json();
    
    if (!data.exists) {
      console.log('   Seeding test accounts...');
      
      // Trigger test data seeding
      const seedResponse = await fetch(`${apiURL}/api/test/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secret: process.env.TEST_SEED_SECRET || 'test-seed-secret-2024' 
        })
      });
      
      if (seedResponse.ok) {
        console.log('   ✅ Test data seeded successfully');
      } else {
        console.log('   ⚠️  Failed to seed test data, tests may fail');
      }
    } else {
      console.log('   ✅ Test data already exists');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify test data:', error);
  }
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
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const baseURL = config.use?.baseURL || process.env.BASE_URL;
  const apiURL = process.env.API_URL;
  
  const roles = [
    { 
      name: 'admin',
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!
    },
    { 
      name: 'teacher',
      email: process.env.TEST_TEACHER_EMAIL!,
      password: process.env.TEST_TEACHER_PASSWORD!
    },
    { 
      name: 'student',
      email: process.env.TEST_STUDENT_EMAIL!,
      password: process.env.TEST_STUDENT_PASSWORD!
    },
  ];
  
  for (const role of roles) {
    try {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        baseURL
      });
      
      const page = await context.newPage();
      
      // Get CSRF token
      const csrfResponse = await page.request.get(`${apiURL}/api/csrf/token`);
      const { csrfToken } = await csrfResponse.json();
      
      // Login via API
      const loginResponse = await page.request.post(`${apiURL}/api/auth/login`, {
        data: {
          email: role.email,
          password: role.password
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });
      
      if (loginResponse.ok()) {
        // Save storage state
        const storageStatePath = path.join(
          process.env.PLAYWRIGHT_ARTIFACTS_PATH || 'test-results',
          `auth-${role.name}.json`
        );
        
        await context.storageState({ path: storageStatePath });
        console.log(`   ✅ Saved auth state for ${role.name}`);
      } else {
        console.log(`   ⚠️  Failed to setup auth for ${role.name}`);
      }
      
      await context.close();
    } catch (error) {
      console.log(`   ⚠️  Error setting up auth for ${role.name}:`, error);
    }
  }
  
  await browser.close();
}

export default globalSetup;