import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, BookOpen, Video, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Learning Center',
  description: 'Educational resources and tutorials for molecular structure visualization',
};

const learningModules = [
  {
    id: 'protein-basics',
    title: 'Protein Structure Basics',
    description: 'Introduction to primary, secondary, tertiary, and quaternary structures',
    difficulty: 'Beginner',
    duration: '30 min',
    topics: ['Alpha helices', 'Beta sheets', 'Protein folding'],
    icon: BookOpen,
  },
  {
    id: 'enzyme-catalysis',
    title: 'Enzyme Mechanisms',
    description: 'How enzymes catalyze reactions through active site interactions',
    difficulty: 'Intermediate',
    duration: '45 min',
    topics: ['Active sites', 'Substrate binding', 'Catalysis'],
    icon: GraduationCap,
  },
  {
    id: 'dna-structure',
    title: 'DNA and RNA Structures',
    description: 'Explore the structure and function of nucleic acids',
    difficulty: 'Beginner',
    duration: '25 min',
    topics: ['Double helix', 'Base pairing', 'RNA folding'],
    icon: Video,
  },
  {
    id: 'membrane-proteins',
    title: 'Membrane Proteins',
    description: 'Understanding transmembrane domains and protein topology',
    difficulty: 'Advanced',
    duration: '60 min',
    topics: ['Transmembrane helices', 'Ion channels', 'Transporters'],
    icon: FileText,
  },
];

const tutorials = [
  {
    title: 'Getting Started with the Viewer',
    description: 'Learn basic navigation, selection, and visualization controls',
    href: '#',
  },
  {
    title: 'Understanding Representations',
    description: 'Cartoon, surface, ball-and-stick, and other visualization styles',
    href: '#',
  },
  {
    title: 'Analyzing Protein-Ligand Interactions',
    description: 'Identify binding sites and measure distances',
    href: '#',
  },
  {
    title: 'Creating Custom Annotations',
    description: 'Add labels and notes to structures for teaching',
    href: '#',
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
          Learning Center
        </h1>
        <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
          Interactive tutorials and educational modules to help you understand molecular structures
        </p>
      </div>

      {/* Learning Modules */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Learning Modules
          </h2>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {learningModules.map((module) => (
            <Card key={module.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <module.icon className="h-8 w-8 text-primary-600" />
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription className="mt-1">{module.description}</CardDescription>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">{module.difficulty}</Badge>
                  <Badge variant="outline">{module.duration}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-4 space-y-1">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Topics covered:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {module.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tutorials */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-secondary-900 dark:text-white">
          Quick Start Tutorials
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild disabled>
                  <Link href={tutorial.href}>
                    Read Tutorial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-secondary-900 dark:text-white">
          External Resources
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RCSB PDB</CardTitle>
              <CardDescription>
                The Protein Data Bank - primary repository for 3D structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.rcsb.org" target="_blank" rel="noopener noreferrer">
                  Visit RCSB
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AlphaFold Database</CardTitle>
              <CardDescription>
                AI-predicted protein structures from DeepMind and EMBL-EBI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://alphafold.ebi.ac.uk" target="_blank" rel="noopener noreferrer">
                  Visit AlphaFold
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mol* Documentation</CardTitle>
              <CardDescription>
                Learn about the visualization engine powering LAB Visualizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://molstar.org/" target="_blank" rel="noopener noreferrer">
                  Visit Mol*
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
