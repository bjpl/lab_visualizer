# CI/CD Scripts

This directory contains automation scripts for the CI/CD pipeline.

## Scripts Overview

### Quality Gate (`quality-gate.js`)

Enforces quality standards before deployment.

**Usage:**
```bash
npm run ci:quality-gate
```

**Checks:**
- Test coverage (≥75% for all metrics)
- Bundle size (≤500KB total, ≤250KB per chunk)
- Lighthouse performance scores (≥85)
- Security vulnerabilities (0 critical/high)

**Exit Codes:**
- `0`: All checks passed
- `1`: One or more checks failed

**Example Output:**
```
🚦 Running Quality Gate Checks...

📊 Checking test coverage...
  ✅ Lines: 78.50% (>= 75%)
  ✅ Statements: 79.20% (>= 75%)
  ✅ Functions: 76.30% (>= 75%)
  ✅ Branches: 75.10% (>= 75%)

📦 Checking bundle size...
  ✅ Total bundle size: 387.23KB (<= 500KB)
  ✅ Largest chunk: 198.45KB (<= 250KB)

✅ QUALITY GATE PASSED - Ready for deployment
```

### Health Check (`health-check.js`)

Validates deployment health after rollout.

**Usage:**
```bash
BASE_URL=https://your-app.vercel.app npm run ci:health-check
```

**Checks:**
- Homepage accessibility (200 OK)
- API health endpoint response
- Critical pages load correctly
- Security headers present
- Response time (<3s)
- Content size

**Retry Logic:**
- 3 retry attempts with 2s delay
- 10s timeout per request

**Example Output:**
```
🏥 Running Health Checks for https://lab-visualizer.vercel.app

🏠 Checking homepage...
  ✅ Homepage is accessible (200 OK)

🔌 Checking API health endpoint...
  ✅ API health endpoint is responding
  ✅ API reports healthy status

📄 Checking critical pages...
  ✅ /lab/1 is accessible (200)
  ✅ /search is accessible (200)

🔒 Checking security headers...
  ✅ X-Frame-Options is set
  ✅ X-Content-Type-Options is set
  ⚠️  Strict-Transport-Security is missing

⚡ Checking performance...
  📊 Response time: 856ms
  ✅ Response time is excellent (< 1s)
  📦 Page size: 45.23KB

✅ HEALTH CHECK PASSED - Deployment is healthy
```

### Security Scan (`security-scan.js`)

Analyzes npm audit results and generates actionable reports.

**Usage:**
```bash
# Generate audit report first
npm audit --json > audit-report.json

# Run security scan
npm run security:scan
```

**Features:**
- Parses npm audit JSON output
- Categorizes vulnerabilities by severity
- Generates fix recommendations
- Creates detailed security report

**Thresholds:**
- Critical: 0 allowed (fails)
- High: 0 allowed (fails)
- Moderate: ≤5 allowed (warning)

**Example Output:**
```
🔒 Running Security Scan...

📊 SUMMARY:
  Total Vulnerabilities: 3
  🔴 Critical: 0
  🟠 High: 0
  🟡 Moderate: 2
  🟢 Low: 1

🟡 MODERATE VULNERABILITIES:
  • lodash: Prototype Pollution
    Range: <4.17.21
    Fix available: Yes

💡 RECOMMENDATIONS:
  [LOW] Run `npm audit fix` to automatically fix vulnerabilities
  [LOW] Consider using automated dependency update tools

✅ SECURITY SCAN PASSED - No critical issues found
📄 Detailed report saved to: security-scan-report.json
```

## Configuration

Quality gate configuration is stored in `/config/ci/quality-gates.json`:

```json
{
  "thresholds": {
    "coverage": {
      "lines": 75,
      "statements": 75,
      "functions": 75,
      "branches": 75
    },
    "bundleSize": {
      "maxTotalSize": 512000,
      "maxChunkSize": 256000
    },
    "performance": {
      "lighthouse": {
        "performance": 85,
        "accessibility": 90,
        "bestPractices": 90,
        "seo": 90
      }
    }
  }
}
```

## Integration with GitHub Actions

These scripts are automatically called in various workflows:

### CI Workflow (`ci.yml`)
- Quality gate runs after all tests pass
- Security scan runs on every push/PR

### Deploy Production (`deploy-production.yml`)
- Health check runs after deployment
- Quality gate runs pre-deployment

### Rollback (`rollback.yml`)
- Health check validates rollback success

## Local Development

Run these scripts locally before pushing:

```bash
# Full validation
npm run validate

# Individual checks
npm run lint
npm run typecheck
npm run test:coverage
npm run build

# CI scripts
npm run ci:quality-gate
npm run ci:health-check
npm run security:scan
```

## Exit Codes

All scripts follow standard exit code conventions:
- `0`: Success - all checks passed
- `1`: Failure - one or more checks failed
- `>1`: Error - script encountered an error

## Environment Variables

### health-check.js
- `BASE_URL`: Base URL to check (default: `http://localhost:3000`)
- `TIMEOUT`: Request timeout in ms (default: `10000`)
- `RETRY_ATTEMPTS`: Number of retries (default: `3`)

### quality-gate.js
No environment variables required. Reads from:
- `./coverage/coverage-summary.json`
- `./dist/assets/*.js`
- `./.lighthouseci/manifest.json`
- `./audit-report.json`

## Troubleshooting

### "Coverage report not found"
```bash
# Generate coverage report first
npm run test:coverage
```

### "Build artifacts not found"
```bash
# Build the project first
npm run build
```

### "Health check timeout"
```bash
# Increase timeout
TIMEOUT=30000 npm run ci:health-check
```

### "Security audit report not found"
```bash
# Generate audit report
npm audit --json > audit-report.json
npm run security:scan
```

## Best Practices

1. **Always run locally before CI**
   - Catch issues early
   - Faster feedback loop

2. **Monitor thresholds**
   - Adjust in quality-gates.json
   - Don't lower without team approval

3. **Review security reports**
   - Fix critical/high vulnerabilities immediately
   - Plan moderate fixes in next sprint

4. **Keep scripts updated**
   - Review after major dependency updates
   - Update thresholds as project matures

## Contributing

When adding new scripts:

1. Add to `package.json` scripts section
2. Document in this README
3. Add to relevant GitHub Actions workflows
4. Test locally and in CI
5. Update `/docs/cicd-guide.md`

---

**Last Updated**: 2025-11-21
**Maintained by**: DevOps Team
