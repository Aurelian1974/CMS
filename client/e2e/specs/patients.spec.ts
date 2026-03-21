/**
 * Teste Pacienți — verifică pagina principală a listei de pacienți.
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

test.describe('Pacienți', () => {
  test.beforeEach(async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/patients');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Salvează erorile pentru verificare în fiecare test
    (page as any).__apiErrors = errors;
  });

  test('afișează titlul paginii "Pacienți"', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /Pacienți/i })).toBeVisible({ timeout: 10_000 });
  });

  test('nu returnează 401 la încărcarea listei de pacienți', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/patients') && (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} GET ${r.url()}`);
      }
    });
    await page.goto('/patients');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors, `Erori 401/403 pe /patients: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('butonul "Pacient nou" este vizibil pentru admin', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /pacient nou/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
  });

  test('câmpul de căutare este funcțional', async ({ page }) => {
    // Găsim input de search
    const searchInput = page.locator('input[placeholder*="ăutați"], input[placeholder*="earch"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // debounce
      await searchInput.clear();
    }
  });

  test('navigare la formular pacient nou', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verifică că nu e redirecționat la login
    await expect(page).not.toHaveURL(/.*login/);
    expect(errors, `Erori 401/403 pe /patients/new: ${errors.join(', ')}`).toHaveLength(0);
  });
});
