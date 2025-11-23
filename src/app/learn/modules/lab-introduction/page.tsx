'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/**
 * Introduction to Lactic Acid Bacteria - Learning Module
 *
 * Scientific content validated against:
 * - Zheng et al. (2020) "A taxonomic note on the genus Lactobacillus" Int J Syst Evol Microbiol
 * - Holzapfel & Wood (2014) "Lactic Acid Bacteria: Biodiversity and Taxonomy"
 * - LPSN (List of Prokaryotic Names with Standing in Nomenclature)
 */

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'overview',
    title: '1. What are Lactic Acid Bacteria?',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          <strong>Lactic Acid Bacteria (LAB)</strong> are a group of Gram-positive, non-spore-forming bacteria
          that produce lactic acid as the major end product of carbohydrate fermentation. This defining metabolic
          trait has made LAB essential to human civilization for thousands of years.
        </p>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Key Characteristics of LAB</h4>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Gram-positive:</strong> Thick peptidoglycan cell wall (20-80nm) that retains crystal violet stain</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Catalase-negative:</strong> Unable to break down hydrogen peroxide (H2O2)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Non-spore-forming:</strong> Unlike Bacillus or Clostridium, LAB do not form endospores</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Microaerophilic to anaerobic:</strong> Grow best with limited or no oxygen</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Acid-tolerant:</strong> Can survive and grow in low pH environments (pH 3.5-6.5)</span>
            </li>
          </ul>
        </div>

        <p className="text-secondary-700 dark:text-secondary-300">
          LAB are found in diverse environments including dairy products, fermented vegetables, meat,
          the gastrointestinal tract of humans and animals, and on plant surfaces. Their ability to
          rapidly acidify their environment through lactic acid production provides a competitive
          advantage and forms the basis of food preservation through fermentation.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">Historical Significance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300">
              Humans have used LAB for food preservation for over 8,000 years, predating written history.
              Archaeological evidence shows fermented dairy in Neolithic pottery from 7000 BCE.
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800 dark:text-purple-200">Modern Applications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-700 dark:text-purple-300">
              Today, LAB are used in probiotics (USD 50+ billion market), food production,
              biopreservation, and as cell factories for producing vitamins and therapeutic proteins.
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: 'taxonomy',
    title: '2. LAB Taxonomy & Classification',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          The taxonomy of LAB underwent a major revision in 2020 when the genus <em>Lactobacillus</em> was
          reclassified into 25 genera based on whole-genome sequence analysis. This reflects our improved
          understanding of evolutionary relationships within this diverse group.
        </p>

        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">2020 Taxonomic Reclassification</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            The former genus <em>Lactobacillus</em> (261 species) was split into 25 genera based on:
          </p>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>- Core genome phylogeny (92 single-copy genes)</li>
            <li>- Average Amino Acid Identity (AAI) analysis</li>
            <li>- clade-specific signature genes</li>
            <li>- Phenotypic characteristics</li>
          </ul>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Major LAB Genera</h4>

        <div className="grid gap-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold"><em>Lactobacillus</em> (sensu stricto)</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    ~35 species including L. acidophilus, L. delbrueckii, L. helveticus. Primarily homofermentative.
                  </p>
                </div>
                <Badge variant="secondary">Core genus</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold"><em>Lacticaseibacillus</em></h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Includes L. casei, L. paracasei, L. rhamnosus. Common in dairy and as probiotics.
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">New genus</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold"><em>Lactiplantibacillus</em></h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Includes L. plantarum, L. pentosus. Found in vegetables, silage, and GI tract.
                  </p>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">New genus</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold"><em>Limosilactobacillus</em></h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Includes L. reuteri, L. fermentum. Heterofermentative, found in GI tract.
                  </p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700">New genus</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold"><em>Lactococcus</em> & <em>Streptococcus</em></h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    L. lactis (cheese), S. thermophilus (yogurt). Coccoid LAB essential for dairy.
                  </p>
                </div>
                <Badge variant="secondary">Cocci</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Morphological Classification</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-secondary-800 dark:text-secondary-200">Rod-shaped (Bacilli)</strong>
              <p className="text-secondary-600 dark:text-secondary-400">
                Lactobacillus, Lacticaseibacillus, Lactiplantibacillus, Limosilactobacillus
              </p>
            </div>
            <div>
              <strong className="text-secondary-800 dark:text-secondary-200">Spherical (Cocci)</strong>
              <p className="text-secondary-600 dark:text-secondary-400">
                Lactococcus, Streptococcus, Enterococcus, Pediococcus, Leuconostoc
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'cell-structure',
    title: '3. Cell Structure & Components',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Understanding LAB cell structure is essential for comprehending their function in fermentation,
          probiotic activity, and host interactions. As Gram-positive bacteria, LAB have a distinctive
          cell envelope that differs significantly from Gram-negative organisms.
        </p>

        <h4 className="font-semibold text-secondary-900 dark:text-white">Cell Envelope Architecture</h4>

        <div className="space-y-3">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                Peptidoglycan Layer (20-80 nm thick)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>
                The thick peptidoglycan (murein) layer provides structural rigidity and osmotic protection.
                It consists of glycan chains (alternating N-acetylglucosamine and N-acetylmuramic acid)
                cross-linked by short peptides.
              </p>
              <p>
                <strong>Function:</strong> Maintains cell shape, resists turgor pressure, anchors surface proteins
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">
                Teichoic Acids (Wall & Lipoteichoic Acids)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <p>
                Anionic polymers of glycerol or ribitol phosphate that constitute up to 50% of cell wall dry weight.
                Wall teichoic acids are covalently linked to peptidoglycan; lipoteichoic acids are anchored in the membrane.
              </p>
              <p>
                <strong>Function:</strong> Ion homeostasis, cell division, adhesion, immunomodulation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
                S-Layer (Surface Layer Proteins)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
              <p>
                Paracrystalline arrays of identical protein subunits covering the entire cell surface.
                Present in many LAB species including L. acidophilus, L. helveticus, and L. crispatus.
              </p>
              <p>
                <strong>Function:</strong> Protection, adhesion to host cells, molecular sieve, shape maintenance
              </p>
              <p className="italic">
                View S-layer protein structure: PDB 3PYW, 3CVH
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800 dark:text-amber-200">
                Exopolysaccharides (EPS)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <p>
                High-molecular-weight polymers secreted by many LAB. Can be homopolysaccharides
                (dextran, mutan) or heteropolysaccharides (complex sugar compositions).
              </p>
              <p>
                <strong>Function:</strong> Protection from desiccation, biofilm formation, texture in fermented foods (yogurt)
              </p>
            </CardContent>
          </Card>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Cell Membrane</h4>
        <p className="text-secondary-700 dark:text-secondary-300">
          The cytoplasmic membrane is a phospholipid bilayer containing various transport proteins,
          enzymes, and signal transduction components. Key features include:
        </p>
        <ul className="list-disc list-inside space-y-1 text-secondary-600 dark:text-secondary-400 text-sm ml-4">
          <li>Lactose permeases for sugar uptake (essential for dairy fermentation)</li>
          <li>ATP-binding cassette (ABC) transporters for nutrients</li>
          <li>Bacteriocin transport systems</li>
          <li>F0F1-ATPase for maintaining proton motive force</li>
          <li>Two-component regulatory systems for environmental sensing</li>
        </ul>

        <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Key Surface Proteins for Probiotic Function</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-300 dark:border-secondary-600">
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Protein</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Function</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">PDB</th>
              </tr>
            </thead>
            <tbody className="text-secondary-600 dark:text-secondary-400">
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">SlpA (S-layer)</td>
                <td className="py-2">Host adhesion, immune modulation</td>
                <td className="py-2 font-mono">3PYW</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">MUB (Mucus-binding)</td>
                <td className="py-2">Gut colonization</td>
                <td className="py-2 font-mono">4A02</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">SpaC (Pilus tip)</td>
                <td className="py-2">Epithelial adhesion</td>
                <td className="py-2 font-mono">3KPT</td>
              </tr>
              <tr>
                <td className="py-2">Sortase A</td>
                <td className="py-2">Surface protein anchoring</td>
                <td className="py-2 font-mono">1T2P</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'fermentation',
    title: '4. Fermentation Types',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          LAB are classified by their fermentation pathways into three groups based on the products
          they generate from glucose metabolism. This distinction has practical implications for
          food production and industrial applications.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-300">Homofermentative</CardTitle>
              <CardDescription>Embden-Meyerhof-Parnas pathway</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-center">
                <span className="font-mono">Glucose &rarr; 2 Lactate + 2 ATP</span>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                &gt;90% of glucose converted to lactic acid. Efficient ATP generation.
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Species:</strong> L. acidophilus, L. delbrueckii, L. helveticus, S. thermophilus
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Uses:</strong> Yogurt, cheese (predictable acidification)
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 dark:text-amber-300">Heterofermentative</CardTitle>
              <CardDescription>Phosphoketolase pathway</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-center">
                <span className="font-mono">Glucose &rarr; Lactate + Ethanol + CO2 + 1 ATP</span>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                Produces CO2, ethanol/acetate in addition to lactate. Lower ATP yield but more versatile.
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Species:</strong> L. reuteri, L. fermentum, Leuconostoc spp.
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Uses:</strong> Sourdough (CO2 for rise), sauerkraut
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700 dark:text-blue-300">Facultative</CardTitle>
              <CardDescription>Both pathways available</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-center">
                <span className="font-mono">Hexoses: Homo | Pentoses: Hetero</span>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">
                Homofermentative on hexoses, can switch to heterofermentation for pentoses.
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Species:</strong> L. plantarum, L. casei, L. rhamnosus
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Uses:</strong> Versatile - vegetables, dairy, silage
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Key Enzymes in LAB Fermentation</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>L-Lactate Dehydrogenase (LDH)</strong><br/>
                Final enzyme converting pyruvate to L-lactate. PDB: 1LDG
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Phosphoketolase</strong><br/>
                Key enzyme for heterofermentation. PDB: 1GPO
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Beta-Galactosidase</strong><br/>
                Lactose hydrolysis for dairy fermentation. PDB: 1JZ8
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Pyruvate Kinase</strong><br/>
                ATP generation in glycolysis. PDB: 3OOO
              </p>
            </div>
          </div>
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

function QuizSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      id: 'q1',
      question: 'What is the primary metabolic end product that defines LAB?',
      options: ['Ethanol', 'Lactic acid', 'Acetic acid', 'Carbon dioxide'],
      correct: 'Lactic acid',
    },
    {
      id: 'q2',
      question: 'Which characteristic is NOT true for LAB?',
      options: ['Gram-positive', 'Catalase-positive', 'Non-spore-forming', 'Acid-tolerant'],
      correct: 'Catalase-positive',
    },
    {
      id: 'q3',
      question: 'How many ATP molecules are generated per glucose in homofermentative LAB?',
      options: ['1 ATP', '2 ATP', '4 ATP', '36 ATP'],
      correct: '2 ATP',
    },
    {
      id: 'q4',
      question: 'Which LAB genus was extensively reclassified in 2020?',
      options: ['Lactococcus', 'Streptococcus', 'Lactobacillus', 'Enterococcus'],
      correct: 'Lactobacillus',
    },
    {
      id: 'q5',
      question: 'What is the function of S-layer proteins in LAB?',
      options: [
        'Energy production',
        'Host adhesion and protection',
        'Lactose digestion',
        'Spore formation',
      ],
      correct: 'Host adhesion and protection',
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
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 80;

    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-lg text-center ${passed ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'}`}>
          <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-amber-600'}`}>
            {score}/{questions.length} ({percentage}%)
          </div>
          <p className={`text-lg ${passed ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {passed ? 'Great job! You have mastered the basics of LAB.' : 'Review the material and try again.'}
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
        Test your understanding of Lactic Acid Bacteria fundamentals. Select the best answer for each question.
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
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

export default function LABIntroductionModule() {
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
          <div className="p-3 bg-blue-500 rounded-lg text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Introduction to Lactic Acid Bacteria
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Fundamental overview of LAB taxonomy, cell structure, and fermentation
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">Beginner</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                20 min
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
                ? 'bg-blue-500 text-white'
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
            onClick={() => {
              handleSectionComplete(sections[currentSection].id);
            }}
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
            <span>Zheng, J. et al. (2020). A taxonomic note on the genus Lactobacillus. <em>Int J Syst Evol Microbiol</em> 70(4):2782-2858</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Holzapfel, W.H. & Wood, B.J.B. (2014). <em>Lactic Acid Bacteria: Biodiversity and Taxonomy</em>. Wiley-Blackwell</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <a href="https://lpsn.dsmz.de" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                LPSN - List of Prokaryotic Names with Standing in Nomenclature
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <a href="https://www.rcsb.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                RCSB Protein Data Bank - LAB protein structures
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
