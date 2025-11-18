/**
 * useMolstar Hook
 *
 * React hook for Mol* viewer integration
 * Manages lifecycle, state synchronization, and events
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { molstarService } from '@/services/molstar-service';
import { useVisualization } from '@/stores/app-store';
import type {
  MolstarConfig,
  MolstarRepresentationType,
  MolstarColorScheme,
  StructureMetadata,
  PerformanceMetrics,
  ExportImageOptions,
} from '@/types/molstar';
import type { RepresentationType, ColorScheme } from '@/stores/slices/visualization-slice';

/**
 * Map app representation types to Mol* types
 */
const representationMap: Record<RepresentationType, MolstarRepresentationType> = {
  cartoon: 'cartoon',
  'ball-and-stick': 'ball-and-stick',
  spacefill: 'spacefill',
  ribbon: 'cartoon',
  surface: 'surface',
};

/**
 * Map app color schemes to Mol* schemes
 */
const colorSchemeMap: Record<ColorScheme, MolstarColorScheme> = {
  element: 'element-symbol',
  chain: 'chain-id',
  residue: 'residue-name',
  'secondary-structure': 'secondary-structure',
  rainbow: 'chain-id', // Use chain-id as fallback for rainbow
};

/**
 * Hook return type
 */
export interface UseMolstarReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  metadata: StructureMetadata | null;
  metrics: PerformanceMetrics | null;
  loadStructure: (data: string | ArrayBuffer, label?: string) => Promise<void>;
  loadStructureById: (pdbId: string) => Promise<void>;
  exportImage: (options?: ExportImageOptions) => Promise<Blob>;
  centerCamera: () => Promise<void>;
}

/**
 * Mol* React Hook
 */
export function useMolstar(config: MolstarConfig = {}): UseMolstarReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<StructureMetadata | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const {
    representation,
    colorScheme,
    setRepresentation: setAppRepresentation,
    setColorScheme: setAppColorScheme,
  } = useVisualization();

  /**
   * Initialize Mol* viewer
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        await molstarService.initialize(containerRef.current, config);

        if (mounted) {
          setIsReady(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[useMolstar] Initialization failed:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      mounted = false;
      molstarService.dispose();
      setIsReady(false);
    };
  }, [config]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (!isReady) return;

    const handleStructureLoaded = (meta: StructureMetadata) => {
      setMetadata(meta);
      setMetrics(molstarService.getPerformanceMetrics());
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    molstarService.on('structure-loaded', handleStructureLoaded);
    molstarService.on('error', handleError);

    return () => {
      molstarService.off('structure-loaded', handleStructureLoaded);
      molstarService.off('error', handleError);
    };
  }, [isReady]);

  /**
   * Sync representation changes
   */
  useEffect(() => {
    if (!isReady || !metadata) return;

    const molstarRep = representationMap[representation];

    molstarService
      .applyRepresentation({
        type: molstarRep,
        colorScheme: colorSchemeMap[colorScheme],
        quality: 'auto',
      })
      .catch((err) => {
        console.error('[useMolstar] Representation sync failed:', err);
        setError(err);
      });
  }, [representation, colorScheme, isReady, metadata]);

  /**
   * Load structure from data
   */
  const loadStructure = useCallback(
    async (data: string | ArrayBuffer, label: string = 'Structure') => {
      if (!isReady) {
        throw new Error('Mol* viewer not ready');
      }

      try {
        setIsLoading(true);
        setError(null);

        const meta = await molstarService.loadStructure(data, {
          format: 'pdb',
          label,
        });

        setMetadata(meta);
        setMetrics(molstarService.getPerformanceMetrics());
        setIsLoading(false);

        // Sync representation with current store state
        const molstarRep = representationMap[representation];
        await molstarService.applyRepresentation({
          type: molstarRep,
          colorScheme: colorSchemeMap[colorScheme],
          quality: 'auto',
        });
      } catch (err) {
        console.error('[useMolstar] Structure loading failed:', err);
        setError(err as Error);
        setIsLoading(false);
        throw err;
      }
    },
    [isReady, representation, colorScheme]
  );

  /**
   * Load structure by PDB ID
   */
  const loadStructureById = useCallback(
    async (pdbId: string) => {
      if (!isReady) {
        throw new Error('Mol* viewer not ready');
      }

      try {
        setIsLoading(true);
        setError(null);

        const meta = await molstarService.loadStructureById(pdbId);

        setMetadata(meta);
        setMetrics(molstarService.getPerformanceMetrics());
        setIsLoading(false);

        // Sync representation with current store state
        const molstarRep = representationMap[representation];
        await molstarService.applyRepresentation({
          type: molstarRep,
          colorScheme: colorSchemeMap[colorScheme],
          quality: 'auto',
        });
      } catch (err) {
        console.error('[useMolstar] PDB loading failed:', err);
        setError(err as Error);
        setIsLoading(false);
        throw err;
      }
    },
    [isReady, representation, colorScheme]
  );

  /**
   * Export image
   */
  const exportImage = useCallback(
    async (options: ExportImageOptions = { format: 'png' }) => {
      if (!isReady) {
        throw new Error('Mol* viewer not ready');
      }

      return molstarService.exportImage(options);
    },
    [isReady]
  );

  /**
   * Center camera
   */
  const centerCamera = useCallback(async () => {
    if (!isReady) {
      throw new Error('Mol* viewer not ready');
    }

    await molstarService.centerCamera();
  }, [isReady]);

  return {
    containerRef,
    isReady,
    isLoading,
    error,
    metadata,
    metrics,
    loadStructure,
    loadStructureById,
    exportImage,
    centerCamera,
  };
}
