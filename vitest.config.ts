import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Route handlers import server-only guarded libs; neutralize the guard in tests.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup-env.ts'],
    // API integration tests hit a real local MySQL; keep them serial.
    fileParallelism: false,
    testTimeout: 30000,
  },
});
