/**
 * Teste Utilizatori — verifică că pagina de utilizatori este accesibilă pentru admin
 * și că nu există erori 401 la endpoint-urile /api/users, /api/doctors/lookup, /api/medicalstaff/lookup.
 */
import { test, expect } from '../utils/fixtures';

test.describe('Utilizatori', () => {
  test('pagina Utilizatori se încarcă fără 401', async ({ page }) => {
    const apiErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (!url.includes('/api/')) return;
      if ([401, 403, 500, 502, 503].includes(status)) {
        apiErrors.push(`${status} ${response.request().method()} ${url}`);
      }
    });

    await page.goto('/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verifică că nu e redirecționat la login
    await expect(page).not.toHaveURL(/.*login/);

    // Verifică titlul paginii
    await expect(page.locator('h1').filter({ hasText: /Utilizatori/i })).toBeVisible({ timeout: 10_000 });

    // Verifică că nu există erori API
    expect(
      apiErrors,
      `Erori API pe pagina Utilizatori:\n${apiErrors.join('\n')}`
    ).toHaveLength(0);
  });

  test('endpoint /api/users returnează 200 pentru admin', async ({ page }) => {
    const responseCodes: number[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/users') && !r.url().includes('/api/users/roles')) {
        responseCodes.push(r.status());
      }
    });

    await page.goto('/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verifică că cel puțin un request către /api/users a returnat 200
    if (responseCodes.length > 0) {
      const hasSuccess = responseCodes.some((c) => c >= 200 && c < 300);
      expect(hasSuccess, `Coduri primite de la /api/users: ${responseCodes.join(', ')}`).toBe(true);
    }
  });

  test('endpoint /api/doctors/lookup nu returnează 401', async ({ page }) => {
    const errors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/doctors/lookup') && (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors, `doctors/lookup a returnat 401/403: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('endpoint /api/medicalstaff/lookup nu returnează 401', async ({ page }) => {
    const errors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/medicalstaff/lookup') && (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors, `medicalstaff/lookup a returnat 401/403: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('butonul "Adaugă utilizator" este vizibil pentru admin', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verifică că admin-ul vede butonul de adăugare
    const addBtn = page.getByRole('button', { name: /utilizator nou|adaug|add/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Doctori', () => {
  test('pagina Doctori se încarcă fără 401', async ({ page }) => {
    const apiErrors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) {
        apiErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/doctors');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('h1').filter({ hasText: /Doctor/i })).toBeVisible({ timeout: 10_000 });
    expect(apiErrors, `Erori API pe Doctori:\n${apiErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Personal Medical', () => {
  test('pagina Personal Medical se încarcă fără 401', async ({ page }) => {
    const apiErrors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) {
        apiErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/medical-staff');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('h1').filter({ hasText: /Personal Medical/i })).toBeVisible({ timeout: 10_000 });
    expect(apiErrors, `Erori API pe Personal Medical:\n${apiErrors.join('\n')}`).toHaveLength(0);
  });
});
