import pluginJs from "@eslint/js";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import promisePlugin from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	{
		files: ["**/*.{js,mjs,cjs}"],
		languageOptions: {
			globals: globals.node,
		},
		...pluginJs.configs.recommended,
		plugins: {
			"simple-import-sort": simpleImportSort,
			"unused-imports": unusedImports,
			promise: promisePlugin,
			prettier: prettier,
			unicorn: unicorn,
		},
		rules: {
			"eol-last": ["error", "always"],
			"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"promise/always-return": "error",
			"promise/no-return-wrap": "error",
			"promise/param-names": "error",
			"promise/catch-or-return": "error",
			"promise/no-nesting": "warn",
			"promise/no-promise-in-callback": "warn",
			"promise/no-callback-in-promise": "warn",
			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					tabWidth: 4,
				},
			],
			indent: ["error", "tab", { SwitchCase: 1 }],
			"unicorn/filename-case": [
				"error",
				{
					case: "camelCase",
				},
			],
		},
	},
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			globals: globals.node,
		},
		plugins: {
			"@typescript-eslint": tseslintPlugin,
			"simple-import-sort": simpleImportSort,
			"unused-imports": unusedImports,
			promise: promisePlugin,
			prettier: prettier,
			unicorn: unicorn,
		},
		rules: {
			...tseslintPlugin.configs.recommended.rules,
			quotes: ["error", "double"],
			"eol-last": ["error", "always"],
			"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"promise/always-return": "error",
			"promise/no-return-wrap": "error",
			"promise/param-names": "error",
			"promise/catch-or-return": "error",
			"promise/no-nesting": "warn",
			"promise/no-promise-in-callback": "warn",
			"promise/no-callback-in-promise": "warn",
			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					tabWidth: 4,
				},
			],
			indent: ["error", "tab", { SwitchCase: 1 }],
			"unicorn/filename-case": [
				"error",
				{
					case: "camelCase",
				},
			],
			"@typescript-eslint/explicit-function-return-type": ["error"],
			"@typescript-eslint/explicit-module-boundary-types": ["error"],
			"@typescript-eslint/typedef": [
				"error",
				{
					arrowParameter: true,
					variableDeclaration: true,
					propertyDeclaration: true,
					memberVariableDeclaration: true,
					parameter: true,
				},
			],
		},
	},
];
