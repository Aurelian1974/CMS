import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Configurare Vitest — separată de vite.config.ts pentru a evita execuția
 * logicii de runtime (proxy detection, probeUrl) în mediul de test.
 *
 * Rulare:
 *   npm run test:unit          — toate testele o dată
 *   npm run test:unit:watch    — watch mode (re-rulare la modificări)
 *   npm run test:unit:coverage — raport de acoperire HTML
 */
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  define: {
    // Definit și în vite.config.ts — necesar pentru orice modul care îl referențiază
    __APP_VERSION__: '"0.0.0-test"',
  },

  test: {
    // Mediu browser simulat (necesar pentru React hooks, DOM APIs, sessionStorage)
    environment: 'jsdom',

    // Importuri globale — describe, it, expect, vi, beforeEach, afterEach etc.
    globals: true,

    // Fișier de setup rulat înainte de fiecare fișier de test
    setupFiles: ['./src/__tests__/setup.ts'],

    // Pattern pentru fișierele de test
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],

    // Raport de acoperire (activat cu --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
        'src/store/**/*.ts',
        'src/features/**/hooks/*.ts',
        'src/features/**/schemas/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
});
