/**
 * XSS Sanitization Utility
 *
 * Provides comprehensive XSS protection using DOMPurify
 * Supports both client and server-side sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationConfig {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  allowedSchemes?: string[];
  allowDataAttributes?: boolean;
  allowedClasses?: { [key: string]: string[] | boolean };
  stripComments?: boolean;
  stripScripts?: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  removed: string[];
  safe: boolean;
}

/**
 * XSS Sanitizer Service
 */
export class XSSSanitizer {
  private config: SanitizationConfig;

  constructor(config?: SanitizationConfig) {
    this.config = {
      // Default safe configuration
      allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a', 'img', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'div': ['class', 'id'],
        'span': ['class'],
        'code': ['class'],
        'pre': ['class']
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowDataAttributes: false,
      allowedClasses: {},
      stripComments: true,
      stripScripts: true,
      ...config
    };
  }

  /**
   * Sanitize HTML content
   */
  public sanitize(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const config = this.buildDOMPurifyConfig();
    const sanitized = DOMPurify.sanitize(html, config);

    return sanitized;
  }

  /**
   * Sanitize with detailed report
   */
  public sanitizeWithReport(html: string): SanitizationResult {
    if (!html || typeof html !== 'string') {
      return {
        sanitized: '',
        removed: [],
        safe: true
      };
    }

    const removed: string[] = [];
    const config = this.buildDOMPurifyConfig();

    // Track removed elements
    DOMPurify.addHook('uponSanitizeElement', (node: Element, data: any) => {
      if (data.allowedTags && !data.allowedTags[data.tagName]) {
        removed.push(`Element: <${data.tagName}>`);
      }
    });

    DOMPurify.addHook('uponSanitizeAttribute', (node: Element, data: any) => {
      if (!data.keepAttr) {
        removed.push(`Attribute: ${data.attrName} on <${node.tagName}>`);
      }
    });

    const sanitized = DOMPurify.sanitize(html, config);

    // Remove hooks after sanitization
    DOMPurify.removeAllHooks();

    return {
      sanitized,
      removed,
      safe: removed.length === 0
    };
  }

  /**
   * Sanitize for safe display in React components
   */
  public sanitizeForReact(html: string): { __html: string } {
    const sanitized = this.sanitize(html);
    return { __html: sanitized };
  }

  /**
   * Check if HTML content is safe without modification
   */
  public isSafe(html: string): boolean {
    const original = html?.trim() || '';
    const sanitized = this.sanitize(html)?.trim() || '';
    return original === sanitized;
  }

  /**
   * Sanitize text content (removes all HTML)
   */
  public sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Strip all HTML tags
    const sanitized = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true
    });

    return sanitized;
  }

  /**
   * Sanitize URL
   */
  public sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url);

      // Check if scheme is allowed
      if (!this.config.allowedSchemes?.includes(parsed.protocol.replace(':', ''))) {
        return '';
      }

      // Remove javascript: and data: URLs
      if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
        return '';
      }

      return parsed.toString();
    } catch {
      // Invalid URL
      return '';
    }
  }

  /**
   * Build DOMPurify configuration
   */
  private buildDOMPurifyConfig(): any {
    const config: any = {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.flattenAllowedAttributes(),
      ALLOWED_URI_REGEXP: this.buildAllowedURIRegex(),
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false
    };

    if (this.config.stripComments) {
      config.ALLOW_DATA_ATTR = false;
    }

    if (this.config.allowDataAttributes) {
      config.ALLOW_DATA_ATTR = true;
    }

    return config;
  }

  /**
   * Flatten allowed attributes for DOMPurify
   */
  private flattenAllowedAttributes(): string[] {
    const attrs = new Set<string>();

    if (this.config.allowedAttributes) {
      Object.values(this.config.allowedAttributes).forEach(attrList => {
        attrList.forEach(attr => attrs.add(attr));
      });
    }

    return Array.from(attrs);
  }

  /**
   * Build allowed URI regex
   */
  private buildAllowedURIRegex(): RegExp {
    const schemes = this.config.allowedSchemes || ['http', 'https'];
    const pattern = `^(${schemes.join('|')}):`;
    return new RegExp(pattern, 'i');
  }

  /**
   * Sanitize multiple strings
   */
  public sanitizeBatch(htmlStrings: string[]): string[] {
    return htmlStrings.map(html => this.sanitize(html));
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): SanitizationConfig {
    return { ...this.config };
  }
}

/**
 * Preset configurations for common use cases
 */
export const SanitizationPresets = {
  /**
   * Strict preset - Only basic formatting
   */
  strict: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: {},
    stripComments: true,
    stripScripts: true
  } as SanitizationConfig,

  /**
   * Moderate preset - Basic formatting + lists + links
   */
  moderate: {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel']
    },
    stripComments: true,
    stripScripts: true
  } as SanitizationConfig,

  /**
   * Permissive preset - Rich content with images and tables
   */
  permissive: {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', 'img', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'div': ['class', 'id'],
      'span': ['class'],
      'code': ['class'],
      'pre': ['class'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan']
    },
    allowDataAttributes: false,
    stripComments: true,
    stripScripts: true
  } as SanitizationConfig
};

// Singleton instances
const defaultSanitizer = new XSSSanitizer();
const strictSanitizer = new XSSSanitizer(SanitizationPresets.strict);
const moderateSanitizer = new XSSSanitizer(SanitizationPresets.moderate);
const permissiveSanitizer = new XSSSanitizer(SanitizationPresets.permissive);

/**
 * Quick sanitization functions
 */
export const sanitize = (html: string) => defaultSanitizer.sanitize(html);
export const sanitizeStrict = (html: string) => strictSanitizer.sanitize(html);
export const sanitizeModerate = (html: string) => moderateSanitizer.sanitize(html);
export const sanitizePermissive = (html: string) => permissiveSanitizer.sanitize(html);
export const sanitizeForReact = (html: string) => defaultSanitizer.sanitizeForReact(html);

export default XSSSanitizer;
