'use client';

import { ExternalLink, Download, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

      <Accordion type="single" collapsible defaultValue="metadata">
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
