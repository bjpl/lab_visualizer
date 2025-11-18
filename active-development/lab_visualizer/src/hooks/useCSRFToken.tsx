/**
 * useCSRFToken Hook
 *
 * Client-side hook for fetching and managing CSRF tokens.
 * Automatically fetches token on mount and provides it for API requests.
 *
 * @security CSRF Protection
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCSRFTokenResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch CSRF token from server
 *
 * @returns CSRF token or null on error
 */
async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin', // Include cookies
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Hook for managing CSRF tokens
 *
 * Fetches token on mount and provides refetch capability.
 * Use this hook in components that need to make state-changing API requests.
 *
 * @returns Object with token, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function UploadForm() {
 *   const { token, loading, error, refetch } = useCSRFToken();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   const handleSubmit = async (formData: FormData) => {
 *     const response = await fetch('/api/pdb/upload', {
 *       method: 'POST',
 *       headers: {
 *         'X-CSRF-Token': token!,
 *       },
 *       body: formData,
 *     });
 *
 *     if (response.status === 403) {
 *       // CSRF token expired or invalid, refetch and retry
 *       await refetch();
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCSRFToken(): UseCSRFTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    const newToken = await fetchCSRFToken();

    if (newToken) {
      setToken(newToken);
      setError(null);
    } else {
      setError('Failed to fetch CSRF token');
    }

    setLoading(false);
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loading,
    error,
    refetch: fetchToken,
  };
}

/**
 * Helper function to create fetch options with CSRF token
 *
 * @param token - CSRF token
 * @param options - Additional fetch options
 * @returns Fetch options with CSRF token header
 *
 * @example
 * ```tsx
 * const { token } = useCSRFToken();
 *
 * const response = await fetch('/api/endpoint',
 *   withCSRFToken(token, {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *   })
 * );
 * ```
 */
export function withCSRFToken(
  token: string | null,
  options: RequestInit = {}
): RequestInit {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  return {
    ...options,
    headers,
    credentials: 'same-origin', // Ensure cookies are sent
  };
}

/**
 * Hook that returns a fetch wrapper with automatic CSRF token injection
 *
 * @returns Fetch function with CSRF token automatically included
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const csrfFetch = useCSRFFetch();
 *
 *   const handleSubmit = async () => {
 *     // CSRF token is automatically included
 *     const response = await csrfFetch('/api/endpoint', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   };
 * }
 * ```
 */
export function useCSRFFetch(): typeof fetch {
  const { token, refetch } = useCSRFToken();

  return useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, withCSRFToken(token, init));

      // If CSRF token is invalid, refetch and retry once
      if (response.status === 403) {
        const errorData = await response.clone().json().catch(() => ({}));

        if (errorData.error === 'CSRF validation failed') {
          console.warn('CSRF token invalid, refetching...');
          await refetch();

          // Retry with new token
          const newToken = await fetchCSRFToken();
          if (newToken) {
            return fetch(input, withCSRFToken(newToken, init));
          }
        }
      }

      return response;
    },
    [token, refetch]
  );
}
