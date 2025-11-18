/**
 * Cache Warming Admin Panel
 *
 * Admin dashboard for managing and monitoring cache warming
 */

import type React from 'react';
import { useState, useEffect } from 'react';

import {
  useCacheWarming,
  useCacheProgress,
  useCacheHealth,
  useCacheSettings,
} from '../../hooks/use-cache-warming';

interface CacheWarmingPanelProps {
  className?: string;
}

export const CacheWarmingPanel: React.FC<CacheWarmingPanelProps> = ({ className = '' }) => {
  const { start, pause, resume, cancel, isActive, isPaused, service } = useCacheWarming();
  const { progress, percentage, formattedBytes, formattedTimeRemaining } = useCacheProgress();
  const { hitRate, effectiveness, recommendations } = useCacheHealth();
  const { settings, updateSettings } = useCacheSettings();
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);

  useEffect(() => {
    // Update progress from service
    if (service) {
      const status = service.getStatus();
      // Progress updates handled by event listeners in hook
    }
  }, [service, isActive]);

  const handleStart = async () => {
    await start();
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleCancel = () => {
    cancel();
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the entire cache?')) {
      try {
        const request = indexedDB.deleteDatabase('ProteinStructureCache');
        request.onsuccess = () => {
          alert('Cache cleared successfully');
        };
        request.onerror = () => {
          alert('Failed to clear cache');
        };
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Failed to clear cache');
      }
    }
  };

  const getEffectivenessColor = () => {
    switch (effectiveness) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEffectivenessIcon = () => {
    switch (effectiveness) {
      case 'excellent':
        return '✓';
      case 'good':
        return '○';
      case 'poor':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className={`cache-warming-panel bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Cache Warming Control Panel</h2>

      {/* Status Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Active:</span>
            <span className={`ml-2 font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {isActive ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Paused:</span>
            <span className={`ml-2 font-medium ${isPaused ? 'text-yellow-600' : 'text-gray-400'}`}>
              {isPaused ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Progress</h3>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Completed: {progress.completed} / {progress.total}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">In Progress:</span>
            <span className="ml-2 font-medium">{progress.inProgress}</span>
          </div>
          <div>
            <span className="text-gray-600">Failed:</span>
            <span className="ml-2 font-medium text-red-600">{progress.failed}</span>
          </div>
          <div>
            <span className="text-gray-600">Downloaded:</span>
            <span className="ml-2 font-medium">{formattedBytes}</span>
          </div>
          <div>
            <span className="text-gray-600">Time Remaining:</span>
            <span className="ml-2 font-medium">{formattedTimeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Cache Health Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Cache Health</h3>
        <div className="flex items-center mb-3">
          <span className="text-gray-600">Hit Rate:</span>
          <span className="ml-2 font-bold text-2xl">{(hitRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center mb-3">
          <span className="text-gray-600">Effectiveness:</span>
          <span className={`ml-2 font-medium capitalize ${getEffectivenessColor()}`}>
            {getEffectivenessIcon()} {effectiveness}
          </span>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Start Warming
          </button>
        ) : isPaused ? (
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
          >
            Pause
          </button>
        )}

        {isActive && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          disabled={isActive}
        >
          Clear Cache
        </button>
      </div>

      {/* Settings Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Settings</h3>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enabled ?? true}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Enable cache warming</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.networkAware ?? true}
              onChange={(e) => updateSettings({ networkAware: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Network-aware (skip on slow connections)</span>
          </label>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Max Concurrent Downloads: {settings.maxConcurrent ?? 5}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.maxConcurrent ?? 5}
              onChange={(e) => updateSettings({ maxConcurrent: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Max Cache Size: {((settings.maxSize ?? 500 * 1024 * 1024) / (1024 * 1024)).toFixed(0)} MB
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={(settings.maxSize ?? 500 * 1024 * 1024) / (1024 * 1024)}
              onChange={(e) => updateSettings({ maxSize: parseInt(e.target.value) * 1024 * 1024 })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheWarmingPanel;
