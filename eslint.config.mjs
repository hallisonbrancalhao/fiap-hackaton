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
			'no-console': 'error',
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
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'enum',
					format: ['UPPER_CASE'],
				},
			],
			'@typescript-eslint/member-ordering': [
				'error',
				{
					default: [
						'public-static-field',
						'protected-static-field',
						'private-static-field',
						'public-instance-field',
						'protected-instance-field',
						'private-instance-field',
						'constructor',
						'public-static-method',
						'protected-static-method',
						'private-static-method',
						'public-instance-method',
						'protected-instance-method',
						'private-instance-method',
					],
				},
			],
		},
	},
	{
		files: ['**/*.spec.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off',
		},
	},
];
