#!/usr/bin/env tsx
/**
 * Generate Cost Report Script
 *
 * Generates a comprehensive cost report for the LAB Visualization Platform.
 * Can be run manually or scheduled as a cron job.
 *
 * Usage:
 *   npm run cost-report
 *   npm run cost-report -- --format json
 *   npm run cost-report -- --period 7d --output ./reports/cost-report.json
 */

import { costTrackingService } from '../src/services/cost-tracking';
import {
  generateCostAlerts,
  generateOptimizationRecommendations,
  calculateFeatureCosts,
  projectCosts,
  formatCurrency,
  formatPercent,
} from '../src/lib/cost-calculator';
import { COST_BUDGETS } from '../config/cost-budgets';
import { TimeRange } from '../src/types/cost-tracking';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ReportOptions {
  format: 'text' | 'json' | 'markdown';
  period: TimeRange;
  output?: string;
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ReportOptions {
  const args = process.argv.slice(2);
  const options: ReportOptions = {
    format: 'text',
    period: '30d',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
      case '-f':
        options.format = args[++i] as 'text' | 'json' | 'markdown';
        break;
      case '--period':
      case '-p':
        options.period = args[++i] as TimeRange;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Cost Report Generator

Usage:
  npm run cost-report [options]

Options:
  -f, --format <type>    Output format: text, json, markdown (default: text)
  -p, --period <range>   Time period: 24h, 7d, 30d, 90d (default: 30d)
  -o, --output <path>    Output file path (default: stdout)
  -v, --verbose          Verbose output
  -h, --help             Show this help message

Examples:
  npm run cost-report
  npm run cost-report -- --format json --output ./reports/cost.json
  npm run cost-report -- --period 7d --verbose
  `);
}

/**
 * Generate text format report
 */
function generateTextReport(data: any): string {
  const { summary, alerts, recommendations, featureCosts, projection } = data;

  let report = '';

  // Header
  report += '═'.repeat(80) + '\n';
  report += '  LAB VISUALIZATION PLATFORM - COST REPORT\n';
  report += '═'.repeat(80) + '\n';
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Period: ${data.period}\n`;
  report += '\n';

  // Summary
  report += '─'.repeat(80) + '\n';
  report += 'COST SUMMARY\n';
  report += '─'.repeat(80) + '\n';
  report += `Total Current Cost:        ${formatCurrency(summary.total.current)}\n`;
  report += `Projected Monthly Cost:    ${formatCurrency(summary.total.projected)}\n`;
  report += `Monthly Budget:            ${formatCurrency(summary.total.budget)}\n`;
  report += `Budget Utilization:        ${formatPercent(summary.total.percentOfBudget)}\n`;
  report += `Cost Per User:             ${formatCurrency(summary.users.costPerUser, 3)}\n`;
  report += `Active Users:              ${summary.users.activeUsers.toLocaleString()}\n`;
  report += '\n';

  // Service Breakdown
  report += '─'.repeat(80) + '\n';
  report += 'SERVICE BREAKDOWN\n';
  report += '─'.repeat(80) + '\n';
  report += `Vercel:                    ${formatCurrency(summary.vercel.total)}\n`;
  report += `  Bandwidth:               ${summary.vercel.bandwidth.used.toFixed(1)} GB (${formatCurrency(summary.vercel.bandwidth.cost)})\n`;
  report += `  Functions:               ${summary.vercel.functions.invocations.toLocaleString()} (${formatCurrency(summary.vercel.functions.cost)})\n`;
  report += `  Builds:                  ${summary.vercel.builds.count} (${formatCurrency(summary.vercel.builds.cost)})\n`;
  report += '\n';
  report += `Supabase:                  ${formatCurrency(summary.supabase.total)}\n`;
  report += `  Database:                ${summary.supabase.database.size.toFixed(1)} GB (${formatCurrency(summary.supabase.database.cost)})\n`;
  report += `  Storage:                 ${summary.supabase.storage.size.toFixed(1)} GB (${formatCurrency(summary.supabase.storage.cost)})\n`;
  report += `  Connections:             ${summary.supabase.realtimeConnections.concurrent} (${formatCurrency(summary.supabase.realtimeConnections.cost)})\n`;
  report += '\n';
  report += `Simulations:               ${formatCurrency(summary.simulations.costs.total)}\n`;
  report += `  Total Jobs:              ${summary.simulations.jobs.total.toLocaleString()}\n`;
  report += `  Avg Cost/Job:            ${formatCurrency(summary.simulations.costs.perJob.avg)}\n`;
  report += `  Cache Hit Rate:          ${formatPercent(summary.simulations.caching.hitRate)}\n`;
  report += `  Cache Savings:           ${formatCurrency(summary.simulations.caching.savedCost)}\n`;
  report += '\n';

  // Projection
  if (projection) {
    report += '─'.repeat(80) + '\n';
    report += 'COST PROJECTION\n';
    report += '─'.repeat(80) + '\n';
    report += `Projected Monthly Cost:    ${formatCurrency(projection.projected)}\n`;
    report += `Confidence Level:          ${projection.confidence}%\n`;
    report += `Trend:                     ${projection.basedOn.trend}\n`;
    report += `Based on:                  ${projection.basedOn.days} days of data\n`;
    report += '\n';
  }

  // Alerts
  if (alerts.length > 0) {
    report += '─'.repeat(80) + '\n';
    report += 'ACTIVE ALERTS\n';
    report += '─'.repeat(80) + '\n';
    alerts.forEach((alert: any) => {
      const icon = alert.severity === 'critical' ? '🔴' : '⚠️ ';
      report += `${icon} [${alert.severity.toUpperCase()}] ${alert.category}\n`;
      report += `   ${alert.message}\n`;
      report += `   Timestamp: ${alert.timestamp.toLocaleString()}\n`;
      report += '\n';
    });
  }

  // Feature Costs
  report += '─'.repeat(80) + '\n';
  report += 'COST BY FEATURE\n';
  report += '─'.repeat(80) + '\n';
  featureCosts.forEach((feature: any) => {
    report += `${feature.feature.padEnd(30)} ${formatCurrency(feature.cost).padStart(10)} (${formatPercent(feature.percentOfTotal).padStart(6)})\n`;
  });
  report += '\n';

  // Recommendations
  if (recommendations.length > 0) {
    report += '─'.repeat(80) + '\n';
    report += 'OPTIMIZATION RECOMMENDATIONS\n';
    report += '─'.repeat(80) + '\n';
    recommendations.slice(0, 5).forEach((rec: any, i: number) => {
      report += `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}\n`;
      report += `   ${rec.description}\n`;
      report += `   Estimated Savings: ${formatCurrency(rec.estimatedSavings)}/month\n`;
      report += '\n';
    });
  }

  // Footer
  report += '═'.repeat(80) + '\n';
  report += 'End of Report\n';
  report += '═'.repeat(80) + '\n';

  return report;
}

/**
 * Generate markdown format report
 */
function generateMarkdownReport(data: any): string {
  const { summary, alerts, recommendations, featureCosts, projection } = data;

  let report = '';

  // Header
  report += '# LAB Visualization Platform - Cost Report\n\n';
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Period:** ${data.period}\n\n`;

  // Summary
  report += '## Cost Summary\n\n';
  report += '| Metric | Value |\n';
  report += '|--------|-------|\n';
  report += `| Total Current Cost | ${formatCurrency(summary.total.current)} |\n`;
  report += `| Projected Monthly Cost | ${formatCurrency(summary.total.projected)} |\n`;
  report += `| Monthly Budget | ${formatCurrency(summary.total.budget)} |\n`;
  report += `| Budget Utilization | ${formatPercent(summary.total.percentOfBudget)} |\n`;
  report += `| Cost Per User | ${formatCurrency(summary.users.costPerUser, 3)} |\n`;
  report += `| Active Users | ${summary.users.activeUsers.toLocaleString()} |\n\n`;

  // Service Breakdown
  report += '## Service Breakdown\n\n';
  report += '### Vercel\n\n';
  report += `**Total:** ${formatCurrency(summary.vercel.total)}\n\n`;
  report += `- Bandwidth: ${summary.vercel.bandwidth.used.toFixed(1)} GB (${formatCurrency(summary.vercel.bandwidth.cost)})\n`;
  report += `- Functions: ${summary.vercel.functions.invocations.toLocaleString()} invocations (${formatCurrency(summary.vercel.functions.cost)})\n`;
  report += `- Builds: ${summary.vercel.builds.count} builds (${formatCurrency(summary.vercel.builds.cost)})\n\n`;

  report += '### Supabase\n\n';
  report += `**Total:** ${formatCurrency(summary.supabase.total)}\n\n`;
  report += `- Database: ${summary.supabase.database.size.toFixed(1)} GB (${formatCurrency(summary.supabase.database.cost)})\n`;
  report += `- Storage: ${summary.supabase.storage.size.toFixed(1)} GB (${formatCurrency(summary.supabase.storage.cost)})\n`;
  report += `- Realtime Connections: ${summary.supabase.realtimeConnections.concurrent} concurrent (${formatCurrency(summary.supabase.realtimeConnections.cost)})\n\n`;

  report += '### Simulations\n\n';
  report += `**Total:** ${formatCurrency(summary.simulations.costs.total)}\n\n`;
  report += `- Total Jobs: ${summary.simulations.jobs.total.toLocaleString()}\n`;
  report += `- Average Cost per Job: ${formatCurrency(summary.simulations.costs.perJob.avg)}\n`;
  report += `- Cache Hit Rate: ${formatPercent(summary.simulations.caching.hitRate)}\n`;
  report += `- Savings from Cache: ${formatCurrency(summary.simulations.caching.savedCost)}\n\n`;

  // Projection
  if (projection) {
    report += '## Cost Projection\n\n';
    report += `- **Projected Monthly Cost:** ${formatCurrency(projection.projected)}\n`;
    report += `- **Confidence:** ${projection.confidence}%\n`;
    report += `- **Trend:** ${projection.basedOn.trend}\n`;
    report += `- **Data Period:** ${projection.basedOn.days} days\n\n`;
  }

  // Alerts
  if (alerts.length > 0) {
    report += '## Active Alerts\n\n';
    alerts.forEach((alert: any) => {
      const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
      report += `### ${icon} ${alert.category} - ${alert.severity.toUpperCase()}\n\n`;
      report += `${alert.message}\n\n`;
      report += `*Timestamp: ${alert.timestamp.toLocaleString()}*\n\n`;
    });
  }

  // Feature Costs
  report += '## Cost by Feature\n\n';
  report += '| Feature | Cost | % of Total |\n';
  report += '|---------|------|------------|\n';
  featureCosts.forEach((feature: any) => {
    report += `| ${feature.feature} | ${formatCurrency(feature.cost)} | ${formatPercent(feature.percentOfTotal)} |\n`;
  });
  report += '\n';

  // Recommendations
  if (recommendations.length > 0) {
    report += '## Optimization Recommendations\n\n';
    recommendations.slice(0, 5).forEach((rec: any, i: number) => {
      report += `### ${i + 1}. ${rec.title}\n\n`;
      report += `**Priority:** ${rec.priority.toUpperCase()}\n\n`;
      report += `**Estimated Savings:** ${formatCurrency(rec.estimatedSavings)}/month\n\n`;
      report += `${rec.description}\n\n`;
    });
  }

  return report;
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  if (options.verbose) {
    console.log('Generating cost report...');
    console.log('Options:', options);
  }

  try {
    // Fetch data
    if (options.verbose) console.log('Fetching cost data...');
    const summary = await costTrackingService.getCostSummary();
    const trends = await costTrackingService.getCostTrends(options.period);
    const structures = await costTrackingService.getPopularStructures(20);

    // Generate derived data
    if (options.verbose) console.log('Generating alerts and recommendations...');
    const alerts = generateCostAlerts(summary);
    const recommendations = generateOptimizationRecommendations(summary, structures);
    const featureCosts = calculateFeatureCosts(summary);
    const projection = projectCosts(trends, 'monthly', 'moderate');

    const reportData = {
      period: options.period,
      summary,
      trends,
      alerts,
      recommendations,
      featureCosts,
      projection,
      structures,
      generatedAt: new Date(),
    };

    // Generate report in requested format
    let output: string;
    switch (options.format) {
      case 'json':
        output = JSON.stringify(reportData, null, 2);
        break;
      case 'markdown':
        output = generateMarkdownReport(reportData);
        break;
      case 'text':
      default:
        output = generateTextReport(reportData);
        break;
    }

    // Output report
    if (options.output) {
      if (options.verbose) console.log(`Writing report to ${options.output}...`);
      writeFileSync(options.output, output, 'utf-8');
      console.log(`Report saved to: ${options.output}`);
    } else {
      console.log(output);
    }

    // Exit with appropriate code
    const hasAlerts = alerts.some((a: any) => a.severity === 'critical');
    process.exit(hasAlerts ? 1 : 0);
  } catch (error) {
    console.error('Error generating cost report:', error);
    process.exit(1);
  }
}

// Run main function
main();
