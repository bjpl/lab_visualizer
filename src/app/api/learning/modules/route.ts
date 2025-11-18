/**
 * API Route: Learning Modules List/Create
 * GET /api/learning/modules - List modules with filters
 * POST /api/learning/modules - Create new module
 */

import { NextRequest, NextResponse } from 'next/server';
import { learningContentService } from '@/services/learning-content';
import type { CreateModuleRequest, ListModulesFilters } from '@/types/learning';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/modules
 * List learning modules with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: ListModulesFilters = {
      contentType: searchParams.get('contentType') as any,
      difficulty: searchParams.get('difficulty') ? parseInt(searchParams.get('difficulty')!) as any : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      structureId: searchParams.get('structureId') || undefined,
      creatorId: searchParams.get('creatorId') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true : searchParams.get('isPublished') === 'false' ? false : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') as any || 'created',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    };

    const modules = await learningContentService.listModules(filters);

    return NextResponse.json({
      success: true,
      data: modules,
      count: modules.length,
    });
  } catch (error: any) {
    console.error('Error listing modules:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'NOT_FOUND' ? 404
      : error.code === 'VALIDATION_ERROR' ? 400
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to list modules',
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/learning/modules
 * Create new learning module
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateModuleRequest = await request.json();

    // Validation
    if (!body.title || !body.contentType || !body.contentData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: title, contentType, contentData',
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

    const module = await learningContentService.createModule(body);

    return NextResponse.json(
      {
        success: true,
        data: module,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating module:', error);

    const statusCode = error.code === 'UNAUTHORIZED' ? 401
      : error.code === 'VALIDATION_ERROR' ? 400
      : error.code === 'PERMISSION_DENIED' ? 403
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Failed to create module',
        },
      },
      { status: statusCode }
    );
  }
}
