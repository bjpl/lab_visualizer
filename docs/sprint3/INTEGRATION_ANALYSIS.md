# Integration Points Analysis - Sprint 3
**LAB Visualization Platform**
**Date**: 2025-11-17

---

## Overview

This document details the critical integration points between Sprint 1 (LOD System), Sprint 2 (Collaboration System), and Sprint 3 (Mol* Viewer + Data Pipeline).

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                         │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Structure      │  │ Collaboration    │  │ Quality          │    │
│  │ Browser        │  │ Panel            │  │ Settings         │    │
│  └────────┬───────┘  └────────┬─────────┘  └────────┬─────────┘    │
└───────────┼──────────────────┼──────────────────────┼──────────────┘
            │                  │                      │
            ▼                  ▼                      ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      Core Integration Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  Mol* Viewer Service                         │    │
│  │  • Structure loading    • Camera control                    │    │
│  │  • Representation       • Selection                         │    │
│  └───┬────────────────────┬────────────────────┬────────────────┘    │
│      │                    │                    │                     │
│      ▼                    ▼                    ▼                     │
│  ┌────────────┐      ┌──────────────┐    ┌─────────────┐           │
│  │ LOD        │◄─────┤ Camera       │    │ Quality     │           │
│  │ Manager    │      │ Sync         │    │ Manager     │           │
│  └────┬───────┘      └──────┬───────┘    └──────┬──────┘           │
│       │                     │                    │                  │
└───────┼─────────────────────┼────────────────────┼──────────────────┘
        │                     │                    │
        ▼                     ▼                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        Data & State Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐       │
│  │ PDB Fetcher  │  │ Supabase     │  │ Performance          │       │
│  │ + Parser     │  │ Realtime     │  │ Profiler             │       │
│  └──────────────┘  └──────────────┘  └──────────────────────┘       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Critical Integration Point #1: LOD ↔ Mol*

### Current State
**LOD System**: Standalone, no viewer integration
**Mol* Service**: Partial implementation, no LOD hooks

### Integration Requirements

#### 1.1 Quality Level Mapping
**File**: `/src/lib/lod-molstar-bridge.ts` (NEW)

```typescript
// Quality level to Mol* representation mapping
const QUALITY_TO_MOLSTAR: Record<QualityLevel, MolstarRepresentation> = {
  low: {
    type: 'cartoon',
    colorTheme: 'secondary-structure',
    quality: 'auto',
    ignoreHydrogens: true,
    detail: 0.5
  },
  medium: {
    type: 'cartoon',
    colorTheme: 'chain-id',
    quality: 'medium',
    detail: 1.0
  },
  high: {
    type: 'ball-and-stick',
    colorTheme: 'element-symbol',
    quality: 'high',
    detail: 2.0
  },
  ultra: {
    type: 'molecular-surface',
    colorTheme: 'hydrophobicity',
    quality: 'ultra',
    detail: 3.0,
    shadowing: true
  },
  extreme: {
    type: 'gaussian-surface',
    colorTheme: 'element-symbol',
    quality: 'max',
    detail: 5.0,
    shadowing: true,
    ambientOcclusion: true
  }
};
```

#### 1.2 Progressive Loading Hook
**File**: `/src/lib/lod-molstar-bridge.ts`

```typescript
export async function loadStructureProgressive(
  structure: StructureData,
  molstarViewer: MolstarViewer,
  lodManager: LODManager
): Promise<void> {
  // Stage 1: Preview (< 200ms)
  const previewData = await lodManager.createPreview(structure);
  await molstarViewer.loadData(previewData, {
    representation: QUALITY_TO_MOLSTAR.low,
    immediate: true
  });

  // Stage 2: Interactive (< 1s)
  const interactiveData = await lodManager.createInteractive(structure);
  await molstarViewer.updateData(interactiveData, {
    representation: QUALITY_TO_MOLSTAR.medium,
    animated: true,
    duration: 300
  });

  // Stage 3: Full detail (< 3s)
  const fullData = await lodManager.createFullDetail(structure);
  await molstarViewer.updateData(fullData, {
    representation: QUALITY_TO_MOLSTAR.high,
    animated: true,
    duration: 500
  });
}
```

#### 1.3 Device Profile Application
**File**: `/src/services/quality-manager.ts` (UPDATE)

```typescript
// Add method to apply device profile to Mol*
public applyProfileToMolstar(
  profile: DeviceProfile,
  molstarViewer: MolstarViewer
): void {
  const settings = this.getDeviceSettings(profile);

  molstarViewer.setConfiguration({
    maxAtoms: settings.maxAtoms,
    quality: settings.qualityLevel,
    shadowing: settings.enableShadows,
    ambientOcclusion: settings.enableAO,
    antialiasing: settings.antialiasing,
    postProcessing: settings.postProcessing
  });
}
```

### Dependencies
- Mol* viewer must be initialized first
- LOD Manager needs structure metadata
- Quality Manager monitors FPS in real-time
- Performance Profiler provides device classification

### Testing Strategy
1. **Unit Tests**: Quality level mappings
2. **Integration Tests**: Progressive loading pipeline
3. **Performance Tests**: Load time benchmarks
4. **Visual Tests**: Representation quality

---

## Critical Integration Point #2: Collaboration ↔ Mol*

### Current State
**Collaboration**: Supabase Realtime + state management
**Mol***: No collaboration hooks

### Integration Requirements

#### 2.1 Camera Synchronization
**File**: `/src/services/camera-sync.ts` (UPDATE)

```typescript
// Add Mol* camera API integration
export class CameraSyncService {
  private molstarViewer: MolstarViewer | null = null;

  public attachMolstar(viewer: MolstarViewer): void {
    this.molstarViewer = viewer;

    // Listen to local camera changes
    viewer.onCameraChange((camera) => {
      if (!this.isFollowing) {
        this.broadcastCameraUpdate(camera);
      }
    });

    // Apply remote camera updates
    this.subscribe((remoteCamera) => {
      if (this.isFollowing) {
        viewer.setCamera(remoteCamera, {
          animated: true,
          duration: 300
        });
      }
    });
  }

  private broadcastCameraUpdate(camera: Camera): void {
    const throttled = this.throttle(() => {
      this.channel?.send({
        type: 'broadcast',
        event: 'camera-update',
        payload: {
          position: camera.position,
          target: camera.target,
          up: camera.up,
          zoom: camera.zoom
        }
      });
    }, 200); // 5Hz

    throttled();
  }
}
```

#### 2.2 3D Cursor Overlay
**File**: `/src/components/collaboration/CursorOverlay.tsx` (UPDATE)

```typescript
// Add 3D projection for cursors
export function CursorOverlay({ molstarViewer }: Props) {
  const cursors = useCollaborationStore((state) => state.cursors);

  const project3DTo2D = (cursor: Cursor3D): { x: number; y: number } => {
    if (!molstarViewer) return { x: 0, y: 0 };

    const screenCoords = molstarViewer.camera.project(
      cursor.position3D
    );

    return {
      x: screenCoords.x,
      y: screenCoords.y
    };
  };

  return (
    <div className="cursor-overlay">
      {cursors.map((cursor) => {
        const { x, y } = project3DTo2D(cursor);
        return (
          <div
            key={cursor.userId}
            className="cursor"
            style={{ left: x, top: y }}
          >
            <Avatar userId={cursor.userId} />
            <Label>{cursor.userName}</Label>
          </div>
        );
      })}
    </div>
  );
}
```

#### 2.3 Annotation Anchoring
**File**: `/src/components/collaboration/AnnotationTools.tsx` (UPDATE)

```typescript
// Anchor annotations to 3D atoms
export function createAnnotationFromSelection(
  selection: MolstarSelection,
  text: string
): Annotation3D {
  const anchor = {
    type: 'atom' as const,
    atomId: selection.atomId,
    chainId: selection.chainId,
    residueId: selection.residueId,
    position3D: selection.position,
    // Store both 3D and screen coords for fallback
    position2D: molstarViewer.camera.project(selection.position)
  };

  return {
    id: generateId(),
    text,
    anchor,
    creator: currentUser.id,
    timestamp: Date.now(),
    pinned: false
  };
}

// Update annotation positions on camera move
function updateAnnotationPositions(): void {
  annotations.forEach((annotation) => {
    if (annotation.anchor.type === 'atom') {
      const atom = molstarViewer.getAtom(annotation.anchor.atomId);
      const screenPos = molstarViewer.camera.project(atom.position);

      updateAnnotationElement(annotation.id, screenPos);
    }
  });
}
```

### Dependencies
- Mol* camera API must be accessible
- Real-time channel established
- User authentication complete
- 3D → 2D projection utilities

### Testing Strategy
1. **Integration Tests**: Camera sync latency
2. **E2E Tests**: Multi-user tour scenario
3. **Performance Tests**: Annotation rendering
4. **Manual Tests**: 10-user stress test

---

## Critical Integration Point #3: Data Pipeline

### Current State
**PDB Fetcher**: Standalone service
**PDB Parser**: Basic implementation
**Cache Strategy**: Generic caching
**Mol***: Manual data loading

### Integration Requirements

#### 3.1 Unified Structure Loader Hook
**File**: `/src/hooks/use-structure-loader.ts` (NEW)

```typescript
export function useStructureLoader(structureId: string) {
  const [state, setState] = useState<LoaderState>({
    status: 'idle',
    structure: null,
    error: null
  });

  const lodManager = useLODManager();
  const molstarViewer = useMolstar();
  const cacheManager = useCacheManager();

  const load = useCallback(async () => {
    setState({ status: 'loading', structure: null, error: null });

    try {
      // 1. Check cache first
      const cached = await cacheManager.get(structureId);
      if (cached) {
        await loadStructureProgressive(cached, molstarViewer, lodManager);
        setState({ status: 'success', structure: cached, error: null });
        return;
      }

      // 2. Fetch from PDB/AlphaFold
      setState({ status: 'fetching', structure: null, error: null });
      const fetcher = new PDBFetcher();
      const rawData = await fetcher.fetchStructure(structureId);

      // 3. Parse
      setState({ status: 'parsing', structure: null, error: null });
      const parser = new PDBParser();
      const structure = await parser.parse(rawData);

      // 4. Cache
      await cacheManager.set(structureId, structure);

      // 5. Load with LOD
      setState({ status: 'rendering', structure, error: null });
      await loadStructureProgressive(structure, molstarViewer, lodManager);

      setState({ status: 'success', structure, error: null });

    } catch (error) {
      setState({
        status: 'error',
        structure: null,
        error: error.message
      });
    }
  }, [structureId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load
  };
}
```

#### 3.2 Cache Warming Strategy
**File**: `/src/services/cache-manager.ts` (NEW)

```typescript
export class CacheManager {
  private indexedDB: IDBDatabase;
  private supabaseCache: SupabaseClient;

  // Warm cache with popular structures
  public async warmCache(structureIds: string[]): Promise<void> {
    const fetcher = new PDBFetcher();
    const parser = new PDBParser();

    await Promise.all(
      structureIds.map(async (id) => {
        const cached = await this.get(id);
        if (!cached) {
          const raw = await fetcher.fetchStructure(id);
          const parsed = await parser.parse(raw);
          await this.set(id, parsed);
        }
      })
    );
  }

  // Get with fallback chain
  public async get(structureId: string): Promise<Structure | null> {
    // 1. Try IndexedDB (fastest)
    const local = await this.getFromIndexedDB(structureId);
    if (local) return local;

    // 2. Try Supabase Storage (medium)
    const remote = await this.getFromSupabase(structureId);
    if (remote) {
      await this.setInIndexedDB(structureId, remote); // Backfill
      return remote;
    }

    // 3. Cache miss
    return null;
  }
}
```

#### 3.3 Error Handling & Fallbacks
**File**: `/src/services/pdb-fetcher.ts` (UPDATE)

```typescript
export class PDBFetcher {
  private sources = [
    { name: 'RCSB', url: 'https://files.rcsb.org/download/' },
    { name: 'PDBe', url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/' },
    { name: 'AlphaFold', url: 'https://alphafold.ebi.ac.uk/files/' }
  ];

  public async fetchStructure(
    structureId: string
  ): Promise<StructureData> {
    const errors: Error[] = [];

    // Try each source in order
    for (const source of this.sources) {
      try {
        const response = await fetch(
          `${source.url}${structureId}.cif`,
          {
            timeout: 10000,
            retry: 2
          }
        );

        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        errors.push(error);
        console.warn(`Failed to fetch from ${source.name}:`, error);
      }
    }

    // All sources failed
    throw new AggregateError(
      errors,
      `Failed to fetch structure ${structureId} from all sources`
    );
  }
}
```

### Dependencies
- IndexedDB for local caching
- Supabase Storage for remote caching
- Fetch API with timeout/retry
- Parser must handle multiple formats

### Testing Strategy
1. **Unit Tests**: Cache hit/miss logic
2. **Integration Tests**: Full pipeline
3. **Performance Tests**: Load time benchmarks
4. **E2E Tests**: Error scenarios

---

## Integration Coordination

### State Management Flow

```typescript
// Global state structure
interface AppState {
  // Structure data
  structure: {
    current: Structure | null;
    loading: boolean;
    error: string | null;
  };

  // LOD state
  lod: {
    currentLevel: LODLevel;
    qualityLevel: QualityLevel;
    deviceProfile: DeviceProfile;
  };

  // Collaboration state
  collaboration: {
    session: Session | null;
    users: User[];
    cursors: Cursor[];
    annotations: Annotation[];
    isFollowing: boolean;
    leaderId: string | null;
  };

  // Mol* viewer state
  viewer: {
    initialized: boolean;
    camera: Camera;
    selection: Selection | null;
    representations: Representation[];
  };
}
```

### Event Flow

```
User Action
    │
    ▼
Component Event
    │
    ├──► Local State Update (optimistic)
    │
    ├──► Service Layer
    │    │
    │    ├──► Mol* Viewer API
    │    │    └──► Visual Update
    │    │
    │    ├──► Supabase Realtime
    │    │    └──► Broadcast to peers
    │    │
    │    └──► Performance Monitor
    │         └──► Quality adjustment
    │
    └──► Re-render
```

### Synchronization Points

1. **Camera Updates**
   - Local: Mol* camera → Camera Sync Service
   - Remote: Supabase channel → Mol* camera
   - Frequency: 5Hz (200ms throttle)

2. **Quality Changes**
   - Trigger: Performance Monitor → Quality Manager
   - Apply: Quality Manager → Mol* Viewer
   - Frequency: On FPS drop (reactive)

3. **Annotation Updates**
   - Create: Mol* selection → Annotation Service
   - Persist: Annotation Service → Supabase
   - Broadcast: Supabase Realtime → All clients
   - Frequency: On user action (immediate)

4. **Structure Loading**
   - Fetch: PDB Fetcher → Cache Manager
   - Parse: Parser → Structure Object
   - Load: LOD Manager → Mol* Viewer
   - Frequency: On structure change

---

## Performance Considerations

### Bundle Size Impact
```
Current (Sprint 1-2): ~500KB (gzipped)
+ Mol* library: ~2MB (gzipped)
+ Additional deps: ~300KB
= Total: ~2.8MB (gzipped)
```

**Mitigation**:
- Code splitting by route
- Lazy load Mol* on viewer page
- Tree-shake unused Mol* features
- Use compression (Brotli)

### Memory Management
```
LOD System: ~50-200MB (per structure)
Collaboration: ~5-10MB (per session)
Mol* Viewer: ~100-500MB (WebGL buffers)
= Peak: ~700MB (acceptable)
```

**Mitigation**:
- Dispose Mol* instances on unmount
- Clear collaboration state on leave
- Use weak references for caches
- Monitor with Performance API

### Network Optimization
```
Structure fetch: 1-10MB (mmCIF)
Realtime messages: <1KB each
Cache writes: Async, non-blocking
```

**Mitigation**:
- Compress structures with gzip
- Use binary formats where possible
- Batch Realtime updates
- Implement request deduplication

---

## Testing Integration Points

### Integration Test Scenarios

1. **LOD + Mol* Integration**
   - Load structure, verify progressive stages
   - Change quality, verify Mol* updates
   - Test on different device profiles
   - Verify FPS maintains target

2. **Collaboration + Mol* Integration**
   - Create session, verify camera sync
   - Add annotation, verify persistence
   - Test cursor projection
   - Verify leader-guided tour

3. **Data Pipeline Integration**
   - Fetch structure, verify cache
   - Parse multiple formats
   - Handle fetch failures
   - Verify load time < 3s

4. **Full System Integration**
   - User flow: Search → Load → Collaborate
   - Multi-user scenario (5 users)
   - Performance under load
   - Error recovery

### E2E Test Paths

```typescript
// tests/e2e/integration.spec.ts
test('full user journey', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // 2. Search structure
  await page.goto('/browse');
  await page.fill('[placeholder="Search structures"]', '1ABC');
  await page.click('[data-testid="structure-1ABC"]');

  // 3. Wait for progressive loading
  await expect(page.locator('[data-testid="preview-loaded"]')).toBeVisible();
  await expect(page.locator('[data-testid="interactive-loaded"]')).toBeVisible();
  await expect(page.locator('[data-testid="full-loaded"]')).toBeVisible();

  // 4. Create collaboration session
  await page.click('[data-testid="start-collaboration"]');
  const inviteCode = await page.locator('[data-testid="invite-code"]').textContent();

  // 5. Add annotation
  await page.click('[data-testid="add-annotation"]');
  await page.fill('[placeholder="Add comment"]', 'Active site here');
  await page.click('[data-testid="save-annotation"]');

  // 6. Verify annotation persisted
  await page.reload();
  await expect(page.locator('text=Active site here')).toBeVisible();
});
```

---

## Next Steps

1. **Week 1**: Implement LOD-Mol* bridge
2. **Week 2**: Integrate Collaboration with Mol*
3. **Week 3**: Build unified data pipeline
4. **Week 4**: Integration testing and optimization

---

**Document Status**: READY FOR IMPLEMENTATION
**Owner**: Strategic Planning Agent
**Dependencies**: Sprint 1 & 2 complete
**Target Start**: Immediate

**Last Updated**: 2025-11-17
