/**
 * MD Simulation Worker
 * Performs molecular dynamics calculations in background thread
 * Offloads CPU-intensive force and energy calculations from main thread
 */

import { SimulationFrame } from '../lib/md-browser-dynamica';
import type { MDSimulationParams} from '../services/md-simulation';
import { createMDSimulation, EnergyComponents } from '../services/md-simulation';

interface WorkerMessage {
  type: 'initialize' | 'calculateEnergy' | 'minimize' | 'runSimulation' | 'stop';
  payload: any;
}

interface WorkerResponse {
  type: 'initialized' | 'energy' | 'minimization' | 'frame' | 'complete' | 'error' | 'progress';
  payload: any;
}

const mdService = createMDSimulation();
let isRunning = false;

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'initialize':
        handleInitialize(payload);
        break;

      case 'calculateEnergy':
        handleCalculateEnergy(payload);
        break;

      case 'minimize':
        await handleMinimize(payload);
        break;

      case 'runSimulation':
        await handleRunSimulation(payload);
        break;

      case 'stop':
        handleStop();
        break;

      default:
        sendError(`Unknown message type: ${type}`);
    }
  } catch (error) {
    sendError(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Initialize force field
 */
function handleInitialize(payload: {
  forceField: 'AMBER' | 'CHARMM' | 'OPLS';
  customParams?: any;
}) {
  mdService.setForceField(payload.forceField, payload.customParams);

  sendResponse({
    type: 'initialized',
    payload: {
      forceField: payload.forceField,
      timestamp: Date.now()
    }
  });
}

/**
 * Calculate energy for current configuration
 */
function handleCalculateEnergy(payload: {
  positions: Float32Array;
  atomCount: number;
}) {
  const energy = mdService.calculateEnergy(payload.positions, payload.atomCount);

  sendResponse({
    type: 'energy',
    payload: {
      energy,
      timestamp: Date.now()
    }
  });
}

/**
 * Perform energy minimization
 */
async function handleMinimize(payload: {
  positions: Float32Array;
  atomCount: number;
  config: {
    algorithm: 'steepest-descent' | 'conjugate-gradient' | 'lbfgs';
    maxIterations: number;
    tolerance: number;
    stepSize: number;
  };
}) {
  isRunning = true;

  const result = await mdService.minimize(
    payload.positions,
    payload.atomCount,
    payload.config,
    (iteration, energy) => {
      // Report progress
      sendResponse({
        type: 'progress',
        payload: {
          phase: 'minimization',
          iteration,
          energy,
          progress: (iteration / payload.config.maxIterations) * 100
        }
      });
    }
  );

  if (isRunning) {
    sendResponse({
      type: 'minimization',
      payload: result
    });
  }

  isRunning = false;
}

/**
 * Run molecular dynamics simulation
 */
async function handleRunSimulation(payload: {
  positions: Float32Array;
  atomCount: number;
  params: MDSimulationParams;
}) {
  isRunning = true;

  try {
    const trajectory = await mdService.runSimulation(
      payload.positions,
      payload.atomCount,
      payload.params,
      (status) => {
        // Report status updates
        sendResponse({
          type: 'progress',
          payload: status
        });
      },
      (frame, index) => {
        // Send individual frames
        sendResponse({
          type: 'frame',
          payload: {
            frame,
            index
          }
        });
      }
    );

    if (isRunning) {
      sendResponse({
        type: 'complete',
        payload: {
          trajectory,
          timestamp: Date.now()
        }
      });
    }
  } catch (error) {
    sendError(error instanceof Error ? error.message : 'Simulation failed');
  }

  isRunning = false;
}

/**
 * Stop running simulation
 */
function handleStop() {
  isRunning = false;
  sendResponse({
    type: 'complete',
    payload: {
      stopped: true,
      timestamp: Date.now()
    }
  });
}

/**
 * Send response to main thread
 */
function sendResponse(response: WorkerResponse) {
  self.postMessage(response);
}

/**
 * Send error to main thread
 */
function sendError(message: string) {
  self.postMessage({
    type: 'error',
    payload: {
      message,
      timestamp: Date.now()
    }
  });
}

// Export for TypeScript
export {};
