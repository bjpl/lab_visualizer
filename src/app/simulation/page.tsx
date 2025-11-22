/**
 * Simulation Page
 * Main page for MD simulation with preset scenarios
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import SimulationPresets from '../../components/simulation/SimulationPresets';
import SimulationControls from '../../components/simulation/SimulationControls';
import ForceFieldSettings from '../../components/simulation/ForceFieldSettings';
import EnergyPlot from '../../components/simulation/EnergyPlot';
import BrowserSimulation from '../../components/simulation/BrowserSimulation';
import {
  SimulationPreset,
  SimulationControls as ControlsState,
  ForceFieldConfig,
  EnergyPlotData,
} from '../../types/simulation';
import { SimulationFrame } from '../../lib/md-browser-dynamica';

export default function SimulationPage() {
  // State
  const [selectedPreset, setSelectedPreset] = useState<SimulationPreset | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [frames, setFrames] = useState<SimulationFrame[]>([]);
  const [controls, setControls] = useState<ControlsState>({
    isPlaying: false,
    isPaused: false,
    currentFrame: 0,
    totalFrames: 0,
    playbackSpeed: 1,
    loopMode: false
  });
  const [forceField, setForceField] = useState<ForceFieldConfig>({
    type: 'AMBER',
    parameters: {
      bondStrength: 1.0,
      angleStrength: 1.0,
      dihedralStrength: 1.0,
      vdwStrength: 1.0,
      coulombStrength: 1.0
    },
    cutoffs: {
      vdw: 1.0,
      coulomb: 1.0,
      neighborList: 1.2
    }
  });
  const [energyData, setEnergyData] = useState<EnergyPlotData>({
    time: [],
    potential: [],
    kinetic: [],
    total: [],
    temperature: []
  });

  // Mock positions for demo (replace with actual structure data)
  // Use useMemo to avoid calling Math.random() during render
  const mockPositions = useMemo(() => {
    const positions = new Float32Array(300 * 3); // 100 atoms
    for (let i = 0; i < positions.length; i++) {
      positions[i] = Math.random() * 10 - 5;
    }
    return positions;
  }, []);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: SimulationPreset) => {
    setSelectedPreset(preset);
    setFrames([]);
    setEnergyData({
      time: [],
      potential: [],
      kinetic: [],
      total: [],
      temperature: []
    });
    setControls(prev => ({
      ...prev,
      currentFrame: 0,
      totalFrames: 0
    }));

    // Update force field from preset
    setForceField(prev => ({
      ...prev,
      type: preset.parameters.forceField
    }));
  }, []);

  // Handle simulation complete
  const handleSimulationComplete = useCallback((completedFrames: SimulationFrame[]) => {
    setFrames(completedFrames);
    setIsSimulating(false);

    // Update controls
    setControls(prev => ({
      ...prev,
      totalFrames: completedFrames.length,
      currentFrame: 0
    }));

    // Extract energy data
    const time: number[] = [];
    const potential: number[] = [];
    const kinetic: number[] = [];
    const total: number[] = [];
    const temperature: number[] = [];

    completedFrames.forEach(frame => {
      time.push(frame.time);
      potential.push(frame.potentialEnergy);
      kinetic.push(frame.kineticEnergy);
      total.push(frame.potentialEnergy + frame.kineticEnergy);
      temperature.push(frame.temperature);
    });

    setEnergyData({
      time,
      potential,
      kinetic,
      total,
      temperature
    });
  }, []);

  // Playback controls
  const handlePlay = useCallback(() => {
    setControls(prev => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const handlePause = useCallback(() => {
    setControls(prev => ({ ...prev, isPaused: true }));
  }, []);

  const handleStop = useCallback(() => {
    setControls(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentFrame: 0
    }));
  }, []);

  const handleStepForward = useCallback(() => {
    setControls(prev => ({
      ...prev,
      currentFrame: Math.min(prev.currentFrame + 1, prev.totalFrames - 1)
    }));
  }, []);

  const handleStepBackward = useCallback(() => {
    setControls(prev => ({
      ...prev,
      currentFrame: Math.max(prev.currentFrame - 1, 0)
    }));
  }, []);

  const handleFrameChange = useCallback((frame: number) => {
    setControls(prev => ({ ...prev, currentFrame: frame }));
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setControls(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const handleLoopToggle = useCallback(() => {
    setControls(prev => ({ ...prev, loopMode: !prev.loopMode }));
  }, []);

  // Auto-play animation
  useEffect(() => {
    if (!controls.isPlaying || controls.isPaused || frames.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setControls(prev => {
        const nextFrame = prev.currentFrame + 1;

        if (nextFrame >= prev.totalFrames) {
          if (prev.loopMode) {
            return { ...prev, currentFrame: 0 };
          } else {
            return { ...prev, isPlaying: false, currentFrame: prev.totalFrames - 1 };
          }
        }

        return { ...prev, currentFrame: nextFrame };
      });
    }, 1000 / (30 * controls.playbackSpeed)); // 30 FPS base

    return () => clearInterval(interval);
  }, [controls.isPlaying, controls.isPaused, controls.playbackSpeed, controls.loopMode, frames.length]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Molecular Dynamics Simulation</h1>
        <p className="text-gray-600">
          Interactive browser-based MD simulations for educational exploration
        </p>
      </div>

      {/* Preset Selection */}
      <SimulationPresets
        onSelectPreset={handlePresetSelect as any}
      />

      {/* Main Content Grid */}
      {selectedPreset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Simulation Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Simulation Display */}
            <Card className="p-6">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg font-medium">3D Visualization</p>
                  <p className="text-sm mt-1">MolStar viewer integration coming soon</p>
                  {frames.length > 0 && (
                    <p className="text-sm mt-2 text-blue-600">
                      Frame {controls.currentFrame + 1} / {controls.totalFrames}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Playback Controls */}
            {frames.length > 0 && (
              <SimulationControls
                controls={controls}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                onStepForward={handleStepForward}
                onStepBackward={handleStepBackward}
                onFrameChange={handleFrameChange}
                onSpeedChange={handleSpeedChange}
                onLoopToggle={handleLoopToggle}
              />
            )}

            {/* Energy Plot */}
            {energyData.time.length > 0 && (
              <EnergyPlot
                data={energyData}
                width={800}
                height={300}
                showLegend
                showGrid
              />
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Simulation Configuration */}
            <BrowserSimulation
              atomCount={100}
              positions={mockPositions}
              onComplete={handleSimulationComplete}
              onError={(error) => console.error('Simulation error:', error)}
            />

            {/* Force Field Settings */}
            <ForceFieldSettings
              config={forceField}
              onChange={setForceField}
              disabled={isSimulating}
            />

            {/* Preset Info */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">{selectedPreset.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedPreset.description}</p>

              {selectedPreset.learningObjectives && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Learning Objectives:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedPreset.learningObjectives.map((objective, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Instructions when no preset selected */}
      {!selectedPreset && (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Get Started</h3>
            <p>Select a simulation preset above to begin exploring molecular dynamics</p>
          </div>
        </Card>
      )}
    </div>
  );
}
