-- Supabase Migration: MD Jobs Queue Table
-- 3-Tier MD Architecture - Serverless Simulation Support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for job status
CREATE TYPE job_status AS ENUM (
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE md_tier AS ENUM (
  'browser',
  'serverless',
  'desktop'
);

CREATE TYPE priority_level AS ENUM (
  'low',
  'normal',
  'high'
);

-- MD Jobs table
CREATE TABLE md_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job metadata
  status job_status NOT NULL DEFAULT 'pending',
  tier md_tier NOT NULL DEFAULT 'serverless',
  priority priority_level NOT NULL DEFAULT 'normal',

  -- Structure information
  structure_id TEXT NOT NULL,
  structure_name TEXT,
  structure_storage_path TEXT,  -- Supabase Storage path
  atom_count INTEGER NOT NULL,

  -- Simulation configuration (JSONB for flexibility)
  config JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Progress tracking
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_time_remaining INTEGER,  -- seconds

  -- Results
  result_storage_path TEXT,  -- Path to trajectory in Supabase Storage
  result_metadata JSONB,     -- Energy plots, statistics, etc.

  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Notification
  notify_on_complete BOOLEAN NOT NULL DEFAULT true,
  notified BOOLEAN NOT NULL DEFAULT false,

  -- Indexes
  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= created_at)
  )
);

-- Indexes for query performance
CREATE INDEX idx_md_jobs_user_id ON md_jobs(user_id);
CREATE INDEX idx_md_jobs_status ON md_jobs(status);
CREATE INDEX idx_md_jobs_priority ON md_jobs(priority);
CREATE INDEX idx_md_jobs_created_at ON md_jobs(created_at DESC);
CREATE INDEX idx_md_jobs_user_status ON md_jobs(user_id, status);
CREATE INDEX idx_md_jobs_tier ON md_jobs(tier);

-- Composite index for queue processing
CREATE INDEX idx_md_jobs_queue ON md_jobs(status, priority DESC, created_at ASC)
  WHERE status IN ('pending', 'queued');

-- Row Level Security (RLS)
ALTER TABLE md_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view own jobs"
  ON md_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can create jobs"
  ON md_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs (for cancellation)
CREATE POLICY "Users can update own jobs"
  ON md_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can update any job (for Edge Functions)
CREATE POLICY "Service can update jobs"
  ON md_jobs
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- Function: Update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  job_id UUID,
  new_progress INTEGER,
  new_status job_status DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE md_jobs
  SET
    progress = new_progress,
    status = COALESCE(new_status, status),
    updated_at = NOW()
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE (
  pending_count BIGINT,
  queued_count BIGINT,
  running_count BIGINT,
  completed_count BIGINT,
  failed_count BIGINT,
  avg_wait_time INTERVAL,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'queued') as queued_count,
    COUNT(*) FILTER (WHERE status = 'running') as running_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    AVG(started_at - created_at) FILTER (WHERE started_at IS NOT NULL) as avg_wait_time,
    AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_processing_time
  FROM md_jobs
  WHERE created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'md_jobs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE md_jobs ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

CREATE TRIGGER update_md_jobs_updated_at
  BEFORE UPDATE ON md_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Automatic completion time
CREATE OR REPLACE FUNCTION set_completion_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status NOT IN ('completed', 'failed', 'cancelled') THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_completion_time
  BEFORE UPDATE ON md_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_completion_time();

-- View: Active jobs queue
CREATE OR REPLACE VIEW active_jobs_queue AS
SELECT
  id,
  user_id,
  status,
  priority,
  structure_name,
  atom_count,
  progress,
  created_at,
  started_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as wait_time_seconds,
  estimated_time_remaining
FROM md_jobs
WHERE status IN ('pending', 'queued', 'running')
ORDER BY priority DESC, created_at ASC;

-- Grant permissions
GRANT SELECT ON active_jobs_queue TO authenticated;

-- Comments
COMMENT ON TABLE md_jobs IS 'Molecular dynamics simulation jobs queue for serverless tier';
COMMENT ON COLUMN md_jobs.config IS 'JSONB containing MDSimulationConfig: timestep, totalTime, temperature, ensemble, integrator, etc.';
COMMENT ON COLUMN md_jobs.result_metadata IS 'JSONB containing MDResult: trajectoryUrl, energyPlotUrl, statisticsUrl, frameCount, etc.';
COMMENT ON FUNCTION get_queue_stats() IS 'Returns queue statistics for monitoring and wait time estimation';
