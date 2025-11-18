# API Contracts - LAB Visualizer Integration

## Overview

This document defines the explicit API contracts between all major system components. These contracts ensure loose coupling and enable independent testing and development.

## 1. LOD Manager ↔ MolStar Viewer Contract

### Interface: LODRenderer

```typescript
/**
 * Renderer interface that MolStar must implement for LOD Manager
 */
interface LODRenderer {
  /**
   * Render atoms with specific LOD features
   * @param atoms - Filtered atom array for current LOD level
   * @param features - Rendering features to apply
   * @returns Promise resolving when render complete
   */
  render(atoms: Atom[], features: RenderFeatures): Promise<void>;

  /**
   * Get current rendering performance metrics
   * @returns Current FPS and performance data
   */
  getPerformanceMetrics(): Promise<PerformanceMetrics>;

  /**
   * Update representation without full re-render
   * @param representation - New representation configuration
   */
  updateRepresentation(representation: RepresentationOptions): Promise<void>;

  /**
   * Clear current scene
   */
  clear(): Promise<void>;

  /**
   * Get current atom count being rendered
   */
  getAtomCount(): number;

  /**
   * Check if renderer is ready
   */
  isReady(): boolean;
}
```

### Interface: LODCallbacks

```typescript
/**
 * Callbacks from LOD Manager to notify consumer
 */
interface LODCallbacks {
  /**
   * Called when a LOD stage starts
   * @param level - LOD level being loaded
   */
  onStageStart?: (level: LODLevel) => void;

  /**
   * Called when a LOD stage completes
   * @param result - Stage execution result with metrics
   */
  onStageComplete?: (result: LODStageResult) => void;

  /**
   * Called during progressive loading
   * @param progress - Progress percentage (0-100)
   * @param level - Current LOD level
   */
  onProgress?: (progress: number, level: LODLevel) => void;

  /**
   * Called on rendering error
   * @param error - Error object
   * @param level - LOD level where error occurred
   */
  onError?: (error: Error, level: LODLevel) => void;
}
```

### Data Types

```typescript
enum LODLevel {
  PREVIEW = 1,    // ~100 atoms, backbone only
  INTERACTIVE = 2, // ~1000 atoms, secondary structure
  FULL = 3,       // All atoms, full detail
}

interface RenderFeatures {
  backboneOnly: boolean;
  secondaryStructure: boolean;
  sidechains: boolean;
  surfaces: boolean;
  shadows: boolean;
  ambientOcclusion: boolean;
  antialiasing: 'none' | 'fxaa' | 'msaa';
  ligands: 'none' | 'simple' | 'detailed';
}

interface LODStageResult {
  level: LODLevel;
  duration: number;      // ms
  atomsRendered: number;
  fps: number;
  success: boolean;
}

interface PerformanceMetrics {
  frameRate: number;
  atomCount: number;
  triangleCount: number;
  memoryUsage?: number;  // bytes
}
```

### Usage Example

```typescript
// MolStar wrapper implements LODRenderer
class MolStarLODAdapter implements LODRenderer {
  constructor(private plugin: PluginContext) {}

  async render(atoms: Atom[], features: RenderFeatures): Promise<void> {
    // Convert atoms to MolStar structure
    const structure = this.createStructure(atoms);

    // Apply LOD-specific representation
    const representation = this.getRepresentation(features);
    await this.plugin.builders.structure.representation.addRepresentation(
      structure,
      representation
    );
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const stats = this.plugin.canvas3d?.stats;
    return {
      frameRate: stats?.fps || 0,
      atomCount: this.plugin.state.data.select('structure')[0]?.obj?.data.atomCount || 0,
      triangleCount: stats?.triangleCount || 0,
    };
  }

  // ... implement other methods
}

// Usage
const adapter = new MolStarLODAdapter(molstarPlugin);
const lodManager = new LODManager({
  onStageComplete: (result) => {
    console.log(`Stage ${result.level} complete: ${result.fps} FPS`);
  },
});

await lodManager.loadProgressive(structure, adapter);
```

## 2. Collaboration Service ↔ Viewer Contract

### Interface: CollaborationViewer

```typescript
/**
 * Viewer interface for collaboration features
 */
interface CollaborationViewer {
  /**
   * Apply camera state from remote user
   * @param state - Camera position, target, zoom
   * @param animate - Whether to animate transition
   */
  applyCameraState(state: CameraState, animate?: boolean): Promise<void>;

  /**
   * Display annotation at 3D position
   * @param annotation - Annotation to display
   */
  showAnnotation(annotation: Annotation): void;

  /**
   * Hide annotation
   * @param annotationId - ID of annotation to hide
   */
  hideAnnotation(annotationId: string): void;

  /**
   * Highlight selection made by user
   * @param userId - User who made selection
   * @param selection - Selection query
   */
  highlightSelection(userId: string, selection: SelectionQuery): void;

  /**
   * Show cursor overlay for remote user
   * @param userId - User ID
   * @param position - 2D screen position
   */
  showCursor(userId: string, position: {x: number, y: number}): void;

  /**
   * Hide user cursor
   * @param userId - User ID
   */
  hideCursor(userId: string): void;

  /**
   * Get current camera state
   */
  getCameraState(): CameraState;

  /**
   * Get current selection
   */
  getSelection(): SelectionQuery | null;
}
```

### Interface: CollaborationCallbacks

```typescript
/**
 * Callbacks from viewer to collaboration service
 */
interface CollaborationCallbacks {
  /**
   * Called when local user changes camera
   * @param state - New camera state
   */
  onCameraChange(state: CameraState): void;

  /**
   * Called when local user creates annotation
   * @param annotation - New annotation
   */
  onAnnotationCreate(annotation: Omit<Annotation, 'id' | 'createdAt'>): void;

  /**
   * Called when local user updates annotation
   * @param id - Annotation ID
   * @param changes - Changed fields
   */
  onAnnotationUpdate(id: string, changes: Partial<Annotation>): void;

  /**
   * Called when local user deletes annotation
   * @param id - Annotation ID
   */
  onAnnotationDelete(id: string): void;

  /**
   * Called when local user changes selection
   * @param selection - New selection
   */
  onSelectionChange(selection: SelectionQuery): void;

  /**
   * Called when local user moves cursor
   * @param position - Cursor position
   */
  onCursorMove(position: {x: number, y: number, target?: string}): void;
}
```

### Data Types

```typescript
interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
  fov?: number;
}

interface Annotation {
  id: string;
  userId: string;
  userName: string;
  content: string;
  position: {x: number, y: number, z: number};
  target?: {
    type: 'atom' | 'residue' | 'chain';
    id: string | number;
    label: string;
  };
  color: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

interface SelectionQuery {
  type: 'atom' | 'residue' | 'chain';
  ids: string[];
}
```

### Usage Example

```typescript
// Implement collaboration viewer adapter
class MolStarCollaborationAdapter implements CollaborationViewer {
  constructor(
    private plugin: PluginContext,
    private callbacks: CollaborationCallbacks
  ) {
    this.setupEventListeners();
  }

  async applyCameraState(state: CameraState, animate = true): Promise<void> {
    await this.plugin.canvas3d?.camera.setState(
      {
        position: Vec3.create(...state.position),
        target: Vec3.create(...state.target),
        up: Vec3.create(0, 1, 0),
      },
      animate ? 300 : 0
    );
  }

  showAnnotation(annotation: Annotation): void {
    // Create 3D label at annotation position
    const label = this.createLabel(annotation);
    this.plugin.managers.loci.addLabel(label);
  }

  private setupEventListeners(): void {
    // Listen for camera changes
    this.plugin.canvas3d?.camera.stateChanged.subscribe(() => {
      const state = this.getCameraState();
      this.callbacks.onCameraChange(state);
    });
  }

  getCameraState(): CameraState {
    const camera = this.plugin.canvas3d?.camera;
    return {
      position: Vec3.toArray(camera.state.position),
      target: Vec3.toArray(camera.state.target),
      zoom: camera.state.radius,
      rotation: [0, 0, 0], // Calculate from camera matrix
    };
  }
}

// Usage
const adapter = new MolStarCollaborationAdapter(plugin, {
  onCameraChange: (state) => {
    collaborationService.broadcast('camera-update', { state });
  },
  onAnnotationCreate: (annotation) => {
    collaborationService.broadcast('annotation-add', annotation);
  },
});

collaborationService.on('camera-update', ({ state }) => {
  if (isFollowingCamera) {
    adapter.applyCameraState(state);
  }
});
```

## 3. PDB Service ↔ Application Contract

### Interface: PDBService

```typescript
/**
 * PDB data service for fetching and caching structures
 */
interface PDBService {
  /**
   * Fetch structure by PDB ID
   * @param pdbId - PDB identifier (e.g., "1CRN")
   * @param options - Fetch options
   * @returns Structure data
   */
  fetchStructure(pdbId: string, options?: FetchOptions): Promise<Structure>;

  /**
   * Fetch AlphaFold prediction by UniProt ID
   * @param uniprotId - UniProt identifier
   * @returns Predicted structure
   */
  fetchAlphaFoldStructure(uniprotId: string): Promise<Structure>;

  /**
   * Search structures by query
   * @param query - Search query
   * @param filters - Search filters
   * @returns Search results
   */
  searchStructures(query: string, filters?: SearchFilters): Promise<SearchResult[]>;

  /**
   * Upload custom structure
   * @param file - PDB/CIF file
   * @returns Structure data
   */
  uploadStructure(file: File): Promise<Structure>;

  /**
   * Check if structure is cached
   * @param pdbId - PDB identifier
   */
  isCached(pdbId: string): Promise<boolean>;

  /**
   * Get structure metadata
   * @param pdbId - PDB identifier
   */
  getMetadata(pdbId: string): Promise<StructureMetadata>;
}
```

### Data Types

```typescript
interface Structure {
  pdbId: string;
  content: string;           // PDB/mmCIF format
  format: 'pdb' | 'cif';
  atoms: Atom[];
  metadata: StructureMetadata;
  complexity: StructureComplexity;
}

interface Atom {
  serial: number;
  name: string;
  element: string;
  residue: string;
  residueSeq: number;
  chain: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  isLigand?: boolean;
}

interface StructureMetadata {
  title?: string;
  resolution?: number;
  chains: string[];
  atomCount: number;
  residueCount: number;
  experimentMethod?: string;
  depositionDate?: string;
  authors?: string[];
  keywords?: string[];
}

interface StructureComplexity {
  atomCount: number;
  bondCount: number;
  residueCount: number;
  chainCount: number;
  hasLigands: boolean;
  hasSurfaces: boolean;
  estimatedVertices: number;
}

interface FetchOptions {
  assemblyId?: string;
  chains?: string[];
  cache?: boolean;
  timeout?: number;
}

interface SearchFilters {
  resolution?: {min?: number, max?: number};
  experimentType?: string[];
  depositionDate?: {from?: string, to?: string};
  limit?: number;
  offset?: number;
}

interface SearchResult {
  pdbId: string;
  title: string;
  resolution?: number;
  experimentMethod?: string;
  depositionDate?: string;
  chains: string[];
  relevanceScore: number;
}
```

### Usage Example

```typescript
// API route implementation
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const pdbId = params.id.toUpperCase();

  // Check cache first
  const cached = await supabase
    .from('pdb_structures')
    .select('*')
    .eq('id', pdbId)
    .single();

  if (cached.data) {
    return NextResponse.json(cached.data);
  }

  // Fetch from RCSB
  const response = await fetch(
    `https://files.rcsb.org/download/${pdbId}.pdb`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Structure not found' },
      { status: 404 }
    );
  }

  const content = await response.text();

  // Parse and analyze
  const structure = parsePDB(content);
  const metadata = extractMetadata(structure);
  const complexity = analyzeComplexity(structure);

  // Cache for future use
  await supabase.from('pdb_structures').insert({
    id: pdbId,
    content,
    metadata,
    complexity,
    cached_at: new Date().toISOString(),
  });

  return NextResponse.json({
    pdbId,
    content,
    metadata,
    complexity,
  });
}
```

## 4. Learning CMS ↔ Viewer Contract

### Interface: LearningViewer

```typescript
/**
 * Viewer interface for learning features
 */
interface LearningViewer {
  /**
   * Load and display learning module annotations
   * @param annotations - Module annotations
   */
  loadModuleAnnotations(annotations: Annotation[]): void;

  /**
   * Highlight teaching point
   * @param point - Teaching point to emphasize
   */
  highlightTeachingPoint(point: TeachingPoint): Promise<void>;

  /**
   * Show quiz question at specific location
   * @param question - Quiz question
   * @param targetResidue - Target residue identifier
   */
  showQuizQuestion(question: QuizQuestion, targetResidue: string): void;

  /**
   * Hide current quiz question
   */
  hideQuizQuestion(): void;

  /**
   * Focus camera on specific structure element
   * @param target - Target to focus on
   */
  focusOn(target: FocusTarget): Promise<void>;

  /**
   * Apply learning module color scheme
   * @param scheme - Color coding for teaching
   */
  applyLearningColorScheme(scheme: LearningColorScheme): void;
}
```

### Interface: LearningCallbacks

```typescript
/**
 * Callbacks from viewer to learning system
 */
interface LearningCallbacks {
  /**
   * Called when user interacts with teaching point
   * @param event - Interaction event
   */
  onTeachingPointInteraction(event: InteractionEvent): void;

  /**
   * Called when user submits quiz answer
   * @param questionId - Question identifier
   * @param answer - User's answer
   */
  onQuizAnswer(questionId: string, answer: string): void;

  /**
   * Called when user views annotation
   * @param annotationId - Annotation identifier
   * @param timeSpent - Time spent viewing (ms)
   */
  onAnnotationViewed(annotationId: string, timeSpent: number): void;

  /**
   * Called when user completes module section
   * @param sectionId - Section identifier
   */
  onSectionComplete(sectionId: string): void;
}
```

### Data Types

```typescript
interface TeachingPoint {
  id: string;
  title: string;
  description: string;
  target: {
    type: 'atom' | 'residue' | 'chain' | 'region';
    ids: string[];
  };
  cameraPosition?: CameraState;
  highlightColor: string;
  order: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'hotspot';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface FocusTarget {
  type: 'atom' | 'residue' | 'chain' | 'ligand';
  id: string;
  zoom?: number;
  duration?: number;
}

interface LearningColorScheme {
  scheme: 'hydrophobicity' | 'charge' | 'secondary-structure' | 'custom';
  customColors?: Map<string, string>;
}

interface InteractionEvent {
  type: 'click' | 'hover' | 'focus';
  target: string;
  timestamp: number;
  duration?: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  structureId: string;
  sections: LearningSection[];
  quizzes: QuizQuestion[];
  completionCriteria: CompletionCriteria;
}

interface LearningSection {
  id: string;
  title: string;
  content: string;
  teachingPoints: TeachingPoint[];
  annotations: Annotation[];
  order: number;
}

interface CompletionCriteria {
  viewAllAnnotations: boolean;
  completeAllQuizzes: boolean;
  minTimeSpent?: number;
  minScore?: number;
}
```

### Usage Example

```typescript
// Learning module player
class LearningModulePlayer {
  constructor(
    private viewer: LearningViewer,
    private callbacks: LearningCallbacks
  ) {}

  async loadModule(module: LearningModule): Promise<void> {
    // Load structure
    await this.viewer.loadStructure(module.structureId);

    // Load all annotations
    const allAnnotations = module.sections
      .flatMap(s => s.annotations);
    this.viewer.loadModuleAnnotations(allAnnotations);

    // Apply learning color scheme
    this.viewer.applyLearningColorScheme({
      scheme: 'secondary-structure',
    });
  }

  async playSection(section: LearningSection): Promise<void> {
    // Go through teaching points in order
    for (const point of section.teachingPoints) {
      // Focus camera
      if (point.cameraPosition) {
        await this.viewer.applyCameraState(point.cameraPosition, true);
      }

      // Highlight target
      await this.viewer.highlightTeachingPoint(point);

      // Track interaction
      const startTime = Date.now();
      await this.waitForUserInteraction();
      const duration = Date.now() - startTime;

      this.callbacks.onTeachingPointInteraction({
        type: 'focus',
        target: point.id,
        timestamp: startTime,
        duration,
      });
    }

    // Section complete
    this.callbacks.onSectionComplete(section.id);
  }

  async showQuiz(question: QuizQuestion, target: string): Promise<void> {
    this.viewer.showQuizQuestion(question, target);

    // Wait for answer
    const answer = await this.waitForQuizAnswer();

    this.callbacks.onQuizAnswer(question.id, answer);
    this.viewer.hideQuizQuestion();
  }
}
```

## 5. Hook Contracts

### useMolstar Hook Contract

```typescript
interface UseMolstarReturn {
  // Refs
  containerRef: React.RefObject<HTMLDivElement>;

  // State
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  metadata: StructureMetadata | null;
  metrics: PerformanceMetrics | null;

  // Actions
  loadStructure(data: string, label?: string): Promise<void>;
  loadStructureById(pdbId: string): Promise<void>;
  setRepresentation(type: MolstarRepresentationType): Promise<void>;
  setColorScheme(scheme: MolstarColorScheme): Promise<void>;
  focus(target: FocusTarget): Promise<void>;
  export(options: ExportImageOptions): Promise<Blob>;
  reset(): void;

  // Advanced
  getViewer(): MolstarViewer | null;
  getCameraState(): CameraState | null;
  makeSelection(query: SelectionQuery): void;
}

function useMolstar(config?: MolstarConfig): UseMolstarReturn;
```

### useCollaboration Hook Contract

```typescript
interface UseCollaborationReturn {
  // State
  session: CollaborationSession | null;
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  annotations: Annotation[];
  isConnected: boolean;

  // Actions
  createSession(name: string, settings?: SessionSettings): Promise<void>;
  joinSession(sessionId: string): Promise<void>;
  joinByCode(inviteCode: string): Promise<void>;
  leaveSession(): void;

  // User management
  changeUserRole(userId: string, role: UserRole): Promise<void>;
  kickUser(userId: string): Promise<void>;

  // Annotations
  addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): void;
  updateAnnotation(id: string, changes: Partial<Annotation>): void;
  deleteAnnotation(id: string): void;

  // Camera
  updateCamera(state: CameraState): void;
  followUser(userId: string): void;
  stopFollowing(): void;
}

function useCollaboration(): UseCollaborationReturn;
```

### usePDB Hook Contract

```typescript
interface UsePDBReturn {
  // State
  structure: Structure | null;
  isLoading: boolean;
  error: Error | null;
  searchResults: SearchResult[];

  // Actions
  fetchStructure(pdbId: string): Promise<void>;
  fetchAlphaFold(uniprotId: string): Promise<void>;
  search(query: string, filters?: SearchFilters): Promise<void>;
  upload(file: File): Promise<void>;
  clear(): void;

  // Cache
  preloadStructures(pdbIds: string[]): Promise<void>;
  getCached(): Promise<string[]>;
}

function usePDB(): UsePDBReturn;
```

## Contract Testing

### Example Test Suite

```typescript
describe('LOD Manager Contract', () => {
  it('should accept LODRenderer implementation', () => {
    const mockRenderer: LODRenderer = {
      render: jest.fn().mockResolvedValue(undefined),
      getPerformanceMetrics: jest.fn().mockResolvedValue({
        frameRate: 60,
        atomCount: 1000,
        triangleCount: 50000,
      }),
      updateRepresentation: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      getAtomCount: jest.fn().mockReturnValue(1000),
      isReady: jest.fn().mockReturnValue(true),
    };

    const manager = new LODManager();
    expect(() => manager.loadProgressive({}, mockRenderer)).not.toThrow();
  });
});
```

## Versioning Strategy

All contracts follow semantic versioning:
- **Major**: Breaking changes to interface
- **Minor**: New optional methods/properties
- **Patch**: Documentation updates

Current version: **1.0.0**
