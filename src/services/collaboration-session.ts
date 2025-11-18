/**
 * Collaboration session management service
 * Handles session creation, joining, and real-time synchronization via Supabase
 */
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type {
  CollaborationSession,
  CollaborationUser,
  SessionSettings,
  RealtimeEvents,
  ActivityEvent,
} from '@/types/collaboration';

const SESSION_EXPIRATION_HOURS = 24;
const PRESENCE_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Generate a random invite code
 */
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Generate a random user color
 */
function generateUserColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export class CollaborationSessionService {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private presenceInterval: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;

  /**
   * Create a new collaboration session
   */
  async createSession(
    name: string,
    userId: string,
    userName: string,
    settings?: Partial<SessionSettings>
  ): Promise<CollaborationSession> {
    const now = Date.now();
    const expiresAt = now + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000;

    const session: CollaborationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      ownerId: userId,
      createdAt: now,
      expiresAt,
      isActive: true,
      inviteCode: generateInviteCode(),
      settings: {
        allowAnnotations: true,
        allowCameraControl: true,
        requireApproval: false,
        maxUsers: 10,
        cameraFollowMode: false,
        ...settings,
      },
    };

    // Store session in database
    const { error } = await this.supabase
      .from('collaboration_sessions')
      .insert({
        id: session.id,
        name: session.name,
        owner_id: session.ownerId,
        expires_at: new Date(session.expiresAt).toISOString(),
        invite_code: session.inviteCode,
        settings: session.settings,
        is_active: session.isActive,
      });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return session;
  }

  /**
   * Join an existing session
   */
  async joinSession(
    sessionId: string,
    userId: string,
    userName: string
  ): Promise<{ session: CollaborationSession; user: CollaborationUser }> {
    // Fetch session from database
    const { data: sessionData, error } = await this.supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !sessionData) {
      throw new Error('Session not found');
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at).getTime() < Date.now()) {
      throw new Error('Session has expired');
    }

    const session: CollaborationSession = {
      id: sessionData.id,
      name: sessionData.name,
      ownerId: sessionData.owner_id,
      createdAt: new Date(sessionData.created_at).getTime(),
      expiresAt: new Date(sessionData.expires_at).getTime(),
      isActive: sessionData.is_active,
      structureId: sessionData.structure_id,
      inviteCode: sessionData.invite_code,
      settings: sessionData.settings,
    };

    // Create user object
    const user: CollaborationUser = {
      id: userId,
      name: userName,
      color: generateUserColor(),
      role: userId === session.ownerId ? 'owner' : 'viewer',
      status: 'active',
      lastActivity: Date.now(),
    };

    this.currentUserId = userId;

    return { session, user };
  }

  /**
   * Join session by invite code
   */
  async joinByInviteCode(
    inviteCode: string,
    userId: string,
    userName: string
  ): Promise<{ session: CollaborationSession; user: CollaborationUser }> {
    const { data: sessionData, error } = await this.supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !sessionData) {
      throw new Error('Invalid invite code');
    }

    return this.joinSession(sessionData.id, userId, userName);
  }

  /**
   * Connect to real-time channel
   */
  connectToChannel(
    sessionId: string,
    userId: string,
    onEvent: <K extends keyof RealtimeEvents>(
      type: K,
      payload: RealtimeEvents[K]
    ) => void
  ): void {
    if (this.channel) {
      this.disconnectFromChannel();
    }

    this.channel = this.supabase.channel(`session:${sessionId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Subscribe to all event types
    const eventTypes: (keyof RealtimeEvents)[] = [
      'cursor-move',
      'annotation-add',
      'annotation-edit',
      'annotation-delete',
      'camera-update',
      'user-join',
      'user-leave',
      'user-update',
      'activity',
      'session-update',
    ];

    eventTypes.forEach((type) => {
      this.channel?.on('broadcast', { event: type }, ({ payload }) => {
        onEvent(type, payload);
      });
    });

    // Track presence
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({
            userId,
            onlineAt: new Date().toISOString(),
          });

          // Start presence heartbeat
          this.startPresenceHeartbeat();
        }
      });
  }

  /**
   * Broadcast event to all users
   */
  async broadcast<K extends keyof RealtimeEvents>(
    type: K,
    payload: RealtimeEvents[K]
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to channel');
    }

    await this.channel.send({
      type: 'broadcast',
      event: type,
      payload,
    });
  }

  /**
   * Start presence heartbeat
   */
  private startPresenceHeartbeat(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }

    this.presenceInterval = setInterval(() => {
      if (this.channel && this.currentUserId) {
        this.channel.track({
          userId: this.currentUserId,
          onlineAt: new Date().toISOString(),
        });
      }
    }, PRESENCE_TIMEOUT_MS / 2);
  }

  /**
   * Disconnect from channel
   */
  disconnectFromChannel(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.currentUserId = null;
  }

  /**
   * Update session settings
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionSettings>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('collaboration_sessions')
      .update({
        settings: updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }

    // Broadcast update
    await this.broadcast('session-update', { settings: updates });
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('collaboration_sessions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }

    this.disconnectFromChannel();
  }

  /**
   * Change user role
   */
  async changeUserRole(
    sessionId: string,
    userId: string,
    newRole: CollaborationUser['role']
  ): Promise<void> {
    // Store role change
    const { error } = await this.supabase
      .from('session_users')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        role: newRole,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to change role: ${error.message}`);
    }

    // Broadcast update
    await this.broadcast('user-update', { id: userId, role: newRole });
  }

  /**
   * Kick user from session
   */
  async kickUser(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('session_users')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to kick user: ${error.message}`);
    }

    // Broadcast leave event
    await this.broadcast('user-leave', { userId });
  }

  /**
   * Get session invite link
   */
  getInviteLink(session: CollaborationSession): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/collaborate/join/${session.inviteCode}`;
  }
}

// Singleton instance
export const collaborationSession = new CollaborationSessionService();
