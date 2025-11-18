#!/usr/bin/env ts-node

/**
 * LOD System Benchmark Runner
 * Execute from command line to benchmark LOD performance
 */

import { PerformanceBenchmark } from '../src/lib/performance-benchmark';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🧪 Lab Visualizer - LOD Performance Benchmark\n');
  console.log('Testing progressive rendering across device profiles...\n');

  const benchmark = new PerformanceBenchmark();

  try {
    // Run complete benchmark
    const report = await benchmark.runCompleteBenchmark();

    // Create output directory
    const outputDir = path.join(__dirname, '../benchmark-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON report
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const jsonPath = path.join(outputDir, `benchmark-${timestamp}.json`);
    const csvPath = path.join(outputDir, `benchmark-${timestamp}.csv`);

    fs.writeFileSync(jsonPath, benchmark.exportReport(report));
    fs.writeFileSync(csvPath, benchmark.exportCSV(report));

    console.log(`📁 Results saved to:`);
    console.log(`   ${jsonPath}`);
    console.log(`   ${csvPath}\n`);

    // Exit with appropriate code
    const successRate =
      (report.summary.passed / report.summary.totalTests) * 100;
    if (successRate >= 90) {
      console.log('✅ Benchmark PASSED (≥90% success rate)\n');
      process.exit(0);
    } else if (successRate >= 75) {
      console.log('⚠️  Benchmark PARTIAL (75-90% success rate)\n');
      process.exit(0);
    } else {
      console.log('❌ Benchmark FAILED (<75% success rate)\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Benchmark failed with error:', error);
    process.exit(1);
  }
}

main();
