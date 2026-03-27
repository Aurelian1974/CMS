import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 * Rulează împotriva aplicației Vite pe http://localhost:5173.
 * Backend-ul (.NET) trebuie pornit separat pe http://localhost:5008 sau https://localhost:7051.
 *
 * Pornire manuală:
 *   1. cd src/ValyanClinic.API && dotnet run
 *   2. cd client && npm run dev
 *   3. cd client && npm run test:e2e
 */
export default defineConfig({
  // Directorul cu spec-uri
  testDir: './e2e',

  // Compilare TypeScript cu tsconfig dedicat E2E
  tsconfig: './tsconfig.e2e.json',

  // Timeout per test
  timeout: 30_000,

  // Timeout pentru aserțiuni (expect)
  expect: { timeout: 8_000 },

  // Oprire după primul eșec (CI mode: true; local: false)
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  // Rapoarte
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Artefacte la eșec
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Ignoră erori de certificat HTTPS pentru backend
    ignoreHTTPSErrors: true,
    // Viewport standard
    viewport: { width: 1440, height: 900 },
    // Locale română
    locale: 'ro-RO',
  },

  projects: [
    // ── Setup global: login + salvare sesiune ─────────────────────────────
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },

    // ── Teste autentificare (fără sesiune salvată) ────────────────────────
    {
      name: 'auth',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Teste pagini (cu sesiunea admin salvată) ───────────────────────────
    {
      name: 'pages',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/auth.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],

  // Pornire automată FE dev server dacă nu e deja pornit
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
