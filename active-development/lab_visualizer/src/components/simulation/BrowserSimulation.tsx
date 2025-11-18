/**
 * Browser Simulation Component
 * Interactive UI for WebDynamica browser-based MD simulations
 * Educational demo only - clearly labeled with limitations
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

import type { SimulationFrame } from '../../lib/md-browser-dynamica';
import type {
  BrowserSimulationConfig,
  SimulationState} from '../../services/browser-simulation';
import {
  BrowserSimulationController,
  createBrowserSimulation
} from '../../services/browser-simulation';

interface BrowserSimulationProps {
  atomCount: number;
  positions: Float32Array;
  onComplete?: (frames: SimulationFrame[]) => void;
  onError?: (error: string) => void;
}

export default function BrowserSimulation({
  atomCount,
  positions,
  onComplete,
  onError,
}: BrowserSimulationProps) {
  // Simulation controller
  const [controller] = useState(() => createBrowserSimulation());

  // Configuration state
  const [config, setConfig] = useState<BrowserSimulationConfig>({
    temperature: 300,
    timestep: 1.0,
    steps: 1000,
    integrator: 'verlet',
    forceField: 'AMBER',
    ensemble: 'NVT',
    outputFrequency: 10,
  });

  // Simulation state
  const [simState, setSimState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    elapsedTime: 0,
    estimatedRemaining: 0,
  });

  // UI state
  const [initialized, setInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [energyHistory, setEnergyHistory] = useState<Array<{ time: number; energy: number }>>([]);
  const [tempHistory, setTempHistory] = useState<Array<{ time: number; temp: number }>>([]);

  // Initialize simulation
  const initializeSimulation = useCallback(async () => {
    const result = await controller.initialize(positions, atomCount, config);
    if (result.success) {
      setInitialized(true);
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || 'Initialization failed');
      if (onError) {
        onError(result.error || 'Initialization failed');
      }
    }
  }, [controller, positions, atomCount, config, onError]);

  // Initialize on mount
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // Update energy and temperature history
  useEffect(() => {
    if (simState.currentFrame) {
      const frame = simState.currentFrame;
      const totalEnergy = frame.potentialEnergy + frame.kineticEnergy;

      setEnergyHistory(prev => [
        ...prev.slice(-99), // Keep last 100 points
        { time: frame.time, energy: totalEnergy },
      ]);

      setTempHistory(prev => [
        ...prev.slice(-99),
        { time: frame.time, temp: frame.temperature },
      ]);
    }
  }, [simState.currentFrame]);

  // Start simulation
  const handleStart = useCallback(() => {
    setEnergyHistory([]);
    setTempHistory([]);
    controller.start((state) => {
      setSimState(state);

      // Check for completion
      if (!state.isRunning && state.progress === 100) {
        const frames = controller.getFrames();
        if (onComplete) {
          onComplete(frames);
        }
      }
    });
  }, [controller, onComplete]);

  // Control handlers
  const handlePause = () => controller.pause();
  const handleResume = () => controller.resume();
  const handleStop = () => controller.stop();
  const handleReset = () => {
    controller.stop();
    initializeSimulation();
    setEnergyHistory([]);
    setTempHistory([]);
  };

  // Export trajectory
  const handleExport = (format: 'json' | 'pdb' | 'xyz') => {
    try {
      const data = controller.exportTrajectory(format);
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trajectory.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Atom count warning
  const atomWarning = atomCount > 300 ? (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            System has {atomCount} atoms. Performance may be slow. Consider using serverless tier for better performance.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Educational Demo Warning */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Educational Demo Only</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Browser simulations are limited to:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Maximum 500 atoms</li>
                <li>Maximum 30 seconds wall-clock time</li>
                <li>Simplified physics (no periodic boundary conditions)</li>
                <li>Limited accuracy compared to production MD codes</li>
              </ul>
              <p className="mt-2 font-medium">
                For production simulations, export to GROMACS, NAMD, or use serverless tier.
              </p>
            </div>
          </div>
        </div>
      </div>

      {atomWarning}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature (K)
            <span className="ml-1 text-gray-500 cursor-help" title="Target temperature for the simulation. Controls molecular motion speed.">ⓘ</span>
          </label>
          <input
            type="number"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
            disabled={simState.isRunning}
            min={0}
            max={500}
            step={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Timestep */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timestep (fs)
            <span className="ml-1 text-gray-500 cursor-help" title="Integration timestep. Smaller values are more accurate but slower.">ⓘ</span>
          </label>
          <input
            type="number"
            value={config.timestep}
            onChange={(e) => setConfig({ ...config, timestep: Number(e.target.value) })}
            disabled={simState.isRunning}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Steps
            <span className="ml-1 text-gray-500 cursor-help" title="Number of MD integration steps to perform.">ⓘ</span>
          </label>
          <input
            type="number"
            value={config.steps}
            onChange={(e) => setConfig({ ...config, steps: Number(e.target.value) })}
            disabled={simState.isRunning}
            min={100}
            max={10000}
            step={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Integrator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Integrator
            <span className="ml-1 text-gray-500 cursor-help" title="Integration algorithm. Verlet is fastest, Langevin includes temperature control.">ⓘ</span>
          </label>
          <select
            value={config.integrator}
            onChange={(e) => setConfig({ ...config, integrator: e.target.value as any })}
            disabled={simState.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="verlet">Velocity Verlet</option>
            <option value="leapfrog">Leapfrog</option>
            <option value="langevin">Langevin (NVT)</option>
          </select>
        </div>

        {/* Force Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Force Field
            <span className="ml-1 text-gray-500 cursor-help" title="Molecular force field for interactions.">ⓘ</span>
          </label>
          <select
            value={config.forceField}
            onChange={(e) => setConfig({ ...config, forceField: e.target.value as any })}
            disabled={simState.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="AMBER">AMBER</option>
            <option value="CHARMM">CHARMM</option>
            <option value="OPLS">OPLS</option>
          </select>
        </div>

        {/* Ensemble */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ensemble
            <span className="ml-1 text-gray-500 cursor-help" title="Statistical ensemble. NVT = constant temperature, NVE = constant energy.">ⓘ</span>
          </label>
          <select
            value={config.ensemble}
            onChange={(e) => setConfig({ ...config, ensemble: e.target.value as any })}
            disabled={simState.isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="NVE">NVE (Microcanonical)</option>
            <option value="NVT">NVT (Canonical)</option>
            <option value="NPT">NPT (Isothermal-Isobaric)</option>
          </select>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 mb-6">
        {!simState.isRunning ? (
          <button
            onClick={handleStart}
            disabled={!initialized}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ▶ Start Simulation
          </button>
        ) : simState.isPaused ? (
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            ▶ Resume
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={!simState.isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ⏹ Stop
        </button>

        <button
          onClick={handleReset}
          disabled={simState.isRunning}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          🔄 Reset
        </button>

        <div className="flex-1" />

        <div className="relative">
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            disabled={controller.getFrames().length === 0}
          >
            💾 Export
          </button>
          {controller.getFrames().length > 0 && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden group-hover:block">
              <button
                onClick={() => handleExport('json')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('pdb')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                PDB
              </button>
              <button
                onClick={() => handleExport('xyz')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                XYZ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {simState.isRunning && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress: {simState.progress.toFixed(1)}%</span>
            <span>Step {simState.currentStep} / {simState.totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${simState.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Elapsed: {simState.elapsedTime.toFixed(1)}s</span>
            <span>Remaining: {simState.estimatedRemaining.toFixed(1)}s</span>
            {simState.elapsedTime > 25 && (
              <span className="text-red-600 font-medium">⚠ Approaching 30s limit</span>
            )}
          </div>
        </div>
      )}

      {/* Real-time Metrics */}
      {simState.currentFrame && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Total Energy</div>
            <div className="text-2xl font-bold text-gray-900">
              {(simState.currentFrame.potentialEnergy + simState.currentFrame.kineticEnergy).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">kJ/mol</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Temperature</div>
            <div className="text-2xl font-bold text-gray-900">
              {simState.currentFrame.temperature.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">K</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Simulation Time</div>
            <div className="text-2xl font-bold text-gray-900">
              {simState.currentFrame.time.toFixed(3)}
            </div>
            <div className="text-xs text-gray-500">ps</div>
          </div>
        </div>
      )}

      {/* Simple Energy Plot */}
      {energyHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Energy vs Time</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <svg viewBox="0 0 400 100" className="w-full h-24">
              <polyline
                points={energyHistory.map((d, i) => `${(i / energyHistory.length) * 400},${100 - ((d.energy + 1000) / 20)}`).join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Temperature Plot */}
      {tempHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Temperature vs Time</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <svg viewBox="0 0 400 100" className="w-full h-24">
              <polyline
                points={tempHistory.map((d, i) => `${(i / tempHistory.length) * 400},${100 - ((d.temp - 250) / 3)}`).join(' ')}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Final Metrics */}
      {simState.metrics && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Simulation Complete</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
            <div>Average Energy: {simState.metrics.avgEnergy.toFixed(2)} kJ/mol</div>
            <div>Average Temperature: {simState.metrics.avgTemperature.toFixed(2)} K</div>
            <div>Temperature StdDev: {simState.metrics.tempStdDev.toFixed(2)} K</div>
            <div>Wall Clock Time: {simState.metrics.wallClockTime.toFixed(2)} s</div>
          </div>
        </div>
      )}
    </div>
  );
}
