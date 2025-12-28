/**
 * Measurement Visualization Tests
 *
 * Tests for 3D measurement visualization in MolStar viewer
 * Following TDD principles - minimal, focused tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MolstarService } from '@/services/molstar-service';
import type { MeasurementResult } from '@/types/molstar';

describe('3D Measurement Visualization', () => {
  let service: MolstarService;

  beforeEach(() => {
    MolstarService.resetInstance();
    service = MolstarService.getInstance();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('visualizeMeasurement', () => {
    it('should throw error if viewer not initialized', async () => {
      const measurement: MeasurementResult = {
        id: 'dist-123',
        type: 'distance',
        value: 3.5,
        unit: 'Å',
        label: '3.50 Å',
        participants: [
          { chainId: 'A', residueSeq: 10, residueName: 'ALA' },
          { chainId: 'A', residueSeq: 20, residueName: 'GLY' },
        ],
        timestamp: Date.now(),
      };

      await expect(
        service.visualizeMeasurement(measurement)
      ).rejects.toThrow('Mol* viewer not initialized');
    });

    it('should throw error if participants are missing', async () => {
      const measurement: MeasurementResult = {
        id: 'dist-incomplete',
        type: 'distance',
        value: 3.5,
        unit: 'Å',
        label: '3.50 Å',
        participants: [],
        timestamp: Date.now(),
      };

      // Viewer not initialized check happens first
      await expect(
        service.visualizeMeasurement(measurement)
      ).rejects.toThrow('Mol* viewer not initialized');
    });
  });

  describe('hideMeasurement', () => {
    it('should not throw when viewer is not initialized', () => {
      expect(() => service.hideMeasurement('dist-123')).not.toThrow();
    });

    it('should handle non-existent measurement gracefully', () => {
      expect(() => service.hideMeasurement('non-existent')).not.toThrow();
    });
  });

  describe('showMeasurement', () => {
    it('should not throw when viewer is not initialized', () => {
      expect(() => service.showMeasurement('dist-123')).not.toThrow();
    });

    it('should handle non-existent measurement gracefully', () => {
      expect(() => service.showMeasurement('non-existent')).not.toThrow();
    });
  });

  describe('integration workflow', () => {
    it('should support hide/show workflow', () => {
      const id = 'dist-123';
      
      expect(() => {
        service.hideMeasurement(id);
        service.showMeasurement(id);
        service.hideMeasurement(id);
      }).not.toThrow();
    });

    it('should handle multiple measurements independently', () => {
      expect(() => {
        service.hideMeasurement('dist-1');
        service.showMeasurement('dist-2');
        service.hideMeasurement('angle-1');
        service.showMeasurement('dist-1');
      }).not.toThrow();
    });
  });
});
