# Quick Start: MD Architecture

## 5-Minute Integration Guide

### 1. Import Services

```typescript
import { mdEngine } from '@/services/md-engine';
import { createBrowserMDEngine } from '@/lib/md-browser';
import { jobQueue } from '@/services/job-queue';
import { desktopExport } from '@/services/desktop-export';
import { MDTier, BrowserMDConfig, ServerlessMDConfig } from '@/types/md-types';
```

### 2. Initialize Job Queue (Once)

```typescript
// In your app initialization (e.g., _app.tsx)
jobQueue.initialize({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  pollingInterval: 5000,  // 5 seconds
  maxRetries: 3
});
```

### 3. Validate Simulation

```typescript
// Get atom count from your structure
const atomCount = getAtomCount(pdbData);

// Validate and get recommendation
const validation = mdEngine.validateSimulation(atomCount);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Show warnings to user
validation.warnings.forEach(warning => {
  console.warn(warning);
});

// Use recommended tier
const tier = validation.tier;
```

### 4. Run Browser Simulation

```typescript
const config: BrowserMDConfig = {
  tier: MDTier.BROWSER,
  atomCount: 300,
  timestep: 2,           // femtoseconds
  totalTime: 10,         // picoseconds
  temperature: 300,      // Kelvin
  ensemble: 'NVT',
  integrator: 'verlet',
  outputFrequency: 10,   // frames per ps
  maxAtoms: 500,
  maxTime: 30,
  warningShown: true
};

const engine = createBrowserMDEngine({
  containerId: 'md-viewer',
  onFrame: (frame) => {
    console.log(`Frame ${frame.frameNumber}: ${frame.energy} kJ/mol`);
    updateVisualization(frame.positions);
  },
  onProgress: (progress) => {
    updateProgressBar(progress);
  },
  onComplete: (result) => {
    console.log('Simulation complete!', result);
  },
  onError: (error) => {
    console.error('Simulation error:', error);
  }
});

await engine.initialize(config, pdbData);
await engine.start();
```

### 5. Submit Serverless Job

```typescript
const config: ServerlessMDConfig = {
  tier: MDTier.SERVERLESS,
  atomCount: 2000,
  timestep: 2,
  totalTime: 100,        // picoseconds
  temperature: 300,
  ensemble: 'NPT',
  integrator: 'langevin',
  outputFrequency: 10,
  maxAtoms: 5000,
  priority: 'normal',
  notifyOnComplete: true,
  userId: user.id
};

// Submit job
const job = await jobQueue.submitJob({
  config,
  structureId: 'protein-123',
  structureData: pdbData,
  userId: user.id
});

// Poll for completion
await jobQueue.pollJob(job.id, (updatedJob) => {
  console.log(`Progress: ${updatedJob.progress}%`);
  updateUI(updatedJob);
});

// Get results
const result = await jobQueue.getJobResult(job.id);
displayTrajectory(result.trajectoryUrl);
```

### 6. Export for Desktop

```typescript
import { ExportFormat } from '@/types/md-types';

const exportConfig = {
  format: ExportFormat.GROMACS,
  includeTopology: true,
  includeParameters: true,
  includeRunScript: true,
  includeDocumentation: true
};

const result = await desktopExport.exportSimulation(
  pdbData,
  config,
  exportConfig
);

// Create download links
result.files.forEach(file => {
  createDownloadLink(file.filename, file.content);
});

// Show README
displayMarkdown(result.readme);

// Show citations
displayCitations(result.citations);
```

## Common Patterns

### Check Capabilities

```typescript
const capabilities = mdEngine.getCapabilities();

console.log('Supported tiers:', capabilities.supportedTiers);
console.log('Max atoms per tier:', capabilities.maxAtomsPerTier);
console.log('Supported formats:', capabilities.supportedExportFormats);
```

### Estimate Wait Time

```typescript
const stats = await jobQueue.getQueueStats();
const waitTime = await jobQueue.estimateWaitTime('normal');

console.log(`Queue has ${stats.queued} jobs`);
console.log(`Estimated wait: ${waitTime} seconds`);
```

### Pause/Resume Browser Simulation

```typescript
// Pause
engine.pause();

// Resume
engine.resume();

// Stop
engine.stop();

// Get status
const status = engine.getStatus();
console.log('Running:', status.isRunning);
console.log('Frames:', status.frameCount);
```

### Cancel Serverless Job

```typescript
await jobQueue.cancelJob(job.id);
```

## UI Integration Example

```tsx
function SimulationPanel({ pdbData }: { pdbData: string }) {
  const [tier, setTier] = useState<MDTier>(MDTier.BROWSER);
  const [progress, setProgress] = useState(0);

  const handleStart = async () => {
    const atomCount = getAtomCount(pdbData);
    const validation = mdEngine.validateSimulation(atomCount);

    if (!validation.isValid) {
      showErrors(validation.errors);
      return;
    }

    setTier(validation.tier);

    if (validation.tier === MDTier.BROWSER) {
      await runBrowserSimulation();
    } else if (validation.tier === MDTier.SERVERLESS) {
      await submitServerlessJob();
    } else {
      showExportDialog();
    }
  };

  return (
    <div>
      <button onClick={handleStart}>Start Simulation</button>
      <ProgressBar value={progress} />
      <TierBadge tier={tier} />
    </div>
  );
}
```

## Error Handling

```typescript
try {
  await engine.start();
} catch (error) {
  if (error.message.includes('exceeds')) {
    // Atom limit exceeded
    suggestServerlessTier();
  } else if (error.message.includes('time limit')) {
    // Time limit exceeded
    showPartialResults();
  } else {
    // Other errors
    logError(error);
  }
}
```

## Database Setup

Deploy the migration to Supabase:

```bash
# Using Supabase CLI
supabase migration new md_jobs_table
# Copy contents from config/supabase-migrations/001_md_jobs_table.sql
supabase migration up

# Or via Supabase Dashboard
# SQL Editor > New Query > Paste migration > Run
```

## Testing

```bash
npm test tests/md-engine.test.ts
```

## Next Steps

1. Integrate WebDynamica library
2. Create Supabase Edge Function for OpenMM
3. Build UI components
4. Add trajectory visualization
5. Implement notifications

## File Locations

- Types: `/src/types/md-types.ts`
- MD Engine: `/src/services/md-engine.ts`
- Browser MD: `/src/lib/md-browser.ts`
- Job Queue: `/src/services/job-queue.ts`
- Desktop Export: `/src/services/desktop-export.ts`
- Migration: `/config/supabase-migrations/001_md_jobs_table.sql`
- Docs: `/docs/architecture/md-architecture.md`
- Tests: `/tests/md-engine.test.ts`

## Support

See full documentation: `/docs/architecture/md-architecture.md`
