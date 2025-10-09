import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		ignores: ['dist'],
	},
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: tsParser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			import: importPlugin,
			'jsx-a11y': jsxA11y,
			'@typescript-eslint': tseslint,
		},
		rules: {
			'semi': ['error', 'always'],
			'quotes': ['error', 'single'],
			'indent': ['error', 'tab']
		},
	}
];
