#!/bin/bash

# =============================================================================
# Lab Visualizer - Automated Staging Smoke Test Suite
# =============================================================================
# Usage:
#   STAGING_URL=https://lab-visualizer-staging.vercel.app ./scripts/staging-smoke-test.sh
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#   2 - Script error
# =============================================================================

set -e

# Configuration
STAGING_URL="${STAGING_URL:-http://localhost:3000}"
TIMEOUT=10
VERBOSE="${VERBOSE:-false}"
LOG_FILE="smoke-test-results-$(date +%Y%m%d-%H%M%S).log"

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
TOTAL_TESTS=0

# Results array
declare -a RESULTS

# Colors (if terminal supports it)
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    GREEN=''
    RED=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "$1"
    echo "$(date +%H:%M:%S) $1" >> "$LOG_FILE"
}

log_pass() {
    log "${GREEN}[PASS]${NC} $1"
    RESULTS+=("PASS|$1")
    ((PASS_COUNT++))
    ((TOTAL_TESTS++))
}

log_fail() {
    log "${RED}[FAIL]${NC} $1"
    RESULTS+=("FAIL|$1")
    ((FAIL_COUNT++))
    ((TOTAL_TESTS++))
}

log_warn() {
    log "${YELLOW}[WARN]${NC} $1"
    RESULTS+=("WARN|$1")
    ((WARN_COUNT++))
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

# Test HTTP endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    local method="${4:-GET}"

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" --max-time "$TIMEOUT" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_code" ]; then
        log_pass "$name (HTTP $response)"
        return 0
    else
        log_fail "$name - Expected HTTP $expected_code, got $response"
        return 1
    fi
}

# Test JSON response field
test_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"
    local expected="$4"

    local response value
    response=$(curl -s "$url" --max-time "$TIMEOUT" 2>/dev/null || echo "{}")
    value=$(echo "$response" | jq -r "$field" 2>/dev/null || echo "null")

    if [ "$value" = "$expected" ]; then
        log_pass "$name ($field = $expected)"
        return 0
    else
        log_fail "$name - Expected $field='$expected', got '$value'"
        return 1
    fi
}

# Test response time
test_response_time() {
    local name="$1"
    local url="$2"
    local max_ms="$3"

    local time_total
    time_total=$(curl -s -o /dev/null -w "%{time_total}" "$url" --max-time "$TIMEOUT" 2>/dev/null || echo "999")
    local time_ms=$(echo "$time_total * 1000" | bc 2>/dev/null | cut -d. -f1)

    if [ -z "$time_ms" ] || [ "$time_ms" = "" ]; then
        time_ms=9999
    fi

    if [ "$time_ms" -lt "$max_ms" ]; then
        log_pass "$name (${time_ms}ms < ${max_ms}ms)"
        return 0
    else
        log_fail "$name - Response time ${time_ms}ms exceeds ${max_ms}ms"
        return 1
    fi
}

# Test header presence
test_header() {
    local name="$1"
    local header="$2"

    local headers
    headers=$(curl -sI "$STAGING_URL" --max-time "$TIMEOUT" 2>/dev/null)

    if echo "$headers" | grep -qi "^$header"; then
        log_pass "$name header present"
        return 0
    else
        log_warn "$name header missing"
        return 1
    fi
}

# =============================================================================
# Main Test Execution
# =============================================================================

main() {
    log "=============================================================="
    log "  Lab Visualizer - Staging Smoke Test Suite"
    log "=============================================================="
    log "Target URL: $STAGING_URL"
    log "Started:    $(date)"
    log "Log File:   $LOG_FILE"
    log ""

    # Check if URL is reachable at all
    log_info "Checking staging URL accessibility..."
    if ! curl -s --max-time 5 "$STAGING_URL" > /dev/null 2>&1; then
        log "${RED}ERROR: Cannot reach $STAGING_URL${NC}"
        log "Please verify the staging URL is correct and deployment is complete."
        exit 2
    fi
    log_info "Staging URL is accessible"
    log ""

    # ==========================================================================
    # TEST SUITE 1: Core User Flows
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 1: Core User Flows (CUF)"
    log "=============================================================="

    test_endpoint "CUF-01 Homepage" "$STAGING_URL" "200"
    test_endpoint "CUF-02 Browse Page" "$STAGING_URL/browse" "200"
    test_endpoint "CUF-03 Login Page" "$STAGING_URL/auth/login" "200"
    test_endpoint "CUF-04 Signup Page" "$STAGING_URL/auth/signup" "200"
    test_endpoint "CUF-05 Learn Page" "$STAGING_URL/learn" "200"
    test_endpoint "CUF-06 Jobs Page" "$STAGING_URL/jobs" "200"

    log ""

    # ==========================================================================
    # TEST SUITE 2: Health Endpoints
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 2: Health Endpoints (HE)"
    log "=============================================================="

    test_endpoint "HE-01 Health Check" "$STAGING_URL/api/health" "200"
    test_endpoint "HE-02 Health Ready" "$STAGING_URL/api/health/ready" "200"
    test_endpoint "HE-03 Health Live" "$STAGING_URL/api/health/live" "200"
    test_json_field "HE-04 Health Status" "$STAGING_URL/api/health" ".status" "healthy"

    log ""

    # ==========================================================================
    # TEST SUITE 3: API Endpoints
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 3: API Endpoints (API)"
    log "=============================================================="

    test_endpoint "API-01 PDB Fetch (1ATP)" "$STAGING_URL/api/pdb/1ATP" "200"
    test_endpoint "API-02 PDB Search" "$STAGING_URL/api/pdb/search?q=protein" "200"
    test_endpoint "API-03 Invalid PDB (404)" "$STAGING_URL/api/pdb/INVALID99999" "404"
    test_endpoint "API-04 Learning Modules" "$STAGING_URL/api/learning/modules" "200"
    test_endpoint "API-05 Learning Progress" "$STAGING_URL/api/learning/progress" "200"

    log ""

    # ==========================================================================
    # TEST SUITE 4: Performance
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 4: Performance (PERF)"
    log "=============================================================="

    test_response_time "PERF-01 Homepage Load" "$STAGING_URL" "3000"
    test_response_time "PERF-02 API Health" "$STAGING_URL/api/health" "500"
    test_response_time "PERF-03 PDB API" "$STAGING_URL/api/pdb/1ATP" "2000"
    test_response_time "PERF-04 Search API" "$STAGING_URL/api/pdb/search?q=test" "2000"

    log ""

    # ==========================================================================
    # TEST SUITE 5: Security Headers
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 5: Security Headers (SEC)"
    log "=============================================================="

    test_header "SEC-01 X-Frame-Options" "x-frame-options"
    test_header "SEC-02 X-Content-Type-Options" "x-content-type-options"
    test_header "SEC-03 Strict-Transport-Security" "strict-transport-security"
    test_header "SEC-04 Content-Security-Policy" "content-security-policy"

    log ""

    # ==========================================================================
    # TEST SUITE 6: Error Handling
    # ==========================================================================
    log "=============================================================="
    log "  TEST SUITE 6: Error Handling (ERR)"
    log "=============================================================="

    test_endpoint "ERR-01 404 Page" "$STAGING_URL/nonexistent-page-xyz" "404"
    test_endpoint "ERR-02 Invalid API Route" "$STAGING_URL/api/nonexistent" "404"

    log ""

    # ==========================================================================
    # Results Summary
    # ==========================================================================
    log "=============================================================="
    log "  SMOKE TEST RESULTS SUMMARY"
    log "=============================================================="
    log ""
    log "  ${GREEN}Passed:${NC}   $PASS_COUNT"
    log "  ${RED}Failed:${NC}   $FAIL_COUNT"
    log "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
    log "  Total:    $TOTAL_TESTS"
    log ""

    # Calculate pass rate
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        local pass_rate
        pass_rate=$(echo "scale=1; $PASS_COUNT * 100 / $TOTAL_TESTS" | bc)
        log "  Pass Rate: ${pass_rate}%"
    fi

    log ""
    log "=============================================================="

    # List failed tests if any
    if [ "$FAIL_COUNT" -gt 0 ]; then
        log ""
        log "${RED}FAILED TESTS:${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ "$result" == FAIL* ]]; then
                local test_name="${result#FAIL|}"
                log "  - $test_name"
            fi
        done
        log ""
    fi

    # List warnings if any
    if [ "$WARN_COUNT" -gt 0 ]; then
        log ""
        log "${YELLOW}WARNINGS:${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ "$result" == WARN* ]]; then
                local test_name="${result#WARN|}"
                log "  - $test_name"
            fi
        done
        log ""
    fi

    # Final verdict
    log "=============================================================="
    if [ "$FAIL_COUNT" -eq 0 ]; then
        log "${GREEN}STATUS: ALL CRITICAL TESTS PASSED${NC}"
        log "Staging deployment is ready for production promotion."
        log "=============================================================="
        log ""
        log "Log saved to: $LOG_FILE"
        exit 0
    else
        log "${RED}STATUS: $FAIL_COUNT TEST(S) FAILED${NC}"
        log "Please investigate failed tests before promoting to production."
        log "=============================================================="
        log ""
        log "Log saved to: $LOG_FILE"
        exit 1
    fi
}

# Run main function
main "$@"
