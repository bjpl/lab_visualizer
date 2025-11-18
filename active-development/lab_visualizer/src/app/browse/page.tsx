import type { Metadata } from 'next';

import { StructureBrowser } from '@/components/browse/StructureBrowser';

export const metadata: Metadata = {
  title: 'Browse Structures',
  description: 'Explore our curated collection of educational molecular structures from the PDB database',
};

export default function BrowsePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
          Structure Browser
        </h1>
        <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
          Browse our curated collection of molecular structures. Search by name, filter by category,
          or explore by tags to find structures for education and research.
        </p>
      </div>

      <StructureBrowser />
    </div>
  );
}
