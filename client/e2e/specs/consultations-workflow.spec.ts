/**
 * E2E — fluxul fișei de consultație: deep-link, salvare la schimbarea tabului,
 * validări clinice, protecție la părăsirea paginii, finalizare.
 *
 * Setup: câte o consultație „În lucru" creată prin API pentru fiecare test.
 * Cleanup: ștergere prin API (admin are Full; ștergerea e permisă și după finalizare).
 */
import { test, expect } from '../utils/fixtures';
import type { Page } from '@playwright/test';

interface ApiCtx { base: string; auth: string }
interface Created { id: string; patientId: string; doctorId: string; date: string; patientName: string }

const pad = (n: number) => String(n).padStart(2, '0');
const todayAt9 = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00:00`;
};

const DIAGNOSIS_JSON = JSON.stringify({
  primaryCode: { code: 'J44.0', shortDescriptionRo: 'BPOC cu infecție acută' },
  primaryDetails: '<p>E2E</p>',
  secondaryDiagnoses: [],
});

/** Deschide pagina și preia antetul Authorization folosit de aplicație. */
async function openAndCaptureApi(page: Page): Promise<ApiCtx> {
  const reqPromise = page.waitForRequest(
    r => r.url().includes('/api/v1/Consultations') && !!r.headers()['authorization']);
  await page.goto('/consultations');
  const req = await reqPromise;
  const url = new URL(req.url());
  return { base: `${url.origin}/api/v1`, auth: req.headers()['authorization'] };
}

async function apiGet<T>(page: Page, ctx: ApiCtx, path: string): Promise<T> {
  const r = await page.request.get(`${ctx.base}${path}`, { headers: { Authorization: ctx.auth } });
  expect(r.ok(), `GET ${path} → ${r.status()}`).toBeTruthy();
  return (await r.json()).data as T;
}

async function createConsultation(page: Page, ctx: ApiCtx): Promise<Created> {
  const patients = await apiGet<Array<{ id: string; fullName: string }>>(page, ctx, '/Patients/lookup');
  const doctors = await apiGet<Array<{ id: string }>>(page, ctx, '/Doctors/lookup');
  test.skip(patients.length === 0 || doctors.length === 0, 'Lipsesc pacienți sau medici în baza de test');

  const body = { patientId: patients[0].id, doctorId: doctors[0].id, appointmentId: null, date: todayAt9() };
  const r = await page.request.post(`${ctx.base}/Consultations`, { headers: { Authorization: ctx.auth }, data: body });
  expect(r.status(), await r.text()).toBe(201);
  return { id: (await r.json()).data as string, ...body, patientName: patients[0].fullName };
}

async function deleteConsultation(page: Page, ctx: ApiCtx, id: string) {
  // Un /Auth/refresh rămas în zbor la închiderea paginii rotește token-ul pe server
  // fără ca noul cookie să ajungă în context → testele următoare cad pe /login.
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.request.delete(`${ctx.base}/Consultations/${id}`, { headers: { Authorization: ctx.auth } });
}

const tab = (page: Page, name: RegExp) => page.getByRole('tab', { name });
// „75" apare și în placeholder-ul înălțimii („175")
const pulse = (page: Page) => page.getByPlaceholder('75', { exact: true });

test.describe('Consultații — fișa de consultație', () => {
  test('deep-link: fișa se deschide din URL și rămâne deschisă după reload', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      await page.goto(`/consultations/${c.id}`);
      await expect(page.getByRole('heading', { name: 'Editare Consultație' })).toBeVisible({ timeout: 15_000 });

      await page.reload();
      await expect(page.getByRole('heading', { name: 'Editare Consultație' })).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveURL(new RegExp(`/consultations/${c.id}$`));
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });

  test('modificarea examenului se salvează la schimbarea tabului', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      await page.goto(`/consultations/${c.id}`);
      await tab(page, /Examen Clinic/).click();
      await pulse(page).fill('72');

      const examPut = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/Consultations/${c.id}/exam`));
      await tab(page, /Investigații/).click();
      expect((await examPut).status()).toBe(200);
      await expect(tab(page, /Investigații/)).toHaveAttribute('aria-selected', 'true');

      const detail = await apiGet<{ exam: { puls: number | null } | null }>(page, ctx, `/Consultations/${c.id}`);
      expect(detail.exam?.puls).toBe(72);
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });

  test('o valoare vitală implauzibilă blochează schimbarea tabului, fără request', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      await page.goto(`/consultations/${c.id}`);
      await tab(page, /Examen Clinic/).click();
      await pulse(page).fill('0');

      let examPutSent = false;
      page.on('request', r => { if (r.method() === 'PUT' && r.url().includes(`/Consultations/${c.id}`)) examPutSent = true; });
      await tab(page, /Investigații/).click();

      await expect(page.getByRole('alert').filter({ hasText: 'Frecvență cardiacă' })).toBeVisible();
      await expect(tab(page, /Examen Clinic/)).toHaveAttribute('aria-selected', 'true');
      expect(examPutSent).toBe(false);
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });

  test('navigarea în altă pagină salvează întâi modificările nesalvate', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      await page.goto(`/consultations/${c.id}`);
      await tab(page, /Examen Clinic/).click();
      await pulse(page).fill('88');
      await expect(page.getByText('Modificări nesalvate')).toBeVisible();

      const examPut = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/Consultations/${c.id}/exam`));
      await page.locator('a[href="/dashboard"]').first().click();
      expect((await examPut).status()).toBe(200);
      await expect(page).toHaveURL(/\/dashboard$/);

      const detail = await apiGet<{ exam: { puls: number | null } | null }>(page, ctx, `/Consultations/${c.id}`);
      expect(detail.exam?.puls).toBe(88);
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });

  test('finalizarea fără diagnostic principal e blocată și deschide tabul Diagnostic', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      await page.goto(`/consultations/${c.id}`);
      let finalizeSent = false;
      page.on('request', r => { if (r.url().endsWith('/finalize')) finalizeSent = true; });

      await page.getByRole('button', { name: 'Finalizează Consultație' }).click();

      await expect(page.getByRole('alert').filter({ hasText: 'Diagnosticul principal este obligatoriu' })).toBeVisible();
      await expect(tab(page, /Diagnostic/)).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(finalizeSent).toBe(false);
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });

  test('finalizare completă: statusul devine Finalizată, iar fișa devine read-only pe server', async ({ page }) => {
    const ctx = await openAndCaptureApi(page);
    const c = await createConsultation(page, ctx);
    try {
      const put = await page.request.put(`${ctx.base}/Consultations/${c.id}`, {
        headers: { Authorization: ctx.auth },
        data: { patientId: c.patientId, doctorId: c.doctorId, appointmentId: null, date: c.date, diagnostic: DIAGNOSIS_JSON, diagnosticCodes: '["J44.0"]' },
      });
      expect(put.status(), await put.text()).toBe(200);

      await page.goto(`/consultations/${c.id}`);
      await page.getByRole('button', { name: 'Finalizează Consultație' }).click();
      const dialog = page.getByRole('dialog', { name: 'Confirmare finalizare' });
      await expect(dialog).toBeVisible();

      const finalizeResp = page.waitForResponse(r => r.url().endsWith(`/Consultations/${c.id}/finalize`));
      await dialog.getByRole('button', { name: 'Finalizează' }).click();
      expect((await finalizeResp).status()).toBe(200);

      await expect(page.getByRole('status').filter({ hasText: 'Consultație finalizată cu succes' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Consultație', exact: true })).toBeVisible();

      const locked = await page.request.put(`${ctx.base}/Consultations/${c.id}/anamnesis`, {
        headers: { Authorization: ctx.auth }, data: { motiv: 'după finalizare' },
      });
      expect(locked.status()).toBe(409);
    } finally {
      await deleteConsultation(page, ctx, c.id);
    }
  });
});
