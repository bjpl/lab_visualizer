#!/usr/bin/env node

/**
 * Security Scan Report Generator
 * Analyzes npm audit results and generates actionable reports
 */

const fs = require('fs');
const path = require('path');

class SecurityScanner {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      vulnerabilities: {
        critical: [],
        high: [],
        moderate: [],
        low: [],
      },
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      },
      recommendations: [],
    };
  }

  /**
   * Parse npm audit JSON report
   */
  parseAuditReport() {
    try {
      const auditPath = path.join(process.cwd(), 'audit-report.json');

      if (!fs.existsSync(auditPath)) {
        console.log('⚠️  No audit report found. Run: npm audit --json > audit-report.json');
        return false;
      }

      const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

      if (!audit.vulnerabilities) {
        console.log('✅ No vulnerabilities found');
        return true;
      }

      // Parse vulnerabilities
      for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities)) {
        const vuln = {
          package: packageName,
          severity: vulnerability.severity,
          title: vulnerability.via[0]?.title || 'Unknown',
          range: vulnerability.range,
          fixAvailable: vulnerability.fixAvailable,
        };

        this.report.vulnerabilities[vulnerability.severity].push(vuln);
        this.report.summary[vulnerability.severity]++;
        this.report.summary.total++;
      }

      return true;
    } catch (error) {
      console.error('❌ Error parsing audit report:', error.message);
      return false;
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const { summary, vulnerabilities } = this.report;

    // Critical and high vulnerabilities
    if (summary.critical > 0 || summary.high > 0) {
      this.report.recommendations.push({
        priority: 'HIGH',
        action: 'Immediately update or replace packages with critical/high vulnerabilities',
        packages: [
          ...vulnerabilities.critical.map(v => v.package),
          ...vulnerabilities.high.map(v => v.package),
        ],
      });
    }

    // Moderate vulnerabilities
    if (summary.moderate > 5) {
      this.report.recommendations.push({
        priority: 'MEDIUM',
        action: 'Plan to address moderate vulnerabilities in next sprint',
        packages: vulnerabilities.moderate.map(v => v.package),
      });
    }

    // General recommendations
    if (summary.total > 0) {
      this.report.recommendations.push({
        priority: 'LOW',
        action: 'Run `npm audit fix` to automatically fix vulnerabilities',
      });

      this.report.recommendations.push({
        priority: 'LOW',
        action: 'Consider using automated dependency update tools like Dependabot or Renovate',
      });
    }
  }

  /**
   * Print report to console
   */
  printReport() {
    const { summary, vulnerabilities, recommendations } = this.report;

    console.log('\n' + '='.repeat(70));
    console.log('🔒 SECURITY SCAN REPORT');
    console.log('='.repeat(70));

    console.log('\n📊 SUMMARY:');
    console.log(`  Total Vulnerabilities: ${summary.total}`);
    console.log(`  🔴 Critical: ${summary.critical}`);
    console.log(`  🟠 High: ${summary.high}`);
    console.log(`  🟡 Moderate: ${summary.moderate}`);
    console.log(`  🟢 Low: ${summary.low}`);

    if (summary.critical > 0) {
      console.log('\n🔴 CRITICAL VULNERABILITIES:');
      vulnerabilities.critical.forEach(v => {
        console.log(`  • ${v.package}: ${v.title}`);
        console.log(`    Range: ${v.range}`);
        console.log(`    Fix available: ${v.fixAvailable ? 'Yes' : 'No'}`);
      });
    }

    if (summary.high > 0) {
      console.log('\n🟠 HIGH VULNERABILITIES:');
      vulnerabilities.high.forEach(v => {
        console.log(`  • ${v.package}: ${v.title}`);
        console.log(`    Range: ${v.range}`);
        console.log(`    Fix available: ${v.fixAvailable ? 'Yes' : 'No'}`);
      });
    }

    if (recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach(rec => {
        console.log(`  [${rec.priority}] ${rec.action}`);
        if (rec.packages) {
          console.log(`    Affected packages: ${rec.packages.slice(0, 5).join(', ')}${rec.packages.length > 5 ? '...' : ''}`);
        }
      });
    }

    console.log('\n' + '='.repeat(70));

    if (summary.critical > 0 || summary.high > 0) {
      console.log('❌ SECURITY SCAN FAILED - Critical or high vulnerabilities found');
      console.log('='.repeat(70) + '\n');
      return false;
    } else if (summary.moderate > 5) {
      console.log('⚠️  SECURITY SCAN WARNING - Multiple moderate vulnerabilities found');
      console.log('='.repeat(70) + '\n');
      return true;
    } else {
      console.log('✅ SECURITY SCAN PASSED - No critical issues found');
      console.log('='.repeat(70) + '\n');
      return true;
    }
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportPath = path.join(process.cwd(), 'security-scan-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
  }

  /**
   * Run security scan
   */
  async run() {
    console.log('🔒 Running Security Scan...\n');

    const parsed = this.parseAuditReport();

    if (!parsed) {
      console.log('❌ Failed to parse audit report');
      process.exit(1);
    }

    this.generateRecommendations();
    this.saveReport();
    const passed = this.printReport();

    // Exit with appropriate code
    // Note: We don't fail on moderate vulnerabilities, only critical/high
    process.exit(passed ? 0 : 1);
  }
}

// Run scanner
const scanner = new SecurityScanner();
scanner.run().catch(error => {
  console.error('Fatal error running security scan:', error);
  process.exit(1);
});
