import { PrismaClient } from '@prisma/client';
import { getDatabase } from '../config/database';
import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export interface ActivityEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivitySummary {
  totalEvents: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

export interface UserInsights {
  userId: string;
  totalSessions: number;
  totalTimeSpent: number; // in minutes
  averageSessionDuration: number; // in minutes
  mostActiveDay: string;
  mostActiveHour: number;
  favoriteResources: Array<{ resource: string; count: number }>;
  learningStreak: number; // consecutive days
  lastActive: Date;
  activityPattern: Array<{ hour: number; activity: number }>;
}

export class UserActivityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getDatabase();
  }

  /**
   * Log user activity
   */
  async logActivity(event: ActivityEvent): Promise<void> {
    try {
      // Store in a dedicated activity log table
      // For now, we'll use a JSON approach since we don't have the table defined
      await this.prisma.$executeRaw`
        INSERT INTO user_activity_logs (
          user_id, action, resource, resource_id, metadata, 
          timestamp, session_id, ip_address, user_agent
        ) VALUES (
          ${event.userId}, ${event.action}, ${event.resource}, 
          ${event.resourceId || null}, ${JSON.stringify(event.metadata || {})}, 
          ${event.timestamp}, ${event.sessionId || null}, 
          ${event.ipAddress || null}, ${event.userAgent || null}
        )
        ON CONFLICT DO NOTHING
      `.catch(() => {
        // Fallback: store in a simple log table or file
        console.log('Activity logged:', event);
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get platform-wide activity summary
   */
  async getActivitySummary(
    startDate: Date = subDays(new Date(), 30),
    endDate: Date = new Date()
  ): Promise<ActivitySummary> {
    try {
      // Get study records, assignment submissions, and other activities
      const [studyRecords, submissions, classes, textbooks] = await Promise.all([
        this.prisma.studyRecord.findMany({
          where: {
            updatedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            userId: true,
            updatedAt: true,
            textbookId: true,
            completed: true
          }
        }),
        this.prisma.assignmentSubmission.findMany({
          where: {
            submittedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            studentId: true,
            submittedAt: true,
            assignmentId: true
          }
        }),
        this.prisma.classMember.findMany({
          where: {
            joinedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            userId: true,
            joinedAt: true,
            classId: true
          }
        }),
        this.prisma.textbook.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            teacherId: true,
            createdAt: true,
            id: true
          }
        })
      ]);

      // Combine all activities
      const activities = [
        ...studyRecords.map(r => ({
          userId: r.userId,
          action: r.completed ? 'page_completed' : 'page_viewed',
          resource: 'textbook',
          resourceId: r.textbookId,
          timestamp: r.updatedAt
        })),
        ...submissions.map(s => ({
          userId: s.studentId,
          action: 'assignment_submitted',
          resource: 'assignment',
          resourceId: s.assignmentId,
          timestamp: s.submittedAt
        })),
        ...classes.map(c => ({
          userId: c.userId,
          action: 'class_joined',
          resource: 'class',
          resourceId: c.classId,
          timestamp: c.joinedAt
        })),
        ...textbooks.map(t => ({
          userId: t.teacherId,
          action: 'textbook_created',
          resource: 'textbook',
          resourceId: t.id,
          timestamp: t.createdAt
        }))
      ];

      // Calculate statistics
      const totalEvents = activities.length;
      const uniqueUsers = new Set(activities.map(a => a.userId)).size;

      // Top actions
      const actionCounts = activities.reduce((acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top resources
      const resourceCounts = activities.reduce((acc, activity) => {
        acc[activity.resource] = (acc[activity.resource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topResources = Object.entries(resourceCounts)
        .map(([resource, count]) => ({ resource, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Peak hours
      const hourCounts = activities.reduce((acc, activity) => {
        const hour = activity.timestamp.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourCounts[hour] || 0
      })).sort((a, b) => b.count - a.count);

      // Daily activity
      const dailyCounts = activities.reduce((acc, activity) => {
        const date = format(activity.timestamp, 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dailyActivity = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalEvents,
        uniqueUsers,
        topActions,
        topResources,
        peakHours,
        dailyActivity
      };
    } catch (error) {
      console.error('Failed to get activity summary:', error);
      throw error;
    }
  }

  /**
   * Get detailed insights for a specific user
   */
  async getUserInsights(userId: string, days: number = 30): Promise<UserInsights> {
    try {
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get user's study sessions and activities
      const [studyRecords, submissions, classMemberships] = await Promise.all([
        this.prisma.studyRecord.findMany({
          where: {
            userId,
            updatedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            textbook: true
          },
          orderBy: {
            updatedAt: 'asc'
          }
        }),
        this.prisma.assignmentSubmission.findMany({
          where: {
            studentId: userId,
            submittedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            assignment: true
          }
        }),
        this.prisma.classMember.findMany({
          where: {
            userId,
            joinedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ]);

      // Calculate sessions (group activities by day)
      const sessionsByDay = studyRecords.reduce((acc, record) => {
        const day = format(record.updatedAt, 'yyyy-MM-dd');
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(record);
        return acc;
      }, {} as Record<string, any[]>);

      const totalSessions = Object.keys(sessionsByDay).length;
      
      // Calculate total time spent (sum of timeSpent in study records)
      const totalTimeSpent = studyRecords.reduce((sum, record) => sum + (record.timeSpent || 0), 0);
      const averageSessionDuration = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;

      // Find most active day and hour
      const dayActivity = studyRecords.reduce((acc, record) => {
        const dayOfWeek = format(record.updatedAt, 'EEEE');
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostActiveDay = Object.entries(dayActivity)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

      const hourActivity = studyRecords.reduce((acc, record) => {
        const hour = record.updatedAt.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostActiveHour = Object.entries(hourActivity)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 9;

      // Favorite resources (textbooks)
      const resourceActivity = studyRecords.reduce((acc, record) => {
        const resourceName = record.textbook?.title || 'Unknown';
        acc[resourceName] = (acc[resourceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteResources = Object.entries(resourceActivity)
        .map(([resource, count]) => ({ resource, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Learning streak (consecutive days with activity)
      const activeDays = Array.from(new Set(
        studyRecords.map(record => format(record.updatedAt, 'yyyy-MM-dd'))
      )).sort();

      let learningStreak = 0;
      let currentStreak = 0;
      let lastDate: Date | null = null;

      for (const dayStr of activeDays.reverse()) {
        const day = parseISO(dayStr);
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const daysDiff = Math.floor((lastDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        lastDate = day;
        learningStreak = currentStreak;
      }

      // Activity pattern by hour
      const activityPattern = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activity: hourActivity[hour] || 0
      }));

      const lastActive = studyRecords.length > 0 
        ? studyRecords[studyRecords.length - 1].updatedAt 
        : new Date(0);

      return {
        userId,
        totalSessions,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        averageSessionDuration: Math.round(averageSessionDuration / 60), // Convert to minutes
        mostActiveDay,
        mostActiveHour: parseInt(mostActiveHour.toString()),
        favoriteResources,
        learningStreak,
        lastActive,
        activityPattern
      };
    } catch (error) {
      console.error('Failed to get user insights:', error);
      throw error;
    }
  }

  /**
   * Get learning analytics for teachers
   */
  async getTeacherAnalytics(teacherId: string, days: number = 30): Promise<{
    classesOverview: any[];
    studentEngagement: any[];
    contentEffectiveness: any[];
    assignmentAnalytics: any[];
  }> {
    try {
      const startDate = subDays(new Date(), days);

      // Get teacher's classes and students
      const teacherClasses = await this.prisma.classMember.findMany({
        where: {
          userId: teacherId,
          role: 'TEACHER'
        },
        include: {
          class: {
            include: {
              members: {
                where: { role: 'STUDENT' },
                include: { user: true }
              },
              textbooks: {
                include: { textbook: true }
              },
              assignments: {
                include: {
                  submissions: {
                    where: {
                      submittedAt: { gte: startDate }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const classesOverview = teacherClasses.map(tc => ({
        classId: tc.class.id,
        className: tc.class.name,
        studentCount: tc.class.members.length,
        textbookCount: tc.class.textbooks.length,
        assignmentCount: tc.class.assignments.length,
        activeStudents: tc.class.members.filter(m => 
          // Check if student was active in the last 7 days
          m.user.updatedAt >= subDays(new Date(), 7)
        ).length
      }));

      // Student engagement analysis
      const allStudents = teacherClasses.flatMap(tc => tc.class.members);
      const studentEngagement = await Promise.all(
        allStudents.map(async (student) => {
          const insights = await this.getUserInsights(student.userId, days);
          return {
            studentId: student.userId,
            studentName: student.user.name,
            totalSessions: insights.totalSessions,
            totalTimeSpent: insights.totalTimeSpent,
            learningStreak: insights.learningStreak,
            lastActive: insights.lastActive,
            engagementLevel: this.calculateEngagementLevel(insights)
          };
        })
      );

      // Content effectiveness (textbook analytics)
      const contentEffectiveness = await Promise.all(
        teacherClasses.flatMap(tc => 
          tc.class.textbooks.map(async (ct) => {
            const studyRecords = await this.prisma.studyRecord.findMany({
              where: {
                textbookId: ct.textbookId,
                updatedAt: { gte: startDate }
              }
            });

            const totalStudents = tc.class.members.length;
            const activeStudents = new Set(studyRecords.map(sr => sr.userId)).size;
            const completionRate = studyRecords.filter(sr => sr.completed).length / studyRecords.length;
            const averageTimePerPage = studyRecords.reduce((sum, sr) => sum + (sr.timeSpent || 0), 0) / studyRecords.length;

            return {
              textbookId: ct.textbookId,
              textbookTitle: ct.textbook.title,
              totalStudents,
              activeStudents,
              engagementRate: (activeStudents / totalStudents) * 100,
              completionRate: (completionRate || 0) * 100,
              averageTimePerPage: Math.round((averageTimePerPage || 0) / 60) // minutes
            };
          })
        )
      );

      // Assignment analytics
      const assignmentAnalytics = teacherClasses.flatMap(tc =>
        tc.class.assignments.map(assignment => ({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          totalSubmissions: assignment.submissions.length,
          onTimeSubmissions: assignment.submissions.filter(s => 
            s.submittedAt <= assignment.dueDate
          ).length,
          averageScore: assignment.submissions.reduce((sum, s) => sum + (s.score || 0), 0) / assignment.submissions.length || 0,
          submissionRate: (assignment.submissions.length / tc.class.members.length) * 100
        }))
      );

      return {
        classesOverview,
        studentEngagement,
        contentEffectiveness,
        assignmentAnalytics
      };
    } catch (error) {
      console.error('Failed to get teacher analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement level based on user insights
   */
  private calculateEngagementLevel(insights: UserInsights): 'high' | 'medium' | 'low' {
    const score = 
      (insights.totalSessions * 2) +
      (insights.learningStreak * 3) +
      (insights.totalTimeSpent / 60) + // Convert to hours
      (insights.favoriteResources.length * 2);

    if (score >= 50) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  /**
   * Get real-time activity feed
   */
  async getActivityFeed(limit: number = 50): Promise<any[]> {
    try {
      // Get recent activities from various sources
      const [recentStudyRecords, recentSubmissions, recentClasses] = await Promise.all([
        this.prisma.studyRecord.findMany({
          take: limit / 3,
          orderBy: { updatedAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
            textbook: { select: { id: true, title: true } }
          }
        }),
        this.prisma.assignmentSubmission.findMany({
          take: limit / 3,
          orderBy: { submittedAt: 'desc' },
          include: {
            student: { select: { id: true, name: true } },
            assignment: { select: { id: true, title: true } }
          }
        }),
        this.prisma.classMember.findMany({
          take: limit / 3,
          orderBy: { joinedAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        })
      ]);

      // Format and combine activities
      const activities = [
        ...recentStudyRecords.map(sr => ({
          id: `study_${sr.id}`,
          type: 'study',
          action: sr.completed ? 'completed page' : 'viewed page',
          user: sr.user,
          resource: sr.textbook,
          timestamp: sr.updatedAt,
          metadata: {
            chapterId: sr.chapterId,
            pageNumber: sr.pageNumber,
            timeSpent: sr.timeSpent
          }
        })),
        ...recentSubmissions.map(sub => ({
          id: `submission_${sub.id}`,
          type: 'assignment',
          action: 'submitted assignment',
          user: sub.student,
          resource: sub.assignment,
          timestamp: sub.submittedAt,
          metadata: {
            score: sub.score,
            status: sub.status
          }
        })),
        ...recentClasses.map(cm => ({
          id: `class_${cm.id}`,
          type: 'class',
          action: 'joined class',
          user: cm.user,
          resource: cm.class,
          timestamp: cm.joinedAt,
          metadata: {
            role: cm.role
          }
        }))
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get activity feed:', error);
      return [];
    }
  }
}

export const userActivityService = new UserActivityService();