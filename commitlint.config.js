module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
  },
  ignores: [
    (message) => message.startsWith('Merge'),
    (message) => message.startsWith('Revert'),
    (message) => message.startsWith('WIP'),
  ],
};
