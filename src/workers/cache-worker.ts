/**
 * Cache Worker
 *
 * Web Worker for non-blocking background prefetching
 * Handles message-based communication with main thread
 */

interface WorkerMessage {
  type: 'start' | 'pause' | 'resume' | 'cancel' | 'fetch';
  payload?: any;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error' | 'data';
  payload?: any;
}

interface FetchTask {
  pdbId: string;
  priority: number;
  attempts: number;
}

class CacheWorker {
  private isActive = false;
  private isPaused = false;
  private queue: FetchTask[] = [];
  private inProgress = new Set<string>();
  private maxConcurrent = 5;
  private retryAttempts = 3;
  private retryDelay = 1000;
  private abortController?: AbortController;

  constructor() {
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'start':
          this.start(payload);
          break;
        case 'pause':
          this.pause();
          break;
        case 'resume':
          this.resume();
          break;
        case 'cancel':
          this.cancel();
          break;
        case 'fetch':
          this.addToQueue(payload);
          break;
        default:
          this.sendError(new Error(`Unknown message type: ${type}`));
      }
    });
  }

  private async start(config: {
    structures: FetchTask[];
    maxConcurrent?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }): Promise<void> {
    if (this.isActive) {
      this.sendError(new Error('Worker already active'));
      return;
    }

    this.isActive = true;
    this.queue = [...config.structures];
    this.maxConcurrent = config.maxConcurrent || 5;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.abortController = new AbortController();

    this.sendProgress();
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.isActive &&
      !this.isPaused &&
      !this.abortController?.signal.aborted
    ) {
      const pending = this.queue.filter(
        task => task.attempts < this.retryAttempts && !this.inProgress.has(task.pdbId)
      );

      const available = this.maxConcurrent - this.inProgress.size;

      if (available > 0 && pending.length > 0) {
        // Sort by priority
        pending.sort((a, b) => b.priority - a.priority);
        const batch = pending.slice(0, available);

        // Process batch in parallel
        await Promise.all(batch.map(task => this.processTask(task)));
      }

      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if we're done
    if (this.inProgress.size === 0 && this.queue.every(t => t.attempts >= this.retryAttempts)) {
      this.isActive = false;
      this.sendComplete();
    }
  }

  private async processTask(task: FetchTask): Promise<void> {
    this.inProgress.add(task.pdbId);
    task.attempts++;

    try {
      const data = await this.fetchStructure(task.pdbId);

      this.sendData({
        pdbId: task.pdbId,
        data,
        size: data.byteLength,
      });

      // Remove from queue on success
      this.queue = this.queue.filter(t => t.pdbId !== task.pdbId);

    } catch (error) {
      if (task.attempts < this.retryAttempts) {
        // Retry with exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, this.retryDelay * Math.pow(2, task.attempts - 1))
        );
      } else {
        // Max retries reached
        this.sendError(error as Error, task.pdbId);
        this.queue = this.queue.filter(t => t.pdbId !== task.pdbId);
      }
    } finally {
      this.inProgress.delete(task.pdbId);
      this.sendProgress();
    }
  }

  private async fetchStructure(pdbId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://files.rcsb.org/download/${pdbId}.pdb`,
      {
        signal: this.abortController?.signal,
        priority: 'low' as any, // Hint to browser (not widely supported yet)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  private addToQueue(task: FetchTask): void {
    // Check if already in queue
    if (!this.queue.find(t => t.pdbId === task.pdbId)) {
      this.queue.push({ ...task, attempts: 0 });

      if (this.isActive && !this.isPaused) {
        this.processQueue();
      }
    }
  }

  private pause(): void {
    this.isPaused = true;
    this.sendMessage({ type: 'progress', payload: { isPaused: true } });
  }

  private resume(): void {
    this.isPaused = false;
    this.sendMessage({ type: 'progress', payload: { isPaused: false } });
    if (this.isActive) {
      this.processQueue();
    }
  }

  private cancel(): void {
    this.isActive = false;
    this.isPaused = false;
    this.queue = [];
    this.inProgress.clear();
    this.abortController?.abort();
    this.sendMessage({ type: 'complete', payload: { cancelled: true } });
  }

  private sendProgress(): void {
    this.sendMessage({
      type: 'progress',
      payload: {
        total: this.queue.length + this.inProgress.size,
        inProgress: this.inProgress.size,
        completed: 0, // Tracked by main thread
        isPaused: this.isPaused,
      },
    });
  }

  private sendComplete(): void {
    this.sendMessage({
      type: 'complete',
      payload: {
        total: this.queue.length,
      },
    });
  }

  private sendData(data: { pdbId: string; data: ArrayBuffer; size: number }): void {
    this.sendMessage({
      type: 'data',
      payload: data,
    });
  }

  private sendError(error: Error, pdbId?: string): void {
    this.sendMessage({
      type: 'error',
      payload: {
        message: error.message,
        pdbId,
      },
    });
  }

  private sendMessage(response: WorkerResponse): void {
    self.postMessage(response);
  }
}

// Initialize worker
const worker = new CacheWorker();

// Export type for TypeScript usage
export type { WorkerMessage, WorkerResponse };
