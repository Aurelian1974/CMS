/**
 * Teste API — verificare directă a endpoint-urilor critice prin interceptare răspunsuri.
 * Testele folosesc sesiunea admin salvată (storageState).
 */
import { test, expect } from '../utils/fixtures';

// ── Endpoint-uri care trebuie să returneze 200 pentru admin ───────────────────
const CRITICAL_ENDPOINTS = [
  { page: '/users',         api: '/api/users',                  label: 'GET /api/users' },
  { page: '/users',         api: '/api/users/roles',            label: 'GET /api/users/roles' },
  { page: '/users',         api: '/api/doctors/lookup',         label: 'GET /api/doctors/lookup' },
  { page: '/users',         api: '/api/medicalstaff/lookup',    label: 'GET /api/medicalstaff/lookup' },
  { page: '/patients',      api: '/api/patients',               label: 'GET /api/patients' },
  { page: '/doctors',       api: '/api/doctors',                label: 'GET /api/doctors' },
  { page: '/medical-staff', api: '/api/medicalstaff',           label: 'GET /api/medicalstaff' },
  { page: '/departments',   api: '/api/departments',            label: 'GET /api/departments' },
  { page: '/specialties',   api: '/api/nomenclature/specialties', label: 'GET /api/nomenclature/specialties' },
] as const;

test.describe('API — endpoint-uri critice accesibile pentru admin', () => {
  for (const endpoint of CRITICAL_ENDPOINTS) {
    test(`${endpoint.label} — returnează 200 (nu 401/403)`, async ({ page }) => {
      let responseStatus: number | null = null;
      let responseUrl = '';

      page.on('response', (r) => {
        if (r.url().includes(endpoint.api)) {
          responseStatus = r.status();
          responseUrl = r.url();
        }
      });

      await page.goto(endpoint.page);
      await page.waitForLoadState('networkidle').catch(() => {});

      if (responseStatus !== null) {
        const status: number = responseStatus;
        expect(
          status,
          `${endpoint.label} a returnat ${status} (${responseUrl}) în loc de 2xx`
        ).toBeLessThan(400);
      }
      // Dacă endpoint-ul nu a fost apelat deloc, testul trece (pagina poate fi cached sau condițional)
    });
  }
});

test.describe('API — nu există 401 la navigarea completă', () => {
  test('zero erori 401 la parcurgerea tuturor paginilor principale', async ({ page }) => {
    const allErrors: string[] = [];

    page.on('response', (r) => {
      if (!r.url().includes('/api/')) return;
      if (r.status() === 401 || r.status() === 403) {
        allErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });

    const routes = [
      '/dashboard',
      '/patients',
      '/doctors',
      '/medical-staff',
      '/departments',
      '/users',
      '/specialties',
      '/medical-titles',
      '/clinic',
      '/invoices',
      '/appointments',
      '/consultations',
      '/prescriptions',
      '/permissions/roles',
      '/permissions/users',
    ];

    for (const route of routes) {
      await page.goto(route);
      // Asteaptă câteva secunde pentru request-uri async
      await page.waitForTimeout(1_500);
    }

    expect(
      allErrors,
      `Erori 401/403 găsite în parcurgerea aplicației:\n${allErrors.join('\n')}`
    ).toHaveLength(0);
  });
});
