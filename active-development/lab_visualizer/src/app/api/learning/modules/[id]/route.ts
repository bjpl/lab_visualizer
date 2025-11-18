/**
 * API Route: Single Learning Module CRUD
 * GET /api/learning/modules/[id] - Get module details
 * PUT /api/learning/modules/[id] - Update module
 * DELETE /api/learning/modules/[id] - Delete module
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { learningContentService } from '@/services/learning-content';
import type { UpdateModuleRequest } from '@/types/learning';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/modules/[id]
 * Get single module by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const module = await learningContentService.getModule(params.id);

    // Get user progress if requested
    const { searchParams } = new URL(request.url);
    const includeProgress = searchParams.get('includeProgress') === 'true';

    let userProgress;
    if (includeProgress) {
      userProgress = await learningContentService.getUserProgress(params.id);
    }

    // Get reviews if requested
    let reviews;
    const includeReviews = searchParams.get('includeReviews') === 'true';
    if (includeReviews) {
      reviews = await learningContentService.getReviews(params.id);
    }

    // Get related content if requested
    let relatedContent;
    const includeRelated = searchParams.get('includeRelated') === 'true';
    if (includeRelated) {
      relatedContent = await learningContentService.getRelatedContent(params.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        module,
        userProgress,
        reviews,
        relatedContent,
      },
    });
  } catch (error: any) {
    console.error(`Error getting module ${params.id}:`, error);

    const statusCode = error.code === 'NOT_FOUND' ? 404
      : error.code === 'UNAUTHORIZED' ? 401
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to get module',
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/learning/modules/[id]
 * Update module
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateModuleRequest = await request.json();

    // Validation
    if (body.difficulty && (body.difficulty < 1 || body.difficulty > 5)) {
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

    const module = await learningContentService.updateModule(params.id, body);

    return NextResponse.json({
      success: true,
      data: module,
    });
  } catch (error: any) {
    console.error(`Error updating module ${params.id}:`, error);

    const statusCode = error.code === 'NOT_FOUND' ? 404
      : error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'PERMISSION_DENIED' ? 403
      : error.code === 'VALIDATION_ERROR' ? 400
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to update module',
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/learning/modules/[id]
 * Delete module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await learningContentService.deleteModule(params.id);

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error: any) {
    console.error(`Error deleting module ${params.id}:`, error);

    const statusCode = error.code === 'NOT_FOUND' ? 404
      : error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'PERMISSION_DENIED' ? 403
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to delete module',
        },
      },
      { status: statusCode }
    );
  }
}
