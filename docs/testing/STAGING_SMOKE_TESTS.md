# Lab Visualizer - Staging Smoke Test Suite

**Version**: 1.0.0
**Date**: 2025-11-22
**Target**: Vercel Staging Environment
**Estimated Duration**: ~70 minutes total

---

## Overview

This document defines the comprehensive smoke test suite to validate staging deployments before promoting to production. Tests are organized by priority and can be executed manually or via automation scripts.

---

## Test Suite Summary

| Test Category | Duration | Priority | Tests |
|---------------|----------|----------|-------|
| Core User Flows | 30 min | Critical | 12 |
| Molecular Visualization | 15 min | Critical | 10 |
| External Integrations | 15 min | High | 8 |
| Security & Performance | 10 min | High | 8 |
| **Total** | **70 min** | | **38** |

---

## Test 1: Core User Flows (30 minutes)

### 1.1 Homepage & Navigation

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUF-01 | Homepage loads | Navigate to staging URL | Page loads < 3s, no errors | [ ] |
| CUF-02 | Header renders | Check header component | Logo, navigation links visible | [ ] |
| CUF-03 | Footer renders | Scroll to bottom | Footer links functional | [ ] |
| CUF-04 | Mobile responsive | Resize to mobile viewport | Layout adapts correctly | [ ] |

**Test Commands:**
```bash
# Homepage load test
curl -s -o /dev/null -w "Response: %{http_code}, Time: %{time_total}s\n" $STAGING_URL

# Check for JavaScript errors (manual)
# Open DevTools Console - should be empty
```

### 1.2 Structure Browsing (Guest)

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUF-05 | Browse page loads | Navigate to /browse | Structure catalog displays | [ ] |
| CUF-06 | Search functionality | Enter "insulin" in search | Results appear | [ ] |
| CUF-07 | Filter by category | Apply category filter | Results filtered correctly | [ ] |
| CUF-08 | Structure card display | View structure cards | Thumbnail, title, metadata shown | [ ] |

### 1.3 Authentication Flows

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUF-09 | Signup form validation | Submit empty signup form | Validation errors shown | [ ] |
| CUF-10 | Login form validation | Submit invalid credentials | Error message displayed | [ ] |
| CUF-11 | Session persistence | Login, refresh page | User remains logged in | [ ] |
| CUF-12 | Logout functionality | Click logout | Session cleared, redirected | [ ] |

**Test Credentials (Staging Only):**
```
Email: test@labvisualizer.staging
Password: TestPassword123!
```

---

## Test 2: Molecular Visualization (15 minutes)

### 2.1 Structure Loading

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MV-01 | Load small structure | Open 1CRN (crambin) | Structure renders < 2s | [ ] |
| MV-02 | Load medium structure | Open 1ATP | Structure renders < 5s | [ ] |
| MV-03 | Load large structure | Open 3J3Q (ribosome) | LOD activates, renders < 10s | [ ] |
| MV-04 | Error handling | Request invalid PDB ID | Error message displayed | [ ] |

### 2.2 PDB Upload

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MV-05 | Upload valid PDB | Upload sample.pdb (< 5MB) | File accepted, structure loads | [ ] |
| MV-06 | Reject oversized file | Upload file > 50MB | Size limit error shown | [ ] |
| MV-07 | Reject invalid format | Upload .txt file | Format error shown | [ ] |

### 2.3 Viewer Controls

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MV-08 | Rotation | Click and drag viewer | Structure rotates smoothly | [ ] |
| MV-09 | Zoom | Scroll on viewer | Structure zooms in/out | [ ] |
| MV-10 | Representation change | Switch to ball-and-stick | View updates immediately | [ ] |

### 2.4 Export Functions

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MV-11 | Export PNG | Click Export > PNG | Image downloads | [ ] |
| MV-12 | Export PDF | Click Export > PDF | PDF report downloads | [ ] |

---

## Test 3: External Integrations (15 minutes)

### 3.1 RCSB PDB API

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EI-01 | Fetch structure | Request /api/pdb/1ATP | Structure data returned | [ ] |
| EI-02 | Search API | Request /api/pdb/search?q=lysozyme | Search results returned | [ ] |
| EI-03 | API error handling | Request invalid structure | 404 with error message | [ ] |

**API Test Commands:**
```bash
# Test RCSB API integration
curl -s "$STAGING_URL/api/pdb/1ATP" | jq '.id, .title'
# Expected: "1ATP", "PHOSPHORYLASE KINASE..."

curl -s "$STAGING_URL/api/pdb/search?q=lysozyme&limit=5" | jq '.results | length'
# Expected: 5 (or fewer)
```

### 3.2 AlphaFold API

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EI-04 | Fetch prediction | Request /api/pdb/alphafold/P00533 | AlphaFold structure returned | [ ] |
| EI-05 | Invalid UniProt ID | Request invalid ID | Graceful error handling | [ ] |

**API Test Commands:**
```bash
# Test AlphaFold integration
curl -s "$STAGING_URL/api/pdb/alphafold/P00533" | jq '.source'
# Expected: "alphafold" or similar
```

### 3.3 Supabase Connection

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EI-06 | Database connectivity | Check /api/health | Database status: "pass" | [ ] |
| EI-07 | Auth integration | Attempt login | Supabase Auth responds | [ ] |
| EI-08 | Storage access | Upload file | Supabase Storage accepts | [ ] |

**Supabase Test Commands:**
```bash
# Health check with DB status
curl -s "$STAGING_URL/api/health/ready" | jq '.checks.database'
# Expected: {"status":"pass",...}
```

### 3.4 Rate Limiting

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EI-09 | Rate limit active | Send 50 rapid requests | 429 after threshold | [ ] |
| EI-10 | Rate limit headers | Check response headers | X-RateLimit headers present | [ ] |

**Rate Limit Test:**
```bash
# Send multiple requests rapidly
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code} " "$STAGING_URL/api/pdb/search?q=test"
done
echo ""
# Should see 200s, then 429s if rate limited
```

---

## Test 4: Security & Performance (10 minutes)

### 4.1 HTTPS & Certificates

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SP-01 | HTTPS enforced | Access via HTTP | Redirects to HTTPS | [ ] |
| SP-02 | Valid certificate | Check browser padlock | Certificate valid, no warnings | [ ] |

### 4.2 Security Headers

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SP-03 | X-Frame-Options | Check response headers | Header present | [ ] |
| SP-04 | X-Content-Type-Options | Check response headers | nosniff set | [ ] |
| SP-05 | Strict-Transport-Security | Check response headers | HSTS enabled | [ ] |
| SP-06 | Content-Security-Policy | Check response headers | CSP configured | [ ] |

**Security Headers Test:**
```bash
# Check all security headers
curl -I "$STAGING_URL" 2>/dev/null | grep -iE "(x-frame|x-content|strict-transport|content-security|x-xss)"
```

### 4.3 CSRF Protection

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SP-07 | CSRF token present | Inspect form source | Token in form | [ ] |
| SP-08 | CSRF validation | Submit without token | Request rejected | [ ] |

### 4.4 Performance

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SP-09 | Homepage load time | Measure with DevTools | < 3 seconds | [ ] |
| SP-10 | API response time | Measure /api/health | < 500ms | [ ] |
| SP-11 | No console errors | Check DevTools console | 0 errors on main pages | [ ] |

**Performance Test:**
```bash
# Measure response times
curl -s -o /dev/null -w "DNS: %{time_namelookup}s, Connect: %{time_connect}s, TTFB: %{time_starttransfer}s, Total: %{time_total}s\n" "$STAGING_URL"

# API latency
curl -s -o /dev/null -w "API Response: %{time_total}s\n" "$STAGING_URL/api/health"
# Expected: < 0.5s
```

---

## Sample Test Data

### PDB Files for Upload Testing

**Small Structure (< 100 KB):**
```
Filename: crambin.pdb
PDB ID: 1CRN
Atoms: ~327
Size: ~25 KB
```

**Medium Structure (100 KB - 1 MB):**
```
Filename: lysozyme.pdb
PDB ID: 1AKI
Atoms: ~1,000
Size: ~80 KB
```

**Large Structure (> 1 MB) - For LOD Testing:**
```
Filename: ribosome.pdb
PDB ID: 3J3Q
Atoms: ~100,000+
Size: ~8 MB
```

### Download Test Data

```bash
# Download sample PDB files
curl -o crambin.pdb "https://files.rcsb.org/download/1CRN.pdb"
curl -o lysozyme.pdb "https://files.rcsb.org/download/1AKI.pdb"
# Large structure - download from RCSB directly for LOD testing
```

---

## Automated Smoke Test Script

Save as `scripts/staging-smoke-test.sh`:

```bash
#!/bin/bash

# Lab Visualizer - Automated Staging Smoke Test
# Usage: STAGING_URL=https://your-staging.vercel.app ./scripts/staging-smoke-test.sh

set -e

STAGING_URL="${STAGING_URL:-http://localhost:3000}"
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

echo "=============================================="
echo "Lab Visualizer - Staging Smoke Tests"
echo "Target: $STAGING_URL"
echo "Time: $(date)"
echo "=============================================="

# Helper function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 2>/dev/null || echo "000")

    if [ "$response" = "$expected_code" ]; then
        echo "[PASS] $name (HTTP $response)"
        RESULTS+=("PASS: $name")
        ((PASS_COUNT++))
    else
        echo "[FAIL] $name - Expected $expected_code, got $response"
        RESULTS+=("FAIL: $name (expected $expected_code, got $response)")
        ((FAIL_COUNT++))
    fi
}

# Helper for JSON validation
test_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"
    local expected="$4"

    response=$(curl -s "$url" --max-time 10 2>/dev/null || echo "{}")
    value=$(echo "$response" | jq -r "$field" 2>/dev/null || echo "null")

    if [ "$value" = "$expected" ]; then
        echo "[PASS] $name ($field = $expected)"
        RESULTS+=("PASS: $name")
        ((PASS_COUNT++))
    else
        echo "[FAIL] $name - Expected $field=$expected, got $value"
        RESULTS+=("FAIL: $name (expected $expected, got $value)")
        ((FAIL_COUNT++))
    fi
}

echo ""
echo "=== Core User Flows ==="

test_endpoint "Homepage" "$STAGING_URL" "200"
test_endpoint "Browse Page" "$STAGING_URL/browse" "200"
test_endpoint "Login Page" "$STAGING_URL/auth/login" "200"
test_endpoint "Signup Page" "$STAGING_URL/auth/signup" "200"

echo ""
echo "=== Health Endpoints ==="

test_endpoint "Health Check" "$STAGING_URL/api/health" "200"
test_endpoint "Health Ready" "$STAGING_URL/api/health/ready" "200"
test_endpoint "Health Live" "$STAGING_URL/api/health/live" "200"
test_json_field "Health Status" "$STAGING_URL/api/health" ".status" "healthy"

echo ""
echo "=== API Endpoints ==="

test_endpoint "PDB Fetch" "$STAGING_URL/api/pdb/1ATP" "200"
test_endpoint "PDB Search" "$STAGING_URL/api/pdb/search?q=protein" "200"
test_endpoint "Invalid PDB" "$STAGING_URL/api/pdb/INVALID999" "404"
test_endpoint "Learning Modules" "$STAGING_URL/api/learning/modules" "200"

echo ""
echo "=== Performance ==="

# Measure homepage load time
start_time=$(date +%s%N)
curl -s -o /dev/null "$STAGING_URL" --max-time 10
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 ))

if [ "$load_time" -lt 3000 ]; then
    echo "[PASS] Homepage Load Time (${load_time}ms < 3000ms)"
    RESULTS+=("PASS: Homepage Load Time (${load_time}ms)")
    ((PASS_COUNT++))
else
    echo "[FAIL] Homepage Load Time (${load_time}ms >= 3000ms)"
    RESULTS+=("FAIL: Homepage Load Time (${load_time}ms >= 3000ms)")
    ((FAIL_COUNT++))
fi

# API response time
api_time=$(curl -s -o /dev/null -w "%{time_total}" "$STAGING_URL/api/health" --max-time 5)
api_time_ms=$(echo "$api_time * 1000" | bc | cut -d. -f1)

if [ "$api_time_ms" -lt 500 ]; then
    echo "[PASS] API Response Time (${api_time_ms}ms < 500ms)"
    RESULTS+=("PASS: API Response Time (${api_time_ms}ms)")
    ((PASS_COUNT++))
else
    echo "[FAIL] API Response Time (${api_time_ms}ms >= 500ms)"
    RESULTS+=("FAIL: API Response Time (${api_time_ms}ms >= 500ms)")
    ((FAIL_COUNT++))
fi

echo ""
echo "=== Security Headers ==="

headers=$(curl -sI "$STAGING_URL" --max-time 5 2>/dev/null)

check_header() {
    local header="$1"
    if echo "$headers" | grep -qi "$header"; then
        echo "[PASS] $header present"
        RESULTS+=("PASS: $header present")
        ((PASS_COUNT++))
    else
        echo "[WARN] $header missing"
        RESULTS+=("WARN: $header missing")
    fi
}

check_header "x-frame-options"
check_header "x-content-type-options"
check_header "strict-transport-security"

echo ""
echo "=============================================="
echo "SMOKE TEST RESULTS"
echo "=============================================="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "Total:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "STATUS: ALL TESTS PASSED"
    exit 0
else
    echo "STATUS: $FAIL_COUNT TESTS FAILED"
    echo ""
    echo "Failed tests:"
    for result in "${RESULTS[@]}"; do
        if [[ "$result" == FAIL* ]]; then
            echo "  - ${result#FAIL: }"
        fi
    done
    exit 1
fi
```

---

## Error Monitoring Plan (30 Minutes Post-Deploy)

### Monitoring Dashboard Checklist

| Time | Check | Location | Expected |
|------|-------|----------|----------|
| 0 min | Deployment complete | Vercel Dashboard | Build succeeded |
| 5 min | Health endpoints | /api/health/* | All returning 200 |
| 10 min | Error rate | Sentry / Vercel Logs | 0 errors |
| 15 min | Response times | Vercel Analytics | p95 < 3s |
| 20 min | User flow test | Manual testing | All flows work |
| 25 min | API functionality | Curl tests | All APIs respond |
| 30 min | Final assessment | Summary | Go/No-Go decision |

### Log Monitoring Commands

```bash
# Watch Vercel logs in real-time
vercel logs --follow

# Filter for errors only
vercel logs --follow | grep -i "error\|fail\|500\|404"

# Check specific timeframe
vercel logs --since 30m
```

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | > 1% | > 5% | Investigate / Rollback |
| Response Time (p95) | > 3s | > 5s | Investigate |
| Health Check | Intermittent | Failing | Rollback |
| 5xx Errors | > 10/min | > 50/min | Rollback |

### Rollback Criteria

**Immediate Rollback Required:**
- [ ] Health endpoints returning non-200 consistently
- [ ] Error rate exceeds 5% in first 15 minutes
- [ ] Critical user flow completely broken
- [ ] Security vulnerability detected
- [ ] Data integrity issues

**Consider Rollback:**
- [ ] Error rate between 1-5%
- [ ] Performance degraded by > 50%
- [ ] Multiple minor issues compounding

---

## Test Results Template

```markdown
# Staging Smoke Test Report

**Date**: _______________
**Tester**: _______________
**Staging URL**: _______________
**Build/Commit**: _______________

## Test Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Core User Flows | /12 | /12 | 12 |
| Molecular Visualization | /10 | /10 | 10 |
| External Integrations | /8 | /8 | 8 |
| Security & Performance | /8 | /8 | 8 |
| **TOTAL** | **/38** | **/38** | **38** |

## Failed Tests

| Test ID | Description | Actual Result | Notes |
|---------|-------------|---------------|-------|
| | | | |

## Performance Metrics

- Homepage Load Time: _____ ms
- API Response Time: _____ ms
- Lighthouse Score: _____ / 100

## Issues Found

1.
2.
3.

## Recommendation

[ ] PASS - Ready for production
[ ] FAIL - Requires fixes before production
[ ] BLOCKED - Critical issues preventing deployment

## Sign-Off

Tester: _______________  Date: _______________
Reviewer: _______________  Date: _______________
```

---

**Document Status**: Complete
**Related Documents**:
- `/docs/deployment/STAGING_DEPLOYMENT_CHECKLIST.md`
- `/docs/deployment/production-validation.md`
- `/scripts/ci/health-check.js`
