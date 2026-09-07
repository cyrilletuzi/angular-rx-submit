// @ts-check

/* To learn more about ESLint (JavaScript) rules: https://eslint.org/docs/latest/rules/ */
/* To learn more about TypeScript ESLint rules: https://typescript-eslint.io/rules/ */
/* To learn more about Angular ESLint rules, TypeScript side: https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin/docs/rules */
/* To learn more about Angular ESLint rules, HTML template side: https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin-template/docs/rules */

const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const angularModern = require('eslint-plugin-angular-modern');

module.exports = defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
      angularModern.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Enforce type safety
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-plus-operands': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowNumberAndString: false,
          allowRegExp: false,
        },
      ],
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowNumber: false, allowString: false },
      ],
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
      // Immutability
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': [
        'error',
        {
          ignoreInferredTypes: true,
          treatMethodsAsReadonly: true,
        },
      ],
      // Loosen some annoying and inadequate empty rules
      'no-empty': [
        'error',
        {
          allowEmptyCatch: true, // `catch` is required after a `try`, but there is not always something to do inside
        },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['arrowFunctions'], // some callbacks are required (like in promises `.catch()`), but there is not always something to do inside
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends',
        },
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true, // some Angular classes can be empty
        },
      ],
      // Disable recommended Angular ESLint rules already managed by other rules
      '@angular-eslint/contextual-lifecycle': 'off',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/use-lifecycle-interface': 'off',
      // More Angular ESLint rules
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/no-developer-preview': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/no-experimental': 'error',
      '@angular-eslint/no-input-prefix': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/no-outputs-metadata-property': 'error',
      '@angular-eslint/no-pipe-impure': 'error',
      '@angular-eslint/no-queries-metadata-property': 'error',
      '@angular-eslint/pipe-prefix': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/relative-url-prefix': 'error',
      '@angular-eslint/sort-keys-in-type-decorator': 'error',
      '@angular-eslint/use-component-selector': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      // Avoid empty imports which could cause empty files during build
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // Disallow some erroneous imports
      'no-restricted-imports': [
        'error',
        {
          patterns: ['dist/*', 'rxjs/internal/*'],
        },
      ],
    },
  },
  // Disable type-aware lint rules in JavaScript files
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
]);
