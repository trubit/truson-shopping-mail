import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    globalSetup: ['./tests/setup/server.global.ts'],
    setupFiles: ['./tests/setup/server.setup.ts'],
    include: ['server/src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './tests/coverage/server',
      include: ['server/src/**'],
      exclude: ['server/src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@server': path.resolve(__dirname, './server/src'),
    },
  },
})
