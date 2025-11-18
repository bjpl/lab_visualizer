# Data Flow Patterns - LAB Visualizer

## Overview

This document maps data flow patterns throughout the LAB Visualization Platform, showing how data moves between components, transforms through pipelines, and synchronizes across users.

## 1. Structure Loading Flow

### Primary Path: PDB ID → Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│                     User enters PDB ID                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component: usePDB hook                                          │
│  Action: fetchStructure("1CRN")                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Route: GET /api/pdb/[id]                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 1. Check Supabase cache (pdb_structures table)      │       │
│  │ 2. If found → return cached data                    │       │
│  │ 3. If not → fetch from RCSB API                     │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Cached?           │
        └─────┬──────┬──────┘
              │ Yes  │ No
              │      │
              │      ▼
              │  ┌────────────────────────────────────┐
              │  │ External: RCSB PDB API             │
              │  │ URL: files.rcsb.org/download/...   │
              │  └──────────┬─────────────────────────┘
              │             │
              │             ▼
              │  ┌────────────────────────────────────┐
              │  │ Parser: parsePDB(content)          │
              │  │ Extract: atoms, metadata           │
              │  └──────────┬─────────────────────────┘
              │             │
              │             ▼
              │  ┌────────────────────────────────────┐
              │  │ Analyzer: analyzeComplexity()      │
              │  │ Calculate: atomCount, vertices     │
              │  └──────────┬─────────────────────────┘
              │             │
              │             ▼
              │  ┌────────────────────────────────────┐
              │  │ Cache: Store in Supabase           │
              │  │ Table: pdb_structures              │
              │  └──────────┬─────────────────────────┘
              │             │
              └─────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hook: usePDB                                                    │
│  State Update: setStructure(data)                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Store: Zustand (app-store.ts)                                   │
│  State: visualization.structure = Structure                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component: MolecularViewer                                      │
│  Effect: useEffect(() => loadStructure(structure))               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hook: useMolstar                                                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 1. Initialize LOD Manager                            │       │
│  │ 2. Start progressive loading                         │       │
│  │ 3. Render PREVIEW stage                              │       │
│  │ 4. Measure performance                               │       │
│  │ 5. Render INTERACTIVE stage                          │       │
│  │ 6. Render FULL stage                                 │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Rendering: MolStar Plugin                                       │
│  Display: 3D visualization in WebGL canvas                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Transformations

#### Stage 1: API Response → Structure Object

```typescript
// Input: API response
{
  content: "ATOM      1  N   MET A   1      27.340...",
  metadata: {
    title: "Crambin",
    resolution: 0.54,
    // ...
  }
}

// Transform: parsePDB()
↓

// Output: Structure object
{
  pdbId: "1CRN",
  atoms: [
    {
      serial: 1,
      name: "N",
      element: "N",
      residue: "MET",
      chain: "A",
      x: 27.340,
      y: 24.430,
      z: 2.614,
      // ...
    },
    // ... more atoms
  ],
  metadata: StructureMetadata,
  complexity: {
    atomCount: 327,
    bondCount: 290,
    residueCount: 46,
    chainCount: 1,
    estimatedVertices: 6540
  }
}
```

#### Stage 2: Structure → LOD Filtered Atoms

```typescript
// Input: Full structure (327 atoms)
const structure = { atoms: [...327 atoms...] };

// Transform: LOD Manager filtering
const lodManager = new LODManager();
lodManager.analyzeComplexity(structure);

// PREVIEW level (backbone only)
const previewAtoms = lodManager.filterAtomsForLevel(
  structure.atoms,
  LODLevel.PREVIEW,
  complexity
);
// Output: ~46 atoms (Cα only)

// INTERACTIVE level (key atoms)
const interactiveAtoms = lodManager.filterAtomsForLevel(
  structure.atoms,
  LODLevel.INTERACTIVE,
  complexity
);
// Output: ~184 atoms (backbone + Cβ)

// FULL level (all atoms)
const fullAtoms = structure.atoms;
// Output: 327 atoms
```

#### Stage 3: Atoms → MolStar Representation

```typescript
// Input: Filtered atoms
const atoms = [...atoms array...];

// Transform: MolStar builders
const structure = await plugin.builders.structure.parseData(
  atoms,
  format: 'pdb'
);

const component = await plugin.builders.structure.createComponent(
  structure,
  { type: 'static' }
);

const representation = await plugin.builders.structure.representation.addRepresentation(
  component,
  {
    type: 'cartoon',
    color: 'secondary-structure',
    quality: 'auto'
  }
);

// Output: Rendered 3D scene
```

## 2. Collaboration Data Flow

### Real-Time Synchronization

```
┌─────────────────────────────────────────────────────────────────┐
│  User A: Camera Movement                                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Event Capture: MolStar camera.stateChanged event                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Throttle: debounce(100ms) to reduce events                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hook: useCollaboration                                          │
│  Action: updateCamera(cameraState)                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service: CollaborationSessionService                            │
│  Method: broadcast('camera-update', payload)                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Realtime: Channel send                                 │
│  Channel: session:${sessionId}                                   │
│  Event: camera-update                                            │
│  Payload: {                                                      │
│    userId: "user-a",                                             │
│    state: {                                                      │
│      position: [10, 20, 30],                                     │
│      target: [0, 0, 0],                                          │
│      zoom: 50                                                    │
│    },                                                            │
│    timestamp: 1700000000000                                      │
│  }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ WebSocket         │
        │ Broadcasting      │
        └─────┬──────┬──────┘
              │      │
      User B  │      │  User C
              ▼      ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase Realtime: Receive event                             │
│  Filter: Check if following camera leader                     │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hook: useCollaboration                                          │
│  Event Handler: onCameraUpdate(payload)                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Store: Zustand (app-store.ts)                                   │
│  Update: collaboration.cameraState = payload.state               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component: MolecularViewer                                      │
│  Effect: useEffect(() => applyCameraState(cameraState))          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  MolStar: plugin.canvas3d.camera.setState(state, 300ms)          │
│  Result: Animated camera transition                              │
└─────────────────────────────────────────────────────────────────┘
```

### Annotation Synchronization

```
┌─────────────────────────────────────────────────────────────────┐
│  User Creates Annotation                                         │
│  Click on atom/residue → Opens annotation form                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component: AnnotationTools                                      │
│  Form submission: { content, position, target }                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hook: useCollaboration                                          │
│  Action: addAnnotation(annotationData)                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Optimistic Update │
        │ Show immediately  │
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────────────┐
│ Local Store      │  │ Broadcast to Supabase     │
│ Add to Map       │  │ Event: annotation-add     │
└──────────────────┘  └──────┬───────────────────┘
                             │
                             ▼
                  ┌──────────────────────────┐
                  │ Database: Store          │
                  │ Table: annotations       │
                  └──────┬───────────────────┘
                         │
                         ▼
                  ┌──────────────────────────┐
                  │ Realtime: Broadcast      │
                  │ to all session users     │
                  └──────┬───────────────────┘
                         │
                         ▼
                  ┌──────────────────────────┐
                  │ Other Users: Receive     │
                  │ Update local store       │
                  │ Render annotation        │
                  └──────────────────────────┘
```

### Conflict Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Concurrent Edits: User A and User B edit same annotation       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  ┌─────────┐         ┌─────────┐
  │ User A  │         │ User B  │
  │ t=1000  │         │ t=1050  │
  │ v=1     │         │ v=1     │
  └────┬────┘         └────┬────┘
       │                   │
       │ Update content    │ Update content
       │ to "Alpha"        │ to "Beta"
       │                   │
       ▼                   ▼
  ┌─────────────────┐ ┌─────────────────┐
  │ Broadcast       │ │ Broadcast       │
  │ t=1000, v=2     │ │ t=1050, v=2     │
  │ content="Alpha" │ │ content="Beta"  │
  └────┬────────────┘ └────┬────────────┘
       │                   │
       └─────────┬─────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Conflict Detection                                              │
│  - Both updates have same base version (v=1)                     │
│  - Different timestamps (t=1000 vs t=1050)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Resolution Strategy: Last-Write-Wins                            │
│  Winner: User B (later timestamp)                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Apply Resolution                                                │
│  - Store final state: content="Beta", v=3, t=1050                │
│  - Notify User A: "Your edit was overwritten"                    │
│  - Broadcast resolution to all users                             │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Learning Module Flow

### Module Loading

```
┌─────────────────────────────────────────────────────────────────┐
│  Student: Open Learning Module                                   │
│  URL: /learning/modules/protein-folding-101                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  API: GET /api/learning/modules/[id]                             │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database Query: Fetch module + annotations + quizzes            │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ SELECT * FROM learning_modules WHERE id = $1         │       │
│  │ SELECT * FROM module_annotations WHERE module_id=$1  │       │
│  │ SELECT * FROM module_quizzes WHERE module_id=$1      │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Response: LearningModule object                                 │
│  {                                                               │
│    id: "module-123",                                             │
│    title: "Protein Folding 101",                                 │
│    structureId: "1CRN",                                          │
│    sections: [...],                                              │
│    annotations: [...],                                           │
│    quizzes: [...]                                                │
│  }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Parallel Loading  │
        └─────┬──────┬──────┘
              │      │
      ┌───────┘      └───────┐
      ▼                      ▼
┌──────────────┐      ┌──────────────┐
│ Load PDB     │      │ Load Module  │
│ Structure    │      │ Content      │
│ "1CRN"       │      │ Annotations  │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Viewer: Initialize with structure + annotations                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Player: Start teaching point sequence                           │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ For each teaching point:                             │       │
│  │   1. Focus camera on target                          │       │
│  │   2. Highlight region                                │       │
│  │   3. Show annotation                                 │       │
│  │   4. Track view time                                 │       │
│  │   5. Show quiz (if applicable)                       │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Progress Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│  Interaction Event: Student views annotation                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Event Capture                                                   │
│  {                                                               │
│    type: 'annotation-viewed',                                    │
│    annotationId: 'anno-456',                                     │
│    timestamp: 1700000000000,                                     │
│    duration: 15000  // 15 seconds                                │
│  }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  API: POST /api/learning/progress                                │
│  {                                                               │
│    userId: "student-123",                                        │
│    moduleId: "module-456",                                       │
│    event: { ... }                                                │
│  }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database: Update progress                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ UPDATE learning_progress                             │       │
│  │ SET                                                   │       │
│  │   completed_annotations = array_append(...),         │       │
│  │   time_spent = time_spent + 15000,                   │       │
│  │   last_accessed = NOW()                              │       │
│  │ WHERE user_id=$1 AND module_id=$2                    │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Check Completion Criteria                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ IF completed_annotations.length == total_annotations │       │
│  │ AND quiz_scores.avg >= min_score                     │       │
│  │ THEN mark_complete()                                 │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Notification: "Congratulations! Module complete!"               │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Cache Strategy Flow

### Multi-Level Caching

```
┌─────────────────────────────────────────────────────────────────┐
│  Request: PDB Structure "1CRN"                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Level 1: Browser Memory Cache (React state)                     │
│  Check: appStore.structures.get("1CRN")                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Found?            │
        └─────┬──────┬──────┘
         Yes  │      │ No
              │      │
              │      ▼
              │  ┌────────────────────────────────────┐
              │  │ Level 2: Browser IndexedDB         │
              │  │ Check: localforage.getItem("1CRN") │
              │  └──────────┬─────────────────────────┘
              │             │
              │   ┌─────────┴─────────┐
              │   │ Found?            │
              │   └─────┬──────┬──────┘
              │    Yes  │      │ No
              │         │      │
              │         │      ▼
              │         │  ┌────────────────────────────────────┐
              │         │  │ Level 3: Supabase Database         │
              │         │  │ Query: pdb_structures WHERE id=... │
              │         │  └──────────┬─────────────────────────┘
              │         │             │
              │         │   ┌─────────┴─────────┐
              │         │   │ Found?            │
              │         │   └─────┬──────┬──────┘
              │         │    Yes  │      │ No
              │         │         │      │
              │         │         │      ▼
              │         │         │  ┌────────────────────────────┐
              │         │         │  │ Level 4: RCSB PDB API      │
              │         │         │  │ Fetch: files.rcsb.org/...  │
              │         │         │  └──────────┬─────────────────┘
              │         │         │             │
              │         │         │             ▼
              │         │         │  ┌────────────────────────────┐
              │         │         │  │ Parse + Analyze            │
              │         │         │  └──────────┬─────────────────┘
              │         │         │             │
              │         │         │             ▼
              │         │         │  ┌────────────────────────────┐
              │         │         └─→│ Store in Level 3           │
              │         │            └──────────┬─────────────────┘
              │         │                       │
              │         └──────────────────────→│ Store in Level 2 │
              │                                 └──────────┬────────┘
              │                                            │
              └───────────────────────────────────────────→│ Store in Level 1 │
                                                           └──────────┬────────┘
                                                                      │
                                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return: Structure data to caller                                │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Warming

```
┌─────────────────────────────────────────────────────────────────┐
│  Trigger: Admin initiates cache warming                          │
│  Target: Top 100 popular structures                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Query: Get popular structure IDs                                │
│  SELECT pdb_id FROM structures ORDER BY access_count DESC        │
│  LIMIT 100                                                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Batch: Process in chunks of 10                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ For each chunk:                                      │       │
│  │   For each structure:                                │       │
│  │     1. Check if cached in Supabase                   │       │
│  │     2. If not → fetch from RCSB                      │       │
│  │     3. Parse and analyze                             │       │
│  │     4. Store in database                             │       │
│  │     5. Update progress                               │       │
│  │   Wait 1 second (rate limiting)                      │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Result: Cache warmed, reduced API load                          │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Error Recovery Flow

### Network Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│  API Request: Fetch structure                                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Try: fetch(url)                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Network Error?    │
        └─────┬──────┬──────┘
         No   │      │ Yes
              │      │
              │      ▼
              │  ┌────────────────────────────────────┐
              │  │ Retry Logic                        │
              │  │ ┌──────────────────────────────┐   │
              │  │ │ Attempt 1: wait 1s → retry   │   │
              │  │ │ Attempt 2: wait 2s → retry   │   │
              │  │ │ Attempt 3: wait 4s → retry   │   │
              │  │ │ Attempt 4: FAIL              │   │
              │  │ └──────────────────────────────┘   │
              │  └──────────┬─────────────────────────┘
              │             │
              │   ┌─────────┴─────────┐
              │   │ Still failing?    │
              │   └─────┬──────┬──────┘
              │    No   │      │ Yes
              │         │      │
              │         │      ▼
              │         │  ┌────────────────────────────────────┐
              │         │  │ Fallback: Check offline cache      │
              │         │  └──────────┬─────────────────────────┘
              │         │             │
              │         │   ┌─────────┴─────────┐
              │         │   │ Cached?           │
              │         │   └─────┬──────┬──────┘
              │         │    Yes  │      │ No
              │         │         │      │
              │         │         │      ▼
              │         │         │  ┌────────────────────────────┐
              │         │         │  │ Show Error:                │
              │         │         │  │ "Structure unavailable     │
              │         │         │  │  - Check connection        │
              │         │         │  │  - Try again later"        │
              │         │         │  └────────────────────────────┘
              │         │         │
              │         │         ▼
              │         │  ┌────────────────────────────────────┐
              │         └─→│ Show Warning:                      │
              │            │ "Using offline version"            │
              │            └────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Success: Continue with data                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

These data flow patterns ensure:
1. **Efficient Loading**: Multi-stage progressive rendering with LOD
2. **Real-Time Sync**: Low-latency collaboration via Supabase Realtime
3. **Reliable Caching**: Multi-level cache strategy reduces API load
4. **Error Resilience**: Retry logic and offline fallbacks
5. **Analytics**: Complete event tracking for learning modules

All flows are designed to be observable, debuggable, and testable through clear state transitions and event emissions.
