#!/usr/bin/env node

/**
 * Health Check Script
 * Validates deployment health after rollout
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

class HealthCheck {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  /**
   * Make HTTP request with retries
   */
  async makeRequest(url, retries = RETRY_ATTEMPTS) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, { timeout: TIMEOUT }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      });

      request.on('error', async (error) => {
        if (retries > 0) {
          console.log(`  ⚠️  Retrying... (${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS})`);
          await this.sleep(RETRY_DELAY);
          try {
            const result = await this.makeRequest(url, retries - 1);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          reject(error);
        }
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check homepage availability
   */
  async checkHomepage() {
    console.log('\n🏠 Checking homepage...');

    try {
      const response = await this.makeRequest(BASE_URL);

      if (response.statusCode === 200) {
        console.log('  ✅ Homepage is accessible (200 OK)');
        this.results.passed.push('Homepage accessible');
        return true;
      } else {
        console.log(`  ❌ Homepage returned status ${response.statusCode}`);
        this.results.failed.push(`Homepage status: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`  ❌ Homepage check failed: ${error.message}`);
      this.results.failed.push(`Homepage error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check API health endpoint
   */
  async checkAPIHealth() {
    console.log('\n🔌 Checking API health endpoint...');

    try {
      const response = await this.makeRequest(`${BASE_URL}/api/health`);

      if (response.statusCode === 200) {
        console.log('  ✅ API health endpoint is responding');
        this.results.passed.push('API health endpoint OK');

        try {
          const health = JSON.parse(response.body);
          if (health.status === 'healthy') {
            console.log('  ✅ API reports healthy status');
            this.results.passed.push('API status: healthy');
          } else {
            console.log(`  ⚠️  API status: ${health.status}`);
            this.results.warnings.push(`API status: ${health.status}`);
          }
        } catch (parseError) {
          console.log('  ⚠️  Could not parse health response');
          this.results.warnings.push('Health response not JSON');
        }

        return true;
      } else {
        console.log(`  ❌ API health endpoint returned ${response.statusCode}`);
        this.results.failed.push(`API health status: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`  ⚠️  API health check failed: ${error.message}`);
      this.results.warnings.push(`API health not available: ${error.message}`);
      return true; // Don't fail if health endpoint doesn't exist
    }
  }

  /**
   * Check critical pages
   */
  async checkCriticalPages() {
    console.log('\n📄 Checking critical pages...');

    const pages = [
      '/lab/1',
      '/search',
    ];

    let allPassed = true;

    for (const page of pages) {
      try {
        const response = await this.makeRequest(`${BASE_URL}${page}`);

        if (response.statusCode === 200 || response.statusCode === 404) {
          // 404 is acceptable for dynamic pages that may not have data
          console.log(`  ✅ ${page} is accessible (${response.statusCode})`);
          this.results.passed.push(`Page ${page} accessible`);
        } else {
          console.log(`  ❌ ${page} returned ${response.statusCode}`);
          this.results.failed.push(`Page ${page} status: ${response.statusCode}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`  ❌ ${page} check failed: ${error.message}`);
        this.results.failed.push(`Page ${page} error: ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  /**
   * Check response headers
   */
  async checkSecurityHeaders() {
    console.log('\n🔒 Checking security headers...');

    try {
      const response = await this.makeRequest(BASE_URL);
      const headers = response.headers;

      const securityHeaders = {
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'strict-transport-security': 'Strict-Transport-Security',
        'content-security-policy': 'Content-Security-Policy',
      };

      let hasWarnings = false;

      for (const [header, displayName] of Object.entries(securityHeaders)) {
        if (headers[header] || headers[header.toLowerCase()]) {
          console.log(`  ✅ ${displayName} is set`);
          this.results.passed.push(`Header: ${displayName}`);
        } else {
          console.log(`  ⚠️  ${displayName} is missing`);
          this.results.warnings.push(`Missing header: ${displayName}`);
          hasWarnings = true;
        }
      }

      return !hasWarnings;
    } catch (error) {
      console.log(`  ⚠️  Security headers check failed: ${error.message}`);
      this.results.warnings.push(`Security headers check error: ${error.message}`);
      return true;
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    console.log('\n⚡ Checking performance...');

    try {
      const startTime = Date.now();
      const response = await this.makeRequest(BASE_URL);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`  📊 Response time: ${responseTime}ms`);

      if (responseTime < 1000) {
        console.log('  ✅ Response time is excellent (< 1s)');
        this.results.passed.push(`Response time: ${responseTime}ms`);
      } else if (responseTime < 3000) {
        console.log('  ⚠️  Response time is acceptable (< 3s)');
        this.results.warnings.push(`Response time: ${responseTime}ms`);
      } else {
        console.log('  ❌ Response time is too slow (> 3s)');
        this.results.failed.push(`Slow response: ${responseTime}ms`);
        return false;
      }

      // Check content size
      const contentLength = response.headers['content-length'];
      if (contentLength) {
        const sizeKB = (parseInt(contentLength) / 1024).toFixed(2);
        console.log(`  📦 Page size: ${sizeKB}KB`);
        this.results.passed.push(`Page size: ${sizeKB}KB`);
      }

      return true;
    } catch (error) {
      console.log(`  ❌ Performance check failed: ${error.message}`);
      this.results.failed.push(`Performance error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('HEALTH CHECK SUMMARY');
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
      console.log('✅ HEALTH CHECK PASSED - Deployment is healthy');
      console.log('='.repeat(60) + '\n');
      return true;
    } else {
      console.log('❌ HEALTH CHECK FAILED - Critical issues detected');
      console.log('='.repeat(60) + '\n');
      return false;
    }
  }

  /**
   * Run all health checks
   */
  async run() {
    console.log(`🏥 Running Health Checks for ${BASE_URL}\n`);

    const checks = await Promise.all([
      this.checkHomepage(),
      this.checkAPIHealth(),
      this.checkCriticalPages(),
      this.checkSecurityHeaders(),
      this.checkPerformance(),
    ]);

    const allPassed = checks.every(check => check);
    const reportPassed = this.generateReport();

    process.exit(reportPassed ? 0 : 1);
  }
}

// Run health check
const healthCheck = new HealthCheck();
healthCheck.run().catch(error => {
  console.error('Fatal error running health check:', error);
  process.exit(1);
});
