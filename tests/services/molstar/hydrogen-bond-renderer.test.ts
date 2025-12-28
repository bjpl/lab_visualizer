/**
 * Hydrogen Bond Renderer Tests
 *
 * Tests for 3D visualization of hydrogen bonds
 * Following TDD principles with comprehensive coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HydrogenBondRenderer, type HydrogenBond } from '@/services/molstar/hydrogen-bond-renderer';

// Mock MolStar plugin
const createMockPlugin = () => ({
  representationBuilder: {
    createDashedLine: vi.fn(),
    createLabel: vi.fn(),
    updateVisibility: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  state: {
    data: {
      selectQ: vi.fn(() => []),
    },
  },
});

describe('HydrogenBondRenderer', () => {
  let renderer: HydrogenBondRenderer;
  let mockPlugin: any;
  let mockBond: HydrogenBond;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    renderer = new HydrogenBondRenderer(mockPlugin);

    // Standard alpha-helix H-bond (i -> i+4)
    mockBond = {
      id: 'hbond-1',
      donor: {
        chainId: 'A',
        residueSeq: 5,
        residueName: 'LEU',
        atomName: 'N',
        position: [2.8, 0.3, 0],
      },
      hydrogen: {
        atomName: 'H',
        position: [2.7, 0.2, 0],
      },
      acceptor: {
        chainId: 'A',
        residueSeq: 1,
        residueName: 'ALA',
        atomName: 'O',
        position: [2.5, 0.5, 0],
      },
      distance: 2.9,
      angle: 165,
      strength: 'strong',
    };
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const r = new HydrogenBondRenderer(mockPlugin);
      expect(r).toBeDefined();
      expect(r.getAllBonds()).toHaveLength(0);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        showLabels: false,
        lineWidth: 0.2,
        dashLength: 0.3,
        colorByStrength: false,
      };

      const r = new HydrogenBondRenderer(mockPlugin, customConfig);
      expect(r).toBeDefined();
    });

    it('should merge custom colors with defaults', () => {
      const customConfig = {
        customColors: {
          strong: 0x00AA00, // Custom green
        },
      };

      const r = new HydrogenBondRenderer(mockPlugin, customConfig);
      expect(r).toBeDefined();
    });
  });

  describe('renderBond', () => {
    it('should render single H-bond successfully', async () => {
      const id = await renderer.renderBond(mockBond);

      expect(id).toBe('hbond-1');
      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
      expect(mockPlugin.representationBuilder.createLabel).toHaveBeenCalled();
    });

    it('should create line with correct donor and acceptor positions', async () => {
      await renderer.renderBond(mockBond);

      const callArgs = mockPlugin.representationBuilder.createDashedLine.mock.calls[0];
      const [_id, donorPos, acceptorPos] = callArgs;

      expect(donorPos).toEqual([2.8, 0.3, 0]);
      expect(acceptorPos).toEqual([2.5, 0.5, 0]);
    });

    it('should create label at bond midpoint', async () => {
      await renderer.renderBond(mockBond);

      const callArgs = mockPlugin.representationBuilder.createLabel.mock.calls[0];
      const [_id, midpoint, label] = callArgs;

      // Midpoint should be average of donor and acceptor
      expect(midpoint[0]).toBeCloseTo((2.8 + 2.5) / 2);
      expect(midpoint[1]).toBeCloseTo((0.3 + 0.5) / 2);
      expect(midpoint[2]).toBe(0);

      // Label should show distance
      expect(label).toContain('2.90');
      expect(label).toContain('Å');
    });

    it('should color code by strength when enabled', async () => {
      // Strong bond - should get green color
      await renderer.renderBond(mockBond);

      const strongColor = mockPlugin.representationBuilder.createDashedLine.mock.calls[0][3];
      expect(strongColor).toBe(0x00FF00); // Green

      // Moderate bond - should get yellow
      const moderateBond = { ...mockBond, id: 'hbond-2', strength: 'moderate' as const };
      await renderer.renderBond(moderateBond);

      const moderateColor = mockPlugin.representationBuilder.createDashedLine.mock.calls[1][3];
      expect(moderateColor).toBe(0xFFFF00); // Yellow

      // Weak bond - should get red
      const weakBond = { ...mockBond, id: 'hbond-3', strength: 'weak' as const };
      await renderer.renderBond(weakBond);

      const weakColor = mockPlugin.representationBuilder.createDashedLine.mock.calls[2][3];
      expect(weakColor).toBe(0xFF0000); // Red
    });

    it('should not create label when showLabels is false', async () => {
      const r = new HydrogenBondRenderer(mockPlugin, { showLabels: false });
      await r.renderBond(mockBond);

      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
      expect(mockPlugin.representationBuilder.createLabel).not.toHaveBeenCalled();
    });

    it('should prevent duplicate rendering of same bond', async () => {
      await renderer.renderBond(mockBond);
      await renderer.renderBond(mockBond); // Try again

      // Should only create line once
      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalledTimes(1);
    });

    it('should handle bonds without explicit hydrogen', async () => {
      const bondWithoutH = { ...mockBond, hydrogen: undefined };
      const id = await renderer.renderBond(bondWithoutH);

      expect(id).toBe('hbond-1');
      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
    });
  });

  describe('renderBonds (batch)', () => {
    it('should render multiple bonds efficiently', async () => {
      const bonds: HydrogenBond[] = [
        mockBond,
        { ...mockBond, id: 'hbond-2', distance: 3.1, strength: 'moderate' },
        { ...mockBond, id: 'hbond-3', distance: 3.4, strength: 'weak' },
      ];

      const ids = await renderer.renderBonds(bonds);

      expect(ids).toHaveLength(3);
      expect(ids).toEqual(['hbond-1', 'hbond-2', 'hbond-3']);
      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures gracefully', async () => {
      mockPlugin.representationBuilder.createDashedLine
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => { throw new Error('Rendering failed'); })
        .mockImplementationOnce(() => {});

      const bonds: HydrogenBond[] = [
        mockBond,
        { ...mockBond, id: 'hbond-2' },
        { ...mockBond, id: 'hbond-3' },
      ];

      const ids = await renderer.renderBonds(bonds);

      // Should successfully render bonds 1 and 3, skip bond 2
      expect(ids).toHaveLength(2);
      expect(ids).toContain('hbond-1');
      expect(ids).toContain('hbond-3');
    });

    it('should log batch rendering performance', async () => {
      const consoleSpy = vi.spyOn(console, 'info');
      const bonds = Array.from({ length: 10 }, (_, i) => ({
        ...mockBond,
        id: `hbond-${i}`,
      }));

      await renderer.renderBonds(bonds);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rendered 10/10 bonds')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ms')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('visibility management', () => {
    beforeEach(async () => {
      await renderer.renderBond(mockBond);
    });

    it('should set bond visibility', () => {
      renderer.setVisibility('hbond-1', false);

      const bond = renderer.getBond('hbond-1');
      expect(bond?.visible).toBe(false);
      expect(mockPlugin.representationBuilder.updateVisibility).toHaveBeenCalledWith(
        expect.stringContaining('hbond-1'),
        false
      );
    });

    it('should show all bonds', async () => {
      await renderer.renderBonds([
        mockBond,
        { ...mockBond, id: 'hbond-2' },
        { ...mockBond, id: 'hbond-3' },
      ]);

      renderer.hideAll();
      renderer.showAll();

      const allBonds = renderer.getAllBonds();
      expect(allBonds.every(b => b.visible)).toBe(true);
    });

    it('should hide all bonds', async () => {
      await renderer.renderBonds([
        mockBond,
        { ...mockBond, id: 'hbond-2' },
      ]);

      renderer.hideAll();

      const allBonds = renderer.getAllBonds();
      expect(allBonds.every(b => !b.visible)).toBe(true);
    });

    it('should handle visibility on non-existent bond gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      renderer.setVisibility('non-existent', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bond non-existent not found')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('filtering by strength', () => {
    beforeEach(async () => {
      await renderer.renderBonds([
        { ...mockBond, id: 'strong-1', strength: 'strong' },
        { ...mockBond, id: 'moderate-1', strength: 'moderate' },
        { ...mockBond, id: 'weak-1', strength: 'weak' },
        { ...mockBond, id: 'strong-2', strength: 'strong' },
      ]);
    });

    it('should show only strong bonds', () => {
      renderer.filterByStrength('strong', true);

      expect(renderer.getBond('strong-1')?.visible).toBe(true);
      expect(renderer.getBond('strong-2')?.visible).toBe(true);
      expect(renderer.getBond('moderate-1')?.visible).toBe(false);
      expect(renderer.getBond('weak-1')?.visible).toBe(false);
    });

    it('should show only moderate bonds', () => {
      renderer.filterByStrength('moderate', true);

      expect(renderer.getBond('moderate-1')?.visible).toBe(true);
      expect(renderer.getBond('strong-1')?.visible).toBe(false);
      expect(renderer.getBond('weak-1')?.visible).toBe(false);
    });

    it('should show only weak bonds', () => {
      renderer.filterByStrength('weak', true);

      expect(renderer.getBond('weak-1')?.visible).toBe(true);
      expect(renderer.getBond('strong-1')?.visible).toBe(false);
      expect(renderer.getBond('moderate-1')?.visible).toBe(false);
    });

    it('should additive filter when hideOthers is false', () => {
      renderer.hideAll();
      renderer.filterByStrength('strong', false);

      expect(renderer.getBond('strong-1')?.visible).toBe(true);
      expect(renderer.getBond('strong-2')?.visible).toBe(true);
    });
  });

  describe('bond removal', () => {
    beforeEach(async () => {
      await renderer.renderBonds([
        mockBond,
        { ...mockBond, id: 'hbond-2' },
      ]);
    });

    it('should remove single bond', () => {
      renderer.remove('hbond-1');

      expect(renderer.getBond('hbond-1')).toBeUndefined();
      expect(renderer.getAllBonds()).toHaveLength(1);
      expect(mockPlugin.representationBuilder.remove).toHaveBeenCalled();
    });

    it('should clear all bonds', () => {
      renderer.clear();

      expect(renderer.getAllBonds()).toHaveLength(0);
      // 2 bonds with 2 representations each (line + label) = 4 remove calls
      expect(mockPlugin.representationBuilder.remove).toHaveBeenCalledTimes(4);
    });

    it('should handle removing non-existent bond gracefully', () => {
      renderer.remove('non-existent');

      // Should not throw error
      expect(renderer.getAllBonds()).toHaveLength(2);
    });
  });

  describe('bond queries', () => {
    beforeEach(async () => {
      await renderer.renderBonds([
        { ...mockBond, id: 'strong-1', strength: 'strong' },
        { ...mockBond, id: 'strong-2', strength: 'strong' },
        { ...mockBond, id: 'moderate-1', strength: 'moderate' },
        { ...mockBond, id: 'weak-1', strength: 'weak' },
      ]);
    });

    it('should get bond by ID', () => {
      const bond = renderer.getBond('strong-1');

      expect(bond).toBeDefined();
      expect(bond?.id).toBe('strong-1');
      expect(bond?.bond.strength).toBe('strong');
    });

    it('should get all bonds', () => {
      const allBonds = renderer.getAllBonds();

      expect(allBonds).toHaveLength(4);
    });

    it('should get bonds by strength', () => {
      const strongBonds = renderer.getBondsByStrength('strong');
      const moderateBonds = renderer.getBondsByStrength('moderate');
      const weakBonds = renderer.getBondsByStrength('weak');

      expect(strongBonds).toHaveLength(2);
      expect(moderateBonds).toHaveLength(1);
      expect(weakBonds).toHaveLength(1);
    });

    it('should return statistics', () => {
      const stats = renderer.getStatistics();

      expect(stats.total).toBe(4);
      expect(stats.visible).toBe(4);
      expect(stats.byStrength.strong).toBe(2);
      expect(stats.byStrength.moderate).toBe(1);
      expect(stats.byStrength.weak).toBe(1);
    });

    it('should track visibility in statistics', () => {
      renderer.setVisibility('strong-1', false);
      renderer.setVisibility('moderate-1', false);

      const stats = renderer.getStatistics();

      expect(stats.total).toBe(4);
      expect(stats.visible).toBe(2); // Only strong-2 and weak-1
    });
  });

  describe('configuration updates', () => {
    beforeEach(async () => {
      await renderer.renderBond(mockBond);
    });

    it('should update configuration', () => {
      renderer.updateConfig({
        showLabels: false,
        lineWidth: 0.3,
      });

      // Should re-render with new config
      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalledTimes(2);
    });

    it('should preserve existing bonds after config update', () => {
      renderer.updateConfig({ lineWidth: 0.2 });

      const bond = renderer.getBond('hbond-1');
      expect(bond).toBeDefined();
      expect(bond?.id).toBe('hbond-1');
    });
  });

  describe('dispose', () => {
    it('should clear all bonds on dispose', async () => {
      await renderer.renderBonds([
        mockBond,
        { ...mockBond, id: 'hbond-2' },
      ]);

      renderer.dispose();

      expect(renderer.getAllBonds()).toHaveLength(0);
    });

    it('should log disposal', () => {
      const consoleSpy = vi.spyOn(console, 'info');

      renderer.dispose();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Disposed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length bonds', async () => {
      const zeroBond = {
        ...mockBond,
        donor: { ...mockBond.donor, position: [0, 0, 0] as [number, number, number] },
        acceptor: { ...mockBond.acceptor, position: [0, 0, 0] as [number, number, number] },
        distance: 0,
      };

      await renderer.renderBond(zeroBond);

      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
    });

    it('should handle very long bonds', async () => {
      const longBond = {
        ...mockBond,
        acceptor: { ...mockBond.acceptor, position: [100, 100, 100] as [number, number, number] },
        distance: 173.2,
      };

      await renderer.renderBond(longBond);

      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
    });

    it('should handle bonds with extreme coordinates', async () => {
      const extremeBond = {
        ...mockBond,
        donor: { ...mockBond.donor, position: [-1000, -1000, -1000] as [number, number, number] },
        acceptor: { ...mockBond.acceptor, position: [1000, 1000, 1000] as [number, number, number] },
        distance: 3464.1,
      };

      await renderer.renderBond(extremeBond);

      expect(mockPlugin.representationBuilder.createDashedLine).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should render 100 bonds in <500ms', async () => {
      const bonds = Array.from({ length: 100 }, (_, i) => ({
        ...mockBond,
        id: `hbond-${i}`,
      }));

      const startTime = performance.now();
      await renderer.renderBonds(bonds);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(renderer.getAllBonds()).toHaveLength(100);
    });

    it('should batch clear 100 bonds efficiently', async () => {
      const bonds = Array.from({ length: 100 }, (_, i) => ({
        ...mockBond,
        id: `hbond-${i}`,
      }));

      await renderer.renderBonds(bonds);

      const startTime = performance.now();
      renderer.clear();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(renderer.getAllBonds()).toHaveLength(0);
    });
  });
});
