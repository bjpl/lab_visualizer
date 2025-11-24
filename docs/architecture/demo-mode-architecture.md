# Demo Mode Architecture

## Overview

This document describes the architecture for a mock/demo mode that allows the LAB Visualizer application to run WITHOUT Supabase. The system uses a service abstraction layer that transparently switches between real Supabase services and mock implementations based on environment configuration.

```
+-------------------------------------------------------------------+
|                     Application Layer                              |
|  (Components, Hooks, Pages - NO CHANGES REQUIRED)                 |
+-------------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------------+
|                    Service Factory                                 |
|  NEXT_PUBLIC_DEMO_MODE=true  ->  Mock Services                    |
|  NEXT_PUBLIC_DEMO_MODE=false ->  Real Supabase Services           |
+-------------------------------------------------------------------+
                    /         |         \          \
                   v          v          v          v
+-------------+ +----------+ +----------+ +------------------+
| MockAuth    | | MockDB   | | MockStore| | MockRealtime    |
| Service     | | Service  | | Service  | | Service         |
+-------------+ +----------+ +----------+ +------------------+
       |              |            |               |
       v              v            v               v
+-------------------------------------------------------------------+
|                    Local Storage Layer                             |
|  localStorage (auth, sessions)  |  IndexedDB (large data)         |
+-------------------------------------------------------------------+
```

---

## Architecture Components

### 1. Service Factory Pattern

The ServiceFactory is the central orchestrator that determines which service implementation to use based on environment configuration.

```
src/services/
  factory/
    service-factory.ts      # Main factory
    service-types.ts        # Interface definitions
    demo-mode-config.ts     # Demo configuration
```

#### Interface Definitions

```typescript
// src/services/factory/service-types.ts

/**
 * Core service interfaces that both mock and real implementations must satisfy
 */

// ============================================
// Auth Service Interface
// ============================================
export interface IAuthService {
  // Authentication
  signUp(data: SignUpData): Promise<AuthResponse>;
  signIn(data: SignInData): Promise<AuthResponse>;
  signOut(): Promise<{ error: AuthError | null }>;
  signInWithMagicLink(data: MagicLinkData): Promise<{ error: AuthError | null }>;
  signInWithOAuth(data: OAuthProvider): Promise<{ error: AuthError | null; url?: string }>;

  // Password Management
  resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }>;
  updatePassword(data: UpdatePasswordData): Promise<{ error: AuthError | null }>;

  // Session Management
  getSession(): Promise<{ session: Session | null; error: AuthError | null }>;
  getUser(): Promise<{ user: User | null; error: AuthError | null }>;
  refreshSession(): Promise<{ session: Session | null; error: AuthError | null }>;

  // Profile Management
  getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }>;
  updateProfile(userId: string, data: Partial<ProfileData>): Promise<{ profile: any; error: any }>;

  // State Subscription
  onAuthStateChange(callback: AuthStateCallback): { data: { subscription: Subscription } };
}

// ============================================
// Database Service Interface
// ============================================
export interface IDatabaseService {
  // Query Builder
  from<T extends TableName>(table: T): QueryBuilder<T>;

  // Direct Operations
  select<T>(table: TableName, query: SelectQuery): Promise<QueryResult<T[]>>;
  insert<T>(table: TableName, data: InsertData<T>): Promise<QueryResult<T>>;
  update<T>(table: TableName, data: UpdateData<T>, filter: FilterQuery): Promise<QueryResult<T>>;
  delete(table: TableName, filter: FilterQuery): Promise<QueryResult<void>>;
  upsert<T>(table: TableName, data: InsertData<T>): Promise<QueryResult<T>>;

  // RPC Calls
  rpc(functionName: string, params: Record<string, any>): Promise<QueryResult<any>>;
}

// ============================================
// Storage Service Interface
// ============================================
export interface IStorageService {
  // Bucket Operations
  listBuckets(): Promise<{ data: Bucket[] | null; error: StorageError | null }>;
  createBucket(name: string, options?: BucketOptions): Promise<{ data: Bucket | null; error: StorageError | null }>;
  deleteBucket(name: string): Promise<{ error: StorageError | null }>;

  // File Operations
  from(bucket: string): StorageBucketApi;
}

export interface StorageBucketApi {
  upload(path: string, file: Blob | File, options?: UploadOptions): Promise<{ data: { path: string } | null; error: StorageError | null }>;
  download(path: string): Promise<{ data: Blob | null; error: StorageError | null }>;
  remove(paths: string[]): Promise<{ error: StorageError | null }>;
  list(path?: string, options?: ListOptions): Promise<{ data: FileObject[] | null; error: StorageError | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
}

// ============================================
// Realtime Service Interface
// ============================================
export interface IRealtimeService {
  channel(name: string, options?: ChannelOptions): IRealtimeChannel;
  removeChannel(channel: IRealtimeChannel): void;
  removeAllChannels(): void;
}

export interface IRealtimeChannel {
  on(event: string, filter: EventFilter, callback: EventCallback): this;
  subscribe(callback?: SubscribeCallback): this;
  unsubscribe(): void;
  send(message: BroadcastMessage): Promise<void>;
  track(payload: PresencePayload): Promise<void>;
  presenceState(): Record<string, PresencePayload[]>;
}
```

#### Service Factory Implementation

```typescript
// src/services/factory/service-factory.ts

import { IAuthService, IDatabaseService, IStorageService, IRealtimeService } from './service-types';

// Real implementations
import { AuthService } from '../auth-service';
import { createClient } from '@/lib/supabase/client';

// Mock implementations
import { MockAuthService } from '../mock/mock-auth-service';
import { MockDatabaseService } from '../mock/mock-database-service';
import { MockStorageService } from '../mock/mock-storage-service';
import { MockRealtimeService } from '../mock/mock-realtime-service';

/**
 * Determines if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Service Factory - Returns appropriate service implementations
 * based on demo mode configuration
 */
class ServiceFactory {
  private static instance: ServiceFactory;
  private authService: IAuthService | null = null;
  private databaseService: IDatabaseService | null = null;
  private storageService: IStorageService | null = null;
  private realtimeService: IRealtimeService | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Initialize services based on mode
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const demoMode = isDemoMode();
    console.log(`[ServiceFactory] Initializing in ${demoMode ? 'DEMO' : 'PRODUCTION'} mode`);

    if (demoMode) {
      // Initialize mock services
      this.authService = new MockAuthService();
      this.databaseService = new MockDatabaseService();
      this.storageService = new MockStorageService();
      this.realtimeService = new MockRealtimeService();

      // Load demo data
      await this.loadDemoData();
    } else {
      // Initialize real Supabase services
      const supabase = createClient();
      this.authService = new AuthService();
      this.databaseService = new SupabaseDatabaseAdapter(supabase);
      this.storageService = new SupabaseStorageAdapter(supabase);
      this.realtimeService = new SupabaseRealtimeAdapter(supabase);
    }

    this.initialized = true;
  }

  /**
   * Get Auth Service
   */
  getAuthService(): IAuthService {
    if (!this.authService) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.authService;
  }

  /**
   * Get Database Service
   */
  getDatabaseService(): IDatabaseService {
    if (!this.databaseService) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.databaseService;
  }

  /**
   * Get Storage Service
   */
  getStorageService(): IStorageService {
    if (!this.storageService) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.storageService;
  }

  /**
   * Get Realtime Service
   */
  getRealtimeService(): IRealtimeService {
    if (!this.realtimeService) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.realtimeService;
  }

  /**
   * Load demo data into mock services
   */
  private async loadDemoData(): Promise<void> {
    const demoData = await import('./demo-data');

    if (this.databaseService instanceof MockDatabaseService) {
      await this.databaseService.seedData(demoData.default);
    }
  }

  /**
   * Reset all services (useful for testing)
   */
  reset(): void {
    this.authService = null;
    this.databaseService = null;
    this.storageService = null;
    this.realtimeService = null;
    this.initialized = false;
  }
}

// Export singleton
export const serviceFactory = ServiceFactory.getInstance();

// Convenience exports
export const getAuthService = () => serviceFactory.getAuthService();
export const getDatabaseService = () => serviceFactory.getDatabaseService();
export const getStorageService = () => serviceFactory.getStorageService();
export const getRealtimeService = () => serviceFactory.getRealtimeService();
```

---

### 2. MockAuthService

Handles demo authentication with localStorage-based session management.

```
src/services/mock/
  mock-auth-service.ts
```

#### Architecture Diagram

```
+----------------------------------+
|       MockAuthService            |
+----------------------------------+
| - users: Map<email, DemoUser>    |
| - sessions: Map<token, Session>  |
| - currentSession: Session        |
| - subscribers: Set<Callback>     |
+----------------------------------+
              |
              v
+----------------------------------+
|        LocalStorage              |
+----------------------------------+
| demo_auth_session                |
| demo_auth_users                  |
| demo_auth_profiles               |
+----------------------------------+
```

#### Implementation Design

```typescript
// src/services/mock/mock-auth-service.ts

import { IAuthService, AuthResponse, SignUpData, SignInData } from '../factory/service-types';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';

const STORAGE_KEYS = {
  SESSION: 'demo_auth_session',
  USERS: 'demo_auth_users',
  PROFILES: 'demo_auth_profiles',
};

// Demo users for immediate testing
const DEMO_USERS = {
  'demo@lab-visualizer.com': {
    id: 'demo-user-001',
    email: 'demo@lab-visualizer.com',
    password: 'demo123456',
    role: 'researcher' as const,
  },
  'student@lab-visualizer.com': {
    id: 'demo-user-002',
    email: 'student@lab-visualizer.com',
    password: 'student123',
    role: 'student' as const,
  },
  'educator@lab-visualizer.com': {
    id: 'demo-user-003',
    email: 'educator@lab-visualizer.com',
    password: 'educator123',
    role: 'educator' as const,
  },
};

export class MockAuthService implements IAuthService {
  private storage: LocalStorageAdapter;
  private subscribers: Set<AuthStateCallback> = new Set();
  private currentSession: MockSession | null = null;

  constructor() {
    this.storage = new LocalStorageAdapter();
    this.initializeDemoUsers();
    this.restoreSession();
  }

  /**
   * Initialize demo users in storage
   */
  private initializeDemoUsers(): void {
    const existingUsers = this.storage.get<Record<string, DemoUser>>(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      this.storage.set(STORAGE_KEYS.USERS, DEMO_USERS);
    }
  }

  /**
   * Restore session from storage
   */
  private restoreSession(): void {
    const savedSession = this.storage.get<MockSession>(STORAGE_KEYS.SESSION);
    if (savedSession && this.isSessionValid(savedSession)) {
      this.currentSession = savedSession;
    }
  }

  /**
   * Check if session is still valid
   */
  private isSessionValid(session: MockSession): boolean {
    return session.expires_at > Date.now();
  }

  /**
   * Generate mock JWT token
   */
  private generateToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: this.currentSession?.user.id,
      exp: Date.now() + 3600000,
      iat: Date.now(),
    }));
    const signature = btoa(Math.random().toString(36).substring(2));
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Notify all subscribers of auth state change
   */
  private notifySubscribers(event: string): void {
    this.subscribers.forEach(callback => {
      callback(event, this.currentSession);
    });
  }

  // ============================================
  // IAuthService Implementation
  // ============================================

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const users = this.storage.get<Record<string, DemoUser>>(STORAGE_KEYS.USERS) || {};

    // Check if email exists
    if (users[data.email]) {
      return {
        user: null,
        session: null,
        error: { message: 'User already exists', status: 400 } as AuthError,
      };
    }

    // Create new user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newUser: DemoUser = {
      id: userId,
      email: data.email,
      password: data.password, // In demo mode, store plaintext (NOT for production!)
      role: data.role || 'student',
    };

    users[data.email] = newUser;
    this.storage.set(STORAGE_KEYS.USERS, users);

    // Create profile
    const profiles = this.storage.get<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES) || {};
    profiles[userId] = {
      id: userId,
      username: data.username,
      display_name: data.displayName,
      role: data.role || 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_structures: 0,
      total_annotations: 0,
      total_sessions: 0,
    };
    this.storage.set(STORAGE_KEYS.PROFILES, profiles);

    // Auto sign in
    return this.signIn({ email: data.email, password: data.password });
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    const users = this.storage.get<Record<string, DemoUser>>(STORAGE_KEYS.USERS) || {};
    const user = users[data.email];

    if (!user || user.password !== data.password) {
      return {
        user: null,
        session: null,
        error: { message: 'Invalid credentials', status: 401 } as AuthError,
      };
    }

    // Create session
    const session: MockSession = {
      access_token: this.generateToken(),
      refresh_token: this.generateToken(),
      expires_at: Date.now() + 3600000, // 1 hour
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: {
          username: user.email.split('@')[0],
          display_name: user.email.split('@')[0],
        },
      },
    };

    this.currentSession = session;
    this.storage.set(STORAGE_KEYS.SESSION, session);

    // Update last login
    const profiles = this.storage.get<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES) || {};
    if (profiles[user.id]) {
      profiles[user.id].last_login = new Date().toISOString();
      this.storage.set(STORAGE_KEYS.PROFILES, profiles);
    }

    this.notifySubscribers('SIGNED_IN');

    return {
      user: session.user,
      session,
      error: null,
    };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    this.currentSession = null;
    this.storage.remove(STORAGE_KEYS.SESSION);
    this.notifySubscribers('SIGNED_OUT');
    return { error: null };
  }

  async signInWithMagicLink(data: MagicLinkData): Promise<{ error: AuthError | null }> {
    // In demo mode, simulate magic link by auto-signing in
    console.log(`[Demo] Magic link sent to ${data.email} (simulated)`);

    // Auto sign in if user exists
    const users = this.storage.get<Record<string, DemoUser>>(STORAGE_KEYS.USERS) || {};
    if (users[data.email]) {
      await this.signIn({ email: data.email, password: users[data.email].password });
    }

    return { error: null };
  }

  async signInWithOAuth(data: OAuthProvider): Promise<{ error: AuthError | null; url?: string }> {
    // In demo mode, simulate OAuth by signing in as demo user
    console.log(`[Demo] OAuth with ${data.provider} (simulated)`);

    await this.signIn({ email: 'demo@lab-visualizer.com', password: 'demo123456' });

    return { error: null };
  }

  async resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }> {
    console.log(`[Demo] Password reset email sent to ${data.email} (simulated)`);
    return { error: null };
  }

  async updatePassword(data: UpdatePasswordData): Promise<{ error: AuthError | null }> {
    if (!this.currentSession) {
      return { error: { message: 'Not authenticated', status: 401 } as AuthError };
    }

    const users = this.storage.get<Record<string, DemoUser>>(STORAGE_KEYS.USERS) || {};
    const userEmail = this.currentSession.user.email;

    if (users[userEmail]) {
      users[userEmail].password = data.password;
      this.storage.set(STORAGE_KEYS.USERS, users);
    }

    return { error: null };
  }

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    if (this.currentSession && this.isSessionValid(this.currentSession)) {
      return { session: this.currentSession, error: null };
    }
    return { session: null, error: null };
  }

  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    if (this.currentSession && this.isSessionValid(this.currentSession)) {
      return { user: this.currentSession.user, error: null };
    }
    return { user: null, error: null };
  }

  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    if (this.currentSession) {
      this.currentSession.expires_at = Date.now() + 3600000;
      this.currentSession.access_token = this.generateToken();
      this.storage.set(STORAGE_KEYS.SESSION, this.currentSession);
      return { session: this.currentSession, error: null };
    }
    return { session: null, error: null };
  }

  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
    const profiles = this.storage.get<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES) || {};
    const profile = profiles[userId];
    return { profile: profile || null, error: profile ? null : 'Profile not found' };
  }

  async updateProfile(userId: string, data: Partial<ProfileData>): Promise<{ profile: any; error: any }> {
    const profiles = this.storage.get<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES) || {};

    if (!profiles[userId]) {
      return { profile: null, error: 'Profile not found' };
    }

    profiles[userId] = {
      ...profiles[userId],
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.storage.set(STORAGE_KEYS.PROFILES, profiles);
    return { profile: profiles[userId], error: null };
  }

  onAuthStateChange(callback: AuthStateCallback): { data: { subscription: Subscription } } {
    this.subscribers.add(callback);

    // Immediately call with current state
    if (this.currentSession) {
      callback('INITIAL_SESSION', this.currentSession);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.subscribers.delete(callback);
          },
        },
      },
    };
  }
}
```

---

### 3. MockDatabaseService

Handles CRUD operations with localStorage and IndexedDB for larger datasets.

```
src/services/mock/
  mock-database-service.ts
  adapters/
    indexed-db-adapter.ts
    local-storage-adapter.ts
```

#### Architecture Diagram

```
+------------------------------------------+
|          MockDatabaseService             |
+------------------------------------------+
| - tables: Map<TableName, TableData[]>    |
| - indexedDB: IndexedDBAdapter            |
| - localStorage: LocalStorageAdapter      |
+------------------------------------------+
           |                    |
           v                    v
+------------------+  +--------------------+
| LocalStorage     |  | IndexedDB          |
+------------------+  +--------------------+
| Small data       |  | Large datasets     |
| < 5MB total      |  | > 5MB              |
| User prefs       |  | Structures data    |
| Session data     |  | Simulation results |
+------------------+  +--------------------+
```

#### Query Builder Pattern

```typescript
// src/services/mock/mock-database-service.ts

import { IDatabaseService, QueryBuilder, QueryResult } from '../factory/service-types';
import { IndexedDBAdapter } from './adapters/indexed-db-adapter';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';

const DB_NAME = 'lab_visualizer_demo';
const DB_VERSION = 1;

// Tables that use IndexedDB (large data)
const INDEXED_DB_TABLES = [
  'structures',
  'simulation_results',
  'molecular_data',
  'learning_content',
];

// Tables that use localStorage (small data)
const LOCAL_STORAGE_TABLES = [
  'user_profiles',
  'collaboration_sessions',
  'session_users',
  'user_progress',
  'content_reviews',
  'md_jobs',
];

export class MockDatabaseService implements IDatabaseService {
  private indexedDB: IndexedDBAdapter;
  private localStorage: LocalStorageAdapter;
  private initialized = false;

  constructor() {
    this.indexedDB = new IndexedDBAdapter(DB_NAME, DB_VERSION);
    this.localStorage = new LocalStorageAdapter();
  }

  /**
   * Initialize database with schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.indexedDB.initialize(INDEXED_DB_TABLES);
    this.initialized = true;
  }

  /**
   * Seed demo data
   */
  async seedData(demoData: DemoDataSet): Promise<void> {
    for (const [tableName, records] of Object.entries(demoData)) {
      if (INDEXED_DB_TABLES.includes(tableName)) {
        await this.indexedDB.bulkInsert(tableName, records);
      } else {
        const existing = this.localStorage.get<any[]>(`demo_db_${tableName}`) || [];
        if (existing.length === 0) {
          this.localStorage.set(`demo_db_${tableName}`, records);
        }
      }
    }
  }

  /**
   * Get appropriate storage adapter for table
   */
  private getAdapter(table: string): StorageAdapter {
    return INDEXED_DB_TABLES.includes(table) ? this.indexedDB : this.localStorage;
  }

  /**
   * Query builder factory
   */
  from<T extends TableName>(table: T): MockQueryBuilder<T> {
    return new MockQueryBuilder<T>(this, table);
  }

  /**
   * Direct select operation
   */
  async select<T>(table: TableName, query: SelectQuery = {}): Promise<QueryResult<T[]>> {
    try {
      const adapter = this.getAdapter(table);
      let data: T[];

      if (adapter instanceof IndexedDBAdapter) {
        data = await adapter.getAll<T>(table);
      } else {
        data = adapter.get<T[]>(`demo_db_${table}`) || [];
      }

      // Apply filters
      if (query.filters) {
        data = this.applyFilters(data, query.filters);
      }

      // Apply ordering
      if (query.orderBy) {
        data = this.applyOrdering(data, query.orderBy);
      }

      // Apply pagination
      if (query.limit !== undefined || query.offset !== undefined) {
        const start = query.offset || 0;
        const end = query.limit ? start + query.limit : undefined;
        data = data.slice(start, end);
      }

      // Select specific columns
      if (query.columns && query.columns !== '*') {
        data = data.map(row => this.selectColumns(row, query.columns as string[]));
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Insert operation
   */
  async insert<T>(table: TableName, data: InsertData<T>): Promise<QueryResult<T>> {
    try {
      const adapter = this.getAdapter(table);
      const record = {
        ...data,
        id: data.id || `${table}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;

      if (adapter instanceof IndexedDBAdapter) {
        await adapter.put(table, record);
      } else {
        const existing = adapter.get<T[]>(`demo_db_${table}`) || [];
        existing.push(record);
        adapter.set(`demo_db_${table}`, existing);
      }

      return { data: record, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update operation
   */
  async update<T>(table: TableName, data: UpdateData<T>, filter: FilterQuery): Promise<QueryResult<T>> {
    try {
      const adapter = this.getAdapter(table);
      let records: T[];

      if (adapter instanceof IndexedDBAdapter) {
        records = await adapter.getAll<T>(table);
      } else {
        records = adapter.get<T[]>(`demo_db_${table}`) || [];
      }

      const filtered = this.applyFilters(records, filter);
      if (filtered.length === 0) {
        return { data: null, error: { message: 'No matching records found' } };
      }

      const updatedRecord = {
        ...filtered[0],
        ...data,
        updated_at: new Date().toISOString(),
      } as T;

      // Update in storage
      const index = records.findIndex(r => (r as any).id === (filtered[0] as any).id);
      records[index] = updatedRecord;

      if (adapter instanceof IndexedDBAdapter) {
        await adapter.put(table, updatedRecord);
      } else {
        adapter.set(`demo_db_${table}`, records);
      }

      return { data: updatedRecord, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete operation
   */
  async delete(table: TableName, filter: FilterQuery): Promise<QueryResult<void>> {
    try {
      const adapter = this.getAdapter(table);
      let records: any[];

      if (adapter instanceof IndexedDBAdapter) {
        records = await adapter.getAll(table);
      } else {
        records = adapter.get<any[]>(`demo_db_${table}`) || [];
      }

      const toDelete = this.applyFilters(records, filter);
      const remaining = records.filter(r => !toDelete.includes(r));

      if (adapter instanceof IndexedDBAdapter) {
        for (const record of toDelete) {
          await adapter.delete(table, record.id);
        }
      } else {
        adapter.set(`demo_db_${table}`, remaining);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Upsert operation
   */
  async upsert<T>(table: TableName, data: InsertData<T>): Promise<QueryResult<T>> {
    const existing = await this.select<T>(table, {
      filters: { id: { eq: (data as any).id } }
    });

    if (existing.data && existing.data.length > 0) {
      return this.update(table, data, { id: { eq: (data as any).id } });
    }

    return this.insert(table, data);
  }

  /**
   * RPC call simulation
   */
  async rpc(functionName: string, params: Record<string, any>): Promise<QueryResult<any>> {
    // Simulate common RPC functions
    switch (functionName) {
      case 'increment':
        return this.rpcIncrement(params);
      default:
        console.warn(`[MockDB] RPC function '${functionName}' not implemented`);
        return { data: null, error: null };
    }
  }

  private async rpcIncrement(params: { table_name: string; column_name: string; row_id: string }): Promise<QueryResult<any>> {
    const { table_name, column_name, row_id } = params;

    const result = await this.select<any>(table_name as TableName, {
      filters: { id: { eq: row_id } }
    });

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      record[column_name] = (record[column_name] || 0) + 1;

      return this.update(table_name as TableName, record, { id: { eq: row_id } });
    }

    return { data: null, error: null };
  }

  // ============================================
  // Filter and Query Helpers
  // ============================================

  private applyFilters<T>(data: T[], filters: FilterQuery): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, condition]) => {
        const value = (item as any)[key];

        if (typeof condition === 'object' && condition !== null) {
          if ('eq' in condition) return value === condition.eq;
          if ('neq' in condition) return value !== condition.neq;
          if ('gt' in condition) return value > condition.gt;
          if ('gte' in condition) return value >= condition.gte;
          if ('lt' in condition) return value < condition.lt;
          if ('lte' in condition) return value <= condition.lte;
          if ('like' in condition) {
            const pattern = condition.like.replace(/%/g, '.*');
            return new RegExp(pattern, 'i').test(value);
          }
          if ('ilike' in condition) {
            const pattern = condition.ilike.replace(/%/g, '.*');
            return new RegExp(pattern, 'i').test(value);
          }
          if ('in' in condition) return condition.in.includes(value);
          if ('contains' in condition) {
            return Array.isArray(value) && condition.contains.some((c: any) => value.includes(c));
          }
          if ('overlaps' in condition) {
            return Array.isArray(value) && condition.overlaps.some((c: any) => value.includes(c));
          }
        }

        return value === condition;
      });
    });
  }

  private applyOrdering<T>(data: T[], orderBy: OrderByClause): T[] {
    return [...data].sort((a, b) => {
      for (const { column, ascending } of orderBy) {
        const aVal = (a as any)[column];
        const bVal = (b as any)[column];

        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
      }
      return 0;
    });
  }

  private selectColumns<T>(row: T, columns: string[]): T {
    const result: any = {};
    for (const col of columns) {
      if (col in (row as any)) {
        result[col] = (row as any)[col];
      }
    }
    return result as T;
  }
}

/**
 * Chainable Query Builder
 */
class MockQueryBuilder<T extends TableName> implements QueryBuilder<T> {
  private service: MockDatabaseService;
  private table: T;
  private query: SelectQuery = {};
  private insertData: any = null;
  private updateData: any = null;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';

  constructor(service: MockDatabaseService, table: T) {
    this.service = service;
    this.table = table;
  }

  select(columns: string | string[] = '*'): this {
    this.operation = 'select';
    this.query.columns = Array.isArray(columns) ? columns : columns;
    return this;
  }

  insert(data: any): this {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any): this {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  upsert(data: any): this {
    this.operation = 'upsert';
    this.insertData = data;
    return this;
  }

  eq(column: string, value: any): this {
    this.query.filters = this.query.filters || {};
    this.query.filters[column] = { eq: value };
    return this;
  }

  neq(column: string, value: any): this {
    this.query.filters = this.query.filters || {};
    this.query.filters[column] = { neq: value };
    return this;
  }

  in(column: string, values: any[]): this {
    this.query.filters = this.query.filters || {};
    this.query.filters[column] = { in: values };
    return this;
  }

  contains(column: string, values: any[]): this {
    this.query.filters = this.query.filters || {};
    this.query.filters[column] = { contains: values };
    return this;
  }

  overlaps(column: string, values: any[]): this {
    this.query.filters = this.query.filters || {};
    this.query.filters[column] = { overlaps: values };
    return this;
  }

  or(conditions: string): this {
    // Parse OR conditions (simplified)
    console.warn('[MockDB] Complex OR conditions not fully implemented');
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    this.query.orderBy = this.query.orderBy || [];
    this.query.orderBy.push({ column, ascending: options.ascending ?? true });
    return this;
  }

  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  range(from: number, to: number): this {
    this.query.offset = from;
    this.query.limit = to - from + 1;
    return this;
  }

  single(): this {
    this.query.limit = 1;
    this.query.single = true;
    return this;
  }

  async then<TResult>(
    onfulfilled?: (value: QueryResult<any>) => TResult
  ): Promise<TResult> {
    let result: QueryResult<any>;

    switch (this.operation) {
      case 'select':
        result = await this.service.select(this.table, this.query);
        if (this.query.single && result.data) {
          result.data = result.data[0] || null;
        }
        break;
      case 'insert':
        result = await this.service.insert(this.table, this.insertData);
        break;
      case 'update':
        result = await this.service.update(this.table, this.updateData, this.query.filters || {});
        break;
      case 'delete':
        result = await this.service.delete(this.table, this.query.filters || {});
        break;
      case 'upsert':
        result = await this.service.upsert(this.table, this.insertData);
        break;
      default:
        result = { data: null, error: 'Unknown operation' };
    }

    return onfulfilled ? onfulfilled(result) : result as any;
  }
}
```

---

### 4. MockStorageService

Handles file storage simulation using IndexedDB for blobs and base64 encoding.

```
src/services/mock/
  mock-storage-service.ts
```

#### Architecture Diagram

```
+------------------------------------------+
|          MockStorageService              |
+------------------------------------------+
| - buckets: Map<string, BucketConfig>     |
| - files: IndexedDB (blob store)          |
+------------------------------------------+
              |
              v
+------------------------------------------+
|          IndexedDB Blob Store            |
+------------------------------------------+
| store: demo_storage_files                |
| index: by bucket, path                   |
+------------------------------------------+
              |
              v
+------------------------------------------+
|          File Record Structure           |
+------------------------------------------+
| {                                        |
|   id: "bucket/path/file.ext",           |
|   bucket: "bucket-name",                 |
|   path: "path/file.ext",                 |
|   blob: Blob,                            |
|   metadata: {...},                       |
|   created_at: timestamp,                 |
|   updated_at: timestamp                  |
| }                                        |
+------------------------------------------+
```

#### Implementation Design

```typescript
// src/services/mock/mock-storage-service.ts

import { IStorageService, StorageBucketApi } from '../factory/service-types';
import { IndexedDBAdapter } from './adapters/indexed-db-adapter';

const STORAGE_DB = 'lab_visualizer_storage';
const FILES_STORE = 'files';
const BUCKETS_STORE = 'buckets';

export class MockStorageService implements IStorageService {
  private db: IndexedDBAdapter;
  private buckets: Map<string, BucketConfig> = new Map();

  constructor() {
    this.db = new IndexedDBAdapter(STORAGE_DB, 1);
  }

  async initialize(): Promise<void> {
    await this.db.initialize([FILES_STORE, BUCKETS_STORE]);
    await this.loadBuckets();
  }

  private async loadBuckets(): Promise<void> {
    const savedBuckets = await this.db.getAll<BucketConfig>(BUCKETS_STORE);
    savedBuckets.forEach(bucket => {
      this.buckets.set(bucket.name, bucket);
    });

    // Create default buckets
    const defaultBuckets = ['cache-storage', 'md-structures', 'user-uploads'];
    for (const name of defaultBuckets) {
      if (!this.buckets.has(name)) {
        await this.createBucket(name);
      }
    }
  }

  async listBuckets(): Promise<{ data: Bucket[] | null; error: StorageError | null }> {
    const buckets = Array.from(this.buckets.values()).map(b => ({
      id: b.name,
      name: b.name,
      public: b.public,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
    return { data: buckets, error: null };
  }

  async createBucket(name: string, options?: BucketOptions): Promise<{ data: Bucket | null; error: StorageError | null }> {
    if (this.buckets.has(name)) {
      return { data: null, error: { message: 'Bucket already exists', statusCode: 409 } };
    }

    const bucket: BucketConfig = {
      name,
      public: options?.public ?? false,
      fileSizeLimit: options?.fileSizeLimit ?? 50 * 1024 * 1024, // 50MB default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.put(BUCKETS_STORE, bucket);
    this.buckets.set(name, bucket);

    return { data: { id: name, name, ...bucket }, error: null };
  }

  async deleteBucket(name: string): Promise<{ error: StorageError | null }> {
    if (!this.buckets.has(name)) {
      return { error: { message: 'Bucket not found', statusCode: 404 } };
    }

    // Delete all files in bucket
    const files = await this.db.getAll<FileRecord>(FILES_STORE);
    const bucketFiles = files.filter(f => f.bucket === name);
    for (const file of bucketFiles) {
      await this.db.delete(FILES_STORE, file.id);
    }

    await this.db.delete(BUCKETS_STORE, name);
    this.buckets.delete(name);

    return { error: null };
  }

  from(bucket: string): MockStorageBucketApi {
    return new MockStorageBucketApi(this.db, bucket, this.buckets.get(bucket));
  }
}

/**
 * Bucket API for file operations
 */
class MockStorageBucketApi implements StorageBucketApi {
  private db: IndexedDBAdapter;
  private bucketName: string;
  private bucketConfig: BucketConfig | undefined;

  constructor(db: IndexedDBAdapter, bucketName: string, config?: BucketConfig) {
    this.db = db;
    this.bucketName = bucketName;
    this.bucketConfig = config;
  }

  async upload(
    path: string,
    file: Blob | File,
    options?: UploadOptions
  ): Promise<{ data: { path: string } | null; error: StorageError | null }> {
    try {
      // Check file size limit
      if (this.bucketConfig?.fileSizeLimit && file.size > this.bucketConfig.fileSizeLimit) {
        return {
          data: null,
          error: { message: 'File size exceeds limit', statusCode: 413 },
        };
      }

      const fileId = `${this.bucketName}/${path}`;

      // Check if file exists (for upsert behavior)
      const existing = await this.db.get<FileRecord>(FILES_STORE, fileId);
      if (existing && !options?.upsert) {
        return {
          data: null,
          error: { message: 'File already exists', statusCode: 409 },
        };
      }

      const fileRecord: FileRecord = {
        id: fileId,
        bucket: this.bucketName,
        path,
        blob: file,
        size: file.size,
        contentType: options?.contentType || file.type || 'application/octet-stream',
        metadata: options?.metadata || {},
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await this.db.put(FILES_STORE, fileRecord);

      return { data: { path }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: (error as Error).message, statusCode: 500 },
      };
    }
  }

  async download(path: string): Promise<{ data: Blob | null; error: StorageError | null }> {
    try {
      const fileId = `${this.bucketName}/${path}`;
      const file = await this.db.get<FileRecord>(FILES_STORE, fileId);

      if (!file) {
        return { data: null, error: { message: 'File not found', statusCode: 404 } };
      }

      return { data: file.blob, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: (error as Error).message, statusCode: 500 },
      };
    }
  }

  async remove(paths: string[]): Promise<{ error: StorageError | null }> {
    try {
      for (const path of paths) {
        const fileId = `${this.bucketName}/${path}`;
        await this.db.delete(FILES_STORE, fileId);
      }
      return { error: null };
    } catch (error) {
      return { error: { message: (error as Error).message, statusCode: 500 } };
    }
  }

  async list(
    path?: string,
    options?: ListOptions
  ): Promise<{ data: FileObject[] | null; error: StorageError | null }> {
    try {
      const files = await this.db.getAll<FileRecord>(FILES_STORE);

      let bucketFiles = files.filter(f => f.bucket === this.bucketName);

      // Filter by path prefix
      if (path) {
        bucketFiles = bucketFiles.filter(f => f.path.startsWith(path));
      }

      // Apply pagination
      if (options?.limit) {
        const offset = options.offset || 0;
        bucketFiles = bucketFiles.slice(offset, offset + options.limit);
      }

      const result: FileObject[] = bucketFiles.map(f => ({
        name: f.path.split('/').pop() || f.path,
        id: f.id,
        bucket_id: this.bucketName,
        created_at: f.created_at,
        updated_at: f.updated_at,
        last_accessed_at: f.updated_at,
        metadata: f.metadata,
      }));

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: (error as Error).message, statusCode: 500 },
      };
    }
  }

  getPublicUrl(path: string): { data: { publicUrl: string } } {
    // Generate a data URL or blob URL in demo mode
    const publicUrl = `demo://storage/${this.bucketName}/${path}`;
    return { data: { publicUrl } };
  }
}
```

---

### 5. MockRealtimeService

Simulates realtime subscriptions using browser events and timers.

```
src/services/mock/
  mock-realtime-service.ts
```

#### Architecture Diagram

```
+------------------------------------------+
|         MockRealtimeService              |
+------------------------------------------+
| - channels: Map<name, MockChannel>       |
| - eventBus: BroadcastChannel             |
| - presenceState: Map<userId, data>       |
+------------------------------------------+
              |
              v
+------------------------------------------+
|         BroadcastChannel API             |
+------------------------------------------+
| Cross-tab communication for demo mode    |
| Simulates multi-user collaboration       |
+------------------------------------------+
              |
              v
+------------------------------------------+
|         Event Emitter Pattern            |
+------------------------------------------+
| on(event, callback)                      |
| emit(event, payload)                     |
| Simulates Supabase realtime events       |
+------------------------------------------+
```

#### Implementation Design

```typescript
// src/services/mock/mock-realtime-service.ts

import { IRealtimeService, IRealtimeChannel } from '../factory/service-types';

export class MockRealtimeService implements IRealtimeService {
  private channels: Map<string, MockRealtimeChannel> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Use BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('lab_visualizer_demo_realtime');
      this.broadcastChannel.onmessage = this.handleCrossTabMessage.bind(this);
    }
  }

  private handleCrossTabMessage(event: MessageEvent): void {
    const { channelName, type, payload } = event.data;
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.handleExternalEvent(type, payload);
    }
  }

  channel(name: string, options?: ChannelOptions): MockRealtimeChannel {
    if (this.channels.has(name)) {
      return this.channels.get(name)!;
    }

    const channel = new MockRealtimeChannel(name, options, this.broadcastChannel);
    this.channels.set(name, channel);
    return channel;
  }

  removeChannel(channel: IRealtimeChannel): void {
    if (channel instanceof MockRealtimeChannel) {
      channel.unsubscribe();
      this.channels.delete(channel.getName());
    }
  }

  removeAllChannels(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

/**
 * Mock Realtime Channel
 */
class MockRealtimeChannel implements IRealtimeChannel {
  private name: string;
  private options: ChannelOptions | undefined;
  private broadcastChannel: BroadcastChannel | null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private presenceState: Map<string, PresencePayload[]> = new Map();
  private subscribed = false;
  private subscribeCallbacks: SubscribeCallback[] = [];

  constructor(name: string, options?: ChannelOptions, broadcast?: BroadcastChannel | null) {
    this.name = name;
    this.options = options;
    this.broadcastChannel = broadcast || null;
  }

  getName(): string {
    return this.name;
  }

  on(event: string, filter: EventFilter | EventCallback, callback?: EventCallback): this {
    // Handle both (event, filter, callback) and (event, callback) signatures
    const actualCallback = typeof filter === 'function' ? filter : callback!;
    const eventKey = typeof filter === 'object' ? `${event}:${filter.event || '*'}` : event;

    if (!this.eventListeners.has(eventKey)) {
      this.eventListeners.set(eventKey, new Set());
    }
    this.eventListeners.get(eventKey)!.add(actualCallback);

    return this;
  }

  subscribe(callback?: SubscribeCallback): this {
    if (callback) {
      this.subscribeCallbacks.push(callback);
    }

    // Simulate async subscription
    setTimeout(() => {
      this.subscribed = true;
      this.subscribeCallbacks.forEach(cb => cb('SUBSCRIBED'));
    }, 10);

    return this;
  }

  unsubscribe(): void {
    this.subscribed = false;
    this.eventListeners.clear();
    this.presenceState.clear();
    this.subscribeCallbacks.forEach(cb => cb('CLOSED'));
    this.subscribeCallbacks = [];
  }

  async send(message: BroadcastMessage): Promise<void> {
    if (!this.subscribed) {
      throw new Error('Channel not subscribed');
    }

    // Emit locally
    this.emit(message.event, message.payload);

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        channelName: this.name,
        type: message.event,
        payload: message.payload,
      });
    }
  }

  async track(payload: PresencePayload): Promise<void> {
    const key = this.options?.config?.presence?.key || 'anonymous';

    if (!this.presenceState.has(key)) {
      this.presenceState.set(key, []);
    }

    this.presenceState.get(key)!.push(payload);

    // Emit presence sync event
    this.emit('presence:sync', { state: this.presenceState });

    // Broadcast presence to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        channelName: this.name,
        type: 'presence:join',
        payload: { key, presences: [payload] },
      });
    }
  }

  presenceState(): Record<string, PresencePayload[]> {
    const state: Record<string, PresencePayload[]> = {};
    this.presenceState.forEach((value, key) => {
      state[key] = value;
    });
    return state;
  }

  /**
   * Handle events from other tabs
   */
  handleExternalEvent(type: string, payload: any): void {
    this.emit(type, payload);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, payload: any): void {
    // Check for exact match
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback({ payload }));
    }

    // Check for broadcast events
    const broadcastKey = `broadcast:${event}`;
    const broadcastListeners = this.eventListeners.get(broadcastKey);
    if (broadcastListeners) {
      broadcastListeners.forEach(callback => callback({ payload }));
    }

    // Check for wildcard listeners
    const wildcardListeners = this.eventListeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => callback({ event, payload }));
    }
  }
}
```

---

### 6. Demo Data Seeding

Initial data for demo mode including sample users, structures, and content.

```
src/services/factory/
  demo-data.ts
```

#### Sample Demo Data Structure

```typescript
// src/services/factory/demo-data.ts

export default {
  user_profiles: [
    {
      id: 'demo-user-001',
      username: 'demo_researcher',
      display_name: 'Demo Researcher',
      role: 'researcher',
      institution: 'Demo University',
      department: 'Biochemistry',
      research_interests: ['protein folding', 'molecular dynamics', 'drug discovery'],
      total_structures: 5,
      total_annotations: 12,
      total_sessions: 3,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-11-20T15:30:00Z',
    },
    {
      id: 'demo-user-002',
      username: 'student_demo',
      display_name: 'Demo Student',
      role: 'student',
      institution: 'Demo University',
      total_structures: 2,
      total_annotations: 5,
      total_sessions: 1,
      created_at: '2024-06-01T09:00:00Z',
      updated_at: '2024-11-18T11:00:00Z',
    },
    {
      id: 'demo-user-003',
      username: 'educator_demo',
      display_name: 'Demo Educator',
      role: 'educator',
      institution: 'Demo University',
      department: 'Chemistry Education',
      total_structures: 10,
      total_annotations: 50,
      total_sessions: 15,
      created_at: '2023-09-01T08:00:00Z',
      updated_at: '2024-11-19T14:00:00Z',
    },
  ],

  structures: [
    {
      id: 'struct-001',
      user_id: 'demo-user-001',
      pdb_id: '1CRN',
      name: 'Crambin',
      description: 'Small protein from cabbage seeds, commonly used as a test structure',
      structure_type: 'protein',
      file_format: 'pdb',
      atom_count: 327,
      visibility: 'public',
      view_count: 150,
      created_at: '2024-10-01T10:00:00Z',
      updated_at: '2024-11-15T12:00:00Z',
    },
    {
      id: 'struct-002',
      user_id: 'demo-user-001',
      pdb_id: '2POR',
      name: 'Porin',
      description: 'Outer membrane protein forming water-filled channel',
      structure_type: 'protein',
      file_format: 'pdb',
      atom_count: 2394,
      visibility: 'public',
      view_count: 89,
      created_at: '2024-10-15T14:30:00Z',
      updated_at: '2024-11-10T09:00:00Z',
    },
    {
      id: 'struct-003',
      user_id: 'demo-user-003',
      pdb_id: '1BNA',
      name: 'B-DNA Dodecamer',
      description: 'Double helix DNA structure for educational purposes',
      structure_type: 'dna',
      file_format: 'pdb',
      atom_count: 486,
      visibility: 'public',
      view_count: 320,
      created_at: '2024-08-20T08:00:00Z',
      updated_at: '2024-11-01T10:00:00Z',
    },
  ],

  learning_content: [
    {
      id: 'content-001',
      creator_id: 'demo-user-003',
      title: 'Introduction to Protein Structure',
      description: 'Learn the basics of protein structure including primary, secondary, tertiary, and quaternary organization.',
      content_type: 'tutorial',
      difficulty: 1,
      tags: ['beginner', 'proteins', 'structure'],
      duration: 1800, // 30 minutes
      is_published: true,
      view_count: 450,
      completion_count: 180,
      avg_rating: 4.5,
      rating_count: 42,
      created_at: '2024-06-01T10:00:00Z',
      updated_at: '2024-10-15T14:00:00Z',
      published_at: '2024-06-15T08:00:00Z',
    },
    {
      id: 'content-002',
      creator_id: 'demo-user-003',
      title: 'Molecular Dynamics Simulation Basics',
      description: 'Understand the fundamentals of MD simulations and how to interpret results.',
      content_type: 'guide',
      difficulty: 2,
      tags: ['intermediate', 'simulation', 'dynamics'],
      duration: 2700, // 45 minutes
      is_published: true,
      view_count: 280,
      completion_count: 95,
      avg_rating: 4.3,
      rating_count: 28,
      created_at: '2024-07-01T09:00:00Z',
      updated_at: '2024-11-01T11:00:00Z',
      published_at: '2024-07-10T10:00:00Z',
    },
  ],

  learning_pathways: [
    {
      id: 'pathway-001',
      creator_id: 'demo-user-003',
      title: 'Structural Biology Fundamentals',
      description: 'A comprehensive pathway covering the basics of structural biology and molecular visualization.',
      content_sequence: ['content-001', 'content-002'],
      estimated_duration: 4500,
      difficulty: 1,
      tags: ['beginner', 'comprehensive'],
      is_published: true,
      enrollment_count: 120,
      completion_count: 45,
      avg_rating: 4.6,
      created_at: '2024-07-15T08:00:00Z',
      updated_at: '2024-10-20T15:00:00Z',
    },
  ],

  collaboration_sessions: [
    {
      id: 'session-demo-001',
      name: 'Demo Collaboration Session',
      owner_id: 'demo-user-001',
      structure_id: 'struct-001',
      invite_code: 'DEMO1234',
      is_active: true,
      settings: {
        allowAnnotations: true,
        allowCameraControl: true,
        requireApproval: false,
        maxUsers: 10,
        cameraFollowMode: false,
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  md_jobs: [
    {
      id: 'job-demo-001',
      user_id: 'demo-user-001',
      structure_id: 'struct-001',
      status: 'completed',
      config: {
        tier: 'browser',
        forcefield: 'amber99sb',
        integrator: 'verlet',
        timestep: 2.0,
        temperature: 300,
        steps: 1000,
        atomCount: 327,
        maxAtoms: 500,
      },
      progress: 100,
      created_at: '2024-11-10T10:00:00Z',
      started_at: '2024-11-10T10:00:05Z',
      completed_at: '2024-11-10T10:02:30Z',
    },
    {
      id: 'job-demo-002',
      user_id: 'demo-user-001',
      structure_id: 'struct-002',
      status: 'running',
      config: {
        tier: 'serverless',
        forcefield: 'amber99sb',
        integrator: 'langevin',
        timestep: 2.0,
        temperature: 300,
        steps: 10000,
        atomCount: 2394,
        maxAtoms: 10000,
      },
      progress: 45,
      created_at: '2024-11-20T14:00:00Z',
      started_at: '2024-11-20T14:01:00Z',
    },
  ],
};
```

---

## File Structure Recommendation

```
src/
  services/
    factory/
      service-factory.ts        # Main factory
      service-types.ts          # Interface definitions
      demo-mode-config.ts       # Demo configuration
      demo-data.ts              # Seed data for demo mode

    mock/
      mock-auth-service.ts      # Demo authentication
      mock-database-service.ts  # CRUD with local storage
      mock-storage-service.ts   # File storage simulation
      mock-realtime-service.ts  # Realtime subscriptions

      adapters/
        local-storage-adapter.ts   # localStorage wrapper
        indexed-db-adapter.ts      # IndexedDB wrapper

    adapters/
      supabase-database-adapter.ts  # Real Supabase DB adapter
      supabase-storage-adapter.ts   # Real Supabase Storage adapter
      supabase-realtime-adapter.ts  # Real Supabase Realtime adapter

    # Existing services (unchanged)
    auth-service.ts
    collaboration-session.ts
    job-queue.ts
    learning-content.ts
    ...

  lib/
    supabase/
      client.ts                 # Modified to use service factory
      server.ts
```

---

## Data Flow Explanation

### 1. Application Startup Flow

```
1. App initializes
2. Check NEXT_PUBLIC_DEMO_MODE environment variable
3. ServiceFactory.initialize() called
   |
   +-- If DEMO_MODE=true:
   |     - Create MockAuthService
   |     - Create MockDatabaseService
   |     - Create MockStorageService
   |     - Create MockRealtimeService
   |     - Load demo data from demo-data.ts
   |     - Seed data into IndexedDB/localStorage
   |
   +-- If DEMO_MODE=false:
         - Create real Supabase adapters
         - Connect to Supabase backend
```

### 2. Authentication Flow (Demo Mode)

```
User clicks "Sign In"
    |
    v
AuthProvider calls signIn()
    |
    v
ServiceFactory.getAuthService().signIn()
    |
    v
MockAuthService:
    1. Check localStorage for user
    2. Validate credentials
    3. Generate mock JWT token
    4. Store session in localStorage
    5. Notify subscribers
    6. Return user/session
    |
    v
AuthContext updates state
    |
    v
Components re-render with auth state
```

### 3. Database Query Flow (Demo Mode)

```
Component needs data
    |
    v
Service calls getDatabaseService().from('table').select()
    |
    v
MockDatabaseService:
    1. Determine storage adapter (IndexedDB or localStorage)
    2. Build query from chain
    3. Retrieve data from storage
    4. Apply filters/sorting/pagination in memory
    5. Return QueryResult
    |
    v
Component receives data
```

### 4. Realtime Collaboration Flow (Demo Mode)

```
User joins collaboration session
    |
    v
CollaborationSessionService.connectToChannel()
    |
    v
MockRealtimeService.channel('session:xyz')
    |
    v
MockRealtimeChannel:
    1. Create channel instance
    2. Subscribe to events
    3. Set up BroadcastChannel for cross-tab
    |
    v
User makes annotation
    |
    v
channel.send({ type: 'annotation-add', payload })
    |
    v
MockRealtimeChannel:
    1. Emit event locally
    2. Post to BroadcastChannel
    3. Other tabs receive via BroadcastChannel
    4. Emit to their local listeners
```

---

## Environment Configuration

### .env.local (Demo Mode)
```bash
# Enable demo mode - runs without Supabase
NEXT_PUBLIC_DEMO_MODE=true

# Optional: Demo mode configuration
NEXT_PUBLIC_DEMO_USER_EMAIL=demo@lab-visualizer.com
NEXT_PUBLIC_DEMO_USER_PASSWORD=demo123456
```

### .env.local (Production Mode)
```bash
# Disable demo mode - requires Supabase
NEXT_PUBLIC_DEMO_MODE=false

# Supabase configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Migration Strategy

### Phase 1: Create Service Interfaces
1. Define `IAuthService`, `IDatabaseService`, `IStorageService`, `IRealtimeService`
2. Create type definitions for all methods

### Phase 2: Create Adapters for Existing Services
1. Wrap existing Supabase services to implement interfaces
2. Ensure backward compatibility

### Phase 3: Implement Mock Services
1. Create `MockAuthService`
2. Create `MockDatabaseService`
3. Create `MockStorageService`
4. Create `MockRealtimeService`

### Phase 4: Create Service Factory
1. Implement `ServiceFactory`
2. Add demo mode detection
3. Create demo data seeding

### Phase 5: Update Existing Services
1. Modify services to use `ServiceFactory`
2. Update imports across codebase
3. Test both modes

---

## Testing Strategy

### Unit Tests
- Test each mock service independently
- Test query builder patterns
- Test storage adapters

### Integration Tests
- Test service factory initialization
- Test mode switching
- Test data persistence

### E2E Tests
- Test full workflows in demo mode
- Verify cross-tab realtime behavior
- Test authentication flows

---

## Key Benefits

1. **Zero External Dependencies**: Demo mode requires no Supabase account or network connection
2. **Transparent Switching**: Components need no changes; only environment variable changes required
3. **Data Persistence**: localStorage and IndexedDB persist data between sessions
4. **Cross-Tab Support**: BroadcastChannel enables multi-tab collaboration testing
5. **Realistic Demo**: Pre-seeded data provides realistic demo experience
6. **Development Speed**: Faster iteration without API rate limits or network latency

---

## Limitations

1. **No Server-Side Validation**: All validation is client-side in demo mode
2. **Storage Limits**: Browser storage limits apply (~5MB localStorage, ~50MB IndexedDB)
3. **No RLS**: Row-Level Security policies are not enforced in demo mode
4. **Single Browser**: Data not shared between different browsers (only tabs)
5. **No Edge Functions**: Serverless functions simulated with client-side logic

---

## Security Considerations

1. Demo mode stores passwords in plaintext (acceptable for demo only)
2. No real authentication validation
3. All data accessible to client
4. Should never be enabled in production with real user data

---

## Version

- **Document Version**: 1.0.0
- **Last Updated**: 2024-11-21
- **Author**: System Architect (SPARC Architecture Phase)
