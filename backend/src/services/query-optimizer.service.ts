import { PrismaClient } from '@prisma/client';
import { getDatabase } from '../config/database';
import { cacheService, CacheService } from './cache.service';
import { logger } from '../utils/logger';

export interface QueryStats {
  queryTime: number;
  rowCount: number;
  cached: boolean;
}

export class QueryOptimizerService {
  private prisma: PrismaClient;
  private queryStats: Map<string, QueryStats[]> = new Map();

  constructor() {
    this.prisma = getDatabase();
  }

  /**
   * Optimized query for getting user's textbooks with related data
   */
  async getOptimizedUserTextbooks(userId: string, role: string) {
    const cacheKey = cacheService.createKey(
      CacheService.PREFIXES.TEXTBOOK,
      'user-optimized',
      userId
    );

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();

        if (role === 'TEACHER') {
          const result = await this.prisma.$queryRaw`
            SELECT 
              t.id,
              t.title,
              t.subject,
              t.grade,
              t."isPublished",
              t."createdAt",
              t."updatedAt",
              COUNT(DISTINCT sr."userId") as "studentCount",
              COUNT(DISTINCT sr.id) as "studyRecordCount",
              COALESCE(SUM(sr."timeSpent"), 0) as "totalTimeSpent",
              COUNT(DISTINCT ct."classId") as "classCount"
            FROM "Textbook" t
            LEFT JOIN "StudyRecord" sr ON sr."textbookId" = t.id
            LEFT JOIN "ClassTextbook" ct ON ct."textbookId" = t.id
            WHERE t."teacherId" = ${userId}
            GROUP BY t.id
            ORDER BY t."createdAt" DESC
          `;

          this.recordQueryStats('teacher-textbooks', Date.now() - startTime, result.length);
          return result;
        } else {
          const result = await this.prisma.$queryRaw`
            WITH user_classes AS (
              SELECT "classId" 
              FROM "ClassMember" 
              WHERE "userId" = ${userId} AND role = 'STUDENT'
            )
            SELECT DISTINCT
              t.id,
              t.title,
              t.subject,
              t.grade,
              t.description,
              t."coverImage",
              u.name as "teacherName",
              COALESCE(sr."timeSpent", 0) as "userTimeSpent",
              COALESCE(sr.completed, false) as "userCompleted",
              COALESCE(prog."completedPages", 0) as "completedPages",
              COALESCE(pages."totalPages", 0) as "totalPages"
            FROM "Textbook" t
            INNER JOIN "User" u ON u.id = t."teacherId"
            LEFT JOIN "ClassTextbook" ct ON ct."textbookId" = t.id
            LEFT JOIN "StudyRecord" sr ON sr."textbookId" = t.id AND sr."userId" = ${userId}
            LEFT JOIN LATERAL (
              SELECT COUNT(*) as "completedPages"
              FROM "StudyRecord"
              WHERE "textbookId" = t.id 
                AND "userId" = ${userId} 
                AND completed = true
            ) prog ON true
            LEFT JOIN LATERAL (
              SELECT COUNT(*) as "totalPages"
              FROM "TextbookPage"
              WHERE "textbookId" = t.id
            ) pages ON true
            WHERE t."isPublished" = true
              AND (t."isPublic" = true OR ct."classId" IN (SELECT "classId" FROM user_classes))
            ORDER BY t."createdAt" DESC
          `;

          this.recordQueryStats('student-textbooks', Date.now() - startTime, result.length);
          return result;
        }
      },
      { ttl: CacheService.TTL.MEDIUM }
    );
  }

  /**
   * Optimized query for assignment analytics
   */
  async getAssignmentAnalytics(assignmentId: string) {
    const cacheKey = cacheService.createKey(
      CacheService.PREFIXES.ANALYTICS,
      'assignment',
      assignmentId
    );

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();

        const result = await this.prisma.$queryRaw`
          WITH submission_stats AS (
            SELECT
              a.id,
              COUNT(DISTINCT cm."userId") as "totalStudents",
              COUNT(DISTINCT s.id) as "submittedCount",
              COUNT(DISTINCT CASE WHEN s.status = 'GRADED' THEN s.id END) as "gradedCount",
              AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade END) as "averageGrade",
              MIN(s.grade) as "minGrade",
              MAX(s.grade) as "maxGrade",
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.grade) as "medianGrade"
            FROM "Assignment" a
            INNER JOIN "ClassMember" cm ON cm."classId" = a."classId" AND cm.role = 'STUDENT'
            LEFT JOIN "AssignmentSubmission" s ON s."assignmentId" = a.id AND s."userId" = cm."userId"
            WHERE a.id = ${assignmentId}
            GROUP BY a.id
          ),
          grade_distribution AS (
            SELECT
              CASE 
                WHEN grade >= 90 THEN 'A'
                WHEN grade >= 80 THEN 'B'
                WHEN grade >= 70 THEN 'C'
                WHEN grade >= 60 THEN 'D'
                ELSE 'F'
              END as "gradeLevel",
              COUNT(*) as count
            FROM "AssignmentSubmission"
            WHERE "assignmentId" = ${assignmentId} AND grade IS NOT NULL
            GROUP BY "gradeLevel"
          )
          SELECT 
            s.*,
            json_object_agg(gd."gradeLevel", gd.count) as "gradeDistribution"
          FROM submission_stats s
          CROSS JOIN grade_distribution gd
          GROUP BY s.id, s."totalStudents", s."submittedCount", 
                   s."gradedCount", s."averageGrade", s."minGrade", 
                   s."maxGrade", s."medianGrade"
        `;

        this.recordQueryStats('assignment-analytics', Date.now() - startTime, 1);
        return result[0];
      },
      { ttl: CacheService.TTL.SHORT }
    );
  }

  /**
   * Optimized query for class performance dashboard
   */
  async getClassPerformanceDashboard(classId: string) {
    const cacheKey = cacheService.createKey(
      CacheService.PREFIXES.ANALYTICS,
      'class-performance',
      classId
    );

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();

        const [students, assignments, engagement] = await Promise.all([
          // Student performance
          this.prisma.$queryRaw`
            SELECT 
              u.id,
              u.name,
              u.email,
              COUNT(DISTINCT sr."textbookId") as "textbooksAccessed",
              COALESCE(SUM(sr."timeSpent"), 0) as "totalStudyTime",
              COUNT(DISTINCT a.id) as "achievementCount",
              COALESCE(AVG(sub.grade), 0) as "averageGrade"
            FROM "User" u
            INNER JOIN "ClassMember" cm ON cm."userId" = u.id
            LEFT JOIN "StudyRecord" sr ON sr."userId" = u.id
            LEFT JOIN "Achievement" a ON a."userId" = u.id
            LEFT JOIN "AssignmentSubmission" sub ON sub."userId" = u.id
            WHERE cm."classId" = ${classId} AND cm.role = 'STUDENT'
            GROUP BY u.id
            ORDER BY "averageGrade" DESC
          `,

          // Assignment completion rates
          this.prisma.$queryRaw`
            SELECT 
              a.id,
              a.title,
              a."dueDate",
              COUNT(DISTINCT cm."userId") as "totalStudents",
              COUNT(DISTINCT sub.id) as "submissionCount",
              ROUND(100.0 * COUNT(DISTINCT sub.id) / NULLIF(COUNT(DISTINCT cm."userId"), 0), 2) as "completionRate"
            FROM "Assignment" a
            INNER JOIN "ClassMember" cm ON cm."classId" = a."classId" AND cm.role = 'STUDENT'
            LEFT JOIN "AssignmentSubmission" sub ON sub."assignmentId" = a.id AND sub."userId" = cm."userId"
            WHERE a."classId" = ${classId}
            GROUP BY a.id
            ORDER BY a."dueDate" DESC
            LIMIT 10
          `,

          // Weekly engagement metrics
          this.prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('week', sr."createdAt") as week,
              COUNT(DISTINCT sr."userId") as "activeStudents",
              SUM(sr."timeSpent") as "totalTimeSpent",
              COUNT(DISTINCT sr."textbookId") as "textbooksUsed"
            FROM "StudyRecord" sr
            INNER JOIN "ClassMember" cm ON cm."userId" = sr."userId"
            WHERE cm."classId" = ${classId}
              AND sr."createdAt" >= NOW() - INTERVAL '12 weeks'
            GROUP BY week
            ORDER BY week DESC
          `,
        ]);

        const result = {
          students,
          assignments,
          engagement,
          generatedAt: new Date(),
        };

        this.recordQueryStats('class-dashboard', Date.now() - startTime, students.length);
        return result;
      },
      { ttl: CacheService.TTL.SHORT }
    );
  }

  /**
   * Batch fetch with optimized queries
   */
  async batchFetchWithCache<T>(
    keys: string[],
    fetcher: (keys: string[]) => Promise<T[]>,
    options: {
      cachePrefix: string;
      ttl?: number;
      keyExtractor: (item: T) => string;
    }
  ): Promise<T[]> {
    // Check cache for existing items
    const cacheKeys = keys.map(key => 
      cacheService.createKey(options.cachePrefix, key)
    );
    
    const cachedItems = await cacheService.mget<T>(cacheKeys);
    const missingKeys: string[] = [];
    const results: T[] = [];

    // Collect cached items and identify missing keys
    cachedItems.forEach((item, index) => {
      if (item) {
        results.push(item);
      } else {
        missingKeys.push(keys[index]);
      }
    });

    // Fetch missing items
    if (missingKeys.length > 0) {
      const fetchedItems = await fetcher(missingKeys);
      
      // Cache fetched items
      const itemsToCache = fetchedItems.map(item => ({
        key: cacheService.createKey(options.cachePrefix, options.keyExtractor(item)),
        value: item,
      }));
      
      await cacheService.mset(itemsToCache, options.ttl);
      results.push(...fetchedItems);
    }

    return results;
  }

  /**
   * Get query performance statistics
   */
  getQueryPerformanceStats(): Record<string, {
    avgTime: number;
    totalQueries: number;
    avgRowCount: number;
    cacheHitRate: number;
  }> {
    const stats: Record<string, any> = {};

    this.queryStats.forEach((queryStats, queryName) => {
      const totalTime = queryStats.reduce((sum, stat) => sum + stat.queryTime, 0);
      const totalRows = queryStats.reduce((sum, stat) => sum + stat.rowCount, 0);
      const cacheHits = queryStats.filter(stat => stat.cached).length;

      stats[queryName] = {
        avgTime: Math.round(totalTime / queryStats.length),
        totalQueries: queryStats.length,
        avgRowCount: Math.round(totalRows / queryStats.length),
        cacheHitRate: (cacheHits / queryStats.length) * 100,
      };
    });

    return stats;
  }

  /**
   * Analyze and suggest query optimizations
   */
  async analyzeQueryPerformance(query: string): Promise<{
    executionPlan: any;
    suggestions: string[];
  }> {
    try {
      // Get query execution plan
      const plan = await this.prisma.$queryRaw`EXPLAIN ANALYZE ${query}`;
      
      const suggestions: string[] = [];
      
      // Analyze plan for common issues
      const planText = JSON.stringify(plan);
      
      if (planText.includes('Seq Scan')) {
        suggestions.push('Consider adding indexes to avoid sequential scans');
      }
      
      if (planText.includes('Nested Loop')) {
        suggestions.push('Large nested loops detected - consider query restructuring');
      }
      
      if (planText.includes('Sort')) {
        suggestions.push('Sorting detected - ensure columns used in ORDER BY have indexes');
      }

      return {
        executionPlan: plan,
        suggestions,
      };
    } catch (error) {
      logger.error('Query analysis failed:', error);
      return {
        executionPlan: null,
        suggestions: ['Unable to analyze query'],
      };
    }
  }

  private recordQueryStats(queryName: string, queryTime: number, rowCount: number, cached = false) {
    if (!this.queryStats.has(queryName)) {
      this.queryStats.set(queryName, []);
    }
    
    const stats = this.queryStats.get(queryName)!;
    stats.push({ queryTime, rowCount, cached });
    
    // Keep only last 100 stats per query
    if (stats.length > 100) {
      stats.shift();
    }
  }
}

export const queryOptimizer = new QueryOptimizerService();