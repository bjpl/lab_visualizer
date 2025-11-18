/**
 * MD Engine Service Tests
 * Test suite for tier selection and validation logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MDEngineService, mdEngine } from '../src/services/md-engine';
import { MDTier } from '../src/types/md-types';

describe('MDEngineService', () => {
  let service: MDEngineService;

  beforeEach(() => {
    service = MDEngineService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = MDEngineService.getInstance();
      const instance2 = MDEngineService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export singleton', () => {
      expect(mdEngine).toBe(service);
    });
  });

  describe('Tier Validation', () => {
    it('should validate browser tier for small systems', () => {
      const validation = service.validateSimulation(300);

      expect(validation.isValid).toBe(true);
      expect(validation.tier).toBe(MDTier.BROWSER);
      expect(validation.errors).toHaveLength(0);
    });

    it('should warn about browser performance for medium systems', () => {
      const validation = service.validateSimulation(450);

      expect(validation.isValid).toBe(true);
      expect(validation.tier).toBe(MDTier.BROWSER);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should recommend serverless for medium-large systems', () => {
      const validation = service.validateSimulation(2000);

      expect(validation.isValid).toBe(true);
      expect(validation.tier).toBe(MDTier.SERVERLESS);
      expect(validation.warnings.some(w => w.includes('serverless'))).toBe(true);
    });

    it('should recommend desktop for large systems', () => {
      const validation = service.validateSimulation(10000);

      expect(validation.isValid).toBe(true);
      expect(validation.tier).toBe(MDTier.DESKTOP);
      expect(validation.warnings.some(w => w.includes('Desktop'))).toBe(true);
    });

    it('should reject invalid tier requests', () => {
      const validation = service.validateSimulation(10000, MDTier.BROWSER);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('exceeds');
    });
  });

  describe('Tier Recommendations', () => {
    it('should recommend browser for quick demos', () => {
      const tier = service.recommendTier(300, 5, 'high');
      expect(tier).toBe(MDTier.BROWSER);
    });

    it('should recommend serverless for medium simulations', () => {
      const tier = service.recommendTier(2000, 100, 'medium');
      expect(tier).toBe(MDTier.SERVERLESS);
    });

    it('should recommend desktop for long simulations', () => {
      const tier = service.recommendTier(3000, 10000, 'low');
      expect(tier).toBe(MDTier.DESKTOP);
    });

    it('should recommend desktop for large systems', () => {
      const tier = service.recommendTier(8000, 100, 'medium');
      expect(tier).toBe(MDTier.DESKTOP);
    });
  });

  describe('Capabilities', () => {
    it('should return system capabilities', () => {
      const capabilities = service.getCapabilities();

      expect(capabilities.supportedTiers).toContain(MDTier.BROWSER);
      expect(capabilities.supportedTiers).toContain(MDTier.SERVERLESS);
      expect(capabilities.supportedTiers).toContain(MDTier.DESKTOP);
    });

    it('should have correct atom limits', () => {
      const capabilities = service.getCapabilities();

      expect(capabilities.maxAtomsPerTier[MDTier.BROWSER]).toBe(500);
      expect(capabilities.maxAtomsPerTier[MDTier.SERVERLESS]).toBe(5000);
      expect(capabilities.maxAtomsPerTier[MDTier.DESKTOP]).toBe(Infinity);
    });

    it('should check tier availability', () => {
      expect(service.isTierAvailable(MDTier.BROWSER)).toBe(true);
      expect(service.isTierAvailable(MDTier.SERVERLESS)).toBe(true);
      expect(service.isTierAvailable(MDTier.DESKTOP)).toBe(true);
    });
  });

  describe('Time Estimation', () => {
    it('should estimate browser tier time', () => {
      const time = service.estimateSimulationTime(300, 1000, MDTier.BROWSER);
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(60);
    });

    it('should estimate serverless tier time', () => {
      const time = service.estimateSimulationTime(3000, 10000, MDTier.SERVERLESS);
      expect(time).toBeGreaterThan(0);
    });

    it('should scale with atom count', () => {
      const time1 = service.estimateSimulationTime(100, 1000, MDTier.BROWSER);
      const time2 = service.estimateSimulationTime(200, 1000, MDTier.BROWSER);
      expect(time2).toBeGreaterThan(time1);
    });

    it('should scale with timesteps', () => {
      const time1 = service.estimateSimulationTime(300, 1000, MDTier.BROWSER);
      const time2 = service.estimateSimulationTime(300, 2000, MDTier.BROWSER);
      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('Validation Message Formatting', () => {
    it('should format validation messages', () => {
      const validation = service.validateSimulation(10000);
      const formatted = service.formatValidationMessages(validation);

      expect(formatted.title).toBeTruthy();
      expect(formatted.messages).toBeInstanceOf(Array);
      expect(formatted.messages.length).toBeGreaterThan(0);
    });

    it('should categorize messages by type', () => {
      const validation = service.validateSimulation(10000, MDTier.BROWSER);
      const formatted = service.formatValidationMessages(validation);

      const hasErrors = formatted.messages.some(m => m.type === 'error');
      expect(hasErrors).toBe(true);
    });

    it('should include recommendations', () => {
      const validation = service.validateSimulation(3000);
      const formatted = service.formatValidationMessages(validation);

      const hasInfo = formatted.messages.some(m => m.type === 'info');
      expect(hasInfo).toBe(true);
    });
  });
});
