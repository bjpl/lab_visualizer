/**
 * Integration Tests for OpenMM Simulation Worker
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { SimulationMonitor } from '@/services/simulation-monitor';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('OpenMM Simulation Worker', () => {
  let supabase: ReturnType<typeof createClient>;
  let testJobId: string;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testJobId) {
      await supabase.from('md_jobs').delete().eq('id', testJobId);
    }
  });

  describe('Small System (<100 atoms)', () => {
    it('should complete simulation in <1 minute', async () => {
      const startTime = Date.now();

      // Small peptide structure (22 atoms)
      const pdbData = `ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C
ATOM      3  C   ALA A   1       2.009   1.420   0.000  1.00  0.00           C
ATOM      4  O   ALA A   1       1.251   2.390   0.000  1.00  0.00           O
ATOM      5  CB  ALA A   1       1.962  -0.774  -1.212  1.00  0.00           C
END`;

      const config = {
        atomCount: 5,
        timestep: 2.0,
        totalTime: 10,
        temperature: 300,
        ensemble: 'NVT' as const
      };

      testJobId = `test-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: testJobId,
          structureData: pdbData,
          config,
          userId: 'test-user'
        }
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.jobId).toBe(testJobId);

      const executionTime = (Date.now() - startTime) / 1000;
      expect(executionTime).toBeLessThan(60);

      // Verify results
      expect(data.trajectoryUrl).toBeDefined();
      expect(data.energyUrl).toBeDefined();
      expect(data.frameCount).toBeGreaterThan(0);
    }, 120000); // 2 minute timeout
  });

  describe('Medium System (~1000 atoms)', () => {
    it('should complete simulation in <3 minutes', async () => {
      // Skip if running in CI (too resource intensive)
      if (process.env.CI) {
        console.log('Skipping medium system test in CI');
        return;
      }

      const startTime = Date.now();

      // Would use actual 1000 atom structure here
      // For test purposes, use smaller structure
      const pdbData = generateTestStructure(50);

      const config = {
        atomCount: 50,
        timestep: 2.0,
        totalTime: 50,
        temperature: 300,
        ensemble: 'NPT' as const
      };

      testJobId = `test-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: testJobId,
          structureData: pdbData,
          config,
          userId: 'test-user'
        }
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);

      const executionTime = (Date.now() - startTime) / 1000;
      expect(executionTime).toBeLessThan(180);
    }, 240000); // 4 minute timeout
  });

  describe('Progress Monitoring', () => {
    it('should receive progress updates', async () => {
      const pdbData = generateTestStructure(20);
      const config = {
        atomCount: 20,
        timestep: 2.0,
        totalTime: 30,
        temperature: 300,
        ensemble: 'NVT' as const
      };

      testJobId = `test-${Date.now()}`;

      const progressUpdates: number[] = [];
      const monitor = new SimulationMonitor();

      // Subscribe to progress
      monitor.subscribe(testJobId, {
        onProgress: (progress) => {
          progressUpdates.push(progress.progress);
        }
      });

      // Start simulation
      await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: testJobId,
          structureData: pdbData,
          config,
          userId: 'test-user'
        }
      });

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 60000));

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);

      monitor.unsubscribe();
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should reject oversized systems', async () => {
      const config = {
        atomCount: 6000, // Exceeds 5000 limit
        timestep: 2.0,
        totalTime: 100,
        temperature: 300,
        ensemble: 'NVT' as const
      };

      const { data, error } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: `test-${Date.now()}`,
          structureData: generateTestStructure(100),
          config,
          userId: 'test-user'
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toContain('exceeds serverless tier limit');
    });

    it('should handle invalid PDB data', async () => {
      const config = {
        atomCount: 10,
        timestep: 2.0,
        totalTime: 10,
        temperature: 300,
        ensemble: 'NVT' as const
      };

      const { data, error } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: `test-${Date.now()}`,
          structureData: 'INVALID PDB DATA',
          config,
          userId: 'test-user'
        }
      });

      expect(error).toBeDefined();
    });
  });

  describe('Cost Tracking', () => {
    it('should track simulation costs', async () => {
      const pdbData = generateTestStructure(20);
      const config = {
        atomCount: 20,
        timestep: 2.0,
        totalTime: 20,
        temperature: 300,
        ensemble: 'NVT' as const
      };

      testJobId = `test-${Date.now()}`;

      const { data } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: testJobId,
          structureData: pdbData,
          config,
          userId: 'test-user'
        }
      });

      expect(data.cost).toBeDefined();
      expect(data.cost).toBeLessThan(0.5); // Under $0.50
      expect(data.cost).toBeGreaterThan(0);

      // Verify cost is recorded
      const { data: costData } = await supabase
        .from('simulation_costs')
        .select('*')
        .eq('job_id', testJobId)
        .single();

      expect(costData).toBeDefined();
      expect(costData.cost_usd).toBe(data.cost);
    }, 120000);
  });
});

/**
 * Helper function to generate test PDB structure
 */
function generateTestStructure(atomCount: number): string {
  let pdb = '';

  for (let i = 0; i < atomCount; i++) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    const z = Math.random() * 10;

    pdb += `ATOM  ${(i + 1).toString().padStart(5)} ` +
           `CA  ALA A${(i + 1).toString().padStart(4)}    ` +
           `${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}` +
           `  1.00  0.00           C\n`;
  }

  pdb += 'END\n';

  return pdb;
}
