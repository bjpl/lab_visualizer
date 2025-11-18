/**
 * useExport Hook
 * React hook for managing export operations
 */

'use client';

import { useState, useCallback } from 'react';

import type { ExportableViewer } from '../services/export-service';
import { exportService } from '../services/export-service';
import type {
  ExportResult,
  ExportProgress,
  ImageExportOptions,
  Model3DExportOptions,
  PDFExportOptions,
  SessionExportOptions,
  ImageExportResult,
  Model3DExportResult,
  PDFExportResult,
  SessionExportResult
} from '../types/export';

export interface UseExportOptions {
  viewer: ExportableViewer | null;
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: Error) => void;
}

export interface UseExportReturn {
  // State
  isExporting: boolean;
  progress: ExportProgress | null;
  lastResult: ExportResult | null;
  error: Error | null;

  // Actions
  exportImage: (options?: Partial<ImageExportOptions>) => Promise<ImageExportResult | null>;
  export3DModel: (options?: Partial<Model3DExportOptions>) => Promise<Model3DExportResult | null>;
  exportPDF: (options?: Partial<PDFExportOptions>) => Promise<PDFExportResult | null>;
  exportSession: (options?: Partial<SessionExportOptions>) => Promise<SessionExportResult | null>;
  downloadResult: (result: ExportResult) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing exports
 */
export function useExport({ viewer, onSuccess, onError }: UseExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleProgress = useCallback((progress: ExportProgress) => {
    setProgress(progress);
  }, []);

  const handleSuccess = useCallback((result: ExportResult) => {
    setLastResult(result);
    setIsExporting(false);
    setProgress(null);
    onSuccess?.(result);
  }, [onSuccess]);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setIsExporting(false);
    setProgress(null);
    onError?.(err);
  }, [onError]);

  const exportImage = useCallback(async (
    options?: Partial<ImageExportOptions>
  ): Promise<ImageExportResult | null> => {
    if (!viewer) {
      const err = new Error('Viewer not available');
      handleError(err);
      return null;
    }

    try {
      setIsExporting(true);
      setError(null);

      const result = await exportService.exportImage(viewer, options, handleProgress);
      handleSuccess(result);
      return result;
    } catch (err) {
      handleError(err as Error);
      return null;
    }
  }, [viewer, handleProgress, handleSuccess, handleError]);

  const export3DModel = useCallback(async (
    options?: Partial<Model3DExportOptions>
  ): Promise<Model3DExportResult | null> => {
    if (!viewer) {
      const err = new Error('Viewer not available');
      handleError(err);
      return null;
    }

    try {
      setIsExporting(true);
      setError(null);

      const result = await exportService.export3DModel(viewer, options, handleProgress);
      handleSuccess(result);
      return result;
    } catch (err) {
      handleError(err as Error);
      return null;
    }
  }, [viewer, handleProgress, handleSuccess, handleError]);

  const exportPDF = useCallback(async (
    options?: Partial<PDFExportOptions>
  ): Promise<PDFExportResult | null> => {
    if (!viewer) {
      const err = new Error('Viewer not available');
      handleError(err);
      return null;
    }

    try {
      setIsExporting(true);
      setError(null);

      const result = await exportService.exportPDF(viewer, options, handleProgress);
      handleSuccess(result);
      return result;
    } catch (err) {
      handleError(err as Error);
      return null;
    }
  }, [viewer, handleProgress, handleSuccess, handleError]);

  const exportSession = useCallback(async (
    options?: Partial<SessionExportOptions>
  ): Promise<SessionExportResult | null> => {
    if (!viewer) {
      const err = new Error('Viewer not available');
      handleError(err);
      return null;
    }

    try {
      setIsExporting(true);
      setError(null);

      const result = await exportService.exportSession(viewer, options, handleProgress);
      handleSuccess(result);
      return result;
    } catch (err) {
      handleError(err as Error);
      return null;
    }
  }, [viewer, handleProgress, handleSuccess, handleError]);

  const downloadResult = useCallback((result: ExportResult) => {
    // Create download link
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Download additional files if present
    if (result.type === '3d-model' && result.additionalFiles) {
      result.additionalFiles.forEach(file => {
        const fileUrl = URL.createObjectURL(file.blob);
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.download = file.filename;
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
        setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsExporting(false);
    setProgress(null);
    setLastResult(null);
    setError(null);
  }, []);

  return {
    isExporting,
    progress,
    lastResult,
    error,
    exportImage,
    export3DModel,
    exportPDF,
    exportSession,
    downloadResult,
    clearError,
    reset
  };
}
