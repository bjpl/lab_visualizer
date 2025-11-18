/**
 * API Route: GET /api/pdb/alphafold/[uniprot]
 * Fetch AlphaFold prediction by UniProt ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAlphaFold, isValidUniProtId } from '@/services/pdb-fetcher';
import { parsePDB } from '@/lib/pdb-parser';
import { cacheService } from '@/services/cache-service';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { uniprot: string } }
) {
  const startTime = Date.now();

  try {
    const uniprotId = params.uniprot.toUpperCase();

    // Validate UniProt ID
    if (!isValidUniProtId(uniprotId)) {
      return NextResponse.json(
        { error: `Invalid UniProt ID: ${params.uniprot}` },
        { status: 400 }
      );
    }

    // Check cache (30-day TTL for AlphaFold predictions)
    const cacheKey = `alphafold:${uniprotId}`;

    const cachedL2 = await cacheService.get(cacheKey, 'l2');
    if (cachedL2) {
      return NextResponse.json({
        ...cachedL2,
        cached: true,
        cacheLevel: 'l2',
        fetchTime: Date.now() - startTime
      });
    }

    const cachedL3 = await cacheService.get(cacheKey, 'l3');
    if (cachedL3) {
      // Warm L2 cache
      await cacheService.set(cacheKey, cachedL3, {
        level: 'l2',
        ttl: 30 * 24 * 60 * 60
      });

      return NextResponse.json({
        ...cachedL3,
        cached: true,
        cacheLevel: 'l3',
        fetchTime: Date.now() - startTime
      });
    }

    // Fetch from AlphaFold DB
    const fetchResult = await fetchAlphaFold(uniprotId);
    const structure = await parsePDB(fetchResult.content);

    // Add AlphaFold-specific metadata
    const enrichedStructure = {
      ...structure,
      metadata: {
        ...structure.metadata,
        id: uniprotId,
        title: `AlphaFold prediction for ${uniprotId}`,
        method: 'COMPUTATIONAL MODEL',
        source: 'AlphaFold DB'
      }
    };

    // Cache with long TTL (30 days)
    await Promise.all([
      cacheService.set(cacheKey, enrichedStructure, {
        level: 'l2',
        ttl: 30 * 24 * 60 * 60
      }),
      cacheService.set(cacheKey, enrichedStructure, {
        level: 'l3',
        ttl: 90 * 24 * 60 * 60
      })
    ]);

    return NextResponse.json({
      ...enrichedStructure,
      cached: false,
      fetchTime: Date.now() - startTime
    });

  } catch (error) {
    console.error(`Error fetching AlphaFold ${params.uniprot}:`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch AlphaFold prediction',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
