/**
 * Teste navigare — verifică că toate paginile se încarcă fără erori 401/403/500
 * pentru utilizatorul admin (care are acces Full la toate modulele).
 *
 * Folosește sesiunea salvată de global.setup.ts.
 */
import { test, expect } from '../utils/fixtures';
import { collectApiErrors } from '../utils/helpers';

// ── Definire pagini de testat ──────────────────────────────────────────────────
const PAGES = [
  { path: '/dashboard',          heading: /Dashboard/i,           label: 'Dashboard' },
  { path: '/patients',           heading: /Pacienți/i,            label: 'Pacienți' },
  { path: '/doctors',            heading: /Doctori/i,             label: 'Doctori' },
  { path: '/medical-staff',      heading: /Personal Medical/i,    label: 'Personal Medical' },
  { path: '/departments',        heading: /Departamente/i,        label: 'Departamente' },
  { path: '/users',              heading: /Utilizatori/i,         label: 'Utilizatori' },
  { path: '/specialties',        heading: /Specializ/i,           label: 'Specializări' },
  { path: '/medical-titles',     heading: /Titulatur|Medical/i,   label: 'Titulaturi Medicale' },
  { path: '/clinic',             heading: /Clinica/i,             label: 'Clinica' },
  { path: '/invoices',           heading: /Factur/i,              label: 'Facturi' },
  { path: '/appointments',       heading: /Programăr/i,           label: 'Programări' },
  { path: '/consultations',      heading: /Consultați/i,          label: 'Consultații' },
  { path: '/prescriptions',      heading: /Prescripț/i,           label: 'Prescripții' },
  { path: '/permissions/roles',  heading: /Permisiuni|Roluri/i,   label: 'Permisiuni Roluri' },
  { path: '/permissions/users',  heading: /Permisiuni|Override/i, label: 'Override Utilizatori' },
] as const;

// ── Helper: aşteaptă să nu mai fie request-uri în zbor ────────────────────────
async function waitForNetworkIdle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
    // networkidle poate expira pe SPA-uri cu polling — ignorăm timeout-ul
  });
}

// ── Teste navigare ──────────────────────────────────────────────────────────────
test.describe('Navigare — toate paginile se încarcă fără erori', () => {

  for (const pageInfo of PAGES) {
    test(`${pageInfo.label} (${pageInfo.path}) — fără 401/403/500`, async ({ page }) => {
      const { errors } = collectApiErrors(page);

      // Navighează direct la pagina
      await page.goto(pageInfo.path);
      await waitForNetworkIdle(page);

      // Verifică URL-ul corect (nu redirecționat la login)
      await expect(page).not.toHaveURL(/.*login/);
      await expect(page).toHaveURL(new RegExp(pageInfo.path));

      // Verifică că erori API nu există
      if (errors.length > 0) {
        throw new Error(
          `Erori API pe pagina "${pageInfo.label}":\n${errors.join('\n')}`
        );
      }
    });
  }
});
