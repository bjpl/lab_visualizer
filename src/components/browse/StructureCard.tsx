'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, BookOpen } from 'lucide-react';
import type { PopularStructure } from '@/data/popular-structures';

interface StructureCardProps {
  structure: PopularStructure;
}

export function StructureCard({ structure }: StructureCardProps) {
  const categoryIcons: Record<string, string> = {
    classic: '🏛️',
    enzyme: '⚡',
    'nucleic-acid': '🧬',
    complex: '🔗',
    membrane: '🧱',
    immune: '🛡️',
    virus: '🦠',
    motor: '🏃',
    channel: '🚪',
    drug: '💊',
    ribosome: '🏭',
  };

  return (
    <Card className="group h-full transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" aria-hidden="true">
              {categoryIcons[structure.category] || '🔬'}
            </span>
            <div>
              <CardTitle className="text-lg">{structure.name}</CardTitle>
              <CardDescription className="mt-1 text-xs font-mono">
                PDB ID: {structure.id}
              </CardDescription>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {structure.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {structure.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{structure.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2">
          {structure.description}
        </p>

        <div className="mb-4 space-y-2 rounded-md bg-secondary-50 p-3 dark:bg-secondary-900">
          <div className="flex justify-between text-xs">
            <span className="text-secondary-600 dark:text-secondary-400">Method:</span>
            <span className="font-medium">{structure.method}</span>
          </div>
          {structure.resolution && (
            <div className="flex justify-between text-xs">
              <span className="text-secondary-600 dark:text-secondary-400">Resolution:</span>
              <span className="font-medium">{structure.resolution} Å</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <p className="mb-3 text-xs font-medium text-primary-600 dark:text-primary-400">
            Educational Value:
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 line-clamp-2">
            {structure.educationalValue}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/viewer?pdb=${structure.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View 3D
            </Link>
          </Button>
          <Button variant="outline" size="icon" title="Download PDB">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Learning Materials">
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
