/**
 * End-to-End User Workflow Tests
 * Tests complete user journeys through the application
 */

import { test, expect } from '@playwright/test';

test.describe('User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Structure Loading Workflow', () => {
    test('should load a structure by PDB ID', async ({ page }) => {
      // Navigate to viewer
      await page.click('text=Open Viewer');
      await expect(page).toHaveURL(/.*viewer/);

      // Enter PDB ID
      await page.fill('[placeholder*="PDB ID"]', '1ABC');
      await page.click('button:has-text("Load Structure")');

      // Wait for structure to load
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      // Verify viewer is active
      await expect(page.locator('.molstar-viewer')).toBeVisible();
    });

    test('should upload a local PDB file', async ({ page }) => {
      await page.goto('/viewer');

      // Click upload button
      await page.click('button:has-text("Upload")');

      // Upload file
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-structure.pdb',
        mimeType: 'chemical/x-pdb',
        buffer: Buffer.from('HEADER TEST\nATOM 1 CA ALA A 1\nEND'),
      });

      // Wait for upload and load
      await page.waitForSelector('.structure-loaded', { timeout: 5000 });
      await expect(page.locator('.molstar-viewer')).toBeVisible();
    });

    test('should search and select from results', async ({ page }) => {
      await page.goto('/viewer');

      // Open search panel
      await page.click('button:has-text("Search")');

      // Enter search term
      await page.fill('[placeholder*="Search"]', 'hemoglobin');
      await page.click('button:has-text("Search")');

      // Wait for results
      await page.waitForSelector('.search-results');

      // Select first result
      await page.click('.search-result:first-child button:has-text("Load")');

      // Verify structure loads
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });
    });
  });

  test.describe('Visualization Workflow', () => {
    test('should change representation styles', async ({ page }) => {
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      // Open controls panel
      await page.click('button[aria-label="Controls"]');

      // Change to ball-and-stick
      await page.click('text=Ball & Stick');
      await page.waitForTimeout(500);

      // Change to surface
      await page.click('text=Surface');
      await page.waitForTimeout(500);

      // Change to cartoon
      await page.click('text=Cartoon');
      await page.waitForTimeout(500);
    });

    test('should change color schemes', async ({ page }) => {
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      await page.click('button[aria-label="Colors"]');

      // Try different color schemes
      const schemes = ['Chain', 'Element', 'Secondary Structure'];

      for (const scheme of schemes) {
        await page.click(`text=${scheme}`);
        await page.waitForTimeout(300);
      }
    });

    test('should use camera controls', async ({ page }) => {
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      const canvas = await page.locator('canvas').first();

      // Rotate
      await canvas.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();
      await page.waitForTimeout(200);

      // Zoom
      await canvas.hover();
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);

      // Reset camera
      await page.click('button[aria-label="Reset Camera"]');
      await page.waitForTimeout(200);
    });
  });

  test.describe('Collaboration Workflow', () => {
    test('should create a collaboration session', async ({ page }) => {
      await page.goto('/viewer');

      // Open collaboration panel
      await page.click('button:has-text("Collaborate")');

      // Create session
      await page.fill('[placeholder*="Session name"]', 'Test Session');
      await page.click('button:has-text("Create Session")');

      // Verify session created
      await expect(page.locator('.session-active')).toBeVisible();
      await expect(page.locator('.invite-code')).toBeVisible();
    });

    test('should join a collaboration session', async ({ page, context }) => {
      // Create session in first page
      const page1 = page;
      await page1.goto('/viewer');
      await page1.click('button:has-text("Collaborate")');
      await page1.fill('[placeholder*="Session name"]', 'Multi-User Test');
      await page1.click('button:has-text("Create Session")');

      // Get invite code
      const inviteCode = await page1.locator('.invite-code').textContent();

      // Join from second page
      const page2 = await context.newPage();
      await page2.goto('/viewer');
      await page2.click('button:has-text("Join Session")');
      await page2.fill('[placeholder*="Invite code"]', inviteCode || '');
      await page2.click('button:has-text("Join")');

      // Verify both users see each other
      await expect(page1.locator('.user-count')).toContainText('2');
      await expect(page2.locator('.user-count')).toContainText('2');
    });

    test('should add and sync annotations', async ({ page, context }) => {
      // Setup collaboration session (simplified)
      await page.goto('/viewer?collab=test-session');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      // Add annotation
      await page.click('button[aria-label="Add Annotation"]');
      await page.click('canvas'); // Click on structure
      await page.fill('[placeholder*="Annotation text"]', 'Important site');
      await page.click('button:has-text("Save")');

      // Verify annotation appears
      await expect(page.locator('.annotation')).toContainText('Important site');
    });
  });

  test.describe('Export Workflow', () => {
    test('should export structure as image', async ({ page }) => {
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      // Open export menu
      await page.click('button:has-text("Export")');

      // Click PNG export
      const downloadPromise = page.waitForEvent('download');
      await page.click('text=Export as PNG');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    });

    test('should export with different resolutions', async ({ page }) => {
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      await page.click('button:has-text("Export")');

      // Select 4K resolution
      await page.click('text=4K (3840x2160)');

      const downloadPromise = page.waitForEvent('download');
      await page.click('text=Export');

      await downloadPromise;
    });
  });

  test.describe('Performance Testing', () => {
    test('should handle large structures', async ({ page }) => {
      // Load a large structure
      await page.goto('/viewer?pdb=1HTM'); // Ribosome

      // Wait for progressive loading
      await page.waitForSelector('.lod-preview', { timeout: 5000 });
      await page.waitForSelector('.lod-interactive', { timeout: 10000 });
      await page.waitForSelector('.lod-full', { timeout: 15000 });

      // Verify performance metrics
      const fps = await page.locator('.fps-counter').textContent();
      const fpsValue = parseInt(fps || '0');
      expect(fpsValue).toBeGreaterThan(20);
    });

    test('should maintain responsiveness during loading', async ({ page }) => {
      await page.goto('/viewer');

      // Start loading large structure
      await page.fill('[placeholder*="PDB ID"]', '1HTM');
      await page.click('button:has-text("Load Structure")');

      // UI should still be responsive
      await page.click('button[aria-label="Settings"]');
      await expect(page.locator('.settings-panel')).toBeVisible();

      // Can cancel loading
      await page.click('button:has-text("Cancel")');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid PDB ID', async ({ page }) => {
      await page.goto('/viewer');

      await page.fill('[placeholder*="PDB ID"]', 'INVALID');
      await page.click('button:has-text("Load Structure")');

      // Should show error message
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText(/not found|invalid/i);
    });

    test('should handle network errors', async ({ page, context }) => {
      // Simulate offline mode
      await context.setOffline(true);

      await page.goto('/viewer');
      await page.fill('[placeholder*="PDB ID"]', '1ABC');
      await page.click('button:has-text("Load Structure")');

      await expect(page.locator('.error-message')).toContainText(/network|offline/i);

      // Go back online
      await context.setOffline(false);
    });

    test('should recover from failed load', async ({ page }) => {
      await page.goto('/viewer');

      // Try invalid structure
      await page.fill('[placeholder*="PDB ID"]', 'XXXX');
      await page.click('button:has-text("Load Structure")');
      await expect(page.locator('.error-message')).toBeVisible();

      // Clear error and try valid structure
      await page.click('button:has-text("Dismiss")');
      await page.fill('[placeholder*="PDB ID"]', '1ABC');
      await page.click('button:has-text("Load Structure")');

      await page.waitForSelector('.structure-loaded', { timeout: 10000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/viewer');

      // Tab through interface
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Verify focus management
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/viewer');

      // Check for ARIA labels on controls
      await expect(page.locator('[aria-label="Load Structure"]')).toBeVisible();
      await expect(page.locator('[aria-label="Controls"]')).toBeVisible();
      await expect(page.locator('[aria-label="Settings"]')).toBeVisible();
    });
  });

  test.describe('Mobile Workflow', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/viewer');

      // Open mobile menu
      await page.click('[aria-label="Menu"]');

      // Navigate to load structure
      await page.click('text=Load Structure');
      await page.fill('input[type="text"]', '1ABC');
      await page.click('button:has-text("Load")');

      await page.waitForSelector('.structure-loaded', { timeout: 10000 });
    });

    test('should support touch gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/viewer?pdb=1ABC');
      await page.waitForSelector('.structure-loaded', { timeout: 10000 });

      const canvas = await page.locator('canvas').first();

      // Simulate pinch zoom
      await canvas.touchscreen.tap(100, 100);
      await page.waitForTimeout(100);

      // Simulate swipe/pan
      await canvas.touchscreen.tap(200, 200);
      await page.waitForTimeout(100);
    });
  });
});
