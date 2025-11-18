# LOD System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Lab Visualizer                               │
│                      LOD Rendering System                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         QualitySettings.tsx (React Component)               │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • Quality Slider (Low → Extreme)                          │    │
│  │  • Auto-Adjust Toggle                                      │    │
│  │  • Real-Time FPS Display                                   │    │
│  │  • Performance Stats Panel                                 │    │
│  │  • Device Info & Recommendations                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Management Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   LODManager     │  │  QualityManager  │  │    Profiler     │  │
│  ├──────────────────┤  ├──────────────────┤  ├─────────────────┤  │
│  │ • Complexity     │  │ • FPS Monitor    │  │ • Frame Track   │  │
│  │   Analysis       │  │ • Auto-Adjust    │  │ • Bottleneck    │  │
│  │ • Level Select   │  │ • Device Detect  │  │   Detection     │  │
│  │ • Progressive    │  │ • Quality Preset │  │ • Metrics       │  │
│  │   Loading        │  │ • Metrics Track  │  │ • Reports       │  │
│  │ • Memory Budget  │  │ • Cooldown       │  │ • Real-time     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │                      │            │
└───────────┼─────────────────────┼──────────────────────┼────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Processing Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Geometry Loader Worker (Web Worker)                   │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  • Background Geometry Generation                            │  │
│  │  • Sphere Generation (6/12/24 segments)                      │  │
│  │  • Mesh Simplification                                       │  │
│  │  • Instance Data Preparation                                 │  │
│  │  • Zero-Copy Buffer Transfer                                 │  │
│  │  • Bounding Box Calculation                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Rendering Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Mol* Viewer Integration                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  • WebGL Rendering                                           │  │
│  │  • GPU Instancing                                            │  │
│  │  • Frustum Culling                                           │  │
│  │  • Shader Management                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Progressive Loading Flow

```
Structure Data
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ Step 1: Analyze Complexity                          │
├─────────────────────────────────────────────────────┤
│  LODManager.analyzeComplexity(structure)            │
│    → atomCount, bondCount, residueCount             │
│    → estimatedVertices, memory requirement          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Step 2: Determine Starting Level                    │
├─────────────────────────────────────────────────────┤
│  LODManager.determineStartingLevel(complexity)      │
│    → PREVIEW (>50K atoms)                           │
│    → INTERACTIVE (500-50K atoms)                    │
│    → FULL (<500 atoms)                              │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Step 3: Progressive Loading Loop                    │
├─────────────────────────────────────────────────────┤
│  FOR EACH level (starting → target):                │
│    1. Filter atoms for level                        │
│    2. Send to Web Worker                            │
│    3. Render geometry                               │
│    4. Measure FPS                                   │
│    5. Record metrics                                │
│    6. Brief pause (50ms)                            │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Step 4: Quality Monitoring                          │
├─────────────────────────────────────────────────────┤
│  QualityManager monitors FPS continuously           │
│    → FPS < minFPS: Downgrade quality                │
│    → FPS > targetFPS * 1.2: Upgrade quality         │
│    → 3s cooldown between adjustments                │
└─────────────────────────────────────────────────────┘
```

## LOD Levels Detail

### Preview Level
```
Input:  All atoms from structure
   ↓
Filter: Backbone atoms only (CA, C, N, O)
   ↓
Limit:  First 100 atoms
   ↓
Worker: Generate 6-segment spheres
   ↓
Render: Simple lighting, no effects
   ↓
Output: 60 FPS @ <200ms load
```

### Interactive Level
```
Input:  All atoms from structure
   ↓
Filter: Key atoms (CA, CB, C, N, O) + ligands
   ↓
Limit:  First 1,000 atoms
   ↓
Worker: Generate 12-segment spheres
   ↓
Render: Cartoon, basic lighting, FXAA
   ↓
Output: 60 FPS @ <1s load
```

### Full Detail Level
```
Input:  All atoms from structure
   ↓
Filter: All atoms (respecting device limit)
   ↓
Limit:  First 100,000 atoms
   ↓
Worker: Generate 24-segment spheres
   ↓
Render: All effects, surfaces, MSAA
   ↓
Output: 30+ FPS @ <3s load
```

## Quality Management Flow

```
┌─────────────────────────────────────────────────────┐
│              Application Start                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ QualityManager.initialize(canvas)                   │
├─────────────────────────────────────────────────────┤
│  1. Detect WebGL version (1 vs 2)                   │
│  2. Query GPU vendor/renderer                       │
│  3. Check max texture size                          │
│  4. Test for instancing support                     │
│  5. Determine device tier                           │
│  6. Recommend quality level                         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         Continuous FPS Monitoring                    │
├─────────────────────────────────────────────────────┤
│  Every 1 second:                                     │
│    • Calculate average FPS (last 60 frames)         │
│    • Add to 2-second history (120 frames)           │
│    • Update metrics                                 │
│    • Trigger auto-adjust if needed                  │
└─────────────────────┬───────────────────────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
┌──────────────────────┐  ┌──────────────────────┐
│ FPS < minFPS (30)    │  │ FPS > target * 1.2   │
├──────────────────────┤  ├──────────────────────┤
│ Downgrade Quality:   │  │ Upgrade Quality:     │
│  • Reduce by 1 level │  │  • Increase by 1     │
│  • Apply cooldown    │  │  • Check device max  │
│  • Clear FPS history │  │  • Apply cooldown    │
│  • Notify user       │  │  • Clear FPS history │
└──────────────────────┘  └──────────────────────┘
```

## Performance Profiling Flow

```
┌─────────────────────────────────────────────────────┐
│              Render Loop Start                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Profiler.startFrame()                               │
├─────────────────────────────────────────────────────┤
│  • Record start timestamp                           │
│  • Start GPU timer (if available)                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            Rendering Operations                      │
├─────────────────────────────────────────────────────┤
│  • Geometry updates                                 │
│  • Draw calls                                       │
│  • Shader operations                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Profiler.endFrame(drawCalls, triangles)             │
├─────────────────────────────────────────────────────┤
│  • Calculate frame time                             │
│  • Estimate CPU/GPU split                           │
│  • Record memory usage                              │
│  • Store profile                                    │
│  • Return metrics                                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          Bottleneck Analysis (on demand)            │
├─────────────────────────────────────────────────────┤
│  Analyze last 120 frames:                           │
│    • Calculate CPU utilization                      │
│    • Calculate GPU utilization                      │
│    • Check memory usage                             │
│    • Identify bottleneck                            │
│    • Generate recommendations                       │
└─────────────────────────────────────────────────────┘
```

## Component Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Action (Load Structure)                                │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │         LODManager.loadProgressive()          │           │
│  └────┬─────────────────────────────────────┬───┘           │
│       │                                     │                │
│       ▼                                     │                │
│  ┌──────────────────┐                      │                │
│  │  Filter Atoms    │                      │                │
│  │  for Level       │                      │                │
│  └────┬─────────────┘                      │                │
│       │                                     │                │
│       ▼                                     │                │
│  ┌──────────────────────────────┐          │                │
│  │  Web Worker (Background)     │          │                │
│  │  • Generate Geometry         │          │                │
│  │  • Transfer via Zero-Copy    │          │                │
│  └────┬─────────────────────────┘          │                │
│       │                                     │                │
│       ▼                                     │                │
│  ┌──────────────────┐                      │                │
│  │  Renderer.render()│                      │                │
│  └────┬─────────────┘                      │                │
│       │                                     │                │
│       ▼                                     ▼                │
│  ┌──────────────────┐          ┌────────────────────────┐  │
│  │  Profiler        │          │   QualityManager       │  │
│  │  • Track FPS     │◄─────────┤   • Monitor FPS        │  │
│  │  • Detect Issues │          │   • Auto-Adjust        │  │
│  └──────────────────┘          └────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Memory Management

```
┌─────────────────────────────────────────────────────┐
│              Memory Budget System                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Device Profile                                      │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────┐                               │
│  │  Memory Budget   │                               │
│  │  (128-1024 MB)   │                               │
│  └────┬─────────────┘                               │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────────────────────────┐           │
│  │  LODManager.estimateMemoryUsage()    │           │
│  ├──────────────────────────────────────┤           │
│  │  Estimate = atomsToRender *          │           │
│  │             verticesPerAtom *        │           │
│  │             32 bytes *               │           │
│  │             1.3 (overhead)           │           │
│  └────┬─────────────────────────────────┘           │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────────────────────────┐           │
│  │  LODManager.canAffordLevel()         │           │
│  ├──────────────────────────────────────┤           │
│  │  if (estimate <= budget * 0.8):      │           │
│  │    return true                       │           │
│  │  else:                               │           │
│  │    return false                      │           │
│  └──────────────────────────────────────┘           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Progressive Loading
- **Why**: Provides instant feedback while loading complex structures
- **How**: Three-stage pipeline with increasing detail
- **Benefit**: User can interact while loading continues

### 2. Auto-Quality Adjustment
- **Why**: Maintains target FPS across devices and scenarios
- **How**: Monitor FPS, adjust quality level with cooldown
- **Benefit**: Automatic optimization without user intervention

### 3. Web Worker for Geometry
- **Why**: Prevent main thread blocking during geometry generation
- **How**: Background processing with zero-copy transfer
- **Benefit**: Smooth UI during intensive computation

### 4. Memory Budget System
- **Why**: Prevent out-of-memory errors on low-end devices
- **How**: Estimate before loading, refuse if exceeds budget
- **Benefit**: Graceful degradation instead of crashes

### 5. Device Detection
- **Why**: Tailor experience to device capabilities
- **How**: Query WebGL features, analyze GPU info
- **Benefit**: Optimal quality for each device tier

## Performance Optimization Strategies

### 1. Atom Filtering
```
All Atoms (100K)
    ↓ Filter
Preview: 100 atoms (0.1% rendered)
Interactive: 1,000 atoms (1% rendered)
Full: 100,000 atoms (100% rendered)
```

### 2. Geometry LOD
```
Preview:     6 segments = 84 vertices/atom
Interactive: 12 segments = 338 vertices/atom
Full:        24 segments = 1,352 vertices/atom
```

### 3. Feature Gating
```
Low Quality:     No shadows, no AO, no surfaces
Medium Quality:  Basic lighting, FXAA
High Quality:    Full lighting, detailed models
Ultra Quality:   + Surfaces, shadows
Extreme Quality: + Ambient occlusion, MSAA
```

## Error Handling

```
┌─────────────────────────────────────────────────────┐
│              Error Recovery Flow                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Loading Error                                       │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────┐                               │
│  │  Try Lower LOD   │───Yes───► Load with Preview   │
│  │  Level?          │                    │           │
│  └────┬─────────────┘                    │           │
│       │ No                                │           │
│       ▼                                   ▼           │
│  ┌──────────────────┐          ┌──────────────────┐ │
│  │  Show Error to   │          │  Success! Mark   │ │
│  │  User            │          │  as Partial Load │ │
│  └──────────────────┘          └──────────────────┘ │
│                                                      │
│  Performance Issue                                   │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────┐                               │
│  │  Auto-Quality    │───Yes───► Downgrade Quality   │
│  │  Enabled?        │                    │           │
│  └────┬─────────────┘                    │           │
│       │ No                                │           │
│       ▼                                   ▼           │
│  ┌──────────────────┐          ┌──────────────────┐ │
│  │  Show Warning    │          │  Continue with   │ │
│  │  to User         │          │  Lower Quality   │ │
│  └──────────────────┘          └──────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Future Architecture Enhancements

1. **Spatial Indexing**: Octree/BVH for efficient culling
2. **Streaming Pipeline**: Progressive structure loading from network
3. **GPU Compute**: Geometry generation on GPU
4. **Predictive Loading**: ML-based quality prediction
5. **Adaptive LOD**: Distance-based detail levels

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Status**: Production Ready
