# LAB Visualizer - Integration Architecture

## Document Information

- **Author**: System Architect Agent
- **Date**: 2025-11-17
- **Version**: 1.0
- **Status**: Design Phase

## Executive Summary

This document defines the integration architecture for the LAB (Lightweight Accessible Biochemistry) Visualization Platform, detailing how the LOD Manager, Collaboration System, MolStar Viewer, PDB Data Pipeline, and Learning CMS integrate to provide a cohesive molecular visualization experience.

## System Overview

### Core Components

1. **MolStar Viewer** - 3D molecular visualization engine
2. **LOD Manager** - Progressive rendering orchestrator
3. **Collaboration System** - Real-time multi-user coordination
4. **PDB Data Pipeline** - Structure data acquisition and processing
5. **Learning CMS** - Educational content and annotations
6. **Supabase Backend** - Database, authentication, and real-time subscriptions

## Architecture Principles

### 1. Separation of Concerns
- **Presentation Layer**: React components and UI
- **Business Logic Layer**: Services and managers
- **Data Layer**: Supabase and API routes
- **Rendering Layer**: MolStar plugin and WebGL

### 2. Progressive Enhancement
- LOD Manager ensures fast initial load with progressive detail
- Features degrade gracefully on lower-powered devices
- Real-time features are optional enhancements

### 3. Event-Driven Communication
- Components communicate via events and state changes
- Minimal direct coupling between systems
- Pub/sub pattern for real-time updates

### 4. State Management Strategy
- **Zustand** for application state (structure, visualization settings)
- **React Context** for theme and UI preferences
- **Supabase Realtime** for collaborative state
- **LOD Manager** for rendering state

## Integration Patterns

### Pattern 1: LOD Manager ↔ MolStar Viewer

```typescript
// Integration Point: Progressive Rendering Pipeline

interface LODIntegration {
  // LOD Manager controls rendering stages
  manager: LODManager;

  // MolStar provides rendering API
  viewer: MolstarViewer;

  // Integration flow
  workflow: {
    1: "LOD Manager analyzes structure complexity";
    2: "Determines appropriate starting LOD level";
    3: "Filters atoms based on LOD configuration";
    4: "MolStar renders filtered atom set";
    5: "LOD Manager measures performance (FPS)";
    6: "Progresses to next level if performance allows";
  };
}
```

**API Contract**:

```typescript
// LOD Manager → MolStar
interface LODToMolstar {
  render(atoms: Atom[], features: RenderFeatures): Promise<void>;
  measurePerformance(): Promise<PerformanceMetrics>;
  updateRepresentation(config: RepresentationOptions): Promise<void>;
}

// MolStar → LOD Manager
interface MolstarToLOD {
  onRenderComplete(metrics: RenderMetrics): void;
  onPerformanceDegraded(fps: number): void;
  getCurrentAtomCount(): number;
}
```

**Data Flow**:
```
Structure Load Request
  ↓
LOD Manager.analyzeComplexity()
  ↓
Determine Starting Level (PREVIEW/INTERACTIVE/FULL)
  ↓
Filter Atoms (backbone → key atoms → all atoms)
  ↓
MolStar.render(filteredAtoms, LODConfig.features)
  ↓
Measure FPS & Performance
  ↓
Progress to Next Level if metrics allow
  ↓
Store final state in Zustand
```

### Pattern 2: Collaboration System ↔ Viewer State

```typescript
// Integration Point: Real-Time State Synchronization

interface CollaborationIntegration {
  // Collaboration service manages sessions
  service: CollaborationSessionService;

  // Viewer state is synchronized
  viewerState: {
    camera: CameraState;
    annotations: Annotation[];
    selection: SelectionQuery;
    representation: RepresentationOptions;
  };

  // Integration flow
  workflow: {
    1: "User changes camera position";
    2: "Viewer broadcasts camera-update event";
    3: "Collaboration service sends to Supabase Realtime";
    4: "Other users receive update";
    5: "Viewer applies camera state (if following)";
  };
}
```

**API Contract**:

```typescript
// Collaboration Service → Viewer
interface CollaborationToViewer {
  applyCameraState(state: CameraState): void;
  showAnnotation(annotation: Annotation): void;
  highlightSelection(userId: string, target: string): void;
  updateCursor(userId: string, position: {x: number, y: number}): void;
}

// Viewer → Collaboration Service
interface ViewerToCollaboration {
  onCameraChange(state: CameraState): void;
  onAnnotationCreate(annotation: Annotation): void;
  onSelectionChange(selection: SelectionQuery): void;
  onCursorMove(position: {x: number, y: number}): void;
}
```

**Real-Time Event Flow**:
```
Local User Action (camera move)
  ↓
Viewer State Update (Zustand)
  ↓
Collaboration Service.broadcast('camera-update')
  ↓
Supabase Realtime Channel
  ↓
Remote Users Receive Event
  ↓
Check if following camera leader
  ↓
Apply camera state to local viewer
  ↓
Update UI indicators (user presence)
```

### Pattern 3: PDB Data Pipeline ↔ LOD Manager

```typescript
// Integration Point: Structure Data Processing

interface PDBIntegration {
  // PDB service fetches and parses data
  service: PDBService;

  // LOD Manager prepares for rendering
  manager: LODManager;

  // Integration flow
  workflow: {
    1: "PDB service fetches structure (RCSB/AlphaFold)";
    2: "Parse PDB/mmCIF format";
    3: "Extract atom coordinates and metadata";
    4: "LOD Manager analyzes complexity";
    5: "Cache processed data in Supabase";
    6: "Initiate progressive rendering";
  };
}
```

**API Contract**:

```typescript
// PDB Service → LOD Manager
interface PDBToLOD {
  onStructureFetched(data: {
    atoms: Atom[];
    metadata: StructureMetadata;
    complexity: StructureComplexity;
  }): void;
}

// LOD Manager → PDB Service
interface LODToPDB {
  requestStructure(pdbId: string): Promise<Structure>;
  requestPartialStructure(pdbId: string, chains: string[]): Promise<Structure>;
  cacheStructure(pdbId: string, data: CachedStructure): Promise<void>;
}
```

**Data Pipeline**:
```
User enters PDB ID (e.g., "1CRN")
  ↓
Check Supabase cache (pdb_structures table)
  ↓
If cached → Load from database
If not → Fetch from RCSB API
  ↓
Parse structure data (PDB/mmCIF parser)
  ↓
Extract atom arrays and metadata
  ↓
LOD Manager.analyzeComplexity()
  ↓
Store in cache with complexity metadata
  ↓
Return to MolStar for rendering
```

### Pattern 4: Learning CMS ↔ Viewer Annotations

```typescript
// Integration Point: Educational Content Integration

interface LearningIntegration {
  // CMS manages educational content
  cms: LearningCMS;

  // Viewer displays contextual annotations
  viewer: MolstarViewer;

  // Integration flow
  workflow: {
    1: "Educator creates learning module";
    2: "Adds annotations to specific residues";
    3: "CMS stores with structure references";
    4: "Student loads structure in viewer";
    5: "Annotations auto-load and display";
    6: "Student interactions tracked for analytics";
  };
}
```

**API Contract**:

```typescript
// Learning CMS → Viewer
interface CMSToViewer {
  loadModuleAnnotations(moduleId: string): Promise<Annotation[]>;
  highlightTeachingPoint(point: TeachingPoint): void;
  showQuizQuestion(question: QuizQuestion, targetResidue: string): void;
}

// Viewer → Learning CMS
interface ViewerToCMS {
  trackInteraction(event: LearningEvent): void;
  submitQuizAnswer(questionId: string, answer: string): void;
  markAnnotationViewed(annotationId: string): void;
}
```

**Learning Flow**:
```
Student opens learning module
  ↓
Load module metadata (CMS API)
  ↓
Load associated PDB structure
  ↓
Fetch module annotations from database
  ↓
Initialize viewer with structure
  ↓
Overlay annotations at specific coordinates
  ↓
Track student interactions (time, clicks)
  ↓
Present quizzes at key teaching points
  ↓
Store progress and completion status
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MolecularView│  │Collaboration │  │  Learning    │      │
│  │   Component  │  │    Panel     │  │  Module UI   │      │
│  └───────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
└──────────┼─────────────────┼──────────────────┼─────────────┘
           │                 │                  │
┌──────────┼─────────────────┼──────────────────┼─────────────┐
│          │    Business Logic Layer            │              │
│  ┌───────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │  useMolstar  │  │ Collaboration│  │  Learning    │      │
│  │     Hook     │  │   Service    │  │     CMS      │      │
│  └───────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
│          │                 │                  │              │
│  ┌───────▼──────┐  ┌──────▼───────┐          │              │
│  │     LOD      │  │   Supabase   │          │              │
│  │   Manager    │  │   Realtime   │          │              │
│  └───────┬──────┘  └──────┬───────┘          │              │
└──────────┼─────────────────┼──────────────────┼─────────────┘
           │                 │                  │
┌──────────┼─────────────────┼──────────────────┼─────────────┐
│          │         Data Layer                 │              │
│  ┌───────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │   MolStar    │  │   Supabase   │  │  PDB Data    │      │
│  │    Plugin    │  │   Database   │  │   Pipeline   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## State Management Architecture

### Zustand Store Structure

```typescript
interface AppState {
  // Visualization State
  visualization: {
    structure: Structure | null;
    representation: RepresentationOptions;
    colorScheme: MolstarColorScheme;
    lodLevel: LODLevel;
    isLoading: boolean;
  };

  // Collaboration State
  collaboration: {
    session: CollaborationSession | null;
    users: Map<string, CollaborationUser>;
    annotations: Map<string, Annotation>;
    cameraState: CameraState | null;
    isConnected: boolean;
  };

  // Learning State
  learning: {
    currentModule: LearningModule | null;
    progress: LearningProgress;
    annotations: Annotation[];
    quizzes: QuizState[];
  };

  // UI State
  ui: {
    sidebarOpen: boolean;
    selectedTab: 'structure' | 'collaboration' | 'learning';
    theme: 'light' | 'dark';
  };
}
```

### State Update Patterns

**1. Optimistic Updates** (Collaboration):
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

**2. Progressive Loading** (LOD):
```typescript
// Stage 1: Preview
setLODLevel(LODLevel.PREVIEW);
renderPreview();

// Stage 2: Interactive
await delay(50);
setLODLevel(LODLevel.INTERACTIVE);
renderInteractive();

// Stage 3: Full
await delay(50);
setLODLevel(LODLevel.FULL);
renderFull();
```

**3. Event Sourcing** (Learning Analytics):
```typescript
// Track all interactions as events
const event = {
  type: 'annotation-viewed',
  userId: currentUser.id,
  annotationId: annotation.id,
  timestamp: Date.now(),
  duration: timeSpent,
};

trackLearningEvent(event);
```

## API Routes Architecture

### RESTful Endpoints

```typescript
// Structure Data
GET    /api/pdb/:id              // Fetch structure
POST   /api/pdb/upload           // Upload custom structure
GET    /api/pdb/search           // Search structures
GET    /api/pdb/alphafold/:uniprot // Fetch AlphaFold prediction

// Collaboration
POST   /api/collaboration/session       // Create session
GET    /api/collaboration/session/:id   // Get session
PUT    /api/collaboration/session/:id   // Update session
DELETE /api/collaboration/session/:id   // End session

// Learning
GET    /api/learning/modules            // List modules
GET    /api/learning/modules/:id        // Get module
POST   /api/learning/progress           // Update progress
GET    /api/learning/analytics/:userId  // Get analytics

// Cache Management
POST   /api/cache/warm                  // Warm cache
GET    /api/cache/stats                 // Cache statistics
```

### WebSocket Channels (Supabase Realtime)

```typescript
// Collaboration channel
channel: `session:${sessionId}`
events: [
  'cursor-move',
  'annotation-add',
  'annotation-edit',
  'annotation-delete',
  'camera-update',
  'user-join',
  'user-leave',
  'activity'
]

// Learning channel
channel: `learning:${moduleId}`
events: [
  'quiz-submitted',
  'annotation-completed',
  'module-progress'
]
```

## Database Schema Integration

### Core Tables

```sql
-- Structures table (cached PDB data)
CREATE TABLE pdb_structures (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  metadata JSONB,
  complexity JSONB,
  cached_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  structure_id TEXT REFERENCES pdb_structures(id),
  settings JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES collaboration_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  position JSONB,
  target JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning modules
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  structure_id TEXT REFERENCES pdb_structures(id),
  content JSONB,
  annotations JSONB[],
  quizzes JSONB[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning progress
CREATE TABLE learning_progress (
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES learning_modules(id),
  completed_annotations TEXT[],
  quiz_scores JSONB,
  time_spent INTEGER,
  last_accessed TIMESTAMP,
  PRIMARY KEY (user_id, module_id)
);
```

## Performance Considerations

### 1. LOD Manager Optimization
- **Memory Budget**: 512MB default, adjustable per device
- **Progressive Loading**: 50ms delay between stages
- **FPS Targeting**: 60fps preview, 30fps full detail
- **Adaptive Complexity**: Analyze structure before rendering

### 2. Collaboration Latency
- **Presence Heartbeat**: 15-second intervals
- **Event Throttling**: 100ms for cursor moves, immediate for annotations
- **Optimistic Updates**: Show local changes immediately
- **Conflict Resolution**: Last-write-wins for most operations

### 3. Data Caching Strategy
- **Structure Cache**: PostgreSQL JSONB for fast retrieval
- **Browser Cache**: Service Worker for offline access
- **CDN Distribution**: Static assets via Vercel Edge
- **Warm Cache**: Pre-load popular structures

### 4. Real-Time Scalability
- **Channel Limits**: 10 users per session (configurable)
- **Message Size**: Max 64KB per broadcast
- **Connection Pooling**: Supabase handles connection management
- **Graceful Degradation**: Fall back to polling if WebSocket fails

## Security Architecture

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → Stored in httpOnly Cookie
  ↓
Protected API Routes verify JWT
  ↓
Collaboration channels require valid session membership
  ↓
Learning modules check enrollment/permissions
```

### Authorization Patterns
- **Session Owner**: Full control over session settings
- **Presenter**: Can control camera, add annotations
- **Viewer**: Read-only, can add personal annotations
- **Learning**: Educators create, students consume

## Error Handling Strategy

### Error Boundaries
```typescript
// Component level
<ErrorBoundary fallback={<ErrorDisplay />}>
  <MolecularViewer />
</ErrorBoundary>

// Service level
try {
  await lodManager.loadProgressive(structure, renderer);
} catch (error) {
  logError('LOD_LOAD_FAILED', error);
  fallbackToBasicRenderer();
}

// Network level
const { data, error } = await supabase
  .from('pdb_structures')
  .select('*')
  .eq('id', pdbId)
  .single();

if (error) {
  showNotification('Failed to load structure', 'error');
  return;
}
```

## Monitoring and Observability

### Key Metrics
- **Structure Load Time**: Time from request to first render
- **LOD Progression Time**: Time through all LOD stages
- **Real-Time Latency**: Event propagation delay
- **User Engagement**: Time spent, interactions per session
- **Error Rates**: Failed loads, disconnections, conflicts

### Logging Strategy
- **Client Logs**: Console errors, user actions
- **Server Logs**: API requests, database queries
- **Real-Time Logs**: Connection events, message delivery
- **Analytics**: User behavior, feature usage

## Deployment Architecture

### Infrastructure
```
Vercel Edge Functions (API Routes)
  ↓
Supabase (Database + Realtime)
  ↓
RCSB PDB API (Structure Data)
  ↓
AlphaFold Database (Predictions)
```

### Environment Configuration
```typescript
// Development
NEXT_PUBLIC_SUPABASE_URL=dev-url
SUPABASE_SERVICE_ROLE_KEY=dev-key

// Production
NEXT_PUBLIC_SUPABASE_URL=prod-url
SUPABASE_SERVICE_ROLE_KEY=prod-key
```

## Migration Path

### Phase 1: Core Integration (Current)
- ✅ LOD Manager implemented
- ✅ Collaboration service implemented
- ✅ MolStar viewer component ready

### Phase 2: Real-Time Features
- Connect collaboration to viewer state
- Implement camera following
- Add annotation synchronization

### Phase 3: Learning CMS
- Build module creation UI
- Integrate with viewer
- Add progress tracking

### Phase 4: Optimization
- Implement advanced caching
- Add offline support
- Performance profiling

## Architecture Decision Records

### ADR-001: Use Zustand for State Management
**Decision**: Use Zustand instead of Redux for application state.
**Rationale**: Simpler API, less boilerplate, better TypeScript support, smaller bundle size.
**Consequences**: Need to manually implement dev tools integration.

### ADR-002: Progressive Rendering with LOD
**Decision**: Implement progressive LOD rendering instead of immediate full detail.
**Rationale**: Improves perceived performance, especially for large structures.
**Consequences**: More complex rendering logic, need to manage multiple render passes.

### ADR-003: Supabase for Real-Time
**Decision**: Use Supabase Realtime instead of custom WebSocket server.
**Rationale**: Managed infrastructure, built-in scaling, integrated with database.
**Consequences**: Vendor lock-in, limited customization of WebSocket behavior.

### ADR-004: MolStar as Rendering Engine
**Decision**: Use Mol* instead of NGL or 3DMol.js.
**Rationale**: Modern architecture, active development, best performance.
**Consequences**: Larger bundle size, steeper learning curve.

## Conclusion

This integration architecture provides a scalable, maintainable foundation for the LAB Visualization Platform. The separation of concerns, event-driven communication, and progressive enhancement patterns ensure the system can grow while maintaining performance and usability.

### Next Steps
1. Implement real-time viewer state synchronization
2. Build PDB data pipeline with caching
3. Create Learning CMS API
4. Add comprehensive error handling
5. Implement performance monitoring

### References
- MolStar Documentation: https://molstar.org/
- Supabase Realtime Guide: https://supabase.com/docs/guides/realtime
- LOD Rendering Techniques: Various WebGL resources
