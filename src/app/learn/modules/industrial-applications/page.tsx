'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Factory, CheckCircle, Clock, ExternalLink, Milk, Pill, Shield, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * Industrial Applications of LAB - Learning Module
 *
 * Scientific content validated against:
 * - Hansen (2002) "Commercial bacterial starter cultures for fermented dairy products"
 * - Hill et al. (2018) "The International Scientific Association for Probiotics and Prebiotics consensus statement"
 * - Leroy & De Vuyst (2004) "Lactic acid bacteria as functional starter cultures"
 */

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'overview',
    title: '1. LAB in Industry: Global Impact',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Lactic Acid Bacteria are the workhorses of the global food and biotechnology industries,
          with applications spanning from traditional fermented foods to cutting-edge probiotic therapies
          and biopreservation technologies. The LAB industry is valued at over <strong>$70 billion USD</strong> annually.
        </p>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Key Industrial Sectors</h4>
          <div className="grid md:grid-cols-3 gap-3 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-start gap-2">
              <Milk className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Dairy:</strong> $45B+ (yogurt, cheese, kefir)</span>
            </div>
            <div className="flex items-start gap-2">
              <Pill className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Probiotics:</strong> $50B+ (supplements, functional foods)</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Biopreservation:</strong> $2B+ (natural antimicrobials)</span>
            </div>
          </div>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Industrial Applications Overview</h4>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">Food Fermentation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>• Dairy products (yogurt, cheese, buttermilk)</p>
              <p>• Vegetable fermentation (sauerkraut, kimchi)</p>
              <p>• Meat fermentation (salami, sausages)</p>
              <p>• Sourdough bread and baked goods</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800 dark:text-purple-200">Health & Pharmaceuticals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <p>• Probiotic supplements (capsules, powders)</p>
              <p>• Functional foods with health claims</p>
              <p>• Therapeutic applications (IBS, allergies)</p>
              <p>• Vaccine delivery vehicles (research)</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800 dark:text-amber-200">Biopreservation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <p>• Bacteriocin production (nisin, pediocin)</p>
              <p>• Organic acid preservation</p>
              <p>• Competitive exclusion of pathogens</p>
              <p>• Extended shelf life without chemicals</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-800 dark:text-red-200">Biotechnology</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <p>• Lactic acid production (bioplastics precursor)</p>
              <p>• Vitamin synthesis (riboflavin, folate)</p>
              <p>• Exopolysaccharide production (texturizers)</p>
              <p>• Metabolic engineering platforms</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Global Production Scale</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-300 dark:border-secondary-600">
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Product</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Annual Production</th>
                <th className="text-left py-2 text-secondary-800 dark:text-secondary-200">Key LAB Species</th>
              </tr>
            </thead>
            <tbody className="text-secondary-600 dark:text-secondary-400">
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">Yogurt</td>
                <td className="py-2">~75 million metric tons</td>
                <td className="py-2 italic">S. thermophilus, L. delbrueckii</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">Cheese</td>
                <td className="py-2">~23 million metric tons</td>
                <td className="py-2 italic">L. lactis, L. helveticus</td>
              </tr>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <td className="py-2">Probiotics</td>
                <td className="py-2">$50+ billion market</td>
                <td className="py-2 italic">L. acidophilus, B. bifidum</td>
              </tr>
              <tr>
                <td className="py-2">Lactic Acid</td>
                <td className="py-2">~1 million metric tons</td>
                <td className="py-2 italic">L. delbrueckii, L. bulgaricus</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'dairy',
    title: '2. Dairy Fermentation',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Dairy fermentation is the largest industrial application of LAB, with starter cultures being
          carefully selected and maintained for consistent product quality, flavor development, and safety.
        </p>

        <h4 className="font-semibold text-secondary-900 dark:text-white">Yogurt Production</h4>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Industrial Yogurt Starter Culture</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300">
            <div>
              <strong className="block mb-1">Streptococcus thermophilus</strong>
              <p className="text-xs">• Fast acid producer (pH drops quickly)</p>
              <p className="text-xs">• Produces acetaldehyde (yogurt flavor)</p>
              <p className="text-xs">• Hydrolyzes lactose efficiently</p>
            </div>
            <div>
              <strong className="block mb-1">Lactobacillus delbrueckii subsp. bulgaricus</strong>
              <p className="text-xs">• Slow acid producer (final pH control)</p>
              <p className="text-xs">• Proteolytic (releases peptides)</p>
              <p className="text-xs">• Contributes to texture and aroma</p>
            </div>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-3">
            <strong>Symbiotic relationship:</strong> S. thermophilus produces formic acid and CO2, stimulating
            L. bulgaricus growth. L. bulgaricus proteolysis releases amino acids used by S. thermophilus.
          </p>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Cheese Manufacturing</h4>

        <div className="space-y-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">Cheddar Cheese</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Starter:</strong> <em>Lactococcus lactis</em> subsp. <em>lactis</em> and <em>cremoris</em>
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Function: Rapid acidification, flavor development during aging (12+ months)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">Swiss/Emmental Cheese</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Starter:</strong> <em>S. thermophilus</em>, <em>L. helveticus</em>, <em>Propionibacterium freudenreichii</em>
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Function: LAB acidify, Propionibacteria produce CO2 (holes) and propionic acid (nutty flavor)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">Mozzarella Cheese</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Starter:</strong> <em>S. thermophilus</em>, <em>L. delbrueckii</em>
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Function: Rapid acid development for curd formation, minimal aging required
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Critical Process Parameters</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <p><strong>Temperature control:</strong> 40-45°C (yogurt), 30-35°C (cheese)</p>
              <p><strong>Inoculation rate:</strong> 1-3% starter culture by volume</p>
              <p><strong>pH monitoring:</strong> Target pH 4.5-4.6 (yogurt), 5.1-5.3 (cheese curd)</p>
            </div>
            <div>
              <p><strong>Incubation time:</strong> 4-6 hours (yogurt), 6-12 hours (cheese)</p>
              <p><strong>Pasteurization:</strong> 85°C for 30 min (eliminate competing microbes)</p>
              <p><strong>Quality control:</strong> Microscopy, plate counts, pH, titratable acidity</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'probiotics',
    title: '3. Probiotics Manufacturing',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Probiotics are live microorganisms that confer health benefits when consumed in adequate amounts.
          Industrial production requires specialized processes to ensure high viability, stability, and efficacy.
        </p>

        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Most Common Probiotic Strains</h4>
          <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong><em>Lactobacillus acidophilus</em>:</strong> Gut colonization, lactose digestion</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong><em>Lacticaseibacillus rhamnosus GG</em>:</strong> Most studied strain, prevents diarrhea</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong><em>Bifidobacterium bifidum</em>:</strong> Infant gut health, immune modulation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong><em>Lactiplantibacillus plantarum</em>:</strong> Versatile, survives gastric acid</span>
            </li>
          </ul>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Industrial Production Process</h4>

        <div className="space-y-3">
          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-300">1. Fermentation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-secondary-600 dark:text-secondary-400">
                Large-scale bioreactors (1000-10,000 L) with controlled pH, temperature, and nutrients
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Growth conditions:</strong> Anaerobic, 37°C, pH 6.5, complex media with yeast extract
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Cell density target:</strong> 10⁹-10¹⁰ CFU/mL (colony forming units)
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700 dark:text-blue-300">2. Harvesting & Concentration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-secondary-600 dark:text-secondary-400">
                Centrifugation (8000-10,000 rpm) to collect biomass and remove spent media
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                Washing with cryoprotectant solution (skim milk, glycerol, trehalose)
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-purple-700 dark:text-purple-300">3. Preservation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Freeze-drying (lyophilization):</strong> Sublimation of ice under vacuum, ~90% viability retention
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Spray drying:</strong> Faster, cheaper, but only ~50-70% viability
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Microencapsulation:</strong> Cells embedded in alginate/chitosan beads for gastric protection
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 dark:text-amber-300">4. Formulation & Packaging</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-secondary-600 dark:text-secondary-400">
                Blending with excipients, prebiotics (inulin, FOS), and stabilizers
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                Capsule filling (enteric-coated for acid protection) or sachet packaging
              </p>
              <p className="text-secondary-600 dark:text-secondary-400">
                <strong>Labeling requirement:</strong> Minimum 10⁹ CFU per dose at end of shelf life
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 mt-4">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Quality Control Challenges</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>• <strong>Viability loss during storage:</strong> Temperature, moisture, oxygen exposure</li>
            <li>• <strong>Strain identification:</strong> Genomic sequencing required for regulatory compliance</li>
            <li>• <strong>Shelf life:</strong> Typically 12-24 months at 4°C for most formulations</li>
            <li>• <strong>Gastric survival:</strong> Must survive pH 2-3 in stomach to reach intestines</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'biopreservation',
    title: '4. Biopreservation & Antimicrobials',
    content: (
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          LAB produce a variety of antimicrobial compounds that can extend shelf life and improve safety
          of foods without chemical preservatives. This "clean label" approach is increasingly demanded by consumers.
        </p>

        <h4 className="font-semibold text-secondary-900 dark:text-white">Bacteriocins: LAB-Produced Antimicrobials</h4>

        <div className="space-y-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-semibold text-green-700 dark:text-green-300">Nisin (Most Widely Used)</h5>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    <strong>Producer:</strong> <em>Lactococcus lactis</em> subsp. <em>lactis</em>
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Mechanism:</strong> Pore formation in bacterial membranes (PDB: 5O3O)
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Applications:</strong> Cheese, canned foods, beverages (FDA approved, E234 in EU)
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Effective against:</strong> Gram-positive bacteria including <em>L. monocytogenes</em>, <em>C. botulinum</em>
                  </p>
                </div>
                <Badge className="ml-2">FDA Approved</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <h5 className="font-semibold text-blue-700 dark:text-blue-300">Pediocin PA-1</h5>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                <strong>Producer:</strong> <em>Pediococcus acidilactici</em>
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                <strong>Applications:</strong> Meat products, ready-to-eat foods
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                <strong>Spectrum:</strong> Anti-Listeria activity in refrigerated foods
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <h5 className="font-semibold text-purple-700 dark:text-purple-300">Class IIa Bacteriocins</h5>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Small, heat-stable peptides with anti-Listeria activity
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Examples: Sakacin P, Curvacin A, Leucocin A
              </p>
            </CardContent>
          </Card>
        </div>

        <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Organic Acid Preservation</h4>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800 dark:text-amber-200">Lactic Acid</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300">
              <p>Primary metabolic product, lowers pH to &lt;4.5</p>
              <p className="mt-1"><strong>Antimicrobial effect:</strong> Undissociated acid permeates cell membranes,
              disrupts proton motive force</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">Acetic Acid</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300">
              <p>Produced by heterofermentative LAB</p>
              <p className="mt-1"><strong>Effect:</strong> More antimicrobial than lactic acid at same pH,
              contributes to flavor in fermented vegetables</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Competitive Exclusion</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            LAB can prevent pathogen growth through nutrient competition, production of H2O2, and
            niche occupation. Used in:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
            <li>• <strong>Poultry farming:</strong> Competitive exclusion cultures reduce <em>Salmonella</em></li>
            <li>• <strong>Silage:</strong> LAB fermentation prevents <em>Clostridium</em> spoilage</li>
            <li>• <strong>Vegetable fermentation:</strong> Rapid LAB growth inhibits mold and yeast</li>
          </ul>
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
      question: 'What is the symbiotic relationship in yogurt starter cultures?',
      options: [
        'S. thermophilus inhibits L. bulgaricus',
        'S. thermophilus provides nutrients, L. bulgaricus produces amino acids',
        'Both compete for lactose',
        'L. bulgaricus produces bacteriocins against S. thermophilus',
      ],
      correct: 'S. thermophilus provides nutrients, L. bulgaricus produces amino acids',
    },
    {
      id: 'q2',
      question: 'What is the minimum viable cell count for probiotic supplements at end of shelf life?',
      options: ['10⁶ CFU/dose', '10⁷ CFU/dose', '10⁹ CFU/dose', '10¹² CFU/dose'],
      correct: '10⁹ CFU/dose',
    },
    {
      id: 'q3',
      question: 'Which bacteriocin is FDA approved and most widely used in food preservation?',
      options: ['Pediocin', 'Nisin', 'Sakacin', 'Lactocin'],
      correct: 'Nisin',
    },
    {
      id: 'q4',
      question: 'What is the primary mechanism of antimicrobial action for lactic acid?',
      options: [
        'Membrane pore formation',
        'DNA damage',
        'Undissociated acid disrupts proton motive force',
        'Enzyme inhibition',
      ],
      correct: 'Undissociated acid disrupts proton motive force',
    },
    {
      id: 'q5',
      question: 'Which preservation method retains the highest viability for probiotic bacteria?',
      options: ['Spray drying', 'Freeze-drying', 'Heat drying', 'Air drying'],
      correct: 'Freeze-drying',
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
            {passed ? 'Great! You understand LAB industrial applications.' : 'Review the material and try again.'}
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
        Test your understanding of LAB industrial applications.
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
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
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

export default function IndustrialApplicationsModule() {
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
          <div className="p-3 bg-amber-500 rounded-lg text-white">
            <Factory className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Industrial Applications of LAB
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Dairy fermentation, probiotics manufacturing, and biopreservation
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Intermediate</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                35 min
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
                ? 'bg-amber-500 text-white'
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
            <span>Hansen, E.B. (2002). Commercial bacterial starter cultures for fermented dairy products. <em>Int Dairy J</em> 12(9):691-696</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Hill, C. et al. (2018). ISAPP consensus statement on probiotics. <em>Nat Rev Gastroenterol Hepatol</em> 11:506-514</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Leroy, F. & De Vuyst, L. (2004). Lactic acid bacteria as functional starter cultures. <em>Trends Food Sci Technol</em> 15:67-78</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <a href="https://www.rcsb.org/structure/5O3O" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                PDB 5O3O - Nisin structure
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
