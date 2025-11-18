# ADR-004: State Management with Zustand

## Status
Accepted

## Context

The LAB Visualization Platform has complex state management requirements due to the nature of 3D molecular visualization, real-time collaboration, and simulation playback:

1. **State Complexity**:
   - 3D viewer state (camera, selections, representations)
   - Loaded molecular structures (potentially 100MB+ in memory)
   - Simulation trajectories and playback state
   - User preferences and UI state
   - Collaboration state (shared cursors, annotations)
   - Caching state (IndexedDB, edge, database)

2. **Performance Requirements**:
   - 60 FPS for 3D rendering (cannot block main thread)
   - <16ms state updates for smooth animations
   - Minimal re-renders (React optimization critical)
   - Efficient memory management for large structures

3. **Collaboration Requirements**:
   - Real-time state synchronization across users
   - Optimistic updates for low-latency UX
   - Conflict resolution for concurrent edits
   - Offline support with eventual consistency

4. **Developer Experience**:
   - Easy to test and debug
   - Type-safe (TypeScript support)
   - Minimal boilerplate
   - Good DevTools integration

5. **Bundle Size Concerns**:
   - Target: <50KB for state management library
   - Need to avoid over-engineering (looking at you, Redux)

## Decision

We will adopt **Zustand for global state management** with **React Query for server state**:

### Zustand for Global State
- **Scope**: Client-side application state
- **Use Cases**:
  - 3D viewer state (camera, selections, representations)
  - UI state (panels, modals, themes)
  - User preferences (settings, favorites)
  - Simulation playback state
  - Local cache state

### React Query for Server State
- **Scope**: Server data fetching and caching
- **Use Cases**:
  - Fetching molecular structures from APIs
  - Loading simulation trajectories
  - User data synchronization
  - Optimistic updates for mutations

### State Architecture
```
Application State
├── Zustand Stores
│   ├── viewerStore (camera, selections, representations)
│   ├── uiStore (panels, modals, themes)
│   ├── simulationStore (playback, parameters)
│   ├── collaborationStore (shared state)
│   └── cacheStore (IndexedDB management)
└── React Query
    ├── Queries (structures, trajectories, user data)
    ├── Mutations (save, update, delete)
    └── Cache (automatic invalidation)
```

### Why Zustand Over Alternatives

**Zustand Advantages**:
1. **Tiny Bundle**: 1.3KB (vs Redux 12KB + Redux Toolkit 30KB)
2. **No Boilerplate**: No actions, reducers, or complex setup
3. **Type-Safe**: Excellent TypeScript support out-of-the-box
4. **Performance**: No context, no unnecessary re-renders
5. **Flexibility**: Works outside React (Web Workers, WebGL)
6. **DevTools**: Built-in Redux DevTools support
7. **Middleware**: Persist, immer, devtools plugins available

**React Query Advantages**:
1. **Smart Caching**: Automatic background refetching and stale-while-revalidate
2. **Optimistic Updates**: Built-in support for optimistic mutations
3. **Error Handling**: Automatic retry and error boundaries
4. **Deduplication**: Automatic request deduplication
5. **Pagination**: Built-in infinite queries

## Consequences

### Positive
1. **Lightweight**: Combined 15KB (Zustand 1.3KB + React Query 13KB)
2. **Better Performance**: No context re-render issues, efficient updates
3. **Type Safety**: Full TypeScript support with minimal type overhead
4. **Easy Testing**: Stores are plain objects, easy to mock
5. **Developer Experience**: Minimal boilerplate, intuitive API
6. **Flexible**: Can use outside React (Web Workers for MD simulations)
7. **Collaboration Ready**: Easy to sync with Supabase Realtime
8. **Better Debugging**: Redux DevTools support for time-travel debugging

### Negative
1. **Less Ecosystem**: Smaller ecosystem than Redux
2. **No Enforced Patterns**: Team must establish conventions
3. **Learning Curve**: Developers familiar with Redux need to adapt
4. **Global Mutable State**: Easier to accidentally create bugs
5. **No Built-in Effects**: Must integrate with React Query for async

### Risk Mitigation
- **Enforce Conventions**: Document best practices and patterns
- **Code Review**: Ensure proper state isolation and immutability
- **Testing**: High test coverage for state logic
- **Linting**: Custom ESLint rules for Zustand anti-patterns

## Alternatives Considered

### 1. Redux + Redux Toolkit
**Rejected**:
- **Bundle Size**: 42KB (too large)
- **Boilerplate**: Actions, reducers, slices (slower development)
- **Performance**: Context-based, unnecessary re-renders
- **Complexity**: Overkill for our use case

### 2. Context API + useReducer
**Rejected**:
- **Performance**: Context re-renders entire subtree
- **No DevTools**: Hard to debug complex state
- **Boilerplate**: Must write reducers manually
- **No Middleware**: Hard to add persistence, logging

### 3. Jotai (Atomic State)
**Rejected**:
- **Mental Model**: Atomic state harder for complex state relationships
- **Less Mature**: Smaller ecosystem and community
- **Performance**: Similar to Zustand, no clear advantage

### 4. Recoil
**Rejected**:
- **Experimental**: Still in experimental phase (Meta project)
- **Bundle Size**: Larger than Zustand (8KB)
- **Complexity**: More complex API than Zustand
- **Less Adoption**: Smaller community

### 5. MobX
**Rejected**:
- **Magic**: Observable pattern can be confusing
- **Bundle Size**: 16KB (larger than Zustand + React Query)
- **Decorators**: Requires additional Babel configuration

## Implementation Notes

### Viewer Store
```typescript
interface ViewerState {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
  };
  selection: {
    residues: number[];
    atoms: number[];
  };
  representation: 'cartoon' | 'surface' | 'ball-and-stick';

  // Actions
  setCamera: (camera: ViewerState['camera']) => void;
  setSelection: (selection: ViewerState['selection']) => void;
  setRepresentation: (rep: ViewerState['representation']) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  camera: { position: [0, 0, 100], target: [0, 0, 0], zoom: 1 },
  selection: { residues: [], atoms: [] },
  representation: 'cartoon',

  setCamera: (camera) => set({ camera }),
  setSelection: (selection) => set({ selection }),
  setRepresentation: (representation) => set({ representation }),
}));
```

### Simulation Store with Middleware
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface SimulationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  playbackSpeed: number;

  play: () => void;
  pause: () => void;
  setFrame: (frame: number) => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>()(
  devtools(
    persist(
      (set) => ({
        isPlaying: false,
        currentFrame: 0,
        totalFrames: 0,
        playbackSpeed: 1.0,

        play: () => set({ isPlaying: true }),
        pause: () => set({ isPlaying: false }),
        setFrame: (currentFrame) => set({ currentFrame }),
        setSpeed: (playbackSpeed) => set({ playbackSpeed }),
      }),
      { name: 'simulation-store' }
    )
  )
);
```

### React Query for Structure Fetching
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch structure with automatic caching
export function useStructure(pdbId: string) {
  return useQuery({
    queryKey: ['structure', pdbId],
    queryFn: () => fetchStructure(pdbId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Save custom structure with optimistic update
export function useSaveStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (structure: Structure) => saveStructure(structure),
    onMutate: async (newStructure) => {
      // Optimistic update
      await queryClient.cancelQueries(['structures']);
      const previous = queryClient.getQueryData(['structures']);
      queryClient.setQueryData(['structures'], (old: Structure[]) =>
        [...old, newStructure]
      );
      return { previous };
    },
    onError: (err, newStructure, context) => {
      // Rollback on error
      queryClient.setQueryData(['structures'], context?.previous);
    },
  });
}
```

### Collaboration Store with Supabase Realtime
```typescript
interface CollaborationState {
  participants: Map<string, Participant>;
  sharedSelection: number[];

  addParticipant: (id: string, participant: Participant) => void;
  removeParticipant: (id: string) => void;
  setSharedSelection: (selection: number[]) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  participants: new Map(),
  sharedSelection: [],

  addParticipant: (id, participant) =>
    set((state) => ({
      participants: new Map(state.participants).set(id, participant),
    })),
  removeParticipant: (id) =>
    set((state) => {
      const participants = new Map(state.participants);
      participants.delete(id);
      return { participants };
    }),
  setSharedSelection: (sharedSelection) => set({ sharedSelection }),
}));

// Sync with Supabase Realtime
export function useCollaborationSync(sessionId: string) {
  const { addParticipant, removeParticipant, setSharedSelection } =
    useCollaborationStore();

  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        addParticipant(key, newPresences[0]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        removeParticipant(key);
      })
      .on('broadcast', { event: 'selection' }, ({ payload }) => {
        setSharedSelection(payload.selection);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [sessionId]);
}
```

### Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useViewerStore } from './viewerStore';

describe('useViewerStore', () => {
  it('should update camera position', () => {
    const { result } = renderHook(() => useViewerStore());

    act(() => {
      result.current.setCamera({
        position: [10, 20, 30],
        target: [0, 0, 0],
        zoom: 1.5,
      });
    });

    expect(result.current.camera.position).toEqual([10, 20, 30]);
    expect(result.current.camera.zoom).toBe(1.5);
  });
});
```

## References
- Zustand: https://github.com/pmndrs/zustand
- React Query: https://tanstack.com/query/latest
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Technical Analysis: `/docs/analysis/technical-analysis.md`
