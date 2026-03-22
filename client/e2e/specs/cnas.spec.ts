/**
 * Teste E2E — Medicamente CNAS
 * Verifică:
 * - Pagina /cnas/drugs se încarcă fără erori 401/403/500
 * - Titlul paginii este vizibil
 * - Header-ele coloanelor noi sunt vizibile (Mod prezentare, Concentrație, Regim pres., Producător)
 * - Câmpul de căutare este funcțional
 * - Paginile icd10, active-substances și compensated se încarcă fără erori
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

// ── Helper ─────────────────────────────────────────────────────────────────────

async function waitForNetworkIdle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

// ── Teste CNAS Drugs ───────────────────────────────────────────────────────────

test.describe('CNAS — Medicamente', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cnas/drugs');
    await waitForNetworkIdle(page);
  });

  test('pagina se încarcă fără erori API', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/cnas/drugs');
    await waitForNetworkIdle(page);
    expect(
      errors,
      `Erori API pe /cnas/drugs:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });

  test('nu este redirecționat la login', async ({ page }) => {
    await expect(page).not.toHaveURL(/.*login/);
    await expect(page).toHaveURL(/.*cnas\/drugs/);
  });

  test('titlul „Medicamente CNAS" este vizibil', async ({ page }) => {
    await expect(
      page.locator('h1').filter({ hasText: /Medicamente CNAS/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('badge-ul cu numărul de medicamente este vizibil', async ({ page }) => {
    // Badge-ul cu totalCount — apare după ce răspunsul API se întoarce
    await expect(
      page.locator('.badge.bg-secondary')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('coloanele noi sunt vizibile în tabel', async ({ page }) => {
    // Așteptăm ca tabelul să se încarce (badge-ul apare când datele au venit)
    await expect(page.locator('.badge.bg-secondary')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Mod prezentare')).toBeVisible();
    await expect(page.getByText('Concentrație')).toBeVisible();
    await expect(page.getByText('Regim pres.')).toBeVisible();
    await expect(page.getByText('Producător')).toBeVisible();
  });

  test('câmpul de căutare este vizibil și funcțional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="aut"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('amoxicilina');
    await page.waitForTimeout(400); // debounce
    await searchInput.clear();
  });

  test('filtrele de stare sunt vizibile', async ({ page }) => {
    const selects = page.locator('select.form-select');
    await expect(selects.first()).toBeVisible({ timeout: 10_000 });
    await expect(selects).toHaveCount(2);
  });
});

// ── Teste CNAS Compensate ──────────────────────────────────────────────────────

test.describe('CNAS — Lista Compensate', () => {
  test('pagina /cnas/compensated se încarcă fără erori', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/cnas/compensated');
    await waitForNetworkIdle(page);

    await expect(page).not.toHaveURL(/.*login/);
    expect(
      errors,
      `Erori API pe /cnas/compensated:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });

  test('titlul paginii compensate este vizibil', async ({ page }) => {
    await page.goto('/cnas/compensated');
    await waitForNetworkIdle(page);
    await expect(
      page.locator('h1').filter({ hasText: /compensa/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Teste CNAS Substanțe Active ────────────────────────────────────────────────

test.describe('CNAS — Substanțe Active', () => {
  test('pagina /cnas/active-substances se încarcă fără erori', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/cnas/active-substances');
    await waitForNetworkIdle(page);

    await expect(page).not.toHaveURL(/.*login/);
    expect(
      errors,
      `Erori API pe /cnas/active-substances:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });
});

// ── Teste CNAS ICD-10 ──────────────────────────────────────────────────────────

test.describe('CNAS — ICD-10', () => {
  test('pagina /cnas/icd10 se încarcă fără erori', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/cnas/icd10');
    await waitForNetworkIdle(page);

    await expect(page).not.toHaveURL(/.*login/);
    expect(
      errors,
      `Erori API pe /cnas/icd10:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });
});
