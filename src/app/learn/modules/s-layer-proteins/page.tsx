'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Microscope, CheckCircle, Clock, ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * S-Layer Proteins & Cell Surface Module
 * Advanced content on surface layer architecture and host-microbe interactions
 */

export default function SLayerProteinsModule() {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const sections = [
    {
      id: 'overview',
      title: '1. Introduction to S-Layer Proteins',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            <strong>Surface layer (S-layer) proteins</strong> form two-dimensional crystalline arrays that
            cover the entire cell surface of many LAB species. These proteins self-assemble into highly
            ordered structures with precise nanometer-scale spacing.
          </p>

          <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Key Features of S-Layers</h4>
            <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Self-assembly:</strong> Spontaneous formation of crystalline lattice from monomers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>High abundance:</strong> Can comprise 10-15% of total cell protein</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Lattice symmetry:</strong> p1, p2, p3, p4, or p6 symmetry types</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Pore structure:</strong> Regular pores of 2-8 nm diameter</span>
              </li>
            </ul>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">LAB Species with S-Layers</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="pt-4 text-sm">
                <strong className="text-green-800 dark:text-green-200"><em>Lactobacillus acidophilus</em></strong>
                <p className="text-green-700 dark:text-green-300">SlpA, SlpB, SlpX proteins</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950">
              <CardContent className="pt-4 text-sm">
                <strong className="text-blue-800 dark:text-blue-200"><em>Lactobacillus crispatus</em></strong>
                <p className="text-blue-700 dark:text-blue-300">CbsA (collagen-binding)</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950">
              <CardContent className="pt-4 text-sm">
                <strong className="text-purple-800 dark:text-purple-200"><em>Lactobacillus helveticus</em></strong>
                <p className="text-purple-700 dark:text-purple-300">SlpH protein</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950">
              <CardContent className="pt-4 text-sm">
                <strong className="text-amber-800 dark:text-amber-200"><em>Lactobacillus brevis</em></strong>
                <p className="text-amber-700 dark:text-amber-300">SlpB, SlpD proteins</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'structure',
      title: '2. Structural Organization',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            S-layer proteins have a modular architecture with distinct functional domains that mediate
            cell wall anchoring and self-assembly.
          </p>

          <div className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">SlpA Domain Structure</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <div className="w-24 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">N-terminus</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Self-assembly domain:</strong> Mediates protein-protein interactions for lattice formation
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900 rounded">
                <div className="w-24 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">C-terminus</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <strong>Cell wall anchor:</strong> SLH (S-layer homology) domains bind to cell wall polysaccharides
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-secondary-900 dark:text-white mt-6">View 3D Structures</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-sm">SlpA Self-Assembly Domain</h5>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                  <em>L. acidophilus</em> - Crystal structure showing lattice contacts
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link href="/viewer?pdbId=3PYW">
                    <Eye className="h-4 w-4 mr-2" />
                    View PDB 3PYW
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-sm">S-Layer Domain Protein</h5>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                  Conserved domain structure in Lactobacillus
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link href="/viewer?pdbId=3CVH">
                    <Eye className="h-4 w-4 mr-2" />
                    View PDB 3CVH
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'functions',
      title: '3. Biological Functions',
      content: (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            S-layer proteins serve multiple functions in LAB, from protection to host interaction,
            making them important for both probiotic activity and biotechnology applications.
          </p>

          <div className="space-y-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-blue-800 dark:text-blue-200">Protective Barrier</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Acts as a molecular sieve, excluding harmful enzymes and molecules while allowing
                  nutrient passage through uniform pores.
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-green-800 dark:text-green-200">Host Cell Adhesion</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Mediates attachment to intestinal epithelium, mucus, and extracellular matrix
                  components. Essential for probiotic colonization.
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-purple-800 dark:text-purple-200">Immune Modulation</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Interacts with dendritic cells and macrophages through pattern recognition receptors,
                  influencing cytokine production and immune responses.
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-4">
                <h5 className="font-semibold text-amber-800 dark:text-amber-200">Nanotechnology Applications</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Self-assembling property exploited for biosensors, drug delivery, and nanomaterial
                  templating due to precise nanometer-scale periodicity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'quiz',
      title: '4. Knowledge Check',
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
          <div className="p-3 bg-indigo-500 rounded-lg text-white">
            <Microscope className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              S-Layer Proteins & Cell Surface
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Advanced exploration of surface layer architecture and host-microbe interactions
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="bg-red-50 text-red-700">Advanced</Badge>
              <span className="flex items-center text-sm text-secondary-500">
                <Clock className="h-4 w-4 mr-1" />
                50 min
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
              currentSection === idx ? 'bg-indigo-500 text-white' : completedSections.has(section.id) ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-600'
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
            <span>Sleytr, U.B. et al. (2014). S-layers: principles and applications. <em>FEMS Microbiol Rev</em> 38:823-864</span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <a href="https://www.rcsb.org/structure/3PYW" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              PDB 3PYW - SlpA structure from L. acidophilus
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
    { id: 'q1', question: 'What percentage of total cell protein can S-layers comprise?', options: ['1-2%', '5-8%', '10-15%', '30-40%'], correct: '10-15%' },
    { id: 'q2', question: 'What domain mediates S-layer protein attachment to the cell wall?', options: ['LRR domain', 'SLH domain', 'Kinase domain', 'PDZ domain'], correct: 'SLH domain' },
    { id: 'q3', question: 'Which symmetry type is NOT found in S-layer lattices?', options: ['p1', 'p4', 'p6', 'p8'], correct: 'p8' },
  ];

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct) correct++; });
    setScore(correct);
    setSubmitted(true);
  };

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-lg text-center ${percentage >= 66 ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className={`text-4xl font-bold mb-2 ${percentage >= 66 ? 'text-green-600' : 'text-amber-600'}`}>
            {score}/{questions.length} ({percentage}%)
          </div>
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
                <label key={option} className={`flex items-center p-3 rounded-lg border cursor-pointer ${answers[q.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-secondary-200'}`}>
                  <input type="radio" name={q.id} value={option} checked={answers[q.id] === option} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mr-3" />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSubmit} className="w-full" disabled={Object.keys(answers).length < questions.length}>Submit Quiz</Button>
    </div>
  );
}
