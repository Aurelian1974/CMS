---
name: fe-react
description: >
  USE WHEN: creating or modifying frontend React + TypeScript code — components, pages,
  hooks, stores, forms, API clients, or styles. Covers: component file structure
  (tsx + module.scss + types.ts + index.ts), CSS Modules + Bootstrap layout, Syncfusion
  wrappers (AppDataGrid mandatory — never GridComponent directly), React Hook Form + Zod schemas,
  TanStack Query v5 with query key factories, Zustand stores, naming conventions,
  headerText casing rules in DataGrid, and UI consistency.
  AVOID this skill for backend C# code or SQL scripts.
---

# Frontend React + TypeScript Skill — ValyanClinic

## Architecture Overview

- **React 19** + **TypeScript** + **Vite**
- **TanStack Query v5** — all server state (no manual fetch/useState)
- **React Hook Form + Zod** — all forms with schema validation
- **Zustand** — client state (auth, UI)
- **Syncfusion EJ2** — data grids, scheduler, date pickers (always wrapped)
- **Bootstrap 5** — layout and spacing utilities
- **SCSS Modules** — component-scoped styles
- **Axios** — HTTP client with interceptors for JWT + refresh

---

## Step 1 — Component File Structure

**Complex components** (40+ lines or reusable) get their own directory:

```
components/ui/AppButton/
├── AppButton.tsx           # JSX markup — minimal logic
├── AppButton.module.scss   # Scoped CSS
├── AppButton.types.ts      # TypeScript interfaces
├── useAppButton.ts         # Custom hook with logic (if needed)
├── AppButton.test.tsx      # Unit tests
└── index.ts                # Barrel: export { AppButton } from './AppButton'
```

**Simple components** (< 40 lines, not reused) — combine markup + types in one file.

**Feature folder structure:**
```
features/patients/
├── components/
│   ├── PatientForm/
│   │   ├── PatientForm.tsx
│   │   ├── PatientForm.module.scss
│   │   └── index.ts
│   └── PatientFormModal/
├── hooks/
│   └── usePatients.ts       # TanStack Query hooks
├── schemas/
│   └── patient.schema.ts    # Zod schemas
├── types/
│   └── patient.types.ts     # TypeScript types
└── pages/
    └── PatientsListPage.tsx
```

---

## Step 2 — CSS: Global vs Module vs Bootstrap

| Type | Location | Use for |
|------|----------|---------|
| **CSS Global** | `src/styles/*.scss` | Variables, reset, typography, Syncfusion/Bootstrap overrides |
| **CSS Module** | `*.module.scss` next to component | Component-specific isolated styles |
| **Bootstrap utility** | inline `className` | Layout: `d-flex`, `gap-3`, `mb-4`, `text-center` |

**Bootstrap 5** = layout and spacing. Colors and visual style → SCSS variables + CSS Modules.

```tsx
// Correct: Bootstrap for layout, CSS Module for component style
<div className={`d-flex gap-3 ${styles.container}`}>
  <AppButton className={styles.primaryAction}>Save</AppButton>
</div>
```

```scss
// AppButton.module.scss
@import '@/styles/variables';

.button {
  // Component styles here
  &--primary {
    background-color: $primary;
    &:hover:not(:disabled) { background-color: $primary-dark; }
  }
}
```

---

## Step 3 — Syncfusion Wrappers (MANDATORY)

**NEVER use Syncfusion components directly in feature code. Always use the wrappers in `components/`.**

### AppDataGrid — The standard data grid

Every list page uses `<AppDataGrid>` — **never** `<GridComponent>` directly.

```
components/data-display/AppDataGrid/
├── AppDataGrid.tsx          # Wrapper: sort/filter/group/page/export/columnChooser
├── AppDataGrid.types.ts     # Props interface
├── AppDataGrid.module.scss  # Container styles + Syncfusion :global overrides
├── useGridExport.ts         # Export hook (Excel/PDF with template save/restore)
└── index.ts
```

**AppDataGrid rules:**
- Column Chooser: `toolbar={['ColumnChooser']}` — native, never custom button outside grid
- 13 injected services: Page, Sort, Filter, Group, Reorder, Resize, Freeze, ExcelExport, PdfExport, ColumnChooser, Toolbar
- Sort via `sortSettings` prop; default: `fullName` Ascending
- Columns as children (`<ColumnsDirective>` + `<ColumnDirective>`)

```tsx
// Usage in a list page
import { useRef } from 'react'
import type { GridComponent } from '@syncfusion/ej2-react-grids'
import { ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-grids'
import { AppDataGrid, useGridExport } from '@/components/data-display/AppDataGrid'

const SORT_SETTINGS = { columns: [{ field: 'fullName', direction: 'Ascending' as const }] }

export const PatientsListPage = () => {
  const gridRef = useRef<GridComponent>(null)

  const { handleExcelExport, handlePdfExport } = useGridExport(gridRef, {
    fileNamePrefix: 'pacienti',
    buildExportData: () => filteredData.map(p => ({ /* plain objects — no JSX */ })),
  })

  return (
    <AppDataGrid gridRef={gridRef} dataSource={filteredData} sortSettings={SORT_SETTINGS}>
      <ColumnsDirective>
        <ColumnDirective field="fullName" headerText="Pacient" width="230" />
        <ColumnDirective field="cnp" headerText="CNP" width="150" />
      </ColumnsDirective>
    </AppDataGrid>
  )
}
```

### DataGrid headerText casing — MANDATORY

**First letter uppercase, rest lowercase — never ALL CAPS.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `headerText="PACIENT"` | `headerText="Pacient"` |
| `headerText="GRUPĂ SANGUINĂ"` | `headerText="Grupă sanguină"` |
| `headerText="MEDIC PRIMAR"` | `headerText="Medic primar"` |
| `headerText="ULTIMA AUTENTIFICARE"` | `headerText="Ultima autentificare"` |

Exceptions (acronyms only): `CNP`, `Nr. CMR`, `CUI`. No `text-transform: uppercase`.

### Syncfusion CSS Override Rules

1. Check class names in [official docs](https://ej2.syncfusion.com/react/documentation/) before styling — do NOT guess
2. Use `:global { .e-class { ... } }` in CSS Modules for Syncfusion classes (they're not module-scoped)
3. `!important` is required — Syncfusion has high specificity
4. Column Chooser dialog: `.e-dialog.e-ccdlg` (not a custom div)
5. Export Excel/PDF: use `useGridExport` save/restore pattern (JSX templates break plain export)

---

## Step 4 — React Hook Form + Zod

**Schema + types in `features/[feature]/schemas/`, never inline in component.**

```ts
// features/patients/schemas/patient.schema.ts
import { z } from 'zod'

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu').max(100),
  lastName:  z.string().min(1, 'Numele este obligatoriu').max(100),
  cnp:       z.string().regex(/^[1-9]\d{12}$/, 'CNP-ul trebuie să aibă 13 cifre valide'),
  phoneNumber: z.string().regex(/^(\+40|0)[0-9]{9}$/, 'Număr invalid').optional().or(z.literal('')),
  email:       z.string().email('Email invalid').optional().or(z.literal('')),
})

// Derive types from schema — never duplicate manually
export type CreatePatientFormData = z.infer<typeof createPatientSchema>
```

```tsx
// Form component
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPatientSchema, type CreatePatientFormData } from '../../schemas/patient.schema'
import { FormInput } from '@/components/forms/FormInput'

export const PatientForm = ({ onSubmit, isLoading }: PatientFormProps) => {
  const { control, handleSubmit } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: { firstName: '', lastName: '', cnp: '', phoneNumber: '', email: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="row g-3">
        <div className="col-md-6">
          <FormInput name="lastName" control={control} label="Nume" required />
        </div>
        <div className="col-md-6">
          <FormInput name="firstName" control={control} label="Prenume" required />
        </div>
      </div>
      <div className="d-flex justify-content-end mt-3">
        <AppButton type="submit" isLoading={isLoading}>Salvează</AppButton>
      </div>
    </form>
  )
}
```

**Use wrapped Syncfusion form components** (`FormInput`, `FormSelect`, `FormDatePicker`) — never raw Syncfusion `TextBoxComponent` directly in feature code.

---

## Step 5 — TanStack Query v5

**All server state via TanStack Query. No `useState` + `useEffect` for data fetching.**

```ts
// features/patients/hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { patientsApi } from '@/api/endpoints/patients.api'
import type { GetPatientsParams, CreatePatientPayload } from '../types/patient.types'

// Hierarchical query keys — always in one factory object
export const patientKeys = {
  all:     ['patients'] as const,
  lists:   () => [...patientKeys.all, 'list'] as const,
  list:    (params: GetPatientsParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail:  (id: string) => [...patientKeys.details(), id] as const,
}

export const usePatients = (params: GetPatientsParams) =>
  useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

export const useCreatePatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.lists() }),
  })
}

export const useUpdatePatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientPayload> }) =>
      patientsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) })
    },
  })
}
```

**Nomenclature data** (statuses, genders, etc.) comes from API via TanStack Query — never hardcoded in frontend:

```ts
// features/nomenclature/hooks/useNomenclature.ts
export const useAppointmentStatuses = () =>
  useQuery({ queryKey: ['nomenclature', 'appointment-statuses'],
             queryFn: () => nomenclatureApi.getAppointmentStatuses() })
```

---

## Step 6 — Zustand Stores

```ts
// store/authStore.ts — access token in sessionStorage (NOT localStorage)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      updateToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage — not localStorage
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
)
```

---

## Step 7 — Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component file | PascalCase | `AppButton.tsx` |
| CSS Module | PascalCase.module.scss | `AppButton.module.scss` |
| Hook file | use + camelCase | `usePatients.ts` |
| Store file | camelCase + Store | `authStore.ts` |
| API file | camelCase + .api | `patients.api.ts` |
| Schema file | camelCase + .schema | `patient.schema.ts` |
| Types file | camelCase + .types | `patient.types.ts` |
| Constant | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Interface/Type | PascalCase, no `I` prefix | `PatientDetailDto` |
| Shared directory | kebab-case | `data-display/`, `form-input/` |
| Feature directory | camelCase | `patients/`, `appointments/` |
| UI component prefix | App + PascalCase | `AppButton`, `AppDataGrid` |
| Event handler | handle + Action | `handleRowSelected`, `handleSave` |

---

## Step 8 — Page Scroll

Each page manages its own scroll. The main layout uses `overflow: hidden`, so pages that need scroll must declare it themselves:

```scss
// PageName.module.scss
.page {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
}
```

```tsx
// PageName.tsx
import styles from './PageName.module.scss'

export const PageNamePage = () => (
  <div className={styles.page}>
    {/* content */}
  </div>
)
```

---

## Checklist Before Completing

- [ ] Complex component has its own directory with `.tsx`, `.module.scss`, `.types.ts`, `index.ts`
- [ ] Syncfusion never used directly in feature code — all through wrappers
- [ ] Lists use `<AppDataGrid>`, not `<GridComponent>`
- [ ] All `headerText` in Normal case (not UPPERCASE)
- [ ] Form schema defined in `schemas/` with Zod, types derived via `z.infer<>`
- [ ] `useForm` uses `zodResolver`
- [ ] Server data fetches use TanStack Query (no `useState+useEffect` for data)
- [ ] Query keys use factory pattern in `[entity]Keys` object
- [ ] Auth token stored in sessionStorage, not localStorage
- [ ] Page has `height: 100%; overflow-y: auto` in SCSS if it needs scroll
- [ ] No nomenclature values hardcoded in frontend — fetched from API
