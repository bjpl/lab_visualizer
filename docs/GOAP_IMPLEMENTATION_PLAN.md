# LAB Visualizer - Goal-Oriented Action Planning (GOAP) Implementation Plan

**Project:** LAB Visualizer Portfolio Completion
**Methodology:** Aggressive Test-Driven Development (TDD)
**Timeline:** 6-7 weeks (Phases 2-5)
**Coverage Target:** ≥80% (lines, functions, statements), ≥75% (branches)
**Status:** Phase 1 Complete ✅, Ready for Phase 2-5

---

## Executive Summary

This GOAP plan transforms the LAB Visualizer from Phase 1 completion to production-ready portfolio showcase using systematic TDD. The plan breaks down the remaining work (Phases 2-5) into atomic, measurable actions with clear preconditions, effects, and success criteria.

**Current State:**
- ✅ Phase 1 complete (hover tooltips, measurements, MolStar service enhancements)
- ✅ 39 test files, tests passing
- ✅ 228 source files
- ⚠️ Coverage below 80% threshold
- ⚠️ Measurement visualization placeholders
- ⚠️ Single selection only
- ⚠️ Phases 2-5 incomplete

**Goal State:**
- ✅ All 5 phases complete
- ✅ Test coverage ≥80% across all metrics
- ✅ Production-ready with comprehensive validation
- ✅ Portfolio-quality documentation
- ✅ Performance targets met (<10% FPS degradation)

---

## GOAP Architecture

### World State Variables

```typescript
interface WorldState {
  // Test Coverage
  lineCoverage: number;           // Current: ~60%, Goal: ≥80%
  functionCoverage: number;       // Current: ~60%, Goal: ≥80%
  branchCoverage: number;         // Current: ~50%, Goal: ≥75%
  statementCoverage: number;      // Current: ~60%, Goal: ≥80%

  // Phase Completion
  phase1Complete: boolean;        // Current: true ✅
  phase2Complete: boolean;        // Current: false, Goal: true
  phase3Complete: boolean;        // Current: false, Goal: true
  phase4Complete: boolean;        // Current: false, Goal: true
  phase5Complete: boolean;        // Current: false, Goal: true

  // Feature Implementation
  measurementVisualization: boolean;     // Current: false, Goal: true
  multiSelection: boolean;               // Current: false, Goal: true
  selectionHighlighting: boolean;        // Current: false, Goal: true
  sequenceViewer: boolean;               // Current: false, Goal: true
  interactionsPanel: boolean;            // Current: false, Goal: true
  hydrogenBonds: boolean;                // Current: false, Goal: true
  structureValidation: boolean;          // Current: false, Goal: true

  // Quality Metrics
  allTestsPassing: boolean;       // Current: true, Goal: true
  noTypeErrors: boolean;          // Current: true, Goal: true
  performanceTargetsMet: boolean; // Current: true (Phase 1), Goal: true (all)
  documentationComplete: boolean; // Current: partial, Goal: complete

  // Production Readiness
  productionValidated: boolean;   // Current: false, Goal: true
  e2eTestsComplete: boolean;      // Current: false, Goal: true
  visualRegressionTests: boolean; // Current: false, Goal: true
}
```

---

## GOAP Actions Catalog

Each action follows TDD principles: **Test → Implement → Validate → Document**

### Action Template

```typescript
interface GOAPAction {
  id: string;
  name: string;
  description: string;
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;
  cost: number;  // Complexity/effort (1-10)
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];  // Action IDs

  // TDD-specific
  testFirst: boolean;      // Always true
  minCoverageIncrease: number;  // Minimum % increase
  performanceImpact: number;    // Max % FPS degradation
}
```

---

## Phase 2: Visual Enhancements (Weeks 1-2)

**Goal:** Complete measurement visualization, selection feedback, and hydrogen bond display

### Action 2.1: 3D Measurement Visualization (TDD)

**ID:** `action-2.1-measurement-viz`

**Preconditions:**
```typescript
{
  phase1Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  measurementVisualization: true,
  lineCoverage: +3%,
  functionCoverage: +3%
}
```

**Cost:** 7/10 (Complex MolStar integration)
**Priority:** Critical
**Estimated Hours:** 12-16 hours
**Dependencies:** None (Phase 1 complete)

**TDD Workflow:**

1. **Write Tests First (4 hours)**
   ```typescript
   // tests/components/viewer/interactive/MeasurementVisualization.test.tsx
   describe('3D Measurement Visualization', () => {
     it('should render distance line between two atoms', () => {
       // Test 3D line creation
     });

     it('should display floating label with measurement value', () => {
       // Test label positioning and content
     });

     it('should handle measurement deletion', () => {
       // Test cleanup of 3D representations
     });

     it('should toggle measurement visibility', () => {
       // Test show/hide functionality
     });

     it('should update visualization when measurement changes', () => {
       // Test dynamic updates
     });
   });

   // tests/services/molstar/measurement-representations.test.ts
   describe('MolStar Measurement Representations', () => {
     it('should create distance representation', () => {
       // Test MolStar representation API usage
     });

     it('should create angle arc representation', () => {
       // Test angle visualization
     });

     it('should create dihedral plane representation', () => {
       // Test dihedral visualization
     });
   });
   ```

2. **Implement Functionality (8-10 hours)**
   ```typescript
   // src/services/molstar/measurement-renderer.ts
   export class MeasurementRenderer {
     async renderDistance(
       measurement: MeasurementResult,
       plugin: PluginContext
     ): Promise<void> {
       // Create line representation
       // Create label representation
       // Store representation reference
     }

     async renderAngle(
       measurement: MeasurementResult,
       plugin: PluginContext
     ): Promise<void> {
       // Create arc representation
       // Create label
     }

     async renderDihedral(
       measurement: MeasurementResult,
       plugin: PluginContext
     ): Promise<void> {
       // Create plane representations
       // Create label
     }

     async removeMeasurement(id: string): Promise<void> {
       // Clean up representations
     }
   }
   ```

3. **Validate (2 hours)**
   - Run tests: `npm run test:coverage`
   - Verify coverage increase ≥3%
   - Manual testing: Create measurements, verify 3D display
   - Performance test: Ensure <5% FPS impact with 20 measurements

4. **Document (1 hour)**
   - Update API documentation
   - Add usage examples
   - Update INTERACTIVE_FEATURES_IMPLEMENTED.md

**Success Criteria:**
- ✅ All tests passing (100% coverage for new code)
- ✅ Distance lines visible in 3D
- ✅ Angle arcs visible in 3D
- ✅ Dihedral planes visible in 3D
- ✅ Labels positioned correctly
- ✅ Toggle visibility works
- ✅ Delete removes 3D representations
- ✅ Performance: <5% FPS degradation

---

### Action 2.2: Multi-Selection System (TDD)

**ID:** `action-2.2-multi-selection`

**Preconditions:**
```typescript
{
  phase1Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  multiSelection: true,
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 5/10
**Priority:** High
**Estimated Hours:** 8-10 hours
**Dependencies:** None

**TDD Workflow:**

1. **Write Tests First (3 hours)**
   ```typescript
   // tests/hooks/viewer/use-multi-selection.test.ts
   describe('useMultiSelection Hook', () => {
     it('should add selection to set', () => {
       // Test accumulation
     });

     it('should remove selection from set', () => {
       // Test deselection
     });

     it('should clear all selections', () => {
       // Test bulk clear
     });

     it('should limit selections by measurement type', () => {
       // Test max selections for distance (2), angle (3), dihedral (4)
     });

     it('should auto-trigger measurement when limit reached', () => {
       // Test auto-completion
     });
   });
   ```

2. **Implement (4-5 hours)**
   ```typescript
   // src/hooks/viewer/use-multi-selection.ts
   export function useMultiSelection(maxSelections: number) {
     const [selections, setSelections] = useState<SelectionInfo[]>([]);

     const addSelection = useCallback((selection: SelectionInfo) => {
       setSelections(prev => {
         if (prev.length >= maxSelections) {
           // Trigger measurement creation
           return [selection]; // Reset
         }
         return [...prev, selection];
       });
     }, [maxSelections]);

     // ... other methods

     return { selections, addSelection, removeSelection, clearSelections };
   }
   ```

3. **Validate (2 hours)**
   - Unit tests passing
   - Integration test with measurements
   - Manual: Select multiple atoms, verify tracking

4. **Document (1 hour)**

**Success Criteria:**
- ✅ Can select up to N atoms (N = measurement type requirement)
- ✅ Auto-triggers measurement when limit reached
- ✅ Clear selections works
- ✅ Visual feedback for each selection
- ✅ Tests passing (100% coverage)

---

### Action 2.3: Selection Visual Highlighting (TDD)

**ID:** `action-2.3-selection-highlighting`

**Preconditions:**
```typescript
{
  multiSelection: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  selectionHighlighting: true,
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 6/10
**Priority:** High
**Estimated Hours:** 8-10 hours
**Dependencies:** [`action-2.2-multi-selection`]

**TDD Workflow:**

1. **Write Tests First (3 hours)**
   ```typescript
   // tests/services/molstar/selection-highlighter.test.ts
   describe('Selection Highlighter', () => {
     it('should apply green tint to selected atoms', () => {
       // Test color override
     });

     it('should apply magenta highlight to hovered atom', () => {
       // Test hover color
     });

     it('should remove highlight on deselection', () => {
       // Test cleanup
     });

     it('should handle multiple highlighted atoms', () => {
       // Test bulk highlighting
     });
   });
   ```

2. **Implement (4-5 hours)**
   ```typescript
   // src/services/molstar/selection-highlighter.ts
   export class SelectionHighlighter {
     async highlightSelection(
       selection: SelectionInfo,
       color: ColorRGB,
       plugin: PluginContext
     ): Promise<void> {
       // Use MolStar overpaint API
       // Apply color to loci
     }

     async highlightHover(
       loci: Loci,
       plugin: PluginContext
     ): Promise<void> {
       // Temporary highlight
     }

     async clearHighlight(id: string): Promise<void> {
       // Remove overpaint
     }
   }
   ```

3. **Validate & Document (3 hours)**

**Success Criteria:**
- ✅ Selected atoms show green tint
- ✅ Hovered atom shows magenta highlight
- ✅ Highlights removed on deselection
- ✅ No performance degradation
- ✅ Tests passing

---

### Action 2.4: Hydrogen Bond Visualization (TDD)

**ID:** `action-2.4-hydrogen-bonds`

**Preconditions:**
```typescript
{
  phase1Complete: true,
  selectionHighlighting: true
}
```

**Effects:**
```typescript
{
  hydrogenBonds: true,
  lineCoverage: +3%,
  functionCoverage: +3%
}
```

**Cost:** 8/10
**Priority:** High
**Estimated Hours:** 12-16 hours
**Dependencies:** [`action-2.3-selection-highlighting`]

**TDD Workflow:**

1. **Write Tests First (4 hours)**
   ```typescript
   // tests/services/interactions/hydrogen-bond-detector.test.ts
   describe('Hydrogen Bond Detector', () => {
     it('should detect H-bonds within 3.5Å', () => {
       // Test distance criterion
     });

     it('should validate D-H...A angle (>120°)', () => {
       // Test angle criterion
     });

     it('should detect H-bonds around selected residue', () => {
       // Test localized detection
     });

     it('should handle structures without hydrogens', () => {
       // Test fallback logic
     });
   });

   // tests/components/viewer/interactive/HydrogenBondsPanel.test.tsx
   describe('Hydrogen Bonds Panel', () => {
     it('should display detected H-bonds', () => {
       // Test list rendering
     });

     it('should toggle H-bond visibility in 3D', () => {
       // Test show/hide
     });

     it('should update on residue selection change', () => {
       // Test dynamic updates
     });
   });
   ```

2. **Implement (8-10 hours)**
   ```typescript
   // src/services/interactions/hydrogen-bond-detector.ts
   export class HydrogenBondDetector {
     async detectHydrogenBonds(
       residue: SelectionInfo,
       radius: number = 5.0
     ): Promise<HydrogenBond[]> {
       // Get nearby atoms
       // Check distance criterion (2.5-3.5Å)
       // Check angle criterion (D-H...A > 120°)
       // Return list of H-bonds
     }
   }

   // src/components/viewer/interactive/HydrogenBondsPanel.tsx
   export function HydrogenBondsPanel({ selectedResidue }: Props) {
     const hBonds = useHydrogenBonds(selectedResidue);

     return (
       <Panel>
         <HBondList bonds={hBonds} />
         <VisibilityToggle />
       </Panel>
     );
   }
   ```

3. **Validate & Document (4 hours)**

**Success Criteria:**
- ✅ Detects H-bonds within 5Å of selected residue
- ✅ Distance criterion: 2.5-3.5Å
- ✅ Angle criterion: >120°
- ✅ Visualized as dashed yellow lines in 3D
- ✅ Toggle visibility works
- ✅ Accuracy >95%
- ✅ Tests passing

---

### Phase 2 Milestones

**Milestone 2.A: Basic Measurement Visualization (Week 1)**
- Actions: 2.1, 2.2
- Deliverables: 3D lines, labels, multi-selection
- Coverage increase: +5%
- Tests: 10+ new tests

**Milestone 2.B: Advanced Visual Feedback (Week 2)**
- Actions: 2.3, 2.4
- Deliverables: Selection highlighting, H-bonds
- Coverage increase: +5%
- Tests: 10+ new tests

**Phase 2 Complete When:**
- ✅ `phase2Complete = true`
- ✅ Coverage: lines ≥68%, functions ≥68%
- ✅ All Phase 2 tests passing
- ✅ Performance: <10% FPS degradation
- ✅ Documentation updated

---

## Phase 3: Sequence Viewer (Weeks 3-4)

**Goal:** Implement sequence display with bidirectional sync to 3D view

### Action 3.1: Sequence Extraction API (TDD)

**ID:** `action-3.1-sequence-extraction`

**Preconditions:**
```typescript
{
  phase2Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 5/10
**Priority:** Critical
**Estimated Hours:** 8-10 hours
**Dependencies:** None

**TDD Workflow:**

1. **Write Tests First (3 hours)**
   ```typescript
   // tests/services/molstar/sequence-extractor.test.ts
   describe('Sequence Extractor', () => {
     it('should extract protein sequence from PDB', () => {
       // Test FASTA format output
     });

     it('should extract multiple chains', () => {
       // Test multi-chain structures
     });

     it('should include secondary structure annotations', () => {
       // Test helix, sheet, loop annotations
     });

     it('should handle DNA/RNA sequences', () => {
       // Test nucleotide sequences
     });

     it('should extract sequence metadata', () => {
       // Test chain IDs, lengths, etc.
     });
   });
   ```

2. **Implement (4-5 hours)**
   ```typescript
   // src/services/molstar/sequence-extractor.ts
   export class SequenceExtractor {
     async extractSequence(
       plugin: PluginContext
     ): Promise<SequenceData> {
       // Get model from plugin
       // Extract chain sequences
       // Get secondary structure assignments
       // Format as SequenceData
       return {
         chains: [
           {
             id: 'A',
             type: 'protein',
             sequence: 'MSALAVLGAT...',
             secondaryStructure: ['H', 'H', 'H', 'L', ...],
             length: 150
           }
         ]
       };
     }
   }
   ```

3. **Validate & Document (3 hours)**

**Success Criteria:**
- ✅ Extracts protein sequences correctly
- ✅ Extracts DNA/RNA sequences
- ✅ Handles multi-chain structures
- ✅ Includes secondary structure data
- ✅ Extraction time <500ms
- ✅ Tests passing

---

### Action 3.2: SequenceViewer Component (TDD)

**ID:** `action-3.2-sequence-viewer`

**Preconditions:**
```typescript
{
  phase2Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  sequenceViewer: true,
  lineCoverage: +4%,
  functionCoverage: +4%
}
```

**Cost:** 8/10
**Priority:** Critical
**Estimated Hours:** 14-18 hours
**Dependencies:** [`action-3.1-sequence-extraction`]

**TDD Workflow:**

1. **Write Tests First (5 hours)**
   ```typescript
   // tests/components/viewer/interactive/SequenceViewer.test.tsx
   describe('SequenceViewer Component', () => {
     it('should render protein sequence', () => {
       // Test sequence display
     });

     it('should show secondary structure annotations', () => {
       // Test helix/sheet indicators
     });

     it('should highlight clicked residue', () => {
       // Test selection
     });

     it('should sync with 3D view selection', () => {
       // Test bidirectional sync
     });

     it('should use virtual scrolling for long sequences', () => {
       // Test performance optimization
     });

     it('should search for residue by number', () => {
       // Test search functionality
     });

     it('should center clicked residue in 3D view', () => {
       // Test 3D camera control
     });
   });

   // tests/hooks/viewer/use-sequence-sync.test.ts
   describe('useSequenceSync Hook', () => {
     it('should sync sequence → 3D selection', () => {
       // Test forward sync
     });

     it('should sync 3D → sequence selection', () => {
       // Test reverse sync
     });

     it('should debounce rapid selections', () => {
       // Test performance optimization
     });
   });
   ```

2. **Implement (8-10 hours)**
   ```typescript
   // src/components/viewer/interactive/SequenceViewer.tsx
   export function SequenceViewer({ chains }: Props) {
     const { selectedResidue, selectResidue } = useSequenceSync();

     return (
       <ScrollArea className="h-48">
         {chains.map(chain => (
           <ChainSequence
             key={chain.id}
             chain={chain}
             selectedResidue={selectedResidue}
             onResidueClick={selectResidue}
           />
         ))}
       </ScrollArea>
     );
   }

   // src/hooks/viewer/use-sequence-sync.ts
   export function useSequenceSync() {
     const molstar = useMolstarService();
     const [selectedResidue, setSelectedResidue] = useState<number | null>(null);

     // Listen to 3D selection changes
     useEffect(() => {
       const handler = (info: SelectionInfo | null) => {
         setSelectedResidue(info?.residueSeq ?? null);
       };
       molstar.on('selection-info', handler);
       return () => molstar.off('selection-info', handler);
     }, [molstar]);

     // Handle sequence click → 3D highlight
     const selectResidue = useCallback(async (residueSeq: number, chainId: string) => {
       await molstar.highlightResidues({
         chainId,
         residueIds: [residueSeq],
         color: '#00ff00',
         focus: true
       });
       setSelectedResidue(residueSeq);
     }, [molstar]);

     return { selectedResidue, selectResidue };
   }
   ```

3. **Validate & Document (4 hours)**

**Success Criteria:**
- ✅ Displays sequences for all chains
- ✅ Shows secondary structure annotations (helix/sheet/loop)
- ✅ Click residue → highlights in 3D, centers camera
- ✅ Click in 3D → highlights in sequence
- ✅ Sync latency <50ms
- ✅ Virtual scrolling for sequences >1000 residues
- ✅ Search functionality works
- ✅ Tests passing

---

### Action 3.3: Sequence Viewer Integration (TDD)

**ID:** `action-3.3-sequence-integration`

**Preconditions:**
```typescript
{
  sequenceViewer: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 4/10
**Priority:** High
**Estimated Hours:** 6-8 hours
**Dependencies:** [`action-3.2-sequence-viewer`]

**TDD Workflow:**

1. **Write Integration Tests (2 hours)**
   ```typescript
   // tests/integration/sequence-3d-sync.test.ts
   describe('Sequence-3D Integration', () => {
     it('should sync sequence selection to 3D view', () => {
       // Test complete workflow
     });

     it('should sync 3D selection to sequence view', () => {
       // Test reverse workflow
     });

     it('should maintain sync during rapid interactions', () => {
       // Test stability
     });
   });
   ```

2. **Integrate (3-4 hours)**
   ```typescript
   // src/components/viewer/ViewerLayout.tsx
   export function ViewerLayout() {
     return (
       <div className="flex flex-col h-full">
         <div className="flex-1">
           <MolStarViewer />
           <HoverTooltip />
           <MeasurementsPanel />
           <HydrogenBondsPanel />
         </div>

         {/* Add sequence viewer at bottom */}
         <div className="h-48 border-t">
           <SequenceViewer />
         </div>
       </div>
     );
   }
   ```

3. **Validate & Document (2 hours)**

**Success Criteria:**
- ✅ Sequence viewer integrated into layout
- ✅ Sync works bidirectionally
- ✅ No layout shifts or visual bugs
- ✅ Responsive design maintained
- ✅ Tests passing

---

### Phase 3 Milestones

**Milestone 3.A: Sequence Extraction (Week 3)**
- Action: 3.1
- Deliverable: Working sequence extraction API
- Coverage increase: +2%

**Milestone 3.B: Sequence Viewer UI (Week 3-4)**
- Actions: 3.2, 3.3
- Deliverables: SequenceViewer component, bidirectional sync
- Coverage increase: +6%
- Tests: 15+ new tests

**Phase 3 Complete When:**
- ✅ `phase3Complete = true`
- ✅ Coverage: lines ≥76%, functions ≥76%
- ✅ Sequence loads <500ms
- ✅ Sync latency <50ms
- ✅ All tests passing

---

## Phase 4: Interactions Panel (Weeks 5-6)

**Goal:** Implement comprehensive non-covalent interaction detection and visualization

### Action 4.1: Interaction Detection Algorithms (TDD)

**ID:** `action-4.1-interaction-detection`

**Preconditions:**
```typescript
{
  phase3Complete: true,
  hydrogenBonds: true
}
```

**Effects:**
```typescript
{
  interactionsPanel: true,
  lineCoverage: +5%,
  functionCoverage: +5%
}
```

**Cost:** 9/10 (Complex algorithms)
**Priority:** Critical
**Estimated Hours:** 18-24 hours
**Dependencies:** [`action-2.4-hydrogen-bonds`]

**TDD Workflow:**

1. **Write Tests First (6 hours)**
   ```typescript
   // tests/services/interactions/interaction-detector.test.ts
   describe('Interaction Detector', () => {
     describe('Hydrogen Bonds', () => {
       it('should detect classic H-bonds (2.5-3.5Å, >120°)', () => {
         // Existing tests from Action 2.4
       });
     });

     describe('Salt Bridges', () => {
       it('should detect salt bridges between charged residues (<4.0Å)', () => {
         // Test Lys/Arg ↔ Asp/Glu
       });

       it('should validate charge complementarity', () => {
         // Test positive-negative pairing
       });
     });

     describe('Hydrophobic Contacts', () => {
       it('should detect hydrophobic interactions (<5.0Å)', () => {
         // Test Ala, Val, Leu, Ile, Phe, Trp, Met
       });

       it('should exclude surface-exposed contacts', () => {
         // Test burial criterion
       });
     });

     describe('Pi-Pi Stacking', () => {
       it('should detect parallel pi-pi stacking (3.5-4.5Å)', () => {
         // Test Phe, Tyr, Trp, His
       });

       it('should detect T-shaped pi-pi (4.5-5.5Å)', () => {
         // Test edge-to-face
       });

       it('should validate ring plane angles', () => {
         // Test parallel (<30°) vs T-shaped (>60°)
       });
     });
   });
   ```

2. **Implement Algorithms (10-12 hours)**
   ```typescript
   // src/services/interactions/interaction-detector.ts
   export class InteractionDetector {
     async detectAllInteractions(
       options: DetectionOptions
     ): Promise<InteractionSet> {
       const [hBonds, saltBridges, hydrophobic, piPi] = await Promise.all([
         this.detectHydrogenBonds(options),
         this.detectSaltBridges(options),
         this.detectHydrophobicContacts(options),
         this.detectPiPiStacking(options)
       ]);

       return {
         hydrogenBonds: hBonds,
         saltBridges,
         hydrophobicContacts: hydrophobic,
         piPiStacking: piPi,
         total: hBonds.length + saltBridges.length + hydrophobic.length + piPi.length
       };
     }

     private async detectSaltBridges(
       options: DetectionOptions
     ): Promise<SaltBridge[]> {
       // Get positively charged residues (Lys, Arg)
       // Get negatively charged residues (Asp, Glu)
       // Calculate pairwise distances
       // Filter by distance threshold (typically <4.0Å)
       // Validate geometric criteria
       return saltBridges;
     }

     private async detectHydrophobicContacts(
       options: DetectionOptions
     ): Promise<HydrophobicContact[]> {
       // Get hydrophobic residues
       const hydrophobicResidues = ['ALA', 'VAL', 'LEU', 'ILE', 'PHE', 'TRP', 'MET'];
       // Calculate pairwise distances
       // Filter by distance (<5.0Å)
       // Check burial (exclude surface contacts)
       return contacts;
     }

     private async detectPiPiStacking(
       options: DetectionOptions
     ): Promise<PiPiInteraction[]> {
       // Get aromatic residues (Phe, Tyr, Trp, His)
       // Calculate ring centroids
       // Calculate centroid-centroid distances
       // Calculate ring plane angles
       // Classify as parallel or T-shaped
       return piInteractions;
     }
   }
   ```

3. **Validate & Document (6 hours)**

**Success Criteria:**
- ✅ H-bond accuracy >95%
- ✅ Salt bridge accuracy >90%
- ✅ Hydrophobic contact detection working
- ✅ Pi-pi stacking detection working
- ✅ Detection completes <2s for typical proteins
- ✅ Configurable thresholds
- ✅ Tests passing (100% coverage for new algorithms)

---

### Action 4.2: InteractionsPanel Component (TDD)

**ID:** `action-4.2-interactions-panel`

**Preconditions:**
```typescript
{
  interactionsPanel: true,  // Detection implemented
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  lineCoverage: +3%,
  functionCoverage: +3%
}
```

**Cost:** 7/10
**Priority:** High
**Estimated Hours:** 12-14 hours
**Dependencies:** [`action-4.1-interaction-detection`]

**TDD Workflow:**

1. **Write Tests (4 hours)**
   ```typescript
   // tests/components/viewer/interactive/InteractionsPanel.test.tsx
   describe('InteractionsPanel Component', () => {
     it('should display interaction summary', () => {
       // Test counts for each type
     });

     it('should filter interactions by type', () => {
       // Test toggle filters
     });

     it('should show detailed interaction list', () => {
       // Test list rendering
     });

     it('should highlight interaction in 3D on click', () => {
       // Test 3D visualization trigger
     });

     it('should adjust detection thresholds', () => {
       // Test settings panel
     });

     it('should export interactions to CSV', () => {
       // Test export functionality
     });
   });
   ```

2. **Implement (6-8 hours)**
   ```typescript
   // src/components/viewer/interactive/InteractionsPanel.tsx
   export function InteractionsPanel({ onClose }: Props) {
     const {
       interactions,
       loading,
       filters,
       toggleFilter,
       visualizeInteraction,
       exportToCSV
     } = useInteractions();

     return (
       <Panel title="Non-Covalent Interactions" onClose={onClose}>
         <InteractionSummary interactions={interactions} />

         <FilterControls filters={filters} onToggle={toggleFilter} />

         <InteractionList
           interactions={interactions}
           onVisualize={visualizeInteraction}
         />

         <ThresholdSettings />

         <Button onClick={exportToCSV}>Export CSV</Button>
       </Panel>
     );
   }

   // src/hooks/viewer/use-interactions.ts
   export function useInteractions() {
     const molstar = useMolstarService();
     const [interactions, setInteractions] = useState<InteractionSet | null>(null);
     const [loading, setLoading] = useState(false);

     const detectInteractions = useCallback(async () => {
       setLoading(true);
       const result = await molstar.detectAllInteractions({
         hBondThreshold: 3.5,
         saltBridgeThreshold: 4.0,
         hydrophobicThreshold: 5.0,
         piPiThreshold: 4.5
       });
       setInteractions(result);
       setLoading(false);
     }, [molstar]);

     // Auto-detect on structure load
     useEffect(() => {
       detectInteractions();
     }, [detectInteractions]);

     return { interactions, loading, detectInteractions };
   }
   ```

3. **Validate & Document (2 hours)**

**Success Criteria:**
- ✅ Displays summary counts
- ✅ Lists all detected interactions
- ✅ Click interaction → highlights in 3D
- ✅ Filter by interaction type works
- ✅ Threshold adjustment triggers re-detection
- ✅ Export to CSV functional
- ✅ Tests passing

---

### Action 4.3: 3D Interaction Visualization (TDD)

**ID:** `action-4.3-interaction-viz`

**Preconditions:**
```typescript
{
  interactionsPanel: true,
  measurementVisualization: true
}
```

**Effects:**
```typescript
{
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 6/10
**Priority:** High
**Estimated Hours:** 8-10 hours
**Dependencies:** [`action-4.2-interactions-panel`, `action-2.1-measurement-viz`]

**TDD Workflow:**

1. **Write Tests (3 hours)**
   ```typescript
   // tests/services/molstar/interaction-renderer.test.ts
   describe('Interaction Renderer', () => {
     it('should render H-bonds as dashed yellow lines', () => {
       // Test line style
     });

     it('should render salt bridges as solid blue lines', () => {
       // Test color and style
     });

     it('should render hydrophobic contacts as dotted gray lines', () => {
       // Test style
     });

     it('should render pi-pi as green double lines', () => {
       // Test parallel stacking visualization
     });

     it('should toggle interaction visibility', () => {
       // Test show/hide
     });

     it('should handle bulk visualization', () => {
       // Test rendering 100+ interactions
     });
   });
   ```

2. **Implement (4-5 hours)**
   ```typescript
   // src/services/molstar/interaction-renderer.ts
   export class InteractionRenderer {
     async renderHydrogenBond(
       hBond: HydrogenBond,
       plugin: PluginContext
     ): Promise<void> {
       // Create dashed line representation
       // Color: yellow (#ffff00)
     }

     async renderSaltBridge(
       saltBridge: SaltBridge,
       plugin: PluginContext
     ): Promise<void> {
       // Create solid line representation
       // Color: blue (#0000ff)
     }

     async renderHydrophobicContact(
       contact: HydrophobicContact,
       plugin: PluginContext
     ): Promise<void> {
       // Create dotted line
       // Color: gray (#888888)
     }

     async renderPiPiStacking(
       piPi: PiPiInteraction,
       plugin: PluginContext
     ): Promise<void> {
       // Create double line (parallel) or T-shape
       // Color: green (#00ff00)
     }

     async toggleVisibility(
       interactionType: InteractionType,
       visible: boolean
     ): Promise<void> {
       // Bulk show/hide by type
     }
   }
   ```

3. **Validate & Document (2 hours)**

**Success Criteria:**
- ✅ H-bonds: dashed yellow lines
- ✅ Salt bridges: solid blue lines
- ✅ Hydrophobic: dotted gray lines
- ✅ Pi-pi: green double lines
- ✅ Toggle by type works
- ✅ Performance: <10% FPS impact with 100 interactions
- ✅ Tests passing

---

### Phase 4 Milestones

**Milestone 4.A: Interaction Detection (Week 5)**
- Action: 4.1
- Deliverable: All detection algorithms
- Coverage increase: +5%
- Tests: 20+ new tests

**Milestone 4.B: Interaction UI & Visualization (Week 6)**
- Actions: 4.2, 4.3
- Deliverables: InteractionsPanel, 3D visualization
- Coverage increase: +5%
- Tests: 15+ new tests

**Phase 4 Complete When:**
- ✅ `phase4Complete = true`
- ✅ Coverage: lines ≥86%, functions ≥86%
- ✅ Detection accuracy targets met
- ✅ All interaction types visualized
- ✅ Tests passing

---

## Phase 5: Integration & Production Validation (Week 7)

**Goal:** Create unified component, achieve production readiness, comprehensive testing

### Action 5.1: EnhancedMolStarViewer Unified Component (TDD)

**ID:** `action-5.1-enhanced-viewer`

**Preconditions:**
```typescript
{
  phase4Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  lineCoverage: +2%,
  functionCoverage: +2%
}
```

**Cost:** 5/10
**Priority:** Critical
**Estimated Hours:** 8-10 hours
**Dependencies:** All previous phases

**TDD Workflow:**

1. **Write Tests (3 hours)**
   ```typescript
   // tests/components/viewer/EnhancedMolStarViewer.test.tsx
   describe('EnhancedMolStarViewer', () => {
     it('should integrate all interactive features', () => {
       // Test hover, measurements, sequence, interactions
     });

     it('should support feature flags', () => {
       // Test enabling/disabling features
     });

     it('should handle concurrent interactions', () => {
       // Test feature coordination
     });

     it('should maintain performance with all features enabled', () => {
       // Test FPS monitoring
     });
   });
   ```

2. **Implement (4-5 hours)**
   ```typescript
   // src/components/viewer/EnhancedMolStarViewer.tsx
   export interface EnhancedMolStarViewerProps {
     pdbId: string;
     enableHoverTooltip?: boolean;
     enableMeasurements?: boolean;
     enableSequenceViewer?: boolean;
     enableInteractions?: boolean;
     onLoadComplete?: () => void;
   }

   export function EnhancedMolStarViewer({
     pdbId,
     enableHoverTooltip = true,
     enableMeasurements = true,
     enableSequenceViewer = true,
     enableInteractions = true,
     onLoadComplete
   }: EnhancedMolStarViewerProps) {
     return (
       <div className="flex flex-col h-full">
         <div className="flex-1 relative">
           <MolStarViewer pdbId={pdbId} onLoad={onLoadComplete} />

           {enableHoverTooltip && <HoverTooltip />}
           {enableMeasurements && <MeasurementsPanel />}
           {enableInteractions && <InteractionsPanel />}
         </div>

         {enableSequenceViewer && (
           <div className="h-48 border-t">
             <SequenceViewer />
           </div>
         )}
       </div>
     );
   }
   ```

3. **Validate & Document (2 hours)**

**Success Criteria:**
- ✅ All features work together seamlessly
- ✅ Feature flags functional
- ✅ No conflicts between features
- ✅ Performance maintained
- ✅ Tests passing

---

### Action 5.2: E2E Test Suite (TDD)

**ID:** `action-5.2-e2e-tests`

**Preconditions:**
```typescript
{
  phase4Complete: true,
  allTestsPassing: true
}
```

**Effects:**
```typescript
{
  e2eTestsComplete: true,
  lineCoverage: +1%
}
```

**Cost:** 7/10
**Priority:** Critical
**Estimated Hours:** 10-14 hours
**Dependencies:** All phases

**TDD Workflow:**

1. **Write E2E Tests (6-8 hours)**
   ```typescript
   // e2e/interactive-features.spec.ts
   import { test, expect } from '@playwright/test';

   test.describe('Interactive Features E2E', () => {
     test('complete workflow: load → hover → measure → sequence sync', async ({ page }) => {
       await page.goto('/viewer?pdb=1LDH');

       // Wait for structure load
       await expect(page.locator('[data-testid="molstar-canvas"]')).toBeVisible();

       // Hover over atom
       await page.hover('[data-testid="molstar-canvas"]', { position: { x: 200, y: 200 } });
       await expect(page.locator('[data-testid="hover-tooltip"]')).toBeVisible();

       // Create distance measurement
       await page.click('[data-testid="measurements-button"]');
       await page.click('[data-testid="distance-button"]');
       await page.click('[data-testid="molstar-canvas"]', { position: { x: 150, y: 150 } });
       await page.click('[data-testid="molstar-canvas"]', { position: { x: 250, y: 250 } });
       await expect(page.locator('[data-testid="measurement-item"]')).toContainText('Å');

       // Sequence sync
       await page.click('[data-testid="sequence-residue-50"]');
       // Verify 3D view centered on residue 50

       // Interactions detection
       await page.click('[data-testid="interactions-button"]');
       await expect(page.locator('[data-testid="interactions-summary"]')).toContainText('H-bonds');
     });

     test('performance: all features enabled', async ({ page }) => {
       await page.goto('/viewer?pdb=1LDH&all-features=true');

       // Measure FPS
       const fps = await page.evaluate(() => {
         let frameCount = 0;
         let lastTime = performance.now();

         return new Promise((resolve) => {
           function measureFPS() {
             frameCount++;
             const currentTime = performance.now();
             const elapsed = currentTime - lastTime;

             if (elapsed >= 1000) {
               const fps = frameCount / (elapsed / 1000);
               resolve(fps);
             } else {
               requestAnimationFrame(measureFPS);
             }
           }
           requestAnimationFrame(measureFPS);
         });
       });

       expect(fps).toBeGreaterThan(54); // >90% of 60 FPS
     });
   });
   ```

2. **Run & Validate (4 hours)**
   - Run E2E suite: `npm run test:e2e`
   - Fix any failures
   - Verify all workflows

3. **Document (2 hours)**

**Success Criteria:**
- ✅ All E2E tests passing
- ✅ User workflows validated
- ✅ Performance verified
- ✅ Cross-browser tested (Chrome, Firefox, Safari)

---

### Action 5.3: Coverage Optimization (TDD)

**ID:** `action-5.3-coverage-optimization`

**Preconditions:**
```typescript
{
  phase4Complete: true,
  e2eTestsComplete: true
}
```

**Effects:**
```typescript
{
  lineCoverage: 80,
  functionCoverage: 80,
  branchCoverage: 75,
  statementCoverage: 80
}
```

**Cost:** 6/10
**Priority:** Critical
**Estimated Hours:** 8-12 hours
**Dependencies:** All previous actions

**TDD Workflow:**

1. **Analyze Coverage Gaps (2 hours)**
   ```bash
   npm run test:coverage
   # Review HTML report
   # Identify untested branches, functions, lines
   ```

2. **Write Missing Tests (4-6 hours)**
   ```typescript
   // Target: Files with <80% coverage

   // Example: src/services/molstar-service.ts uncovered error handling
   describe('MolstarService Error Handling', () => {
     it('should handle structure load failure gracefully', () => {
       // Test error path
     });

     it('should retry failed operations', () => {
       // Test retry logic
     });
   });

   // Example: src/lib/lod-manager.ts edge cases
   describe('LODManager Edge Cases', () => {
     it('should handle structures with 0 atoms', () => {
       // Test boundary condition
     });

     it('should handle extremely large structures (>1M atoms)', () => {
       // Test upper boundary
     });
   });
   ```

3. **Validate (2 hours)**
   ```bash
   npm run test:coverage
   # Verify all thresholds met:
   # - lines ≥80%
   # - functions ≥80%
   # - branches ≥75%
   # - statements ≥80%
   ```

4. **Document (2 hours)**

**Success Criteria:**
- ✅ `lineCoverage ≥ 80%`
- ✅ `functionCoverage ≥ 80%`
- ✅ `branchCoverage ≥ 75%`
- ✅ `statementCoverage ≥ 80%`
- ✅ All tests passing
- ✅ CI quality gates pass

---

### Action 5.4: Production Validation (TDD)

**ID:** `action-5.4-production-validation`

**Preconditions:**
```typescript
{
  phase5Complete: true,
  lineCoverage: 80,
  e2eTestsComplete: true
}
```

**Effects:**
```typescript
{
  productionValidated: true
}
```

**Cost:** 8/10
**Priority:** Critical
**Estimated Hours:** 12-16 hours
**Dependencies:** All phases complete

**Validation Workflow:**

1. **Automated Validation (6 hours)**
   ```typescript
   // tests/production/validation-suite.test.ts
   describe('Production Validation', () => {
     test('bundle size within budget (<150KB increase)', async () => {
       // Test bundle analysis
     });

     test('Lighthouse performance score >90', async () => {
       // Run Lighthouse audit
     });

     test('no console errors or warnings', async () => {
       // Test clean console
     });

     test('accessibility: WCAG 2.1 AA compliance', async () => {
       // Test a11y
     });

     test('security: no XSS vulnerabilities', async () => {
       // Test input sanitization
     });
   });

   // scripts/production-validation.ts
   async function runProductionValidation() {
     // 1. Build production bundle
     await exec('npm run build');

     // 2. Analyze bundle size
     const bundleSize = await analyzeBundleSize();
     assert(bundleSize.increase < 150 * 1024); // 150KB

     // 3. Run Lighthouse
     const lighthouse = await runLighthouse('http://localhost:3000');
     assert(lighthouse.performance > 90);

     // 4. Security scan
     await exec('npm run security:scan');

     // 5. Type check
     await exec('npm run typecheck');

     // 6. Linting
     await exec('npm run lint');

     console.log('✅ Production validation passed');
   }
   ```

2. **Manual Testing (4 hours)**
   - Test all features on production build
   - Test on different devices (desktop, tablet, mobile)
   - Test on different browsers (Chrome, Firefox, Safari, Edge)
   - Verify performance metrics
   - Check console for errors/warnings

3. **Documentation Review (2 hours)**
   - Verify README.md up-to-date
   - Check API documentation complete
   - Review architecture docs
   - Verify user guide complete

4. **Sign-off (2 hours)**
   - Create validation report
   - Document any known limitations
   - Create deployment checklist

**Success Criteria:**
- ✅ Bundle size increase <150KB gzipped
- ✅ Lighthouse performance >90
- ✅ Zero TypeScript errors
- ✅ Zero console errors/warnings
- ✅ WCAG 2.1 AA compliance
- ✅ All browsers supported
- ✅ Documentation complete
- ✅ `productionValidated = true`

---

### Phase 5 Milestones

**Milestone 5.A: Integration (Days 1-2)**
- Actions: 5.1, 5.2
- Deliverables: EnhancedMolStarViewer, E2E tests
- Coverage increase: +3%

**Milestone 5.B: Validation (Days 3-5)**
- Actions: 5.3, 5.4
- Deliverables: 80% coverage, production validation
- Coverage target: 80%

**Phase 5 Complete When:**
- ✅ `phase5Complete = true`
- ✅ `productionValidated = true`
- ✅ All coverage thresholds met
- ✅ E2E tests passing
- ✅ Production build validated
- ✅ Documentation complete

---

## GOAP Execution Plan

### A* Search Heuristics

**Cost Function:**
```
f(action) = g(action) + h(action)

g(action) = estimatedHours
h(action) = (100 - targetCoverage) / 10 + dependencyCount * 2
```

**Priority Weighting:**
- Critical: cost × 1.0
- High: cost × 1.2
- Medium: cost × 1.5
- Low: cost × 2.0

### Optimal Action Sequence (A* Path)

**Phase 2 (Weeks 1-2):**
1. `action-2.1-measurement-viz` (Cost: 7, 12-16h)
2. `action-2.2-multi-selection` (Cost: 5, 8-10h) - Parallel with 2.1
3. `action-2.3-selection-highlighting` (Cost: 6, 8-10h) - After 2.2
4. `action-2.4-hydrogen-bonds` (Cost: 8, 12-16h) - After 2.3

**Phase 3 (Weeks 3-4):**
5. `action-3.1-sequence-extraction` (Cost: 5, 8-10h)
6. `action-3.2-sequence-viewer` (Cost: 8, 14-18h) - After 3.1
7. `action-3.3-sequence-integration` (Cost: 4, 6-8h) - After 3.2

**Phase 4 (Weeks 5-6):**
8. `action-4.1-interaction-detection` (Cost: 9, 18-24h)
9. `action-4.2-interactions-panel` (Cost: 7, 12-14h) - After 4.1
10. `action-4.3-interaction-viz` (Cost: 6, 8-10h) - After 4.2

**Phase 5 (Week 7):**
11. `action-5.1-enhanced-viewer` (Cost: 5, 8-10h)
12. `action-5.2-e2e-tests` (Cost: 7, 10-14h) - Parallel with 5.1
13. `action-5.3-coverage-optimization` (Cost: 6, 8-12h) - After 5.2
14. `action-5.4-production-validation` (Cost: 8, 12-16h) - After 5.3

**Total Estimated Time:** 136-178 hours (17-22 days @ 8h/day)

---

## Parallel Execution Strategy

### Week 1-2 (Phase 2)
**Agent 1:** `action-2.1-measurement-viz`
**Agent 2:** `action-2.2-multi-selection`
**Agent 3:** Documentation and test setup

**Sequential:** `action-2.3-selection-highlighting` → `action-2.4-hydrogen-bonds`

### Week 3-4 (Phase 3)
**Agent 1:** `action-3.1-sequence-extraction`
**Agent 2:** Test infrastructure for sequence viewer

**Sequential:** `action-3.2-sequence-viewer` → `action-3.3-sequence-integration`

### Week 5-6 (Phase 4)
**Agent 1:** `action-4.1-interaction-detection` (complex, needs focus)

**Sequential:** `action-4.2-interactions-panel` → `action-4.3-interaction-viz`

### Week 7 (Phase 5)
**Agent 1:** `action-5.1-enhanced-viewer`
**Agent 2:** `action-5.2-e2e-tests`

**Sequential:** `action-5.3-coverage-optimization` → `action-5.4-production-validation`

---

## Success Metrics & Validation

### Coverage Metrics (Vitest Thresholds)
```javascript
coverage: {
  thresholds: {
    lines: 80,        // Current: ~60%, Target: 80%
    functions: 80,    // Current: ~60%, Target: 80%
    branches: 75,     // Current: ~50%, Target: 75%
    statements: 80    // Current: ~60%, Target: 80%
  }
}
```

### Performance Metrics
```yaml
Hover Response: <100ms (Phase 1: ✅)
Measurement Creation: <200ms (Phase 2: Target)
Sequence Load: <500ms (Phase 3: Target)
Sequence Sync: <50ms (Phase 3: Target)
Interaction Detection: <2s (Phase 4: Target)
FPS Impact: <10% degradation (All phases)
Bundle Size: <150KB increase (Phase 5: Target)
```

### Quality Gates
```yaml
CI Quality Gate (package.json script: ci:quality-gate):
  - All tests passing
  - Coverage ≥ thresholds
  - Zero TypeScript errors
  - Zero linting errors
  - Lighthouse score >90
  - Security scan clean
```

---

## Risk Mitigation

### Risk 1: Coverage Threshold Not Met
**Mitigation:**
- Daily coverage monitoring
- Action 5.3 dedicated to coverage optimization
- Parallel test writing during implementation

### Risk 2: MolStar API Integration Complexity
**Mitigation:**
- Start with simplest APIs (hover detection - already done)
- Incremental complexity (measurements → sequence → interactions)
- Reference existing MolStar examples
- Prototype complex features before full implementation

### Risk 3: Performance Degradation
**Mitigation:**
- Performance tests in each action's validation
- FPS monitoring in E2E tests
- Throttling and debouncing from Phase 1
- LOD system already in place for large structures

### Risk 4: Time Overruns
**Mitigation:**
- Conservative time estimates (high end of ranges)
- Parallel execution where possible
- Clear dependencies prevent blocking
- Daily progress tracking

---

## Claude Flow Orchestration

### SPARC Integration

Use SPARC modes for structured development:

```bash
# Phase 2: Visual Enhancements
npx claude-flow sparc run spec-pseudocode "3D measurement visualization"
npx claude-flow sparc run architect "multi-selection system"
npx claude-flow sparc tdd "selection highlighting"
npx claude-flow sparc tdd "hydrogen bond visualization"

# Phase 3: Sequence Viewer
npx claude-flow sparc run spec-pseudocode "sequence extraction API"
npx claude-flow sparc run architect "sequence viewer component"
npx claude-flow sparc tdd "sequence-3D synchronization"

# Phase 4: Interactions
npx claude-flow sparc run spec-pseudocode "interaction detection algorithms"
npx claude-flow sparc tdd "interactions panel"
npx claude-flow sparc tdd "interaction visualization"

# Phase 5: Integration
npx claude-flow sparc run integration "enhanced molstar viewer"
npx claude-flow sparc run test "E2E test suite"
```

### Agent Swarm Coordination

```bash
# Initialize swarm for Phase 2
npx claude-flow swarm init --topology hierarchical --max-agents 3

# Spawn agents for parallel execution
npx claude-flow agent spawn --type coder --name "MeasurementViz"
npx claude-flow agent spawn --type coder --name "MultiSelection"
npx claude-flow agent spawn --type tester --name "TestCoordinator"

# Orchestrate tasks
npx claude-flow task orchestrate "Phase 2 Visual Enhancements" --strategy parallel
```

### Memory Management

```bash
# Store architectural decisions
npx claude-flow memory store --namespace "lab-visualizer" \
  --key "measurement-viz-approach" \
  --value "Use MolStar shape/line representations for 3D lines and labels"

# Retrieve prior decisions
npx claude-flow memory retrieve --namespace "lab-visualizer" \
  --key "measurement-viz-approach"
```

---

## Daily Workflow (TDD Cadence)

### Morning (2-3 hours)
1. **Write Tests** for today's action
   - Unit tests for components
   - Integration tests for services
   - E2E tests for workflows
2. **Review Test Coverage** from previous day
3. **Run Full Test Suite** to ensure no regressions

### Midday (4-5 hours)
4. **Implement Functionality** to make tests pass
   - Red → Green → Refactor cycle
   - Commit frequently with meaningful messages
5. **Manual Testing** of new features
6. **Performance Testing** (FPS monitoring, bundle size)

### Afternoon (1-2 hours)
7. **Documentation** updates
   - API documentation
   - User guides
   - Architecture decisions
8. **Code Review** (if working in team)
9. **Plan Next Day** actions

---

## Completion Checklist

### Phase 2 ✅ Criteria
- [ ] `action-2.1-measurement-viz` complete (tests passing)
- [ ] `action-2.2-multi-selection` complete (tests passing)
- [ ] `action-2.3-selection-highlighting` complete (tests passing)
- [ ] `action-2.4-hydrogen-bonds` complete (tests passing)
- [ ] Coverage increase: +10% (lines ≥68%)
- [ ] Performance: <10% FPS degradation
- [ ] Documentation updated

### Phase 3 ✅ Criteria
- [ ] `action-3.1-sequence-extraction` complete
- [ ] `action-3.2-sequence-viewer` complete
- [ ] `action-3.3-sequence-integration` complete
- [ ] Coverage increase: +8% (lines ≥76%)
- [ ] Sequence load <500ms
- [ ] Sync latency <50ms
- [ ] Documentation updated

### Phase 4 ✅ Criteria
- [ ] `action-4.1-interaction-detection` complete
- [ ] `action-4.2-interactions-panel` complete
- [ ] `action-4.3-interaction-viz` complete
- [ ] Coverage increase: +10% (lines ≥86%)
- [ ] Detection <2s
- [ ] Accuracy targets met (H-bonds >95%, salt bridges >90%)
- [ ] Documentation updated

### Phase 5 ✅ Criteria
- [ ] `action-5.1-enhanced-viewer` complete
- [ ] `action-5.2-e2e-tests` complete (all passing)
- [ ] `action-5.3-coverage-optimization` complete (≥80%)
- [ ] `action-5.4-production-validation` complete
- [ ] All quality gates passing
- [ ] Bundle size <150KB increase
- [ ] Lighthouse >90
- [ ] Zero errors/warnings
- [ ] Documentation complete

### Portfolio Completion ✅
- [ ] All 5 phases complete
- [ ] Test coverage: lines ≥80%, functions ≥80%, branches ≥75%, statements ≥80%
- [ ] E2E tests passing
- [ ] Production build validated
- [ ] Documentation comprehensive
- [ ] Performance targets met
- [ ] Ready for portfolio showcase

---

## Appendix A: Test File Organization

```
tests/
├── components/
│   └── viewer/
│       ├── interactive/
│       │   ├── HoverTooltip.test.tsx (✅ Phase 1)
│       │   ├── MeasurementsPanel.test.tsx (✅ Phase 1)
│       │   ├── MeasurementVisualization.test.tsx (📋 Phase 2)
│       │   ├── SequenceViewer.test.tsx (📋 Phase 3)
│       │   ├── InteractionsPanel.test.tsx (📋 Phase 4)
│       │   └── HydrogenBondsPanel.test.tsx (📋 Phase 2)
│       └── EnhancedMolStarViewer.test.tsx (📋 Phase 5)
├── hooks/
│   └── viewer/
│       ├── use-measurements.test.ts (✅ Phase 1)
│       ├── use-multi-selection.test.ts (📋 Phase 2)
│       ├── use-sequence-sync.test.ts (📋 Phase 3)
│       └── use-interactions.test.ts (📋 Phase 4)
├── services/
│   ├── molstar/
│   │   ├── measurement-renderer.test.ts (📋 Phase 2)
│   │   ├── measurement-representations.test.ts (📋 Phase 2)
│   │   ├── selection-highlighter.test.ts (📋 Phase 2)
│   │   ├── sequence-extractor.test.ts (📋 Phase 3)
│   │   ├── interaction-renderer.test.ts (📋 Phase 4)
│   │   └── molstar-service-extended.test.ts (📋 Phases 2-4)
│   └── interactions/
│       ├── hydrogen-bond-detector.test.ts (📋 Phase 2)
│       └── interaction-detector.test.ts (📋 Phase 4)
├── integration/
│   ├── measurement-visualization.test.ts (📋 Phase 2)
│   ├── sequence-3d-sync.test.ts (📋 Phase 3)
│   ├── interaction-visualization.test.ts (📋 Phase 4)
│   └── enhanced-viewer-integration.test.ts (📋 Phase 5)
├── production/
│   └── validation-suite.test.ts (📋 Phase 5)
└── e2e/
    ├── interactive-features.spec.ts (📋 Phase 5)
    ├── performance.spec.ts (📋 Phase 5)
    └── cross-browser.spec.ts (📋 Phase 5)
```

**Test Count Targets:**
- Phase 1: 39 files ✅
- Phase 2: +15 files (54 total)
- Phase 3: +10 files (64 total)
- Phase 4: +12 files (76 total)
- Phase 5: +8 files (84 total)

---

## Appendix B: Coverage Tracking

### Weekly Coverage Goals

| Week | Phase | Target Lines | Target Functions | Target Branches | Target Statements |
|------|-------|--------------|------------------|-----------------|-------------------|
| **Baseline** | 1 | 60% | 60% | 50% | 60% |
| 1-2 | 2 | 68% | 68% | 60% | 68% |
| 3-4 | 3 | 76% | 76% | 68% | 76% |
| 5-6 | 4 | 86% | 86% | 73% | 86% |
| 7 | 5 | **80%** ✅ | **80%** ✅ | **75%** ✅ | **80%** ✅ |

### Daily Coverage Monitoring

```bash
# Run coverage daily
npm run test:coverage

# Check thresholds
npm run ci:quality-gate

# Generate HTML report
# View: coverage/index.html
```

---

**Document Version:** 1.0
**Created:** 2025-12-26
**Status:** 📋 Ready for Execution
**Estimated Completion:** 2026-02-13 (7 weeks)
**Next Action:** `action-2.1-measurement-viz`

---

**For Questions or Issues:**
- Reference: `docs/architecture/INTERACTIVE_FEATURES_INDEX.md`
- Implementation Guide: `docs/architecture/interactive-features-implementation.md`
- Architecture: `docs/architecture/interactive-features-system-design.md`
