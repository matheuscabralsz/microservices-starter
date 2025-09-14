/* eslint-disable */
import { readFileSync } from 'fs';

const DIR = new URL('.', import.meta.url).pathname;
const swcJestConfig = JSON.parse(readFileSync(`${DIR}.spec.swcrc`, 'utf-8'));
(swcJestConfig as any).swcrc = false;

export default {
  displayName: 'auth-nodejs-service',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
};
