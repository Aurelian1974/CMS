/**
 * Fixture personalizat care extinde `test` din Playwright.
 *
 * Access token-ul trăiește doar în memorie, deci fiecare încărcare de pagină reface sesiunea
 * prin /Auth/refresh, iar serverul ROTEȘTE refresh token-ul la fiecare apel. Dacă fiecare test
 * ar porni dintr-un context nou cu cookie-ul salvat de global.setup.ts, al doilea test ar trimite
 * un token deja rotit → 401 → /login. De aceea toate testele unui worker folosesc ACELAȘI
 * context de browser: cookie-ul rotit rămâne în jar-ul comun și e folosit de testul următor.
 *
 * Toate spec-urile din proiectul "pages" trebuie să importe din acest fișier,
 * nu direct din '@playwright/test'.
 */
import { test as base, type BrowserContext } from '@playwright/test';
import { readFileSync } from 'fs';

// Citeste auth data salvată de global.setup.ts
function loadSessionData(): string | null {
  try {
    const raw = readFileSync('e2e/.auth/session.json', 'utf-8');
    const parsed = JSON.parse(raw) as { authStorage: string | null };
    return parsed.authStorage;
  } catch {
    return null;
  }
}

const authStorage = loadSessionData();

// Aceleași opțiuni ca proiectul "pages" din playwright.config.ts — opțiunile de test nu sunt
// accesibile dintr-un fixture de worker
const SHARED_CONTEXT_OPTIONS = {
  baseURL: 'http://localhost:5173',
  storageState: 'e2e/.auth/admin.json',
  viewport: { width: 1440, height: 900 },
  locale: 'ro-RO',
  ignoreHTTPSErrors: true,
} as const;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, { sharedContext: BrowserContext }>({
  sharedContext: [async ({ browser }, use) => {
    const context = await browser.newContext(SHARED_CONTEXT_OPTIONS);
    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  // Pagina fiecărui test se deschide în contextul comun; sessionStorage-ul (user + permisiuni)
  // se injectează înainte ca scripturile aplicației să ruleze
  page: async ({ sharedContext }, use) => {
    const page = await sharedContext.newPage();
    if (authStorage) {
      await page.addInitScript((data) => {
        sessionStorage.setItem('auth-storage', data);
      }, authStorage);
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
