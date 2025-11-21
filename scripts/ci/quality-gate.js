#!/usr/bin/env node

/**
 * Quality Gate Enforcement Script
 * Validates all quality metrics before allowing deployment
 */

const fs = require('fs');
const path = require('path');

// Quality gate thresholds
const THRESHOLDS = {
  coverage: {
    lines: 75,
    statements: 75,
    functions: 75,
    branches: 75,
  },
  bundleSize: {
    maxSize: 512000, // 500KB in bytes
    maxChunkSize: 256000, // 250KB in bytes
  },
  performance: {
    lighthouse: {
      performance: 85,
      accessibility: 90,
      bestPractices: 90,
      seo: 90,
    },
  },
  security: {
    maxHighVulnerabilities: 0,
    maxModerateVulnerabilities: 5,
  },
};

class QualityGate {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  /**
   * Check test coverage thresholds
   */
  checkCoverage() {
    console.log('\n📊 Checking test coverage...');

    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (!fs.existsSync(coveragePath)) {
        this.results.failed.push('Coverage report not found');
        return false;
      }

      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;

      const checks = [
        { name: 'Lines', value: total.lines.pct, threshold: THRESHOLDS.coverage.lines },
        { name: 'Statements', value: total.statements.pct, threshold: THRESHOLDS.coverage.statements },
        { name: 'Functions', value: total.functions.pct, threshold: THRESHOLDS.coverage.functions },
        { name: 'Branches', value: total.branches.pct, threshold: THRESHOLDS.coverage.branches },
      ];

      let allPassed = true;
      checks.forEach(check => {
        if (check.value >= check.threshold) {
          console.log(`  ✅ ${check.name}: ${check.value.toFixed(2)}% (>= ${check.threshold}%)`);
          this.results.passed.push(`Coverage ${check.name}: ${check.value.toFixed(2)}%`);
        } else {
          console.log(`  ❌ ${check.name}: ${check.value.toFixed(2)}% (< ${check.threshold}%)`);
          this.results.failed.push(`Coverage ${check.name} below threshold: ${check.value.toFixed(2)}%`);
          allPassed = false;
        }
      });

      return allPassed;
    } catch (error) {
      console.error('  ❌ Error checking coverage:', error.message);
      this.results.failed.push(`Coverage check error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check bundle size limits
   */
  checkBundleSize() {
    console.log('\n📦 Checking bundle size...');

    try {
      const distPath = path.join(process.cwd(), 'dist', 'assets');
      if (!fs.existsSync(distPath)) {
        this.results.warnings.push('Build artifacts not found - skipping bundle size check');
        console.log('  ⚠️  Build artifacts not found');
        return true;
      }

      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));

      let totalSize = 0;
      let maxChunkSize = 0;

      jsFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        maxChunkSize = Math.max(maxChunkSize, stats.size);
      });

      const totalSizeKB = (totalSize / 1024).toFixed(2);
      const maxChunkSizeKB = (maxChunkSize / 1024).toFixed(2);

      let passed = true;

      if (totalSize <= THRESHOLDS.bundleSize.maxSize) {
        console.log(`  ✅ Total bundle size: ${totalSizeKB}KB (<= 500KB)`);
        this.results.passed.push(`Bundle size: ${totalSizeKB}KB`);
      } else {
        console.log(`  ❌ Total bundle size: ${totalSizeKB}KB (> 500KB)`);
        this.results.failed.push(`Bundle size exceeds limit: ${totalSizeKB}KB`);
        passed = false;
      }

      if (maxChunkSize <= THRESHOLDS.bundleSize.maxChunkSize) {
        console.log(`  ✅ Largest chunk: ${maxChunkSizeKB}KB (<= 250KB)`);
        this.results.passed.push(`Max chunk size: ${maxChunkSizeKB}KB`);
      } else {
        console.log(`  ⚠️  Largest chunk: ${maxChunkSizeKB}KB (> 250KB)`);
        this.results.warnings.push(`Large chunk detected: ${maxChunkSizeKB}KB`);
      }

      return passed;
    } catch (error) {
      console.error('  ❌ Error checking bundle size:', error.message);
      this.results.failed.push(`Bundle size check error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check Lighthouse performance scores
   */
  checkPerformance() {
    console.log('\n⚡ Checking Lighthouse scores...');

    try {
      const lighthousePath = path.join(process.cwd(), '.lighthouseci', 'manifest.json');
      if (!fs.existsSync(lighthousePath)) {
        this.results.warnings.push('Lighthouse report not found - skipping performance check');
        console.log('  ⚠️  Lighthouse report not found');
        return true;
      }

      const manifest = JSON.parse(fs.readFileSync(lighthousePath, 'utf8'));
      const latestReport = manifest[0];
      const scores = latestReport.summary;

      const checks = [
        { name: 'Performance', value: scores.performance * 100, threshold: THRESHOLDS.performance.lighthouse.performance },
        { name: 'Accessibility', value: scores.accessibility * 100, threshold: THRESHOLDS.performance.lighthouse.accessibility },
        { name: 'Best Practices', value: scores['best-practices'] * 100, threshold: THRESHOLDS.performance.lighthouse.bestPractices },
        { name: 'SEO', value: scores.seo * 100, threshold: THRESHOLDS.performance.lighthouse.seo },
      ];

      let allPassed = true;
      checks.forEach(check => {
        if (check.value >= check.threshold) {
          console.log(`  ✅ ${check.name}: ${check.value.toFixed(0)} (>= ${check.threshold})`);
          this.results.passed.push(`Lighthouse ${check.name}: ${check.value.toFixed(0)}`);
        } else {
          console.log(`  ❌ ${check.name}: ${check.value.toFixed(0)} (< ${check.threshold})`);
          this.results.failed.push(`Lighthouse ${check.name} below threshold: ${check.value.toFixed(0)}`);
          allPassed = false;
        }
      });

      return allPassed;
    } catch (error) {
      console.log('  ⚠️  Error checking Lighthouse scores:', error.message);
      this.results.warnings.push(`Lighthouse check skipped: ${error.message}`);
      return true; // Don't fail on lighthouse errors
    }
  }

  /**
   * Check security vulnerabilities
   */
  checkSecurity() {
    console.log('\n🔒 Checking security vulnerabilities...');

    try {
      const auditPath = path.join(process.cwd(), 'audit-report.json');
      if (!fs.existsSync(auditPath)) {
        this.results.warnings.push('Security audit report not found');
        console.log('  ⚠️  Security audit report not found');
        return true;
      }

      const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      const vulnerabilities = audit.metadata?.vulnerabilities || {};

      const high = vulnerabilities.high || 0;
      const moderate = vulnerabilities.moderate || 0;

      let passed = true;

      if (high <= THRESHOLDS.security.maxHighVulnerabilities) {
        console.log(`  ✅ High vulnerabilities: ${high} (<= ${THRESHOLDS.security.maxHighVulnerabilities})`);
        this.results.passed.push(`High vulnerabilities: ${high}`);
      } else {
        console.log(`  ❌ High vulnerabilities: ${high} (> ${THRESHOLDS.security.maxHighVulnerabilities})`);
        this.results.failed.push(`Too many high vulnerabilities: ${high}`);
        passed = false;
      }

      if (moderate <= THRESHOLDS.security.maxModerateVulnerabilities) {
        console.log(`  ✅ Moderate vulnerabilities: ${moderate} (<= ${THRESHOLDS.security.maxModerateVulnerabilities})`);
        this.results.passed.push(`Moderate vulnerabilities: ${moderate}`);
      } else {
        console.log(`  ⚠️  Moderate vulnerabilities: ${moderate} (> ${THRESHOLDS.security.maxModerateVulnerabilities})`);
        this.results.warnings.push(`Moderate vulnerabilities detected: ${moderate}`);
      }

      return passed;
    } catch (error) {
      console.log('  ⚠️  Error checking security:', error.message);
      this.results.warnings.push(`Security check skipped: ${error.message}`);
      return true;
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('QUALITY GATE SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ PASSED CHECKS:');
    this.results.passed.forEach(item => console.log(`  • ${item}`));

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(item => console.log(`  • ${item}`));
    }

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.results.failed.forEach(item => console.log(`  • ${item}`));
    }

    console.log('\n' + '='.repeat(60));

    if (this.results.failed.length === 0) {
      console.log('✅ QUALITY GATE PASSED - Ready for deployment');
      console.log('='.repeat(60) + '\n');
      return true;
    } else {
      console.log('❌ QUALITY GATE FAILED - Fix issues before deployment');
      console.log('='.repeat(60) + '\n');
      return false;
    }
  }

  /**
   * Run all quality checks
   */
  async run() {
    console.log('🚦 Running Quality Gate Checks...\n');

    const checks = [
      this.checkCoverage(),
      this.checkBundleSize(),
      this.checkPerformance(),
      this.checkSecurity(),
    ];

    const allPassed = checks.every(check => check);
    const reportPassed = this.generateReport();

    process.exit(reportPassed ? 0 : 1);
  }
}

// Run quality gate
const gate = new QualityGate();
gate.run().catch(error => {
  console.error('Fatal error running quality gate:', error);
  process.exit(1);
});
