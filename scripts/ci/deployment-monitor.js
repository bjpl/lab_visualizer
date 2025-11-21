#!/usr/bin/env node

/**
 * Deployment Monitoring Script
 * Monitors deployment metrics and alerts on anomalies
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MONITOR_DURATION = parseInt(process.env.MONITOR_DURATION || '300000'); // 5 minutes
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '30000'); // 30 seconds
const ERROR_THRESHOLD = parseFloat(process.env.ERROR_THRESHOLD || '0.01'); // 1%

class DeploymentMonitor {
  constructor() {
    this.checks = [];
    this.errors = 0;
    this.totalChecks = 0;
    this.startTime = Date.now();
    this.responseTimes = [];
  }

  /**
   * Make HTTP request
   */
  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const startTime = Date.now();

      const request = protocol.get(url, { timeout: 10000 }, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            timestamp: new Date().toISOString(),
            success: res.statusCode >= 200 && res.statusCode < 400,
          });
        });
      });

      request.on('error', error => {
        reject({
          error: error.message,
          timestamp: new Date().toISOString(),
          success: false,
        });
      });

      request.on('timeout', () => {
        request.destroy();
        reject({
          error: 'Request timeout',
          timestamp: new Date().toISOString(),
          success: false,
        });
      });
    });
  }

  /**
   * Perform health check
   */
  async performCheck() {
    this.totalChecks++;

    try {
      const result = await this.makeRequest(BASE_URL);

      this.checks.push(result);

      if (result.success) {
        this.responseTimes.push(result.responseTime);
        console.log(`✅ Check ${this.totalChecks}: ${result.statusCode} (${result.responseTime}ms)`);
      } else {
        this.errors++;
        console.log(`❌ Check ${this.totalChecks}: ${result.statusCode}`);
      }
    } catch (error) {
      this.errors++;
      this.checks.push(error);
      console.log(`❌ Check ${this.totalChecks}: ${error.error || error.message}`);
    }
  }

  /**
   * Calculate statistics
   */
  calculateStats() {
    if (this.responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avgResponseTime: Math.round(
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      ),
      minResponseTime: Math.min(...this.responseTimes),
      maxResponseTime: Math.max(...this.responseTimes),
      p95ResponseTime: sorted[p95Index] || 0,
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const errorRate = this.totalChecks > 0 ? (this.errors / this.totalChecks) : 0;
    const stats = this.calculateStats();

    console.log('\n' + '='.repeat(70));
    console.log('DEPLOYMENT MONITORING REPORT');
    console.log('='.repeat(70));

    console.log('\n📊 SUMMARY:');
    console.log(`  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`  Total Checks: ${this.totalChecks}`);
    console.log(`  Successful: ${this.totalChecks - this.errors}`);
    console.log(`  Failed: ${this.errors}`);
    console.log(`  Error Rate: ${(errorRate * 100).toFixed(2)}%`);

    console.log('\n⚡ PERFORMANCE:');
    console.log(`  Avg Response Time: ${stats.avgResponseTime}ms`);
    console.log(`  Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`  Max Response Time: ${stats.maxResponseTime}ms`);
    console.log(`  P95 Response Time: ${stats.p95ResponseTime}ms`);

    console.log('\n🎯 HEALTH STATUS:');

    let healthy = true;
    const issues = [];

    // Check error rate
    if (errorRate > ERROR_THRESHOLD) {
      console.log(`  ❌ Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(ERROR_THRESHOLD * 100).toFixed(2)}%`);
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      healthy = false;
    } else {
      console.log(`  ✅ Error rate ${(errorRate * 100).toFixed(2)}% within threshold`);
    }

    // Check response time
    if (stats.p95ResponseTime > 3000) {
      console.log(`  ⚠️  P95 response time ${stats.p95ResponseTime}ms is high`);
      issues.push(`Slow P95 response time: ${stats.p95ResponseTime}ms`);
    } else {
      console.log(`  ✅ P95 response time ${stats.p95ResponseTime}ms is acceptable`);
    }

    // Check availability
    const availability = ((this.totalChecks - this.errors) / this.totalChecks) * 100;
    if (availability < 99) {
      console.log(`  ❌ Availability ${availability.toFixed(2)}% below 99%`);
      issues.push(`Low availability: ${availability.toFixed(2)}%`);
      healthy = false;
    } else {
      console.log(`  ✅ Availability ${availability.toFixed(2)}% meets target`);
    }

    console.log('\n' + '='.repeat(70));

    if (healthy) {
      console.log('✅ DEPLOYMENT HEALTHY - No issues detected');
      console.log('='.repeat(70) + '\n');
      return { healthy: true, issues: [] };
    } else {
      console.log('⚠️  DEPLOYMENT ISSUES DETECTED:');
      issues.forEach(issue => console.log(`  • ${issue}`));
      console.log('='.repeat(70) + '\n');
      return { healthy: false, issues };
    }
  }

  /**
   * Run monitoring
   */
  async run() {
    console.log(`🔍 Starting deployment monitoring for ${BASE_URL}`);
    console.log(`📅 Duration: ${MONITOR_DURATION / 1000}s`);
    console.log(`⏱️  Check interval: ${CHECK_INTERVAL / 1000}s`);
    console.log(`🎯 Error threshold: ${(ERROR_THRESHOLD * 100).toFixed(2)}%\n`);

    // Perform initial check
    await this.performCheck();

    // Start monitoring interval
    const intervalId = setInterval(async () => {
      await this.performCheck();
    }, CHECK_INTERVAL);

    // Stop monitoring after duration
    setTimeout(() => {
      clearInterval(intervalId);

      const report = this.generateReport();

      // Exit with appropriate code
      process.exit(report.healthy ? 0 : 1);
    }, MONITOR_DURATION);
  }
}

// Run monitor
const monitor = new DeploymentMonitor();
monitor.run().catch(error => {
  console.error('Fatal error running deployment monitor:', error);
  process.exit(1);
});
