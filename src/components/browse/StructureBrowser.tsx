'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X, FlaskConical, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StructureCard } from './StructureCard';
import {
  POPULAR_STRUCTURES,
  CATEGORIES,
  searchStructures,
  type PopularStructure,
} from '@/data/popular-structures';
import {
  LAB_PROTEINS,
  LAB_CATEGORIES,
  LAB_SPECIES,
  LAB_PROTEIN_FUNCTIONS,
  searchLABProteins,
  type LABProtein,
} from '@/data/lab-structures';

type BrowseMode = 'all' | 'lab';

// Unified structure type for display
type DisplayStructure = PopularStructure | LABProtein;

export function StructureBrowser() {
  const [browseMode, setBrowseMode] = useState<BrowseMode>('lab');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // LAB-specific filters
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  // Get current data based on mode
  const currentStructures = browseMode === 'lab' ? LAB_PROTEINS : POPULAR_STRUCTURES;
  const currentCategories = browseMode === 'lab' ? LAB_CATEGORIES : CATEGORIES;

  // Get all unique tags for current mode
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    currentStructures.forEach((s) => s.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [currentStructures]);

  // Filter structures
  const filteredStructures = useMemo(() => {
    let results: DisplayStructure[] = currentStructures;

    // Filter by search query
    if (searchQuery) {
      if (browseMode === 'lab') {
        results = searchLABProteins(searchQuery);
      } else {
        results = searchStructures(searchQuery);
      }
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter((s) => s.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      results = results.filter((s) => selectedTags.every((tag) => s.tags.includes(tag)));
    }

    // LAB-specific filters
    if (browseMode === 'lab') {
      // Filter by species
      if (selectedSpecies) {
        results = (results as LABProtein[]).filter((s) => s.species === selectedSpecies);
      }

      // Filter by protein function (using category field)
      if (selectedFunction) {
        results = (results as LABProtein[]).filter((s) => s.category === selectedFunction);
      }
    }

    return results;
  }, [searchQuery, selectedCategory, selectedTags, selectedSpecies, selectedFunction, browseMode, currentStructures]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTags([]);
    setSelectedSpecies(null);
    setSelectedFunction(null);
  };

  const switchMode = (mode: BrowseMode) => {
    setBrowseMode(mode);
    clearFilters();
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0 ||
    (browseMode === 'lab' && (selectedSpecies || selectedFunction));

  return (
    <div className="space-y-6">
      {/* Page Header - Dynamic based on mode */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
          {browseMode === 'lab' ? 'LAB Protein Browser' : 'Structure Browser'}
        </h1>
        <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-400">
          {browseMode === 'lab'
            ? 'Browse proteins from Lactobacillus and other lactic acid bacteria'
            : 'Browse our curated collection of molecular structures. Search by name, filter by category, or explore by tags to find structures for education and research.'
          }
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 rounded-lg border border-secondary-200 bg-secondary-50 p-1 dark:border-secondary-800 dark:bg-secondary-900/50">
        <Button
          variant={browseMode === 'lab' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => switchMode('lab')}
          className="flex-1 gap-2"
        >
          <FlaskConical className="h-4 w-4" />
          LAB Proteins
        </Button>
        <Button
          variant={browseMode === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => switchMode('all')}
          className="flex-1 gap-2"
        >
          <Database className="h-4 w-4" />
          All Structures
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
          <Input
            type="search"
            placeholder={browseMode === 'lab'
              ? "Search LAB proteins by name, species, or tags..."
              : "Search structures by name, description, or tags..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
            <Filter className="mr-2 h-4 w-4" />
            Categories:
          </span>
          {currentCategories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() =>
                setSelectedCategory(selectedCategory === category.id ? null : category.id)
              }
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Badge>
          ))}
        </div>

        {/* LAB-specific Filters */}
        {browseMode === 'lab' && (
          <>
            {/* Species Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                <span className="mr-2">🦠</span>
                Species:
              </span>
              {LAB_SPECIES.map((species) => (
                <Badge
                  key={species.id}
                  variant={selectedSpecies === species.id ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedSpecies(selectedSpecies === species.id ? null : species.id)
                  }
                  title={species.scientificName}
                >
                  {species.commonName}
                </Badge>
              ))}
            </div>

            {/* Protein Function Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                <span className="mr-2">🔬</span>
                Function:
              </span>
              {LAB_PROTEIN_FUNCTIONS.map((func) => (
                <Badge
                  key={func.id}
                  variant={selectedFunction === func.id ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedFunction(selectedFunction === func.id ? null : func.id)
                  }
                >
                  <span className="mr-1">{func.icon}</span>
                  {func.name}
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Tag Filter */}
        <div className="space-y-2">
          <details className="group">
            <summary className="flex cursor-pointer items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
              <span className="mr-2">Tags</span>
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTags.length} selected
                </Badge>
              )}
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </details>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between rounded-md border border-primary-200 bg-primary-50 p-3 dark:border-primary-900 dark:bg-primary-950/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                Active filters:
              </span>
              {searchQuery && <Badge variant="secondary">Search: {searchQuery}</Badge>}
              {selectedCategory && (
                <Badge variant="secondary">
                  Category: {currentCategories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {browseMode === 'lab' && selectedSpecies && (
                <Badge variant="secondary">
                  Species: {LAB_SPECIES.find((s) => s.id === selectedSpecies)?.commonName}
                </Badge>
              )}
              {browseMode === 'lab' && selectedFunction && (
                <Badge variant="secondary">
                  Function: {LAB_PROTEIN_FUNCTIONS.find((f) => f.id === selectedFunction)?.name}
                </Badge>
              )}
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {filteredStructures.length} {browseMode === 'lab' ? 'protein' : 'structure'}
            {filteredStructures.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredStructures.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-secondary-200 p-12 text-center dark:border-secondary-800">
            <p className="text-lg font-medium text-secondary-900 dark:text-white">
              No {browseMode === 'lab' ? 'proteins' : 'structures'} found
            </p>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearFilters} className="mt-4">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStructures.map((structure) => (
              <StructureCard key={structure.id} structure={structure as PopularStructure} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
