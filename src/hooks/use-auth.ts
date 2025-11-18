/**
 * useAuth Hook
 * Convenience hook for accessing auth context
 */

'use client';

import { useAuth as useAuthContext } from '@/components/auth/AuthProvider';

export { useAuthContext as useAuth };

// Re-export for convenience
export default useAuthContext;
