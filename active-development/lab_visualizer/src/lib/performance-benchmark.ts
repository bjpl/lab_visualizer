/**
 * Performance Benchmark Suite
 * Tests LOD system across different device profiles and structure sizes
 */

import { QualityManager, QualityLevel } from '../services/quality-manager';

import { LODManager, LODLevel } from './lod-manager';
import { PerformanceProfiler } from './performance-profiler';

export interface BenchmarkResult {
  deviceProfile: string;
  structureSize: string;
  lodLevel: LODLevel;
  qualityLevel: QualityLevel;
  loadTime: number;
  avgFPS: number;
  minFPS: number;
  maxFPS: number;
  atomsRendered: number;
  memoryUsed: number;
  passedTargets: boolean;
}

export interface BenchmarkReport {
  timestamp: number;
  duration: number;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    avgLoadTime: number;
    avgFPS: number;
  };
  deviceProfiles: {
    desktop: BenchmarkResult[];
    laptop: BenchmarkResult[];
    tablet: BenchmarkResult[];
    mobile: BenchmarkResult[];
  };
}

export interface DeviceProfile {
  name: string;
  memoryBudget: number; // MB
  maxAtoms: number;
  recommendedQuality: QualityLevel;
  targetFPS: number;
}

export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  desktop: {
    name: 'Desktop (High-End)',
    memoryBudget: 1024,
    maxAtoms: 100000,
    recommendedQuality: QualityLevel.ULTRA,
    targetFPS: 60,
  },
  laptop: {
    name: 'Laptop (Medium)',
    memoryBudget: 512,
    maxAtoms: 50000,
    recommendedQuality: QualityLevel.HIGH,
    targetFPS: 60,
  },
  tablet: {
    name: 'Tablet (Low-End)',
    memoryBudget: 256,
    maxAtoms: 10000,
    recommendedQuality: QualityLevel.MEDIUM,
    targetFPS: 45,
  },
  mobile: {
    name: 'Mobile',
    memoryBudget: 128,
    maxAtoms: 5000,
    recommendedQuality: QualityLevel.LOW,
    targetFPS: 30,
  },
};

export interface StructureSize {
  name: string;
  atomCount: number;
  expectedPreviewTime: number;
  expectedInteractiveTime: number;
  expectedFullTime: number;
}

export const STRUCTURE_SIZES: Record<string, StructureSize> = {
  small: {
    name: 'Small (< 1K atoms)',
    atomCount: 500,
    expectedPreviewTime: 100,
    expectedInteractiveTime: 300,
    expectedFullTime: 800,
  },
  medium: {
    name: 'Medium (1-10K atoms)',
    atomCount: 5000,
    expectedPreviewTime: 150,
    expectedInteractiveTime: 800,
    expectedFullTime: 1500,
  },
  large: {
    name: 'Large (10-50K atoms)',
    atomCount: 25000,
    expectedPreviewTime: 200,
    expectedInteractiveTime: 1500,
    expectedFullTime: 3000,
  },
  veryLarge: {
    name: 'Very Large (50K+ atoms)',
    atomCount: 75000,
    expectedPreviewTime: 250,
    expectedInteractiveTime: 2500,
    expectedFullTime: 5000,
  },
};

export class PerformanceBenchmark {
  private lodManager: LODManager;
  private qualityManager: QualityManager;
  private profiler: PerformanceProfiler;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.lodManager = new LODManager();
    this.qualityManager = new QualityManager();
    this.profiler = new PerformanceProfiler();
  }

  /**
   * Run complete benchmark suite
   */
  async runCompleteBenchmark(): Promise<BenchmarkReport> {
    const startTime = Date.now();
    this.results = [];

    console.log('🚀 Starting Performance Benchmark Suite...\n');

    // Test each device profile
    for (const [profileKey, profile] of Object.entries(DEVICE_PROFILES)) {
      console.log(`📱 Testing ${profile.name}...`);

      // Test each structure size
      for (const [sizeKey, size] of Object.entries(STRUCTURE_SIZES)) {
        // Skip if structure too large for device
        if (size.atomCount > profile.maxAtoms) {
          console.log(`  ⏭️  Skipping ${size.name} (exceeds device limit)`);
          continue;
        }

        console.log(`  🧬 ${size.name}...`);

        // Test each LOD level
        const levels = [LODLevel.PREVIEW, LODLevel.INTERACTIVE, LODLevel.FULL];

        for (const level of levels) {
          const result = await this.benchmarkScenario(
            profile,
            size,
            level,
            profile.recommendedQuality
          );

          this.results.push(result);

          const status = result.passedTargets ? '✅' : '❌';
          console.log(
            `    ${status} LOD ${level}: ${result.loadTime.toFixed(0)}ms @ ${result.avgFPS.toFixed(1)} FPS`
          );
        }
      }

      console.log('');
    }

    const duration = Date.now() - startTime;
    const report = this.generateReport(duration);

    console.log('📊 Benchmark Complete!\n');
    this.printSummary(report);

    return report;
  }

  /**
   * Benchmark a specific scenario
   */
  private async benchmarkScenario(
    profile: DeviceProfile,
    size: StructureSize,
    lodLevel: LODLevel,
    qualityLevel: QualityLevel
  ): Promise<BenchmarkResult> {
    // Setup managers for this profile
    this.lodManager = new LODManager({}, profile.memoryBudget);
    this.qualityManager = new QualityManager(qualityLevel);

    // Generate mock structure
    const structure = this.generateMockStructure(size.atomCount);

    // Analyze complexity
    const complexity = this.lodManager.analyzeComplexity(structure);

    // Measure load time
    const loadStart = performance.now();

    // Simulate rendering (in real implementation, would use actual renderer)
    const atoms = this.lodManager.filterAtomsForLevel(
      structure.atoms,
      lodLevel,
      complexity
    );

    const loadTime = performance.now() - loadStart;

    // Simulate FPS measurement
    const mockRenderer = this.createMockRenderer(atoms.length, profile);
    const fpsStats = await this.measureFPS(mockRenderer, 120); // 2 seconds

    // Check if targets met
    const expectedTime = this.getExpectedTime(size, lodLevel);
    const passedTargets =
      loadTime <= expectedTime * 1.5 && // Allow 50% margin
      fpsStats.avgFPS >= profile.targetFPS * 0.8; // Allow 20% margin

    return {
      deviceProfile: profile.name,
      structureSize: size.name,
      lodLevel,
      qualityLevel,
      loadTime,
      avgFPS: fpsStats.avgFPS,
      minFPS: fpsStats.minFPS,
      maxFPS: fpsStats.maxFPS,
      atomsRendered: atoms.length,
      memoryUsed: this.lodManager.estimateMemoryUsage(complexity, lodLevel),
      passedTargets,
    };
  }

  /**
   * Generate mock structure for testing
   */
  private generateMockStructure(atomCount: number): any {
    const atoms = [];

    for (let i = 0; i < atomCount; i++) {
      atoms.push({
        name: i % 4 === 0 ? 'CA' : i % 4 === 1 ? 'C' : i % 4 === 2 ? 'N' : 'O',
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        z: Math.random() * 100 - 50,
        radius: 1.5,
        color: [0.5, 0.5, 0.5],
      });
    }

    return {
      atomCount,
      bondCount: Math.floor(atomCount * 1.2),
      residueCount: Math.floor(atomCount / 10),
      chainCount: Math.max(1, Math.floor(atomCount / 5000)),
      hasLigands: atomCount > 100,
      hasSurfaces: false,
      atoms,
    };
  }

  /**
   * Create mock renderer for FPS simulation
   */
  private createMockRenderer(atomCount: number, profile: DeviceProfile): any {
    // Simulate rendering performance based on device and atom count
    const baseFrameTime = 8; // 8ms base (120 FPS)
    const atomPenalty = atomCount / profile.maxAtoms; // 0-1 based on capacity
    const simulatedFrameTime = baseFrameTime * (1 + atomPenalty * 2);

    return {
      frameTime: simulatedFrameTime,
      atomCount,
    };
  }

  /**
   * Measure simulated FPS
   */
  private async measureFPS(
    renderer: any,
    frames: number
  ): Promise<{ avgFPS: number; minFPS: number; maxFPS: number }> {
    const fpsList: number[] = [];

    for (let i = 0; i < frames; i++) {
      // Simulate frame time variation
      const variation = (Math.random() - 0.5) * 4; // ±2ms
      const frameTime = renderer.frameTime + variation;
      const fps = 1000 / frameTime;
      fpsList.push(fps);

      // Small delay to simulate frame rendering
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    return {
      avgFPS: fpsList.reduce((a, b) => a + b, 0) / fpsList.length,
      minFPS: Math.min(...fpsList),
      maxFPS: Math.max(...fpsList),
    };
  }

  /**
   * Get expected load time for scenario
   */
  private getExpectedTime(size: StructureSize, level: LODLevel): number {
    switch (level) {
      case LODLevel.PREVIEW:
        return size.expectedPreviewTime;
      case LODLevel.INTERACTIVE:
        return size.expectedInteractiveTime;
      case LODLevel.FULL:
        return size.expectedFullTime;
      default:
        return 1000;
    }
  }

  /**
   * Generate benchmark report
   */
  private generateReport(duration: number): BenchmarkReport {
    const passed = this.results.filter((r) => r.passedTargets).length;
    const failed = this.results.length - passed;

    const avgLoadTime =
      this.results.reduce((sum, r) => sum + r.loadTime, 0) / this.results.length;
    const avgFPS =
      this.results.reduce((sum, r) => sum + r.avgFPS, 0) / this.results.length;

    // Group by device profile
    const deviceProfiles = {
      desktop: this.results.filter((r) => r.deviceProfile.includes('Desktop')),
      laptop: this.results.filter((r) => r.deviceProfile.includes('Laptop')),
      tablet: this.results.filter((r) => r.deviceProfile.includes('Tablet')),
      mobile: this.results.filter((r) => r.deviceProfile.includes('Mobile')),
    };

    return {
      timestamp: Date.now(),
      duration,
      results: this.results,
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        avgLoadTime,
        avgFPS,
      },
      deviceProfiles,
    };
  }

  /**
   * Print benchmark summary
   */
  private printSummary(report: BenchmarkReport): void {
    console.log('═══════════════════════════════════════════════════');
    console.log('  BENCHMARK SUMMARY');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(
      `Passed: ${report.summary.passed} (${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%)`
    );
    console.log(
      `Failed: ${report.summary.failed} (${((report.summary.failed / report.summary.totalTests) * 100).toFixed(1)}%)`
    );
    console.log(`\nAverage Load Time: ${report.summary.avgLoadTime.toFixed(2)}ms`);
    console.log(`Average FPS: ${report.summary.avgFPS.toFixed(1)}\n`);

    // Per-device summary
    console.log('Device Performance:');
    for (const [device, results] of Object.entries(report.deviceProfiles)) {
      if (results.length === 0) continue;

      const avgFPS = results.reduce((s, r) => s + r.avgFPS, 0) / results.length;
      const passed = results.filter((r) => r.passedTargets).length;

      console.log(
        `  ${device.padEnd(10)}: ${avgFPS.toFixed(1)} FPS avg, ${passed}/${results.length} passed`
      );
    }

    console.log('\n═══════════════════════════════════════════════════\n');
  }

  /**
   * Export report as JSON
   */
  exportReport(report: BenchmarkReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportCSV(report: BenchmarkReport): string {
    const headers = [
      'Device Profile',
      'Structure Size',
      'LOD Level',
      'Quality Level',
      'Load Time (ms)',
      'Avg FPS',
      'Min FPS',
      'Max FPS',
      'Atoms Rendered',
      'Memory Used (MB)',
      'Passed',
    ];

    const rows = report.results.map((r) => [
      r.deviceProfile,
      r.structureSize,
      r.lodLevel,
      r.qualityLevel,
      r.loadTime.toFixed(2),
      r.avgFPS.toFixed(1),
      r.minFPS.toFixed(1),
      r.maxFPS.toFixed(1),
      r.atomsRendered,
      (r.memoryUsed / (1024 * 1024)).toFixed(2),
      r.passedTargets ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

/**
 * Run benchmark from CLI
 */
export async function runBenchmark(): Promise<void> {
  const benchmark = new PerformanceBenchmark();
  const report = await benchmark.runCompleteBenchmark();

  // Save results
  const json = benchmark.exportReport(report);
  const csv = benchmark.exportCSV(report);

  console.log('💾 Saving results...\n');
  console.log('JSON output available');
  console.log('CSV output available\n');

  return;
}

// Run if executed directly
if (require.main === module) {
  runBenchmark().catch(console.error);
}
