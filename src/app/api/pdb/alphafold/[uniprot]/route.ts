/**
 * API Route: GET /api/pdb/alphafold/[uniprot]
 * Fetch AlphaFold prediction by UniProt ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAlphaFold, isValidUniProtId } from '@/services/pdb-fetcher';
import { parsePDB } from '@/lib/pdb-parser';
// Cache service removed - caching disabled in demo mode

export const runtime = 'edge';

export async function GET(
  _request: NextRequest,
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

    // Cache disabled in demo mode - fetch directly from AlphaFold DB
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
