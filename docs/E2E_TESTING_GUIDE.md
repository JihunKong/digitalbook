# E2E Testing Guide - Unified Authentication System

## 📋 Overview

This guide provides comprehensive instructions for running and maintaining E2E tests for the Korean Digital Textbook Platform's unified authentication system.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- At least 8GB free RAM
- 10GB free disk space

### Running Tests Locally

```bash
# Run all E2E tests
./run-e2e-tests.sh

# Run specific test suite
./run-e2e-tests.sh --specific auth-unified.spec.ts

# Run in debug mode (headed browser)
./run-e2e-tests.sh --debug

# Run in CI mode
./run-e2e-tests.sh --ci
```

## 🏗️ Architecture

### Docker Services

```yaml
Services:
├── postgres-test     # PostgreSQL database (port 5433)
├── redis-test        # Redis cache (port 6380)
├── backend-test      # Express API server (port 4001)
├── frontend-test     # Next.js application (port 3001)
├── playwright-test   # Test runner container
├── seeder-test       # Database seeder (runs once)
└── report-server     # Nginx for test reports (port 8080)
```

### Test Structure

```
tests/e2e/
├── auth-unified.spec.ts    # Main authentication tests
├── setup/
│   ├── global-setup.ts     # Pre-test setup
│   └── global-teardown.ts  # Post-test cleanup
└── helpers/
    └── auth.helper.ts       # Authentication utilities
```

## 🧪 Test Scenarios

### 1. Role-based Registration & Login
- Student registration with profile data
- Teacher registration with school information
- Admin login with existing account
- Email validation and duplicate prevention

### 2. Dashboard Access Control
- Role-specific dashboard routing
- Unauthorized access prevention
- Cross-role access attempts
- Protected route validation

### 3. Token Management
- Access token automatic refresh
- Refresh token expiration handling
- Multi-device session management
- Session invalidation

### 4. CSRF Protection
- Token validation on POST requests
- Cross-session token prevention
- Missing token rejection
- Token expiration handling

### 5. Guest Access
- Access code validation
- Time-limited sessions
- Feature restrictions
- Session expiration

### 6. Security Features
- Password policy enforcement
- Rate limiting on login attempts
- XSS attack prevention
- SQL injection protection

## 🐳 Docker Configuration

### Memory Optimization

```dockerfile
# Dockerfile.e2e optimizations
- Multi-stage builds
- Layer caching
- Non-root user execution
- Resource limits
```

### Performance Tuning

```yaml
# docker-compose.e2e.yml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '2.0'
    reservations:
      memory: 1G
      cpus: '1.0'
```

## 🔍 Debugging

### View Container Logs

```bash
# All services
docker-compose -f docker-compose.e2e.yml logs

# Specific service
docker-compose -f docker-compose.e2e.yml logs backend-test

# Follow logs
docker-compose -f docker-compose.e2e.yml logs -f playwright-test
```

### Debug Mode

```bash
# Run with Playwright Inspector
PWDEBUG=1 ./run-e2e-tests.sh --debug

# Enable verbose logging
DEBUG=pw:api ./run-e2e-tests.sh
```

### Common Issues & Solutions

#### 1. Port Conflicts

**Error**: "bind: address already in use"

**Solution**:
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
# Or use different ports
export FRONTEND_PORT=3002
export BACKEND_PORT=4002
```

#### 2. Memory Issues

**Error**: "Container killed due to memory limit"

**Solution**:
```bash
# Increase Docker memory limit
# Docker Desktop > Preferences > Resources > Memory: 8GB

# Reduce worker count
WORKERS=2 ./run-e2e-tests.sh
```

#### 3. Browser Launch Failures

**Error**: "Failed to launch browser"

**Solution**:
```bash
# Rebuild with fresh browsers
docker-compose -f docker-compose.e2e.yml build --no-cache playwright-test

# Use specific browser
npx playwright test --project=chromium
```

#### 4. Test Timeouts

**Error**: "Test timeout of 60000ms exceeded"

**Solution**:
```bash
# Increase timeout
TEST_TIMEOUT=120000 ./run-e2e-tests.sh

# Or in test file
test.setTimeout(120000);
```

#### 5. Database Connection Issues

**Error**: "Connection to database failed"

**Solution**:
```bash
# Check database health
docker-compose -f docker-compose.e2e.yml exec postgres-test pg_isready

# Reset database
docker-compose -f docker-compose.e2e.yml down -v
docker-compose -f docker-compose.e2e.yml up -d postgres-test
```

## 📊 Test Reports

### Viewing Reports

```bash
# After tests complete
open http://localhost:8080  # Report server

# Or manually open
npx playwright show-report playwright-report
```

### Report Contents

- **HTML Report**: Interactive test results
- **JSON Report**: Machine-readable results
- **JUnit XML**: CI integration
- **Screenshots**: Failure captures
- **Videos**: Test execution recordings
- **Traces**: Playwright trace viewer files

## 🔄 CI/CD Integration

### GitHub Actions

The workflow automatically:
1. Builds Docker images with caching
2. Runs tests in parallel (4 shards × 3 browsers)
3. Merges reports from all shards
4. Uploads artifacts
5. Deploys reports to GitHub Pages

### Environment Variables

```yaml
# Required secrets in GitHub
OPENAI_API_KEY: Your OpenAI API key

# Automatic variables
CI: true
GITHUB_TOKEN: Provided by GitHub
```

## 📈 Performance Optimization

### Parallel Execution

```typescript
// playwright.config.ts
workers: 4,  // Parallel workers
fullyParallel: true,  // Run tests in parallel
```

### Test Sharding

```bash
# Run specific shard
SHARD=1/4 npx playwright test

# In CI
matrix:
  shard: [1/4, 2/4, 3/4, 4/4]
```

### Container Optimization

- Use specific image versions (avoid `:latest`)
- Enable BuildKit caching
- Implement health checks
- Set resource limits

## 🛠️ Maintenance

### Updating Test Data

```bash
# Edit test accounts
vim TEST_ACCOUNTS.md

# Update seed script
vim backend/src/utils/testSeed.ts

# Reseed database
docker-compose -f docker-compose.e2e.yml run --rm seeder-test
```

### Updating Dependencies

```bash
# Update Playwright
npm update @playwright/test
npx playwright install

# Rebuild Docker images
docker-compose -f docker-compose.e2e.yml build --no-cache
```

### Cleaning Up

```bash
# Stop all services and remove volumes
./run-e2e-tests.sh --cleanup

# Remove all test artifacts
rm -rf playwright-report test-results trace videos screenshots

# Prune Docker system
docker system prune -af
```

## 📝 Best Practices

### Test Writing

1. **Use Page Object Model**
   ```typescript
   class LoginPage {
     constructor(private page: Page) {}
     async login(email: string, password: string) {...}
   }
   ```

2. **Implement Retry Logic**
   ```typescript
   await expect(async () => {
     await page.click('button');
   }).toPass({ timeout: 30000 });
   ```

3. **Clean State Between Tests**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.context().clearCookies();
   });
   ```

4. **Use Data Attributes**
   ```html
   <button data-testid="submit-button">Submit</button>
   ```

### Docker Best Practices

1. **Use .dockerignore**
2. **Implement health checks**
3. **Set resource limits**
4. **Use non-root users**
5. **Enable BuildKit**

## 🔗 Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [TEST_ACCOUNTS.md](../TEST_ACCOUNTS.md)
- [CLAUDE.md](../CLAUDE.md)

## 📞 Support

For issues or questions:
1. Check this troubleshooting guide
2. Review test logs in `playwright-report/`
3. Check Docker logs with `docker-compose logs`
4. Create an issue with reproduction steps

---

Last Updated: 2025-08-07