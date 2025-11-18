/**
 * Conflict resolution service
 * Handles merge strategies and optimistic updates for real-time collaboration
 */
import type {
  OptimisticUpdate,
  ConflictResolution,
  ConflictStrategy,
  Annotation,
} from '@/types/collaboration';

/**
 * Conflict resolution service
 */
export class ConflictResolutionService {
  private pendingUpdates = new Map<string, OptimisticUpdate<unknown>>();
  private updateVersions = new Map<string, number>();

  /**
   * Register an optimistic update
   */
  registerOptimisticUpdate<T>(
    id: string,
    type: string,
    data: T,
    userId: string
  ): OptimisticUpdate<T> {
    const version = (this.updateVersions.get(id) || 0) + 1;
    this.updateVersions.set(id, version);

    const update: OptimisticUpdate<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
      userId,
      version,
    };

    this.pendingUpdates.set(id, update as OptimisticUpdate<unknown>);
    return update;
  }

  /**
   * Remove optimistic update
   */
  removeOptimisticUpdate(id: string): void {
    this.pendingUpdates.delete(id);
  }

  /**
   * Resolve conflict between local and remote updates
   */
  resolveConflict<T extends Record<string, unknown>>(
    local: OptimisticUpdate<T>,
    remote: T,
    strategy: ConflictStrategy = 'last-write-wins'
  ): ConflictResolution<T> {
    switch (strategy) {
      case 'last-write-wins':
        return this.lastWriteWins(local, remote);

      case 'merge':
        return this.mergeUpdates(local, remote);

      case 'reject':
        return {
          resolved: remote,
          strategy: 'reject',
          conflicts: [],
        };

      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }

  /**
   * Last-write-wins strategy
   */
  private lastWriteWins<T extends Record<string, unknown>>(
    local: OptimisticUpdate<T>,
    remote: T
  ): ConflictResolution<T> {
    const remoteTimestamp = (remote as any).updatedAt || Date.now();

    // If local update is newer, keep it
    if (local.timestamp > remoteTimestamp) {
      return {
        resolved: local.data,
        strategy: 'last-write-wins',
        conflicts: [],
      };
    }

    // Otherwise use remote
    return {
      resolved: remote,
      strategy: 'last-write-wins',
      conflicts: [],
    };
  }

  /**
   * Merge strategy - attempt to merge non-conflicting fields
   */
  private mergeUpdates<T extends Record<string, unknown>>(
    local: OptimisticUpdate<T>,
    remote: T
  ): ConflictResolution<T> {
    const conflicts: ConflictResolution<T>['conflicts'] = [];
    const resolved: Record<string, unknown> = { ...remote };

    // Merge fields
    Object.keys(local.data).forEach((key) => {
      const localValue = local.data[key];
      const remoteValue = remote[key];

      // If values differ, we have a conflict
      if (
        localValue !== remoteValue &&
        JSON.stringify(localValue) !== JSON.stringify(remoteValue)
      ) {
        conflicts.push({
          field: key,
          local: localValue,
          remote: remoteValue,
          resolved: remoteValue, // Default to remote
        });
      } else if (localValue !== undefined) {
        resolved[key] = localValue;
      }
    });

    return {
      resolved: resolved as T,
      strategy: 'merge',
      conflicts,
    };
  }

  /**
   * Resolve annotation conflicts
   */
  resolveAnnotationConflict(
    local: OptimisticUpdate<Annotation>,
    remote: Annotation
  ): ConflictResolution<Annotation> {
    // For annotations, use merge strategy
    const resolution = this.mergeUpdates(local, remote);

    // Special handling for content - prefer newer timestamp
    if (
      local.data.content !== remote.content &&
      local.timestamp > remote.updatedAt
    ) {
      resolution.resolved.content = local.data.content;
      resolution.resolved.updatedAt = local.timestamp;
    }

    return resolution;
  }

  /**
   * Check if an update is still pending
   */
  isPending(id: string): boolean {
    return this.pendingUpdates.has(id);
  }

  /**
   * Get pending update
   */
  getPendingUpdate<T>(id: string): OptimisticUpdate<T> | undefined {
    return this.pendingUpdates.get(id) as OptimisticUpdate<T> | undefined;
  }

  /**
   * Clear all pending updates
   */
  clearPending(): void {
    this.pendingUpdates.clear();
  }

  /**
   * Rollback optimistic update
   */
  rollback<T>(id: string): OptimisticUpdate<T> | undefined {
    const update = this.pendingUpdates.get(id) as OptimisticUpdate<T> | undefined;
    this.pendingUpdates.delete(id);
    return update;
  }

  /**
   * Get version for entity
   */
  getVersion(id: string): number {
    return this.updateVersions.get(id) || 0;
  }

  /**
   * Increment version
   */
  incrementVersion(id: string): number {
    const version = this.getVersion(id) + 1;
    this.updateVersions.set(id, version);
    return version;
  }

  /**
   * Validate update order (detect out-of-order updates)
   */
  validateUpdateOrder(id: string, incomingVersion: number): boolean {
    const currentVersion = this.getVersion(id);
    return incomingVersion > currentVersion;
  }

  /**
   * Apply operational transformation for concurrent text edits
   */
  transformTextEdit(
    local: { position: number; text: string; delete?: number },
    remote: { position: number; text: string; delete?: number }
  ): { position: number; text: string; delete?: number } {
    // If remote edit is before local, adjust local position
    if (remote.position < local.position) {
      const offset = remote.text.length - (remote.delete || 0);
      return {
        ...local,
        position: local.position + offset,
      };
    }

    // If edits overlap, remote takes precedence
    if (
      remote.position <= local.position &&
      remote.position + (remote.delete || 0) > local.position
    ) {
      return {
        position: remote.position + remote.text.length,
        text: local.text,
        delete: local.delete,
      };
    }

    // No transformation needed
    return local;
  }
}

// Singleton instance
export const conflictResolution = new ConflictResolutionService();
