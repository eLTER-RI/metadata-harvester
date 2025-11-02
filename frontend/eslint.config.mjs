// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'max-len': [
        'error',
        {
          code: 120,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': ['error', { printWidth: 120 }],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'prettier/prettier': ['error', { printWidth: 120 }],
    },
  },
  prettierRecommended,
);
