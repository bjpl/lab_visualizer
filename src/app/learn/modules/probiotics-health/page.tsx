'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, CheckCircle, Clock, ExternalLink, Heart, Dna, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * Probiotics & Health Benefits Module
 *
 * Scientific content validated against:
 * - Hill et al. (2014) "Expert consensus document on the definition of probiotics" Nature Reviews
 * - Sanders et al. (2019) "Probiotics and prebiotics in intestinal health and disease"
 * - International Scientific Association for Probiotics and Prebiotics (ISAPP)
 */

export default function ProbioticsHealthModule() {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const sections = [
    {
      id: 'definition',
      title: '1. Defining Probiotics',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            The official FAO/WHO definition of probiotics (2001, updated 2014) states:
          </p>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-purple-800 dark:text-purple-200 font-medium italic">
              &quot;Live microorganisms that, when administered in adequate amounts, confer a health
              benefit on the host.&quot;
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              - Hill et al., Nature Reviews Gastroenterology & Hepatology, 2014
            </p>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Key Requirements for Probiotic Status</h4>
          <div className="grid gap-3">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <strong className="text-green-800 dark:text-green-200">Strain Identification</strong>
                    <p className="text-green-700 dark:text-green-300">
                      Must be identified to genus, species, and strain level (e.g., <em>Lacticaseibacillus
                      rhamnosus</em> GG)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <strong className="text-blue-800 dark:text-blue-200">Demonstrated Benefit</strong>
                    <p className="text-blue-700 dark:text-blue-300">
                      Health benefit must be demonstrated in randomized controlled trials in humans
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-200">Viability</strong>
                    <p className="text-amber-700 dark:text-amber-300">
                      Must contain live organisms at efficacious dose throughout shelf life (typically
                      10^8-10^10 CFU/dose)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'gut-microbiome',
      title: '2. LAB and the Gut Microbiome',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            The human gut harbors approximately 100 trillion microorganisms representing over 1,000 species.
            LAB probiotics interact with this complex ecosystem in multiple ways.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Mechanisms of Probiotic Action</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">Competitive Exclusion</strong>
                  <p className="text-blue-700 dark:text-blue-300">
                    Competing with pathogens for adhesion sites and nutrients
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">2</div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">Antimicrobial Production</strong>
                  <p className="text-blue-700 dark:text-blue-300">
                    Secreting bacteriocins, organic acids, and hydrogen peroxide
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">Barrier Enhancement</strong>
                  <p className="text-blue-700 dark:text-blue-300">
                    Strengthening tight junctions between epithelial cells
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">4</div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">Immune Modulation</strong>
                  <p className="text-blue-700 dark:text-blue-300">
                    Interacting with gut-associated lymphoid tissue (GALT)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">Key Probiotic LAB Strains</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4 text-sm">
                <strong className="text-purple-800 dark:text-purple-200"><em>Lacticaseibacillus rhamnosus</em> GG</strong>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Most studied probiotic strain. Reduces antibiotic-associated diarrhea and acute
                  gastroenteritis in children.
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4 text-sm">
                <strong className="text-green-800 dark:text-green-200"><em>Lactobacillus acidophilus</em> NCFM</strong>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Improves lactose digestion, reduces IBS symptoms, and supports immune function.
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 text-sm">
                <strong className="text-blue-800 dark:text-blue-200"><em>Limosilactobacillus reuteri</em> DSM 17938</strong>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Reduces infant colic duration and produces antimicrobial reuterin.
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4 text-sm">
                <strong className="text-amber-800 dark:text-amber-200"><em>Bifidobacterium lactis</em> BB-12</strong>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Improves immune response to vaccination and reduces infections in infants.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'health-benefits',
      title: '3. Evidence-Based Health Benefits',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            The following health benefits have strong clinical evidence from randomized controlled trials:
          </p>

          <div className="space-y-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-800 dark:text-green-200">
                  Strong Evidence (Grade A)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-700 dark:text-green-300 space-y-2">
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Antibiotic-associated diarrhea:</strong> 50-60% risk reduction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Acute infectious diarrhea:</strong> ~1 day reduction in duration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Infant colic:</strong> Significant reduction in crying time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Necrotizing enterocolitis:</strong> Prevention in preterm infants</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-800 dark:text-blue-200">
                  Moderate Evidence (Grade B)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <ul className="space-y-1">
                  <li>- Irritable bowel syndrome (IBS) symptom relief</li>
                  <li>- Lactose intolerance improvement</li>
                  <li>- Reduction in upper respiratory tract infections</li>
                  <li>- Bacterial vaginosis prevention</li>
                  <li>- Atopic dermatitis prevention in high-risk infants</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-800 dark:text-amber-200">
                  Emerging Research (Under Investigation)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                <ul className="space-y-1">
                  <li>- Gut-brain axis and mental health (psychobiotics)</li>
                  <li>- Metabolic syndrome and obesity</li>
                  <li>- Cancer prevention (especially colorectal)</li>
                  <li>- Cardiovascular health</li>
                  <li>- Neurodegenerative disease prevention</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 mt-4">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Important Considerations</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>- Benefits are strain-specific (not all LAB are probiotics)</li>
              <li>- Dose matters: Most require 10^8-10^10 CFU/day</li>
              <li>- Effects may not persist after discontinuation</li>
              <li>- Immunocompromised individuals should consult healthcare providers</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'molecular',
      title: '4. Molecular Mechanisms of Adhesion',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            Probiotic LAB must adhere to intestinal epithelium to exert their effects. This adhesion
            is mediated by specific surface proteins that can be visualized in 3D.
          </p>

          <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">Key Adhesion Proteins (with PDB IDs)</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-300 dark:border-secondary-600">
                  <th className="text-left py-2">Protein</th>
                  <th className="text-left py-2">Function</th>
                  <th className="text-left py-2">PDB</th>
                </tr>
              </thead>
              <tbody className="text-secondary-600 dark:text-secondary-400">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">SlpA (S-layer)</td>
                  <td className="py-2">Epithelial adhesion, immune modulation</td>
                  <td className="py-2 font-mono">3PYW</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">MUB (Mucus-binding)</td>
                  <td className="py-2">Colonization of mucus layer</td>
                  <td className="py-2 font-mono">4A02</td>
                </tr>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-2">SpaC (Pilus tip)</td>
                  <td className="py-2">Epithelial attachment (LGG)</td>
                  <td className="py-2 font-mono">3KPT</td>
                </tr>
                <tr>
                  <td className="py-2">GAPDH (moonlighting)</td>
                  <td className="py-2">Binds plasminogen on surface</td>
                  <td className="py-2 font-mono">1DC4</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/viewer?pdbId=3PYW">
                View S-layer Protein (3PYW)
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/viewer?pdbId=3KPT">
                View SpaC Pilus Protein (3KPT)
              </Link>
            </Button>
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
      <div className="mb-8">
        <Link href="/learn" className="inline-flex items-center text-sm text-secondary-600 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Center
        </Link>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500 rounded-lg text-white">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Probiotics & Health Benefits
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Evidence-based exploration of LAB probiotic mechanisms and clinical benefits
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">Beginner</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                30 min
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(idx)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              currentSection === idx
                ? 'bg-purple-500 text-white'
                : completedSections.has(section.id)
                ? 'bg-green-100 text-green-700'
                : 'bg-secondary-100 text-secondary-600'
            }`}
          >
            {completedSections.has(section.id) && <CheckCircle className="h-3 w-3 inline mr-1" />}
            {idx + 1}
          </button>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{sections[currentSection].title}</CardTitle>
        </CardHeader>
        <CardContent>{sections[currentSection].content}</CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrev} disabled={currentSection === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        {currentSection < sections.length - 1 ? (
          <Button onClick={goToNext}>Next Section <ArrowRight className="h-4 w-4 ml-2" /></Button>
        ) : (
          <Button onClick={() => handleSectionComplete(sections[currentSection].id)} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" /> Complete Module
          </Button>
        )}
      </div>

      <div className="mt-12 p-6 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">References</h3>
        <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Hill, C. et al. (2014). Expert consensus document: The International Scientific Association for Probiotics and Prebiotics consensus statement on the scope and appropriate use of the term probiotic. <em>Nat Rev Gastroenterol Hepatol</em> 11:506-514</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <a href="https://isappscience.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              International Scientific Association for Probiotics and Prebiotics (ISAPP)
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
      question: 'According to the WHO/FAO definition, probiotics must be:',
      options: ['Dead microorganisms', 'Live microorganisms', 'Purified proteins', 'Any fermented food'],
      correct: 'Live microorganisms',
    },
    {
      id: 'q2',
      question: 'Which strain is the most studied probiotic in clinical trials?',
      options: ['L. acidophilus NCFM', 'L. rhamnosus GG', 'B. lactis BB-12', 'L. reuteri DSM 17938'],
      correct: 'L. rhamnosus GG',
    },
    {
      id: 'q3',
      question: 'Which condition has the strongest evidence for probiotic effectiveness?',
      options: ['Weight loss', 'Antibiotic-associated diarrhea', 'Cancer prevention', 'Heart disease'],
      correct: 'Antibiotic-associated diarrhea',
    },
    {
      id: 'q4',
      question: 'What is the typical efficacious dose for most probiotics?',
      options: ['10^3 CFU/day', '10^5 CFU/day', '10^8-10^10 CFU/day', '10^15 CFU/day'],
      correct: '10^8-10^10 CFU/day',
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

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-lg text-center ${percentage >= 75 ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className={`text-4xl font-bold mb-2 ${percentage >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
            {score}/{questions.length} ({percentage}%)
          </div>
          <p className={percentage >= 75 ? 'text-green-700' : 'text-amber-700'}>
            {percentage >= 75 ? 'Great work! You understand probiotic science.' : 'Review and try again.'}
          </p>
        </div>
        <Button onClick={() => { setAnswers({}); setSubmitted(false); }} className="w-full">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="pt-4">
            <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map(option => (
                <label key={option} className={`flex items-center p-3 rounded-lg border cursor-pointer ${answers[q.id] === option ? 'border-purple-500 bg-purple-50' : 'border-secondary-200 hover:border-secondary-300'}`}>
                  <input type="radio" name={q.id} value={option} checked={answers[q.id] === option} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mr-3" />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSubmit} className="w-full" disabled={Object.keys(answers).length < questions.length}>
        Submit Quiz
      </Button>
    </div>
  );
}
