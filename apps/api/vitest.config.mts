import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS relies on emitDecoratorMetadata; esbuild cannot emit it, SWC can.
const swcPlugin = swc.vite({
  module: { type: 'es6' },
  jsc: {
    target: 'es2022',
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
});

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    globals: false,
    environment: 'node',
    reporters: ['default'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['test/**/*.test.ts'],
          environment: 'node',
          // Integration suites share one PostgreSQL database; run files serially.
          fileParallelism: false,
          setupFiles: ['test/setup.ts'],
          testTimeout: 90_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
