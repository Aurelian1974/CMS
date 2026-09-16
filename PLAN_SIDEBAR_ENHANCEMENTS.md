# Plan — Extensii Sidebar: secțiuni colapsabile, căutare, favorite, reordonare

> Data: 16 Septembrie 2026
> Stare: **Aprobat pentru implementare**
> Revizie: v1.1
> Părinte: [PLAN_SIDEBAR.md](PLAN_SIDEBAR.md)
> Decizii review: coloane dedicate (nu EAV) pentru preferințe UI; restul conform planului inițial.

---

## 1. Context

Sidebar-ul a trecut prin 4 etape de stabilizare (A–F): permisiuni corecte, coerență rută ↔ navigație, accesibilitate WCAG AA, responsive mobil și igienă cod. Acest plan adresează item-ul rămas din secțiunea „Ce NU intră în scop":

> - Secțiuni colapsabile, căutare în meniu, favorite, reordonare de către utilizator.

Scopul e să transformăm sidebar-ul dintr-un meniu static într-un instrument de navigare personalizabil, fără să compromitem performanța, accesibilitatea sau securitatea permisiunilor.

---

## 2. Scope — ce intră și ce NU intră

### În scope

| # | Funcționalitate | Descriere |
|---|---|---|
| 2.1 | **Căutare în meniu** | Filtru live după label și/sau secțiune; client-side; respectă permisiunile. |
| 2.2 | **Secțiuni colapsabile** | Fiecare secțiune (Principal, Financiar, Administrare, Nomenclatoare) poate fi extinsă/restrânsă; stare persistată. |
| 2.3 | **Favorite în meniu** | Utilizatorul poate marca/demarca item-uri de meniu ca favorite; lista de favorite apare sus în sidebar; stare persistată în BD. |
| 2.4 | **Reordonare** | Utilizatorul poate reordona favoritele prin drag-and-drop; ordinea se persistă în BD. |

### Out of scope (pentru acest plan)

- Reordonarea întregului meniu (non-favorite) — prea multă complexitate, puțin beneficiu.
- Secțiuni custom create de utilizator.
- Reordonarea secțiunilor în sine.
- Sincronizare real-time a preferințelor între taburi/dispozitive (se reîncarcă la login/refresh).
- Remodelarea modulului `users` (B4 din PLAN_SIDEBAR.md) — plan separat.

---

## 3. Decizii de luat — cu recomandări

### 3.1 Persistența favoritelor și a ordinii

| Opțiune | Avantaje | Dezavantaje |
|---|---|---|
| **A. localStorage/sessionStorage** | Rapid, fără backend, merge offline | Se pierde la alt dispozitiv/browser, nu se sincronizează cu clinică |
| **B. Bază de date (recomandată)** | Experiență consistentă pe orice dispozitiv, backup implicit, auditabil | Necesită migrare, SP-uri, API, teste |

**Recomandare: B** — un CMS medical e folosit pe mai multe stații în clinică; utilizatorul trebuie să-și găsească meniul personalizat indiferent unde se loghează.

### 3.2 Starea secțiunilor colapsabile

| Opțiune | Avantaje | Dezavantaje |
|---|---|---|
| **A. localStorage per utilizator** | Simplu, instant | Se pierde pe alt browser |
| **B. BD (alături de favorite)** | Consistent | Overhead pentru o preferință minoră |

**Recomandare: A** pentru colapsabilitate — e o preferință de UI pură, acceptabilă în localStorage. Dacă vrem uniformitate totală, putem migra-o ulterior în același tabel cu favoritele.

### 3.3 Bibliotecă drag-and-drop

| Opțiune | Avantaje | Dezavantaje |
|---|---|---|
| **@dnd-kit** | Standard React, TS-first, accesibil, sortable built-in | +3 pachete npm (~50KB gzip) |
| **HTML5 native** | Fără deps | Verbozitate, accesibilitate proastă, touch problematic |
| **SortableJS** | Mic, matur | React wrapper neoficial, TS parțial |

**Recomandare: @dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).

### 3.4 Unde apare secțiunea „Favorite"

| Opțiune | Avantaje | Dezavantaje |
|---|---|---|
| **A. Secțiune nouă „Favorite" la începutul sidebar-ului** | Vizibilă imediat, pattern uzual | Poate deveni goală pentru useri noi |
| **B. Itemi favoritați primesc un pin/star în locul lor original** | Menține contextul secțiunii | Nu reduce scroll-ul |

**Recomandare: A** — o secțiune „Favorite" fixă la top, care se ascunde automat dacă e goală.

---

## 4. Arhitectură propusă

### 4.1 Fluxul de date

```
[BD: UserMenuPreferences]
       ↑↓
[API: UserMenuPreferencesController]
       ↑↓
[Frontend: userMenuPreferences.api.ts]
       ↓
[uiStore / TanStack Query]
       ↓
[Sidebar.tsx]
```

### 4.2 Model de date

#### Backend — tabel nou (coloane dedicate)

```sql
CREATE TABLE dbo.UserMenuPreferences (
    UserId         UNIQUEIDENTIFIER NOT NULL,
    ClinicId       UNIQUEIDENTIFIER NOT NULL,
    FavoriteRoutes NVARCHAR(MAX)    NULL,   -- JSON: ["/patients", "/consultations"]
    SectionOrder   NVARCHAR(MAX)    NULL,   -- JSON: ["Favorite", "Principal", ...]
    UpdatedAt      DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy      UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT PK_UserMenuPreferences PRIMARY KEY (UserId),
    CONSTRAINT FK_UserMenuPreferences_Users   FOREIGN KEY (UserId)   REFERENCES dbo.Users(Id),
    CONSTRAINT FK_UserMenuPreferences_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
);

CREATE NONCLUSTERED INDEX IX_UserMenuPreferences_ClinicId
    ON dbo.UserMenuPreferences (ClinicId)
    INCLUDE (UserId);
```

**De ce coloane dedicate?** Preferințele sidebar-ului sunt un set fix și mic (`FavoriteRoutes`, `SectionOrder`). O schemă relațională explicită e mai simplu de indexat, validat și interogat decât EAV. Dacă apar preferințe noi (de ex. `DashboardLayout`), se adaugă o nouă coloană prin migrare — acceptabil pentru un domeniu stabil.

**Starea colapsabilității** rămâne în `localStorage` conform deciziei §3.2; nu are coloană dedicată în acest tabel.

### 4.3 Preferințe persistate

| Proprietate | Surse | Exemplu |
|---|---|---|
| `favoriteRoutes` | Coloană `FavoriteRoutes` în BD | `["/patients", "/consultations"]` |
| `sectionOrder` | Coloană `SectionOrder` în BD | `["Favorite", "Principal", "Administrare", "Nomenclatoare", "Financiar"]` |
| `expandedSections` | `localStorage` (`vc-sidebar-sections`) | `Set(["Principal", "Financiar"])` |
| `menuSearchQuery` | Stare locală în `uiStore`, nepersistată | `"pac"` |

### 4.4 Frontend — state split

```typescript
// uiStore.ts — preferințe locale + acțiuni
interface UiState {
  sidebarCollapsed: boolean;           // existent — persistat localStorage
  menuSearchQuery: string;             // NOU — local, nepersistat
  expandedSections: Set<string>;       // NOU — persistat localStorage
  favoriteRoutes: string[];            // NOU — provenit din API, persistat în BD
  sectionOrder: string[];              // NOU — provenit din API, persistat în BD
  // actions
  setMenuSearchQuery: (q: string) => void;
  toggleSection: (section: string) => void;
  addFavorite: (route: string) => void;
  removeFavorite: (route: string) => void;
  reorderFavorites: (routes: string[]) => void;
  setSectionOrder: (order: string[]) => void;
  setMenuPreferences: (prefs: { favoriteRoutes: string[]; sectionOrder: string[] }) => void;
}
```

`favoriteRoutes` și `sectionOrder` se încarcă la bootstrap și se sincronizează cu BD prin mutații. `expandedSections` și `menuSearchQuery` rămân locale.

---

## 5. Plan pe etape

Fiecare etapă = un commit independent, testabil.

### Etapa 1 — Căutare în meniu (client-side only) ✅ **finalizată**

**Fișiere modificate:**
- `client/src/store/uiStore.ts` — adaugă `menuSearchQuery`.
- `client/src/components/layout/Sidebar.tsx` — input de căutare + filtru.
- `client/src/components/layout/Sidebar.module.scss` — stiluri input.
- `client/src/__tests__/components/layout/Sidebar.test.tsx` — teste filtru.

**Comportament:**
- Input plasat sub `.brandArea`, deasupra `<nav>`.
- Placeholder: „Caută în meniu..."
- Clear button (X) când are conținut.
- Filtrare case-insensitive pe `item.label` și `section`.
- Secțiunile rămase fără item-uri se ascund.
- La Escape se șterge query-ul (dacă inputul are focus).
- Nu trimite request către server.

**Acceptare:**
- `npm run lint` curat.
- Teste: filtrare după label, filtrare după secțiune, secțiuni goale ascunse, clear.
- Build reușit.

**Implementat:** input cu iconițe `Search`/`X` din `lucide-react`; filtrare
`useMemo` combinată cu permisiunile existente (`ROUTE_MODULES`/`canRead`);
`menuSearchQuery` stocat în `uiStore` (nepersistat); input ascuns când sidebar-ul
e colapsat. 7 teste noi adăugate — total 20 teste în `Sidebar.test.tsx`, 327 teste
în suită.

**Estimare:** 3–4 ore.

---

### Etapa 2 — Secțiuni colapsabile

**Fișiere modificate:**
- `client/src/store/uiStore.ts` — adaugă `expandedSections`, `toggleSection`, persist localStorage.
- `client/src/components/layout/Sidebar.tsx` — header de secțiune clickabil, animație expand/collapse.
- `client/src/components/layout/Sidebar.module.scss` — stiluri `.sectionHeader`, `.sectionChevron`, `.itemsWrapper`.
- `client/src/__tests__/components/layout/Sidebar.test.tsx` — teste toggle.

**Comportament:**
- Click pe titlul secțiunii (săgeată + text) extinde/restrânge.
- Default: toate extinse.
- Stare persistată în `localStorage` sub cheie `vc-sidebar-sections`.
- Secțiunea „Favorite" (etapa 3) nu e colapsabilă — e mereu vizibilă dacă are itemi.
- ARIA: `aria-expanded` pe buton, `aria-controls` către lista de itemi.

**Acceptare:**
- Toggle funcționează la click.
- Starea supraviețuiește reload-ului.
- Screen reader anunță corect starea.
- Build + teste trec.

**Estimare:** 4–5 ore.

---

### Etapa 3 — Favorite persistente

**Backend — fișiere noi/modificate:**
1. Migrare SQL: `src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0050_CreateUserMenuPreferences.sql`
2. SP-uri:
   - `UserMenuPreference_GetByUser.sql`
   - `UserMenuPreference_Upsert.sql`
3. Repository:
   - `IUserMenuPreferenceRepository.cs` (Application)
   - `UserMenuPreferenceRepository.cs` (Infrastructure)
4. Features MediatR:
   - `GetUserMenuPreferencesQuery`
   - `UpsertUserMenuPreferencesCommand`
5. Controller:
   - `UserMenuPreferencesController.cs`
6. DI registration în `DependencyInjection.cs`
7. Constante SP în `StoredProcedures/UserMenuPreferenceProcedures.cs`

**Frontend — fișiere modificate:**
- `client/src/api/endpoints/userMenuPreferences.api.ts` (nou)
- `client/src/store/uiStore.ts` — adaugă `favoriteRoutes`, acțiuni.
- `client/src/components/layout/Sidebar.tsx` — secțiune „Favorite", buton star per item.
- `client/src/components/layout/Sidebar.module.scss` — stiluri `.favoriteSection`, `.starBtn`.
- `client/src/__tests__/components/layout/Sidebar.test.tsx` — teste favorite.

**Comportament:**
- Fiecare item de meniu are un buton stea (vizibil la hover sau mereu pentru favorite).
- Click pe stea: toggle favorite.
- Secțiunea „Favorite" apare prima în sidebar și conține doar itemi permise și marcați.
- Dacă user-ul îndepărtează permisiunea pentru un modul, ruta favorită dispare automat (filtrare permisiuni).
- Sincronizare cu BD: la toggle se apelează `UpsertUserMenuPreferences` pentru cheia `favoriteRoutes`.
- Optimistic update în UI.

**Acceptare:**
- BD: migrare rulează cu `migrate.ps1`.
- API: GET/POST funcționează, filtrează după `ClinicId`.
- Frontend: favoritele apar, toggle funcționează, persistă după logout/login.
- Teste BE handler + validator; FE unit tests; E2E pentru toggle.

**Estimare:** 10–12 ore.

---

### Etapa 4 — Reordonarea favoritelor

**Backend:**
- Reutilizează `UpsertUserMenuPreferencesCommand` cu cheia `favoriteRoutes` — ordinea din array e ordinea de afișare.

**Frontend:**
- Instalează `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Creează componentă `SortableFavoriteItem`.
- Integrează `DndContext` + `SortableContext` în secțiunea „Favorite".
- La `onDragEnd`, actualizează ordinea local și sincronizează cu API.

**Accesibilitate:**
- Buton cu `aria-label="Reordonează favorite"`.
- Suport tastatură (space/enter pentru pick, săgeți pentru mutare).

**Acceptare:**
- Drag-and-drop funcționează cu mouse.
- Reordonare funcționează cu tastatura.
- Ordinea persistă după reload.
- Teste E2E cu Playwright.

**Estimare:** 8–10 ore.

---

## 6. Contract API

### GET /api/v1/UserMenuPreferences

```json
{
  "data": {
    "favoriteRoutes": ["/patients", "/consultations"],
    "sectionOrder": ["Favorite", "Principal", "Administrare", "Nomenclatoare", "Financiar"],
    "collapsedSections": ["Nomenclatoare"]
  },
  "success": true,
  "message": null,
  "errors": null
}
```

### POST /api/v1/UserMenuPreferences

Body:

```json
{
  "favoriteRoutes": ["/patients", "/consultations"],
  "sectionOrder": ["Favorite", "Principal", "Administrare", "Nomenclatoare", "Financiar"],
  "collapsedSections": ["Nomenclatoare"]
}
```

Response: `200 OK` cu obiectul salvat.

**Notă:** Preferințele se salvează atomic per utilizator — se șterg vechile chei și se inserează noile. Acest lucru simplifică logica, dar poate produce race condition între două taburi. Pentru MVP acceptăm „last write wins".

---

## 7. Schema detaliată SQL

### Migrare 0050_CreateUserMenuPreferences.sql

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE TABLE dbo.UserMenuPreferences (
    UserId         UNIQUEIDENTIFIER NOT NULL,
    ClinicId       UNIQUEIDENTIFIER NOT NULL,
    FavoriteRoutes NVARCHAR(MAX)    NULL,
    SectionOrder   NVARCHAR(MAX)    NULL,
    UpdatedAt      DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy      UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT PK_UserMenuPreferences PRIMARY KEY (UserId),
    CONSTRAINT FK_UserMenuPreferences_Users   FOREIGN KEY (UserId)   REFERENCES dbo.Users(Id),
    CONSTRAINT FK_UserMenuPreferences_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
);

CREATE NONCLUSTERED INDEX IX_UserMenuPreferences_ClinicId
    ON dbo.UserMenuPreferences (ClinicId)
    INCLUDE (UserId);
GO
```

### SP UserMenuPreference_GetByUser.sql

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_GetByUser
    @UserId   UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FavoriteRoutes, SectionOrder
    FROM dbo.UserMenuPreferences
    WHERE UserId = @UserId
      AND ClinicId = @ClinicId;
END;
GO
```

### SP UserMenuPreference_Upsert.sql

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_Upsert
    @UserId         UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @FavoriteRoutes NVARCHAR(MAX) = NULL,
    @SectionOrder   NVARCHAR(MAX) = NULL,
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM dbo.UserMenuPreferences
            WHERE UserId = @UserId
              AND ClinicId = @ClinicId
        )
        BEGIN
            UPDATE dbo.UserMenuPreferences
            SET FavoriteRoutes = @FavoriteRoutes,
                SectionOrder   = @SectionOrder,
                UpdatedAt      = SYSDATETIME(),
                UpdatedBy      = @UpdatedBy
            WHERE UserId = @UserId
              AND ClinicId = @ClinicId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.UserMenuPreferences
                (UserId, ClinicId, FavoriteRoutes, SectionOrder, UpdatedBy)
            VALUES
                (@UserId, @ClinicId, @FavoriteRoutes, @SectionOrder, @UpdatedBy);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
```

---

## 8. Structură fișiere noi

```
src/ValyanClinic.Application/
├── Common/
│   ├── Interfaces/
│   │   └── IUserMenuPreferenceRepository.cs
│   └── Models/
│       └── UserMenuPreferencesDto.cs
└── Features/
    └── UserMenuPreferences/
        ├── Queries/
        │   └── GetUserMenuPreferences/
        │       ├── GetUserMenuPreferencesQuery.cs
        │       └── GetUserMenuPreferencesQueryHandler.cs
        └── Commands/
            └── UpsertUserMenuPreferences/
                ├── UpsertUserMenuPreferencesCommand.cs
                ├── UpsertUserMenuPreferencesCommandHandler.cs
                └── UpsertUserMenuPreferencesCommandValidator.cs

src/ValyanClinic.Infrastructure/
├── Data/
│   ├── Repositories/
│   │   └── UserMenuPreferenceRepository.cs
│   └── StoredProcedures/
│       └── UserMenuPreferenceProcedures.cs
└── DependencyInjection.cs

src/ValyanClinic.API/
└── Controllers/
    └── UserMenuPreferencesController.cs

src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/
└── 0050_CreateUserMenuPreferences.sql

src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/
├── UserMenuPreference_GetByUser.sql
└── UserMenuPreference_Upsert.sql

client/src/
├── api/endpoints/
│   └── userMenuPreferences.api.ts
├── features/sidebar/
│   ├── types/
│   │   └── sidebar.types.ts
│   └── components/
│       ├── MenuSearchInput.tsx
│       ├── FavoriteSection.tsx
│       └── SortableFavoriteItem.tsx
└── __tests__/components/layout/
    └── SidebarEnhancements.test.tsx
```

---

## 9. Teste

### Backend

| Fișier | Ce testează |
|---|---|
| `tests/ValyanClinic.Tests/Handlers/GetUserMenuPreferencesQueryHandlerTests.cs` | Returnează preferințele userului curent, filtrate pe clinică. |
| `tests/ValyanClinic.Tests/Handlers/UpsertUserMenuPreferencesCommandHandlerTests.cs` | Insert vs update, validare JSON, multi-tenancy. |
| `tests/ValyanClinic.Tests/Validators/UpsertUserMenuPreferencesCommandValidatorTests.cs` | Chei permise, JSON valid, clinică prezentă. |

### Frontend

| Fișier | Ce testează |
|---|---|
| `client/src/__tests__/components/layout/Sidebar.test.tsx` (extins) | Search filtrează, toggle secțiuni, favorite apar/dispar. |
| `client/src/__tests__/store/uiStore.test.ts` (extins) | Persistare expandedSections, acțiuni favorite. |
| `client/src/__tests__/features/sidebar/SortableFavoriteItem.test.tsx` | Render sortabil, buton reordonează. |

### E2E

| Spec | Ce testează |
|---|---|
| `e2e/specs/sidebar/favorites.spec.ts` | Marchează favorite, verifică secțiune, reîncarcă pagina, confirmă persistența. |
| `e2e/specs/sidebar/reorder.spec.ts` | Drag-and-drop între favorite, refresh, verifică ordinea. |

---

## 10. Riscuri și mitigări

| Risc | Probabilitate | Impact | Mitigare |
|---|---|---|---|
| `@dnd-kit` crește bundle size | Medie | Mediu | Măsurăm în build; dacă e prea mare, evaluăm native DnD. |
| Race condition la salvare preferințe (last write wins) | Medie | Mic | Acceptăm pentru MVP; pe viitor adăugăm `version` / ETag. |
| Favorită pentru rută la care userul își pierde accesul | Mică | Mediu | Filtrarea `canRead()` se aplică întotdeauna înainte de render. |
| A11y drag-and-drop cu tastatura | Medie | Mediu | Testăm cu `@dnd-kit` sensors și documentăm scurtcuturile. |
| Colapsabilitate în localStorage nu se sincronizează între dispozitive | Mare | Mic | Documentăm că e preferință locală; pe viitor migrăm în BD. |
| Coloane JSON invalid în BD | Mică | Mediu | Validare în Command + teste; SP nu parsează JSON, doar îl stochează. |

---

## 11. Timeline estimativ

| Etapă | Dev | Teste | Review |
|---|---|---|---|
| 1. Search | 3h | 1h | 0.5h |
| 2. Secțiuni colapsabile | 4h | 1.5h | 0.5h |
| 3. Favorite (BE + FE) | 10h | 3h | 1h |
| 4. Reordonare DnD | 8h | 2.5h | 1h |
| **Total** | **25h** | **8h** | **3h** |

---

## 12. Criterii de acceptare finale

- [ ] Toate cele 4 funcționalități funcționează pe desktop, tabletă și mobil.
- [ ] Favoritele și ordinea se persistă după logout/login pe alt browser.
- [ ] Secțiunile colapsabile și search-ul rămân funcționale după reload.
- [ ] Permisiunile rămân corect filtrate în toate stările (search, favorite, reordonare).
- [ ] Accesibilitate: screen reader, tastatură, focus vizibil.
- [ ] `npm run lint`, `npm run test:unit`, `npm run build`, `npm run check:api` trec.
- [ ] Backend: `dotnet build` și `dotnet test` trec.
- [ ] Migrarea `0050` se aplică cu `migrate.ps1`.
- [ ] Documentația `CLAUDE.md` e actualizată cu noile pattern-uri.

---

## 13. Întrebări pentru review

1. **Persistență:** BD pentru favorite/ordine; localStorage pentru colapsabilitate — ✅ aprobat.
2. **EAV vs. coloane dedicate:** **Coloane dedicate** — ✅ aprobat.
3. **@dnd-kit:** OK să adăugăm cele 3 pachete pentru drag-and-drop?
4. **Scope reordonare:** Doar favoritele, nu întreg meniul — corect?
5. **Secțiunea „Favorite":** La început, ascunsă când e goală — OK?
6. **Ordinea etapelor:** Vreți să facem etapele 1+2 împreună (client-only) înainte de a atinge backendul?
7. **Timeline:** 25h dev + 8h teste + 3h review este realist pentru sprintul curent?

**Răspunsuri așteptate înainte de start:** 3, 4, 5, 6, 7.
