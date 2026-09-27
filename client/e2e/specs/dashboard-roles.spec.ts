/**
 * Dashboard pe roluri — fiecare rol vede preset-ul lui, filtrat pe permisiuni, iar
 * datele nepermise nu ajung nici în răspunsul HTTP (nu doar în UI).
 *
 * Necesită conturile de test: `.\e2e\seed\seed-role-users.ps1 -Server <sql>` (idempotent).
 * Fiecare rol se autentifică într-un context propriu, deci nu atinge sesiunea admin comună.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';
import { CREDENTIALS } from '../utils/helpers';

const ROLE_USERS = {
  doctor:       'e2e.doctor',
  receptionist: 'e2e.receptionist',
  manager:      'e2e.manager',
  empty:        'e2e.empty',
} as const;

interface DashboardPayload {
  widgetIds: string[]
  agenda?: {
    appointments?: { notes?: string | null }[] | null
    openConsultations?: unknown[] | null
    labResults?: unknown[] | null
  } | null
  clinicalKpis?: Record<string, number | null> | null
  financial?: unknown
  trends?: unknown
  health?: unknown
}

async function openDashboardAs(browser: Browser, username: string): Promise<{ page: Page; data: DashboardPayload }> {
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', locale: 'ro-RO' });
  const page = await context.newPage();
  await page.goto('/login');
  await page.locator('#email').fill(username);
  await page.locator('#password').fill(CREDENTIALS.admin.password);

  const dashboardResponse = page.waitForResponse(
    (r) => r.url().includes('/api/v1/Dashboard') && r.request().method() === 'GET',
    { timeout: 20_000 });
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });

  const response = await dashboardResponse;
  expect(response.status(), `GET /Dashboard pentru ${username}`).toBe(200);
  const body = await response.json() as { data: DashboardPayload };
  return { page, data: body.data };
}

const widget = (page: Page, id: string) => page.locator(`[data-widget-id="${id}"]`);

test.describe('Dashboard pe roluri', () => {
  test('doctor: agenda proprie, fără date financiare', async ({ browser }) => {
    const { page, data } = await openDashboardAs(browser, ROLE_USERS.doctor);

    await expect(widget(page, 'list.agenda.today')).toBeVisible();
    await expect(widget(page, 'list.consultations.open')).toBeVisible();
    await expect(page.locator('[data-widget-id^="kpi.revenue"], [data-widget-id="list.unpaid"]')).toHaveCount(0);
    expect(data.financial ?? null).toBeNull();
    await page.context().close();
  });

  test('recepție: încasări vizibile, niciun câmp clinic în răspuns', async ({ browser }) => {
    const { page, data } = await openDashboardAs(browser, ROLE_USERS.receptionist);

    await expect(widget(page, 'list.unpaid')).toBeVisible();
    await expect(widget(page, 'list.agenda.today')).toBeVisible();
    await expect(widget(page, 'list.consultations.open')).toHaveCount(0);

    // Verificarea contează pe JSON, nu pe UI: ce e ascuns doar vizual poate fi citit din DevTools
    expect(data.agenda?.openConsultations ?? null).toBeNull();
    expect(data.agenda?.labResults ?? null).toBeNull();
    for (const a of data.agenda?.appointments ?? []) expect(a.notes ?? null).toBeNull();
    expect(data.clinicalKpis?.consultationsOpen ?? null).toBeNull();
    expect(data.clinicalKpis?.consultationsToday ?? null).toBeNull();
    expect(JSON.stringify(data)).not.toMatch(/"(diagnostic|motiv)":"/);
    await page.context().close();
  });

  test('manager: grafice și încărcare pe medic, fără date clinice', async ({ browser }) => {
    const { page, data } = await openDashboardAs(browser, ROLE_USERS.manager);

    await expect(widget(page, 'chart.revenue.trend').locator('svg[role="img"]')).toBeVisible();
    await expect(widget(page, 'panel.doctor.workload')).toBeVisible();
    await expect(widget(page, 'list.agenda.today')).toHaveCount(0);
    expect(data.agenda ?? null).toBeNull();
    await page.context().close();
  });

  test('admin: sănătatea sistemului', async ({ browser }) => {
    const { page } = await openDashboardAs(browser, CREDENTIALS.admin.email);

    await expect(widget(page, 'list.security.events')).toBeVisible();
    await expect(widget(page, 'panel.users.locked')).toBeVisible();
    await page.context().close();
  });

  test('cont fără module relevante: ecran explicit, nu pagină goală', async ({ browser }) => {
    const { page, data } = await openDashboardAs(browser, ROLE_USERS.empty);

    expect(data.widgetIds).toEqual([]);
    await expect(page.getByRole('status').filter({ hasText: 'Niciun widget disponibil' })).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
    await page.context().close();
  });
});
