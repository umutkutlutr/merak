// Shared ESLint flat-config fragments. Each app composes its own eslint.config.js from these.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseIgnores = ['**/dist/**', '**/build/**', '**/node_modules/**', '**/.expo/**', '**/drizzle/**'];

export const baseConfigs = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
];
