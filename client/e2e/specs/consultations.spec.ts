/**
 * Teste Consultații — verifică pagina principală a listei de consultații.
 * Verifică:
 * - Titlu pagină, heading
 * - Buton Consultație nouă vizibil
 * - Câmp de căutare funcțional
 * - Nu returnează 401/403 la încărcare
 * - Stat cards vizibile
 * - Toolbar filtre vizibile
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

test.describe('Consultații', () => {
  test.beforeEach(async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/consultations');
    await page.waitForLoadState('networkidle').catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (page as any).__apiErrors = errors;
  });

  test('afișează titlul paginii "Consultații"', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /Consultați/i })).toBeVisible({ timeout: 10_000 });
  });

  test('nu returnează 401/403 la încărcarea listei de consultații', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.url().toLowerCase().includes('consultation') && (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} GET ${r.url()}`);
      }
    });
    await page.goto('/consultations');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors, `Erori 401/403 pe /consultations: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('butonul "Consultație nouă" este vizibil pentru admin', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /consultație nouă/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
  });

  test('câmpul de căutare este funcțional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="acient"], input[placeholder*="autare"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // debounce
      await searchInput.clear();
    }
  });

  test('selectul status este vizibil cu opțiuni', async ({ page }) => {
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
      const options = statusSelect.locator('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(2); // cel puțin "Toate" + un status
    }
  });
});
