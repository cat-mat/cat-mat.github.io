export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(googleapis|google-auth-library|gaxios|googleapis-common|gcp-metadata|gtoken|jws|jwa|agent-base|https-proxy-agent|buffer-equal-constant-time|safe-buffer|google-logging-utils)/)'
  ],

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/index.css',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/public/'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  globals: {
    'import.meta.env': {
      VITE_GOOGLE_CLIENT_ID: 'test-client-id',
      VITE_ENVIRONMENT: 'test',
      VITE_MOCK_GOOGLE_DRIVE: 'true'
    }
  }
} 