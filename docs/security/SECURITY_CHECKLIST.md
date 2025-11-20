# Security Quick Reference Checklist

## Immediate Actions Required (THIS WEEK)

### 1. Fix NPM Vulnerabilities
```bash
# Install dependencies first
npm install

# Update Vite to fix esbuild vulnerability
npm install vite@7.2.4

# Run security audit
npm audit
npm audit fix
```

### 2. Fix XSS Vulnerability
**File:** `/home/user/lab_visualizer/src/components/learning/ModuleViewer.tsx:191`

```bash
# Install DOMPurify
npm install dompurify @types/dompurify
```

```typescript
// Update ModuleViewer.tsx
import DOMPurify from 'dompurify';

// Replace line 191
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(section.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['class', 'id']
  })
}} />
```

### 3. Fix ESLint Configuration

**Option A (Quick):** Downgrade to ESLint v8
```bash
npm install --save-dev eslint@^8.57.0
npm run lint
```

**Option B (Better):** Migrate to flat config
```bash
# Create eslint.config.js (see full report for template)
touch eslint.config.js
# Copy migration template from audit report
```

### 4. Add Missing Security Headers

**File:** `/home/user/lab_visualizer/src/middleware.ts`

Add after line 136:
```typescript
// Add to middleware.ts
response.headers.set('Strict-Transport-Security',
  'max-age=31536000; includeSubDomains; preload');
response.headers.set('Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;");
response.headers.set('X-XSS-Protection', '1; mode=block');
```

---

## Security Verification Commands

### Check for Vulnerabilities
```bash
npm audit
npm outdated
```

### Check for Secrets in Git
```bash
git log --all --full-history -- "*.env" "*.pem" "*.key"
grep -r "password\|secret\|api_key" --include="*.ts" --include="*.tsx" src/
```

### Check for Console Logs (Production)
```bash
grep -r "console\.log\|console\.debug" --include="*.ts" --include="*.tsx" src/ | wc -l
```

### Lint Check
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

---

## Security Score Tracking

| Metric | Current | Target |
|--------|---------|--------|
| Overall Security | 82/100 | 95/100 |
| Authentication | 95/100 | 98/100 |
| Authorization | 98/100 | 100/100 |
| Database Security | 100/100 | 100/100 |
| Code Quality | 60/100 | 90/100 |
| Dependencies | 70/100 | 95/100 |

---

## Quick Security Tests

### Test Authentication
```bash
# Run auth tests
npm test -- auth-service.test.ts
```

### Test Rate Limiting
```bash
# Run rate limiter tests
npm test -- rateLimiter.test.ts
```

### Test RLS Policies
```bash
# Connect to Supabase and run
psql $DATABASE_URL -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

---

## Security Monitoring Setup

### 1. Enable Dependabot
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
```

### 2. Add Security Workflow
Create `.github/workflows/security.yml`:
```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit
      - run: npm run lint
```

### 3. Set up Pre-commit Hooks
```bash
npm install --save-dev husky lint-staged
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
npm run lint
npm run typecheck
```

---

## Environment Variables Checklist

### Required Variables (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- [ ] `REDIS_HOST`
- [ ] `REDIS_PORT`
- [ ] `REDIS_PASSWORD`

### Optional (Monitoring)
- [ ] `SENTRY_DSN`
- [ ] `STATUSPAGE_API_KEY`
- [ ] `PAGERDUTY_INTEGRATION_KEY`

### Verify
```bash
# Check .env.example has all required vars
diff <(grep -v '^#' .env.example | cut -d= -f1 | sort) \
     <(grep -v '^#' .env.local | cut -d= -f1 | sort)
```

---

## Code Quality Quick Fixes

### Remove Console Logs
```bash
# Find all console.log statements
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"

# Replace with logger (after creating logger utility)
# Manual replacement or use:
sed -i 's/console\.log/logger.debug/g' src/**/*.ts
```

### Format Code
```bash
npm run format
```

### Fix TypeScript Errors
```bash
npx tsc --noEmit
```

---

## Database Security Checks

### Verify RLS Enabled
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Should return 0 rows
```

### List All Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Should show 29 policies
```

### Test RLS as User
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-id';
SELECT * FROM collaboration_sessions;
-- Should only show user's sessions
```

---

## Security Review Schedule

- **Daily:** Check Dependabot alerts
- **Weekly:** Run `npm audit`
- **Monthly:** Full security audit (use this checklist)
- **Quarterly:** Third-party penetration test

---

## Incident Response

### If Vulnerability Found
1. Assess severity (CVSS score)
2. Check if exploitable in our context
3. Update dependency immediately if HIGH/CRITICAL
4. Test thoroughly after update
5. Document in CHANGELOG.md

### If Secrets Leaked
1. Immediately rotate all affected credentials
2. Check git history: `git log --all --full-history -- "*.env"`
3. Use BFG Repo-Cleaner to remove from history
4. Force push (with team coordination)
5. Update all deployment configs

### If XSS/Injection Found
1. Disable affected feature immediately
2. Deploy sanitization fix
3. Review all similar code patterns
4. Add regression tests
5. Security announcement to users

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security-best-practices)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Last Updated:** 2025-11-20
**Next Review:** 2025-12-20
