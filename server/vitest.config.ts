import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ── Test Discovery ───────────────────────────────────────────
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],

    // ── Environment ──────────────────────────────────────────────
    environment: 'node',
    globals: true,

    // ── Timeouts ─────────────────────────────────────────────────
    testTimeout: 30_000,   // 30s — allows real DB calls in integration tests
    hookTimeout: 20_000,

    // ── Coverage ─────────────────────────────────────────────────
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/**/*.test.ts',
        'src/types/**',          // Type-only files have no runnable code
        'src/graphs/documentGraph.ts',  // Tested via integration tests
        'src/graphs/chatGraph.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },

    // ── Reporter ─────────────────────────────────────────────────
    reporter: ['verbose'],

    // ── Setup Files ──────────────────────────────────────────────
    // setupFiles: ['./tests/setup.ts'],  // Uncomment when needed in Phase 6
  },
});
