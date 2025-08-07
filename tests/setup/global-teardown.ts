import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  const startTime = Date.now();
  
  // Cleanup test data if needed
  await cleanupTestData();
  
  // Archive test artifacts
  await archiveArtifacts();
  
  // Generate test summary
  await generateTestSummary();
  
  // Cleanup temporary files
  cleanupTempFiles();
  
  const duration = Date.now() - startTime;
  console.log(`✅ Global teardown completed in ${duration}ms`);
  
  // Print final test report location
  printReportInfo();
}

/**
 * Cleanup test data from database
 */
async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...');
  
  const apiURL = process.env.API_URL;
  
  if (process.env.KEEP_TEST_DATA === 'true') {
    console.log('   ⏭️  Skipping cleanup (KEEP_TEST_DATA=true)');
    return;
  }
  
  try {
    // Call cleanup endpoint
    const response = await fetch(`${apiURL}/api/test/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        secret: process.env.TEST_CLEANUP_SECRET || 'test-cleanup-secret-2024',
        keepCoreAccounts: true // Keep the main test accounts
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Cleaned up ${data.deletedCount || 0} test records`);
    } else if (response.status === 404) {
      console.log('   ⏭️  Cleanup endpoint not found, skipping');
    } else {
      console.log('   ⚠️  Cleanup failed:', response.statusText);
    }
  } catch (error) {
    console.log('   ⚠️  Could not cleanup test data:', error);
  }
}

/**
 * Archive test artifacts for later analysis
 */
async function archiveArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  const artifactsPath = process.env.PLAYWRIGHT_ARTIFACTS_PATH || 'test-results';
  const archivePath = path.join(artifactsPath, 'archive');
  
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
  }
  
  // Create timestamp for archive
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Archive categories
  const categories = [
    { name: 'screenshots', pattern: /\.png$/ },
    { name: 'videos', pattern: /\.webm$/ },
    { name: 'traces', pattern: /\.zip$/ },
    { name: 'logs', pattern: /\.log$/ },
  ];
  
  for (const category of categories) {
    const categoryPath = path.join(archivePath, category.name, timestamp);
    let fileCount = 0;
    
    // Find and move files
    if (fs.existsSync(artifactsPath)) {
      const files = fs.readdirSync(artifactsPath);
      
      for (const file of files) {
        if (category.pattern.test(file)) {
          if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
          }
          
          const sourcePath = path.join(artifactsPath, file);
          const destPath = path.join(categoryPath, file);
          
          try {
            fs.renameSync(sourcePath, destPath);
            fileCount++;
          } catch (error) {
            // File might be in use, copy instead
            fs.copyFileSync(sourcePath, destPath);
            fileCount++;
          }
        }
      }
    }
    
    if (fileCount > 0) {
      console.log(`   📁 Archived ${fileCount} ${category.name}`);
    }
  }
}

/**
 * Generate test summary report
 */
async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  const reportPath = process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report';
  const resultsFile = path.join(reportPath, 'results.json');
  
  if (!fs.existsSync(resultsFile)) {
    console.log('   ⏭️  No results file found');
    return;
  }
  
  try {
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    
    // Calculate statistics
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      duration: 0,
    };
    
    if (results.suites) {
      results.suites.forEach((suite: any) => {
        suite.specs?.forEach((spec: any) => {
          stats.total++;
          
          if (spec.ok) {
            stats.passed++;
          } else {
            stats.failed++;
          }
          
          spec.tests?.forEach((test: any) => {
            if (test.status === 'skipped') {
              stats.skipped++;
            }
            if (test.status === 'flaky') {
              stats.flaky++;
            }
            stats.duration += test.duration || 0;
          });
        });
      });
    }
    
    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        baseURL: process.env.BASE_URL,
        apiURL: process.env.API_URL,
        ci: process.env.CI === 'true',
        workers: process.env.WORKERS || '4',
      },
      statistics: stats,
      successRate: stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) + '%' : 'N/A',
      averageDuration: stats.total > 0 ? (stats.duration / stats.total).toFixed(0) + 'ms' : 'N/A',
    };
    
    // Save summary
    const summaryFile = path.join(reportPath, 'summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    // Print summary to console
    console.log('\n📈 Test Results Summary:');
    console.log(`   Total Tests: ${stats.total}`);
    console.log(`   ✅ Passed: ${stats.passed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   🔄 Flaky: ${stats.flaky}`);
    console.log(`   Success Rate: ${summary.successRate}`);
    console.log(`   Total Duration: ${(stats.duration / 1000).toFixed(2)}s`);
    console.log(`   Average Duration: ${summary.averageDuration}`);
    
    // Check if tests passed
    if (stats.failed > 0) {
      console.log('\n❌ Tests failed! Check the report for details.');
      process.exitCode = 1;
    } else {
      console.log('\n✅ All tests passed!');
    }
  } catch (error) {
    console.log('   ⚠️  Could not generate summary:', error);
  }
}

/**
 * Cleanup temporary files
 */
function cleanupTempFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempPatterns = [
    'auth-*.json',
    'test-*.tmp',
    '*.log',
  ];
  
  const artifactsPath = process.env.PLAYWRIGHT_ARTIFACTS_PATH || 'test-results';
  
  if (!fs.existsSync(artifactsPath)) {
    return;
  }
  
  const files = fs.readdirSync(artifactsPath);
  let cleanedCount = 0;
  
  for (const file of files) {
    for (const pattern of tempPatterns) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(file)) {
        try {
          fs.unlinkSync(path.join(artifactsPath, file));
          cleanedCount++;
        } catch (error) {
          // File might be in use
        }
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`   🗑️  Cleaned up ${cleanedCount} temporary files`);
  }
}

/**
 * Print information about where to find the test report
 */
function printReportInfo() {
  const reportPath = process.env.PLAYWRIGHT_REPORT_PATH || 'playwright-report';
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST REPORT INFORMATION');
  console.log('='.repeat(60));
  console.log(`📁 Report Location: ${path.resolve(reportPath)}`);
  console.log(`🌐 View in Browser: http://localhost:9323`);
  console.log(`📊 Summary File: ${path.join(reportPath, 'summary.json')}`);
  console.log(`📄 JUnit Report: ${path.join(reportPath, 'junit.xml')}`);
  
  if (process.env.CI === 'true') {
    console.log('\n💡 CI Mode: Reports will be uploaded as artifacts');
  } else {
    console.log('\n💡 To view the HTML report, run:');
    console.log(`   npx playwright show-report ${reportPath}`);
  }
  
  console.log('='.repeat(60) + '\n');
}

export default globalTeardown;