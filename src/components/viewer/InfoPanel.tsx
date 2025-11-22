'use client';

import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Download, Info, Leaf, FlaskConical, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  getLABProteinById,
  getLABProteinsByCategory,
  getLABSpeciesById,
  getLABCategoryById,
} from '@/data/lab-structures';

interface InfoPanelProps {
  pdbId?: string;
}

interface StructureMetadata {
  title: string;
  authors: string[];
  resolution?: number;
  method: string;
  deposition_date: string;
  atoms: number;
  residues: number;
  chains: number;
  doi?: string;
}

export function InfoPanel({ pdbId }: InfoPanelProps) {
  const [metadata, setMetadata] = useState<StructureMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if current structure is a LAB protein
  const labProtein = useMemo(() => {
    return pdbId ? getLABProteinById(pdbId) : null;
  }, [pdbId]);

  // Get species info for LAB protein
  const labSpecies = useMemo(() => {
    return labProtein?.species ? getLABSpeciesById(labProtein.species) : null;
  }, [labProtein]);

  // Get category info for LAB protein
  const labCategory = useMemo(() => {
    return labProtein?.category ? getLABCategoryById(labProtein.category) : null;
  }, [labProtein]);

  // Get related LAB proteins from the same category (excluding current)
  const relatedProteins = useMemo(() => {
    if (!labProtein?.category) return [];
    return getLABProteinsByCategory(labProtein.category)
      .filter(p => p.pdbId !== labProtein.pdbId)
      .slice(0, 3);
  }, [labProtein]);

  useEffect(() => {
    if (!pdbId) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch from PDB API
        // This is mock data for now
        setMetadata({
          title: `Structure ${pdbId.toUpperCase()}`,
          authors: ['Author A', 'Author B', 'Author C'],
          resolution: 2.1,
          method: 'X-RAY DIFFRACTION',
          deposition_date: '2023-01-15',
          atoms: 1234,
          residues: 156,
          chains: 2,
          doi: '10.1000/example.123',
        });
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [pdbId]);

  if (!pdbId) {
    return (
      <div
        className="rounded-lg border border-dashed p-6 text-center"
        role="status"
        aria-label="No structure loaded"
      >
        <Info className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Load a structure to view details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-live="polite" aria-busy="true">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="space-y-4" role="region" aria-label="Structure information">
      <div>
        <h3 className="text-lg font-semibold">Structure Information</h3>
        <p className="text-sm text-muted-foreground">
          PDB ID: <span className="font-mono font-medium">{pdbId.toUpperCase()}</span>
        </p>
      </div>

      {/* LAB Protein Info Section */}
      {labProtein && (
        <div
          className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30"
          role="region"
          aria-label="LAB protein information"
        >
          <div className="mb-3 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-green-800 dark:text-green-300">LAB Protein</h4>
          </div>

          {/* Species Badge */}
          {labSpecies && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Species
              </p>
              <Badge
                variant="secondary"
                className="border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300"
              >
                <span className="italic">{labSpecies.scientificName}</span>
              </Badge>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                {labSpecies.commonName} - {labSpecies.fermentationType}
              </p>
            </div>
          )}

          {/* Protein Function */}
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Function
              </p>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              {labProtein.function}
            </p>
            {labCategory && (
              <Badge
                variant="outline"
                className="mt-2 border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
              >
                {labCategory.icon} {labCategory.name}
              </Badge>
            )}
          </div>

          {/* Educational Value */}
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Educational Value
              </p>
            </div>
            <p className="text-sm leading-relaxed text-green-800 dark:text-green-200">
              {labProtein.educationalValue}
            </p>
          </div>

          {/* Related LAB Proteins */}
          {relatedProteins.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Related LAB Proteins
              </p>
              <div className="space-y-1.5">
                {relatedProteins.map((protein) => (
                  <div
                    key={protein.pdbId}
                    className="flex items-center justify-between rounded border border-green-200 bg-white/50 px-2.5 py-1.5 text-xs dark:border-green-800 dark:bg-green-950/30"
                  >
                    <span className="font-medium text-green-800 dark:text-green-300 truncate flex-1 mr-2">
                      {protein.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-green-300 font-mono text-green-700 dark:border-green-700 dark:text-green-300"
                    >
                      {protein.pdbId}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {labProtein.tags && labProtein.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {labProtein.tags.slice(0, 5).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-green-200 bg-white/50 text-xs text-green-600 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <Accordion type="single" collapsible defaultValue={labProtein ? "lab-info" : "metadata"}>
        {/* Metadata */}
        <AccordionItem value="metadata">
          <AccordionTrigger>Metadata</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">{metadata.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Method</p>
                <Badge variant="secondary">{metadata.method}</Badge>
              </div>

              {metadata.resolution && (
                <div>
                  <p className="text-sm font-medium">Resolution</p>
                  <p className="text-sm text-muted-foreground">
                    {metadata.resolution.toFixed(2)} Å
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Deposition Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(metadata.deposition_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Statistics */}
        <AccordionItem value="statistics">
          <AccordionTrigger>Statistics</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium">Atoms</p>
                <p className="text-2xl font-bold">{metadata.atoms.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Residues</p>
                <p className="text-2xl font-bold">{metadata.residues.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Chains</p>
                <p className="text-2xl font-bold">{metadata.chains}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Authors */}
        <AccordionItem value="authors">
          <AccordionTrigger>Authors</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {metadata.authors.map((author, index) => (
                <li key={index}>{author}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Links */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">External Links</h4>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open(`https://www.rcsb.org/structure/${pdbId}`, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on RCSB PDB
          </Button>

          {metadata.doi && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(`https://doi.org/${metadata.doi}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Publication
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Download Options */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Downloads</h4>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open(`https://files.rcsb.org/download/${pdbId}.pdb`, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            PDB Format
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open(`https://files.rcsb.org/download/${pdbId}.cif`, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            mmCIF Format
          </Button>
        </div>
      </div>
    </div>
  );
}
