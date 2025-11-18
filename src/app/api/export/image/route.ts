/**
 * Image Export API Route
 * Handles server-side image export operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageExportOptions } from '@/types/export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { options, imageData } = body as {
      options: ImageExportOptions;
      imageData: string; // Base64 encoded image
    };

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Validate options
    if (!options.format || !['png', 'jpg', 'webp'].includes(options.format)) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Set appropriate content type
    const contentTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp'
    };

    // Return image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypes[options.format],
        'Content-Disposition': `attachment; filename="export.${options.format}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Image export error:', error);
    return NextResponse.json(
      { error: 'Failed to export image' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
