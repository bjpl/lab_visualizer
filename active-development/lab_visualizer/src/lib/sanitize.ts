/**
 * Sanitization Utilities
 *
 * Provides XSS protection through DOMPurify sanitization.
 * All user-generated content should be sanitized before rendering.
 *
 * @security XSS Protection
 * @module lib/sanitize
 */

import * as DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for different sanitization contexts
 */
interface SanitizeOptions {
  /**
   * Allow HTML tags (for rich text content)
   * Default: false (strips all HTML)
   */
  allowHTML?: boolean;

  /**
   * Allow specific HTML tags
   * Example: ['b', 'i', 'em', 'strong', 'a']
   */
  allowedTags?: string[];

  /**
   * Allow specific attributes
   * Example: ['href', 'title']
   */
  allowedAttributes?: string[];
}

/**
 * Default safe configuration for plain text
 * Strips all HTML tags and dangerous content
 */
const SAFE_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Configuration for safe HTML rendering
 * Allows basic formatting tags but removes dangerous elements
 */
const SAFE_HTML_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
    // Structure
    'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Links (href is sanitized)
    'a',
    // Media (src is sanitized)
    'img',
    // Code
    'code', 'pre',
    // Quotes
    'blockquote',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'class', 'id',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitize plain text content
 * Removes all HTML tags while preserving text content
 *
 * @param input - Raw user input
 * @returns Sanitized plain text
 *
 * @example
 * ```ts
 * sanitizeText('<script>alert("xss")</script>Hello') // Returns: 'Hello'
 * sanitizeText('Normal text') // Returns: 'Normal text'
 * ```
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = DOMPurify.sanitize(input, SAFE_TEXT_CONFIG);
  return sanitized.trim();
}

/**
 * Sanitize HTML content
 * Allows safe HTML tags while removing dangerous elements and scripts
 *
 * @param input - Raw HTML input
 * @param options - Custom sanitization options
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 *
 * @example
 * ```ts
 * sanitizeHTML('<p>Hello <b>world</b></p>')
 * // Returns: '<p>Hello <b>world</b></p>'
 *
 * sanitizeHTML('<script>alert("xss")</script><p>Safe</p>')
 * // Returns: '<p>Safe</p>'
 *
 * sanitizeHTML('<a href="javascript:alert()">Click</a>')
 * // Returns: '<a>Click</a>' (dangerous href removed)
 * ```
 */
export function sanitizeHTML(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (!input) return '';

  let config: DOMPurify.Config = { ...SAFE_HTML_CONFIG };

  // Apply custom options
  if (options.allowedTags) {
    config.ALLOWED_TAGS = options.allowedTags;
  }

  if (options.allowedAttributes) {
    config.ALLOWED_ATTR = options.allowedAttributes;
  }

  if (!options.allowHTML) {
    config = SAFE_TEXT_CONFIG;
  }

  const sanitized = DOMPurify.sanitize(input, config);
  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 *
 * @example
 * ```ts
 * sanitizeURL('https://example.com') // Returns: 'https://example.com'
 * sanitizeURL('javascript:alert(1)') // Returns: ''
 * sanitizeURL('data:text/html,<script>') // Returns: ''
 * ```
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Block dangerous protocols
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:')
  ) {
    return '';
  }

  return trimmed;
}

/**
 * Create a safe object for React's dangerouslySetInnerHTML
 *
 * @param html - HTML content to sanitize
 * @param options - Sanitization options
 * @returns Object suitable for dangerouslySetInnerHTML prop
 *
 * @example
 * ```tsx
 * <div {...createSafeHTML('<p>Hello</p>')} />
 * // Equivalent to:
 * // <div dangerouslySetInnerHTML={{ __html: '<p>Hello</p>' }} />
 * ```
 */
export function createSafeHTML(
  html: string | null | undefined,
  options: SanitizeOptions = { allowHTML: true }
): { dangerouslySetInnerHTML: { __html: string } } {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHTML(html, options),
    },
  };
}

/**
 * Sanitize an object's string properties recursively
 * Useful for sanitizing API responses or form data
 *
 * @param obj - Object to sanitize
 * @returns New object with sanitized string values
 *
 * @example
 * ```ts
 * sanitizeObject({
 *   name: '<script>alert(1)</script>John',
 *   bio: '<b>Developer</b>'
 * })
 * // Returns: { name: 'John', bio: 'Developer' }
 * ```
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (value !== null && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Hook for sanitizing user input in real-time
 * Useful for form inputs and textareas
 *
 * @param value - Current input value
 * @returns Sanitized value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [value, setValue] = useState('');
 *
 *   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const sanitized = useSanitizedInput(e.target.value);
 *     setValue(sanitized);
 *   };
 *
 *   return <input value={value} onChange={handleChange} />;
 * }
 * ```
 */
export function useSanitizedInput(value: string): string {
  return sanitizeText(value);
}

/**
 * Security best practices documentation
 *
 * @security XSS Prevention Guidelines
 *
 * 1. **Always sanitize user input** before rendering:
 *    - Use sanitizeText() for plain text (toast messages, titles, labels)
 *    - Use sanitizeHTML() for rich text (article content, descriptions)
 *    - Use sanitizeURL() for href and src attributes
 *
 * 2. **Prefer React's automatic escaping**:
 *    - Use {variable} in JSX (React auto-escapes)
 *    - Only use dangerouslySetInnerHTML when absolutely necessary
 *
 * 3. **Never trust user input**:
 *    - Sanitize all data from forms, query params, localStorage
 *    - Sanitize data from APIs if content is user-generated
 *
 * 4. **Defense in depth**:
 *    - Sanitize on input (client-side)
 *    - Validate on server (API routes)
 *    - Sanitize before rendering (components)
 *
 * 5. **Content Security Policy**:
 *    - Configure CSP headers to prevent inline scripts
 *    - Use nonce-based script loading where possible
 *
 * 6. **Regular updates**:
 *    - Keep DOMPurify updated for latest security patches
 *    - Monitor security advisories
 */
