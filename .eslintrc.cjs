module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
  ],
  rules: {
    // TypeScript - relaxed for build
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'warn',

    // React - relaxed for build
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/purity': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/set-state-in-effect': 'off',

    // Accessibility - relaxed for build
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    'jsx-a11y/media-has-caption': 'warn',
    'jsx-a11y/img-redundant-alt': 'warn',

    // Import organization - relaxed for build
    'import/order': 'off',

    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'no-control-regex': 'warn',
    'no-useless-catch': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'src/tests/**/*',
    'src/__tests__/**/*',
    'tests/**/*',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    'e2e/**/*',
    'qa/**/*',
  ],
};
