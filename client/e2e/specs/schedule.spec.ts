/**
 * Teste E2E pentru pagina Program (Schedule).
 * Verifică navigarea, afișarea secțiunilor și interacțiuni de bază.
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

test.describe('Program (Schedule)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  // ── Navigare / autentificare ──────────────────────────────────────────────

  test('pagina /schedule se încarcă fără redirect la login', async ({ page }) => {
    await expect(page).not.toHaveURL(/.*login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/.*schedule/, { timeout: 10_000 });
  });

  test('nu returnează 401 sau 403 la apelurile API', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/schedule') &&
          (r.status() === 401 || r.status() === 403)) {
        errors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });

    await page.goto('/schedule');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors, `Erori 401/403: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('nu are erori de server 5xx', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle').catch(() => {});

    const serverErrors = errors.filter(e => e.includes('SERVER ERROR'));
    expect(serverErrors, `Erori server:\n${serverErrors.join('\n')}`).toHaveLength(0);
  });

  // ── Structura paginii ─────────────────────────────────────────────────────

  test('afișează titlul paginii "Program"', async ({ page }) => {
    await expect(
      page.locator('h1').filter({ hasText: /^Program$/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('afișează secțiunea Program Clinică', async ({ page }) => {
    await expect(
      page.locator('h2').filter({ hasText: /Program Clinică/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('afișează secțiunea Program Medici', async ({ page }) => {
    await expect(
      page.locator('h2').filter({ hasText: /Program Medici/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Program Clinică — 7 zile ──────────────────────────────────────────────

  test('afișează toate zilele săptămânii', async ({ page }) => {
    const days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
    for (const day of days) {
      await expect(
        page.locator('text=' + day).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('există cel puțin 7 butoane Salvează (câte unul per zi)', async ({ page }) => {
    await page.waitForSelector('button', { timeout: 10_000 });
    const saveButtons = page.locator('button').filter({ hasText: /^Salvează$/ });
    await expect(saveButtons).toHaveCount(7, { timeout: 10_000 });
  });

  test('toggle-urile de zi sunt interactive', async ({ page }) => {
    // Toggle-ul este un <label> vizibil care conține un <input type="checkbox"> CSS-ascuns
    const firstLabel = page.locator('label').filter({ has: page.locator('input[type="checkbox"]') }).first();
    await expect(firstLabel).toBeVisible({ timeout: 10_000 });

    // Citim starea checkbox-ului înainte și după click pe label
    const firstCheckbox = firstLabel.locator('input[type="checkbox"]');
    const initialChecked = await firstCheckbox.isChecked();
    await firstLabel.click();
    const afterChecked = await firstCheckbox.isChecked();
    expect(afterChecked).toBe(!initialChecked);

    // Revenim la starea inițială
    await firstLabel.click();
  });

  // ── Program Medici ────────────────────────────────────────────────────────

  test('afișează carduri pentru medici sau mesajul "niciun medic"', async ({ page }) => {
    // Așteptăm să apară fie un card, fie mesajul de empty state (date async)
    await page.waitForSelector(
      'button[title="Adaugă zi"], div[class*="emptyState"]',
      { timeout: 15_000 }
    ).catch(() => {});

    const hasCards = page.locator('button[title="Adaugă zi"]');
    const isEmpty  = page.locator('div[class*="emptyState"]');

    const cardCount  = await hasCards.count();
    const emptyCount = await isEmpty.count();

    expect(cardCount + emptyCount).toBeGreaterThanOrEqual(1);
  });

  // ── Modal adaugă zi medic ─────────────────────────────────────────────────

  test('butonul + deschide modalul de adăugare zi', async ({ page }) => {
    const addBtn = page.locator('button[title="Adaugă zi"]').first();
    const count  = await addBtn.count();

    if (count === 0) {
      test.skip(); // nu există medici — skip
      return;
    }

    await addBtn.click();
    await expect(
      page.locator('text=Adaugă zi').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('butonul Anulează din modal închide modalul', async ({ page }) => {
    const addBtn = page.locator('button[title="Adaugă zi"]').first();
    const count  = await addBtn.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await addBtn.click();
    await page.locator('button').filter({ hasText: /^Anulează$/ }).click();
    await expect(
      page.locator('text=Oră start')
    ).not.toBeVisible({ timeout: 3_000 });
  });

  // ── Navigare sidebar ──────────────────────────────────────────────────────

  test('linkul "Program" din sidebar este activ când e pe /schedule', async ({ page }) => {
    const scheduleLink = page.locator('aside nav a[href="/schedule"]');
    await expect(scheduleLink).toBeVisible({ timeout: 10_000 });

    // Linkul activ are clasa 'active' (NavLink pattern)
    await expect(scheduleLink).toHaveClass(/active/, { timeout: 5_000 });
  });

  test('navigare din sidebar la /schedule funcționează', async ({ page }) => {
    // Plecăm de pe dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});

    const scheduleLink = page.locator('aside nav a[href="/schedule"]');
    await scheduleLink.click();

    await expect(page).toHaveURL(/.*schedule/, { timeout: 10_000 });
    await expect(
      page.locator('h1').filter({ hasText: /^Program$/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
