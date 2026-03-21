/**
 * Teste Dashboard — verifică afișarea corectă a datelor centralizate.
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('afișează titlul Dashboard', async ({ page }) => {
    // Dashboard-ul poate afișa titlul în header sau în sidebar
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar-ul este vizibil și conține linkuri de navigare', async ({ page }) => {
    // Sidebar-ul este un <aside> cu un <nav> în interior
    // Folosim 'aside nav' pentru a evita ambiguitatea cu alte <nav> din pagină
    // (PageTabs, AppBreadcrumb etc.)
    const nav = page.locator('aside nav');
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // Verific că există cel puțin 5 linkuri de navigare în sidebar
    const navLinks = nav.getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('fără erori API pe dashboard', async ({ page }) => {
    const { errors } = collectApiErrors(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});

    if (errors.length > 0) {
      throw new Error(`Erori API pe Dashboard:\n${errors.join('\n')}`);
    }
  });

  test('nu are erori JavaScript în consolă', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => {
      // Ignorăm erori de network (CORS, fetch failed) și erori Syncfusion minore
      if (err.message.includes('ChunkLoadError')) return;
      if (err.message.includes('ResizeObserver')) return;
      jsErrors.push(err.message);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Pauza scurtă pentru a prinde erori async
    await page.waitForTimeout(2_000);

    if (jsErrors.length > 0) {
      throw new Error(`Erori JavaScript pe Dashboard:\n${jsErrors.join('\n')}`);
    }
  });
});
