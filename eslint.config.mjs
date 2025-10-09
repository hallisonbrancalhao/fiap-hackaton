import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/node_modules', '**/.nx', '**/coverage', '**/.angular'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
	{
		files: [
			'**/*.ts',
			'**/*.tsx',
			'**/*.cts',
			'**/*.mts',
			'**/*.js',
			'**/*.jsx',
			'**/*.cjs',
			'**/*.mjs',
		],
		rules: {
			'no-console': 'warn',
			'no-debugger': 'error',
			'object-curly-spacing': ['error', 'always'],
			'keyword-spacing': ['error', { before: true, after: true }],
			'key-spacing': ['error', { beforeColon: false, afterColon: true }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'enum',
					format: ['UPPER_CASE'],
				},
			],
			'@angular-eslint/template/label-has-associated-control': 'off',
			'@typescript-eslint/no-empty-function': 'warn',
			'no-empty': 'warn',
		},
	},
	{
		files: ['**/*.spec.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off',
		},
	},
];
