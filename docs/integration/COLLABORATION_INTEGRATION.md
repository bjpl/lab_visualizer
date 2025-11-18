# Collaboration Integration Documentation

## Overview

This document describes the integration of real-time collaboration features into the LAB Visualization Platform. The integration combines the MolStar molecular viewer with Supabase Realtime to enable multi-user collaboration on molecular structure exploration.

## Architecture

### Component Hierarchy

```
ViewerLayout (Main Container)
├── Toolbar (Top navigation with collaboration toggle)
├── Canvas Area
│   ├── MolecularViewer (MolStar wrapper)
│   └── CollaborativeViewer (Collaboration wrapper)
│       ├── MolecularViewer
│       └── CursorOverlay (Other users' cursors)
└── Panels (Conditional rendering)
    ├── ControlsPanel (Standard viewer controls)
    └── CollaborationPanel (Collaboration features)
        ├── SessionManager (Create/join sessions)
        ├── InviteDialog (Share invite links)
        ├── UserPresence (Active users list)
        ├── AnnotationTools (Shared annotations)
        └── ActivityFeed (Session activity log)
```

### Data Flow

```
User Action (camera move, annotation)
  ↓
CollaborativeViewer captures event
  ↓
useCollaboration hook processes
  ↓
CollaborationSessionService broadcasts
  ↓
Supabase Realtime Channel
  ↓
Remote users receive event
  ↓
useCollaboration hook handles event
  ↓
Zustand store updates
  ↓
UI re-renders with new state
```

## Components

### 1. CollaborativeViewer

**Purpose**: Wraps MolecularViewer with collaboration features.

**Location**: `src/components/viewer/CollaborativeViewer.tsx`

**Key Features**:
- Camera synchronization
- Cursor position broadcasting
- Structure selection sharing
- Following mode indicator
- Session status display

**Props**:
```typescript
interface CollaborativeViewerProps {
  userId: string;
  userName: string;
  pdbId?: string;
  pdbData?: string;
  config?: MolstarConfig;
  enableLOD?: boolean;
  className?: string;
  onStructureLoaded?: (metadata: any) => void;
  onError?: (error: Error) => void;
}
```

**Usage**:
```tsx
<CollaborativeViewer
  userId={user.id}
  userName={user.name}
  pdbId="1CRN"
  enableLOD={true}
  onStructureLoaded={(metadata) => console.log('Loaded:', metadata)}
/>
```

### 2. SessionManager

**Purpose**: UI for creating and joining collaboration sessions.

**Location**: `src/components/session/SessionManager.tsx`

**Key Features**:
- Create new sessions
- Join by invite code
- Leave active sessions
- Share invite links
- Session status display

**Props**:
```typescript
interface SessionManagerProps {
  userId: string;
  userName: string;
  structureId?: string;
  onSessionActive?: () => void;
  onSessionEnd?: () => void;
}
```

**Usage**:
```tsx
<SessionManager
  userId={user.id}
  userName={user.name}
  structureId={pdbId}
  onSessionActive={() => console.log('Session active')}
  onSessionEnd={() => console.log('Session ended')}
/>
```

### 3. InviteDialog

**Purpose**: Dialog for sharing session invite links and codes.

**Location**: `src/components/session/InviteDialog.tsx`

**Key Features**:
- Display invite link
- Display invite code
- Copy to clipboard
- Web Share API integration
- Success feedback

**Props**:
```typescript
interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
}
```

**Usage**:
```tsx
const [showInvite, setShowInvite] = useState(false);

<InviteDialog
  open={showInvite}
  onClose={() => setShowInvite(false)}
/>
```

## State Management

### Zustand Store

The `useCollaborationStore` manages all collaboration state:

```typescript
interface CollaborationState {
  // Session
  currentSession: CollaborationSession | null;
  setSession: (session: CollaborationSession | null) => void;

  // Users
  users: Map<string, CollaborationUser>;
  currentUserId: string | null;
  updateUser: (user: CollaborationUser) => void;
  removeUser: (userId: string) => void;

  // Annotations
  annotations: Map<string, Annotation>;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, update: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;

  // Camera
  cameraState: CameraState | null;
  isFollowingCamera: boolean;
  updateCameraState: (state: CameraState) => void;
  setFollowingCamera: (following: boolean) => void;

  // Activity
  activities: ActivityEvent[];
  addActivity: (activity: ActivityEvent) => void;

  // Connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Reset
  reset: () => void;
}
```

### State Selectors

Optimized selectors for efficient access:

```typescript
// Get current session
const session = useCollaborationStore(selectCurrentSession);

// Get all users as array
const users = useCollaborationStore(selectUsers);

// Get specific user
const user = useCollaborationStore(selectUserById('user-123'));

// Get current user
const currentUser = useCollaborationStore(selectCurrentUser);

// Get all annotations
const annotations = useCollaborationStore(selectAnnotations);

// Check if user is owner
const isOwner = useCollaborationStore(selectIsOwner);

// Check if user can control
const canControl = useCollaborationStore(selectCanControl);
```

## Hooks

### useCollaboration

Main hook for collaboration functionality:

```typescript
const {
  session,           // Current session
  isConnected,       // Connection status
  createSession,     // Create new session
  joinSession,       // Join by session ID
  joinByInvite,      // Join by invite code
  leaveSession,      // Leave current session
} = useCollaboration(userId, userName);
```

### useCameraSync

Hook for camera synchronization:

```typescript
const {
  isFollowing,       // Following camera leader
  updateCamera,      // Broadcast camera update
  requestControl,    // Request camera control
  releaseControl,    // Release camera control
  toggleFollow,      // Toggle follow mode
} = useCameraSync();
```

### useInviteLink

Hook for invite link functionality:

```typescript
const {
  inviteLink,        // Full invite URL
  inviteCode,        // 8-character code
  copyToClipboard,   // Copy link function
} = useInviteLink();
```

## Real-time Events

### Event Types

```typescript
interface RealtimeEvents {
  'cursor-move': { userId: string; x: number; y: number; target?: string };
  'annotation-add': Annotation;
  'annotation-edit': Partial<Annotation> & { id: string };
  'annotation-delete': { id: string };
  'camera-update': { state: CameraState };
  'user-join': CollaborationUser;
  'user-leave': { userId: string };
  'user-update': Partial<CollaborationUser> & { id: string };
  'activity': ActivityEvent;
  'session-update': Partial<CollaborationSession>;
}
```

### Event Broadcasting

```typescript
// Broadcast camera update (throttled to 100ms)
updateCamera(cameraState);

// Broadcast annotation
collaborationSession.broadcast('annotation-add', {
  id: 'ann-123',
  content: 'This is important',
  position: { x: 10, y: 20 },
  target: 'residue:42',
  userId: 'user-123',
  userName: 'John Doe',
  createdAt: Date.now(),
});

// Broadcast activity
collaborationSession.broadcast('activity', {
  id: 'act-123',
  type: 'structure-loaded',
  userId: 'user-123',
  userName: 'John Doe',
  timestamp: Date.now(),
  message: 'John Doe loaded structure 1CRN',
});
```

### Event Handling

Events are automatically handled by the `useCollaboration` hook:

```typescript
// Events are processed through handleRealtimeEvent
// Updates are applied to Zustand store
// UI automatically re-renders with new state
```

## Session Lifecycle

### 1. Create Session

```typescript
const session = await createSession('Protein Analysis');
// Session created with unique ID and invite code
// User added as owner
// Realtime channel connected
```

### 2. Join Session

```typescript
// By invite code
await joinByInvite('ABC12345');

// By session ID
await joinSession('session-123');

// User added to session
// Presence tracking started
// Realtime events subscribed
```

### 3. Active Session

```typescript
// Camera synchronization active
// Annotations shared in real-time
// User presence updated every 15s
// Activity feed populated
```

### 4. Leave Session

```typescript
await leaveSession();
// User removed from session
// Presence cleared
// Realtime channel disconnected
// Store reset
```

## Integration with ViewerLayout

### Props Enhancement

```typescript
interface ViewerLayoutProps {
  pdbId?: string;
  className?: string;
  userId?: string;              // NEW
  userName?: string;            // NEW
  enableCollaboration?: boolean; // NEW
}
```

### Collaboration Toggle

The viewer includes a collaboration toggle button:

```tsx
{enableCollaboration && (
  <Button
    variant={isInSession ? 'default' : 'outline'}
    onClick={() => setShowCollaboration(!showCollaboration)}
  >
    <Users className="h-4 w-4" />
    {isInSession ? 'In Session' : 'Collaborate'}
    {isInSession && <Badge>{userCount}</Badge>}
  </Button>
)}
```

### Panel Switching

The panel switches between Controls and Collaboration:

```tsx
{!showCollaboration && <ControlsPanel />}
{showCollaboration && <CollaborationPanel />}
```

## Supabase Integration

### Database Schema

```sql
-- Collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  structure_id TEXT,
  invite_code TEXT UNIQUE,
  settings JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session users
CREATE TABLE session_users (
  session_id UUID REFERENCES collaboration_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT,
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);
```

### Realtime Channels

Each session has a dedicated channel:

```typescript
const channel = supabase.channel(`session:${sessionId}`, {
  config: {
    presence: {
      key: userId,
    },
  },
});

// Subscribe to events
channel
  .on('broadcast', { event: 'camera-update' }, handleCameraUpdate)
  .on('broadcast', { event: 'annotation-add' }, handleAnnotationAdd)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .on('presence', { event: 'join' }, handleUserJoin)
  .on('presence', { event: 'leave' }, handleUserLeave)
  .subscribe();
```

### Presence Tracking

Presence is tracked with heartbeat:

```typescript
// Initial presence
await channel.track({
  userId,
  onlineAt: new Date().toISOString(),
});

// Heartbeat every 15s
setInterval(() => {
  channel.track({
    userId,
    onlineAt: new Date().toISOString(),
  });
}, 15000);
```

## Performance Considerations

### Event Throttling

```typescript
// Camera updates throttled to 100ms
const CAMERA_BROADCAST_THROTTLE = 100;

// Cursor updates throttled to 50ms
const CURSOR_BROADCAST_THROTTLE = 50;
```

### Optimistic Updates

```typescript
// Update local state immediately
updateAnnotation(id, changes);

// Broadcast to others
broadcast('annotation-edit', { id, ...changes });

// Rollback on error
if (broadcastFailed) {
  revertAnnotation(id, originalState);
}
```

### Memory Management

```typescript
// Limit activity feed to last 100 events
const MAX_ACTIVITIES = 100;

// Clean up on unmount
useEffect(() => {
  return () => {
    collaborationSession.disconnectFromChannel();
    cameraSync.cleanup();
  };
}, []);
```

## Testing

### Integration Tests

Location: `tests/integration/collaboration-integration.test.ts`

Test coverage:
- ✅ SessionManager create/join functionality
- ✅ InviteDialog display and copy
- ✅ CollaborativeViewer session indicators
- ✅ ViewerLayout collaboration toggle
- ✅ Real-time state synchronization
- ✅ Session lifecycle management

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run collaboration tests specifically
npm run test tests/integration/collaboration-integration.test.ts

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

**Issue**: Realtime channel not connecting
**Solution**: Check Supabase URL and anon key in environment variables

**Issue**: Camera updates not syncing
**Solution**: Verify camera state is being captured and throttling is not too aggressive

**Issue**: Invite code not working
**Solution**: Ensure invite code is uppercase and session hasn't expired

**Issue**: Users not appearing in presence
**Solution**: Check presence heartbeat is running and not being blocked

### Debug Mode

Enable debug logging:

```typescript
// In collaboration service
console.log('[Collaboration] Event:', type, payload);

// In camera sync
console.log('[CameraSync] Update:', state);

// In hooks
console.log('[useCollaboration] State:', useCollaborationStore.getState());
```

## Security

### Session Access Control

```typescript
// Only session owner can:
- End session
- Change session settings
- Kick users
- Change user roles

// All users can:
- Create annotations (if enabled)
- Follow camera
- View activity feed
```

### Invite Code Security

```typescript
// Invite codes:
- 8 characters uppercase
- Random generation
- Single use option (future)
- Expiration with session
```

## Future Enhancements

### Planned Features

1. **Annotation Permissions**: Owner-only vs all-users annotations
2. **Camera Leadership**: Elect a camera leader
3. **Session Recording**: Record and playback sessions
4. **Advanced Presence**: Show what each user is looking at
5. **Voice/Video**: Integrate WebRTC for communication
6. **Session Templates**: Save and load session configurations
7. **Analytics**: Track collaboration metrics
8. **Mobile Support**: Touch-optimized collaboration controls

### API Extensions

1. **Session History**: Query past sessions
2. **User Statistics**: Track collaboration activity
3. **Export/Import**: Save session state
4. **Notifications**: Alert users of important events

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [MolStar Documentation](https://molstar.org/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Integration Architecture](../architecture/INTEGRATION_ARCHITECTURE.md)
- [API Contracts](../architecture/API_CONTRACTS.md)
