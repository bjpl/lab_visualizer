import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, BookOpen, Video, FileText, Microscope, FlaskConical, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Lactobacillus Learning Center',
  description: 'Educational resources and tutorials for Lactic Acid Bacteria (LAB) molecular structures and biochemistry',
};

const learningModules = [
  {
    id: 'lab-introduction',
    title: 'Introduction to Lactic Acid Bacteria',
    description: 'Fundamental overview of LAB taxonomy, cell structure, and defining characteristics',
    difficulty: 'Beginner',
    duration: '20 min',
    topics: ['LAB taxonomy', 'Cell structure', 'Gram-positive characteristics'],
    icon: BookOpen,
  },
  {
    id: 'fermentation-biochemistry',
    title: 'Fermentation Biochemistry',
    description: 'Deep dive into the metabolic pathways that define lactic acid bacteria',
    difficulty: 'Intermediate',
    duration: '45 min',
    topics: ['Homofermentation', 'Heterofermentation', 'Pyruvate metabolism'],
    icon: FlaskConical,
  },
  {
    id: 'probiotics-health',
    title: 'Probiotics & Health Benefits',
    description: 'Explore how Lactobacillus strains promote health through gut microbiome interactions',
    difficulty: 'Beginner',
    duration: '30 min',
    topics: ['Gut microbiome', 'Immunomodulation', 'Lactobacillus strains'],
    icon: GraduationCap,
  },
  {
    id: 'bacteriocins',
    title: 'Bacteriocins & Antimicrobial Peptides',
    description: 'Study the structure and function of LAB-produced antimicrobial compounds',
    difficulty: 'Intermediate',
    duration: '40 min',
    topics: ['Nisin structure', 'Lantibiotics', 'Food preservation'],
    icon: Microscope,
  },
  {
    id: 's-layer-proteins',
    title: 'S-Layer Proteins & Cell Surface',
    description: 'Advanced exploration of surface layer architecture and host-microbe interactions',
    difficulty: 'Advanced',
    duration: '50 min',
    topics: ['S-layer architecture', 'Adhesion mechanisms', 'Host interactions'],
    icon: FileText,
  },
  {
    id: 'industrial-applications',
    title: 'Industrial Applications of LAB',
    description: 'Learn how Lactobacillus species are used in food production and biotechnology',
    difficulty: 'Intermediate',
    duration: '35 min',
    topics: ['Dairy fermentation', 'Probiotics manufacturing', 'Biopreservation'],
    icon: Video,
  },
];

const tutorials = [
  {
    title: 'Visualizing Lactate Dehydrogenase',
    description: 'Explore the 3D structure and catalytic mechanism of this key LAB enzyme',
    href: '#',
  },
  {
    title: 'Understanding Bacteriocin Mechanisms',
    description: 'Analyze nisin and other antimicrobial peptides produced by Lactobacillus',
    href: '#',
  },
  {
    title: 'Exploring Surface Proteins',
    description: 'Navigate S-layer protein structures and understand their role in adhesion',
    href: '#',
  },
  {
    title: 'Fermentation Pathway Analysis',
    description: 'Interactive tour of glycolysis and pyruvate metabolism in LAB',
    href: '#',
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
          Lactobacillus Learning Center
        </h1>
        <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
          Interactive tutorials and educational modules to understand Lactic Acid Bacteria molecular structures, fermentation biochemistry, and probiotic mechanisms
        </p>
      </div>

      {/* Learning Modules */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            LAB Learning Modules
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
          LAB Structure Tutorials
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
          LAB Research Resources
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">LPSN Database</CardTitle>
              <CardDescription>
                List of Prokaryotic Names with Standing in Nomenclature - authoritative LAB taxonomy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://lpsn.dsmz.de" target="_blank" rel="noopener noreferrer">
                  Visit LPSN
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NCBI Lactobacillus Genomes</CardTitle>
              <CardDescription>
                Complete genome sequences and annotations for Lactobacillus species
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.ncbi.nlm.nih.gov/genome/?term=lactobacillus" target="_blank" rel="noopener noreferrer">
                  Browse Genomes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RCSB PDB - LAB Structures</CardTitle>
              <CardDescription>
                Search Protein Data Bank for Lactobacillus protein structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22value%22%3A%22Lactobacillus%22%7D%7D%2C%22return_type%22%3A%22entry%22%7D" target="_blank" rel="noopener noreferrer">
                  Search PDB
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
