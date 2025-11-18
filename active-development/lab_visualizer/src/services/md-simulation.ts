/**
 * Core MD Simulation Service
 * Provides molecular dynamics simulation with energy minimization
 * Integrates with WebDynamica and prepares for MolStar rendering
 */

import type { WebDynamicaEngine, DynamicaConfig, SimulationFrame } from '../lib/md-browser-dynamica';
import { createWebDynamicaEngine } from '../lib/md-browser-dynamica';

export interface ForceFieldParameters {
  bond: {
    k: number; // Spring constant (kJ/mol/nm^2)
    r0: number; // Equilibrium distance (nm)
  };
  angle: {
    k: number; // Spring constant (kJ/mol/rad^2)
    theta0: number; // Equilibrium angle (rad)
  };
  dihedral: {
    k: number[]; // Fourier coefficients
    n: number[]; // Periodicity
    phi0: number[]; // Phase angles
  };
  vdw: {
    epsilon: number; // Well depth (kJ/mol)
    sigma: number; // Collision diameter (nm)
  };
  coulomb: {
    constant: number; // Coulomb constant (kJ*nm/mol/e^2)
    cutoff: number; // Cutoff distance (nm)
  };
}

export interface EnergyComponents {
  bond: number;
  angle: number;
  dihedral: number;
  vdw: number;
  coulomb: number;
  total: number;
}

export interface MinimizationConfig {
  algorithm: 'steepest-descent' | 'conjugate-gradient' | 'lbfgs';
  maxIterations: number;
  tolerance: number; // kJ/mol/nm
  stepSize: number; // nm
}

export interface MinimizationResult {
  success: boolean;
  iterations: number;
  initialEnergy: number;
  finalEnergy: number;
  energyChange: number;
  forceNorm: number;
  trajectory: SimulationFrame[];
}

export interface MDSimulationParams {
  temperature: number; // K
  timestep: number; // fs
  steps: number;
  integrator: 'verlet' | 'leapfrog' | 'langevin';
  forceField: 'AMBER' | 'CHARMM' | 'OPLS';
  ensemble: 'NVE' | 'NVT' | 'NPT';
  outputFrequency: number;
  constraints?: {
    bonds: boolean;
    angles: boolean;
  };
}

export interface TrajectoryData {
  frames: SimulationFrame[];
  energies: EnergyComponents[];
  temperatures: number[];
  pressures?: number[];
  statistics: {
    avgEnergy: number;
    energyDrift: number;
    avgTemperature: number;
    tempFluctuation: number;
  };
}

export type SimulationStatusCallback = (status: {
  phase: 'initializing' | 'minimizing' | 'equilibrating' | 'production' | 'complete';
  progress: number;
  currentStep: number;
  totalSteps: number;
  energy?: number;
  temperature?: number;
}) => void;

export type FrameUpdateCallback = (frame: SimulationFrame, index: number) => void;

/**
 * Core MD Simulation Engine
 */
export class MDSimulationService {
  private engine: WebDynamicaEngine;
  private forceFieldParams: ForceFieldParameters | null = null;
  private trajectory: TrajectoryData | null = null;

  constructor() {
    this.engine = createWebDynamicaEngine();
  }

  /**
   * Initialize force field parameters
   */
  setForceField(type: 'AMBER' | 'CHARMM' | 'OPLS', custom?: Partial<ForceFieldParameters>): void {
    // Default parameters for each force field
    const defaults: Record<string, ForceFieldParameters> = {
      AMBER: {
        bond: { k: 284512, r0: 0.1522 },
        angle: { k: 418.4, theta0: 1.911 },
        dihedral: { k: [7.11, -2.09, 26.18], n: [1, 2, 3], phi0: [0, Math.PI, 0] },
        vdw: { epsilon: 0.6364, sigma: 0.3550 },
        coulomb: { constant: 138.935485, cutoff: 1.0 }
      },
      CHARMM: {
        bond: { k: 322560, r0: 0.1530 },
        angle: { k: 460.24, theta0: 1.911 },
        dihedral: { k: [8.16, -1.04, 21.75], n: [1, 2, 3], phi0: [0, Math.PI, 0] },
        vdw: { epsilon: 0.4577, sigma: 0.3500 },
        coulomb: { constant: 138.935485, cutoff: 1.2 }
      },
      OPLS: {
        bond: { k: 265265, r0: 0.1529 },
        angle: { k: 383.25, theta0: 1.911 },
        dihedral: { k: [5.44, -1.25, 14.01], n: [1, 2, 3], phi0: [0, Math.PI, 0] },
        vdw: { epsilon: 0.6502, sigma: 0.3550 },
        coulomb: { constant: 138.935485, cutoff: 1.0 }
      }
    };

    this.forceFieldParams = {
      ...defaults[type],
      ...custom
    };
  }

  /**
   * Calculate energy components for current configuration
   */
  calculateEnergy(positions: Float32Array, atomCount: number): EnergyComponents {
    if (!this.forceFieldParams) {
      throw new Error('Force field not initialized');
    }

    // Simplified energy calculation for demonstration
    // Real implementation would use proper topology and interactions
    const bond = this.calculateBondEnergy(positions, atomCount);
    const angle = this.calculateAngleEnergy(positions, atomCount);
    const dihedral = this.calculateDihedralEnergy(positions, atomCount);
    const vdw = this.calculateVdWEnergy(positions, atomCount);
    const coulomb = this.calculateCoulombEnergy(positions, atomCount);

    return {
      bond,
      angle,
      dihedral,
      vdw,
      coulomb,
      total: bond + angle + dihedral + vdw + coulomb
    };
  }

  /**
   * Perform energy minimization
   */
  async minimize(
    positions: Float32Array,
    atomCount: number,
    config: MinimizationConfig,
    onProgress?: (iteration: number, energy: number) => void
  ): Promise<MinimizationResult> {
    if (!this.forceFieldParams) {
      throw new Error('Force field not initialized');
    }

    const trajectory: SimulationFrame[] = [];
    const currentPos = new Float32Array(positions);
    const forces = new Float32Array(atomCount * 3);

    const initialEnergy = this.calculateEnergy(currentPos, atomCount).total;
    let currentEnergy = initialEnergy;
    let iteration = 0;

    for (iteration = 0; iteration < config.maxIterations; iteration++) {
      // Calculate forces
      this.calculateForces(currentPos, atomCount, forces);

      // Calculate force norm
      let forceNorm = 0;
      for (let i = 0; i < forces.length; i++) {
        forceNorm += forces[i] * forces[i];
      }
      forceNorm = Math.sqrt(forceNorm);

      // Check convergence
      if (forceNorm < config.tolerance) {
        break;
      }

      // Update positions based on algorithm
      switch (config.algorithm) {
        case 'steepest-descent':
          this.steepestDescentStep(currentPos, forces, config.stepSize);
          break;
        case 'conjugate-gradient':
          this.conjugateGradientStep(currentPos, forces, config.stepSize, iteration);
          break;
        case 'lbfgs':
          this.lbfgsStep(currentPos, forces, config.stepSize);
          break;
      }

      // Calculate new energy
      currentEnergy = this.calculateEnergy(currentPos, atomCount).total;

      // Report progress
      if (onProgress && iteration % 10 === 0) {
        onProgress(iteration, currentEnergy);
      }

      // Store frame
      if (iteration % 10 === 0) {
        trajectory.push({
          step: iteration,
          time: iteration * 0.001, // pseudo-time for minimization
          positions: new Float32Array(currentPos),
          potentialEnergy: currentEnergy,
          kineticEnergy: 0,
          temperature: 0
        });
      }
    }

    return {
      success: iteration < config.maxIterations,
      iterations: iteration,
      initialEnergy,
      finalEnergy: currentEnergy,
      energyChange: currentEnergy - initialEnergy,
      forceNorm: 0, // Would calculate final force norm
      trajectory
    };
  }

  /**
   * Run molecular dynamics simulation
   */
  async runSimulation(
    positions: Float32Array,
    atomCount: number,
    params: MDSimulationParams,
    onStatus?: SimulationStatusCallback,
    onFrame?: FrameUpdateCallback
  ): Promise<TrajectoryData> {
    // Initialize engine
    const config: DynamicaConfig = {
      forceField: { type: params.forceField },
      integrator: {
        type: params.integrator,
        timestep: params.timestep,
        friction: params.integrator === 'langevin' ? 1.0 : undefined
      },
      temperature: params.temperature,
      ensemble: params.ensemble,
      maxSteps: params.steps,
      outputFrequency: params.outputFrequency
    };

    await this.engine.initialize(positions, atomCount, config);

    // Track trajectory data
    const frames: SimulationFrame[] = [];
    const energies: EnergyComponents[] = [];
    const temperatures: number[] = [];
    const pressures: number[] = [];

    return new Promise((resolve, reject) => {
      onStatus?.({
        phase: 'initializing',
        progress: 0,
        currentStep: 0,
        totalSteps: params.steps
      });

      this.engine.start(
        (progress) => {
          // Update status
          onStatus?.({
            phase: 'production',
            progress: (progress.currentStep / progress.totalSteps) * 100,
            currentStep: progress.currentStep,
            totalSteps: progress.totalSteps,
            energy: progress.currentFrame.potentialEnergy + progress.currentFrame.kineticEnergy,
            temperature: progress.currentFrame.temperature
          });

          // Call frame callback
          onFrame?.(progress.currentFrame, frames.length);
        },
        (completedFrames) => {
          // Process final trajectory
          completedFrames.forEach(frame => {
            frames.push(frame);
            energies.push(this.calculateEnergy(frame.positions, atomCount));
            temperatures.push(frame.temperature);
            if (frame.pressure !== undefined) {
              pressures.push(frame.pressure);
            }
          });

          // Calculate statistics
          const avgEnergy = energies.reduce((sum, e) => sum + e.total, 0) / energies.length;
          const energyDrift = energies[energies.length - 1].total - energies[0].total;
          const avgTemperature = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
          const tempVariance = temperatures.reduce((sum, t) => sum + Math.pow(t - avgTemperature, 2), 0) / temperatures.length;

          this.trajectory = {
            frames,
            energies,
            temperatures,
            pressures: pressures.length > 0 ? pressures : undefined,
            statistics: {
              avgEnergy,
              energyDrift,
              avgTemperature,
              tempFluctuation: Math.sqrt(tempVariance)
            }
          };

          onStatus?.({
            phase: 'complete',
            progress: 100,
            currentStep: params.steps,
            totalSteps: params.steps
          });

          resolve(this.trajectory);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Get current trajectory data
   */
  getTrajectory(): TrajectoryData | null {
    return this.trajectory;
  }

  /**
   * Export trajectory for MolStar rendering
   */
  exportForMolStar(frameIndex: number): {
    positions: Float32Array;
    energy: number;
    temperature: number;
  } {
    if (!this.trajectory) {
      throw new Error('No trajectory data available');
    }

    const frame = this.trajectory.frames[frameIndex];
    return {
      positions: frame.positions,
      energy: frame.potentialEnergy + frame.kineticEnergy,
      temperature: frame.temperature
    };
  }

  /**
   * Private helper methods for energy calculations
   */
  private calculateBondEnergy(positions: Float32Array, atomCount: number): number {
    // Simplified: assume linear chain for demo
    let energy = 0;
    for (let i = 0; i < atomCount - 1; i++) {
      const dx = positions[(i + 1) * 3] - positions[i * 3];
      const dy = positions[(i + 1) * 3 + 1] - positions[i * 3 + 1];
      const dz = positions[(i + 1) * 3 + 2] - positions[i * 3 + 2];
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const r0 = this.forceFieldParams!.bond.r0;
      const k = this.forceFieldParams!.bond.k;
      energy += 0.5 * k * Math.pow(r - r0, 2);
    }
    return energy;
  }

  private calculateAngleEnergy(positions: Float32Array, atomCount: number): number {
    // Simplified angle energy
    return atomCount * 10; // Placeholder
  }

  private calculateDihedralEnergy(positions: Float32Array, atomCount: number): number {
    // Simplified dihedral energy
    return atomCount * 5; // Placeholder
  }

  private calculateVdWEnergy(positions: Float32Array, atomCount: number): number {
    let energy = 0;
    const epsilon = this.forceFieldParams!.vdw.epsilon;
    const sigma = this.forceFieldParams!.vdw.sigma;

    for (let i = 0; i < atomCount - 1; i++) {
      for (let j = i + 1; j < atomCount; j++) {
        const dx = positions[j * 3] - positions[i * 3];
        const dy = positions[j * 3 + 1] - positions[i * 3 + 1];
        const dz = positions[j * 3 + 2] - positions[i * 3 + 2];
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const sr6 = Math.pow(sigma / r, 6);
        energy += 4 * epsilon * (sr6 * sr6 - sr6);
      }
    }
    return energy;
  }

  private calculateCoulombEnergy(positions: Float32Array, atomCount: number): number {
    // Simplified: assume unit charges for demo
    return atomCount * 50; // Placeholder
  }

  private calculateForces(positions: Float32Array, atomCount: number, forces: Float32Array): void {
    // Calculate negative gradient of energy
    const eps = 1e-6;

    for (let i = 0; i < atomCount * 3; i++) {
      const orig = positions[i];

      positions[i] = orig + eps;
      const ePlus = this.calculateEnergy(positions, atomCount).total;

      positions[i] = orig - eps;
      const eMinus = this.calculateEnergy(positions, atomCount).total;

      positions[i] = orig;
      forces[i] = -(ePlus - eMinus) / (2 * eps);
    }
  }

  private steepestDescentStep(positions: Float32Array, forces: Float32Array, stepSize: number): void {
    for (let i = 0; i < positions.length; i++) {
      positions[i] += stepSize * forces[i];
    }
  }

  private conjugateGradientStep(positions: Float32Array, forces: Float32Array, stepSize: number, _iteration: number): void {
    // Simplified CG - would need to store previous gradient
    this.steepestDescentStep(positions, forces, stepSize);
  }

  private lbfgsStep(positions: Float32Array, forces: Float32Array, stepSize: number): void {
    // Simplified L-BFGS - would need history buffer
    this.steepestDescentStep(positions, forces, stepSize);
  }
}

/**
 * Factory function for creating MD simulation service
 */
export function createMDSimulation(): MDSimulationService {
  return new MDSimulationService();
}
