/**
 * ExportPanel Component
 * UI controls for exporting visualizations, models, and documents
 */

'use client';

import type React from 'react';
import { useState } from 'react';

import type {
  ExportImageFormat,
  Export3DFormat,
  ImageExportOptions,
  Model3DExportOptions,
  PDFExportOptions,
  SessionExportOptions,
  ExportProgress} from '../../types/export';
import {
  ImageResolution,
  RESOLUTION_MAP,
  DEFAULT_IMAGE_EXPORT_OPTIONS,
  DEFAULT_MODEL_EXPORT_OPTIONS,
  DEFAULT_PDF_EXPORT_OPTIONS,
  DEFAULT_SESSION_EXPORT_OPTIONS
} from '../../types/export';

export interface ExportPanelProps {
  onExportImage?: (options: ImageExportOptions) => Promise<void>;
  onExport3DModel?: (options: Model3DExportOptions) => Promise<void>;
  onExportPDF?: (options: PDFExportOptions) => Promise<void>;
  onExportSession?: (options: SessionExportOptions) => Promise<void>;
  isExporting?: boolean;
  progress?: ExportProgress;
}

type ExportTab = 'image' | '3d-model' | 'pdf' | 'session';

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExportImage,
  onExport3DModel,
  onExportPDF,
  onExportSession,
  isExporting = false,
  progress
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('image');

  // Image export state
  const [imageOptions, setImageOptions] = useState<ImageExportOptions>(DEFAULT_IMAGE_EXPORT_OPTIONS);

  // 3D model export state
  const [modelOptions, setModelOptions] = useState<Model3DExportOptions>(DEFAULT_MODEL_EXPORT_OPTIONS);

  // PDF export state
  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>(DEFAULT_PDF_EXPORT_OPTIONS);

  // Session export state
  const [sessionOptions, setSessionOptions] = useState<SessionExportOptions>(DEFAULT_SESSION_EXPORT_OPTIONS);

  const handleExport = async () => {
    try {
      switch (activeTab) {
        case 'image':
          await onExportImage?.(imageOptions);
          break;
        case '3d-model':
          await onExport3DModel?.(modelOptions);
          break;
        case 'pdf':
          await onExportPDF?.(pdfOptions);
          break;
        case 'session':
          await onExportSession?.(sessionOptions);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="export-panel bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Export</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('image')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'image'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Image
        </button>
        <button
          onClick={() => setActiveTab('3d-model')}
          className={`px-4 py-2 font-medium ${
            activeTab === '3d-model'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          3D Model
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'pdf'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          PDF
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'session'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Session
        </button>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'image' && (
          <ImageExportForm options={imageOptions} onChange={setImageOptions} />
        )}
        {activeTab === '3d-model' && (
          <Model3DExportForm options={modelOptions} onChange={setModelOptions} />
        )}
        {activeTab === 'pdf' && (
          <PDFExportForm options={pdfOptions} onChange={setPdfOptions} />
        )}
        {activeTab === 'session' && (
          <SessionExportForm options={sessionOptions} onChange={setSessionOptions} />
        )}
      </div>

      {/* Progress */}
      {isExporting && progress && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress.message || 'Exporting...'}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
    </div>
  );
};

// Image Export Form
interface ImageExportFormProps {
  options: ImageExportOptions;
  onChange: (options: ImageExportOptions) => void;
}

const ImageExportForm: React.FC<ImageExportFormProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="image-export-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Format
        </label>
        <select
          id="image-export-format"
          value={options.format}
          onChange={(e) => onChange({ ...options, format: e.target.value as ExportImageFormat })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="png">PNG</option>
          <option value="jpg">JPEG</option>
          <option value="webp">WebP</option>
        </select>
      </div>

      <div>
        <label htmlFor="image-export-resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Resolution
        </label>
        <select
          id="image-export-resolution"
          value={options.resolution}
          onChange={(e) => onChange({ ...options, resolution: e.target.value as ImageResolution })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {Object.entries(RESOLUTION_MAP).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {options.resolution === ImageResolution.CUSTOM && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="image-export-width" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Width
            </label>
            <input
              id="image-export-width"
              type="number"
              value={options.customWidth || 1920}
              onChange={(e) => onChange({ ...options, customWidth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="image-export-height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height
            </label>
            <input
              id="image-export-height"
              type="number"
              value={options.customHeight || 1080}
              onChange={(e) => onChange({ ...options, customHeight: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quality: {options.quality}%
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={options.quality}
          onChange={(e) => onChange({ ...options, quality: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeAnnotations"
          checked={options.includeAnnotations}
          onChange={(e) => onChange({ ...options, includeAnnotations: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="includeAnnotations" className="text-sm text-gray-700 dark:text-gray-300">
          Include annotations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="transparent"
          checked={options.transparent}
          onChange={(e) => onChange({ ...options, transparent: e.target.checked })}
          className="rounded"
          disabled={options.format !== 'png'}
        />
        <label htmlFor="transparent" className="text-sm text-gray-700 dark:text-gray-300">
          Transparent background (PNG only)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="watermark"
          checked={options.watermark?.enabled || false}
          onChange={(e) => onChange({
            ...options,
            watermark: { ...DEFAULT_IMAGE_EXPORT_OPTIONS.watermark!, enabled: e.target.checked }
          })}
          className="rounded"
        />
        <label htmlFor="watermark" className="text-sm text-gray-700 dark:text-gray-300">
          Add watermark
        </label>
      </div>
    </div>
  );
};

// 3D Model Export Form
interface Model3DExportFormProps {
  options: Model3DExportOptions;
  onChange: (options: Model3DExportOptions) => void;
}

const Model3DExportForm: React.FC<Model3DExportFormProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="model3d-export-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Format
        </label>
        <select
          id="model3d-export-format"
          value={options.format}
          onChange={(e) => onChange({ ...options, format: e.target.value as Export3DFormat })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="gltf">glTF (.gltf)</option>
          <option value="obj">Wavefront OBJ (.obj)</option>
          <option value="stl">STL (.stl)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeColors"
          checked={options.includeColors}
          onChange={(e) => onChange({ ...options, includeColors: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="includeColors" className="text-sm text-gray-700 dark:text-gray-300">
          Include colors
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeNormals"
          checked={options.includeNormals}
          onChange={(e) => onChange({ ...options, includeNormals: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="includeNormals" className="text-sm text-gray-700 dark:text-gray-300">
          Include normals
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="optimizeGeometry"
          checked={options.optimizeGeometry}
          onChange={(e) => onChange({ ...options, optimizeGeometry: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="optimizeGeometry" className="text-sm text-gray-700 dark:text-gray-300">
          Optimize geometry
        </label>
      </div>

      {options.format === 'gltf' && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="binary"
              checked={options.binary}
              onChange={(e) => onChange({ ...options, binary: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="binary" className="text-sm text-gray-700 dark:text-gray-300">
              Binary format (.glb)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="embedTextures"
              checked={options.embedTextures}
              onChange={(e) => onChange({ ...options, embedTextures: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="embedTextures" className="text-sm text-gray-700 dark:text-gray-300">
              Embed textures
            </label>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scale: {options.scale}x
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={options.scale}
          onChange={(e) => onChange({ ...options, scale: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
};

// PDF Export Form
interface PDFExportFormProps {
  options: PDFExportOptions;
  onChange: (options: PDFExportOptions) => void;
}

const PDFExportForm: React.FC<PDFExportFormProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="pdf-export-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title
        </label>
        <input
          id="pdf-export-title"
          type="text"
          value={options.title}
          onChange={(e) => onChange({ ...options, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="pdf-export-author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Author (optional)
        </label>
        <input
          id="pdf-export-author"
          type="text"
          value={options.author || ''}
          onChange={(e) => onChange({ ...options, author: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeStructureImage"
          checked={options.includeStructureImage}
          onChange={(e) => onChange({ ...options, includeStructureImage: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="includeStructureImage" className="text-sm text-gray-700 dark:text-gray-300">
          Include structure image
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pdfIncludeAnnotations"
          checked={options.includeAnnotations}
          onChange={(e) => onChange({ ...options, includeAnnotations: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="pdfIncludeAnnotations" className="text-sm text-gray-700 dark:text-gray-300">
          Include annotations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeMetadata"
          checked={options.includeMetadata}
          onChange={(e) => onChange({ ...options, includeMetadata: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="includeMetadata" className="text-sm text-gray-700 dark:text-gray-300">
          Include metadata
        </label>
      </div>

      <div>
        <label htmlFor="pdf-export-pagesize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Page Size
        </label>
        <select
          id="pdf-export-pagesize"
          value={options.pageSize}
          onChange={(e) => onChange({ ...options, pageSize: e.target.value as PDFExportOptions['pageSize'] })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="letter">Letter</option>
          <option value="a4">A4</option>
          <option value="legal">Legal</option>
        </select>
      </div>

      <div>
        <label htmlFor="pdf-export-orientation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Orientation
        </label>
        <select
          id="pdf-export-orientation"
          value={options.orientation}
          onChange={(e) => onChange({ ...options, orientation: e.target.value as PDFExportOptions['orientation'] })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
    </div>
  );
};

// Session Export Form
interface SessionExportFormProps {
  options: SessionExportOptions;
  onChange: (options: SessionExportOptions) => void;
}

const SessionExportForm: React.FC<SessionExportFormProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Export the current session state to restore later
      </p>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sessionCamera"
          checked={options.includeCamera}
          onChange={(e) => onChange({ ...options, includeCamera: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="sessionCamera" className="text-sm text-gray-700 dark:text-gray-300">
          Include camera position
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sessionAnnotations"
          checked={options.includeAnnotations}
          onChange={(e) => onChange({ ...options, includeAnnotations: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="sessionAnnotations" className="text-sm text-gray-700 dark:text-gray-300">
          Include annotations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sessionSelection"
          checked={options.includeSelection}
          onChange={(e) => onChange({ ...options, includeSelection: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="sessionSelection" className="text-sm text-gray-700 dark:text-gray-300">
          Include selection
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sessionVisualization"
          checked={options.includeVisualizationSettings}
          onChange={(e) => onChange({ ...options, includeVisualizationSettings: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="sessionVisualization" className="text-sm text-gray-700 dark:text-gray-300">
          Include visualization settings
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="prettyPrint"
          checked={options.prettyPrint}
          onChange={(e) => onChange({ ...options, prettyPrint: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="prettyPrint" className="text-sm text-gray-700 dark:text-gray-300">
          Pretty print JSON
        </label>
      </div>
    </div>
  );
};
