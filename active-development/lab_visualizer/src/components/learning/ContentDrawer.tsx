/**
 * ContentDrawer Component
 * Side panel for displaying learning content alongside viewer
 */

'use client';

import React, { useState } from 'react';

import { useLearningModules } from '@/hooks/use-learning';
import type { LearningModule } from '@/types/learning';

interface ContentDrawerProps {
  structureId?: string;
  onModuleSelect?: (module: LearningModule) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentDrawer({ structureId, onModuleSelect, isOpen, onClose }: ContentDrawerProps) {
  const { modules, loading } = useLearningModules({
    structureId,
    isPublished: true,
    sortBy: 'popular',
    limit: 10,
  });

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Learning Content</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : modules.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No learning content available for this structure</p>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => onModuleSelect?.(module)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {module.thumbnailUrl && (
                      <img src={module.thumbnailUrl} alt={module.title} className="w-16 h-16 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2">{module.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{module.contentType}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-gray-600">
                          ★ {module.avgRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-600">
                          {module.viewCount} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
