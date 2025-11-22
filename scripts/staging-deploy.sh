#!/bin/bash

# =============================================================================
# Lab Visualizer - Staging Deployment Script
# =============================================================================
# Usage: ./scripts/staging-deploy.sh
#
# This script performs pre-deployment validation and deploys to Vercel staging.
# =============================================================================

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGING_BRANCH="${STAGING_BRANCH:-staging}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() {
    echo -e "\n${BLUE}[STEP $1]${NC} $2"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

echo "=============================================================="
echo "  Lab Visualizer - Staging Deployment"
echo "=============================================================="
echo "  Started: $(date)"
echo "  Project: $PROJECT_ROOT"
echo "=============================================================="

cd "$PROJECT_ROOT"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    log_error "Not logged into Vercel. Run: vercel login"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log_warning "You have uncommitted changes. Consider committing first."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# =============================================================================
# Step 1: Code Quality Checks
# =============================================================================

log_step "1/6" "Running code quality checks..."

echo "  Checking types..."
if npm run typecheck; then
    log_success "TypeScript check passed"
else
    log_error "TypeScript errors found. Fix before deploying."
    exit 1
fi

echo "  Running linter..."
if npm run lint; then
    log_success "Linting passed"
else
    log_error "Linting errors found. Fix before deploying."
    exit 1
fi

# =============================================================================
# Step 2: Run Tests
# =============================================================================

log_step "2/6" "Running test suite..."

if npm run test; then
    log_success "All tests passed"
else
    log_error "Tests failed. Fix before deploying."
    exit 1
fi

# =============================================================================
# Step 3: Security Audit
# =============================================================================

log_step "3/6" "Running security audit..."

if npm audit --production --audit-level=high; then
    log_success "No high/critical vulnerabilities found"
else
    log_warning "Security vulnerabilities detected. Review before proceeding."
    read -p "Continue deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# =============================================================================
# Step 4: Build Verification
# =============================================================================

log_step "4/6" "Building application..."

if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed. Check errors above."
    exit 1
fi

# Check bundle size
echo "  Checking bundle size..."
BUNDLE_SIZE=$(find .next/static/chunks -name "*.js" -exec du -cb {} + 2>/dev/null | tail -1 | cut -f1)
BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1048576" | bc 2>/dev/null || echo "unknown")
echo "  Total JS bundle: ${BUNDLE_SIZE_MB}MB"

# =============================================================================
# Step 5: Deploy to Vercel
# =============================================================================

log_step "5/6" "Deploying to Vercel staging..."

echo "  Deploying preview (non-production)..."
DEPLOYMENT_URL=$(vercel --no-production 2>&1 | grep -oE "https://[a-zA-Z0-9-]+\.vercel\.app" | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    log_error "Failed to get deployment URL. Check Vercel output."
    vercel --no-production
    exit 1
fi

log_success "Deployed to: $DEPLOYMENT_URL"

# =============================================================================
# Step 6: Post-Deployment Smoke Tests
# =============================================================================

log_step "6/6" "Running smoke tests..."

echo "  Waiting 30 seconds for deployment to stabilize..."
sleep 30

# Quick health check
echo "  Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" --max-time 10 || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    log_success "Health check passed (HTTP $HEALTH_STATUS)"
else
    log_error "Health check failed (HTTP $HEALTH_STATUS)"
    echo "  Please investigate the deployment."
fi

# Run full smoke test suite if available
if [ -f "$PROJECT_ROOT/scripts/staging-smoke-test.sh" ]; then
    echo ""
    echo "Running full smoke test suite..."
    if STAGING_URL="$DEPLOYMENT_URL" bash "$PROJECT_ROOT/scripts/staging-smoke-test.sh"; then
        log_success "All smoke tests passed"
    else
        log_warning "Some smoke tests failed. Review results."
    fi
fi

# =============================================================================
# Summary
# =============================================================================

echo ""
echo "=============================================================="
echo "  STAGING DEPLOYMENT COMPLETE"
echo "=============================================================="
echo ""
echo "  Deployment URL: $DEPLOYMENT_URL"
echo "  Health Status:  HTTP $HEALTH_STATUS"
echo "  Completed:      $(date)"
echo ""
echo "  Next Steps:"
echo "  1. Verify all features manually"
echo "  2. Monitor logs for 30 minutes: vercel logs --follow"
echo "  3. If stable, promote to production: vercel --prod"
echo ""
echo "=============================================================="
