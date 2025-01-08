/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['lib/*', 'tests/*', '*.js', '*.ts', 'src/__test__/*', '**/*.test.ts', 'test/*'],
  },
  // TODO: use the new flat config method for prettier and typescript configs
  ...compat.extends('airbnb-base', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),
  {
    files: ['**/*.ts', '**/*.js'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
      importPlugin,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: './',
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      'no-plusplus': 'off',
      'class-methods-use-this': 'off',
      'no-bitwise': 'off',
      'no-underscore-dangle': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],

      '@typescript-eslint/no-this-alias': 'off',
      'import/prefer-default-export': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      'no-restricted-syntax': 'off',

      'import/no-unresolved': [
        'error',
        {
          ignore: ['^virtual:'],
        },
      ],

      'consistent-return': 'off',
      'no-continue': 'off',
      'no-eval': 'off',
      'no-await-in-loop': 'off',
      'no-nested-ternary': 'off',

      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],

      'prefer-destructuring': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],

      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index', 'unknown'],

          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
  },
];
