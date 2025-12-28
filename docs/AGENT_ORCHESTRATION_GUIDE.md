# Agent Orchestration Guide - LAB Visualizer GOAP Execution

**Quick Start Guide for Spawning AI Agents with Claude Flow**

---

## 🚀 Phase 2: Visual Enhancements (Weeks 1-2)

### Week 1: Measurement Visualization + Multi-Selection

**Option 1: Parallel Execution (Recommended)**

```bash
# Initialize hierarchical swarm for coordinated development
npx claude-flow swarm init --topology hierarchical --max-agents 3

# Spawn agents in parallel
npx claude-flow agents spawn-parallel '{
  "agents": [
    {
      "type": "coder",
      "name": "MeasurementViz Agent",
      "priority": "critical",
      "capabilities": ["molstar-integration", "3d-rendering", "tdd"]
    },
    {
      "type": "coder",
      "name": "MultiSelection Agent",
      "priority": "high",
      "capabilities": ["react-hooks", "state-management", "tdd"]
    },
    {
      "type": "tester",
      "name": "Test Coordinator",
      "priority": "high",
      "capabilities": ["vitest", "playwright", "coverage-analysis"]
    }
  ],
  "maxConcurrency": 3
}'

# Orchestrate Phase 2 Week 1 tasks
npx claude-flow task orchestrate "Phase 2 Week 1: Measurement Visualization and Multi-Selection" --strategy parallel --priority critical
```

**Agent 1: MeasurementViz (action-2.1)**
```javascript
// Task for MeasurementViz Agent
{
  "task": "action-2.1-measurement-viz",
  "description": "Implement 3D measurement visualization using TDD",
  "instructions": `
    1. READ: docs/GOAP_IMPLEMENTATION_PLAN.md (action-2.1 section)
    2. WRITE TESTS FIRST (4 hours):
       - tests/services/molstar/measurement-renderer.test.ts
       - tests/services/molstar/measurement-representations.test.ts
       - tests/components/viewer/interactive/MeasurementVisualization.test.tsx
    3. IMPLEMENT (8-10 hours):
       - src/services/molstar/measurement-renderer.ts
       - Integrate with molstar-service.ts
    4. VALIDATE (2 hours):
       - npm run test:coverage (verify +3% increase)
       - Manual testing in browser
       - FPS monitoring (<5% degradation)
    5. DOCUMENT (1 hour):
       - Update docs/architecture/enhanced-molstar-service-api.md
       - Add usage examples
  `,
  "success_criteria": {
    "tests_passing": true,
    "coverage_increase": ">=3%",
    "fps_degradation": "<5%",
    "deliverables": ["Distance lines in 3D", "Angle arcs in 3D", "Dihedral planes in 3D", "Floating labels"]
  },
  "estimated_hours": 16,
  "tdd": true
}
```

**Agent 2: MultiSelection (action-2.2)**
```javascript
// Task for MultiSelection Agent
{
  "task": "action-2.2-multi-selection",
  "description": "Implement multi-atom selection system using TDD",
  "instructions": `
    1. READ: docs/GOAP_IMPLEMENTATION_PLAN.md (action-2.2 section)
    2. WRITE TESTS FIRST (3 hours):
       - tests/hooks/viewer/use-multi-selection.test.ts
    3. IMPLEMENT (4-5 hours):
       - src/hooks/viewer/use-multi-selection.ts
       - Update useMeasurements hook to use multi-selection
    4. VALIDATE (2 hours):
       - Unit tests passing
       - Integration with measurements working
       - Manual testing
    5. DOCUMENT (1 hour):
       - Update component specifications
  `,
  "success_criteria": {
    "tests_passing": true,
    "coverage_increase": ">=2%",
    "max_selections": "Configurable (2 for distance, 3 for angle, 4 for dihedral)",
    "auto_trigger": "Measurement creates when limit reached"
  },
  "estimated_hours": 10,
  "tdd": true,
  "depends_on": []
}
```

**Agent 3: Test Coordinator**
```javascript
// Task for Test Coordinator
{
  "task": "test-coordination-phase2-week1",
  "description": "Coordinate test execution, coverage tracking, and CI integration",
  "instructions": `
    1. Monitor Agent 1 and Agent 2 test creation
    2. Run continuous test suite:
       - npm run test:watch
    3. Track coverage progression:
       - npm run test:coverage (hourly)
       - Log coverage delta
    4. Ensure no regressions:
       - All existing 39 test files still passing
    5. Prepare integration tests:
       - Create test stubs for measurement-visualization integration
    6. Generate daily coverage reports
  `,
  "success_criteria": {
    "no_regressions": true,
    "coverage_tracking": "Hourly reports",
    "integration_tests": "Stubs ready"
  },
  "estimated_hours": 8,
  "monitoring": true
}
```

### Week 2: Selection Highlighting + Hydrogen Bonds

**Sequential Execution (Dependencies)**

```bash
# Agent 1 continues with action-2.3 (depends on action-2.2 complete)
npx claude-flow task orchestrate "action-2.3-selection-highlighting" --strategy sequential --priority high

# Then action-2.4 (depends on action-2.3 complete)
npx claude-flow task orchestrate "action-2.4-hydrogen-bonds" --strategy sequential --priority high
```

**Agent 1: SelectionHighlighting (action-2.3)**
```javascript
{
  "task": "action-2.3-selection-highlighting",
  "depends_on": ["action-2.2-multi-selection"],
  "instructions": `
    TDD Workflow for Selection Highlighting:
    1. TESTS (3h): tests/services/molstar/selection-highlighter.test.ts
    2. IMPLEMENT (4-5h): src/services/molstar/selection-highlighter.ts
    3. VALIDATE (2h): Green tint on selected atoms, magenta on hover
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 10
}
```

**Agent 1: HydrogenBonds (action-2.4)**
```javascript
{
  "task": "action-2.4-hydrogen-bonds",
  "depends_on": ["action-2.3-selection-highlighting"],
  "instructions": `
    TDD Workflow for H-bond Detection:
    1. TESTS (4h):
       - tests/services/interactions/hydrogen-bond-detector.test.ts
       - tests/components/viewer/interactive/HydrogenBondsPanel.test.tsx
    2. IMPLEMENT (8-10h):
       - src/services/interactions/hydrogen-bond-detector.ts
       - src/components/viewer/interactive/HydrogenBondsPanel.tsx
    3. VALIDATE (2h): >95% accuracy, dashed yellow lines in 3D
    4. DOCUMENT (2h)
  `,
  "estimated_hours": 16
}
```

### Phase 2 Completion Validation

```bash
# After Week 2 complete, validate Phase 2
npx claude-flow task orchestrate "phase-2-validation" --strategy sequential

# Validation checklist
npx claude-flow sparc run test "Phase 2 comprehensive testing"
```

**Validation Agent Task:**
```javascript
{
  "task": "phase-2-validation",
  "description": "Validate Phase 2 completion criteria",
  "instructions": `
    Run comprehensive validation:
    1. npm run test (all tests passing?)
    2. npm run test:coverage (≥68% lines, functions?)
    3. Manual testing checklist:
       - Create distance measurement → see 3D line + label
       - Create angle measurement → see 3D arc + label
       - Create dihedral → see 3D planes + label
       - Select multiple atoms → see green tint
       - Hover atom → see magenta highlight
       - Select residue → see H-bonds (dashed yellow)
    4. Performance testing:
       - npm run test:e2e -- --grep performance
       - FPS impact <10%?
    5. Generate Phase 2 completion report
  `,
  "success_criteria": {
    "phase2Complete": true,
    "coverage": ">=68%",
    "all_features_working": true,
    "performance": "<10% FPS degradation"
  }
}
```

---

## 🚀 Phase 3: Sequence Viewer (Weeks 3-4)

### Week 3: Sequence Extraction + Viewer Foundation

**Parallel Start, Sequential Continuation**

```bash
# Spawn agents for Phase 3
npx claude-flow agents spawn-parallel '{
  "agents": [
    {
      "type": "coder",
      "name": "SequenceExtraction Agent",
      "capabilities": ["molstar-data-access", "bioinformatics", "tdd"]
    },
    {
      "type": "coder",
      "name": "SequenceUI Agent",
      "capabilities": ["react-components", "ui-ux", "tdd"]
    }
  ]
}'

# Agent 1: Sequence Extraction (action-3.1)
npx claude-flow task orchestrate "action-3.1-sequence-extraction" --priority critical
```

**Agent 1: SequenceExtraction (action-3.1)**
```javascript
{
  "task": "action-3.1-sequence-extraction",
  "instructions": `
    TDD: Sequence Extraction API
    1. TESTS (3h): tests/services/molstar/sequence-extractor.test.ts
       - Test protein sequence extraction (FASTA format)
       - Test multi-chain handling
       - Test secondary structure annotations
       - Test DNA/RNA sequences
    2. IMPLEMENT (4-5h): src/services/molstar/sequence-extractor.ts
    3. VALIDATE (2h): <500ms extraction time
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 10
}
```

### Week 3-4: Sequence Viewer Component + Integration

**Agent 2: SequenceViewer (action-3.2, depends on 3.1)**
```javascript
{
  "task": "action-3.2-sequence-viewer",
  "depends_on": ["action-3.1-sequence-extraction"],
  "instructions": `
    TDD: SequenceViewer Component
    1. TESTS (5h):
       - tests/components/viewer/interactive/SequenceViewer.test.tsx
       - tests/hooks/viewer/use-sequence-sync.test.ts
    2. IMPLEMENT (8-10h):
       - src/components/viewer/interactive/SequenceViewer.tsx
       - src/hooks/viewer/use-sequence-sync.ts
    3. VALIDATE (3h):
       - Bidirectional sync <50ms latency
       - Virtual scrolling for long sequences
       - Manual testing all features
    4. DOCUMENT (2h)
  `,
  "estimated_hours": 18
}
```

**Agent 2: SequenceIntegration (action-3.3, depends on 3.2)**
```javascript
{
  "task": "action-3.3-sequence-integration",
  "depends_on": ["action-3.2-sequence-viewer"],
  "instructions": `
    TDD: Integrate Sequence Viewer into ViewerLayout
    1. TESTS (2h): tests/integration/sequence-3d-sync.test.ts
    2. IMPLEMENT (3-4h): Update src/components/viewer/ViewerLayout.tsx
    3. VALIDATE (1h): End-to-end sync testing
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 8
}
```

### Phase 3 Validation

```bash
npx claude-flow task orchestrate "phase-3-validation" --strategy sequential
```

**Validation Criteria:**
- ✅ Coverage ≥76%
- ✅ Sequence loads <500ms
- ✅ Sync latency <50ms
- ✅ Virtual scrolling works for >1000 residues
- ✅ Secondary structure annotations visible

---

## 🚀 Phase 4: Interactions Panel (Weeks 5-6)

### Week 5: Interaction Detection Algorithms

**Single Agent, High Focus (Complex Algorithms)**

```bash
# Spawn specialized bioinformatics agent
npx claude-flow agent spawn --type coder --name "Interactions Algorithm Agent" --capabilities bioinformatics,structural-biology,tdd

# Orchestrate action-4.1
npx claude-flow task orchestrate "action-4.1-interaction-detection" --priority critical --strategy sequential
```

**Agent 1: InteractionDetection (action-4.1)**
```javascript
{
  "task": "action-4.1-interaction-detection",
  "description": "Implement all interaction detection algorithms with >90% accuracy",
  "instructions": `
    TDD: Comprehensive Interaction Detection
    1. TESTS (6h): tests/services/interactions/interaction-detector.test.ts
       Test Cases:
       - H-bonds: 2.5-3.5Å distance, >120° angle (existing from Phase 2)
       - Salt bridges: <4.0Å between charged residues (Lys/Arg ↔ Asp/Glu)
       - Hydrophobic: <5.0Å between hydrophobic residues, burial check
       - Pi-pi stacking: 3.5-4.5Å parallel, 4.5-5.5Å T-shaped
    2. IMPLEMENT (10-12h): src/services/interactions/interaction-detector.ts
       Algorithms:
       - detectHydrogenBonds() [reuse from Phase 2]
       - detectSaltBridges()
       - detectHydrophobicContacts()
       - detectPiPiStacking()
       - detectAllInteractions() [parallel execution]
    3. VALIDATE (4h):
       - Accuracy testing with known structures
       - H-bonds >95%, salt bridges >90%
       - Detection time <2s for typical proteins
    4. DOCUMENT (2h):
       - Algorithm descriptions
       - Threshold configurations
       - Performance characteristics
  `,
  "success_criteria": {
    "hbond_accuracy": ">95%",
    "salt_bridge_accuracy": ">90%",
    "detection_time": "<2s",
    "coverage_increase": ">=5%"
  },
  "estimated_hours": 24
}
```

### Week 6: Interactions UI + Visualization

**Sequential Execution (Depends on 4.1)**

```bash
# Agent 1 continues with UI work
npx claude-flow task orchestrate "action-4.2-interactions-panel" --strategy sequential
npx claude-flow task orchestrate "action-4.3-interaction-viz" --strategy sequential
```

**Agent 1: InteractionsPanel (action-4.2)**
```javascript
{
  "task": "action-4.2-interactions-panel",
  "depends_on": ["action-4.1-interaction-detection"],
  "instructions": `
    TDD: InteractionsPanel Component
    1. TESTS (4h): tests/components/viewer/interactive/InteractionsPanel.test.tsx
    2. IMPLEMENT (6-8h):
       - src/components/viewer/interactive/InteractionsPanel.tsx
       - src/hooks/viewer/use-interactions.ts
    3. VALIDATE (2h): All filtering and export features working
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 14
}
```

**Agent 1: InteractionViz (action-4.3)**
```javascript
{
  "task": "action-4.3-interaction-viz",
  "depends_on": ["action-4.2-interactions-panel", "action-2.1-measurement-viz"],
  "instructions": `
    TDD: 3D Interaction Visualization
    1. TESTS (3h): tests/services/molstar/interaction-renderer.test.ts
    2. IMPLEMENT (4-5h): src/services/molstar/interaction-renderer.ts
       Rendering:
       - H-bonds: dashed yellow lines
       - Salt bridges: solid blue lines
       - Hydrophobic: dotted gray lines
       - Pi-pi: green double lines
    3. VALIDATE (1h): <10% FPS impact with 100 interactions
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 10
}
```

### Phase 4 Validation

**Validation Criteria:**
- ✅ Coverage ≥86%
- ✅ All 4 interaction types detected accurately
- ✅ Detection <2s
- ✅ All interaction types visualized in 3D
- ✅ Filtering and export working

---

## 🚀 Phase 5: Integration & Production (Week 7)

### Days 1-2: Enhanced Viewer + E2E Tests (Parallel)

**Parallel Execution (Final Sprint)**

```bash
# Spawn 2 agents for parallel final work
npx claude-flow agents spawn-parallel '{
  "agents": [
    {
      "type": "coder",
      "name": "Integration Agent",
      "capabilities": ["react-architecture", "component-integration"]
    },
    {
      "type": "tester",
      "name": "E2E Agent",
      "capabilities": ["playwright", "e2e-testing", "performance-testing"]
    }
  ]
}'

# Orchestrate in parallel
npx claude-flow task orchestrate "Phase 5 Days 1-2: Integration and E2E" --strategy parallel
```

**Agent 1: EnhancedViewer (action-5.1)**
```javascript
{
  "task": "action-5.1-enhanced-viewer",
  "instructions": `
    TDD: Unified EnhancedMolStarViewer Component
    1. TESTS (3h): tests/components/viewer/EnhancedMolStarViewer.test.tsx
    2. IMPLEMENT (4-5h): src/components/viewer/EnhancedMolStarViewer.tsx
    3. VALIDATE (1h): All features work together
    4. DOCUMENT (1h)
  `,
  "estimated_hours": 10
}
```

**Agent 2: E2ETests (action-5.2)**
```javascript
{
  "task": "action-5.2-e2e-tests",
  "instructions": `
    E2E Test Suite Creation
    1. WRITE E2E TESTS (6-8h): e2e/interactive-features.spec.ts
       Test Scenarios:
       - Complete workflow: load → hover → measure → sequence → interactions
       - Performance: FPS monitoring with all features
       - Cross-browser compatibility
    2. RUN & FIX (3h): Ensure all tests passing
    3. DOCUMENT (1h): E2E test documentation
  `,
  "estimated_hours": 12
}
```

### Days 3-5: Coverage Optimization + Production Validation (Sequential)

**Sequential Execution (Quality Gates)**

```bash
# Agent 1 focuses on coverage
npx claude-flow task orchestrate "action-5.3-coverage-optimization" --strategy sequential --priority critical

# Then production validation
npx claude-flow task orchestrate "action-5.4-production-validation" --strategy sequential --priority critical
```

**Agent 1: CoverageOptimization (action-5.3)**
```javascript
{
  "task": "action-5.3-coverage-optimization",
  "depends_on": ["action-5.2-e2e-tests"],
  "instructions": `
    Coverage Optimization to ≥80%
    1. ANALYZE (2h):
       - npm run test:coverage
       - Identify files <80% coverage
       - Generate coverage gap report
    2. WRITE MISSING TESTS (4-6h):
       - Target uncovered lines/branches/functions
       - Focus on error handling paths
       - Edge cases and boundary conditions
    3. VALIDATE (2h):
       - npm run test:coverage
       - Verify all thresholds met:
         * Lines ≥80%
         * Functions ≥80%
         * Branches ≥75%
         * Statements ≥80%
    4. DOCUMENT (1h): Coverage report summary
  `,
  "success_criteria": {
    "lineCoverage": ">=80%",
    "functionCoverage": ">=80%",
    "branchCoverage": ">=75%",
    "statementCoverage": ">=80%"
  },
  "estimated_hours": 10
}
```

**Agent 1: ProductionValidation (action-5.4)**
```javascript
{
  "task": "action-5.4-production-validation",
  "depends_on": ["action-5.3-coverage-optimization"],
  "instructions": `
    Production Validation Suite
    1. AUTOMATED VALIDATION (6h):
       - Bundle size analysis (<150KB increase)
       - Lighthouse audit (score >90)
       - Security scan (npm run security:scan)
       - Type checking (npm run typecheck)
       - Linting (npm run lint)
    2. MANUAL TESTING (4h):
       - Cross-browser testing (Chrome, Firefox, Safari, Edge)
       - Cross-device testing (desktop, tablet, mobile)
       - Performance monitoring (FPS, memory, network)
       - Accessibility testing (WCAG 2.1 AA)
    3. DOCUMENTATION REVIEW (2h):
       - README.md complete
       - API docs complete
       - User guide complete
       - Architecture docs updated
    4. SIGN-OFF (2h):
       - Generate production validation report
       - Document known limitations
       - Create deployment checklist
  `,
  "success_criteria": {
    "productionValidated": true,
    "all_quality_gates_passing": true,
    "documentation_complete": true
  },
  "estimated_hours": 14
}
```

### Phase 5 Final Validation

```bash
# Final portfolio completion check
npx claude-flow task orchestrate "portfolio-completion-validation" --strategy sequential --priority critical
```

**Final Validation Agent:**
```javascript
{
  "task": "portfolio-completion-validation",
  "description": "Final checklist for portfolio readiness",
  "instructions": `
    Portfolio Completion Checklist:

    TECHNICAL ✅
    - [ ] All 5 phases complete (14 actions)
    - [ ] Coverage ≥80% (all metrics)
    - [ ] 84+ tests passing
    - [ ] Zero TypeScript errors
    - [ ] Zero console errors/warnings
    - [ ] Performance <10% FPS degradation
    - [ ] Bundle size <150KB increase

    QUALITY ✅
    - [ ] E2E tests passing
    - [ ] Lighthouse >90
    - [ ] WCAG 2.1 AA compliance
    - [ ] Security scan clean
    - [ ] Cross-browser tested

    DOCUMENTATION ✅
    - [ ] README complete
    - [ ] API docs complete
    - [ ] User guide complete
    - [ ] Architecture docs updated

    PRODUCTION ✅
    - [ ] Production build validated
    - [ ] CI quality gates passing
    - [ ] Deployment checklist complete
    - [ ] Known limitations documented

    Generate: PORTFOLIO_COMPLETION_REPORT.md
  `,
  "deliverable": "PORTFOLIO_COMPLETION_REPORT.md"
}
```

---

## 🛠️ Agent Coordination Best Practices

### 1. Memory Management (Shared Context)

**Store architectural decisions:**
```bash
# Agent 1 stores decision for Agent 2 to reference
npx claude-flow memory store \
  --namespace "lab-visualizer-phase2" \
  --key "measurement-visualization-approach" \
  --value "Using MolStar shape primitives for lines and labels. Reference: molstar-service.ts:L1234"
```

**Retrieve prior decisions:**
```bash
# Agent 2 retrieves Agent 1's decisions
npx claude-flow memory retrieve \
  --namespace "lab-visualizer-phase2" \
  --key "measurement-visualization-approach"
```

### 2. Hooks for Coordination

**Pre-task hook (auto-setup):**
```bash
# Automatically run before each task
npx claude-flow hooks pre-task \
  --description "action-2.1-measurement-viz" \
  --auto-restore-session true
```

**Post-edit hook (auto-commit):**
```bash
# Automatically run after file edits
npx claude-flow hooks post-edit \
  --file "src/services/molstar/measurement-renderer.ts" \
  --memory-key "phase2/measurement-renderer/status"
```

**Post-task hook (reporting):**
```bash
# Generate task completion report
npx claude-flow hooks post-task \
  --task-id "action-2.1-measurement-viz" \
  --export-metrics true
```

### 3. Swarm Status Monitoring

**Monitor swarm health:**
```bash
# Check status of all agents
npx claude-flow swarm status --swarm-id "phase2-visualizations"

# Output:
# Swarm: phase2-visualizations
# Topology: hierarchical
# Agents: 3 active
# - MeasurementViz Agent: in_progress (action-2.1, 60% complete)
# - MultiSelection Agent: in_progress (action-2.2, 40% complete)
# - Test Coordinator: monitoring (coverage: 63%)
```

**Agent metrics:**
```bash
# Get detailed metrics for specific agent
npx claude-flow agent metrics --agent-id "MeasurementViz Agent"

# Output:
# Agent: MeasurementViz Agent
# Status: in_progress
# Task: action-2.1-measurement-viz
# Progress: 60%
# Tests Written: 12/15
# Tests Passing: 10/12
# Coverage Delta: +2.5%
# Estimated Completion: 4 hours
```

### 4. Task Orchestration Strategies

**Parallel (independent tasks):**
```bash
npx claude-flow task orchestrate "Phase 2 Week 1" \
  --strategy parallel \
  --priority high \
  --tasks "action-2.1-measurement-viz,action-2.2-multi-selection"
```

**Sequential (dependent tasks):**
```bash
npx claude-flow task orchestrate "Phase 3" \
  --strategy sequential \
  --priority critical \
  --tasks "action-3.1-sequence-extraction,action-3.2-sequence-viewer,action-3.3-sequence-integration"
```

**Adaptive (auto-adjust based on performance):**
```bash
npx claude-flow task orchestrate "Phase 4" \
  --strategy adaptive \
  --priority critical \
  --auto-scale true
```

---

## 📊 Progress Tracking Dashboard

### Daily Standup Report (Auto-generated)

```bash
# Generate daily progress report
npx claude-flow performance report --format summary --timeframe 24h

# Output:
# LAB Visualizer - Daily Progress Report (2025-12-27)
#
# Phase 2 Week 1 Status:
# - action-2.1-measurement-viz: 60% complete (6h elapsed, 4h remaining)
# - action-2.2-multi-selection: 40% complete (3h elapsed, 5h remaining)
#
# Coverage:
# - Current: 63% (lines)
# - Target: 68% (Phase 2 goal)
# - Delta: +3% (on track)
#
# Tests:
# - Total: 47 test files (39 baseline + 8 new)
# - Passing: 45/47 (2 failing, in progress)
# - New Tests: 8 (action-2.1: 5, action-2.2: 3)
#
# Blockers:
# - None
#
# Next 24h:
# - Complete action-2.1 (4h remaining)
# - Complete action-2.2 (5h remaining)
# - Begin action-2.3 setup (1h)
```

### Weekly Review Report

```bash
# Generate weekly summary
npx claude-flow performance report --format detailed --timeframe 7d

# Includes:
# - Phase completion status
# - Coverage progression chart
# - Test suite growth
# - Performance metrics (FPS, bundle size)
# - Blockers and resolutions
# - Next week plan
```

---

## 🚨 Error Handling & Recovery

### Agent Failure Recovery

**If an agent fails mid-task:**

```bash
# 1. Check agent status
npx claude-flow agent metrics --agent-id "MeasurementViz Agent"

# 2. Review error logs
npx claude-flow log analysis --agent-id "MeasurementViz Agent" --last 24h

# 3. Restore from last checkpoint
npx claude-flow hooks session-restore --session-id "action-2.1-checkpoint-3"

# 4. Resume or respawn agent
npx claude-flow agent spawn --type coder --name "MeasurementViz Agent (Recovery)" --resume-task "action-2.1-measurement-viz"
```

### Rollback Procedure

**If tests start failing:**

```bash
# 1. Identify breaking change
git log --oneline -10

# 2. Run rollback script
npm run ci:rollback --target-commit "abc123"

# 3. Verify tests passing
npm run test

# 4. Re-plan approach
# Review GOAP plan, adjust action if needed
```

---

## ✅ Final Checklist (Portfolio Completion)

**Use this checklist before declaring portfolio completion:**

```bash
# Run comprehensive validation
npx claude-flow task orchestrate "final-portfolio-validation" --strategy sequential --priority critical
```

**Automated Checks:**
```bash
# 1. All tests passing
npm run test
# Expected: All 84+ tests passing

# 2. Coverage thresholds
npm run test:coverage
# Expected: Lines ≥80%, Functions ≥80%, Branches ≥75%, Statements ≥80%

# 3. Type checking
npm run typecheck
# Expected: 0 errors

# 4. Linting
npm run lint
# Expected: 0 errors, 0 warnings

# 5. E2E tests
npm run test:e2e
# Expected: All workflows passing

# 6. Production build
npm run build
# Expected: Successful build, bundle size within budget

# 7. Security scan
npm run security:scan
# Expected: 0 vulnerabilities

# 8. Quality gate
npm run ci:quality-gate
# Expected: All gates passing
```

**Manual Checks:**
- [ ] Open production build in browser (npm run build && npm run start)
- [ ] Test all interactive features:
  - [ ] Hover tooltips appear/disappear smoothly
  - [ ] Create distance measurement → 3D line + label
  - [ ] Create angle measurement → 3D arc + label
  - [ ] Create dihedral → 3D planes + label
  - [ ] Click residue in sequence → 3D highlights/centers
  - [ ] Click atom in 3D → sequence highlights
  - [ ] Open InteractionsPanel → see detected interactions
  - [ ] Toggle H-bonds visibility → 3D dashed yellow lines appear/disappear
- [ ] Performance monitoring:
  - [ ] Open DevTools → Performance tab
  - [ ] Record 30s interaction session
  - [ ] Verify FPS ≥54 (>90% of 60fps)
  - [ ] Check memory usage stable (no leaks)
- [ ] Cross-browser testing:
  - [ ] Chrome: All features working
  - [ ] Firefox: All features working
  - [ ] Safari: All features working
  - [ ] Edge: All features working
- [ ] Documentation review:
  - [ ] README.md up-to-date
  - [ ] API documentation complete
  - [ ] User guide comprehensive
  - [ ] Architecture docs reflect current state

**When ALL checkboxes are ✅:**

```bash
# Generate final portfolio completion report
npx claude-flow sparc run integration "Generate Portfolio Completion Report"

# Creates: docs/PORTFOLIO_COMPLETION_REPORT.md
```

---

## 📝 Sample Agent Spawn Command (Complete Example)

**For Phase 2 Week 1 (Parallel Execution):**

```bash
# Full orchestration command with all parameters
npx claude-flow swarm init --topology hierarchical --max-agents 3 && \
npx claude-flow agents spawn-parallel '{
  "agents": [
    {
      "type": "coder",
      "name": "MeasurementViz",
      "priority": "critical",
      "capabilities": ["molstar", "3d-rendering", "tdd"],
      "task": {
        "id": "action-2.1",
        "description": "3D Measurement Visualization (TDD)",
        "estimated_hours": 16,
        "instructions": "Read docs/GOAP_IMPLEMENTATION_PLAN.md action-2.1. Follow TDD workflow: Write tests first (4h) → Implement (8-10h) → Validate (2h) → Document (1h).",
        "deliverables": ["Distance lines in 3D", "Angle arcs", "Dihedral planes", "Labels"],
        "success_criteria": {"tests_passing": true, "coverage": "+3%", "fps": "<5% degradation"}
      }
    },
    {
      "type": "coder",
      "name": "MultiSelection",
      "priority": "high",
      "capabilities": ["react-hooks", "state-management", "tdd"],
      "task": {
        "id": "action-2.2",
        "description": "Multi-Selection System (TDD)",
        "estimated_hours": 10,
        "instructions": "Read docs/GOAP_IMPLEMENTATION_PLAN.md action-2.2. TDD workflow: Tests first (3h) → Implement (4-5h) → Validate (2h) → Document (1h).",
        "deliverables": ["use-multi-selection hook", "Auto-trigger on limit", "Integration with measurements"],
        "success_criteria": {"tests_passing": true, "coverage": "+2%", "max_selections": "Configurable"}
      }
    },
    {
      "type": "tester",
      "name": "TestCoordinator",
      "priority": "high",
      "capabilities": ["vitest", "playwright", "coverage"],
      "task": {
        "id": "test-coordination-phase2",
        "description": "Test Coordination & Coverage Tracking",
        "estimated_hours": 8,
        "instructions": "Monitor test execution, track coverage hourly, ensure no regressions, prepare integration tests.",
        "deliverables": ["Daily coverage reports", "Integration test stubs", "Regression monitoring"],
        "success_criteria": {"no_regressions": true, "coverage_tracking": "Hourly"}
      }
    }
  ],
  "maxConcurrency": 3,
  "batchSize": 3
}' && \
npx claude-flow task orchestrate "Phase 2 Week 1" --strategy parallel --priority critical
```

**Expected Output:**
```
✅ Swarm initialized: hierarchical topology, max 3 agents
✅ Agents spawned in parallel (3 agents):
   - MeasurementViz (coder, critical)
   - MultiSelection (coder, high)
   - TestCoordinator (tester, high)
✅ Task orchestration started: Phase 2 Week 1 (parallel strategy)

Estimated completion: 16 hours (parallel), 34 hours (sequential)
Speedup: 53% faster with parallel execution

Monitor progress: npx claude-flow swarm status
View metrics: npx claude-flow agent metrics --agent-id MeasurementViz
```

---

**Document Version:** 1.0
**Created:** 2025-12-26
**Purpose:** AI agent orchestration guide for GOAP execution
**Related Documents:**
- GOAP_IMPLEMENTATION_PLAN.md (detailed action specifications)
- GOAP_EXECUTION_SUMMARY.md (quick reference)
