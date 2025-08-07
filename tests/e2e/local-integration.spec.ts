import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_TEACHER = {
  name: '김선생',
  email: `teacher_${Date.now()}@test.local`,
  password: 'Test1234!@',
  subject: '국어'
};

const TEST_STUDENT = {
  name: '이학생',
  email: `student_${Date.now()}@test.local`,
  password: 'Test1234!@',
  grade: '중학교 1학년'
};

const TEST_CLASS = {
  name: '국어 1반',
  description: '중학교 1학년 국어 수업',
  subject: '국어',
  grade: '중학교 1학년'
};

const TEST_TEXTBOOK = {
  title: '중1 국어 교과서',
  subject: '국어',
  grade: '중학교 1학년',
  description: 'AI 기반 디지털 국어 교과서'
};

test.describe('Digital Textbook Platform - Local Integration Tests', () => {
  test.setTimeout(120000); // 2 minutes timeout for each test

  let teacherPage: Page;
  let studentPage: Page;
  let classCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create separate contexts for teacher and student
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext();
    
    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();
  });

  test('1. Teacher Registration and Login', async () => {
    // Navigate to teacher signup
    await teacherPage.goto('http://localhost:4545/auth/signup');
    
    // Fill registration form
    await teacherPage.fill('input[name="name"]', TEST_TEACHER.name);
    await teacherPage.fill('input[name="email"]', TEST_TEACHER.email);
    await teacherPage.fill('input[name="password"]', TEST_TEACHER.password);
    await teacherPage.fill('input[name="confirmPassword"]', TEST_TEACHER.password);
    await teacherPage.selectOption('select[name="role"]', 'teacher');
    await teacherPage.fill('input[name="subject"]', TEST_TEACHER.subject);
    
    // Submit registration
    await teacherPage.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await teacherPage.waitForURL('**/teacher/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(teacherPage.locator('h1')).toContainText(['대시보드', 'Dashboard']);
    console.log('✓ Teacher registration and login successful');
  });

  test('2. Teacher Creates a Class with 6-digit Code', async () => {
    // Navigate to class creation
    await teacherPage.goto('http://localhost:4545/teacher/dashboard');
    await teacherPage.click('button:has-text("새 수업 만들기"), button:has-text("Create Class")');
    
    // Fill class creation form
    await teacherPage.fill('input[name="className"]', TEST_CLASS.name);
    await teacherPage.fill('textarea[name="description"]', TEST_CLASS.description);
    await teacherPage.selectOption('select[name="subject"]', TEST_CLASS.subject);
    await teacherPage.selectOption('select[name="grade"]', TEST_CLASS.grade);
    
    // Submit class creation
    await teacherPage.click('button:has-text("수업 생성"), button:has-text("Create")');
    
    // Wait for class code to be displayed
    await teacherPage.waitForSelector('.class-code, [data-testid="class-code"]', { timeout: 10000 });
    
    // Extract the 6-digit code
    const codeElement = await teacherPage.locator('.class-code, [data-testid="class-code"]').first();
    classCode = await codeElement.textContent() || '';
    classCode = classCode.replace(/[^0-9]/g, ''); // Extract only digits
    
    expect(classCode).toMatch(/^\d{6}$/);
    console.log(`✓ Class created with code: ${classCode}`);
  });

  test('3. Teacher Creates and Publishes a Textbook', async () => {
    // Navigate to textbook creation
    await teacherPage.goto('http://localhost:4545/teacher/textbooks/create');
    
    // Fill textbook creation form
    await teacherPage.fill('input[name="title"]', TEST_TEXTBOOK.title);
    await teacherPage.selectOption('select[name="subject"]', TEST_TEXTBOOK.subject);
    await teacherPage.selectOption('select[name="grade"]', TEST_TEXTBOOK.grade);
    await teacherPage.fill('textarea[name="description"]', TEST_TEXTBOOK.description);
    
    // Add a chapter
    await teacherPage.click('button:has-text("챕터 추가"), button:has-text("Add Chapter")');
    await teacherPage.fill('input[name="chapterTitle"]', '1. 시의 이해');
    await teacherPage.fill('textarea[name="chapterContent"]', '시는 감정과 생각을 함축적으로 표현하는 문학 장르입니다.');
    
    // Generate AI content (simulation)
    await teacherPage.click('button:has-text("AI 콘텐츠 생성"), button:has-text("Generate with AI")');
    await teacherPage.waitForTimeout(2000); // Wait for AI generation simulation
    
    // Save textbook
    await teacherPage.click('button:has-text("저장"), button:has-text("Save")');
    
    // Toggle public visibility
    await teacherPage.click('input[type="checkbox"][name="isPublic"], button:has-text("공개 설정")');
    
    await expect(teacherPage.locator('.success-message, [role="alert"]')).toContainText(['저장', 'saved', 'Success']);
    console.log('✓ Textbook created and published');
  });

  test('4. Student Registration and Join Class', async () => {
    // Navigate to student signup
    await studentPage.goto('http://localhost:4545/auth/signup');
    
    // Fill registration form
    await studentPage.fill('input[name="name"]', TEST_STUDENT.name);
    await studentPage.fill('input[name="email"]', TEST_STUDENT.email);
    await studentPage.fill('input[name="password"]', TEST_STUDENT.password);
    await studentPage.fill('input[name="confirmPassword"]', TEST_STUDENT.password);
    await studentPage.selectOption('select[name="role"]', 'student');
    await studentPage.selectOption('select[name="grade"]', TEST_STUDENT.grade);
    
    // Submit registration
    await studentPage.click('button[type="submit"]');
    
    // Wait for redirect to student dashboard
    await studentPage.waitForURL('**/student/dashboard', { timeout: 10000 });
    
    // Navigate to join class
    await studentPage.goto('http://localhost:4545/student/join');
    
    // Enter the 6-digit code
    await studentPage.fill('input[name="classCode"], input[placeholder*="6자리"]', classCode);
    await studentPage.click('button:has-text("참여"), button:has-text("Join")');
    
    // Verify joined class
    await expect(studentPage.locator('.class-name, [data-testid="class-name"]')).toContainText(TEST_CLASS.name);
    console.log(`✓ Student joined class with code: ${classCode}`);
  });

  test('5. Document Upload Simulation (PDF)', async () => {
    // Navigate to multimedia upload
    await teacherPage.goto('http://localhost:4545/teacher/multimedia');
    
    // Create a test PDF file buffer
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF Document) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000274 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n365\n%%EOF');
    
    // Set up file chooser before clicking upload
    const fileChooserPromise = teacherPage.waitForEvent('filechooser');
    await teacherPage.click('input[type="file"], button:has-text("파일 선택")');
    const fileChooser = await fileChooserPromise;
    
    // Create temporary file and upload
    await fileChooser.setFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent
    });
    
    // Click upload button
    await teacherPage.click('button:has-text("업로드"), button:has-text("Upload")');
    
    // Wait for upload success
    await expect(teacherPage.locator('.upload-success, [role="alert"]')).toContainText(['성공', 'Success', 'uploaded']);
    console.log('✓ PDF document uploaded successfully');
  });

  test('6. AI Chatbot Interaction', async () => {
    // Student navigates to AI tutor
    await studentPage.goto('http://localhost:4545/student/ai-tutor');
    
    // Wait for chat interface to load
    await studentPage.waitForSelector('.chat-input, [data-testid="chat-input"]', { timeout: 10000 });
    
    // Send a message to AI
    const testMessage = '시란 무엇인가요?';
    await studentPage.fill('.chat-input, [data-testid="chat-input"]', testMessage);
    await studentPage.click('button:has-text("전송"), button:has-text("Send")');
    
    // Wait for AI response
    await studentPage.waitForSelector('.ai-response, [data-testid="ai-response"]', { timeout: 15000 });
    
    // Verify AI responded
    const aiResponse = await studentPage.locator('.ai-response, [data-testid="ai-response"]').last().textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse?.length).toBeGreaterThan(10);
    console.log('✓ AI chatbot responded successfully');
  });

  test('7. Guest Access to Public Textbooks', async ({ page }) => {
    // Navigate to explore page as guest
    await page.goto('http://localhost:4545/explore');
    
    // Wait for public textbooks to load
    await page.waitForSelector('.textbook-card, [data-testid="textbook-card"]', { timeout: 10000 });
    
    // Click on first public textbook
    await page.click('.textbook-card, [data-testid="textbook-card"]');
    
    // Verify textbook content is visible
    await expect(page.locator('.textbook-content, [data-testid="textbook-content"]')).toBeVisible();
    console.log('✓ Guest can access public textbooks');
  });

  test('8. Real-time Chat in Classroom', async () => {
    // Teacher sends a message
    await teacherPage.goto('http://localhost:4545/teacher/dashboard');
    await teacherPage.click('.class-chat, button:has-text("채팅")');
    
    const teacherMessage = '안녕하세요, 학생 여러분!';
    await teacherPage.fill('.chat-input, [data-testid="chat-input"]', teacherMessage);
    await teacherPage.click('button:has-text("전송"), button:has-text("Send")');
    
    // Student receives the message
    await studentPage.goto('http://localhost:4545/student/classroom');
    await studentPage.waitForTimeout(2000); // Wait for real-time update
    
    // Verify message received
    await expect(studentPage.locator('.chat-message')).toContainText(teacherMessage);
    console.log('✓ Real-time chat working');
  });

  test('9. Assignment Creation and Submission', async () => {
    // Teacher creates assignment
    await teacherPage.goto('http://localhost:4545/teacher/dashboard');
    await teacherPage.click('button:has-text("과제 만들기"), button:has-text("Create Assignment")');
    
    await teacherPage.fill('input[name="title"]', '시 감상문 작성');
    await teacherPage.fill('textarea[name="description"]', '좋아하는 시를 하나 선택하여 감상문을 작성하세요.');
    await teacherPage.fill('input[name="dueDate"]', '2025-12-31');
    
    await teacherPage.click('button:has-text("과제 생성"), button:has-text("Create")');
    
    // Student views and submits assignment
    await studentPage.goto('http://localhost:4545/student/assignments');
    await studentPage.click('.assignment-card:has-text("시 감상문")');
    
    await studentPage.fill('textarea[name="submission"]', '윤동주의 "서시"를 읽고 느낀 점을 작성합니다...');
    await studentPage.click('button:has-text("제출"), button:has-text("Submit")');
    
    await expect(studentPage.locator('.submission-status')).toContainText(['제출', 'Submitted']);
    console.log('✓ Assignment created and submitted');
  });

  test('10. Analytics and Progress Tracking', async () => {
    // Teacher views analytics
    await teacherPage.goto('http://localhost:4545/teacher/analytics');
    
    // Wait for analytics to load
    await teacherPage.waitForSelector('.analytics-chart, [data-testid="analytics-chart"]', { timeout: 10000 });
    
    // Verify analytics data is displayed
    await expect(teacherPage.locator('.student-count, [data-testid="student-count"]')).toBeVisible();
    await expect(teacherPage.locator('.assignment-completion, [data-testid="completion-rate"]')).toBeVisible();
    
    // Student views progress
    await studentPage.goto('http://localhost:4545/student/progress');
    
    // Verify progress data
    await expect(studentPage.locator('.progress-chart, [data-testid="progress-chart"]')).toBeVisible();
    console.log('✓ Analytics and progress tracking working');
  });

  test.afterAll(async () => {
    // Cleanup
    await teacherPage.close();
    await studentPage.close();
  });
});

// Health check test
test('Health Check - All Services Running', async ({ request }) => {
  // Check backend health
  const backendHealth = await request.get('http://localhost:4000/api/health');
  expect(backendHealth.ok()).toBeTruthy();
  
  const healthData = await backendHealth.json();
  expect(healthData.status).toBe('ok');
  expect(healthData.services.database).toBe('connected');
  expect(healthData.services.redis).toBe('connected');
  
  // Check frontend
  const frontendResponse = await request.get('http://localhost:4545');
  expect(frontendResponse.ok()).toBeTruthy();
  
  console.log('✓ All services are healthy');
});