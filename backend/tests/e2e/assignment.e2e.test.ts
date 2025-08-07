import request from 'supertest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase, prisma } from '../setup/testDatabase';
import {
  cleanupTestData,
  createTestUser,
  createTestClass,
  createTestAssignment,
} from '../setup/testHelpers';
import assignmentRoutes from '../../src/routes/assignment.routes';
import { authenticateToken } from '../../src/middlewares/auth';
import { errorHandler } from '../../src/middlewares/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/assignments', authenticateToken, assignmentRoutes);
app.use(errorHandler);

describe('Assignment Submission E2E Tests', () => {
  let teacherToken: string;
  let teacherId: string;
  let studentToken: string;
  let studentId: string;
  let testClassId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();

    // Create test users
    const teacher = await createTestUser({
      email: 'teacher@test.com',
      password: 'Pass123!',
      name: 'Test Teacher',
      role: 'TEACHER',
    });
    teacherToken = teacher.token;
    teacherId = teacher.user.id;

    const student = await createTestUser({
      email: 'student@test.com',
      password: 'Pass123!',
      name: 'Test Student',
      role: 'STUDENT',
    });
    studentToken = student.token;
    studentId = student.user.id;

    // Create test class and add student
    const testClass = await createTestClass(teacherId);
    testClassId = testClass.id;

    // Add student to class
    await prisma.classMember.create({
      data: {
        userId: studentId,
        classId: testClassId,
        role: 'STUDENT',
      },
    });
  });

  describe('Assignment Creation and Management', () => {
    it('should complete full assignment lifecycle', async () => {
      // 1. Teacher creates assignment
      const assignmentData = {
        title: '한국 전통 문화에 대한 에세이',
        description: '한국의 전통 문화 중 하나를 선택하여 500자 이상의 에세이를 작성하세요.',
        type: 'WRITING',
        classId: testClassId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        points: 100,
        content: {
          instructions: [
            '전통 문화를 하나 선택하세요 (예: 한복, 김치, 태권도 등)',
            '역사적 배경을 포함하세요',
            '현대 사회에서의 의미를 설명하세요',
          ],
          rubric: {
            content: 40,
            structure: 30,
            grammar: 20,
            creativity: 10,
          },
        },
      };

      const createResponse = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(assignmentData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.title).toBe(assignmentData.title);
      
      const assignmentId = createResponse.body.id;

      // 2. Student views assignment
      const assignmentResponse = await request(app)
        .get(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(assignmentResponse.body.id).toBe(assignmentId);

      // 3. Student submits draft
      const draftSubmission = {
        content: {
          text: '한복은 한국의 전통 의상으로...',
          wordCount: 250,
        },
        status: 'DRAFT',
      };

      const draftResponse = await request(app)
        .post(`/api/assignments/${assignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(draftSubmission)
        .expect(201);

      expect(draftResponse.body.status).toBe('DRAFT');

      const submissionId = draftResponse.body.id;

      // 4. Student updates and submits final version
      const finalSubmission = {
        content: {
          text: '한복은 한국의 전통 의상으로, 수천 년의 역사를 가지고 있습니다. ' +
                '삼국시대부터 시작된 한복은 시대에 따라 다양한 변화를 거쳤으며, ' +
                '각 시대의 문화와 미의식을 반영하고 있습니다. 현대에 이르러서는 ' +
                '일상복으로서의 기능은 줄어들었지만, 명절이나 특별한 행사에서 ' +
                '여전히 중요한 역할을 하고 있습니다. 또한 최근에는 현대적으로 ' +
                '재해석된 생활한복이 인기를 얻으며 전통과 현대의 조화를 보여주고 있습니다.',
          wordCount: 523,
        },
        status: 'SUBMITTED',
      };

      await request(app)
        .put(`/api/assignments/${assignmentId}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(finalSubmission)
        .expect(200);

      // 5. Teacher grades submission with AI assistance
      const gradeData = {
        grade: 92,
        feedback: {
          overall: '전통 문화에 대한 깊이 있는 이해를 보여주었습니다.',
          strengths: [
            '역사적 배경을 잘 설명했습니다',
            '현대적 의미를 적절히 연결했습니다',
          ],
          improvements: [
            '더 구체적인 예시를 추가하면 좋겠습니다',
            '문단 구성을 더 체계적으로 하세요',
          ],
          rubricScores: {
            content: 38,
            structure: 25,
            grammar: 19,
            creativity: 10,
          },
        },
        aiSuggestions: {
          grammarCorrections: [
            {
              original: '수천 년의 역사를 가지고 있습니다',
              suggestion: '수천 년의 역사를 지니고 있습니다',
              reason: '더 자연스러운 표현',
            },
          ],
          contentEnhancements: [
            '한복의 구체적인 구성 요소(저고리, 치마 등)에 대한 설명 추가',
            '다른 나라의 전통 의상과의 비교',
          ],
        },
      };

      const gradeResponse = await request(app)
        .post(`/api/assignments/${assignmentId}/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(gradeData)
        .expect(200);

      expect(gradeResponse.body.grade).toBe(92);
      expect(gradeResponse.body.status).toBe('GRADED');

      // 6. Student views graded submission
      const gradedSubmission = await request(app)
        .get(`/api/assignments/${assignmentId}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(gradedSubmission.body.grade).toBe(92);
      expect(gradedSubmission.body.feedback).toBeTruthy();

      // 7. Verify notification was created
      const notifications = await prisma.notification.findMany({
        where: {
          userId: studentId,
          type: 'ASSIGNMENT_GRADED',
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toContain('과제가 채점되었습니다');
    });

    it('should handle late submissions', async () => {
      // Create assignment due in the past
      const assignment = await createTestAssignment(teacherId, testClassId, {
        title: 'Past Due Assignment',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });

      // Student submits late
      const submission = {
        content: {
          text: 'Late submission content',
        },
        status: 'SUBMITTED',
      };

      const response = await request(app)
        .post(`/api/assignments/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submission)
        .expect(201);

      // Verify late submission is marked
      expect(response.body.isLate).toBe(true);
      
      // In real implementation, you might apply late penalty
      const submissionRecord = await prisma.assignmentSubmission.findUnique({
        where: { id: response.body.id },
      });
      
      expect(submissionRecord?.metadata?.isLate).toBe(true);
    });
  });

  describe('Assignment Analytics', () => {
    it('should track assignment statistics', async () => {
      // Create assignment
      const assignment = await createTestAssignment(teacherId, testClassId);

      // Create multiple students and submissions
      const students = [];
      for (let i = 0; i < 5; i++) {
        const student = await createTestUser({
          email: `student${i}@test.com`,
          password: 'Pass123!',
          name: `Student ${i}`,
          role: 'STUDENT',
        });
        students.push(student);

        // Add to class
        await prisma.classMember.create({
          data: {
            userId: student.user.id,
            classId: testClassId,
            role: 'STUDENT',
          },
        });

        // Submit assignment
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            userId: student.user.id,
            content: { text: `Submission from student ${i}` },
            status: 'SUBMITTED',
            grade: 70 + i * 5, // Grades: 70, 75, 80, 85, 90
          },
        });
      }

      // Get assignment statistics
      const statsResponse = await request(app)
        .get(`/api/assignments/${assignment.id}/statistics`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        totalStudents: 6, // 5 + original student
        submittedCount: 5,
        gradedCount: 5,
        averageGrade: 80,
        gradeDistribution: {
          A: 1, // 90
          B: 2, // 80, 85
          C: 2, // 70, 75
          D: 0,
          F: 0,
        },
      });
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch assignment creation', async () => {
      const assignments = [
        {
          title: '주간 독서 과제 1',
          type: 'READING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          points: 50,
        },
        {
          title: '주간 독서 과제 2',
          type: 'READING',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          points: 50,
        },
      ];

      const batchResponse = await request(app)
        .post('/api/assignments/batch')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: testClassId,
          assignments,
        })
        .expect(201);

      expect(batchResponse.body.created).toBe(2);
      expect(batchResponse.body.assignments).toHaveLength(2);

      // Verify all assignments were created
      const classAssignments = await prisma.assignment.findMany({
        where: { classId: testClassId },
      });

      expect(classAssignments).toHaveLength(2);
    });

    it('should handle batch grading', async () => {
      // Create assignment and multiple submissions
      const assignment = await createTestAssignment(teacherId, testClassId);

      // Create submissions
      const submissionIds = [];
      for (let i = 0; i < 3; i++) {
        const student = await createTestUser({
          email: `student${i}@test.com`,
          password: 'Pass123!',
          name: `Student ${i}`,
          role: 'STUDENT',
        });

        await prisma.classMember.create({
          data: {
            userId: student.user.id,
            classId: testClassId,
            role: 'STUDENT',
          },
        });

        const submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            userId: student.user.id,
            content: { text: 'Submission text' },
            status: 'SUBMITTED',
          },
        });

        submissionIds.push(submission.id);
      }

      // Batch grade
      const batchGradeData = {
        grades: submissionIds.map((id, index) => ({
          submissionId: id,
          grade: 80 + index * 5,
          feedback: {
            overall: `Good work student ${index}`,
          },
        })),
      };

      const batchGradeResponse = await request(app)
        .post(`/api/assignments/${assignment.id}/batch-grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(batchGradeData)
        .expect(200);

      expect(batchGradeResponse.body.graded).toBe(3);

      // Verify all submissions were graded
      const gradedSubmissions = await prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: assignment.id,
          status: 'GRADED',
        },
      });

      expect(gradedSubmissions).toHaveLength(3);
    });
  });
});