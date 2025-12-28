# Interactive Features - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the enhanced interactive features for the LAB Visualizer molecular visualization system. It includes code examples, testing strategies, and deployment procedures.

**Related Documents:**
- [System Design](./interactive-features-system-design.md)
- [Component Specifications Part 1](./component-specifications.md)
- [Component Specifications Part 2](./component-specifications-part2.md)
- [Enhanced MolStar Service API](./enhanced-molstar-service-api.md)

---

## Prerequisites

### Required Dependencies

```json
{
  "dependencies": {
    "molstar": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### Development Environment Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type check
npm run typecheck
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Update type definitions
- Add hover detection to molstar-service
- Create useHoverDetection hook
- Implement HoverTooltip component

### Phase 2: Measurements (Week 2-3)
- Implement measurement creation APIs
- Create useMeasurements hook
- Build MeasurementsPanel component
- Add 3D visualization for measurements

### Phase 3: Sequence Viewer (Week 3-4)
- Implement sequence extraction APIs
- Create useSequenceSync hook
- Build SequenceViewer component
- Add bidirectional sync

### Phase 4: Interactions Panel (Week 4-6)
- Implement interaction detection algorithms
- Create useInteractions hook
- Build InteractionsPanel component
- Optimize for performance

### Phase 5: Integration & Polish (Week 6-7)
- Create EnhancedMolStarViewer unified component
- Write comprehensive tests
- Performance optimization
- Documentation

---

## Quick Start Guide

### Step 1: Add Type Definitions

Extend `/src/types/molstar.ts` with interactive feature types from the specifications.

### Step 2: Extend MolstarService

Add methods to `/src/services/molstar-service.ts` incrementally following the [Enhanced MolStar Service API](./enhanced-molstar-service-api.md).

Start with hover detection:

```typescript
// In molstar-service.ts
export class MolstarService {
  public async getHoverInfo(
    x: number,
    y: number
  ): Promise<HoverData | null> {
    // See enhanced-molstar-service-api.md for full implementation
  }

  private extractAtomInfo(loci: any): AtomInfo | undefined {
    // Implementation details...
  }

  private extractResidueInfo(loci: any): ResidueInfo | undefined {
    // Implementation details...
  }

  private extractChainInfo(loci: any): ChainInfo | undefined {
    // Implementation details...
  }
}
```

### Step 3: Create Custom Hooks

Create `/src/hooks/useHoverDetection.ts` following the specification.

### Step 4: Build Components

Create components in `/src/components/viewer/` directory:
- `HoverTooltip.tsx`
- `MeasurementsPanel.tsx`
- `SequenceViewer.tsx`
- `InteractionsPanel.tsx`

### Step 5: Create Unified Viewer

Create `/src/components/viewer/EnhancedMolStarViewer.tsx` that integrates all features.

---

## Testing Strategy

### Unit Tests Location
`/src/components/viewer/__tests__/`

### Integration Tests Location
`/src/__tests__/integration/`

### E2E Tests Location
`/e2e/`

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## Performance Optimization Checklist

- [ ] Throttle hover events (100ms)
- [ ] Memoize expensive calculations
- [ ] Use virtual scrolling for long sequences
- [ ] Lazy load heavy computations
- [ ] Implement React.memo for components
- [ ] Profile with React DevTools
- [ ] Monitor bundle size impact

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Performance benchmarks meet targets
- [ ] Documentation complete
- [ ] Code review approved

### Feature Flags Setup

```typescript
// /src/config/features.ts
export const INTERACTIVE_FEATURES = {
  hoverTooltips: process.env.NEXT_PUBLIC_ENABLE_HOVER === 'true',
  measurements: process.env.NEXT_PUBLIC_ENABLE_MEASUREMENTS === 'true',
  sequenceViewer: process.env.NEXT_PUBLIC_ENABLE_SEQUENCE === 'true',
  interactions: process.env.NEXT_PUBLIC_ENABLE_INTERACTIONS === 'true',
};
```

### Gradual Rollout Plan

1. **Week 1**: 10% users (HoverTooltip only)
2. **Week 2**: 25% users (HoverTooltip + Measurements)
3. **Week 3**: 50% users (All except Interactions)
4. **Week 4**: 100% users (All features)

---

## Troubleshooting Guide

### Issue: Hover tooltip not appearing

**Symptoms**: No tooltip shows when hovering over atoms

**Solutions**:
1. Verify `data-molstar-container` attribute exists on container
2. Check browser console for errors
3. Test `molstarService.getHoverInfo()` directly
4. Verify z-index of tooltip (should be 9999)
5. Check if feature flag is enabled

### Issue: Measurements not visible

**Symptoms**: Measurements created but not shown in 3D view

**Solutions**:
1. Check measurement visibility flag
2. Verify MolStar representation created
3. Check browser console for errors
4. Try clearing and recreating measurement
5. Verify atoms were properly selected

### Issue: Sequence viewer not loading

**Symptoms**: Empty sequence panel or loading forever

**Solutions**:
1. Verify structure loaded successfully
2. Check `molstarService.getSequence()` return value
3. Verify chains array not empty
4. Check console for errors during extraction
5. Test with simpler PDB structure

### Issue: Poor performance with large structures

**Symptoms**: Lag, high memory usage, slow interactions

**Solutions**:
1. Enable virtual scrolling for sequences
2. Increase hover throttle time
3. Limit simultaneous measurements
4. Batch interaction detections
5. Use LOD system for very large structures
6. Profile with React DevTools Profiler

---

## Code Examples

### Example: Basic Usage

```typescript
import { EnhancedMolStarViewer } from '@/components/viewer/EnhancedMolStarViewer';

function MyViewer() {
  return (
    <EnhancedMolStarViewer
      pdbId="1abc"
      enableHoverTooltip
      enableMeasurements
      enableSequenceViewer
      enableInteractions
      onLoadComplete={() => console.log('Loaded!')}
    />
  );
}
```

### Example: Custom Feature Configuration

```typescript
<EnhancedMolStarViewer
  pdbId="1abc"
  enableHoverTooltip={true}
  enableMeasurements={true}
  enableSequenceViewer={false}  // Disable for simple view
  enableInteractions={false}     // Disable for performance
/>
```

### Example: Programmatic Control

```typescript
import { molstarService } from '@/services/molstar-service';

// Programmatically highlight residues
async function highlightResidues() {
  await molstarService.highlightResidues({
    chainId: 'A',
    residueIds: [10, 11, 12, 13, 14],
    color: '#ff0000',
    focus: true,
  });
}

// Programmatically create measurement
async function createMeasurement() {
  const measurementId = await molstarService.createMeasurement(
    'distance',
    [atom1, atom2],
    { color: '#00ff00', label: 'Active site distance' }
  );
}
```

---

## Documentation Requirements

### API Documentation

Generate TypeDoc comments for all public APIs:

```typescript
/**
 * HoverTooltip Component
 *
 * Displays molecular information when hovering over atoms in the 3D viewer.
 *
 * @example
 * ```tsx
 * <HoverTooltip
 *   hoverData={hoverData}
 *   enabled={true}
 *   variant="detailed"
 * />
 * ```
 *
 * @see {@link HoverTooltipProps}
 */
```

### User Documentation

Create user guide in `/docs/user-guide/interactive-features.md`:
- Feature overview with screenshots
- Step-by-step usage instructions
- Tips and best practices
- FAQ section

### Developer Documentation

Update `/docs/api/`:
- API reference for all new methods
- Code examples
- Integration patterns
- Performance considerations

---

## Monitoring & Maintenance

### Metrics to Track

1. **Usage Metrics**:
   - Feature adoption rate
   - Most used features
   - Average session duration

2. **Performance Metrics**:
   - Hover response time
   - Measurement creation latency
   - Component render times
   - Memory usage

3. **Error Metrics**:
   - Error rate by component
   - Common error types
   - User-reported issues

### Regular Maintenance Tasks

**Weekly**:
- Review error logs
- Check performance dashboards
- Review user feedback

**Monthly**:
- Dependency updates
- Performance optimization
- Documentation updates

**Quarterly**:
- Major version updates
- Security audit
- UX assessment

---

## Support Resources

### Getting Help

- **Documentation**: `/docs/architecture/`
- **API Reference**: Generated TypeDoc
- **Issues**: GitHub Issues with `[interactive-features]` tag
- **Questions**: Team Slack `#lab-visualizer-dev`

### Useful Links

- [MolStar Documentation](https://molstar.org/docs/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Docs](https://vitest.dev/)

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Update type definitions
- [ ] Add hover detection API
- [ ] Create useHoverDetection hook
- [ ] Build HoverTooltip component
- [ ] Write unit tests
- [ ] Update MolStarViewer container

### Phase 2: Measurements ✅
- [ ] Implement measurement APIs
- [ ] Create useMeasurements hook
- [ ] Build MeasurementsPanel component
- [ ] Add 3D visualization
- [ ] Write integration tests

### Phase 3: Sequence Viewer ✅
- [ ] Implement sequence extraction
- [ ] Create useSequenceSync hook
- [ ] Build SequenceViewer component
- [ ] Add bidirectional sync
- [ ] Write E2E tests

### Phase 4: Interactions ✅
- [ ] Implement detection algorithms
- [ ] Create useInteractions hook
- [ ] Build InteractionsPanel component
- [ ] Optimize performance
- [ ] Write comprehensive tests

### Phase 5: Integration ✅
- [ ] Create EnhancedMolStarViewer
- [ ] Integration testing
- [ ] Performance profiling
- [ ] Documentation
- [ ] Deployment preparation

---

## Success Criteria

### Technical Criteria
- ✅ All tests passing (100% coverage for new code)
- ✅ Performance targets met (see system design doc)
- ✅ No TypeScript errors
- ✅ Bundle size increase <100KB gzipped
- ✅ Lighthouse performance score >90

### User Experience Criteria
- ✅ Hover response feels instantaneous (<100ms)
- ✅ Measurements creation intuitive
- ✅ Sequence-structure sync seamless
- ✅ Interactions visualization clear
- ✅ No UI freezing or lag

### Business Criteria
- ✅ Feature adoption >50% within 1 month
- ✅ Positive user feedback (>4.0/5.0)
- ✅ No critical bugs in production
- ✅ Support ticket volume manageable

---

## Next Steps After Implementation

1. **Collect User Feedback**
   - In-app surveys
   - User interviews
   - Usage analytics

2. **Iterate Based on Feedback**
   - Prioritize improvements
   - Address pain points
   - Add requested features

3. **Expand Feature Set**
   - Animation timelines
   - Collaborative annotations
   - Custom scripting API
   - VR/AR support

4. **Optimize Further**
   - WebGL 2 enhancements
   - WebGPU support
   - Advanced LOD techniques

---

**Document Version**: 1.0
**Last Updated**: 2025-11-24
**Implementation Status**: Ready for Development
**Estimated Completion**: 7 weeks (following phased approach)
