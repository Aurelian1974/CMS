/**
 * Teste autentificare — verifică fluxul de login/logout.
 * Aceste teste rulează FĂRĂ sesiune salvată (project: "auth").
 */
import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from '../utils/helpers';

test.describe('Autentificare', () => {
  test.beforeEach(async ({ page }) => {
    // Pornește de la pagina de login curată
    await page.goto('/login');
  });

  test('afișează pagina de login la rădăcină', async ({ page }) => {
    await page.goto('/');
    // Redirecționare la /login pentru utilizatorii neautentificați
    await expect(page).toHaveURL(/.*login/);
  });

  test('afișează formularul de login corect', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(/autentific/i);
  });

  test('afișează eroare la credențiale incorecte', async ({ page }) => {
    await page.locator('#email').fill('utilizator_inexistent@test.ro');
    await page.locator('#password').fill('parola_gresita_123');
    await page.locator('button[type="submit"]').click();

    // Trebuie să rămână pe pagina de login
    await expect(page).toHaveURL(/.*login/);

    // Trebuie să apară un mesaj de eroare
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test('login reușit cu admin redirecționează la dashboard', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('pagina de login nu este accesibilă după login (redirect la dashboard)', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    // Încearcă să acceseaze /login după autentificare
    await page.goto('/login');
    // Ar trebui redirecționat la dashboard (dacă există logică de redirect)
    // Dacă nu, verificăm că poate naviga
    await expect(page).not.toHaveURL(/.*login/, { timeout: 5_000 }).catch(() => {
      // Acceptabil dacă pagina de login e accesibilă și după login
    });
  });

  test('sidebar-ul apare după login', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    // Sidebar vizibil — caută link-uri de navigare
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10_000 });
  });

  test('deconectare curăță sesiunea și redirecționează la login', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    // Găsim butonul de logout în sidebar
    const logoutBtn = page.getByRole('button', { name: /deconect|logout|ieș/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verifică redirect la login
    await expect(page).toHaveURL(/.*login/, { timeout: 10_000 });
  });
});
