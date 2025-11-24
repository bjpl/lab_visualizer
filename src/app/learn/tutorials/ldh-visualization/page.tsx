'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, CheckCircle, Clock, ChevronRight, Info, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import dynamic from 'next/dynamic';

// Dynamic import for MolStar viewer to avoid SSR issues
const MolStarViewer = dynamic(
  () => import('@/components/viewer/MolStarViewer').then(mod => ({ default: mod.MolStarViewer })),
  { ssr: false, loading: () => <ViewerPlaceholder /> }
);

function ViewerPlaceholder() {
  return (
    <div className="h-[400px] bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
        <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading 3D viewer...</p>
      </div>
    </div>
  );
}

/**
 * Interactive LDH Visualization Tutorial
 *
 * This tutorial guides users through exploring the L-Lactate Dehydrogenase structure
 * from Lactobacillus delbrueckii (PDB: 1LDG)
 */

interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  details: React.ReactNode;
  highlight?: string;
  viewerAction?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Introduction to LDH',
    instruction: 'L-Lactate Dehydrogenase (LDH) is the key enzyme in homofermentative LAB metabolism.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          LDH catalyzes the final step of homofermentative lactic acid fermentation:
        </p>
        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center font-mono text-sm text-green-800 dark:text-green-200">
          Pyruvate + NADH + H+ &#8596; L-Lactate + NAD+
        </div>
        <p className="text-secondary-700 dark:text-secondary-300 text-sm">
          This reaction regenerates NAD+ needed for glycolysis to continue, allowing LAB to
          ferment sugars indefinitely under anaerobic conditions.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Structure: PDB 1LDG</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
            <li>- Source: <em>Lactobacillus delbrueckii</em> subsp. <em>bulgaricus</em></li>
            <li>- Resolution: 2.5 Angstroms</li>
            <li>- Method: X-ray crystallography</li>
            <li>- Molecular weight: ~140 kDa (tetramer)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'quaternary',
    title: 'Quaternary Structure',
    instruction: 'LDH is a homotetramer with 222 symmetry. Observe the four identical subunits.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          The tetrameric structure is essential for enzyme function. Each subunit has an active site,
          but allosteric communication between subunits regulates activity.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded text-xs">
            <strong className="text-purple-800 dark:text-purple-200">Subunit A</strong>
            <p className="text-purple-700 dark:text-purple-300">Chains A, colored blue</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs">
            <strong className="text-green-800 dark:text-green-200">Subunit B</strong>
            <p className="text-green-700 dark:text-green-300">Chains B, colored green</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-xs">
            <strong className="text-amber-800 dark:text-amber-200">Subunit C</strong>
            <p className="text-amber-700 dark:text-amber-300">Chains C, colored yellow</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs">
            <strong className="text-red-800 dark:text-red-200">Subunit D</strong>
            <p className="text-red-700 dark:text-red-300">Chains D, colored red</p>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-secondary-100 dark:bg-secondary-800 p-2 rounded text-xs">
          <Info className="h-4 w-4 text-secondary-500 flex-shrink-0 mt-0.5" />
          <span className="text-secondary-600 dark:text-secondary-400">
            Try rotating the structure to see how the four subunits come together to form the
            functional enzyme.
          </span>
        </div>
      </div>
    ),
    highlight: 'chains',
  },
  {
    id: 'rossmann',
    title: 'Rossmann Fold Domain',
    instruction: 'Identify the NAD-binding Rossmann fold - a common structural motif for nucleotide binding.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          Each LDH subunit contains a <strong>Rossmann fold</strong>, consisting of alternating
          beta-strands and alpha-helices that create a nucleotide-binding pocket.
        </p>
        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Rossmann Fold Features</h4>
          <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
            <li>- Central 6-stranded parallel beta-sheet</li>
            <li>- Flanking alpha-helices on both sides</li>
            <li>- GXGXXG sequence motif for phosphate binding</li>
            <li>- Highly conserved across dehydrogenases</li>
          </ul>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
          <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <span className="text-blue-700 dark:text-blue-300">
            The Rossmann fold is one of the most common protein folds, found in over 50 enzyme families
            that use NAD(P)+/NAD(P)H as cofactors.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'active-site',
    title: 'Active Site Architecture',
    instruction: 'Locate the active site where pyruvate binds and is reduced to lactate.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          The active site is located in a cleft between the NAD-binding domain and the
          substrate-binding domain. Key residues include:
        </p>
        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">Catalytic Residues</h4>
          <ul className="text-xs text-green-700 dark:text-green-300 mt-1 space-y-1">
            <li><strong>His195:</strong> Proton donor/acceptor</li>
            <li><strong>Arg109:</strong> Stabilizes pyruvate carboxyl</li>
            <li><strong>Arg171:</strong> Orients substrate</li>
            <li><strong>Asp168:</strong> Interacts with His195</li>
          </ul>
        </div>
        <div className="bg-secondary-100 dark:bg-secondary-800 p-3 rounded-lg">
          <h4 className="font-semibold text-secondary-800 dark:text-secondary-200 text-sm">Catalytic Mechanism</h4>
          <ol className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 space-y-1">
            <li>1. NAD+ and pyruvate bind to active site</li>
            <li>2. Hydride transfer from NADH C4 to pyruvate C2</li>
            <li>3. Proton from His195 to pyruvate oxygen</li>
            <li>4. L-Lactate and NAD+ released</li>
          </ol>
        </div>
      </div>
    ),
    highlight: 'active-site',
  },
  {
    id: 'regulation',
    title: 'Allosteric Regulation',
    instruction: 'LAB LDH is activated by fructose-1,6-bisphosphate (FBP), coupling fermentation to glycolysis.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          Unlike mammalian LDH, bacterial LDH is regulated by FBP - a key intermediate in glycolysis.
          This ensures lactate production is coupled to glucose availability.
        </p>
        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm">FBP Activation Mechanism</h4>
          <ul className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-1">
            <li>- FBP binds at subunit interfaces</li>
            <li>- Induces conformational change to R-state (active)</li>
            <li>- Increases pyruvate affinity 10-100 fold</li>
            <li>- Without FBP, enzyme is in T-state (less active)</li>
          </ul>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 p-2 rounded text-xs">
          <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span className="text-amber-700 dark:text-amber-300">
            This allosteric regulation is a LAB-specific adaptation that coordinates fermentation
            rate with glycolytic flux.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'importance',
    title: 'Industrial Significance',
    instruction: 'Understand why LDH is critical for yogurt, cheese, and fermented food production.',
    details: (
      <div className="space-y-3">
        <p className="text-secondary-700 dark:text-secondary-300">
          LDH activity directly determines the rate and extent of acid production during fermentation,
          affecting texture, flavor, and preservation of fermented foods.
        </p>
        <div className="grid gap-2">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-3 text-xs">
              <h4 className="font-semibold text-green-800 dark:text-green-200">Yogurt Production</h4>
              <p className="text-green-700 dark:text-green-300">
                LDH from S. thermophilus and L. bulgaricus produces lactic acid that coagulates
                milk proteins, creating yogurt gel structure.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-3 text-xs">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">Cheese Making</h4>
              <p className="text-blue-700 dark:text-blue-300">
                Controlled acid production by LDH affects curd formation, moisture content,
                and final cheese characteristics.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-3 text-xs">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">Biotechnology</h4>
              <p className="text-amber-700 dark:text-amber-300">
                L-lactic acid from LAB LDH is used for biodegradable plastics (PLA)
                and as a food acidulant.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
];

export default function LDHVisualizationTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [viewerReady, setViewerReady] = useState(false);

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const goToNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      handleStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/learn"
          className="inline-flex items-center text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Center
        </Link>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500 rounded-lg text-white">
            <Eye className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Visualizing Lactate Dehydrogenase
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Interactive 3D exploration of the key LAB fermentation enzyme
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="font-mono">PDB: 1LDG</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                15 min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400 mb-2">
          <span>Tutorial Progress</span>
          <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content - Split View */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3D Viewer */}
        <div className="order-2 lg:order-1">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                3D Structure Viewer
              </CardTitle>
              <CardDescription className="text-xs">
                L-Lactate Dehydrogenase (PDB: 1LDG)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] lg:h-[500px]">
                <MolStarViewer
                  pdbId="1LDG"
                  onLoadComplete={() => setViewerReady(true)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Viewer Controls Hint */}
          <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs text-secondary-600 dark:text-secondary-400">
            <strong>Controls:</strong> Left-click + drag to rotate | Scroll to zoom | Right-click + drag to pan
          </div>
        </div>

        {/* Tutorial Steps */}
        <div className="order-1 lg:order-2">
          {/* Step Navigation */}
          <div className="mb-4 flex flex-wrap gap-1">
            {tutorialSteps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                  currentStep === idx
                    ? 'bg-green-500 text-white'
                    : completedSteps.has(idx)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400'
                }`}
              >
                {completedSteps.has(idx) ? <CheckCircle className="h-4 w-4" /> : idx + 1}
              </button>
            ))}
          </div>

          {/* Current Step Content */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                  {currentStep + 1}
                </div>
                <CardTitle className="text-lg">{tutorialSteps[currentStep].title}</CardTitle>
              </div>
              <CardDescription className="text-base font-medium mt-2">
                {tutorialSteps[currentStep].instruction}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tutorialSteps[currentStep].details}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={goToPrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < tutorialSteps.length - 1 ? (
              <Button onClick={goToNext}>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700"
                asChild
              >
                <Link href="/learn">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Tutorial
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Related Content */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Continue Learning</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm">Fermentation Biochemistry Module</h4>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                Deep dive into homofermentative and heterofermentative pathways
              </p>
              <Button variant="ghost" size="sm" className="px-0 mt-2" asChild>
                <Link href="/learn/modules/fermentation-biochemistry">
                  Continue <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm">Explore Related Enzymes</h4>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                View GAPDH (1DC4), Pyruvate Kinase (3OOO), and other fermentation enzymes
              </p>
              <Button variant="ghost" size="sm" className="px-0 mt-2" asChild>
                <Link href="/browse">
                  Browse Structures <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm">Interactive Pathway Explorer</h4>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                See how LDH fits into the complete fermentation pathway
              </p>
              <Button variant="ghost" size="sm" className="px-0 mt-2" asChild>
                <Link href="/learn/tutorials/fermentation-pathway">
                  Explore <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
