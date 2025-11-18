# ADR-006: Performance-First Development

## Status
Accepted

## Context

The LAB Visualization Platform must provide an excellent user experience across all devices, especially for students using Chromebooks, tablets, and mobile devices. Performance is critical for:

1. **User Experience**:
   - 3D molecular visualization must be smooth (60 FPS)
   - Load times directly impact engagement and learning
   - Mobile users on slow networks need fast initial loads
   - Classroom environments have limited bandwidth

2. **Educational Context**:
   - Students have short attention spans (3-5s tolerance for loading)
   - Teachers need reliable, fast demos during lectures
   - School networks are often slow (1-5 Mbps)
   - Many students use older devices (3-5 years old)

3. **Technical Challenges**:
   - Large molecular structures (100KB-2MB PDB files)
   - Heavy 3D rendering libraries (Mol* ~4MB)
   - Complex state management and calculations
   - Real-time collaboration features

4. **Competitive Landscape**:
   - Users compare to native apps (PyMOL, Chimera)
   - Competing web tools often have poor performance
   - Performance = trust = retention

5. **Current State** (Without Performance Budget):
   - Initial bundle: 15-20MB
   - Time to Interactive (TTI): 8-12 seconds
   - First Contentful Paint (FCP): 3-5 seconds
   - Lighthouse score: 50-65

## Decision

We will implement a **performance-first development approach** with strict budgets and automated enforcement:

### Performance Budgets

#### Core Web Vitals (Google Lighthouse)
- **LCP (Largest Contentful Paint)**: <2.5s (target: 1.5s)
- **FID (First Input Delay)**: <100ms (target: 50ms)
- **CLS (Cumulative Layout Shift)**: <0.1 (target: 0.05)
- **Lighthouse Score**: >90 (target: 95+)

#### Asset Budgets
- **Initial JavaScript Bundle**: <200KB (target: 150KB)
- **Initial CSS**: <50KB (target: 30KB)
- **Total Page Weight**: <1MB (target: 750KB)
- **3D Library (Mol*)**: <4MB (lazy loaded)
- **Fonts**: <100KB (subset + woff2)

#### Runtime Performance
- **Time to Interactive (TTI)**: <3s on 3G (target: 2s)
- **First Contentful Paint (FCP)**: <1.5s (target: 1s)
- **Frame Rate**: >60 FPS for 3D rendering
- **Memory Usage**: <100MB baseline, <500MB with large structures

#### Network Performance
- **API Response Time**: <200ms (edge cached)
- **Structure Load Time**: <1s (cached), <3s (uncached)
- **Cache Hit Rate**: >95%
- **CDN Hit Rate**: >90%

### Implementation Strategy

#### 1. Code Splitting & Lazy Loading
```typescript
// Lazy load heavy 3D viewer
const MolecularViewer = dynamic(() => import('./MolecularViewer'), {
  loading: () => <ViewerSkeleton />,
  ssr: false, // No server-side rendering for 3D
});

// Route-based code splitting (automatic with Next.js App Router)
app/
├── page.tsx (Home - 50KB)
├── viewer/
│   └── page.tsx (Viewer - 150KB + 4MB Mol* lazy loaded)
└── simulations/
    └── page.tsx (Simulations - 100KB)
```

#### 2. Progressive Enhancement
```typescript
// Load 2D representation first, then upgrade to 3D
function StructureViewer({ pdbId }: { pdbId: string }) {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');

  // Show 2D immediately (lightweight)
  if (mode === '2d') {
    return <Structure2D pdbId={pdbId} onUpgrade={() => setMode('3d')} />;
  }

  // Lazy load 3D viewer on user interaction
  return (
    <Suspense fallback={<ViewerSkeleton />}>
      <MolecularViewer3D pdbId={pdbId} />
    </Suspense>
  );
}
```

#### 3. Image Optimization
```typescript
// Next.js Image with automatic optimization
import Image from 'next/image';

<Image
  src="/proteins/hemoglobin.jpg"
  alt="Hemoglobin structure"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  formats={['image/avif', 'image/webp']} // Automatic format selection
/>
```

#### 4. Font Optimization
```css
/* Subset fonts to Latin characters only */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-subset.woff2') format('woff2');
  font-display: swap; /* Avoid FOIT (Flash of Invisible Text) */
  unicode-range: U+0000-00FF; /* Latin only */
}
```

#### 5. Server Components (Next.js 13+)
```typescript
// Server Component - no JavaScript sent to client
export default async function StructureList() {
  const structures = await fetchPopularStructures(); // Runs on server

  return (
    <div>
      {structures.map(s => (
        <StructureCard key={s.id} structure={s} /> // Client Component
      ))}
    </div>
  );
}
```

#### 6. Bundle Analysis & Monitoring
```bash
# Analyze bundle size
npm run analyze

# Visualize bundle composition
npm run build -- --analyze
```

### Automated Enforcement

#### CI/CD Performance Checks
```yaml
# .github/workflows/performance.yml
name: Performance Budget

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm ci
          npm run build
          npx @lhci/cli@0.12.x autorun --upload.target=temporary-public-storage
      - name: Check Performance Budget
        run: |
          npx @lhci/cli@0.12.x assert \
            --preset="lighthouse:recommended" \
            --assertions.performance=0.9 \
            --assertions.first-contentful-paint=1500
```

#### Bundle Size Limit
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 200000, // 200KB
        maxEntrypointSize: 200000,
        hints: 'error', // Fail build if exceeded
      };
    }
    return config;
  },
};
```

#### Real User Monitoring (RUM)
```typescript
// Vercel Analytics + Web Vitals
import { sendToAnalytics } from './analytics';

export function reportWebVitals(metric: Metric) {
  // Log to Vercel Analytics
  sendToAnalytics(metric);

  // Alert if budget exceeded
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.error(`LCP budget exceeded: ${metric.value}ms`);
  }
}
```

## Consequences

### Positive
1. **Better User Experience**: Faster loads = higher engagement and retention
2. **Mobile Support**: 3G networks now usable (50% of students)
3. **SEO Benefits**: Google rewards fast sites (higher search ranking)
4. **Lower Bounce Rate**: 53% of users abandon sites >3s load time
5. **Accessibility**: Better for users with disabilities (screen readers, keyboard nav)
6. **Cost Savings**: Less bandwidth = lower Vercel egress costs
7. **Developer Discipline**: Forces efficient code and architecture decisions
8. **Competitive Advantage**: Fastest educational molecular viewer

### Negative
1. **Development Overhead**: Must constantly monitor and optimize
2. **Complexity**: Code splitting and lazy loading add complexity
3. **Testing**: Must test performance across devices and networks
4. **Trade-offs**: Sometimes must sacrifice features for performance
5. **Build Time**: Optimization steps increase build time

### Metrics (Before vs After)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lighthouse Score | 50-65 | >90 | +40-50% |
| Initial Bundle | 15-20MB | <200KB | -98% |
| LCP | 5-8s | <2.5s | -60% |
| TTI | 8-12s | <3s | -70% |
| Cache Hit Rate | 40% | >95% | +138% |

### Risk Mitigation
- **Over-Optimization**: Use profiling to identify real bottlenecks
- **Maintenance Burden**: Automate performance testing in CI/CD
- **False Positives**: Use real user monitoring (RUM) not just synthetic tests
- **Premature Optimization**: Focus on user-facing features first

## Alternatives Considered

### 1. No Performance Budget (Best Effort)
**Rejected**:
- Leads to performance regressions over time
- No accountability for slow features
- Users suffer poor experience
- Harder to optimize retroactively

### 2. Strict 100KB Budget (Extreme)
**Rejected**:
- Too restrictive for 3D molecular visualization
- Would require native app (defeats purpose)
- Cannot include necessary libraries (Mol*)

### 3. Desktop-Only Optimization
**Rejected**:
- Ignores 50% of users on mobile/tablets
- School Chromebooks have limited resources
- Misses growing mobile-first audience

### 4. Pre-Rendered Static Site
**Rejected**:
- Cannot support interactive simulations
- No dynamic structure loading
- Poor user experience for exploratory learning

## Implementation Notes

### Performance Testing Setup
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run local performance test
lhci autorun --config=lighthouserc.json

# Generate report
lhci upload --target=temporary-public-storage
```

### Lighthouse CI Configuration
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "categories:performance": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Bundle Analyzer
```bash
# Add to package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "ANALYZE=true BUNDLE_ANALYZE=server next build",
    "analyze:browser": "ANALYZE=true BUNDLE_ANALYZE=browser next build"
  }
}
```

### Performance Dashboard
```typescript
// Track Core Web Vitals in production
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id }: Metric) {
  // Send to Vercel Analytics, Google Analytics, or custom endpoint
  const body = JSON.stringify({ name, value, id });
  fetch('/api/analytics', { method: 'POST', body });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}: ${value}ms`);
  }
}

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## References
- Core Web Vitals: https://web.dev/vitals/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Next.js Performance: https://nextjs.org/docs/advanced-features/measuring-performance
- Vercel Analytics: https://vercel.com/analytics
- Web Vitals Library: https://github.com/GoogleChrome/web-vitals
- Technical Analysis: `/docs/analysis/technical-analysis.md`
