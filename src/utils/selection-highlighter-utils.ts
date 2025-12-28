/**
 * Selection Highlighter Utilities
 *
 * Pure state management functions for selection highlighting that can be
 * tested independently of MolStar or any visualization library.
 *
 * Color Conventions:
 * - Selection: Green (#00ff00) at 50% opacity
 * - Hover: Magenta (#ff00ff) at 60% opacity
 */

/**
 * Loci representation for highlight tracking
 */
export interface SimpleLoci {
  kind: string;
  structure?: {
    model?: { id: string };
  };
  elements: Array<{
    unit: { id: number };
    indices: number[];
  }>;
}

/**
 * Highlight configuration
 */
export interface HighlightConfig {
  id: string;
  type: 'selection' | 'hover';
  color: string;
  opacity: number;
  loci: SimpleLoci;
  createdAt: number;
}

/**
 * Highlight options
 */
export interface HighlightOptions {
  color?: string;
  opacity?: number;
  includeResidue?: boolean;
  animationDuration?: number;
}

/**
 * Default colors for highlights
 */
export const DEFAULT_SELECTION_COLOR = '#00ff00';
export const DEFAULT_HOVER_COLOR = '#ff00ff';
export const DEFAULT_SELECTION_OPACITY = 0.5;
export const DEFAULT_HOVER_OPACITY = 0.6;

/**
 * Generate unique highlight ID
 */
export function generateHighlightId(type: 'selection' | 'hover'): string {
  return `highlight-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate loci-based highlight ID for deduplication
 */
export function getLociKey(loci: SimpleLoci): string {
  if (!loci || !loci.elements || loci.elements.length === 0) {
    return 'empty';
  }
  const unitIds = loci.elements.map(e => e.unit.id).sort().join('-');
  const indices = loci.elements.flatMap(e => e.indices).sort().join(',');
  return `${unitIds}:${indices}`;
}

/**
 * Check if loci is empty or invalid
 */
export function isEmptyLoci(loci: SimpleLoci | null | undefined): boolean {
  return !loci || !loci.elements || loci.elements.length === 0;
}

/**
 * Validate loci structure
 */
export function validateLoci(loci: unknown): loci is SimpleLoci {
  if (!loci || typeof loci !== 'object') {
    return false;
  }
  const l = loci as SimpleLoci;
  return typeof l.kind === 'string' && Array.isArray(l.elements);
}

/**
 * Selection Highlighter State Manager
 *
 * Manages highlight state without MolStar dependencies
 */
export class SelectionHighlighterState {
  private highlights: Map<string, HighlightConfig> = new Map();
  private lociToId: Map<string, string> = new Map();
  private currentHoverId: string | null = null;
  private disposed: boolean = false;

  /**
   * Add a selection highlight
   */
  addSelection(
    loci: SimpleLoci,
    color: string = DEFAULT_SELECTION_COLOR,
    opacity: number = DEFAULT_SELECTION_OPACITY
  ): HighlightConfig | null {
    this.checkDisposed();

    if (isEmptyLoci(loci)) {
      return null;
    }

    const lociKey = getLociKey(loci);

    // Check for duplicate - replace existing
    if (this.lociToId.has(lociKey)) {
      const existingId = this.lociToId.get(lociKey)!;
      this.highlights.delete(existingId);
    }

    const id = generateHighlightId('selection');
    const config: HighlightConfig = {
      id,
      type: 'selection',
      color,
      opacity,
      loci,
      createdAt: Date.now(),
    };

    this.highlights.set(id, config);
    this.lociToId.set(lociKey, id);

    return config;
  }

  /**
   * Add a hover highlight (auto-removes previous hover)
   */
  addHover(
    loci: SimpleLoci,
    color: string = DEFAULT_HOVER_COLOR,
    opacity: number = DEFAULT_HOVER_OPACITY
  ): HighlightConfig | null {
    this.checkDisposed();

    if (isEmptyLoci(loci)) {
      return null;
    }

    // Remove previous hover
    if (this.currentHoverId) {
      const prev = this.highlights.get(this.currentHoverId);
      if (prev) {
        this.lociToId.delete(getLociKey(prev.loci));
      }
      this.highlights.delete(this.currentHoverId);
    }

    const id = generateHighlightId('hover');
    const config: HighlightConfig = {
      id,
      type: 'hover',
      color,
      opacity,
      loci,
      createdAt: Date.now(),
    };

    this.highlights.set(id, config);
    this.lociToId.set(getLociKey(loci), id);
    this.currentHoverId = id;

    return config;
  }

  /**
   * Remove a highlight by loci
   */
  removeByLoci(loci: SimpleLoci): boolean {
    this.checkDisposed();

    const lociKey = getLociKey(loci);
    const id = this.lociToId.get(lociKey);

    if (!id) {
      return false;
    }

    const config = this.highlights.get(id);
    if (config?.type === 'hover') {
      this.currentHoverId = null;
    }

    this.highlights.delete(id);
    this.lociToId.delete(lociKey);

    return true;
  }

  /**
   * Remove a highlight by ID
   */
  removeById(id: string): boolean {
    this.checkDisposed();

    const config = this.highlights.get(id);
    if (!config) {
      return false;
    }

    if (config.type === 'hover') {
      this.currentHoverId = null;
    }

    this.lociToId.delete(getLociKey(config.loci));
    this.highlights.delete(id);

    return true;
  }

  /**
   * Clear all highlights
   */
  clearAll(): string[] {
    this.checkDisposed();

    const ids = Array.from(this.highlights.keys());
    this.highlights.clear();
    this.lociToId.clear();
    this.currentHoverId = null;

    return ids;
  }

  /**
   * Get all active highlight IDs
   */
  getActiveHighlights(): Set<string> {
    this.checkDisposed();
    return new Set(this.highlights.keys());
  }

  /**
   * Get highlight config by ID
   */
  getHighlight(id: string): HighlightConfig | undefined {
    this.checkDisposed();
    return this.highlights.get(id);
  }

  /**
   * Get current hover ID
   */
  getCurrentHoverId(): string | null {
    return this.currentHoverId;
  }

  /**
   * Get count of active highlights
   */
  getCount(): number {
    return this.highlights.size;
  }

  /**
   * Check if disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Dispose the highlighter
   */
  dispose(): void {
    this.clearAll();
    this.disposed = true;
  }

  /**
   * Check if disposed and throw
   */
  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('SelectionHighlighter has been disposed');
    }
  }
}

/**
 * Expand atom selection to include entire residue
 */
export function expandToResidue(loci: SimpleLoci, residueSize: number = 4): SimpleLoci {
  if (isEmptyLoci(loci)) {
    return loci;
  }

  return {
    ...loci,
    elements: loci.elements.map(element => ({
      ...element,
      indices: Array.from(
        { length: Math.max(residueSize, element.indices.length) },
        (_, i) => element.indices[0] + i
      ),
    })),
  };
}

/**
 * Create a selection highlighter instance
 */
export function createSelectionHighlighter(): SelectionHighlighterState {
  return new SelectionHighlighterState();
}
