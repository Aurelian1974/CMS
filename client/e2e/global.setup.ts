/**
 * Global Setup — rulează o singură dată înainte de toate testele.
 * Efectuează login ca admin, salvează cookies + sessionStorage auth separat.
 *
 * Problema: Zustand persist folosește sessionStorage, care NU e salvat de
 * Playwright's storageState(). De aceea salvăm separat cheia 'auth-storage'
 * într-un fișier JSON și o injectăm în fiecare test via fixture.
 */
import { test as setup, expect } from '@playwright/test';
import { CREDENTIALS } from './utils/helpers';
import { writeFileSync, mkdirSync } from 'fs';

const AUTH_DIR  = 'e2e/.auth';
const AUTH_FILE = `${AUTH_DIR}/admin.json`;
const SESSION_FILE = `${AUTH_DIR}/session.json`;

setup('autentificare admin — salvare sesiune', async ({ page }) => {
  await page.goto('/login');

  // Verifică că pagina de login s-a încărcat
  await expect(page.locator('#email')).toBeVisible();

  // Completează credențialele
  await page.locator('#email').fill(CREDENTIALS.admin.email);
  await page.locator('#password').fill(CREDENTIALS.admin.password);

  // Submit și asteaptă redirect
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });

  // Verifică că suntem pe dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  // Extrage cheia auth din sessionStorage (Zustand persist)
  const authStorage = await page.evaluate(() =>
    sessionStorage.getItem('auth-storage')
  );

  // Salvează sesiunea (cookies) — folosit oricum pentru refresh token
  await page.context().storageState({ path: AUTH_FILE });

  // Salvează sessionStorage separat pentru injectare în teste
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(SESSION_FILE, JSON.stringify({ authStorage }, null, 2));
});
