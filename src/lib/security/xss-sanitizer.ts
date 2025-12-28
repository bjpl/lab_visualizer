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
    const sanitized = DOMPurify.sanitize(html, { ...config, RETURN_TRUSTED_TYPE: false });

    return sanitized as unknown as string;
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

    // Clear any existing hooks first
    DOMPurify.removeAllHooks();

    // Build base config
    const config: any = {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.flattenAllowedAttributes(),
      ALLOWED_URI_REGEXP: this.buildAllowedURIRegex(),
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
      ALLOW_DATA_ATTR: this.config.allowDataAttributes || false,
    };

    // Track removed elements using DOMPurify's removed elements array
    const removedElements: any[] = [];
    (DOMPurify as any).addHook('uponSanitizeElement', (node: Element, data: any) => {
      const tagName = data.tagName?.toLowerCase();
      // Skip text nodes, comments, and internal DOMPurify nodes
      if (!tagName || tagName.startsWith('#') || tagName === 'body' || tagName === 'html') {
        return;
      }
      if (this.config.allowedTags && !this.config.allowedTags.includes(tagName)) {
        removedElements.push({ type: 'element', tag: tagName });
      }
    });

    // Track removed attributes
    DOMPurify.addHook('uponSanitizeAttribute', (node: Element, data: any) => {
      const attrName = data.attrName?.toLowerCase();
      const tagName = node.tagName?.toLowerCase();
      // Skip if no attribute name or if it's on internal nodes
      if (!attrName || !tagName || tagName.startsWith('#') || tagName === 'body' || tagName === 'html') {
        return;
      }
      // Check if this attribute is not in our allowed list
      if (this.isAttributeRemoved(tagName, attrName)) {
        removedElements.push({ type: 'attribute', attr: attrName, tag: tagName });
      }
    });

    // Block data: URLs and track their removal
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.hasAttribute('src')) {
        const src = node.getAttribute('src') || '';
        if (src.toLowerCase().startsWith('data:')) {
          removedElements.push({ type: 'attribute', attr: 'src', tag: node.tagName.toLowerCase(), reason: 'data: URL' });
          node.removeAttribute('src');
        }
      }
      if (node.hasAttribute('href')) {
        const href = node.getAttribute('href') || '';
        if (href.toLowerCase().startsWith('data:') || href.toLowerCase().startsWith('javascript:')) {
          removedElements.push({ type: 'attribute', attr: 'href', tag: node.tagName.toLowerCase(), reason: 'unsafe URL' });
          node.removeAttribute('href');
        }
      }
    });

    const sanitized = DOMPurify.sanitize(html, config) as unknown as string;

    // Remove hooks after sanitization
    DOMPurify.removeAllHooks();

    // Build removed array from tracked elements
    for (const item of removedElements) {
      if (item.type === 'element') {
        removed.push(`Element: <${item.tag}>`);
      } else if (item.type === 'attribute') {
        removed.push(`Attribute: ${item.attr} on <${item.tag}>`);
      }
    }

    return {
      sanitized,
      removed,
      safe: removed.length === 0
    };
  }

  /**
   * Check if an attribute should be removed
   */
  private isAttributeRemoved(tagName: string, attrName: string): boolean {
    // Event handlers are always removed
    if (attrName.startsWith('on')) {
      return true;
    }

    // Check if attribute is in the allowed list for this tag
    const allowedAttrs = this.config.allowedAttributes?.[tagName];
    if (!allowedAttrs) {
      // If no specific attrs defined for this tag, check global attrs
      const allAllowedAttrs = this.flattenAllowedAttributes();
      return !allAllowedAttrs.includes(attrName);
    }

    return !allowedAttrs.includes(attrName);
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
      RETURN_TRUSTED_TYPE: false,
      // Block data: and javascript: URLs
      FORBID_ATTR: [],
    };

    if (this.config.stripComments) {
      config.ALLOW_DATA_ATTR = false;
    }

    if (this.config.allowDataAttributes) {
      config.ALLOW_DATA_ATTR = true;
    }

    // Add hook to block data: URLs in src/href attributes
    DOMPurify.removeAllHooks();
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
      // Block data: URLs in src and href
      if (node.hasAttribute('src')) {
        const src = node.getAttribute('src') || '';
        if (src.toLowerCase().startsWith('data:')) {
          node.removeAttribute('src');
        }
      }
      if (node.hasAttribute('href')) {
        const href = node.getAttribute('href') || '';
        if (href.toLowerCase().startsWith('data:') || href.toLowerCase().startsWith('javascript:')) {
          node.removeAttribute('href');
        }
      }
    });

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
