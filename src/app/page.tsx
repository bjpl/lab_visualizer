import Link from 'next/link';
import { ArrowRight, Beaker, Layers, Users, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StructureCard } from '@/components/browse/StructureCard';
import { getRandomStructures } from '@/data/popular-structures';

const features = [
  {
    icon: Layers,
    title: 'Progressive LOD Rendering',
    description: 'Fast loading with progressive detail enhancement for structures of any size',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description: 'Work together with shared camera views, annotations, and synchronized interactions',
  },
  {
    icon: GraduationCap,
    title: 'Educational Content',
    description: 'Curated learning modules with interactive annotations and quizzes',
  },
  {
    icon: Beaker,
    title: 'Browser-Based MD',
    description: 'Run lightweight molecular dynamics simulations directly in your browser',
  },
];

export default function HomePage() {
  const featuredStructures = getRandomStructures(3);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary-50 to-white dark:from-primary-950/20 dark:to-secondary-950">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-6xl">
              Explore Molecular Structures in 3D
            </h1>
            <p className="mt-6 text-lg leading-8 text-secondary-600 dark:text-secondary-400">
              Interactive visualization platform for proteins, DNA, and molecular complexes. Built
              for education and research with cutting-edge WebGL technology.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/browse">
                  Browse Structures
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/viewer">Open Viewer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
              Powerful Features for Modern Structural Biology
            </h2>
            <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
              Everything you need to visualize, analyze, and understand molecular structures
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-10 w-10 text-primary-600" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Structures */}
      <section className="border-t bg-secondary-50 py-24 dark:bg-secondary-900/20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
              Featured Structures
            </h2>
            <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
              Explore our curated collection of educational molecular structures
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            {featuredStructures.map((structure) => (
              <StructureCard key={structure.id} structure={structure} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">
                View All Structures
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl bg-primary-600 p-10 text-center shadow-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start exploring?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-primary-100">
              Access thousands of protein structures from the PDB database and AlphaFold. No
              installation required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" variant="secondary">
                <Link href="/viewer">Open Viewer</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/learn">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
