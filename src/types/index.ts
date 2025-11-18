/**
 * Shared TypeScript types for the LAB Visualizer application
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

/**
 * Filter operator types
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';

/**
 * Filter option
 */
export interface FilterOption {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Query parameters for data fetching
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: SortOption[];
  filters?: FilterOption[];
  search?: string;
}
