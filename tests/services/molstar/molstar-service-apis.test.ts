/**
 * MolStar Service API Tests - Missing APIs (TDD)
 *
 * Comprehensive test suite for missing MolStar service APIs identified in architecture review.
 * Tests written BEFORE implementation to follow Test-Driven Development approach.
 *
 * Missing APIs:
 * 1. getHoverInfo(x: number, y: number): Promise<HoverInfo | null>
 * 2. getSequence(): Promise<SequenceData>
 * 3. highlightResidues(selection: ResidueSelection): Promise<void>
 * 4. focusOnResidues(residues: number[], options?: FocusOptions): Promise<void>
 * 5. detectInteractions(options: InteractionOptions): Promise<Interaction[]>
 * 6. visualizeInteractions(interactions: Interaction[]): Promise<void>
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MolstarService } from '@/services/molstar-service';
import type { HoverInfo } from '@/types/molstar';

// Mock MolStar modules
vi.mock('molstar/lib/mol-plugin-ui', () => ({
  createPluginUI: vi.fn(() =>
    Promise.resolve({
      dispose: vi.fn(),
      clear: vi.fn(() => Promise.resolve()),
      builders: {
        data: {
          rawData: vi.fn(() => Promise.resolve({})),
          download: vi.fn(() => Promise.resolve({})),
        },
        structure: {
          parseTrajectory: vi.fn(() => Promise.resolve({})),
          createModel: vi.fn(() => Promise.resolve({})),
          createStructure: vi.fn(() => Promise.resolve({
            obj: {
              data: {
                label: 'Test Structure',
                models: [{
                  label: 'Model 1',
                  atomicHierarchy: {
                    atoms: {
                      label_seq_id: { value: () => 42 },
                      label_comp_id: { value: () => 'ALA' },
                      label_atom_id: { value: () => 'CA' },
                      type_symbol: { value: () => 'C' },
                    },
                    residues: {
                      label_seq_id: { value: () => 1 },
                    },
                    chains: {
                      label_asym_id: { value: () => 'A' },
                    },
                  },
                  sequence: {
                    sequences: [{
                      entityId: '1',
                      sequence: {
                        codes: [0, 1, 2, 3, 4], // Residue type codes
                        length: 5,
                      },
                    }],
                  },
                }],
                units: [],
                elementCount: 100,
                residueCount: 20,
              },
            },
          })),
          representation: {
            addRepresentation: vi.fn(() => Promise.resolve({})),
          },
        },
      },
      state: {
        data: {
          selectQ: vi.fn(() => [{
            transform: { ref: 'mock-ref' },
            obj: {
              data: {
                label: 'Test Structure',
                models: [{
                  label: 'Model 1',
                  sequence: {
                    sequences: [{
                      entityId: '1',
                      sequence: {
                        codes: [0, 1, 2, 3, 4],
                        length: 5,
                      },
                    }],
                  },
                }],
                units: [],
                elementCount: 100,
                residueCount: 20,
              },
            },
          }]),
          build: vi.fn(() => ({
            to: vi.fn(() => ({
              update: vi.fn(() => ({})),
              apply: vi.fn(() => Promise.resolve({})),
            })),
          })),
        },
      },
      behaviors: {
        interaction: {
          hover: {
            subscribe: vi.fn((callback) => {
              // Simulate hover event
              setTimeout(() => {
                callback({
                  current: {
                    loci: {
                      kind: 'element-loci',
                      elements: [{
                        unit: {
                          model: {
                            atomicHierarchy: {
                              chains: { label_asym_id: { value: () => 'A' } },
                              residues: { label_seq_id: { value: () => 1 } },
                              atoms: {
                                label_comp_id: { value: () => 'ALA' },
                                label_atom_id: { value: () => 'CA' },
                                type_symbol: { value: () => 'C' },
                              },
                            },
                          },
                          conformation: {
                            position: () => [1.0, 2.0, 3.0],
                          },
                          getElementLocation: () => ({ element: 0 }),
                        },
                        indices: [0],
                      }],
                    },
                  },
                });
              }, 10);
              return { unsubscribe: vi.fn() };
            }),
          },
          click: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
        },
      },
      managers: {
        structure: {
          selection: {
            fromExpression: vi.fn(() => Promise.resolve()),
            clear: vi.fn(() => Promise.resolve()),
            additionsHistory: [],
          },
          component: {
            setOverpaint: vi.fn(() => Promise.resolve()),
            clearOverpaint: vi.fn(() => Promise.resolve()),
          },
          hierarchy: {
            current: {
              structures: [{
                model: {
                  atomicHierarchy: {
                    residues: {
                      count: 20,
                    },
                  },
                },
              }],
            },
          },
        },
        interactivity: {
          lociHighlights: {
            highlightOnly: vi.fn(() => Promise.resolve()),
            clearHighlights: vi.fn(() => Promise.resolve()),
          },
        },
      },
      canvas3d: {
        camera: {
          state: {
            position: [0, 0, 50],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fov: 45,
          },
          focus: vi.fn(() => Promise.resolve()),
          getScreenPosition: vi.fn((pos) => ({
            x: pos[0] * 100,
            y: pos[1] * 100,
          })),
        },
        webgl: {
          gl: {
            canvas: {
              toBlob: vi.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
              getBoundingClientRect: () => ({
                left: 0,
                top: 0,
                width: 800,
                height: 600,
              }),
            },
          },
        },
        identify: vi.fn((x, y) => ({
          loci: {
            kind: 'element-loci',
            elements: [{
              unit: {
                model: {
                  atomicHierarchy: {
                    chains: { label_asym_id: { value: () => 'A' } },
                    residues: { label_seq_id: { value: () => 1 } },
                    atoms: {
                      label_comp_id: { value: () => 'ALA' },
                      label_atom_id: { value: () => 'CA' },
                      type_symbol: { value: () => 'C' },
                    },
                  },
                },
                conformation: {
                  position: () => [1.0, 2.0, 3.0],
                },
                getElementLocation: () => ({ element: 0 }),
              },
              indices: [0],
            }],
          },
        })),
      },
    })
  ),
  DefaultPluginUISpec: vi.fn(() => ({})),
  renderReact18: vi.fn(),
}));

vi.mock('molstar/lib/mol-plugin-ui/spec', () => ({
  DefaultPluginUISpec: vi.fn(() => ({})),
}));

vi.mock('molstar/lib/mol-plugin/context', () => ({}));

vi.mock('molstar/lib/mol-plugin/commands', () => ({
  PluginCommands: {
    State: {
      RemoveObject: vi.fn(() => Promise.resolve()),
      Update: vi.fn(() => Promise.resolve()),
      ToggleVisibility: vi.fn(() => Promise.resolve()),
    },
    Camera: {
      Reset: vi.fn(() => Promise.resolve()),
      Focus: vi.fn(() => Promise.resolve()),
    },
  },
}));

vi.mock('molstar/lib/mol-plugin-state/transforms', () => ({
  StateTransforms: {
    Representation: {
      StructureRepresentation3D: {},
    },
    Model: {
      StructureFromModel: {},
    },
  },
}));

vi.mock('molstar/lib/mol-plugin/config', () => ({
  PluginConfig: {
    VolumeStreaming: { Enabled: 'volume-streaming-enabled' },
    Viewport: {
      ShowExpand: 'viewport-show-expand',
      ShowSelectionMode: 'viewport-show-selection-mode',
      ShowAnimation: 'viewport-show-animation',
    },
  },
}));

vi.mock('molstar/lib/mol-util/color', () => {
  const ColorFn = vi.fn((hex: number) => hex);
  (ColorFn as any).fromRgb = vi.fn((r: number, g: number, b: number) => ({ r, g, b }));
  return {
    Color: ColorFn,
    ColorNames: { green: 0x00ff00, yellow: 0xffff00 },
    ColorMap: vi.fn((colors: any) => colors),
  };
});

// Type definitions for missing APIs (to be implemented)
export interface SequenceData {
  chainId: string;
  sequence: string;
  residues: Array<{
    position: number;
    code: string;
    name: string;
  }>;
}

export interface ResidueSelection {
  chainId: string;
  residueNumbers: number[];
  color?: number;
  alpha?: number;
}

export interface FocusOptions {
  zoom?: number;
  animate?: boolean;
  duration?: number;
}

export interface InteractionOptions {
  types?: Array<'hydrogen-bond' | 'salt-bridge' | 'hydrophobic' | 'pi-stacking'>;
  distanceThreshold?: number;
  includeWater?: boolean;
}

export interface Interaction {
  id: string;
  type: 'hydrogen-bond' | 'salt-bridge' | 'hydrophobic' | 'pi-stacking';
  donor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
  };
  acceptor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
  };
  distance: number;
  angle?: number;
}

describe('MolstarService - Missing APIs (TDD)', () => {
  let service: MolstarService;
  let container: HTMLDivElement;

  beforeEach(async () => {
    // Reset singleton
    MolstarService.resetInstance();
    service = MolstarService.getInstance();

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Initialize service
    await service.initialize(container);

    // Load test structure
    const pdbData = `HEADER    TEST STRUCTURE
ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C
ATOM      3  C   ALA A   1       3.000   4.000   5.000  1.00  0.00           C
END`;
    await service.loadStructure(pdbData, { format: 'pdb', label: 'Test' });
  });

  afterEach(() => {
    service.dispose();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('API 1: getHoverInfo(x, y)', () => {
    it('should return HoverInfo for valid coordinates', async () => {
      const hoverInfo = await (service as any).getHoverInfo(100, 200);

      expect(hoverInfo).toBeDefined();
      expect(hoverInfo).toHaveProperty('chainId');
      expect(hoverInfo).toHaveProperty('residueSeq');
      expect(hoverInfo).toHaveProperty('residueName');
      expect(hoverInfo).toHaveProperty('position');
      expect(hoverInfo.position).toHaveLength(3);
    });

    it('should return null when hovering over empty space', async () => {
      const hoverInfo = await (service as any).getHoverInfo(-1000, -1000);

      expect(hoverInfo).toBeNull();
    });

    it('should complete within 100ms', async () => {
      const start = performance.now();
      await (service as any).getHoverInfo(100, 200);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle invalid coordinates gracefully', async () => {
      await expect((service as any).getHoverInfo(NaN, 100)).resolves.toBeNull();
      await expect((service as any).getHoverInfo(100, NaN)).resolves.toBeNull();
      await expect((service as any).getHoverInfo(Infinity, 100)).resolves.toBeNull();
    });

    it('should throw error when viewer not initialized', async () => {
      service.dispose();

      await expect((service as any).getHoverInfo(100, 200))
        .rejects.toThrow('Mol* viewer not initialized');
    });

    it('should return correct atom details', async () => {
      const hoverInfo = await (service as any).getHoverInfo(100, 200);

      if (hoverInfo) {
        expect(hoverInfo.atomName).toBeDefined();
        expect(hoverInfo.atomElement).toBeDefined();
        expect(typeof hoverInfo.residueSeq).toBe('number');
        expect(typeof hoverInfo.residueName).toBe('string');
      }
    });

    it('should handle multiple rapid hover queries', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        (service as any).getHoverInfo(i * 10, i * 10)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
    });
  });

  describe('API 2: getSequence()', () => {
    it('should return sequence data for loaded structure', async () => {
      const sequenceData = await (service as any).getSequence();

      expect(sequenceData).toBeDefined();
      expect(sequenceData).toHaveProperty('chainId');
      expect(sequenceData).toHaveProperty('sequence');
      expect(sequenceData).toHaveProperty('residues');
      expect(Array.isArray(sequenceData.residues)).toBe(true);
    });

    it('should return correct sequence length', async () => {
      const sequenceData = await (service as any).getSequence();

      expect(sequenceData.sequence.length).toBeGreaterThan(0);
      expect(sequenceData.residues.length).toBe(sequenceData.sequence.length);
    });

    it('should include residue positions and codes', async () => {
      const sequenceData = await (service as any).getSequence();

      if (sequenceData.residues.length > 0) {
        const residue = sequenceData.residues[0];
        expect(residue).toHaveProperty('position');
        expect(residue).toHaveProperty('code');
        expect(residue).toHaveProperty('name');
        expect(typeof residue.position).toBe('number');
        expect(typeof residue.code).toBe('string');
      }
    });

    it('should throw when no structure is loaded', async () => {
      service.dispose();
      await service.initialize(container);

      await expect((service as any).getSequence())
        .rejects.toThrow('No structure loaded');
    });

    it('should complete within 100ms', async () => {
      const start = performance.now();
      await (service as any).getSequence();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle multi-chain structures', async () => {
      // For single chain structure, should still work
      const sequenceData = await (service as any).getSequence();
      expect(sequenceData.chainId).toBeDefined();
    });

    it('should convert residue codes correctly', async () => {
      const sequenceData = await (service as any).getSequence();

      sequenceData.residues.forEach((residue: any) => {
        expect(residue.code).toMatch(/^[A-Z]$/); // Single letter code
        expect(residue.name).toMatch(/^[A-Z]{3}$/); // Three letter code
      });
    });
  });

  describe('API 3: highlightResidues(selection)', () => {
    it('should highlight specified residues', async () => {
      const selection: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [1, 2, 3],
      };

      await expect((service as any).highlightResidues(selection))
        .resolves.not.toThrow();
    });

    it('should apply custom color to highlight', async () => {
      const selection: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [1],
        color: 0x00ff00, // Green
      };

      await expect((service as any).highlightResidues(selection))
        .resolves.not.toThrow();
    });

    it('should apply custom alpha transparency', async () => {
      const selection: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [1],
        alpha: 0.5,
      };

      await expect((service as any).highlightResidues(selection))
        .resolves.not.toThrow();
    });

    it('should handle empty residue list', async () => {
      const selection: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [],
      };

      await expect((service as any).highlightResidues(selection))
        .resolves.not.toThrow();
    });

    it('should handle invalid chain ID gracefully', async () => {
      const selection: ResidueSelection = {
        chainId: 'INVALID',
        residueNumbers: [1, 2, 3],
      };

      await expect((service as any).highlightResidues(selection))
        .rejects.toThrow();
    });

    it('should complete within 100ms', async () => {
      const selection: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [1, 2, 3],
      };

      const start = performance.now();
      await (service as any).highlightResidues(selection);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should clear previous highlights', async () => {
      const selection1: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [1],
      };
      const selection2: ResidueSelection = {
        chainId: 'A',
        residueNumbers: [2],
      };

      await (service as any).highlightResidues(selection1);
      await expect((service as any).highlightResidues(selection2))
        .resolves.not.toThrow();
    });
  });

  describe('API 4: focusOnResidues(residues, options)', () => {
    it('should focus camera on specified residues', async () => {
      await expect((service as any).focusOnResidues([1, 2, 3]))
        .resolves.not.toThrow();
    });

    it('should accept custom zoom level', async () => {
      const options: FocusOptions = { zoom: 2.0 };

      await expect((service as any).focusOnResidues([1], options))
        .resolves.not.toThrow();
    });

    it('should support animated camera movement', async () => {
      const options: FocusOptions = {
        animate: true,
        duration: 500,
      };

      await expect((service as any).focusOnResidues([1], options))
        .resolves.not.toThrow();
    });

    it('should handle empty residue list', async () => {
      await expect((service as any).focusOnResidues([]))
        .rejects.toThrow('No residues specified');
    });

    it('should handle non-existent residues gracefully', async () => {
      await expect((service as any).focusOnResidues([9999]))
        .rejects.toThrow();
    });

    it('should complete within 100ms for non-animated', async () => {
      const start = performance.now();
      await (service as any).focusOnResidues([1], { animate: false });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should update camera position', async () => {
      const initialSnapshot = service.getCameraSnapshot();
      await (service as any).focusOnResidues([1]);
      const finalSnapshot = service.getCameraSnapshot();

      expect(finalSnapshot).not.toEqual(initialSnapshot);
    });
  });

  describe('API 5: detectInteractions(options)', () => {
    it('should detect hydrogen bonds by default', async () => {
      const interactions = await (service as any).detectInteractions({});

      expect(Array.isArray(interactions)).toBe(true);
    });

    it('should filter by interaction types', async () => {
      const options: InteractionOptions = {
        types: ['hydrogen-bond', 'salt-bridge'],
      };

      const interactions = await (service as any).detectInteractions(options);

      interactions.forEach((interaction: Interaction) => {
        expect(['hydrogen-bond', 'salt-bridge']).toContain(interaction.type);
      });
    });

    it('should apply distance threshold', async () => {
      const options: InteractionOptions = {
        distanceThreshold: 3.5,
      };

      const interactions = await (service as any).detectInteractions(options);

      interactions.forEach((interaction: Interaction) => {
        expect(interaction.distance).toBeLessThanOrEqual(3.5);
      });
    });

    it('should include water molecules when specified', async () => {
      const options: InteractionOptions = {
        includeWater: true,
      };

      await expect((service as any).detectInteractions(options))
        .resolves.toBeDefined();
    });

    it('should return empty array when no interactions found', async () => {
      const interactions = await (service as any).detectInteractions({
        distanceThreshold: 0.1, // Very small threshold
      });

      expect(interactions).toEqual([]);
    });

    it('should complete within 100ms', async () => {
      const start = performance.now();
      await (service as any).detectInteractions({});
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should include donor and acceptor details', async () => {
      const interactions = await (service as any).detectInteractions({});

      if (interactions.length > 0) {
        const interaction = interactions[0];
        expect(interaction).toHaveProperty('donor');
        expect(interaction).toHaveProperty('acceptor');
        expect(interaction.donor).toHaveProperty('chainId');
        expect(interaction.donor).toHaveProperty('residueSeq');
        expect(interaction.acceptor).toHaveProperty('chainId');
        expect(interaction.acceptor).toHaveProperty('residueSeq');
      }
    });
  });

  describe('API 6: visualizeInteractions(interactions)', () => {
    it('should visualize hydrogen bonds', async () => {
      const interactions: Interaction[] = [{
        id: 'hb-1',
        type: 'hydrogen-bond',
        donor: {
          chainId: 'A',
          residueSeq: 1,
          residueName: 'ALA',
          atomName: 'N',
        },
        acceptor: {
          chainId: 'A',
          residueSeq: 2,
          residueName: 'GLY',
          atomName: 'O',
        },
        distance: 2.8,
      }];

      await expect((service as any).visualizeInteractions(interactions))
        .resolves.not.toThrow();
    });

    it('should handle multiple interaction types', async () => {
      const interactions: Interaction[] = [
        {
          id: 'hb-1',
          type: 'hydrogen-bond',
          donor: { chainId: 'A', residueSeq: 1, residueName: 'ALA', atomName: 'N' },
          acceptor: { chainId: 'A', residueSeq: 2, residueName: 'GLY', atomName: 'O' },
          distance: 2.8,
        },
        {
          id: 'sb-1',
          type: 'salt-bridge',
          donor: { chainId: 'A', residueSeq: 3, residueName: 'LYS', atomName: 'NZ' },
          acceptor: { chainId: 'A', residueSeq: 4, residueName: 'ASP', atomName: 'OD1' },
          distance: 3.2,
        },
      ];

      await expect((service as any).visualizeInteractions(interactions))
        .resolves.not.toThrow();
    });

    it('should handle empty interaction array', async () => {
      await expect((service as any).visualizeInteractions([]))
        .resolves.not.toThrow();
    });

    it('should complete within 100ms', async () => {
      const interactions: Interaction[] = [{
        id: 'hb-1',
        type: 'hydrogen-bond',
        donor: { chainId: 'A', residueSeq: 1, residueName: 'ALA', atomName: 'N' },
        acceptor: { chainId: 'A', residueSeq: 2, residueName: 'GLY', atomName: 'O' },
        distance: 2.8,
      }];

      const start = performance.now();
      await (service as any).visualizeInteractions(interactions);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should use different colors for different interaction types', async () => {
      const interactions: Interaction[] = [
        {
          id: 'hb-1',
          type: 'hydrogen-bond',
          donor: { chainId: 'A', residueSeq: 1, residueName: 'ALA', atomName: 'N' },
          acceptor: { chainId: 'A', residueSeq: 2, residueName: 'GLY', atomName: 'O' },
          distance: 2.8,
        },
        {
          id: 'pi-1',
          type: 'pi-stacking',
          donor: { chainId: 'A', residueSeq: 3, residueName: 'PHE', atomName: 'CG' },
          acceptor: { chainId: 'A', residueSeq: 4, residueName: 'TYR', atomName: 'CG' },
          distance: 4.5,
          angle: 25,
        },
      ];

      await expect((service as any).visualizeInteractions(interactions))
        .resolves.not.toThrow();
    });

    it('should clear previous interaction visualizations', async () => {
      const interactions1: Interaction[] = [{
        id: 'hb-1',
        type: 'hydrogen-bond',
        donor: { chainId: 'A', residueSeq: 1, residueName: 'ALA', atomName: 'N' },
        acceptor: { chainId: 'A', residueSeq: 2, residueName: 'GLY', atomName: 'O' },
        distance: 2.8,
      }];

      const interactions2: Interaction[] = [{
        id: 'sb-1',
        type: 'salt-bridge',
        donor: { chainId: 'A', residueSeq: 3, residueName: 'LYS', atomName: 'NZ' },
        acceptor: { chainId: 'A', residueSeq: 4, residueName: 'ASP', atomName: 'OD1' },
        distance: 3.2,
      }];

      await (service as any).visualizeInteractions(interactions1);
      await expect((service as any).visualizeInteractions(interactions2))
        .resolves.not.toThrow();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle null structure data', async () => {
      service.dispose();
      await service.initialize(container);

      // getSequence returns empty chains array when no structure is loaded
      const result = (service as any).getSequence();
      expect(result).toBeDefined();
      expect(result.chains).toEqual([]);
    });

    it('should validate input parameters', async () => {
      await expect((service as any).highlightResidues(null))
        .rejects.toThrow();

      await expect((service as any).focusOnResidues(null))
        .rejects.toThrow();

      await expect((service as any).visualizeInteractions(null))
        .rejects.toThrow();
    });

    it('should handle concurrent API calls', async () => {
      const promises = [
        Promise.resolve((service as any).getHoverInfo(100, 200)),
        Promise.resolve((service as any).getSequence()),
        (service as any).highlightResidues([{ chainId: 'A', residueIds: [1] }]),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should clean up resources on dispose', async () => {
      await (service as any).highlightResidues([{ chainId: 'A', residueIds: [1] }]);
      service.dispose();

      // getSequence returns null when service is disposed (viewer is null)
      const result = (service as any).getSequence();
      expect(result).toBeNull();
    });
  });

  describe('Performance Requirements', () => {
    it('all APIs should complete within 100ms threshold', async () => {
      const apis = [
        { name: 'getHoverInfo', fn: () => Promise.resolve((service as any).getHoverInfo(100, 200)) },
        { name: 'getSequence', fn: () => Promise.resolve((service as any).getSequence()) },
        { name: 'highlightResidues', fn: () => (service as any).highlightResidues([{ chainId: 'A', residueIds: [1] }]) },
        { name: 'focusOnResidues', fn: () => (service as any).focusOnResidues([1], { animate: false }) },
        { name: 'detectInteractions', fn: () => (service as any).detectInteractions({}) },
        { name: 'visualizeInteractions', fn: () => (service as any).visualizeInteractions([]) },
      ];

      for (const api of apis) {
        const start = performance.now();
        try {
          const result = api.fn();
          if (result && typeof result.then === 'function') {
            await result.catch(() => {});
          }
        } catch {
          // Ignore errors, just measure time
        }
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100);
      }
    });

    it('should handle rapid successive calls efficiently', async () => {
      const iterations = 20;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        try {
          (service as any).getHoverInfo(i * 10, i * 10);
        } catch {}
      }

      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(100);
    });
  });
});
