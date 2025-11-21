/**
 * Lighthouse Performance Audit Script
 * Validates production performance meets requirements
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface LighthouseResult {
  lhr: {
    finalUrl: string;
    fetchTime: string;
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: {
      [key: string]: {
        score: number;
        numericValue?: number;
        displayValue?: string;
      };
    };
  };
}

async function runLighthouseAudit(url: string): Promise<void> {
  console.log('🚀 Starting Lighthouse audit...');
  console.log(`Target URL: ${url}`);

  try {
    // Import lighthouse dynamically
    const lighthouse = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');

    // Launch Chrome
    console.log('⚙️  Launching Chrome...');
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless'],
    });

    // Run Lighthouse
    console.log('📊 Running Lighthouse analysis...');
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    };

    const runnerResult = await lighthouse.default(url, options);

    if (!runnerResult) {
      throw new Error('Lighthouse returned no results');
    }

    const result = runnerResult as LighthouseResult;

    // Kill Chrome
    await chrome.kill();

    // Extract scores
    const scores = {
      performance: Math.round((result.lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((result.lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((result.lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((result.lhr.categories.seo?.score || 0) * 100),
    };

    // Extract Core Web Vitals
    const metrics = {
      fcp: result.lhr.audits['first-contentful-paint']?.numericValue || 0,
      lcp: result.lhr.audits['largest-contentful-paint']?.numericValue || 0,
      tbt: result.lhr.audits['total-blocking-time']?.numericValue || 0,
      cls: result.lhr.audits['cumulative-layout-shift']?.numericValue || 0,
      si: result.lhr.audits['speed-index']?.numericValue || 0,
    };

    // Display results
    console.log('\n📈 Lighthouse Scores:');
    console.log(`  Performance:    ${scores.performance}/100 ${getScoreEmoji(scores.performance)}`);
    console.log(`  Accessibility:  ${scores.accessibility}/100 ${getScoreEmoji(scores.accessibility)}`);
    console.log(`  Best Practices: ${scores.bestPractices}/100 ${getScoreEmoji(scores.bestPractices)}`);
    console.log(`  SEO:            ${scores.seo}/100 ${getScoreEmoji(scores.seo)}`);

    console.log('\n⏱️  Core Web Vitals:');
    console.log(`  FCP: ${Math.round(metrics.fcp)}ms ${getMetricStatus(metrics.fcp, 1500)}`);
    console.log(`  LCP: ${Math.round(metrics.lcp)}ms ${getMetricStatus(metrics.lcp, 2500)}`);
    console.log(`  TBT: ${Math.round(metrics.tbt)}ms ${getMetricStatus(metrics.tbt, 200)}`);
    console.log(`  CLS: ${metrics.cls.toFixed(3)} ${getMetricStatus(metrics.cls, 0.1)}`);
    console.log(`  SI:  ${Math.round(metrics.si)}ms`);

    // Check thresholds
    const passed = scores.performance >= 85;
    console.log('\n' + (passed ? '✅ PASSED' : '❌ FAILED'));
    console.log(`Performance threshold: 85 (got ${scores.performance})`);

    // Save detailed report
    const reportPath = join(process.cwd(), 'lighthouse-report.json');
    writeFileSync(reportPath, JSON.stringify(result.lhr, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      url: result.lhr.finalUrl,
      scores,
      metrics,
      passed,
      recommendations: generateRecommendations(scores, metrics),
    };

    const summaryPath = join(process.cwd(), 'lighthouse-summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary saved to: ${summaryPath}`);

    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error);
    process.exit(1);
  }
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

function getMetricStatus(value: number, threshold: number): string {
  return value <= threshold ? '✅' : '⚠️';
}

function generateRecommendations(
  scores: Record<string, number>,
  metrics: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (scores.performance < 85) {
    recommendations.push('Performance is below threshold (85)');

    if (metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and lazy loading');
    }

    if (metrics.tbt > 200) {
      recommendations.push('Reduce Total Blocking Time - minimize JavaScript execution');
    }

    if (metrics.cls > 0.1) {
      recommendations.push('Improve Cumulative Layout Shift - reserve space for dynamic content');
    }
  }

  if (scores.accessibility < 90) {
    recommendations.push('Improve accessibility - check ARIA labels and keyboard navigation');
  }

  if (scores.bestPractices < 90) {
    recommendations.push('Review best practices - check console errors and HTTPS usage');
  }

  if (scores.seo < 90) {
    recommendations.push('Enhance SEO - verify meta tags and structured data');
  }

  return recommendations;
}

// Run audit
const url = process.argv[2] || process.env.VERCEL_URL || 'http://localhost:3000';
runLighthouseAudit(url);
