// @ts-check

import Prettier from 'eslint-plugin-prettier/recommended';
import TypescriptEslint from 'typescript-eslint';
import EsPromise from 'eslint-plugin-promise';
import { defineConfig } from 'eslint/config';
import pluginJs from '@eslint/js';
import globals from 'globals';

export default defineConfig([
    TypescriptEslint.configs.recommended,
    pluginJs.configs.recommended,
    Prettier,

    {
        files: ['**/*.ts'],
        ignores: ['**/*.js'],

        plugins: {
            promise: EsPromise.configs.recommended,
        },

        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                project: true,
            },
        },

        rules: {
            'prettier/prettier': 'warn',

            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-async-promise-executor': 'off',
            '@typescript-eslint/no-unsafe-declaration-merging': 'off',

            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',

            'prefer-const': 'warn',
            'no-undef': 'off',
        },
    },
]);
