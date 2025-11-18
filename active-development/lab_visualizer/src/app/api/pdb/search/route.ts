/**
 * API Route: GET /api/pdb/search
 * Search PDB database
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { cacheService } from '@/services/cache-service';
import { searchPDB } from '@/services/pdb-fetcher';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Cache search results for 5 minutes
    const cacheKey = `search:${query}:${limit}:${offset}`;
    const cached = await cacheService.get(cacheKey, 'l2');

    if (cached) {
      return NextResponse.json({
        results: cached,
        cached: true
      });
    }

    // Perform search
    const results = await searchPDB(query, { limit, offset });

    // Cache results
    await cacheService.set(cacheKey, results, { level: 'l2', ttl: 5 * 60 });

    return NextResponse.json({
      results,
      cached: false
    });

  } catch (error) {
    console.error('Search error:', error);

    return NextResponse.json(
      {
        error: 'Search failed',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
