import { baseConfigs, baseIgnores } from '../../packages/config/eslint.base.js';

export default [
  { ignores: baseIgnores },
  ...baseConfigs,
  {
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { projectService: false } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
