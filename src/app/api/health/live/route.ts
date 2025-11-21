/**
 * Liveness Check API Endpoint
 * Indicates if the application is alive and running
 */

import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health/health-checker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health/live
 * Kubernetes-style liveness probe
 */
export async function GET() {
  try {
    const result = healthChecker.checkLiveness();

    return NextResponse.json(
      {
        alive: result.alive,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // If we can't even execute this, we're not alive
    return NextResponse.json(
      {
        alive: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
