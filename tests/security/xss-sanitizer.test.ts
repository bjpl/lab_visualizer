/**
 * XSS Sanitizer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XSSSanitizer, sanitize, sanitizeStrict, SanitizationPresets } from '@/lib/security/xss-sanitizer';

describe('XSS Sanitizer', () => {
  let sanitizer: XSSSanitizer;

  beforeEach(() => {
    sanitizer = new XSSSanitizer();
  });

  describe('sanitize', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Safe paragraph</p><strong>Bold text</strong>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Safe paragraph');
      expect(result).toContain('Bold text');
    });

    it('should remove script tags', () => {
      const html = '<p>Text</p><script>alert("XSS")</script>';
      const result = sanitizer.sanitize(html);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Text</p>');
    });

    it('should remove javascript: URLs', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizer.sanitize(html);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove onclick handlers', () => {
      const html = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizer.sanitize(html);

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).toContain('Click me');
    });

    it('should remove event handlers', () => {
      const html = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizer.sanitize(html);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should allow safe link with http/https', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Link');
    });

    it('should remove data: URLs in images', () => {
      const html = '<img src="data:text/html,<script>alert(1)</script>">';
      const result = sanitizer.sanitize(html);

      expect(result).not.toContain('data:');
      expect(result).not.toContain('script');
    });

    it('should handle empty input', () => {
      expect(sanitizer.sanitize('')).toBe('');
      expect(sanitizer.sanitize(null as any)).toBe('');
      expect(sanitizer.sanitize(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizer.sanitize(123 as any)).toBe('');
      expect(sanitizer.sanitize({} as any)).toBe('');
    });
  });

  describe('sanitizeWithReport', () => {
    it('should report removed elements', () => {
      const html = '<p>Safe</p><script>Bad</script><iframe>Bad</iframe>';
      const result = sanitizer.sanitizeWithReport(html);

      expect(result.sanitized).toContain('<p>Safe</p>');
      expect(result.sanitized).not.toContain('script');
      expect(result.removed.length).toBeGreaterThan(0);
      expect(result.safe).toBe(false);
    });

    it('should report safe HTML as safe', () => {
      const html = '<p>Safe paragraph</p><strong>Bold</strong>';
      const result = sanitizer.sanitizeWithReport(html);

      expect(result.safe).toBe(true);
      expect(result.removed.length).toBe(0);
    });

    it('should report removed attributes', () => {
      const html = '<div onclick="alert(1)" class="safe">Content</div>';
      const result = sanitizer.sanitizeWithReport(html);

      expect(result.removed.some(r => r.includes('onclick'))).toBe(true);
      expect(result.safe).toBe(false);
    });
  });

  describe('sanitizeForReact', () => {
    it('should return object suitable for dangerouslySetInnerHTML', () => {
      const html = '<p>Test content</p>';
      const result = sanitizer.sanitizeForReact(html);

      expect(result).toHaveProperty('__html');
      expect(typeof result.__html).toBe('string');
      expect(result.__html).toContain('Test content');
    });

    it('should sanitize XSS in React format', () => {
      const html = '<p>Safe</p><script>alert(1)</script>';
      const result = sanitizer.sanitizeForReact(html);

      expect(result.__html).toContain('Safe');
      expect(result.__html).not.toContain('script');
      expect(result.__html).not.toContain('alert');
    });
  });

  describe('isSafe', () => {
    it('should return true for safe HTML', () => {
      const html = '<p>Safe <strong>content</strong></p>';
      expect(sanitizer.isSafe(html)).toBe(true);
    });

    it('should return false for HTML with scripts', () => {
      const html = '<p>Text</p><script>alert(1)</script>';
      expect(sanitizer.isSafe(html)).toBe(false);
    });

    it('should return false for HTML with event handlers', () => {
      const html = '<div onclick="alert(1)">Text</div>';
      expect(sanitizer.isSafe(html)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const html = '<p>Text <strong>bold</strong></p>';
      const result = sanitizer.sanitizeText(html);

      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
      expect(result).toContain('Text');
      expect(result).toContain('bold');
    });

    it('should remove scripts while keeping text', () => {
      const html = 'Safe text<script>alert(1)</script>more text';
      const result = sanitizer.sanitizeText(html);

      expect(result).toContain('Safe text');
      expect(result).toContain('more text');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow http URLs', () => {
      const url = 'http://example.com/path';
      const result = sanitizer.sanitizeURL(url);

      expect(result).toBe(url);
    });

    it('should allow https URLs', () => {
      const url = 'https://example.com/path';
      const result = sanitizer.sanitizeURL(url);

      expect(result).toBe(url);
    });

    it('should reject javascript: URLs', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizer.sanitizeURL(url);

      expect(result).toBe('');
    });

    it('should reject data: URLs', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizer.sanitizeURL(url);

      expect(result).toBe('');
    });

    it('should reject invalid URLs', () => {
      const url = 'not a valid url';
      const result = sanitizer.sanitizeURL(url);

      expect(result).toBe('');
    });

    it('should handle empty URLs', () => {
      expect(sanitizer.sanitizeURL('')).toBe('');
      expect(sanitizer.sanitizeURL(null as any)).toBe('');
    });
  });

  describe('sanitizeBatch', () => {
    it('should sanitize multiple strings', () => {
      const htmlStrings = [
        '<p>First</p><script>bad</script>',
        '<strong>Second</strong>',
        '<div onclick="bad">Third</div>'
      ];

      const results = sanitizer.sanitizeBatch(htmlStrings);

      expect(results).toHaveLength(3);
      expect(results[0]).toContain('First');
      expect(results[0]).not.toContain('script');
      expect(results[1]).toContain('Second');
      expect(results[2]).toContain('Third');
      expect(results[2]).not.toContain('onclick');
    });
  });

  describe('presets', () => {
    describe('strict preset', () => {
      it('should only allow basic formatting', () => {
        const sanitizer = new XSSSanitizer(SanitizationPresets.strict);
        const html = '<p>Text</p><h1>Title</h1><div>Block</div>';
        const result = sanitizer.sanitize(html);

        expect(result).toContain('<p>');
        expect(result).not.toContain('<h1>');
        expect(result).not.toContain('<div>');
      });

      it('should not allow links in strict mode', () => {
        const sanitizer = new XSSSanitizer(SanitizationPresets.strict);
        const html = '<a href="https://example.com">Link</a>';
        const result = sanitizer.sanitize(html);

        expect(result).not.toContain('<a');
        expect(result).toContain('Link');
      });
    });

    describe('moderate preset', () => {
      it('should allow headings and lists', () => {
        const sanitizer = new XSSSanitizer(SanitizationPresets.moderate);
        const html = '<h1>Title</h1><ul><li>Item</li></ul>';
        const result = sanitizer.sanitize(html);

        expect(result).toContain('<h1>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
      });

      it('should allow safe links', () => {
        const sanitizer = new XSSSanitizer(SanitizationPresets.moderate);
        const html = '<a href="https://example.com">Link</a>';
        const result = sanitizer.sanitize(html);

        expect(result).toContain('<a');
        expect(result).toContain('href');
      });
    });

    describe('permissive preset', () => {
      it('should allow tables and images', () => {
        const sanitizer = new XSSSanitizer(SanitizationPresets.permissive);
        const html = '<table><tr><td>Cell</td></tr></table><img src="test.jpg">';
        const result = sanitizer.sanitize(html);

        expect(result).toContain('<table>');
        expect(result).toContain('<td>');
        expect(result).toContain('<img');
      });
    });
  });

  describe('quick functions', () => {
    it('sanitize should work', () => {
      const result = sanitize('<p>Test</p><script>bad</script>');
      expect(result).toContain('Test');
      expect(result).not.toContain('script');
    });

    it('sanitizeStrict should work', () => {
      const result = sanitizeStrict('<div>Test</div>');
      expect(result).toContain('Test');
      expect(result).not.toContain('<div>');
    });
  });

  describe('XSS attack vectors', () => {
    const attackVectors = [
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
      '<form action="javascript:alert(1)"><input type="submit"></form>',
      '<button onclick="alert(1)">Click</button>',
      '<input onfocus="alert(1)" autofocus>',
      '<select onfocus="alert(1)" autofocus>',
      '<textarea onfocus="alert(1)" autofocus>',
      '<marquee onstart="alert(1)">',
      '<div style="background:url(javascript:alert(1))">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<style>@import "javascript:alert(1)";</style>'
    ];

    attackVectors.forEach(vector => {
      it(`should block XSS vector: ${vector.substring(0, 50)}...`, () => {
        const result = sanitizer.sanitize(vector);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('javascript:');
      });
    });
  });
});
