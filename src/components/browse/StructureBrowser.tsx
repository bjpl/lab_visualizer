'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StructureCard } from './StructureCard';
import {
  POPULAR_STRUCTURES,
  CATEGORIES,
  searchStructures,
  getStructuresByCategory,
  type PopularStructure,
} from '@/data/popular-structures';

export function StructureBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    POPULAR_STRUCTURES.forEach((s) => s.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  // Filter structures
  const filteredStructures = useMemo(() => {
    let results = POPULAR_STRUCTURES;

    // Filter by search query
    if (searchQuery) {
      results = searchStructures(searchQuery);
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter((s) => s.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      results = results.filter((s) => selectedTags.every((tag) => s.tags.includes(tag)));
    }

    return results;
  }, [searchQuery, selectedCategory, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
          <Input
            type="search"
            placeholder="Search structures by name, description, or tags..."
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
          {CATEGORIES.map((category) => (
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
                  Category: {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
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
            {filteredStructures.length} structure{filteredStructures.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredStructures.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-secondary-200 p-12 text-center dark:border-secondary-800">
            <p className="text-lg font-medium text-secondary-900 dark:text-white">
              No structures found
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
              <StructureCard key={structure.id} structure={structure} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
