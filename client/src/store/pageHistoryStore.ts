import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PageEntry {
  /** Calea URL completă (ex: /patients, /clinic) */
  path: string
  /** Eticheta afișată în tab */
  label: string
  /** Timestamp ultima vizitare — pentru sortare */
  visitedAt: number
}

// Număr maxim de pagini reținute în istoric
const MAX_HISTORY = 10

// Mapare rute → etichete — trebuie sincronizată cu AppHeader/Sidebar
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/patients':           'Pacienți',
  '/patients/new':       'Pacient nou',
  '/appointments':       'Programări',
  '/consultations':      'Consultații',
  '/prescriptions':      'Prescripții',
  '/invoices':           'Facturi',
  '/doctors':            'Doctori',
  '/medical-staff':      'Personal Medical',
  '/departments':        'Departamente',
  '/users':              'Utilizatori',
  '/specialties':        'Specializări',
  '/medical-titles':     'Titulaturi',
  '/clinic':             'Clinica',
  '/permissions/roles':  'Permisiuni Roluri',
  '/permissions/users':  'Override Utilizatori',
}

export const getLabelForPath = (path: string): string => {
  // Potrivire exactă
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path]

  // Rute dinamice (ex: /patients/123/edit)
  if (path.startsWith('/patients/') && path.endsWith('/edit')) return 'Editare pacient'

  // Fallback: ultima componentă din path
  const last = path.split('/').filter(Boolean).pop() ?? path
  return last.charAt(0).toUpperCase() + last.slice(1)
}

interface PageHistoryState {
  history: PageEntry[]
  /** Înregistrează o vizită — adaugă dacă nu există, actualizează timestamp dacă există */
  push: (path: string) => void
  /** Elimină o pagină din istoric */
  remove: (path: string) => void
  /** Curăță tot istoricul */
  clear: () => void
}

export const usePageHistoryStore = create<PageHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      push: (path: string) => {
        // Nu înregistrăm pagina de login sau rădăcina
        if (path === '/login' || path === '/') return

        const label = getLabelForPath(path)
        const now = Date.now()
        const existing = get().history.find((e) => e.path === path)

        if (existing) {
          // Actualizează timestamp fără să duplice
          set((s) => ({
            history: s.history.map((e) =>
              e.path === path ? { ...e, visitedAt: now } : e,
            ),
          }))
        } else {
          set((s) => {
            const next = [{ path, label, visitedAt: now }, ...s.history]
            // Limitează la MAX_HISTORY — elimină cele mai vechi
            return { history: next.slice(0, MAX_HISTORY) }
          })
        }
      },

      remove: (path: string) =>
        set((s) => ({ history: s.history.filter((e) => e.path !== path) })),

      clear: () => set({ history: [] }),
    }),
    {
      name: 'valyan-page-history',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
