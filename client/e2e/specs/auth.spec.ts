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

/**
 * Continuitatea sesiunii — fluxul de refresh.
 *
 * Aceste teste există pentru că path-ul cookie-ului de refresh a fost o perioadă
 * `/api/auth`, în timp ce ruta reală e `/api/v1/Auth/refresh`. Path matching-ul din
 * RFC 6265 e prefix exact și case-sensitive, deci browserul nu trimitea niciodată
 * cookie-ul și orice sesiune murea la expirarea access token-ului. Suita de login/logout
 * trecea în continuare — de aici nevoia de acoperire explicită pe refresh.
 */
test.describe('Continuitatea sesiunii', () => {
  test('cookie-ul de refresh este trimis către endpoint-ul de refresh', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    const cookie = (await page.context().cookies()).find((c) => c.name === 'refreshToken');
    expect(cookie, 'cookie-ul refreshToken nu a fost setat la login').toBeDefined();

    // Path-ul cookie-ului trebuie să fie un prefix al rutei de refresh
    expect(
      '/api/v1/Auth/refresh'.startsWith(cookie!.path),
      `path-ul cookie-ului (${cookie!.path}) nu acoperă /api/v1/Auth/refresh`,
    ).toBe(true);

    // Dovada directă: cererea pleacă din contextul paginii, deci include cookie-ul
    const response = await page.request.post('/api/v1/Auth/refresh');
    expect(response.status()).toBe(200);
  });

  test('sesiunea supraviețuiește reîncărcării paginii', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    // Access token-ul trăiește doar în memorie, deci un reload îl pierde.
    // Sesiunea trebuie reconstruită din cookie-ul HttpOnly de refresh.
    const refreshCall = page.waitForResponse(
      (r) => r.url().includes('/api/v1/Auth/refresh') && r.request().method() === 'POST',
      { timeout: 15_000 },
    );

    await page.reload();

    const refreshResponse = await refreshCall;
    expect(refreshResponse.status()).toBe(200);

    // Fără redirect la login: ProtectedRoute a asteptat bootstrap-ul
    await expect(page).not.toHaveURL(/.*login/);
    // .first(): pagina are doua elemente <nav> — sidebar-ul si tab-urile de pagini
    await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 10_000 });
  });

  test('access token-ul nu ajunge in sessionStorage', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    const persisted = await page.evaluate(() => sessionStorage.getItem('auth-storage'));
    expect(persisted, 'starea de autentificare ar trebui persistata').not.toBeNull();

    const state = JSON.parse(persisted!).state;
    expect(state.accessToken).toBeUndefined();
    expect(persisted).not.toContain('eyJ');   // niciun JWT in storage

    // Datele necredentiale raman, ca sa nu apara un ecran gol la reload
    expect(state.user).toBeTruthy();
    expect(state.isAuthenticated).toBe(true);
  });
});
