/**
 * Readiness Check API Endpoint
 * Indicates if the application is ready to serve traffic
 */

import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health/health-checker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health/ready
 * Kubernetes-style readiness probe
 */
export async function GET() {
  try {
    const result = await healthChecker.checkReadiness();

    if (!result.ready) {
      return NextResponse.json(
        {
          ready: false,
          reason: result.reason,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ready: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
