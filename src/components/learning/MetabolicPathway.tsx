/**
 * MetabolicPathway Component
 * Interactive visualization of LAB (Lactic Acid Bacteria) metabolic pathways
 * Educational tool for learning about fermentation biochemistry
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  LAB_METABOLIC_PATHWAYS,
  getProteinsForPathway,
  LAB_PROTEINS,
  type MetabolicPathway as MetabolicPathwayType,
  type LABProtein,
} from '@/data/lab-structures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface MetabolicPathwayProps {
  pathwayId?: string;
  onProteinClick?: (pdbId: string) => void;
}

interface PathwayStep {
  id: string;
  substrate: string;
  enzyme: string;
  product: string;
  cofactors?: string[];
  energyChange?: string;
  pdbId?: string;
  description?: string;
}

interface EnzymeNodeProps {
  enzyme: string;
  pdbId?: string;
  protein?: LABProtein;
  onClick?: () => void;
  isHighlighted?: boolean;
}

interface SubstrateNodeProps {
  name: string;
  isInput?: boolean;
  isOutput?: boolean;
}

interface ArrowConnectorProps {
  direction?: 'right' | 'down' | 'left';
  label?: string;
}

interface EnergyIndicatorProps {
  atp: number;
  nadh: number;
  type: 'produced' | 'consumed';
}

// =============================================================================
// PATHWAY STEP DATA
// =============================================================================

const HOMOFERMENTATIVE_STEPS: PathwayStep[] = [
  {
    id: 'step-1',
    substrate: 'Glucose',
    enzyme: 'Hexokinase',
    product: 'G6P',
    cofactors: ['ATP -> ADP'],
    energyChange: '-1 ATP',
    description: 'Glucose is phosphorylated to glucose-6-phosphate, trapping it in the cell',
  },
  {
    id: 'step-2',
    substrate: 'G6P',
    enzyme: 'Phosphoglucose Isomerase',
    product: 'F6P',
    description: 'Isomerization of glucose-6-phosphate to fructose-6-phosphate',
  },
  {
    id: 'step-3',
    substrate: 'F6P',
    enzyme: 'Phosphofructokinase (PFK)',
    product: 'F1,6BP',
    cofactors: ['ATP -> ADP'],
    energyChange: '-1 ATP',
    description: 'Rate-limiting step: fructose-6-phosphate is phosphorylated (committed step)',
  },
  {
    id: 'step-4',
    substrate: 'F1,6BP',
    enzyme: 'Aldolase',
    product: '2x G3P',
    description: 'Fructose-1,6-bisphosphate is split into two 3-carbon molecules',
  },
  {
    id: 'step-5',
    substrate: '2x G3P',
    enzyme: 'GAPDH',
    product: '2x 1,3BPG',
    cofactors: ['2 NAD+ -> 2 NADH'],
    pdbId: '1DC4',
    description: 'Oxidation step producing NADH (energy carrier)',
  },
  {
    id: 'step-6',
    substrate: '2x 1,3BPG',
    enzyme: 'Phosphoglycerate Kinase',
    product: '2x 3PG',
    cofactors: ['2 ADP -> 2 ATP'],
    energyChange: '+2 ATP',
    description: 'First ATP-producing step (substrate-level phosphorylation)',
  },
  {
    id: 'step-7',
    substrate: '2x 3PG',
    enzyme: 'Enolase',
    product: '2x PEP',
    pdbId: '2FYM',
    description: 'Dehydration creating high-energy phosphate bond',
  },
  {
    id: 'step-8',
    substrate: '2x PEP',
    enzyme: 'Pyruvate Kinase',
    product: '2x Pyruvate',
    cofactors: ['2 ADP -> 2 ATP'],
    energyChange: '+2 ATP',
    pdbId: '3OOO',
    description: 'Second ATP-producing step (substrate-level phosphorylation)',
  },
  {
    id: 'step-9',
    substrate: '2x Pyruvate',
    enzyme: 'Lactate Dehydrogenase (LDH)',
    product: '2x L-Lactate',
    cofactors: ['2 NADH -> 2 NAD+'],
    pdbId: '1LDG',
    description: 'Final step: pyruvate reduced to lactate, regenerating NAD+ for glycolysis',
  },
];

const HETEROFERMENTATIVE_STEPS: PathwayStep[] = [
  {
    id: 'hetero-1',
    substrate: 'Glucose',
    enzyme: 'Hexokinase',
    product: 'G6P',
    cofactors: ['ATP -> ADP'],
    energyChange: '-1 ATP',
    description: 'Glucose phosphorylation (same as homofermentative)',
  },
  {
    id: 'hetero-2',
    substrate: 'G6P',
    enzyme: 'G6P Dehydrogenase',
    product: '6PG',
    cofactors: ['NAD+ -> NADH'],
    description: 'Oxidation via pentose phosphate pathway',
  },
  {
    id: 'hetero-3',
    substrate: '6PG',
    enzyme: '6PG Dehydrogenase',
    product: 'Ru5P + CO2',
    cofactors: ['NAD+ -> NADH'],
    description: 'Decarboxylation releasing CO2 (characteristic of heterofermentation)',
  },
  {
    id: 'hetero-4',
    substrate: 'Ru5P',
    enzyme: 'Epimerase',
    product: 'X5P',
    description: 'Epimerization to xylulose-5-phosphate',
  },
  {
    id: 'hetero-5',
    substrate: 'X5P',
    enzyme: 'Phosphoketolase',
    product: 'G3P + Acetyl-P',
    pdbId: '1GPO',
    description: 'Key enzyme: splits X5P into 3C and 2C fragments',
  },
  {
    id: 'hetero-6a',
    substrate: 'G3P',
    enzyme: 'Glycolytic Enzymes',
    product: 'Pyruvate -> Lactate',
    cofactors: ['1 NAD+ -> 1 NADH', '2 ADP -> 2 ATP', '1 NADH -> 1 NAD+'],
    energyChange: '+2 ATP',
    description: 'G3P follows standard glycolysis to lactate',
  },
  {
    id: 'hetero-6b',
    substrate: 'Acetyl-P',
    enzyme: 'Acetate Kinase OR ADH',
    product: 'Acetate OR Ethanol',
    cofactors: ['ADP -> ATP OR NADH -> NAD+'],
    description: 'Branch point: acetate (more ATP) or ethanol (NAD+ regeneration)',
  },
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SubstrateNode: React.FC<SubstrateNodeProps> = ({ name, isInput, isOutput }) => {
  const bgColor = isInput
    ? 'bg-amber-100 border-amber-400 text-amber-800'
    : isOutput
    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
    : 'bg-slate-100 border-slate-300 text-slate-700';

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 font-medium text-sm text-center min-w-[80px]',
        'transition-all duration-200 hover:shadow-md',
        bgColor
      )}
    >
      {name}
      {isInput && (
        <div className="text-[10px] font-normal mt-0.5 text-amber-600">Input</div>
      )}
      {isOutput && (
        <div className="text-[10px] font-normal mt-0.5 text-emerald-600">Product</div>
      )}
    </div>
  );
};

const EnzymeNode: React.FC<EnzymeNodeProps> = ({
  enzyme,
  pdbId,
  protein,
  onClick,
  isHighlighted,
}) => {
  const hasStructure = !!pdbId;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={!hasStructure}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-xs font-medium text-center',
              'transition-all duration-200 min-w-[100px] max-w-[140px]',
              hasStructure
                ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100 hover:shadow-lg cursor-pointer'
                : 'bg-gray-50 border-gray-300 text-gray-600',
              isHighlighted && 'ring-2 ring-green-400 ring-offset-2 shadow-lg'
            )}
          >
            <div className="truncate">{enzyme}</div>
            {hasStructure && (
              <div className="text-[10px] text-green-600 mt-1 flex items-center justify-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                PDB: {pdbId}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{enzyme}</p>
            {protein && (
              <>
                <p className="text-xs text-gray-600">{protein.function}</p>
                {hasStructure && (
                  <p className="text-xs text-green-600">Click to view 3D structure</p>
                )}
              </>
            )}
            {!protein && !hasStructure && (
              <p className="text-xs text-gray-500">No structural data available</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ArrowConnector: React.FC<ArrowConnectorProps> = ({ direction = 'right', label }) => {
  const arrowClass = {
    right: 'flex items-center',
    down: 'flex flex-col items-center',
    left: 'flex items-center rotate-180',
  }[direction];

  const arrowSvg = direction === 'down' ? (
    <svg className="w-4 h-8 text-gray-400" fill="none" viewBox="0 0 24 48">
      <path
        d="M12 4 L12 40 M6 34 L12 40 L18 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg className="w-8 h-4 text-gray-400" fill="none" viewBox="0 0 48 24">
      <path
        d="M4 12 L40 12 M34 6 L40 12 L34 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className={cn(arrowClass, 'mx-1')}>
      {arrowSvg}
      {label && (
        <span className="text-[10px] text-gray-500 ml-1">{label}</span>
      )}
    </div>
  );
};

const EnergyIndicator: React.FC<EnergyIndicatorProps> = ({ atp, nadh, type }) => {
  const isProduced = type === 'produced';
  const bgColor = isProduced ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = isProduced ? 'text-emerald-700' : 'text-red-700';

  return (
    <div className={cn('px-3 py-2 rounded-lg border text-xs', bgColor, textColor)}>
      <div className="font-semibold mb-1">
        {isProduced ? 'Energy Produced' : 'Energy Consumed'}
      </div>
      <div className="space-y-0.5">
        {atp !== 0 && (
          <div className="flex items-center gap-1">
            <span className="font-mono">{isProduced ? '+' : '-'}{Math.abs(atp)}</span>
            <span>ATP</span>
          </div>
        )}
        {nadh !== 0 && (
          <div className="flex items-center gap-1">
            <span className="font-mono">{isProduced ? '+' : '-'}{Math.abs(nadh)}</span>
            <span>NADH</span>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PATHWAY VISUALIZATION COMPONENTS
// =============================================================================

interface PathwayStepCardProps {
  step: PathwayStep;
  stepNumber: number;
  protein?: LABProtein;
  onEnzymeClick?: () => void;
  isCompact?: boolean;
}

const PathwayStepCard: React.FC<PathwayStepCardProps> = ({
  step,
  stepNumber,
  protein,
  onEnzymeClick,
  isCompact = false,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 border-green-200 shadow-sm',
        'hover:border-green-400 hover:shadow-md transition-all duration-200',
        isCompact ? 'p-3' : 'p-4'
      )}
    >
      {/* Step Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
          {stepNumber}
        </div>
        <span className="font-medium text-green-800 text-sm">{step.enzyme}</span>
        {step.pdbId && (
          <Badge variant="secondary" className="ml-auto text-[10px] bg-green-100 text-green-700">
            PDB: {step.pdbId}
          </Badge>
        )}
      </div>

      {/* Reaction Visualization */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <SubstrateNode name={step.substrate} />
        <ArrowConnector direction="right" />
        <SubstrateNode name={step.product} />
      </div>

      {/* Cofactors & Energy */}
      {(step.cofactors || step.energyChange) && (
        <div className="flex flex-wrap gap-1 mb-2 justify-center">
          {step.cofactors?.map((cofactor, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              {cofactor}
            </span>
          ))}
          {step.energyChange && (
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                step.energyChange.includes('+')
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
              )}
            >
              {step.energyChange}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {step.description && !isCompact && (
        <p className="text-xs text-gray-600 text-center">{step.description}</p>
      )}

      {/* View Structure Button */}
      {step.pdbId && protein && (
        <button
          onClick={onEnzymeClick}
          className="w-full mt-3 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View 3D Structure
        </button>
      )}
    </div>
  );
};

// =============================================================================
// MAIN PATHWAY VISUALIZATIONS
// =============================================================================

interface HomofermentativeVisualizationProps {
  onProteinClick?: (pdbId: string) => void;
  highlightedEnzyme?: string;
}

const HomofermentativeVisualization: React.FC<HomofermentativeVisualizationProps> = ({
  onProteinClick,
  highlightedEnzyme,
}) => {
  const proteinMap = useMemo(() => {
    const map: Record<string, LABProtein | undefined> = {};
    HOMOFERMENTATIVE_STEPS.forEach((step) => {
      if (step.pdbId) {
        map[step.pdbId] = LAB_PROTEINS.find((p) => p.pdbId === step.pdbId);
      }
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Simplified Flow Diagram */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-green-800">Homofermentative Pathway Overview</CardTitle>
          <CardDescription>
            Glucose is converted almost exclusively to lactic acid (2 ATP net gain)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center justify-start gap-1 min-w-max py-4">
              {/* Phase 1: Energy Investment */}
              <div className="flex items-center gap-1 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <SubstrateNode name="Glucose" isInput />
                <ArrowConnector />
                <EnzymeNode
                  enzyme="Hexokinase"
                  onClick={() => {}}
                />
                <ArrowConnector />
                <SubstrateNode name="G6P" />
                <ArrowConnector />
                <EnzymeNode enzyme="Isomerase" />
                <ArrowConnector />
                <SubstrateNode name="F6P" />
                <ArrowConnector />
                <EnzymeNode enzyme="PFK" />
                <ArrowConnector />
                <SubstrateNode name="F1,6BP" />
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowConnector direction="down" />
            </div>

            {/* Phase 2: Cleavage */}
            <div className="flex justify-center gap-1 py-2">
              <div className="px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-1">
                  <SubstrateNode name="F1,6BP" />
                  <ArrowConnector />
                  <EnzymeNode enzyme="Aldolase" />
                  <ArrowConnector />
                  <SubstrateNode name="2x G3P" />
                </div>
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowConnector direction="down" />
            </div>

            {/* Phase 3: Energy Payoff */}
            <div className="flex items-center justify-start gap-1 min-w-max py-4">
              <div className="flex items-center gap-1 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <SubstrateNode name="2x G3P" />
                <ArrowConnector />
                <EnzymeNode
                  enzyme="GAPDH"
                  pdbId="1DC4"
                  protein={proteinMap['1DC4']}
                  onClick={() => onProteinClick?.('1DC4')}
                  isHighlighted={highlightedEnzyme === 'GAPDH'}
                />
                <ArrowConnector />
                <SubstrateNode name="..." />
                <ArrowConnector />
                <EnzymeNode
                  enzyme="Pyruvate Kinase"
                  pdbId="3OOO"
                  protein={proteinMap['3OOO']}
                  onClick={() => onProteinClick?.('3OOO')}
                  isHighlighted={highlightedEnzyme === 'Pyruvate Kinase'}
                />
                <ArrowConnector />
                <SubstrateNode name="2x Pyruvate" />
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowConnector direction="down" />
            </div>

            {/* Final Step: Lactate Production */}
            <div className="flex justify-center gap-1 py-2">
              <div className="px-4 py-3 bg-green-100 rounded-lg border-2 border-green-400">
                <div className="flex items-center gap-2">
                  <SubstrateNode name="2x Pyruvate" />
                  <ArrowConnector />
                  <EnzymeNode
                    enzyme="LDH"
                    pdbId="1LDG"
                    protein={proteinMap['1LDG']}
                    onClick={() => onProteinClick?.('1LDG')}
                    isHighlighted={highlightedEnzyme === 'LDH'}
                  />
                  <ArrowConnector />
                  <SubstrateNode name="2x L-Lactate" isOutput />
                </div>
                <div className="text-center mt-2 text-sm font-medium text-green-700">
                  + 2 ATP (net)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Reaction Steps</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOMOFERMENTATIVE_STEPS.map((step, idx) => (
            <PathwayStepCard
              key={step.id}
              step={step}
              stepNumber={idx + 1}
              protein={step.pdbId ? proteinMap[step.pdbId] : undefined}
              onEnzymeClick={step.pdbId ? () => onProteinClick?.(step.pdbId!) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Energy Balance Summary */}
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-green-800">Energy Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <EnergyIndicator atp={2} nadh={0} type="consumed" />
            <EnergyIndicator atp={4} nadh={2} type="produced" />
            <div className="px-3 py-2 rounded-lg border-2 border-green-400 bg-green-100">
              <div className="font-semibold text-green-800 text-sm mb-1">Net Yield</div>
              <div className="text-lg font-bold text-green-600">+2 ATP</div>
              <div className="text-xs text-green-700">per glucose</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface HeterofermentativeVisualizationProps {
  onProteinClick?: (pdbId: string) => void;
}

const HeterofermentativeVisualization: React.FC<HeterofermentativeVisualizationProps> = ({
  onProteinClick,
}) => {
  const proteinMap = useMemo(() => {
    const map: Record<string, LABProtein | undefined> = {};
    HETEROFERMENTATIVE_STEPS.forEach((step) => {
      if (step.pdbId) {
        map[step.pdbId] = LAB_PROTEINS.find((p) => p.pdbId === step.pdbId);
      }
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Diagram */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-amber-800">Heterofermentative Pathway Overview</CardTitle>
          <CardDescription>
            Produces lactate, ethanol/acetate, AND CO2 (only 1 ATP net gain from glucose)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            {/* Main Flow */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center gap-1">
                <SubstrateNode name="Glucose" isInput />
                <ArrowConnector />
                <SubstrateNode name="G6P" />
                <ArrowConnector />
                <SubstrateNode name="6PG" />
                <ArrowConnector />
                <div className="flex flex-col items-center">
                  <SubstrateNode name="Ru5P" />
                  <span className="text-xs text-amber-600 font-medium mt-1">+ CO2</span>
                </div>
              </div>

              <ArrowConnector direction="down" />

              <div className="flex items-center gap-2">
                <EnzymeNode
                  enzyme="Phosphoketolase"
                  pdbId="1GPO"
                  protein={proteinMap['1GPO']}
                  onClick={() => onProteinClick?.('1GPO')}
                />
                <span className="text-sm text-amber-700 font-medium">(Key enzyme)</span>
              </div>

              <ArrowConnector direction="down" />

              {/* Branch Point */}
              <div className="flex items-center gap-8">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <SubstrateNode name="G3P" />
                  <ArrowConnector direction="down" />
                  <SubstrateNode name="Lactate" isOutput />
                  <div className="text-xs text-green-600 mt-1">+2 ATP</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <SubstrateNode name="Acetyl-P" />
                  <ArrowConnector direction="down" />
                  <div className="flex gap-2">
                    <SubstrateNode name="Acetate" isOutput />
                    <span className="self-center text-gray-400">or</span>
                    <SubstrateNode name="Ethanol" isOutput />
                  </div>
                  <div className="text-xs text-blue-600 mt-1">+1 ATP or NAD+ regen</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Reaction Steps</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HETEROFERMENTATIVE_STEPS.map((step, idx) => (
            <PathwayStepCard
              key={step.id}
              step={step}
              stepNumber={idx + 1}
              protein={step.pdbId ? proteinMap[step.pdbId] : undefined}
              onEnzymeClick={step.pdbId ? () => onProteinClick?.(step.pdbId!) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Key Differences */}
      <Card className="border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-amber-800">Key Characteristics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">&#8226;</span>
              <span><strong>CO2 Production:</strong> Creates bubbles in fermented products (sourdough, sauerkraut)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">&#8226;</span>
              <span><strong>Mixed Products:</strong> Lactate + Ethanol/Acetate gives complex flavors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">&#8226;</span>
              <span><strong>Lower ATP Yield:</strong> Only 1 ATP per glucose (vs 2 in homofermentative)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">&#8226;</span>
              <span><strong>Versatile:</strong> Can ferment pentose sugars from plant material</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MetabolicPathway({ pathwayId, onProteinClick }: MetabolicPathwayProps) {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>(
    pathwayId || LAB_METABOLIC_PATHWAYS[0]?.id || 'homofermentative'
  );

  const selectedPathway = useMemo(() => {
    return LAB_METABOLIC_PATHWAYS.find((p) => p.id === selectedPathwayId);
  }, [selectedPathwayId]);

  const relatedProteins = useMemo(() => {
    return getProteinsForPathway(selectedPathwayId);
  }, [selectedPathwayId]);

  const handleProteinClick = useCallback(
    (pdbId: string) => {
      onProteinClick?.(pdbId);
    },
    [onProteinClick]
  );

  const getPathwayTypeBadge = (type: MetabolicPathwayType['type']) => {
    const styles = {
      homofermentative: 'bg-green-100 text-green-800 border-green-300',
      heterofermentative: 'bg-amber-100 text-amber-800 border-amber-300',
      other: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return styles[type] || styles.other;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header & Pathway Selector */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  LAB Metabolic Pathways
                </CardTitle>
                <CardDescription>
                  Interactive visualization of lactic acid fermentation biochemistry
                </CardDescription>
              </div>

              <Select value={selectedPathwayId} onValueChange={setSelectedPathwayId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select pathway..." />
                </SelectTrigger>
                <SelectContent>
                  {LAB_METABOLIC_PATHWAYS.map((pathway) => (
                    <SelectItem key={pathway.id} value={pathway.id}>
                      <div className="flex items-center gap-2">
                        <span>{pathway.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          {selectedPathway && (
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={cn('border', getPathwayTypeBadge(selectedPathway.type))}>
                  {selectedPathway.type.charAt(0).toUpperCase() + selectedPathway.type.slice(1)}
                </Badge>
                <Badge variant="secondary">
                  {selectedPathway.energyYield}
                </Badge>
              </div>

              <p className="text-sm text-gray-700 mb-4">{selectedPathway.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">Substrates</h4>
                  <ul className="space-y-1">
                    {selectedPathway.substrates.map((s, i) => (
                      <li key={i} className="text-amber-700">&#8226; {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">Products</h4>
                  <ul className="space-y-1">
                    {selectedPathway.products.map((p, i) => (
                      <li key={i} className="text-emerald-700">&#8226; {p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedPathway.educationalNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Educational Note
                  </h4>
                  <p className="text-sm text-blue-700">{selectedPathway.educationalNotes}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Pathway Visualization */}
        {selectedPathwayId === 'homofermentative' && (
          <HomofermentativeVisualization onProteinClick={handleProteinClick} />
        )}

        {selectedPathwayId === 'heterofermentative' && (
          <HeterofermentativeVisualization onProteinClick={handleProteinClick} />
        )}

        {/* Generic Pathway View for other pathways */}
        {selectedPathwayId !== 'homofermentative' &&
          selectedPathwayId !== 'heterofermentative' &&
          selectedPathway && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Enzymes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedPathway.keyEnzymes.map((enzyme, idx) => {
                    const protein = LAB_PROTEINS.find(
                      (p) =>
                        p.name.toLowerCase().includes(enzyme.toLowerCase().split(' ')[0]) ||
                        enzyme.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
                    );
                    return (
                      <EnzymeNode
                        key={idx}
                        enzyme={enzyme}
                        pdbId={protein?.pdbId}
                        protein={protein}
                        onClick={protein ? () => handleProteinClick(protein.pdbId) : undefined}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Related Proteins with Structures */}
        {relatedProteins.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-800">
                Available 3D Structures for This Pathway
              </CardTitle>
              <CardDescription>
                Click on any protein to view its 3D structure in the molecular viewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedProteins.map((protein) => (
                  <button
                    key={protein.id}
                    onClick={() => handleProteinClick(protein.pdbId)}
                    className="p-3 text-left bg-green-50 rounded-lg border border-green-200 hover:border-green-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-green-800 text-sm">{protein.name}</h4>
                      <Badge variant="secondary" className="text-[10px] ml-2 shrink-0 bg-green-100">
                        {protein.pdbId}
                      </Badge>
                    </div>
                    <p className="text-xs text-green-600 mt-1 line-clamp-2">{protein.function}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Structure
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Legend</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-400"></div>
                <span>Input Substrate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400"></div>
                <span>Product</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-500"></div>
                <span>Enzyme (clickable)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-300"></div>
                <span>Enzyme (no structure)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Has PDB Structure</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default MetabolicPathway;
