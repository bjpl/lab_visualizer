/**
 * React Hook for Cached Fetching
 *
 * Provides React Query integration with L1 cache
 * Automatic cache-first strategy with optimistic updates
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { getCacheService, CacheOptions } from '@/lib/cache/cache-service';
import { PDBCacheData } from '@/lib/cache/indexeddb';

const cacheService = getCacheService();

/**
 * Hook for fetching PDB files with caching
 */
export function useCachedPDB(
  pdbId: string | null | undefined,
  options?: Omit<UseQueryOptions<PDBCacheData>, 'queryKey' | 'queryFn'> & CacheOptions
) {
  return useQuery<PDBCacheData>({
    queryKey: ['pdb', pdbId],
    queryFn: async () => {
      if (!pdbId) {
        throw new Error('PDB ID is required');
      }
      return cacheService.fetchPDB(pdbId, options);
    },
    enabled: !!pdbId,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (was cacheTime)
    retry: 2,
    ...options,
  });
}

/**
 * Hook for prefetching PDB files
 */
export function usePrefetchPDB() {
  const queryClient = useQueryClient();

  return async (pdbId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['pdb', pdbId],
      queryFn: () => cacheService.fetchPDB(pdbId),
      staleTime: 7 * 24 * 60 * 60 * 1000,
    });
  };
}

/**
 * Hook for generic cached fetching
 */
export function useCachedFetch<T>(
  key: string | null | undefined,
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> & CacheOptions
) {
  return useQuery<T>({
    queryKey: ['cached', key],
    queryFn: async () => {
      if (!key) {
        throw new Error('Cache key is required');
      }
      return cacheService.fetchWithCache(key, fetcher, options);
    },
    enabled: !!key,
    staleTime: options?.ttl || 5 * 60 * 1000, // 5 minutes default
    retry: 2,
    ...options,
  });
}

/**
 * Hook for invalidating cache
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidatePDB: async (pdbId: string) => {
      await cacheService.invalidate(`pdb:${pdbId}`);
      await queryClient.invalidateQueries({ queryKey: ['pdb', pdbId] });
    },

    invalidateData: async (key: string) => {
      await cacheService.invalidate(key);
      await queryClient.invalidateQueries({ queryKey: ['cached', key] });
    },

    clearAll: async () => {
      await cacheService.clearAll();
      await queryClient.clear();
    },
  };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  return useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => cacheService.getStats(),
    refetchInterval: 30000, // Update every 30 seconds
  });
}

/**
 * Hook for mutation with optimistic updates
 */
export function useCachedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    cacheKey?: string;
    optimisticData?: (variables: TVariables) => TData;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async (variables) => {
      if (options?.cacheKey && options?.optimisticData) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['cached', options.cacheKey] });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(['cached', options.cacheKey]);

        // Optimistically update cache
        queryClient.setQueryData(['cached', options.cacheKey], options.optimisticData(variables));

        return { previousData };
      }
      return options?.onMutate?.(variables);
    },
    onError: (err, variables, context) => {
      if (options?.cacheKey && context?.previousData) {
        // Rollback on error
        queryClient.setQueryData(['cached', options.cacheKey], context.previousData);
      }
      options?.onError?.(err, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (options?.cacheKey) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['cached', options.cacheKey] });
      }
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * Hook for batch prefetching
 */
export function useBatchPrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchPDBs: async (pdbIds: string[]) => {
      const promises = pdbIds.map((pdbId) =>
        queryClient.prefetchQuery({
          queryKey: ['pdb', pdbId],
          queryFn: () => cacheService.fetchPDB(pdbId),
          staleTime: 7 * 24 * 60 * 60 * 1000,
        })
      );
      await Promise.allSettled(promises);
    },
  };
}

/**
 * Hook for cache warming on mount
 */
export function useCacheWarming(pdbIds: string[], enabled = true) {
  const { prefetchPDBs } = useBatchPrefetch();

  useQuery({
    queryKey: ['cache-warming', pdbIds],
    queryFn: async () => {
      await prefetchPDBs(pdbIds);
      return true;
    },
    enabled: enabled && pdbIds.length > 0,
    staleTime: Infinity,
  });
}
