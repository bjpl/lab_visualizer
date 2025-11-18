/**
 * PathwayProgress Component
 * Visualizes progress through a learning pathway
 */

'use client';

import React from 'react';

import { useLearningPathway } from '@/hooks/use-learning';
import type { LearningModule } from '@/types/learning';

interface PathwayProgressProps {
  pathwayId: string;
  onModuleClick?: (module: LearningModule) => void;
}

export function PathwayProgress({ pathwayId, onModuleClick }: PathwayProgressProps) {
  const { pathway, loading, error, progressPercent } = useLearningPathway(pathwayId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !pathway) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading pathway</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{pathway.title}</h2>
        {pathway.description && (
          <p className="text-gray-600 mt-1">{pathway.description}</p>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {pathway.userProgress?.completedModules.length || 0} of {pathway.modules.length} modules completed
        </div>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {pathway.modules.map((module, index) => {
          const isCompleted = pathway.userProgress?.completedModules.includes(module.id);
          const isCurrent = pathway.userProgress?.currentModule === module.id;

          return (
            <div
              key={module.id}
              onClick={() => onModuleClick?.(module)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isCurrent
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Step Number/Status */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Module Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{module.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">{module.contentType}</span>
                    {module.duration && (
                      <>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{Math.ceil(module.duration / 60)} min</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Difficulty Badge */}
                <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                  module.difficulty <= 2 ? 'bg-green-100 text-green-800' :
                  module.difficulty <= 3 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  L{module.difficulty}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
