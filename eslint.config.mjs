// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Replaces .eslintignore
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'openapi.json'] },

  // Base JS rules
  js.configs.recommended,

  // TS rules (fast, no type-check)
  ...tseslint.configs.recommended,

  // Project rules for TS (single place where plugin 'import' is declared)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    settings: {
      'import/resolver': {
        typescript: { project: ['tsconfig.json'] },
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Bring in eslint-plugin-import recommended rules without redefining the plugin elsewhere
      ...importPlugin.flatConfigs.recommended.rules,

      // Your rules
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'sort-imports': [
        'warn',
        { ignoreCase: true, ignoreDeclarationSort: true, allowSeparatedGroups: true },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Jest test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: { 'no-console': 'off' },
  },

  // Turn off formatting-conflicting rules
  eslintConfigPrettier,
];
