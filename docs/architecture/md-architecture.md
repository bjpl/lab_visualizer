# Molecular Dynamics Architecture - 3-Tier System

## Overview

The LAB Visualization Platform implements a **hybrid 3-tier molecular dynamics architecture** that provides appropriate simulation capabilities across different system sizes and use cases.

## Architecture Tiers

### Tier 1: Browser Demo (WebDynamica)

**Purpose**: Educational demonstrations and quick exploratory simulations

**Capabilities**:
- **Maximum atoms**: 500
- **Maximum time**: 30 seconds wall-clock execution
- **Ensemble support**: NVE, NVT, NPT
- **Integration**: Client-side WebDynamica library

**Use Cases**:
- Classroom demonstrations
- Quick visualization of molecular motion
- Interactive learning modules
- Small peptide dynamics

**Limitations**:
- Not suitable for production research
- Limited accuracy for complex systems
- Performance varies by device
- No long-term trajectory storage

**Implementation**: `/src/lib/md-browser.ts`

### Tier 2: Serverless Simulation (OpenMM Edge Functions)

**Purpose**: Research-grade simulations for medium-sized systems

**Capabilities**:
- **Maximum atoms**: 5,000
- **Scalability**: Auto-scaling via Supabase Edge Functions
- **Queue system**: Priority-based job queue
- **Storage**: Results stored in Supabase Storage
- **Notifications**: Email/push notifications on completion

**Use Cases**:
- Protein folding simulations
- Ligand-protein docking validation
- Membrane protein dynamics
- Small protein complexes

**Workflow**:
1. User submits job via UI
2. Job queued in Supabase database
3. Edge Function picks up job
4. OpenMM executes simulation
5. Results uploaded to Storage
6. User notified of completion

**Implementation**:
- `/src/services/job-queue.ts` - Queue management
- `/config/supabase-migrations/001_md_jobs_table.sql` - Database schema
- Edge Function (to be implemented): `/supabase/functions/md-worker`

### Tier 3: Desktop Export

**Purpose**: Production-scale simulations on local HPC or workstations

**Capabilities**:
- **No atom limit**: Suitable for any system size
- **Export formats**: GROMACS, NAMD, AMBER, LAMMPS
- **Full control**: Complete parameter customization
- **HPC ready**: Prepared for cluster execution

**Supported Software**:
- **GROMACS**: High-performance parallel MD
- **NAMD**: Scalable biomolecular simulations
- **AMBER**: Advanced force field support
- **LAMMPS**: General-purpose MD engine

**Export Contents**:
- Structure files (PDB, GRO, etc.)
- Topology files
- Parameter files
- Run scripts
- Documentation and citations

**Implementation**: `/src/services/desktop-export.ts`

## Tier Selection Logic

The system automatically recommends the appropriate tier based on:

```typescript
function recommendTier(atomCount: number, simulationLength: number): MDTier {
  if (atomCount <= 500 && simulationLength <= 10) {
    return MDTier.BROWSER;  // Quick demo
  }

  if (atomCount <= 5000 && simulationLength <= 1000) {
    return MDTier.SERVERLESS;  // Research-grade
  }

  return MDTier.DESKTOP;  // Production scale
}
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MD Engine Service (Abstraction)            │   │
│  │              /src/services/md-engine.ts              │   │
│  └─────────────────────────────────────────────────────┘   │
│                      │         │         │                   │
│        ┌─────────────┴─────────┴─────────┴─────────┐       │
│        ▼                  ▼                  ▼               │
│  ┌──────────┐     ┌─────────────┐     ┌─────────────┐     │
│  │ Browser  │     │ Job Queue   │     │  Desktop    │     │
│  │   MD     │     │  Service    │     │   Export    │     │
│  │          │     │             │     │             │     │
│  │ Tier 1   │     │  Tier 2     │     │  Tier 3     │     │
│  └──────────┘     └─────────────┘     └─────────────┘     │
│       │                  │                                   │
│       │                  ▼                                   │
│       │           ┌─────────────┐                           │
│       │           │  Supabase   │                           │
│       │           │  Database   │                           │
│       │           │  & Storage  │                           │
│       │           └─────────────┘                           │
│       │                  │                                   │
│       ▼                  ▼                                   │
│  WebDynamica      Edge Function                             │
│  (Browser)         (OpenMM)                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Type System

All tiers share a common type system defined in `/src/types/md-types.ts`:

- **MDTier**: Enum for tier selection
- **JobStatus**: Job lifecycle states
- **MDSimulationConfig**: Unified configuration interface
- **MDJob**: Job queue record
- **MDResult**: Simulation results
- **TrajectoryFrame**: Frame data structure

## API Contracts

### MD Engine Service

```typescript
// Validate simulation requirements
validateSimulation(atomCount: number, tier?: MDTier): MDValidation

// Get system capabilities
getCapabilities(): MDCapabilities

// Recommend appropriate tier
recommendTier(atomCount: number, length: number): MDTier
```

### Browser MD Engine

```typescript
// Initialize simulation
initialize(config: BrowserMDConfig, pdbData: string): Promise<void>

// Control simulation
start(): Promise<void>
pause(): void
resume(): void
stop(): void

// Access results
getFrames(): TrajectoryFrame[]
getStatus(): SimulationStatus
```

### Job Queue Service

```typescript
// Submit simulation job
submitJob(submission: JobSubmission): Promise<MDJob>

// Monitor job
getJob(jobId: string): Promise<MDJob>
pollJob(jobId: string, onProgress): Promise<MDJob>

// Queue management
cancelJob(jobId: string): Promise<void>
getQueueStats(): Promise<QueueStats>
```

### Desktop Export Service

```typescript
// Export simulation setup
exportSimulation(
  structure: string,
  config: MDSimulationConfig,
  exportConfig: DesktopExportConfig
): Promise<ExportResult>
```

## Database Schema

### md_jobs Table

```sql
CREATE TABLE md_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  status job_status,
  tier md_tier,
  priority priority_level,
  structure_id TEXT,
  atom_count INTEGER,
  config JSONB,
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress INTEGER,
  result_storage_path TEXT,
  result_metadata JSONB,
  error_message TEXT
);
```

See full migration: `/config/supabase-migrations/001_md_jobs_table.sql`

## Security Considerations

### Browser Tier
- Input validation for atom count and time limits
- Client-side resource monitoring
- Warning labels for limitations

### Serverless Tier
- Row-Level Security (RLS) policies
- User authentication required
- Job ownership validation
- Rate limiting per user
- Storage quota enforcement

### Desktop Export
- No server-side execution
- File generation only
- Citation compliance

## Performance Characteristics

| Tier       | Atoms | Time/Step | Total Time | Accuracy |
|------------|-------|-----------|------------|----------|
| Browser    | ≤500  | ~100µs    | <30s       | Demo     |
| Serverless | ≤5K   | ~10µs     | Minutes    | Research |
| Desktop    | Any   | ~1µs      | Hours-Days | Production |

## Error Handling

### Browser Tier Errors
- Atom limit exceeded → Recommend serverless
- Time limit exceeded → Stop simulation, show partial results
- Browser crash → Graceful degradation

### Serverless Tier Errors
- Job submission failed → Retry with exponential backoff
- Execution timeout → Mark failed, notify user
- Storage error → Retry, fallback to error state

### Export Errors
- Invalid structure → Validation error with details
- Unsupported format → List supported formats
- File generation error → Detailed error message

## Monitoring & Observability

### Metrics to Track
- Job submission rate
- Queue length and wait times
- Job success/failure rates
- Average execution times
- Resource utilization

### Logging
- All job state transitions
- Error details with stack traces
- Performance bottlenecks
- User actions

## Future Enhancements

1. **GPU Acceleration**: OpenMM GPU support in Edge Functions
2. **Enhanced Force Fields**: CHARMM, AMBER support
3. **Trajectory Analysis**: Built-in analysis tools
4. **Collaborative Sessions**: Multi-user simulation review
5. **ML Integration**: AlphaFold refinement, property prediction
6. **Cloud HPC**: Integration with AWS Batch, Azure CycleCloud

## Testing Strategy

### Browser Tier
- Unit tests for validation logic
- Integration tests with mock WebDynamica
- Performance benchmarks across devices
- UI/UX testing for warnings

### Serverless Tier
- Unit tests for queue operations
- Integration tests with Supabase
- Load testing for queue scalability
- End-to-end simulation tests

### Desktop Export
- Unit tests for file generation
- Format validation tests
- Citation compliance checks
- Cross-platform compatibility

## Documentation

- **User Guide**: How to choose the right tier
- **API Reference**: Complete TypeScript documentation
- **Admin Guide**: Queue management and monitoring
- **Developer Guide**: Adding new export formats

## References

1. WebDynamica: https://github.com/jeffcomer/webdynamica
2. OpenMM: http://openmm.org/
3. GROMACS: https://www.gromacs.org/
4. NAMD: https://www.ks.uiuc.edu/Research/namd/
5. Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

**Document Version**: 1.0.0
**Last Updated**: November 17, 2025
**Status**: POC Implementation Complete
