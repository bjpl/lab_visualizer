/**
 * Mock Storage Service
 * Mirrors Supabase Storage interface for demo mode
 * Stores files as base64 in localStorage
 */

// Storage keys
const MOCK_STORAGE_PREFIX = 'mock_storage_';
const MOCK_STORAGE_META_PREFIX = 'mock_storage_meta_';

// Type definitions
export interface MockStorageError {
  message: string;
  statusCode: string;
}

export interface MockFileObject {
  name: string;
  id: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
  size: number;
  content_type: string;
}

export interface MockUploadResponse {
  data: { path: string } | null;
  error: MockStorageError | null;
}

export interface MockDownloadResponse {
  data: Blob | null;
  error: MockStorageError | null;
}

export interface MockRemoveResponse {
  data: { name: string }[] | null;
  error: MockStorageError | null;
}

export interface MockListResponse {
  data: MockFileObject[] | null;
  error: MockStorageError | null;
}

export interface MockUrlResponse {
  data: { publicUrl: string };
}

export interface MockSignedUrlResponse {
  data: { signedUrl: string } | null;
  error: MockStorageError | null;
}

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Helper functions
function getStorageKey(bucket: string, path: string): string {
  return `${MOCK_STORAGE_PREFIX}${bucket}/${path}`;
}

function getMetaKey(bucket: string, path: string): string {
  return `${MOCK_STORAGE_META_PREFIX}${bucket}/${path}`;
}

function generateMockId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createStorageError(message: string, code: string = '404'): MockStorageError {
  return { message, statusCode: code };
}

// Convert File/Blob to base64
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert base64 to Blob
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const firstPart = parts[0];
  const secondPart = parts[1];
  const contentType = (firstPart?.split(':')[1]) || 'application/octet-stream';
  const raw = atob(secondPart || '');
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// Estimate storage size in bytes
function estimateStorageSize(): number {
  if (!isBrowser) return 0;

  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX) || key?.startsWith(MOCK_STORAGE_META_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  return total * 2; // UTF-16 characters = 2 bytes each
}

// Maximum storage limit (5MB for demo)
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * Mock Storage File API
 * Handles file operations within a bucket
 */
export class MockStorageFileApi {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  /**
   * Upload a file to storage
   */
  async upload(
    path: string,
    fileBody: File | Blob | ArrayBuffer | string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<MockUploadResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const storageKey = getStorageKey(this.bucket, path);
    const metaKey = getMetaKey(this.bucket, path);

    // Check if file exists and upsert is false
    if (!options?.upsert && localStorage.getItem(storageKey)) {
      return {
        data: null,
        error: createStorageError('The resource already exists', '409'),
      };
    }

    try {
      let base64Data: string;
      let contentType = options?.contentType || 'application/octet-stream';
      let size = 0;

      if (fileBody instanceof File) {
        contentType = fileBody.type || contentType;
        size = fileBody.size;
        base64Data = await fileToBase64(fileBody);
      } else if (fileBody instanceof Blob) {
        contentType = fileBody.type || contentType;
        size = fileBody.size;
        base64Data = await fileToBase64(fileBody);
      } else if (fileBody instanceof ArrayBuffer) {
        const blob = new Blob([fileBody], { type: contentType });
        size = fileBody.byteLength;
        base64Data = await fileToBase64(blob);
      } else if (typeof fileBody === 'string') {
        const blob = new Blob([fileBody], { type: contentType });
        size = fileBody.length;
        base64Data = await fileToBase64(blob);
      } else {
        return {
          data: null,
          error: createStorageError('Invalid file body type'),
        };
      }

      // Check storage limit
      const currentSize = estimateStorageSize();
      const newSize = base64Data.length * 2;

      if (currentSize + newSize > MAX_STORAGE_SIZE) {
        return {
          data: null,
          error: createStorageError('Storage quota exceeded', '507'),
        };
      }

      // Store the file
      localStorage.setItem(storageKey, base64Data);

      // Store metadata
      const metadata: MockFileObject = {
        name: path.split('/').pop() || path,
        id: generateMockId(),
        bucket_id: this.bucket,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        metadata: {
          cacheControl: options?.cacheControl || 'max-age=3600',
        },
        size,
        content_type: contentType,
      };

      localStorage.setItem(metaKey, JSON.stringify(metadata));

      return {
        data: { path },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: createStorageError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
      };
    }
  }

  /**
   * Download a file from storage
   */
  async download(path: string): Promise<MockDownloadResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const storageKey = getStorageKey(this.bucket, path);
    const metaKey = getMetaKey(this.bucket, path);

    const base64Data = localStorage.getItem(storageKey);

    if (!base64Data) {
      return {
        data: null,
        error: createStorageError('Object not found', '404'),
      };
    }

    try {
      const blob = base64ToBlob(base64Data);

      // Update last accessed time
      const metaStr = localStorage.getItem(metaKey);
      if (metaStr) {
        const meta = JSON.parse(metaStr) as MockFileObject;
        meta.last_accessed_at = new Date().toISOString();
        localStorage.setItem(metaKey, JSON.stringify(meta));
      }

      return {
        data: blob,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: createStorageError(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): MockUrlResponse {
    if (!isBrowser) {
      return {
        data: { publicUrl: '' },
      };
    }

    const storageKey = getStorageKey(this.bucket, path);
    const base64Data = localStorage.getItem(storageKey);

    if (base64Data) {
      // Return the base64 data URL directly
      return {
        data: { publicUrl: base64Data },
      };
    }

    // Return a placeholder URL if file doesn't exist
    return {
      data: { publicUrl: `mock://storage/${this.bucket}/${path}` },
    };
  }

  /**
   * Create a signed URL for a file
   */
  async createSignedUrl(
    path: string,
    expiresIn: number
  ): Promise<MockSignedUrlResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const storageKey = getStorageKey(this.bucket, path);
    const base64Data = localStorage.getItem(storageKey);

    if (!base64Data) {
      return {
        data: null,
        error: createStorageError('Object not found', '404'),
      };
    }

    // For mock, just return the base64 data URL
    // In real implementation, this would be a signed URL with expiration
    const expiresAt = Date.now() + expiresIn * 1000;
    const signedUrl = `${base64Data}#expires=${expiresAt}`;

    return {
      data: { signedUrl },
      error: null,
    };
  }

  /**
   * Create multiple signed URLs
   */
  async createSignedUrls(
    paths: string[],
    expiresIn: number
  ): Promise<{
    data: { path: string; signedUrl: string }[] | null;
    error: MockStorageError | null;
  }> {
    const results = await Promise.all(
      paths.map(async (path) => {
        const result = await this.createSignedUrl(path, expiresIn);
        return {
          path,
          signedUrl: result.data?.signedUrl || '',
        };
      })
    );

    return {
      data: results,
      error: null,
    };
  }

  /**
   * Remove files from storage
   */
  async remove(paths: string[]): Promise<MockRemoveResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const removed: { name: string }[] = [];

    for (const path of paths) {
      const storageKey = getStorageKey(this.bucket, path);
      const metaKey = getMetaKey(this.bucket, path);

      if (localStorage.getItem(storageKey)) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(metaKey);
        removed.push({ name: path });
      }
    }

    return {
      data: removed,
      error: null,
    };
  }

  /**
   * List files in a path
   */
  async list(
    path?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<MockListResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!isBrowser) {
      return {
        data: [],
        error: null,
      };
    }

    const prefix = `${MOCK_STORAGE_META_PREFIX}${this.bucket}/`;
    const pathPrefix = path ? `${prefix}${path}/` : prefix;

    const files: MockFileObject[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(pathPrefix)) {
        const metaStr = localStorage.getItem(key);
        if (metaStr) {
          try {
            files.push(JSON.parse(metaStr) as MockFileObject);
          } catch {
            // Skip invalid entries
          }
        }
      }
    }

    // Sort files
    if (options?.sortBy) {
      const { column, order } = options.sortBy;
      files.sort((a, b) => {
        const aRecord = a as unknown as Record<string, unknown>;
        const bRecord = b as unknown as Record<string, unknown>;
        const aVal = aRecord[column];
        const bVal = bRecord[column];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    let result = files;
    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return {
      data: result,
      error: null,
    };
  }

  /**
   * Move a file
   */
  async move(
    fromPath: string,
    toPath: string
  ): Promise<{ data: { path: string } | null; error: MockStorageError | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const fromStorageKey = getStorageKey(this.bucket, fromPath);
    const fromMetaKey = getMetaKey(this.bucket, fromPath);

    const base64Data = localStorage.getItem(fromStorageKey);
    const metaStr = localStorage.getItem(fromMetaKey);

    if (!base64Data) {
      return {
        data: null,
        error: createStorageError('Object not found', '404'),
      };
    }

    // Copy to new location
    const toStorageKey = getStorageKey(this.bucket, toPath);
    const toMetaKey = getMetaKey(this.bucket, toPath);

    localStorage.setItem(toStorageKey, base64Data);

    if (metaStr) {
      const meta = JSON.parse(metaStr) as MockFileObject;
      meta.name = toPath.split('/').pop() || toPath;
      meta.updated_at = new Date().toISOString();
      localStorage.setItem(toMetaKey, JSON.stringify(meta));
    }

    // Remove from old location
    localStorage.removeItem(fromStorageKey);
    localStorage.removeItem(fromMetaKey);

    return {
      data: { path: toPath },
      error: null,
    };
  }

  /**
   * Copy a file
   */
  async copy(
    fromPath: string,
    toPath: string
  ): Promise<{ data: { path: string } | null; error: MockStorageError | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!isBrowser) {
      return {
        data: null,
        error: createStorageError('Storage not available in server environment'),
      };
    }

    const fromStorageKey = getStorageKey(this.bucket, fromPath);
    const fromMetaKey = getMetaKey(this.bucket, fromPath);

    const base64Data = localStorage.getItem(fromStorageKey);
    const metaStr = localStorage.getItem(fromMetaKey);

    if (!base64Data) {
      return {
        data: null,
        error: createStorageError('Object not found', '404'),
      };
    }

    // Copy to new location
    const toStorageKey = getStorageKey(this.bucket, toPath);
    const toMetaKey = getMetaKey(this.bucket, toPath);

    localStorage.setItem(toStorageKey, base64Data);

    if (metaStr) {
      const meta = JSON.parse(metaStr) as MockFileObject;
      meta.id = generateMockId();
      meta.name = toPath.split('/').pop() || toPath;
      meta.created_at = new Date().toISOString();
      meta.updated_at = new Date().toISOString();
      localStorage.setItem(toMetaKey, JSON.stringify(meta));
    }

    return {
      data: { path: toPath },
      error: null,
    };
  }
}

/**
 * Mock Storage Service Class
 */
export class MockStorageService {
  /**
   * Access a storage bucket
   */
  from(bucket: string): MockStorageFileApi {
    return new MockStorageFileApi(bucket);
  }

  /**
   * List all buckets
   */
  async listBuckets(): Promise<{
    data: { name: string; id: string }[];
    error: MockStorageError | null;
  }> {
    // In mock mode, we simulate standard buckets
    return {
      data: [
        { name: 'avatars', id: 'avatars' },
        { name: 'structures', id: 'structures' },
        { name: 'exports', id: 'exports' },
        { name: 'thumbnails', id: 'thumbnails' },
      ],
      error: null,
    };
  }

  /**
   * Get bucket info
   */
  async getBucket(name: string): Promise<{
    data: { name: string; id: string; public: boolean } | null;
    error: MockStorageError | null;
  }> {
    const buckets = ['avatars', 'structures', 'exports', 'thumbnails'];

    if (buckets.includes(name)) {
      return {
        data: { name, id: name, public: true },
        error: null,
      };
    }

    return {
      data: null,
      error: createStorageError('Bucket not found', '404'),
    };
  }
}

// Export singleton instance
export const mockStorageService = new MockStorageService();

// Export factory function
export function createMockStorage(): MockStorageService {
  return new MockStorageService();
}

// Utility to clear all mock storage
export function clearMockStorage(): void {
  if (!isBrowser) return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX) || key?.startsWith(MOCK_STORAGE_META_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log('[MockStorage] Storage cleared');
}

// Get storage usage stats
export function getMockStorageStats(): { used: number; limit: number; files: number } {
  if (!isBrowser) return { used: 0, limit: MAX_STORAGE_SIZE, files: 0 };

  let fileCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX) && !key.startsWith(MOCK_STORAGE_META_PREFIX)) {
      fileCount++;
    }
  }

  return {
    used: estimateStorageSize(),
    limit: MAX_STORAGE_SIZE,
    files: fileCount,
  };
}
