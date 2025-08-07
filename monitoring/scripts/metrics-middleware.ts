// Prometheus Metrics Middleware for Express Backend
// Korean Digital Textbook Platform

import { Request, Response, NextFunction } from 'express';
import * as promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics for the application
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const activeUsers = new promClient.Gauge({
  name: 'digitalbook_active_users',
  help: 'Number of active users',
  registers: [register]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const dbQueriesTotal = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

const aiApiCalls = new promClient.Counter({
  name: 'ai_api_calls_total',
  help: 'Total number of AI API calls',
  labelNames: ['endpoint', 'status'],
  registers: [register]
});

const aiApiCost = new promClient.Counter({
  name: 'ai_api_cost_dollars',
  help: 'Total cost of AI API calls in dollars',
  registers: [register]
});

const aiTokensUsed = new promClient.Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['model'],
  registers: [register]
});

const loginAttempts = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [register]
});

const loginFailures = new promClient.Counter({
  name: 'login_failures_total',
  help: 'Total number of failed login attempts',
  labelNames: ['reason'],
  registers: [register]
});

const signupsTotal = new promClient.Counter({
  name: 'digitalbook_signups_total',
  help: 'Total number of user signups',
  labelNames: ['role'],
  registers: [register]
});

const sessionDuration = new promClient.Histogram({
  name: 'digitalbook_session_duration_seconds',
  help: 'Duration of user sessions',
  buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
  registers: [register]
});

const userActions = new promClient.Counter({
  name: 'digitalbook_user_actions_total',
  help: 'Total number of user actions',
  labelNames: ['action', 'role'],
  registers: [register]
});

const contentEngagement = new promClient.Gauge({
  name: 'digitalbook_content_engagement',
  help: 'Content engagement score',
  labelNames: ['content_id', 'content_type'],
  registers: [register]
});

const studentProgress = new promClient.Gauge({
  name: 'digitalbook_student_progress_percent',
  help: 'Student learning progress percentage',
  labelNames: ['student_id', 'course_id'],
  registers: [register]
});

const securityEvents = new promClient.Counter({
  name: 'digitalbook_security_events_total',
  help: 'Total number of security events',
  labelNames: ['type', 'severity'],
  registers: [register]
});

const jwtValidationFailures = new promClient.Counter({
  name: 'jwt_validation_failures_total',
  help: 'Total number of JWT validation failures',
  labelNames: ['reason'],
  registers: [register]
});

// Web Vitals metrics
const webVitalsLCP = new promClient.Histogram({
  name: 'digitalbook_web_vitals_lcp_seconds',
  help: 'Largest Contentful Paint (LCP) in seconds',
  buckets: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5],
  registers: [register]
});

const webVitalsFID = new promClient.Histogram({
  name: 'digitalbook_web_vitals_fid_seconds',
  help: 'First Input Delay (FID) in seconds',
  buckets: [0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 1],
  registers: [register]
});

const webVitalsCLS = new promClient.Histogram({
  name: 'digitalbook_web_vitals_cls',
  help: 'Cumulative Layout Shift (CLS) score',
  buckets: [0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5],
  registers: [register]
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Track request
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route: route,
      status: res.statusCode.toString()
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
};

// Database query tracking wrapper
export const trackDatabaseQuery = async (
  operation: string,
  table: string,
  queryFn: () => Promise<any>
) => {
  const start = Date.now();
  let status = 'success';
  
  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({ operation, table }, duration);
    dbQueriesTotal.inc({ operation, table, status });
  }
};

// AI API tracking wrapper
export const trackAIAPICall = async (
  endpoint: string,
  model: string,
  tokens: number,
  cost: number,
  callFn: () => Promise<any>
) => {
  let status = 'success';
  
  try {
    const result = await callFn();
    return result;
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    aiApiCalls.inc({ endpoint, status });
    aiTokensUsed.inc({ model }, tokens);
    aiApiCost.inc(cost);
  }
};

// Track user actions
export const trackUserAction = (action: string, role: string) => {
  userActions.inc({ action, role });
};

// Track login attempts
export const trackLoginAttempt = (success: boolean, reason?: string) => {
  loginAttempts.inc({ status: success ? 'success' : 'failure' });
  if (!success && reason) {
    loginFailures.inc({ reason });
  }
};

// Track security events
export const trackSecurityEvent = (type: string, severity: string) => {
  securityEvents.inc({ type, severity });
};

// Track JWT validation failures
export const trackJWTValidationFailure = (reason: string) => {
  jwtValidationFailures.inc({ reason });
};

// Update active users count
export const updateActiveUsers = (count: number) => {
  activeUsers.set(count);
};

// Track signup
export const trackSignup = (role: string) => {
  signupsTotal.inc({ role });
};

// Track session duration
export const trackSessionDuration = (duration: number) => {
  sessionDuration.observe(duration);
};

// Update content engagement
export const updateContentEngagement = (contentId: string, contentType: string, score: number) => {
  contentEngagement.set({ content_id: contentId, content_type: contentType }, score);
};

// Update student progress
export const updateStudentProgress = (studentId: string, courseId: string, progress: number) => {
  studentProgress.set({ student_id: studentId, course_id: courseId }, progress);
};

// Track Web Vitals
export const trackWebVitals = (lcp?: number, fid?: number, cls?: number) => {
  if (lcp !== undefined) webVitalsLCP.observe(lcp);
  if (fid !== undefined) webVitalsFID.observe(fid);
  if (cls !== undefined) webVitalsCLS.observe(cls);
};

// Endpoint to expose metrics
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};

// Custom metrics endpoint with additional business metrics
export const customMetricsEndpoint = async (req: Request, res: Response) => {
  // You can add custom business logic here to calculate and expose additional metrics
  const customMetrics = {
    daily_active_users: await calculateDAU(),
    monthly_active_users: await calculateMAU(),
    average_session_duration: await calculateAvgSessionDuration(),
    conversion_rate: await calculateConversionRate(),
    retention_rate: await calculateRetentionRate(),
    ai_usage_rate: await calculateAIUsageRate(),
    average_learning_progress: await calculateAvgLearningProgress()
  };
  
  res.json(customMetrics);
};

// Helper functions for custom metrics (implement these based on your database)
async function calculateDAU(): Promise<number> {
  // Implement logic to calculate Daily Active Users
  return 0;
}

async function calculateMAU(): Promise<number> {
  // Implement logic to calculate Monthly Active Users
  return 0;
}

async function calculateAvgSessionDuration(): Promise<number> {
  // Implement logic to calculate average session duration
  return 0;
}

async function calculateConversionRate(): Promise<number> {
  // Implement logic to calculate conversion rate
  return 0;
}

async function calculateRetentionRate(): Promise<number> {
  // Implement logic to calculate retention rate
  return 0;
}

async function calculateAIUsageRate(): Promise<number> {
  // Implement logic to calculate AI feature usage rate
  return 0;
}

async function calculateAvgLearningProgress(): Promise<number> {
  // Implement logic to calculate average learning progress
  return 0;
}

export default {
  metricsMiddleware,
  metricsEndpoint,
  customMetricsEndpoint,
  trackDatabaseQuery,
  trackAIAPICall,
  trackUserAction,
  trackLoginAttempt,
  trackSecurityEvent,
  trackJWTValidationFailure,
  updateActiveUsers,
  trackSignup,
  trackSessionDuration,
  updateContentEngagement,
  updateStudentProgress,
  trackWebVitals
};