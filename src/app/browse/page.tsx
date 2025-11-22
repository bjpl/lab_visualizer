import type { Metadata } from 'next';
import { StructureBrowser } from '@/components/browse/StructureBrowser';

export const metadata: Metadata = {
  title: 'Browse LAB Structures',
  description: 'Explore proteins from Lactobacillus and lactic acid bacteria',
};

export default function BrowsePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <StructureBrowser />
    </div>
  );
}
