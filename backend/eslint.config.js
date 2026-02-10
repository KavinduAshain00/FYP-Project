const js = require('@eslint/js');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/**', 'package-lock.json'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      // Unused vars: warn, ignore _prefixed
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',

      // Code standards: consistency & safety
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'consistent-return': 'warn',
      'no-implicit-coercion': 'warn',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-throw-literal': 'error',
      'prefer-template': 'warn',
      'prefer-arrow-callback': ['warn', { allowNamedFunctions: true }],
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
      'no-trailing-spaces': 'warn',
    },
  },
  eslintConfigPrettier,
];
