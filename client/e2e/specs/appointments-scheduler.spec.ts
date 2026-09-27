/**
 * E2E — Scheduler programări: drag & drop real în browser.
 * DnD nu poate fi testat în jsdom (fără layout), de aceea stă aici.
 *
 * Setup: două programări create prin API, pe azi, pentru un doctor care lucrează azi,
 * în două sloturi libere. Cleanup: ștergere prin API la final (admin are acces Full).
 */
import { test, expect } from '../utils/fixtures';
import type { Page } from '@playwright/test';

interface ApiCtx { base: string; auth: string }
interface Slot { from: number; to: number }

const SLOT_MIN = 30;
const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Deschide scheduler-ul și preia antetul Authorization folosit de aplicație. */
async function openSchedulerAndCaptureApi(page: Page): Promise<ApiCtx> {
  const reqPromise = page.waitForRequest(
    r => r.url().includes('/api/v1/Appointments/scheduler') && !!r.headers()['authorization']);
  await page.goto('/appointments/scheduler');
  const req = await reqPromise;
  const url = new URL(req.url());
  return { base: `${url.origin}/api/v1`, auth: req.headers()['authorization'] };
}

async function apiGet<T>(page: Page, ctx: ApiCtx, path: string): Promise<T> {
  const r = await page.request.get(`${ctx.base}${path}`, { headers: { Authorization: ctx.auth } });
  expect(r.ok(), `GET ${path} → ${r.status()}`).toBeTruthy();
  return (await r.json()).data as T;
}

test.describe('Scheduler programări — drag & drop', () => {
  test('mută o programare pe un slot liber și respinge local mutarea pe un slot ocupat', async ({ page }) => {
    const ctx = await openSchedulerAndCaptureApi(page);
    const date = todayIso();
    const jsDow = new Date().getDay();
    const dow = jsDow === 0 ? 7 : jsDow;

    // ── Doctor care lucrează azi + fereastra efectivă ─────────────────────
    const clinic = await apiGet<Array<{ dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null }>>(page, ctx, '/Schedule/clinic');
    const clinicDay = clinic.find(c => c.dayOfWeek === dow);
    test.skip(!clinicDay?.isOpen || !clinicDay.openTime || !clinicDay.closeTime, 'Clinica e închisă azi');
    const tlStart = toMin(clinicDay!.openTime!.slice(0, 5));
    const tlEnd = toMin(clinicDay!.closeTime!.slice(0, 5));

    const doctorDays = await apiGet<Array<{ doctorId: string; dayOfWeek: number | null; startTime: string | null; endTime: string | null }>>(page, ctx, '/Schedule/doctors');
    const existing = await apiGet<Array<{ doctorId: string; startTime: string; endTime: string; blocksSlot: boolean }>>(
      page, ctx, `/Appointments/scheduler?dateFrom=${date}&dateTo=${date}`);

    // Două sloturi libere consecutive-disjuncte pentru același doctor
    let pick: { doctorId: string; a: Slot; free: Slot; b: Slot } | null = null;
    for (const d of doctorDays.filter(x => x.dayOfWeek === dow && x.startTime && x.endTime)) {
      const from = Math.max(tlStart, toMin(d.startTime!.slice(0, 5)));
      const to = Math.min(tlEnd, toMin(d.endTime!.slice(0, 5)));
      const busy = existing.filter(e => e.doctorId === d.doctorId && e.blocksSlot).map(e => {
        const s = new Date(e.startTime); const en = new Date(e.endTime);
        return { from: s.getHours() * 60 + s.getMinutes(), to: en.getHours() * 60 + en.getMinutes() };
      });
      const free: Slot[] = [];
      for (let m = from; m + SLOT_MIN <= to; m += SLOT_MIN) {
        if (!busy.some(b => m < b.to && m + SLOT_MIN > b.from)) free.push({ from: m, to: m + SLOT_MIN });
      }
      if (free.length >= 3) {
        pick = { doctorId: d.doctorId, a: free[0], free: free[1], b: free[free.length - 1] };
        break;
      }
    }
    test.skip(!pick, 'Niciun doctor cu sloturi libere azi');

    const patients = await apiGet<Array<{ id: string }>>(page, ctx, '/Patients/lookup');
    test.skip(patients.length === 0, 'Nu există pacienți');

    const createdIds: string[] = [];
    const create = async (slot: Slot, notes: string) => {
      const r = await page.request.post(`${ctx.base}/Appointments`, {
        headers: { Authorization: ctx.auth },
        data: {
          patientId: patients[0].id, doctorId: pick!.doctorId,
          startTime: `${date}T${hhmm(slot.from)}:00`, endTime: `${date}T${hhmm(slot.to)}:00`,
          notes,
        },
      });
      expect(r.status(), await r.text()).toBe(201);
      const id = (await r.json()).data as string;
      createdIds.push(id);
      return id;
    };

    try {
      const movedId = await create(pick!.a, 'E2E DnD — mutată');
      await create(pick!.b, 'E2E DnD — ocupă slotul');

      // ── Scheduler filtrat pe doctor ───────────────────────────────────────
      await page.reload();
      await page.locator('select').filter({ has: page.locator('option', { hasText: 'Toți doctorii' }) })
        .selectOption(pick!.doctorId);
      const bar = page.locator(`[data-event-bar][aria-label*="${hhmm(pick!.a.from)}"]`);
      await expect(bar).toBeVisible({ timeout: 10_000 });
      const timeline = bar.locator('xpath=..');
      const box = (await timeline.boundingBox())!;
      const xFor = (min: number) => ((min - tlStart) / (tlEnd - tlStart)) * box.width;

      // ── 1. Drop pe slotul ocupat → eroare locală, fără PUT ────────────────
      let putSent = false;
      const onRequest = (r: { method: () => string; url: () => string }) => {
        if (r.method() === 'PUT' && r.url().includes(`/Appointments/${movedId}`)) putSent = true;
      };
      page.on('request', onRequest);
      await bar.dragTo(timeline, { sourcePosition: { x: 1, y: 5 }, targetPosition: { x: xFor(pick!.b.from) + 2, y: 10 } });
      await expect(page.getByRole('alert').filter({ hasText: 'Slotul este deja ocupat' })).toBeVisible();
      page.off('request', onRequest);
      expect(putSent).toBe(false);

      // ── 2. Drop pe un slot liber → PUT cu noua oră ────────────────────────
      const target = pick!.free.from;
      const putPromise = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().includes(`/Appointments/${movedId}`));
      await bar.dragTo(timeline, { sourcePosition: { x: 1, y: 5 }, targetPosition: { x: xFor(target) + 2, y: 10 } });
      const put = await putPromise;
      expect(put.status()).toBe(200);

      const detail = await apiGet<{ startTime: string }>(page, ctx, `/Appointments/${movedId}`);
      const moved = new Date(detail.startTime);
      expect(moved.getHours() * 60 + moved.getMinutes()).toBe(target);
    } finally {
      for (const id of createdIds) {
        await page.request.delete(`${ctx.base}/Appointments/${id}`, { headers: { Authorization: ctx.auth } });
      }
    }
  });
});
