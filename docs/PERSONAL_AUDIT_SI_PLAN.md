# Administrare → Personal — audit tehnic și plan de remediere

> **Destinatar:** agent de implementare (VS Code) pe repo `Aurelian1974/CMS`.
> **Scop:** livrabil auto-conținut. Fiecare secțiune are *simptom → cauză → fix concret → criteriu de acceptanță*.
> **Data auditului:** 2026-09-28 · **Branch de lucru:** `claude/nifty-clarke-dn58bz`
> **Următorul număr de migrare liber:** `0059` (ultima aplicată: `0058_DashboardIndexes.sql`).
> **Ecrane acoperite:** `/doctors`, `/medical-staff`, `/specialties`, `/medical-titles`.

---

## 0. Rezumat executiv

Cele patru ecrane funcționează la prima vedere, dar auditul full-stack a găsit **cinci defecte de
corectitudine** care produc erori 500, date invizibile sau audit inutilizabil, plus un set consistent
de probleme de performanță SQL, permisiuni și întreținere. Tiparul dominant: **paginile Doctori și
Personal medical au rămas în urmă față de `PatientsListPage`**, care rezolvă deja corect aceleași
probleme (debounce, paginare server-side, gardă de permisiuni, export pe filtrele curente).

| # | Titlu | Severitate | Zonă | Efort |
|---|---|---|---|---|
| P0-1 | `UQ_Doctors_Email_Clinic` nu e filtrat pe `IsDeleted` → recrearea unui doctor șters dă **500** | **Critic** | SQL | S |
| P0-2 | Doctori / Personal medical afișează **doar primele 20 de rânduri**; statistici și filtre calculate pe pagină | **Critic** | FE | M |
| P0-3 | Audit de ștergere corupt (`ChangedBy = @ClinicId`) și absent complet la Personal medical | **Critic** | SP | S |
| P0-4 | Dezactivarea unei specializări/titulaturi **blochează editarea** doctorilor care o folosesc și îi golește numele în listă | **Critic** | SP | M |
| P0-5 | Soft delete fără gardă referențială: contul de utilizator rămâne funcțional, programările viitoare rămân alocate | **Major** | SP | M |
| P1-1 | `OFFSET/FETCH` fără tie-break determinist → rânduri repetate/sărite între pagini | Major | SP | S |
| P1-2 | `sortBy` trimis de client (`fullName`) e ignorat tacit de SP | Major | SP + FE | S |
| P1-3 | `LIKE` fără `ESCAPE`, predicate duplicate între cele două result set-uri | Major | SP | M |
| P1-4 | Lipsă result set de statistici → FE calculează totaluri greșite | Major | SP + BE | M |
| P1-5 | Index-uri inutile (`IsActive` singur) și lipsa indexului pentru paginare pe tenant | Major | SQL | S |
| P1-6 | `RowVersion` există dar nu e folosit: două editări concurente → *last write wins* silențios | Major | SP + BE | M |
| P1-7 | Numele constantelor din `SqlErrorCodes.cs` contrazic ce aruncă SP-urile (50304/50305/50306); coliziune nedocumentată pe 50401 | Major | C# | S |
| P1-8 | `UpdateSpecialtyCommandValidator` nu are regulile `ParentId`↔`Level` → înregistrări fantomă, invizibile în arbore | Major | C# | S |
| P1-9 | `GetSpecialtyById` citește toată lista în memorie și returnează un shape în afara contractului `ApiResponse<T>` | Major | C# | S |
| P1-10 | `/Doctors/lookup` și `/MedicalStaff/lookup` fără `[HasAccess]` → orice cont autentificat enumeră emailuri și parafe | Major | C# | S |
| P1-11 | `Specialty_Update` permite cicluri în ierarhie și `Level` incoerent cu părintele | Major | SP | S |
| P1-12 | Query-urile de listare nu au validator → `pageSize=100000` acceptat | Mediu | C# | S |
| P1-13 | Specializări / Titulaturi: zero audit (fără `CreatedBy`/`UpdatedBy`, fără `AuditLogs`) | Mediu | SQL + SP | M |
| P2-1 | Erorile de ștergere sunt invizibile: `FeedbackAlerts` primește `successMsg`, nu `errorMsg` | Major | FE | S |
| P2-2 | Specializări / Titulaturi: erorile de mutație sunt înghițite de `catch {}` — utilizatorul nu vede nimic | Major | FE | S |
| P2-3 | Fără gardă de permisiuni în UI: „Adaugă"/„Editează"/„Șterge" apar și pentru `Read` | Major | FE | S |
| P2-4 | Cuplare pe prefixul codului `MEDIC` pentru a separa titulaturile de medic de cele de personal | Major | SQL + FE | M |
| P2-5 | „Export Excel" exportă doar pagina curentă, dar butonul nu spune asta | Mediu | FE | S |
| P2-6 | `ROUTE_MODULES['/doctors'] = ['users']`, dar pagina cere și `nomenclature` și `clinic` | Mediu | FE | S |
| P2-7 | Paginile de detaliu `/doctors/:id`, `/medical-staff/:id` nu sunt accesibile din listă | Mediu | FE | S |
| P2-8 | Prag de expirare aviz CMR inconsistent: 60 de zile în listă, 90 în pagina de detaliu | Mediu | FE | S |
| P2-9 | Tipuri scrise de mână deși `schema.d.ts` conține DTO-urile → drift nedetectabil | Mediu | FE | M |
| P2-10 | Arborele de specializări: căutarea nu extinde nodurile → pare că nu găsește nimic | Mediu | FE | S |
| P2-11 | Specializări / Titulaturi: tabele `div` hand-rolled în loc de `AppDataGrid`; fără sortare/export | Mediu | FE | L |
| P2-12 | `DoctorsListPage` și `MedicalStaffListPage` sunt duplicate ~90% | Mediu | FE | M |
| P2-13 | A11y: arbore fără `role`/`aria-expanded`, toggle de status fără `aria-pressed`, fără confirmare la dezactivare | Mediu | FE a11y | S |
| P2-14 | `showGroupPanel` + `rowDragEnabled` pe grid-uri paginate server-side: operează doar pe pagina încărcată | Mic | FE | S |
| P2-15 | `Specialty_GetById.sql` + `ISpecialtyRepository.GetByIdAsync` există dar nu sunt apelate de nimeni | Mic | C# | S |
| P2-16 | Zero teste: nici un handler test pentru Doctors/MedicalStaff/Specialty/MedicalTitle | Mediu | Tests | M |

**Ordine de execuție recomandată:**
`P0-1` → `P0-3` → `P0-4` → `P1-1..P1-6` + `P1-11` + `P1-13` (toate într-o singură migrare `0059` + rescrierea SP-urilor) →
`P1-7..P1-10`, `P1-12` → `P0-2` + `P2-1..P2-3` → `P0-5` → `P2-4..P2-16`.

Motivul ordinii: P0-1/P0-3/P0-4 sunt exclusiv SQL, se pot livra fără atingerea frontendului; P0-2 depinde de
result set-ul de statistici introdus la P1-4, deci se face după.

### Inventar de fișiere atinse

**Frontend**
```
client/src/features/doctors/pages/DoctorsListPage.tsx                  (530 linii)
client/src/features/doctors/components/DoctorFormModal/DoctorFormModal.tsx
client/src/features/doctors/hooks/useDoctors.ts
client/src/features/doctors/types/doctor.types.ts
client/src/features/doctors/schemas/doctor.schema.ts
client/src/features/doctors/pages/DoctorDetailPage.tsx
client/src/features/medicalStaff/pages/MedicalStaffListPage.tsx        (461 linii)
client/src/features/medicalStaff/components/MedicalStaffFormModal/MedicalStaffFormModal.tsx
client/src/features/medicalStaff/hooks/useMedicalStaff.ts
client/src/features/nomenclature/pages/SpecialtiesListPage.tsx         (368 linii)
client/src/features/nomenclature/pages/MedicalTitlesPage.tsx           (208 linii)
client/src/features/nomenclature/hooks/useSpecialties.ts
client/src/features/nomenclature/hooks/useMedicalTitles.ts
client/src/features/nomenclature/schemas/specialty.schema.ts
client/src/routes/moduleAccess.ts
```

**Backend**
```
src/ValyanClinic.API/Controllers/DoctorsController.cs
src/ValyanClinic.API/Controllers/MedicalStaffController.cs
src/ValyanClinic.API/Controllers/NomenclatureController.cs
src/ValyanClinic.Application/Common/Constants/SqlErrorCodes.cs
src/ValyanClinic.Application/Common/Interfaces/IDoctorRepository.cs
src/ValyanClinic.Application/Common/Interfaces/IMedicalStaffRepository.cs
src/ValyanClinic.Application/Common/Interfaces/ISpecialtyRepository.cs
src/ValyanClinic.Application/Features/Doctors/**
src/ValyanClinic.Application/Features/MedicalStaff/**
src/ValyanClinic.Application/Features/Nomenclature/Commands/{Create,Update,Toggle}{Specialty,MedicalTitle}/**
src/ValyanClinic.Infrastructure/Data/Repositories/{Doctor,MedicalStaff,Specialty,MedicalTitle}Repository.cs
```

**SQL**
```
src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0059_PersonalHardening.sql   (NOU)
src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/Doctor_{GetPaged,GetById,GetByClinic,Create,Update,Delete}.sql
src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/MedicalStaff_{GetPaged,Create,Update,Delete}.sql
src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/Specialty_{Create,Update,ToggleActive}.sql
src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/MedicalTitle_{Create,Update,ToggleActive,GetAll}.sql
```

---

## 1. P0-1 — Recrearea unui doctor șters dă 500

### Simptom
Un doctor este șters (soft delete). Se încearcă readăugarea aceluiași medic, cu același email.
Rezultat: **500 Internal Server Error**, fără mesaj util în UI. Adresa de email nu mai poate fi
refolosită niciodată în acea clinică.

### Cauză
`0004_CreateDoctors.sql` declară constrângerea cu un comentariu care **nu corespunde codului**:

```sql
-- Email unic per clinică (doar neșterse)
CONSTRAINT UQ_Doctors_Email_Clinic UNIQUE (Email, ClinicId)
```

`UNIQUE (Email, ClinicId)` este *global*, nu filtrat pe `IsDeleted = 0`. Lanțul de eșec:

1. `Doctor_Create` verifică duplicatul cu `... AND IsDeleted = 0` → **trece**, pentru că rândul vechi e șters logic;
2. `INSERT` lovește constrângerea fizică → `SqlException` cu `Number = 2627`;
3. handlerul prinde doar `50301` și intervalul `50000..59999` → `2627` **nu e prins** de niciun `catch`;
4. excepția urcă → 500.

Identic în `0007_CreateMedicalStaff.sql` (`UQ_MedicalStaff_Email_Clinic`), cu același comentariu greșit.

### Fix — decizie
Constrângerea devine **index unic filtrat**. Este singura formă care exprimă „unic printre rândurile
active" în SQL Server, iar verificarea din SP rămâne pe loc ca să producă un mesaj de business
(50301) în cazul normal — indexul e plasa de siguranță pentru cursele concurente (vezi P1-6).

În `0059_PersonalHardening.sql`:

```sql
-- Doctors: UNIQUE global → index unic filtrat pe rândurile neșterse
IF EXISTS (SELECT 1 FROM sys.key_constraints
           WHERE name = 'UQ_Doctors_Email_Clinic' AND parent_object_id = OBJECT_ID('dbo.Doctors'))
    ALTER TABLE dbo.Doctors DROP CONSTRAINT UQ_Doctors_Email_Clinic;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_Doctors_ClinicId_Email_Active' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_Doctors_ClinicId_Email_Active
        ON dbo.Doctors (ClinicId, Email)
        WHERE IsDeleted = 0;
GO

-- MedicalStaff: idem
IF EXISTS (SELECT 1 FROM sys.key_constraints
           WHERE name = 'UQ_MedicalStaff_Email_Clinic' AND parent_object_id = OBJECT_ID('dbo.MedicalStaff'))
    ALTER TABLE dbo.MedicalStaff DROP CONSTRAINT UQ_MedicalStaff_Email_Clinic;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_MedicalStaff_ClinicId_Email_Active' AND object_id = OBJECT_ID('dbo.MedicalStaff'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_MedicalStaff_ClinicId_Email_Active
        ON dbo.MedicalStaff (ClinicId, Email)
        WHERE IsDeleted = 0;
GO
```

> **Atenție la ordinea coloanelor:** `(ClinicId, Email)`, nu `(Email, ClinicId)`. Leading column
> `ClinicId` face indexul folosibil și pentru filtrarea pe tenant, nu doar pentru unicitate.

**Plasă de siguranță în handler** — chiar cu indexul filtrat, o cursă concurentă poate produce 2627.
Se adaugă în `CreateDoctorCommandHandler` și `UpdateDoctorCommandHandler` (plus echivalentele
MedicalStaff), **înainte** de catch-ul generic:

```csharp
// 2627 = violare de constrângere unică, 2601 = violare de index unic.
// Apar doar la o cursă concurentă pe email: SP-ul verifică deja duplicatul.
catch (SqlException ex) when (ex.Number is 2627 or 2601)
{
    return Result<Guid>.Conflict(ErrorMessages.Doctor.EmailDuplicate);
}
```

### Acceptanță
- Migrarea aplicată: `sys.indexes` conține `UX_Doctors_ClinicId_Email_Active` cu `has_filter = 1`;
  `UQ_Doctors_Email_Clinic` nu mai există.
- Scenariu manual: creare doctor cu `x@y.ro` → ștergere → recreare cu `x@y.ro` → **201 Created**.
- Creare a doi doctori cu același email activ → **409 Conflict** cu mesajul din `ErrorMessages.Doctor.EmailDuplicate`, niciodată 500.
- Dacă migrarea eșuează pe date existente (duplicat de email pe rânduri active), scriptul trebuie să
  raporteze explicit rândurile în conflict — vezi blocul de pre-verificare din §10.

---

## 2. P0-2 — Doctori și Personal medical afișează doar primele 20 de rânduri

### Simptom
Clinica are 60 de medici. Bara de statistici spune „Total doctori: 60", dar grid-ul are o singură
pagină cu 20 de rânduri și pagerul nu oferă pagina 2. Contoarele „Activi", „Inactivi" și
„Specialități" sunt greșite. Filtrul „Specialitate" listează doar specialitățile prezente în cele
20 de rânduri încărcate.

### Cauză
`DoctorsListPage.tsx` (identic în `MedicalStaffListPage.tsx`):

```tsx
const [page] = useState(1)          // ← fără setter
const [pageSize] = useState(20)     // ← fără setter
```

Query-ul cere mereu pagina 1 cu 20 de rânduri, iar grid-ul e configurat în **mod client-side**:

```tsx
pagination
pageSize={20}
showPager
// lipsesc: serverSideCount, onPaginationChanged, onSortChanged
```

Consecințe în cascadă, toate din același `doctors` = pagina curentă:

```tsx
const totalActive   = doctors.filter(d => d.isActive).length      // max 20
const totalInactive = doctors.filter(d => !d.isActive).length     // max 20
const specialties   = [...new Set(doctors.map(d => d.specialtyName)...)]   // doar din pagină
const filteredData  = specialtyFilter
  ? doctors.filter(d => d.specialtyName === specialtyFilter)      // filtrare pe NUME, pe pagină
  : doctors
```

În plus `search` merge direct în `queryKey` → **un request HTTP pe fiecare tastă apăsată**.

`PatientsListPage.tsx` rezolvă deja exact aceste probleme; cele două pagini trebuie aliniate la ea.

### Fix — decizie
**Paginare, sortare, căutare și filtrare complet server-side**, după modelul `PatientsListPage`.
Filtrul de specialitate trece de la nume la `specialtyId` (parametrul există deja în
`GetDoctorsQuery` și în `Doctor_GetPaged`, dar nu e folosit de FE), iar sursa listei de specialități
devine nomenclatorul, nu pagina curentă.

**2.a — state + debounce + parametri memoizați**

```tsx
import { useDebounce } from '@/hooks/useDebounce'
import type { PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'

// Căutarea e trimisă la server doar după o pauză de tastare (evită un request/tastă)
const debouncedSearch = useDebounce(search, 350)

const [page, setPage]         = useState(1)
const [pageSize, setPageSize] = useState(20)
const [sortBy, setSortBy]     = useState('fullName')
const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')

// Filtrul de specialitate devine server-side, pe Id — nu pe numele afișat
const [specialtyId, setSpecialtyId] = useState<string | undefined>(undefined)
const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)

// Parametrii — reutilizați și la export, ca să exporte exact ce se vede
const queryParams = useMemo<GetDoctorsParams>(() => ({
  page,
  pageSize,
  search: debouncedSearch || undefined,
  specialtyId,
  departmentId,
  isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  sortBy,
  sortDir,
}), [page, pageSize, debouncedSearch, specialtyId, departmentId, statusFilter, sortBy, sortDir])

const { data: doctorsResp, isError, isFetching } = useDoctors(queryParams)
```

**2.b — orice schimbare de filtru resetează pagina**

```tsx
// Fără reset, trecerea de la pagina 4 la un filtru cu 2 rezultate afișează o pagină goală
useEffect(() => { setPage(1) }, [debouncedSearch, specialtyId, departmentId, statusFilter])
```

**2.c — handlers de grid**

```tsx
const handlePaginationChanged = useCallback((e: PaginationChangedEvent) => {
  setPage(e.page)
  setPageSize(e.pageSize)
}, [])

const handleSortChanged = useCallback((e: SortChangedEvent) => {
  if (e.sort.length > 0) {
    setSortBy(e.sort[0].field)
    setSortDir(e.sort[0].direction ?? 'asc')
  } else {
    setSortBy('fullName')
    setSortDir('asc')
  }
  setPage(1)
}, [])
```

**2.d — grid în mod server-side**

```tsx
<AppDataGrid<DoctorDto>
  ref={gridRef}
  rowData={doctors}                     // direct, fără filteredData
  columnDefs={columnDefs}
  initialSort={[{ field: 'fullName', direction: 'asc' }]}
  // isFetching, nu isLoading: cu keepPreviousData datele vechi rămân afișate,
  // deci altfel schimbarea de pagină nu ar arăta niciun indicator
  loading={isFetching}
  getRowId={(row) => row.id}
  onRowDoubleClick={({ data }) => data && navigate(`/doctors/${data.id}`)}
  pagination
  pageSize={pageSize}
  pageSizes={[10, 20, 50, 100]}
  showPager
  serverSideCount={totalCount}
  onPaginationChanged={handlePaginationChanged}
  onSortChanged={handleSortChanged}
  triStateSort
  multiSortKey="ctrl"
  rowSelection="multiple"
  toolbar
  contextMenu
  // 'filtered-count' ar repeta totalul în mod server-side
  statusBar={[{ type: 'total-count' }, { type: 'selected-count' }]}
  alternateRows
  enableHover
  gridLines="horizontal"
  stickyHeader
/>
```

Se **elimină** `showFilterRow`, `showGroupPanel`, `groupDefaultExpanded` și `rowDragEnabled` (P2-14):
toate operează exclusiv pe pagina încărcată, deci mint despre setul de date. `PatientsListPage`
documentează deja aceeași decizie în comentariu.

**2.e — statistici de la server, nu din pagină**
Depinde de result set-ul de statistici introdus la **P1-4**. După acel fix:

```tsx
const stats = doctorsResp?.data?.stats
// Total / Activi / Inactivi / Specialități distincte — toate din stats, niciunul din `doctors`
```

**2.f — filtrul de specialitate din nomenclator**

```tsx
// Sursa filtrului e nomenclatorul complet, nu pagina curentă
const specialtyOptions = useMemo(
  () => allSpecialties.filter(s => s.level === 1 && s.isActive)
                      .map(s => ({ value: s.id, label: s.name })),
  [allSpecialties],
)
```

### Acceptanță
- Cu 60+ de doctori: pagerul arată 3+ pagini; navigarea la pagina 2 declanșează **un** request cu `page=2`.
- Sortarea pe orice coloană declanșează un request cu `sortBy`/`sortDir` corecte și resetează pagina la 1.
- Tastarea „pop" în căutare produce **un singur** request după 350 ms, nu trei.
- „Activi" + „Inactivi" = „Total doctori" pentru orice filtru aplicat.
- Filtrul „Specialitate" listează toate specialitățile active din nomenclator și trimite `specialtyId` la server.
- Dublu-click pe un rând navighează la `/doctors/:id`.
- Identic verificat pe `/medical-staff` (cu `departmentId` în loc de `specialtyId`).

---

## 3. P0-3 — Audit de ștergere corupt și, la Personal medical, absent

### Simptom
În `AuditLogs`, acțiunile `Delete` pe entitatea `Doctor` au `ChangedBy` = **id-ul clinicii**, nu
al utilizatorului. Nu există nicio cale de a afla cine a șters un medic. Pentru Personal medical
nu există niciun rând de audit. Coloana `UpdatedBy` nu e setată de niciunul dintre cele două SP-uri
de ștergere.

### Cauză
`Doctor_Delete.sql` nu primește deloc autorul ștergerii:

```sql
CREATE OR ALTER PROCEDURE dbo.Doctor_Delete
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER          -- ← lipsește @DeletedBy
...
UPDATE Doctors
SET IsDeleted = 1, IsActive = 0, UpdatedAt = GETDATE()   -- ← fără UpdatedBy
...
INSERT INTO dbo.AuditLogs (..., ChangedBy)
VALUES (..., @ClinicId);                  -- ← BUG: clinica în loc de utilizator
```

Lanțul complet propagă lipsa: `DeleteDoctorCommandHandler` apelează
`repository.DeleteAsync(request.Id, currentUser.ClinicId, ct)` — `currentUser.Id` **există** în
handler, dar nu e transmis, pentru că `IDoctorRepository.DeleteAsync` nu are parametrul.
`MedicalStaff_Delete.sql` nu are nici măcar `INSERT INTO AuditLogs`.

Contrazice direct regula **R3** din `CLAUDE.md` și convenția `DeleteAsync(id, clinicId, deletedBy, ct)`
documentată la §8.

### Fix — decizie
`@DeletedBy` devine parametru obligatoriu pe tot lanțul, iar Personal medical primește audit la paritate
cu Doctors. Semnătura repository-ului se aliniază la convenția din `CLAUDE.md`.

**3.a — `Doctor_Delete.sql`**

```sql
CREATE OR ALTER PROCEDURE dbo.Doctor_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                       WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50300, N'Doctorul nu a fost găsit.', 1;
        END;

        -- [garda referențială de la P0-5 se inserează aici]

        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT FirstName, LastName, Email, PhoneNumber, MedicalCode, LicenseNumber,
                   LicenseExpiresAt, DepartmentId, SpecialtyId, SubspecialtyId,
                   MedicalTitleId, SupervisorDoctorId, IsActive
            FROM dbo.Doctors WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.Doctors
        SET IsDeleted = 1,
            IsActive  = 0,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @DeletedBy          -- ← audit pe rând
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Doctor', @Id, N'Delete', @OldValues, NULL, @DeletedBy);  -- ← utilizatorul

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
```

**3.b — `MedicalStaff_Delete.sql`**: aceeași formă, cu `EntityType = N'MedicalStaff'`, cod `50400`
și blocul `@OldValues` adaptat (fără `SpecialtyId`/`SubspecialtyId`/`MedicalCode`/`LicenseNumber`,
care nu există pe tabel).

**3.c — `MedicalStaff_Create.sql` / `MedicalStaff_Update.sql`**: se adaugă `INSERT INTO dbo.AuditLogs`
cu `Action = N'Create'` / `N'Update'`, copiind exact structura din `Doctor_Create` / `Doctor_Update`
(captarea `@OldValues` **înainte** de `UPDATE`, `@NewValues` **după**).

**3.d — C#**

```csharp
// IDoctorRepository.cs / IMedicalStaffRepository.cs
Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
```

```csharp
// DoctorRepository.cs
public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
{
    using var connection = context.CreateConnection();
    await connection.ExecuteAsync(new CommandDefinition(
        DoctorProcedures.Delete,
        new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
        commandType: CommandType.StoredProcedure,
        cancellationToken: ct));
}
```

```csharp
// DeleteDoctorCommandHandler.cs
await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
```

**3.e — corectarea rândurilor deja scrise greșit.** În `0059_PersonalHardening.sql`, rândurile de
audit în care `ChangedBy` coincide cu `ClinicId` nu pot fi reparate (informația e pierdută), dar
trebuie marcate ca atare pentru a nu fi citite greșit de raportări:

```sql
-- Audit istoric corupt: ChangedBy purta ClinicId (bug în Doctor_Delete, remediat în 0059).
-- Valoarea reală a autorului nu e recuperabilă; marcăm rândurile pentru raportări.
UPDATE dbo.AuditLogs
SET NewValues = N'{"_auditWarning":"ChangedBy invalid (ClinicId) - bug remediat in 0059"}'
WHERE EntityType = N'Doctor'
  AND Action = N'Delete'
  AND ChangedBy = ClinicId
  AND NewValues IS NULL;
```

### Acceptanță
- Ștergerea unui doctor scrie în `AuditLogs` un rând cu `ChangedBy` = id-ul utilizatorului autentificat.
- `Doctors.UpdatedBy` este setat după ștergere.
- Ștergerea unui membru al personalului medical produce un rând `Delete` în `AuditLogs`; crearea și editarea produc `Create`/`Update`.
- `SELECT COUNT(*) FROM AuditLogs WHERE EntityType='Doctor' AND Action='Delete' AND ChangedBy = ClinicId` nu mai crește după fix.

---

## 4. P0-4 — Dezactivarea unei specializări blochează editarea doctorilor

### Simptom
Doi simptome, aceeași cauză.

1. Un administrator dezactivează subspecializarea „Cardiologie intervențională" din
   **Specializări**. De acum, orice salvare din formularul de doctor pe un medic care o are —
   inclusiv o simplă corecție de număr de telefon — eșuează cu *„Subspecialitatea selectată nu este
   validă pentru specializarea aleasă."* Medicul devine **needitabil**, fără nicio indicație despre
   cauza reală.
2. În lista de doctori, coloanele „Specialitate", „Subspecializare" și „Titulatură" devin `—`
   pentru toți medicii afectați, deși datele există în tabel.

### Cauză
**Pentru (1)** — `Doctor_Update.sql` re-validează la fiecare salvare nu doar coerența ierarhică, ci și
faptul că nomenclatorul e **activ acum**:

```sql
IF @SubspecialtyId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM Specialties
    WHERE Id = @SubspecialtyId AND [Level] = 2 AND ParentId = @SpecialtyId
      AND IsActive = 1)                 -- ← blochează salvarea unei valori deja stocate
BEGIN ;THROW 50305, ...; END;
```

Aceeași problemă cu `@MedicalTitleId` și codul `50306`. Regula „nu poți *alege* un nomenclator
inactiv" a fost implementată ca „nu poți *salva* un rând care conține un nomenclator inactiv".

**Pentru (2)** — toate cele trei SP-uri de citire filtrează join-ul pe starea nomenclatorului:

```sql
-- Doctor_GetPaged, Doctor_GetById, Doctor_GetByClinic — identic
LEFT JOIN Specialties  sp  ON sp.Id  = d.SpecialtyId    AND sp.IsActive = 1
LEFT JOIN Specialties  ssp ON ssp.Id = d.SubspecialtyId AND ssp.IsActive = 1
LEFT JOIN MedicalTitles mt ON mt.Id  = d.MedicalTitleId AND mt.IsActive = 1
```

`LEFT JOIN` + predicat pe tabelul din dreapta = numele devine `NULL`. Efect secundar în
`Doctor_GetPaged`: căutarea după numele specialității nu găsește medicii cu specialitate dezactivată.

### Fix — decizie
Se separă **validarea la alegere** de **validarea la persistare**:

- `IsActive` se verifică **doar dacă valoarea s-a schimbat** față de rândul existent. O valoare deja
  stocată rămâne salvabilă indefinit — altfel dezactivarea unui nomenclator ar face date istorice
  needitabile.
- Coerența structurală (`Level = 2`, `ParentId = @SpecialtyId`) se verifică **întotdeauna**: e o
  regulă de integritate, nu de disponibilitate.
- Join-urile de citire nu mai filtrează pe `IsActive`; starea se expune ca **flag separat**, ca UI-ul
  să poată marca vizual o valoare istorică.

**4.a — `Doctor_Update.sql`**

```sql
-- Valorile curente: validarea de disponibilitate se aplică doar la schimbare
DECLARE @CurrentSpecialtyId    UNIQUEIDENTIFIER,
        @CurrentSubspecialtyId UNIQUEIDENTIFIER,
        @CurrentMedicalTitleId UNIQUEIDENTIFIER;

SELECT @CurrentSpecialtyId    = SpecialtyId,
       @CurrentSubspecialtyId = SubspecialtyId,
       @CurrentMedicalTitleId = MedicalTitleId
FROM dbo.Doctors
WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

-- Specializare: structura mereu, disponibilitatea doar la schimbare
IF @SpecialtyId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE Id = @SpecialtyId AND [Level] = 1)
    BEGIN
        ;THROW 50307, N'Specializarea selectată nu există sau nu este de nivel 1.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Specialties
                   WHERE Id = @SpecialtyId AND IsActive = 1)
       AND (@CurrentSpecialtyId IS NULL OR @CurrentSpecialtyId <> @SpecialtyId)
    BEGIN
        ;THROW 50307, N'Specializarea selectată este dezactivată și nu poate fi atribuită.', 1;
    END;
END;

IF @SubspecialtyId IS NOT NULL
BEGIN
    IF @SpecialtyId IS NULL
    BEGIN
        ;THROW 50305, N'Nu se poate selecta o subspecialitate fără a selecta o specializare.', 1;
    END;

    -- Structura: se verifică la fiecare salvare
    IF NOT EXISTS (SELECT 1 FROM dbo.Specialties
                   WHERE Id = @SubspecialtyId AND [Level] = 2 AND ParentId = @SpecialtyId)
    BEGIN
        ;THROW 50305, N'Subspecialitatea selectată nu este validă pentru specializarea aleasă.', 1;
    END;

    -- Disponibilitatea: doar dacă utilizatorul schimbă valoarea
    IF NOT EXISTS (SELECT 1 FROM dbo.Specialties
                   WHERE Id = @SubspecialtyId AND IsActive = 1)
       AND (@CurrentSubspecialtyId IS NULL OR @CurrentSubspecialtyId <> @SubspecialtyId)
    BEGIN
        ;THROW 50305, N'Subspecialitatea selectată este dezactivată și nu poate fi atribuită.', 1;
    END;
END;

-- Titulatură: aceeași structură de verificare
IF @MedicalTitleId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.MedicalTitles WHERE Id = @MedicalTitleId)
BEGIN
    ;THROW 50306, N'Titulatura medicală selectată nu există.', 1;
END;

IF @MedicalTitleId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.MedicalTitles WHERE Id = @MedicalTitleId AND IsActive = 1)
   AND (@CurrentMedicalTitleId IS NULL OR @CurrentMedicalTitleId <> @MedicalTitleId)
BEGIN
    ;THROW 50306, N'Titulatura medicală selectată este dezactivată și nu poate fi atribuită.', 1;
END;
```

`Doctor_Create.sql` păstrează `IsActive = 1` fără excepție — la creare nu există valoare anterioară.
Se adaugă însă validarea lipsă a `@SpecialtyId` (`Level = 1`, cod nou `50307`), care azi nu există deloc:
orice GUID poate fi scris în `Doctors.SpecialtyId` cât timp FK-ul e satisfăcut, inclusiv un Level 0 sau 2.

`MedicalStaff_Update.sql` primește același tratament pentru `@MedicalTitleId`.

**4.b — join-uri de citire (toate cele trei SP-uri Doctor + `MedicalStaff_GetPaged`)**

```sql
-- IsActive NU se filtrează în join: un nomenclator dezactivat nu trebuie să șteargă
-- numele din date istorice. Starea se expune separat, pentru marcaj vizual în UI.
LEFT JOIN dbo.Specialties   sp  ON sp.Id  = d.SpecialtyId
LEFT JOIN dbo.Specialties   ssp ON ssp.Id = d.SubspecialtyId
LEFT JOIN dbo.MedicalTitles mt  ON mt.Id  = d.MedicalTitleId
```

și în lista de coloane:

```sql
sp.Name   AS SpecialtyName,
sp.IsActive   AS SpecialtyIsActive,
ssp.Name  AS SubspecialtyName,
ssp.IsActive  AS SubspecialtyIsActive,
mt.Name   AS MedicalTitleName,
mt.IsActive   AS MedicalTitleIsActive,
```

`Doctor_GetByClinic` (lookup) păstrează `d.IsActive = 1` pe doctor — acolo filtrul e corect, e vorba
de medicul inactiv, nu de nomenclator.

**4.c — DTO-uri + FE**

```csharp
// DoctorListDto.cs / DoctorDetailDto.cs
public bool? SpecialtyIsActive    { get; init; }
public bool? SubspecialtyIsActive { get; init; }
public bool? MedicalTitleIsActive { get; init; }
```

```tsx
// DoctorsListPage.tsx — o specializare dezactivată se afișează, dar marcată
const specialtyTemplate = useCallback((row: DoctorDto) => {
  if (!row.specialtyName) return <NullCell />
  return row.specialtyIsActive === false
    ? <AppBadge variant="secondary" title="Specializare dezactivată în nomenclator">
        {row.specialtyName}
      </AppBadge>
    : <AppBadge variant="primary">{row.specialtyName}</AppBadge>
}, [])
```

Dropdown-urile din `DoctorFormModal` continuă să ofere **doar** valori active (`s.isActive`), dar
trebuie să includă valoarea curentă chiar dacă e inactivă, altfel Syncfusion afișează câmpul gol
și prima salvare o șterge silențios:

```tsx
// Valoarea stocată rămâne selectabilă chiar dacă a fost dezactivată între timp,
// altfel dropdown-ul ar afișa gol și salvarea ar șterge datele existente.
const level1Specialties = useMemo(() => {
  const active = specialties.filter(s => s.level === 1 && s.isActive)
  const currentId = editData?.specialtyId
  if (!currentId || active.some(s => s.id === currentId)) return active
  const current = specialties.find(s => s.id === currentId)
  return current ? [...active, current] : active
}, [specialties, editData])
```

Aceeași construcție pentru `filteredSubspecialties` și `doctorTitles`.

**4.d — cod de eroare nou**

```csharp
// SqlErrorCodes.cs, secțiunea Doctori
public const int DoctorInvalidSpecialty = 50307;   // vezi §7 pentru renumerotarea completă
```

```csharp
// ErrorMessages.cs → static class Doctor
public const string InvalidSpecialty = "Specializarea selectată nu este validă sau este dezactivată.";
```

### Acceptanță
- Dezactivare a unei subspecializări folosite → editarea telefonului unui medic care o are **reușește**.
- Încercarea de a *atribui* acea subspecializare unui alt medic → 400 cu mesajul „…este dezactivată și nu poate fi atribuită."
- În listă, medicul afectat continuă să afișeze numele specializării, cu badge gri și tooltip.
- `POST /api/v1/Doctors` cu un `specialtyId` care e Level 0 sau Level 2 → 400, nu 201.
- Deschiderea formularului pe un medic cu titulatură dezactivată arată titulatura în dropdown; salvarea fără modificări o păstrează.

---

## 5. P0-5 — Soft delete fără gardă referențială

### Simptom
Un medic este șters din **Doctori**. Ulterior se constată că:
- contul de utilizator legat de el (`Users.DoctorId`) **poate încă face login** și emite rețete;
- e încă „șef de departament" (`Departments.HeadDoctorId`);
- programările viitoare rămân alocate lui și nu apar nicăieri ca orfane;
- medicii pe care îi supervizează păstrează `SupervisorDoctorId` către un rând șters, iar
  `SupervisorName` devine `NULL` fără explicație (join-ul filtrează `sup.IsDeleted = 0`).

### Cauză
`Doctor_Delete` verifică doar existența. Nu există niciun `IF EXISTS` pe cele nouă tabele care
referențiază `Doctors(Id)`:

```
Users.DoctorId · Departments.HeadDoctorId · Doctors.SupervisorDoctorId
MedicalStaff.SupervisorDoctorId · PatientDoctors.DoctorId · DoctorSchedule.DoctorId
Appointments.DoctorId · Consultations.DoctorId · Prescriptions.DoctorId
```

Contrazice regula **R4** din `CLAUDE.md`: logica de business trăiește în SP, iar „nu se șterge un
medic cu dependențe active" este exact o regulă de business.

### Fix — decizie
Se distinge între dependențe **blocante** și dependențe **care se curăță**:

| Dependență | Tratament | Motiv |
|---|---|---|
| `Users.DoctorId` (cont activ) | **Blochează** (`50308`) | Ștergerea ar lăsa un cont funcțional fără medic — risc de securitate |
| `Appointments` viitoare, ne-anulate | **Blochează** (`50309`) | Pacienți programați la un medic inexistent |
| `Departments.HeadDoctorId` | **Curăță** (`SET NULL`) | Nu blochează nimic; departamentul rămâne valid fără șef |
| `Doctors.SupervisorDoctorId`, `MedicalStaff.SupervisorDoctorId` | **Curăță** (`SET NULL`) | Ierarhia se reconstruiește; un pointer spre un rând șters nu are sens |
| `DoctorSchedule` | **Dezactivează** rândurile | Programul unui medic șters nu trebuie să genereze sloturi |
| `Consultations`, `Prescriptions`, `PatientDoctors` | **Se păstrează intacte** | Date medicale istorice; `DoctorId` e parte din dosarul pacientului |

Blocul se inserează în `Doctor_Delete.sql`, în tranzacție, după verificarea de existență:

```sql
-- Gardă 1: cont de utilizator activ legat de acest medic
IF EXISTS (SELECT 1 FROM dbo.Users
           WHERE DoctorId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
BEGIN
    ;THROW 50308, N'Medicul are un cont de utilizator activ. Dezactivați mai întâi contul.', 1;
END;

-- Gardă 2: programări viitoare ne-anulate
IF EXISTS (
    SELECT 1 FROM dbo.Appointments a
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.DoctorId = @Id AND a.ClinicId = @ClinicId AND a.IsDeleted = 0
      AND a.StartTime >= SYSDATETIME()
      AND s.Code NOT IN ('ANULATA', 'NEPREZENTAT')
)
BEGIN
    ;THROW 50309, N'Medicul are programări viitoare. Reprogramați-le sau anulați-le înainte de ștergere.', 1;
END;

-- Curățare: referințe care nu au sens către un rând șters
UPDATE dbo.Departments  SET HeadDoctorId      = NULL, UpdatedAt = SYSDATETIME(), UpdatedBy = @DeletedBy
WHERE HeadDoctorId = @Id AND ClinicId = @ClinicId;

UPDATE dbo.Doctors      SET SupervisorDoctorId = NULL, UpdatedAt = SYSDATETIME(), UpdatedBy = @DeletedBy
WHERE SupervisorDoctorId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

UPDATE dbo.MedicalStaff SET SupervisorDoctorId = NULL, UpdatedAt = SYSDATETIME(), UpdatedBy = @DeletedBy
WHERE SupervisorDoctorId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

UPDATE dbo.DoctorSchedule SET IsActive = 0, UpdatedAt = SYSDATETIME()
WHERE DoctorId = @Id AND ClinicId = @ClinicId AND IsActive = 1;
```

> **Verificați numele codului de status și coloanele `Appointments`** (`StartTime`, `StatusId`,
> `AppointmentStatuses.Code`) în `0027_CreateAppointments.sql` și `0057_AppointmentsHardening.sql`
> înainte de a copia blocul — dacă schema diferă, adaptați predicatul, nu îl eliminați.

`MedicalStaff_Delete` primește garda echivalentă doar pe `Users.MedicalStaffId` (`50407`):
personalul medical nu are programări proprii.

**Handler + mesaje:**

```csharp
// DeleteDoctorCommandHandler.cs
catch (SqlException ex) when (ex.Number == SqlErrorCodes.DoctorHasActiveUser)
{
    return Result<bool>.Conflict(ErrorMessages.Doctor.HasActiveUser);
}
catch (SqlException ex) when (ex.Number == SqlErrorCodes.DoctorHasFutureAppointments)
{
    return Result<bool>.Conflict(ErrorMessages.Doctor.HasFutureAppointments);
}
```

**UI:** `ConfirmDeleteDialog` primește un text care anunță consecințele; mesajul de 409 se afișează
prin `FeedbackAlerts` (vezi P2-1), nu se pierde.

### Acceptanță
- Ștergerea unui medic cu cont activ → **409** cu mesaj explicit, medicul rămâne nemodificat, `AuditLogs` nu primește rând.
- Ștergerea unui medic cu o programare mâine → **409**.
- Ștergerea unui medic care e șef de departament → **200**, iar `Departments.HeadDoctorId` devine `NULL`.
- Ștergerea unui supervizor → subordonații au `SupervisorDoctorId = NULL`, nu un pointer mort.
- Consultațiile și rețetele istorice ale medicului șters rămân accesibile în dosarul pacientului.

---

## 6. P1 — Corectitudine și performanță SQL

### 6.1 Paginare fără tie-break determinist (P1-1)

`Doctor_GetPaged` și `MedicalStaff_GetPaged` termină `ORDER BY` pe coloana de sortare, fără
discriminant final. Cu `OFFSET/FETCH`, două rânduri cu același `LastName` pot apărea pe ambele
pagini sau pe niciuna — ordinea între chei egale nu e garantată de SQL Server.

`Patient_GetPaged` rezolvă deja problema și documentează motivul; se aplică identic:

```sql
        END DESC,
        -- Tie-break stabil: fără el, paginarea poate repeta sau sări rânduri
        -- când valoarea de sortare e identică (OFFSET/FETCH nu garantează ordinea).
        d.Id
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
```

**Acceptanță:** cu 5 doctori cu `LastName = 'Popescu'` și `pageSize = 2`, parcurgerea celor 3 pagini
returnează exact 5 id-uri distincte.

### 6.2 `sortBy` din client ignorat tacit (P1-2)

Frontendul trimite `sortBy: 'fullName'`. SP-ul compară cu `'FirstName'`, `'LastName'`, `'Email'`,
`'SpecialtyName'`, `'MedicalCode'` — `'fullName'` nu se potrivește cu niciuna, cade pe `ELSE
d.LastName`. Sortarea pe „Doctor", „Departament", „Aviz expiră", „Înregistrat" nu ajunge niciodată
la server: grid-ul sortează doar cele 20 de rânduri locale.

Se preia normalizarea din `Patient_GetPaged` (camelCase + variabile locale, care elimină și
*parameter sniffing*) și se completează lista de chei:

```sql
    -- Variabile locale: evită parameter sniffing pe planul cache-uit
    DECLARE @Page_     INT          = ISNULL(NULLIF(@Page, 0), 1);
    DECLARE @PageSize_ INT          = CASE WHEN ISNULL(@PageSize, 20) BETWEEN 1 AND 200
                                           THEN @PageSize ELSE 20 END;
    DECLARE @SortBy_   NVARCHAR(50) = ISNULL(NULLIF(@SortBy, ''), 'lastName');
    DECLARE @SortDir_  NVARCHAR(4)  = CASE WHEN LOWER(ISNULL(@SortDir,'asc')) = 'desc'
                                           THEN 'desc' ELSE 'asc' END;

    -- Numele coloanei vine fie PascalCase (default-ul controller-ului), fie camelCase (grid-ul)
    SET @SortBy_ = LOWER(LEFT(@SortBy_, 1)) + SUBSTRING(@SortBy_, 2, LEN(@SortBy_));
```

```sql
    ORDER BY
        -- Coloane text. Fiecare tip de date are propriul bloc: un singur CASE
        -- nu poate returna simultan NVARCHAR, BIT și DATE.
        CASE WHEN @SortDir_ = 'asc' THEN
            CASE @SortBy_
                WHEN 'fullName'         THEN d.LastName + N' ' + d.FirstName
                WHEN 'firstName'        THEN d.FirstName
                WHEN 'lastName'         THEN d.LastName
                WHEN 'email'            THEN d.Email
                WHEN 'specialtyName'    THEN sp.Name
                WHEN 'subspecialtyName' THEN ssp.Name
                WHEN 'departmentName'   THEN dep.Name
                WHEN 'medicalCode'      THEN d.MedicalCode
                WHEN 'licenseNumber'    THEN d.LicenseNumber
                WHEN 'phoneNumber'      THEN d.PhoneNumber
            END
        END ASC,
        /* blocul DESC identic */
        CASE WHEN @SortDir_ = 'asc'  THEN CASE @SortBy_ WHEN 'isActive' THEN CAST(d.IsActive AS INT) END END ASC,
        CASE WHEN @SortDir_ = 'desc' THEN CASE @SortBy_ WHEN 'isActive' THEN CAST(d.IsActive AS INT) END END DESC,
        CASE WHEN @SortDir_ = 'asc'  THEN CASE @SortBy_ WHEN 'licenseExpiresAt' THEN d.LicenseExpiresAt
                                                        WHEN 'createdAt' THEN CAST(d.CreatedAt AS DATE) END END ASC,
        CASE WHEN @SortDir_ = 'desc' THEN CASE @SortBy_ WHEN 'licenseExpiresAt' THEN d.LicenseExpiresAt
                                                        WHEN 'createdAt' THEN CAST(d.CreatedAt AS DATE) END END DESC,
        d.Id;
```

> `FullName` afișat este `FirstName + ' ' + LastName`, dar sortarea pe „Doctor" folosește
> `LastName + ' ' + FirstName` — la fel ca la Pacienți, unde sortarea alfabetică pe nume de familie
> e comportamentul așteptat de utilizator. **Nu aliniați cele două**: ar rupe sortarea utilă.

Se recomandă și unificarea concatenării la `CONCAT(...)` în loc de `+`: `+` propagă `NULL`, iar
`sup.FirstName + ' ' + sup.LastName` e deja pe un `LEFT JOIN`, deci teoretic nullable.

**Acceptanță:** click pe headerul „Doctor" → request cu `sortBy=fullName`, ordine alfabetică pe nume
de familie; click pe „Aviz expiră" → ordonare cronologică reală pe toate paginile. `sortBy=DROP TABLE`
→ fallback pe `lastName`, fără eroare.

### 6.3 `LIKE` fără escape și predicate duplicate (P1-3)

```sql
DECLARE @SearchTerm NVARCHAR(202) = '%' + ISNULL(@Search, '') + '%';
```

Un termen care conține `%`, `_` sau `[` e interpretat ca wildcard: căutarea `50%` returnează toată
clinica. Al doilea result set (`COUNT(*)`) repetă predicatele manual → orice modificare a filtrelor
trebuie făcută în două locuri, iar azi cele două liste deja **diferă** (result set 1 face join pe
`Departments`, result set 2 nu).

Fix: escape explicit + un singur CTE reutilizat pentru rânduri și pentru total.

```sql
    -- Escape pentru wildcards: altfel un termen ca '50%' potrivește tot
    DECLARE @SearchTerm NVARCHAR(210) =
        N'%' + REPLACE(REPLACE(REPLACE(ISNULL(@Search_, N''), N'[', N'[[]'),
                               N'%', N'[%]'), N'_', N'[_]') + N'%';

    ;WITH Filtered AS (
        SELECT
            d.Id, d.ClinicId, d.DepartmentId, dep.Name AS DepartmentName,
            d.SupervisorDoctorId,
            CONCAT(sup.LastName, N' ', sup.FirstName) AS SupervisorName,
            d.SpecialtyId,    sp.Name  AS SpecialtyName,    sp.IsActive  AS SpecialtyIsActive,
            d.SubspecialtyId, ssp.Name AS SubspecialtyName, ssp.IsActive AS SubspecialtyIsActive,
            d.MedicalTitleId, mt.Name  AS MedicalTitleName, mt.IsActive  AS MedicalTitleIsActive,
            d.FirstName, d.LastName,
            CONCAT(d.FirstName, N' ', d.LastName) AS FullName,
            d.Email, d.PhoneNumber, d.MedicalCode, d.LicenseNumber, d.LicenseExpiresAt,
            d.IsActive, d.CreatedAt,
            COUNT(*) OVER () AS TotalCount        -- ← un singur pasaj peste setul filtrat
        FROM dbo.Doctors d
        LEFT JOIN dbo.Departments   dep ON dep.Id = d.DepartmentId       AND dep.IsDeleted = 0
        LEFT JOIN dbo.Doctors       sup ON sup.Id = d.SupervisorDoctorId AND sup.IsDeleted = 0
        LEFT JOIN dbo.Specialties   sp  ON sp.Id  = d.SpecialtyId
        LEFT JOIN dbo.Specialties   ssp ON ssp.Id = d.SubspecialtyId
        LEFT JOIN dbo.MedicalTitles mt  ON mt.Id  = d.MedicalTitleId
        WHERE d.ClinicId = @ClinicId
          AND d.IsDeleted = 0
          AND (@IsActive     IS NULL OR d.IsActive     = @IsActive)
          AND (@SpecialtyId  IS NULL OR d.SpecialtyId  = @SpecialtyId
                                     OR d.SubspecialtyId = @SpecialtyId)
          AND (@DepartmentId IS NULL OR d.DepartmentId = @DepartmentId)
          AND (@Search_ IS NULL OR @Search_ = N'' OR
               d.LastName    LIKE @SearchTerm ESCAPE N'[' OR
               d.FirstName   LIKE @SearchTerm ESCAPE N'[' OR
               d.Email       LIKE @SearchTerm ESCAPE N'[' OR
               d.MedicalCode LIKE @SearchTerm ESCAPE N'[' OR
               d.LicenseNumber LIKE @SearchTerm ESCAPE N'[' OR
               sp.Name       LIKE @SearchTerm ESCAPE N'[' OR
               ssp.Name      LIKE @SearchTerm ESCAPE N'[')
    )
    SELECT * FROM Filtered
    ORDER BY /* vezi 6.2 */
    OFFSET (@Page_ - 1) * @PageSize_ ROWS FETCH NEXT @PageSize_ ROWS ONLY;

    -- Result set 2: totalul, citit din același CTE (0 dacă nu există rânduri)
    SELECT ISNULL((SELECT TOP 1 TotalCount FROM Filtered), 0);
```

> `COUNT(*) OVER ()` costă un pasaj suplimentar peste setul filtrat, dar elimină clasa de bug-uri
> „predicatele s-au desincronizat". La volumele acestui modul (sute de rânduri per clinică) e
> compromisul corect. Alternativa — a păstra două query-uri — cere un test care compară cele două
> liste de predicate; nu merită.

Observați și extinderea filtrului `@SpecialtyId` la `SubspecialtyId`: azi un filtru pe „Cardiologie"
nu returnează medicii înregistrați doar pe subspecializarea ei, ceea ce surprinde utilizatorul.

**Acceptanță:** căutarea `%` returnează 0 rezultate (sau doar medicii care au literal `%` în date),
nu întreaga clinică. Numărul din pager coincide cu numărul de rânduri parcurse efectiv.

### 6.4 Lipsă result set de statistici (P1-4)

Bara de statistici din UI are nevoie de totaluri pe **tot** setul filtrat. `Consultations` rezolvă
asta cu un al treilea result set și un DTO wrapper; Doctori/Personal medical nu au niciunul, de unde
P0-2.e.

**SQL** — al treilea result set în `Doctor_GetPaged`, cu **aceleași filtre** ca `Filtered`, dar fără
cele de status (altfel „Activi" ar fi mereu egal cu totalul când filtrul e „Activi"):

```sql
    -- Result set 3: statistici pe setul filtrat, ignorând filtrul de status
    SELECT
        COUNT(*)                                                   AS TotalDoctors,
        SUM(CASE WHEN d.IsActive = 1 THEN 1 ELSE 0 END)            AS ActiveCount,
        SUM(CASE WHEN d.IsActive = 0 THEN 1 ELSE 0 END)            AS InactiveCount,
        COUNT(DISTINCT d.SpecialtyId)                              AS SpecialtyCount,
        SUM(CASE WHEN d.LicenseExpiresAt IS NOT NULL
                  AND d.LicenseExpiresAt < CAST(SYSDATETIME() AS DATE)
                 THEN 1 ELSE 0 END)                                AS ExpiredLicenseCount,
        SUM(CASE WHEN d.LicenseExpiresAt IS NOT NULL
                  AND d.LicenseExpiresAt >= CAST(SYSDATETIME() AS DATE)
                  AND d.LicenseExpiresAt <  DATEADD(DAY, 60, CAST(SYSDATETIME() AS DATE))
                 THEN 1 ELSE 0 END)                                AS ExpiringSoonCount
    FROM dbo.Doctors d
    LEFT JOIN dbo.Specialties sp  ON sp.Id  = d.SpecialtyId
    LEFT JOIN dbo.Specialties ssp ON ssp.Id = d.SubspecialtyId
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND (@SpecialtyId  IS NULL OR d.SpecialtyId = @SpecialtyId OR d.SubspecialtyId = @SpecialtyId)
      AND (@DepartmentId IS NULL OR d.DepartmentId = @DepartmentId)
      AND (@Search_ IS NULL OR @Search_ = N'' OR
           d.LastName LIKE @SearchTerm ESCAPE N'[' OR
           d.FirstName LIKE @SearchTerm ESCAPE N'[' OR
           d.Email LIKE @SearchTerm ESCAPE N'[' OR
           d.MedicalCode LIKE @SearchTerm ESCAPE N'[' OR
           d.LicenseNumber LIKE @SearchTerm ESCAPE N'[' OR
           sp.Name LIKE @SearchTerm ESCAPE N'[' OR
           ssp.Name LIKE @SearchTerm ESCAPE N'[');
```

**C#** — se introduce wrapper-ul, exact după modelul `ConsultationsPagedResponse`:

```csharp
// Features/Doctors/DTOs/DoctorStatsDto.cs
public sealed class DoctorStatsDto
{
    public int TotalDoctors        { get; init; }
    public int ActiveCount         { get; init; }
    public int InactiveCount       { get; init; }
    public int SpecialtyCount      { get; init; }
    public int ExpiredLicenseCount { get; init; }
    public int ExpiringSoonCount   { get; init; }
}

// Features/Doctors/DTOs/DoctorsPagedResponse.cs
public sealed class DoctorsPagedResponse
{
    public required PagedResult<DoctorListDto> PagedResult { get; init; }
    public required DoctorStatsDto             Stats       { get; init; }
}
```

```csharp
// IDoctorRepository.cs
public sealed record DoctorPagedResult(
    PagedResult<DoctorListDto> Paged,
    DoctorStatsDto Stats);

Task<DoctorPagedResult> GetPagedAsync(/* ... */);
```

```csharp
// DoctorRepository.cs
var items      = (await multi.ReadAsync<DoctorListDto>()).ToList();
var totalCount = await multi.ReadSingleAsync<int>();
var stats      = await multi.ReadSingleAsync<DoctorStatsDto>();

return new DoctorPagedResult(
    new PagedResult<DoctorListDto>(items, totalCount, page, pageSize),
    stats);
```

> **Breaking change de contract:** `GET /api/v1/Doctors` returnează acum
> `{ pagedResult: {...}, stats: {...} }` în loc de `{ items, totalCount, ... }` direct. Trebuie
> actualizate `doctors.api.ts`, `DoctorsPagedResult` din `doctor.types.ts` și regenerat contractul
> (`generate-openapi.ps1` → `npm run gen:api`), altfel jobul `contract` din CI cade — **R9**.
> Forma nouă e identică celei folosite deja de Pacienți (`resp?.data?.pagedResult?.items`).

Identic pentru `MedicalStaff_GetPaged` (fără statisticile de aviz CMR, care nu se aplică).

**Acceptanță:** cu filtrul „Inactivi" aplicat, cardurile arată totalul clinicii pe „Total", nu doar
inactivii; „Activi" + „Inactivi" = „Total"; se adaugă un card „Avize expirate" care nu era posibil înainte.

### 6.5 Index-uri (P1-5)

Index-urile existente nu deservesc query-ul real:

| Index existent | Problemă |
|---|---|
| `IX_Doctors_IsActive ON Doctors(IsActive) WHERE IsDeleted = 0` | Coloană `BIT`, selectivitate ~50%, nu începe cu `ClinicId` → optimizatorul nu îl folosește pentru query-ul pe tenant |
| `IX_Specialties_IsActive ON Specialties(IsActive)` | Idem, pe un tabel de câteva sute de rânduri — cost de întreținere fără beneficiu |
| `IX_Doctors_ClinicId ON Doctors(ClinicId) WHERE IsDeleted = 0` | Acoperă filtrul, dar nu ordinea de sortare → `Sort` explicit la fiecare pagină |

În `0059_PersonalHardening.sql`:

```sql
-- Index pentru paginarea implicită: filtru pe tenant + ordinea de sortare implicită.
-- Fără el, fiecare pagină cere un Sort peste toți doctorii clinicii.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Doctors_ClinicId_LastName_FirstName' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_ClinicId_LastName_FirstName
        ON dbo.Doctors (ClinicId, LastName, FirstName)
        INCLUDE (Id, DepartmentId, SpecialtyId, SubspecialtyId, MedicalTitleId,
                 Email, PhoneNumber, MedicalCode, LicenseNumber, LicenseExpiresAt,
                 IsActive, CreatedAt)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_MedicalStaff_ClinicId_LastName_FirstName' AND object_id = OBJECT_ID('dbo.MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_ClinicId_LastName_FirstName
        ON dbo.MedicalStaff (ClinicId, LastName, FirstName)
        INCLUDE (Id, DepartmentId, SupervisorDoctorId, MedicalTitleId,
                 Email, PhoneNumber, IsActive, CreatedAt)
        WHERE IsDeleted = 0;
GO

-- Index pentru raportul de avize CMR care expiră
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Doctors_ClinicId_LicenseExpiresAt' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_ClinicId_LicenseExpiresAt
        ON dbo.Doctors (ClinicId, LicenseExpiresAt)
        WHERE IsDeleted = 0 AND LicenseExpiresAt IS NOT NULL;
GO

-- Index-uri cu selectivitate nulă: BIT singur, nefolosit de optimizator
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_IsActive' AND object_id = OBJECT_ID('dbo.Doctors'))
    DROP INDEX IX_Doctors_IsActive ON dbo.Doctors;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_IsActive' AND object_id = OBJECT_ID('dbo.MedicalStaff'))
    DROP INDEX IX_MedicalStaff_IsActive ON dbo.MedicalStaff;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Specialties_IsActive' AND object_id = OBJECT_ID('dbo.Specialties'))
    DROP INDEX IX_Specialties_IsActive ON dbo.Specialties;
GO
```

**Acceptanță:** planul de execuție pentru `Doctor_GetPaged` (default sort) folosește
`IX_Doctors_ClinicId_LastName_FirstName` cu `Index Seek`, fără operator `Sort` și fără `Key Lookup`.

### 6.6 `GETDATE()` → `SYSDATETIME()`, precizie `DATETIME2` (P1-1 conex)

Toate cele 11 SP-uri din perimetru folosesc `GETDATE()`, care returnează `DATETIME` (precizie
~3,33 ms) și e convertit implicit la `DATETIME2`. `CLAUDE.md` R3 cere `SYSDATETIME()`. Se înlocuiește
mecanic peste tot. Coloanele declarate `DATETIME2` fără precizie (`DATETIME2(7)`) diferă de convenția
`DATETIME2(0)` din `CLAUDE.md`; **nu le modificați în această migrare** — `ALTER COLUMN` pe tabele cu
index-uri și `ROWVERSION` nu merită riscul pentru un câștig cosmetic. Se documentează ca datorie.

### 6.7 `RowVersion` există, dar nu e folosit (P1-6)

`Doctors` și `MedicalStaff` au coloană `RowVersion ROWVERSION NOT NULL`, iar proiectul are deja
convenția de concurență în alte module (`AppointmentConcurrency = 50019`,
`MedicalServiceConcurrency = 50613`). Aici nu e folosită: două administratori care deschid simultan
același medic se suprascriu silențios, iar `AuditLogs` arată două `Update` fără indiciu de conflict.

Fix: `@RowVersion VARBINARY(8)` opțional pe `Doctor_Update` / `MedicalStaff_Update`:

```sql
    @RowVersion VARBINARY(8) = NULL,   -- NULL = client fără suport de concurență (compatibilitate)
```

```sql
    -- Concurență optimistă: rândul s-a schimbat între citire și salvare
    IF @RowVersion IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM dbo.Doctors
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0 AND RowVersion = @RowVersion)
    BEGIN
        ;THROW 50310, N'Datele au fost modificate de alt utilizator. Reîncărcați și încercați din nou.', 1;
    END;
```

`DoctorDetailDto` / `DoctorListDto` expun `RowVersion` ca `byte[]` (serializat base64), formularul îl
trimite înapoi la `PUT`, handlerul mapează `50310` la `Result<bool>.Conflict(...)`, iar UI-ul, la 409,
invalidează `doctorKeys.detail(id)` și cere reîncărcarea. Parametrul rămâne opțional ca migrarea să
nu rupă clienții existenți.

**Acceptanță:** două taburi deschid același medic; primul salvează; al doilea primește **409** cu mesaj
de reîncărcare, nu 200.

### 6.8 Parafa medicală nu e unică (P1-8)

`MedicalCode` (parafa) e identificatorul legal al medicului și apare pe rețete și documente. Nu are
nicio constrângere: doi medici pot avea aceeași parafă, ceea ce invalidează documentele emise.

```sql
-- Parafa medicală identifică legal medicul pe rețete: unică per clinică, printre activi
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_Doctors_ClinicId_MedicalCode_Active' AND object_id = OBJECT_ID('dbo.Doctors'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_Doctors_ClinicId_MedicalCode_Active
        ON dbo.Doctors (ClinicId, MedicalCode)
        WHERE IsDeleted = 0 AND MedicalCode IS NOT NULL;
GO
```

> **Pre-verificare obligatorie** (vezi §10): dacă există deja duplicate, migrarea eșuează. Scriptul
> trebuie să le raporteze, nu să le rezolve automat — alegerea parafei corecte e decizie de business.

Se adaugă și verificarea în `Doctor_Create` / `Doctor_Update` pentru un mesaj de business
(`50311`, „Un doctor cu această parafă există deja."), pe modelul verificării de email.

### 6.9 Specializări și Titulaturi: integritate și audit (P1-11, P1-13)

**a) Ciclu în ierarhie.** `Specialty_Update` are comentariul *„Nu se poate pune ca părinte pe sine
sau pe un descendent al său"*, dar codul verifică doar `@ParentId = @Id`. Un ciclu `A → B → A` se
obține în două update-uri, după care orice parcurgere recursivă a arborelui se blochează. Codul
`SpecialtyCircularRef = 50103` există deja și e folosit pe jumătate.

```sql
    -- Ciclu în ierarhie: @ParentId nu poate fi @Id nici un descendent al lui.
    -- Comentariul din versiunea anterioară promitea această verificare; codul nu o făcea.
    IF @ParentId IS NOT NULL
    BEGIN
        IF @ParentId = @Id
        BEGIN
            ;THROW 50103, N'O specializare nu poate fi părinte pentru ea însăși.', 1;
        END;

        ;WITH Descendants AS (
            SELECT Id FROM dbo.Specialties WHERE ParentId = @Id
            UNION ALL
            SELECT s.Id FROM dbo.Specialties s
            INNER JOIN Descendants dsc ON s.ParentId = dsc.Id
        )
        SELECT 1 FROM Descendants WHERE Id = @ParentId;

        IF @@ROWCOUNT > 0
        BEGIN
            ;THROW 50103, N'Părintele selectat este un descendent al acestei specializări (ciclu).', 1;
        END;
    END;
```

**b) `Level` incoerent cu părintele.** Nici `Create`, nici `Update` nu verifică relația
`Level = ParentLevel + 1`. Se poate crea un Level 2 sub un Level 2, sau un Level 1 fără părinte prin
`PUT` (vezi și P1-8 pe partea C#). Rezultatul: rânduri care apar în `Specialty_GetAll` — deci în
dropdown-ul de doctor — dar **nu** în `Specialty_GetTree`, deci invizibile în ecranul de administrare.

```sql
    -- Nivelul trebuie să fie exact ParentLevel + 1; altfel arborele are noduri
    -- care apar în lista flat, dar nu în GetTree (invizibile în UI).
    DECLARE @ParentLevel TINYINT = NULL;

    IF @ParentId IS NOT NULL
    BEGIN
        SELECT @ParentLevel = [Level] FROM dbo.Specialties WHERE Id = @ParentId;

        IF @ParentLevel IS NULL
        BEGIN
            ;THROW 50101, N'Categoria/specializarea părinte nu a fost găsită.', 1;
        END;

        IF @Level <> @ParentLevel + 1
        BEGIN
            ;THROW 50104, N'Nivelul selectat nu corespunde nivelului părintelui.', 1;
        END;
    END
    ELSE IF @Level <> 0
    BEGIN
        ;THROW 50104, N'Numai categoriile (nivel 0) pot exista fără părinte.', 1;
    END;
```

Cod nou: `SqlErrorCodes.SpecialtyInvalidLevel = 50104`.

**c) Blocarea schimbării de `Level` pe noduri folosite.** Dacă o subspecializare referită de
`Doctors.SubspecialtyId` devine Level 1, validarea din `Doctor_Update` o respinge și medicul devine
needitabil (chiar și cu fixul de la P0-4, pentru că acolo structura se verifică mereu).

```sql
    -- Nu se schimbă nivelul unui nod referit de doctori: ar invalida datele existente
    IF EXISTS (SELECT 1 FROM dbo.Specialties WHERE Id = @Id AND [Level] <> @Level)
       AND EXISTS (SELECT 1 FROM dbo.Doctors
                   WHERE (SpecialtyId = @Id OR SubspecialtyId = @Id) AND IsDeleted = 0)
    BEGIN
        ;THROW 50105, N'Nivelul nu poate fi schimbat: specializarea este atribuită unor medici.', 1;
    END;
```

**d) Reactivarea nu cascadează.** `Specialty_ToggleActive` dezactivează copiii și nepoții, dar
reactivarea atinge doar nodul. Rezultat posibil: copil activ sub părinte inactiv, care dispare din
`GetTree` filtrat pe `IsActive = 1`. Se adaugă simetria și se înlocuiește cascada manuală pe două
niveluri cu un CTE recursiv:

```sql
        IF @IsActive = 0
        BEGIN
            -- Cascadă recursivă: nu presupune adâncimea maximă a arborelui
            ;WITH Descendants AS (
                SELECT Id FROM dbo.Specialties WHERE ParentId = @Id
                UNION ALL
                SELECT s.Id FROM dbo.Specialties s
                INNER JOIN Descendants d ON s.ParentId = d.Id
            )
            UPDATE s SET IsActive = 0, UpdatedAt = SYSDATETIME(), UpdatedBy = @UpdatedBy
            FROM dbo.Specialties s
            INNER JOIN Descendants d ON d.Id = s.Id
            WHERE s.IsActive = 1;
        END
        ELSE
        BEGIN
            -- La reactivare, părintele trebuie activ: altfel nodul ar fi activ,
            -- dar invizibil în arborele filtrat pe IsActive = 1
            IF EXISTS (SELECT 1 FROM dbo.Specialties c
                       INNER JOIN dbo.Specialties p ON p.Id = c.ParentId
                       WHERE c.Id = @Id AND p.IsActive = 0)
            BEGIN
                ;THROW 50106, N'Activați mai întâi categoria părinte.', 1;
            END;
        END;
```

Cod nou: `SqlErrorCodes.SpecialtyParentInactive = 50106`.

**e) Avertisment la dezactivare.** Dezactivarea nu blochează, dar UI-ul trebuie să știe câți medici
sunt afectați. Se adaugă un result set la `Specialty_ToggleActive`:

```sql
        -- Câți medici sunt afectați de dezactivare — UI-ul afișează avertismentul
        SELECT COUNT(*) AS AffectedDoctors
        FROM dbo.Doctors
        WHERE (SpecialtyId = @Id OR SubspecialtyId = @Id) AND IsDeleted = 0;
```

**f) Audit absent.** Nici `Specialties`, nici `MedicalTitles` nu au `CreatedBy`/`UpdatedBy` și nu
scriu în `AuditLogs`. Nomenclatoarele influențează direct documentele medicale; „cine a dezactivat
Cardiologia și când" trebuie să fie răspunzabil. Contrazice **R3**.

```sql
-- 0059: audit pe nomenclatoarele de personal
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Specialties') AND name = 'CreatedBy')
    ALTER TABLE dbo.Specialties ADD CreatedBy UNIQUEIDENTIFIER NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Specialties') AND name = 'UpdatedBy')
    ALTER TABLE dbo.Specialties ADD UpdatedBy UNIQUEIDENTIFIER NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MedicalTitles') AND name = 'CreatedBy')
    ALTER TABLE dbo.MedicalTitles ADD CreatedBy UNIQUEIDENTIFIER NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MedicalTitles') AND name = 'UpdatedBy')
    ALTER TABLE dbo.MedicalTitles ADD UpdatedBy UNIQUEIDENTIFIER NULL;
GO
```

> Coloanele sunt `NULL`-abile: rândurile de seed existente nu au autor și nu pot avea unul retroactiv.

Cele șase SP-uri (`Specialty_Create/Update/ToggleActive`, `MedicalTitle_Create/Update/ToggleActive`)
primesc `@ChangedBy UNIQUEIDENTIFIER`, îl scriu în coloana corespunzătoare și adaugă:

```sql
        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Specialty', @Id, N'Update', @OldValues, @NewValues, @ChangedBy);
```

> **`Specialties` și `MedicalTitles` NU au coloană `ClinicId`** — sunt nomenclatoare partajate de
> toate clinicile (excepția documentată la **R1**). `AuditLogs.ClinicId` primește totuși
> `currentUser.ClinicId`, ca acțiunea să apară în jurnalul clinicii care a operat-o. Dacă
> `AuditLogs.ClinicId` e `NOT NULL`, aceasta e forma corectă; verificați în `0045`.

Handlerele (`CreateSpecialtyCommandHandler` etc.) injectează `ICurrentUser` și transmit
`currentUser.Id` + `currentUser.ClinicId`; semnăturile din `ISpecialtyRepository` /
`IMedicalTitleRepository` se extind corespunzător.

**g) Curse pe `Code`.** `IF EXISTS` + `INSERT` la `READ COMMITTED` permite două inserări concurente
cu același cod. `Specialties` are deja `UQ_Specialties_Code`; verificați existența echivalentului pe
`MedicalTitles` și adăugați-l dacă lipsește:

```sql
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_MedicalTitles_Code' AND object_id = OBJECT_ID('dbo.MedicalTitles'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_MedicalTitles_Code ON dbo.MedicalTitles (Code);
GO
```

**h) Normalizare `Code`.** Validatorul cere `^[A-Z0-9_]+$`, dar SP-ul nu normalizează. Se adaugă
`SET @Code = UPPER(LTRIM(RTRIM(@Code)));` la începutul celor patru SP-uri de scriere — apărare în
adâncime pentru apelurile care nu trec prin validator.

**Acceptanță pentru 6.9:**
- `PUT` care ar crea ciclul `A → B → A` → **400** cu cod 50103.
- Creare de Level 2 sub un Level 0 → **400** cu cod 50104.
- Schimbarea `Level` pe o specializare atribuită unui medic → **400** cu cod 50105.
- Reactivarea unei subspecializări cu părinte inactiv → **400** cu cod 50106.
- Dezactivarea unei categorii dezactivează recursiv tot subarborele (verificat la 3 niveluri).
- Fiecare operație de scriere pe nomenclator produce un rând în `AuditLogs` cu `ChangedBy` corect.

### 6.10 Cod mort și query risipitor (P1-9, P2-15)

`NomenclatureController.GetSpecialtyById` citește **toate** specializările și filtrează în C#, deși
`Specialty_GetById.sql` și `ISpecialtyRepository.GetByIdAsync` există și nu sunt apelate de nimeni.
În plus, returnează un obiect anonim în afara contractului:

```csharp
// GREȘIT: shape-ul nu are `message`/`errors`, deci `ApiResponse<T>` din client nu se potrivește
return Ok(new { success = true, data = specialty });
```

Fix:

```csharp
/// <summary>Returnează o specializare după Id.</summary>
[HttpGet("specialties/{id:guid}")]
[HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
[ProducesResponseType<ApiResponse<SpecialtyDto>>(StatusCodes.Status200OK)]
public async Task<IActionResult> GetSpecialtyById(Guid id, CancellationToken ct)
    => HandleResult(await Mediator.Send(new GetSpecialtyByIdQuery(id), ct));
```

cu `GetSpecialtyByIdQuery` + handler pe modelul §2d din `CLAUDE.md`:

```csharp
public sealed class GetSpecialtyByIdQueryHandler(ISpecialtyRepository repository)
    : IRequestHandler<GetSpecialtyByIdQuery, Result<SpecialtyDto>>
{
    public async Task<Result<SpecialtyDto>> Handle(
        GetSpecialtyByIdQuery request, CancellationToken cancellationToken)
    {
        var specialty = await repository.GetByIdAsync(request.Id, cancellationToken);

        return specialty is null
            ? Result<SpecialtyDto>.NotFound(ErrorMessages.Specialty.NotFound)
            : Result<SpecialtyDto>.Success(specialty);
    }
}
```

**Acceptanță:** `GET /api/v1/Nomenclature/specialties/{id}` returnează `ApiResponse<SpecialtyDto>`
(cu `success`, `data`, `message`, `errors`); un id inexistent → 404 cu același shape. Profiler-ul
arată un `Specialty_GetById`, nu un `Specialty_GetAll`.

---

## 7. P1 — Backend C#

### 7.1 Constantele de eroare contrazic SP-urile (P1-7)

Cea mai periculoasă discrepanță din acest audit, pentru că e invizibilă la compilare. Ce aruncă
SP-urile vs. cum se numesc constantele:

| Cod | Ce aruncă SP-ul (`Doctor_Create/Update`) | Numele în `SqlErrorCodes.cs` | Ce prinde handlerul |
|---|---|---|---|
| 50303 | supervizor invalid | `DoctorInvalidSupervisor` ✅ | `InvalidSupervisor` ✅ |
| 50304 | **supervizor circular** | `DoctorInvalidSpecialty` ❌ | `CircularSupervisor` ✅ |
| 50305 | **subspecialitate invalidă** | `DoctorAlreadyLinkedToUser` ❌ | `InvalidSubspecialty` ✅ |
| 50306 | **titulatură invalidă** | `DoctorInvalidClinic` ❌ | `InvalidMedicalTitle` ✅ |

Handlerele sunt corecte **doar pentru că folosesc numere magice** (`ex.Number == 50305`) și ocolesc
constantele greșite. Oricine ar „curăța" codul înlocuind numărul cu constanta al cărei nume pare
potrivit ar introduce un bug silențios.

Se adaugă și o coliziune nedocumentată: `AnalysesResultNotFound = 50401` și
`MedicalStaffEmailDuplicate = 50401`, între module fără nicio legătură.

**Fix:**

```csharp
    // ====== Doctori (range 50300–50311) ======
    // Notă: 50300/50301 sunt partajate cu SP-urile MedicalTitle (vezi secțiunea Titulaturi).
    // Codurile se interpretează exclusiv în contextul SP-ului care le aruncă.
    public const int DoctorNotFound              = 50300;
    public const int DoctorEmailDuplicate        = 50301;
    public const int DoctorInvalidDepartment     = 50302;
    public const int DoctorInvalidSupervisor     = 50303;
    public const int DoctorCircularSupervisor    = 50304;  // era DoctorInvalidSpecialty (greșit)
    public const int DoctorInvalidSubspecialty   = 50305;  // era DoctorAlreadyLinkedToUser (greșit)
    public const int DoctorInvalidMedicalTitle   = 50306;  // era DoctorInvalidClinic (greșit)
    public const int DoctorInvalidSpecialty      = 50307;  // nou — vezi P0-4
    public const int DoctorHasActiveUser         = 50308;  // nou — vezi P0-5
    public const int DoctorHasFutureAppointments = 50309;  // nou — vezi P0-5
    public const int DoctorConcurrency           = 50310;  // nou — vezi 6.7
    public const int DoctorMedicalCodeDuplicate  = 50311;  // nou — vezi 6.8

    // ====== Personal medical (range 50400–50407) ======
    public const int MedicalStaffNotFound            = 50400;
    public const int MedicalStaffEmailDuplicate      = 50402;  // era 50401 — coliziune cu AnalysesResultNotFound
    public const int MedicalStaffInvalidDepartment   = 50403;
    public const int MedicalStaffInvalidSupervisor   = 50404;
    public const int MedicalStaffInvalidMedicalTitle = 50405;
    public const int MedicalStaffHasActiveUser       = 50407;  // nou — vezi P0-5
    public const int MedicalStaffConcurrency         = 50408;  // nou — vezi 6.7
```

> **Renumerotarea lui `MedicalStaffEmailDuplicate` de la 50401 la 50402 atinge și SP-ul.** Verificați
> mai întâi ce aruncă efectiv `MedicalStaff_Create.sql` / `_Update.sql` și schimbați `THROW`-ul în
> același commit. Dacă renumerotarea pare riscantă, alternativa acceptabilă este mutarea
> `AnalysesResultNotFound` (folosit într-un singur modul) — dar **una din cele două trebuie să se
> întâmple**, iar coliziunea trebuie documentată dacă rămâne.

Apoi **toate** handlerele din perimetru înlocuiesc numerele magice cu constantele:

```csharp
// ÎNAINTE
catch (SqlException ex) when (ex.Number == 50305)
// DUPĂ
catch (SqlException ex) when (ex.Number == SqlErrorCodes.DoctorInvalidSubspecialty)
```

Fișiere: `{Create,Update,Delete}{Doctor,MedicalStaff}CommandHandler.cs`,
`{Create,Update,Toggle}{Specialty,MedicalTitle}CommandHandler.cs`.

**Acceptanță:** `grep -rnE 'ex\.Number == 50[0-9]{3}' src/ValyanClinic.Application/Features/{Doctors,MedicalStaff,Nomenclature}`
nu returnează nimic. Fiecare cod din `SqlErrorCodes.cs` pentru aceste module corespunde mesajului
aruncat de SP-ul respectiv (verificat prin citire pereche SP ↔ constantă).

### 7.2 Semnături poziționale de repository (P1 conex)

`IDoctorRepository.CreateAsync` are **14 parametri**, `UpdateAsync` **17**, dintre care șase
`Guid?` consecutivi:

```csharp
Task<Guid> CreateAsync(
    Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
    Guid? specialtyId, Guid? subspecialtyId, Guid? medicalTitleId, ...);
```

Este exact anti-pattern-ul listat în `CLAUDE.md` („două `Guid?` vecine se pot inversa tăcut").
Inversarea `specialtyId`/`subspecialtyId` compilează și trece testele. Fix conform §8:

```csharp
// IDoctorRepository.cs — record-ul de date stă lângă interfață
public sealed record DoctorCreateData(
    Guid ClinicId,
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? SpecialtyId,
    Guid? SubspecialtyId,
    Guid? MedicalTitleId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string? MedicalCode,
    string? LicenseNumber,
    DateTime? LicenseExpiresAt);

public sealed record DoctorUpdateData(
    Guid Id,
    Guid ClinicId,
    /* ... aceleași câmpuri ... */
    bool IsActive,
    byte[]? RowVersion);

Task<Guid> CreateAsync(DoctorCreateData data, Guid createdBy, CancellationToken ct);
Task UpdateAsync(DoctorUpdateData data, Guid updatedBy, CancellationToken ct);
Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
```

Handlerul face traducerea cu **argumente numite**, iar `ClinicId` vine din `ICurrentUser`, niciodată
din comandă. Beneficiu direct pentru testele de la §9: mock-urile devin
`Arg.Any<DoctorCreateData>()` și nu se mai rup la adăugarea unui câmp (R8).

Același tratament pentru `IMedicalStaffRepository`. `ISpecialtyRepository` și
`IMedicalTitleRepository` rămân poziționale (≤ 7 parametri) — sub pragul din convenție.

### 7.3 Query-uri fără validator (P1-12)

`GetDoctorsQuery`, `GetMedicalStaffListQuery` nu au validator: `?pageSize=1000000` ajunge
nefiltrat în `OFFSET/FETCH`. Clamparea din 6.2 protejează baza, dar cererea trebuie respinsă la
margine, cu mesaj:

```csharp
public sealed class GetDoctorsQueryValidator : AbstractValidator<GetDoctorsQuery>
{
    public GetDoctorsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 200)
            .WithMessage("Dimensiunea paginii trebuie să fie între 1 și 200.");

        RuleFor(x => x.SortDir)
            .Must(d => d is "asc" or "desc")
            .WithMessage("Direcția de sortare trebuie să fie 'asc' sau 'desc'.");

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Termenul de căutare nu poate depăși 200 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Search));
    }
}
```

> Limita de 200 trebuie să fie ≥ `EXPORT_MAX_ROWS` folosit de FE pentru export, altfel exportul cade
> pe 400. Verificați valoarea din `PatientsListPage` și aliniați ambele; dacă exportul cere mai mult,
> ridicați ambele limite conștient, nu una dintre ele.

### 7.4 Validator de Update incomplet pentru specializări (P1-8)

`CreateSpecialtyCommandValidator` are regulile de coerență, `UpdateSpecialtyCommandValidator` **nu**:

```csharp
// lipsesc din Update:
RuleFor(x => x.ParentId).NotNull().When(x => x.Level > 0)
    .WithMessage("Specializările de nivel 1 și 2 trebuie să aibă un părinte.");
RuleFor(x => x.ParentId).Null().When(x => x.Level == 0)
    .WithMessage("Categoriile (nivel 0) nu pot avea părinte.");
```

Consecința e înregistrarea fantomă descrisă la 6.9.b. Se copiază ambele reguli. Pentru a preveni
recidiva, regulile comune se extrag într-o clasă de bază:

```csharp
// Commands/SpecialtyHierarchyRules.cs
internal static class SpecialtyHierarchyRules
{
    // Aplicat de AMBELE validatoare (Create și Update): regulile de ierarhie
    // nu trebuie să existe în două copii care se pot desincroniza.
    internal static void ApplyTo<T>(AbstractValidator<T> validator,
                                    Func<T, Guid?> parentId, Func<T, byte> level)
        where T : class
    { /* ... */ }
}
```

Simetric, `client/src/features/nomenclature/schemas/specialty.schema.ts` primește regula
cross-field, ca UI-ul să nu mai trimită cereri invalide:

```ts
export const specialtySchema = z.object({ /* ... */ })
  .refine((v) => (v.level === 0 ? v.parentId === null : v.parentId !== null), {
    message: 'Categoriile nu au părinte; specializările și subspecializările trebuie să aibă unul.',
    path: ['parentId'],
  })
```

### 7.5 `lookup` fără gardă de modul (P1-10)

```csharp
[HttpGet("lookup")]                      // ← fără [HasAccess]
public async Task<IActionResult> GetLookup(CancellationToken ct)
```

Ambele controllere (`Doctors`, `MedicalStaff`) expun lookup-ul doar cu `[Authorize]` moștenit. Orice
cont autentificat — inclusiv unul cu acces doar la `dashboard` — enumeră numele, **emailurile** și
**parafele** întregului personal. `DoctorLookupDto` include `Email` și `MedicalCode`.

Lookup-ul e legitim partajat (programări, consultații, departamente au nevoie de el), deci nu poate
cere `users`. Decizia corectă: **restrânge payload-ul la ce e necesar pentru un dropdown** și
păstrează endpoint-ul deschis oricărui cont autentificat, ceea ce nu mai constituie expunere.

```csharp
/// <summary>DTO pentru dropdown-uri. Nu conține email sau parafă:
/// datele de contact cer Read pe modulul `users`, prin GET /Doctors.</summary>
public sealed class DoctorLookupDto
{
    public Guid    Id             { get; init; }
    public string  FullName       { get; init; } = string.Empty;
    public string  FirstName      { get; init; } = string.Empty;
    public string  LastName       { get; init; } = string.Empty;
    public Guid?   SpecialtyId    { get; init; }
    public string? SpecialtyName  { get; init; }
    public Guid?   DepartmentId   { get; init; }
    public string? DepartmentName { get; init; }
    // Email și MedicalCode ELIMINATE — vezi comentariul de mai sus
}
```

`Doctor_GetByClinic.sql` nu mai selectează `d.Email` / `d.MedicalCode`.

> **Verificați consumatorii** înainte de a elimina câmpurile: `DoctorFormModal` afișează
> `${d.fullName} (${d.medicalCode})` în dropdown-ul de șef ierarhic. Acel ecran are deja `users` Read,
> deci poate folosi lista paginată; alternativ păstrați `medicalCode` și eliminați doar `email`,
> documentând decizia. `grep -rn "doctorLookup\|getLookup" client/src` enumeră toți consumatorii.

### 7.6 `NomenclatureController` prea larg (întreținere)

Un controller de ~250 de linii amestecă specializări, titulaturi, genuri, grupe sanguine, alergii,
județe, localități și coduri CAEN, cu endpoint-urile de titulaturi împrăștiate în două locuri
(GET sus, POST/PUT/PATCH jos). Se împarte, păstrând rutele neschimbate cu `[Route]` explicit ca să
nu se rupă contractul:

```
SpecialtiesController.cs    → api/v1/Nomenclature/specialties/*
MedicalTitlesController.cs  → api/v1/Nomenclature/medical-titles/*
LookupsController.cs        → genders, blood-types, allergy-*, counties, localities, caen-codes
```

**Acceptanță:** `openapi-v1.json` regenerat are exact aceleași căi și shape-uri ca înainte
(`git diff` pe fișier nu arată modificări de rute), iar `npm run check:api` trece.

---

## 8. P2 — Frontend

### 8.1 Erorile de ștergere sunt invizibile (P2-1)

`useFeedback` întoarce `errorMsg`, `FeedbackAlerts` **acceptă** `errorMsg` — dar paginile nu îl
transmit:

```tsx
<FeedbackAlerts
  successMsg={successMsg}
  onDismissSuccess={() => setSuccessMsg(null)}
/>   {/* errorMsg lipsește */}
```

Iar `errorMsg` e afișat doar în modal (`serverError={modalOpen ? errorMsg : null}`). Deci un
`onError` de la `deleteDoctor` — inclusiv cele **409** noi introduse la P0-5 — setează un mesaj care
nu apare nicăieri. Utilizatorul apasă „Șterge", nu se întâmplă nimic, fără nicio explicație.

```tsx
<FeedbackAlerts
  successMsg={successMsg}
  errorMsg={modalOpen ? null : errorMsg}   // în modal e afișat de serverError
  onDismissSuccess={() => setSuccessMsg(null)}
  onDismissError={() => setErrorMsg(null)}
/>
```

**Acceptanță:** ștergerea unui medic cu cont activ afișează în pagină alerta roșie cu mesajul de la
server; alerta se închide la click pe „×".

### 8.2 Erorile de mutație înghițite în nomenclatoare (P2-2)

```tsx
} catch {
  // Eroarea e propagată de Axios interceptor — TanStack Query o afișează
}
```

Comentariul este **fals**: nici interceptorul, nici TanStack Query nu afișează nimic de la sine.
Creezi o specializare cu un cod duplicat → modalul rămâne deschis, fără mesaj, fără indiciu.
Identic pentru toggle. Ambele pagini (`SpecialtiesListPage`, `MedicalTitlesPage`) au problema.

Fix: se folosește `useFeedback` + `FeedbackAlerts`, ca în restul aplicației:

```tsx
const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

const handleSubmit = async (data: SpecialtyFormData) => {
  try {
    if (editNode) await updateMutation.mutateAsync({ id: editNode.id, ...data })
    else          await createMutation.mutateAsync(data)
    handleCloseModal()
    showSuccess(editNode ? 'Specializarea a fost actualizată.' : 'Specializarea a fost adăugată.')
  } catch (err) {
    showError(err)   // rămâne în modal, cu mesajul serverului
  }
}

const handleToggleActive = async (id: string, isActive: boolean) => {
  try {
    await toggleMutation.mutateAsync({ id, isActive })
  } catch (err) {
    showError(err)   // ex.: „Activați mai întâi categoria părinte." (cod 50106)
  }
}
```

Modalele primesc `serverError={errorMsg}` (prop-ul există deja în `SpecialtyFormModal`? dacă nu, se
adaugă după modelul `DoctorFormModal`).

În plus, butonul de toggle trebuie dezactivat în timpul cererii, altfel click-urile repetate trimit
cereri concurente:

```tsx
<button
  className={...}
  onClick={() => onToggleActive(node.id, !node.isActive)}
  disabled={toggleMutation.isPending}
  aria-pressed={node.isActive}
>
```

**Acceptanță:** creare cu cod duplicat → alertă roșie în modal cu textul de la server, modalul rămâne
deschis cu datele introduse. Dezactivarea unei categorii cu 12 medici afectați cere confirmare
(vezi 8.11) și afișează mesaj de succes.

### 8.3 Fără gardă de permisiuni în UI (P2-3)

Niciuna dintre cele patru pagini nu folosește `useHasAccess`. Un utilizator cu `users: Read` vede
„Doctor nou", „Editează", „Șterge"; le apasă și primește 403 de la backend, fără explicație.
`PatientsListPage` are deja modelul corect.

```tsx
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'

const { canWrite, hasFull } = useHasAccess()
const canModify = canWrite(MODULE.Users)     // MODULE.Nomenclature pe cele două nomenclatoare
const canDelete = hasFull(MODULE.Users)      // DELETE cere Full (vezi controllerele)
```

```tsx
const actionsTemplate = useCallback((row: DoctorDto) => (
  <ActionButtons
    onView={() => navigate(`/doctors/${row.id}`)}
    onEdit={canModify ? () => handleOpenEdit(row) : undefined}
    onDelete={canDelete ? () => setDeleteTarget(row) : undefined}
  />
), [handleOpenEdit, canModify, canDelete, navigate])
```

```tsx
{canModify && (
  <button className={styles.btnPrimary} onClick={handleOpenCreate}>
    <IconPlus /> Doctor nou
  </button>
)}
```

Pe nomenclatoare, `canModify` ascunde „Adaugă", butonul de editare și transformă badge-ul de status
din buton în text simplu.

> Nivelurile trebuie să fie **exact** cele cerute de controller: `Write` pentru POST/PUT, `Full`
> pentru DELETE. `hasFull` pe editare ar ascunde butonul unor utilizatori îndreptățiți.

**Acceptanță:** un cont cu `users: Read` vede lista și butonul „Detalii", fără „Doctor nou",
„Editează", „Șterge". Un cont cu `users: Write` vede „Editează", fără „Șterge".

### 8.4 Cuplare pe prefixul codului `MEDIC` (P2-4)

```tsx
// DoctorFormModal — doar titulaturile de medic
medicalTitles.filter(t => t.isActive && t.code.startsWith('MEDIC'))
// MedicalStaffFormModal — exact complementul
medicalTitles.filter(t => t.isActive && !t.code.startsWith('MEDIC'))
```

Convenția de denumire a codului ține o regulă de business. Consecințe: o titulatură nouă
`SPECIALIST_PRIMAR` nu apare în formularul de doctor; redenumirea unui cod schimbă tacit
comportamentul a două ecrane; `MedicalStaffFormModal` primește prin complement orice cod scris greșit.
Comentariul din `0007_CreateMedicalStaff.sql` („filtrare client: non-MEDIC") arată că lipsa e cunoscută.

**Fix — decizie:** categoria devine coloană explicită.

```sql
-- 0059: categoria titulaturii devine dată, nu convenție de cod
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.MedicalTitles') AND name = 'AppliesTo')
BEGIN
    -- 1 = doctor, 2 = personal medical, 3 = ambele
    ALTER TABLE dbo.MedicalTitles ADD AppliesTo TINYINT NOT NULL
        CONSTRAINT DF_MedicalTitles_AppliesTo DEFAULT 3;
END;
GO

-- Backfill din convenția existentă, o singură dată
UPDATE dbo.MedicalTitles
SET AppliesTo = CASE WHEN Code LIKE 'MEDIC%' THEN 1 ELSE 2 END
WHERE AppliesTo = 3;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MedicalTitles_AppliesTo')
    ALTER TABLE dbo.MedicalTitles
        ADD CONSTRAINT CK_MedicalTitles_AppliesTo CHECK (AppliesTo BETWEEN 1 AND 3);
GO
```

`MedicalTitle_GetAll` primește `@AppliesTo TINYINT = NULL` și predicatul
`AND (@AppliesTo IS NULL OR mt.AppliesTo = @AppliesTo OR mt.AppliesTo = 3)`;
`MedicalTitle_Create/Update` primesc `@AppliesTo`.

```ts
// medicalTitle.types.ts
export const TITLE_APPLIES_TO = { Doctor: 1, MedicalStaff: 2, Both: 3 } as const
export type TitleAppliesTo = typeof TITLE_APPLIES_TO[keyof typeof TITLE_APPLIES_TO]
```

```tsx
// DoctorFormModal
const doctorTitles = useMemo(
  () => medicalTitles.filter(t => t.isActive && t.appliesTo !== TITLE_APPLIES_TO.MedicalStaff),
  [medicalTitles],
)
```

Ecranul **Titulaturi** câștigă o coloană „Se aplică la" și un `FormSelect` în modal.

**Acceptanță:** `grep -rn "startsWith('MEDIC')" client/src` nu returnează nimic. O titulatură nouă
marcată „Medic" apare imediat în formularul de doctor și **nu** în cel de personal medical.

### 8.5 Export Excel înșelător (P2-5)

```tsx
const handleExcelExport = useCallback(() => {
  gridRef.current?.exportExcel({
    fileName: `doctori_${toLocalDateISO(new Date())}`,
    customData: buildExportData(),   // buildExportData() folosește filteredData = pagina curentă
  })
}, [buildExportData])
```

Butonul se numește „Export Excel" fără calificare, dar exportă **maximum 20 de rânduri**. Se preia
mecanismul din `PatientsListPage` (re-fetch cu `pageSize = EXPORT_MAX_ROWS` pe aceiași parametri,
avertisment dacă totalul depășește limita, `disabled` + „Se exportă…" în timpul operației).

Se elimină în același pas și comentariul mort `{/* TODO: Export PDF — dezactivat temporar, de revenit */}`.

**Acceptanță:** cu 60 de doctori și filtrul „Activi", fișierul conține toți medicii activi, nu 20.
Butonul e dezactivat în timpul exportului și când `totalCount === 0`.

### 8.6 `ROUTE_MODULES` incomplet (P2-6)

```ts
'/doctors':       ['users'],
'/medical-staff': ['users'],
```

Dar `DoctorsListPage` apelează `useSpecialties` + `useMedicalTitles` (cer `nomenclature` Read) și
`useDepartments` (cere `clinic` Read). Un cont cu doar `users` deschide pagina și primește 403 pe
cele trei lookup-uri → dropdown-urile din formular sunt **goale**, fără nicio explicație, iar
filtrul de specialitate (după fixul de la P0-2.f) e gol.

Semantica documentată a listei e **AND** („ecranul cere Read pe toate modulele enumerate"), exact
cazul de aici:

```ts
  // Administrare
  // Formularul de doctor citește nomenclatorul de specializări/titulaturi (nomenclature)
  // și lista de departamente (clinic); fără ele dropdown-urile sunt goale.
  '/doctors':           ['users', 'nomenclature', 'clinic'],
  '/medical-staff':     ['users', 'nomenclature', 'clinic'],
```

> **Verificați apoi rolurile existente.** Dacă un rol real (ex. „recepție") are `users` dar nu
> `nomenclature`, pierde accesul la ecran — corect din punct de vedere funcțional, dar e o schimbare
> de comportament care trebuie anunțată. Interogați
> `RoleModulePermissions` înainte de livrare și raportați rolurile afectate.

**Acceptanță:** un cont fără `nomenclature` nu mai vede item-ul „Doctori" în sidebar și primește
redirect pe acces direct prin URL; un cont cu toate trei modulele vede dropdown-urile populate.

### 8.7 Paginile de detaliu inaccesibile (P2-7)

`/doctors/:id` și `/medical-staff/:id` sunt înregistrate în `AppRoutes.tsx`, paginile există
(`DoctorDetailPage`, `MedicalStaffDetailPage`), dar **nicio** interfață nu navighează spre ele:
listele nu au acțiune „Detalii" și nu au `onRowDoubleClick`. Sunt accesibile doar tastând URL-ul.
(`DoctorViewModal` / `MedicalStaffViewModal` există, dar sunt folosite exclusiv din `DepartmentsPage`.)

`ActionButtons` suportă deja `onView`. Fix minimal, inclus în 8.3 și P0-2.d: `onView` +
`onRowDoubleClick` spre ruta de detaliu.

**Acceptanță:** click pe iconița „ochi" și dublu-click pe rând deschid `/doctors/:id`; butonul
„înapoi" din pagina de detaliu revine în listă.

### 8.8 Prag de expirare aviz inconsistent (P2-8)

```tsx
// DoctorsListPage — avertisment la 60 de zile
if (days < 60)  return styles['licenseExpiry--warning'];
// DoctorDetailPage — „expiră curând" la 90 de zile
in90Days.setDate(in90Days.getDate() + 90)
```

Aceeași regulă de business, două valori. Un medic cu avizul expirând în 75 de zile e „ok" în listă și
„expiră curând" în detaliu. Se extrage constanta unică și se folosește în ambele locuri, plus în
statistica `ExpiringSoonCount` din 6.4 (care e definită pe 60 de zile în SQL):

```ts
// client/src/features/doctors/constants.ts
/** Fereastra de avertizare pentru expirarea avizului CMR, în zile.
 *  Trebuie să coincidă cu ExpiringSoonCount din Doctor_GetPaged. */
export const LICENSE_WARNING_DAYS = 60
```

**Acceptanță:** `grep -rn "90\|60" client/src/features/doctors` nu mai conține praguri duplicate;
cardul „Avize care expiră" și marcajul galben din coloană se referă la același set de medici.

### 8.9 Tipuri scrise de mână vs. `schema.d.ts` (P2-9)

`doctor.types.ts`, `medicalStaff.types.ts`, `specialty.types.ts`, `medicalTitle.types.ts` sunt
scrise manual, deși `schema.d.ts` conține `DoctorListDto`, `CreateDoctorCommand`, `SpecialtyDto`,
`MedicalTitleDto` (26 de apariții). `CLAUDE.md` §1 cere derivarea din contractul generat.

Cauza practică a devierii e reală: generatorul marchează **toate** câmpurile opționale
(`id?: string`), pentru că DTO-urile C# nu declară nullabilitatea pentru Swagger. Importul direct ar
umple codul de `!` și `?? ''`.

**Decizie:** nu rescriem toate tipurile (churn mare, câștig mic), dar drift-ul nu mai poate trece
neobservat. Se adaugă o **aserțiune de conformitate** la nivel de tip, care rupe `npm run build`
(deci și jobul `contract` din CI) dacă backendul adaugă, elimină sau redenumește un câmp:

```ts
// client/src/features/doctors/types/doctor.contract.ts
import type { components } from '@/api/generated/schema'
import type { DoctorDto } from './doctor.types'

type Generated = components['schemas']['DoctorListDto']

/** Eroare de compilare dacă DoctorDto are un câmp care nu există în contractul generat. */
type NoExtraFields = Exclude<keyof DoctorDto, keyof Generated> extends never ? true : never
/** Eroare de compilare dacă backendul a adăugat un câmp pe care UI-ul nu-l cunoaște. */
type NoMissingFields = Exclude<keyof Generated, keyof DoctorDto> extends never ? true : never

export type DoctorContractIsInSync = [NoExtraFields, NoMissingFields]
```

Fișiere echivalente pentru celelalte trei tipuri. În paralel, se adaugă atributele de nullabilitate
pe DTO-urile C# (`required` / `[Required]`) ca generarea viitoare să fie utilizabilă direct — pas
separat, nu blocant.

**Acceptanță:** eliminarea unui câmp din `DoctorListDto` în C#, regenerare, `npm run build` →
eroare de compilare care numește câmpul. Astăzi aceeași modificare trece silențios.

### 8.10 Arborele de specializări: căutarea nu extinde nodurile (P2-10)

`filteredTree` filtrează corect recursiv, dar `expanded` nu se modifică. O potrivire pe un nod de
nivel 2 rămâne ascunsă sub categorii restrânse: utilizatorul scrie „interven", vede doar o listă de
categorii și concluzionează că nu există rezultate.

```tsx
// La căutare, nodurile care conțin potriviri se extind automat:
// altfel un rezultat de nivel 2 rămâne ascuns și pare că nu există.
useEffect(() => {
  if (!search.trim()) return
  const ids = new Set<string>()
  const collect = (nodes: SpecialtyTreeNode[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) { ids.add(node.id); collect(node.children) }
    }
  }
  collect(filteredTree)
  setExpanded(ids)
}, [search, filteredTree])
```

Se corectează în același fișier și subtitlul, care numără toate nodurile (categorii incluse) și le
etichetează „specializări", ignorând filtrul de inactive:

```tsx
const counts = useMemo(() => {
  let categories = 0, specialties = 0, subspecialties = 0
  const walk = (nodes: SpecialtyTreeNode[]) => {
    for (const n of nodes) {
      if (n.level === 0) categories++
      else if (n.level === 1) specialties++
      else subspecialties++
      walk(n.children)
    }
  }
  walk(treeData)
  return { categories, specialties, subspecialties }
}, [treeData])

subtitle={`${counts.categories} categorii · ${counts.specialties} specializări · ${counts.subspecialties} subspecializări`}
```

`MedicalTitlesPage` are aceeași problemă în mic: `titles.length` respectă filtrul „Arată inactive",
dar eticheta nu spune asta → `${filteredTitles.length} din ${titles.length} titulaturi`.

### 8.11 Tabele hand-rolled în loc de `AppDataGrid` (P2-11)

`SpecialtiesListPage` și `MedicalTitlesPage` construiesc tabele din `div`-uri cu clase
`tableHeader`/`tableRow`. Consecințe: fără sortare pe coloane, fără export, fără redimensionare, fără
salvarea configurației de coloane, fără paginare — și un al treilea stil de tabel în aplicație.

**Decizie diferențiată:**

- **Titulaturi** este o listă plată → migrare la `AppDataGrid` în mod **client-side** (nomenclatorul
  are zeci de rânduri, `staleTime: Infinity`, deci server-side e cost inutil). Se câștigă sortare,
  export și consistență vizuală cu restul aplicației.
- **Specializări** este un arbore, iar `AppDataGrid` nu are mod tree în acest proiect. Se **păstrează**
  componenta recursivă, dar se aduce la nivelul celorlalte ecrane: `PageHeader` + toolbar comun,
  `ActionButtons`, a11y (8.12), și `React.memo` pe `TreeRow` cu `expanded` transmis ca boolean per nod
  în loc de `Set` (azi orice extindere re-randează tot arborele).

```tsx
const TreeRow = memo(({ node, isExpanded, ... }: TreeRowProps) => { /* ... */ })
```

Se adaugă confirmare la dezactivare, folosind numărul de medici afectați expus de SP la 6.9.e:

```tsx
// Dezactivarea afectează medicii care au specializarea atribuită — se confirmă explicit
const handleToggleActive = (node: SpecialtyTreeNode) => {
  if (node.isActive) { setDeactivateTarget(node); return }
  void toggle(node.id, true)
}
```

### 8.12 Accesibilitate (P2-13)

| Problemă | Fix |
|---|---|
| Arborele e un `div` fără semantică | `role="tree"` pe container, `role="treeitem"` + `aria-expanded` + `aria-level` pe rânduri |
| Toggle de status fără stare anunțată | `aria-pressed={node.isActive}` |
| Butoanele de acțiune au doar `title` | `aria-label="Editează {node.name}"` |
| Tabelele `div` nu sunt anunțate ca tabel | `role="table"` / `role="row"` / `role="columnheader"` / `role="cell"` |
| Indentarea prin `paddingLeft` inline | Nivelul se exprimă și în `aria-level`, nu doar vizual |
| Navigarea în arbore doar cu mouse | Suport `ArrowRight`/`ArrowLeft` pentru extindere/restrângere |

`AppModal` gestionează deja focus trap și Escape — de verificat că `SpecialtyFormModal` și
`MedicalTitleFormModal` îl folosesc (nu modale hand-rolled).

### 8.13 Duplicare între Doctori și Personal medical (P2-12)

`DoctorsListPage` (530 de linii) și `MedicalStaffListPage` (461) sunt identice ~90%: același state,
aceleași handlere de modal, același `toNull`, aceleași cell templates, același bloc de statistici.
Orice fix din acest document trebuie aplicat de două ori — cum s-a întâmplat cu toate defectele de
la P0-2, P2-1, P2-3, P2-5.

**Decizie:** nu se creează o „pagină generică" (ar cupla două domenii care pot divergea), ci se
extrag piesele fără opinie de domeniu:

```ts
// client/src/hooks/useServerSideListState.ts
/** State-ul comun al unei liste paginate server-side: căutare debounced,
 *  pagină, dimensiune, sortare, plus resetarea paginii la schimbarea filtrelor. */
export function useServerSideListState(opts: {
  defaultSortBy: string
  defaultSortDir?: 'asc' | 'desc'
  defaultPageSize?: number
  searchDelayMs?: number
}) { /* search, debouncedSearch, page, pageSize, sortBy, sortDir, handlers */ }
```

Se extrag de asemenea `StatsBar` (cardurile de statistici, azi 60 de linii de JSX duplicat cu SVG-uri
inline) și se folosește `NullCell` — care **există deja** în
`client/src/components/data-display/NullCell.tsx` exact pentru asta — în locul celor șase apariții de
`<span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>` per pagină.

**Acceptanță:** `DoctorsListPage.tsx` sub 350 de linii; zero `style={{ color: '#C9D3DC'` în cele două
pagini; `useServerSideListState` folosit de ambele.

---

## 9. Teste (P2-16)

Acoperirea actuală pentru cele patru module: **un** fișier
(`tests/ValyanClinic.Tests/Validators/CreateDoctorCommandValidatorTests.cs`). Zero handler tests,
zero teste de frontend. Toate defectele de mai sus ar fi trecut neobservate.

### Teste de handler (xunit + NSubstitute)

Structura obligatorie e cea din `CLAUDE.md` („Patterns de test"): GUID-uri fixe cu prefix semantic,
builder cu argumente numite, `Arg.Is<T>(predicat)` peste enumerarea tuturor argumentelor.

```
tests/ValyanClinic.Tests/Handlers/
├── CreateDoctorCommandHandlerTests.cs
│     • ValidCommand_ReturnsCreated (201)
│     • UsesClinicIdAndUserIdFromCurrentUser  ← ClinicId din ICurrentUser, nu din comandă
│     • EmailDuplicate_ReturnsConflict        ← 50301 → 409
│     • UniqueIndexViolation_ReturnsConflict  ← 2627 → 409 (regresie P0-1)
│     • InvalidSpecialty_ReturnsFailure       ← 50307 → 400 (regresie P0-4)
│     • GenericSqlError_ReturnsFailure        ← 50999 → 400
├── UpdateDoctorCommandHandlerTests.cs
│     • NotFound_ReturnsNotFound              ← 50300 → 404
│     • CircularSupervisor_ReturnsFailure     ← 50304 → 400
│     • Concurrency_ReturnsConflict           ← 50310 → 409 (regresie 6.7)
├── DeleteDoctorCommandHandlerTests.cs
│     • PassesDeletedByFromCurrentUser        ← regresie P0-3
│     • HasActiveUser_ReturnsConflict         ← 50308 → 409 (regresie P0-5)
├── {Create,Update,Delete}MedicalStaffCommandHandlerTests.cs   (simetric)
├── GetDoctorsQueryHandlerTests.cs
│     • PassesClinicIdFromCurrentUser
│     • MapsStatsIntoResponse                 ← regresie P1-4
├── ToggleSpecialtyCommandHandlerTests.cs
│     • ParentInactive_ReturnsFailure         ← 50106 → 400
└── GetSpecialtyTreeQueryHandlerTests.cs
      • OrphanLevel1_IsNotSilentlyDropped     ← regresie P1-8
```

`SqlExceptionHelper.Make(int)` există deja pentru a fabrica `SqlException` cu `Number` custom.

### Teste de validator

```
tests/ValyanClinic.Tests/Validators/
├── UpdateDoctorCommandValidatorTests.cs
├── {Create,Update}MedicalStaffCommandValidatorTests.cs
├── UpdateSpecialtyCommandValidatorTests.cs
│     • Level2WithoutParent_ShouldHaveError   ← regresie P1-8 (azi trece!)
│     • Level0WithParent_ShouldHaveError      ← regresie P1-8
└── GetDoctorsQueryValidatorTests.cs
      • PageSize_WhenOverLimit_ShouldHaveError ← regresie P1-12
```

### Teste de frontend (Vitest)

```
client/src/__tests__/features/doctors/
├── DoctorsListPage.test.tsx
│     • schimbarea paginii declanșează un request cu page=2       ← regresie P0-2
│     • tastarea rapidă produce un singur request (debounce)      ← regresie P0-2
│     • eroarea de la delete e afișată în pagină                  ← regresie P2-1
│     • fără canWrite, butoanele de creare/editare nu se randează ← regresie P2-3
└── DoctorFormModal.test.tsx
      • o titulatură dezactivată atribuită rămâne în dropdown     ← regresie P0-4
client/src/__tests__/features/nomenclature/
├── SpecialtiesListPage.test.tsx
│     • eroarea de la toggle e afișată, nu înghițită              ← regresie P2-2
│     • căutarea extinde nodurile cu potriviri                    ← regresie P2-10
└── MedicalTitlesPage.test.tsx
      • filtrarea pe appliesTo separă medic / personal            ← regresie P2-4
```

### Verificare manuală SQL (fără teste de integrare pe SP)

Proiectul nu are teste de integrare care rulează SP-uri, deci următoarele se verifică manual și se
consemnează în PR:

```sql
-- P0-1: unicitate filtrată
SELECT name, has_filter, filter_definition FROM sys.indexes
WHERE object_id = OBJECT_ID('dbo.Doctors') AND name LIKE 'UX_%';

-- P1-1: stabilitatea paginării (nu trebuie să existe id-uri duplicate)
EXEC dbo.Doctor_GetPaged @ClinicId='...', @Page=1, @PageSize=2;
EXEC dbo.Doctor_GetPaged @ClinicId='...', @Page=2, @PageSize=2;

-- P1-3: escape pe wildcards (trebuie 0 rânduri, nu toată clinica)
EXEC dbo.Doctor_GetPaged @ClinicId='...', @Search='%';

-- P1-5: planul folosește indexul nou, fără Sort
SET STATISTICS IO, TIME ON;
EXEC dbo.Doctor_GetPaged @ClinicId='...', @Page=3, @PageSize=20;
```

---

## 10. Migrarea `0059_PersonalHardening.sql`

Un singur fișier pentru tot ce e DDL. Structură obligatorie (numerotarea e secvențială — **R6** —
verificați `ls .../Migrations/ | sort | tail -1` înainte de a crea fișierul: dacă între timp a
apărut `0059`, folosiți `0060`).

```sql
-- ============================================================================
-- Migrare: 0059_PersonalHardening.sql
-- Descriere: Întărirea modulului Personal (Doctori, Personal medical,
--            Specializări, Titulaturi):
--            · unicitate email filtrată pe IsDeleted (fix 500 la recreare)
--            · unicitate parafă medicală per clinică
--            · index-uri pentru paginarea pe tenant; drop index-uri BIT inutile
--            · audit (CreatedBy/UpdatedBy) pe nomenclatoare
--            · MedicalTitles.AppliesTo — categoria devine dată, nu prefix de cod
-- Data: 2026-09-28
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ==================== 0. PRE-VERIFICĂRI BLOCANTE ====================
-- Migrarea NU trebuie să „repare" date de business în silență. Dacă există
-- duplicate care ar face indexurile unice imposibile, se oprește cu mesaj.

IF EXISTS (
    SELECT ClinicId, Email FROM dbo.Doctors WHERE IsDeleted = 0
    GROUP BY ClinicId, Email HAVING COUNT(*) > 1)
BEGIN
    SELECT ClinicId, Email, COUNT(*) AS Duplicates
    FROM dbo.Doctors WHERE IsDeleted = 0
    GROUP BY ClinicId, Email HAVING COUNT(*) > 1;

    ;THROW 51000, N'Există doctori activi cu email duplicat. Rezolvați manual (vezi result set-ul de mai sus) și reluați migrarea.', 1;
END;
GO

IF EXISTS (
    SELECT ClinicId, MedicalCode FROM dbo.Doctors
    WHERE IsDeleted = 0 AND MedicalCode IS NOT NULL
    GROUP BY ClinicId, MedicalCode HAVING COUNT(*) > 1)
BEGIN
    SELECT ClinicId, MedicalCode, COUNT(*) AS Duplicates
    FROM dbo.Doctors WHERE IsDeleted = 0 AND MedicalCode IS NOT NULL
    GROUP BY ClinicId, MedicalCode HAVING COUNT(*) > 1;

    ;THROW 51001, N'Există doctori activi cu aceeași parafă medicală. Alegerea parafei corecte e decizie de business — rezolvați manual și reluați.', 1;
END;
GO

-- Idem pentru MedicalStaff (email) și MedicalTitles (Code).

-- ==================== 1. UNICITATE FILTRATĂ (P0-1, 6.8) ====================
-- [blocurile din §1 și §6.8]

-- ==================== 2. INDEX-URI (6.5) ====================
-- [blocurile din §6.5, inclusiv DROP-urile]

-- ==================== 3. AUDIT PE NOMENCLATOARE (6.9.f) ====================
-- [ALTER TABLE ADD CreatedBy/UpdatedBy pe Specialties și MedicalTitles]

-- ==================== 4. MedicalTitles.AppliesTo (8.4) ====================
-- [ALTER TABLE ADD + backfill + CHECK din §8.4]

-- ==================== 5. CORECTAREA AUDITULUI ISTORIC (P0-3.e) ====================
-- [UPDATE AuditLogs din §3.e]

PRINT 'Migrarea 0059_PersonalHardening finalizată cu succes.';
GO
```

**Reguli de respectat:**
- Migrarea nu conține `CREATE OR ALTER PROCEDURE` — SP-urile trăiesc în `Scripts/StoredProcedures/`,
  rulează la fiecare pornire cu `NullJournal` (**R6**) și se editează liber.
- Odată aplicată, migrarea **nu se mai modifică niciodată**; o corecție ulterioară e `0060`.
- Fiecare bloc DDL e idempotent (`IF NOT EXISTS` / `IF EXISTS`), ca rularea pe o bază parțial
  migrată să nu cadă.
- `THROW 51000+` pentru erorile de migrare: în afara range-ului de business `50000–50999`, deci nu se
  confundă cu o eroare de aplicație.

---

## 11. Ce este deja corect (a nu se „repara")

Ca să nu se piardă timp pe rescrieri inutile, următoarele decizii sunt corecte și trebuie păstrate:

- **Multi-tenancy.** Toate SP-urile de Doctori/Personal medical filtrează pe `@ClinicId`, iar
  `ClinicId` vine exclusiv din `ICurrentUser`, niciodată din payload (**R1** respectată). Absența
  `ClinicId` pe `Specialties`/`MedicalTitles` este corectă: sunt nomenclatoare naționale partajate,
  excepția documentată la R1.
- **Tranzacții + `XACT_ABORT` + `THROW` re-aruncat** în SP-urile de scriere pentru Doctori și Personal
  medical: `BEGIN TRY / BEGIN TRANSACTION / ROLLBACK / ;THROW` e forma corectă și trebuie păstrată
  la rescriere (Specializări/Titulaturi o au deja și ele).
- **`THROW`, nu `RAISERROR`** peste tot (**R5**).
- **Audit `OldValues`/`NewValues` în `Doctor_Update`**, cu captarea valorilor vechi **înainte** de
  `UPDATE` și a celor noi **după** — modelul de copiat pentru MedicalStaff.
- **Separarea `{Entity}Request` de comanda MediatR** la PUT, în toate cele trei controllere: exact
  convenția din `CLAUDE.md` §10.
- **`AccessLevel.Full` pentru DELETE**, `Write` pentru POST/PUT.
- **Cascada de dezactivare** în `Specialty_ToggleActive` (intenția e corectă; doar implementarea e
  manuală pe două niveluri și asimetrică la reactivare).
- **Dropdown cascadat specializare → subspecializare** în `DoctorFormModal`, inclusiv resetarea
  subspecializării la schimbarea specializării și păstrarea valorii la editare.
- **Excluderea doctorului curent din lista de supervizori** la editare.
- **`staleTime: Infinity` + invalidare la mutație** pe hook-urile de nomenclator: forma corectă pentru
  date care se schimbă rar.
- **Query keys ierarhice** (`doctorKeys`, `specialtyKeys`, `medicalTitleKeys`) conform convenției.
- **Validatoarele FluentValidation** pentru comenzi: lungimi, format email, regex pe `Code`. Lipsesc
  reguli (vezi P1-8, P1-12), dar cele existente sunt corecte și au mesaje în română.
- **`ROWVERSION` pe `Doctors`/`MedicalStaff`**: coloanele sunt deja acolo: la 6.7 nu se adaugă schema,
  doar se începe folosirea ei.

---

## 12. Checklist de livrare

Grupat pe commit-uri livrabile independent. Fiecare linie e verificabilă.

**Commit 1 — SQL: corectitudine (P0-1, P0-3, P0-4)**
- [ ] `0059_PersonalHardening.sql` creat, cu pre-verificările blocante și blocurile 1–5 din §10
- [ ] `Doctor_Delete.sql`: `@DeletedBy`, `UpdatedBy`, `ChangedBy` corect, `SYSDATETIME()`
- [ ] `MedicalStaff_Delete.sql`: `@DeletedBy` + `AuditLogs`
- [ ] `MedicalStaff_Create.sql` / `_Update.sql`: `AuditLogs`
- [ ] `Doctor_Update.sql`: `IsActive` verificat doar la schimbare; `@SpecialtyId` validat pe `Level = 1`
- [ ] `Doctor_Create.sql`: validare `@SpecialtyId`
- [ ] `Doctor_GetPaged/GetById/GetByClinic`, `MedicalStaff_GetPaged`: join-uri fără `IsActive`, flag-uri `*IsActive` expuse
- [ ] `IDoctorRepository` / `IMedicalStaffRepository`: `DeleteAsync(..., deletedBy, ct)`; handlerele transmit `currentUser.Id`
- [ ] `catch (SqlException ex) when (ex.Number is 2627 or 2601)` în handlerele de Create/Update
- [ ] Verificat manual: recreare după ștergere → 201; `AuditLogs.ChangedBy` = utilizator

**Commit 2 — SQL: performanță și integritate (P1-1..P1-6, P1-11, P1-13, 6.8)**
- [ ] `Doctor_GetPaged` / `MedicalStaff_GetPaged` rescrise: CTE unic, `COUNT(*) OVER ()`, `ESCAPE`, variabile locale, normalizare camelCase a `@SortBy`, tie-break pe `Id`, result set de statistici
- [ ] `@RowVersion` opțional + cod 50310/50408 pe cele două SP-uri de Update
- [ ] `Specialty_Update`: ciclu recursiv (50103), `Level` vs. părinte (50104), blocare schimbare `Level` pe noduri folosite (50105)
- [ ] `Specialty_ToggleActive`: cascadă recursivă, gardă la reactivare (50106), result set `AffectedDoctors`
- [ ] Cele 6 SP-uri de nomenclator: `@ChangedBy` + `AuditLogs` + `UPPER(LTRIM(RTRIM(@Code)))`
- [ ] `GETDATE()` → `SYSDATETIME()` în toate cele 11 SP-uri din perimetru
- [ ] `DoctorStatsDto`, `DoctorsPagedResponse`, `DoctorPagedResult` + repository + handler + controller
- [ ] Verificat: plan de execuție cu `Index Seek`, fără `Sort`; căutarea `%` → 0 rezultate

**Commit 3 — Backend C# (P1-7..P1-10, P1-12, 7.2, 7.6)**
- [ ] `SqlErrorCodes.cs`: renumerotare Doctori/Personal medical, coliziunea 50401 rezolvată, coduri noi
- [ ] Toate handlerele din perimetru folosesc constante, nu numere magice
- [ ] `ErrorMessages.cs`: mesajele noi (`InvalidSpecialty`, `HasActiveUser`, `HasFutureAppointments`, `Concurrency`, `MedicalCodeDuplicate`)
- [ ] `DoctorCreateData` / `DoctorUpdateData` + echivalentele MedicalStaff; handlerele mapează cu argumente numite
- [ ] `UpdateSpecialtyCommandValidator`: regulile `ParentId`↔`Level`, extrase în `SpecialtyHierarchyRules`
- [ ] `GetDoctorsQueryValidator`, `GetMedicalStaffListQueryValidator`
- [ ] `DoctorLookupDto` fără `Email` (+ decizie documentată pe `MedicalCode`); `Doctor_GetByClinic` aliniat
- [ ] `GetSpecialtyByIdQuery` + handler; controllerul nu mai citește toată lista
- [ ] `NomenclatureController` împărțit în trei, cu rute neschimbate
- [ ] `generate-openapi.ps1` rulat, `cd client && npm run gen:api`, `npm run check:api` verde (**R9**)

**Commit 4 — SQL + BE + FE: P0-5 (gardă referențială)**
- [ ] Gărzile din §5 în `Doctor_Delete` / `MedicalStaff_Delete`, cu numele reale de coloane verificate în `0027`/`0057`
- [ ] Handlerele mapează 50308/50309/50407 la `Conflict`
- [ ] `ConfirmDeleteDialog` anunță consecințele; mesajul 409 ajunge în `FeedbackAlerts`

**Commit 5 — Frontend: Doctori și Personal medical (P0-2, P2-1, P2-3, P2-5, P2-6, P2-7, P2-8, P2-12, P2-14)**
- [ ] `useServerSideListState` + `StatsBar` extrase
- [ ] Ambele pagini: debounce 350 ms, paginare/sortare/filtrare server-side, `serverSideCount`, reset pagină la filtru
- [ ] `showFilterRow`, `showGroupPanel`, `groupDefaultExpanded`, `rowDragEnabled` eliminate
- [ ] Statistici din `stats`, filtru pe `specialtyId`/`departmentId` din nomenclator
- [ ] `FeedbackAlerts` primește `errorMsg` + `onDismissError`
- [ ] `useHasAccess`: `canModify` / `canDelete` pe toate acțiunile
- [ ] Export pe filtrele curente, cu `disabled` și avertisment de limită; TODO-ul de PDF șters
- [ ] `onView` + `onRowDoubleClick` spre `/doctors/:id`, `/medical-staff/:id`
- [ ] `LICENSE_WARNING_DAYS` unic, folosit în listă și în detaliu
- [ ] `NullCell` în locul celor 6+ `<span style={{ color: '#C9D3DC' ... }}>`
- [ ] `ROUTE_MODULES`: `['users', 'nomenclature', 'clinic']`; rolurile afectate raportate în PR
- [ ] Dropdown-urile păstrează valoarea curentă chiar dacă e dezactivată (P0-4.c)

**Commit 6 — Frontend: nomenclatoare (P2-2, P2-4, P2-10, P2-11, P2-13)**
- [ ] `useFeedback` + `FeedbackAlerts` + `serverError` în ambele pagini; `catch {}` gol eliminat
- [ ] Toggle-uri cu `disabled={isPending}` și `aria-pressed`
- [ ] `AppliesTo`: coloană, SP-uri, DTO, tip, `FormSelect`, coloană în listă, filtrare în cele două modale
- [ ] `startsWith('MEDIC')` eliminat complet din client
- [ ] Căutarea extinde nodurile cu potriviri; subtitlurile numără corect
- [ ] `TreeRow` memoizat, `expanded` per nod
- [ ] Titulaturi migrate pe `AppDataGrid` (client-side)
- [ ] Confirmare la dezactivare, cu numărul de medici afectați
- [ ] A11y: `role="tree"`/`treeitem`, `aria-expanded`, `aria-level`, `aria-label` pe acțiuni
- [ ] `useHasAccess(MODULE.Nomenclature)` pe acțiuni

**Commit 7 — Teste (P2-16) și contracte (P2-9)**
- [ ] Handler tests din §9
- [ ] Validator tests din §9
- [ ] Teste Vitest din §9
- [ ] `*.contract.ts` pentru cele patru fișiere de tipuri
- [ ] `dotnet test tests/ValyanClinic.Tests` verde
- [ ] `cd client && npm run lint && npm run test:unit && npm run build` verde (**R10**: zero importuri neutilizate)

**Verificare finală înainte de push**
- [ ] `dotnet build` fără warning-uri noi
- [ ] `npm run check:api` verde (contractul regenerat e comis)
- [ ] `.\migrate.ps1` pe o bază curată **și** pe una existentă cu date
- [ ] Testare manuală pe cele patru ecrane cu trei roluri: `Read`, `Write`, `Full`
