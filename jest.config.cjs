// CommonJS on purpose: package.json declares `"type": "module"`.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/ios',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  clearMocks: true,
};
