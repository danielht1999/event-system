// jest.config.js
module.exports = {
  // Configuración BASE (compartida por TODOS los proyectos)  
  testEnvironment: 'node',  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  transformIgnorePatterns: ['/node_modules/'],
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/server.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  globalSetup: '<rootDir>/tests/setup.ts',
  
  verbose: true,
  
  projects: [
    // PROYECTO 1: Tests Unitarios (co-localizados en src/)
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/*.test.ts',
        '<rootDir>/src/**/*.spec.ts',
        '<rootDir>/tests/simple.test.ts'
      ],
      testPathIgnorePatterns: ['/node_modules/'], 
      preset: 'ts-jest',     
      transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: '<rootDir>/tsconfig.test.json'
      }]
      },
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
      }
    },
    
    // PROYECTO 2: Tests de Integración
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/'],     
      
      setupFilesAfterEnv: ['<rootDir>/tests/load-env.ts','<rootDir>/tests/setup-framework.ts'],
      preset: 'ts-jest',     
      transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: '<rootDir>/tsconfig.test.json'
      }]
      },
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
      }   
    }
  ]
};