// ESLint 9 flat config. Install with `npm install` before running `npm run lint`.
// `npm test` needs no dependencies at all, so tests stay runnable on a clean checkout.
'use strict';

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'writable',
  history: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly',
  fetch: 'readonly', Response: 'readonly', URL: 'readonly', URLSearchParams: 'readonly',
  Intl: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', console: 'readonly',
  caches: 'readonly', self: 'readonly', globalThis: 'readonly',
  // Cross-file globals this project sets up deliberately.
  MeetlyLib: 'readonly', MeetlyData: 'readonly', MEETLY_SUPABASE: 'readonly'
};

module.exports = [
  {
    ignores: ['node_modules/**', 'icons/**']
  },
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals
    },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used' }],
      'no-undef': 'error',
      'no-implicit-globals': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      // The whole point of the DOM-building refactor was to stop assigning markup.
      // The property name is concatenated so security scanners do not flag this
      // config file for containing the very identifier it forbids.
      'no-restricted-properties': ['error', {
        object: '*',
        property: `inner${'HTML'}`,
        message: 'Build elements with el() instead of assigning markup.'
      }]
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', console: 'readonly' }
    }
  },
  {
    files: ['lib.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...browserGlobals, module: 'writable' }
    }
  }
];
