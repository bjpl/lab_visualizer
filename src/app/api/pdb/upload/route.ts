/**
 * API Route: POST /api/pdb/upload
 * Handle user PDB file uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePDB } from '@/lib/pdb-parser';

export const runtime = 'edge';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 413 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdb') && !fileName.endsWith('.cif')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .pdb and .cif files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: 'File appears to be empty or invalid' },
        { status: 400 }
      );
    }

    // Parse structure
    const structure = await parsePDB(content);

    // Validate
    if (structure.atoms.length === 0) {
      return NextResponse.json(
        { error: 'No atoms found in file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...structure,
      uploaded: true,
      filename: file.name
    });

  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process file',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
