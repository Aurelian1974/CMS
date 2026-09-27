# Dashboard pe roluri — analiză completă (Pasul 0)

> Stare: **analiză, fără cod**. Implementarea începe după confirmarea deciziilor din §16.
> Scop: înlocuirea dashboard-ului unic, 100% mock, cu un dashboard care arată fiecărui
> utilizator exact ce îl privește — fără a inventa un al doilea model de autorizare
> paralel cu RBAC-ul existent.

---

## 1. Punctul de plecare — ce există azi

| Aspect | Realitate în cod |
|---|---|
| Pagina | `client/src/features/dashboard/pages/DashboardPage.tsx` + `.module.scss` — singurul fișier al feature-ului |
| Date | **Integral mock**, hardcodat în componentă: `MOCK_APPOINTMENTS` (8 rânduri), `MOCK_ACTIVITY` (6 rânduri), 4 `StatCard` cu valori literale (`8`, `34`, `5`, `"12.480 RON"`) și trend-uri inventate (`12`, `8`, `0`, `-4`) |
| Backend | **Nu există**: niciun `DashboardController`, niciun slice `Features/Dashboard`, niciun SP `Dashboard_*`, niciun `IDashboardRepository` |
| Rol | **Ignorat complet** — toți cei 5 roluri văd exact același ecran, cu aceleași cifre false |
| Permisiuni | Ruta `/dashboard` cere `['dashboard']` Read în `ROUTE_MODULES` (`client/src/routes/moduleAccess.ts`); toate rolurile au `dashboard = read` din seed-ul 0011 |
| Teste | `client/e2e/specs/dashboard.spec.ts` — 4 teste de smoke (titlu vizibil, sidebar are ≥5 linkuri, fără erori API, fără erori JS). Niciun test unitar |
| Componente reutilizabile existente | `StatCard` (label, value, icon, color, trend, trendLabel), `PageHeader`, `AppDataGrid`, `AppBadge`, `PermissionGate`, `LoadingSpinner` |

Consecința practică: testul „fără erori API pe Dashboard" trece azi **pentru că pagina nu face niciun
apel**. În momentul în care dashboard-ul devine real, acel test începe să aibă valoare — și devine
primul care cade dacă un widget cere un endpoint pe care rolul curent nu-l poate accesa.

---

## 2. Stack și convenții de respectat 1:1

| Aspect | Ce există | Implicație pentru dashboard |
|---|---|---|
| Arhitectură | Clean Architecture + vertical slices MediatR (`Features/{X}/Queries/{Action}/`) | Slice nou `Features/Dashboard/Queries/*`, **doar Queries** — dashboard-ul nu scrie nimic (excepție: §11, preferințele de layout) |
| Acces date | Dapper **exclusiv prin SP-uri**; constante în `Infrastructure/Data/StoredProcedures/*Procedures.cs` | `DashboardProcedures.cs` nou; zero SQL inline în C# |
| Multi-tenancy | `ICurrentUser.ClinicId` la fiecare query; `WHERE ClinicId = @ClinicId` obligatoriu în SP | Fără excepție — vezi §8.7 pentru cazul `SecurityEvents`, unde `ClinicId` e NULL-abil |
| Soft delete | `IsDeleted` pe toate tabelele principale | Orice agregat filtrează `IsDeleted = 0`; o consultație ștearsă nu are ce căuta într-un contor |
| Erori business | `THROW 5xxxx` în SP → `SqlException` → `Result<T>` | **Nu se aplică**: un dashboard read-only nu are erori de business. Fără coduri noi în `SqlErrorCodes.cs` |
| Autorizare | `[HasAccess(ModuleCodes.X, AccessLevel.Read)]` pe endpoint; FE `useHasAccess()` + `MODULE` | §3–§4: un singur atribut pe endpoint **nu e suficient** pentru un payload compozit |
| Migrări | DbUp, 2 faze: `Scripts/Migrations/NNNN_*.sql` (o dată, journal `SchemaVersions`) + `Scripts/StoredProcedures/*.sql` (re-rulate la fiecare execuție, `NullJournal`). Ultima migrare: **`0056_CreateFiscalReceipts.sql`** | Migrarea nouă pornește de la **`0057`**; SP-urile sunt `CREATE OR ALTER`, deci re-deployabile |
| Rezultate paginate | `PagedResult<T>` + wrapper `{Entity}PagedResponse` cu `PagedResult` + `Stats` | Dashboard-ul **nu paginează**: listele sunt „top N", cu link „vezi tot" spre pagina de listă |
| Rezultate multiple | `QueryMultipleAsync` + `ReadAsync`/`ReadSingleAsync` (precedent: `ConsultationBilling_GetPaged`, 3 result sets) | Același pattern; §8.1 explică de ce result set-urile trebuie să fie **fixe**, nu condiționate de parametri |
| Response API | `ApiResponse<T>` = `{ success, data, message, errors }`; interceptorul axios returnează `response.data`, deci fișierele `*.api.ts` întorc `Promise<ApiResponse<T>>` | §10: hook-ul accesează `.data`, **nu** `.data.data` |
| Server state | TanStack Query; `{feature}Keys` cu `all/lists/list(params)/details/detail(id)`; `staleTime` explicit (15s la billing, 1 min la consultații) | §10.3: `staleTime` diferit per widget — agenda de azi nu se învechește ca încasările lunii |
| Grafice | **Nicio bibliotecă de chart instalată** (verificat `client/package.json`: fără `@syncfusion/ej2-react-charts`, fără recharts/chart.js/d3) | §12 — decizie necesară |
| Teste | xUnit + NSubstitute (handler/validator), Vitest + Testing Library (FE), Playwright (e2e) | §13 |
| Contract | `npm run check:api` = `gen:api` + `tsc --noEmit`; job `contract` în CI | §14: `openapi-v1.json` se regenerează cu `generate-openapi.ps1` **înainte** de a scrie tipurile FE |

---

## 3. Modelul de autorizare — de ce rolul singur NU e suficient

Aceasta e observația care decide arhitectura întregului feature.

Proiectul **nu** are autorizare pe rol. Are autorizare pe **permisiune efectivă per modul**,
cu rolul ca simplă valoare implicită:

```sql
-- Permission_GetEffectiveByUser.sql (extras)
FROM Modules m
LEFT  JOIN RoleModulePermissions rmp ON rmp.ModuleId = m.Id AND rmp.RoleId = @RoleId
LEFT  JOIN UserModuleOverrides   uo  ON uo.ModuleId  = m.Id AND uo.UserId  = @UserId
INNER JOIN AccessLevels al ON al.Id = COALESCE(uo.AccessLevelId, rmp.AccessLevelId)
WHERE m.IsActive = 1 AND al.Level > 0
```

`UserModuleOverrides` (migrarea 0011) permite ca **orice** utilizator să primească **orice** nivel pe
**orice** modul, cu `Reason` + `GrantedBy` pentru audit. Ecranul `/permissions/users` există și e
funcțional. Deci:

- un `doctor` cu override `payments = read` **trebuie** să vadă widget-ul de încasări;
- un `receptionist` cu override `consultations = none` explicit **nu trebuie** să vadă nimic clinic,
  chiar dacă rolul lui ar fi fost schimbat între timp;
- un `nurse` cu override `reports = read` intră în categoria „are dreptul la widget-uri analitice".

**Un dashboard care se ramifică pe `currentUser.Role` reintroduce un al doilea model de autorizare,
care se va desincroniza de primul la primul override acordat.** Exact bug-ul pe care
`RequireModuleAccess` a fost scris ca să-l repare la nivel de rute (sidebar-ul filtra cosmetic, dar
adresa tastată manual deschidea pagina).

### Matricea de permisiuni din seed (0011 + 0045 + 0047 + 0053)

| Modul | admin | doctor | nurse | receptionist | clinic_manager |
|---|---|---|---|---|---|
| `dashboard` | Full | Read | Read | Read | Read |
| `patients` | Full | Write | Read | Write | Read |
| `appointments` | Full | Write | Read | **Full** | Read |
| `consultations` | Full | Write | Read | **None** | **None** |
| `prescriptions` | Full | Write | Read | None | None |
| `documents` | Full | Write | None | Write | None |
| `invoices` | Full | None | None | Write | Read → **Full** (0053) |
| `payments` | Full | None | None | Write | Read → **Full** (0053) |
| `reports` | Full | Read | None | None | **Full** |
| `nomenclature` | Full | Read | Read | Read | Read |
| `users` | Full | None | None | None | Read |
| `clinic` | Full | None | None | None | Write |
| `cnas` | Full | None | None | None | Full |
| `anm` | *(0030)* | — | — | — | — |
| `audit` | **doar admin** (0045) | — | — | — | — |
| `settings` | **doar admin** (0047) | — | — | — | — |
| `tariffs` | Full | Read | Read | Read | Full (0053) |

Trei consecințe dure, care constrâng conținutul fiecărui dashboard:

1. **`receptionist` și `clinic_manager` au `consultations = None`.** Niciun widget vizibil lor nu poate
   conține `Diagnostic`, `DiagnosticCodes`, motivul consultației sau orice câmp de anamneză/examen.
   Precedentul e deja stabilit în cod — comentariul din `BillingController`:
   *„Nu expune date clinice — accesul e pe modulul payments, nu consultations."*
2. **`doctor` și `nurse` au `payments = None` și `invoices = None`.** Niciun widget al lor nu arată
   sume încasate, restanțe sau facturi.
3. **`audit` e exclusiv admin.** „Activitate recentă" — widget-ul care azi e mock pentru toți — citește
   din `AuditLogs`, deci în forma actuală e **widget de admin**, nu widget general. Alternativa pentru
   restul rolurilor e o listă derivată din entitățile pe care utilizatorul le poate deja citi (§7).

---

## 4. Decizia arhitecturală centrală

> **Rolul alege preset-ul (ce widget-uri, în ce ordine). Permisiunile decid ce se randează efectiv.
> Serverul filtrează; clientul doar afișează ce a primit.**

Trei variante au fost puse în balanță:

| Variantă | Cum arată | Verdict |
|---|---|---|
| **A. Un endpoint per rol** — `GET /Dashboard/doctor`, `/Dashboard/receptionist`, … | Fiecare cu `[HasAccess]` propriu, cu `[Authorize(Roles = …)]` | **Respinsă.** Autorizare pe rol → ignoră override-urile (§3). 5 endpoint-uri cu 70% cod duplicat. Un rol nou = un endpoint nou, o migrare, un slice, un tip FE |
| **B. Un endpoint unic cu payload gigant** — `GET /Dashboard` întoarce tot | Un singur `[HasAccess(dashboard, Read)]`; clientul ascunde ce nu-i trebuie | **Respinsă.** Datele ajung la client indiferent de permisiuni — un `receptionist` primește diagnostice în JSON și le „ascunde" în UI. Asta e scurgere de date medicale, nu filtrare. Plus: calculează 20 de agregate pentru a afișa 6 |
| **C. Widget-uri compozabile, filtrate pe server** ✅ | `GET /Dashboard` → serverul citește permisiunile efective, stabilește setul de widget-uri permise ∩ preset-ul rolului, execută **doar** SP-urile necesare, întoarce **doar** secțiunile permise | **Recomandată** |

### Cum funcționează varianta C

```
1. GET /api/v1/Dashboard        [HasAccess(dashboard, Read)]
2. Handler:
   a. citește permisiunile efective ale userului (Permission_GetEffectiveByUser — deja există)
   b. determină preset-ul: DASHBOARD_PRESETS[currentUser.Role]  (listă ordonată de WidgetId)
   c. filtrează: widget.RequiredModule are nivel >= widget.RequiredLevel în permisiuni
   d. grupează widget-urile rămase pe „bundle" (§8.1) → apelează doar SP-urile necesare
   e. întoarce DashboardDto { widgetIds: [...ordine], + secțiunile permise }
3. FE: WIDGET_REGISTRY[id] → componenta React; ordinea vine de la server
```

Avantajele care contează concret aici:

- **Un singur punct de adevăr pentru autorizare.** Aceeași hartă `widget → modul + nivel` e folosită
  de server pentru a filtra și (opțional, defensiv) de client pentru a nu cere. Exact modelul din
  `moduleAccess.ts`, care e deja consumat în trei locuri ca să nu se poată desincroniza.
- **Override-urile funcționează din prima.** Un `doctor` cu `payments = read` primește widget-ul de
  încasări fără nicio linie de cod nouă — dacă apare în preset-ul lui. Dacă nu apare, îl poate adăuga
  din preferințe (§11).
- **Un rol nou = un rând în `DASHBOARD_PRESETS`.** Zero migrări, zero endpoint-uri, zero SP-uri.
- **Costul SQL scade cu rolul.** Un `nurse` execută 2 SP-uri, un `admin` 5.

### Unde stă preset-ul: cod sau BD?

| Opțiune | Pro | Contra |
|---|---|---|
| **Constantă C#** (`DashboardPresets.cs`) ✅ pentru v1 | Tipizat, testabil unitar, versionat în git, review-abil | Schimbarea unui preset cere deploy |
| Tabel `DashboardRoleWidgets` | Configurabil din UI de admin | Un al doilea ecran de administrare, validare că `WidgetId` e cunoscut, sincronizare cod↔BD — exact riscul semnalat în CLAUDE.md pentru `MODULE` vs `ModuleCodes` |

Recomandare: **constantă C# pentru v1**, tabel doar dacă apare cererea reală de a reconfigura
preset-uri fără deploy. Preferințele *per utilizator* (§11) sunt o problemă separată și acolo BD-ul
e răspunsul corect, cu precedentul `UserMenuPreferences` (0049).

---

## 5. Inventarul datelor — ce se poate calcula azi

Tot ce urmează e verificat împotriva migrărilor existente. Coloanele citate există.

| Sursă | Coloane utile | Ce alimentează | Index existent |
|---|---|---|---|
| `Appointments` (0027) | `ClinicId`, `PatientId`, `DoctorId`, `StartTime`, `EndTime`, `StatusId`, `Notes`, `IsDeleted` | agenda zilei, ocupare, rată neprezentare | `IX_Appointments_ClinicId_StartTime`, `IX_Appointments_DoctorId_StartTime` ✅ |
| `AppointmentStatuses` | `PROGRAMAT`, `CONFIRMAT`, `FINALIZAT`, `ANULAT`, `NEPREZENTARE` (GUID-uri fixe `A1000000-…`) | contoare per status | — |
| `Consultations` (0031 + 0012 + 0035 + 0052) | `Date`, `DoctorId`, `PatientId`, `StatusId`, `AppointmentId`, `Diagnostic`, `DataUrmatoareiVizite`, `AreIndicatieInternare`, `EsteAfectiuneOncologica`, `RowVersion`, `IsDeleted` | consultații în lucru, follow-up datorate, KPI zilnic | `IX_Consultations_ClinicId_Date`, `IX_Consultations_DoctorId_Date` ✅ |
| `ConsultationStatuses` | `INLUCRU`, `FINALIZATA`, `FACTURATA` (0052), `BLOCATA` | pipeline clinic | — |
| `ConsultationServices` (0054) | `ConsultationId`, `ServiceName`, `UnitPrice`, `Quantity`, `LineTotal`, `IsDeleted` | valoare de facturat, top servicii | `IX_ConsultationServices_Consultation` ✅ |
| `Payments` (0055) | `ClinicId`, `ConsultationId`, `Amount`, `PaidAt`, `IsCancelled` | încasări zi/lună, evoluție | `IX_Payments_Clinic_PaidAt` ✅ |
| `PaymentTenders` (0055) | `PaymentMethodId`, `Amount` | defalcare numerar/card | — |
| `Invoices` (0055) | `IssuedAt`, `IssueDate`, `Series`, `Number`, `Total`, `StatusId`, `IsStorno` | facturi emise/stornate | `IX_Invoices_Clinic_IssueDate` ✅ |
| `FiscalReceipts` (0056) | `ConsultationId`, `StatusId` → `PENDING/PRINTING/PRINTED/FAILED/UNKNOWN/CANCELLED` | bonuri care cer intervenție | `IX_FiscalReceipts_Clinic_Status` ✅ |
| `Prescriptions` (0051) | `DoctorId`, `StatusId` (`CIORNA/EMISA/TRANSMISA/ELIBERATA/ANULATA`), `IssueDate`, `ValidUntil`, `TransmissionError` | rețete nefinalizate, erori SIPE | `IX_Prescriptions_Clinic_Date` ✅ |
| `Patients` (0014) | `CreatedAt`, `InsuranceNumber`, `InsuranceExpiry`, `IsActive`, `IsDeleted` | pacienți noi, asigurări expirate | ⚠️ `IX_Patients_ClinicId` e pe `ClinicId` simplu — **nu acoperă** `ORDER BY CreatedAt` |
| `AnalysesResults` (0039) | `PatientId`, `ConsultationId`, `CollectionDate`, `ResultDate`, `Laboratory` | buletine noi de interpretat | ⚠️ index pe `(ClinicId, PatientId)` — **nu** pe `ResultDate` |
| `AnalysesResultDetails` (0039/0040) | `Flag` (`HIGH/LOW/CHECK`), `TestName`, `Value` | „rezultate în afara referinței" | `IX_AnalysesResultDetails_ResultId` ✅ |
| `AuditLogs` (0029) | `EntityType`, `EntityId`, `Action`, `ChangedBy`, `ChangedAt` | activitate recentă (**doar admin**) | `IX_AuditLogs_ClinicId_ChangedAt` ✅ |
| `SecurityEvents` (0044) | `EventType`, `Succeeded`, `OccurredAt`, `IpAddress`, `ClinicId` **NULL-abil** | login-uri eșuate, blocări | `IX_SecurityEvents_OccurredAt` (fără `ClinicId` în cheie) ⚠️ |
| `Users` (0008 + 0042) | `LockoutEnd`, `FailedLoginAttempts`, `LastLoginAt`, `MustChangePassword`, `IsActive` | conturi blocate / parole de resetat | `IX_Users_IsActive` ✅ |
| `Doctors` (0004) | `LicenseNumber`, `LicenseExpiresAt`, `MedicalCode`, `IsActive` | avize CMR care expiră | ⚠️ niciun index pe `LicenseExpiresAt` |
| `DoctorSchedule` / `ClinicSchedule` (0025) | `DayOfWeek`, `StartTime`, `EndTime`, `IsOpen` | capacitate teoretică → % ocupare | — |
| `Anm_SyncLog` (0030), `NomenclatorSyncLog` (0026) | data/rezultatul ultimei sincronizări | prospețimea nomenclatoarelor | — |

### Ce NU se poate calcula azi

| Cerință plauzibilă | Blocaj |
|---|---|
| „Trend-urile" de pe `StatCard` (`+12% față de ieri`) | Se pot calcula — dar cer un al doilea agregat pe perioada anterioară în fiecare SP. **Nu sunt gratuite**; vezi §16/D4 |
| Tip/denumire programare („Consultație generală", ca în mock) | `Appointments` **nu are** tip. Are doar `Notes NVARCHAR(2000)` liber. Mock-ul afișează un câmp care nu există |
| „Timp mediu de așteptare" | Nu există marcaj de check-in / început real al consultației |
| Venit pe medic | `Payments` se leagă de `ConsultationId` → `Consultations.DoctorId`. Se poate, prin JOIN. Dar expune financiar pe medic — decizie de business, nu tehnică |
| Documente emise (trimiteri, concedii) | `DocumentsController` există, dar e protejat pe `consultations`, nu pe `documents` — modulul `documents` e seed-uit și **nu e folosit de nicio rută sau controller**. Gap preexistent, semnalat în §15 |
| Rapoarte | Modulul `reports` e seed-uit (`clinic_manager = Full`), dar **nu există nicio rută `/reports`** în `ROUTE_MODULES` și niciun controller. Widget-urile analitice ale managerului trebuie legate de module existente (`payments`, `invoices`, `appointments`), nu de `reports` |

---

## 6. Catalogul de widget-uri

`RequiredModule` + `RequiredLevel` sunt **singurul** criteriu de vizibilitate. Coloana „Bundle SQL"
spune care SP îl alimentează (§8).

| WidgetId | Titlu | Modul : nivel | Bundle SQL | Formă |
|---|---|---|---|---|
| `kpi.appointments.today` | Programări azi | `appointments` : Read | `Clinical` | StatCard |
| `kpi.consultations.today` | Consultații azi | `consultations` : Read | `Clinical` | StatCard |
| `kpi.consultations.open` | Consultații în lucru | `consultations` : Read | `Clinical` | StatCard |
| `kpi.followups.due` | Reveniri programabile | `consultations` : Read | `Clinical` | StatCard |
| `kpi.patients.new.month` | Pacienți noi (lună) | `patients` : Read | `Clinical` | StatCard |
| `kpi.prescriptions.draft` | Rețete ciornă | `prescriptions` : Read | `Clinical` | StatCard |
| `kpi.revenue.today` | Încasări azi | `payments` : Read | `Financial` | StatCard |
| `kpi.revenue.month` | Încasări (lună) | `payments` : Read | `Financial` | StatCard |
| `kpi.unpaid.count` | Consultații neîncasate | `payments` : Read | `Financial` | StatCard |
| `kpi.receipts.attention` | Bonuri de rezolvat | `payments` : Read | `Financial` | StatCard |
| `kpi.invoices.month` | Facturi emise (lună) | `invoices` : Read | `Financial` | StatCard |
| `list.agenda.today` | Agenda de azi | `appointments` : Read | `Agenda` | Listă (top 20) |
| `list.consultations.open` | Consultații în lucru | `consultations` : Read | `Agenda` | Listă (top 10) |
| `list.lab.results.new` | Buletine noi de interpretat | `consultations` : Read | `Agenda` | Listă (top 10) |
| `list.unpaid` | De încasat | `payments` : Read | `Financial` | Listă (top 10) |
| `list.receipts.failed` | Bonuri în eroare | `payments` : Read | `Financial` | Listă (top 10) |
| `list.activity` | Activitate recentă | `audit` : Read | `Health` | Timeline (top 15) |
| `list.security.events` | Evenimente de securitate | `audit` : Read | `Health` | Timeline (top 15) |
| `chart.revenue.trend` | Evoluție încasări (30 zile) | `payments` : Read | `Trend` | Serie temporală |
| `chart.appointments.week` | Ocupare săptămână | `appointments` : Read | `Trend` | Serie temporală |
| `panel.noshow.rate` | Rată neprezentare (30 zile) | `appointments` : Read | `Trend` | Metrică + comparație |
| `panel.doctor.workload` | Încărcare pe medic | `appointments` : Read **și** `users` : Read | `Trend` | Tabel mic |
| `panel.top.services` | Top servicii (lună) | `tariffs` : Read **și** `payments` : Read | `Trend` | Tabel mic |
| `panel.licenses.expiring` | Avize CMR care expiră | `users` : Read | `Health` | Listă |
| `panel.insurance.expiring` | Asigurări expirate | `patients` : Read | `Health` | Listă |
| `panel.users.locked` | Conturi blocate | `users` : Read | `Health` | Listă |
| `panel.nomenclator.freshness` | Prospețimea nomenclatoarelor | `anm` : Read **sau** `cnas` : Read | `Health` | Listă de stări |

### Semantica listei de module pe un widget

`moduleAccess.ts` stabilește deja convenția pentru rute: lista înseamnă **AND**, „ecranul cere Read pe
*toate* modulele enumerate", cu `/medicamente: ['anm', 'cnas']` ca exemplu. Widget-urile moștenesc
aceeași semantică (`panel.doctor.workload`, `panel.top.services`).

Singura excepție e `panel.nomenclator.freshness`, care are nevoie de **OR** — un utilizator cu doar
`cnas` vede linia CNAS. Ca să nu introducem două semantici în aceeași structură, recomand ca acest
widget să fie **două widget-uri separate** (`panel.freshness.anm` / `panel.freshness.cnas`), fiecare cu
un singur modul, randate în același card. Semantica rămâne pur AND, ca la rute.

---

## 7. Cele cinci dashboard-uri

Fiecare preset e o **listă ordonată** de `WidgetId`. Ordinea din listă e ordinea de afișare — exact
convenția din `UserMenuPreferences.FavoriteRoutes` (0049: „ordinea din array E ordinea de afișare").

### 7.1 `doctor` — „ziua mea clinică"

```
kpi.appointments.today        (doar ale mele)
kpi.consultations.open        (doar ale mele)
kpi.followups.due             (doar ale mele)
kpi.prescriptions.draft       (doar ale mele)
list.agenda.today             (doar ale mele, cu motivul consultației)
list.consultations.open
list.lab.results.new          (pacienții mei)
```

Fără nimic financiar (`payments`/`invoices = None`). **Scopul pe medic e esențial** și e blocat azi —
vezi §8.3.

### 7.2 `nurse` — „ziua clinicii, read-only"

```
kpi.appointments.today        (toată clinica)
kpi.consultations.today
kpi.patients.new.month
list.agenda.today             (toată clinica)
list.lab.results.new          (toată clinica)
```

`nurse` are `consultations = Read`, deci poate vedea diagnostic. Nu are `documents`, `prescriptions`
peste Read, nici financiar.

### 7.3 `receptionist` — „recepția"

```
kpi.appointments.today
kpi.patients.new.month
kpi.revenue.today
kpi.unpaid.count
kpi.receipts.attention
list.agenda.today             (FĂRĂ câmpuri clinice)
list.unpaid
list.receipts.failed
```

**Constrângerea care nu se negociază:** `consultations = None`. `list.agenda.today` randat pentru
recepție conține pacient, oră, medic, status — **nu** motivul consultației, nu diagnosticul. Asta se
impune în SP prin parametrul `@IncludeClinical` (§8.4), nu în componenta React: dacă filtrarea e doar
în UI, datele clinice au ajuns deja în JSON-ul pe care recepția îl poate citi din DevTools.

### 7.4 `clinic_manager` — „cum merge clinica"

```
kpi.revenue.month
kpi.invoices.month
kpi.appointments.today
kpi.patients.new.month
chart.revenue.trend
chart.appointments.week
panel.noshow.rate
panel.doctor.workload
panel.top.services
```

`consultations = None` → zero date clinice, doar volume și bani. Are `reports = Full`, dar modulul
`reports` nu are suport în cod (§5), deci widget-urile analitice se leagă de `payments`/`invoices`/
`appointments`, unde 0053 i-a dat `Full`.

### 7.5 `admin` — „sănătatea sistemului"

```
kpi.appointments.today
kpi.revenue.today
list.security.events
panel.users.locked
panel.licenses.expiring
panel.insurance.expiring
panel.freshness.anm
panel.freshness.cnas
list.activity
```

Adminul are `Full` pe tot, deci **orice** widget i-ar fi permis. Preset-ul lui nu e „tot" — e ce îl
interesează operațional. Restul le poate adăuga din preferințe (§11).

### 7.6 Ce vede cine — matrice de verificare

| Widget | admin | doctor | nurse | recepție | manager |
|---|---|---|---|---|---|
| Agenda de azi | ○ | ● *(ale mele)* | ● | ● *(fără clinic)* | ○ |
| Consultații în lucru | ○ | ● | ○ | ✗ | ✗ |
| Buletine analize noi | ○ | ● | ● | ✗ | ✗ |
| Încasări azi / lună | ● | ✗ | ✗ | ● | ● |
| De încasat / bonuri | ○ | ✗ | ✗ | ● | ○ |
| Facturi lună | ○ | ✗ | ✗ | ○ | ● |
| Evoluție / ocupare / no-show | ○ | ✗ | ✗ | ✗ | ● |
| Activitate + securitate | ● | ✗ | ✗ | ✗ | ✗ |
| Conturi blocate / avize CMR | ● | ✗ | ✗ | ✗ | ○ |

● în preset · ○ permis, nu în preset (se poate adăuga) · ✗ interzis de permisiuni

---

## 8. Partea SQL

### 8.1 De ce SP-uri pe „bundle", nu unul singur și nu unul per widget

Trei variante, toate compatibile cu Dapper + SP:

| Variantă | Problema |
|---|---|
| **Un SP unic `Dashboard_GetAll`** cu `@Sections NVARCHAR` și `IF` pe fiecare secțiune | Numărul de result set-uri devine **variabil**. `QueryMultipleAsync` citește pozițional (`ReadAsync`/`ReadSingleAsync` în ordinea SP-ului): un `IF` care sare un `SELECT` deplasează tot ce urmează. Se ajunge la cod C# care numără result set-uri în funcție de parametri — cea mai fragilă formă de cuplaj posibilă |
| **Un SP per widget** (27 SP-uri) | 27 round-trip-uri pentru un dashboard de admin. Widget-uri care citesc din aceleași tabele (toate KPI-urile clinice) recalculează aceleași filtre de 4 ori |
| **Un SP per bundle** (5 SP-uri), result set-uri **fixe** ✅ | Handler-ul apelează doar bundle-urile de care are nevoie; fiecare SP are un contract stabil, testabil izolat |

Cele 5 bundle-uri, aliniate pe „ce tabele ating" (nu pe rol — un bundle poate servi mai multe roluri):

| Bundle | SP | Result sets | Tabele atinse |
|---|---|---|---|
| `Clinical` | `Dashboard_GetClinicalKpis` | 1 (rând unic de contoare) | Appointments, Consultations, Patients, Prescriptions |
| `Agenda` | `Dashboard_GetAgenda` | 3 (agenda, consultații în lucru, buletine noi) | Appointments, Consultations, AnalysesResults |
| `Financial` | `Dashboard_GetFinancialKpis` | 3 (contoare, de încasat, bonuri în eroare) | Payments, ConsultationServices, Invoices, FiscalReceipts |
| `Trend` | `Dashboard_GetTrends` | 4 (încasări/zi, programări/zi, no-show, încărcare medici) | Payments, Appointments |
| `Health` | `Dashboard_GetOperationalHealth` | 5 (securitate, conturi blocate, avize, asigurări, sincronizări) | SecurityEvents, Users, Doctors, Patients, *_SyncLog |

Handler-ul le apelează **secvenţial**, nu cu `Task.WhenAll`: `DapperContext.CreateConnection()` dă o
conexiune nouă per apel, deci paralelizarea e posibilă tehnic, dar un `HttpContext`-scoped
`ICurrentUser` plus 5 conexiuni simultane per request nu se justifică pentru 5 interogări de sub 20 ms
fiecare. Dacă profilarea arată altceva, paralelizarea e o schimbare locală în repository.

### 8.2 Problema „azi" — fusul orar

Codebase-ul amestecă trei convenții:

| Convenție | Unde | Ce înseamnă |
|---|---|---|
| `SYSDATETIME()` | `Appointments`, `Consultations`, `ConsultationServices`, `AnalysesResults`, `AuditLogs`, `UserMenuPreferences` | ora **locală a serverului SQL** |
| `GETDATE()` | `Users`, `Patients`, `Doctors`, `Payments`, `Invoices`, `FiscalReceipts`, `Prescriptions` | ora locală a serverului (identic cu `SYSDATETIME()` la nivel de dată) |
| `SYSUTCDATETIME()` | `SecurityEvents.OccurredAt` **exclusiv** | UTC |

Pentru un dashboard, „azi" e o întrebare de business, nu de server. Consecințe:

1. **Datele clinice și financiare** sunt în ora locală → `CAST(SYSDATETIME() AS DATE)` e corect **dacă**
   serverul SQL rulează pe `Europe/Bucharest`. Asta e o presupunere nedocumentată azi. Recomand:
   **parametru `@Today DATE` transmis de la handler**, calculat explicit în C#, nu `SYSDATETIME()` în SP.
   Așa: (a) serverul de aplicație și SQL pot fi în fusuri diferite fără ca „azi" să se rupă;
   (b) SP-ul devine testabil determinist — se poate cere „ziua de 2026-03-15" într-un test de integrare.
2. **`SecurityEvents` e în UTC.** Un filtru „ultimele 24h" pe `OccurredAt` comparat cu un `@Today` local
   dă rezultate decalate cu 2–3 ore (ora de iarnă/vară). Widget-ul de securitate primește un parametru
   separat `@SinceUtc DATETIME2`, calculat în C# ca `DateTime.UtcNow.AddHours(-24)`.
3. **`DATEADD(DAY, 1, @DateTo)` cu `<`**, niciodată `BETWEEN` pe `DATETIME2` — convenția e deja
   respectată în `Consultation_GetPaged` și `ConsultationBilling_GetPaged`. Se păstrează.

### 8.3 Blocajul critic: scopul pe medic

Widget-urile „ale mele" (agenda medicului, consultațiile mele, rețetele mele) au nevoie de
`DoctorId`-ul utilizatorului curent. **Nu e disponibil pe server.**

```csharp
// ICurrentUser.cs — setul complet, azi
Guid Id { get; }        Guid ClinicId { get; }   Guid RoleId { get; }
string Email { get; }   string FullName { get; } string Role { get; }
bool IsInRole(string role);
```

```csharp
// JwtTokenService.cs — claim-urile emise, azi
Sub, Jti, Email, "clinicId", "fullName", ClaimTypes.Role, "roleId"
```

Nu există `doctorId`. Clientul îl are (`AuthUser.doctorId`, venit în corpul răspunsului de login), dar o
valoare trimisă de client **nu poate** fi folosită pentru scoping — ar permite unui medic să ceară
agenda altui medic prin schimbarea unui parametru. Legătura reală e în `Users.DoctorId`
(`CK_Users_DoctorOrStaff`: exact unul dintre `DoctorId` / `MedicalStaffId` e populat).

Două soluții:

| Soluție | Pro | Contra | Verdict |
|---|---|---|---|
| **A. Claim `doctorId` în JWT** + `ICurrentUser.DoctorId` | Zero query suplimentar | Token-ul devine stale dacă legătura user↔doctor se schimbă (există `DoctorAlreadyLinkedToUser = 50305`, deci relegarea e o operație reală); toate token-urile active trebuie rotite; `ICurrentUser.DoctorId` e `Guid?` și aruncă sau întoarce null pentru personal medical — o sursă bună de `NullReferenceException` | Respinsă pentru v1 |
| **B. Rezolvare în SP din `@UserId`** ✅ | Mereu proaspăt; fără schimbări în auth; fără rotire de token-uri; costul e un seek pe PK-ul `Users` | Un seek suplimentar per SP care are nevoie de scop | **Recomandată** |

```sql
-- Pattern de rezolvare, în capul fiecărui SP cu scop pe medic.
-- @OnlyMine vine din preset-ul rolului, nu de la client (§9.3).
DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;

IF @OnlyMine = 1
BEGIN
    SELECT @DoctorId = u.DoctorId
    FROM dbo.Users u
    WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    -- Un utilizator legat de MedicalStaff (nu de Doctor) nu are agendă proprie:
    -- @DoctorId rămâne NULL, iar filtrul de mai jos nu se aplică. Preset-ul
    -- rolului `doctor` e singurul care cere @OnlyMine = 1, iar un cont cu rol
    -- `doctor` fără DoctorId e o inconsistență de date, nu un caz de rulare —
    -- dashboard-ul afișează clinica întreagă, nu un ecran gol.
END;

-- ... apoi, în WHERE:
AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
```

### 8.4 Indecși — audit și completări

Acoperire existentă (nu se atinge nimic):

| Interogare de dashboard | Index care o servește |
|---|---|
| Agenda zilei / contor programări | `IX_Appointments_ClinicId_StartTime (ClinicId, StartTime DESC) INCLUDE (PatientId, DoctorId, StatusId, IsDeleted)` ✅ |
| Agenda medicului | `IX_Appointments_DoctorId_StartTime (DoctorId, StartTime) INCLUDE (ClinicId, PatientId, StatusId, IsDeleted)` ✅ |
| Consultații azi / în lucru | `IX_Consultations_ClinicId_Date (ClinicId, Date DESC) INCLUDE (PatientId, DoctorId, StatusId, IsDeleted)` ✅ |
| Consultațiile mele | `IX_Consultations_DoctorId_Date` ✅ |
| Încasări zi/lună/trend | `IX_Payments_Clinic_PaidAt (ClinicId, PaidAt DESC) INCLUDE (Amount, IsCancelled)` ✅ — covering complet |
| Facturi lună | `IX_Invoices_Clinic_IssueDate (ClinicId, IssueDate DESC) INCLUDE (Series, Number, Total, StatusId, IsStorno)` ✅ |
| Bonuri de rezolvat | `IX_FiscalReceipts_Clinic_Status` ✅ |
| Rețete ciornă | `IX_Prescriptions_Clinic_Date (ClinicId, CreatedAt DESC) INCLUDE (PatientId, DoctorId, PrescriptionTypeId, StatusId, IssueDate)` ✅ |
| Total/încasat per consultație | `IX_ConsultationServices_Consultation`, `IX_Payments_Consultation (ConsultationId, IsCancelled) INCLUDE (Amount, PaidAt)` ✅ |
| Activitate recentă | `IX_AuditLogs_ClinicId_ChangedAt (ClinicId, ChangedAt DESC) INCLUDE (EntityType, EntityId, Action, ChangedBy)` ✅ |

Lipsuri reale, de acoperit în migrarea `0057`:

| # | Index nou | De ce |
|---|---|---|
| 1 | `IX_Patients_Clinic_CreatedAt ON Patients(ClinicId, CreatedAt DESC) WHERE IsDeleted = 0` | „Pacienți noi (lună)" face azi scan pe `IX_Patients_ClinicId`, care n-are `CreatedAt` nici în cheie, nici în `INCLUDE` |
| 2 | `IX_AnalysesResults_Clinic_ResultDate ON AnalysesResults(ClinicId, ResultDate DESC) INCLUDE (PatientId, ConsultationId, Laboratory, BulletinNumber) WHERE IsDeleted = 0` | „Buletine noi" sortează pe `ResultDate`; indexul existent e pe `(ClinicId, PatientId)` |
| 3 | `IX_Doctors_Clinic_LicenseExpiry ON Doctors(ClinicId, LicenseExpiresAt) WHERE IsDeleted = 0 AND LicenseExpiresAt IS NOT NULL` | „Avize CMR care expiră" — niciun index pe coloană |
| 4 | `IX_Patients_Clinic_InsuranceExpiry ON Patients(ClinicId, InsuranceExpiry) WHERE IsDeleted = 0 AND InsuranceExpiry IS NOT NULL` | „Asigurări expirate" — idem |
| 5 | `IX_Consultations_Clinic_NextVisit ON Consultations(ClinicId, DataUrmatoareiVizite) INCLUDE (PatientId, DoctorId) WHERE IsDeleted = 0 AND DataUrmatoareiVizite IS NOT NULL` | „Reveniri programabile" — coloana vine din 0012, fără index |
| 6 | `IX_SecurityEvents_Clinic_OccurredAt ON SecurityEvents(ClinicId, OccurredAt DESC) INCLUDE (EventType, Succeeded, EmailAttempted, IpAddress)` | Vezi §8.7 |
| 7 | `IX_Users_Clinic_Lockout ON Users(ClinicId, LockoutEnd) WHERE IsDeleted = 0 AND LockoutEnd IS NOT NULL` | „Conturi blocate" — `IX_Users_IsActive` nu ajută |

Toate sunt filtrate (`WHERE`), deci ieftine la scriere: nu ating rândurile care nu satisfac predicatul.
Toate respectă convenția existentă `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = …)`.

### 8.5 Migrarea `0057_DashboardIndexes.sql`

Migrarea **nu creează nicio tabelă**. Dashboard-ul citește exclusiv din ce există. Conține:

```sql
-- =============================================================================
-- Migrare 0057: Indecși pentru agregatele de dashboard
--
-- Dashboard-ul nu introduce entități noi — citește din tabelele existente. Ce
-- lipsea erau indecșii pentru coloanele după care agregă: CreatedAt la pacienți,
-- ResultDate la buletine, datele de expirare la avize/asigurări, DataUrmatoareiVizite,
-- OccurredAt per clinică la evenimente de securitate, LockoutEnd la utilizatori.
--
-- Toți sunt filtrați, deci nu cresc costul de scriere pe rândurile care nu intră
-- în predicat.
-- Rollback: Scripts/Rollback/0057_Rollback_DashboardIndexes.sql
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Patients_Clinic_CreatedAt' AND object_id = OBJECT_ID('dbo.Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_Clinic_CreatedAt
        ON dbo.Patients (ClinicId, CreatedAt DESC)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_AnalysesResults_Clinic_ResultDate' AND object_id = OBJECT_ID('dbo.AnalysesResults'))
    CREATE NONCLUSTERED INDEX IX_AnalysesResults_Clinic_ResultDate
        ON dbo.AnalysesResults (ClinicId, ResultDate DESC)
        INCLUDE (PatientId, ConsultationId, Laboratory, BulletinNumber)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Doctors_Clinic_LicenseExpiry' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_Clinic_LicenseExpiry
        ON dbo.Doctors (ClinicId, LicenseExpiresAt)
        INCLUDE (FirstName, LastName, LicenseNumber)
        WHERE IsDeleted = 0 AND LicenseExpiresAt IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Patients_Clinic_InsuranceExpiry' AND object_id = OBJECT_ID('dbo.Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_Clinic_InsuranceExpiry
        ON dbo.Patients (ClinicId, InsuranceExpiry)
        INCLUDE (FirstName, LastName, PhoneNumber)
        WHERE IsDeleted = 0 AND InsuranceExpiry IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Consultations_Clinic_NextVisit' AND object_id = OBJECT_ID('dbo.Consultations'))
    CREATE NONCLUSTERED INDEX IX_Consultations_Clinic_NextVisit
        ON dbo.Consultations (ClinicId, DataUrmatoareiVizite)
        INCLUDE (PatientId, DoctorId)
        WHERE IsDeleted = 0 AND DataUrmatoareiVizite IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_SecurityEvents_Clinic_OccurredAt' AND object_id = OBJECT_ID('dbo.SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_Clinic_OccurredAt
        ON dbo.SecurityEvents (ClinicId, OccurredAt DESC)
        INCLUDE (EventType, Succeeded, EmailAttempted, IpAddress);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Users_Clinic_Lockout' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE NONCLUSTERED INDEX IX_Users_Clinic_Lockout
        ON dbo.Users (ClinicId, LockoutEnd)
        INCLUDE (FirstName, LastName, Email, FailedLoginAttempts)
        WHERE IsDeleted = 0 AND LockoutEnd IS NOT NULL;
GO

PRINT N'Migrarea 0057_DashboardIndexes finalizata cu succes.';
GO
```

> Notă `DataUrmatoareiVizite`: coloana e adăugată în `0012_Consultations_Extended.sql` prin
> `ALTER TABLE … ADD`. Migrarea 0057 rulează după, deci coloana există. Dacă se decide să nu se
> folosească widget-ul de reveniri, indexul #5 se omite — nu are alt consumator.

### 8.6 `Dashboard_GetClinicalKpis`

Un singur rând de contoare. Toate agregatele sunt `COUNT(*)` peste indecși acoperitori.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetClinicalKpis — contoarele clinice ale zilei
--
-- @Today vine de la handler, nu din SYSDATETIME(): serverul de aplicație și cel
-- de SQL pot fi în fusuri diferite, iar un SP determinist e testabil (vezi §8.2).
-- @OnlyMine = 1 restrânge la medicul legat de @UserId; pentru un cont fără
-- DoctorId rămâne NULL și filtrul nu se aplică.
--
-- Result set: 1 rând, o coloană per contor. Contoarele pe care rolul nu are
-- dreptul să le vadă sunt eliminate în handler, nu aici — SP-ul e același pentru
-- toate rolurile, ca planul de execuție să fie reutilizat din cache.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetClinicalKpis
    @ClinicId  UNIQUEIDENTIFIER,
    @UserId    UNIQUEIDENTIFIER,
    @Today     DATE,
    @OnlyMine  BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow    DATE = DATEADD(DAY, 1, @Today);
    DECLARE @MonthStart  DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
    DECLARE @NextMonth   DATE = DATEADD(MONTH, 1, @MonthStart);
    DECLARE @FollowUpEnd DATE = DATEADD(DAY, 14, @Today);

    DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;
    IF @OnlyMine = 1
        SELECT @DoctorId = u.DoctorId
        FROM dbo.Users u
        WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    SELECT
        -- Programări azi, pe status. NEPREZENTARE și ANULAT nu intră în „azi":
        -- sunt evenimente încheiate, nu lucru rămas.
        AppointmentsToday = (
            SELECT COUNT(*)
            FROM dbo.Appointments a
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
              AND s.Code NOT IN (N'ANULAT', N'NEPREZENTARE')
              AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
        ),
        AppointmentsTodayRemaining = (
            SELECT COUNT(*)
            FROM dbo.Appointments a
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
              AND s.Code IN (N'PROGRAMAT', N'CONFIRMAT')
              AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
        ),
        ConsultationsToday = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND c.Date >= @Today AND c.Date < @Tomorrow
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
        ),
        -- „În lucru" nu e limitat la azi: o consultație lăsată deschisă ieri e
        -- exact lucrul pe care dashboard-ul trebuie să-l scoată la suprafață.
        ConsultationsOpen = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND s.Code = N'INLUCRU'
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
        ),
        -- Reveniri: consultații cu dată de revenire în următoarele 14 zile pentru
        -- care pacientul nu are deja o programare viitoare.
        FollowUpsDue = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND c.DataUrmatoareiVizite IS NOT NULL
              AND c.DataUrmatoareiVizite >= @Today
              AND c.DataUrmatoareiVizite <  @FollowUpEnd
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
              AND NOT EXISTS (
                    SELECT 1 FROM dbo.Appointments a
                    INNER JOIN dbo.AppointmentStatuses asx ON asx.Id = a.StatusId
                    WHERE a.PatientId = c.PatientId
                      AND a.ClinicId  = @ClinicId
                      AND a.IsDeleted = 0
                      AND a.StartTime >= @Today
                      AND asx.Code IN (N'PROGRAMAT', N'CONFIRMAT'))
        ),
        PatientsNewThisMonth = (
            SELECT COUNT(*)
            FROM dbo.Patients p
            WHERE p.ClinicId = @ClinicId
              AND p.IsDeleted = 0
              AND p.CreatedAt >= @MonthStart AND p.CreatedAt < @NextMonth
        ),
        PrescriptionsDraft = (
            SELECT COUNT(*)
            FROM dbo.Prescriptions pr
            INNER JOIN dbo.PrescriptionStatuses ps ON ps.Id = pr.StatusId
            WHERE pr.ClinicId = @ClinicId
              AND pr.IsDeleted = 0
              AND ps.Code = N'CIORNA'
              AND (@DoctorId IS NULL OR pr.DoctorId = @DoctorId)
        ),
        -- Rețete compensate respinse la transmitere către SIPE — lucru de refăcut.
        PrescriptionsWithTransmissionError = (
            SELECT COUNT(*)
            FROM dbo.Prescriptions pr
            WHERE pr.ClinicId = @ClinicId
              AND pr.IsDeleted = 0
              AND pr.TransmissionError IS NOT NULL
              AND (@DoctorId IS NULL OR pr.DoctorId = @DoctorId)
        );
END;
GO
```

> Formă: subinterogări scalare corelate într-un singur `SELECT`, nu opt `SELECT`-uri separate. Un
> singur result set, un singur rând → maparea Dapper e un `QueryFirstAsync<DashboardClinicalKpisDto>`,
> iar adăugarea unui contor nu deplasează nimic în C#.

### 8.7 `Dashboard_GetAgenda` — trei liste, cu gardă pe datele clinice

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetAgenda — listele zilei
--
-- @IncludeClinical = 0 întoarce NULL în locul câmpurilor clinice. Recepția
-- (consultations = None) primește agenda fără motivul consultației și fără
-- diagnostic. Filtrarea e AICI, nu în componenta React: ce nu iese din SQL nu
-- poate fi citit din răspunsul HTTP.
--
-- Result sets:
--   1) Agenda zilei (max @Top)
--   2) Consultații în lucru (max @Top)
--   3) Buletine de analize noi (max @Top)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetAgenda
    @ClinicId        UNIQUEIDENTIFIER,
    @UserId          UNIQUEIDENTIFIER,
    @Today           DATE,
    @OnlyMine        BIT = 0,
    @IncludeClinical BIT = 0,
    @Top             INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
    DECLARE @LabSince DATE = DATEADD(DAY, -7, @Today);

    DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;
    IF @OnlyMine = 1
        SELECT @DoctorId = u.DoctorId
        FROM dbo.Users u
        WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    -- ── 1. Agenda zilei ─────────────────────────────────────────────────────
    SELECT TOP (@Top)
        a.Id,
        a.StartTime,
        a.EndTime,
        a.PatientId,
        PatientName  = CONCAT(p.LastName, N' ', p.FirstName),
        PatientPhone = p.PhoneNumber,
        a.DoctorId,
        DoctorName   = CONCAT(d.LastName, N' ', d.FirstName),
        StatusCode   = s.Code,
        StatusName   = s.Name,
        -- Notes e text liber introdus de recepție la programare: nu e câmp clinic
        -- structurat, dar poate conține orice, deci urmează aceeași gardă.
        Notes        = CASE WHEN @IncludeClinical = 1 THEN a.Notes ELSE NULL END,
        -- Consultația deschisă din această programare, dacă există: butonul
        -- „continuă consultația" din agendă are nevoie de id, nu de conținut.
        ConsultationId       = cons.Id,
        ConsultationStatusCode = cons.StatusCode
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p              ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d               ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s   ON s.Id = a.StatusId
    OUTER APPLY (
        SELECT TOP (1) c.Id, cs.Code AS StatusCode
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
        WHERE c.AppointmentId = a.Id AND c.IsDeleted = 0
        ORDER BY c.Date DESC
    ) cons
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
    ORDER BY a.StartTime;

    -- ── 2. Consultații în lucru ─────────────────────────────────────────────
    -- Result set-ul e emis întotdeauna, chiar gol: numărul de result sets e fix,
    -- ca citirea pozițională din Dapper să nu depindă de parametri (§8.1).
    SELECT TOP (@Top)
        c.Id,
        c.Date,
        c.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        c.DoctorId,
        DoctorName  = CONCAT(d.LastName, N' ', d.FirstName),
        Diagnostic  = CASE WHEN @IncludeClinical = 1 THEN c.Diagnostic ELSE NULL END,
        Motiv       = CASE WHEN @IncludeClinical = 1 THEN c.Motiv      ELSE NULL END,
        -- Vechimea unei consultații lăsate deschise e semnalul util, nu data ei.
        DaysOpen    = DATEDIFF(DAY, CAST(c.Date AS DATE), @Today)
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors d              ON d.Id = c.DoctorId
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND s.Code = N'INLUCRU'
      AND @IncludeClinical = 1          -- lista nu are sens fără date clinice
      AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
    ORDER BY c.Date;                     -- cele mai vechi primele

    -- ── 3. Buletine de analize din ultimele 7 zile ──────────────────────────
    SELECT TOP (@Top)
        r.Id,
        r.ResultDate,
        r.CollectionDate,
        r.PatientId,
        PatientName    = CONCAT(p.LastName, N' ', p.FirstName),
        r.Laboratory,
        r.BulletinNumber,
        r.ConsultationId,
        -- Câte valori ies din intervalul de referință: sortarea după acest număr
        -- pune primul buletinul care cere atenție.
        AbnormalCount  = ISNULL(fl.Cnt, 0)
    FROM dbo.AnalysesResults r
    INNER JOIN dbo.Patients p ON p.Id = r.PatientId
    OUTER APPLY (
        SELECT COUNT(*) AS Cnt
        FROM dbo.AnalysesResultDetails ard
        WHERE ard.ResultId = r.Id
          AND ard.IsDeleted = 0
          AND ard.Flag IN (N'HIGH', N'LOW', N'CHECK')
    ) fl
    WHERE r.ClinicId = @ClinicId
      AND r.IsDeleted = 0
      AND r.ResultDate >= @LabSince
      AND @IncludeClinical = 1
      -- Medicul vede buletinele pacienților pe care i-a consultat el.
      AND (@DoctorId IS NULL OR EXISTS (
            SELECT 1 FROM dbo.Consultations c
            WHERE c.PatientId = r.PatientId
              AND c.ClinicId  = @ClinicId
              AND c.DoctorId  = @DoctorId
              AND c.IsDeleted = 0))
    ORDER BY ISNULL(fl.Cnt, 0) DESC, r.ResultDate DESC;
END;
GO
```

### 8.8 `Dashboard_GetFinancialKpis`

Reutilizează integral logica de calcul a statusului de plată din `ConsultationBilling_GetPaged`
(`Total` din `ConsultationServices`, `Paid` din `Payments` necancelate, `NEPLATIT/PARTIAL/PLATIT`), ca
dashboard-ul și pagina de încasări să nu poată arăta cifre diferite.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetFinancialKpis
--
-- Statusul de plată e calculat identic cu ConsultationBilling_GetPaged (total din
-- servicii vs. încasat din plăți necancelate). Dacă regula se schimbă, se schimbă
-- în ambele locuri — altfel dashboard-ul și pagina de încasări arată alte cifre
-- pentru aceeași zi.
--
-- Nicio coloană clinică: modulul de acces e payments, la fel ca la BillingController.
--
-- Result sets:
--   1) contoare (1 rând)
--   2) de încasat (top @Top)
--   3) bonuri fiscale care cer intervenție (top @Top)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetFinancialKpis
    @ClinicId UNIQUEIDENTIFIER,
    @Today    DATE,
    @Top      INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow   DATE = DATEADD(DAY, 1, @Today);
    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
    DECLARE @NextMonth  DATE = DATEADD(MONTH, 1, @MonthStart);
    DECLARE @IssuedStatusId UNIQUEIDENTIFIER = 'F4000000-0000-0000-0000-000000000001';

    -- Baza de facturare: aceleași statusuri ca la recepție (FINALIZATA, FACTURATA).
    -- O consultație în lucru nu e de încasat — încă se lucrează la ea.
    SELECT
        c.Id AS ConsultationId,
        c.Date,
        c.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        Total = ISNULL(t.Total, 0),
        Paid  = ISNULL(pd.Paid, 0)
    INTO #Billable
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    OUTER APPLY (SELECT SUM(cs.LineTotal) AS Total FROM dbo.ConsultationServices cs
                 WHERE cs.ConsultationId = c.Id AND cs.IsDeleted = 0) t
    OUTER APPLY (SELECT SUM(pay.Amount) AS Paid FROM dbo.Payments pay
                 WHERE pay.ConsultationId = c.Id AND pay.IsCancelled = 0) pd
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND s.Code IN (N'FINALIZATA', N'FACTURATA');

    -- ── 1. Contoare ─────────────────────────────────────────────────────────
    SELECT
        RevenueToday = (
            SELECT ISNULL(SUM(pay.Amount), 0)
            FROM dbo.Payments pay
            WHERE pay.ClinicId = @ClinicId
              AND pay.IsCancelled = 0
              AND pay.PaidAt >= @Today AND pay.PaidAt < @Tomorrow
        ),
        RevenueThisMonth = (
            SELECT ISNULL(SUM(pay.Amount), 0)
            FROM dbo.Payments pay
            WHERE pay.ClinicId = @ClinicId
              AND pay.IsCancelled = 0
              AND pay.PaidAt >= @MonthStart AND pay.PaidAt < @NextMonth
        ),
        -- Facturile storno au Total negativ prin construcție (vezi InvoiceStatsDto.
        -- NetTotalValue): suma simplă e deja valoarea netă.
        InvoicesThisMonthCount = (
            SELECT COUNT(*)
            FROM dbo.Invoices i
            WHERE i.ClinicId = @ClinicId
              AND i.IssueDate >= @MonthStart AND i.IssueDate < @NextMonth
        ),
        InvoicesThisMonthNetTotal = (
            SELECT ISNULL(SUM(i.Total), 0)
            FROM dbo.Invoices i
            WHERE i.ClinicId = @ClinicId
              AND i.IssueDate >= @MonthStart AND i.IssueDate < @NextMonth
              AND i.StatusId = @IssuedStatusId
        ),
        UnpaidCount        = (SELECT COUNT(*)            FROM #Billable WHERE Paid <= 0     AND Total > 0),
        PartialCount       = (SELECT COUNT(*)            FROM #Billable WHERE Paid > 0      AND Paid < Total),
        OutstandingTotal   = (SELECT ISNULL(SUM(Total - Paid), 0) FROM #Billable WHERE Total > Paid),
        ReceiptsNeedingAttentionCount = (
            SELECT COUNT(*)
            FROM dbo.FiscalReceipts r
            INNER JOIN dbo.FiscalReceiptStatuses rs ON rs.Id = r.StatusId
            WHERE r.ClinicId = @ClinicId
              AND rs.Code IN (N'PENDING', N'PRINTING', N'FAILED', N'UNKNOWN')
        );

    -- ── 2. De încasat — cele mai vechi restanțe primele ─────────────────────
    SELECT TOP (@Top)
        ConsultationId, Date, PatientId, PatientName, Total, Paid,
        Balance       = Total - Paid,
        PaymentStatus = CASE WHEN Paid <= 0 THEN N'NEPLATIT' ELSE N'PARTIAL' END
    FROM #Billable
    WHERE Total > 0 AND Total > Paid
    ORDER BY Date;

    -- ── 3. Bonuri fiscale de rezolvat ───────────────────────────────────────
    SELECT TOP (@Top)
        r.Id,
        r.ConsultationId,
        StatusCode = rs.Code,
        StatusName = rs.Name,
        r.CreatedAt,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName)
    FROM dbo.FiscalReceipts r
    INNER JOIN dbo.FiscalReceiptStatuses rs ON rs.Id = r.StatusId
    INNER JOIN dbo.Consultations c          ON c.Id = r.ConsultationId
    INNER JOIN dbo.Patients p               ON p.Id = c.PatientId
    WHERE r.ClinicId = @ClinicId
      AND rs.Code IN (N'PENDING', N'PRINTING', N'FAILED', N'UNKNOWN')
    ORDER BY r.CreatedAt;

    DROP TABLE #Billable;
END;
GO
```

> `#Billable` e materializat o dată și citit de trei ori — același motiv pentru care
> `ConsultationBilling_GetPaged` folosește `#Rows`: statusul de plată e un calcul, nu o coloană, și
> recalcularea lui în trei subinterogări ar tripla costul.
>
> ⚠️ **Risc de scalare**: `#Billable` conține **toate** consultațiile finalizate/facturate ale clinicii,
> din totdeauna. Precedentul există deja în `ConsultationBilling_GetPaged`, dar acolo utilizatorul
> poate filtra pe perioadă; aici e un dashboard care se încarcă la fiecare deschidere. Vezi §16/D5:
> propun `@BillableSince DATE` (implicit: `DATEADD(MONTH, -6, @Today)`) — restanțele mai vechi de
> 6 luni nu sunt lucru de zi, sunt subiect de raport.

### 8.9 `Dashboard_GetTrends` — patru serii pentru manager

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetTrends — serii pentru graficele de management
--
-- Seriile sunt completate cu zilele fără activitate (LEFT JOIN pe un calendar
-- generat): un grafic care sare peste zilele de zero minte despre formă.
--
-- Result sets:
--   1) încasări / zi
--   2) programări / zi, pe status
--   3) rată neprezentare pe perioadă (1 rând)
--   4) încărcare pe medic
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetTrends
    @ClinicId UNIQUEIDENTIFIER,
    @Today    DATE,
    @Days     INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Days < 1   SET @Days = 1;
    IF @Days > 180 SET @Days = 180;   -- plafon: seria e desenată, nu exportată

    DECLARE @From DATE = DATEADD(DAY, -(@Days - 1), @Today);
    DECLARE @To   DATE = DATEADD(DAY, 1, @Today);

    -- Calendar de @Days zile din ROW_NUMBER peste sys.all_objects: nu cere o
    -- tabelă de calendar în schemă și e suficient pentru <= 180 rânduri.
    ;WITH Days AS (
        SELECT TOP (@Days)
            D = DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1, @From)
        FROM sys.all_objects
    )
    SELECT
        d.D                       AS [Date],
        Amount      = ISNULL(pay.Amount, 0),
        PaymentCount = ISNULL(pay.Cnt, 0)
    INTO #Revenue
    FROM Days d
    LEFT JOIN (
        SELECT CAST(p.PaidAt AS DATE) AS D, SUM(p.Amount) AS Amount, COUNT(*) AS Cnt
        FROM dbo.Payments p
        WHERE p.ClinicId = @ClinicId
          AND p.IsCancelled = 0
          AND p.PaidAt >= @From AND p.PaidAt < @To
        GROUP BY CAST(p.PaidAt AS DATE)
    ) pay ON pay.D = d.D;

    SELECT [Date], Amount, PaymentCount FROM #Revenue ORDER BY [Date];

    -- ── 2. Programări / zi ──────────────────────────────────────────────────
    ;WITH Days AS (
        SELECT TOP (@Days)
            D = DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1, @From)
        FROM sys.all_objects
    )
    SELECT
        d.D AS [Date],
        TotalCount     = ISNULL(ap.Total, 0),
        CompletedCount = ISNULL(ap.Completed, 0),
        CancelledCount = ISNULL(ap.Cancelled, 0),
        NoShowCount    = ISNULL(ap.NoShow, 0)
    FROM Days d
    LEFT JOIN (
        SELECT
            CAST(a.StartTime AS DATE) AS D,
            COUNT(*) AS Total,
            SUM(CASE WHEN s.Code = N'FINALIZAT'    THEN 1 ELSE 0 END) AS Completed,
            SUM(CASE WHEN s.Code = N'ANULAT'       THEN 1 ELSE 0 END) AS Cancelled,
            SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END) AS NoShow
        FROM dbo.Appointments a
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND a.StartTime >= @From AND a.StartTime < @To
        GROUP BY CAST(a.StartTime AS DATE)
    ) ap ON ap.D = d.D
    ORDER BY d.D;

    -- ── 3. Rată neprezentare ────────────────────────────────────────────────
    -- Numitorul e „programări care au ajuns la termen", adică fără cele anulate:
    -- o anulare cu 3 zile înainte nu e o neprezentare.
    SELECT
        TotalScheduled = COUNT(*),
        NoShowCount    = SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END),
        NoShowRate     = CASE WHEN COUNT(*) = 0 THEN 0.0
                              ELSE CAST(SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END) AS DECIMAL(9,4))
                                   / COUNT(*) END
    FROM dbo.Appointments a
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime >= @From AND a.StartTime < @To
      AND s.Code <> N'ANULAT';

    -- ── 4. Încărcare pe medic ───────────────────────────────────────────────
    SELECT
        d.Id AS DoctorId,
        DoctorName    = CONCAT(d.LastName, N' ', d.FirstName),
        SpecialtyName = sp.Name,
        AppointmentCount = COUNT(a.Id),
        CompletedCount   = SUM(CASE WHEN ast.Code = N'FINALIZAT'    THEN 1 ELSE 0 END),
        NoShowCount      = SUM(CASE WHEN ast.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END),
        -- Minute programate: proxy pentru încărcare, mai onest decât numărul de
        -- programări (o bronhoscopie nu e echivalentă cu un control de 10 minute).
        ScheduledMinutes = ISNULL(SUM(DATEDIFF(MINUTE, a.StartTime, a.EndTime)), 0)
    FROM dbo.Doctors d
    LEFT  JOIN dbo.Appointments a ON a.DoctorId = d.Id
                                 AND a.ClinicId = @ClinicId
                                 AND a.IsDeleted = 0
                                 AND a.StartTime >= @From AND a.StartTime < @To
    LEFT  JOIN dbo.AppointmentStatuses ast ON ast.Id = a.StatusId
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId AND sp.IsDeleted = 0
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND d.IsActive = 1
    GROUP BY d.Id, d.LastName, d.FirstName, sp.Name
    ORDER BY ScheduledMinutes DESC, DoctorName;

    DROP TABLE #Revenue;
END;
GO
```

> `@Days` e plafonat în SP, nu doar validat în FluentValidation. Validatorul protejează API-ul; plafonul
> din SP protejează baza de date de orice alt apelant (un test de integrare, un script manual).
>
> `#Revenue` e materializat pentru ca `Days` să nu fie recalculat — CTE-urile nu sunt materializate în
> SQL Server, iar acelaşi `TOP (@Days) FROM sys.all_objects` apare de două ori.

### 8.10 `Dashboard_GetOperationalHealth` — cinci liste pentru admin

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetOperationalHealth
--
-- @SinceUtc e separat de @Today pentru că SecurityEvents.OccurredAt e singura
-- coloană de timp în UTC din schemă (SYSUTCDATETIME în 0044) — restul folosesc
-- ora locală. Un filtru local pe o coloană UTC decalează fereastra cu 2-3 ore.
--
-- Result sets:
--   1) evenimente de securitate recente
--   2) conturi blocate
--   3) avize CMR care expiră
--   4) asigurări de pacient expirate / care expiră
--   5) prospețimea nomenclatoarelor
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetOperationalHealth
    @ClinicId   UNIQUEIDENTIFIER,
    @Today      DATE,
    @SinceUtc   DATETIME2(0),
    @ExpiryDays INT = 60,
    @Top        INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ExpiryLimit DATE = DATEADD(DAY, @ExpiryDays, @Today);

    -- ── 1. Securitate ───────────────────────────────────────────────────────
    -- ClinicId e NULL-abil în SecurityEvents (0044): un login eșuat cu email
    -- necunoscut nu are clinică de atribuit. Acele rânduri sunt exact cele care
    -- interesează un admin, deci se includ explicit — nu prin omisiunea filtrului.
    SELECT TOP (@Top)
        se.Id,
        se.EventType,
        se.Succeeded,
        se.OccurredAt,
        se.EmailAttempted,
        se.IpAddress,
        UserFullName = CASE WHEN u.Id IS NULL THEN NULL
                            ELSE CONCAT(u.LastName, N' ', u.FirstName) END
    FROM dbo.SecurityEvents se
    LEFT JOIN dbo.Users u ON u.Id = se.UserId
    WHERE se.OccurredAt >= @SinceUtc
      AND (se.ClinicId = @ClinicId OR se.ClinicId IS NULL)
      AND se.Succeeded = 0            -- succesele sunt zgomot pe un dashboard
    ORDER BY se.OccurredAt DESC;

    -- ── 2. Conturi blocate ──────────────────────────────────────────────────
    SELECT TOP (@Top)
        u.Id,
        FullName = CONCAT(u.LastName, N' ', u.FirstName),
        u.Email,
        u.LockoutEnd,
        u.FailedLoginAttempts,
        u.LastLoginAt
    FROM dbo.Users u
    WHERE u.ClinicId = @ClinicId
      AND u.IsDeleted = 0
      AND u.LockoutEnd IS NOT NULL
      AND u.LockoutEnd > SYSDATETIME()   -- doar blocările active
    ORDER BY u.LockoutEnd DESC;

    -- ── 3. Avize CMR ────────────────────────────────────────────────────────
    -- Include și cele deja expirate (DaysLeft negativ): un aviz expirat e o
    -- problemă mai mare decât unul care expiră peste o lună.
    SELECT TOP (@Top)
        d.Id AS DoctorId,
        DoctorName = CONCAT(d.LastName, N' ', d.FirstName),
        d.LicenseNumber,
        d.LicenseExpiresAt,
        DaysLeft = DATEDIFF(DAY, @Today, d.LicenseExpiresAt)
    FROM dbo.Doctors d
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND d.IsActive = 1
      AND d.LicenseExpiresAt IS NOT NULL
      AND d.LicenseExpiresAt < @ExpiryLimit
    ORDER BY d.LicenseExpiresAt;

    -- ── 4. Asigurări de pacient ─────────────────────────────────────────────
    -- Restrâns la pacienții cu activitate recentă: o asigurare expirată la un
    -- pacient care n-a mai venit de 3 ani nu e o acțiune de făcut azi.
    SELECT TOP (@Top)
        p.Id AS PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        p.PhoneNumber,
        p.InsuranceNumber,
        p.InsuranceExpiry,
        DaysLeft = DATEDIFF(DAY, @Today, p.InsuranceExpiry)
    FROM dbo.Patients p
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND p.InsuranceExpiry IS NOT NULL
      AND p.InsuranceExpiry < @ExpiryLimit
      AND EXISTS (
            SELECT 1 FROM dbo.Appointments a
            WHERE a.PatientId = p.Id
              AND a.ClinicId  = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= DATEADD(MONTH, -12, @Today))
    ORDER BY p.InsuranceExpiry;

    -- ── 5. Prospețimea nomenclatoarelor ─────────────────────────────────────
    -- Ambele tabele de log sunt globale (nomenclatoarele ANM/CNAS nu sunt per
    -- clinică), deci nu se filtrează pe ClinicId — singura excepție acceptată
    -- de la R1, pentru date de referință naționale.
    SELECT Source = N'ANM',  LastSyncAt = (SELECT MAX(sl.CreatedAt) FROM dbo.Anm_SyncLog sl)
    UNION ALL
    SELECT Source = N'CNAS', LastSyncAt = (SELECT MAX(sl.CreatedAt) FROM dbo.NomenclatorSyncLog sl);
END;
GO
```

> ⚠️ Coloanele exacte din `Anm_SyncLog` / `NomenclatorSyncLog` (nume, `CreatedAt` vs `SyncedAt`,
> `Status`) trebuie verificate la implementare împotriva 0026/0030 — au fost inventariate ca **surse**,
> nu citite coloană cu coloană. Result set-ul 5 e singurul din documentul acesta cu forma neconfirmată.

### 8.11 Costuri estimate

| SP | Interogări | Formă de acces așteptată | Risc |
|---|---|---|---|
| `Dashboard_GetClinicalKpis` | 8 `COUNT` | seek + range scan pe indecși acoperitori | `FollowUpsDue` are `NOT EXISTS` corelat pe `Appointments` — cel mai scump contor; indexul #5 + `IX_Appointments_PatientId` îl acoperă |
| `Dashboard_GetAgenda` | 3 liste `TOP` | range scan pe `(ClinicId, StartTime)` + `OUTER APPLY TOP(1)` | scăzut — fereastră de o zi |
| `Dashboard_GetFinancialKpis` | `#Billable` + 3 | **scan pe toate consultațiile facturabile** | **mediu-mare** — vezi §16/D5 |
| `Dashboard_GetTrends` | 4, cu `GROUP BY` pe 30 zile | range scan pe indecși acoperitori (`IX_Payments_Clinic_PaidAt` are `Amount` în `INCLUDE`) | scăzut la 30 zile, crește liniar cu `@Days` |
| `Dashboard_GetOperationalHealth` | 5 liste `TOP` | seek pe indecșii noi | `SecurityEvents` fără indexul #6 → scan pe tot istoricul de securitate |

Recomandare de verificare la implementare: `SET STATISTICS IO, TIME ON` pe fiecare SP, cu un set de
date de volum realist (≥ 50 000 consultații), și `sys.dm_db_missing_index_details` după o rulare.

---

## 9. Backend — slice-ul `Features/Dashboard`

### 9.1 Fișiere

```
src/ValyanClinic.Application/Features/Dashboard/
├── Queries/
│   └── GetDashboard/
│       ├── GetDashboardQuery.cs                 ← IRequest<Result<DashboardDto>>
│       ├── GetDashboardQueryHandler.cs
│       └── GetDashboardQueryValidator.cs        ← doar @Days / @Top
├── DTOs/
│   ├── DashboardDto.cs                          ← { generatedAt, widgetIds[], secțiuni opționale }
│   ├── DashboardClinicalKpisDto.cs
│   ├── DashboardAgendaItemDto.cs
│   ├── DashboardOpenConsultationDto.cs
│   ├── DashboardLabResultDto.cs
│   ├── DashboardFinancialKpisDto.cs
│   ├── DashboardUnpaidItemDto.cs
│   ├── DashboardReceiptIssueDto.cs
│   ├── DashboardRevenuePointDto.cs
│   ├── DashboardAppointmentPointDto.cs
│   ├── DashboardNoShowDto.cs
│   ├── DashboardDoctorWorkloadDto.cs
│   ├── DashboardSecurityEventDto.cs
│   ├── DashboardLockedUserDto.cs
│   ├── DashboardExpiringLicenseDto.cs
│   ├── DashboardExpiringInsuranceDto.cs
│   └── DashboardSyncFreshnessDto.cs
└── Widgets/
    ├── DashboardWidgetIds.cs                    ← constante string
    ├── DashboardWidgetCatalog.cs                ← WidgetId → (modul, nivel, bundle)
    └── DashboardPresets.cs                      ← RoleCode → WidgetId[] ordonat

src/ValyanClinic.Application/Common/Interfaces/IDashboardRepository.cs
src/ValyanClinic.Application/Common/Interfaces/IEffectivePermissions.cs   ← §9.3 (refactorizare)
src/ValyanClinic.Infrastructure/Authentication/CachedEffectivePermissions.cs
src/ValyanClinic.Infrastructure/Data/Repositories/DashboardRepository.cs
src/ValyanClinic.Infrastructure/Data/StoredProcedures/DashboardProcedures.cs
src/ValyanClinic.Infrastructure/DependencyInjection.cs          ← AddScoped
src/ValyanClinic.API/Controllers/DashboardController.cs

src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0057_DashboardIndexes.sql
src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/
├── Dashboard_GetClinicalKpis.sql
├── Dashboard_GetAgenda.sql
├── Dashboard_GetFinancialKpis.sql
├── Dashboard_GetTrends.sql
└── Dashboard_GetOperationalHealth.sql
```

### 9.2 Catalogul și preset-urile ca cod

```csharp
// Features/Dashboard/Widgets/DashboardWidgetCatalog.cs
public enum DashboardBundle { Clinical, Agenda, Financial, Trend, Health }

/// <summary>
/// Cerința de acces a unui widget. Lista de module are semantica AND, identică
/// cu ROUTE_MODULES din client (moduleAccess.ts): widget-ul se randează doar dacă
/// utilizatorul are nivelul cerut pe TOATE modulele enumerate.
/// </summary>
public sealed record DashboardWidgetSpec(
    string Id,
    DashboardBundle Bundle,
    AccessLevel RequiredLevel,
    params string[] RequiredModules);

public static class DashboardWidgetCatalog
{
    public static readonly IReadOnlyDictionary<string, DashboardWidgetSpec> All =
        new DashboardWidgetSpec[]
        {
            new(DashboardWidgetIds.KpiAppointmentsToday, DashboardBundle.Clinical,
                AccessLevel.Read, ModuleCodes.Appointments),
            new(DashboardWidgetIds.KpiConsultationsOpen, DashboardBundle.Clinical,
                AccessLevel.Read, ModuleCodes.Consultations),
            new(DashboardWidgetIds.ListAgendaToday, DashboardBundle.Agenda,
                AccessLevel.Read, ModuleCodes.Appointments),
            new(DashboardWidgetIds.ListUnpaid, DashboardBundle.Financial,
                AccessLevel.Read, ModuleCodes.Payments),
            new(DashboardWidgetIds.PanelDoctorWorkload, DashboardBundle.Trend,
                AccessLevel.Read, ModuleCodes.Appointments, ModuleCodes.Users),
            new(DashboardWidgetIds.ListSecurityEvents, DashboardBundle.Health,
                AccessLevel.Read, ModuleCodes.Audit),
            // ... restul din §6
        }.ToDictionary(w => w.Id);
}
```

```csharp
// Features/Dashboard/Widgets/DashboardPresets.cs
/// <summary>
/// Ce widget-uri vede fiecare rol implicit, în ordinea de afișare — ordinea din
/// array E ordinea din pagină, exact ca la UserMenuPreferences.FavoriteRoutes.
///
/// Preset-ul e o SUGESTIE, nu o autorizare: filtrarea pe permisiunile efective
/// se face după, în handler. Un preset care conține un widget la care rolul nu are
/// drept nu e o breșă — widget-ul dispare din răspuns.
///
/// Un rol nou cere un rând aici. Rolurile necunoscute primesc DefaultPreset.
/// </summary>
public static class DashboardPresets
{
    public static readonly IReadOnlyList<string> DefaultPreset =
    [
        DashboardWidgetIds.KpiAppointmentsToday,
        DashboardWidgetIds.ListAgendaToday,
    ];

    private static readonly Dictionary<string, IReadOnlyList<string>> ByRole = new()
    {
        [Roles.Doctor] =
        [
            DashboardWidgetIds.KpiAppointmentsToday,
            DashboardWidgetIds.KpiConsultationsOpen,
            DashboardWidgetIds.KpiFollowUpsDue,
            DashboardWidgetIds.KpiPrescriptionsDraft,
            DashboardWidgetIds.ListAgendaToday,
            DashboardWidgetIds.ListConsultationsOpen,
            DashboardWidgetIds.ListLabResultsNew,
        ],
        // ... nurse, receptionist, clinic_manager, admin — §7
    };

    public static IReadOnlyList<string> For(string roleCode) =>
        ByRole.TryGetValue(roleCode, out var preset) ? preset : DefaultPreset;
}
```

> `Roles.cs` avertizează explicit că valorile sunt lowercase și că potrivirea claim-urilor e ordinală și
> case-sensitive. `ByRole` trebuie construit cu `StringComparer.Ordinal` (comportamentul implicit al
> `Dictionary<string,…>`) și cheile luate **din `Roles.*`**, niciodată din literale.

### 9.3 Handler-ul

#### Sursa permisiunilor: cache-ul existent, nu un apel nou

Există deja infrastructură pentru asta și **nu trebuie ocolită**. `ModuleAccessAuthorizationHandler`
(`Infrastructure/Authentication/`) ține în `IMemoryCache` un `Dictionary<string,int>`
(`moduleCode → accessLevel`) per utilizator, sub cheia `PermissionCacheKeys.ForUser(userId, version)`,
cu `Ttl = 5 min` și invalidare prin incrementarea unei versiuni globale la orice modificare de
permisiuni. Cache-ul e **pre-populat la login și la refresh**.

Consecința e elegantă: `[HasAccess(dashboard, Read)]` rulează **înaintea** handler-ului și trece
obligatoriu prin acel cache. Deci în momentul în care handler-ul pornește, dicționarul e **garantat
cald** — citirea lui costă zero apeluri la BD.

Recomandare: un serviciu subțire `IEffectivePermissions` în `Application/Common/Interfaces`, cu
implementarea în `Infrastructure` care citește exact aceeași cheie de cache (fallback la
`IPermissionRepository.GetEffectiveByUserAsync` pe cache miss). Astfel:

- `ModuleAccessAuthorizationHandler` și handler-ul de dashboard folosesc **o singură** sursă de adevăr;
- un `Dictionary` cu 17 module citit din memorie nu adaugă latență la o pagină deja cu 5 SP-uri;
- `IPermissionRepository` nu ajunge injectat direct în handler-e de feature, ceea ce ar normaliza
  ocolirea cache-ului.

Alternativa „injectez `IPermissionRepository` direct" funcționează, dar adaugă un round-trip inutil
la fiecare încărcare de dashboard și duplică logica de cache — exact tipul de divergență semnalat în
comentariul din `Permission_GetEffectiveByUser` (un `INNER JOIN` greșit care făcea override-urile să
dispară tăcut).

#### Handler-ul

```csharp
public sealed class GetDashboardQueryHandler(
    IDashboardRepository repository,
    IEffectivePermissions permissions,   // citește cache-ul deja cald (vezi mai sus)
    ICurrentUser currentUser,
    TimeProvider timeProvider)
    : IRequestHandler<GetDashboardQuery, Result<DashboardDto>>
{
    public async Task<Result<DashboardDto>> Handle(
        GetDashboardQuery request, CancellationToken cancellationToken)
    {
        // 1. Permisiunile efective — aceeași sursă ca la login/refresh și ca la
        //    [HasAccess], deci override-urile per utilizator se aplică fără cod dedicat.
        //    Atributul de pe endpoint a încălzit deja cache-ul: zero DB call aici.
        var levels = await permissions.GetLevelsAsync(
            currentUser.Id, currentUser.RoleId, cancellationToken);

        bool Allowed(DashboardWidgetSpec w) =>
            w.RequiredModules.All(m =>
                levels.TryGetValue(m, out var lvl) && lvl >= (int)w.RequiredLevel);

        // 2. Preset ∩ permisiuni, cu ordinea din preset păstrată.
        var widgets = DashboardPresets.For(currentUser.Role)
            .Select(id => DashboardWidgetCatalog.All[id])
            .Where(Allowed)
            .ToList();

        if (widgets.Count == 0)
            return Result<DashboardDto>.Success(DashboardDto.Empty);

        // 3. Parametrii derivați din permisiuni, NU din request — clientul nu poate
        //    cere date clinice prin flag, iar un medic nu poate cere agenda altcuiva.
        var bundles = widgets.Select(w => w.Bundle).Distinct().ToHashSet();
        var today = DateOnly.FromDateTime(timeProvider.GetLocalNow().DateTime);
        var includeClinical = levels.GetValueOrDefault(ModuleCodes.Consultations) >= (int)AccessLevel.Read;
        var onlyMine = currentUser.IsInRole(Roles.Doctor);

        var data = await repository.GetAsync(
            currentUser.ClinicId, currentUser.Id, today,
            bundles, onlyMine, includeClinical, request.TrendDays, cancellationToken);

        // 4. Compunerea. `WidgetIds` dă doar ORDINEA; secțiunile sunt proprietăți
        //    opționale puternic tipizate, nu un `payload` polimorf — altfel
        //    schema.d.ts generat ajunge la `unknown` și tsc nu mai prinde nimic
        //    (vezi §14, punctul 1).
        return Result<DashboardDto>.Success(new DashboardDto
        {
            GeneratedAt    = timeProvider.GetUtcNow(),
            WidgetIds      = widgets.Select(w => w.Id).ToList(),
            ClinicalKpis   = data.ClinicalKpis,      // null dacă bundle-ul n-a rulat
            Agenda         = data.Agenda,
            FinancialKpis  = data.FinancialKpis,
            Trends         = data.Trends,
            Health         = data.Health,
        });
    }
}
```

Trei aspecte care nu sunt detalii:

1. **`includeClinical` și `onlyMine` se derivă pe server.** Nu sunt parametri de query. Dacă ar fi, un
   `receptionist` ar putea trimite `?includeClinical=true`. Regula e: *tot ce restrânge datele se
   calculează din `ICurrentUser` + permisiuni; doar ce e pur cosmetic (`trendDays`) vine din request.*
2. **`TimeProvider`** (din .NET 8+) în loc de `DateTime.Now`: „azi" devine injectabil, deci testabil
   (§13). Trebuie înregistrat: `services.AddSingleton(TimeProvider.System)`.
3. **`onlyMine = IsInRole(Roles.Doctor)`** este prima excepție la principiul „nu ramifica pe rol", și e
   deliberată: nu e o decizie de *autorizare* (ce poate vedea), ci de *relevanță* (ce îl interesează).
   Un `admin` cu `DoctorId` populat vede clinica întreagă, ceea ce e corect pentru rolul lui. Dacă se
   dorește un comutator „doar ale mele / toată clinica" în UI, acela devine un parametru de request
   legitim — restrânge, nu lărgește.

### 9.4 Repository + procedures

```csharp
// Common/Interfaces/IDashboardRepository.cs
public interface IDashboardRepository
{
    /// <summary>
    /// Execută doar bundle-urile cerute. Secțiunile absente rămân null în rezultat,
    /// iar handler-ul nu le cere niciodată pentru un widget nepermis.
    /// </summary>
    Task<DashboardRawData> GetAsync(
        Guid clinicId, Guid userId, DateOnly today,
        IReadOnlySet<DashboardBundle> bundles,
        bool onlyMine, bool includeClinical, int trendDays,
        CancellationToken ct);
}
```

```csharp
// Infrastructure/Data/StoredProcedures/DashboardProcedures.cs
public static class DashboardProcedures
{
    public const string GetClinicalKpis      = "dbo.Dashboard_GetClinicalKpis";
    public const string GetAgenda            = "dbo.Dashboard_GetAgenda";
    public const string GetFinancialKpis     = "dbo.Dashboard_GetFinancialKpis";
    public const string GetTrends            = "dbo.Dashboard_GetTrends";
    public const string GetOperationalHealth = "dbo.Dashboard_GetOperationalHealth";
}
```

```csharp
// Extras din DashboardRepository — bundle-ul Agenda, 3 result sets fixe
private async Task<DashboardAgendaData> GetAgendaAsync(
    Guid clinicId, Guid userId, DateOnly today,
    bool onlyMine, bool includeClinical, CancellationToken ct)
{
    using var connection = context.CreateConnection();
    using var multi = await connection.QueryMultipleAsync(
        new CommandDefinition(
            DashboardProcedures.GetAgenda,
            new
            {
                ClinicId        = clinicId,
                UserId          = userId,
                Today           = today,
                OnlyMine        = onlyMine,
                IncludeClinical = includeClinical,
                Top             = 20,
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));

    // Ordinea de citire OGLINDEȘTE ordinea SELECT-urilor din SP. Result set-urile
    // sunt emise întotdeauna, chiar goale (vezi comentariul din Dashboard_GetAgenda),
    // ca inserarea unei liste noi să fie o schimbare la coadă, nu o renumerotare.
    var agenda      = (await multi.ReadAsync<DashboardAgendaItemDto>()).ToList();
    var openConsults = (await multi.ReadAsync<DashboardOpenConsultationDto>()).ToList();
    var labResults   = (await multi.ReadAsync<DashboardLabResultDto>()).ToList();

    return new DashboardAgendaData(agenda, openConsults, labResults);
}
```

### 9.5 Controller

```csharp
/// <summary>
/// Dashboard-ul utilizatorului curent. Compoziția e per rol, conținutul per
/// permisiuni efective — vezi ANALIZA_DASHBOARD_PE_ROLURI.md §4.
///
/// [HasAccess(dashboard, Read)] e poarta de intrare; fiecare widget din răspuns a
/// trecut, în plus, filtrul propriu de modul din handler. Un singur atribut pe
/// endpoint nu poate exprima „acest câmp cere payments, celălalt consultations".
/// </summary>
public class DashboardController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Dashboard, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<DashboardDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        [FromQuery] int trendDays = 30,
        CancellationToken ct = default)
        => HandleResult(await Mediator.Send(new GetDashboardQuery(trendDays), ct));
}
```

Un singur endpoint. Alternativa „un endpoint per bundle" (`/Dashboard/clinical`, `/Dashboard/financial`)
ar permite `[HasAccess]` mai precis și încărcare progresivă în UI, dar mută compoziția în client — adică
mută decizia „ce widget-uri vede acest rol" într-un loc unde nu poate fi impusă. Rămâne de reevaluat
doar dacă latența devine o problemă reală (§16/D7).

### 9.6 Validator

```csharp
public sealed class GetDashboardQueryValidator : AbstractValidator<GetDashboardQuery>
{
    public GetDashboardQueryValidator()
    {
        // Plafonul există și în SP (§8.9): validatorul protejează API-ul, SP-ul
        // protejează baza de date de orice alt apelant.
        RuleFor(x => x.TrendDays)
            .InclusiveBetween(7, 180)
            .WithMessage("Perioada pentru grafice trebuie să fie între 7 și 180 de zile.");
    }
}
```

---

## 10. Frontend — `features/dashboard`

### 10.1 Structura

```
client/src/features/dashboard/
├── pages/
│   ├── DashboardPage.tsx                 ← rescrisă: fără mock, randează widget-uri
│   └── DashboardPage.module.scss
├── components/
│   ├── WidgetCard.tsx                    ← shell comun: titlu, acțiune, loading, empty, error
│   ├── WidgetGrid.tsx                    ← layout responsive Bootstrap
│   ├── kpi/KpiRow.tsx                    ← grupează StatCard-urile pe un rând
│   ├── lists/AgendaWidget.tsx
│   ├── lists/OpenConsultationsWidget.tsx
│   ├── lists/LabResultsWidget.tsx
│   ├── lists/UnpaidWidget.tsx
│   ├── lists/ReceiptIssuesWidget.tsx
│   ├── lists/ActivityWidget.tsx
│   ├── lists/SecurityEventsWidget.tsx
│   ├── panels/DoctorWorkloadWidget.tsx
│   ├── panels/NoShowRateWidget.tsx
│   ├── panels/ExpiringItemsWidget.tsx
│   ├── panels/SyncFreshnessWidget.tsx
│   └── charts/TrendChart.tsx             ← §12
├── hooks/
│   └── useDashboard.ts
├── types/
│   └── dashboard.types.ts
└── widgets/
    └── widgetRegistry.tsx                ← WidgetId → componentă
```

### 10.2 Tipuri și API

```typescript
// types/dashboard.types.ts — importate din schema auto-generată, nu scrise de mână
import type { components } from '@/api/generated/schema'

export type DashboardDto            = components['schemas']['DashboardDto']
export type DashboardAgendaItemDto  = components['schemas']['DashboardAgendaItemDto']
export type DashboardClinicalKpis   = components['schemas']['DashboardClinicalKpisDto']
// ... restul

export interface GetDashboardParams {
  trendDays?: number
}
```

```typescript
// client/src/api/endpoints/dashboard.api.ts
import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { DashboardDto, GetDashboardParams } from '@/features/dashboard/types/dashboard.types'

const DASHBOARD = '/api/v1/Dashboard'

export const dashboardApi = {
  // Interceptorul axios returnează deja response.data, deci tipul e ApiResponse<T>
  // și consumatorul accesează .data (vezi §17).
  get: (params: GetDashboardParams): Promise<ApiResponse<DashboardDto>> =>
    api.get(DASHBOARD, { params }),
}
```

### 10.3 Hook

```typescript
// hooks/useDashboard.ts
export const dashboardKeys = {
  all:  ['dashboard'] as const,
  view: (params: GetDashboardParams) => [...dashboardKeys.all, 'view', params] as const,
}

/**
 * Un singur query pentru tot dashboard-ul: compoziția vine de la server, care știe
 * permisiunile efective. Clientul nu decide ce să ceară — ar reintroduce în FE
 * exact ramificarea pe rol pe care serverul o evită.
 *
 * staleTime 60s: agenda zilei și încasările se mișcă în minute, nu în secunde, iar
 * un dashboard care refetchează la fiecare focus face 5 SP-uri degeaba.
 * refetchOnWindowFocus rămâne activ — cine revine după o oră vrea cifre proaspete.
 */
export const useDashboard = (params: GetDashboardParams = {}) =>
  useQuery({
    queryKey: dashboardKeys.view(params),
    queryFn: () => dashboardApi.get(params),
    staleTime: 60_000,
    // Un widget nou apărut în răspuns nu trebuie să golească ecranul între refetch-uri.
    placeholderData: keepPreviousData,
  })
```

Invalidare încrucișată: o plată încasată, o consultație finalizată sau o programare mutată schimbă
cifrele de pe dashboard. `invalidateBilling` din `features/billing/hooks` invalidează deja
`billingKeys`, `invoiceKeys`, `consultationKeys` — se adaugă `dashboardKeys.all` acolo și în mutațiile
din appointments/consultations. Altfel utilizatorul încasează o plată, revine pe dashboard și vede
cifra veche până la expirarea `staleTime`.

### 10.4 Registry și pagină

```typescript
// widgets/widgetRegistry.tsx
/**
 * WidgetId → componentă. Serverul trimite id + payload; clientul doar mapează.
 * Un id necunoscut (server mai nou decât bundle-ul FE încărcat) e ignorat silențios,
 * nu aruncă: un deploy de backend nu trebuie să spargă pagina la cine are tab-ul deschis.
 */
export const WIDGET_REGISTRY: Record<string, React.FC<{ data: DashboardDto }>> = {
  'kpi.appointments.today':  KpiAppointmentsToday,
  'list.agenda.today':       AgendaWidget,
  'list.unpaid':             UnpaidWidget,
  'chart.revenue.trend':     RevenueTrendWidget,
  // ...
}
```

```typescript
// pages/DashboardPage.tsx — scheletul
export const DashboardPage = () => {
  const { data, isLoading, isError, refetch } = useDashboard()
  const user = useAuthStore((s) => s.user)
  const dashboard = data?.data
  const widgetIds = dashboard?.widgetIds ?? []

  if (isLoading) return <DashboardSkeleton />
  if (isError)   return <WidgetError onRetry={refetch} />

  // Zero widget-uri = un cont fără niciun modul relevant. Ecran explicit, nu pagină
  // goală — același raționament ca NoModulesScreen din routes/AccessScreens.
  if (widgetIds.length === 0 || !dashboard) return <EmptyDashboardScreen />

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Bună, ${user?.fullName ?? ''} — ${formatDate(new Date())}`}
      />
      <WidgetGrid>
        {widgetIds.map((id) => {
          const Component = WIDGET_REGISTRY[id]
          return Component ? <Component key={id} data={dashboard} /> : null
        })}
      </WidgetGrid>
    </div>
  )
}
```

### 10.5 Ce se păstrează din pagina actuală

| Element | Verdict |
|---|---|
| `StatCard` (`components/ui/StatCard`) | **Se păstrează integral.** Props-urile (`label`, `value`, `icon`, `color`, `trend`, `trendLabel`) acoperă exact nevoia. `trend` e opțional — se omite până la D4 |
| Icoanele SVG inline din `DashboardPage.tsx` | **Se mută** în `components/ui/Icons` sau se înlocuiesc cu `lucide-react` (deja dependență, deja folosit masiv în `Sidebar.tsx`). Un fișier de pagină cu 7 componente SVG inline nu e loc de icoane |
| Stilurile de card / listă / badge din `DashboardPage.module.scss` | **Se păstrează**, mutate în `WidgetCard.module.scss` — sunt shell-ul comun al tuturor widget-urilor |
| `ACTIVITY_COLOR`, `STATUS_LABEL` | Se păstrează ca hărți de prezentare, dar cheile devin codurile reale din BD (`PROGRAMAT`/`CONFIRMAT`/`FINALIZAT`/`ANULAT`/`NEPREZENTARE`), nu `'confirmed' \| 'pending' \| …` din mock |
| `MOCK_APPOINTMENTS`, `MOCK_ACTIVITY` | **Se șterg.** Nu se transformă în fixture de test: testele FE folosesc răspunsuri mock ale API-ului, nu constante de producție |
| Grid-ul Bootstrap (`row g-3`, `col-sm-6 col-xl-3`) | Se păstrează în `WidgetGrid`. Lățimea vine din registry (fiecare intrare declară `span`: KPI 3 coloane, listă 7, grafic 12) — **nu** din răspunsul API: prezentarea e treaba clientului, serverul trimite date și ordine |

---

## 11. Preferințe per utilizator (opțional, faza 2)

Odată ce preset-urile funcționează, pasul natural e „vreau și widget-ul X" / „nu vreau Y" / altă ordine.
Precedentul e `UserMenuPreferences` (0049) și e direct aplicabil:

```sql
-- Extindere a tabelului existent, nu tabel nou: preferințele de UI ale unui
-- utilizator aparțin împreună, iar UserMenuPreferences are deja UserId ca PK.
ALTER TABLE dbo.UserMenuPreferences ADD DashboardWidgets NVARCHAR(MAX) NULL;
```

Aceeași lecție ca la favorite: **ordinea array-ului JSON E ordinea de afișare**, deci reordonarea e o
simplă rescriere a coloanei, fără coloană separată de ordine. `NULL` = „folosește preset-ul rolului",
nu „niciun widget".

Reordonarea în UI reutilizează `@dnd-kit` exact ca `SortableFavoriteItem` — inclusiv regula ca grip-ul
de drag să fie `<button aria-label="Reordonează {titlu}">` separat, niciodată imbricat în link.

**Filtrarea pe permisiuni rămâne pe server, după aplicarea preferințelor.** O preferință salvată
înainte de a-i fi retras un override nu trebuie să devină o breșă: `preferințe ?? preset` → filtrare pe
permisiuni → răspuns. Ordinea celor doi pași nu e negociabilă.

---

## 12. Grafice — decizie necesară

`client/package.json` nu conține nicio bibliotecă de vizualizare. CLAUDE.md e explicit:
*„NU avem MultiSelectComponent, AutoCompleteComponent, DateRangePickerComponent, DateTimePickerComponent,
ScheduleComponent, ChartComponent — nu sunt instalate. Dacă ai nevoie → discuție înainte de instalare."*

Widget-urile afectate: `chart.revenue.trend`, `chart.appointments.week`. Trei opțiuni:

| Opțiune | Cost | Pro | Contra |
|---|---|---|---|
| **A. SVG scris de mână** (sparkline / bar chart simplu, ~80 linii) | 0 KB dependențe | Control total, se pliază pe tokenii de temă existenți, zero risc de supply chain (vezi avertismentul axios din CLAUDE.md) | Fără tooltip/zoom/legendă „gratis"; fiecare tip nou de grafic e cod nou |
| **B. `@syncfusion/ej2-react-charts`** | +~300 KB gzip; licența Syncfusion e deja înregistrată în `main.tsx` | Consecvent cu restul UI-ului; interactivitate completă | Bundle-ul crește sensibil pe o pagină care e prima după login; încă un pachet Syncfusion de ținut la aceeași versiune (32.x) |
| **C. Amânare** — `chart.*` iese din v1, rămân doar KPI + liste + tabele mici | 0 | v1 livrabil mai repede; managerul primește `panel.*` (tabele) care acoperă 80% din informație | Dashboard-ul de manager e mai sărac decât ar putea fi |

Recomandare: **A pentru v1** (o serie temporală simplă, `<svg>` cu `<polyline>` + axă de dată, sub 100
de linii, cu `role="img"` + `aria-label` descriptiv pentru accesibilitate), cu **B** ca escaladare
naturală dacă apar cereri de grafice interactive. Varianta A nu blochează B: `TrendChart.tsx` e un
singur punct de înlocuire.

---

## 13. Teste

### 13.1 Backend — xUnit + NSubstitute

`tests/ValyanClinic.Tests/Handlers/GetDashboardQueryHandlerTests.cs` — testele care contează sunt
**cele de autorizare**, nu cele de mapare:

| Test | Ce verifică |
|---|---|
| `Handle_DoctorRole_ReturnsClinicalWidgetsOnly` | Preset-ul de doctor + permisiuni de doctor → niciun widget cu modul `payments`/`invoices` în răspuns |
| `Handle_ReceptionistRole_NeverRequestsClinicalData` | `Received(1).GetAsync(…, includeClinical: false, …)` — recepția nu poate primi date clinice **nici din SP** |
| `Handle_DoctorWithPaymentsOverride_IncludesFinancialWidget` | Cu `payments = Read` în permisiunile efective și widget-ul în preset → apare. **Testul care demonstrează că override-urile funcționează** |
| `Handle_UserWithoutAnyModule_ReturnsEmptyDashboard` | Permisiuni goale → `Widgets` gol, **fără** apel la repository |
| `Handle_DoctorRole_PassesOnlyMineTrue` | `onlyMine: true` doar pentru rolul doctor |
| `Handle_AdminRole_PassesOnlyMineFalse` | Adminul vede clinica, chiar dacă are `DoctorId` |
| `Handle_RequestsOnlyNeededBundles` | Un `nurse` → `bundles` conține `Clinical` și `Agenda`, **nu** `Financial`/`Trend`/`Health` |
| `Handle_WidgetOrderFollowsPreset` | Ordinea din răspuns = ordinea din preset, după filtrare |
| `Handle_UnknownRole_UsesDefaultPreset` | Un `Roles.Code` nou în BD, fără rând în `ByRole`, nu aruncă |
| `Handle_UsesTodayFromTimeProvider` | `TimeProvider` mock pe o dată fixă → `today` transmis e acea dată |

`tests/ValyanClinic.Tests/Validators/GetDashboardQueryValidatorTests.cs`: `TrendDays` la 6 / 7 / 180 /
181, cu `ShouldHaveValidationErrorFor` + `WithErrorMessage`, ca în `CreateConsultationCommandValidatorTests`.

`tests/ValyanClinic.Tests/Domain/DashboardWidgetCatalogTests.cs` — teste de consistență pe catalog,
ieftine și foarte valoroase:

| Test | Ce prinde |
|---|---|
| `AllPresetIds_ExistInCatalog` | Un typo într-un preset → eroare de test, nu `KeyNotFoundException` în producție |
| `AllCatalogModules_ExistInModuleCodes` | Un modul inventat într-un widget → 403 tăcut |
| `AllCatalogIds_AreUnique` | Duplicat în catalog |
| `EveryWidget_DeclaresAtLeastOneModule` | Un widget fără cerință de acces = widget vizibil tuturor |

> R8 din CLAUDE.md se aplică direct: dacă se adaugă un parametru la `IDashboardRepository.GetAsync`,
> **toți** mock-ii `Arg.Any<>()` din testele de handler trebuie actualizați, altfel NSubstitute nu
> recunoaște apelul și CI cade cu „number of args mismatch".

### 13.2 Backend — integration

`tests/ValyanClinic.IntegrationTests` pe BD reală, pentru SP-uri. Asertele care merită efortul:

- `Dashboard_GetClinicalKpis` cu `@OnlyMine = 1` pentru un user legat de `MedicalStaff` (nu `Doctor`):
  `@DoctorId` rămâne NULL → nu aruncă, întoarce cifrele clinicii;
- `Dashboard_GetAgenda` cu `@IncludeClinical = 0`: `Diagnostic`, `Motiv`, `Notes` sunt **NULL** în
  result set-ul 1, iar result set-urile 2 și 3 sunt **goale dar prezente**;
- izolarea multi-tenant: două clinici cu date, fiecare apel vede doar ale ei;
- `Dashboard_GetFinancialKpis`: `OutstandingTotal` = suma restanțelor calculată independent în test;
- `Dashboard_GetTrends` cu `@Days = 30` pe o clinică fără nicio plată: **30 de rânduri de zero**, nu 0
  rânduri (regresia pe care `LEFT JOIN`-ul cu calendarul o previne);
- `Dashboard_GetTrends` cu `@Days = 500`: plafonat la 180;
- consultațiile/plățile soft-deleted / anulate nu apar în niciun contor.

### 13.3 Frontend — Vitest

`client/src/__tests__/features/dashboard/DashboardPage.test.tsx`, cu `dashboardApi.get` mock-uit:

- răspuns cu 3 widget-uri → 3 carduri randate, în ordinea din răspuns;
- răspuns cu `widgets: []` → `EmptyDashboardScreen`, nu pagină goală;
- `isLoading` → skeleton, nu `null`;
- eroare → mesaj + buton de reîncercare care apelează `refetch`;
- **widget id necunoscut în răspuns → ignorat, restul se randează** (compatibilitate la deploy);
- `payload` cu `diagnostic: null` → componenta nu randează secțiunea clinică (nu „null" ca text).

`widgetRegistry.test.ts`: fiecare cheie din registry e un id cunoscut — pandantul FE al testului de
catalog din BE. Sincronizarea cod-BE ↔ cod-FE nu e verificată de compilator (id-urile sunt string-uri),
deci e singurul loc unde o desincronizare poate trece: merită un comentariu explicit în ambele fișiere.

### 13.4 E2E — Playwright

`client/e2e/specs/dashboard.spec.ts` se extinde. Cele 4 teste existente rămân valide (testul „fără
erori API" devine, în sfârșit, informativ). Se adaugă, per rol, cu fixture-uri de autentificare:

- `doctor` → vede „Agenda de azi", **nu** vede „Încasări";
- `receptionist` → vede „De încasat", **nu** vede nicio coloană de diagnostic;
- `admin` → vede „Evenimente de securitate";
- un cont fără module → ecranul explicit, nu 404 și nu buclă de redirect.

Ultimul e important: `LandingRedirect` trimite la prima rută permisă, iar dacă `dashboard` e permis dar
gol, utilizatorul aterizează pe un ecran care trebuie să-i spună ceva.

---

## 14. Contract OpenAPI și CI

Ordinea operațiilor nu e opțională — job-ul `contract` din CI (`npm run check:api` = `gen:api` +
`tsc --noEmit`) cade altfel:

```powershell
# 1. Backend: DTO-uri + controller + build
dotnet build

# 2. Regenerare spec din assembly-ul nou
.\generate-openapi.ps1                 # rescrie openapi/openapi-v1.json

# 3. Regenerare tipuri FE din spec
cd client ; npm run gen:api            # rescrie src/api/generated/schema.d.ts

# 4. Abia acum se scrie cod FE care importă din schema.d.ts
```

`schema.d.ts` **nu** se editează manual (R9 + tabelul de anti-pattern-uri din CLAUDE.md).

Atenție la trei lucruri în forma DTO-urilor, pentru că se propagă în tipurile FE:

1. **`DashboardWidgetDto.Payload` polimorf.** Un `object` în C# devine `Record<string, never>` sau
   `unknown` în `schema.d.ts` — inutilizabil. Două soluții: (a) `payload` tipizat ca `object` + narrowing
   manual pe `id` în FE, cu un `type` discriminant; (b) `DashboardDto` cu proprietăți opționale
   puternic tipizate (`clinicalKpis?`, `agenda?`, `financialKpis?`, …) plus o listă `widgets: string[]`
   care dă doar ordinea. **Recomand (b)**: tipurile rămân exacte, FE-ul face
   `data.agenda && <AgendaWidget items={data.agenda} />`, iar `tsc --noEmit` prinde efectiv greșelile.
   Costul: `DashboardDto` are ~15 proprietăți opționale. Merită.
2. **`DateOnly` în parametri** — precedent în `BillingController` (`[FromQuery] DateOnly? dateFrom`), deci
   serializarea e deja rezolvată.
3. **`decimal`** → `number` în TS; formatarea RON se face cu utilitarul existent din `utils/format`.

CI: job-ul `backend` rulează testele noi; `frontend` rulează lint (atenție la R10 — un import
neutilizat într-un widget oprește build-ul) + Vitest + build; `contract` validează pasul 2↔3.

---

## 15. Riscuri și gap-uri preexistente descoperite

| # | Constatare | Impact pe dashboard | Propunere |
|---|---|---|---|
| 1 | **`ICurrentUser` nu expune `DoctorId`; JWT nu are claim-ul** | Blochează orice widget „ale mele" | §8.3, soluția B (rezolvare în SP din `@UserId`) |
| 2 | **Modulul `reports` e seed-uit (`clinic_manager = Full`) dar nu există nicio rută, controller sau pagină** | Widget-urile analitice nu se pot lega de `reports` | Se leagă de `payments`/`invoices`/`appointments`. `reports` rămâne rezervat pentru un modul viitor real |
| 3 | **Modulul `documents` e seed-uit, dar `DocumentsController` e protejat pe `consultations`** | Un widget „documente emise" ar avea autorizare ambiguă | În afara scopului. Merită un ticket separat: sau se aliniază controller-ul la `documents`, sau se retrage modulul din seed |
| 4 | **`Appointments` nu are tip/serviciu** | Mock-ul afișează „Consultație generală", „Ecografie abdominală" — câmp inexistent. Agenda reală nu poate arăta asta | Agenda arată pacient / oră / medic / status. Dacă se dorește tipul, e o schimbare de schemă la `Appointments`, nu la dashboard |
| 5 | **`SecurityEvents.ClinicId` e NULL-abil, indecșii nu au `ClinicId` în cheie** | Widget-ul de securitate face scan; rândurile fără clinică trebuie tratate explicit | Indexul #6 din §8.4 + filtrul `(ClinicId = @ClinicId OR ClinicId IS NULL)` |
| 6 | **Trei convenții de timp în schemă** (`SYSDATETIME` / `GETDATE` / `SYSUTCDATETIME`) | „Azi" e ambiguu; `SecurityEvents` e decalat | `@Today` de la handler + `@SinceUtc` separat (§8.2). Merită un ticket de uniformizare a schemei |
| 7 | **`#Billable` fără limită de perioadă** | Scan crescător liniar cu istoricul clinicii, pe pagina cea mai des deschisă | `@BillableSince` (§16/D5) |
| 8 | **Niciun `RowVersion` pe `Appointments`** | Fără impact pe citire; relevant doar dacă dashboard-ul devine scriitor | Nimic acum |
| 9 | **CLAUDE.md conținea 19 inexactități** (vezi §17), printre care exemplul central `CreateConsultationCommand` cu 47 de parametri, obsolet după 0035 | Un dezvoltator care urma documentul scria cod care nu compilează | **Corectat** în același PR — §17 |
| 10 | **Nicio bibliotecă de chart** | `chart.*` nu se poate implementa fără decizie | §12 |
| 11 | **Cache-ul de permisiuni e accesibil doar din `ModuleAccessAuthorizationHandler`** (`IMemoryCache` + `PermissionCacheKeys`, TTL 5 min, pre-populat la login/refresh) | Un handler de feature care are nevoie de permisiuni ar face un apel la BD paralel cu un cache deja cald | `IEffectivePermissions` (§9.3, D13) |

---

## 16. Decizii de confirmat înainte de implementare

| # | Decizie | Recomandare |
|---|---|---|
| **D1** | Compoziție: preset per rol + filtrare pe permisiuni efective (varianta C, §4)? | **Da.** Orice alternativă bazată pe rol contrazice `UserModuleOverrides` |
| **D2** | Preset-urile stau în cod (`DashboardPresets.cs`) sau în BD? | **Cod** pentru v1. BD doar dacă apare cererea de reconfigurare fără deploy |
| **D3** | Conținutul celor 5 preset-uri din §7 e cel dorit? | De validat cu utilizatorii reali — e singura decizie pur de produs din listă |
| **D4** | Se implementează trend-urile de pe `StatCard` (`+12% față de ieri`)? | **Nu în v1.** Dublează fiecare agregat pentru o comparație care, pe volume mici de clinică, oscilează fără sens. `StatCard.trend` e opțional |
| **D5** | `@BillableSince` implicit 6 luni pentru „de încasat"? | **Da.** Restanțele mai vechi sunt subiect de raport, nu de dashboard. Contorul poate rămâne total dacă e nevoie — dar atunci explicit, cu un al doilea agregat ieftin |
| **D6** | Grafice: SVG propriu, Syncfusion Charts, sau amânare? | **SVG propriu** (§12, opțiunea A) |
| **D7** | Un endpoint `/Dashboard` sau unul per bundle? | **Unul**, până când latența măsurată o cere altfel |
| **D8** | „Activitate recentă" (azi mock, vizibil tuturor) devine widget exclusiv de admin? | **Da** — sursa e `AuditLogs`, iar `audit` e doar admin (0045). Pentru celelalte roluri, o listă echivalentă ar trebui derivată din entitățile proprii, adică un widget diferit, nu același |
| **D9** | Preferințe per utilizator (§11) intră în v1 sau faza 2? | **Faza 2.** Preset-urile trebuie validate în uz înainte de a fi configurabile |
| **D10** | Fereastra „buletine noi" (7 zile) și „reveniri" (14 zile) sunt corecte clinic? | De confirmat cu medicii; sunt parametri de SP, ușor de schimbat |
| **D11** | `@ExpiryDays = 60` pentru avize CMR / asigurări? | Rezonabil; de confirmat |
| **D12** | Se creează ticket separat pentru gap-urile #2, #3, #6 din §15? | **Da** — nu sunt probleme de dashboard și nu trebuie rezolvate în acest PR |
| **D13** | Se introduce `IEffectivePermissions` (§9.3) ca sursă unică pentru permisiunile efective, folosită și de `ModuleAccessAuthorizationHandler`? | **Da.** Refactorizare mică, elimină un round-trip per încărcare de dashboard și previne două implementări de cache |

---

## 17. Anexă — inexactități găsite în CLAUDE.md (CORECTATE)

Verificate împotriva codului în timpul acestei analize și **remediate în același PR**.
Lista rămâne aici ca urmă a ce s-a schimbat și de ce.

| Ce scria CLAUDE.md | Realitatea în cod | Stare |
|---|---|---|
| `CreateConsultationCommand` cu **47 de parametri** (`Motiv`, `IstoricMedicalPersonal`, `StareGenerala`, `Greutate`, `TensiuneSistolica`, `SpO2`, …) | **23 de parametri.** Migrarea 0035 a mutat anamneza și examenul clinic în tabele proprii, cu comenzi separate (`UpdateConsultationAnamnesis` / `UpdateConsultationExam`) | ✅ corectat |
| `IConsultationRepository.CreateAsync(Guid clinicId, Guid patientId, …)` — semnătură pozițională lungă | `CreateAsync(ConsultationCreateData data, Guid createdBy, CancellationToken ct)` — **record de date**, 3 parametri | ✅ corectat, cu regula de formă explicitată |
| „REGULĂ CRITICĂ: numărul de `Arg.Any<>()` TREBUIE SĂ COINCIDĂ EXACT… (47 params + ct = **48 total**)", cu un bloc de 48 de `Arg.Any<>()` | `Arg.Any<ConsultationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>()` — **3**. Verificarea unui câmp se face cu `Arg.Is<T>(predicat)` | ✅ rescris |
| `currentUser.IsAdmin // bool` | Membrul **nu există**. Interfața are `Id`, `ClinicId`, `RoleId`, `Email`, `FullName`, `Role`, `IsInRole(string)` | ✅ corectat + rând în anti-pattern-uri |
| *(nemenționat)* | `ICurrentUser` **nu are `DoctorId`**, iar JWT nu emite claim-ul | ✅ documentat explicit |
| `api.get(...).then(r => r.data.data)`, iar absența `.then` listată ca **greșeală** | Interceptorul face `(response) => response.data`, deci `api.get()` întoarce `ApiResponse<T>`; `r.data.data` e `undefined`. Fișierele reale nu despachetează | ✅ inversat, în ambele locuri |
| `<Controller render={({ field }) => <FormDatePicker field={field} error={…} />} />` | Wrapper-ele apelează `useController` **intern**: primesc `name` + `control`, cu parametru generic (`<FormInput<FormData>>`) | ✅ rescris |
| „Wrappers: …`FormTextArea`, `FormRichText` (**Syncfusion RTE**), `FormCheckbox`, `FormSwitch`" | `FormTextArea`/`FormCheckbox`/`FormSwitch` **nu există**; `FormRichText` e **TipTap**, nu Syncfusion. Syncfusion RTE apare doar în `components/icd10/` | ✅ corectat + tabel cu wrapper-ele reale |
| `<Inject services={[Toolbar, Link, **Image**, HtmlEditor, Count, QuickToolbar]} />` | `[Toolbar, Link, HtmlEditor, Count, QuickToolbar, **Resize**]` — `Image` nu e injectat nicăieri | ✅ corectat |
| Lista CSS Syncfusion din `main.tsx`, parțială | 11 import-uri + `L10n`/`loadCldr`/`setCulture`/`setCurrencyCode` | ✅ completat |
| `z.number({ invalid_type_error: '…' })`, `z.boolean().default(false)` | Zod 4 a redenumit parametrul în `error`; schemele reale folosesc `.nullable().optional()` și nu pun `.default()` | ✅ corectat, cu motivul |
| `SqlExceptionHelper.Make(int number, string message = "…")`, prin `FormatterServices.GetUninitializedObject` | `internal static Make(int number)` — **un** parametru; reflection peste `SqlErrorCollection`/`SqlError` | ✅ corectat |
| `Result<T>` fără `Forbidden` | Există și `Result<T>.Forbidden(...)` → 403 | ✅ adăugat |
| Exemplu R6 cu `0031`; „ultima migrare" implicit veche | Ultima migrare: **`0056_CreateFiscalReceipts.sql`** | ✅ corectat + comanda de verificare |
| `SqlErrorCodes` „coduri complete", oprit la 50508 | Codurile merg până la **50645**; harta range-urilor lipsea | ✅ marcat ca extras + hartă de range-uri |
| `ModuleCodes` fără `Tariffs` | `Tariffs` există (0053). Modulele nu vin toate din 0011: `anm`/0030, `audit`/0045, `settings`/0047, `tariffs`/0053 | ✅ completat |
| `authStore` fără `idleTimeoutMinutes` | Câmpul există, e persistat și vine de la server la login/refresh | ✅ adăugat, cu `AuthUser` complet |
| R1: „`WHERE ClinicId = @ClinicId` — OBLIGATORIU, fără excepție" | Nomenclatoarele naționale nu au coloana; `SecurityEvents.ClinicId` e NULL-abil, deci filtrul simplu ascunde rândurile relevante | ✅ nuanțat, cu forma corectă |
| Axios „**1.13.5 (pinned)**" | `package.json` are `^1.13.5` (interval caret). Ce blochează versiunea e `package-lock.json`, respectat de `npm ci` | ✅ corectat, cu cum se blochează efectiv |
| Căi de hook-uri: `hooks/{feature}.hooks.ts` (în checklist) vs `use{Entity}s.ts` (în tabelul de naming) — contradicție internă | Realitatea: `useConsultations.ts`, `usePatients.ts`, `useBilling.ts` | ✅ unificat |

Adăugat pe lângă corecții: o notă în capul documentului cu data ultimei verificări, regula
„dacă un exemplu nu compilează, exemplul e greșit, nu codul", obligația de a actualiza
secțiunea în același PR cu refactorizarea, și lista reperelor care se învechesc cel mai
repede, cu comenzile de verificat.

---

## 18. Plan de implementare

| Pas | Conținut | Livrabil verificabil |
|---|---|---|
| **0** | Confirmarea deciziilor D1–D12 | Acest document, adnotat |
| **1** | `0057_DashboardIndexes.sql` + `.\migrate.ps1` | Indecșii există în `sys.indexes`; niciun plan de execuție existent nu regresează |
| **2** | Cele 5 SP-uri + teste de integrare | SP-uri apelabile din SSMS; izolarea multi-tenant și garda `@IncludeClinical` dovedite prin test |
| **3** | DTO-uri, `IDashboardRepository`, `DashboardRepository`, `DashboardProcedures`, DI | `dotnet build` verde |
| **4** | Catalog + preset-uri + handler + validator + controller | Testele de handler și de catalog verzi; `GET /api/v1/Dashboard` întoarce date reale în Swagger |
| **5** | `generate-openapi.ps1` → `npm run gen:api` | `npm run check:api` verde |
| **6** | `WidgetCard`, `WidgetGrid`, registry, hook, KPI-uri + liste | Dashboard real pentru toate rolurile; `MOCK_*` șterse |
| **7** | `panel.*` (tabele mici) + `TrendChart` SVG | Dashboard-ul de manager complet |
| **8** | Teste FE + e2e per rol | CI verde pe toate cele 3 job-uri |
| **9** | Invalidare încrucișată `dashboardKeys` în mutațiile de billing / appointments / consultations | O plată încasată actualizează dashboard-ul la revenire |
| **10** | *(faza 2)* Preferințe per utilizator + reordonare `@dnd-kit` | `UserMenuPreferences.DashboardWidgets` |

Pașii 1–6 sunt un v1 livrabil. 7–9 completează. 10 e separabil.
