import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import playwrightPlugin from 'eslint-plugin-playwright';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    {
        plugins: {
            jest: jestPlugin,
            playwright: playwrightPlugin,
            jsdoc: jsdocPlugin
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...jestPlugin.environments.globals.globals
            }
        },
        settings: {
            jsdoc: {
                mode: 'typescript'
            }
        },
        rules: {
            // Jest plugin rules
            ...jestPlugin.configs.recommended.rules,
            // Playwright plugin rules
            ...playwrightPlugin.configs.recommended.rules,
            // JSDoc plugin rules
            ...jsdocPlugin.configs.recommended.rules,
            // Our custom rules
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'space-in-parens': ['error', 'always'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'always'],
            'comma-spacing': ['error', { 'before': false, 'after': true }],
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': ['error', 'always'],
            'func-call-spacing': ['error', 'never'],
            'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
            'jsdoc/require-jsdoc': ['error', {
                'require': {
                    'FunctionDeclaration': true,
                    'MethodDefinition': true,
                    'ClassDeclaration': true,
                    'ArrowFunctionExpression': true,
                    'FunctionExpression': true
                }
            }],
            'jsdoc/require-description': ['error'],
            'jsdoc/require-param-description': ['error'],
            'jsdoc/require-returns-description': ['error'],
            'jsdoc/tag-lines': ['warn', 'any', {
                startLines: 1,
                endLines: 0,
                applyToEndTag: false
            }],
            'jsdoc/require-example': ['error', {
                'exemptedBy': ['private', 'internal'],
                'exemptNoArguments': true
            }]
        }
    },
    {
        files: ['**/playwright.config.js', '**/vite.config.mjs'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                'process': 'readonly'
            }
        }
    },
    {
        files: ['**/*.cjs'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                '__dirname': 'readonly',
                '__filename': 'readonly',
                'process': 'readonly',
                'module': 'readonly',
                'require': 'readonly',
                'exports': 'writable',
                'console': 'readonly',
                'URL': 'readonly',
                'crypto': 'readonly',
                'alert': 'readonly'
            }
        }
    },
    {
        files: ['**/*.test.js', '**/*.spec.js'],
        rules: {
            'jsdoc/require-example': 'off'
        }
    },
    {
        files: ['**/*.test.js', '**/*.spec.js', 'tests/setup/*.js'],
        languageOptions: {
            globals: {
                'window': 'writable',
                'console': 'readonly',
                'document': 'readonly',
                'URL': 'readonly',
                'crypto': 'readonly',
                'jest': 'readonly'
            }
        }
    },
    {
    files: ['src/**/*.js'],
        languageOptions: {
            globals: {
                'window': 'readonly',
                'console': 'readonly',
                'document': 'readonly',
                'URL': 'readonly',
                'crypto': 'readonly',
                'alert': 'readonly'
            }
        }
    },
    {
        ignores: [
            "playwright-report/",
            "tests/"
        ]
    },
    prettierConfig
];