#!/bin/bash
# Deploy OpenMM Edge Function to Supabase
# Usage: ./scripts/deploy-edge-function.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Deploying OpenMM Edge Function to $ENVIRONMENT"

# Check prerequisites
command -v supabase >/dev/null 2>&1 || {
  echo "❌ Error: Supabase CLI not installed"
  echo "Install with: npm install -g supabase"
  exit 1
}

command -v docker >/dev/null 2>&1 || {
  echo "❌ Error: Docker not installed"
  exit 1
}

# Navigate to project root
cd "$PROJECT_ROOT"

# Step 1: Build Docker image
echo "📦 Building Docker image..."
docker build -t openmm-worker:latest -f supabase/functions/md-simulation/Dockerfile supabase/functions/md-simulation/

# Step 2: Test Docker image locally
echo "🧪 Testing Docker image..."
docker run --rm openmm-worker:latest /opt/conda/bin/python -c "import openmm; print(f'OpenMM version: {openmm.__version__}')"

# Step 3: Deploy database migrations
echo "💾 Deploying database migrations..."
supabase db push

# Step 4: Configure storage
echo "📁 Configuring storage buckets..."
supabase db execute -f config/supabase-storage.sql

# Step 5: Deploy Edge Function
echo "⚡ Deploying Edge Function..."
supabase functions deploy md-simulation --no-verify-jwt=false

# Step 6: Set environment variables
echo "🔧 Setting environment variables..."
if [ -f ".env.${ENVIRONMENT}" ]; then
  while IFS='=' read -r key value; do
    if [[ ! $key =~ ^# && -n $key ]]; then
      supabase secrets set "$key=$value"
    fi
  done < ".env.${ENVIRONMENT}"
else
  echo "⚠️  No .env.${ENVIRONMENT} file found. Skipping environment variables."
fi

# Step 7: Test Edge Function
echo "🧪 Testing Edge Function..."
FUNCTION_URL=$(supabase functions list | grep md-simulation | awk '{print $3}')

if [ -n "$FUNCTION_URL" ]; then
  echo "✅ Edge Function deployed successfully!"
  echo "📍 Function URL: $FUNCTION_URL"

  # Health check
  echo "🔍 Running health check..."
  curl -s "${FUNCTION_URL}/health" || echo "⚠️  Health check failed"
else
  echo "❌ Failed to get function URL"
  exit 1
fi

# Step 8: Display deployment info
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test with small structure: npm run test:integration"
echo "2. Monitor logs: supabase functions logs md-simulation"
echo "3. Check metrics: supabase dashboard"
echo ""
echo "📖 Documentation: docs/deployment/openmm-edge-function.md"
