/**
 * Teste pentru garda de rută pe modul și pentru redirect-ul de aterizare.
 *
 * Până la Etapa 2, filtrarea din sidebar era pur cosmetică: cine tasta adresa în
 * bară ajungea pe pagină, care se umplea de 403-uri. Aceste teste fixează
 * comportamentul corect.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireModuleAccess, LandingRedirect } from '@/routes/RequireModuleAccess';
import { useAuthStore } from '@/store/authStore';
import { ACCESS_LEVEL, MODULE, type ModuleCode } from '@/hooks/useHasAccess';

vi.mock('@/routes/AccessScreens.module.scss', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

vi.mock('@/api/endpoints/auth.api', () => ({
  authApi: { login: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}));

function setSession(modules: ModuleCode[], { authenticated = true, bootstrapping = false } = {}) {
  useAuthStore.setState({
    isAuthenticated: authenticated,
    isBootstrapping: bootstrapping,
    permissions: modules.map((module) => ({
      module,
      level: ACCESS_LEVEL.Read,
      isOverridden: false,
    })),
  });
}

/// Montează garda peste câteva rute reale, ca într-o aplicație.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireModuleAccess />}>
          <Route path="/patients"        element={<div>ECRAN PACIENTI</div>} />
          <Route path="/patients/new"    element={<div>FORMULAR PACIENT</div>} />
          <Route path="/settings/security" element={<div>ECRAN SETARI</div>} />
          <Route path="/medicamente"     element={<div>ECRAN MEDICAMENTE</div>} />
          <Route path="/oarecare"        element={<div>ECRAN NEMAPAT</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useAuthStore.setState({ permissions: [], isAuthenticated: false, isBootstrapping: true });
});

// ── RequireModuleAccess ───────────────────────────────────────────────────────

describe('RequireModuleAccess', () => {
  it('lasă ecranul să se randeze când utilizatorul are modulul', () => {
    setSession([MODULE.Patients]);
    renderAt('/patients');
    expect(screen.getByText('ECRAN PACIENTI')).toBeInTheDocument();
  });

  it('blochează ecranul și explică de ce când modulul lipsește', () => {
    setSession([MODULE.Dashboard]);
    renderAt('/settings/security');

    expect(screen.queryByText('ECRAN SETARI')).not.toBeInTheDocument();
    expect(screen.getByText('Nu ai acces la acest ecran')).toBeInTheDocument();
    // Codul modulului lipsă e afișat — e ce cere utilizatorul de la administrator.
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('protejează și subrutele, nu doar calea de bază', () => {
    setSession([MODULE.Dashboard]);
    renderAt('/patients/new');

    expect(screen.queryByText('FORMULAR PACIENT')).not.toBeInTheDocument();
    expect(screen.getByText('Nu ai acces la acest ecran')).toBeInTheDocument();
  });

  it('cere toate modulele unei pagini cu dependențe multiple', () => {
    setSession([MODULE.Anm]);
    renderAt('/medicamente');

    expect(screen.queryByText('ECRAN MEDICAMENTE')).not.toBeInTheDocument();
    expect(screen.getByText('anm')).toBeInTheDocument();
    expect(screen.getByText('cnas')).toBeInTheDocument();
  });

  it('permite pagina cu dependențe multiple când userul le are pe toate', () => {
    setSession([MODULE.Anm, MODULE.Cnas]);
    renderAt('/medicamente');
    expect(screen.getByText('ECRAN MEDICAMENTE')).toBeInTheDocument();
  });

  it('lasă deschisă o rută nemapată — backend-ul o protejează oricum', () => {
    setSession([]);
    renderAt('/oarecare');
    expect(screen.getByText('ECRAN NEMAPAT')).toBeInTheDocument();
  });
});

// ── LandingRedirect ───────────────────────────────────────────────────────────

function renderLanding(path = '/ceva-inexistent') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login"        element={<div>ECRAN LOGIN</div>} />
        <Route path="/dashboard"    element={<div>ECRAN DASHBOARD</div>} />
        <Route path="/appointments" element={<div>ECRAN PROGRAMARI</div>} />
        <Route path="*"             element={<LandingRedirect />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LandingRedirect', () => {
  it('duce la dashboard când utilizatorul are modulul', () => {
    setSession([MODULE.Dashboard]);
    renderLanding();
    expect(screen.getByText('ECRAN DASHBOARD')).toBeInTheDocument();
  });

  it('duce la primul ecran permis când dashboard-ul e interzis', () => {
    setSession([MODULE.Appointments]);
    renderLanding();
    expect(screen.getByText('ECRAN PROGRAMARI')).toBeInTheDocument();
  });

  it('afișează un ecran explicit când niciun modul nu e alocat', () => {
    setSession([]);
    renderLanding();
    expect(screen.getByText('Contul nu are niciun modul alocat')).toBeInTheDocument();
  });

  it('trimite la login utilizatorul neautentificat', () => {
    setSession([], { authenticated: false });
    renderLanding();
    expect(screen.getByText('ECRAN LOGIN')).toBeInTheDocument();
  });

  it('nu redirecționează cât timp sesiunea încă se reconstruiește', () => {
    setSession([], { authenticated: false, bootstrapping: true });
    renderLanding();
    expect(screen.queryByText('ECRAN LOGIN')).not.toBeInTheDocument();
    expect(screen.queryByText('Contul nu are niciun modul alocat')).not.toBeInTheDocument();
  });
});
