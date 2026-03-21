/**
 * Teste Permisiuni — verifică că paginile de permisiuni sunt accesibile pentru admin.
 */
import { test, expect } from '../utils/fixtures';

test.describe('Permisiuni Roluri', () => {
  test('pagina Permisiuni Roluri se încarcă fără erori', async ({ page }) => {
    const apiErrors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) {
        apiErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });

    await page.goto('/permissions/roles');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page).not.toHaveURL(/.*login/);
    expect(apiErrors, `Erori API pe Permisiuni Roluri:\n${apiErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Override Utilizatori', () => {
  test('pagina Override Utilizatori se încarcă fără erori', async ({ page }) => {
    const apiErrors: string[] = [];

    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) {
        apiErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });

    await page.goto('/permissions/users');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page).not.toHaveURL(/.*login/);
    expect(apiErrors, `Erori API pe Override Utilizatori:\n${apiErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Nomenclatoare', () => {
  test('pagina Specializări se încarcă fără erori', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/specialties');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).not.toHaveURL(/.*login/);
    expect(errors, `Erori API Specializări:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('pagina Titulaturi Medicale se încarcă fără erori', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/medical-titles');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).not.toHaveURL(/.*login/);
    expect(errors, `Erori API Titulaturi:\n${errors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Administrare Clinică', () => {
  test('pagina Clinic se încarcă fără erori', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/clinic');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).not.toHaveURL(/.*login/);
    expect(errors, `Erori API Clinic:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('pagina Departamente se încarcă fără erori', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/departments');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).not.toHaveURL(/.*login/);
    expect(errors, `Erori API Departamente:\n${errors.join('\n')}`).toHaveLength(0);
  });
});
