import { Color } from '@/types/database';

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculate color brightness (0-255)
 */
export function getColorBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128;
  // Calculate perceived brightness
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

/**
 * Determine if a color needs light or dark text
 */
export function needsLightText(hex: string): boolean {
  return getColorBrightness(hex) < 128;
}

/**
 * Get contrasting text color for a background
 */
export function getContrastingTextColor(hex: string): string {
  return needsLightText(hex) ? '#FFFFFF' : '#000000';
}

/**
 * Generate a gradient from a color
 */
export function generateGradient(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `linear-gradient(135deg, ${hex} 0%, ${hex} 100%)`;

  // Create a lighter version
  const lighter = {
    r: Math.min(255, rgb.r + 40),
    g: Math.min(255, rgb.g + 40),
    b: Math.min(255, rgb.b + 40),
  };

  const lighterHex = rgbToHex(lighter.r, lighter.g, lighter.b);
  return `linear-gradient(135deg, ${lighterHex} 0%, ${hex} 100%)`;
}

/**
 * Get color category emoji
 */
export function getColorCategoryEmoji(category: string | null): string {
  const emojiMap: Record<string, string> = {
    primary: '🔴',
    secondary: '🟠',
    tertiary: '🟣',
    neutral: '⚪',
    earth: '🟤',
    light: '💡',
    dark: '🌑',
    bright: '✨',
    warm: '🔥',
  };
  return emojiMap[category || ''] || '🎨';
}

/**
 * Sort colors by hue
 */
export function sortColorsByHue(colors: Color[]): Color[] {
  return [...colors].sort((a, b) => {
    const rgbA = { r: a.rgb_r, g: a.rgb_g, b: a.rgb_b };
    const rgbB = { r: b.rgb_r, g: b.rgb_g, b: b.rgb_b };

    const hueA = getHue(rgbA);
    const hueB = getHue(rgbB);

    return hueA - hueB;
  });
}

function getHue(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  return hue;
}

/**
 * Format color name for display
 */
export function formatColorName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Get Spanish color article
 */
export function getSpanishArticle(colorName: string): string {
  // Most colors in Spanish are masculine
  const feminineColors = ['rosa', 'naranja'];

  if (feminineColors.some(c => colorName.includes(c))) {
    return 'la';
  }
  return 'el';
}

/**
 * Create accessible color palette
 */
export function createAccessiblePalette(baseHex: string): {
  base: string;
  light: string;
  lighter: string;
  dark: string;
  darker: string;
} {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return {
    base: baseHex,
    light: baseHex,
    lighter: baseHex,
    dark: baseHex,
    darker: baseHex,
  };

  return {
    base: baseHex,
    light: rgbToHex(
      Math.min(255, rgb.r + 30),
      Math.min(255, rgb.g + 30),
      Math.min(255, rgb.b + 30)
    ),
    lighter: rgbToHex(
      Math.min(255, rgb.r + 60),
      Math.min(255, rgb.g + 60),
      Math.min(255, rgb.b + 60)
    ),
    dark: rgbToHex(
      Math.max(0, rgb.r - 30),
      Math.max(0, rgb.g - 30),
      Math.max(0, rgb.b - 30)
    ),
    darker: rgbToHex(
      Math.max(0, rgb.r - 60),
      Math.max(0, rgb.g - 60),
      Math.max(0, rgb.b - 60)
    ),
  };
}
