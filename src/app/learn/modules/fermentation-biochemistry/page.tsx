'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, FlaskConical, CheckCircle, Clock, ExternalLink, Zap, Beaker } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetabolicPathway } from '@/components/learning/MetabolicPathway';

/**
 * Fermentation Biochemistry Module
 *
 * Scientific content validated against:
 * - Kandler (1983) "Carbohydrate metabolism in lactic acid bacteria" Antonie van Leeuwenhoek
 * - Axelsson (2004) "Lactic Acid Bacteria: Classification and Physiology"
 * - KEGG pathway database for LAB metabolism
 */

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'overview',
    title: '1. Fermentation Fundamentals',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          <strong>Fermentation</strong> is an anaerobic metabolic process that converts sugars to acids, gases,
          or alcohol without using oxygen as a terminal electron acceptor. In LAB, fermentation serves two
          critical purposes: energy generation (ATP) and regeneration of NAD+ for continued glycolysis.
        </p>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Why LAB Ferment</h4>
          <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>ATP Production:</strong> Substrate-level phosphorylation generates 2 ATP per glucose in homofermentation</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>NAD+ Regeneration:</strong> LDH reduces pyruvate to lactate, oxidizing NADH back to NAD+</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Competitive Advantage:</strong> Rapid acidification inhibits competing microorganisms</span>
            </li>
          </ul>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">The Central Role of Pyruvate</h4>
        <p className="text-secondary-700 dark:text-secondary-300">
          Pyruvate is the metabolic branch point in LAB. The fate of pyruvate determines:
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Homofermentative Path</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 dark:text-blue-300">
              <div className="font-mono text-center p-2 bg-blue-100 dark:bg-blue-900 rounded mb-2">
                Pyruvate + NADH &rarr; L-Lactate + NAD+
              </div>
              <p>Catalyzed by <strong>L-Lactate Dehydrogenase (LDH)</strong></p>
              <p className="text-xs mt-1">PDB: 1LDG (L. delbrueckii)</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800 dark:text-amber-200">Heterofermentative Path</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300">
              <div className="font-mono text-center p-2 bg-amber-100 dark:bg-amber-900 rounded mb-2">
                Pyruvate &rarr; Acetyl-CoA &rarr; Ethanol or Acetate
              </div>
              <p>Additional products from pentose phosphate pathway</p>
              <p className="text-xs mt-1">Key enzyme: Phosphoketolase (PDB: 1GPO)</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Key Metabolic Comparison</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-300 dark:border-secondary-600">
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Feature</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Homofermentative</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Heterofermentative</th>
              </tr>
            </thead>
            <tbody className="text-secondary-600 dark:text-secondary-400">
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">Pathway</td>
                <td className="py-2">EMP (glycolysis)</td>
                <td className="py-2">Pentose Phosphate + PK</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">ATP yield</td>
                <td className="py-2">2 per glucose</td>
                <td className="py-2">1 per glucose</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">Products</td>
                <td className="py-2">Lactate only (&gt;90%)</td>
                <td className="py-2">Lactate + CO2 + Ethanol/Acetate</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">CO2 production</td>
                <td className="py-2">None</td>
                <td className="py-2">1 per glucose</td>
              </tr>
              <tr>
                <td className="py-2">Key enzyme</td>
                <td className="py-2">Aldolase</td>
                <td className="py-2">Phosphoketolase</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'homofermentative',
    title: '2. Homofermentative Pathway (EMP)',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          The <strong>Embden-Meyerhof-Parnas (EMP) pathway</strong>, commonly known as glycolysis, is the
          primary route for glucose catabolism in homofermentative LAB. This pathway converts one molecule
          of glucose into two molecules of pyruvate, which are then reduced to lactic acid.
        </p>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Net Reaction</h4>
          <div className="font-mono text-center p-3 bg-green-100 dark:bg-green-900 rounded text-green-800 dark:text-green-200">
            Glucose + 2 ADP + 2 Pi &rarr; 2 L-Lactate + 2 ATP
          </div>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">The Three Phases of Glycolysis</h4>

        <div className="space-y-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-700 dark:text-red-300">Phase 1: Energy Investment</CardTitle>
              <CardDescription>ATP consumed to phosphorylate glucose</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid md:grid-cols-2 gap-2">
                <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                  <strong>Step 1:</strong> Glucose &rarr; Glucose-6-P<br/>
                  <span className="text-xs">Hexokinase (-1 ATP)</span>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                  <strong>Step 3:</strong> Fructose-6-P &rarr; Fructose-1,6-BP<br/>
                  <span className="text-xs">Phosphofructokinase (-1 ATP)</span>
                </div>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Total:</strong> -2 ATP invested per glucose
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-purple-700 dark:text-purple-300">Phase 2: Cleavage</CardTitle>
              <CardDescription>6-carbon sugar split into two 3-carbon units</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
                <strong>Step 4:</strong> Fructose-1,6-BP &rarr; DHAP + Glyceraldehyde-3-P<br/>
                <span className="text-xs">Aldolase (key distinguishing enzyme)</span>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                From this point, reactions occur twice (for each 3-carbon unit)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-300">Phase 3: Energy Payoff</CardTitle>
              <CardDescription>ATP generated by substrate-level phosphorylation</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid md:grid-cols-2 gap-2">
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <strong>Step 5:</strong> G3P &rarr; 1,3-BPG<br/>
                  <span className="text-xs">GAPDH (NAD+ &rarr; NADH)</span><br/>
                  <span className="text-xs font-mono">PDB: 1DC4</span>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <strong>Step 6:</strong> 1,3-BPG &rarr; 3-PG<br/>
                  <span className="text-xs">PGK (+2 ATP total)</span>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <strong>Step 9:</strong> PEP &rarr; Pyruvate<br/>
                  <span className="text-xs">Pyruvate kinase (+2 ATP)</span><br/>
                  <span className="text-xs font-mono">PDB: 3OOO</span>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <strong>Step 10:</strong> Pyruvate &rarr; Lactate<br/>
                  <span className="text-xs">LDH (NADH &rarr; NAD+)</span><br/>
                  <span className="text-xs font-mono">PDB: 1LDG</span>
                </div>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Total:</strong> +4 ATP generated, <strong>Net:</strong> +2 ATP per glucose
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Why NAD+ Regeneration Matters</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            GAPDH (Step 5) requires NAD+ to oxidize glyceraldehyde-3-phosphate. Without NAD+ regeneration,
            glycolysis would stop. LDH solves this by reducing pyruvate to lactate, regenerating NAD+ and
            allowing glycolysis to continue indefinitely under anaerobic conditions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'heterofermentative',
    title: '3. Heterofermentative Pathway',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          The <strong>Phosphoketolase (PK) pathway</strong> is used by obligately heterofermentative LAB.
          It differs from glycolysis in that glucose is first oxidized via the pentose phosphate pathway,
          producing CO2 before being cleaved by phosphoketolase.
        </p>

        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Net Reaction</h4>
          <div className="font-mono text-center p-3 bg-amber-100 dark:bg-amber-900 rounded text-amber-800 dark:text-amber-200">
            Glucose &rarr; Lactate + Ethanol (or Acetate) + CO2 + 1 ATP
          </div>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Key Steps in Heterofermentation</h4>

        <div className="space-y-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">1. Glucose-6-P Oxidation</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    G6P dehydrogenase oxidizes glucose-6-phosphate to 6-phosphogluconate, producing NADPH.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">2. Decarboxylation (CO2 Release)</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    6-phosphogluconate dehydrogenase decarboxylates to ribulose-5-P, releasing CO2.
                    This is why heterofermentative LAB produce bubbles in fermented products.
                  </p>
                </div>
                <Badge variant="secondary">CO2</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">3. Phosphoketolase Cleavage</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Xylulose-5-P is cleaved by <strong>phosphoketolase</strong> (PDB: 1GPO) into
                    glyceraldehyde-3-P and acetyl-phosphate. This is the defining enzyme of heterofermentation.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">1GPO</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">4. Two Product Branches</h5>
                  <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
                      <strong>G3P branch:</strong><br/>
                      G3P &rarr; Pyruvate &rarr; Lactate<br/>
                      (+2 ATP, uses glycolysis enzymes)
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
                      <strong>Acetyl-P branch:</strong><br/>
                      Acetyl-P &rarr; Ethanol or Acetate<br/>
                      (NAD+ regeneration or +1 ATP)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 mt-4">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">The Ethanol vs Acetate Decision</h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
            Heterofermentative LAB face a metabolic choice at acetyl-phosphate:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li><strong>Ethanol route:</strong> Regenerates NAD+ but produces no ATP</li>
            <li><strong>Acetate route:</strong> Produces ATP but does not regenerate NAD+</li>
          </ul>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2">
            The balance depends on growth conditions and the need for NAD+ vs ATP.
          </p>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Practical Implications</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">Sourdough Bread</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300">
              CO2 from heterofermentation contributes to dough rise. Acetate/ethanol add flavor complexity.
              L. fermentum and L. brevis are common sourdough LAB.
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800 dark:text-purple-200">Sauerkraut</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-700 dark:text-purple-300">
              Bubbling during fermentation indicates heterofermentative activity.
              Leuconostoc mesenteroides initiates fermentation with CO2 production.
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: 'interactive',
    title: '4. Interactive Pathway Explorer',
    content: <InteractivePathwaySection />,
  },
  {
    id: 'quiz',
    title: '5. Knowledge Check',
    content: <QuizSection />,
  },
];

function InteractivePathwaySection() {
  const router = useRouter();

  const handleProteinClick = (pdbId: string) => {
    router.push(`/viewer?pdbId=${pdbId}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-secondary-700 dark:text-secondary-300">
        Use the interactive pathway visualization below to explore the metabolic reactions in detail.
        Click on enzymes with PDB structures to view their 3D structures in the molecular viewer.
      </p>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
        <div className="flex items-start gap-2">
          <Beaker className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">How to Use</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>- Select a pathway type from the dropdown menu</li>
              <li>- Green-bordered enzymes have available 3D structures</li>
              <li>- Click on an enzyme to view its structure in the molecular viewer</li>
              <li>- Hover over components for additional information</li>
            </ul>
          </div>
        </div>
      </div>

      <MetabolicPathway onProteinClick={handleProteinClick} />
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
      question: 'How many ATP molecules are produced per glucose in homofermentation?',
      options: ['1 ATP', '2 ATP', '4 ATP', '38 ATP'],
      correct: '2 ATP',
    },
    {
      id: 'q2',
      question: 'Which enzyme distinguishes heterofermentative from homofermentative LAB?',
      options: ['Lactate dehydrogenase', 'Phosphoketolase', 'Aldolase', 'Pyruvate kinase'],
      correct: 'Phosphoketolase',
    },
    {
      id: 'q3',
      question: 'What is the primary function of LDH in LAB fermentation?',
      options: [
        'ATP generation',
        'CO2 production',
        'NAD+ regeneration',
        'Glucose phosphorylation',
      ],
      correct: 'NAD+ regeneration',
    },
    {
      id: 'q4',
      question: 'Which product is unique to heterofermentation?',
      options: ['Lactate', 'ATP', 'CO2', 'Pyruvate'],
      correct: 'CO2',
    },
    {
      id: 'q5',
      question: 'In the homofermentative pathway, which enzyme cleaves fructose-1,6-bisphosphate?',
      options: ['Phosphoketolase', 'Aldolase', 'Hexokinase', 'Enolase'],
      correct: 'Aldolase',
    },
    {
      id: 'q6',
      question: 'Why do heterofermentative LAB produce ethanol or acetate from acetyl-phosphate?',
      options: [
        'To generate ATP',
        'To produce flavor compounds',
        'To regenerate NAD+ or gain ATP',
        'To reduce pH',
      ],
      correct: 'To regenerate NAD+ or gain ATP',
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
            {passed ? 'Excellent! You understand LAB fermentation biochemistry.' : 'Review the pathway details and try again.'}
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isCorrect = answers[q.id] === q.correct;
            return (
              <Card key={q.id} className={isCorrect ? 'border-green-300' : 'border-red-300'}>
                <CardContent className="pt-4">
                  <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                  <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    Your answer: {answers[q.id] || 'Not answered'}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-600">Correct answer: {q.correct}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={handleRetry} className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-secondary-700 dark:text-secondary-300">
        Test your understanding of LAB fermentation biochemistry.
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
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
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

export default function FermentationBiochemistryModule() {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

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
          <div className="p-3 bg-green-500 rounded-lg text-white">
            <FlaskConical className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Fermentation Biochemistry
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Homofermentative and heterofermentative pathways in LAB metabolism
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Intermediate</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                45 min
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
                ? 'bg-green-500 text-white'
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
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentSection === 0}
        >
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
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">References & Further Reading</h3>
        <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Kandler, O. (1983). Carbohydrate metabolism in lactic acid bacteria. <em>Antonie van Leeuwenhoek</em> 49:209-224</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Axelsson, L. (2004). Lactic Acid Bacteria: Classification and Physiology. In <em>Lactic Acid Bacteria</em>, Marcel Dekker</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <a href="https://www.genome.jp/kegg/pathway.html" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                KEGG Pathway Database - Glycolysis/Gluconeogenesis
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <a href="https://www.rcsb.org/structure/1LDG" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                PDB 1LDG - L-Lactate Dehydrogenase structure
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
