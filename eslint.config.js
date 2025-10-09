import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig({
	files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
	plugins: { js },
	extends: ['js/recommended'],
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
			L: 'readonly'
		}
	},
	rules: {
		'semi': ['error', 'always'],
		'quotes': ['error', 'single'],
		'indent': ['error', 'tab']
	}
});
