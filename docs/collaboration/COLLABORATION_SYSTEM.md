# Collaboration System Documentation

## Overview

The LAB Visualization Platform collaboration system enables real-time multi-user interaction for molecular structure exploration, annotation, and analysis.

## Architecture

### Components

1. **Zustand Store** (`/src/store/collaboration-slice.ts`)
   - Centralized state management
   - Optimistic updates
   - Real-time synchronization

2. **Session Management** (`/src/services/collaboration-session.ts`)
   - Session lifecycle (create, join, leave)
   - Supabase Realtime integration
   - Presence tracking
   - Role-based access control

3. **Camera Sync** (`/src/services/camera-sync.ts`)
   - Leader-guided camera control
   - Smooth transitions
   - Throttled broadcasting

4. **Conflict Resolution** (`/src/services/conflict-resolution.ts`)
   - Last-write-wins strategy
   - Merge strategies
   - Optimistic update rollback

5. **React Hooks** (`/src/hooks/use-collaboration.ts`)
   - `useCollaboration` - Session management
   - `useCameraSync` - Camera synchronization
   - `useInviteLink` - Invite link generation

6. **UI Components**
   - `CursorOverlay` - Real-time cursor broadcasting
   - `AnnotationTools` - Collaborative annotations
   - `ActivityFeed` - Event logging
   - `UserPresence` - User management

## Features

### Session Management

```typescript
// Create session
const session = await collaborationSession.createSession(
  'Session Name',
  userId,
  userName
);

// Join session
const { session, user } = await collaborationSession.joinSession(
  sessionId,
  userId,
  userName
);

// Join by invite code
const { session, user } = await collaborationSession.joinByInviteCode(
  'ABC123',
  userId,
  userName
);
```

### Real-Time Updates

```typescript
// Connect to Realtime channel
collaborationSession.connectToChannel(
  sessionId,
  userId,
  (type, payload) => {
    // Handle events
  }
);

// Broadcast events
await collaborationSession.broadcast('cursor-move', {
  userId,
  x: 50,
  y: 50,
  timestamp: Date.now()
});
```

### Camera Synchronization

```typescript
// Request camera control
await cameraSync.requestControl(sessionId);

// Broadcast camera updates (throttled to 5Hz)
cameraSync.broadcastCameraUpdate({
  position: [0, 0, 5],
  target: [0, 0, 0],
  zoom: 1,
  rotation: [0, 0, 0]
});

// Follow mode
cameraSync.setFollowing(true);
```

### Annotations

```typescript
// Add annotation
const annotation = {
  id: 'ann-1',
  userId,
  userName,
  content: 'Important residue',
  position: { x: 10, y: 20, z: 30 },
  target: { type: 'residue', id: 123, label: 'ALA-123' },
  color: '#FF6B6B',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: false
};

await collaborationSession.broadcast('annotation-add', annotation);
```

### Conflict Resolution

```typescript
// Register optimistic update
const update = conflictResolution.registerOptimisticUpdate(
  'ann-1',
  'annotation',
  { content: 'Updated' },
  userId
);

// Resolve conflicts
const resolution = conflictResolution.resolveConflict(
  update,
  remoteData,
  'last-write-wins'
);

// Rollback if needed
if (resolution.conflicts.length > 0) {
  conflictResolution.rollback('ann-1');
}
```

## Realtime Events

### Event Types

- `cursor-move` - Cursor position updates
- `annotation-add` - New annotation
- `annotation-edit` - Annotation updated
- `annotation-delete` - Annotation removed
- `camera-update` - Camera state changed
- `user-join` - User joined session
- `user-leave` - User left session
- `user-update` - User info updated
- `activity` - Activity logged
- `session-update` - Session settings changed

### Event Throttling

- Cursor updates: 10Hz (100ms)
- Camera updates: 5Hz (200ms)
- Annotations: No throttling (immediate)

## User Roles

### Owner
- Full control
- Manage users (kick, change roles)
- End session
- All presenter & viewer permissions

### Presenter
- Control camera (leader mode)
- Add/edit/delete own annotations
- All viewer permissions

### Viewer
- View only
- Cannot modify structure or annotations
- Can follow camera

## Performance Optimizations

### Throttling
```typescript
const CURSOR_UPDATE_THROTTLE = 100; // 10Hz
const CAMERA_UPDATE_THROTTLE = 200; // 5Hz
```

### Interpolation
Smooth cursor/camera transitions using cubic easing:
```typescript
const eased = 1 - Math.pow(1 - progress, 3);
```

### Batching
Store operations batched for efficiency:
```typescript
// Multiple updates in single render
updateUser(user1);
updateUser(user2);
updateUser(user3);
// → Single re-render
```

## Database Schema

### Tables Required

```sql
-- Collaboration sessions
CREATE TABLE collaboration_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  structure_id TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Session users
CREATE TABLE session_users (
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'presenter', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Annotations
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  position JSONB NOT NULL,
  target JSONB,
  color TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE session_activities (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_active ON collaboration_sessions(is_active);
CREATE INDEX idx_sessions_invite ON collaboration_sessions(invite_code);
CREATE INDEX idx_annotations_session ON annotations(session_id);
CREATE INDEX idx_activities_session ON session_activities(session_id);
```

## Testing

Run test suite:
```bash
npm test tests/collaboration.test.tsx
```

Coverage targets:
- Store: 95%
- Services: 90%
- Components: 85%
- Hooks: 90%

## Best Practices

### 1. Always Use Optimistic Updates
```typescript
// ✅ Good
addAnnotation(annotation);
try {
  await broadcast('annotation-add', annotation);
} catch (error) {
  deleteAnnotation(annotation.id); // Rollback
}

// ❌ Bad
await broadcast('annotation-add', annotation);
addAnnotation(annotation); // Slow
```

### 2. Handle Conflicts Gracefully
```typescript
const resolution = conflictResolution.resolveConflict(
  local,
  remote,
  'merge'
);

if (resolution.conflicts.length > 0) {
  // Show conflict UI
  notifyUser('Conflict detected');
}
```

### 3. Throttle Frequent Updates
```typescript
// Use built-in throttling
cameraSync.broadcastCameraUpdate(state); // Already throttled

// Or implement custom throttling
const throttledUpdate = throttle(updateFn, 100);
```

### 4. Clean Up Resources
```typescript
useEffect(() => {
  // Setup
  collaborationSession.connectToChannel(sessionId, userId, handleEvent);

  return () => {
    // Cleanup
    collaborationSession.disconnectFromChannel();
  };
}, [sessionId, userId]);
```

## Troubleshooting

### Connection Issues
- Check Supabase Realtime is enabled
- Verify environment variables
- Check network connectivity

### Sync Delays
- Reduce throttle intervals (trade-off: more bandwidth)
- Check for network latency
- Verify presence heartbeat is working

### Conflicts
- Use appropriate conflict strategy
- Implement UI for manual resolution
- Log conflicts for debugging

## Future Enhancements

1. **Voice Chat** - WebRTC integration
2. **Screen Sharing** - Share viewport
3. **Playback** - Record/replay sessions
4. **Persistent Annotations** - Save to database
5. **Advanced Permissions** - Fine-grained control
6. **Multi-structure** - Multiple structures in one session
7. **Undo/Redo** - Operation history

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [Conflict-free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
