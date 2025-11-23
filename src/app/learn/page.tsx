import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, BookOpen, Video, FileText, Microscope, FlaskConical, ArrowRight, Beaker, Factory, Dna, Target, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Lactobacillus Learning Center | LAB Visualizer',
  description: 'Educational resources and tutorials for Lactic Acid Bacteria (LAB) molecular structures, fermentation biochemistry, and probiotic mechanisms',
};

/**
 * Learning Module Data
 * Each module contains scientifically validated content about LAB
 */
const learningModules = [
  {
    id: 'lab-introduction',
    title: 'Introduction to Lactic Acid Bacteria',
    description: 'Fundamental overview of LAB taxonomy, cell structure, Gram-positive characteristics, and their role in fermentation.',
    difficulty: 'Beginner',
    duration: '20 min',
    topics: ['LAB taxonomy', 'Cell structure', 'Gram-positive characteristics', 'Historical significance'],
    icon: BookOpen,
    color: 'bg-blue-500',
    available: true,
  },
  {
    id: 'fermentation-biochemistry',
    title: 'Fermentation Biochemistry',
    description: 'Deep dive into homofermentative and heterofermentative pathways, pyruvate metabolism, and ATP generation in LAB.',
    difficulty: 'Intermediate',
    duration: '45 min',
    topics: ['Homofermentation', 'Heterofermentation', 'Pyruvate metabolism', 'Energy yield'],
    icon: FlaskConical,
    color: 'bg-green-500',
    available: true,
  },
  {
    id: 'probiotics-health',
    title: 'Probiotics & Health Benefits',
    description: 'Evidence-based exploration of how Lactobacillus strains promote health through gut microbiome interactions and immunomodulation.',
    difficulty: 'Beginner',
    duration: '30 min',
    topics: ['Gut microbiome', 'Immunomodulation', 'Clinical evidence', 'Strain specificity'],
    icon: GraduationCap,
    color: 'bg-purple-500',
    available: true,
  },
  {
    id: 'bacteriocins',
    title: 'Bacteriocins & Antimicrobial Peptides',
    description: 'Study the structure, mechanism, and applications of LAB-produced antimicrobial compounds like nisin and pediocin.',
    difficulty: 'Intermediate',
    duration: '40 min',
    topics: ['Nisin structure', 'Lantibiotics', 'Class IIa bacteriocins', 'Food preservation'],
    icon: Target,
    color: 'bg-red-500',
    available: true,
  },
  {
    id: 's-layer-proteins',
    title: 'S-Layer Proteins & Cell Surface',
    description: 'Advanced exploration of surface layer architecture, self-assembly mechanisms, and host-microbe interactions.',
    difficulty: 'Advanced',
    duration: '50 min',
    topics: ['S-layer architecture', 'Adhesion mechanisms', 'Host interactions', 'Crystalline arrays'],
    icon: Microscope,
    color: 'bg-indigo-500',
    available: true,
  },
  {
    id: 'industrial-applications',
    title: 'Industrial Applications of LAB',
    description: 'Learn how Lactobacillus species are used in dairy fermentation, probiotics manufacturing, and biopreservation.',
    difficulty: 'Intermediate',
    duration: '35 min',
    topics: ['Dairy fermentation', 'Probiotics manufacturing', 'Biopreservation', 'Quality control'],
    icon: Factory,
    color: 'bg-amber-500',
    available: true,
  },
];

/**
 * Interactive Tutorials with 3D Viewer Integration
 */
const tutorials = [
  {
    title: 'Visualizing Lactate Dehydrogenase',
    description: 'Explore the 3D structure and catalytic mechanism of this key LAB enzyme (PDB: 1LDG)',
    href: '/learn/tutorials/ldh-visualization',
    pdbId: '1LDG',
    duration: '15 min',
    available: true,
  },
  {
    title: 'Understanding Bacteriocin Mechanisms',
    description: 'Analyze nisin structure and understand how lantibiotics kill bacteria (PDB: 5O3O)',
    href: '/learn/tutorials/bacteriocin-mechanism',
    pdbId: '5O3O',
    duration: '20 min',
    available: true,
  },
  {
    title: 'Exploring S-Layer Proteins',
    description: 'Navigate S-layer protein structures and understand self-assembly patterns (PDB: 3PYW)',
    href: '/learn/tutorials/slayer-exploration',
    pdbId: '3PYW',
    duration: '25 min',
    available: true,
  },
  {
    title: 'Fermentation Pathway Analysis',
    description: 'Interactive tour of glycolysis with GAPDH, Enolase, and Pyruvate Kinase structures',
    href: '/learn/tutorials/fermentation-pathway',
    pdbId: '1DC4',
    duration: '30 min',
    available: true,
  },
];

/**
 * External Research Resources
 */
const resources = [
  {
    title: 'LPSN Database',
    description: 'List of Prokaryotic Names with Standing in Nomenclature - authoritative LAB taxonomy resource',
    href: 'https://lpsn.dsmz.de',
    category: 'Taxonomy',
  },
  {
    title: 'NCBI Lactobacillus Genomes',
    description: 'Complete genome sequences and annotations for Lactobacillus species',
    href: 'https://www.ncbi.nlm.nih.gov/genome/?term=lactobacillus',
    category: 'Genomics',
  },
  {
    title: 'RCSB PDB - LAB Structures',
    description: 'Search Protein Data Bank for Lactobacillus protein structures',
    href: 'https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22value%22%3A%22Lactobacillus%22%7D%7D%2C%22return_type%22%3A%22entry%22%7D',
    category: 'Structures',
  },
  {
    title: 'UniProt LAB Proteins',
    description: 'Comprehensive protein sequence and function database for LAB proteins',
    href: 'https://www.uniprot.org/uniprotkb?query=lactobacillus',
    category: 'Proteins',
  },
  {
    title: 'International Scientific Association for Probiotics',
    description: 'Guidelines and scientific resources on probiotic research',
    href: 'https://isappscience.org/',
    category: 'Probiotics',
  },
  {
    title: 'KEGG Lactobacillus Pathways',
    description: 'Metabolic pathway maps and gene annotations for Lactobacillus',
    href: 'https://www.genome.jp/kegg-bin/show_organism?menu_type=pathway_maps&org=lac',
    category: 'Pathways',
  },
];

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    Beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return (
    <Badge variant="outline" className={colors[difficulty as keyof typeof colors] || ''}>
      {difficulty}
    </Badge>
  );
}

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
            <Dna className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
              Lactobacillus Learning Center
            </h1>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">
              Interactive tutorials and educational modules for LAB molecular biology
            </p>
          </div>
        </div>
        <p className="mt-4 text-secondary-600 dark:text-secondary-400 max-w-3xl">
          Explore the fascinating world of Lactic Acid Bacteria through our comprehensive learning modules.
          Understand fermentation biochemistry, probiotic mechanisms, and protein structures with interactive
          3D visualizations and scientifically validated content.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">6</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Learning Modules</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Beaker className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">4</div>
                <div className="text-sm text-green-600 dark:text-green-400">3D Tutorials</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">~4h</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Total Content</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">20+</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">PDB Structures</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Modules */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              LAB Learning Modules
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Comprehensive educational content with quizzes and interactive elements
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {learningModules.map((module) => (
            <Card key={module.id} className="transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="mt-1 text-sm">{module.description}</CardDescription>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={module.difficulty} />
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {module.duration}
                  </Badge>
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

                <Button
                  variant={module.available ? "default" : "outline"}
                  className="w-full"
                  asChild={module.available}
                  disabled={!module.available}
                >
                  {module.available ? (
                    <Link href={`/learn/modules/${module.id}`}>
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <span>Coming Soon</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Interactive Tutorials */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Interactive 3D Structure Tutorials
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Hands-on tutorials with real protein structures from the Protein Data Bank
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.title} className="transition-all hover:shadow-md hover:border-green-300 dark:hover:border-green-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {tutorial.pdbId}
                  </Badge>
                </div>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tutorial.duration}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild={tutorial.available}
                    disabled={!tutorial.available}
                  >
                    {tutorial.available ? (
                      <Link href={tutorial.href}>
                        Start Tutorial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <span>Coming Soon</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Learning Pathways */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Suggested Learning Pathways
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Structured paths for different learning goals
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
                Beginner Path
              </CardTitle>
              <CardDescription>
                Start here if you are new to LAB microbiology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
                  Introduction to LAB
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">2</span>
                  Probiotics & Health Benefits
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">3</span>
                  Industrial Applications
                </li>
              </ol>
              <Badge variant="outline" className="mt-4">~85 min total</Badge>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-lg text-green-700 dark:text-green-300">
                Biochemistry Path
              </CardTitle>
              <CardDescription>
                Deep dive into LAB metabolism and enzymology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold">1</span>
                  Fermentation Biochemistry
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold">2</span>
                  Fermentation Pathway Tutorial
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold">3</span>
                  LDH Visualization Tutorial
                </li>
              </ol>
              <Badge variant="outline" className="mt-4">~90 min total</Badge>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                Advanced Structural Path
              </CardTitle>
              <CardDescription>
                Focus on protein structures and molecular mechanisms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">1</span>
                  S-Layer Proteins
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">2</span>
                  Bacteriocins
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">3</span>
                  All 3D Tutorials
                </li>
              </ol>
              <Badge variant="outline" className="mt-4">~180 min total</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resources */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            LAB Research Resources
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Authoritative external databases and research tools
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                </div>
                <CardDescription className="text-sm">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.href} target="_blank" rel="noopener noreferrer">
                    Visit Resource
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Citation Notice */}
      <div className="mt-16 p-6 bg-secondary-50 dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          Scientific Accuracy & Citations
        </h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          All educational content in the LAB Learning Center is based on peer-reviewed scientific literature
          and authoritative sources including the Protein Data Bank (PDB), UniProt, NCBI, and published research.
          Protein structures are sourced from RCSB PDB with verified accession numbers. For citations and
          references, see the individual module pages.
        </p>
      </div>
    </div>
  );
}
