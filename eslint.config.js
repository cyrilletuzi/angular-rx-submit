// @ts-check

/* To learn more about ESLint (JavaScript) rules: https://eslint.org/docs/latest/rules/ */
/* To learn more about TypeScript ESLint rules: https://typescript-eslint.io/rules/ */
/* To learn more about Angular ESLint rules, TypeScript side: https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin/docs/rules */
/* To learn more about Angular ESLint rules, HTML template side: https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin-template/docs/rules */

const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    processor: angular.processInlineTemplates,
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
      // Disallow shadow variables, allowed In JavaScript but error prone
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      // Enforce immutability
      '@typescript-eslint/prefer-readonly': 'error',
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
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true, // some Angular classes can be empty
        },
      ],
      // Enforce Angular good practices
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/sort-lifecycle-methods': 'error',
      '@angular-eslint/contextual-decorator': 'error',
      '@angular-eslint/no-attribute-decorator': 'error',
      '@angular-eslint/no-input-prefix': 'error',
      '@angular-eslint/no-lifecycle-call': 'error',
      '@angular-eslint/no-pipe-impure': 'error',
      '@angular-eslint/no-queries-metadata-property': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/runtime-localize': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/require-lifecycle-on-prototype': 'error',
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      // Disallow some erroneous imports
      'no-restricted-imports': [
        'error',
        {
          patterns: ['dist/*', 'rxjs/internal/*'],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // Enforce type safety
      '@angular-eslint/template/no-any': 'error',
      // Enforce Angular good practices
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/attributes-order': 'error',
      '@angular-eslint/template/conditional-complexity': 'error',
      '@angular-eslint/template/cyclomatic-complexity': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/prefer-template-literal': 'error',
      '@angular-eslint/template/no-nested-tags': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/no-empty-control-flow': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-built-in-pipes': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-static-string-properties': 'error',
      '@angular-eslint/template/no-inline-styles': [
        'error',
        {
          allowBindToStyle: true,
        },
      ],
      '@angular-eslint/template/button-has-type': 'error',
      // Enforce more accessibility
      '@angular-eslint/template/no-positive-tabindex': 'error',
    },
  },
  // Disable type-aware lint rules in JavaScript files
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
]);
