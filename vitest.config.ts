import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/*.d.ts',
        'dist/',
        '.next/',
        '.github/',
        'vitest.config.ts',
        'playwright.config.ts',
        'next.config.js',
        'tailwind.config.ts',
        'postcss.config.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'app/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'e2e',
      // Playwright tests should be run separately
      '**/phase2-features.test.ts',
      // TDD tests requiring MolStar context (remaining)
      '**/3d-visualization.test.ts',
      '**/hbond-renderer.test.ts',
      '**/hydrogen-bond-renderer.test.ts',
      '**/measurement-visualization.test.ts',
      '**/selection-performance.test.ts',
      '**/highlighting-performance.test.ts',
      // Rate limit tests require Redis - skip in CI
      '**/rate-limit-advanced.test.ts',
      '**/rateLimiter.test.ts',
      '**/rate-limiter.test.ts',
      // Component tests requiring Mol* viewer - run separately
      '**/MolStarViewer.test.tsx',
      '**/HydrogenBondsPanel.test.tsx',
      // Integration tests requiring full environment
      '**/collaboration-integration.test.ts',
      '**/collaboration-viewer.test.ts',
      '**/molstar-lod.test.ts',
      '**/molstar-service-extended.test.ts',
      '**/molstar-service-apis.test.ts',
      '**/molstar-lod-bridge.test.ts',
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/features': resolve(__dirname, './src/features'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/config': resolve(__dirname, './src/config'),
    },
  },
});
