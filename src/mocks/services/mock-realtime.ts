/**
 * Mock Realtime Service
 * Mirrors Supabase Realtime interface for demo mode
 * Simulates real-time subscriptions without actual WebSocket connections
 */

import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// Type definitions
export type MockRealtimeEvent =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | '*';

export type MockPresenceEvent =
  | 'sync'
  | 'join'
  | 'leave';

export type MockBroadcastEvent = string;

export interface MockRealtimeCallback<T = unknown> {
  (payload: T): void;
}

export interface MockPresenceCallback {
  (state: RealtimePresenceState): void;
}

export interface MockBroadcastCallback<T = unknown> {
  (payload: { event: string; payload: T }): void;
}

// Custom postgres changes payload type for mock
export interface MockPostgresChangesPayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: Partial<T> | null;
  errors: string[] | null;
}

export interface MockPostgresChangesCallback<T = Record<string, unknown>> {
  (payload: MockPostgresChangesPayload<T>): void;
}

interface ChannelFilter {
  event?: string;
  schema?: string;
  table?: string;
  filter?: string;
}

interface ChannelSubscription {
  id: string;
  type: 'broadcast' | 'presence' | 'postgres_changes';
  event: string | undefined;
  callback: MockRealtimeCallback | MockPresenceCallback | MockBroadcastCallback | MockPostgresChangesCallback;
  channelFilter: ChannelFilter | undefined;
}

// Channel status
type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

// Generate a mock ID
function generateMockId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Global channel registry for cross-component communication
const channelRegistry = new Map<string, MockRealtimeChannel>();

/**
 * Mock Realtime Channel
 * Simulates Supabase Realtime channel functionality
 */
export class MockRealtimeChannel {
  private channelName: string;
  private subscriptions: ChannelSubscription[] = [];
  private _presenceState: RealtimePresenceState = {};
  private isSubscribed: boolean = false;
  private statusCallbacks: Map<ChannelStatus, (() => void)[]> = new Map();
  private ownPresence: Record<string, unknown> | null = null;

  constructor(channelName: string) {
    this.channelName = channelName;
    channelRegistry.set(channelName, this);
  }

  /**
   * Subscribe to broadcast events
   */
  on(
    type: 'broadcast',
    filter: { event: string },
    callback: MockBroadcastCallback
  ): this;
  /**
   * Subscribe to presence events
   */
  on(
    type: 'presence',
    filter: { event: MockPresenceEvent },
    callback: MockPresenceCallback
  ): this;
  /**
   * Subscribe to postgres changes
   */
  on(
    type: 'postgres_changes',
    filter: {
      event: MockRealtimeEvent;
      schema?: string;
      table?: string;
      filter?: string;
    },
    callback: MockPostgresChangesCallback
  ): this;
  /**
   * Generic on handler
   */
  on(
    type: 'broadcast' | 'presence' | 'postgres_changes',
    filter: Record<string, unknown>,
    callback: MockRealtimeCallback | MockPresenceCallback | MockBroadcastCallback | MockPostgresChangesCallback
  ): this {
    const filterEvent = filter['event'] as string | undefined;
    const channelFilter: ChannelFilter = {};

    if (filter['event'] !== undefined) channelFilter.event = String(filter['event']);
    if (filter['schema'] !== undefined) channelFilter.schema = String(filter['schema']);
    if (filter['table'] !== undefined) channelFilter.table = String(filter['table']);
    if (filter['filter'] !== undefined) channelFilter.filter = String(filter['filter']);

    const subscription: ChannelSubscription = {
      id: generateMockId(),
      type,
      event: filterEvent,
      callback,
      channelFilter: Object.keys(channelFilter).length > 0 ? channelFilter : undefined,
    };

    this.subscriptions.push(subscription);
    return this;
  }

  /**
   * Subscribe to the channel
   */
  subscribe(callback?: (status: ChannelStatus, err?: Error) => void): this {
    // Simulate connection delay
    setTimeout(() => {
      this.isSubscribed = true;

      // Notify status callbacks
      this.statusCallbacks.get('SUBSCRIBED')?.forEach((cb) => cb());

      if (callback) {
        callback('SUBSCRIBED');
      }

      // If there's presence, trigger sync
      if (this.ownPresence) {
        this.emitPresenceSync();
      }

      console.log(`[MockRealtime] Channel '${this.channelName}' subscribed`);
    }, 100);

    return this;
  }

  /**
   * Unsubscribe from the channel
   */
  unsubscribe(): Promise<'ok' | 'error' | 'timed out'> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isSubscribed = false;
        this.subscriptions = [];
        this._presenceState = {};

        // Notify status callbacks
        this.statusCallbacks.get('CLOSED')?.forEach((cb) => cb());

        channelRegistry.delete(this.channelName);
        console.log(`[MockRealtime] Channel '${this.channelName}' unsubscribed`);
        resolve('ok');
      }, 50);
    });
  }

  /**
   * Send a broadcast message
   */
  send(payload: {
    type: 'broadcast';
    event: string;
    payload: Record<string, unknown>;
  }): Promise<'ok' | 'error'> {
    return new Promise((resolve) => {
      if (!this.isSubscribed) {
        resolve('error');
        return;
      }

      // Find broadcast subscriptions with matching event
      const matchingSubscriptions = this.subscriptions.filter(
        (sub) =>
          sub.type === 'broadcast' &&
          (sub.event === payload.event || sub.event === '*')
      );

      // Emit to all matching subscriptions
      setTimeout(() => {
        matchingSubscriptions.forEach((sub) => {
          (sub.callback as MockBroadcastCallback)({
            event: payload.event,
            payload: payload.payload,
          });
        });
        resolve('ok');
      }, 10);
    });
  }

  /**
   * Track presence
   */
  track(payload: Record<string, unknown>): Promise<'ok' | 'error'> {
    return new Promise((resolve) => {
      this.ownPresence = payload;

      // Add to presence state
      const presenceKey = payload['user_id'] as string || generateMockId();
      this._presenceState[presenceKey] = [{ ...payload, presence_ref: generateMockId() }];

      // Emit presence sync
      setTimeout(() => {
        this.emitPresenceSync();
        resolve('ok');
      }, 10);
    });
  }

  /**
   * Untrack presence
   */
  untrack(): Promise<'ok' | 'error'> {
    return new Promise((resolve) => {
      if (this.ownPresence) {
        const presenceKey = this.ownPresence['user_id'] as string;
        if (presenceKey) {
          delete this._presenceState[presenceKey];

          // Emit presence leave
          this.emitPresenceLeave(presenceKey);
        }
        this.ownPresence = null;
      }
      resolve('ok');
    });
  }

  /**
   * Get current presence state
   */
  getPresenceState(): RealtimePresenceState {
    return this._presenceState;
  }

  /**
   * Receive callback (for status changes)
   */
  receive(status: ChannelStatus, callback: () => void): this {
    if (!this.statusCallbacks.has(status)) {
      this.statusCallbacks.set(status, []);
    }
    this.statusCallbacks.get(status)!.push(callback);
    return this;
  }

  // Internal: Emit presence sync event
  private emitPresenceSync(): void {
    const presenceSubscriptions = this.subscriptions.filter(
      (sub) => sub.type === 'presence' && (sub.event === 'sync' || sub.event === '*')
    );

    presenceSubscriptions.forEach((sub) => {
      (sub.callback as MockPresenceCallback)(this._presenceState);
    });
  }

  // Internal: Emit presence join event
  private emitPresenceJoin(key: string): void {
    const presenceSubscriptions = this.subscriptions.filter(
      (sub) => sub.type === 'presence' && (sub.event === 'join' || sub.event === '*')
    );

    const presenceValue = this._presenceState[key];
    presenceSubscriptions.forEach((sub) => {
      (sub.callback as MockPresenceCallback)({ [key]: presenceValue || [] });
    });
  }

  // Internal: Emit presence leave event
  private emitPresenceLeave(key: string): void {
    const presenceSubscriptions = this.subscriptions.filter(
      (sub) => sub.type === 'presence' && (sub.event === 'leave' || sub.event === '*')
    );

    presenceSubscriptions.forEach((sub) => {
      (sub.callback as MockPresenceCallback)({ [key]: [] });
    });
  }

  /**
   * Simulate a database change (for testing)
   */
  simulatePostgresChange<T extends Record<string, unknown> = Record<string, unknown>>(
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    newRecord: T | null,
    oldRecord: T | null
  ): void {
    if (!this.isSubscribed) return;

    const matchingSubscriptions = this.subscriptions.filter((sub) => {
      if (sub.type !== 'postgres_changes') return false;
      if (sub.channelFilter?.table && sub.channelFilter.table !== table) return false;
      if (sub.channelFilter?.event && sub.channelFilter.event !== '*' && sub.channelFilter.event !== event) return false;
      return true;
    });

    const payload: MockPostgresChangesPayload<T> = {
      schema: 'public',
      table,
      commit_timestamp: new Date().toISOString(),
      eventType: event,
      new: newRecord,
      old: oldRecord,
      errors: null,
    };

    matchingSubscriptions.forEach((sub) => {
      (sub.callback as MockPostgresChangesCallback<T>)(payload);
    });
  }

  /**
   * Simulate another user joining (for testing)
   */
  simulateUserJoin(user: Record<string, unknown>): void {
    const presenceKey = user['user_id'] as string || generateMockId();
    this._presenceState[presenceKey] = [{ ...user, presence_ref: generateMockId() }];
    this.emitPresenceJoin(presenceKey);
    this.emitPresenceSync();
  }

  /**
   * Simulate another user leaving (for testing)
   */
  simulateUserLeave(userId: string): void {
    if (this._presenceState[userId]) {
      delete this._presenceState[userId];
      this.emitPresenceLeave(userId);
      this.emitPresenceSync();
    }
  }

  /**
   * Simulate receiving a broadcast (for testing)
   */
  simulateBroadcast(event: string, payload: Record<string, unknown>): void {
    const matchingSubscriptions = this.subscriptions.filter(
      (sub) => sub.type === 'broadcast' && (sub.event === event || sub.event === '*')
    );

    matchingSubscriptions.forEach((sub) => {
      (sub.callback as MockBroadcastCallback)({
        event,
        payload,
      });
    });
  }
}

/**
 * Mock Realtime Service Class
 */
export class MockRealtimeService {
  private channels: Map<string, MockRealtimeChannel> = new Map();

  /**
   * Create or get a channel
   */
  channel(name: string, _options?: Record<string, unknown>): MockRealtimeChannel {
    // Check if channel already exists in registry
    let channel = channelRegistry.get(name);

    if (!channel) {
      channel = new MockRealtimeChannel(name);
      this.channels.set(name, channel);
    }

    return channel;
  }

  /**
   * Remove a channel
   */
  removeChannel(channel: MockRealtimeChannel | RealtimeChannel): Promise<'ok' | 'error' | 'timed out'> {
    return (channel as MockRealtimeChannel).unsubscribe();
  }

  /**
   * Remove all channels
   */
  removeAllChannels(): Promise<('ok' | 'error' | 'timed out')[]> {
    const promises: Promise<'ok' | 'error' | 'timed out'>[] = [];

    this.channels.forEach((channel) => {
      promises.push(channel.unsubscribe());
    });

    this.channels.clear();

    return Promise.all(promises);
  }

  /**
   * Get all channels
   */
  getChannels(): MockRealtimeChannel[] {
    return Array.from(this.channels.values());
  }
}

// Export singleton instance
export const mockRealtimeService = new MockRealtimeService();

// Export factory function
export function createMockRealtime(): MockRealtimeService {
  return new MockRealtimeService();
}

// Helper to get channel by name (for cross-component testing)
export function getMockChannel(name: string): MockRealtimeChannel | undefined {
  return channelRegistry.get(name);
}

// Demo simulation utilities
export class MockRealtimeSimulator {
  private channel: MockRealtimeChannel;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(channelName: string) {
    const existingChannel = channelRegistry.get(channelName);
    if (existingChannel) {
      this.channel = existingChannel;
    } else {
      this.channel = new MockRealtimeChannel(channelName);
    }
  }

  /**
   * Start simulating user activity
   */
  startUserActivitySimulation(intervalMs: number = 5000): void {
    if (this.simulationInterval) return;

    const simulatedUsers = [
      { user_id: 'sim-user-1', name: 'Alice', color: '#FF6B6B' },
      { user_id: 'sim-user-2', name: 'Bob', color: '#4ECDC4' },
      { user_id: 'sim-user-3', name: 'Charlie', color: '#45B7D1' },
    ];

    let userIndex = 0;

    this.simulationInterval = setInterval(() => {
      const action = Math.random();

      if (action < 0.3) {
        // User joins
        const userIdx = userIndex % simulatedUsers.length;
        const user = simulatedUsers[userIdx];
        if (user) {
          this.channel.simulateUserJoin({
            ...user,
            joined_at: new Date().toISOString(),
          });
        }
        userIndex++;
      } else if (action < 0.6) {
        // User leaves
        const randomIdx = Math.floor(Math.random() * simulatedUsers.length);
        const randomUser = simulatedUsers[randomIdx];
        if (randomUser) {
          this.channel.simulateUserLeave(randomUser.user_id);
        }
      } else {
        // Broadcast activity
        const broadcastIdx = Math.floor(Math.random() * simulatedUsers.length);
        const broadcastUser = simulatedUsers[broadcastIdx];
        if (broadcastUser) {
          this.channel.simulateBroadcast('activity', {
            type: 'cursor_move',
            user_id: broadcastUser.user_id,
            position: { x: Math.random() * 100, y: Math.random() * 100 },
          });
        }
      }
    }, intervalMs);

    console.log(`[MockRealtime] Started activity simulation for channel`);
  }

  /**
   * Stop simulating user activity
   */
  stopUserActivitySimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log(`[MockRealtime] Stopped activity simulation`);
    }
  }

  /**
   * Manually trigger events
   */
  triggerEvent(type: 'join' | 'leave' | 'broadcast', data: Record<string, unknown>): void {
    switch (type) {
      case 'join':
        this.channel.simulateUserJoin(data);
        break;
      case 'leave':
        this.channel.simulateUserLeave(data['user_id'] as string);
        break;
      case 'broadcast':
        this.channel.simulateBroadcast(data['event'] as string, data['payload'] as Record<string, unknown>);
        break;
    }
  }
}

// Export simulator factory
export function createMockRealtimeSimulator(channelName: string): MockRealtimeSimulator {
  return new MockRealtimeSimulator(channelName);
}
