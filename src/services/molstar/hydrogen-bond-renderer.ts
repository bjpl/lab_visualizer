/**
 * Hydrogen Bond Renderer
 *
 * Renders 3D visualization of hydrogen bonds using MolStar's Shape API
 * - Dashed lines for H-bonds
 * - Color coding by strength (green=strong, yellow=moderate, red=weak)
 * - Configurable visibility and styling
 */

/**
 * Hydrogen bond data structure (local definition to avoid MolStar import chain)
 */
export interface HydrogenBond {
  id: string;
  donor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
    position: [number, number, number];
  };
  hydrogen?: {
    atomName: string;
    position: [number, number, number];
  };
  acceptor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
    position: [number, number, number];
  };
  distance: number;
  angle: number;
  strength: 'strong' | 'moderate' | 'weak';
}

/**
 * Color type - number representing RGB hex value
 */
export type Color = number;

/**
 * Color utility function
 */
export function Color(value: number): Color {
  return value;
}

/**
 * Representation builder interface for testability
 * Abstracts MolStar plugin's rendering capabilities
 */
export interface RepresentationBuilder {
  createDashedLine: (id: string, start: [number, number, number], end: [number, number, number], color: Color, options?: { lineWidth?: number; dashLength?: number }) => void;
  createLabel: (id: string, position: [number, number, number], text: string, options?: { color?: Color }) => void;
  updateVisibility: (id: string, visible: boolean) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Plugin interface that supports both MolStar and mocks
 */
export interface HBondPlugin {
  representationBuilder: RepresentationBuilder;
  state?: {
    data?: {
      selectQ?: (...args: any[]) => any[];
    };
  };
}

/**
 * H-bond representation tracked in memory
 */
export interface HBondRepresentation {
  id: string;
  bond: HydrogenBond;
  visible: boolean;
  lineRef?: string;
  labelRef?: string;
  color: Color;
}

/**
 * Rendering configuration
 */
export interface HBondRenderConfig {
  showLabels?: boolean;
  lineWidth?: number;
  dashLength?: number;
  colorByStrength?: boolean;
  customColors?: {
    strong?: Color;
    moderate?: Color;
    weak?: Color;
  };
}

/**
 * Default colors for H-bond strengths
 */
const DEFAULT_COLORS = {
  strong: Color(0x00FF00),   // Green
  moderate: Color(0xFFFF00), // Yellow
  weak: Color(0xFF0000),     // Red (subtle, not bright)
};

/**
 * Hydrogen Bond Renderer
 *
 * Visualizes hydrogen bonds as dashed lines with optional labels
 * Integrates with MolStar's Shape API for 3D rendering
 */
export class HydrogenBondRenderer {
  private plugin: HBondPlugin;
  private representations: Map<string, HBondRepresentation> = new Map();
  private config: Required<HBondRenderConfig>;
  private representationIds: Map<string, string[]> = new Map();

  constructor(
    plugin: HBondPlugin,
    config: HBondRenderConfig = {}
  ) {
    this.plugin = plugin;
    this.config = {
      showLabels: config.showLabels ?? true,
      lineWidth: config.lineWidth ?? 0.1,
      dashLength: config.dashLength ?? 0.2,
      colorByStrength: config.colorByStrength ?? true,
      customColors: {
        strong: config.customColors?.strong ?? DEFAULT_COLORS.strong,
        moderate: config.customColors?.moderate ?? DEFAULT_COLORS.moderate,
        weak: config.customColors?.weak ?? DEFAULT_COLORS.weak,
      },
    };
  }

  /**
   * Render a hydrogen bond as a dashed line
   *
   * @param bond Hydrogen bond data
   * @returns Representation ID for tracking
   */
  async renderBond(bond: HydrogenBond): Promise<string> {
    const id = bond.id;

    // Check for duplicates
    if (this.representations.has(id)) {
      console.warn(`[HydrogenBondRenderer] Bond ${id} already rendered`);
      return id;
    }

    try {
      // Determine color based on strength
      const color = this.config.colorByStrength
        ? this.getColorForStrength(bond.strength)
        : DEFAULT_COLORS.moderate;

      // Create representation entry
      const representation: HBondRepresentation = {
        id,
        bond,
        visible: true,
        color,
      };

      this.representations.set(id, representation);

      // Render the bond visualization
      await this.renderBondGeometry(representation);

      console.info(`[HydrogenBondRenderer] Rendered H-bond ${id} (${bond.strength})`);
      return id;
    } catch (error) {
      console.error('[HydrogenBondRenderer] Failed to render bond:', error);
      throw error;
    }
  }

  /**
   * Render multiple bonds in batch
   *
   * @param bonds Array of hydrogen bonds
   * @returns Array of representation IDs
   */
  async renderBonds(bonds: HydrogenBond[]): Promise<string[]> {
    const startTime = performance.now();
    const ids: string[] = [];

    for (const bond of bonds) {
      try {
        const id = await this.renderBond(bond);
        ids.push(id);
      } catch (error) {
        console.error(`[HydrogenBondRenderer] Failed to render bond ${bond.id}:`, error);
      }
    }

    const duration = performance.now() - startTime;
    console.info(
      `[HydrogenBondRenderer] Rendered ${ids.length}/${bonds.length} bonds in ${duration.toFixed(2)}ms`
    );

    return ids;
  }

  /**
   * Update bond visibility
   *
   * @param id Bond ID
   * @param visible Visibility state
   */
  setVisibility(id: string, visible: boolean): void {
    const repr = this.representations.get(id);
    if (!repr) {
      console.warn(`[HydrogenBondRenderer] Bond ${id} not found`);
      return;
    }

    repr.visible = visible;

    // Update visibility for all representation elements
    const repIds = this.representationIds.get(id) || [];
    for (const repId of repIds) {
      this.plugin.representationBuilder.updateVisibility(repId, visible);
    }
  }

  /**
   * Show all bonds
   */
  showAll(): void {
    for (const id of this.representations.keys()) {
      this.setVisibility(id, true);
    }
  }

  /**
   * Hide all bonds
   */
  hideAll(): void {
    for (const id of this.representations.keys()) {
      this.setVisibility(id, false);
    }
  }

  /**
   * Filter bonds by strength
   *
   * @param strength Strength to show
   * @param hideOthers Whether to hide other strengths
   */
  filterByStrength(strength: 'strong' | 'moderate' | 'weak', hideOthers = true): void {
    for (const [id, repr] of this.representations) {
      const shouldShow = repr.bond.strength === strength;
      this.setVisibility(id, hideOthers ? shouldShow : (shouldShow || repr.visible));
    }
  }

  /**
   * Remove bond visualization
   *
   * @param id Bond ID
   */
  remove(id: string): void {
    const repr = this.representations.get(id);
    if (!repr) {
      return;
    }

    try {
      // Remove all representation elements via plugin
      const repIds = this.representationIds.get(id) || [];
      for (const repId of repIds) {
        this.plugin.representationBuilder.remove(repId);
      }

      // Remove from internal tracking
      this.representations.delete(id);
      this.representationIds.delete(id);
    } catch (error) {
      console.error('[HydrogenBondRenderer] Failed to remove bond:', error);
    }
  }

  /**
   * Clear all bond visualizations
   */
  clear(): void {
    try {
      // Remove all representations
      for (const id of Array.from(this.representations.keys())) {
        this.remove(id);
      }

      console.info('[HydrogenBondRenderer] Cleared all H-bonds');
    } catch (error) {
      console.error('[HydrogenBondRenderer] Failed to clear bonds:', error);
    }
  }

  /**
   * Get bond representation by ID
   */
  getBond(id: string): HBondRepresentation | undefined {
    return this.representations.get(id);
  }

  /**
   * Get all bond representations
   */
  getAllBonds(): HBondRepresentation[] {
    return Array.from(this.representations.values());
  }

  /**
   * Get bonds filtered by strength
   */
  getBondsByStrength(strength: 'strong' | 'moderate' | 'weak'): HBondRepresentation[] {
    return Array.from(this.representations.values()).filter(
      repr => repr.bond.strength === strength
    );
  }

  /**
   * Get bond count statistics
   */
  getStatistics(): {
    total: number;
    visible: number;
    byStrength: {
      strong: number;
      moderate: number;
      weak: number;
    };
  } {
    const all = this.getAllBonds();
    return {
      total: all.length,
      visible: all.filter(r => r.visible).length,
      byStrength: {
        strong: all.filter(r => r.bond.strength === 'strong').length,
        moderate: all.filter(r => r.bond.strength === 'moderate').length,
        weak: all.filter(r => r.bond.strength === 'weak').length,
      },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HBondRenderConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      customColors: {
        ...this.config.customColors,
        ...config.customColors,
      },
    };

    // Re-render all bonds with new config
    const bonds = Array.from(this.representations.values()).map(r => r.bond);
    this.clear();
    this.renderBonds(bonds);
  }

  /**
   * Dispose renderer and cleanup
   */
  dispose(): void {
    this.clear();
    console.info('[HydrogenBondRenderer] Disposed');
  }

  /**
   * PRIVATE METHODS
   */

  /**
   * Get color for bond strength
   */
  private getColorForStrength(strength: 'strong' | 'moderate' | 'weak'): Color {
    return this.config.customColors[strength] ?? DEFAULT_COLORS[strength];
  }

  /**
   * Render bond geometry (line + optional label)
   * Uses the plugin's representationBuilder for 3D rendering
   */
  private async renderBondGeometry(repr: HBondRepresentation): Promise<void> {
    const { bond, color } = repr;
    const lineId = `${bond.id}-line`;
    const labelId = `${bond.id}-label`;

    // Get positions
    const donorPos: [number, number, number] = [
      bond.donor.position[0],
      bond.donor.position[1],
      bond.donor.position[2],
    ];

    const acceptorPos: [number, number, number] = [
      bond.acceptor.position[0],
      bond.acceptor.position[1],
      bond.acceptor.position[2],
    ];

    // Calculate midpoint for label
    const midpoint: [number, number, number] = [
      (donorPos[0] + acceptorPos[0]) / 2,
      (donorPos[1] + acceptorPos[1]) / 2,
      (donorPos[2] + acceptorPos[2]) / 2,
    ];

    // Create dashed line via plugin's representationBuilder
    this.plugin.representationBuilder.createDashedLine(
      lineId,
      donorPos,
      acceptorPos,
      color,
      {
        lineWidth: this.config.lineWidth,
        dashLength: this.config.dashLength,
      }
    );

    // Create label if enabled
    if (this.config.showLabels) {
      const labelText = `${bond.distance.toFixed(2)} Å`;
      this.plugin.representationBuilder.createLabel(
        labelId,
        midpoint,
        labelText,
        { color }
      );
    }

    // Store representation IDs
    this.representationIds.set(
      bond.id,
      this.config.showLabels ? [lineId, labelId] : [lineId]
    );
  }

  /**
   * Calculate number of dashes for a line
   */
  private calculateDashCount(distance: number): number {
    // Approximately one dash every 0.4 Å
    return Math.max(2, Math.ceil(distance / 0.4));
  }
}
