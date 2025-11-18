/**
 * JobSubmissionForm Component - Submit new simulation jobs
 *
 * Features:
 * - Structure selection (from viewer or PDB ID)
 * - Simulation parameter configuration
 * - Real-time cost estimation
 * - Tier recommendation based on atom count
 * - User quota display
 * - Validation and confirmation
 */

'use client';

import type React from 'react';
import { useState, useEffect } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ServerlessMDConfig} from '@/types/md-types';
import { MDTier } from '@/types/md-types';

export interface JobSubmissionFormProps {
  onSubmit: (config: JobSubmissionData) => Promise<void>;
  structureId?: string;
  structureData?: string;
  atomCount?: number;
  userQuota?: { used: number; limit: number };
}

export interface JobSubmissionData {
  structureId: string;
  structureData: string;
  config: ServerlessMDConfig;
}

type SimulationType = 'minimize' | 'equilibrate' | 'production';

const SIMULATION_PRESETS: Record<SimulationType, Partial<ServerlessMDConfig>> = {
  minimize: {
    ensemble: 'NVE',
    integrator: 'verlet',
    timestep: 1.0,
    totalTime: 10,
    temperature: 300,
    outputFrequency: 10,
    priority: 'normal',
  },
  equilibrate: {
    ensemble: 'NVT',
    integrator: 'langevin',
    timestep: 2.0,
    totalTime: 100,
    temperature: 300,
    outputFrequency: 5,
    priority: 'normal',
  },
  production: {
    ensemble: 'NPT',
    integrator: 'langevin',
    timestep: 2.0,
    totalTime: 1000,
    temperature: 300,
    outputFrequency: 1,
    priority: 'normal',
  },
};

export function JobSubmissionForm({
  onSubmit,
  structureId: initialStructureId,
  structureData: initialStructureData,
  atomCount: initialAtomCount,
  userQuota,
}: JobSubmissionFormProps) {
  const [simulationType, setSimulationType] = useState<SimulationType>('minimize');
  const [structureId, setStructureId] = useState(initialStructureId || '');
  const [pdbId, setPdbId] = useState('');
  const [atomCount, setAtomCount] = useState(initialAtomCount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Form state
  const [temperature, setTemperature] = useState(300);
  const [timestep, setTimestep] = useState(2.0);
  const [totalTime, setTotalTime] = useState(100);
  const [ensemble, setEnsemble] = useState<'NVE' | 'NVT' | 'NPT'>('NVT');
  const [integrator, setIntegrator] = useState<'verlet' | 'leapfrog' | 'langevin'>('langevin');
  const [outputFrequency, setOutputFrequency] = useState(5);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);

  // Apply preset when simulation type changes
  useEffect(() => {
    const preset = SIMULATION_PRESETS[simulationType];
    if (preset.temperature) setTemperature(preset.temperature);
    if (preset.timestep) setTimestep(preset.timestep);
    if (preset.totalTime) setTotalTime(preset.totalTime);
    if (preset.ensemble) setEnsemble(preset.ensemble);
    if (preset.integrator) setIntegrator(preset.integrator);
    if (preset.outputFrequency) setOutputFrequency(preset.outputFrequency);
    if (preset.priority) setPriority(preset.priority);
  }, [simulationType]);

  // Calculate cost estimation
  const estimateCost = () => {
    const steps = (totalTime * 1000) / timestep;
    const computeUnits = (atomCount * steps) / 1e9;
    const costPerUnit = 0.001; // $0.001 per billion atom-steps
    return computeUnits * costPerUnit;
  };

  const estimatedCost = estimateCost();

  // Tier recommendation
  const recommendedTier = atomCount <= 500 ? 'Browser' : atomCount <= 5000 ? 'Serverless' : 'Desktop Export';
  const canRunServerless = atomCount > 0 && atomCount <= 5000;

  // Quota check
  const quotaExceeded = userQuota ? userQuota.used >= userQuota.limit : false;
  const quotaRemaining = userQuota ? userQuota.limit - userQuota.used : 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRunServerless || quotaExceeded) return;

    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const config: ServerlessMDConfig = {
        tier: MDTier.SERVERLESS,
        atomCount,
        maxAtoms: 5000,
        timestep,
        totalTime,
        temperature,
        ensemble,
        integrator,
        outputFrequency,
        priority,
        notifyOnComplete,
        userId: 'user-id', // TODO: Get from auth context
      };

      await onSubmit({
        structureId,
        structureData: initialStructureData || '',
        config,
      });

      setShowConfirmation(false);
    } catch (error) {
      console.error('Failed to submit job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Submit Simulation</h2>
      </div>

      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Structure selection */}
          <div className="space-y-3">
            <h3 className="font-medium">Structure</h3>
            {initialStructureId ? (
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="text-sm font-medium">{structureId}</div>
                <div className="text-xs text-muted-foreground">
                  {atomCount.toLocaleString()} atoms
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter PDB ID (e.g., 1ABC)"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={pdbId}
                  onChange={(e) => setPdbId(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Or load a structure in the viewer first
                </p>
              </div>
            )}

            {/* Tier recommendation */}
            {atomCount > 0 && (
              <div className={`border rounded-lg p-3 ${
                canRunServerless ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="text-sm font-medium">
                  Recommended: {recommendedTier}
                </div>
                {!canRunServerless && (
                  <p className="text-xs mt-1">
                    Structure too large for serverless tier. Use desktop export instead.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Simulation type presets */}
          <div className="space-y-3">
            <h3 className="font-medium">Simulation Type</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['minimize', 'equilibrate', 'production'] as SimulationType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                    simulationType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSimulationType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Parameters */}
          <div className="space-y-4">
            <h3 className="font-medium">Parameters</h3>

            {/* Ensemble */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ensemble</label>
              <div className="grid grid-cols-3 gap-2">
                {(['NVE', 'NVT', 'NPT'] as const).map((ens) => (
                  <button
                    key={ens}
                    type="button"
                    className={`px-3 py-2 text-sm border rounded-md ${
                      ensemble === ens ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => setEnsemble(ens)}
                  >
                    {ens}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Temperature: {temperature} K
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Timestep */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Timestep: {timestep} fs
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={timestep}
                onChange={(e) => setTimestep(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Total time */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Total Time: {totalTime} ps
              </label>
              <input
                type="range"
                min="10"
                max="10000"
                step="10"
                value={totalTime}
                onChange={(e) => setTotalTime(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'high'] as const).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    className={`px-3 py-2 text-sm border rounded-md ${
                      priority === pri ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => setPriority(pri)}
                  >
                    {pri.charAt(0).toUpperCase() + pri.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyOnComplete}
                onChange={(e) => setNotifyOnComplete(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Notify me when complete</span>
            </label>
          </div>

          <Separator />

          {/* Cost estimation */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-medium">
                {estimatedCost < 0.01 ? 'Free' : `$${estimatedCost.toFixed(3)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compute Time</span>
              <span className="font-medium">~{Math.ceil(atomCount * totalTime / 50000)} min</span>
            </div>
            {userQuota && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quota Remaining</span>
                <span className={`font-medium ${quotaExceeded ? 'text-destructive' : ''}`}>
                  {quotaRemaining}/{userQuota.limit} free jobs today
                </span>
              </div>
            )}
          </div>
        </form>
      </ScrollArea>

      {/* Submit button */}
      <div className="p-4 border-t">
        <button
          type="submit"
          disabled={!canRunServerless || quotaExceeded || !structureId}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          onClick={handleSubmit}
        >
          {quotaExceeded
            ? 'Daily Quota Exceeded'
            : !canRunServerless
            ? 'Structure Too Large'
            : 'Submit Simulation'}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Confirm Submission</h3>
            <div className="space-y-2 text-sm">
              <p>Structure: <strong>{structureId}</strong></p>
              <p>Type: <strong>{simulationType}</strong></p>
              <p>Time: <strong>{totalTime} ps</strong></p>
              <p>Cost: <strong>{estimatedCost < 0.01 ? 'Free' : `$${estimatedCost.toFixed(3)}`}</strong></p>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 border rounded-md hover:bg-muted/50"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={confirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
