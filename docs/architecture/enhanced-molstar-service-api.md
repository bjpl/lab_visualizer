# Enhanced MolstarService API Specification

## Overview

This document specifies the new APIs to be added to the `molstar-service.ts` for supporting interactive features. All APIs are designed to be backward-compatible and follow the existing service patterns.

## API Version

**Current Version**: v1.0
**Enhanced Version**: v1.1 (additive only, no breaking changes)

---

## 1. Hover Information APIs

### getHoverInfo()

Detect molecular elements at screen coordinates and return detailed information.

```typescript
/**
 * Get molecular information at screen coordinates
 *
 * @param x - Screen X coordinate relative to canvas
 * @param y - Screen Y coordinate relative to canvas
 * @returns Hover information or null if no hit
 */
public async getHoverInfo(
  x: number,
  y: number
): Promise<{
  type: 'atom' | 'residue' | 'chain';
  atom?: AtomInfo;
  residue?: ResidueInfo;
  chain?: ChainInfo;
} | null> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  try {
    const plugin = this.viewer.plugin;
    const canvas = plugin.canvas3d?.webgl?.gl.canvas;

    if (!canvas) {
      return null;
    }

    // Perform ray casting using MolStar's built-in picking
    const pickResult = await plugin.canvas3d?.identify(x, y);

    if (!pickResult || !pickResult.loci) {
      return null;
    }

    // Extract information based on pick result
    const loci = pickResult.loci;

    // Get atom information
    const atomInfo = this.extractAtomInfo(loci);
    const residueInfo = this.extractResidueInfo(loci);
    const chainInfo = this.extractChainInfo(loci);

    return {
      type: 'atom', // Could be 'residue' or 'chain' based on LOD
      atom: atomInfo,
      residue: residueInfo,
      chain: chainInfo,
    };
  } catch (error) {
    console.error('[MolstarService] getHoverInfo failed:', error);
    return null;
  }
}

/**
 * Extract atom information from loci
 * @private
 */
private extractAtomInfo(loci: any): AtomInfo | undefined {
  try {
    if (!loci.kind || loci.kind !== 'element-loci') {
      return undefined;
    }

    const location = loci.elements[0];
    if (!location) return undefined;

    const unit = location.unit;
    const element = location.indices[0];

    // Access atom properties
    const serialNumber = unit.model.atomicHierarchy.atoms.auth_seq_id.value(element);
    const elementSymbol = unit.model.atomicHierarchy.atoms.type_symbol.value(element);
    const atomName = unit.model.atomicHierarchy.atoms.label_atom_id.value(element);

    // Get coordinates
    const coords = unit.conformation.position(element, Vec3.zero());
    const coordinates: [number, number, number] = [coords[0], coords[1], coords[2]];

    // Get B-factor and occupancy if available
    const bFactor = unit.model.atomicHierarchy.atoms.B_iso_or_equiv?.value(element);
    const occupancy = unit.model.atomicHierarchy.atoms.occupancy?.value(element);

    return {
      serialNumber,
      element: elementSymbol,
      name: atomName,
      coordinates,
      bFactor,
      occupancy,
    };
  } catch (error) {
    console.error('[MolstarService] extractAtomInfo failed:', error);
    return undefined;
  }
}

/**
 * Extract residue information from loci
 * @private
 */
private extractResidueInfo(loci: any): ResidueInfo | undefined {
  try {
    if (!loci.kind || loci.kind !== 'element-loci') {
      return undefined;
    }

    const location = loci.elements[0];
    if (!location) return undefined;

    const unit = location.unit;
    const element = location.indices[0];

    // Get residue properties
    const residueIndex = unit.model.atomicHierarchy.residueAtomSegments.index[element];
    const residueName = unit.model.atomicHierarchy.residues.label_comp_id.value(residueIndex);
    const sequenceNumber = unit.model.atomicHierarchy.residues.auth_seq_id.value(residueIndex);
    const chainId = unit.model.atomicHierarchy.chains.auth_asym_id.value(
      unit.model.atomicHierarchy.residueAtomSegments.index[element]
    );

    // Get one-letter code
    const code = this.getOneLetterCode(residueName);

    // Get secondary structure (if available)
    const secondaryStructure = this.getSecondaryStructure(unit, residueIndex);

    // Count atoms in residue
    const atomCount = unit.model.atomicHierarchy.residueAtomSegments.offsets[residueIndex + 1] -
                      unit.model.atomicHierarchy.residueAtomSegments.offsets[residueIndex];

    return {
      name: residueName,
      code,
      sequenceNumber,
      chainId,
      secondaryStructure,
      atomCount,
    };
  } catch (error) {
    console.error('[MolstarService] extractResidueInfo failed:', error);
    return undefined;
  }
}

/**
 * Extract chain information from loci
 * @private
 */
private extractChainInfo(loci: any): ChainInfo | undefined {
  try {
    if (!loci.kind || loci.kind !== 'element-loci') {
      return undefined;
    }

    const location = loci.elements[0];
    if (!location) return undefined;

    const unit = location.unit;
    const element = location.indices[0];

    const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[element];
    const chainId = unit.model.atomicHierarchy.chains.auth_asym_id.value(chainIndex);
    const description = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);

    // Count residues in chain
    const residueCount = unit.model.atomicHierarchy.chainResidueSegments.offsets[chainIndex + 1] -
                         unit.model.atomicHierarchy.chainResidueSegments.offsets[chainIndex];

    // Determine molecule type
    const moleculeType = this.getMoleculeType(unit, chainIndex);

    return {
      chainId,
      description,
      residueCount,
      moleculeType,
    };
  } catch (error) {
    console.error('[MolstarService] extractChainInfo failed:', error);
    return undefined;
  }
}

/**
 * Convert three-letter amino acid code to one-letter
 * @private
 */
private getOneLetterCode(threeLetter: string): string {
  const codeMap: Record<string, string> = {
    ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
    GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
    LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
    SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
    // DNA/RNA
    A: 'A', G: 'G', C: 'C', T: 'T', U: 'U',
    DA: 'A', DG: 'G', DC: 'C', DT: 'T',
  };

  return codeMap[threeLetter.toUpperCase()] || 'X';
}

/**
 * Get secondary structure assignment for residue
 * @private
 */
private getSecondaryStructure(
  unit: any,
  residueIndex: number
): 'helix' | 'sheet' | 'turn' | 'coil' | undefined {
  try {
    // Access secondary structure assignment if available
    const ssIndex = unit.model.properties?.secondaryStructure?.index[residueIndex];
    if (ssIndex === undefined) return undefined;

    const ssType = unit.model.properties.secondaryStructure.type[ssIndex];

    // Map MolStar secondary structure types to our types
    switch (ssType) {
      case 'helix':
      case 'helixAlpha':
      case 'helix3_10':
      case 'helixPi':
        return 'helix';
      case 'sheet':
      case 'strand':
        return 'sheet';
      case 'turn':
        return 'turn';
      default:
        return 'coil';
    }
  } catch (error) {
    return undefined;
  }
}

/**
 * Determine molecule type for chain
 * @private
 */
private getMoleculeType(
  unit: any,
  chainIndex: number
): 'protein' | 'dna' | 'rna' | 'other' {
  try {
    const entityId = unit.model.atomicHierarchy.chains.entity_id.value(chainIndex);
    const entityType = unit.model.atomicHierarchy.entities.type.value(entityId);

    if (entityType === 'polymer') {
      const polymerType = unit.model.atomicHierarchy.entities.pdbx_type?.value(entityId);

      if (polymerType?.includes('polypeptide')) return 'protein';
      if (polymerType?.includes('polyribonucleotide')) return 'rna';
      if (polymerType?.includes('polydeoxyribonucleotide')) return 'dna';
    }

    return 'other';
  } catch (error) {
    return 'other';
  }
}
```

---

## 2. Measurement APIs

### createMeasurement()

Create distance, angle, or dihedral measurements between atoms.

```typescript
/**
 * Create a measurement between atoms
 *
 * @param type - Measurement type
 * @param atoms - Array of MeasurementAtom (2 for distance, 3 for angle, 4 for dihedral)
 * @param options - Display options
 * @returns Measurement ID for future reference
 */
public async createMeasurement(
  type: MeasurementType,
  atoms: MeasurementAtom[],
  options: {
    color?: string;
    label?: string;
    visible?: boolean;
  } = {}
): Promise<string> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const {
    color = '#3b82f6',
    label,
    visible = true,
  } = options;

  try {
    const plugin = this.viewer.plugin;
    const measurementId = `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build loci for selected atoms
    const loci = await this.buildLociFromAtoms(atoms);

    // Create measurement representation using MolStar's measurement tools
    const measurementData = await plugin.builders.structure.measurement.addLabel(loci, {
      type,
      color: Color(parseInt(color.replace('#', '0x'))),
      label,
    });

    // Store measurement reference
    this.measurements.set(measurementId, {
      id: measurementId,
      type,
      atoms,
      representation: measurementData,
      visible,
    });

    if (!visible) {
      await this.setMeasurementVisibility(measurementId, false);
    }

    return measurementId;
  } catch (error) {
    console.error('[MolstarService] createMeasurement failed:', error);
    throw error;
  }
}

/**
 * Remove measurement by ID
 *
 * @param measurementId - ID returned from createMeasurement
 */
public async removeMeasurement(measurementId: string): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const measurement = this.measurements.get(measurementId);
  if (!measurement) {
    console.warn(`[MolstarService] Measurement ${measurementId} not found`);
    return;
  }

  try {
    const plugin = this.viewer.plugin;
    const state = plugin.state.data;

    // Remove the measurement representation from state
    await PluginCommands.State.RemoveObject(plugin, {
      state,
      ref: measurement.representation.transform.ref,
    });

    this.measurements.delete(measurementId);
  } catch (error) {
    console.error('[MolstarService] removeMeasurement failed:', error);
    throw error;
  }
}

/**
 * Update measurement visibility
 *
 * @param measurementId - Measurement ID
 * @param visible - New visibility state
 */
public async setMeasurementVisibility(
  measurementId: string,
  visible: boolean
): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const measurement = this.measurements.get(measurementId);
  if (!measurement) {
    console.warn(`[MolstarService] Measurement ${measurementId} not found`);
    return;
  }

  try {
    const plugin = this.viewer.plugin;
    const state = plugin.state.data;

    const update = state.build()
      .to(measurement.representation)
      .update({ visible });

    await PluginCommands.State.Update(plugin, { state, tree: update });

    measurement.visible = visible;
  } catch (error) {
    console.error('[MolstarService] setMeasurementVisibility failed:', error);
    throw error;
  }
}

/**
 * Build MolStar loci from measurement atoms
 * @private
 */
private async buildLociFromAtoms(atoms: MeasurementAtom[]): Promise<any> {
  // Implementation depends on MolStar's loci building APIs
  // This is a simplified version - actual implementation would use MolStar's StructureQuery
  const plugin = this.viewer!.plugin;
  const state = plugin.state.data;

  const structures = state.selectQ((q) =>
    q.ofTransformer(StateTransforms.Model.StructureFromModel)
  );

  if (structures.length === 0) {
    throw new Error('No structure loaded');
  }

  const structure = structures[0].obj!.data;

  // Build selection for each atom
  const locations = atoms.map((atom) => {
    // Query for specific atom by serial number
    // This is conceptual - actual implementation uses MolStar's query language
    return {
      unit: structure.units.find((u: any) => u.chainGroupId === atom.residue.chainId),
      indices: [atom.serialNumber], // Simplified - needs proper index mapping
    };
  });

  return {
    kind: 'element-loci',
    structure,
    elements: locations,
  };
}

// Add measurement storage to class
private measurements: Map<string, {
  id: string;
  type: MeasurementType;
  atoms: MeasurementAtom[];
  representation: any;
  visible: boolean;
}> = new Map();
```

---

## 3. Sequence APIs

### getSequence()

Extract sequence information for all chains in the structure.

```typescript
/**
 * Get sequence data for all chains in the loaded structure
 *
 * @returns Array of chain sequences
 */
public async getSequence(): Promise<SequenceChain[]> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  try {
    const plugin = this.viewer.plugin;
    const state = plugin.state.data;

    const structures = state.selectQ((q) =>
      q.ofTransformer(StateTransforms.Model.StructureFromModel)
    );

    if (structures.length === 0) {
      throw new Error('No structure loaded');
    }

    const structure = structures[0].obj!.data;
    const chains: SequenceChain[] = [];

    // Iterate through chains
    for (let chainIndex = 0; chainIndex < structure.model.atomicHierarchy.chains._rowCount; chainIndex++) {
      const chainId = structure.model.atomicHierarchy.chains.auth_asym_id.value(chainIndex);
      const entityId = structure.model.atomicHierarchy.chains.entity_id.value(chainIndex);
      const description = structure.model.atomicHierarchy.entities.pdbx_description?.value(entityId);

      // Get residues for this chain
      const residueStart = structure.model.atomicHierarchy.chainResidueSegments.offsets[chainIndex];
      const residueEnd = structure.model.atomicHierarchy.chainResidueSegments.offsets[chainIndex + 1];

      const residues: SequenceResidue[] = [];

      for (let resIdx = residueStart; resIdx < residueEnd; resIdx++) {
        const residueName = structure.model.atomicHierarchy.residues.label_comp_id.value(resIdx);
        const sequenceNumber = structure.model.atomicHierarchy.residues.auth_seq_id.value(resIdx);
        const code = this.getOneLetterCode(residueName);

        // Get secondary structure if available
        const secondaryStructure = this.getSecondaryStructure(structure.units[0], resIdx);

        // Check if modified
        const isModified = this.isModifiedResidue(residueName);

        residues.push({
          sequenceNumber,
          name: residueName,
          code,
          chainId,
          secondaryStructure,
          isModified,
        });
      }

      // Determine sequence type
      const type = this.getMoleculeType(structure.units[0], chainIndex);

      chains.push({
        chainId,
        description,
        type,
        residues,
        length: residues.length,
      });
    }

    return chains;
  } catch (error) {
    console.error('[MolstarService] getSequence failed:', error);
    throw error;
  }
}

/**
 * Check if residue is a modified amino acid
 * @private
 */
private isModifiedResidue(residueName: string): boolean {
  const standardResidues = new Set([
    'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
    'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL',
    'A', 'G', 'C', 'T', 'U', 'DA', 'DG', 'DC', 'DT',
  ]);

  return !standardResidues.has(residueName.toUpperCase());
}
```

### highlightResidues()

Highlight specific residues in the 3D structure.

```typescript
/**
 * Highlight residues in the 3D structure
 *
 * @param selection - Residue selection
 * @returns Selection ID for future reference
 */
public async highlightResidues(selection: {
  chainId: string;
  residueIds: number[];
  color?: string;
  focus?: boolean;
}): Promise<string> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const { chainId, residueIds, color = '#3b82f6', focus = false } = selection;

  try {
    const plugin = this.viewer.plugin;
    const state = plugin.state.data;

    // Build selection query
    const query = {
      chain: chainId,
      residues: residueIds,
    };

    // Apply highlight using MolStar's selection system
    const loci = await this.buildLociFromResidues(query);

    await plugin.managers.structure.selection.fromLoci('add', loci);

    // Apply custom color
    if (color) {
      await this.applySelectionColor(loci, color);
    }

    // Focus camera if requested
    if (focus) {
      await this.focusOnLoci(loci);
    }

    const selectionId = `selection-${Date.now()}`;
    return selectionId;
  } catch (error) {
    console.error('[MolstarService] highlightResidues failed:', error);
    throw error;
  }
}

/**
 * Clear all selections
 */
public async clearSelection(): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  try {
    await this.viewer.plugin.managers.structure.selection.clear();
  } catch (error) {
    console.error('[MolstarService] clearSelection failed:', error);
    throw error;
  }
}

/**
 * Focus camera on residues
 */
public async focusOnResidues(params: {
  chainId: string;
  residueIds: number[];
  animationDuration?: number;
}): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const { chainId, residueIds, animationDuration = 500 } = params;

  try {
    const loci = await this.buildLociFromResidues({
      chain: chainId,
      residues: residueIds,
    });

    await this.focusOnLoci(loci, animationDuration);
  } catch (error) {
    console.error('[MolstarService] focusOnResidues failed:', error);
    throw error;
  }
}

/**
 * Focus camera on loci with animation
 * @private
 */
private async focusOnLoci(loci: any, duration: number = 500): Promise<void> {
  const plugin = this.viewer!.plugin;

  await PluginCommands.Camera.Focus(plugin, {
    loci,
    minRadius: 5,
    extraRadius: 4,
    durationMs: duration,
  });
}

/**
 * Build loci from residue selection
 * @private
 */
private async buildLociFromResidues(query: {
  chain: string;
  residues: number[];
}): Promise<any> {
  // Simplified implementation - actual would use MolStar's StructureQuery
  const plugin = this.viewer!.plugin;
  const state = plugin.state.data;

  const structures = state.selectQ((q) =>
    q.ofTransformer(StateTransforms.Model.StructureFromModel)
  );

  if (structures.length === 0) {
    throw new Error('No structure loaded');
  }

  const structure = structures[0].obj!.data;

  // Build selection using MolStar's query language
  // This is conceptual - actual implementation more complex
  return {
    kind: 'element-loci',
    structure,
    elements: [], // Would be populated with matching residues
  };
}

/**
 * Apply color to selection
 * @private
 */
private async applySelectionColor(loci: any, color: string): Promise<void> {
  const plugin = this.viewer!.plugin;

  // Use MolStar's overpaint system to color selection
  await plugin.managers.structure.component.applyOverpaint(loci, {
    color: Color(parseInt(color.replace('#', '0x'))),
    alpha: 1.0,
  });
}
```

---

## 4. Interaction Detection APIs

### detectInteractions()

Compute non-covalent interactions in the structure.

```typescript
/**
 * Detect non-covalent interactions in the structure
 *
 * @param options - Detection thresholds and filters
 * @returns Array of detected interactions
 */
public async detectInteractions(options: {
  types?: InteractionType[];
  thresholds?: InteractionThresholds;
  includeInterChain?: boolean;
  includeIntraChain?: boolean;
}): Promise<Interaction[]> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  const {
    types = ['hydrogen-bond', 'salt-bridge', 'hydrophobic'],
    thresholds = {
      hydrogenBondDistance: 3.5,
      hydrogenBondAngle: 120,
      saltBridgeDistance: 4.0,
      hydrophobicDistance: 5.0,
      piPiDistance: 6.0,
    },
    includeInterChain = true,
    includeIntraChain = true,
  } = options;

  try {
    const interactions: Interaction[] = [];

    // Detect each interaction type
    for (const type of types) {
      switch (type) {
        case 'hydrogen-bond':
          interactions.push(...await this.detectHydrogenBonds(thresholds));
          break;
        case 'salt-bridge':
          interactions.push(...await this.detectSaltBridges(thresholds));
          break;
        case 'hydrophobic':
          interactions.push(...await this.detectHydrophobicContacts(thresholds));
          break;
        case 'pi-pi':
          interactions.push(...await this.detectPiPiStacking(thresholds));
          break;
      }
    }

    // Filter by chain relationship
    return interactions.filter((interaction) => {
      if (interaction.isInterChain) {
        return includeInterChain;
      } else {
        return includeIntraChain;
      }
    });
  } catch (error) {
    console.error('[MolstarService] detectInteractions failed:', error);
    throw error;
  }
}

/**
 * Detect hydrogen bonds
 * @private
 */
private async detectHydrogenBonds(
  thresholds: InteractionThresholds
): Promise<Interaction[]> {
  const plugin = this.viewer!.plugin;
  const state = plugin.state.data;

  const structures = state.selectQ((q) =>
    q.ofTransformer(StateTransforms.Model.StructureFromModel)
  );

  if (structures.length === 0) return [];

  const structure = structures[0].obj!.data;
  const interactions: Interaction[] = [];

  // H-bond donors: N-H, O-H
  const donors = this.findAtomsMatching(structure, (element) =>
    element === 'N' || element === 'O'
  );

  // H-bond acceptors: O, N
  const acceptors = this.findAtomsMatching(structure, (element) =>
    element === 'O' || element === 'N'
  );

  // Check all donor-acceptor pairs
  for (const donor of donors) {
    for (const acceptor of acceptors) {
      if (donor.serialNumber === acceptor.serialNumber) continue;

      const distance = this.calculateDistance(donor.position, acceptor.position);

      if (distance <= thresholds.hydrogenBondDistance) {
        // Check angle if hydrogen position is known
        // For now, accept all within distance threshold
        const angle = 180; // Placeholder

        if (angle >= thresholds.hydrogenBondAngle) {
          interactions.push({
            id: `hbond-${donor.serialNumber}-${acceptor.serialNumber}`,
            type: 'hydrogen-bond',
            atom1: donor,
            atom2: acceptor,
            distance,
            angle,
            strength: 1.0 - distance / thresholds.hydrogenBondDistance,
            isInterChain: donor.residue.chainId !== acceptor.residue.chainId,
          });
        }
      }
    }
  }

  return interactions;
}

/**
 * Detect salt bridges
 * @private
 */
private async detectSaltBridges(
  thresholds: InteractionThresholds
): Promise<Interaction[]> {
  const plugin = this.viewer!.plugin;
  const state = plugin.state.data;

  const structures = state.selectQ((q) =>
    q.ofTransformer(StateTransforms.Model.StructureFromModel)
  );

  if (structures.length === 0) return [];

  const structure = structures[0].obj!.data;
  const interactions: Interaction[] = [];

  // Positive: ARG, LYS
  const positiveResidues = this.findResiduesMatching(structure, (name) =>
    name === 'ARG' || name === 'LYS'
  );

  // Negative: ASP, GLU
  const negativeResidues = this.findResiduesMatching(structure, (name) =>
    name === 'ASP' || name === 'GLU'
  );

  // Check positive-negative pairs
  for (const pos of positiveResidues) {
    for (const neg of negativeResidues) {
      const distance = this.calculateDistance(pos.position, neg.position);

      if (distance <= thresholds.saltBridgeDistance) {
        interactions.push({
          id: `saltbridge-${pos.serialNumber}-${neg.serialNumber}`,
          type: 'salt-bridge',
          atom1: pos,
          atom2: neg,
          distance,
          strength: 1.0 - distance / thresholds.saltBridgeDistance,
          isInterChain: pos.residue.chainId !== neg.residue.chainId,
        });
      }
    }
  }

  return interactions;
}

/**
 * Detect hydrophobic contacts
 * @private
 */
private async detectHydrophobicContacts(
  thresholds: InteractionThresholds
): Promise<Interaction[]> {
  // Similar implementation to hydrogen bonds but for hydrophobic residues
  // ALA, VAL, LEU, ILE, PHE, TRP, MET
  return [];
}

/**
 * Detect pi-pi stacking interactions
 * @private
 */
private async detectPiPiStacking(
  thresholds: InteractionThresholds
): Promise<Interaction[]> {
  // Detect aromatic-aromatic stacking
  // PHE, TYR, TRP, HIS
  return [];
}

/**
 * Find atoms matching predicate
 * @private
 */
private findAtomsMatching(
  structure: any,
  predicate: (element: string) => boolean
): MeasurementAtom[] {
  const atoms: MeasurementAtom[] = [];

  // Iterate through all atoms in structure
  // Simplified - actual implementation would be more efficient
  for (const unit of structure.units) {
    for (let i = 0; i < unit.elements.length; i++) {
      const element = unit.model.atomicHierarchy.atoms.type_symbol.value(i);

      if (predicate(element)) {
        const atom = this.extractMeasurementAtom(unit, i);
        atoms.push(atom);
      }
    }
  }

  return atoms;
}

/**
 * Find residues matching predicate
 * @private
 */
private findResiduesMatching(
  structure: any,
  predicate: (name: string) => boolean
): MeasurementAtom[] {
  // Similar to findAtomsMatching but groups by residue
  return [];
}

/**
 * Extract measurement atom from unit and element index
 * @private
 */
private extractMeasurementAtom(unit: any, elementIndex: number): MeasurementAtom {
  const serialNumber = unit.model.atomicHierarchy.atoms.auth_seq_id.value(elementIndex);
  const element = unit.model.atomicHierarchy.atoms.type_symbol.value(elementIndex);
  const name = unit.model.atomicHierarchy.atoms.label_atom_id.value(elementIndex);

  const coords = unit.conformation.position(elementIndex, Vec3.zero());
  const position: [number, number, number] = [coords[0], coords[1], coords[2]];

  const residueIndex = unit.model.atomicHierarchy.residueAtomSegments.index[elementIndex];
  const residueName = unit.model.atomicHierarchy.residues.label_comp_id.value(residueIndex);
  const sequenceNumber = unit.model.atomicHierarchy.residues.auth_seq_id.value(residueIndex);
  const chainId = unit.model.atomicHierarchy.chains.auth_asym_id.value(
    unit.model.atomicHierarchy.residueAtomSegments.index[elementIndex]
  );

  return {
    serialNumber,
    element,
    name,
    position,
    residue: {
      name: residueName,
      sequenceNumber,
      chainId,
    },
  };
}

/**
 * Calculate Euclidean distance between two points
 * @private
 */
private calculateDistance(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
```

---

## 5. Visualization Control APIs

### toggleInteractions()

Show/hide interaction visualizations in 3D.

```typescript
/**
 * Toggle interaction visualization
 *
 * @param interactionIds - IDs of interactions to show/hide
 * @param visible - Visibility state
 */
public async setInteractionsVisibility(
  interactionIds: string[],
  visible: boolean
): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  try {
    const plugin = this.viewer.plugin;

    for (const id of interactionIds) {
      const interaction = this.interactionRepresentations.get(id);

      if (interaction) {
        const state = plugin.state.data;
        const update = state.build()
          .to(interaction.representation)
          .update({ visible });

        await PluginCommands.State.Update(plugin, { state, tree: update });
      }
    }
  } catch (error) {
    console.error('[MolstarService] setInteractionsVisibility failed:', error);
    throw error;
  }
}

/**
 * Create visual representation of interactions
 *
 * @param interactions - Interactions to visualize
 */
public async visualizeInteractions(
  interactions: Interaction[]
): Promise<void> {
  if (!this.viewer) {
    throw new Error('Mol* viewer not initialized');
  }

  try {
    const plugin = this.viewer.plugin;

    // Clear existing interaction representations
    await this.clearInteractionRepresentations();

    // Create representation for each interaction
    for (const interaction of interactions) {
      const color = this.getInteractionColor(interaction.type);
      const loci = await this.buildLociFromAtoms([interaction.atom1, interaction.atom2]);

      // Create distance label or line representation
      const representation = await plugin.builders.structure.representation.addRepresentation(
        loci,
        {
          type: 'line',
          color,
          lineWidth: 2,
        }
      );

      this.interactionRepresentations.set(interaction.id, {
        interaction,
        representation,
      });
    }
  } catch (error) {
    console.error('[MolstarService] visualizeInteractions failed:', error);
    throw error;
  }
}

/**
 * Clear all interaction representations
 */
public async clearInteractionRepresentations(): Promise<void> {
  if (!this.viewer) return;

  try {
    const plugin = this.viewer.plugin;
    const state = plugin.state.data;

    for (const [id, { representation }] of this.interactionRepresentations) {
      await PluginCommands.State.RemoveObject(plugin, {
        state,
        ref: representation.transform.ref,
      });
    }

    this.interactionRepresentations.clear();
  } catch (error) {
    console.error('[MolstarService] clearInteractionRepresentations failed:', error);
  }
}

/**
 * Get color for interaction type
 * @private
 */
private getInteractionColor(type: InteractionType): number {
  const colorMap: Record<InteractionType, string> = {
    'hydrogen-bond': '#3b82f6', // blue
    'salt-bridge': '#ef4444', // red
    'hydrophobic': '#9ca3af', // gray
    'pi-pi': '#a855f7', // purple
  };

  return parseInt(colorMap[type].replace('#', '0x'));
}

// Add interaction storage to class
private interactionRepresentations: Map<string, {
  interaction: Interaction;
  representation: any;
}> = new Map();
```

---

## Implementation Checklist

### Phase 1: Core APIs (Week 1-2)
- [ ] Implement `getHoverInfo()` with ray casting
- [ ] Implement `extractAtomInfo()`, `extractResidueInfo()`, `extractChainInfo()`
- [ ] Add helper methods: `getOneLetterCode()`, `getSecondaryStructure()`, `getMoleculeType()`
- [ ] Write unit tests for hover detection
- [ ] Performance test with large structures (>50,000 atoms)

### Phase 2: Measurement APIs (Week 2-3)
- [ ] Implement `createMeasurement()` for distance/angle/dihedral
- [ ] Implement `removeMeasurement()` and `setMeasurementVisibility()`
- [ ] Add `buildLociFromAtoms()` helper
- [ ] Create measurement storage and lifecycle management
- [ ] Write integration tests for measurement workflow
- [ ] Add measurement persistence (optional)

### Phase 3: Sequence APIs (Week 3-4)
- [ ] Implement `getSequence()` with chain iteration
- [ ] Implement `highlightResidues()` with selection management
- [ ] Implement `focusOnResidues()` with camera animation
- [ ] Add `clearSelection()` for reset
- [ ] Write tests for sequence extraction and highlighting
- [ ] Performance test with long sequences (>1000 residues)

### Phase 4: Interaction APIs (Week 4-6)
- [ ] Implement `detectInteractions()` coordinator
- [ ] Implement `detectHydrogenBonds()` with angle checking
- [ ] Implement `detectSaltBridges()` with charge pairing
- [ ] Implement `detectHydrophobicContacts()`
- [ ] Implement `detectPiPiStacking()`
- [ ] Add `visualizeInteractions()` with custom representations
- [ ] Optimize detection algorithms for performance
- [ ] Write comprehensive tests for all interaction types

### Phase 5: Integration & Polish (Week 6-7)
- [ ] Integrate all APIs with component hooks
- [ ] Add error handling and recovery
- [ ] Performance profiling and optimization
- [ ] Documentation and code examples
- [ ] E2E testing with real PDB structures
- [ ] Security audit for input validation

---

## Performance Targets

| API | Target Latency | Notes |
|-----|----------------|-------|
| `getHoverInfo()` | <50ms | Throttled to 100ms in practice |
| `createMeasurement()` | <200ms | Includes rendering |
| `getSequence()` | <500ms | Cached after first call |
| `highlightResidues()` | <100ms | Depends on selection size |
| `detectInteractions()` | <2s | Background computation |
| `visualizeInteractions()` | <1s | For <500 interactions |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-24
**Implementation Status**: Specification Complete
