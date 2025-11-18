# Collaboration Components

Real-time collaboration UI components for the LAB Visualization Platform.

## Components

### CollaborationPanel
Main integration component combining all collaboration features.

```tsx
import { CollaborationPanel } from '@/components/collaboration';

<CollaborationPanel
  userId="user-123"
  userName="John Doe"
  structureId="protein-xyz"
  onClose={() => setShowPanel(false)}
/>
```

### CursorOverlay
Displays real-time cursors from other users with avatars and labels.

```tsx
import { CursorOverlay } from '@/components/collaboration';

<CursorOverlay />
```

### AnnotationTools
Interface for creating and managing collaborative annotations.

```tsx
import { AnnotationTools } from '@/components/collaboration';

<AnnotationTools
  structureId="protein-xyz"
  onAnnotationSelect={(annotation) => console.log(annotation)}
/>
```

### ActivityFeed
Real-time activity log showing user actions and events.

```tsx
import { ActivityFeed } from '@/components/collaboration';

<ActivityFeed
  maxHeight="500px"
  showFilters={true}
/>
```

### UserPresence
User presence panel with role management and controls.

```tsx
import { UserPresence } from '@/components/collaboration';

<UserPresence
  sessionId="session-123"
  onUserClick={(user) => console.log(user)}
/>
```

## Features

- Real-time cursor broadcasting (10Hz)
- Collaborative annotations with CRUD
- Activity event logging
- User presence with role management
- Camera synchronization with leader mode
- Conflict resolution with optimistic updates
- Permission-based access control

## State Management

All components use the Zustand collaboration store:

```tsx
import { useCollaborationStore } from '@/store/collaboration-slice';

const users = useCollaborationStore((state) =>
  Array.from(state.users.values())
);
```

## Hooks

```tsx
import {
  useCollaboration,
  useCameraSync,
  useInviteLink
} from '@/hooks/use-collaboration';

const { session, createSession } = useCollaboration(userId, userName);
const { isFollowing, toggleFollow } = useCameraSync();
const { inviteLink, copyToClipboard } = useInviteLink();
```

## Styling

Components use Tailwind CSS with dark mode support:
- Light theme: `bg-white text-gray-900`
- Dark theme: `dark:bg-gray-900 dark:text-white`

## Performance

- Cursor updates throttled to 10Hz
- Camera updates throttled to 5Hz
- Activity buffer limited to 100 events
- Smooth transitions with cubic easing

## Testing

```bash
npm test tests/collaboration.test.tsx
```

## Documentation

- Full docs: `/docs/collaboration/COLLABORATION_SYSTEM.md`
- Quick start: `/docs/collaboration/QUICK_START.md`
- Implementation: `/docs/collaboration/IMPLEMENTATION_SUMMARY.md`
