# LAB Visualization Platform - Deployment Checklist
## Sprint 2: Integration & Deployment

**Document Version:** 1.0.0
**Date:** November 17, 2025
**Status:** Integration Checklist
**Prerequisites:** Sprint 0 & Sprint 1 Complete

---

## 30-Point Integration Checklist

### Phase 1: Infrastructure Setup (5 points) ✅ 0/5

#### ☐ 1. Supabase Project Initialization
**Priority:** Critical
**Estimated Time:** 30 minutes
**Dependencies:** None

**Steps:**
1. Create Supabase project via dashboard
2. Note project URL and keys
3. Enable required services (Database, Storage, Realtime, Edge Functions, Auth)
4. Configure project settings

**Validation:**
```bash
# Test connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Expected: 200 OK response
```

**Success Criteria:**
- [ ] Project created and accessible
- [ ] All required services enabled
- [ ] API keys obtained
- [ ] Connection test successful

**Rollback:** Delete project from dashboard

---

#### ☐ 2. Database Migrations Applied
**Priority:** Critical
**Estimated Time:** 15 minutes
**Dependencies:** Task 1 complete

**Steps:**
1. Install Supabase CLI: `npm install -g supabase`
2. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Apply migrations:
   ```bash
   supabase db push
   # Or individually:
   psql $DATABASE_URL < supabase/migrations/001_base_schema.sql
   psql $DATABASE_URL < supabase/migrations/002_md_jobs_schema.sql
   psql $DATABASE_URL < supabase/migrations/003_collaboration_schema.sql
   psql $DATABASE_URL < supabase/migrations/004_cache_analytics_schema.sql
   ```

**Validation:**
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Expected: 8 tables (structures, favorites, user_preferences,
--           md_simulation_jobs, collaboration_sessions,
--           collaboration_users, annotations, activity_feed,
--           camera_states, cache_metadata)

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Expected: All user-data tables have rowsecurity = true
```

**Success Criteria:**
- [ ] All migrations applied successfully
- [ ] 8 tables created
- [ ] RLS enabled on 7 tables
- [ ] Indexes created
- [ ] Triggers configured

**Rollback:** `supabase db reset`

---

#### ☐ 3. Storage Buckets Created
**Priority:** Critical
**Estimated Time:** 10 minutes
**Dependencies:** Task 1 complete

**Steps:**
1. Create buckets via Supabase dashboard or CLI:
   ```bash
   supabase storage create trajectories --public false
   supabase storage create structures --public true
   supabase storage create exports --public false
   supabase storage create avatars --public true
   ```

2. Configure policies:
   ```sql
   -- trajectories bucket: Users can only access own files
   CREATE POLICY "Users access own trajectories"
   ON storage.objects FOR ALL
   USING (bucket_id = 'trajectories' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- structures bucket: Public read
   CREATE POLICY "Public read structures"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'structures');

   -- exports bucket: Users can only access own files
   CREATE POLICY "Users access own exports"
   ON storage.objects FOR ALL
   USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- avatars bucket: Public read
   CREATE POLICY "Public read avatars"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');
   ```

**Validation:**
```bash
# List buckets
supabase storage list

# Test upload
echo "test" > test.txt
supabase storage upload structures test.txt

# Expected: Upload successful
```

**Success Criteria:**
- [ ] 4 buckets created
- [ ] Storage policies configured
- [ ] Test upload/download successful

**Rollback:** Delete buckets via dashboard

---

#### ☐ 4. Edge Functions Deployed
**Priority:** Critical
**Estimated Time:** 20 minutes
**Dependencies:** Task 1 complete, Docker installed

**Steps:**
1. Build Docker image:
   ```bash
   cd supabase/functions/md-simulation
   docker build -t md-simulation:latest .
   ```

2. Test locally:
   ```bash
   supabase functions serve md-simulation
   curl -X POST http://localhost:54321/functions/v1/md-simulation \
     -H "Content-Type: application/json" \
     -d '{"jobId":"test-123"}'
   ```

3. Deploy to Supabase:
   ```bash
   supabase functions deploy md-simulation \
     --project-ref YOUR_PROJECT_REF \
     --no-verify-jwt \
     --docker
   ```

**Validation:**
```bash
# Test deployed function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/md-simulation \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"test-123","test":true}'

# Expected: 200 OK with test response
```

**Success Criteria:**
- [ ] Docker image built successfully
- [ ] Local testing successful
- [ ] Deployed to Supabase
- [ ] Production endpoint accessible
- [ ] OpenMM 8.1.1 available in container

**Rollback:** `supabase functions delete md-simulation`

---

#### ☐ 5. Environment Variables Configured
**Priority:** Critical
**Estimated Time:** 15 minutes
**Dependencies:** Tasks 1-4 complete

**Steps:**
1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in values:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   SUPABASE_JWT_SECRET=your-jwt-secret

   # Vercel
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # External APIs (optional, uses defaults)
   RCSB_PDB_API_URL=https://data.rcsb.org/rest/v1

   # Monitoring
   NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

   # Feature Flags
   NEXT_PUBLIC_ENABLE_COLLABORATION=true
   NEXT_PUBLIC_ENABLE_MD_SIMULATIONS=true
   NEXT_PUBLIC_ENABLE_CACHE_WARMING=true
   NEXT_PUBLIC_ENABLE_LOD_RENDERING=true
   NEXT_PUBLIC_ENABLE_BROWSER_MD=true
   ```

3. Configure Vercel production environment via dashboard

**Validation:**
```bash
# Test environment loading
npm run dev
# Expected: Server starts without errors

# Check loaded variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
# Expected: https://YOUR_PROJECT.supabase.co
```

**Success Criteria:**
- [ ] All 24 required variables set
- [ ] Development environment working
- [ ] Vercel production environment configured
- [ ] No sensitive data in git

**Rollback:** Restore .env.local from backup

---

### Phase 2: Dependencies & Configuration (5 points) ✅ 0/5

#### ☐ 6. NPM Packages Installed
**Priority:** Critical
**Estimated Time:** 10 minutes
**Dependencies:** Node.js 18+, npm 9+

**Steps:**
1. Install dependencies:
   ```bash
   npm ci --legacy-peer-deps
   ```

2. Verify critical packages:
   ```bash
   npm list molstar @supabase/supabase-js zustand @tanstack/react-query idb
   ```

**Validation:**
```bash
# Check install
ls node_modules/molstar
ls node_modules/@supabase/supabase-js
ls node_modules/zustand
ls node_modules/@tanstack/react-query
ls node_modules/idb

# Check for vulnerabilities
npm audit --production

# Expected: 0 high/critical vulnerabilities
```

**Success Criteria:**
- [ ] All dependencies installed
- [ ] No missing peer dependencies
- [ ] 0 high/critical vulnerabilities
- [ ] node_modules size <500MB

**Rollback:** `rm -rf node_modules && npm install`

---

#### ☐ 7. TypeScript Paths Configured
**Priority:** High
**Estimated Time:** 5 minutes
**Dependencies:** Task 6 complete

**Steps:**
1. Verify `tsconfig.json` paths:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. Test imports:
   ```typescript
   import { supabase } from '@/lib/supabase';
   import { MolstarService } from '@/services/molstar-service';
   ```

**Validation:**
```bash
# Type check
npm run typecheck

# Expected: 0 errors
```

**Success Criteria:**
- [ ] TypeScript compilation successful
- [ ] All path aliases working
- [ ] 0 type errors
- [ ] Strict mode enabled

**Rollback:** Restore tsconfig.json from git

---

#### ☐ 8. Supabase Client Initialized
**Priority:** Critical
**Estimated Time:** 10 minutes
**Dependencies:** Tasks 5, 6 complete

**Steps:**
1. Create Supabase client:
   ```typescript
   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         persistSession: true,
         autoRefreshToken: true,
         detectSessionInUrl: true,
         flowType: 'pkce',
       },
     }
   );
   ```

2. Test connection:
   ```typescript
   const { data, error } = await supabase.from('structures').select('count');
   ```

**Validation:**
```bash
# Test Supabase connection
npm run test -- supabase-client.test.ts

# Expected: Connection test passes
```

**Success Criteria:**
- [ ] Client initialized
- [ ] Database connection working
- [ ] Auth configured
- [ ] Realtime enabled

**Rollback:** None (configuration only)

---

#### ☐ 9. Mol* Library Loaded
**Priority:** Critical
**Estimated Time:** 15 minutes
**Dependencies:** Task 6 complete

**Steps:**
1. Import Mol* in service:
   ```typescript
   // src/services/molstar-service.ts
   import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
   import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
   ```

2. Initialize viewer:
   ```typescript
   const viewer = await createPluginUI(element, DefaultPluginUISpec());
   ```

**Validation:**
```bash
# Test Mol* loading
npm run test -- molstar-service.test.ts

# Build and check bundle size
npm run build
# Expected: Mol* lazy-loaded, bundle <1.5MB
```

**Success Criteria:**
- [ ] Mol* imports successful
- [ ] Viewer initializes
- [ ] Bundle size <1.5MB
- [ ] Lazy loading working

**Rollback:** None (library already installed)

---

#### ☐ 10. React Query Provider Setup
**Priority:** High
**Estimated Time:** 10 minutes
**Dependencies:** Task 6 complete

**Steps:**
1. Create query client:
   ```typescript
   // src/app/providers.tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
       },
     },
   });
   ```

2. Wrap app:
   ```typescript
   <QueryClientProvider client={queryClient}>
     {children}
   </QueryClientProvider>
   ```

**Validation:**
```bash
# Test query functionality
npm run test -- react-query.test.ts

# Expected: Queries working, cache functioning
```

**Success Criteria:**
- [ ] Provider configured
- [ ] Cache settings correct
- [ ] Devtools available (dev mode)
- [ ] Queries executing

**Rollback:** Remove provider wrapper

---

### Phase 3: Feature Wiring (10 points) ✅ 0/10

#### ☐ 11. PDB Fetcher → Cache Service Connection
**Priority:** Critical
**Estimated Time:** 20 minutes
**Dependencies:** Tasks 6-10 complete

**Steps:**
1. Wire cache service into PDB fetcher:
   ```typescript
   // src/services/pdb-fetcher.ts
   async fetchStructure(pdbId: string) {
     // L1: IndexedDB
     let data = await cacheService.get('L1', pdbId);
     if (data) return data;

     // L2: Vercel KV
     data = await cacheService.get('L2', pdbId);
     if (data) {
       await cacheService.set('L1', pdbId, data);
       return data;
     }

     // L3: Supabase Storage
     data = await cacheService.get('L3', pdbId);
     if (data) {
       await cacheService.set('L2', pdbId, data);
       await cacheService.set('L1', pdbId, data);
       return data;
     }

     // External API
     data = await this.fetchFromExternal(pdbId);
     await cacheService.setAll(pdbId, data);
     return data;
   }
   ```

**Validation:**
```bash
# Test cache cascade
npm run test -- pdb-fetcher-cache.test.ts

# Manual test
curl http://localhost:3000/api/structures/1crn
# First call: Should hit external API
# Second call: Should hit L1 cache (<50ms)
```

**Success Criteria:**
- [ ] L1 cache working (IndexedDB)
- [ ] L2 cache working (Vercel KV)
- [ ] L3 cache working (Supabase Storage)
- [ ] Cache cascade functioning
- [ ] Cache miss falls back to external API

**Rollback:** Use direct fetching without cache

---

#### ☐ 12. Cache Service → IndexedDB Integration
**Priority:** High
**Estimated Time:** 15 minutes
**Dependencies:** Task 6 complete

**Steps:**
1. Initialize IndexedDB:
   ```typescript
   // src/lib/cache/indexeddb.ts
   import { openDB } from 'idb';

   const db = await openDB('lab-visualizer', 1, {
     upgrade(db) {
       db.createObjectStore('structures', { keyPath: 'pdbId' });
       db.createObjectStore('trajectories', { keyPath: 'jobId' });
     },
   });
   ```

2. Implement cache methods:
   ```typescript
   async get(key: string) {
     return db.get('structures', key);
   }

   async set(key: string, value: any) {
     await db.put('structures', { pdbId: key, data: value, timestamp: Date.now() });
   }
   ```

**Validation:**
```bash
# Test IndexedDB operations
npm run test -- indexeddb.test.ts

# Check browser DevTools → Application → IndexedDB
# Expected: lab-visualizer database with structures store
```

**Success Criteria:**
- [ ] IndexedDB initialized
- [ ] Structures store created
- [ ] Get/set operations working
- [ ] TTL expiration functional
- [ ] Quota management active

**Rollback:** Clear IndexedDB: `indexedDB.deleteDatabase('lab-visualizer')`

---

#### ☐ 13. Mol* Viewer → PDB Data Connection
**Priority:** Critical
**Estimated Time:** 20 minutes
**Dependencies:** Tasks 9, 11 complete

**Steps:**
1. Connect viewer to data hook:
   ```typescript
   // components/viewer/MolstarViewer.tsx
   const { data: structure, isLoading } = useStructure(pdbId);

   useEffect(() => {
     if (structure && molstarRef.current) {
       molstarService.loadStructure(structure, molstarRef.current);
     }
   }, [structure]);
   ```

2. Implement loader:
   ```typescript
   // services/molstar-service.ts
   async loadStructure(structureData: string, container: HTMLElement) {
     const plugin = await createPluginUI(container, spec);
     const data = await plugin.builders.data.rawData({ data: structureData });
     await plugin.builders.structure.parseTrajectory(data, 'pdb');
   }
   ```

**Validation:**
```bash
# Test structure loading
npm run test -- molstar-viewer.test.ts

# Manual test
# Navigate to /viewer/1crn
# Expected: Structure loads and displays in 3D
```

**Success Criteria:**
- [ ] Structure data flows to viewer
- [ ] Mol* displays structure correctly
- [ ] Loading states working
- [ ] Error handling functional

**Rollback:** Use static test structure

---

#### ☐ 14. Viewer UI → Mol* Service Wiring
**Priority:** High
**Estimated Time:** 25 minutes
**Dependencies:** Tasks 9, 13 complete

**Steps:**
1. Wire controls to service:
   ```typescript
   // components/viewer/ViewerControls.tsx
   const handleRepresentationChange = (repr: string) => {
     molstarService.setRepresentation(repr);
   };

   const handleColorSchemeChange = (scheme: string) => {
     molstarService.setColorScheme(scheme);
   };
   ```

2. Implement service methods:
   ```typescript
   // services/molstar-service.ts
   setRepresentation(type: RepresentationType) {
     const builder = this.plugin.builders.structure.representation;
     builder.addRepresentation(structure, { type });
   }
   ```

**Validation:**
```bash
# Test UI controls
npm run test:e2e -- viewer-controls.spec.ts

# Manual test
# Navigate to /viewer/1crn
# Change representation to "ball-and-stick"
# Expected: Representation changes in real-time
```

**Success Criteria:**
- [ ] All 7 representations working
- [ ] All 7 color schemes working
- [ ] Display toggles functional
- [ ] Camera controls responsive
- [ ] Export working

**Rollback:** Disable controls temporarily

---

#### ☐ 15. State Store → Component Bindings
**Priority:** High
**Estimated Time:** 20 minutes
**Dependencies:** Task 10 complete

**Steps:**
1. Connect Zustand stores:
   ```typescript
   // components/viewer/MolstarViewer.tsx
   const { representation, colorScheme } = useVisualizationStore();
   const { theme, sidebarOpen } = useUIStore();

   useEffect(() => {
     molstarService.setRepresentation(representation);
   }, [representation]);
   ```

2. Implement selectors:
   ```typescript
   // stores/visualization-store.ts
   export const useVisualizationStore = create<VisualizationStore>((set) => ({
     representation: 'cartoon',
     colorScheme: 'chain-id',
     setRepresentation: (repr) => set({ representation: repr }),
   }));
   ```

**Validation:**
```bash
# Test store updates
npm run test -- visualization-store.test.ts

# Check Redux DevTools (Zustand)
# Expected: State updates visible
```

**Success Criteria:**
- [ ] All 4 stores wired (visualization, collaboration, simulation, UI)
- [ ] State updates propagate to components
- [ ] Persistence working (selected stores)
- [ ] Performance acceptable (<5ms updates)

**Rollback:** Use local component state

---

#### ☐ 16. Job Queue → OpenMM Worker Link
**Priority:** Critical
**Estimated Time:** 30 minutes
**Dependencies:** Tasks 2, 4, 8 complete

**Steps:**
1. Wire job submission:
   ```typescript
   // services/job-queue.ts
   async submitJob(config: MDSimulationConfig) {
     const job = await supabase
       .from('md_simulation_jobs')
       .insert({ config, status: 'pending' })
       .select()
       .single();

     await supabase.functions.invoke('md-simulation', {
       body: { jobId: job.data.id },
     });

     return job.data;
   }
   ```

2. Setup realtime updates:
   ```typescript
   // hooks/useJobQueue.ts
   useEffect(() => {
     const subscription = supabase
       .channel('job-updates')
       .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'md_simulation_jobs',
         filter: `user_id=eq.${userId}`,
       }, (payload) => {
         queryClient.setQueryData(['jobs', payload.new.id], payload.new);
       })
       .subscribe();

     return () => subscription.unsubscribe();
   }, [userId]);
   ```

**Validation:**
```bash
# Test job submission
npm run test -- job-queue.test.ts

# Manual test
# Submit a test job (100 atoms, 10 steps)
# Expected: Job queued, starts, completes within 1 minute
```

**Success Criteria:**
- [ ] Job submission working
- [ ] Edge Function invoked
- [ ] Progress updates via Realtime
- [ ] Job completion detected
- [ ] Results stored in Storage bucket

**Rollback:** Disable job submission UI

---

#### ☐ 17. Collaboration → Realtime Subscription
**Priority:** High
**Estimated Time:** 30 minutes
**Dependencies:** Tasks 2, 8 complete

**Steps:**
1. Setup Realtime channel:
   ```typescript
   // hooks/useCollaboration.ts
   const channel = supabase.channel(`session:${sessionId}`)
     .on('presence', { event: 'sync' }, () => {
       const users = channel.presenceState();
       setParticipants(users);
     })
     .on('broadcast', { event: 'cursor-move' }, (payload) => {
       updateCursor(payload);
     })
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'annotations',
       filter: `session_id=eq.${sessionId}`,
     }, (payload) => {
       addAnnotation(payload.new);
     })
     .subscribe();
   ```

2. Implement cursor broadcasting:
   ```typescript
   const handleCursorMove = throttle((position) => {
     channel.send({
       type: 'broadcast',
       event: 'cursor-move',
       payload: { userId, position },
     });
   }, 100); // 10Hz
   ```

**Validation:**
```bash
# Test collaboration
npm run test:e2e -- collaboration.spec.ts

# Manual test
# Open two browser windows
# Create session in window 1
# Join session in window 2
# Expected: Both users see each other's cursors
```

**Success Criteria:**
- [ ] Session creation working
- [ ] User presence tracking
- [ ] Cursor broadcasting (10Hz)
- [ ] Annotation sync
- [ ] Camera sync (leader mode)
- [ ] Activity feed updates

**Rollback:** Disable collaboration features

---

#### ☐ 18. LOD Manager → Mol* Renderer Hook
**Priority:** Medium
**Estimated Time:** 20 minutes
**Dependencies:** Tasks 9, 13 complete

**Steps:**
1. Connect LOD manager:
   ```typescript
   // components/viewer/MolstarViewer.tsx
   const lodManager = LODManager.getInstance();

   useEffect(() => {
     lodManager.setViewer(molstarService);
     lodManager.setDeviceCapabilities(deviceInfo);
   }, [molstarService]);
   ```

2. Implement progressive loading:
   ```typescript
   // lib/lod-manager.ts
   async loadStructure(structureData: Structure) {
     // Stage 1: Preview (<200ms)
     await this.loadPreview(structureData);
     emit('stage-complete', 1);

     // Stage 2: Interactive (<1s)
     await this.loadInteractive(structureData);
     emit('stage-complete', 2);

     // Stage 3: Full Detail (<3s)
     await this.loadFullDetail(structureData);
     emit('stage-complete', 3);
   }
   ```

**Validation:**
```bash
# Test LOD loading
npm run test -- lod-manager.test.ts

# Manual test
# Load large structure (50K atoms)
# Expected: 3 progressive stages, each faster than target
```

**Success Criteria:**
- [ ] Stage 1 <200ms (preview)
- [ ] Stage 2 <1s (interactive)
- [ ] Stage 3 <3s (full detail)
- [ ] Smooth transitions
- [ ] Loading indicators working

**Rollback:** Load full structure immediately

---

#### ☐ 19. Quality Manager → Performance Profiler
**Priority:** Medium
**Estimated Time:** 15 minutes
**Dependencies:** Task 18 complete

**Steps:**
1. Wire quality manager:
   ```typescript
   // services/quality-manager.ts
   const profiler = PerformanceProfiler.getInstance();

   profiler.onFPSChange((fps) => {
     if (fps < 30) {
       lodManager.decreaseQuality();
     } else if (fps > 55) {
       lodManager.increaseQuality();
     }
   });
   ```

2. Implement FPS tracking:
   ```typescript
   // lib/performance-profiler.ts
   trackFPS() {
     requestAnimationFrame(() => {
       const fps = calculateFPS();
       this.emit('fps-change', fps);
       this.trackFPS();
     });
   }
   ```

**Validation:**
```bash
# Test auto-adjustment
npm run test -- quality-manager.test.ts

# Manual test
# Load structure, monitor DevTools Performance
# Expected: Quality auto-adjusts to maintain 30fps
```

**Success Criteria:**
- [ ] FPS tracking working
- [ ] Auto-adjustment functional
- [ ] Quality presets working
- [ ] Manual override possible

**Rollback:** Disable auto-adjustment

---

#### ☐ 20. Browser MD → Tier Validation
**Priority:** Low
**Estimated Time:** 10 minutes
**Dependencies:** Task 6 complete

**Steps:**
1. Implement validation:
   ```typescript
   // services/browser-simulation.ts
   validateConfig(config: BrowserMDConfig) {
     if (config.atomCount > 500) {
       throw new Error('Browser tier limited to 500 atoms. Use serverless tier.');
     }
     if (config.timeLimit > 30) {
       throw new Error('Browser tier limited to 30 seconds.');
     }
   }
   ```

2. Wire to UI:
   ```typescript
   // components/simulation/SimulationControls.tsx
   const handleSubmit = () => {
     try {
       browserMD.validateConfig(config);
       browserMD.start(config);
     } catch (error) {
       toast.error(error.message);
     }
   };
   ```

**Validation:**
```bash
# Test validation
npm run test -- browser-simulation.test.ts

# Manual test
# Try to run 1000 atom simulation
# Expected: Error shown, recommends serverless tier
```

**Success Criteria:**
- [ ] Atom limit enforced (500)
- [ ] Time limit enforced (30s)
- [ ] Clear error messages
- [ ] Tier recommendation working

**Rollback:** Remove validation (unsafe)

---

### Phase 4: Testing & Validation (5 points) ✅ 0/5

#### ☐ 21. Unit Tests Execution (All 170+)
**Priority:** Critical
**Estimated Time:** 10 minutes
**Dependencies:** Tasks 6-20 complete

**Steps:**
1. Run all unit tests:
   ```bash
   npm run test
   ```

2. Generate coverage report:
   ```bash
   npm run test:coverage
   ```

**Validation:**
```bash
# Check test results
npm run test -- --reporter=verbose

# Expected: 170+ tests passing, 0 failures
```

**Success Criteria:**
- [ ] All 170+ tests passing
- [ ] 0 test failures
- [ ] Coverage >85% overall
- [ ] Coverage >95% on critical paths
- [ ] Test execution <2 minutes

**Rollback:** Fix failing tests before proceeding

---

#### ☐ 22. Integration Test Suite Creation
**Priority:** High
**Estimated Time:** 30 minutes (if not already created)
**Dependencies:** Task 21 complete

**Steps:**
1. Create integration tests:
   ```bash
   # tests/integration/feature-integration.test.ts
   ```

2. Test key workflows:
   - PDB fetch → cache → Mol* display
   - Job submit → queue → Edge Function → complete
   - Session create → join → collaborate → leave

**Validation:**
```bash
# Run integration tests
npm run test:integration

# Expected: All integration workflows passing
```

**Success Criteria:**
- [ ] 10+ integration test scenarios
- [ ] All workflows tested end-to-end
- [ ] Tests isolated (no shared state)
- [ ] Tests deterministic

**Rollback:** Skip integration tests temporarily

---

#### ☐ 23. E2E Test Scenarios
**Priority:** High
**Estimated Time:** 20 minutes
**Dependencies:** Task 22 complete

**Steps:**
1. Run E2E tests:
   ```bash
   npm run test:e2e
   ```

2. Test across browsers:
   ```bash
   npm run test:e2e -- --project=chromium
   npm run test:e2e -- --project=firefox
   npm run test:e2e -- --project=webkit
   ```

**Validation:**
```bash
# Check E2E results
npx playwright show-report

# Expected: All scenarios passing in all browsers
```

**Success Criteria:**
- [ ] 20+ E2E scenarios passing
- [ ] Tests pass in Chrome, Firefox, Safari
- [ ] Mobile tests passing
- [ ] Critical user journeys covered

**Rollback:** Fix E2E failures before deployment

---

#### ☐ 24. Performance Benchmarks
**Priority:** High
**Estimated Time:** 15 minutes
**Dependencies:** Tasks 21-23 complete

**Steps:**
1. Run Lighthouse CI:
   ```bash
   npm run lighthouse:ci
   ```

2. Run custom benchmarks:
   ```bash
   npm run benchmark
   ```

**Validation:**
```bash
# Check Lighthouse scores
cat lighthouseci-report.json

# Expected: All scores >90
```

**Success Criteria:**
- [ ] Performance >90
- [ ] Accessibility >95
- [ ] Best Practices >90
- [ ] SEO >90
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1

**Rollback:** Optimize before deployment

---

#### ☐ 25. Accessibility Validation
**Priority:** High
**Estimated Time:** 15 minutes
**Dependencies:** Task 23 complete

**Steps:**
1. Run automated a11y tests:
   ```bash
   npm run test:a11y
   ```

2. Manual testing:
   - Screen reader (NVDA, VoiceOver)
   - Keyboard-only navigation
   - Color contrast check

**Validation:**
```bash
# Check accessibility report
cat a11y-report.html

# Expected: 0 violations, WCAG 2.1 AA compliant
```

**Success Criteria:**
- [ ] 0 accessibility violations
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation working
- [ ] Screen reader compatible
- [ ] Touch targets 44×44px minimum

**Rollback:** Fix a11y issues before deployment

---

### Phase 5: Deployment (5 points) ✅ 0/5

#### ☐ 26. Staging Environment Setup
**Priority:** Critical
**Estimated Time:** 20 minutes
**Dependencies:** Tasks 21-25 complete

**Steps:**
1. Create staging branch:
   ```bash
   git checkout -b staging/sprint-2-integration
   git push origin staging/sprint-2-integration
   ```

2. Configure Vercel staging:
   - Connect staging branch to Vercel project
   - Set staging environment variables
   - Enable preview deployments

3. Deploy to staging:
   - Vercel auto-deploys on push
   - Wait for deployment completion

**Validation:**
```bash
# Test staging deployment
curl https://lab-visualizer-staging.vercel.app/api/health

# Expected: 200 OK with health status
```

**Success Criteria:**
- [ ] Staging branch deployed
- [ ] All environment variables set
- [ ] Database connected
- [ ] Edge Functions deployed
- [ ] All features functional

**Rollback:** Delete staging deployment

---

#### ☐ 27. Production Build Optimization
**Priority:** High
**Estimated Time:** 15 minutes
**Dependencies:** Task 26 complete

**Steps:**
1. Optimize build:
   ```bash
   npm run build
   ```

2. Analyze bundle:
   ```bash
   npx @next/bundle-analyzer
   ```

3. Verify optimizations:
   - Tree shaking enabled
   - Code splitting optimal
   - Images optimized
   - Fonts subsetted

**Validation:**
```bash
# Check bundle sizes
ls -lh .next/static/chunks

# Expected: Main bundle <500KB
```

**Success Criteria:**
- [ ] Build successful
- [ ] Bundle size <500KB (main)
- [ ] Lazy loading working
- [ ] Source maps available
- [ ] No build warnings

**Rollback:** None (build issue must be fixed)

---

#### ☐ 28. Lighthouse CI Validation
**Priority:** High
**Estimated Time:** 10 minutes
**Dependencies:** Task 27 complete

**Steps:**
1. Run Lighthouse on staging:
   ```bash
   npm run lighthouse:ci -- --url https://lab-visualizer-staging.vercel.app
   ```

2. Check all pages:
   - Homepage: /
   - Viewer: /viewer/1crn
   - Jobs: /jobs

**Validation:**
```bash
# Review Lighthouse report
cat lighthouse-report.html

# Expected: All scores >90
```

**Success Criteria:**
- [ ] Performance >90
- [ ] Accessibility >95
- [ ] Best Practices >90
- [ ] SEO >90
- [ ] All Core Web Vitals green

**Rollback:** Optimize and re-run

---

#### ☐ 29. Security Audit
**Priority:** Critical
**Estimated Time:** 15 minutes
**Dependencies:** Task 27 complete

**Steps:**
1. Run security audit:
   ```bash
   npm audit --production
   ```

2. Check dependencies:
   ```bash
   npm outdated
   ```

3. Verify security headers:
   ```bash
   curl -I https://lab-visualizer-staging.vercel.app
   ```

**Validation:**
```bash
# Expected: 0 high/critical vulnerabilities
npm audit --production

# Expected: All security headers present
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - Content-Security-Policy
```

**Success Criteria:**
- [ ] 0 critical vulnerabilities
- [ ] 0 high vulnerabilities
- [ ] All security headers set
- [ ] RLS policies enabled
- [ ] Secrets not exposed

**Rollback:** Fix security issues before production

---

#### ☐ 30. Production Deployment
**Priority:** Critical
**Estimated Time:** 15 minutes
**Dependencies:** Tasks 26-29 complete, stakeholder approval

**Steps:**
1. Merge to main:
   ```bash
   git checkout main
   git merge staging/sprint-2-integration
   git push origin main
   ```

2. Monitor deployment:
   ```bash
   vercel logs --follow --production
   ```

3. Verify production:
   ```bash
   curl https://lab-visualizer.vercel.app/api/health
   ```

4. Enable monitoring:
   - Vercel Analytics
   - Sentry error tracking
   - Custom alerts

**Validation:**
```bash
# Check production health
curl https://lab-visualizer.vercel.app/api/health

# Test core features
# - Load structure /viewer/1crn
# - Submit test job
# - Create collaboration session
```

**Success Criteria:**
- [ ] Production deployment successful
- [ ] All features working
- [ ] No errors in Sentry
- [ ] Monitoring active
- [ ] Performance metrics acceptable
- [ ] Cost tracking enabled

**Rollback:** Use Phase 6 rollback procedure if needed

---

## Phase-by-Phase Success Criteria

### Phase 1: Infrastructure (Tasks 1-5)
- [ ] Supabase project operational
- [ ] All 8 database tables created
- [ ] 4 storage buckets configured
- [ ] Edge Function deployed and functional
- [ ] 24 environment variables set

### Phase 2: Dependencies (Tasks 6-10)
- [ ] All npm packages installed
- [ ] TypeScript paths working
- [ ] Supabase client connected
- [ ] Mol* library loaded
- [ ] React Query provider configured

### Phase 3: Feature Wiring (Tasks 11-20)
- [ ] Cache cascade functioning (L1→L2→L3)
- [ ] Mol* viewer displaying structures
- [ ] Job queue submitting to OpenMM
- [ ] Collaboration realtime working
- [ ] LOD progressive loading active
- [ ] All 9 features integrated

### Phase 4: Testing (Tasks 21-25)
- [ ] 170+ unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing across browsers
- [ ] Performance benchmarks met
- [ ] Accessibility validated

### Phase 5: Deployment (Tasks 26-30)
- [ ] Staging deployment successful
- [ ] Production build optimized
- [ ] Lighthouse scores >90
- [ ] Security audit passed
- [ ] Production deployment complete

---

## Validation Commands Summary

```bash
# Pre-deployment validation (run all)
npm run typecheck
npm run lint
npm run test
npm run test:integration
npm run test:e2e
npm run lighthouse:ci
npm audit --production
npm run build

# Post-deployment validation
curl https://lab-visualizer.vercel.app/api/health
curl https://lab-visualizer.vercel.app/api/structures/1crn
```

---

## Rollback Decision Tree

```
Error Rate >10% or Latency >10s?
├─ YES → Immediate rollback to previous deployment
│   └─ vercel rollback <previous-deployment>
└─ NO → Continue monitoring

Error Rate >5% or Latency >5s for 15min?
├─ YES → Manual rollback decision
│   ├─ Assess impact
│   ├─ Review logs
│   └─ Rollback if no quick fix
└─ NO → Continue monitoring

All other issues?
├─ Assess severity
├─ Check if hotfix possible
└─ Rollback if critical user impact
```

---

## Contact & Escalation

**Technical Issues:**
- Check GitHub issues
- Review Vercel logs
- Check Supabase dashboard
- Review Sentry errors

**Critical Production Issues:**
- Immediate rollback
- Create incident report
- Notify stakeholders
- Schedule post-mortem

---

**Document Status:** Ready for execution
**Estimated Total Time:** ~8-10 hours (with parallel execution)
**Next Document:** `/scripts/validate-integration.ts` (automated validation)

---

**Generated by:** Claude Flow Swarm (SPARC Specification Agent)
**Date:** November 17, 2025
**Version:** 1.0.0
