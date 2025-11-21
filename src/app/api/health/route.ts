/**
 * Health Check API Endpoint
 * Returns comprehensive health status for monitoring
 */

import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health/health-checker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health
 * Comprehensive health check for all services
 */
export async function GET() {
  try {
    const health = await healthChecker.checkAll();

    // Return appropriate status code based on health
    let status = 200;
    if (health.status === 'unhealthy') status = 503;
    else if (health.status === 'degraded') status = 200; // Still operational

    return NextResponse.json(health, { status });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
