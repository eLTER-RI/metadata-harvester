export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  coveragePathIgnorePatterns: ['/node_modules/', '/fetchJsonFromRemote.ts'],
};
