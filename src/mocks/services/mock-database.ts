/**
 * Mock Database Service
 * Mirrors Supabase Database interface for demo mode
 */

import type { Database, Json } from '@/types/database';

// Storage keys
const MOCK_DB_PREFIX = 'mock_db_';

// Type definitions
export interface MockQueryResult<T> {
  data: T | null;
  error: MockDatabaseError | null;
  count: number | null;
  status: number;
  statusText: string;
}

export interface MockDatabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

// Generic record type for tables not defined in Database types
type GenericRecord = Record<string, unknown>;

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Helper functions for localStorage
function getTableData<T extends TableName>(table: T): TableRow<T>[] {
  if (!isBrowser) return [];

  const stored = localStorage.getItem(`${MOCK_DB_PREFIX}${table}`);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function setTableData<T extends TableName>(table: T, data: TableRow<T>[]): void {
  if (!isBrowser) return;
  localStorage.setItem(`${MOCK_DB_PREFIX}${table}`, JSON.stringify(data));
}

// Generate a mock UUID
function generateMockId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create a database error
function createDbError(
  message: string,
  code: string = 'PGRST116',
  details: string = '',
  hint: string = ''
): MockDatabaseError {
  return { message, code, details, hint };
}

// Filter operators
type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'containedBy' | 'match';

interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

interface QueryOptions {
  filters: FilterCondition[];
  orderBy: { column: string; ascending: boolean }[];
  limitCount: number | null;
  offsetCount: number | null;
  selectColumns: string | null;
  single: boolean;
  maybeSingle: boolean;
  count: 'exact' | 'planned' | 'estimated' | null;
}

// Apply filter to a record
function applyFilter(record: GenericRecord, filter: FilterCondition): boolean {
  const value = record[filter.column];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'eq':
      return value === filterValue;
    case 'neq':
      return value !== filterValue;
    case 'gt':
      return typeof value === 'number' && typeof filterValue === 'number' && value > filterValue;
    case 'gte':
      return typeof value === 'number' && typeof filterValue === 'number' && value >= filterValue;
    case 'lt':
      return typeof value === 'number' && typeof filterValue === 'number' && value < filterValue;
    case 'lte':
      return typeof value === 'number' && typeof filterValue === 'number' && value <= filterValue;
    case 'like':
      if (typeof value !== 'string' || typeof filterValue !== 'string') return false;
      const likePattern = filterValue.replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${likePattern}$`).test(value);
    case 'ilike':
      if (typeof value !== 'string' || typeof filterValue !== 'string') return false;
      const ilikePattern = filterValue.replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${ilikePattern}$`, 'i').test(value);
    case 'is':
      if (filterValue === null) return value === null;
      return value === filterValue;
    case 'in':
      if (!Array.isArray(filterValue)) return false;
      return filterValue.includes(value);
    case 'contains':
      if (Array.isArray(value) && Array.isArray(filterValue)) {
        return filterValue.every((v) => value.includes(v));
      }
      return false;
    case 'containedBy':
      if (Array.isArray(value) && Array.isArray(filterValue)) {
        return value.every((v) => filterValue.includes(v));
      }
      return false;
    case 'match':
      if (typeof filterValue !== 'object' || filterValue === null) return false;
      return Object.entries(filterValue).every(([k, v]) => record[k] === v);
    default:
      return true;
  }
}

// Select specific columns from a record
function selectColumns(record: GenericRecord, columns: string | null): GenericRecord {
  if (!columns || columns === '*') return record;

  const result: GenericRecord = {};
  const columnList = columns.split(',').map((c) => c.trim());

  for (const col of columnList) {
    if (col.includes('(')) {
      // Handle nested selects (foreign key relations) - simplified
      const match = col.match(/^(\w+)\s*\((.*)\)$/);
      if (match) {
        const relationName = match[1];
        const subColumns = match[2];
        if (relationName) {
          const relationValue = record[relationName];
          if (relationValue && typeof relationValue === 'object') {
            result[relationName] = selectColumns(
              relationValue as GenericRecord,
              subColumns ?? null
            );
          } else {
            result[relationName] = relationValue;
          }
        }
      }
    } else {
      if (col in record) {
        result[col] = record[col];
      }
    }
  }

  return result;
}

/**
 * Mock Query Builder
 * Mimics Supabase's chainable query builder pattern
 */
export class MockQueryBuilder<T extends TableName> {
  private tableName: T;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  private options: QueryOptions;
  private insertData: TableInsert<T>[] | null = null;
  private updateData: TableUpdate<T> | null = null;
  private upsertOptions: { onConflict?: string } | null = null;

  constructor(tableName: T, operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select') {
    this.tableName = tableName;
    this.operation = operation;
    this.options = {
      filters: [],
      orderBy: [],
      limitCount: null,
      offsetCount: null,
      selectColumns: null,
      single: false,
      maybeSingle: false,
      count: null,
    };
  }

  // Select columns
  select(columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }): this {
    this.options.selectColumns = columns;
    this.operation = 'select';
    if (options?.count) {
      this.options.count = options.count;
    }
    return this;
  }

  // Insert data
  insert(data: TableInsert<T> | TableInsert<T>[]): this {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  // Update data
  update(data: TableUpdate<T>): this {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  // Delete records
  delete(): this {
    this.operation = 'delete';
    return this;
  }

  // Upsert data
  upsert(data: TableInsert<T> | TableInsert<T>[], options?: { onConflict?: string }): this {
    this.operation = 'upsert';
    this.insertData = Array.isArray(data) ? data : [data];
    this.upsertOptions = options || null;
    return this;
  }

  // Filter methods
  eq(column: string, value: unknown): this {
    this.options.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.options.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: number): this {
    this.options.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: number): this {
    this.options.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: number): this {
    this.options.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: number): this {
    this.options.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.options.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.options.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  is(column: string, value: null | boolean): this {
    this.options.filters.push({ column, operator: 'is', value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.options.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  contains(column: string, value: unknown[]): this {
    this.options.filters.push({ column, operator: 'contains', value });
    return this;
  }

  containedBy(column: string, value: unknown[]): this {
    this.options.filters.push({ column, operator: 'containedBy', value });
    return this;
  }

  match(query: Record<string, unknown>): this {
    this.options.filters.push({ column: '', operator: 'match', value: query });
    return this;
  }

  // Filtering using filter method
  filter(column: string, operator: string, value: unknown): this {
    this.options.filters.push({ column, operator: operator as FilterOperator, value });
    return this;
  }

  // Order results
  order(column: string, options?: { ascending?: boolean }): this {
    this.options.orderBy.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  // Limit results
  limit(count: number): this {
    this.options.limitCount = count;
    return this;
  }

  // Offset results (for pagination)
  range(from: number, to: number): this {
    this.options.offsetCount = from;
    this.options.limitCount = to - from + 1;
    return this;
  }

  // Single result
  single(): this {
    this.options.single = true;
    return this;
  }

  // Maybe single result
  maybeSingle(): this {
    this.options.maybeSingle = true;
    return this;
  }

  // Execute the query
  async then<TResult1 = MockQueryResult<TableRow<T>[] | TableRow<T> | null>, TResult2 = never>(
    onfulfilled?: ((value: MockQueryResult<TableRow<T>[] | TableRow<T> | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const result = this.execute();
      return onfulfilled ? onfulfilled(result) : result as unknown as TResult1;
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }

  private execute(): MockQueryResult<TableRow<T>[] | TableRow<T> | null> {
    let data = getTableData(this.tableName);
    const totalCount = data.length;

    switch (this.operation) {
      case 'select': {
        // Apply filters
        for (const filter of this.options.filters) {
          data = data.filter((record) => applyFilter(record as GenericRecord, filter));
        }

        // Apply ordering
        for (const order of this.options.orderBy) {
          data = data.sort((a, b) => {
            const aVal = (a as GenericRecord)[order.column];
            const bVal = (b as GenericRecord)[order.column];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return order.ascending ? comparison : -comparison;
          });
        }

        // Apply offset and limit
        if (this.options.offsetCount !== null) {
          data = data.slice(this.options.offsetCount);
        }
        if (this.options.limitCount !== null) {
          data = data.slice(0, this.options.limitCount);
        }

        // Apply column selection
        if (this.options.selectColumns) {
          data = data.map((record) =>
            selectColumns(record as GenericRecord, this.options.selectColumns) as TableRow<T>
          );
        }

        // Handle single/maybeSingle
        if (this.options.single) {
          if (data.length === 0) {
            return {
              data: null,
              error: createDbError('Row not found', 'PGRST116'),
              count: 0,
              status: 406,
              statusText: 'Not Acceptable',
            };
          }
          if (data.length > 1) {
            return {
              data: null,
              error: createDbError('Multiple rows returned', 'PGRST102'),
              count: data.length,
              status: 406,
              statusText: 'Not Acceptable',
            };
          }
          const singleResult = data[0];
          return {
            data: singleResult ?? null,
            error: null,
            count: 1,
            status: 200,
            statusText: 'OK',
          };
        }

        if (this.options.maybeSingle) {
          if (data.length === 0) {
            return {
              data: null,
              error: null,
              count: 0,
              status: 200,
              statusText: 'OK',
            };
          }
          if (data.length > 1) {
            return {
              data: null,
              error: createDbError('Multiple rows returned', 'PGRST102'),
              count: data.length,
              status: 406,
              statusText: 'Not Acceptable',
            };
          }
          const maybeSingleResult = data[0];
          return {
            data: maybeSingleResult ?? null,
            error: null,
            count: 1,
            status: 200,
            statusText: 'OK',
          };
        }

        return {
          data,
          error: null,
          count: this.options.count ? totalCount : null,
          status: 200,
          statusText: 'OK',
        };
      }

      case 'insert': {
        if (!this.insertData) {
          return {
            data: null,
            error: createDbError('No data to insert'),
            count: null,
            status: 400,
            statusText: 'Bad Request',
          };
        }

        const newRecords: TableRow<T>[] = this.insertData.map((record) => {
          const recordGeneric = record as GenericRecord;
          const newRecord = {
            ...record,
            id: recordGeneric['id'] || generateMockId(),
            created_at: recordGeneric['created_at'] || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as TableRow<T>;

          return newRecord;
        });

        data = [...data, ...newRecords];
        setTableData(this.tableName, data);

        if (this.options.single || newRecords.length === 1) {
          const firstRecord = newRecords[0];
          return {
            data: firstRecord ?? null,
            error: null,
            count: newRecords.length,
            status: 201,
            statusText: 'Created',
          };
        }

        return {
          data: newRecords,
          error: null,
          count: newRecords.length,
          status: 201,
          statusText: 'Created',
        };
      }

      case 'update': {
        if (!this.updateData) {
          return {
            data: null,
            error: createDbError('No data to update'),
            count: null,
            status: 400,
            statusText: 'Bad Request',
          };
        }

        let updatedRecords: TableRow<T>[] = [];

        data = data.map((record) => {
          const matches = this.options.filters.every((filter) =>
            applyFilter(record as GenericRecord, filter)
          );

          if (matches) {
            const updated = {
              ...record,
              ...this.updateData,
              updated_at: new Date().toISOString(),
            } as TableRow<T>;
            updatedRecords.push(updated);
            return updated;
          }

          return record;
        });

        setTableData(this.tableName, data);

        // Apply column selection if specified
        if (this.options.selectColumns) {
          updatedRecords = updatedRecords.map((record) =>
            selectColumns(record as GenericRecord, this.options.selectColumns) as TableRow<T>
          );
        }

        if (this.options.single) {
          if (updatedRecords.length === 0) {
            return {
              data: null,
              error: createDbError('Row not found', 'PGRST116'),
              count: 0,
              status: 406,
              statusText: 'Not Acceptable',
            };
          }
          const firstUpdated = updatedRecords[0];
          return {
            data: firstUpdated ?? null,
            error: null,
            count: updatedRecords.length,
            status: 200,
            statusText: 'OK',
          };
        }

        return {
          data: updatedRecords,
          error: null,
          count: updatedRecords.length,
          status: 200,
          statusText: 'OK',
        };
      }

      case 'delete': {
        const deletedRecords: TableRow<T>[] = [];

        data = data.filter((record) => {
          const matches = this.options.filters.every((filter) =>
            applyFilter(record as GenericRecord, filter)
          );

          if (matches) {
            deletedRecords.push(record);
            return false;
          }

          return true;
        });

        setTableData(this.tableName, data);

        return {
          data: deletedRecords,
          error: null,
          count: deletedRecords.length,
          status: 200,
          statusText: 'OK',
        };
      }

      case 'upsert': {
        if (!this.insertData) {
          return {
            data: null,
            error: createDbError('No data to upsert'),
            count: null,
            status: 400,
            statusText: 'Bad Request',
          };
        }

        const conflictColumn = this.upsertOptions?.onConflict || 'id';
        const upsertedRecords: TableRow<T>[] = [];

        for (const record of this.insertData) {
          const recordGeneric = record as GenericRecord;
          const recordValue = recordGeneric[conflictColumn];
          const existingIndex = data.findIndex(
            (r) => (r as GenericRecord)[conflictColumn] === recordValue
          );

          if (existingIndex >= 0) {
            const existingRecord = data[existingIndex];
            // Update existing
            const updated = {
              ...existingRecord,
              ...record,
              updated_at: new Date().toISOString(),
            } as TableRow<T>;
            data[existingIndex] = updated;
            upsertedRecords.push(updated);
          } else {
            // Insert new
            const newRecord = {
              ...record,
              id: recordGeneric['id'] || generateMockId(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as TableRow<T>;
            data.push(newRecord);
            upsertedRecords.push(newRecord);
          }
        }

        setTableData(this.tableName, data);

        const upsertResult = upsertedRecords.length === 1 ? (upsertedRecords[0] ?? null) : upsertedRecords;
        return {
          data: upsertResult,
          error: null,
          count: upsertedRecords.length,
          status: 200,
          statusText: 'OK',
        };
      }

      default:
        return {
          data: null,
          error: createDbError('Unknown operation'),
          count: null,
          status: 400,
          statusText: 'Bad Request',
        };
    }
  }
}

/**
 * Mock Database Service Class
 */
export class MockDatabaseService {
  /**
   * Start a query on a table
   */
  from<T extends TableName>(table: T): MockQueryBuilder<T> {
    return new MockQueryBuilder<T>(table);
  }

  /**
   * Execute a raw SQL query (mock - limited support)
   */
  async rpc<T = Json>(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: MockDatabaseError | null }> {
    console.log(`[MockDB] RPC call to ${fn}:`, params);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Return empty result for RPC calls
    return {
      data: null,
      error: createDbError(`RPC function '${fn}' not implemented in mock mode`),
    };
  }
}

// Export singleton instance
export const mockDatabaseService = new MockDatabaseService();

// Export factory function
export function createMockDatabase(): MockDatabaseService {
  return new MockDatabaseService();
}

// Initialize with demo data
export function initializeDemoData(): void {
  if (!isBrowser) return;

  // Check if already initialized
  const initialized = localStorage.getItem(`${MOCK_DB_PREFIX}_initialized`);
  if (initialized) return;

  // Add demo user profiles
  const demoProfiles: Database['public']['Tables']['user_profiles']['Row'][] = [
    {
      id: 'demo-user-001',
      username: 'demo_user',
      display_name: 'Demo User',
      bio: 'A demo user for testing the application',
      avatar_url: null,
      role: 'student',
      institution: 'Demo University',
      department: 'Biochemistry',
      research_interests: ['protein structures', 'molecular dynamics'],
      preferences: {},
      notification_settings: {},
      total_structures: 5,
      total_annotations: 12,
      total_sessions: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
    {
      id: 'demo-researcher-001',
      username: 'dr_smith',
      display_name: 'Dr. Jane Smith',
      bio: 'Protein researcher specializing in enzyme catalysis',
      avatar_url: null,
      role: 'researcher',
      institution: 'Research Institute',
      department: 'Structural Biology',
      research_interests: ['enzyme catalysis', 'drug design', 'crystallography'],
      preferences: {},
      notification_settings: {},
      total_structures: 25,
      total_annotations: 87,
      total_sessions: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
    {
      id: 'demo-educator-001',
      username: 'prof_jones',
      display_name: 'Prof. Michael Jones',
      bio: 'Professor of Biochemistry, teaching molecular biology',
      avatar_url: null,
      role: 'educator',
      institution: 'State University',
      department: 'Biochemistry Education',
      research_interests: ['science education', 'molecular visualization'],
      preferences: {},
      notification_settings: {},
      total_structures: 15,
      total_annotations: 45,
      total_sessions: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
  ];

  setTableData('user_profiles', demoProfiles);

  localStorage.setItem(`${MOCK_DB_PREFIX}_initialized`, 'true');
  console.log('[MockDB] Demo data initialized');
}
