/**
 * Quality Settings UI Component
 * Real-time quality controls with FPS display and performance stats
 */

import React, { useState, useEffect } from 'react';
import {
  QualityLevel,
  QualityManager,
  PerformanceMetrics,
  DeviceCapability,
} from '../../services/quality-manager';

interface QualitySettingsProps {
  qualityManager: QualityManager;
  className?: string;
}

export const QualitySettings: React.FC<QualitySettingsProps> = ({
  qualityManager,
  className = '',
}) => {
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>(
    qualityManager.getSettings().level
  );
  const [autoAdjust, setAutoAdjust] = useState(
    qualityManager.getSettings().autoAdjust
  );
  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    qualityManager.getMetrics()
  );
  const [deviceCapability, setDeviceCapability] = useState<DeviceCapability | null>(
    qualityManager.getDeviceCapability()
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Subscribe to quality changes
    const handleQualityChange = () => {
      setCurrentQuality(qualityManager.getSettings().level);
      setAutoAdjust(qualityManager.getSettings().autoAdjust);
    };

    // Subscribe to metrics updates
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    // Register callbacks (in real implementation, use event emitter)
    const interval = setInterval(() => {
      handleMetricsUpdate(qualityManager.getMetrics());
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [qualityManager]);

  const handleQualityChange = (level: QualityLevel) => {
    qualityManager.setQualityLevel(level);
    setCurrentQuality(level);
  };

  const handleAutoAdjustToggle = () => {
    const newValue = !autoAdjust;
    qualityManager.setAutoAdjust(newValue);
    setAutoAdjust(newValue);
  };

  const handleRecommended = () => {
    if (deviceCapability) {
      qualityManager.setQualityLevel(deviceCapability.recommendedQuality);
    }
  };

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (level: QualityLevel): string => {
    const labels = {
      [QualityLevel.LOW]: 'Low',
      [QualityLevel.MEDIUM]: 'Medium',
      [QualityLevel.HIGH]: 'High',
      [QualityLevel.ULTRA]: 'Ultra',
      [QualityLevel.EXTREME]: 'Extreme',
    };
    return labels[level];
  };

  const formatMemory = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`quality-settings bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quality Settings</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* FPS Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current FPS:</span>
          <span className={`text-2xl font-bold ${getFPSColor(metrics.fps)}`}>
            {metrics.fps.toFixed(1)}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Frame Time: {metrics.frameTime.toFixed(2)}ms
        </div>
      </div>

      {/* Quality Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quality Level: {getQualityLabel(currentQuality)}
        </label>
        <input
          type="range"
          min={QualityLevel.LOW}
          max={QualityLevel.EXTREME}
          step={1}
          value={currentQuality}
          onChange={(e) => handleQualityChange(Number(e.target.value) as QualityLevel)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          disabled={autoAdjust}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Ultra</span>
          <span>Extreme</span>
        </div>
      </div>

      {/* Auto Quality Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoAdjust}
            onChange={handleAutoAdjustToggle}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Auto-adjust quality based on performance
          </span>
        </label>
      </div>

      {/* Device Info */}
      {deviceCapability && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Device Tier:</strong>{' '}
            <span className="capitalize">{deviceCapability.tier}</span>
          </div>
          <div className="text-sm text-gray-700 mb-2">
            <strong>GPU:</strong> {deviceCapability.gpuVendor}
          </div>
          <div className="text-sm text-gray-700">
            <strong>Max Atoms:</strong> {deviceCapability.maxAtoms.toLocaleString()}
          </div>
        </div>
      )}

      {/* Recommended Settings Button */}
      {deviceCapability && (
        <button
          onClick={handleRecommended}
          className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Recommended Settings
        </button>
      )}

      {/* Advanced Stats */}
      {showAdvanced && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Performance Statistics
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Draw Calls:</span>
              <span className="font-medium">{metrics.drawCalls}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Triangles:</span>
              <span className="font-medium">
                {metrics.triangles.toLocaleString()}
              </span>
            </div>

            {metrics.memoryUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Used:</span>
                <span className="font-medium">{formatMemory(metrics.memoryUsed)}</span>
              </div>
            )}

            {metrics.cpuTime !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">CPU Time:</span>
                <span className="font-medium">{metrics.cpuTime.toFixed(2)}ms</span>
              </div>
            )}

            {metrics.gpuTime !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">GPU Time:</span>
                <span className="font-medium">{metrics.gpuTime.toFixed(2)}ms</span>
              </div>
            )}
          </div>

          {/* Performance Bar */}
          <div className="mt-4">
            <div className="text-xs text-gray-600 mb-1">Frame Budget (16.67ms @ 60fps)</div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  metrics.frameTime <= 16.67
                    ? 'bg-green-500'
                    : metrics.frameTime <= 33
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min((metrics.frameTime / 33) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Reduce Motion Setting */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Accessibility
            </h4>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Reduce motion</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualitySettings;
