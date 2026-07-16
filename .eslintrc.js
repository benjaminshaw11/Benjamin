module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off'
  },
  overrides: [
    {
      files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
      env: { browser: true, node: true },
      parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
    }
  ]
};
