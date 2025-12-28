/**
 * @file Visual Feedback Utilities
 * @description Pure utility functions for visual feedback calculations
 * @path /src/utils/visual-feedback-utils.ts
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for glow effects
 */
export interface GlowConfig {
  /** Base glow intensity (0-1) */
  baseIntensity: number;
  /** Glow radius in pixels */
  radius: number;
  /** Glow color in hex format */
  color: string;
  /** Whether to pulse the glow */
  pulse: boolean;
  /** Pulse duration in milliseconds */
  pulseDuration?: number;
}

/**
 * Style properties for highlights
 */
export interface HighlightStyle {
  /** Background color */
  backgroundColor: string;
  /** Border style */
  border?: string;
  /** Border radius */
  borderRadius?: string;
  /** Opacity (0-1) */
  opacity: number;
  /** CSS filter for glow effects */
  filter?: string;
  /** CSS transform for scaling */
  transform?: string;
  /** CSS transition for animations */
  transition?: string;
  /** Z-index for layering */
  zIndex?: number;
  /** Animation name */
  animation?: string;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable accessibility mode */
  enabled: boolean;
  /** Use high contrast colors */
  highContrast: boolean;
  /** Add visual patterns (not just color) */
  usePatterns: boolean;
  /** Respect prefers-reduced-motion */
  reduceMotion: boolean;
  /** Color vision deficiency type */
  colorBlindnessMode?: 'deuteranopia' | 'protanopia' | 'tritanopia';
}

/**
 * RGB color components
 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Visual feedback type
 */
export type SelectionType = 'selection' | 'hover' | 'residue' | 'chain';

/**
 * Pattern types for accessibility
 */
export type VisualPattern = 'solid' | 'dots' | 'stripes' | 'cross-hatch';

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert hex color to RGB components
 * @param hex - Hex color string (e.g., "#00ff00" or "00ff00")
 * @returns RGB color components
 */
export function hexToRgb(hex: string): RgbColor {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-digit hex colors
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const num = parseInt(fullHex, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB components to hex color
 * @param rgb - RGB color components
 * @returns Hex color string with # prefix
 */
export function rgbToHex(rgb: RgbColor): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert color string to hex format
 * @param color - Color in any format (hex, rgb, named)
 * @returns Hex color string
 */
export function colorToHex(color: string): string {
  // Already hex
  if (/^#?[0-9a-f]{3,6}$/i.test(color)) {
    return color.startsWith('#') ? color : `#${color}`;
  }

  // RGB format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return rgbToHex({
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    });
  }

  // Default to black if unrecognized
  return '#000000';
}

/**
 * Calculate relative luminance for WCAG contrast calculations
 * @param rgb - RGB color components
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb: RgbColor): number {
  const { r, g, b } = rgb;

  // Convert to 0-1 range and apply gamma correction
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @param color1 - First color (hex or rgb)
 * @param color2 - Second color (hex or rgb)
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(colorToHex(color1));
  const rgb2 = hexToRgb(colorToHex(color2));

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get contrasting text color (black or white) for a background
 * @param backgroundColor - Background color (hex or rgb)
 * @returns Contrasting color (#000000 or #ffffff)
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(colorToHex(backgroundColor));
  const luminance = getRelativeLuminance(rgb);

  // Use white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Adjust color for accessibility mode
 * @param color - Original color (hex)
 * @param mode - Color blindness mode
 * @returns Adjusted color (hex)
 */
export function adjustColorForAccessibility(
  color: string,
  mode?: AccessibilityConfig['colorBlindnessMode']
): string {
  if (!mode) return color;

  const rgb = hexToRgb(colorToHex(color));

  // Simplified color blindness simulation
  // In production, use proper color blindness simulation algorithms
  switch (mode) {
    case 'deuteranopia': // Red-green (no green perception)
      return rgbToHex({ r: rgb.r, g: Math.floor(rgb.g * 0.5), b: rgb.b });

    case 'protanopia': // Red-green (no red perception)
      return rgbToHex({ r: Math.floor(rgb.r * 0.5), g: rgb.g, b: rgb.b });

    case 'tritanopia': // Blue-yellow
      return rgbToHex({ r: rgb.r, g: rgb.g, b: Math.floor(rgb.b * 0.5) });

    default:
      return color;
  }
}

// ============================================================================
// Glow Effect Utilities
// ============================================================================

/**
 * Calculate glow intensity based on selection type
 * @param type - Selection type
 * @param baseIntensity - Base glow intensity (0-1)
 * @returns Calculated glow intensity (0-1)
 */
export function calculateGlowIntensity(
  type: SelectionType,
  baseIntensity: number = 0.5
): number {
  const intensityMultipliers: Record<SelectionType, number> = {
    selection: 1.0,
    hover: 1.5,      // Stronger for hover
    residue: 0.8,
    chain: 0.6,
  };

  const multiplier = intensityMultipliers[type] || 1.0;
  return Math.min(1.0, baseIntensity * multiplier);
}

/**
 * Create CSS filter string for glow effect
 * @param config - Glow configuration
 * @returns CSS filter string
 */
export function createGlowFilter(config: GlowConfig): string {
  const { radius, color, baseIntensity } = config;
  const rgb = hexToRgb(colorToHex(color));

  // Create drop-shadow filter
  const shadows = [
    `drop-shadow(0 0 ${radius}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseIntensity}))`,
    `drop-shadow(0 0 ${radius * 2}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${baseIntensity * 0.5}))`,
  ];

  return shadows.join(' ');
}

/**
 * Create pulse animation CSS
 * @param duration - Pulse duration in milliseconds
 * @returns CSS animation string
 */
export function createPulseAnimation(duration: number = 2000): string {
  return `pulse ${duration}ms ease-in-out infinite`;
}

// ============================================================================
// Highlight Style Utilities
// ============================================================================

/**
 * Create highlight style object
 * @param type - Selection type
 * @param color - Highlight color (hex)
 * @param opacity - Opacity (0-1)
 * @param options - Additional style options
 * @returns HighlightStyle object
 */
export function createHighlightStyle(
  type: SelectionType,
  color: string,
  opacity: number = 0.5,
  options: {
    scale?: number;
    animationDuration?: number;
    enableGlow?: boolean;
    glowRadius?: number;
    enablePulse?: boolean;
    reduceMotion?: boolean;
  } = {}
): HighlightStyle {
  const {
    scale = 1.1,
    animationDuration = 200,
    enableGlow = true,
    glowRadius = 8,
    enablePulse = true,
    reduceMotion = false,
  } = options;

  const hexColor = colorToHex(color);
  const rgb = hexToRgb(hexColor);

  const style: HighlightStyle = {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    opacity,
    transition: `opacity ${animationDuration}ms ease-in-out`,
  };

  // Add glow filter
  if (enableGlow) {
    const glowIntensity = calculateGlowIntensity(type);
    style.filter = createGlowFilter({
      baseIntensity: glowIntensity,
      radius: glowRadius,
      color: hexColor,
      pulse: enablePulse && !reduceMotion,
    });
  }

  // Add scale transform for selection/hover
  if (type === 'selection' || type === 'hover') {
    style.transform = `scale(${scale})`;
  }

  // Add pulse animation (unless reduced motion)
  if (enablePulse && !reduceMotion && type === 'selection') {
    style.animation = createPulseAnimation();
  }

  // Z-index layering
  const zIndexMap: Record<SelectionType, number> = {
    chain: 1,
    residue: 2,
    selection: 3,
    hover: 4,
  };
  style.zIndex = zIndexMap[type];

  return style;
}

/**
 * Create residue outline style
 * @param color - Border color (hex)
 * @returns HighlightStyle object
 */
export function createResidueOutlineStyle(color: string): HighlightStyle {
  const hexColor = colorToHex(color);

  return {
    backgroundColor: 'transparent',
    border: `2px solid ${hexColor}`,
    borderRadius: '4px',
    opacity: 1,
    zIndex: 2,
  };
}

/**
 * Create chain ribbon style
 * @param color - Ribbon color (hex)
 * @param opacity - Ribbon opacity (0-1)
 * @returns HighlightStyle object
 */
export function createChainRibbonStyle(
  color: string,
  opacity: number = 0.5
): HighlightStyle {
  const hexColor = colorToHex(color);
  const rgb = hexToRgb(hexColor);

  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    opacity: Math.max(0.3, Math.min(0.7, opacity)),
    zIndex: 1,
  };
}

// ============================================================================
// Accessibility Utilities
// ============================================================================

/**
 * Check if accessibility mode should be enabled
 * @param config - Accessibility configuration
 * @returns True if accessibility mode should be enabled
 */
export function shouldUseAccessibilityMode(config: AccessibilityConfig): boolean {
  return config.enabled || config.highContrast;
}

/**
 * Get visual pattern for selection type in accessibility mode
 * @param type - Selection type
 * @returns Visual pattern type
 */
export function getAccessibilityPattern(type: SelectionType): VisualPattern {
  const patternMap: Record<SelectionType, VisualPattern> = {
    selection: 'dots',
    hover: 'stripes',
    residue: 'cross-hatch',
    chain: 'solid',
  };

  return patternMap[type];
}

/**
 * Create CSS pattern background for accessibility
 * @param pattern - Visual pattern type
 * @param color - Pattern color (hex)
 * @returns CSS background string
 */
export function createPatternBackground(
  pattern: VisualPattern,
  color: string
): string {
  const hexColor = colorToHex(color);

  switch (pattern) {
    case 'dots':
      return `radial-gradient(circle, ${hexColor} 1px, transparent 1px)`;

    case 'stripes':
      return `repeating-linear-gradient(45deg, ${hexColor}, ${hexColor} 2px, transparent 2px, transparent 4px)`;

    case 'cross-hatch':
      return `repeating-linear-gradient(45deg, ${hexColor} 0px, ${hexColor} 1px, transparent 1px, transparent 3px), ` +
             `repeating-linear-gradient(-45deg, ${hexColor} 0px, ${hexColor} 1px, transparent 1px, transparent 3px)`;

    case 'solid':
    default:
      return hexColor;
  }
}

/**
 * Validate highlight configuration
 * @param config - Highlight configuration to validate
 * @returns Validation result with errors
 */
export function validateHighlightConfig(config: {
  color?: string;
  opacity?: number;
  intensity?: number;
  radius?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate color
  if (config.color) {
    const hexColor = colorToHex(config.color);
    if (!/^#[0-9a-f]{6}$/i.test(hexColor)) {
      errors.push('Invalid color format');
    }
  }

  // Validate opacity
  if (config.opacity !== undefined) {
    if (config.opacity < 0 || config.opacity > 1) {
      errors.push('Opacity must be between 0 and 1');
    }
  }

  // Validate intensity
  if (config.intensity !== undefined) {
    if (config.intensity < 0 || config.intensity > 1) {
      errors.push('Intensity must be between 0 and 1');
    }
  }

  // Validate radius
  if (config.radius !== undefined) {
    if (config.radius < 0 || config.radius > 50) {
      errors.push('Radius must be between 0 and 50 pixels');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default colors for different selection types
 */
export const DEFAULT_COLORS: Record<SelectionType, string> = {
  selection: '#00ff00',  // Green
  hover: '#ff00ff',      // Magenta
  residue: '#00ffff',    // Cyan
  chain: '#ffaa00',      // Orange
};

/**
 * Default glow configuration
 */
export const DEFAULT_GLOW_CONFIG: GlowConfig = {
  baseIntensity: 0.5,
  radius: 8,
  color: DEFAULT_COLORS.selection,
  pulse: true,
  pulseDuration: 2000,
};

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enabled: false,
  highContrast: false,
  usePatterns: false,
  reduceMotion: false,
};

/**
 * High contrast color palette for accessibility
 */
export const HIGH_CONTRAST_COLORS: Record<SelectionType, string> = {
  selection: '#ffff00',  // Yellow (high contrast)
  hover: '#ff0000',      // Red (high contrast)
  residue: '#00ffff',    // Cyan
  chain: '#ff6600',      // Orange
};
