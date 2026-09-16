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
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

// ── API mock — favoritele sidebar-ului, fără apel real de rețea ──────────────

vi.mock('@/api/endpoints/userMenuPreferences.api', () => ({
  userMenuPreferencesApi: {
    get: vi.fn().mockResolvedValue({ favoriteRoutes: [] }),
    upsert: vi.fn().mockResolvedValue(undefined),
  },
}))

import { userMenuPreferencesApi } from '@/api/endpoints/userMenuPreferences.api'

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

function renderSidebar(props: { sessionSecondsLeft?: number | null } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(userMenuPreferencesApi.get).mockReset().mockResolvedValue({ favoriteRoutes: [] })
    vi.mocked(userMenuPreferencesApi.upsert).mockReset().mockResolvedValue(undefined)
    useUiStore.setState({ sidebarCollapsed: false, collapsedSections: [], menuSearchQuery: '' })
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
      idleTimeoutMinutes: 0,
    })
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, permissions: [], idleTimeoutMinutes: 0 })
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

  // ── Căutare în meniu ────────────────────────────────────────────────────────

  it('afișează inputul de căutare când sidebar-ul e extins', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.getByRole('textbox', { name: 'Caută în meniu' })).toBeInTheDocument()
  })

  it('ascunde inputul de căutare când sidebar-ul e colapsat', () => {
    useUiStore.setState({ sidebarCollapsed: true })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.queryByRole('textbox', { name: 'Caută în meniu' })).not.toBeInTheDocument()
  })

  it('filtrează itemii de meniu după query', () => {
    grantRead(MODULE.Dashboard, MODULE.Patients, MODULE.Appointments)
    renderSidebar()

    const searchInput = screen.getByRole('textbox', { name: 'Caută în meniu' })
    fireEvent.change(searchInput, { target: { value: 'pac' } })

    expect(screen.getByText('Pacienți')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Programări')).not.toBeInTheDocument()
  })

  it('filtrează secțiuni după nume și ascunde secțiunile goale', () => {
    grantRead(MODULE.Dashboard, MODULE.Patients, MODULE.Invoices)
    renderSidebar()

    const searchInput = screen.getByRole('textbox', { name: 'Caută în meniu' })
    fireEvent.change(searchInput, { target: { value: 'financiar' } })

    expect(screen.getByText('Financiar')).toBeInTheDocument()
    expect(screen.getByText('Facturi')).toBeInTheDocument()
    expect(screen.queryByText('Principal')).not.toBeInTheDocument()
  })

  it('butonul de clear golește căutarea', () => {
    useUiStore.setState({ menuSearchQuery: 'pac' })
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    expect(screen.getByRole('textbox', { name: 'Caută în meniu' })).toHaveValue('pac')

    const clearBtn = screen.getByRole('button', { name: 'Șterge căutarea' })
    fireEvent.click(clearBtn)

    expect(screen.getByRole('textbox', { name: 'Caută în meniu' })).toHaveValue('')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Pacienți')).toBeInTheDocument()
  })

  it('la Escape se golește căutarea când inputul are focus', () => {
    useUiStore.setState({ menuSearchQuery: 'pac' })
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    const searchInput = screen.getByRole('textbox', { name: 'Caută în meniu' })
    fireEvent.keyDown(searchInput, { key: 'Escape' })

    expect(useUiStore.getState().menuSearchQuery).toBe('')
  })

  // ── Secțiuni colapsabile ─────────────────────────────────────────────────────

  it('toate secțiunile sunt extinse implicit', () => {
    grantRead(MODULE.Dashboard, MODULE.Invoices)
    renderSidebar()

    expect(screen.getByRole('button', { name: 'Principal' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Financiar' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Facturi')).toBeInTheDocument()
  })

  it('click pe header restrânge secțiunea și îi ascunde itemii vizual', () => {
    grantRead(MODULE.Dashboard, MODULE.Invoices)
    renderSidebar()

    const header = screen.getByRole('button', { name: 'Principal' })
    fireEvent.click(header)

    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(useUiStore.getState().collapsedSections).toContain('Principal')
    // Financiar rămâne neafectat.
    expect(screen.getByRole('button', { name: 'Financiar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('un al doilea click reextinde secțiunea', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    const header = screen.getByRole('button', { name: 'Principal' })
    fireEvent.click(header)
    fireEvent.click(header)

    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(useUiStore.getState().collapsedSections).not.toContain('Principal')
  })

  it('starea restrânsă persistă în localStorage', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Principal' }))

    const stored = JSON.parse(localStorage.getItem('ui-storage')!)
    expect(stored.state.collapsedSections).toContain('Principal')
  })

  it('o secțiune restrânsă rămâne extinsă automat cât timp există o căutare activă', () => {
    useUiStore.setState({ collapsedSections: ['Principal'] })
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    // Fără căutare, secțiunea e restrânsă.
    expect(screen.getByRole('button', { name: 'Principal' })).toHaveAttribute('aria-expanded', 'false')

    const searchInput = screen.getByRole('textbox', { name: 'Caută în meniu' })
    fireEvent.change(searchInput, { target: { value: 'pac' } })

    expect(screen.getByRole('button', { name: 'Principal' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Pacienți')).toBeInTheDocument()
  })

  // ── Favorite ─────────────────────────────────────────────────────────────────

  it('nu afișează secțiunea Favorite când nu există favorite salvate', async () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    await screen.findByText('Dashboard')
    expect(screen.queryByRole('group', { name: 'Favorite' })).not.toBeInTheDocument()
  })

  it('afișează secțiunea Favorite cu itemii salvați, în ordinea din API', async () => {
    vi.mocked(userMenuPreferencesApi.get).mockResolvedValueOnce({
      favoriteRoutes: ['/patients'],
    })
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    const favoriteGroup = await screen.findByRole('group', { name: 'Favorite' })
    expect(within(favoriteGroup).getByText('Pacienți')).toBeInTheDocument()
  })

  it('o rută favorită la care userul și-a pierdut accesul nu apare în Favorite', async () => {
    vi.mocked(userMenuPreferencesApi.get).mockResolvedValueOnce({
      favoriteRoutes: ['/patients'],
    })
    grantRead(MODULE.Dashboard) // fără Patients
    renderSidebar()

    await screen.findByText('Dashboard')
    expect(screen.queryByRole('group', { name: 'Favorite' })).not.toBeInTheDocument()
  })

  it('click pe steaua unui item îl adaugă la favorite', async () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    const star = await screen.findByRole('button', { name: 'Adaugă Dashboard la favorite' })
    fireEvent.click(star)

    await waitFor(() => {
      expect(userMenuPreferencesApi.upsert).toHaveBeenCalledWith({ favoriteRoutes: ['/dashboard'] })
    })
  })

  it('click pe steaua unui item deja favorit îl elimină', async () => {
    vi.mocked(userMenuPreferencesApi.get).mockResolvedValueOnce({
      favoriteRoutes: ['/dashboard'],
    })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    const favoriteGroup = await screen.findByRole('group', { name: 'Favorite' })
    const star = within(favoriteGroup).getByRole('button', { name: 'Elimină Dashboard din favorite' })
    fireEvent.click(star)

    await waitFor(() => {
      expect(userMenuPreferencesApi.upsert).toHaveBeenCalledWith({ favoriteRoutes: [] })
    })
  })

  // ── Reordonare favorite (drag-and-drop) ─────────────────────────────────────
  // Simularea unui drag real cu @dnd-kit necesită coordonate de layout pe care
  // jsdom nu le calculează — verificăm aici prezența/vizibilitatea grip-ului;
  // reordonarea efectivă e acoperită de un test E2E cu Playwright.

  it('afișează un grip de reordonare pentru fiecare favorit', async () => {
    vi.mocked(userMenuPreferencesApi.get).mockResolvedValueOnce({
      favoriteRoutes: ['/dashboard', '/patients'],
    })
    grantRead(MODULE.Dashboard, MODULE.Patients)
    renderSidebar()

    const favoriteGroup = await screen.findByRole('group', { name: 'Favorite' })
    expect(within(favoriteGroup).getByRole('button', { name: 'Reordonează Dashboard' })).toBeInTheDocument()
    expect(within(favoriteGroup).getByRole('button', { name: 'Reordonează Pacienți' })).toBeInTheDocument()
  })

  it('ascunde grip-ul de reordonare când sidebar-ul e colapsat', async () => {
    useUiStore.setState({ sidebarCollapsed: true })
    vi.mocked(userMenuPreferencesApi.get).mockResolvedValueOnce({
      favoriteRoutes: ['/dashboard'],
    })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    const favoriteGroup = await screen.findByRole('group', { name: 'Favorite' })
    expect(within(favoriteGroup).queryByRole('button', { name: /reordonează/i })).not.toBeInTheDocument()
  })

  it('itemii din secțiunile obișnuite (nefavorite) nu au grip de reordonare', async () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    await screen.findByText('Dashboard')
    expect(screen.queryByRole('button', { name: /reordonează/i })).not.toBeInTheDocument()
  })

  it('nu afișează butonul de favorite când sidebar-ul e colapsat', async () => {
    useUiStore.setState({ sidebarCollapsed: true })
    grantRead(MODULE.Dashboard)
    renderSidebar()

    await screen.findByRole('link', { name: 'Dashboard' })
    expect(screen.queryByRole('button', { name: /favorite/i })).not.toBeInTheDocument()
  })

  // ── Contor sesiune (inel — timp rămas până la deconectarea din inactivitate) ─

  it('nu afișează inelul de sesiune când nu i se dă valoare', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar()

    expect(screen.queryByRole('img', { name: /sesiune activă/i })).not.toBeInTheDocument()
  })

  it('afișează timpul rămas în cuvinte, sub o oră, lângă inel', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 3525 }) // 58m 45s

    expect(screen.getByText('58 minute și 45 secunde')).toBeInTheDocument()
  })

  it('afișează timpul rămas în cuvinte, cu ore, peste o oră', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 4530 }) // 1h 15m 30s

    expect(screen.getByText('1 oră 15 minute și 30 secunde')).toBeInTheDocument()
  })

  it('omite unitățile zero (fără ore) și pluralizează corect', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 3601 }) // 1h 0m 1s

    expect(screen.getByText('1 oră și 1 secundă')).toBeInTheDocument()
  })

  it('inelul e verde când mai sunt peste 5 minute', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 301 })

    expect(screen.getByRole('img', { name: /sesiune activă/i })).toHaveClass('sessionTimerOk')
  })

  it('inelul e galben/portocaliu între 4:59 și 1:01', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 180 })

    expect(screen.getByRole('img', { name: /sesiune activă/i })).toHaveClass('sessionTimerWarning')
  })

  it('inelul e roșu sub 1 minut', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 45 })

    expect(screen.getByRole('img', { name: /sesiune activă/i })).toHaveClass('sessionTimerDanger')
  })

  it('inelul rămâne vizibil când sidebar-ul e colapsat, dar eticheta textuală dispare', () => {
    useUiStore.setState({ sidebarCollapsed: true })
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 120 })

    expect(screen.getByRole('img', { name: /sesiune activă/i })).toBeInTheDocument()
    expect(screen.queryByText('2 minute')).not.toBeInTheDocument()
  })

  it('afișează eticheta „Sesiunea expiră în:” în stânga inelului când sidebar-ul e extins', () => {
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 120 })

    expect(screen.getByText('Sesiunea expiră în:')).toBeInTheDocument()
  })

  it('eticheta „Sesiunea expiră în:” dispare când sidebar-ul e colapsat', () => {
    useUiStore.setState({ sidebarCollapsed: true })
    grantRead(MODULE.Dashboard)
    renderSidebar({ sessionSecondsLeft: 120 })

    expect(screen.queryByText('Sesiunea expiră în:')).not.toBeInTheDocument()
  })
})
