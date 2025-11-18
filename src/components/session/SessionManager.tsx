/**
 * SessionManager - UI for creating and joining collaboration sessions
 * Provides forms and controls for session management
 */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useCollaborationStore, selectCurrentSession } from '@/store/collaboration-slice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InviteDialog } from './InviteDialog';

export interface SessionManagerProps {
  /**
   * User ID
   */
  userId: string;

  /**
   * User name
   */
  userName: string;

  /**
   * PDB structure ID being viewed
   */
  structureId?: string;

  /**
   * Callback when session is created/joined
   */
  onSessionActive?: () => void;

  /**
   * Callback when session ends
   */
  onSessionEnd?: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  userId,
  userName,
  structureId,
  onSessionActive,
  onSessionEnd,
}) => {
  const session = useCollaborationStore(selectCurrentSession);
  const { createSession, joinByInvite, leaveSession } = useCollaboration(userId, userName);

  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  /**
   * Create new session
   */
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createSession(sessionName.trim());
      setSessionName('');
      onSessionActive?.();
      setShowInviteDialog(true); // Show invite dialog after creation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Join session by invite code
   */
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await joinByInvite(inviteCode.toUpperCase().trim());
      setInviteCode('');
      onSessionActive?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Leave current session
   */
  const handleLeaveSession = async () => {
    const confirmed = confirm(
      'Are you sure you want to leave this session? This will disconnect you from all collaborators.'
    );

    if (!confirmed) return;

    try {
      await leaveSession();
      onSessionEnd?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
    }
  };

  // If already in session, show session controls
  if (session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Session</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveSession}
            >
              Leave Session
            </Button>
          </CardTitle>
          <CardDescription>
            You are currently in a collaboration session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="font-medium">{session.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Session ID: {session.id}
            </div>
            {structureId && (
              <div className="text-sm text-muted-foreground">
                Structure: {structureId}
              </div>
            )}
          </div>

          {/* Invite Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowInviteDialog(true)}
          >
            Share Invite Link
          </Button>

          {/* Invite Dialog */}
          <InviteDialog
            open={showInviteDialog}
            onClose={() => setShowInviteDialog(false)}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show create/join forms
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Collaborating</CardTitle>
        <CardDescription>
          Create a new session or join an existing one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Session</TabsTrigger>
            <TabsTrigger value="join">Join Session</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create">
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  type="text"
                  placeholder="e.g., Protein Analysis Session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={isLoading}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your collaboration session
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !sessionName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Session'}
              </Button>
            </form>
          </TabsContent>

          {/* Join Tab */}
          <TabsContent value="join">
            <form onSubmit={handleJoinSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="e.g., ABC12345"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  maxLength={8}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 8-character invite code from your collaborator
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !inviteCode.trim()}
              >
                {isLoading ? 'Joining...' : 'Join Session'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
