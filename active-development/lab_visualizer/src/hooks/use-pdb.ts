/**
 * React hooks for PDB data fetching and caching
 * Uses React Query for state management and caching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import type { ParsedStructure } from '@/lib/pdb-parser';
import type { PDBSearchResult } from '@/services/pdb-fetcher';

export interface UsePDBOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onProgress?: (progress: number, message: string) => void;
}

export interface UsePDBResult {
  structure: ParsedStructure | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  progress: number;
  progressMessage: string;
  refetch: () => void;
}

/**
 * Hook to fetch and cache a PDB structure
 */
export function usePDB(
  id: string | undefined,
  options: UsePDBOptions = {}
): UsePDBResult {
  const { enabled = true, staleTime = 7 * 24 * 60 * 60 * 1000 } = options; // 7 days
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleProgress = useCallback((prog: number, msg: string) => {
    setProgress(prog);
    setProgressMessage(msg);
    options.onProgress?.(prog, msg);
  }, [options]);

  const query = useQuery({
    queryKey: ['pdb', id],
    queryFn: async () => {
      if (!id) throw new Error('PDB ID is required');

      handleProgress(0, 'Checking cache...');

      // Call our API route which handles caching
      const response = await fetch(`/api/pdb/${id}?progress=true`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch PDB structure');
      }

      // Check if response is streaming (for progress updates)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE progress updates
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response body');

        let structure: ParsedStructure | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));

              if (data.type === 'progress') {
                handleProgress(data.progress, data.message);
              } else if (data.type === 'complete') {
                structure = data.structure;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }

        if (!structure) throw new Error('No structure data received');
        return structure;
      } else {
        // Non-streaming response
        handleProgress(100, 'Complete');
        return response.json();
      }
    },
    enabled: enabled && !!id,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  return {
    structure: query.data,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    error: query.error as Error | null,
    progress,
    progressMessage,
    refetch: query.refetch
  };
}

/**
 * Hook to search PDB database
 */
export function usePDBSearch(query: string, options: UsePDBOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['pdb-search', query],
    queryFn: async () => {
      if (!query) return [];

      const response = await fetch(
        `/api/pdb/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json() as Promise<PDBSearchResult[]>;
    },
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Hook to upload user PDB file
 */
export function usePDBUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      setProgressMessage('Uploading file...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pdb/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      setProgress(100);
      setProgressMessage('Upload complete');

      return response.json() as Promise<ParsedStructure>;
    },
    onSuccess: (data) => {
      // Cache the uploaded structure
      queryClient.setQueryData(['pdb', 'upload'], data);
    }
  });

  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    structure: mutation.data,
    progress,
    progressMessage,
    reset: mutation.reset
  };
}

/**
 * Hook to fetch AlphaFold prediction
 */
export function useAlphaFold(
  uniprotId: string | undefined,
  options: UsePDBOptions = {}
) {
  const { enabled = true, staleTime = 30 * 24 * 60 * 60 * 1000 } = options; // 30 days
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleProgress = useCallback((prog: number, msg: string) => {
    setProgress(prog);
    setProgressMessage(msg);
    options.onProgress?.(prog, msg);
  }, [options]);

  return useQuery({
    queryKey: ['alphafold', uniprotId],
    queryFn: async () => {
      if (!uniprotId) throw new Error('UniProt ID is required');

      handleProgress(0, 'Fetching AlphaFold prediction...');

      const response = await fetch(`/api/pdb/alphafold/${uniprotId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch AlphaFold prediction');
      }

      handleProgress(100, 'Complete');
      return response.json() as Promise<ParsedStructure>;
    },
    enabled: enabled && !!uniprotId,
    staleTime,
    retry: 2
  });
}

/**
 * Hook to fetch multiple PDB structures in parallel
 */
export function usePDBBatch(
  ids: string[],
  options: UsePDBOptions = {}
) {
  const { enabled = true } = options;
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  return useQuery({
    queryKey: ['pdb-batch', ...ids.sort()],
    queryFn: async () => {
      if (ids.length === 0) return new Map();

      setProgress(0);
      setProgressMessage('Fetching structures...');

      const response = await fetch('/api/pdb/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (!response.ok) {
        throw new Error('Batch fetch failed');
      }

      // Handle streaming progress
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      const results = new Map<string, ParsedStructure>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));

            if (data.type === 'progress') {
              setProgress(data.progress);
              setProgressMessage(data.message);
              options.onProgress?.(data.progress, data.message);
            } else if (data.type === 'structure') {
              results.set(data.id, data.structure);
            }
          }
        }
      }

      setProgress(100);
      setProgressMessage('Complete');

      return results;
    },
    enabled: enabled && ids.length > 0,
    staleTime: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

/**
 * Hook to prefetch popular structures
 */
export function usePrefetchPopular() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(async (ids: string[]) => {
    const promises = ids.map((id) =>
      queryClient.prefetchQuery({
        queryKey: ['pdb', id],
        queryFn: async () => {
          const response = await fetch(`/api/pdb/${id}`);
          if (!response.ok) throw new Error('Prefetch failed');
          return response.json();
        },
        staleTime: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
    );

    await Promise.allSettled(promises);
  }, [queryClient]);

  return { prefetch };
}

/**
 * Hook to get cached structures
 */
export function useCachedStructures() {
  const queryClient = useQueryClient();

  const getCached = useCallback((id: string) => {
    return queryClient.getQueryData<ParsedStructure>(['pdb', id]);
  }, [queryClient]);

  const isCached = useCallback((id: string) => {
    return queryClient.getQueryState(['pdb', id]) !== undefined;
  }, [queryClient]);

  const invalidate = useCallback((id: string) => {
    return queryClient.invalidateQueries({ queryKey: ['pdb', id] });
  }, [queryClient]);

  return {
    getCached,
    isCached,
    invalidate
  };
}
