/**
 * MolecularViewer Component
 *
 * React component for Mol* molecular visualization
 * Handles lifecycle, loading states, and error boundaries
 * Integrates LOD Manager for progressive rendering
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMolstar } from '@/hooks/use-molstar';
import { useVisualization } from '@/stores/app-store';
import { createMolstarLODBridge } from '@/services/molstar-lod-bridge';
import type { MolstarConfig, LODLevel, LODProgressCallback } from '@/types/molstar';

/**
 * Component props
 */
export interface MolecularViewerProps {
  /**
   * Mol* configuration options
   */
  config?: MolstarConfig;

  /**
   * PDB ID to load automatically (optional)
   */
  pdbId?: string;

  /**
   * PDB data to load automatically (optional)
   */
  pdbData?: string;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Error component
   */
  errorComponent?: (error: Error) => React.ReactNode;

  /**
   * Callback when structure is loaded
   */
  onStructureLoaded?: (metadata: any) => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Enable progressive LOD loading
   */
  enableLOD?: boolean;

  /**
   * LOD progress callback
   */
  onLODProgress?: LODProgressCallback;
}

/**
 * Default loading component
 */
const DefaultLoading: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
      <p className="text-sm text-gray-600">Loading molecular viewer...</p>
    </div>
  </div>
);

/**
 * Default error component
 */
const DefaultError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex h-full w-full items-center justify-center bg-red-50">
    <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-2 text-lg font-semibold text-red-600">Viewer Error</h3>
      <p className="text-sm text-gray-700">{error.message}</p>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-gray-500">Technical Details</summary>
        <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
          {error.stack}
        </pre>
      </details>
    </div>
  </div>
);

/**
 * MolecularViewer Component
 */
export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  config,
  pdbId,
  pdbData,
  className = '',
  loadingComponent,
  errorComponent,
  onStructureLoaded,
  onError,
  enableLOD = false,
  onLODProgress,
}) => {
  const {
    containerRef,
    isReady,
    isLoading,
    error,
    metadata,
    metrics,
    loadStructure,
    loadStructureById,
  } = useMolstar(config);

  const { structure } = useVisualization();
  const [lodBridge] = useState(() =>
    enableLOD
      ? createMolstarLODBridge({
          memoryBudgetMB: 512,
          enableCaching: true,
          autoProgressToFull: true,
          onProgress: onLODProgress,
        })
      : null
  );
  const [lodLevel, setLODLevel] = useState<LODLevel | null>(null);

  /**
   * Auto-load structure from props with optional LOD
   */
  useEffect(() => {
    if (!isReady) return;

    const loadData = async () => {
      try {
        if (enableLOD && lodBridge) {
          // Progressive loading with LOD
          if (pdbData) {
            const results = await lodBridge.loadStructureProgressive({
              content: pdbData,
              label: pdbId || 'Structure',
            });

            const finalLevel = lodBridge.getCurrentLevel();
            setLODLevel(finalLevel);

            console.log('[MolecularViewer] LOD loading complete:', {
              stages: results.length,
              finalLevel,
              complexity: lodBridge.getComplexity(),
            });
          } else if (pdbId) {
            // For PDB IDs, load normally then apply LOD
            await loadStructureById(pdbId);
          }
        } else {
          // Standard loading without LOD
          if (pdbId) {
            await loadStructureById(pdbId);
          } else if (pdbData) {
            await loadStructure(pdbData, 'Structure');
          }
        }
      } catch (err) {
        console.error('[MolecularViewer] Auto-load failed:', err);
        onError?.(err as Error);
      }
    };

    loadData();
  }, [isReady, pdbId, pdbData, enableLOD]);

  /**
   * Load structure from Zustand store with optional LOD
   */
  useEffect(() => {
    if (!isReady || !structure) return;

    const loadFromStore = async () => {
      try {
        if (enableLOD && lodBridge) {
          // Progressive loading from store
          if (structure.content && !pdbId && !pdbData) {
            const results = await lodBridge.loadStructureProgressive({
              content: structure.content,
              label: structure.pdbId,
            });

            const finalLevel = lodBridge.getCurrentLevel();
            setLODLevel(finalLevel);

            console.log('[MolecularViewer] Store LOD loading complete:', {
              stages: results.length,
              finalLevel,
            });
          } else if (structure.pdbId && !pdbId && !pdbData) {
            await loadStructureById(structure.pdbId);
          }
        } else {
          // Standard loading without LOD
          if (structure.pdbId && !pdbId && !pdbData) {
            await loadStructureById(structure.pdbId);
          } else if (structure.content && !pdbId && !pdbData) {
            await loadStructure(structure.content, structure.pdbId);
          }
        }
      } catch (err) {
        console.error('[MolecularViewer] Store load failed:', err);
        onError?.(err as Error);
      }
    };

    loadFromStore();
  }, [isReady, structure, pdbId, pdbData, enableLOD]);

  /**
   * Notify parent of structure load
   */
  useEffect(() => {
    if (metadata) {
      onStructureLoaded?.(metadata);
    }
  }, [metadata, onStructureLoaded]);

  /**
   * Notify parent of errors
   */
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  /**
   * Cleanup LOD bridge on unmount
   */
  useEffect(() => {
    return () => {
      lodBridge?.dispose();
    };
  }, [lodBridge]);

  /**
   * Render loading state
   */
  if (isLoading) {
    return loadingComponent || <DefaultLoading />;
  }

  /**
   * Render error state
   */
  if (error) {
    const ErrorComponent = errorComponent || DefaultError;
    return typeof ErrorComponent === 'function' ? (
      <ErrorComponent error={error} />
    ) : (
      ErrorComponent
    );
  }

  /**
   * Render viewer
   */
  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
      data-testid="molecular-viewer"
      data-ready={isReady}
      data-loading={isLoading}
    >
      {/* Performance metrics overlay (dev only) */}
      {process.env.NODE_ENV === 'development' && metrics && (
        <div className="absolute right-4 top-4 rounded bg-black/75 px-3 py-2 text-xs text-white">
          <div>FPS: {metrics.frameRate}</div>
          <div>Atoms: {metrics.atomCount.toLocaleString()}</div>
          <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
          <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
          {enableLOD && lodLevel !== null && (
            <>
              <div className="mt-2 border-t border-white/30 pt-2">
                LOD Level: {['', 'Preview', 'Interactive', 'Full'][lodLevel]}
              </div>
              {lodBridge && (
                <>
                  <div>
                    Memory:{' '}
                    {(
                      (lodBridge.estimateMemoryUsage(lodLevel) || 0) /
                      (1024 * 1024)
                    ).toFixed(1)}
                    MB
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Export component with error boundary
 */
export default MolecularViewer;
