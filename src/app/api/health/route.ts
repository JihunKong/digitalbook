import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbStatus = await checkDatabase();
    
    // Check Redis connection
    const redisStatus = await checkRedis();
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: dbStatus,
        redis: redisStatus,
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
    };
    
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // In production, you would check actual database connection
    // For now, return mock status
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkRedis(): Promise<string> {
  try {
    // In production, you would check actual Redis connection
    // For now, return mock status
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}