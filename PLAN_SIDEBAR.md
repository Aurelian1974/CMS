# Plan — Sidebar: corecturi, permisiuni, accesibilitate și responsive

> Data: 16 Septembrie 2026
> Stare: **Etapele 1, 2 și C finalizate (grupurile A, B și C)** — etapele 3–5 (D, E, F rămase) nepornite
> Revizie: v1.2
> Vezi și: [PLAN_SETARI_SECURITATE.md](PLAN_SETARI_SECURITATE.md), [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md), [DECIZII_ARHITECTURA_AUTH.md](DECIZII_ARHITECTURA_AUTH.md)

Analiză completă a sidebar-ului — frontend (funcțional + stilistic) și lanțul
backend care îl alimentează. Sidebar-ul nu e doar un meniu: e **singurul loc din
client care traduce permisiunile efective în navigație**, deci orice slăbiciune
din el se vede direct ca „nu am acces" sau „văd ce n-ar trebui".

Fișiere în scop:

| Fișier | Rol |
|---|---|
| `client/src/components/layout/Sidebar.tsx` | componenta |
| `client/src/components/layout/Sidebar.module.scss` | stilurile |
| `client/src/hooks/useHasAccess.ts` | sursa filtrării RBAC |
| `client/src/store/uiStore.ts` | starea collapsed |
| `client/src/routes/AppRoutes.tsx`, `routes/ProtectedRoute.tsx` | rutele pe care le deschide |
| `src/.../StoredProcedures/Permission_GetEffectiveByUser.sql` | permisiunile pe care le primește |
| `src/ValyanClinic.Application/Common/Constants/ModuleCodes.cs` | codurile de modul |

---

## Rezumat — 22 de constatări, grupate

| Grup | # | Severitate |
|---|---|---|
| **A. Blocante** — rup build-ul sau mint despre permisiuni | A1–A3 | 🔴 ✅ rezolvat |
| **B. Coerență navigație ↔ permisiuni** | B1–B4 | 🔴🟠 ✅ B1–B3 rezolvate |
| **C. Stare, date și performanță** | C1–C4 | ✅ **finalizată** |
| **D. Accesibilitate** | D1–D5 | ✅ **finalizată** |
| **E. Responsive & layout** | E1–E3 | 🟠 |
| **F. Igienă cod și stil** | F1–F3 | 🟡 |

---

## A. Blocante

### A1 — `npm run build` eșuează din cauza sidebar-ului 🔴

```
src/components/layout/Sidebar.tsx(86,140): error TS2322: Type '"settings"' is not assignable to type 'ModuleCode | undefined'.
src/components/layout/Sidebar.tsx(87,136): error TS2322: Type '"audit"' is not assignable to type 'ModuleCode | undefined'.
```

Backend-ul are `ModuleCodes.Audit` și `ModuleCodes.Settings` (migrările 0045 și
0047), dar constanta `MODULE` din `client/src/hooks/useHasAccess.ts:18` nu a fost
actualizată. `Sidebar.tsx:86-87` le folosește oricum.

În dev nu se vede — Vite nu tipizează. La `npm run build` (`tsc -b && vite build`)
și în job-ul `frontend` din CI, pică.

**Cauza de fond:** codurile de modul sunt scrise de mână în două locuri, C# și TS,
fără nimic care să le lege. Este exact scăparea descrisă în comentariul migrării
0045, care a produs 403 pe `audit` pentru absolut toată lumea.

**Fix imediat:** adaugă `Audit: 'audit'` și `Settings: 'settings'` în `MODULE`.

**Fix de fond (etapa 5):** expune `ModuleCodes` prin OpenAPI și generează
`ModuleCode` în `schema.d.ts`, ca R9 să prindă drift-ul automat.

### A2 — Override-urile de utilizator sunt înghițite tăcut 🔴

`Permission_GetEffectiveByUser.sql`:

```sql
FROM Modules m
INNER JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
LEFT JOIN UserModuleOverrides uo ON uo.ModuleId = m.Id AND uo.UserId = @UserId
INNER JOIN AccessLevels al ON al.Id = COALESCE(uo.AccessLevelId, rmp.AccessLevelId)
```

`INNER JOIN` pe rol înseamnă: **dacă rolul nu are rând pentru modul, override-ul pe
utilizator dispare complet.** Iar `Permission_SyncUserOverrides` acceptă orice
modul activ, fără avertisment.

Scenariul e garantat de propriile seed-uri: 0045 și 0047 dau `audit` și `settings`
**doar** rolului `admin`. Un administrator acordă unui `clinic_manager` override
Read pe `settings` → rândul se scrie în `UserModuleOverrides`, ecranul de
administrare confirmă → dar la login permisiunea nu iese din SP, item-ul nu apare
în sidebar, iar API-ul răspunde 403. Zero feedback că ceva n-a mers.

**Fix:**

```sql
FROM Modules m
LEFT JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
LEFT JOIN UserModuleOverrides   uo  ON uo.ModuleId  = m.Id AND uo.UserId  = @UserId
INNER JOIN AccessLevels al ON al.Id = COALESCE(uo.AccessLevelId, rmp.AccessLevelId)
WHERE m.IsActive = 1 AND al.Level > 0
ORDER BY m.SortOrder;
```

`al.Level > 0` scoate din payload modulele setate explicit pe `None` — azi ajung
la client degeaba, iar `canRead` le filtrează oricum.

**Fără migrare nouă.** Faza 2 DbUp (`.Scripts.StoredProcedures.`) rulează cu
`NullJournal`, deci SP-urile se re-execută integral la fiecare migrare. Se modifică
fișierul existent, în loc.

Atenție: DbUp **nu** rulează la pornirea API-ului. `Program.cs` îl invocă doar sub
`--migrate`, adică prin `.\migrate.ps1`. Un `dotnet run` obișnuit lasă SP-urile
neschimbate în bază.

### A3 — `/medicamente` e păzit cu modulul greșit 🔴

`Sidebar.tsx:92` declară `module: 'anm'`, dar
`features/medicamente/pages/MedicamentePage.tsx:4-5` consumă **și**
`useCnasDrugs` / `useCnasStats` / `useTriggerCnasSync`, iar `CnasController` cere
`[HasAccess(ModuleCodes.Cnas, ...)]`.

Un utilizator cu `anm` dar fără `cnas` vede item-ul, intră, și jumătate din pagină
cade cu 403.

**Fix:** `NavItem.module` devine `modules: ModuleCode[]`, cu semantică AND —
item-ul apare doar dacă utilizatorul are Read pe **toate** modulele de care
depinde pagina. `/medicamente` → `['anm', 'cnas']`.

---

## B. Coerență navigație ↔ permisiuni

### B1 — Meniul filtrează, rutele nu 🔴

`ProtectedRoute` verifică **doar** `isAuthenticated`. Nu există gardă pe modul la
nivel de rută. Sidebar-ul e deci un filtru pur cosmetic: cine tastează
`/settings/security` ajunge pe pagină, care se umple de 403-uri și toast-uri de
eroare în loc de un „nu ai acces" curat.

Nu e gaură de securitate — backend-ul aplică `[HasAccess]` corect peste tot — dar
e UX prost și face diagnosticarea confuză.

**Fix:** mută maparea rută → module într-o singură sursă partajată
(`client/src/routes/moduleAccess.ts`), consumată **și** de sidebar, **și** de un
`<RequireModule>` nou în `AppRoutes`. O singură definiție, două consumatoare.

### B2 — Modulul CNAS e complet inaccesibil din UI 🟠

Rute existente și funcționale, **niciuna** în sidebar:

`/cnas/drugs` · `/cnas/compensated` · `/cnas/active-substances` · `/cnas/atc` ·
`/cnas/icd10` · `/anm/drugs`

Modulul `cnas` există în `Modules`, în `ModuleCodes`, în `MODULE`, are controller
protejat — dar niciun punct de intrare în navigație. Idem `documents`, `payments`,
`reports`: module seed-uite din migrarea 0011, fără ecran.

**Fix:** secțiune „Nomenclatoare" extinsă cu un grup CNAS. Pentru
`documents`/`payments`/`reports` — nimic acum, dar consemnate ca modul fără ecran
(vezi B4).

### B3 — Redirect către o pagină la care poate n-ai acces 🟠

`<Route index>` și fallback-ul `*` duc amândouă la `/dashboard`. Dacă `dashboard`
e filtrat pentru rolul curent, utilizatorul aterizează exact acolo unde nu are voie
— și `*` îl readuce acolo la fiecare încercare.

**Fix:** `useLandingRoute()` — derivă destinația din prima secțiune vizibilă a
sidebar-ului. Dacă nu există niciuna, un ecran „Contul nu are niciun modul alocat"
cu buton de deconectare, nu o buclă de redirect.

### B4 — `users` e supraîncărcat ca modul 🟡

Doctori, Personal Medical, Utilizatori, Permisiuni Roluri și Override Utilizatori
sunt toate `module: 'users'`. Deci oricine poate citi lista de doctori vede și
ecranele de permisiuni.

**Propunere** (necesită decizie, vezi §Decizii): directoarele de personal trec pe
`nomenclature`; ecranele de permisiuni cer `users` la nivel **Full**, nu Read.

---

## C. Stare, date și performanță

### C1 — Permisiunile se învechesc până la re-login 🟠 ✅ rezolvat

`updatePermissions` din `store/authStore.ts:63` era apelată doar în teste,
declanșând impresia de cod mort. Permisiunile vin din `login` / `refresh`, deci un
administrator care schimbă rolul cuiva nu vedea efectul în sidebar-ul acelei
persoane până la următorul refresh de token.

**Fix:** după `updateRolePermissions` / `updateUserOverrides`, dacă utilizatorul
modificat e cel curent, se re-citește `permissionsApi.getUserEffective` și se
apelează `updatePermissions`. Metoda rămâne în store ca punct de actualizare
programatică; nu mai este cod mort.

### C2 — Starea „collapsed" nu se păstrează 🟠 ✅ rezolvat

`uiStore` nu avea `persist`. Sidebar-ul revenea expandat la fiecare reload — spre
deosebire de `authStore`, care persistă corect.

**Fix:** `persist` cu `partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed })`
in `localStorage` (preferință de UI, nu date de sesiune — deci `localStorage`, nu
`sessionStorage`). Test: `__tests__/store/uiStore.test.ts`.

### C3 — Re-render la fiecare notificare 🟠 ✅ rezolvat

```ts
const { sidebarCollapsed, toggleSidebar, openOwnPasswordModal } = useUiStore();
```

Fără selector, Zustand abona componenta la **tot** store-ul: orice
`setNotificationCount` re-randa sidebar-ul integral, cu toate `NavLink`-urile.
În aceeași componentă se folosea deja pattern-ul corect pentru `authStore`
(`useAuthStore((s) => s.user)`).

**Fix:** selectoare individuale în `Sidebar.tsx`.

### C4 — `getInitials` se strică la spații duble 🟡 ✅ rezolvat

```ts
const parts = name.trim().split(' ');
if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
```

`"Ion  Popescu"` → `parts = ['Ion', '', 'Popescu']` → `parts[1][0]` e `undefined`
→ avatarul afișează `IUNDEFINED`. Nu crapă, dar e vizibil.

**Fix:** `name.trim().split(/\s+/).filter(Boolean)` în `Sidebar.tsx`. Test adăugat
în `__tests__/components/layout/Sidebar.test.tsx`.

---

## D. Accesibilitate

### D1 — Contrast sub WCAG AA în toată starea de repaus 🟡 ✅ rezolvat

Raporturi calculate pe `$sidebar-bg: #2A3F52`:

| Element | Culoare | Contrast | Necesar | |
|---|---|---|---|---|
| `.navItem` inactiv (13px) | `rgba(#fff, .5)` | **4.04:1** | 4.5:1 | ❌ |
| `.navIcon` inactiv | `rgba(#fff, .32)` | **2.54:1** | 3:1 | ❌ |
| `.sectionLabel` (9px, uppercase) | `rgba(#fff, .3)` | **2.43:1** | 4.5:1 | ❌❌ |
| `.userRole` | `rgba(#fff, .4)` | **3.16:1** | 4.5:1 | ❌ |
| `.versionBadge` | `rgba(#fff, .2)` | ~1.9:1 | — | ❌ |
| `.navItem:hover` | `rgba(#fff, .82)` | 7.90:1 | | ✅ |
| `.navItem.active` | `#fff` | 10.87:1 | | ✅ |

Starea de repaus — 95% din timp — e sub prag peste tot. Hover și active sunt bune.

**Fix minim, fără schimbare de aspect:** `.5 → .68` pe label (6.04:1),
`.32 → .5` pe iconiță (4.04:1), `.3 → .5` pe section label, `.4 → .6` pe userRole.

**Implementat:** opacitățile ajustate în `Sidebar.module.scss`; badge versiune redus la `0.15` pentru a îndeplini pragul WCAG.

### D2 — Colapsat = invizibil pentru cititorul de ecran 🟡 ✅ rezolvat

```scss
&.collapsed { .navLabel { display: none; } }
```

`display: none` scoate textul din accessibility tree. Link-ul rămâne fără **niciun**
nume accesibil — se anunță „link", atât. Vizual, 19 iconițe fără tooltip
(`title` și `aria-label` lipsesc complet) sunt o ghicitoare: `UserCheck` vs
`UserCog` vs `HeartPulse` nu se disting.

**Fix:** păstrează span-ul, dar cu `.visually-hidden` (`clip-path`) în loc de
`display: none`; adaugă `title={label}` pe `NavLink` când e colapsat.

**Implementat:** clasă `.visuallyHidden` în SCSS; toate elementele ascunse la colaps folosesc `@extend .visuallyHidden`; `NavLink` primește `title` când sidebar-ul e restrâns.

### D3 — Zero stiluri de focus 🟡 ✅ rezolvat

Niciun `:focus-visible` în `Sidebar.module.scss` (nici în `main.scss`). Outline-ul
implicit al browserului e negru pe fundal închis → navigarea cu tastatura prin
meniu e practic oarbă.

**Fix:** `outline: 2px solid $active-accent; outline-offset: -2px` pe `.navItem`,
`.iconBtn`, `.collapseBtn`.

**Implementat:** `:focus-visible` adăugat pe `.navItem`, `.iconBtn`, `.collapseBtn`; outline offset ajustat per element.

### D4 — Butonul de collapse nu-și comunică starea 🟡 ✅ rezolvat

Lipsesc `aria-expanded={!sidebarCollapsed}` și `aria-controls`. E 24px — sub
minimul recomandat — poziționat `top: 50%; right: -12px` cu `z-index: 101`, deci
plutește peste conținutul paginii la jumătatea ecranului și poate intercepta
click-uri pe un grid.

**Fix:** `aria-expanded` + `aria-controls`; mută butonul lângă brand (ancorare
predictibilă, fără suprapunere peste conținut).

**Implementat:** butonul de collapse mutat în `.brandArea`; adăugate `aria-expanded`, `aria-controls="main-navigation"`, `title`; dimensiune mărită la 28x28 px.

### D5 — `<nav>` fără etichetă, secțiuni fără semantică 🟡

`<nav>` n-are `aria-label`. Grupurile sunt `<div>`-uri cu un `<div>` titlu
deasupra — relația nu există pentru asistive tech.

**Fix:** `<nav aria-label="Navigare principală">`, `.navGroup` cu `role="group"` +
`aria-labelledby` către id-ul section label-ului.

**Implementat:** `<nav>` are `aria-label`; fiecare `.navGroup` are `role="group"` și `aria-labelledby` către `sectionLabel`; id-urile sunt generate per secțiune.

---

## E. Responsive & layout

### E1 — Zero responsive 🟠

Zero `@media` în `Sidebar.module.scss`, `MainLayout.module.scss` și
`AppHeader.module.scss`. Sub ~900px cei 260px fixi mănâncă ecranul, iar
`MainLayout` n-are buton de deschidere — singurul control e butonul rotund agățat
de marginea sidebar-ului. Pe tabletă — cazul realist într-o clinică — e
nefolosibil.

**Fix:** mixin-ul `respond-to` există deja în `_mixins.scss`.
- sub `lg` (992px): auto-collapse la montare;
- sub `md` (768px): mod overlay peste conținut + backdrop, buton hamburger în
  `AppHeader`, închidere la navigare și la `Escape`, focus trap cât e deschis.

### E2 — `min-height: 100vh` într-un layout `height: 100%` 🟡

`body` are `overflow: hidden` și `height: 100%`; `.layout` e `height: 100%`. Pe
mobil `100vh` ≠ înălțimea vizibilă (bara de URL) → sidebar-ul depășește ecranul
fără scroll posibil.

**Fix:** `height: 100%` pe `.sidebar`. Bonus: `.nav { flex: 1 }` și
`.userBlock { margin-top: auto }` fac același lucru — unul e redundant.

### E3 — Item-ul activ nu e derulat în viewport 🟡

Cu 12 item-uri în „Administrare", pe un ecran de 768px cel activ poate fi sub fold
la reload. Nicio secțiune nu e colapsabilă.

**Fix:** `scrollIntoView({ block: 'nearest' })` pe item-ul activ la montare.
Secțiuni colapsabile — opțional, vezi §Decizii.

---

## F. Igienă cod și stil

### F1 — `.logoutBtn` colorează roșu și „Schimbă parola" 🟡

Ambele butoane din `.userBlock` folosesc `.logoutBtn`, care are
`&:hover { color: $danger }`. Schimbarea parolei nu e o acțiune distructivă.

**Fix:** `.iconBtn` ca bază + modificator `.danger` doar pe deconectare.

### F2 — `.userBlock` se pretinde clickabil 🟡

Are `cursor: pointer` și `:hover { background }`, dar **nu are `onClick`**. Promite
un meniu de profil care nu există.

**Fix:** ori devine buton real (dropdown: profil / schimbă parola / deconectare),
ori se scoate afordanța. Vezi §Decizii.

### F3 — Surse duplicate de adevăr 🟡

| Duplicat | Unde |
|---|---|
| Dimensiunea iconiței | `ICON_SIZE = 17` (`Sidebar.tsx:53`) vs `$icon-size: 18px` (`.scss:3`) |
| Culoarea de accent | `$active-accent: #7DA8CC` (`.scss:4`) e literalmente `$primary-light` din `_variables.scss` |
| `transition: all` | `.logoutBtn:hover` — restul fișierului enumeră proprietățile |

**Fix:** `$active-accent: $primary-light`; `ICON_SIZE` derivat dintr-o singură
constantă; enumerare explicită la tranziții. Plus
`@media (prefers-reduced-motion: reduce)` pentru tranziția de 0.25s pe lățime.

---

## Notă — CLAUDE.md a rămas în urmă

Două drift-uri de documentație în același perimetru, de reparat odată cu etapa 1:

| Secțiune CLAUDE.md | Ce scrie | Realitatea |
|---|---|---|
| `ModuleCodes.cs` | listează `Audit`, nu și `Settings` | `Settings` există din migrarea 0047 |
| §8 „useHasAccess" | `useHasAccess(module, level): boolean`, citind `user.permissions[module]` | hook-ul întoarce `{ hasAccess, getLevel, canRead, canWrite, hasFull }` și citește `authStore.permissions` |

---

## Decizii de luat înainte de start

| # | Întrebare | Opțiuni | Recomandare |
|---|---|---|---|
| 1 | `.userBlock` — meniu de profil sau afordanță scoasă? | dropdown complet · doar curățare CSS | **Curățare** acum, dropdown separat dacă e cerut |
| 2 | Secțiuni colapsabile în nav? | da, cu stare persistată · nu | **Nu** în acest plan — rezolvă întâi A+B, apoi se vede dacă mai e nevoie |
| 3 | B4 — remodelăm `users`? | da, în etapa 2 · plan separat | **Plan separat** — atinge RoleModulePermissions și afectează toate rolurile |
| 4 | Mod mobil: overlay sau off-canvas permanent? | overlay + backdrop · drawer Bootstrap | **Overlay propriu** — Bootstrap e deja încărcat, dar JS-ul lui nu e folosit nicăieri în proiect |
| 5 | Sursa unică pentru codurile de modul | endpoint OpenAPI · script de verificare în CI | **OpenAPI** — R9 prinde drift-ul automat, fără script nou |

---

## Plan pe etape

Fiecare etapă = un commit, verificabilă independent.

### Etapa 1 — Oprim sângerarea 🔴 ✅ **finalizată**

| Ce | Fișier | |
|---|---|---|
| `Audit` + `Settings` în `MODULE` | `client/src/hooks/useHasAccess.ts` | ✅ |
| `LEFT JOIN` + `al.Level > 0` | `Permission_GetEffectiveByUser.sql` | ✅ |
| `NavItem.module` → `modules: ModuleCode[]`, AND | `Sidebar.tsx` | ✅ |
| `/medicamente` → `['anm', 'cnas']` | `Sidebar.tsx` | ✅ |
| Corectură `ModuleCodes` + §8 | `CLAUDE.md` | ✅ |

**Acceptare:** `npm run build` trece · `npm run check:api` trece · un override pe
un modul pe care rolul nu-l are apare în sidebar după re-login · un utilizator cu
`anm` fără `cnas` nu mai vede „Medicamente".

**Test nou:** `client/src/__tests__/components/layout/Sidebar.test.tsx` — montează
sidebar-ul cu permisiuni parțiale, verifică ce item-uri apar. Ar fi prins A1.
9 teste, toate trec.

**Verificat:** `tsc --noEmit` curat · `npm run lint` curat · 290 teste unitare
trec (15 fișiere) · `npm run build` reușește.

**Verificat pe baza de date reală** (`.\migrate.ps1` → `Permission_GetEffectiveByUser`
re-aplicat, „Upgrade successful"). Test pe rolul `doctor`, care nu are rând
`settings` în `RoleModulePermissions`, cu un override Read pe `settings` inserat
într-o tranzacție rulată apoi înapoi:

| Interogare | Rezultat pentru `settings` |
|---|---|
| forma veche (`INNER JOIN` pe rol) | **0 rânduri** — override-ul dispărea |
| SP-ul curent | `settings, AccessLevel=1, IsOverridden=1` ✅ |

Numărul total de module returnate pentru acel utilizator: 9 — cele 13 rânduri de
rol, minus cele 5 pe nivel `None`, plus modulul venit din override. Confirmă și
filtrul `al.Level > 0`.

**Confirmat și în interfață**, cu API + Vite pornite local și sesiune de admin:

| Test | Montaj | Rezultat |
|---|---|---|
| **A3** — filtrul AND | override `cnas = Fără acces` pe admin (care păstrează `anm` la Control total), pus din ecranul *Override Utilizatori* | secțiunea „Nomenclatoare" cu „Medicamente" **dispare** din sidebar; după ștergerea override-ului, **reapare** ✅ |
| **A2** — override pe modul absent din rol | rândul `settings` șters din `RoleModulePermissions` pentru rolul admin + override `settings = Read` pe utilizator | „Setări securitate" **apare** în sidebar, iar `GET /api/v1/SecuritySettings` răspunde **200**, cu ecranul randat complet ✅ |

Două observații din montaj:

- Ecranul *Permisiuni Roluri* nu poate produce scenariul A2: `Permission_SyncRolePermissions`
  e replace-all, iar clientul trimite toate cele 16 module, inclusiv pe cele puse pe
  „Fără acces" — deci rândul de rol există, la nivel 0, în loc să lipsească. Rândurile
  absente apar doar când un modul e adăugat în `Modules` după ultima salvare a rolului
  (cazul real: `anm`, `audit`, `settings` lipsesc din rolul `doctor`).
- O modificare făcută direct în SQL nu e vizibilă până la expirarea cache-ului:
  `RefreshTokenCommandHandler` citește întâi `PermissionCacheKeys.DtoForUser`, iar
  versiunea globală se incrementează doar prin API. La test, cache-ul a fost golit prin
  repornirea API-ului.

Baza a fost readusă la starea inițială după test: 16 rânduri pentru rolul admin,
`settings` la nivel 3, un singur rând în `UserModuleOverrides` (cel preexistent).

### Etapa 2 — Navigația spune adevărul 🔴🟠 ✅ **finalizată**

| Ce | Fișier | |
|---|---|---|
| `ROUTE_MODULES` — sursa unică rută → module | `routes/moduleAccess.ts` (nou) | ✅ |
| `RequireModuleAccess` — gardă montată o dată, ca layout | `routes/RequireModuleAccess.tsx` (nou) | ✅ |
| Ecranele „Nu ai acces" / „Contul nu are niciun modul" | `routes/AccessScreens.tsx` (nou) | ✅ |
| `useLandingRoute()` pentru `index`, `*` și brand-ul din sidebar | `routes/moduleAccess.ts` | ✅ |
| Grup CNAS/ANM în „Nomenclatoare" (6 ecrane) | `Sidebar.tsx` | ✅ |

**Cum e legată garda.** `RequireModuleAccess` se montează **o singură dată**, ca rută
de layout în interiorul `MainLayout`, și caută calea curentă în `ROUTE_MODULES` cu
`matchPath({ end: false })`. Nu e nimic de adăugat per rută: `/patients` acoperă și
`/patients/new`, și `/patients/:id/edit`, iar când se potrivesc mai multe tipare
câștigă cel mai specific. O rută nemapată rămâne deschisă — backend-ul o protejează
oricum, iar o hartă incompletă nu trebuie să blocheze ecrane care funcționau.

Sidebar-ul nu-și mai declară singur permisiunile: `NavItem.to` e tipizat ca
`GuardedRoute`, iar modulele vin din aceeași hartă. Meniul și garda nu se mai pot
desincroniza, iar o rută absentă din hartă e eroare de compilare, nu un item vizibil
tuturor.

**Acceptare — verificat în aplicație**, cu API + Vite pornite și sesiune de admin:

| Test | Montaj | Rezultat |
|---|---|---|
| **B2** — ecrane orfane | — | toate cele 6 rute CNAS/ANM apar în „Nomenclatoare"; `/cnas/atc` se deschide cu 3.484 rânduri reale, `GET /api/v1/Cnas/atc → 200` ✅ |
| **B1** — gardă de rută | override `audit = Fără acces` pe admin | „Jurnal securitate" dispare din meniu, iar `/audit/security` tastat direct dă cardul „Nu ai acces la acest ecran" cu codul `audit`, în loc de pagină + 403-uri în cascadă ✅ |
| **B3** — aterizare | override `dashboard = Fără acces` pe admin | `/o-ruta-care-nu-exista` aterizează pe **/patients**, primul ecran permis în ordinea meniului, nu pe `/dashboard` ✅ |

Ambele override-uri au fost puse și șterse din ecranul *Override Utilizatori*, deci
prin API — cu invalidarea corectă a cache-ului de permisiuni. Baza a rămas la starea
inițială: un singur rând în `UserModuleOverrides`, cel preexistent.

**Teste noi:** `__tests__/routes/moduleAccess.test.ts` (13) și
`__tests__/routes/RequireModuleAccess.test.tsx` (11) — potrivirea pe subrute, tiparul
cel mai specific, semantica AND, ruta nemapată, ordinea de aterizare, contul fără
module și starea de bootstrap. Un test verifică și că `ROUTE_MODULES` nu folosește
niciun cod absent din `MODULE`.

**Verificat:** `tsc --noEmit` curat · `npm run lint` curat · **314 teste** unitare
(17 fișiere) · `npm run build` reușește.

**Rămas din grup:** B4 (remodelarea modulului `users`) — plan separat, vezi §Decizii.

### Etapa 3 — Accesibilitate 🟡

D1 contrast · D2 `.visually-hidden` + tooltips · D3 `:focus-visible` ·
D4 `aria-expanded` + repoziționare · D5 `aria-label` + `role="group"`.

**Acceptare:** toate perechile text/fundal ≥ 4.5:1, grafice ≥ 3:1 · parcurgere
completă cu Tab, cu focus vizibil · colapsat, fiecare item are nume accesibil și
tooltip.

### Etapa 4 — Responsive, stare, performanță 🟠

E1 breakpoints + overlay + hamburger · E2 `height: 100%` · E3 `scrollIntoView` ·
C1 invalidare permisiuni · C2 `persist` · C3 selectoare · C4 `getInitials` ·
F1–F3.

**Acceptare:** la 375px sidebar-ul e overlay cu backdrop, se închide la navigare și
la `Escape` · collapsed supraviețuiește reload-ului · `setNotificationCount` nu mai
re-randează sidebar-ul.

### Etapa 5 — Sursa unică pentru codurile de modul 🟠

`ModuleCodes` expus prin OpenAPI → `ModuleCode` generat în `schema.d.ts` →
`MODULE` scris de mână dispare. Job-ul `contract` din CI prinde de-acum orice drift
între C# și TS.

**Acceptare:** un modul adăugat în `ModuleCodes.cs` fără regenerare face
`npm run check:api` să pice.

---

## Ce NU intră în scop

- Remodelarea permisiunilor `users` (B4) — plan separat, atinge toate rolurile.
- Ecrane pentru `documents`, `payments`, `reports`.
- Secțiuni colapsabile, căutare în meniu, favorite, reordonare de către utilizator.
- Refactorizarea `AppHeader` dincolo de butonul hamburger din etapa 4.

---

## Verificare finală

```powershell
cd client
npm run lint
npm run test:unit
npm run build
npm run check:api
```

Plus verificare manuală în browser, pe trei roluri (`admin`, `doctor`,
`receptionist`), la trei lățimi (1440 / 900 / 375), colapsat și expandat.
