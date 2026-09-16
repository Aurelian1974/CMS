/**
 * Teste unitare pentru Sidebar.
 *
 * Sidebar-ul e singurul loc din client care traduce permisiunile efective în
 * navigație, deci aceste teste verifică exact asta:
 * - un item apare doar dacă userul are Read pe TOATE modulele de care depinde pagina
 * - secțiunile rămase fără item-uri vizibile dispar complet
 * - codurile de modul folosite în meniu există în MODULE (ar fi prins drift-ul
 *   'settings' / 'audit' care rupsese `npm run build`)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ACCESS_LEVEL, MODULE, type ModuleCode } from '@/hooks/useHasAccess'

// ── SCSS mock ─────────────────────────────────────────────────────────────────

vi.mock('@/components/layout/Sidebar.module.scss', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}))

// ── API mock — sidebar-ul importă authApi pentru deconectare ──────────────────

vi.mock('@/api/endpoints/auth.api', () => ({
  authApi: { login: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Acordă Read pe modulele date; restul rămân implicit fără acces.
function grantRead(...modules: ModuleCode[]) {
  useAuthStore.setState({
    permissions: modules.map((module) => ({
      module,
      level: ACCESS_LEVEL.Read,
      isOverridden: false,
    })),
  })
}

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ sidebarCollapsed: false })
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'test@valyanclinic.ro',
        fullName: 'Ana Popescu',
        role: 'admin',
        roleId: 'r-1',
        clinicId: 'c-1',
        doctorId: null,
      },
      permissions: [],
    })
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, permissions: [] })
  })

  // ── Filtrare pe permisiuni ──────────────────────────────────────────────────

  it('afișează doar item-urile pentru care userul are cel puțin Read', () => {
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Pacienți')).toBeInTheDocument()
    expect(screen.queryByText('Facturi')).not.toBeInTheDocument()
    expect(screen.queryByText('Utilizatori')).not.toBeInTheDocument()
  })

  it('ascunde complet secțiunile rămase fără item-uri vizibile', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByText('Principal')).toBeInTheDocument()
    expect(screen.queryByText('Financiar')).not.toBeInTheDocument()
    expect(screen.queryByText('Administrare')).not.toBeInTheDocument()
    expect(screen.queryByText('Nomenclatoare')).not.toBeInTheDocument()
  })

  it('nu afișează nimic în nav când userul nu are niciun modul', () => {
    grantRead()
    renderSidebar()

    expect(screen.queryByText('Principal')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    // Blocul de utilizator rămâne — de acolo se face deconectarea.
    expect(screen.getByText('Ana Popescu')).toBeInTheDocument()
  })

  // ── Module noi: settings și audit (drift-ul care rupsese build-ul) ───────────

  it('afișează ecranele de securitate doar cu permisiunile corespunzătoare', () => {
    grantRead(MODULE.Settings, MODULE.Audit)
    renderSidebar()

    expect(screen.getByText('Setări securitate')).toBeInTheDocument()
    expect(screen.getByText('Jurnal securitate')).toBeInTheDocument()
  })

  it('ascunde ecranele de securitate pentru un user fără settings/audit', () => {
    grantRead(MODULE.Users)
    renderSidebar()

    expect(screen.getByText('Utilizatori')).toBeInTheDocument()
    expect(screen.queryByText('Setări securitate')).not.toBeInTheDocument()
    expect(screen.queryByText('Jurnal securitate')).not.toBeInTheDocument()
  })

  // ── Item cu mai multe module: semantică AND ─────────────────────────────────

  it('Medicamente cere ambele module — anm singur nu e suficient', () => {
    grantRead(MODULE.Anm)
    renderSidebar()

    expect(screen.queryByText('Medicamente')).not.toBeInTheDocument()
  })

  it('Medicamente cere ambele module — cnas singur nu e suficient', () => {
    grantRead(MODULE.Cnas)
    renderSidebar()

    expect(screen.queryByText('Medicamente')).not.toBeInTheDocument()
  })

  it('Medicamente apare cu anm și cnas împreună', () => {
    grantRead(MODULE.Anm, MODULE.Cnas)
    renderSidebar()

    expect(screen.getByText('Medicamente')).toBeInTheDocument()
  })

  // ── Bloc utilizator ─────────────────────────────────────────────────────────

  it('afișează inițialele utilizatorului în avatar', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByText('AP')).toBeInTheDocument()
  })

  it('afișează inițialele corect și când numele are spații duble', () => {
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'test@valyanclinic.ro',
        fullName: 'Ion  Popescu',
        role: 'admin',
        roleId: 'r-1',
        clinicId: 'c-1',
        doctorId: null,
      },
    })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByText('IP')).toBeInTheDocument()
  })

  // ── Accesibilitate ──────────────────────────────────────────────────────────

  it('nav-ul are etichetă semantică pentru cititoarele de ecran', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByRole('navigation', { name: 'Navigare principală' })).toBeInTheDocument()
  })

  it('grupurile de navigație au role=group și aria-labelledby', () => {
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    const group = screen.getByRole('group')
    const label = document.getElementById(group.getAttribute('aria-labelledby')!)

    expect(label).toHaveTextContent('Principal')
  })

  it('butonul de collapse comunică starea prin aria-expanded', () => {
    useUiStore.setState({ sidebarCollapsed: false })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    const btn = screen.getByRole('button', { name: 'Restrânge sidebar' })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAttribute('aria-controls', 'main-navigation')
  })

  it('când sidebar-ul e colapsat, link-urile au title pentru tooltip', () => {
    useUiStore.setState({ sidebarCollapsed: true })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('title', 'Dashboard')
  })
})
