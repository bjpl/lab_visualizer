/**
 * Quality Manager
 * Dynamic quality adjustment based on real-time FPS monitoring
 * Handles automatic degradation and upgrade based on performance
 */

import { LODLevel, RenderFeatures } from '../lib/lod-manager';

export enum QualityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  ULTRA = 4,
  EXTREME = 5,
}

export interface QualitySettings {
  level: QualityLevel;
  autoAdjust: boolean;
  targetFPS: number;
  minFPS: number;
  renderScale: number;
  features: RenderFeatures;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsed: number;
  gpuTime?: number;
  cpuTime?: number;
}

export interface DeviceCapability {
  tier: 'low' | 'medium' | 'high' | 'ultra';
  gpuVendor: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  hasWebGL2: boolean;
  hasInstancing: boolean;
  recommendedQuality: QualityLevel;
  maxAtoms: number;
}

/**
 * Quality level configurations
 */
export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  [QualityLevel.LOW]: {
    level: QualityLevel.LOW,
    autoAdjust: true,
    targetFPS: 60,
    minFPS: 30,
    renderScale: 0.5,
    features: {
      backboneOnly: true,
      secondaryStructure: false,
      sidechains: false,
      surfaces: false,
      shadows: false,
      ambientOcclusion: false,
      antialiasing: 'none',
      ligands: 'none',
    },
  },
  [QualityLevel.MEDIUM]: {
    level: QualityLevel.MEDIUM,
    autoAdjust: true,
    targetFPS: 60,
    minFPS: 30,
    renderScale: 0.75,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: false,
      surfaces: false,
      shadows: false,
      ambientOcclusion: false,
      antialiasing: 'fxaa',
      ligands: 'simple',
    },
  },
  [QualityLevel.HIGH]: {
    level: QualityLevel.HIGH,
    autoAdjust: true,
    targetFPS: 60,
    minFPS: 30,
    renderScale: 1.0,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: true,
      surfaces: false,
      shadows: false,
      ambientOcclusion: false,
      antialiasing: 'fxaa',
      ligands: 'detailed',
    },
  },
  [QualityLevel.ULTRA]: {
    level: QualityLevel.ULTRA,
    autoAdjust: true,
    targetFPS: 60,
    minFPS: 30,
    renderScale: 1.0,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: true,
      surfaces: true,
      shadows: true,
      ambientOcclusion: false,
      antialiasing: 'msaa',
      ligands: 'detailed',
    },
  },
  [QualityLevel.EXTREME]: {
    level: QualityLevel.EXTREME,
    autoAdjust: true,
    targetFPS: 60,
    minFPS: 30,
    renderScale: 1.0,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: true,
      surfaces: true,
      shadows: true,
      ambientOcclusion: true,
      antialiasing: 'msaa',
      ligands: 'detailed',
    },
  },
};

export interface QualityManagerCallbacks {
  onQualityChange?: (settings: QualitySettings, reason: string) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onWarning?: (message: string) => void;
}

export class QualityManager {
  private currentSettings: QualitySettings;
  private deviceCapability: DeviceCapability | null = null;
  private callbacks: QualityManagerCallbacks;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private monitoringInterval: number | null = null;
  private adjustmentCooldown: number = 0;
  private readonly COOLDOWN_MS = 3000; // 3 seconds between adjustments
  private readonly FPS_HISTORY_SIZE = 120; // 2 seconds at 60fps

  constructor(
    initialQuality: QualityLevel = QualityLevel.HIGH,
    callbacks: QualityManagerCallbacks = {}
  ) {
    this.currentSettings = { ...QUALITY_PRESETS[initialQuality] };
    this.callbacks = callbacks;
    this.metrics = this.createEmptyMetrics();
  }

  /**
   * Initialize quality manager
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    // Detect device capabilities
    this.deviceCapability = await this.detectDeviceCapability(canvas);

    // Apply recommended settings for device
    if (this.currentSettings.autoAdjust) {
      this.applyQualityLevel(
        this.deviceCapability.recommendedQuality,
        'Device capability detection'
      );
    }

    // Start performance monitoring
    this.startMonitoring();
  }

  /**
   * Detect device rendering capabilities
   */
  private async detectDeviceCapability(
    canvas: HTMLCanvasElement
  ): Promise<DeviceCapability> {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      return this.createLowEndCapability();
    }

    const hasWebGL2 = !!canvas.getContext('webgl2');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuVendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown'
      : 'Unknown';

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const hasInstancing = !!(gl as any).drawArraysInstanced || !!gl.getExtension('ANGLE_instanced_arrays');

    // Determine tier based on capabilities
    let tier: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    let recommendedQuality = QualityLevel.MEDIUM;
    let maxAtoms = 10000;

    // Check for mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      tier = 'low';
      recommendedQuality = QualityLevel.LOW;
      maxAtoms = 5000;
    } else if (maxTextureSize >= 16384 && hasWebGL2 && hasInstancing) {
      tier = 'ultra';
      recommendedQuality = QualityLevel.ULTRA;
      maxAtoms = 100000;
    } else if (maxTextureSize >= 8192 && hasWebGL2) {
      tier = 'high';
      recommendedQuality = QualityLevel.HIGH;
      maxAtoms = 50000;
    } else if (maxTextureSize >= 4096) {
      tier = 'medium';
      recommendedQuality = QualityLevel.MEDIUM;
      maxAtoms = 10000;
    } else {
      tier = 'low';
      recommendedQuality = QualityLevel.LOW;
      maxAtoms = 5000;
    }

    return {
      tier,
      gpuVendor,
      maxTextureSize,
      maxRenderbufferSize,
      hasWebGL2,
      hasInstancing,
      recommendedQuality,
      maxAtoms,
    };
  }

  /**
   * Create low-end device capability profile
   */
  private createLowEndCapability(): DeviceCapability {
    return {
      tier: 'low',
      gpuVendor: 'Unknown',
      maxTextureSize: 2048,
      maxRenderbufferSize: 2048,
      hasWebGL2: false,
      hasInstancing: false,
      recommendedQuality: QualityLevel.LOW,
      maxAtoms: 1000,
    };
  }

  /**
   * Start real-time performance monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval !== null) {
      return; // Already monitoring
    }

    let lastTime = performance.now();
    let frameCount = 0;

    const monitor = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        // Calculate FPS
        const fps = (frameCount / deltaTime) * 1000;
        this.updateMetrics({ fps, frameTime: 1000 / fps });

        // Reset counters
        frameCount = 0;
        lastTime = currentTime;

        // Auto-adjust quality if enabled
        if (this.currentSettings.autoAdjust && this.adjustmentCooldown <= 0) {
          this.autoAdjustQuality();
        }

        // Decrease cooldown
        if (this.adjustmentCooldown > 0) {
          this.adjustmentCooldown -= 1000;
        }
      }

      frameCount++;
      this.monitoringInterval = requestAnimationFrame(monitor) as unknown as number;
    };

    monitor();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      cancelAnimationFrame(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(update: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...update };

    // Track FPS history
    if (update.fps !== undefined) {
      this.fpsHistory.push(update.fps);
      if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
        this.fpsHistory.shift();
      }
    }

    this.callbacks.onMetricsUpdate?.(this.metrics);
  }

  /**
   * Automatic quality adjustment based on FPS
   */
  private autoAdjustQuality(): void {
    if (this.fpsHistory.length < 30) {
      return; // Not enough data yet
    }

    const avgFPS = this.getAverageFPS();
    const { targetFPS, minFPS, level } = this.currentSettings;

    // Check if we need to downgrade
    if (avgFPS < minFPS) {
      if (level > QualityLevel.LOW) {
        this.applyQualityLevel(
          (level - 1) as QualityLevel,
          `FPS too low (${avgFPS.toFixed(1)} < ${minFPS})`
        );
        this.adjustmentCooldown = this.COOLDOWN_MS;
      } else {
        this.callbacks.onWarning?.(
          `Performance is poor (${avgFPS.toFixed(1)} FPS) but already at lowest quality`
        );
      }
    }
    // Check if we can upgrade
    else if (avgFPS > targetFPS * 1.2) {
      // 20% margin above target
      if (level < QualityLevel.EXTREME) {
        const recommendedMax = this.deviceCapability?.recommendedQuality || QualityLevel.HIGH;
        const nextLevel = Math.min((level + 1) as QualityLevel, recommendedMax);

        if (nextLevel > level) {
          this.applyQualityLevel(
            nextLevel,
            `FPS stable above target (${avgFPS.toFixed(1)} > ${targetFPS})`
          );
          this.adjustmentCooldown = this.COOLDOWN_MS;
        }
      }
    }
  }

  /**
   * Calculate average FPS from history
   */
  private getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  /**
   * Apply quality level
   */
  applyQualityLevel(level: QualityLevel, reason: string = 'Manual'): void {
    const newSettings = { ...QUALITY_PRESETS[level] };
    this.currentSettings = newSettings;
    this.fpsHistory = []; // Reset FPS history after change
    this.callbacks.onQualityChange?.(newSettings, reason);
  }

  /**
   * Get current quality settings
   */
  getSettings(): QualitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get device capability
   */
  getDeviceCapability(): DeviceCapability | null {
    return this.deviceCapability;
  }

  /**
   * Toggle auto-adjust
   */
  setAutoAdjust(enabled: boolean): void {
    this.currentSettings.autoAdjust = enabled;
  }

  /**
   * Manually set quality level
   */
  setQualityLevel(level: QualityLevel): void {
    this.applyQualityLevel(level, 'Manual override');
  }

  /**
   * Update render metrics from renderer
   */
  updateRenderMetrics(
    drawCalls: number,
    triangles: number,
    memoryUsed: number
  ): void {
    this.updateMetrics({ drawCalls, triangles, memoryUsed });
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      memoryUsed: 0,
    };
  }

  /**
   * Dispose of quality manager
   */
  dispose(): void {
    this.stopMonitoring();
    this.fpsHistory = [];
  }
}

/**
 * Factory function
 */
export function createQualityManager(
  initialQuality?: QualityLevel,
  callbacks?: QualityManagerCallbacks
): QualityManager {
  return new QualityManager(initialQuality, callbacks);
}
