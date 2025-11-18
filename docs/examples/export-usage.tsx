/**
 * Export Features Usage Examples
 * Comprehensive examples of using the export system
 */

import React, { useState } from 'react';
import { ExportPanel } from '@/components/viewer/ExportPanel';
import { useExport } from '@/hooks/use-export';
import { exportService, ExportableViewer } from '@/services/export-service';
import {
  ImageExportOptions,
  Model3DExportOptions,
  PDFExportOptions,
  SessionExportOptions,
  ImageResolution,
  ExportResult
} from '@/types/export';

// Example 1: Basic Export Panel Integration
export function Example1_BasicExportPanel() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);

  const {
    exportImage,
    export3DModel,
    exportPDF,
    exportSession,
    downloadResult,
    isExporting,
    progress
  } = useExport({
    viewer,
    onSuccess: (result) => {
      console.log('Export successful:', result);
      downloadResult(result);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  });

  return (
    <div className="export-example">
      <h2>Basic Export Panel</h2>
      <ExportPanel
        onExportImage={exportImage}
        onExport3DModel={export3DModel}
        onExportPDF={exportPDF}
        onExportSession={exportSession}
        isExporting={isExporting}
        progress={progress}
      />
    </div>
  );
}

// Example 2: Custom Image Export with Options
export function Example2_CustomImageExport() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const { exportImage, downloadResult } = useExport({ viewer });

  const handleHighQualityExport = async () => {
    const options: Partial<ImageExportOptions> = {
      format: 'png',
      resolution: ImageResolution.ULTRA_HD,
      quality: 100,
      transparent: false,
      includeAnnotations: true,
      watermark: {
        enabled: true,
        text: 'LAB Visualizer - High Quality Export',
        position: 'bottom-right',
        opacity: 0.7,
        fontSize: 16,
        color: '#ffffff'
      }
    };

    const result = await exportImage(options);
    if (result) {
      downloadResult(result);
    }
  };

  const handleQuickScreenshot = async () => {
    const options: Partial<ImageExportOptions> = {
      format: 'jpg',
      resolution: ImageResolution.HD,
      quality: 85,
      includeAnnotations: false
    };

    const result = await exportImage(options);
    if (result) {
      downloadResult(result);
    }
  };

  return (
    <div>
      <h2>Custom Image Export</h2>
      <button onClick={handleHighQualityExport}>
        Export High Quality (4K PNG)
      </button>
      <button onClick={handleQuickScreenshot}>
        Quick Screenshot (1080p JPEG)
      </button>
    </div>
  );
}

// Example 3: 3D Model Export for Different Use Cases
export function Example3_3DModelExport() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const { export3DModel, downloadResult } = useExport({ viewer });

  const handleExportForWeb = async () => {
    const options: Partial<Model3DExportOptions> = {
      format: 'gltf',
      binary: true, // GLB format
      includeTextures: true,
      includeColors: true,
      includeNormals: true,
      optimizeGeometry: true,
      embedTextures: true,
      scale: 1.0
    };

    const result = await export3DModel(options);
    if (result) {
      downloadResult(result);
    }
  };

  const handleExportForBlender = async () => {
    const options: Partial<Model3DExportOptions> = {
      format: 'obj',
      includeTextures: false,
      includeColors: true,
      includeNormals: true,
      optimizeGeometry: false,
      scale: 1.0
    };

    const result = await export3DModel(options);
    if (result) {
      downloadResult(result);
    }
  };

  const handleExportFor3DPrinting = async () => {
    const options: Partial<Model3DExportOptions> = {
      format: 'stl',
      includeTextures: false,
      includeColors: false,
      includeNormals: true,
      optimizeGeometry: true,
      scale: 10.0 // Scale up for printing
    };

    const result = await export3DModel(options);
    if (result) {
      downloadResult(result);
    }
  };

  return (
    <div>
      <h2>3D Model Export for Different Uses</h2>
      <button onClick={handleExportForWeb}>
        Export for Web (glTF/GLB)
      </button>
      <button onClick={handleExportForBlender}>
        Export for Blender (OBJ)
      </button>
      <button onClick={handleExportFor3DPrinting}>
        Export for 3D Printing (STL)
      </button>
    </div>
  );
}

// Example 4: Professional PDF Report Generation
export function Example4_PDFReportGeneration() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const { exportPDF, downloadResult } = useExport({ viewer });

  const handleGenerateFullReport = async () => {
    const options: Partial<PDFExportOptions> = {
      title: 'Protein Structure Analysis Report',
      author: 'Dr. Jane Smith',
      includeStructureImage: true,
      includeAnnotations: true,
      includeMetadata: true,
      imageResolution: ImageResolution.FULL_HD,
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 72,
        right: 72,
        bottom: 72,
        left: 72
      },
      annotationStyle: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000000',
        borderColor: '#cccccc',
        borderWidth: 1
      }
    };

    const result = await exportPDF(options);
    if (result) {
      downloadResult(result);
    }
  };

  const handleGenerateQuickReport = async () => {
    const options: Partial<PDFExportOptions> = {
      title: 'Quick Structure Export',
      includeStructureImage: true,
      includeAnnotations: false,
      includeMetadata: false,
      imageResolution: ImageResolution.HD,
      pageSize: 'letter',
      orientation: 'landscape'
    };

    const result = await exportPDF(options);
    if (result) {
      downloadResult(result);
    }
  };

  return (
    <div>
      <h2>PDF Report Generation</h2>
      <button onClick={handleGenerateFullReport}>
        Generate Full Report (A4)
      </button>
      <button onClick={handleGenerateQuickReport}>
        Quick Report (Letter, Landscape)
      </button>
    </div>
  );
}

// Example 5: Session State Management
export function Example5_SessionStateManagement() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const { exportSession, downloadResult } = useExport({ viewer });

  const handleSaveSession = async () => {
    const options: Partial<SessionExportOptions> = {
      includeCamera: true,
      includeAnnotations: true,
      includeSelection: true,
      includeVisualizationSettings: true,
      includeMetadata: true,
      format: 'json',
      prettyPrint: true
    };

    const result = await exportSession(options);
    if (result) {
      // Save to local storage
      localStorage.setItem('lastSession', JSON.stringify(result.data));

      // Also download
      downloadResult(result);
    }
  };

  const handleLoadSession = async () => {
    const sessionData = localStorage.getItem('lastSession');
    if (sessionData && viewer) {
      const data = JSON.parse(sessionData);

      // Restore camera
      if (data.camera) {
        // await viewer.applyCameraState(data.camera);
      }

      // Restore annotations
      if (data.annotations) {
        // await viewer.loadAnnotations(data.annotations);
      }

      console.log('Session restored:', data);
    }
  };

  return (
    <div>
      <h2>Session State Management</h2>
      <button onClick={handleSaveSession}>
        Save Current Session
      </button>
      <button onClick={handleLoadSession}>
        Restore Last Session
      </button>
    </div>
  );
}

// Example 6: Progress Tracking and Custom UI
export function Example6_ProgressTracking() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const [exportProgress, setExportProgress] = useState<{
    stage: string;
    progress: number;
    message?: string;
  } | null>(null);

  const handleExportWithProgress = async () => {
    if (!viewer) return;

    try {
      const result = await exportService.exportImage(
        viewer,
        {
          format: 'png',
          resolution: ImageResolution.ULTRA_HD
        },
        (progress) => {
          setExportProgress({
            stage: progress.stage,
            progress: progress.progress,
            message: progress.message
          });
        }
      );

      // Download result
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);

      setExportProgress(null);
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress(null);
    }
  };

  return (
    <div>
      <h2>Export with Progress Tracking</h2>
      <button onClick={handleExportWithProgress}>
        Export 4K Image
      </button>

      {exportProgress && (
        <div className="progress-display">
          <div>Stage: {exportProgress.stage}</div>
          <div>Progress: {exportProgress.progress}%</div>
          {exportProgress.message && <div>{exportProgress.message}</div>}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Example 7: Batch Export Multiple Formats
export function Example7_BatchExport() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const [results, setResults] = useState<ExportResult[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleBatchExport = async () => {
    if (!viewer) return;

    setIsExporting(true);
    const exportResults: ExportResult[] = [];

    try {
      // Export PNG image
      const pngResult = await exportService.exportImage(viewer, {
        format: 'png',
        resolution: ImageResolution.FULL_HD
      });
      exportResults.push(pngResult);

      // Export JPEG image
      const jpgResult = await exportService.exportImage(viewer, {
        format: 'jpg',
        resolution: ImageResolution.HD,
        quality: 90
      });
      exportResults.push(jpgResult);

      // Export glTF model
      const gltfResult = await exportService.export3DModel(viewer, {
        format: 'gltf',
        binary: true
      });
      exportResults.push(gltfResult);

      // Export session state
      const sessionResult = await exportService.exportSession(viewer, {
        prettyPrint: true
      });
      exportResults.push(sessionResult);

      setResults(exportResults);

      // Download all
      exportResults.forEach(result => {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Batch export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <h2>Batch Export Multiple Formats</h2>
      <button onClick={handleBatchExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export All Formats'}
      </button>

      {results.length > 0 && (
        <div>
          <h3>Export Results:</h3>
          <ul>
            {results.map((result, index) => (
              <li key={index}>
                {result.type} - {result.filename} ({(result.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Example 8: Export with Custom Watermark
export function Example8_CustomWatermark() {
  const [viewer, setViewer] = useState<ExportableViewer | null>(null);
  const { exportImage, downloadResult } = useExport({ viewer });

  const handleExportWithWatermark = async (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') => {
    const options: Partial<ImageExportOptions> = {
      format: 'png',
      resolution: ImageResolution.FULL_HD,
      watermark: {
        enabled: true,
        text: `© 2025 LAB Visualizer - ${new Date().toLocaleDateString()}`,
        position,
        opacity: 0.6,
        fontSize: 14,
        color: '#ffffff'
      }
    };

    const result = await exportImage(options);
    if (result) {
      downloadResult(result);
    }
  };

  return (
    <div>
      <h2>Export with Custom Watermark</h2>
      <div className="watermark-positions">
        <button onClick={() => handleExportWithWatermark('top-left')}>
          Top Left
        </button>
        <button onClick={() => handleExportWithWatermark('top-right')}>
          Top Right
        </button>
        <button onClick={() => handleExportWithWatermark('bottom-left')}>
          Bottom Left
        </button>
        <button onClick={() => handleExportWithWatermark('bottom-right')}>
          Bottom Right
        </button>
        <button onClick={() => handleExportWithWatermark('center')}>
          Center
        </button>
      </div>
    </div>
  );
}
