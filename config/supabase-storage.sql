-- Supabase Storage Configuration for MD Simulations
-- Buckets and policies for trajectory storage

-- Create storage bucket for simulations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'simulations',
  'simulations',
  true,
  52428800, -- 50 MB limit
  ARRAY[
    'chemical/x-pdb',
    'chemical/x-mmcif',
    'application/octet-stream',
    'application/json',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'chemical/x-pdb',
    'chemical/x-mmcif',
    'application/octet-stream',
    'application/json',
    'text/plain'
  ];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own simulation files
CREATE POLICY "Users can upload own simulation files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'simulations'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own simulation files
CREATE POLICY "Users can view own simulation files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'simulations'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own simulation files
CREATE POLICY "Users can update own simulation files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'simulations'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own simulation files
CREATE POLICY "Users can delete own simulation files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'simulations'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Public can view public simulation results
CREATE POLICY "Public can view public results"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'simulations'
  AND (storage.foldername(name))[2] IN ('trajectories', 'energy')
);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'simulations');

-- Create folder structure (metadata only)
-- Actual folders are created on first upload
COMMENT ON TABLE storage.objects IS 'Folder structure:
- structures/{user_id}/{job_id}.pdb - Input structures
- trajectories/{user_id}/{job_id}.dcd - Output trajectories
- energy/{user_id}/{job_id}.json - Energy data
- logs/{user_id}/{job_id}.log - Simulation logs
- snapshots/{user_id}/{job_id}/*.pdb - Frame snapshots
';
