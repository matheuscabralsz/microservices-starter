/* eslint-disable */
import { readFileSync } from 'fs';

// Resolve current directory in ESM context (Jest with TS config runs as ESM here)
const DIR = new URL('.', import.meta.url).pathname;

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(readFileSync(`${DIR}.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
(swcJestConfig as any).swcrc = false;

export default {
  displayName: 'api-nest-service',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
};

// old configs
/* eslint-disable */
// import { readFileSync } from 'fs';
//
// // Reading the SWC compilation config for the spec files
// const swcJestConfig = JSON.parse(
//   readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
// );
//
// // Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
// swcJestConfig.swcrc = false;
//
// export default {
//   displayName: 'api-nest-service',
//   preset: '../../../jest.preset.js',
//   testEnvironment: 'node',
//   transform: {
//     '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
//   },
//   moduleFileExtensions: ['ts', 'js', 'html'],
//   coverageDirectory: 'test-output/jest/coverage',
// };
