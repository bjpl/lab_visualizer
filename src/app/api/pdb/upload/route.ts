/**
 * API Route: POST /api/pdb/upload
 * Handle user PDB file uploads with comprehensive validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePDB } from '@/lib/pdb-parser';

export const runtime = 'edge';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'chemical/x-pdb',
  'chemical/x-mmcif',
  'text/plain',
  'application/octet-stream' // Browsers may report this for .pdb/.cif files
];

// Security: Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special characters
    .substring(0, 255); // Limit length
}

// Validate file content for malicious patterns
function validateFileContent(content: string, filename: string): { valid: boolean; error?: string } {
  // Check for suspicious patterns that might indicate malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /eval\(/i,
    /\x00/, // Null bytes
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: 'File contains potentially malicious content' };
    }
  }

  // Validate PDB/CIF format markers
  const isPDB = filename.toLowerCase().endsWith('.pdb');
  const isCIF = filename.toLowerCase().endsWith('.cif') || filename.toLowerCase().endsWith('.mmcif');

  if (isPDB) {
    // PDB files should have ATOM or HETATM records
    if (!/^(ATOM|HETATM|HEADER|TITLE)/m.test(content)) {
      return { valid: false, error: 'File does not appear to be a valid PDB file' };
    }
  } else if (isCIF) {
    // CIF files should start with data_ block
    if (!/^data_/m.test(content)) {
      return { valid: false, error: 'File does not appear to be a valid CIF/mmCIF file' };
    }
  }

  return { valid: true };
}

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

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
      return NextResponse.json(
        {
          error: 'Invalid MIME type',
          detail: `Expected chemical/x-pdb or chemical/x-mmcif, got ${file.type}`
        },
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

    // Sanitize and check file extension
    const sanitizedFilename = sanitizeFilename(file.name);
    const fileName = sanitizedFilename.toLowerCase();

    if (!fileName.endsWith('.pdb') && !fileName.endsWith('.cif') && !fileName.endsWith('.mmcif')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .pdb, .cif, and .mmcif files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: 'File appears to be empty or invalid (minimum 100 characters required)' },
        { status: 400 }
      );
    }

    // Validate content for security and format
    const validation = validateFileContent(content, sanitizedFilename);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
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
      filename: sanitizedFilename,
      originalFilename: file.name,
      validated: true,
      securityChecks: {
        mimeType: 'passed',
        size: 'passed',
        content: 'passed',
        sanitization: 'passed'
      }
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
