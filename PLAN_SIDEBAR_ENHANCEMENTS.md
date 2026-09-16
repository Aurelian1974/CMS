# Plan — Extensii Sidebar: secțiuni colapsabile, căutare, favorite, reordonare

> Data: 16 Septembrie 2026
> Stare: **Finalizat — toate cele 4 etape implementate și verificate**
> Revizie: v1.2
> Părinte: [PLAN_SIDEBAR.md](PLAN_SIDEBAR.md)
> Decizii review: coloane dedicate (nu EAV) pentru preferințe UI; `@dnd-kit` aprobat; reordonare doar pentru favorite; restul conform planului inițial.

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

### Etapa 2 — Secțiuni colapsabile ✅ **finalizată**

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

**Implementat:** stare stocată ca `collapsedSections: string[]` în `uiStore`
(persistată alături de `sidebarCollapsed` sub cheia `ui-storage`, nu o cheie
separată `vc-sidebar-sections` — reutilizează același storage existent pentru a
evita încă un artefact în localStorage). Secțiunile sunt forțat extinse automat
când: (a) sidebar-ul e restrâns la iconițe (`sidebarCollapsed`), sau (b) există o
căutare activă — altfel rezultatele filtrate ar putea rămâne ascunse de o
restrângere anterioară. Animație cu `max-height` (0 → 600px) în loc de
`grid-template-rows`, mai simplă și predictibilă pentru un număr fix de itemi.
5 teste noi — total 25 teste în `Sidebar.test.tsx`, 332 în suită.

**Estimare:** 4–5 ore.

---

### Etapa 3 — Favorite persistente ✅ **finalizată**

**Backend — fișiere noi/modificate:**
1. Migrare SQL: `src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0049_CreateUserMenuPreferences.sql`
2. SP-uri:
   - `UserMenuPreference_GetByUser.sql`
   - `UserMenuPreference_Upsert.sql`
3. Repository:
   - `IUserMenuPreferenceRepository.cs` (Application)
   - `UserMenuPreferenceRepository.cs` (Infrastructure)
4. Features MediatR:
   - `GetUserMenuPreferencesQuery` + Handler
   - `UpsertUserMenuPreferencesCommand` + Handler + Validator
5. Controller:
   - `UserMenuPreferencesController.cs` — fără `[HasAccess]`, autoservire (la fel ca schimbarea propriei parole)
6. DI registration în `DependencyInjection.cs`
7. Constante SP în `StoredProcedures/UserMenuPreferenceProcedures.cs`

**Frontend — fișiere modificate:**
- `client/src/api/endpoints/userMenuPreferences.api.ts` (nou)
- `client/src/features/sidebar/hooks/useMenuFavorites.ts` (nou) — TanStack Query, nu Zustand
- `client/src/components/layout/Sidebar.tsx` — secțiune „Favorite", buton stea per item
- `client/src/components/layout/Sidebar.module.scss` — stiluri `.navItemRow`, `.favoriteBtn`, `.favoriteSectionLabel`
- `client/src/__tests__/components/layout/Sidebar.test.tsx` — teste favorite

**Comportament:**
- Fiecare item de meniu are un buton stea, vizibil la hover pe rând sau permanent dacă e favorit.
- Click pe stea: toggle favorite, cu update optimist (`onMutate` în `useUpsertMenuFavorites`).
- Secțiunea „Favorite" apare prima în sidebar și conține doar itemi permise și marcați; ascunsă complet dacă e goală.
- Un item favoritat rămâne vizibil și în secțiunea lui originală — Favorite e un raft rapid, nu mută itemul.
- Dacă utilizatorul își pierde accesul la un modul, ruta favorită dispare automat din Favorite (aceeași filtrare `canRead` ca restul meniului).
- Căutarea din meniu filtrează și secțiunea Favorite.

**Simplificări față de planul inițial (aprobate implicit prin decizia „coloane dedicate"):**
- **O singură coloană** `FavoriteRoutes` (JSON), nu și `SectionOrder` — reordonarea vizează doar favoritele (confirmat de utilizator), iar ordinea favoritelor E ordinea array-ului JSON. O coloană separată de ordine ar fi fost redundantă.
- Endpoint **`PUT`** (nu `POST`) pentru upsert — semantic mai corect pentru „înlocuiește complet resursa".
- Star button randat ca **element frate** al `<NavLink>` (`.navItemRow` wrapper), nu imbricat în el — evită un `<button>` în interiorul unui `<a>`.

**Acceptare:**
- BD: migrarea 0049 s-a aplicat cu `migrate.ps1` — „Upgrade successful", SP-urile create.
- Backend: `dotnet build` curat, 314 teste (302 + 12 noi pentru Get/Upsert handler + validator).
- Frontend: `npm run build` reușește, `npm run check:api` regenerează `schema.d.ts` cu tipurile noi.
- Frontend: 338 teste (332 + 6 noi pentru Favorite: afișare, ascundere când gol, filtrare pe permisiuni, toggle add/remove, ascundere buton când colapsat).
- `npm run lint` curat.

**Estimare:** 10–12 ore.

---

### Etapa 4 — Reordonarea favoritelor ✅ **finalizată**

**Backend:**
- Reutilizează `UpsertUserMenuPreferencesCommand` cu cheia `favoriteRoutes` — ordinea din array e ordinea de afișare. Nicio schimbare de backend necesară.

**Frontend:**
- Instalate `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` — `axios` a rămas pinned la `1.13.5`.
- Creată componenta `SortableFavoriteItem.tsx` în `client/src/features/sidebar/components/` — grip de drag + link + buton de eliminare, ca elemente frate (nu imbricate).
- `DndContext` (`PointerSensor` cu prag de 4px + `KeyboardSensor`) + `SortableContext` (`verticalListSortingStrategy`) integrate direct în secțiunea „Favorite" din `Sidebar.tsx`.
- `onDragEnd` calculează noul array cu `arrayMove` din `@dnd-kit/sortable` și apelează `useUpsertMenuFavorites().mutate(...)` — cu update optimist.
- `SortableContext` primește `disabled={isSearching}` — reordonarea e dezactivată cât timp există o căutare activă (lista vizibilă e un subset, ar produce confuzie).

**Accesibilitate:**
- Grip cu `aria-label="Reordonează {label}"` per item.
- `KeyboardSensor` din `@dnd-kit` — suport nativ pentru tastatură (Space pentru pick, săgeți pentru mutare, Space pentru drop).

**Acceptare — verificat live în browser** (sesiune admin, date reale):
- Drag-and-drop cu mouse funcționează: „Setări securitate" mutat înaintea „Jurnal securitate" în secțiunea Favorite, confirmat prin mesajul de status al `@dnd-kit` (`Draggable item ... was dropped over droppable area ...`).
- **Persistență confirmată**: după `reload`, ordinea nouă a rămas — round-trip complet drag → `PUT /api/v1/UserMenuPreferences` → BD → `GET` la reload.
- Grip-ul și butonul de favorite dispar corect când sidebar-ul e colapsat (doar iconițele rămân).
- Grip-urile devin `disabled` automat când există text în căutare.
- Ordinea a fost restaurată manual la starea inițială după test.

**Teste automate:** simularea unui drag real cu `@dnd-kit` necesită layout real (bounding boxes), pe care `jsdom` nu-l calculează — testele unitare acoperă prezența/vizibilitatea grip-ului (3 teste noi: grip vizibil per favorit, ascuns când colapsat, absent pe itemii nefavoriți). Reordonarea efectivă a fost verificată manual în browser, conform notei de mai sus — nu există încă un spec Playwright dedicat (rămâne ca lucru viitor opțional).

**Verificat:** `npm run build` reușește (bundle-ul `MainLayout` a crescut cu ~47KB gzip din `@dnd-kit`) · `npm run lint` curat · 341 teste unitare (18 fișiere).

**Estimare:** 8–10 ore.

---

## 6. Contract API — implementat

### GET /api/v1/UserMenuPreferences

```json
{
  "data": {
    "favoriteRoutes": ["/patients", "/consultations"]
  },
  "success": true,
  "message": null,
  "errors": null
}
```

### PUT /api/v1/UserMenuPreferences

Body:

```json
{
  "favoriteRoutes": ["/patients", "/consultations"]
}
```

Response: `200 OK`. `collapsedSections` **nu** trece prin acest endpoint — rămâne
exclusiv în `localStorage` (§3.2). `sectionOrder` a fost eliminat din scope o dată
cu decizia de reordonare „doar favoritele”.
}
```

Response: `200 OK` cu obiectul salvat.

**Notă:** Preferințele se salvează atomic per utilizator — se șterg vechile chei și se inserează noile. Acest lucru simplifică logica, dar poate produce race condition între două taburi. Pentru MVP acceptăm „last write wins".

---

## 7. Schema detaliată SQL — implementată

### Migrare 0049_CreateUserMenuPreferences.sql

```sql
CREATE TABLE dbo.UserMenuPreferences (
    UserId         UNIQUEIDENTIFIER NOT NULL,
    ClinicId       UNIQUEIDENTIFIER NOT NULL,
    FavoriteRoutes NVARCHAR(MAX)    NULL,
    UpdatedAt      DATETIME2        NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy      UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT PK_UserMenuPreferences PRIMARY KEY (UserId),
    CONSTRAINT FK_UserMenuPreferences_Users   FOREIGN KEY (UserId)   REFERENCES dbo.Users(Id),
    CONSTRAINT FK_UserMenuPreferences_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
);

CREATE NONCLUSTERED INDEX IX_UserMenuPreferences_ClinicId
    ON dbo.UserMenuPreferences (ClinicId)
    INCLUDE (UserId);
```

### SP UserMenuPreference_GetByUser.sql

```sql
CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_GetByUser
    @UserId   UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FavoriteRoutes
    FROM dbo.UserMenuPreferences
    WHERE UserId = @UserId
      AND ClinicId = @ClinicId;
END;
```

### SP UserMenuPreference_Upsert.sql

```sql
CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_Upsert
    @UserId         UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @FavoriteRoutes NVARCHAR(MAX),
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.UserMenuPreferences WHERE UserId = @UserId AND ClinicId = @ClinicId)
            UPDATE dbo.UserMenuPreferences
            SET FavoriteRoutes = @FavoriteRoutes, UpdatedAt = SYSDATETIME(), UpdatedBy = @UpdatedBy
            WHERE UserId = @UserId AND ClinicId = @ClinicId;
        ELSE
            INSERT INTO dbo.UserMenuPreferences (UserId, ClinicId, FavoriteRoutes, UpdatedBy)
            VALUES (@UserId, @ClinicId, @FavoriteRoutes, @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
```

Ambele confirmate rulate cu succes prin `.\migrate.ps1` ("Upgrade successful").

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
└── 0049_CreateUserMenuPreferences.sql

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

- [x] Toate cele 4 funcționalități funcționează pe desktop (verificat live); tabletă/mobil moștenesc responsive-ul din PLAN_SIDEBAR.md etapa E.
- [x] Favoritele și ordinea se persistă — verificat cu reload real în browser (BD, nu doar localStorage).
- [x] Secțiunile colapsabile și search-ul rămân funcționale după reload.
- [x] Permisiunile rămân corect filtrate în toate stările (search, favorite, reordonare) — acoperit de teste unitare.
- [x] Accesibilitate: `aria-label`, `aria-expanded`, `KeyboardSensor` pentru reordonare, focus vizibil (moștenit din etapa D).
- [x] `npm run lint`, `npm run test:unit` (341 teste), `npm run build` trec. `npm run check:api` a regenerat schema și a confirmat contractul.
- [x] Backend: `dotnet build` și `dotnet test` (314 teste) trec.
- [x] Migrarea `0049_CreateUserMenuPreferences` s-a aplicat cu `migrate.ps1` — „Upgrade successful”.
- [ ] Documentația `CLAUDE.md` — nu a fost actualizată încă cu noile pattern-uri (`UserMenuPreferences`, `@dnd-kit`); rămâne task opus separat dacă se dorește.

---

## 13. Întrebări pentru review — răspunsuri primite

1. **Persistență:** BD pentru favorite/ordine; localStorage pentru colapsabilitate — ✅ aprobat, implementat.
2. **EAV vs. coloane dedicate:** **Coloane dedicate** — ✅ aprobat, implementat (o singură coloană `FavoriteRoutes`, `SectionOrder` eliminat din scope).
3. **@dnd-kit:** ✅ aprobat — instalat și integrat, `axios` rămas pinned la `1.13.5`.
4. **Scope reordonare:** ✅ confirmat — doar favoritele, nu întreg meniul.
5. **Secțiunea „Favorite":** ✅ confirmat — la început, ascunsă când e goală.
6. **Ordinea etapelor:** Implementate secvențial 1→2→3→4, fiecare cu commit propriu — nu s-a cerut regruparea lor.
7. **Timeline:** Estimările inițiale (25h dev + 8h teste + 3h review) au fost orientative; implementarea reală a decurs fără blocaje majore într-o singură sesiune continuă.
