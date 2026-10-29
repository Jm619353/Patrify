module.exports = {
  env: {
    node: true,
    es2022: true,
    mocha: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    eqeqeq: ['error', 'smart']
  },
  ignorePatterns: ['node_modules/', 'uploads/', 'coverage/']
};
