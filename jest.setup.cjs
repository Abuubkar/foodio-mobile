// CommonJS on purpose: package.json declares `"type": "module"`.

/**
 * AsyncStorage is a native module, so importing it under jest throws before a
 * test can run. The package ships this mock for exactly that; keeping it here
 * rather than in each suite means a test touching the Cart store — which
 * persists through it — needs to know nothing about storage.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
