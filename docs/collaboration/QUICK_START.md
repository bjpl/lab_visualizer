# Collaboration Quick Start Guide

## Setup (5 minutes)

### 1. Database Setup
```bash
# Run migration
psql -U postgres -d lab_visualizer -f docs/collaboration/DATABASE_MIGRATION.sql

# Verify tables created
psql -U postgres -d lab_visualizer -c "\dt"
```

### 2. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Enable Supabase Realtime
```sql
-- In Supabase SQL editor
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_users;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE session_activities;
```

## Basic Usage

### Create a Session
```tsx
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';

function MyApp() {
  const user = useAuth();

  return (
    <CollaborationPanel
      userId={user.id}
      userName={user.name}
      structureId="protein-123"
    />
  );
}
```

### Using Hooks

```tsx
import { useCollaboration, useCameraSync } from '@/hooks/use-collaboration';

function MyComponent() {
  // Session management
  const { session, createSession, joinSession } = useCollaboration(
    'user-1',
    'John Doe'
  );

  // Camera sync
  const { isFollowing, toggleFollow, updateCamera } = useCameraSync();

  const handleCreateSession = async () => {
    const session = await createSession('My Session');
    console.log('Session created:', session.inviteCode);
  };

  return (
    <div>
      <button onClick={handleCreateSession}>Create Session</button>
      <button onClick={toggleFollow}>
        {isFollowing ? 'Stop Following' : 'Follow Camera'}
      </button>
    </div>
  );
}
```

### Direct Store Access

```tsx
import { useCollaborationStore } from '@/store/collaboration-slice';

function UserList() {
  const users = useCollaborationStore((state) =>
    Array.from(state.users.values())
  );

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} - {user.role}
        </li>
      ))}
    </ul>
  );
}
```

## Common Operations

### Add Annotation
```typescript
import { collaborationSession } from '@/services/collaboration-session';

const annotation = {
  id: `ann-${Date.now()}`,
  userId: currentUser.id,
  userName: currentUser.name,
  content: 'Important site',
  position: { x: 10, y: 20, z: 30 },
  target: { type: 'residue', id: 123, label: 'ALA-123' },
  color: '#FF6B6B',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: false,
};

await collaborationSession.broadcast('annotation-add', annotation);
```

### Request Camera Control
```typescript
import { cameraSync } from '@/services/camera-sync';

await cameraSync.requestControl(sessionId);
cameraSync.setLeader(true);

// Broadcast updates
cameraSync.broadcastCameraUpdate({
  position: [0, 0, 5],
  target: [0, 0, 0],
  zoom: 1,
  rotation: [0, 0, 0],
});
```

### Handle Conflicts
```typescript
import { conflictResolution } from '@/services/conflict-resolution';

// Register optimistic update
const update = conflictResolution.registerOptimisticUpdate(
  'ann-1',
  'annotation',
  { content: 'New content' },
  userId
);

// Later, resolve with remote
const resolution = conflictResolution.resolveConflict(
  update,
  remoteData,
  'last-write-wins'
);

// Apply or rollback
if (resolution.conflicts.length > 0) {
  conflictResolution.rollback('ann-1');
}
```

## Testing

```bash
# Run all tests
npm test tests/collaboration.test.tsx

# Run specific test
npm test tests/collaboration.test.tsx -t "should create session"

# Watch mode
npm test tests/collaboration.test.tsx --watch
```

## Troubleshooting

### No Connection
1. Check Supabase URL/key
2. Verify Realtime enabled
3. Check browser console for errors
4. Verify RLS policies

### Cursor Not Showing
1. Check cursor updates in Network tab
2. Verify user is connected
3. Check CursorOverlay is rendered
4. Verify throttling isn't too aggressive

### Annotations Not Syncing
1. Check permissions (role)
2. Verify broadcast success
3. Check conflict resolution logs
4. Verify Realtime subscription

### Camera Not Following
1. Verify follow mode enabled
2. Check leader ID in session
3. Verify camera updates broadcast
4. Check interpolation logs

## Performance Tips

1. **Throttle Aggressively**: Adjust throttle rates based on network
2. **Limit Users**: Keep sessions under 10 users
3. **Clean Old Activities**: Activity log auto-prunes at 100
4. **Use Optimistic Updates**: Better UX with rollback
5. **Monitor Bandwidth**: Check Network tab for data usage

## Security Checklist

- [ ] RLS policies enabled
- [ ] Auth required for all operations
- [ ] Owner-only management actions
- [ ] Session expiration enforced
- [ ] No secrets in client code
- [ ] Input validation on all fields

## Quick Reference

### User Roles
- **Owner**: Full control, can kick users
- **Presenter**: Camera + annotations
- **Viewer**: View only

### Event Types
- `cursor-move`, `annotation-add`, `annotation-edit`, `annotation-delete`
- `camera-update`, `user-join`, `user-leave`, `user-update`
- `activity`, `session-update`

### Conflict Strategies
- `last-write-wins`: Newest timestamp wins
- `merge`: Combine non-conflicting fields
- `reject`: Always use remote

### Throttle Rates
- Cursor: 10Hz (100ms)
- Camera: 5Hz (200ms)
- Presence: 0.033Hz (30s)

## Support

- Docs: `/docs/collaboration/COLLABORATION_SYSTEM.md`
- Tests: `/tests/collaboration.test.tsx`
- Types: `/src/types/collaboration.ts`
- Examples: `/src/components/collaboration/CollaborationPanel.tsx`
