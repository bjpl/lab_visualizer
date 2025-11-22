/**
 * React Hooks for Cache Warming
 *
 * Provides React integration for cache warming functionality
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import CacheWarmingService, {
  CacheWarmingConfig,
  WarmingProgress,
  CacheWarmingEvent,
} from '../services/cache-warming';
import { CacheStrategyEngine } from '../lib/cache-strategy';

/**
 * Hook for cache warming functionality
 */
export function useCacheWarming(config?: Partial<CacheWarmingConfig>) {
  const [service] = useState(() => new CacheWarmingService(config));
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<WarmingProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    bytesDownloaded: 0,
    estimatedTimeRemaining: 0,
  });

  useEffect(() => {
    const unsubscribe = service.addEventListener((event: CacheWarmingEvent) => {
      switch (event.type) {
        case 'progress':
          if (event.progress) {
            setProgress(event.progress);
          }
          break;
        case 'complete':
          setIsActive(false);
          if (event.progress) {
            setProgress(event.progress);
          }
          break;
        case 'paused':
          setIsPaused(true);
          break;
        case 'resumed':
          setIsPaused(false);
          break;
        case 'error':
          console.error('Cache warming error:', event.error);
          break;
      }
    });

    return unsubscribe;
  }, [service]);

  const start = useCallback(async () => {
    setIsActive(true);
    await service.start();
  }, [service]);

  const pause = useCallback(() => {
    service.pause();
  }, [service]);

  const resume = useCallback(() => {
    service.resume();
  }, [service]);

  const cancel = useCallback(() => {
    service.cancel();
    setIsActive(false);
    setIsPaused(false);
  }, [service]);

  return {
    start,
    pause,
    resume,
    cancel,
    isActive,
    isPaused,
    progress,
    service,
  };
}

/**
 * Hook for monitoring cache warming progress
 */
export function useCacheProgress() {
  const [progress, setProgress] = useState<WarmingProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    bytesDownloaded: 0,
    estimatedTimeRemaining: 0,
  });

  const updateProgress = useCallback((newProgress: WarmingProgress) => {
    setProgress(newProgress);
  }, []);

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms: number): string => {
    if (ms === 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    progress,
    updateProgress,
    percentage,
    formattedBytes: formatBytes(progress.bytesDownloaded),
    formattedTimeRemaining: formatTime(progress.estimatedTimeRemaining),
  };
}

/**
 * Hook for cache health monitoring
 */
export function useCacheHealth() {
  const [strategy] = useState(() => new CacheStrategyEngine());
  const [hitRate, setHitRate] = useState(0);
  const [effectiveness, setEffectiveness] = useState<'poor' | 'good' | 'excellent'>('good');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const updateHealth = useCallback(() => {
    const metrics = strategy.getHealthMetrics();
    setHitRate(metrics.hitRate);
    setEffectiveness(metrics.effectiveness);
    setRecommendations(metrics.recommendations);
  }, [strategy]);

  useEffect(() => {
    // Update health metrics periodically
    updateHealth();
    const interval = setInterval(updateHealth, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [updateHealth]);

  return {
    hitRate,
    effectiveness,
    recommendations,
    strategy,
    updateHealth,
  };
}

/**
 * Hook for automatic cache warming on mount
 */
export function useAutoWarm(config?: Partial<CacheWarmingConfig>, enabled = true) {
  const { start, isActive, progress } = useCacheWarming(config);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (enabled && !hasStarted.current && !isActive) {
      hasStarted.current = true;
      // Start warming after a short delay to not interfere with initial render
      setTimeout(() => {
        start();
      }, 1000);
    }
  }, [enabled, start, isActive]);

  return { isActive, progress };
}

/**
 * Hook for cache warming settings
 */
export function useCacheSettings() {
  const [settings, setSettings] = useState<Partial<CacheWarmingConfig>>(() => {
    const saved = localStorage.getItem('cacheWarmingSettings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      maxConcurrent: 5,
      maxSize: 500 * 1024 * 1024,
      strategies: ['popular', 'recent', 'related'],
      networkAware: true,
      respectUserPrefs: true,
    };
  });

  const updateSettings = useCallback((newSettings: Partial<CacheWarmingConfig>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('cacheWarmingSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaultSettings = {
      enabled: true,
      maxConcurrent: 5,
      maxSize: 500 * 1024 * 1024,
      strategies: ['popular', 'recent', 'related'] as ('popular' | 'recent' | 'related')[],
      networkAware: true,
      respectUserPrefs: true,
    };
    setSettings(defaultSettings);
    localStorage.setItem('cacheWarmingSettings', JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

export default useCacheWarming;
