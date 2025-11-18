/**
 * MD Engine Service - Unified Abstraction Layer
 * Routes simulations to appropriate tier based on requirements
 */

import {
  MDTier,
  MDSimulationConfig,
  MDValidation,
  MDCapabilities,
  BrowserMDConfig,
  ServerlessMDConfig,
  DesktopExportConfig,
  ExportFormat,
  MDJob,
  MDResult
} from '../types/md-types';

export class MDEngineService {
  private static instance: MDEngineService;

  private capabilities: MDCapabilities = {
    supportedTiers: [MDTier.BROWSER, MDTier.SERVERLESS, MDTier.DESKTOP],
    maxAtomsPerTier: {
      [MDTier.BROWSER]: 500,
      [MDTier.SERVERLESS]: 5000,
      [MDTier.DESKTOP]: Infinity
    },
    supportedEnsembles: ['NVE', 'NVT', 'NPT'],
    supportedIntegrators: ['verlet', 'leapfrog', 'langevin'],
    supportedExportFormats: [
      ExportFormat.GROMACS,
      ExportFormat.NAMD,
      ExportFormat.AMBER,
      ExportFormat.LAMMPS
    ]
  };

  private constructor() {}

  static getInstance(): MDEngineService {
    if (!MDEngineService.instance) {
      MDEngineService.instance = new MDEngineService();
    }
    return MDEngineService.instance;
  }

  /**
   * Validate simulation configuration and recommend tier
   */
  validateSimulation(
    atomCount: number,
    requestedTier?: MDTier
  ): MDValidation {
    const validation: MDValidation = {
      isValid: true,
      tier: MDTier.BROWSER,
      warnings: [],
      errors: [],
      recommendations: []
    };

    // Determine appropriate tier
    if (atomCount <= 500) {
      validation.tier = MDTier.BROWSER;
      validation.recommendations.push(
        'Browser simulation suitable for quick demos and educational purposes'
      );
    } else if (atomCount <= 5000) {
      validation.tier = MDTier.SERVERLESS;
      validation.warnings.push(
        'System size requires serverless computation. Job will be queued.'
      );
      validation.recommendations.push(
        'Consider serverless tier for better performance with medium-sized systems'
      );
    } else {
      validation.tier = MDTier.DESKTOP;
      validation.warnings.push(
        'System too large for in-app simulation. Desktop export recommended.'
      );
      validation.recommendations.push(
        'Export to GROMACS or NAMD for production-scale simulations'
      );
    }

    // Validate requested tier
    if (requestedTier) {
      const maxAtoms = this.capabilities.maxAtomsPerTier[requestedTier];
      if (atomCount > maxAtoms) {
        validation.isValid = false;
        validation.errors.push(
          `Atom count ${atomCount} exceeds ${requestedTier} tier limit of ${maxAtoms}`
        );
      }
    }

    // Browser tier specific warnings
    if (validation.tier === MDTier.BROWSER && atomCount > 300) {
      validation.warnings.push(
        'Browser simulation may be slow with >300 atoms. Consider serverless tier.'
      );
    }

    return validation;
  }

  /**
   * Get simulation capabilities
   */
  getCapabilities(): MDCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if tier is available
   */
  isTierAvailable(tier: MDTier): boolean {
    return this.capabilities.supportedTiers.includes(tier);
  }

  /**
   * Estimate simulation time for tier
   */
  estimateSimulationTime(
    atomCount: number,
    timesteps: number,
    tier: MDTier
  ): number {
    // Rough estimates in seconds
    const baseTimePerAtomPerTimestep = {
      [MDTier.BROWSER]: 0.0001,      // 100 microseconds
      [MDTier.SERVERLESS]: 0.00001,  // 10 microseconds
      [MDTier.DESKTOP]: 0.000001     // 1 microsecond
    };

    const base = baseTimePerAtomPerTimestep[tier];
    return atomCount * timesteps * base;
  }

  /**
   * Calculate recommended tier based on requirements
   */
  recommendTier(
    atomCount: number,
    simulationLengthPs: number,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): MDTier {
    const validation = this.validateSimulation(atomCount);

    // Browser tier: small systems, quick demos
    if (atomCount <= 500 && simulationLengthPs <= 10 && urgency === 'high') {
      return MDTier.BROWSER;
    }

    // Serverless tier: medium systems, reasonable time
    if (atomCount <= 5000 && simulationLengthPs <= 1000) {
      return MDTier.SERVERLESS;
    }

    // Desktop tier: large systems or long simulations
    return MDTier.DESKTOP;
  }

  /**
   * Format validation messages for UI
   */
  formatValidationMessages(validation: MDValidation): {
    title: string;
    messages: Array<{ type: 'error' | 'warning' | 'info'; text: string }>;
  } {
    const messages: Array<{ type: 'error' | 'warning' | 'info'; text: string }> = [];

    validation.errors.forEach(error => {
      messages.push({ type: 'error', text: error });
    });

    validation.warnings.forEach(warning => {
      messages.push({ type: 'warning', text: warning });
    });

    validation.recommendations.forEach(rec => {
      messages.push({ type: 'info', text: rec });
    });

    const title = validation.isValid
      ? `Simulation ready: ${validation.tier} tier`
      : 'Simulation configuration invalid';

    return { title, messages };
  }
}

// Singleton export
export const mdEngine = MDEngineService.getInstance();
