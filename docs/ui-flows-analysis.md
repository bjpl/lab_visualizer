# UI Flows and User Interaction Workflows Analysis
## LAB Visualizer - Complete UX Documentation

**Generated:** 2025-11-19
**Project:** lab_visualizer
**Framework:** Next.js 14 (App Router) + React 18 + TypeScript

---

## Executive Summary

### Overall Quality Score: 7.5/10

**Strengths:**
- Well-structured component hierarchy with clear separation of concerns
- Comprehensive state management using Zustand
- Responsive design with mobile/tablet/desktop layouts
- Real-time collaboration features
- Keyboard shortcuts for power users
- Progressive enhancement with loading states

**Critical Issues:**
- Missing comprehensive error boundaries
- Incomplete accessibility implementation
- No unified notification system
- Form validation inconsistencies
- Mixed routing strategies (dual App.tsx + Next.js App Router)

---

## 1. User Journeys

### 1.1 Primary User Workflows

#### Journey A: Guest → Viewer (Quick Exploration)
```mermaid
Home Page → Browse Structures → View Structure → Explore 3D Model
Time: ~30 seconds
Friction Points: None
Conversion: High
```

**Path:**
1. Land on home page (`/`)
2. Click "Browse Structures" button
3. Filter/search for structure
4. Click structure card
5. Redirected to viewer with `?pdb=<ID>`
6. Interactive 3D visualization loads

**User Actions:**
- No authentication required
- 310 event handlers detected across 50 files
- 294 React hooks for state management

#### Journey B: New User → Authenticated → Simulation
```mermaid
Home → Sign Up → Profile Setup → Browse → Viewer → Submit Simulation → Monitor Job
Time: ~3-5 minutes
Friction Points: Profile setup, quota limits
Conversion: Medium
```

**Path:**
1. Click "Sign Up" from header
2. Complete signup form (email/password or OAuth)
3. Redirected to profile setup (`/auth/setup-profile`)
4. Browse structures
5. Load structure in viewer
6. Submit MD simulation job
7. Monitor job progress in Jobs page

**Authentication Flow:**
- Multi-method auth: Email/Password, Google OAuth, GitHub OAuth, Magic Link
- Protected routes enforced via middleware
- Session persistence with Supabase
- Automatic token refresh

#### Journey C: Returning User → Collaboration Session
```mermaid
Login → Viewer → Create/Join Session → Collaborate → Share Insights
Time: ~1-2 minutes
Friction Points: Invite code sharing
Conversion: Medium-High
```

**Path:**
1. Login via `/auth/login`
2. Navigate to viewer
3. Click "Collaborate" button
4. Create new session or join with code
5. Real-time camera sync and annotations
6. Share invite link with collaborators

#### Journey D: Educational User → Learning Path
```mermaid
Home → Learn → Browse Modules → Study Mode → Quiz → Progress Tracking
Time: ~15-30 minutes
Friction Points: Content availability (marked "Coming Soon")
Conversion: Low (incomplete)
```

**Status:** Partially implemented
- Learning modules UI complete
- Content system incomplete
- Quiz functionality basic
- Progress tracking minimal

---

## 2. Navigation Architecture

### 2.1 Route Structure (Next.js App Router)

```
/ (Home)
├── /viewer [Public, Keyboard shortcuts]
├── /browse [Public, Search & Filter]
├── /learn [Public, Educational content]
├── /jobs [Protected, Requires auth]
├── /simulation [Protected, MD simulation]
└── /auth
    ├── /login [Guest only, Multi-auth]
    ├── /signup [Guest only]
    ├── /reset-password [Guest only]
    ├── /setup-profile [New users]
    └── /callback [OAuth redirect]
```

### 2.2 Navigation Components

#### Header Navigation (Desktop)
- **Location:** Sticky top, persistent across all pages
- **Items:** Home | Viewer | Browse | Learn | Jobs
- **Actions:** Search, Settings, Profile
- **State:** Active route highlighting via `usePathname()`
- **Responsive:** Hamburger menu for mobile (<lg breakpoint)

**Code Reference:** `/src/components/layout/Header.tsx`

```typescript
const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Viewer', href: '/viewer' },
  { name: 'Browse', href: '/browse' },
  { name: 'Learn', href: '/learn' },
  { name: 'Jobs', href: '/jobs' },
];
```

#### Mobile Navigation
- Slide-out menu with `mobileMenuOpen` state
- Auto-close on route change
- Touch-optimized button sizes (min 44px)
- Z-index management for overlays

### 2.3 Protected Route Flow

**Middleware Chain:** `/src/middleware.ts`

```typescript
Protected Routes → Check Session → Check Profile → Verify Role → Allow/Redirect

Redirects:
- No session → /auth/login?redirectTo={current}
- No profile → /auth/setup-profile
- Non-admin + /admin → /dashboard
- Authenticated + /auth → /dashboard
```

**Security Headers:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## 3. Form Interactions

### 3.1 Authentication Forms

#### Login Form (`/src/components/auth/LoginForm.tsx`)

**Inputs:**
1. Email (type: email, required, validation: email format)
2. Password (type: password, required, min: 6 chars - assumed)

**Modes:**
- Password login
- Magic link (passwordless)
- OAuth (Google, GitHub)

**User Flow:**
```typescript
Input Email → Select Mode → Submit
  ├─ Password: Enter password → Sign In
  ├─ Magic Link: Send email → Check inbox → Click link
  └─ OAuth: Redirect → External auth → Callback → Dashboard
```

**State Management:**
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [mode, setMode] = useState<'password' | 'magic-link'>('password');
```

**Validation:**
- Client-side: HTML5 required, email type
- Server-side: Supabase auth validation
- Error display: Inline error message component
- Loading states: Disabled inputs + loading text

**Issues:**
- No password strength indicator
- No "remember me" option
- Error messages not specific enough
- No rate limiting feedback

#### Signup Form (Similar pattern to LoginForm)

**Additional Fields:**
- Username
- Full name
- Password confirmation

**Profile Setup Flow:**
- Required after first signup
- Collects additional user data
- Role assignment
- Preferences

### 3.2 Structure Browser Form (`/src/components/browse/StructureBrowser.tsx`)

**Inputs:**
1. Search bar (debounced search)
2. Category filter (multi-select badges)
3. Tag filter (collapsible, multi-select)

**Real-time Filtering:**
```typescript
const filteredStructures = useMemo(() => {
  let results = POPULAR_STRUCTURES;

  if (searchQuery) {
    results = searchStructures(searchQuery);
  }

  if (selectedCategory) {
    results = results.filter(s => s.category === selectedCategory);
  }

  if (selectedTags.length > 0) {
    results = results.filter(s =>
      selectedTags.every(tag => s.tags.includes(tag))
    );
  }

  return results;
}, [searchQuery, selectedCategory, selectedTags]);
```

**UX Features:**
- Live result count
- Active filters summary
- Clear all filters button
- Empty state with helpful message
- Responsive grid layout (1-4 columns)

### 3.3 Job Submission Form (`/src/components/jobs/JobSubmissionForm.tsx`)

**Most Complex Form - 11 Inputs:**

1. **Structure Selection:**
   - Pre-filled from viewer OR
   - Manual PDB ID entry

2. **Simulation Type Presets:**
   - Minimize (Quick energy minimization)
   - Equilibrate (System equilibration)
   - Production (Full MD run)

3. **Parameters:**
   - Ensemble: NVE | NVT | NPT
   - Temperature: 0-500K (slider)
   - Timestep: 0.5-5fs (slider)
   - Total Time: 10-10000ps (slider)
   - Output Frequency: 1-10 (slider)
   - Priority: Low | Normal | High
   - Notifications: Checkbox

**Validation Rules:**
```typescript
// Structure validation
const canRunServerless = atomCount > 0 && atomCount <= 5000;

// Quota validation
const quotaExceeded = userQuota ? userQuota.used >= userQuota.limit : false;

// Cost estimation
const estimateCost = () => {
  const steps = (totalTime * 1000) / timestep;
  const computeUnits = (atomCount * steps) / 1e9;
  const costPerUnit = 0.001;
  return computeUnits * costPerUnit;
};
```

**Multi-step Flow:**
1. Fill form
2. Click "Submit Simulation"
3. **Confirmation Modal** (Critical!)
   - Review parameters
   - See cost estimate
   - Confirm or Cancel
4. Submit to queue
5. Redirect to job details

**User Feedback:**
- Real-time cost calculation
- Quota display (X/Y free jobs)
- Tier recommendations based on atom count
- Disabled submit with reason (quota/size)
- Loading state during submission

**Issues:**
- No form draft saving
- No validation error summary
- Parameters could overwhelm beginners
- No preset descriptions

### 3.4 Collaboration Forms

#### Session Creation
```typescript
Input: Session Name (required)
Validation: Non-empty string
Submit: Create session → Generate invite code → Join
```

#### Session Join
```typescript
Input: Invite Code (8 chars, uppercase, required)
Validation: Alphanumeric, exact length
Submit: Validate code → Join session → Sync state
```

---

## 4. State Management

### 4.1 Global State Architecture

**Primary Store:** Zustand with middleware
- **Location:** `/src/stores/app-store.ts`
- **Slices:** 4 domains
- **Persistence:** LocalStorage (selective)
- **DevTools:** Development only

#### Store Structure

```typescript
type AppState =
  | VisualizationSlice    // 3D viewer state
  | CollaborationSlice    // Real-time collaboration
  | SimulationSlice       // Job queue state
  | UISlice;              // Global UI state

// Persisted state
partialize: (state) => ({
  visualization: {
    representation: state.representation,
    colorScheme: state.colorScheme,
  },
  ui: {
    sidebarOpen: state.sidebarOpen,
    theme: state.theme,
  },
  // Collaboration and simulation NOT persisted (ephemeral)
})
```

### 4.2 Visualization State

**Managed by:** `useVisualizationStore`

**State Shape:**
```typescript
{
  // Structure data
  structure: ParsedStructure | null,

  // Rendering
  representation: 'cartoon' | 'ball-and-stick' | 'surface' | ...,
  colorScheme: 'element' | 'chain' | 'residue' | ...,
  backgroundColor: string,
  quality: 1-5,

  // Display toggles
  showBackbone: boolean,
  showSidechains: boolean,
  showLigands: boolean,
  showWater: boolean,

  // Camera
  camera: CameraState,

  // Selection
  selection: AtomSelection | null,
}
```

**Key Actions:**
- `loadStructure(id: string)`
- `setRepresentation(type: RepresentationType)`
- `setColorScheme(scheme: ColorScheme)`
- `toggleDisplay(element: DisplayElement)`
- `setQuality(level: number)`
- `resetCamera()`
- `resetVisualization()`

### 4.3 Collaboration State

**Managed by:** `useCollaborationStore`

**Real-time Sync via Supabase Realtime:**

```typescript
{
  // Session
  session: CollaborationSession | null,
  isConnected: boolean,

  // Users
  users: Map<string, CollaborativeUser>,

  // Cursor tracking
  cursors: Map<string, CursorPosition>,

  // Camera sync
  cameraSync: CameraSyncState,

  // Annotations
  annotations: Annotation[],

  // Activity feed
  activities: Activity[],
}
```

**Real-time Events:**
- User join/leave
- Cursor movement
- Camera changes
- Annotation creation
- Chat messages

### 4.4 Simulation/Job State

**Managed by:** `useSimulation` hook + Zustand slice

```typescript
{
  jobs: Map<string, SimulationJob>,
  activeJobId: string | null,
  results: Map<string, SimulationResult>,

  // Queue stats
  queueStats: {
    pending: number,
    running: number,
    completed: number,
    failed: number,
    completionRate24h: number,
  }
}
```

**Real-time Updates:**
- Job status changes (Supabase subscriptions)
- Progress updates (every 30s)
- Completion notifications
- Error alerts

### 4.5 UI State (Global)

```typescript
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  loading: boolean,
  error: string | null,
  notifications: Notification[],
}
```

### 4.6 Local Component State Patterns

**Most Common Pattern:** useState + useEffect

```typescript
// Form state
const [value, setValue] = useState(initialValue);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Async operations
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.fetch();
      setValue(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);
```

### 4.7 Form State Management

**Pattern:** Controlled components with individual useState

**Example:** JobSubmissionForm (11 state variables)
```typescript
const [simulationType, setSimulationType] = useState<SimulationType>('minimize');
const [temperature, setTemperature] = useState(300);
const [timestep, setTimestep] = useState(2.0);
const [totalTime, setTotalTime] = useState(100);
const [ensemble, setEnsemble] = useState<'NVE' | 'NVT' | 'NPT'>('NVT');
// ... 6 more
```

**Issue:** No centralized form library (React Hook Form, Formik)
**Impact:** Verbose code, manual validation, no unified error handling

---

## 5. User Feedback Systems

### 5.1 Loading States

#### Page-level Loading
**Component:** `/src/app/loading.tsx`
```typescript
<Loader2 className="animate-spin" />
<p>Loading...</p>
```

**Used for:** Route transitions (Next.js automatic)

#### Component-level Loading States

**Pattern 1: Skeleton/Placeholder**
```typescript
// ViewerLayout
if (isLoading) {
  return <LoadingState />;
}
```

**Pattern 2: Inline Spinner**
```typescript
// Button loading
<button disabled={loading}>
  {loading ? 'Please wait...' : 'Submit'}
</button>
```

**Pattern 3: Progress Bars**
- PDB fetching: Progress events with percentage
- Job execution: Real-time progress updates
- File uploads: Upload percentage

**Code Example:** `/src/hooks/use-pdb.ts`
```typescript
const [progress, setProgress] = useState(0);
const [progressMessage, setProgressMessage] = useState('');

handleProgress(0, 'Checking cache...');
handleProgress(50, 'Downloading structure...');
handleProgress(100, 'Complete');
```

### 5.2 Error Handling

#### Global Error Boundary
**Component:** `/src/app/error.tsx`
```typescript
export default function Error({ error, reset }) {
  // Logs to console (should log to Sentry/similar)
  console.error('Application error:', error);

  return (
    <Card>
      <AlertCircle /> Something went wrong
      <p>{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </Card>
  );
}
```

**Issues:**
- No error reporting service integration
- No error categorization
- Generic error messages
- No fallback UI customization per route

#### Component-level Errors

**Pattern 1: Error State Variable**
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return <ErrorDisplay error={error} onRetry={retry} />;
}
```

**Pattern 2: Inline Error Messages**
```typescript
{error && (
  <div className="error-message bg-red-50 border border-red-200">
    {error}
  </div>
)}
```

**Pattern 3: Toast Notifications**
```typescript
// useToast hook
const { success, error, warning, info } = useToast();

try {
  await submitJob();
  success('Job submitted', 'Your simulation is now in the queue');
} catch (err) {
  error('Submission failed', err.message);
}
```

### 5.3 Toast Notification System

**Implementation:** Custom `useToast` hook
**Location:** `/src/hooks/useToast.tsx`

**Features:**
- 4 types: Success, Error, Warning, Info
- Auto-dismiss (configurable duration, default 5s)
- Queue management (max 5 concurrent)
- Position: Top-right
- Animations: Slide-in from right

**API:**
```typescript
const toast = useToast();

toast.success(title, message?, duration?);
toast.error(title, message?, duration?);
toast.warning(title, message?, duration?);
toast.info(title, message?, duration?);
toast.dismissToast(id);
toast.dismissAll();
```

**Usage:**
```typescript
const { success, error } = useToast();

const handleSubmit = async () => {
  try {
    await submitForm();
    success('Saved!', 'Your changes have been saved');
  } catch (err) {
    error('Failed to save', err.message);
  }
};
```

**Issues:**
- Not globally integrated (manual import in each component)
- No position configuration
- No sound/vibration options
- No action buttons in toasts
- Toast container not in root layout

### 5.4 Empty States

**Pattern:** Helpful empty states with CTAs

**Example 1:** Structure Browser (No Results)
```typescript
<div className="border-dashed border-2 p-12 text-center">
  <p>No structures found</p>
  <p>Try adjusting your search criteria or filters</p>
  <Button onClick={clearFilters}>Clear filters</Button>
</div>
```

**Example 2:** Jobs Page (No Selection)
```typescript
<div className="flex items-center justify-center">
  <p>Select a job to view details</p>
  <button onClick={() => setShowSubmitForm(true)}>
    or submit a new simulation
  </button>
</div>
```

### 5.5 Confirmation Dialogs

**Pattern:** Modal overlays for destructive actions

**Example:** Job Submission Confirmation
```typescript
{showConfirmation && (
  <div className="fixed inset-0 bg-black/50 z-50">
    <div className="bg-background border rounded-lg p-6">
      <h3>Confirm Submission</h3>
      <div>
        <p>Structure: <strong>{structureId}</strong></p>
        <p>Cost: <strong>${estimatedCost.toFixed(3)}</strong></p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowConfirmation(false)}>Cancel</button>
        <button onClick={confirmSubmit}>Confirm</button>
      </div>
    </div>
  </div>
)}
```

**Other Confirmations:**
- Leave collaboration session
- Delete job
- Cancel running simulation
- Reset settings

### 5.6 Real-time Status Indicators

**Collaboration Connection Status:**
```typescript
<span className={`w-2 h-2 rounded-full ${
  isConnected ? 'bg-green-500' : 'bg-red-500'
}`} />
<span>{isConnected ? 'Connected' : 'Disconnected'}</span>
```

**Job Status Badges:**
- Pending (gray)
- Running (blue with spinner)
- Completed (green)
- Failed (red)
- Cancelled (orange)

**Queue Statistics:**
- Real-time job counts
- Completion rate (24h)
- Average wait time
- Auto-refresh every 30s

---

## 6. Keyboard Shortcuts & Accessibility

### 6.1 Keyboard Navigation

**Viewer Shortcuts:** `/src/app/viewer/page.tsx`

```typescript
Key Bindings:
- R: Reset camera
- F: Focus on selection (Ctrl+F: Fullscreen)
- P: Toggle control panel
- S: Selection mode (Ctrl+S: Screenshot)
- H: Show help
- Esc: Clear selection
- +/=: Zoom in
- -: Zoom out
```

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent shortcuts when typing
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'r': resetCamera(); break;
      case 'f':
        if (e.ctrlKey) {
          e.preventDefault();
          document.documentElement.requestFullscreen();
        }
        break;
      // ...
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Issues:**
- No keyboard shortcut cheatsheet
- Not all shortcuts documented in tooltips
- No customizable shortcuts
- Missing common shortcuts (Ctrl+Z undo, Ctrl+C copy)

### 6.2 Accessibility (A11y) Features

#### ARIA Labels
```typescript
// Button examples
<Button aria-label="Reset camera view">
  <RotateCcw />
</Button>

<input
  aria-label="Search for molecular structure"
  placeholder="Search PDB ID or name..."
/>

<div role="toolbar" aria-label="Viewer toolbar">
  {/* Toolbar content */}
</div>
```

#### Focus Management
- Visible focus indicators (`:focus-visible`)
- Logical tab order
- Keyboard-accessible modals (focus trap needed)

#### Screen Reader Support
```typescript
<span aria-live="polite">{quality}</span>
<Button aria-pressed={isActive}>Toggle</Button>
<div role="region" aria-label="Visualization controls">
```

#### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- `<main>`, `<header>`, `<nav>` landmarks
- `<button>` vs `<div onClick>`

**Accessibility Score: 6/10**

**Missing:**
- Skip navigation links
- Keyboard focus trap in modals
- Full WCAG 2.1 AA compliance
- Screen reader testing
- High contrast mode
- Focus management after route changes
- Reduced motion preferences

---

## 7. Responsive Design Patterns

### 7.1 Breakpoints

**Tailwind CSS (default):**
```css
sm: 640px   /* Tablet */
md: 768px   /* Small desktop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 7.2 Layout Adaptations

#### Jobs Page - 3 Layouts

**Desktop (lg+):** 3-column grid
```typescript
<div className="lg:grid lg:grid-cols-[1fr,400px,300px]">
  <JobList />       {/* Left: Flexible */}
  <JobDetails />    {/* Center: 400px */}
  <QueueStatus />   {/* Right: 300px */}
</div>
```

**Tablet (md-lg):** 2-column grid
```typescript
<div className="md:grid lg:hidden md:grid-cols-[1fr,400px]">
  <JobList />
  <div className="space-y-4">
    <QueueStatus />
    <JobDetails />
  </div>
</div>
```

**Mobile (<md):** Single column with tabs
```typescript
<div className="md:hidden">
  {showForm ? <JobSubmissionForm /> :
   selectedJob ? <JobDetails /> :
   <><QueueStatus /><JobList /></>}
</div>
```

#### Viewer Layout

**Desktop:** Side-by-side
- Canvas: 70% width
- Controls Panel: 30% width
- Toolbar: Full width top

**Mobile:** Stacked
- Canvas: Full width, full height
- Controls Panel: Bottom sheet (50vh max)
- Touch-optimized controls

### 7.3 Mobile Optimizations

**Touch Targets:**
- Minimum 44x44px (iOS/Android guidelines)
- Increased padding on mobile
- Larger buttons on touch devices

**Navigation:**
- Hamburger menu (<lg)
- Full-screen mobile menu
- Auto-close on navigation

**Inputs:**
- Appropriate input types (`type="email"`, `type="tel"`)
- Native date/time pickers
- Larger text inputs on mobile

**Performance:**
- Lazy loading of images
- Code splitting per route
- Progressive LOD rendering for 3D

---

## 8. Advanced UX Patterns

### 8.1 Progressive Disclosure

**Example 1:** Tag Filter
```typescript
<details className="group">
  <summary>Tags (collapsed by default)</summary>
  <div className="mt-3 flex flex-wrap gap-2">
    {allTags.map(tag => <Badge>{tag}</Badge>)}
  </div>
</details>
```

**Example 2:** Advanced Parameters
- Basic simulation form: 3 presets
- Advanced: Show all 11 parameters
- Collapsible sections in settings

### 8.2 Optimistic Updates

**Pattern:** Update UI before server confirmation

```typescript
// Add to local state immediately
const handleAddAnnotation = (annotation) => {
  // Optimistic update
  setAnnotations(prev => [...prev, annotation]);

  // Background sync
  api.createAnnotation(annotation).catch(err => {
    // Rollback on error
    setAnnotations(prev => prev.filter(a => a.id !== annotation.id));
    showError('Failed to save annotation');
  });
};
```

### 8.3 Debouncing & Throttling

**Search Input Debouncing:**
```typescript
// useMemo re-calculates only when searchQuery changes
const filteredStructures = useMemo(() => {
  return searchStructures(searchQuery);
}, [searchQuery]);

// Can improve with useDebounce hook:
const debouncedSearch = useDebounce(searchQuery, 300);
```

**Cursor Movement Throttling:**
```typescript
// Collaboration cursor sync throttled to 60fps
const throttledCursorUpdate = throttle((position) => {
  broadcastCursor(position);
}, 16); // ~60fps
```

### 8.4 Infinite Scroll / Pagination

**Current:** All structures loaded at once
**Recommendation:** Implement for large datasets

```typescript
// Future improvement
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['structures'],
  queryFn: ({ pageParam = 0 }) => fetchStructures(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// Intersection Observer for auto-load
useEffect(() => {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  });
  observer.observe(loadMoreRef.current);
}, []);
```

### 8.5 Undo/Redo Functionality

**Status:** Not implemented
**Use Cases:**
- Annotation edits
- Visualization changes
- Structure modifications

**Recommended Implementation:**
```typescript
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const state = history[index];

  const push = (newState: T) => {
    const newHistory = history.slice(0, index + 1);
    setHistory([...newHistory, newState]);
    setIndex(newHistory.length);
  };

  const undo = () => index > 0 && setIndex(index - 1);
  const redo = () => index < history.length - 1 && setIndex(index + 1);

  return { state, push, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
};
```

---

## 9. Data Flow Patterns

### 9.1 Server → Client Flow

**Pattern 1: RESTful API Routes**
```typescript
// Client request
const { data } = await fetch(`/api/pdb/${id}`);

// Next.js API route (/app/api/pdb/[id]/route.ts)
export async function GET(request: Request, { params }) {
  const structure = await fetchPDB(params.id);
  return Response.json(structure);
}
```

**Pattern 2: Server-Sent Events (SSE)**
```typescript
// Progress updates for long operations
const response = await fetch(`/api/pdb/${id}?progress=true`);
const reader = response.body?.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      if (data.type === 'progress') {
        setProgress(data.progress);
      }
    }
  }
}
```

**Pattern 3: Supabase Realtime**
```typescript
// Real-time collaboration updates
const channel = supabase.channel(`session:${sessionId}`);

channel
  .on('broadcast', { event: 'cursor' }, ({ payload }) => {
    updateRemoteCursor(payload);
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'annotations',
  }, (payload) => {
    addAnnotation(payload.new);
  })
  .subscribe();
```

### 9.2 Client State Synchronization

**Zustand → LocalStorage:**
```typescript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'lab-visualizer-storage',
    partialize: (state) => ({
      // Only persist UI preferences
      visualization: { representation, colorScheme },
      ui: { sidebarOpen, theme },
    }),
  }
)
```

**React Query Caching:**
```typescript
queryClient.setQueryData(['pdb', id], structure);
queryClient.invalidateQueries({ queryKey: ['pdb', id] });
queryClient.prefetchQuery({
  queryKey: ['pdb', 'popular'],
  queryFn: fetchPopularStructures,
  staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## 10. Issues and Improvement Areas

### 10.1 Critical Issues (P0)

#### 1. Dual App Architecture
**Problem:** Both `/src/App.tsx` (legacy SPA) and Next.js App Router coexist

```typescript
// /src/main.tsx - Legacy entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />  // Old SPA with Study/Quiz/Challenge modes
  </React.StrictMode>,
);

// /src/app/layout.tsx - Next.js entry point
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}  // New Next.js pages
        <Footer />
      </body>
    </html>
  );
}
```

**Impact:**
- Confusing routing
- Duplicate components
- State management conflicts
- SEO issues

**Recommendation:** Complete migration to Next.js App Router

#### 2. Inconsistent Error Handling
**Problem:** No unified error handling strategy

```typescript
// Pattern 1: Try-catch with setError
try {
  await fetch();
} catch (err) {
  setError(err.message);
}

// Pattern 2: Console.log only
catch (error) {
  console.error('Failed:', error);
}

// Pattern 3: Alert
catch (err) {
  alert('Something went wrong');
}
```

**Recommendation:**
- Implement global error boundary with Sentry
- Use toast notifications consistently
- Create error categorization system
- Add user-friendly error messages

#### 3. Form Validation Gaps
**Problem:** Inconsistent validation across forms

**Example:** Login form has HTML5 validation, Job form has complex logic, but no unified validation library

**Recommendation:**
- Implement React Hook Form + Zod
- Create reusable validation schemas
- Unified error message display

```typescript
const jobFormSchema = z.object({
  structureId: z.string().min(1, 'Structure required'),
  temperature: z.number().min(0).max(500),
  atomCount: z.number().max(5000, 'Too large for serverless'),
});

const form = useForm({
  resolver: zodResolver(jobFormSchema),
});
```

### 10.2 High Priority Issues (P1)

#### 4. No Global Toast System
**Problem:** Toast hook manually imported, container not in root

**Solution:**
```typescript
// Add to root layout
export default function RootLayout({ children }) {
  const { toasts, dismissToast } = useToast();

  return (
    <html>
      <body>
        {children}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </body>
    </html>
  );
}

// Create context
const ToastContext = createContext<ToastAPI>(null);
export const useToast = () => useContext(ToastContext);
```

#### 5. Accessibility Gaps
**Missing:**
- Focus trap in modals
- Skip navigation
- ARIA live regions for dynamic content
- Keyboard shortcut documentation

**Recommendation:**
- Use Radix UI or Headless UI for accessible primitives
- Add `<SkipNav>` component
- Implement `<FocusTrap>` in dialogs
- Create keyboard shortcuts modal (H key)

#### 6. Mobile UX Issues
**Problems:**
- Small touch targets in toolbar
- Viewer controls difficult on mobile
- No touch gestures for 3D manipulation

**Recommendation:**
- Increase button sizes on mobile (min 44px)
- Implement pinch-to-zoom, two-finger rotation
- Simplify mobile toolbar (fewer buttons)

### 10.3 Medium Priority Issues (P2)

#### 7. No Loading Skeletons
**Current:** Spinner or blank screen
**Improvement:** Content-aware skeletons

```typescript
function StructureCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded mt-2" />
      <div className="h-4 bg-gray-200 rounded mt-2 w-2/3" />
    </div>
  );
}
```

#### 8. Inconsistent Naming Conventions
**Examples:**
- `useAuth` vs `use-auth`
- `JobList` vs `job-list`
- Mix of PascalCase and kebab-case

**Recommendation:** Enforce consistent naming via ESLint

#### 9. No Undo Functionality
**Use Cases:**
- Annotation deletion
- Parameter changes
- Structure modifications

**Implementation:** See section 8.5 (History hook)

#### 10. Search Not Debounced
**Problem:** Search triggers on every keystroke

**Solution:**
```typescript
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 10.4 Low Priority Issues (P3)

#### 11. No Dark Mode Toggle
**Status:** Theme state exists, but no UI toggle

**Solution:**
```typescript
<button onClick={() => toggleTheme()}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

#### 12. Limited Offline Support
**Recommendation:** Service worker for offline viewing

#### 13. No Analytics Integration
**Recommendation:** Add Plausible/PostHog for privacy-friendly analytics

#### 14. Missing Feature Tours
**Recommendation:** Implement onboarding tour with Intro.js or Shepherd.js

---

## 11. UX Improvement Recommendations

### 11.1 Quick Wins (1-2 days each)

1. **Add Toast Provider to Root Layout**
   - Move toast container to `layout.tsx`
   - Create toast context
   - Replace all `console.error` with toasts

2. **Implement Keyboard Shortcuts Modal**
   - Show on first visit or 'H' key
   - Document all shortcuts
   - Allow customization

3. **Add Loading Skeletons**
   - Create skeleton components
   - Replace spinners with skeletons
   - Better perceived performance

4. **Improve Error Messages**
   - User-friendly error messages
   - Actionable error suggestions
   - Link to documentation

5. **Add Form Validation Library**
   - Install React Hook Form + Zod
   - Migrate forms incrementally
   - Unified error display

### 11.2 Medium Effort (1 week each)

6. **Complete Migration to Next.js**
   - Remove legacy `App.tsx`
   - Migrate Study/Quiz modes to `/app`
   - Consolidate routing

7. **Accessibility Audit & Fixes**
   - Add skip navigation
   - Implement focus management
   - ARIA landmark improvements
   - Keyboard navigation fixes

8. **Mobile UX Overhaul**
   - Touch gesture support
   - Larger touch targets
   - Simplified mobile UI
   - Progressive Web App (PWA)

9. **Implement Undo/Redo**
   - Create history management hook
   - Add to viewer and annotations
   - Keyboard shortcuts (Ctrl+Z/Y)

10. **Error Boundary Improvements**
    - Categorize errors (network, auth, validation)
    - Custom fallback UIs per error type
    - Automatic error reporting (Sentry)

### 11.3 Large Projects (2-4 weeks each)

11. **Comprehensive Testing**
    - Unit tests for hooks
    - Integration tests for flows
    - E2E tests with Playwright
    - Accessibility testing

12. **Performance Optimization**
    - Code splitting optimization
    - Image optimization
    - React.memo for expensive renders
    - Virtualization for large lists

13. **Advanced Collaboration Features**
    - Voice/video chat integration
    - Collaborative annotations
    - Shared viewport synchronization
    - Persistent session history

14. **Analytics & User Feedback**
    - Privacy-friendly analytics
    - User feedback widget
    - Session replay (LogRocket/FullStory)
    - A/B testing framework

---

## 12. Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                        Root Layout                           │
│  ┌────────────┐  ┌──────────────────────────────────────┐  │
│  │   Header   │  │           Page Content               │  │
│  │ Navigation │  │                                      │  │
│  └────────────┘  │  ┌────────────────────────────────┐  │  │
│                  │  │         Viewer Page            │  │  │
│  ┌────────────┐  │  │  ┌──────────┐  ┌───────────┐  │  │  │
│  │   Footer   │  │  │  │  Canvas  │  │  Controls │  │  │  │
│  │            │  │  │  │ MolStar  │  │   Panel   │  │  │  │
│  └────────────┘  │  │  └──────────┘  └───────────┘  │  │  │
│                  │  │  ┌──────────────────────────┐  │  │  │
│  ┌────────────┐  │  │  │      Toolbar            │  │  │  │
│  │Toast       │  │  │  │  [Icons for actions]    │  │  │  │
│  │Container   │  │  │  └──────────────────────────┘  │  │  │
│  │(Floating)  │  │  └────────────────────────────────┘  │  │
│  └────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### State Flow:
```
User Input → Local State → Zustand Store → Supabase/API → UI Update
     ↓                                              ↓
  Validation                                   Real-time
     ↓                                              ↓
  Form Submit                                  Collaboration
```

---

## 13. User Persona Workflows

### Persona 1: Student (Emma, 22, Biochemistry Major)

**Goal:** Learn protein structures for exam

**Workflow:**
1. Lands on homepage → Clicks "Browse Structures"
2. Filters by category "Proteins" → Searches "hemoglobin"
3. Clicks structure card → Opens in viewer
4. Explores 3D model with mouse
5. Uses color scheme dropdown → Changes to "Secondary Structure"
6. Takes screenshot (Ctrl+S) for notes
7. Navigates to "Learn" → Browses tutorials (finds "Coming Soon")
8. **Frustration:** No learning content yet

**Pain Points:**
- Missing educational content
- No annotation saving
- No way to create study sets

### Persona 2: Researcher (Dr. Chen, 35, Structural Biologist)

**Goal:** Submit MD simulation for analysis

**Workflow:**
1. Logs in → Navigates to Viewer
2. Loads custom PDB file (drag & drop - missing!)
3. Opens Jobs → Clicks "New Simulation"
4. Fills complex form (11 parameters)
5. Sees quota warning (2/5 jobs used today)
6. Reviews cost estimate → Confirms submission
7. Monitors job progress → Downloads trajectory
8. **Success:** Simulation completes in 15 min

**Pain Points:**
- No file upload in viewer (must use PDB ID)
- Complex parameters without presets explained
- No batch job submission
- Limited free quota

### Persona 3: Educator (Prof. Martinez, 48, Teaching Assistant)

**Goal:** Collaborate with students on structure analysis

**Workflow:**
1. Logs in → Opens Viewer with structure
2. Clicks "Collaborate" → Creates session "CHEM101-Lab3"
3. Shares invite code in class chat
4. Students join → Prof sees 12 users connected
5. Creates annotations pointing to active site
6. Students' cursors visible in real-time
7. Exports session report (missing!)
8. **Success:** Engaging collaborative session

**Pain Points:**
- No session recording/replay
- Can't save annotations for next class
- No presenter mode (lock student cameras)
- No chat/voice integration

---

## 14. Performance Metrics

### Current Performance (Estimated)

**Page Load Times:**
- Home: ~1.2s (First Contentful Paint)
- Viewer (no structure): ~1.5s
- Viewer (with structure): ~3-8s (depends on size)
- Jobs page: ~1.8s

**Interaction Latency:**
- Button clicks: <50ms
- Form submissions: 200-500ms
- 3D viewer rotation: 60fps target
- Real-time cursor sync: <100ms

**Bundle Sizes:**
- Initial bundle: ~250KB (estimated)
- Mol* library: ~2MB (lazy loaded)
- Total vendor: ~500KB

**Recommendations:**
- Implement React.lazy for routes
- Code split Mol* viewer
- Optimize images (WebP, AVIF)
- Use dynamic imports for modals

---

## 15. Conclusion

### Overall Assessment

**Strengths:**
1. Modern tech stack (Next.js 14, React 18, TypeScript)
2. Well-structured component architecture
3. Comprehensive real-time collaboration
4. Responsive design considerations
5. Good separation of concerns

**Weaknesses:**
1. Dual routing architecture (legacy + Next.js)
2. Inconsistent error handling
3. Accessibility gaps
4. No unified form validation
5. Missing global toast system

### Priority Roadmap

**Phase 1 (1-2 weeks):** Quick Wins
- Add toast provider to root
- Implement keyboard shortcuts modal
- Add loading skeletons
- Improve error messages

**Phase 2 (1 month):** Core UX
- Complete Next.js migration
- Accessibility audit & fixes
- Mobile UX improvements
- Form validation library

**Phase 3 (2-3 months):** Advanced Features
- Undo/redo system
- Comprehensive testing
- Performance optimization
- Advanced collaboration

**Phase 4 (Ongoing):** Analytics & Iteration
- User analytics
- Feedback collection
- A/B testing
- Continuous improvement

---

## Appendix

### A. Component Inventory

**Total Components:** 70+
**Pages:** 11
**Reusable UI Components:** 15
**Feature Components:** 44

### B. Event Handler Count

**Total Event Handlers:** 310 across 50 files
**Most Common:**
- `onClick`: 185
- `onChange`: 78
- `onSubmit`: 24
- `onKeyDown`: 12
- `addEventListener`: 11

### C. Hook Usage

**Total Hook Calls:** 294 across 48 files
**Most Common:**
- `useState`: 142
- `useEffect`: 86
- `useCallback`: 41
- `useMemo`: 25

### D. Third-Party Libraries

**UI:**
- Radix UI (via shadcn/ui)
- Lucide React (icons)
- Tailwind CSS

**Data Fetching:**
- React Query (implied, not confirmed)
- Supabase (auth + realtime)

**3D Visualization:**
- Mol* (MolStar)

**State Management:**
- Zustand

**Forms:**
- None (manual state) - ISSUE

**Testing:**
- Vitest
- Playwright
- @testing-library/react

---

**End of Analysis**

For questions or clarifications, please refer to the individual component files or contact the development team.
