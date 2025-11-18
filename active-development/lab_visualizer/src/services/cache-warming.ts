/**
 * Cache Warming Service
 *
 * Manages intelligent background prefetching of protein structures
 * with priority queue, network awareness, and progress tracking.
 */

import type { StructureMetadata, StructureScore } from '../lib/cache-strategy';
import { CacheStrategyEngine } from '../lib/cache-strategy';

export interface CacheWarmingConfig {
  enabled: boolean;
  maxConcurrent: number;
  maxSize: number;
  strategies: ('popular' | 'recent' | 'related')[];
  networkAware: boolean;
  respectUserPrefs: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface WarmingProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  bytesDownloaded: number;
  estimatedTimeRemaining: number;
}

export interface WarmingTask {
  pdbId: string;
  priority: number;
  size: number;
  status: 'pending' | 'inProgress' | 'completed' | 'failed';
  attempts: number;
  error?: string;
}

type CacheWarmingEventType = 'progress' | 'complete' | 'error' | 'paused' | 'resumed';

export interface CacheWarmingEvent {
  type: CacheWarmingEventType;
  progress?: WarmingProgress;
  error?: Error;
}

const DEFAULT_CONFIG: CacheWarmingConfig = {
  enabled: true,
  maxConcurrent: 5,
  maxSize: 500 * 1024 * 1024, // 500MB
  strategies: ['popular', 'recent', 'related'],
  networkAware: true,
  respectUserPrefs: true,
  retryAttempts: 3,
  retryDelay: 1000,
};

export class CacheWarmingService {
  private config: CacheWarmingConfig;
  private strategy: CacheStrategyEngine;
  private queue: WarmingTask[] = [];
  private inProgress = new Set<string>();
  private completed = new Set<string>();
  private failed = new Map<string, string>();
  private isPaused = false;
  private startTime = 0;
  private bytesDownloaded = 0;
  private listeners = new Set<(event: CacheWarmingEvent) => void>();
  private worker?: Worker;
  private abortController?: AbortController;

  constructor(
    config: Partial<CacheWarmingConfig> = {},
    strategy?: CacheStrategyEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.strategy = strategy || new CacheStrategyEngine({
      maxSize: this.config.maxSize,
    });
  }

  /**
   * Start cache warming process
   */
  async start(structures?: StructureMetadata[]): Promise<void> {
    if (!this.config.enabled) {
      console.log('Cache warming is disabled');
      return;
    }

    if (this.config.respectUserPrefs && !this.checkUserPreferences()) {
      console.log('Cache warming disabled by user preferences');
      return;
    }

    if (this.config.networkAware && !this.checkNetworkConditions()) {
      console.log('Network conditions not suitable for cache warming');
      return;
    }

    this.startTime = Date.now();
    this.abortController = new AbortController();

    // Build priority queue
    await this.buildQueue(structures);

    // Start processing
    this.processQueue();

    this.emitEvent({
      type: 'progress',
      progress: this.getProgress(),
    });
  }

  /**
   * Build priority queue from strategy
   */
  private async buildQueue(structures?: StructureMetadata[]): Promise<void> {
    let toCache: StructureScore[];

    if (structures) {
      toCache = this.strategy.getStructuresToCache(structures);
    } else {
      // Use default educational structures
      const topStructures = this.strategy.getTopEducationalStructures(20);
      toCache = topStructures.map((pdbId, index) => ({
        pdbId,
        score: 1.0 - (index / topStructures.length) * 0.5,
        popularity: 1.0,
        recency: 0,
        relevance: 0,
        estimatedSize: 2 * 1024 * 1024, // Estimate 2MB per structure
      }));
    }

    this.queue = toCache.map(scored => ({
      pdbId: scored.pdbId,
      priority: scored.score,
      size: scored.estimatedSize,
      status: 'pending' as const,
      attempts: 0,
    }));

    console.log(`Cache warming queue built with ${this.queue.length} structures`);
  }

  /**
   * Process queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.isPaused && !this.abortController?.signal.aborted) {
      // Start tasks up to max concurrent
      const pending = this.queue.filter(t => t.status === 'pending');
      const available = this.config.maxConcurrent - this.inProgress.size;

      if (available > 0 && pending.length > 0) {
        const batch = pending.slice(0, available);
        batch.forEach(task => this.processTask(task));
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if we're done
    if (this.inProgress.size === 0 && this.queue.every(t => t.status !== 'pending')) {
      this.emitEvent({
        type: 'complete',
        progress: this.getProgress(),
      });
    }
  }

  /**
   * Process individual task
   */
  private async processTask(task: WarmingTask): Promise<void> {
    task.status = 'inProgress';
    task.attempts++;
    this.inProgress.add(task.pdbId);

    try {
      // Fetch structure data (placeholder - integrate with your cache service)
      const data = await this.fetchStructure(task.pdbId);

      // Store in cache
      await this.storeInCache(task.pdbId, data);

      task.status = 'completed';
      this.completed.add(task.pdbId);
      this.bytesDownloaded += task.size;

      // Update strategy
      this.strategy.updateHistory(task.pdbId);
      this.strategy.updatePopularity(task.pdbId, 0.05);

    } catch (error) {
      console.error(`Failed to cache ${task.pdbId}:`, error);

      if (task.attempts < this.config.retryAttempts) {
        // Retry with delay
        task.status = 'pending';
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelay * task.attempts)
        );
      } else {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';
        this.failed.set(task.pdbId, task.error);
      }
    } finally {
      this.inProgress.delete(task.pdbId);

      this.emitEvent({
        type: 'progress',
        progress: this.getProgress(),
      });
    }
  }

  /**
   * Fetch structure data (integrate with your data service)
   */
  private async fetchStructure(pdbId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://files.rcsb.org/download/${pdbId}.pdb`,
      { signal: this.abortController?.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Store in IndexedDB cache (integrate with your cache service)
   */
  private async storeInCache(pdbId: string, data: ArrayBuffer): Promise<void> {
    // Placeholder - integrate with your actual cache service
    const request = indexedDB.open('ProteinStructureCache', 1);

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['structures'], 'readwrite');
        const store = transaction.objectStore('structures');

        const putRequest = store.put({
          pdbId,
          data,
          timestamp: Date.now(),
          size: data.byteLength,
        });

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  }

  /**
   * Check user preferences
   */
  private checkUserPreferences(): boolean {
    // Check localStorage for user preference
    const pref = localStorage.getItem('cacheWarming');
    return pref !== 'disabled';
  }

  /**
   * Check network conditions
   */
  private checkNetworkConditions(): boolean {
    if (!('connection' in navigator)) return true;

    const connection = (navigator as any).connection;

    // Don't prefetch on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return false;
    }

    // Don't prefetch if user has data saver enabled
    if (connection.saveData) {
      return false;
    }

    return true;
  }

  /**
   * Pause warming
   */
  pause(): void {
    this.isPaused = true;
    this.emitEvent({ type: 'paused' });
  }

  /**
   * Resume warming
   */
  resume(): void {
    this.isPaused = false;
    this.emitEvent({ type: 'resumed' });
    this.processQueue();
  }

  /**
   * Cancel warming
   */
  cancel(): void {
    this.abortController?.abort();
    this.queue = [];
    this.inProgress.clear();
    this.isPaused = true;
  }

  /**
   * Get current progress
   */
  getProgress(): WarmingProgress {
    const total = this.queue.length;
    const completed = this.completed.size;
    const failed = this.failed.size;
    const inProgress = this.inProgress.size;

    const elapsed = Date.now() - this.startTime;
    const rate = completed / (elapsed / 1000); // structures per second
    const remaining = total - completed - failed;
    const estimatedTimeRemaining = rate > 0 ? (remaining / rate) * 1000 : 0;

    return {
      total,
      completed,
      failed,
      inProgress,
      bytesDownloaded: this.bytesDownloaded,
      estimatedTimeRemaining,
    };
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: CacheWarmingEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: CacheWarmingEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in cache warming event listener:', error);
      }
    });
  }

  /**
   * Get warming status
   */
  getStatus(): {
    isActive: boolean;
    isPaused: boolean;
    progress: WarmingProgress;
    failedStructures: Map<string, string>;
  } {
    return {
      isActive: this.queue.length > 0 && !this.abortController?.signal.aborted,
      isPaused: this.isPaused,
      progress: this.getProgress(),
      failedStructures: new Map(this.failed),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheWarmingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get strategy engine for external updates
   */
  getStrategy(): CacheStrategyEngine {
    return this.strategy;
  }
}

export default CacheWarmingService;
