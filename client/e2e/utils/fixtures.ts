/**
 * Fixture personalizat care extinde `test` din Playwright.
 * Injectează cheia 'auth-storage' în sessionStorage ÎNAINTE ca pagina să se încarce,
 * astfel Zustand persist poate hidrata starea auth fără a mai face redirect la /login.
 *
 * Toate spec-urile din proiectul "pages" trebuie să importe din acest fișier,
 * nu direct din '@playwright/test'.
 */
import { test as base } from '@playwright/test';
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

export const test = base.extend({
  // Override-ul fixture-ului `page` pentru a injecta sessionStorage
  page: async ({ page }, use) => {
    if (authStorage) {
      // Injectează sessionStorage inainte ca orice script al paginii să ruleze
      await page.addInitScript((data) => {
        sessionStorage.setItem('auth-storage', data);
      }, authStorage);
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from '@playwright/test';
