import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { userActivityService } from '../services/user-activity.service';

class AnalyticsController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const userId = user.userId || user.id;
      const role = user.role;
      const prisma = getDatabase();
      
      if (role === 'TEACHER') {
        // 교사 대시보드 통계
        const stats = await prisma.$transaction([
          // 관리 중인 학급 수
          prisma.classMember.count({
            where: { userId, role: 'TEACHER' }
          }),
          // 총 학생 수
          prisma.classMember.count({
            where: {
              class: {
                members: {
                  some: { userId, role: 'TEACHER' }
                }
              },
              role: 'STUDENT'
            }
          }),
          // 생성한 교과서 수
          prisma.textbook.count({
            where: { teacherId: userId }
          }),
          // 활성 과제 수
          prisma.assignment.count({
            where: {
              teacherId: userId,
              dueDate: { gte: new Date() }
            }
          })
        ]);
        
        res.json({
          classes: stats[0],
          students: stats[1],
          textbooks: stats[2],
          activeAssignments: stats[3]
        });
      } else {
        // 학생 대시보드 통계
        const stats = await prisma.$transaction([
          // 수강 중인 수업 수
          prisma.classMember.count({
            where: { userId, role: 'STUDENT' }
          }),
          // 완료한 페이지 수
          prisma.studyRecord.count({
            where: { userId, completed: true }
          }),
          // 제출한 과제 수
          prisma.assignmentSubmission.count({
            where: { studentId: userId, status: 'SUBMITTED' }
          }),
          // 획득한 성취도
          prisma.achievement.count({
            where: { userId }
          })
        ]);
        
        res.json({
          classes: stats[0],
          completedPages: stats[1],
          submittedAssignments: stats[2],
          achievements: stats[3]
        });
      }
    } catch (error) {
      next(error);
    }
  }
  
  async getClassAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const user = req.user as any;
      const userId = user.userId || user.id;
      const prisma = getDatabase();
      
      // 권한 확인
      const membership = await prisma.classMember.findUnique({
        where: {
          userId_classId: { userId, classId }
        }
      });
      
      if (!membership || membership.role !== 'TEACHER') {
        throw new AppError('Unauthorized', 403);
      }
      
      // 학급 분석 데이터 가져오기
      const [classInfo, students, assignments, studyProgress] = await prisma.$transaction([
        prisma.class.findUnique({
          where: { id: classId },
          include: {
            textbooks: {
              include: { textbook: true }
            }
          }
        }),
        prisma.classMember.findMany({
          where: { classId, role: 'STUDENT' },
          include: { user: true }
        }),
        prisma.assignment.findMany({
          where: { classId },
          include: {
            submissions: {
              include: { student: true }
            }
          }
        }),
        prisma.studyRecord.findMany({
          where: {
            user: {
              classes: {
                some: { classId }
              }
            }
          },
          include: { user: true }
        })
      ]);
      
      res.json({
        classInfo,
        students,
        assignments,
        studyProgress
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getStudentAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const user = req.user as any;
      const userId = user.userId || user.id;
      const role = user.role;
      const prisma = getDatabase();
      
      // 권한 확인: 본인이거나 담당 교사만 접근 가능
      if (userId !== studentId && role === 'STUDENT') {
        throw new AppError('Unauthorized', 403);
      }
      
      if (role === 'TEACHER') {
        const hasAccess = await prisma.classMember.findFirst({
          where: {
            userId: studentId,
            class: {
              members: {
                some: { userId, role: 'TEACHER' }
              }
            }
          }
        });
        
        if (!hasAccess) {
          throw new AppError('Unauthorized', 403);
        }
      }
      
      // 학생 분석 데이터
      const [studentInfo, studyRecords, submissions, achievements] = await prisma.$transaction([
        prisma.user.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }),
        prisma.studyRecord.findMany({
          where: { userId: studentId },
          include: { textbook: true },
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.assignmentSubmission.findMany({
          where: { studentId },
          include: { assignment: true },
          orderBy: { submittedAt: 'desc' }
        }),
        prisma.achievement.findMany({
          where: { userId: studentId },
          orderBy: { earnedAt: 'desc' }
        })
      ]);
      
      res.json({
        studentInfo,
        studyRecords,
        submissions,
        achievements
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getTextbookAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { textbookId } = req.params;
      const user = req.user as any;
      const userId = user.userId || user.id;
      const prisma = getDatabase();
      
      // 교과서 정보 및 권한 확인
      const textbook = await prisma.textbook.findUnique({
        where: { id: textbookId },
        include: {
          teacher: true,
          classes: {
            include: { class: true }
          }
        }
      });
      
      if (!textbook) {
        throw new AppError('Textbook not found', 404);
      }
      
      if (textbook.teacherId !== userId) {
        throw new AppError('Unauthorized', 403);
      }
      
      // 학습 기록 분석
      const studyRecords = await prisma.studyRecord.findMany({
        where: { textbookId },
        include: { user: true }
      });
      
      // 페이지별 평균 학습 시간
      const pageStats = studyRecords.reduce((acc, record) => {
        const key = `${record.chapterId}-${record.pageNumber}`;
        if (!acc[key]) {
          acc[key] = {
            chapterId: record.chapterId,
            pageNumber: record.pageNumber,
            totalTime: 0,
            studentCount: 0,
            completionRate: 0
          };
        }
        acc[key].totalTime += record.timeSpent;
        acc[key].studentCount += 1;
        if (record.completed) {
          acc[key].completionRate += 1;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const pageAnalytics = Object.values(pageStats).map((stat: any) => ({
        ...stat,
        averageTime: Math.round(stat.totalTime / stat.studentCount),
        completionRate: Math.round((stat.completionRate / stat.studentCount) * 100)
      }));
      
      res.json({
        textbook,
        studyRecords,
        pageAnalytics
      });
    } catch (error) {
      next(error);
    }
  }
  
  async exportQuestionResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { textbookId } = req.params;
      const user = req.user as any;
      const userId = user.userId || user.id;
      const prisma = getDatabase();
      
      // 권한 확인
      const textbook = await prisma.textbook.findUnique({
        where: { id: textbookId }
      });
      
      if (!textbook || textbook.teacherId !== userId) {
        throw new AppError('Unauthorized', 403);
      }
      
      // 과제 제출 데이터 가져오기
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            class: {
              textbooks: {
                some: { textbookId }
              }
            }
          }
        },
        include: {
          student: true,
          assignment: true
        }
      });
      
      // 엑셀 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('학생 응답');
      
      // 헤더 스타일
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, size: 12 },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6366F1' }
        },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
      };
      
      // 헤더 추가
      worksheet.columns = [
        { header: '문제 번호', key: 'questionId', width: 15 },
        { header: '문제 내용', key: 'questionText', width: 40 },
        { header: '학생 이름', key: 'studentName', width: 15 },
        { header: '학생 이메일', key: 'studentEmail', width: 25 },
        { header: '응답', key: 'response', width: 50 },
        { header: '점수', key: 'score', width: 10 },
        { header: '제출 시간', key: 'submittedAt', width: 20 }
      ];
      
      // 헤더 스타일 적용
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });
      
      // 데이터 행 추가
      submissions.forEach((submission) => {
        const content = submission.content as any;
        const responses = content.responses || [];
        
        responses.forEach((response: any, index: number) => {
          worksheet.addRow({
            questionId: `Q${index + 1}`,
            questionText: response.question || submission.assignment.title,
            studentName: submission.student.name,
            studentEmail: submission.student.email,
            response: response.answer || response.content || '',
            score: response.score || submission.score || '-',
            submittedAt: format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm', { locale: ko })
          });
        });
      });
      
      // 자동 필터 추가
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: worksheet.rowCount, column: worksheet.columnCount }
      };
      
      // 파일 전송
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="student-responses-${format(new Date(), 'yyyyMMdd')}.xlsx"`
      );
      
      await workbook.xlsx.write(res);
      res.end();
      
      logger.info(`Exported question responses for textbook: ${textbookId}`);
    } catch (error) {
      next(error);
    }
  }

  async getAdvancedAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string);
      
      const startDate = subDays(new Date(), daysNum);
      const endDate = new Date();
      
      const summary = await userActivityService.getActivitySummary(startDate, endDate);
      
      res.json({
        success: true,
        data: summary,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: daysNum
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string);
      
      const user = req.user as any;
      const currentUserId = user.userId || user.id;
      const role = user.role;
      
      // Check permissions
      if (userId !== currentUserId && role !== 'TEACHER' && !user.isAdmin) {
        throw new AppError('Unauthorized', 403);
      }
      
      if (role === 'TEACHER' && userId !== currentUserId) {
        // Verify teacher has access to this student
        const hasAccess = await this.prisma.classMember.findFirst({
          where: {
            userId: userId,
            class: {
              members: {
                some: { userId: currentUserId, role: 'TEACHER' }
              }
            }
          }
        });
        
        if (!hasAccess) {
          throw new AppError('Unauthorized', 403);
        }
      }
      
      const insights = await userActivityService.getUserInsights(userId, daysNum);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeacherAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const teacherId = user.userId || user.id;
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string);
      
      if (user.role !== 'TEACHER') {
        throw new AppError('Teacher access required', 403);
      }
      
      const analytics = await userActivityService.getTeacherAnalytics(teacherId, daysNum);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50 } = req.query;
      const limitNum = parseInt(limit as string);
      
      const feed = await userActivityService.getActivityFeed(limitNum);
      
      res.json({
        success: true,
        data: feed,
        count: feed.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getEngagementMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days as string);
      const prisma = getDatabase();
      
      const startDate = subDays(new Date(), daysNum);
      
      // Daily active users
      const dailyActiveUsers = await prisma.studyRecord.groupBy({
        by: ['userId'],
        where: {
          updatedAt: { gte: startDate }
        },
        _count: {
          userId: true
        }
      });
      
      // Session duration analysis
      const studyRecords = await prisma.studyRecord.findMany({
        where: {
          updatedAt: { gte: startDate },
          timeSpent: { gt: 0 }
        },
        select: {
          timeSpent: true,
          userId: true,
          updatedAt: true
        }
      });
      
      // Calculate metrics
      const totalSessions = studyRecords.length;
      const averageSessionDuration = totalSessions > 0 
        ? studyRecords.reduce((sum, record) => sum + (record.timeSpent || 0), 0) / totalSessions 
        : 0;
      
      const userSessionCounts = studyRecords.reduce((acc, record) => {
        acc[record.userId] = (acc[record.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const averageSessionsPerUser = Object.keys(userSessionCounts).length > 0
        ? Object.values(userSessionCounts).reduce((sum, count) => sum + count, 0) / Object.keys(userSessionCounts).length
        : 0;
      
      // Retention metrics
      const weeklyRetention = await this.calculateRetentionRate(7);
      const monthlyRetention = await this.calculateRetentionRate(30);
      
      res.json({
        success: true,
        data: {
          period: `Last ${daysNum} days`,
          dailyActiveUsers: dailyActiveUsers.length,
          totalSessions,
          averageSessionDuration: Math.round(averageSessionDuration / 60), // minutes
          averageSessionsPerUser: Math.round(averageSessionsPerUser * 10) / 10,
          weeklyRetention: Math.round(weeklyRetention * 100) / 100,
          monthlyRetention: Math.round(monthlyRetention * 100) / 100,
          engagementTrend: await this.getEngagementTrend(daysNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  private async calculateRetentionRate(days: number): Promise<number> {
    try {
      const prisma = getDatabase();
      const startDate = subDays(new Date(), days);
      const endDate = new Date();
      
      // Users who were active at the start of the period
      const initialUsers = await prisma.studyRecord.findMany({
        where: {
          updatedAt: {
            gte: startDate,
            lt: subDays(startDate, -1) // First day of period
          }
        },
        select: { userId: true },
        distinct: ['userId']
      });
      
      if (initialUsers.length === 0) return 0;
      
      // Users who are still active at the end of the period
      const retainedUsers = await prisma.studyRecord.findMany({
        where: {
          userId: { in: initialUsers.map(u => u.userId) },
          updatedAt: {
            gte: subDays(endDate, 1), // Last day of period
            lte: endDate
          }
        },
        select: { userId: true },
        distinct: ['userId']
      });
      
      return retainedUsers.length / initialUsers.length;
    } catch (error) {
      console.error('Failed to calculate retention rate:', error);
      return 0;
    }
  }

  private async getEngagementTrend(days: number): Promise<Array<{ date: string; sessions: number; users: number }>> {
    try {
      const prisma = getDatabase();
      const startDate = subDays(new Date(), days);
      
      const dailyData = await prisma.studyRecord.groupBy({
        by: ['updatedAt'],
        where: {
          updatedAt: { gte: startDate }
        },
        _count: {
          id: true,
          userId: true
        }
      });
      
      // Group by date
      const dateGroups = dailyData.reduce((acc, record) => {
        const date = format(record.updatedAt, 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { sessions: 0, userIds: new Set() };
        }
        acc[date].sessions += record._count.id;
        // Note: We can't accurately count unique users from groupBy, so we approximate
        acc[date].userIds.add('estimated');
        return acc;
      }, {} as Record<string, { sessions: number; userIds: Set<string> }>);
      
      return Object.entries(dateGroups).map(([date, data]) => ({
        date,
        sessions: data.sessions,
        users: data.userIds.size
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get engagement trend:', error);
      return [];
    }
  }

  private prisma = getDatabase();
}

export const analyticsController = new AnalyticsController();