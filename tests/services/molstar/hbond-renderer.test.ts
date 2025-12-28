/**
 * Hydrogen Bond Renderer Tests - RED Phase (TDD)
 *
 * Tests for rendering hydrogen bonds in MolStar viewer with:
 * - Dashed yellow lines (scientific convention)
 * - Interactive tooltips and highlighting
 * - Efficient bulk rendering
 * - Strength-based visual encoding
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { HydrogenBond } from './hydrogen-bond-detector.test';

interface RenderOptions {
  color?: [number, number, number]; // RGB 0-1
  dashPattern?: { dashLength: number; gapLength: number };
  lineWidth?: number;
  opacity?: number;
  strengthEncoding?: boolean; // Vary thickness by strength
}

interface TooltipData {
  bond: HydrogenBond;
  position: [number, number, number];
  visible: boolean;
}

describe('HydrogenBondRenderer', () => {
  let renderer: any;
  let mockMolstarPlugin: any;
  let mockStructure: any;
  let testBonds: HydrogenBond[];

  beforeEach(() => {
    // Mock MolStar plugin
    mockMolstarPlugin = {
      builders: {
        structure: {
          representation: {
            addRepresentation: vi.fn(),
            removeRepresentation: vi.fn(),
          }
        }
      },
      state: {
        data: {
          select: vi.fn(),
          build: vi.fn(),
        }
      },
      canvas3d: {
        commit: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
        camera: {
          focus: vi.fn(),
        }
      }
    };

    // Test hydrogen bonds
    testBonds = [
      {
        id: 'hbond-1',
        donorAtom: {
          residueId: 'A:5',
          atomName: 'N',
          element: 'N',
          position: [0, 0, 0]
        },
        hydrogenAtom: {
          atomName: 'H',
          position: [0.5, 0, 0]
        },
        acceptorAtom: {
          residueId: 'A:1',
          atomName: 'O',
          element: 'O',
          position: [3, 0, 0]
        },
        distance: 2.9,
        angle: 165,
        strength: 'strong',
        type: 'backbone-backbone'
      },
      {
        id: 'hbond-2',
        donorAtom: {
          residueId: 'A:10',
          atomName: 'OG',
          element: 'O',
          position: [10, 5, 2]
        },
        hydrogenAtom: {
          atomName: 'HG',
          position: [10.5, 5, 2]
        },
        acceptorAtom: {
          residueId: 'A:15',
          atomName: 'OD1',
          element: 'O',
          position: [13, 5.5, 2]
        },
        distance: 3.2,
        angle: 145,
        strength: 'moderate',
        type: 'sidechain-sidechain'
      }
    ];

    // Placeholder - actual implementation will be created in GREEN phase
    renderer = {
      renderHydrogenBonds: vi.fn(),
      renderSingleBond: vi.fn(),
      updateBondVisibility: vi.fn(),
      highlightBond: vi.fn(),
      showTooltip: vi.fn(),
      hideTooltip: vi.fn(),
      clearAll: vi.fn(),
      toggleAll: vi.fn(),
      filterByStrength: vi.fn(),
      updateRenderOptions: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('visualization', () => {
    it('should render H-bonds as dashed yellow lines', () => {
      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);

      expect(renderer.renderHydrogenBonds).toHaveBeenCalledWith(
        mockMolstarPlugin,
        testBonds
      );

      // Verify dashed line representation was created
      const calls = mockMolstarPlugin.builders.structure.representation.addRepresentation.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const representationCall = calls[0];
      expect(representationCall).toBeDefined();

      // Check for yellow color (RGB ~[1, 1, 0])
      const options = representationCall[1];
      expect(options.color).toEqual([1, 1, 0]);

      // Check for dashed pattern
      expect(options.dashPattern).toBeDefined();
      expect(options.dashPattern.dashLength).toBeGreaterThan(0);
      expect(options.dashPattern.gapLength).toBeGreaterThan(0);
    });

    it('should use consistent dash pattern (4px dash, 2px gap)', () => {
      const defaultOptions: RenderOptions = {
        dashPattern: { dashLength: 4, gapLength: 2 }
      };

      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds, defaultOptions);

      const calls = mockMolstarPlugin.builders.structure.representation.addRepresentation.mock.calls;
      const options = calls[0][1];

      expect(options.dashPattern.dashLength).toBe(4);
      expect(options.dashPattern.gapLength).toBe(2);
    });

    it('should position lines from donor to acceptor', () => {
      renderer.renderSingleBond(mockMolstarPlugin, testBonds[0]);

      expect(renderer.renderSingleBond).toHaveBeenCalled();

      // Verify line geometry
      const bond = testBonds[0];
      const startPos = bond.donorAtom.position;
      const endPos = bond.acceptorAtom.position;

      expect(startPos).toEqual([0, 0, 0]);
      expect(endPos).toEqual([3, 0, 0]);
    });

    it('should display H-bond strength indicator', () => {
      const options: RenderOptions = {
        strengthEncoding: true
      };

      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds, options);

      // Strong bonds should be thicker
      const strongBond = testBonds.find(b => b.strength === 'strong');
      const moderateBond = testBonds.find(b => b.strength === 'moderate');

      // Mock implementation should encode strength in line width
      expect(renderer.renderSingleBond).toHaveBeenCalledWith(
        mockMolstarPlugin,
        strongBond,
        expect.objectContaining({ lineWidth: expect.any(Number) })
      );

      expect(renderer.renderSingleBond).toHaveBeenCalledWith(
        mockMolstarPlugin,
        moderateBond,
        expect.objectContaining({ lineWidth: expect.any(Number) })
      );
    });

    it('should vary line thickness based on bond strength', () => {
      const strengthToWidth = {
        'strong': 3.0,
        'moderate': 2.0,
        'weak': 1.0
      };

      testBonds.forEach(bond => {
        const expectedWidth = strengthToWidth[bond.strength];

        renderer.renderSingleBond(mockMolstarPlugin, bond, {
          lineWidth: expectedWidth,
          strengthEncoding: true
        });

        expect(renderer.renderSingleBond).toHaveBeenCalledWith(
          mockMolstarPlugin,
          bond,
          expect.objectContaining({ lineWidth: expectedWidth })
        );
      });
    });
  });

  describe('interaction', () => {
    it('should highlight H-bond on hover', () => {
      const bond = testBonds[0];
      const hoverEvent = {
        bondId: bond.id,
        position: [1.5, 0, 0] as [number, number, number]
      };

      renderer.highlightBond(mockMolstarPlugin, bond.id, true);

      expect(renderer.highlightBond).toHaveBeenCalledWith(
        mockMolstarPlugin,
        bond.id,
        true
      );

      // Should increase opacity or change color on highlight
      expect(mockMolstarPlugin.canvas3d.commit).toHaveBeenCalled();
    });

    it('should show tooltip with H-bond details', () => {
      const bond = testBonds[0];
      const tooltipPosition: [number, number, number] = [1.5, 0, 0];

      const tooltipData: TooltipData = {
        bond,
        position: tooltipPosition,
        visible: true
      };

      renderer.showTooltip(mockMolstarPlugin, tooltipData);

      expect(renderer.showTooltip).toHaveBeenCalledWith(
        mockMolstarPlugin,
        expect.objectContaining({
          bond: expect.objectContaining({
            id: 'hbond-1',
            distance: 2.9,
            angle: 165
          }),
          visible: true
        })
      );

      // Tooltip should contain key information
      const expectedTooltipContent = {
        title: 'Hydrogen Bond',
        donor: 'A:5 N',
        acceptor: 'A:1 O',
        distance: '2.9 Å',
        angle: '165°',
        strength: 'strong',
        type: 'backbone-backbone'
      };

      expect(tooltipData.bond.donorAtom.residueId).toBe(expectedTooltipContent.donor.split(' ')[0]);
      expect(tooltipData.bond.distance).toBe(parseFloat(expectedTooltipContent.distance));
    });

    it('should support click to select involved atoms', () => {
      const bond = testBonds[0];
      const clickEvent = {
        bondId: bond.id,
        button: 'left' as const
      };

      const selectAtoms = vi.fn();
      renderer.selectBondAtoms = selectAtoms;

      renderer.selectBondAtoms(mockMolstarPlugin, bond.id);

      expect(selectAtoms).toHaveBeenCalledWith(mockMolstarPlugin, bond.id);

      // Should select both donor and acceptor atoms
      expect(mockMolstarPlugin.state.data.select).toHaveBeenCalledTimes(2);
    });

    it('should hide tooltip on mouse leave', () => {
      renderer.showTooltip(mockMolstarPlugin, {
        bond: testBonds[0],
        position: [1.5, 0, 0],
        visible: true
      });

      renderer.hideTooltip(mockMolstarPlugin);

      expect(renderer.hideTooltip).toHaveBeenCalled();
    });

    it('should remove highlight when not hovering', () => {
      const bond = testBonds[0];

      // First highlight
      renderer.highlightBond(mockMolstarPlugin, bond.id, true);

      // Then remove highlight
      renderer.highlightBond(mockMolstarPlugin, bond.id, false);

      expect(renderer.highlightBond).toHaveBeenCalledWith(
        mockMolstarPlugin,
        bond.id,
        false
      );
    });
  });

  describe('bulk operations', () => {
    it('should render multiple H-bonds efficiently', () => {
      const manyBonds = Array.from({ length: 50 }, (_, i) => ({
        ...testBonds[0],
        id: `hbond-${i}`,
        donorAtom: { ...testBonds[0].donorAtom, position: [i, 0, 0] as [number, number, number] },
        acceptorAtom: { ...testBonds[0].acceptorAtom, position: [i + 3, 0, 0] as [number, number, number] }
      }));

      const startTime = performance.now();
      renderer.renderHydrogenBonds(mockMolstarPlugin, manyBonds);
      const endTime = performance.now();

      expect(renderer.renderHydrogenBonds).toHaveBeenCalledWith(
        mockMolstarPlugin,
        manyBonds
      );

      // Should render in reasonable time (<100ms for 50 bonds)
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('should toggle all H-bond visibility', () => {
      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);

      // Hide all
      renderer.toggleAll(mockMolstarPlugin, false);
      expect(renderer.toggleAll).toHaveBeenCalledWith(mockMolstarPlugin, false);

      // Show all
      renderer.toggleAll(mockMolstarPlugin, true);
      expect(renderer.toggleAll).toHaveBeenCalledWith(mockMolstarPlugin, true);

      expect(mockMolstarPlugin.canvas3d.commit).toHaveBeenCalled();
    });

    it('should filter H-bonds by strength', () => {
      const strengthFilter = 'strong';

      renderer.filterByStrength(mockMolstarPlugin, testBonds, strengthFilter);

      expect(renderer.filterByStrength).toHaveBeenCalledWith(
        mockMolstarPlugin,
        testBonds,
        strengthFilter
      );

      // Should only show strong bonds
      const visibleBonds = testBonds.filter(b => b.strength === 'strong');
      expect(visibleBonds).toHaveLength(1);
      expect(visibleBonds[0].id).toBe('hbond-1');
    });

    it('should clear all rendered H-bonds', () => {
      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);
      renderer.clearAll(mockMolstarPlugin);

      expect(renderer.clearAll).toHaveBeenCalledWith(mockMolstarPlugin);
      expect(mockMolstarPlugin.builders.structure.representation.removeRepresentation).toHaveBeenCalled();
    });

    it('should update individual bond visibility', () => {
      const bondId = 'hbond-1';
      const visible = false;

      renderer.updateBondVisibility(mockMolstarPlugin, bondId, visible);

      expect(renderer.updateBondVisibility).toHaveBeenCalledWith(
        mockMolstarPlugin,
        bondId,
        visible
      );
    });

    it('should batch render operations for performance', () => {
      const manyBonds = Array.from({ length: 100 }, (_, i) => ({
        ...testBonds[0],
        id: `hbond-${i}`
      }));

      renderer.renderHydrogenBonds(mockMolstarPlugin, manyBonds);

      // Should commit once for all bonds, not once per bond
      expect(mockMolstarPlugin.canvas3d.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('render options', () => {
    it('should accept custom color', () => {
      const customOptions: RenderOptions = {
        color: [0, 1, 0] // Green
      };

      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds, customOptions);

      const calls = mockMolstarPlugin.builders.structure.representation.addRepresentation.mock.calls;
      const options = calls[0][1];

      expect(options.color).toEqual([0, 1, 0]);
    });

    it('should accept custom dash pattern', () => {
      const customOptions: RenderOptions = {
        dashPattern: { dashLength: 6, gapLength: 3 }
      };

      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds, customOptions);

      const calls = mockMolstarPlugin.builders.structure.representation.addRepresentation.mock.calls;
      const options = calls[0][1];

      expect(options.dashPattern).toEqual({ dashLength: 6, gapLength: 3 });
    });

    it('should accept custom opacity', () => {
      const customOptions: RenderOptions = {
        opacity: 0.5
      };

      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds, customOptions);

      const calls = mockMolstarPlugin.builders.structure.representation.addRepresentation.mock.calls;
      const options = calls[0][1];

      expect(options.opacity).toBe(0.5);
    });

    it('should update render options dynamically', () => {
      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);

      const newOptions: RenderOptions = {
        color: [1, 0, 0], // Red
        lineWidth: 4.0
      };

      renderer.updateRenderOptions(mockMolstarPlugin, newOptions);

      expect(renderer.updateRenderOptions).toHaveBeenCalledWith(
        mockMolstarPlugin,
        newOptions
      );

      expect(mockMolstarPlugin.canvas3d.commit).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle empty bond list gracefully', () => {
      expect(() => {
        renderer.renderHydrogenBonds(mockMolstarPlugin, []);
      }).not.toThrow();
    });

    it('should handle invalid bond data', () => {
      const invalidBond = {
        id: 'invalid',
        // Missing required fields
      } as any;

      expect(() => {
        renderer.renderSingleBond(mockMolstarPlugin, invalidBond);
      }).toThrow('Invalid bond data');
    });

    it('should handle missing MolStar plugin', () => {
      expect(() => {
        renderer.renderHydrogenBonds(null, testBonds);
      }).toThrow('MolStar plugin not initialized');
    });
  });

  describe('memory management', () => {
    it('should clean up representations when clearing', () => {
      renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);

      const representationIds = ['rep-1', 'rep-2'];
      renderer.activeRepresentations = representationIds;

      renderer.clearAll(mockMolstarPlugin);

      // Should remove all representations
      representationIds.forEach(id => {
        expect(mockMolstarPlugin.builders.structure.representation.removeRepresentation)
          .toHaveBeenCalledWith(id);
      });

      expect(renderer.activeRepresentations).toHaveLength(0);
    });

    it('should not leak memory on repeated render/clear cycles', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 10; i++) {
        renderer.renderHydrogenBonds(mockMolstarPlugin, testBonds);
        renderer.clearAll(mockMolstarPlugin);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (<10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
