'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Target, CheckCircle, Clock, ExternalLink, Shield, Crosshair, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * Bacteriocins & Antimicrobial Peptides Module
 *
 * Scientific content validated against:
 * - Cotter et al. (2013) "Bacteriocins - a viable alternative to antibiotics?" Nature Reviews Microbiology
 * - Alvarez-Sieiro et al. (2016) "Bacteriocins of lactic acid bacteria" Critical Reviews in Food Science
 * - PDB structures: 5O3O (Nisin), 5LV3 (Pediocin-like)
 */

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function BacteriocinsModule() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const sections: Section[] = [
    {
      id: 'overview',
      title: '1. What are Bacteriocins?',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            <strong>Bacteriocins</strong> are ribosomally synthesized antimicrobial peptides produced by bacteria
            to kill or inhibit closely related species. LAB bacteriocins are particularly important for food
            safety and have potential as natural alternatives to chemical preservatives and antibiotics.
          </p>

          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Key Features of LAB Bacteriocins</h4>
            <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>GRAS Status:</strong> Generally Recognized as Safe for food applications</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Narrow Spectrum:</strong> Target specific bacteria without disrupting entire microbiomes</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Heat Stable:</strong> Many survive pasteurization and cooking temperatures</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Protease Sensitive:</strong> Degraded by digestive enzymes - safe for consumption</span>
              </li>
            </ul>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Bacteriocin vs Antibiotic</h4>
          <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-300 dark:border-secondary-600">
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Feature</th>
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Bacteriocins</th>
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Antibiotics</th>
                </tr>
              </thead>
              <tbody className="text-secondary-600 dark:text-secondary-400">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">Synthesis</td>
                  <td className="py-2">Ribosomal</td>
                  <td className="py-2">Non-ribosomal (secondary metabolites)</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">Spectrum</td>
                  <td className="py-2">Usually narrow (related species)</td>
                  <td className="py-2">Often broad</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">Resistance</td>
                  <td className="py-2">Develops slowly</td>
                  <td className="py-2">Common problem</td>
                </tr>
                <tr>
                  <td className="py-2">Food use</td>
                  <td className="py-2">Approved (nisin E234)</td>
                  <td className="py-2">Generally prohibited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'classification',
      title: '2. Classification of LAB Bacteriocins',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            LAB bacteriocins are classified based on their structure, post-translational modifications,
            and mechanism of action. The current classification includes four major classes.
          </p>

          <div className="space-y-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base text-amber-700 dark:text-amber-300">Class I: Lantibiotics</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">PDB: 5O3O</Badge>
                </div>
                <CardDescription>Post-translationally modified peptides with lanthionine bridges</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-secondary-600 dark:text-secondary-400">
                  Lantibiotics contain unusual amino acids (lanthionine, methyllanthionine) formed by
                  enzymatic dehydration and thioether bridge formation. These modifications create
                  rigid ring structures essential for activity.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded">
                  <strong>Nisin (the gold standard):</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>- 34 amino acids, 5 lanthionine rings</li>
                    <li>- Produced by Lactococcus lactis</li>
                    <li>- FDA/EU approved (E234)</li>
                    <li>- Effective against Listeria, Clostridium, Staphylococcus</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/viewer?pdbId=5O3O')}
                  className="mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Nisin Structure (5O3O)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base text-blue-700 dark:text-blue-300">Class IIa: Pediocin-like</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">PDB: 5LV3</Badge>
                </div>
                <CardDescription>Anti-Listeria peptides with YGNGV consensus sequence</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-secondary-600 dark:text-secondary-400">
                  The most abundant class of LAB bacteriocins. Characterized by an N-terminal
                  YGNGV/YGNGL motif and a C-terminal disulfide bridge. Highly active against Listeria.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <strong>Examples:</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>- <strong>Pediocin PA-1:</strong> Pediococcus acidilactici (anti-Listeria)</li>
                    <li>- <strong>Sakacin A:</strong> Latilactobacillus sakei</li>
                    <li>- <strong>Leucocin A:</strong> Leuconostoc gelidum</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/viewer?pdbId=5LV3')}
                  className="mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Pediocin-like Structure (5LV3)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-700 dark:text-green-300">Class IIb: Two-peptide Bacteriocins</CardTitle>
                <CardDescription>Require two peptides for full activity</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-secondary-600 dark:text-secondary-400">
                  These bacteriocins consist of two peptides that must work together for
                  antimicrobial activity. Neither peptide is fully active alone.
                </p>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                  <strong>Examples:</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>- <strong>Lactococcin G:</strong> Forms alpha-beta complex</li>
                    <li>- <strong>Plantaricin EF:</strong> Lactiplantibacillus plantarum</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-purple-700 dark:text-purple-300">Class IIc: Circular Bacteriocins</CardTitle>
                <CardDescription>Head-to-tail cyclized peptides</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-secondary-600 dark:text-secondary-400">
                  Circular bacteriocins have their N and C termini covalently joined,
                  creating exceptional stability against proteases and heat.
                </p>
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded">
                  <strong>Examples:</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>- <strong>Gassericin A:</strong> Lactobacillus gasseri</li>
                    <li>- <strong>Enterocin AS-48:</strong> Enterococcus faecalis</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'mechanism',
      title: '3. Mechanisms of Action',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            LAB bacteriocins kill target cells primarily by disrupting membrane integrity. The specific
            mechanism varies by bacteriocin class and structure.
          </p>

          <h4 className="font-semibold text-secondary-900 dark:text-white">Nisin Mechanism (Class I Lantibiotic)</h4>
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200">1</div>
                <div>
                  <h5 className="font-semibold text-amber-800 dark:text-amber-200">Lipid II Binding</h5>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Nisin binds to Lipid II, the essential precursor for peptidoglycan synthesis.
                    This alone inhibits cell wall synthesis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200">2</div>
                <div>
                  <h5 className="font-semibold text-amber-800 dark:text-amber-200">Pore Formation</h5>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    The nisin-Lipid II complex oligomerizes, forming transmembrane pores (~2 nm diameter).
                    Eight nisin molecules + four Lipid II molecules per pore.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200">3</div>
                <div>
                  <h5 className="font-semibold text-amber-800 dark:text-amber-200">Cell Death</h5>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Pores cause rapid efflux of ions, ATP, and amino acids. Loss of proton motive force
                    leads to immediate cell death.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white">Class IIa (Pediocin-like) Mechanism</h4>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-800 dark:text-blue-200">1</div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200">Receptor Recognition</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The YGNGV motif recognizes Man-PTS (mannose phosphotransferase system) on target cells.
                    This explains their specificity against Listeria.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-800 dark:text-blue-200">2</div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200">Membrane Insertion</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The hydrophobic C-terminal hairpin inserts into the membrane upon receptor binding.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-800 dark:text-blue-200">3</div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200">Membrane Disruption</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Creates ion-permeable channels leading to cell death via PMF dissipation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Producer Self-Protection</h4>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Bacteriocin-producing cells protect themselves through dedicated <strong>immunity proteins</strong>:
            </p>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>- <strong>NisI:</strong> Lipoprotein that sequesters nisin at the membrane</li>
              <li>- <strong>NisFEG:</strong> ABC transporter that exports nisin from the membrane</li>
              <li>- <strong>Class IIa immunity:</strong> Blocks receptor-mediated pore formation</li>
            </ul>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 italic">
              View immunity protein structure: PDB 2N44
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'applications',
      title: '4. Food Safety Applications',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            LAB bacteriocins, particularly nisin, are increasingly important for ensuring food safety
            and extending shelf life. Their natural origin and GRAS status make them attractive
            alternatives to chemical preservatives.
          </p>

          <h4 className="font-semibold text-secondary-900 dark:text-white">Nisin in Food Preservation</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-800 dark:text-green-200">Approved Applications</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <ul>
                  <li>- Processed cheese (prevents Clostridium)</li>
                  <li>- Canned vegetables</li>
                  <li>- Liquid egg products</li>
                  <li>- Pasteurized dairy desserts</li>
                  <li>- Beer (prevents spoilage LAB)</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Regulatory Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <ul>
                  <li>- <strong>FDA:</strong> GRAS since 1988</li>
                  <li>- <strong>EU:</strong> E234 food additive</li>
                  <li>- <strong>WHO/FAO:</strong> No ADI restrictions</li>
                  <li>- Approved in &gt;50 countries</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white">Control of Foodborne Pathogens</h4>
          <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-300 dark:border-secondary-600">
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Pathogen</th>
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Effective Bacteriocin</th>
                  <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Application</th>
                </tr>
              </thead>
              <tbody className="text-secondary-600 dark:text-secondary-400">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2"><em>Listeria monocytogenes</em></td>
                  <td className="py-2">Pediocin PA-1, Nisin</td>
                  <td className="py-2">Ready-to-eat meats, dairy</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2"><em>Clostridium botulinum</em></td>
                  <td className="py-2">Nisin</td>
                  <td className="py-2">Canned foods, cheese</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2"><em>Staphylococcus aureus</em></td>
                  <td className="py-2">Nisin</td>
                  <td className="py-2">Dairy products</td>
                </tr>
                <tr>
                  <td className="py-2"><em>Bacillus cereus</em></td>
                  <td className="py-2">Nisin, Enterocins</td>
                  <td className="py-2">Rice products, sauces</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Emerging Applications</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200">Medical Uses</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-secondary-600 dark:text-secondary-400">
                <ul className="space-y-1">
                  <li>- Mastitis treatment in cattle</li>
                  <li>- Skin infection therapy</li>
                  <li>- Potential antibiotic alternatives</li>
                  <li>- Biofilm disruption</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800 dark:text-amber-200">Novel Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-secondary-600 dark:text-secondary-400">
                <ul className="space-y-1">
                  <li>- Active packaging films</li>
                  <li>- Nanoparticle encapsulation</li>
                  <li>- Bacteriocin-producing probiotics</li>
                  <li>- Edible coatings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'quiz',
      title: '5. Knowledge Check',
      content: <QuizSection />,
    },
  ];

  const progress = (completedSections.size / sections.length) * 100;

  const handleSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const goToNext = () => {
    if (currentSection < sections.length - 1) {
      handleSectionComplete(sections[currentSection].id);
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
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
          <div className="p-3 bg-red-500 rounded-lg text-white">
            <Target className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Bacteriocins & Antimicrobial Peptides
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              LAB-produced natural antibiotics for food safety and beyond
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Intermediate</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                40 min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Section Navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(idx)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              currentSection === idx
                ? 'bg-red-500 text-white'
                : completedSections.has(section.id)
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400'
            }`}
          >
            {completedSections.has(section.id) && <CheckCircle className="h-3 w-3 inline mr-1" />}
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{sections[currentSection].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {sections[currentSection].content}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrev} disabled={currentSection === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentSection < sections.length - 1 ? (
          <Button onClick={goToNext}>
            Next Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => handleSectionComplete(sections[currentSection].id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Module
          </Button>
        )}
      </div>

      {/* References */}
      <div className="mt-12 p-6 bg-secondary-50 dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">References</h3>
        <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Cotter, P.D. et al. (2013). Bacteriocins - a viable alternative to antibiotics? <em>Nat Rev Microbiol</em> 11:95-105</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Alvarez-Sieiro, P. et al. (2016). Bacteriocins of lactic acid bacteria. <em>Crit Rev Food Sci</em> 56:1262-1277</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <a href="https://www.rcsb.org/structure/5O3O" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              PDB 5O3O - Nisin A structure
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function QuizSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      id: 'q1',
      question: 'What food additive number is nisin assigned in the EU?',
      options: ['E200', 'E234', 'E300', 'E450'],
      correct: 'E234',
    },
    {
      id: 'q2',
      question: 'What is the primary target of nisin in bacterial cells?',
      options: ['DNA', 'Ribosomes', 'Lipid II', 'ATP synthase'],
      correct: 'Lipid II',
    },
    {
      id: 'q3',
      question: 'Which bacteriocin class is most effective against Listeria monocytogenes?',
      options: ['Class I (Lantibiotics)', 'Class IIa (Pediocin-like)', 'Class IIb (Two-peptide)', 'Class IV'],
      correct: 'Class IIa (Pediocin-like)',
    },
    {
      id: 'q4',
      question: 'What unusual amino acids are found in lantibiotics?',
      options: ['D-amino acids', 'Lanthionine and methyllanthionine', 'Selenocysteine', 'Hydroxyproline'],
      correct: 'Lanthionine and methyllanthionine',
    },
    {
      id: 'q5',
      question: 'How do bacteriocin-producing cells protect themselves?',
      options: ['Thick cell walls', 'Immunity proteins', 'Spore formation', 'Efflux pumps only'],
      correct: 'Immunity proteins',
    },
  ];

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 80;

    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-lg text-center ${passed ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'}`}>
          <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-amber-600'}`}>
            {score}/{questions.length} ({percentage}%)
          </div>
          <p className={`text-lg ${passed ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {passed ? 'Excellent! You understand bacteriocin biology.' : 'Review the material and try again.'}
          </p>
        </div>

        <Button onClick={handleRetry} className="w-full">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-secondary-700 dark:text-secondary-300">
        Test your understanding of LAB bacteriocins.
      </p>

      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="pt-4">
            <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map(option => (
                <label
                  key={option}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[q.id] === option
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="mr-3"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={Object.keys(answers).length < questions.length}
      >
        Submit Quiz
      </Button>
    </div>
  );
}
