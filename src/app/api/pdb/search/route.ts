/**
 * API Route: GET /api/pdb/search
 * Search PDB database
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchPDB } from '@/services/pdb-fetcher';
// Cache service removed - caching disabled in demo mode

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

    // Cache disabled in demo mode - search directly
    const results = await searchPDB(query, { limit, offset });

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
