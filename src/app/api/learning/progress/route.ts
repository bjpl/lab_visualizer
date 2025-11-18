/**
 * API Route: Learning Progress Tracking
 * GET /api/learning/progress?contentId=[id] - Get user progress for content
 * POST /api/learning/progress - Update progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { learningContentService } from '@/services/learning-content';
import type { UpdateProgressRequest } from '@/types/learning';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/progress
 * Get user progress for specific content or pathway
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const pathwayId = searchParams.get('pathwayId');

    if (!contentId && !pathwayId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Must provide either contentId or pathwayId',
          },
        },
        { status: 400 }
      );
    }

    if (contentId) {
      const progress = await learningContentService.getUserProgress(contentId);
      return NextResponse.json({
        success: true,
        data: progress,
      });
    }

    if (pathwayId) {
      const progress = await learningContentService.getPathwayProgress(pathwayId);
      return NextResponse.json({
        success: true,
        data: progress,
      });
    }
  } catch (error: any) {
    console.error('Error getting progress:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'NOT_FOUND' ? 404
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to get progress',
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/learning/progress
 * Update user progress for a module
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'contentId query parameter is required',
          },
        },
        { status: 400 }
      );
    }

    const body: UpdateProgressRequest = await request.json();

    // Validation
    if (body.progressPercent !== undefined && (body.progressPercent < 0 || body.progressPercent > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'progressPercent must be between 0 and 100',
          },
        },
        { status: 400 }
      );
    }

    if (body.timeSpent !== undefined && body.timeSpent < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'timeSpent must be non-negative',
          },
        },
        { status: 400 }
      );
    }

    const progress = await learningContentService.updateProgress(contentId, body);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'VALIDATION_ERROR' ? 400
      : error.code === 'NOT_FOUND' ? 404
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to update progress',
        },
      },
      { status: statusCode }
    );
  }
}
