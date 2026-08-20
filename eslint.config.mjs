import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const platformTypeScript = [
  'scripts/platform/**/*.ts',
  'tests/acceptance/**/*.ts',
  'tests/api/synthetic/**/*.ts',
  'tests/types/**/*.ts',
  'tests/web/platform-contract-validator.spec.ts',
  'tests/web/synthetic-product-runtime.spec.ts',
  'tests/platform/**/*.ts',
];

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'artifacts/**',
      'projects/**/artifacts/**',
      'projects/**/reports/playwright-report/**',
      'reports/**',
      'test-results/**',
      'tests/avalonia/**',
      'tests/web/real-project/**',
      'scratch/**',
      '**/*.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: platformTypeScript,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-async-promise-executor': 'error',
      'no-promise-executor-return': 'error',
      'no-console': 'off',
      'no-constant-binary-expression': 'error',
    },
  },
);
