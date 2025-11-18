/**
 * LOD System Public API
 * Export all LOD-related functionality
 */

// Complexity Analyzer
export {
  ComplexityAnalyzer,
  getComplexityAnalyzer,
  resetComplexityAnalyzer,
  analyzeFromAtoms,
  analyzeFromMetadata,
  categorizeComplexity,
  estimateMemoryUsage,
  type ComplexityConfig,
  type ExtendedComplexity,
} from './complexity-analyzer';

// Core LOD Manager
export {
  LODManager,
  LODLevel,
  LOD_CONFIGS,
  createLODManager,
  type LODConfig,
  type RenderFeatures,
  type StructureComplexity,
  type LODStageResult,
  type LODCallbacks,
} from './lod-manager';

// Quality Manager
export {
  QualityManager,
  QualityLevel,
  QUALITY_PRESETS,
  createQualityManager,
  type QualitySettings,
  type PerformanceMetrics,
  type DeviceCapability,
  type QualityManagerCallbacks,
} from '../services/quality-manager';

// Performance Profiler
export {
  PerformanceProfiler,
  createPerformanceProfiler,
  type PerformanceProfile,
  type BottleneckAnalysis,
  type PerformanceReport,
} from './performance-profiler';

// Performance Benchmark
export {
  PerformanceBenchmark,
  runBenchmark,
  DEVICE_PROFILES,
  STRUCTURE_SIZES,
  type BenchmarkResult,
  type BenchmarkReport,
  type DeviceProfile,
  type StructureSize,
} from './performance-benchmark';
