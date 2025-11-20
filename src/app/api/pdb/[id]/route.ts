/**
 * API Route: GET /api/pdb/[id]
 * Fetch PDB structure with multi-tier caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPDB, isValidPDBId, normalizePDBId } from '@/services/pdb-fetcher';
import { parsePDB } from '@/lib/pdb-parser';
import { cacheService } from '@/services/cache-service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Request deduplication - prevents duplicate concurrent fetches
const pendingRequests = new Map<string, Promise<Response>>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Validate PDB ID
    const rawId = params.id;
    const pdbId = normalizePDBId(rawId);

    if (!isValidPDBId(pdbId)) {
      return NextResponse.json(
        { error: `Invalid PDB ID: ${rawId}` },
        { status: 400 }
      );
    }

    // Request deduplication - check if this PDB ID is already being fetched
    const deduplicationKey = `pdb:${pdbId}:${request.url}`;
    if (pendingRequests.has(deduplicationKey)) {
      console.log(`[Dedup] Request for ${pdbId} already in progress, waiting...`);
      try {
        return await pendingRequests.get(deduplicationKey)!;
      } catch (error) {
        // If the pending request failed, remove it and continue with new request
        pendingRequests.delete(deduplicationKey);
      }
    }

    // Check if streaming progress is requested
    const url = new URL(request.url);
    const enableProgress = url.searchParams.get('progress') === 'true';

    // Create promise for this request to enable deduplication
    const requestPromise = (async (): Promise<Response> => {
      try {
        // Multi-tier cache check
        const cacheKey = `pdb:${pdbId}`;

        // L1: Check IndexedDB (client-side, not accessible from server)
        // Skip for server-side

        // L2: Check Vercel KV
        const cachedL2 = await cacheService.get(cacheKey, 'l2');
        if (cachedL2) {
          console.log(`Cache hit (L2) for ${pdbId}`);
          return NextResponse.json({
            ...cachedL2,
            cached: true,
            cacheLevel: 'l2',
            fetchTime: Date.now() - startTime,
            deduplicated: false
          });
        }

        // L3: Check Supabase Storage
        const cachedL3 = await cacheService.get(cacheKey, 'l3');
        if (cachedL3) {
          console.log(`Cache hit (L3) for ${pdbId}`);

          // Warm L2 cache
          await cacheService.set(cacheKey, cachedL3, { level: 'l2', ttl: 7 * 24 * 60 * 60 });

          return NextResponse.json({
            ...cachedL3,
            cached: true,
            cacheLevel: 'l3',
            fetchTime: Date.now() - startTime,
            deduplicated: false
          });
        }

        console.log(`Cache miss for ${pdbId}, fetching from external API`);

    // If streaming, use SSE
    if (enableProgress) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Fetch PDB file
            const fetchResult = await fetchPDB(pdbId, {
              onProgress: (progress, message) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'progress', progress, message })}\n\n`
                  )
                );
              }
            });

            // Parse structure
            const structure = await parsePDB(fetchResult.content, {
              onProgress: (progress, message) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'progress', progress, message })}\n\n`
                  )
                );
              }
            });

            // Cache at all levels
            await Promise.all([
              cacheService.set(cacheKey, structure, { level: 'l2', ttl: 7 * 24 * 60 * 60 }),
              cacheService.set(cacheKey, structure, { level: 'l3', ttl: 30 * 24 * 60 * 60 })
            ]);

            // Send final result
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'complete', structure })}\n\n`
              )
            );

            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: (error as Error).message
                })}\n\n`
              )
            );
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

        // Non-streaming: fetch and parse
        const fetchResult = await fetchPDB(pdbId);
        const structure = await parsePDB(fetchResult.content);

        // Cache at all levels
        await Promise.all([
          cacheService.set(cacheKey, structure, { level: 'l2', ttl: 7 * 24 * 60 * 60 }),
          cacheService.set(cacheKey, structure, { level: 'l3', ttl: 30 * 24 * 60 * 60 })
        ]);

        return NextResponse.json({
          ...structure,
          cached: false,
          fetchTime: Date.now() - startTime,
          deduplicated: false
        });
      } catch (error) {
        throw error;
      }
    })();

    // Store the promise for deduplication
    pendingRequests.set(deduplicationKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up the pending request
      pendingRequests.delete(deduplicationKey);
    }

  } catch (error) {
    console.error(`Error fetching PDB ${params.id}:`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch PDB structure',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
