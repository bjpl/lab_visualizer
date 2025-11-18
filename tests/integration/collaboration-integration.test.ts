/**
 * Integration tests for collaboration features
 * Tests the integration between MolStar viewer and collaboration system
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CollaborativeViewer } from '@/components/viewer/CollaborativeViewer';
import { SessionManager } from '@/components/session/SessionManager';
import { InviteDialog } from '@/components/session/InviteDialog';
import { ViewerLayout } from '@/components/viewer/ViewerLayout';
import { useCollaborationStore } from '@/store/collaboration-slice';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(),
    channel: vi.fn(),
  }),
}));

// Mock MolStar hook
vi.mock('@/hooks/use-molstar', () => ({
  useMolstar: () => ({
    containerRef: { current: null },
    isReady: true,
    isLoading: false,
    error: null,
    metadata: null,
    metrics: null,
    loadStructure: vi.fn(),
    loadStructureById: vi.fn(),
  }),
}));

describe('Collaboration Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useCollaborationStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SessionManager', () => {
    it('should render create and join tabs', () => {
      render(
        <SessionManager
          userId="test-user"
          userName="Test User"
        />
      );

      expect(screen.getByText('Start Collaborating')).toBeInTheDocument();
      expect(screen.getByText('Create Session')).toBeInTheDocument();
      expect(screen.getByText('Join Session')).toBeInTheDocument();
    });

    it('should validate session name input', async () => {
      render(
        <SessionManager
          userId="test-user"
          userName="Test User"
        />
      );

      const createButton = screen.getByRole('button', { name: /create session/i });
      expect(createButton).toBeDisabled();

      const input = screen.getByPlaceholderText(/protein analysis session/i);
      fireEvent.change(input, { target: { value: 'Test Session' } });

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });

    it('should validate invite code input', async () => {
      render(
        <SessionManager
          userId="test-user"
          userName="Test User"
        />
      );

      // Switch to join tab
      const joinTab = screen.getByText('Join Session');
      fireEvent.click(joinTab);

      const joinButton = screen.getByRole('button', { name: /join session/i });
      expect(joinButton).toBeDisabled();

      const input = screen.getByPlaceholderText(/abc12345/i);
      fireEvent.change(input, { target: { value: 'TEST1234' } });

      await waitFor(() => {
        expect(joinButton).not.toBeDisabled();
      });
    });

    it('should show active session controls when in session', () => {
      // Set active session in store
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });

      render(
        <SessionManager
          userId="test-user"
          userName="Test User"
        />
      );

      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('Test Session')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /leave session/i })).toBeInTheDocument();
    });
  });

  describe('InviteDialog', () => {
    beforeEach(() => {
      // Set active session for invite functionality
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });
    });

    it('should display invite link and code', () => {
      render(
        <InviteDialog
          open={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Invite Collaborators')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite Link')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite Code')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TEST1234')).toBeInTheDocument();
    });

    it('should copy invite code to clipboard', async () => {
      const writeText = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(
        <InviteDialog
          open={true}
          onClose={vi.fn()}
        />
      );

      const copyButtons = screen.getAllByTitle(/copy/i);
      fireEvent.click(copyButtons[1]); // Click code copy button

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('TEST1234');
      });
    });
  });

  describe('CollaborativeViewer', () => {
    it('should render MolStar viewer without session', () => {
      render(
        <CollaborativeViewer
          userId="test-user"
          userName="Test User"
          pdbId="1CRN"
        />
      );

      expect(screen.getByTestId('molecular-viewer')).toBeInTheDocument();
    });

    it('should show session indicator when in session', () => {
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });

      render(
        <CollaborativeViewer
          userId="test-user"
          userName="Test User"
          pdbId="1CRN"
        />
      );

      expect(screen.getByText(/session: test session/i)).toBeInTheDocument();
    });

    it('should show following indicator when following camera', () => {
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });
      useCollaborationStore.getState().setFollowingCamera(true);

      render(
        <CollaborativeViewer
          userId="test-user"
          userName="Test User"
          pdbId="1CRN"
        />
      );

      expect(screen.getByText('Following camera')).toBeInTheDocument();
    });
  });

  describe('ViewerLayout Integration', () => {
    it('should render with collaboration toggle button', () => {
      render(
        <ViewerLayout
          pdbId="1CRN"
          userId="test-user"
          userName="Test User"
          enableCollaboration={true}
        />
      );

      expect(screen.getByRole('button', { name: /collaborate/i })).toBeInTheDocument();
    });

    it('should toggle collaboration panel', async () => {
      render(
        <ViewerLayout
          pdbId="1CRN"
          userId="test-user"
          userName="Test User"
          enableCollaboration={true}
        />
      );

      const collaborateButton = screen.getByRole('button', { name: /collaborate/i });
      fireEvent.click(collaborateButton);

      await waitFor(() => {
        expect(screen.getByText('Start Collaborating')).toBeInTheDocument();
      });
    });

    it('should show user count when in session', () => {
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });

      // Add some users
      useCollaborationStore.getState().updateUser({
        id: 'user1',
        name: 'User 1',
        role: 'viewer',
        status: 'active',
        color: '#FF0000',
        lastActivity: Date.now(),
      });
      useCollaborationStore.getState().updateUser({
        id: 'user2',
        name: 'User 2',
        role: 'viewer',
        status: 'active',
        color: '#00FF00',
        lastActivity: Date.now(),
      });

      render(
        <ViewerLayout
          pdbId="1CRN"
          userId="test-user"
          userName="Test User"
          enableCollaboration={true}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /in session/i })).toBeInTheDocument();
    });
  });

  describe('Real-time State Synchronization', () => {
    it('should update camera state from remote user', async () => {
      const { rerender } = render(
        <CollaborativeViewer
          userId="test-user"
          userName="Test User"
          pdbId="1CRN"
        />
      );

      // Set session and enable following
      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'other-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: true,
        },
      });
      useCollaborationStore.getState().setFollowingCamera(true);

      // Simulate remote camera update
      useCollaborationStore.getState().updateCameraState({
        position: { x: 10, y: 20, z: 30 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        zoom: 1.5,
        fov: 45,
      });

      rerender(
        <CollaborativeViewer
          userId="test-user"
          userName="Test User"
          pdbId="1CRN"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Following camera')).toBeInTheDocument();
      });
    });

    it('should handle session expiration gracefully', async () => {
      const onSessionEnd = vi.fn();

      useCollaborationStore.getState().setSession({
        id: 'test-session',
        name: 'Test Session',
        ownerId: 'test-user',
        createdAt: Date.now(),
        expiresAt: Date.now() - 1000, // Expired
        isActive: true,
        inviteCode: 'TEST1234',
        settings: {
          allowAnnotations: true,
          allowCameraControl: true,
          requireApproval: false,
          maxUsers: 10,
          cameraFollowMode: false,
        },
      });

      render(
        <SessionManager
          userId="test-user"
          userName="Test User"
          onSessionEnd={onSessionEnd}
        />
      );

      // Session should show as expired or inactive
      expect(screen.getByText('Active Session')).toBeInTheDocument();
    });
  });
});
