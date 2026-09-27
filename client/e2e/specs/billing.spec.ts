/**
 * Modulul financiar — verificări de interfață fără efecte asupra datelor
 * (nu se încasează, nu se emit facturi, nu se trimit bonuri).
 */
import { test, expect } from '../utils/fixtures';

test.describe('Financiar — pagini și dialoguri', () => {
  test('Tarife: grid, filtre și regimurile TVA', async ({ page }) => {
    await page.goto('/tariffs');

    await expect(page.getByRole('heading', { name: 'Tarife', exact: true })).toBeVisible();
    await expect(page.getByText('Total servicii', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Caută după cod sau denumire...')).toBeVisible();

    await page.getByRole('button', { name: 'Regimuri TVA' }).click();
    await expect(page.getByText(/Scutit de TVA/).first()).toBeVisible();
  });

  test('Încasări: statistici și dialogul casei de marcat', async ({ page }) => {
    await page.goto('/billing');

    await expect(page.getByRole('heading', { name: 'Încasări', exact: true })).toBeVisible();
    await expect(page.getByText('Bonuri de verificat', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: /Casa de marcat/ }).click();
    await expect(page.getByRole('heading', { name: /stația curentă/ })).toBeVisible();
    await expect(page.getByPlaceholder(/--show-token|Token nou/)).toBeVisible();
  });

  test('Facturi: filtrul de status și exportul sunt disponibile', async ({ page }) => {
    await page.goto('/invoices');

    await expect(page.getByRole('heading', { name: 'Facturi', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stornate' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Excel/ }).first()).toBeVisible();
  });

  test('Setări financiare: statut TVA, casa de marcat și serii', async ({ page }) => {
    await page.goto('/settings/financial');

    await expect(page.getByRole('heading', { name: 'Statut TVA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Casa de marcat' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Serii facturi' })).toBeVisible();
    await expect(page.getByPlaceholder('http://127.0.0.1:5199')).toBeVisible();
  });
});
