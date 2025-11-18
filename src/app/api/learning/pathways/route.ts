/**
 * API Route: Learning Pathways
 * GET /api/learning/pathways - List pathways
 * POST /api/learning/pathways - Create pathway
 */

import { NextRequest, NextResponse } from 'next/server';
import { learningContentService } from '@/services/learning-content';
import type { CreatePathwayRequest } from '@/types/learning';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/pathways
 * List learning pathways with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      difficulty: searchParams.get('difficulty') ? parseInt(searchParams.get('difficulty')!) : undefined,
    };

    const pathways = await learningContentService.listPathways(filters);

    return NextResponse.json({
      success: true,
      data: pathways,
      count: pathways.length,
    });
  } catch (error: any) {
    console.error('Error listing pathways:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'NOT_FOUND' ? 404
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to list pathways',
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/learning/pathways
 * Create new learning pathway
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePathwayRequest = await request.json();

    // Validation
    if (!body.title || !body.contentSequence || body.contentSequence.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: title, contentSequence (must not be empty)',
          },
        },
        { status: 400 }
      );
    }

    if (!body.difficulty || body.difficulty < 1 || body.difficulty > 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Difficulty must be between 1 and 5',
          },
        },
        { status: 400 }
      );
    }

    if (!body.estimatedDuration || body.estimatedDuration <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Estimated duration must be greater than 0',
          },
        },
        { status: 400 }
      );
    }

    const pathway = await learningContentService.createPathway(body);

    return NextResponse.json(
      {
        success: true,
        data: pathway,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating pathway:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'VALIDATION_ERROR' ? 400
      : error.code === 'PERMISSION_DENIED' ? 403
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to create pathway',
        },
      },
      { status: statusCode }
    );
  }
}
