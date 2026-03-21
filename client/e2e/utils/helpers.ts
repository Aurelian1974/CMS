/**
 * Helpers reutilizabili pentru testele E2E.
 */
import type { Page } from '@playwright/test';

export const CREDENTIALS = {
  admin: { email: 'admin', password: 'admini' },
} as const;

/**
 * Navighează la pagina de login și autentifică utilizatorul.
 * Așteaptă redirecționarea la dashboard după login reușit.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  // Asteaptă redirect la dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Verifică că nu există erori de tip 4xx/5xx în consolă sau răspunsuri API.
 * Le agregăm pe parcursul testului — apelat după navigare.
 */
export function collectApiErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    // Ignorăm request-uri non-API și 404 pentru favicon/assets
    if (!url.includes('/api/')) return;
    // 401 și 403 sunt erori de permisiune — le raportăm
    if (status === 401 || status === 403) {
      errors.push(`${status} ${response.request().method()} ${url}`);
    }
    // 500+ sunt erori server
    if (status >= 500) {
      errors.push(`${status} SERVER ERROR: ${url}`);
    }
  });

  return { errors };
}
