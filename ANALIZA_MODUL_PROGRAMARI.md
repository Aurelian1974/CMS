# Modul Programări (Appointments) — Analiză completă + plan de corecții

> **Destinatar**: agent VS Code (implementare).
> **Stare**: analiză finalizată pe codul din `main` la commit `320f721`. Niciun fișier nu a fost modificat.
> **Mod de lucru**: task-urile sunt grupate în PR-uri (§8). Fiecare task are ID, fișiere țintă și cod concret.
> Respectă `CLAUDE.md` (R1–R10) fără excepție. Migrările DbUp sunt **forward-only** — numerotare de la `0057`.

---

## 1. Inventar — tot ce ține de Programări

### 1.1 SQL

| Fișier | Rol |
|---|---|
| `src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0027_CreateAppointments.sql` | `AppointmentStatuses` (nomenclator + seed 5 rânduri) și `Appointments` + 3 indecși |
| `…/StoredProcedures/Appointment_Create.sql` | INSERT + verificare conflict + audit |
| `…/StoredProcedures/Appointment_Update.sql` | UPDATE + verificare conflict + audit (old/new) |
| `…/StoredProcedures/Appointment_UpdateStatus.sql` | UPDATE doar `StatusId` |
| `…/StoredProcedures/Appointment_Delete.sql` | Soft delete + audit |
| `…/StoredProcedures/Appointment_GetById.sql` | Detaliu cu JOIN-uri pacient/doctor/specialitate/status/useri |
| `…/StoredProcedures/Appointment_GetPaged.sql` | 3 result sets: pagină, count, statistici |
| `…/StoredProcedures/Appointment_GetByDoctor.sql` | Feed scheduler (interval de date) |
| `…/StoredProcedures/Appointment_GetByPatient.sql` | **neapelat din cod** |
| `…/StoredProcedures/Appointment_CheckConflict.sql` | **neapelat din cod** |

### 1.2 Backend

| Fișier | Observație |
|---|---|
| `src/ValyanClinic.API/Controllers/AppointmentsController.cs` | 7 endpoint-uri + 2 request records |
| `src/ValyanClinic.Application/Common/Interfaces/IAppointmentRepository.cs` | 7 metode + `AppointmentPagedResult` |
| `src/ValyanClinic.Infrastructure/Data/Repositories/AppointmentRepository.cs` | Dapper, exclusiv SP |
| `src/ValyanClinic.Infrastructure/Data/StoredProcedures/AppointmentProcedures.cs` | 9 constante (2 nefolosite) |
| `src/ValyanClinic.Application/Common/Constants/AppointmentStatusIds.cs` | 5 GUID-uri fixe |
| `…/Features/Appointments/Commands/{Create,Update,UpdateStatus,Delete}Appointment/` | 4 comenzi, 3 validatoare (Delete nu are — corect) |
| `…/Features/Appointments/Queries/{GetAppointmentById,GetAppointments,GetAppointmentsForScheduler}/` | 3 query-uri, **1 validator** (doar scheduler) |
| `…/Features/Appointments/DTOs/` | `AppointmentListDto`, `AppointmentDetailDto`, `AppointmentSchedulerDto`, `AppointmentStatsDto` |

### 1.3 Frontend

| Fișier | Linii | Observație |
|---|---|---|
| `client/src/api/endpoints/appointments.api.ts` | 34 | 7 metode |
| `client/src/features/appointments/types/appointment.types.ts` | 113 | **scris manual**, nu din `schema.d.ts` |
| `client/src/features/appointments/schemas/appointment.schema.ts` | 22 | Zod |
| `client/src/features/appointments/hooks/useAppointments.ts` | 90 | 3 query + 4 mutații (1 nefolosită) |
| `client/src/features/appointments/pages/AppointmentsListPage.tsx` | 494 | grid + stats + filtre + modale |
| `client/src/features/appointments/pages/AppointmentsSchedulerPage.tsx` | ~940 | timeline zi/săptămână/lună + DnD |
| `client/src/features/appointments/pages/AppointmentDetailPage.tsx` | 145 | pagină read-only |
| `client/src/features/appointments/components/AppointmentFormModal/` | 312 | formular creare/editare |
| `client/src/features/appointments/components/AppointmentDetailModal/` | ~230 | modal detaliu |
| `client/src/__tests__/features/appointments/*` | 752 | 3 fișiere Vitest |

### 1.4 Teste backend existente

| Fișier | Acoperă |
|---|---|
| `tests/ValyanClinic.Tests/Handlers/CreateAppointmentCommandHandlerTests.cs` | Create handler |
| `tests/ValyanClinic.Tests/Handlers/UpdateAppointmentStatusCommandHandlerTests.cs` | UpdateStatus handler |

Lipsesc: `Update`, `Delete`, `GetById`, `GetPaged`, `GetForScheduler` handlers; **toate** validatoarele de Appointments; orice test pe SP-uri.

---

## 2. Rezumat findings

Legendă severitate: 🔴 critic (securitate / corupere date) · 🟠 major (comportament greșit vizibil) · 🟡 mediu (fiabilitate / performanță) · 🔵 îmbunătățire.

### SQL

| ID | Sev | Problemă |
|---|---|---|
| S1 | 🔴 | `Appointment_Create` / `Appointment_Update` nu verifică că `@PatientId` și `@DoctorId` aparțin clinicii curente → **scurgere cross-tenant** |
| S2 | 🔴 | Verificarea de conflict nu e serializată (`IF EXISTS` + `INSERT` fără tranzacție/lock) → dublă rezervare la cereri concurente |
| S3 | 🟠 | Conflictul ia în calcul și programările `ANULAT` / `NEPREZENTARE` → slotul rămâne blocat după anulare |
| S4 | 🟠 | `Appointment_UpdateStatus` nu scrie în `AuditLogs` (încalcă R3) și nu validează `@StatusId` |
| S5 | 🟠 | `Appointment_Delete` nu blochează ștergerea când există consultație legată → `Consultations.AppointmentId` rămâne orfan |
| S6 | 🟠 | Statisticile din `Appointment_GetPaged` (result set 3) ignoră filtrele → cardurile contrazic grid-ul; lipsește `NoShowCount` |
| S7 | 🟠 | `ORDER BY` fără tiebreaker stabil → cu `StartTime` egal, paginarea `OFFSET/FETCH` poate duplica/omite rânduri |
| S8 | 🟡 | `@Search` folosit direct în `LIKE '%…%'` fără escape pentru `%`, `_`, `[` |
| S9 | 🟡 | Filtrele sunt duplicate în result set 1 și 2, cu implementări diferite (JOIN vs `EXISTS`) → drift garantat |
| S10 | 🟡 | `@Page` / `@PageSize` neconstrânse; nu există validator pe `GetAppointmentsQuery` → `pageSize=1000000` trece |
| S11 | 🟡 | `@SortBy` comparat case-sensitive-dependent; clientul trimite `startTime`, SP compară cu `'StartTime'` — merge doar pe colație CI |
| S12 | 🟡 | Tabelul nu are `CHECK (EndTime > StartTime)` și nu are `RowVersion` (fără concurență optimistă) |
| S13 | 🟡 | `Appointment_GetByDoctor` filtrează doar pe `StartTime` → programările care încep înainte de `@DateFrom` și se termină în interval lipsesc din scheduler |
| S14 | 🔵 | Indecși fără filtru `WHERE IsDeleted = 0`; lipsește index pentru statistici pe status |
| S15 | 🔵 | `Appointment_GetByPatient` și `Appointment_CheckConflict` — cod mort (declarate, neapelate) |
| S16 | 🔵 | Fără validare server-side față de `ClinicSchedule` / `DoctorSchedule`; fără reguli de tranziție de status; datele în trecut acceptate |

### Backend

| ID | Sev | Problemă |
|---|---|---|
| B1 | 🟠 | Violare de FK (ex. `statusId` inexistent) → `SqlException 547`, neprins de handler (`>= 50000`) → **HTTP 500** cu mesaj generic |
| B2 | 🟠 | Nu există `GetAppointmentsQueryValidator` — singurul query validat e scheduler-ul |
| B3 | 🟡 | `AppointmentStatsDto` nu are `NoShowCount`, deși statusul `NEPREZENTARE` există în seed |
| B4 | 🟡 | `AppointmentDetailDto.IsDeleted` e mereu `false` (SP filtrează `IsDeleted = 0`); `UpdatedBy` (Guid brut) expus inutil pe lângă `UpdatedByName` |
| B5 | 🟡 | Nu există endpoint de nomenclator pentru statusuri → GUID-urile sunt hardcodate în 3 locuri (C# + 2× TSX) |
| B6 | 🔵 | `Appointment_CheckConflict` nu e expus → clientul nu poate preveni 409 înainte de submit |
| B7 | 🔵 | `IAppointmentRepository.CreateAsync` / `UpdateAsync` au liste lungi de parametri poziționali — risc la R8 (mock-uri) |

### Frontend

| ID | Sev | Problemă |
|---|---|---|
| F1 | 🟠 | Mesajul de eroare de la server e **aruncat** — `onError: () => setServerError('A apărut o eroare…')`. Utilizatorul nu află niciodată „Există deja o programare în acest interval orar" (409) |
| F2 | 🟠 | Paginile de Programări **nu folosesc `useHasAccess`** (11 alte feature-uri o fac) → butoane Adaugă/Editează/Șterge vizibile fără drept |
| F3 | 🟠 | `useUpdateAppointmentStatus` **nu e folosit nicăieri** → nu există acțiuni rapide Confirmă / Finalizează / Neprezentare, deși acesta e fluxul principal al paginii |
| F4 | 🟠 | Butonul „Anulează programarea" apelează `DELETE` (soft delete) → programarea dispare din listă în loc să apară ca `ANULAT`; cardul „Anulate" rămâne `0` |
| F5 | 🟠 | Eroarea de la drag & drop în scheduler e doar `console.error` → mutarea eșuează silențios, bara sare la loc fără explicație |
| F6 | 🟠 | `TimeSelect` are orele hardcodate `07–20` și pasul 5 min, independent de `ClinicSchedule`; o valoare din afara listei (ex. `06:30`) randează select gol |
| F7 | 🟡 | `useDeleteAppointment` nu invalidează cheia `scheduler` → scheduler-ul rămâne stale după ștergere din listă |
| F8 | 🟡 | Tipurile sunt scrise manual, nu derivate din `@/api/generated/schema` (încalcă convenția din `CLAUDE.md` §Frontend 1) |
| F9 | 🟡 | Grid în mod server-side, dar cu `showFilterRow`, `showGroupPanel`, `rowSelection="multiple"` → filtrarea/gruparea se aplică doar paginii curente |
| F10 | 🟡 | Export Excel exportă doar pagina curentă (`buildExportData` folosește `appointments`), utilizatorul așteaptă tot setul filtrat |
| F11 | 🟡 | `computeFreeSlots` numără ca ocupate și programările anulate și rotunjește durata fără a o limita la fereastra efectivă → sloturi libere subestimate |
| F12 | 🟡 | Indicatorul „acum" (`now`) se calculează la render, fără interval → linia îngheață |
| F13 | 🟡 | Fără concurență optimistă: doi utilizatori care editează aceeași programare → last-write-wins silențios |
| F14 | 🔵 | Accesibilitate: barele de eveniment sunt `div` cu `onClick`, fără `role`/`tabIndex`/`aria-label`; tooltip doar pe `mouseenter` |
| F15 | 🔵 | `loading={!appointmentsResp}` — cu `keepPreviousData` nu devine niciodată `true` la refetch; folosește `isFetching` |
| F16 | 🔵 | `a.startTime.startsWith(dateStr)` și `editData.startTime.slice(0, 10)` presupun că API-ul nu trimite sufix `Z`; se rup dacă serializarea se schimbă |
| F17 | 🔵 | Zod: fără durată minimă, fără avertizare pe dată în trecut, fără `trim` pe `notes` |

---

## 3. Corecții SQL

### 3.1 Migrare nouă — `0057_AppointmentsHardening.sql`

Rezolvă: S3 (coloană `BlocksSlot`), S12 (`CHECK` + `RowVersion`), S14 (indecși), S16 (tabel de tranziții), B3.

```sql
-- ============================================================================
-- Migrare 0057: Hardening Appointments
-- Descriere: BlocksSlot pe statusuri, matrice de tranziții, CHECK durată,
--            RowVersion pentru concurență optimistă, indecși filtrați
-- ============================================================================

SET NOCOUNT ON;
GO

-- ── 1. AppointmentStatuses.BlocksSlot ────────────────────────────────────────
-- Statusurile ANULAT / NEPREZENTARE eliberează slotul din calendar.
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.AppointmentStatuses') AND name = 'BlocksSlot')
BEGIN
    ALTER TABLE dbo.AppointmentStatuses
        ADD BlocksSlot BIT NOT NULL CONSTRAINT DF_AppointmentStatuses_BlocksSlot DEFAULT 1;
    PRINT 'Coloana AppointmentStatuses.BlocksSlot adaugata.';
END
GO

UPDATE dbo.AppointmentStatuses
   SET BlocksSlot = 0
 WHERE Code IN ('ANULAT', 'NEPREZENTARE') AND BlocksSlot <> 0;
GO

-- ── 2. Matrice de tranziții de status ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES
               WHERE TABLE_NAME = 'AppointmentStatusTransitions')
BEGIN
    CREATE TABLE dbo.AppointmentStatusTransitions (
        FromStatusId UNIQUEIDENTIFIER NOT NULL,
        ToStatusId   UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_AppointmentStatusTransitions PRIMARY KEY (FromStatusId, ToStatusId),
        CONSTRAINT FK_AST_From FOREIGN KEY (FromStatusId) REFERENCES dbo.AppointmentStatuses(Id),
        CONSTRAINT FK_AST_To   FOREIGN KEY (ToStatusId)   REFERENCES dbo.AppointmentStatuses(Id)
    );

    DECLARE @Programat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000001';
    DECLARE @Confirmat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000002';
    DECLARE @Finalizat    UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000003';
    DECLARE @Anulat       UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000004';
    DECLARE @Neprezentare UNIQUEIDENTIFIER = 'A1000000-0000-0000-0000-000000000005';

    INSERT INTO dbo.AppointmentStatusTransitions (FromStatusId, ToStatusId) VALUES
        (@Programat,    @Confirmat),
        (@Programat,    @Finalizat),
        (@Programat,    @Anulat),
        (@Programat,    @Neprezentare),
        (@Confirmat,    @Finalizat),
        (@Confirmat,    @Anulat),
        (@Confirmat,    @Neprezentare),
        (@Confirmat,    @Programat),      -- retragere confirmare
        (@Anulat,       @Programat),      -- reactivare (re-verifica conflictul!)
        (@Neprezentare, @Programat);      -- reprogramare pe acelasi slot
    -- FINALIZAT este terminal: nicio tranzitie de ieșire.

    PRINT 'Tabel AppointmentStatusTransitions creat + seed.';
END
GO

-- ── 3. CHECK durată pozitivă ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Appointments_Times')
BEGIN
    -- Curăță eventualele rânduri invalide istorice înainte de constrângere.
    UPDATE dbo.Appointments
       SET EndTime = DATEADD(MINUTE, 30, StartTime)
     WHERE EndTime <= StartTime;

    ALTER TABLE dbo.Appointments
        ADD CONSTRAINT CK_Appointments_Times CHECK (EndTime > StartTime);
    PRINT 'Constrangere CK_Appointments_Times adaugata.';
END
GO

-- ── 4. RowVersion pentru concurență optimistă ────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Appointments') AND name = 'RowVersion')
BEGIN
    ALTER TABLE dbo.Appointments ADD RowVersion ROWVERSION NOT NULL;
    PRINT 'Coloana Appointments.RowVersion adaugata.';
END
GO

-- ── 5. Indecși ───────────────────────────────────────────────────────────────
-- Index filtrat pentru verificarea de conflict (cel mai fierbinte acces).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Appointments_Conflict')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Appointments_Conflict
        ON dbo.Appointments (ClinicId, DoctorId, StartTime, EndTime)
        INCLUDE (StatusId)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Appointments_Conflict creat.';
END
GO

-- Index pentru listare + statistici pe status.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Appointments_ClinicId_Status_StartTime')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Appointments_ClinicId_Status_StartTime
        ON dbo.Appointments (ClinicId, StatusId, StartTime DESC)
        INCLUDE (PatientId, DoctorId, EndTime)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Appointments_ClinicId_Status_StartTime creat.';
END
GO

PRINT 'Migrarea 0057_AppointmentsHardening finalizata cu succes.';
GO
```

### 3.2 Coduri de eroare noi

`src/ValyanClinic.Application/Common/Constants/SqlErrorCodes.cs` — extinde range-ul rezervat Appointments (50010–50019):

```csharp
    public const int AppointmentConflict           = 50010;
    public const int AppointmentNotFound           = 50011;
    public const int AppointmentPatientNotInClinic = 50012;
    public const int AppointmentDoctorNotInClinic  = 50013;
    public const int AppointmentInvalidStatus      = 50014;
    public const int AppointmentHasConsultation    = 50015;
    public const int AppointmentOutsideSchedule    = 50016;
    public const int AppointmentInvalidTransition  = 50017;
    public const int AppointmentInvalidTimeRange   = 50018;
    public const int AppointmentConcurrency        = 50019;
```

`ErrorMessages.cs`:

```csharp
    public static class Appointment
    {
        public const string Conflict           = "Există deja o programare în acest interval orar.";
        public const string NotFound           = "Programarea nu a fost găsită.";
        public const string PatientNotInClinic = "Pacientul selectat nu aparține clinicii curente.";
        public const string DoctorNotInClinic  = "Doctorul selectat nu aparține clinicii curente.";
        public const string InvalidStatus      = "Statusul selectat nu este valid.";
        public const string HasConsultation    = "Programarea are o consultație asociată și nu poate fi ștearsă.";
        public const string OutsideSchedule    = "Intervalul selectat este în afara programului clinicii sau al doctorului.";
        public const string InvalidTransition  = "Tranziția de status nu este permisă.";
        public const string InvalidTimeRange   = "Ora de sfârșit trebuie să fie după ora de început.";
        public const string Concurrency        = "Programarea a fost modificată de alt utilizator. Reîncarcă datele.";
    }
```

### 3.3 `Appointment_Create.sql` — rescris

Rezolvă: S1, S2, S3, S16 (validare program).

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Create
-- Descriere: Creează o programare nouă. Validează tenancy, status, program de
--            lucru și conflictul de orar în tranzacție (UPDLOCK, HOLDLOCK).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Create
    @ClinicId        UNIQUEIDENTIFIER,
    @PatientId       UNIQUEIDENTIFIER,
    @DoctorId        UNIQUEIDENTIFIER,
    @StartTime       DATETIME2(0),
    @EndTime         DATETIME2(0),
    @StatusId        UNIQUEIDENTIFIER = NULL,
    @Notes           NVARCHAR(2000)   = NULL,
    @EnforceSchedule BIT              = 1,   -- 0 = suprascriere explicită din UI
    @CreatedBy       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @EndTime <= @StartTime
    BEGIN
        ;THROW 50018, N'Ora de sfârșit trebuie să fie după ora de început.', 1;
    END;

    IF @StatusId IS NULL
        SET @StatusId = 'A1000000-0000-0000-0000-000000000001';   -- PROGRAMAT

    -- ── Multi-tenancy (R1): pacientul și doctorul trebuie să fie ai clinicii ──
    IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                   WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50012, N'Pacientul selectat nu aparține clinicii curente.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                   WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50013, N'Doctorul selectat nu aparține clinicii curente.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses
                   WHERE Id = @StatusId AND IsActive = 1)
    BEGIN
        ;THROW 50014, N'Statusul selectat nu este valid.', 1;
    END;

    -- ── Program de lucru clinică ∩ doctor ────────────────────────────────────
    IF @EnforceSchedule = 1
    BEGIN
        -- SQL Server: DATEPART(WEEKDAY) depinde de DATEFIRST; normalizăm 1=Luni..7=Duminică.
        DECLARE @Dow TINYINT =
            ((DATEDIFF(DAY, '19000101', CAST(@StartTime AS DATE)) % 7) + 1);  -- 19000101 = luni

        DECLARE @StartT TIME(0) = CAST(@StartTime AS TIME(0));
        DECLARE @EndT   TIME(0) = CAST(@EndTime   AS TIME(0));

        -- Programările care traversează miezul nopții nu sunt suportate.
        IF CAST(@StartTime AS DATE) <> CAST(@EndTime AS DATE)
        BEGIN
            ;THROW 50016, N'Programarea trebuie să se încheie în aceeași zi.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.ClinicSchedule cs
            WHERE cs.ClinicId = @ClinicId
              AND cs.DayOfWeek = @Dow
              AND cs.IsOpen = 1
              AND cs.OpenTime IS NOT NULL AND cs.CloseTime IS NOT NULL
              AND @StartT >= cs.OpenTime AND @EndT <= cs.CloseTime
        )
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului clinicii.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.DoctorSchedule ds
            WHERE ds.DoctorId = @DoctorId
              AND ds.DayOfWeek = @Dow
              AND @StartT >= ds.StartTime AND @EndT <= ds.EndTime
        )
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului doctorului.', 1;
        END;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    BEGIN TRANSACTION;

        -- Lock de interval pe indexul IX_Appointments_Conflict: serializează
        -- cererile concurente pe același doctor (S2).
        IF EXISTS (
            SELECT 1
            FROM dbo.Appointments a WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId   = @ClinicId
              AND a.DoctorId   = @DoctorId
              AND a.IsDeleted  = 0
              AND s.BlocksSlot = 1                -- ANULAT / NEPREZENTARE nu blochează (S3)
              AND a.StartTime  < @EndTime
              AND a.EndTime    > @StartTime
        )
        BEGIN
            ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
        END;

        INSERT INTO dbo.Appointments
            (Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes, CreatedBy)
        VALUES
            (@NewId, @ClinicId, @PatientId, @DoctorId, @StartTime, @EndTime, @StatusId, @Notes, @CreatedBy);

        DECLARE @NewValues NVARCHAR(MAX) = (
            SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
            FROM dbo.Appointments WHERE Id = @NewId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Appointment', @NewId, N'Create', NULL, @NewValues, @CreatedBy);

    COMMIT TRANSACTION;

    SELECT @NewId;
END;
GO
```

> **Notă de implementare**: `@Dow` calculat prin `DATEDIFF(DAY, '19000101', …) % 7 + 1` este independent de `SET DATEFIRST` (1900-01-01 a fost luni). Nu folosi `DATEPART(WEEKDAY)` — depinde de sesiune.

### 3.4 `Appointment_Update.sql` — rescris

Aceleași validări ca Create, plus verificarea de existență, concurență optimistă și protecția consultației finalizate.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Appointment_Update
    @Id              UNIQUEIDENTIFIER,
    @ClinicId        UNIQUEIDENTIFIER,
    @PatientId       UNIQUEIDENTIFIER,
    @DoctorId        UNIQUEIDENTIFIER,
    @StartTime       DATETIME2(0),
    @EndTime         DATETIME2(0),
    @StatusId        UNIQUEIDENTIFIER = NULL,
    @Notes           NVARCHAR(2000)   = NULL,
    @EnforceSchedule BIT              = 1,
    @RowVersion      BINARY(8)        = NULL,   -- NULL = fără verificare de concurență
    @UpdatedBy       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @EndTime <= @StartTime
    BEGIN
        ;THROW 50018, N'Ora de sfârșit trebuie să fie după ora de început.', 1;
    END;

    DECLARE @CurrentStatusId UNIQUEIDENTIFIER, @CurrentRowVersion BINARY(8);

    SELECT @CurrentStatusId = StatusId, @CurrentRowVersion = RowVersion
    FROM dbo.Appointments
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

    IF @CurrentStatusId IS NULL
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    IF @RowVersion IS NOT NULL AND @RowVersion <> @CurrentRowVersion
    BEGIN
        ;THROW 50019, N'Programarea a fost modificată de alt utilizator.', 1;
    END;

    SET @StatusId = ISNULL(@StatusId, @CurrentStatusId);

    IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                   WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50012, N'Pacientul selectat nu aparține clinicii curente.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                   WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50013, N'Doctorul selectat nu aparține clinicii curente.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND IsActive = 1)
    BEGIN
        ;THROW 50014, N'Statusul selectat nu este valid.', 1;
    END;

    -- Tranziție de status (dacă se schimbă) — matricea din migrarea 0057.
    IF @StatusId <> @CurrentStatusId
       AND NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatusTransitions
                       WHERE FromStatusId = @CurrentStatusId AND ToStatusId = @StatusId)
    BEGIN
        ;THROW 50017, N'Tranziția de status nu este permisă.', 1;
    END;

    -- O programare cu consultație finalizată nu se mai mută în timp.
    IF EXISTS (
        SELECT 1
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
        WHERE c.AppointmentId = @Id
          AND c.IsDeleted = 0
          AND cs.Code IN ('FINALIZATA', 'BLOCATA')
    )
    AND EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE Id = @Id AND (StartTime <> @StartTime OR EndTime <> @EndTime OR DoctorId <> @DoctorId)
    )
    BEGIN
        ;THROW 50015, N'Programarea are o consultație finalizată — intervalul nu mai poate fi modificat.', 1;
    END;

    IF @EnforceSchedule = 1
    BEGIN
        DECLARE @Dow TINYINT = ((DATEDIFF(DAY, '19000101', CAST(@StartTime AS DATE)) % 7) + 1);
        DECLARE @StartT TIME(0) = CAST(@StartTime AS TIME(0));
        DECLARE @EndT   TIME(0) = CAST(@EndTime   AS TIME(0));

        IF CAST(@StartTime AS DATE) <> CAST(@EndTime AS DATE)
        BEGIN
            ;THROW 50016, N'Programarea trebuie să se încheie în aceeași zi.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.ClinicSchedule cs
            WHERE cs.ClinicId = @ClinicId AND cs.DayOfWeek = @Dow AND cs.IsOpen = 1
              AND cs.OpenTime IS NOT NULL AND cs.CloseTime IS NOT NULL
              AND @StartT >= cs.OpenTime AND @EndT <= cs.CloseTime)
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului clinicii.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.DoctorSchedule ds
            WHERE ds.DoctorId = @DoctorId AND ds.DayOfWeek = @Dow
              AND @StartT >= ds.StartTime AND @EndT <= ds.EndTime)
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului doctorului.', 1;
        END;
    END;

    BEGIN TRANSACTION;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
            FROM dbo.Appointments WITH (UPDLOCK)
            WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        -- Conflictul se verifică doar dacă noul status blochează slotul
        -- (o programare care devine ANULAT nu mai are nevoie de slot liber).
        IF EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND BlocksSlot = 1)
           AND EXISTS (
                SELECT 1
                FROM dbo.Appointments a WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
                WHERE a.ClinicId   = @ClinicId
                  AND a.DoctorId   = @DoctorId
                  AND a.Id        <> @Id
                  AND a.IsDeleted  = 0
                  AND s.BlocksSlot = 1
                  AND a.StartTime  < @EndTime
                  AND a.EndTime    > @StartTime
           )
        BEGIN
            ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
        END;

        UPDATE dbo.Appointments SET
            PatientId = @PatientId,
            DoctorId  = @DoctorId,
            StartTime = @StartTime,
            EndTime   = @EndTime,
            StatusId  = @StatusId,
            Notes     = @Notes,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        DECLARE @NewValues NVARCHAR(MAX) = (
            SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
            FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Appointment', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);

    COMMIT TRANSACTION;
END;
GO
```

### 3.5 `Appointment_UpdateStatus.sql` — rescris

Rezolvă S4 (audit + validare status), S16 (tranziții), plus reverificarea conflictului la reactivare.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Appointment_UpdateStatus
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @StatusId  UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CurrentStatusId UNIQUEIDENTIFIER,
            @DoctorId        UNIQUEIDENTIFIER,
            @StartTime       DATETIME2(0),
            @EndTime         DATETIME2(0);

    SELECT @CurrentStatusId = StatusId, @DoctorId = DoctorId,
           @StartTime = StartTime, @EndTime = EndTime
    FROM dbo.Appointments
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

    IF @CurrentStatusId IS NULL
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND IsActive = 1)
    BEGIN
        ;THROW 50014, N'Statusul selectat nu este valid.', 1;
    END;

    -- Idempotent: aceeași valoare → no-op, fără audit zgomotos.
    IF @StatusId = @CurrentStatusId
        RETURN;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatusTransitions
                   WHERE FromStatusId = @CurrentStatusId AND ToStatusId = @StatusId)
    BEGIN
        ;THROW 50017, N'Tranziția de status nu este permisă.', 1;
    END;

    BEGIN TRANSACTION;

        -- Reactivare (ANULAT/NEPREZENTARE → PROGRAMAT): slotul poate fi deja ocupat.
        IF EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND BlocksSlot = 1)
           AND EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @CurrentStatusId AND BlocksSlot = 0)
           AND EXISTS (
                SELECT 1
                FROM dbo.Appointments a WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
                WHERE a.ClinicId   = @ClinicId
                  AND a.DoctorId   = @DoctorId
                  AND a.Id        <> @Id
                  AND a.IsDeleted  = 0
                  AND s.BlocksSlot = 1
                  AND a.StartTime  < @EndTime
                  AND a.EndTime    > @StartTime
           )
        BEGIN
            ;THROW 50010, N'Slotul a fost ocupat între timp de o altă programare.', 1;
        END;

        UPDATE dbo.Appointments SET
            StatusId  = @StatusId,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        -- Audit (R3) — lipsea complet.
        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (
            @ClinicId, N'Appointment', @Id, N'UpdateStatus',
            (SELECT @CurrentStatusId AS StatusId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT @StatusId        AS StatusId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @UpdatedBy);

    COMMIT TRANSACTION;
END;
GO
```

### 3.6 `Appointment_Delete.sql` — completare

Rezolvă S5.

Inserează, imediat după verificarea de existență și înainte de captarea `@OldValues`:

```sql
    -- Regulă business: nu se șterge o programare cu consultație activă.
    IF EXISTS (SELECT 1 FROM dbo.Consultations
               WHERE AppointmentId = @Id AND IsDeleted = 0)
    BEGIN
        ;THROW 50015, N'Programarea are o consultație asociată și nu poate fi ștearsă. Anulează-o în schimb.', 1;
    END;
```

Restul SP-ului rămâne neschimbat (soft delete + audit deja corecte).

### 3.7 `Appointment_GetPaged.sql` — rescris

Rezolvă S6, S7, S8, S9, S10, S11 + expune `NoShowCount`.

Design: un tabel temporar `#Base` conține rezultatul **tuturor filtrelor mai puțin statusul**. Result set 1 și 2 aplică filtrul de status; result set 3 (statistici) rulează pe `#Base`, deci cardurile arată distribuția pe statusuri a selecției curente și rămân utile ca butoane de filtrare.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetPaged
-- Result sets: (1) pagina curentă, (2) totalCount, (3) statistici pe selecție
-- Statisticile ignoră DOAR filtrul de status (cardurile rămân navigabile).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200)    = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0)     = NULL,
    @DateTo     DATETIME2(0)     = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 20,
    @SortBy     NVARCHAR(50)     = 'StartTime',
    @SortDir    NVARCHAR(4)      = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Normalizare parametri (S10, S11) ────────────────────────────────────
    SET @Page     = CASE WHEN ISNULL(@Page, 1) < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN ISNULL(@PageSize, 20) < 1   THEN 20
                         WHEN @PageSize > 200            THEN 200
                         ELSE @PageSize END;

    SET @SortBy = CASE LOWER(LTRIM(RTRIM(ISNULL(@SortBy, ''))))
                    WHEN 'patientname' THEN 'PatientName'
                    WHEN 'doctorname'  THEN 'DoctorName'
                    WHEN 'statusname'  THEN 'StatusName'
                    WHEN 'createdat'   THEN 'CreatedAt'
                    ELSE 'StartTime'
                  END;
    SET @SortDir = CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(@SortDir, '')))) = 'asc' THEN 'asc' ELSE 'desc' END;

    -- ── Escape LIKE (S8) ────────────────────────────────────────────────────
    DECLARE @Pattern NVARCHAR(410) = NULL;
    IF NULLIF(LTRIM(RTRIM(@Search)), N'') IS NOT NULL
        SET @Pattern = N'%' +
            REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(@Search)), N'[', N'[[]'), N'%', N'[%]'), N'_', N'[_]')
            + N'%';

    -- ── Selecția de bază: toate filtrele MAI PUȚIN statusul (S6, S9) ────────
    CREATE TABLE #Base (
        Id            UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ClinicId      UNIQUEIDENTIFIER NOT NULL,
        PatientId     UNIQUEIDENTIFIER NOT NULL,
        DoctorId      UNIQUEIDENTIFIER NOT NULL,
        StartTime     DATETIME2(0)     NOT NULL,
        EndTime       DATETIME2(0)     NOT NULL,
        StatusId      UNIQUEIDENTIFIER NOT NULL,
        StatusCode    NVARCHAR(50)     NOT NULL,
        StatusName    NVARCHAR(100)    NOT NULL,
        Notes         NVARCHAR(2000)   NULL,
        IsDeleted     BIT              NOT NULL,
        CreatedAt     DATETIME2(0)     NOT NULL,
        CreatedBy     UNIQUEIDENTIFIER NOT NULL,
        PatientName   NVARCHAR(201)    NOT NULL,
        PatientPhone  NVARCHAR(20)     NULL,
        DoctorName    NVARCHAR(201)    NOT NULL,
        SpecialtyName NVARCHAR(200)    NULL,
        CreatedByName NVARCHAR(201)    NULL
    );

    INSERT INTO #Base
    SELECT
        a.Id, a.ClinicId, a.PatientId, a.DoctorId,
        a.StartTime, a.EndTime, a.StatusId, s.Code, s.Name, a.Notes,
        a.IsDeleted, a.CreatedAt, a.CreatedBy,
        CONCAT(p.LastName, N' ', p.FirstName),
        p.PhoneNumber,
        CONCAT(d.LastName, N' ', d.FirstName),
        sp.Name,
        CONCAT(cu.LastName, N' ', cu.FirstName)
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p            ON p.Id  = a.PatientId
    INNER JOIN dbo.Doctors d             ON d.Id  = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id  = a.StatusId
    LEFT  JOIN dbo.Specialties sp        ON sp.Id = d.SpecialtyId AND sp.IsDeleted = 0
    LEFT  JOIN dbo.Users cu              ON cu.Id = a.CreatedBy
    WHERE a.ClinicId  = @ClinicId
      AND a.IsDeleted = 0
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
      AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
      AND (@DateTo   IS NULL OR a.StartTime <  DATEADD(DAY, 1, @DateTo))
      AND (@Pattern IS NULL
           OR CONCAT(p.LastName, N' ', p.FirstName) LIKE @Pattern
           OR CONCAT(d.LastName, N' ', d.FirstName) LIKE @Pattern
           OR a.Notes LIKE @Pattern)
    OPTION (RECOMPILE);   -- planuri diferite pentru combinații diferite de filtre

    -- ── Result set 1: pagina curentă ────────────────────────────────────────
    -- ORDER BY cu tiebreaker pe Id → paginare stabilă (S7).
    SELECT Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes,
           IsDeleted, CreatedAt, CreatedBy, PatientName, PatientPhone, DoctorName,
           SpecialtyName, StatusName, StatusCode, CreatedByName
    FROM #Base
    WHERE (@StatusId IS NULL OR StatusId = @StatusId)
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy WHEN 'PatientName' THEN PatientName
                         WHEN 'DoctorName'  THEN DoctorName
                         WHEN 'StatusName'  THEN StatusName
                         WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                         ELSE CONVERT(NVARCHAR(30), StartTime, 126) END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy WHEN 'PatientName' THEN PatientName
                         WHEN 'DoctorName'  THEN DoctorName
                         WHEN 'StatusName'  THEN StatusName
                         WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                         ELSE CONVERT(NVARCHAR(30), StartTime, 126) END
        END DESC,
        Id ASC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- ── Result set 2: total count (aceleași filtre, o singură definiție) ────
    SELECT COUNT(*) FROM #Base WHERE (@StatusId IS NULL OR StatusId = @StatusId);

    -- ── Result set 3: statistici pe selecție, fără filtrul de status ────────
    SELECT
        COUNT(*)                                                   AS TotalAppointments,
        SUM(CASE WHEN StatusCode = 'PROGRAMAT'    THEN 1 ELSE 0 END) AS ScheduledCount,
        SUM(CASE WHEN StatusCode = 'CONFIRMAT'    THEN 1 ELSE 0 END) AS ConfirmedCount,
        SUM(CASE WHEN StatusCode = 'FINALIZAT'    THEN 1 ELSE 0 END) AS CompletedCount,
        SUM(CASE WHEN StatusCode = 'ANULAT'       THEN 1 ELSE 0 END) AS CancelledCount,
        SUM(CASE WHEN StatusCode = 'NEPREZENTARE' THEN 1 ELSE 0 END) AS NoShowCount
    FROM #Base;

    DROP TABLE #Base;
END;
GO
```

> Dacă volumul depășește ~50k programări per clinică, înlocuiește `#Base` cu paginare prin `ROW_NUMBER()` pe indexul acoperitor și calculează statisticile într-un al doilea query agregat direct pe tabel. Decizia D3 din §7.

### 3.8 `Appointment_GetByDoctor.sql` — corecție de interval

Rezolvă S13: intervalul trebuie evaluat prin suprapunere, nu doar pe `StartTime`. Se adaugă și `BlocksSlot` în payload, pentru ca scheduler-ul să știe ce ocupă slotul.

```sql
    SELECT
        a.Id, a.PatientId,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        a.DoctorId,
        CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        s.BlocksSlot,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId  = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime < DATEADD(DAY, 1, @DateTo)   -- suprapunere de interval (S13)
      AND a.EndTime   > @DateFrom
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
    ORDER BY a.StartTime, a.Id;
```

Adaugă `public bool BlocksSlot { get; init; }` în `AppointmentSchedulerDto` și `blocksSlot: boolean` în tipul TS corespondent.

### 3.9 `Appointment_CheckConflict.sql` — actualizare + expunere

Rezolvă S15 parțial și B6. SP-ul devine util: exclude statusurile care nu blochează și returnează detalii despre conflict.

```sql
CREATE OR ALTER PROCEDURE dbo.Appointment_CheckConflict
    @ClinicId  UNIQUEIDENTIFIER,
    @DoctorId  UNIQUEIDENTIFIER,
    @StartTime DATETIME2(0),
    @EndTime   DATETIME2(0),
    @ExcludeId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (5)
        a.Id, a.StartTime, a.EndTime,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        s.Name AS StatusName
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p            ON p.Id = a.PatientId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId   = @ClinicId
      AND a.DoctorId   = @DoctorId
      AND a.IsDeleted  = 0
      AND s.BlocksSlot = 1
      AND (@ExcludeId IS NULL OR a.Id <> @ExcludeId)
      AND a.StartTime  < @EndTime
      AND a.EndTime    > @StartTime
    ORDER BY a.StartTime;
END;
GO
```

### 3.10 SP nou — `Appointment_GetStatuses.sql`

Rezolvă B5 / F-hardcoded GUIDs.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Appointment_GetStatuses
AS
BEGIN
    SET NOCOUNT ON;

    SELECT s.Id, s.Name, s.Code, s.SortOrder, s.BlocksSlot,
           -- listă de coduri în care se poate tranziționa, pentru gating în UI
           (SELECT STRING_AGG(t.Code, ',')
              FROM dbo.AppointmentStatusTransitions tr
              INNER JOIN dbo.AppointmentStatuses t ON t.Id = tr.ToStatusId
             WHERE tr.FromStatusId = s.Id AND t.IsActive = 1) AS AllowedNextCodes
    FROM dbo.AppointmentStatuses s
    WHERE s.IsActive = 1
    ORDER BY s.SortOrder;
END;
GO
```

### 3.11 `Appointment_GetById.sql` — ajustări

- adaugă `a.RowVersion` în `SELECT` (pentru concurență optimistă);
- adaugă `s.BlocksSlot` și, opțional, `cons.Id AS ConsultationId` (LEFT JOIN pe `Consultations` cu `IsDeleted = 0`) — modalul de detaliu poate atunci oferi direct „Deschide consultația";
- păstrează `AND a.IsDeleted = 0` (F/B4) și **elimină** `IsDeleted` din `AppointmentDetailDto`, fiind mereu `false`, sau scoate filtrul și lasă UI-ul să afișeze „ștearsă". Vezi decizia **D2**.

### 3.12 `Appointment_GetByPatient.sql`

Ori se expune (endpoint `GET /api/v1/Appointments/by-patient/{patientId}`, folosit în fișa pacientului), ori se șterge împreună cu constanta din `AppointmentProcedures.cs`. Recomandare: **expune-l** — fișa pacientului are nevoie de istoricul programărilor. Adaugă `ORDER BY a.StartTime DESC, a.Id DESC` (tiebreaker) și un `@Take INT = 100` pentru limitare.

---

## 4. Corecții backend

### B1 — Traducerea erorilor SQL de infrastructură

Adaugă în `BaseApiController` sau, mai bine, într-un `MediatR` pipeline behavior nou, tratarea `SqlException` cu `Number` în afara range-ului business. Minim invaziv: extinde `GlobalExceptionHandlerMiddleware`:

```csharp
catch (SqlException sqlEx) when (sqlEx.Number is 547 or 2601 or 2627)
{
    var correlationId = context.Items["CorrelationId"]?.ToString() ?? "N/A";
    logger.LogWarning(sqlEx,
        "Violare de constrângere SQL. CorrelationId: {CorrelationId}, Path: {Path}, Number: {Number}",
        correlationId, context.Request.Path, sqlEx.Number);

    context.Response.StatusCode  = (int)HttpStatusCode.BadRequest;
    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(new ApiResponse<object>(
        Success: false,
        Data: null,
        Message: "Datele trimise fac referire la înregistrări inexistente sau duplicate.",
        Errors: null));
}
```

Ordinea `catch` contează: blocul specific înaintea celui generic. Odată cu S1/S3.5 (validări explicite în SP) cazurile de 547 pe Appointments dispar, dar plasa de siguranță rămâne utilă pentru restul aplicației.

### B2 — `GetAppointmentsQueryValidator` (nou)

`src/ValyanClinic.Application/Features/Appointments/Queries/GetAppointments/GetAppointmentsQueryValidator.cs`:

```csharp
using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;

public sealed class GetAppointmentsQueryValidator : AbstractValidator<GetAppointmentsQuery>
{
    private static readonly string[] AllowedSortFields =
        ["StartTime", "PatientName", "DoctorName", "StatusName", "CreatedAt"];

    public GetAppointmentsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 200).WithMessage("Dimensiunea paginii trebuie să fie între 1 și 200.");

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Termenul de căutare nu poate depăși 200 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Search));

        RuleFor(x => x.SortBy)
            .Must(v => AllowedSortFields.Contains(v, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Câmpul de sortare nu este valid.")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.SortDir)
            .Must(v => v is "asc" or "desc")
            .WithMessage("Direcția de sortare trebuie să fie 'asc' sau 'desc'.")
            .When(x => !string.IsNullOrEmpty(x.SortDir));

        RuleFor(x => x)
            .Must(x => x.DateTo >= x.DateFrom)
            .WithMessage("Data 'până la' trebuie să fie după data 'de la'.")
            .When(x => x.DateFrom.HasValue && x.DateTo.HasValue);
    }
}
```

### B2b — Validatoare Create/Update: completări

Adaugă în `CreateAppointmentCommandValidator` și `UpdateAppointmentCommandValidator`:

```csharp
        // Durata minimă / maximă rezonabilă pentru o consultație
        RuleFor(x => x)
            .Must(x => (x.EndTime - x.StartTime).TotalMinutes >= 5)
            .WithMessage("Programarea trebuie să dureze cel puțin 5 minute.")
            .When(x => x.EndTime > x.StartTime);

        RuleFor(x => x)
            .Must(x => (x.EndTime - x.StartTime).TotalHours <= 8)
            .WithMessage("Programarea nu poate depăși 8 ore.")
            .When(x => x.EndTime > x.StartTime);

        // Aceeași zi calendaristică (SP-ul respinge altfel cu 50016)
        RuleFor(x => x)
            .Must(x => x.StartTime.Date == x.EndTime.Date)
            .WithMessage("Programarea trebuie să se încheie în aceeași zi.")
            .When(x => x.EndTime > x.StartTime);
```

Pentru `Create` adaugă și limita pe trecut (fereastră de toleranță pentru înregistrări retroactive — vezi **D4**):

```csharp
        RuleFor(x => x.StartTime)
            .GreaterThan(_ => DateTime.Now.AddDays(-1))
            .WithMessage("Nu se pot crea programări mai vechi de o zi.");
```

### B3 — `AppointmentStatsDto`

```csharp
public sealed class AppointmentStatsDto
{
    public int TotalAppointments { get; init; }
    public int ScheduledCount    { get; init; }
    public int ConfirmedCount    { get; init; }
    public int CompletedCount    { get; init; }
    public int CancelledCount    { get; init; }
    public int NoShowCount       { get; init; }   // nou — statusul NEPREZENTARE exista deja în seed
}
```

### B5 — Slice nou: statusuri

```
src/ValyanClinic.Application/Features/Appointments/
├── DTOs/AppointmentStatusDto.cs
└── Queries/GetAppointmentStatuses/
    ├── GetAppointmentStatusesQuery.cs
    └── GetAppointmentStatusesQueryHandler.cs
```

```csharp
// DTOs/AppointmentStatusDto.cs
namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>Nomenclator status programare + tranzițiile permise din el.</summary>
public sealed class AppointmentStatusDto
{
    public Guid   Id               { get; init; }
    public string Name             { get; init; } = string.Empty;
    public string Code             { get; init; } = string.Empty;
    public int    SortOrder        { get; init; }
    public bool   BlocksSlot       { get; init; }
    /// <summary>Coduri separate prin virgulă — vine ca STRING_AGG din SP.</summary>
    public string? AllowedNextCodes { get; init; }
}
```

```csharp
// Queries/GetAppointmentStatuses/GetAppointmentStatusesQuery.cs
public sealed record GetAppointmentStatusesQuery
    : IRequest<Result<IEnumerable<AppointmentStatusDto>>>;
```

```csharp
// Queries/GetAppointmentStatuses/GetAppointmentStatusesQueryHandler.cs
public sealed class GetAppointmentStatusesQueryHandler(IAppointmentRepository repository)
    : IRequestHandler<GetAppointmentStatusesQuery, Result<IEnumerable<AppointmentStatusDto>>>
{
    public async Task<Result<IEnumerable<AppointmentStatusDto>>> Handle(
        GetAppointmentStatusesQuery request, CancellationToken cancellationToken)
    {
        var statuses = await repository.GetStatusesAsync(cancellationToken);
        return Result<IEnumerable<AppointmentStatusDto>>.Success(statuses);
    }
}
```

Controller:

```csharp
    /// <summary>Nomenclator statusuri programări (cache-abil în client).</summary>
    [HttpGet("statuses")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<AppointmentStatusDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatuses(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetAppointmentStatusesQuery(), ct));
```

`AppointmentStatusIds.cs` rămâne — e folosit în teste și în seed-uri — dar **nu mai e sursa de adevăr pentru UI**.

### B6 — Endpoint de verificare conflict

```csharp
    /// <summary>Verifică disponibilitatea unui interval înainte de submit (evită 409).</summary>
    [HttpGet("conflicts")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<AppointmentConflictDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConflicts(
        [FromQuery] Guid doctorId,
        [FromQuery] DateTime startTime,
        [FromQuery] DateTime endTime,
        [FromQuery] Guid? excludeId,
        CancellationToken ct)
        => HandleResult(await Mediator.Send(
            new GetAppointmentConflictsQuery(doctorId, startTime, endTime, excludeId), ct));
```

`AppointmentConflictDto`: `Id`, `StartTime`, `EndTime`, `PatientName`, `StatusName`.
Validator: `doctorId` `NotEmpty`, `endTime > startTime`.

### B7 — Semnătura repository-ului

`CreateAsync` / `UpdateAsync` au 9–11 parametri poziționali. Introdu un parametru-obiect, ca să elimini clasa de erori din R8:

```csharp
// src/ValyanClinic.Application/Common/Interfaces/IAppointmentRepository.cs
public sealed record AppointmentWriteData(
    Guid     ClinicId,
    Guid     PatientId,
    Guid     DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid?    StatusId,
    string?  Notes,
    bool     EnforceSchedule,
    Guid     ActorId);

public interface IAppointmentRepository
{
    Task<Guid> CreateAsync(AppointmentWriteData data, CancellationToken ct);
    Task UpdateAsync(Guid id, byte[]? rowVersion, AppointmentWriteData data, CancellationToken ct);
    // … restul metodelor neschimbate
    Task<IEnumerable<AppointmentStatusDto>> GetStatusesAsync(CancellationToken ct);
    Task<IEnumerable<AppointmentConflictDto>> GetConflictsAsync(
        Guid clinicId, Guid doctorId, DateTime startTime, DateTime endTime, Guid? excludeId,
        CancellationToken ct);
}
```

Testele existente (`CreateAppointmentCommandHandlerTests`) trebuie actualizate în același commit — R8. Mock-ul devine `_repo.CreateAsync(Arg.Any<AppointmentWriteData>(), Arg.Any<CancellationToken>())`, iar asserțiunile pe tenancy se fac cu un predicat, ceea ce e și mai citibil:

```csharp
        await _repo.Received(1).CreateAsync(
            Arg.Is<AppointmentWriteData>(d => d.ClinicId == ClinicId && d.ActorId == UserId),
            Arg.Any<CancellationToken>());
```

### B8 — Handlere: coduri noi de eroare

Toate handlerele de Appointments capătă clauzele noi. Exemplu pentru `UpdateAppointmentCommandHandler` (aceleași pentru Create, fără `NotFound`/`Concurrency`):

```csharp
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Appointment.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentConflict)
        {
            return Result<bool>.Conflict(ErrorMessages.Appointment.Conflict);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentConcurrency)
        {
            return Result<bool>.Conflict(ErrorMessages.Appointment.Concurrency);
        }
        catch (SqlException ex) when (ex.Number is SqlErrorCodes.AppointmentPatientNotInClinic
                                              or SqlErrorCodes.AppointmentDoctorNotInClinic)
        {
            // Tenancy: nu dezvălui existența entității din altă clinică → 404, nu 403.
            return Result<bool>.NotFound(ErrorMessages.Appointment.NotFound);
        }
        catch (SqlException ex) when (ex.Number is SqlErrorCodes.AppointmentInvalidStatus
                                              or SqlErrorCodes.AppointmentInvalidTransition
                                              or SqlErrorCodes.AppointmentOutsideSchedule
                                              or SqlErrorCodes.AppointmentInvalidTimeRange
                                              or SqlErrorCodes.AppointmentHasConsultation)
        {
            return Result<bool>.Failure(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
```

> Decizia de a mapa tenancy-ul la **404** e intenționată: un `403` ar confirma că id-ul există în altă clinică.

### B9 — După orice modificare de endpoint (R9)

```powershell
.\generate-openapi.ps1
```

```bash
cd client && npm run gen:api && npm run check:api
```

---

## 5. Corecții frontend

### F1 — Afișarea erorii reale de la server (prioritate maximă)

Interceptorul din `client/src/api/axiosInstance.ts` face deja `Promise.reject(new Error(apiError))`, unde `apiError` este `response.data.message` — exact mesajul din `ApiResponse.Message`. Paginile îl aruncă.

`AppointmentsListPage.tsx`:

```tsx
      onError: (err: Error) => {
        setServerError(err.message)
      },
```

`AppointmentsSchedulerPage.tsx`, `handleFormSubmit` — identic.

Și la ștergere, unde acum eroarea dispare complet:

```tsx
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteAppointment.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Programarea a fost ștearsă.') },
      onError: (err: Error) => { setDeleteTarget(null); showError(err.message) },
    })
  }
```

`useFeedback` trebuie să expună și `showError`/`errorMsg`; verifică `client/src/hooks/useFeedback.ts` și folosește `FeedbackAlerts` cu `errorMsg` (pattern deja existent în alte pagini).

### F2 — Gating pe permisiuni

`AppointmentsListPage.tsx` și `AppointmentsSchedulerPage.tsx`:

```tsx
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'

  const { canWrite, hasFull } = useHasAccess()
  const canEdit   = canWrite(MODULE.Appointments)
  const canDelete = hasFull(MODULE.Appointments)
```

Aplică:

```tsx
            {canEdit && (
              <button className={styles.btnPrimary} onClick={handleOpenCreate}>
                <IconPlus /> Programare nouă
              </button>
            )}
```

```tsx
  const actionsTemplate = useCallback((row: AppointmentDto) => (
    <ActionButtons
      onView={() => handleOpenDetail(row)}
      onEdit={canEdit ? () => handleOpenEdit(row) : undefined}
      onDelete={canDelete ? () => setDeleteTarget(row) : undefined}
    />
  ), [canEdit, canDelete])
```

În scheduler: `draggable={canEdit}`, `onClick` pe slot gol activ doar dacă `canEdit`, `onDrop` no-op altfel.

### F3 + F4 + F5 — Fluxul de status (cea mai mare lipsă funcțională)

Astăzi `useUpdateAppointmentStatus` există și nu e apelat de nimeni, iar „Anulează programarea" face `DELETE`. Corect:

| Acțiune UI | Apel | Drept |
|---|---|---|
| Confirmă | `PATCH /{id}/status` → `CONFIRMAT` | `canWrite` |
| Finalizează | `PATCH /{id}/status` → `FINALIZAT` | `canWrite` |
| Neprezentare | `PATCH /{id}/status` → `NEPREZENTARE` | `canWrite` |
| Anulează | `PATCH /{id}/status` → `ANULAT` | `canWrite` |
| Șterge definitiv | `DELETE /{id}` | `hasFull` |

Componentă nouă `client/src/features/appointments/components/AppointmentStatusActions/AppointmentStatusActions.tsx`:

```tsx
import { useAppointmentStatuses, useUpdateAppointmentStatus } from '../../hooks/useAppointments'
import { AppButton } from '@/components/ui/AppButton'

interface AppointmentStatusActionsProps {
  appointmentId: string
  currentStatusCode: string
  canWrite: boolean
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

/** Codurile oferite ca acțiune rapidă, în ordinea fluxului clinic. */
const QUICK_ACTIONS = [
  { code: 'CONFIRMAT',    label: 'Confirmă',     variant: 'success' as const },
  { code: 'FINALIZAT',    label: 'Finalizează',  variant: 'primary' as const },
  { code: 'NEPREZENTARE', label: 'Neprezentare', variant: 'warning' as const },
  { code: 'ANULAT',       label: 'Anulează',     variant: 'outline-danger' as const },
]

export const AppointmentStatusActions = ({
  appointmentId, currentStatusCode, canWrite, onError, onSuccess,
}: AppointmentStatusActionsProps) => {
  const { data: statusesResp } = useAppointmentStatuses()
  const updateStatus = useUpdateAppointmentStatus()
  const statuses = statusesResp?.data ?? []

  const current = statuses.find(s => s.code === currentStatusCode)
  const allowed = new Set((current?.allowedNextCodes ?? '').split(',').filter(Boolean))

  if (!canWrite || allowed.size === 0) return null

  return (
    <>
      {QUICK_ACTIONS.filter(a => allowed.has(a.code)).map(action => {
        const target = statuses.find(s => s.code === action.code)
        if (!target) return null
        return (
          <AppButton
            key={action.code}
            size="sm"
            variant={action.variant}
            isLoading={updateStatus.isPending}
            onClick={() => updateStatus.mutate(
              { id: appointmentId, statusId: target.id },
              {
                onSuccess: () => onSuccess(`Status actualizat: ${target.name}.`),
                onError: (err: Error) => onError(err.message),
              },
            )}
          >
            {action.label}
          </AppButton>
        )
      })}
    </>
  )
}
```

Folosește-o în `AppointmentDetailModal` (footer) și în meniul de context / coloana de acțiuni din grid. Butonul din `ConfirmDeleteDialog` redevine „Șterge definitiv" cu textul corect („Programarea va fi ștearsă. Pentru anulare folosește butonul Anulează.").

### F3b — Hook nou pentru statusuri

`useAppointments.ts`:

```ts
// ── Nomenclator statusuri (rar se schimbă → cache lung) ──────────────────────
export const useAppointmentStatuses = () =>
  useQuery({
    queryKey: [...appointmentKeys.all, 'statuses'] as const,
    queryFn: () => appointmentsApi.getStatuses(),
    staleTime: 60 * 60 * 1000,   // 1 h
    gcTime:    24 * 60 * 60 * 1000,
  })
```

Și în `appointments.api.ts`:

```ts
  getStatuses: (): Promise<ApiResponse<AppointmentStatusDto[]>> =>
    api.get('/api/v1/Appointments/statuses'),

  getConflicts: (doctorId: string, startTime: string, endTime: string, excludeId?: string):
    Promise<ApiResponse<AppointmentConflictDto[]>> =>
      api.get('/api/v1/Appointments/conflicts',
              { params: { doctorId, startTime, endTime, excludeId } }),
```

Apoi **șterge** ambele blocuri hardcodate:
- `APPOINTMENT_STATUS_IDS` din `AppointmentsListPage.tsx` (liniile 58–64) → filtrul trimite direct `statusId` din nomenclator;
- `APPOINTMENT_STATUS_OPTIONS` + `DEFAULT_STATUS_ID` din `AppointmentFormModal.tsx` (liniile 61–69) → opțiuni din hook, default = statusul cu `sortOrder` minim.

Tipul `AppointmentStatusFilter` (`'all' | 'scheduled' | …`) devine inutil: `statusFilter` devine `string | undefined` (GUID), iar `statusOptions` se generează din nomenclator.

### F6 — Invalidări complete

```ts
/** Invalidează toate cheile afectate de o scriere pe programări. */
const invalidateAppointments = (qc: QueryClient, id?: string) => {
  qc.invalidateQueries({ queryKey: appointmentKeys.lists() })
  qc.invalidateQueries({ queryKey: [...appointmentKeys.all, 'scheduler'] })
  if (id) qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
}
```

Folosește-o în **toate** cele 4 mutații. Acum `useDeleteAppointment` nu invalidează scheduler-ul, iar `useCreate`/`useUpdate` nu invalidează detaliul.

### F7 — Feedback la drag & drop

`AppointmentsSchedulerPage.tsx`, în `handleTimelineDrop`:

```tsx
    updateAppointment.mutate({ /* … */ }, {
      onError: (err: Error) => {
        setDndError(err.message)          // ex. „Există deja o programare în acest interval orar."
        window.setTimeout(() => setDndError(null), 6000)
      },
    })
```

Adaugă starea `const [dndError, setDndError] = useState<string | null>(null)` și o bandă de eroare sub toolbar:

```tsx
      {dndError && (
        <div className="alert alert-danger py-2 mb-2" role="alert">{dndError}</div>
      )}
```

În plus, verifică local conflictul înainte de `mutate` — evită un roundtrip și un 409 previzibil:

```tsx
    const targetApts = groupedByDoctor.get(doctorId) ?? []
    const overlaps = targetApts.some(a =>
      a.id !== apt.id && a.blocksSlot &&
      minutesOf(a.startTime) < newEnd && minutesOf(a.endTime) > newStart)
    if (overlaps) {
      setDndError('Slotul este deja ocupat pentru acest doctor.')
      dragInfoRef.current = null
      setDraggingId(null)
      return
    }
```

### F8 — `TimeSelect` bazat pe programul clinicii

Problema concretă: `TIME_HOURS = 7..20`. Dacă `editData.startTime` e `06:30`, `<select value={6}>` nu are opțiune corespondentă → controlul apare gol, iar utilizatorul nu poate corecta ora fără să o reintroducă. Fix:

```tsx
interface TimeSelectProps {
  value: string
  onChange: (v: string) => void
  hasError?: boolean
  /** Fereastra permisă, în minute de la miezul nopții. */
  minMinutes: number
  maxMinutes: number
  /** Pasul pentru minute (implicit 5). */
  stepMinutes?: number
}

const TimeSelect = ({ value, onChange, hasError, minMinutes, maxMinutes, stepMinutes = 5 }: TimeSelectProps) => {
  const [hStr, mStr] = (value || '').split(':')
  const hVal = Number.isFinite(Number(hStr)) ? Number(hStr) : Math.floor(minMinutes / 60)
  const mVal = Number.isFinite(Number(mStr)) ? Number(mStr) : 0

  // Orele din fereastră + ora curentă, chiar dacă e în afara ei (valoare istorică).
  const hours = useMemo(() => {
    const from = Math.floor(minMinutes / 60)
    const to   = Math.ceil(maxMinutes / 60)
    const base = Array.from({ length: Math.max(to - from, 1) }, (_, i) => from + i)
    return base.includes(hVal) ? base : [...base, hVal].sort((a, b) => a - b)
  }, [minMinutes, maxMinutes, hVal])

  const minutes = useMemo(() => {
    const base = Array.from({ length: Math.floor(60 / stepMinutes) }, (_, i) => i * stepMinutes)
    return base.includes(mVal) ? base : [...base, mVal].sort((a, b) => a - b)
  }, [stepMinutes, mVal])
  // … restul identic
}
```

Fereastra vine din `useClinicSchedule()` + `useDoctorSchedules()` pentru `doctorId` și `date` selectate în formular; când lipsesc, fallback `7*60` / `20*60`. Modalul trebuie să consume aceste hook-uri (astăzi nu o face) — le are deja pagina de scheduler, deci nu e cost suplimentar de rețea semnificativ (același `queryKey`).

Adaugă și un avertisment non-blocant când intervalul e în afara programului, pentru ca utilizatorul să nu descopere restricția abia la submit:

```tsx
      {scheduleWarning && (
        <div className="alert alert-warning py-2 mb-0" role="alert">{scheduleWarning}</div>
      )}
```

### F9 — Tipuri din `schema.d.ts`

`schema.d.ts` conține deja `AppointmentDetailDto`, `AppointmentListDto`, `AppointmentSchedulerDto`, `AppointmentStatsDto`, `AppointmentsPagedResponse`, `CreateAppointmentCommand`, `UpdateAppointmentRequest`, `UpdateAppointmentStatusRequest`. Rescrie `appointment.types.ts`:

```ts
import type { components } from '@/api/generated/schema'

export type AppointmentDto              = components['schemas']['AppointmentListDto']
export type AppointmentDetailDto        = components['schemas']['AppointmentDetailDto']
export type AppointmentSchedulerDto     = components['schemas']['AppointmentSchedulerDto']
export type AppointmentStatsDto         = components['schemas']['AppointmentStatsDto']
export type AppointmentStatusDto        = components['schemas']['AppointmentStatusDto']
export type AppointmentConflictDto      = components['schemas']['AppointmentConflictDto']
export type AppointmentsPagedResponse   = components['schemas']['AppointmentsPagedResponse']
export type CreateAppointmentPayload    = components['schemas']['CreateAppointmentCommand']
export type UpdateAppointmentPayload    = { id: string } & components['schemas']['UpdateAppointmentRequest']
export type UpdateAppointmentStatusPayload = { id: string } & components['schemas']['UpdateAppointmentStatusRequest']

/// Params query — rămâne local, nu există în contract
export interface GetAppointmentsParams {
  page: number
  pageSize: number
  search?: string
  doctorId?: string
  statusId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
```

Atenție: tipurile generate au câmpurile opționale (`?`) și `| null` — vor apărea erori de `strictNullChecks` în locuri care presupun `string`. Rezolvă-le la punctul de consum (`?? ''`, `?? '—'`), **nu** reintroducând tipuri manuale. `PatientLookupDto` se importă din `@/features/patients/types/patient.types`, nu se redeclară local (astăzi e duplicat în `appointment.types.ts`).

### F10 — Grid: coerență server-side

Grid-ul rulează server-side (paginare + sortare + filtre din toolbar), dar are activate și feature-uri client-side care operează doar pe pagina curentă. Alege una:

- **Recomandat (minim de efort, zero confuzie)**: scoate `showFilterRow` și `showGroupPanel`; păstrează `rowSelection="multiple"` doar dacă adaugi acțiuni în masă (ex. confirmare în masă) și documentează că selecția e per pagină.
- Alternativ: implementează filtrele de coloană ca parametri de query în SP — efort mare, utilitate mică peste toolbar-ul existent.

```tsx
          // Filtrare pe coloane: dezactivată — paginarea e server-side, un filtru
          // client-side ar filtra doar pagina curentă și ar induce în eroare.
          // showFilterRow
          // showGroupPanel
```

### F11 — Export Excel pe tot setul filtrat

Astăzi `buildExportData()` mapează `appointments`, adică pagina curentă. Corect: cere explicit tot setul filtrat înaintea exportului.

```tsx
  const handleExcelExport = useCallback(async () => {
    setIsExporting(true)
    try {
      // Un singur fetch, în afara cache-ului de listă, cu pageSize maxim permis.
      const resp = await appointmentsApi.getAll({
        page: 1, pageSize: 200,
        search: search || undefined, doctorId, statusId,
        dateFrom, dateTo, sortBy, sortDir,
      })
      const rows = resp.data?.pagedResult?.items ?? []
      gridRef.current?.exportExcel({ fileName: 'programari', customData: mapExportRows(rows) })
      if ((resp.data?.pagedResult?.totalCount ?? 0) > rows.length) {
        showWarning('Exportul conține primele 200 de programări din selecție. Restrânge filtrele pentru un export complet.')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Exportul a eșuat.')
    } finally {
      setIsExporting(false)
    }
  }, [search, doctorId, statusId, dateFrom, dateTo, sortBy, sortDir])
```

Dacă exportul complet e o cerință reală, adaugă un endpoint dedicat de export server-side; altfel limita de 200 (din validatorul B2) este acceptabilă și trebuie comunicată. Vezi **D5**.

### F12 — `computeFreeSlots` corect

Două erori: numără programările nesuprapuse cu fereastra efectivă și tratează `ANULAT`/`NEPREZENTARE` ca ocupate.

```ts
  const dayApts = appointments.filter(a =>
    a.doctorId === doctorId &&
    a.blocksSlot &&                                    // nou — vine din SP
    isSameLocalDay(a.startTime, date))                 // nou — fără startsWith

  let bookedMinutes = 0
  for (const apt of dayApts) {
    const s = minutesOfLocal(apt.startTime)
    const e = minutesOfLocal(apt.endTime)
    // doar porțiunea care cade în fereastra efectivă de lucru
    const overlap = Math.max(0, Math.min(e, effTo) - Math.max(s, effFrom))
    bookedMinutes += overlap
  }
  return Math.max(0, Math.floor((effTo - effFrom - bookedMinutes) / slotMin))
```

### F13 — Indicator „acum" viu

```tsx
  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  const now = useMemo(() => new Date(nowTick), [nowTick])
```

Înlocuiește `const now = new Date()` de la nivel de render (folosit și pentru `isToday`, `overviewDayHeader--today`).

### F14 — Concurență optimistă în UI

După S3.4 / B7, `UpdateAppointmentRequest` primește `rowVersion` (string base64 din JSON). Formularul îl transmite din `editData`, iar la `50019` (409 `Concurrency`) afișează mesajul și oferă „Reîncarcă":

```tsx
      onError: (err: Error) => {
        setServerError(err.message)
        if (err.message.includes('modificată de alt utilizator')) {
          qc.invalidateQueries({ queryKey: appointmentKeys.detail(editData!.id) })
        }
      },
```

`AppointmentSchedulerDto` **nu** include `rowVersion`, deci drag & drop-ul din scheduler va trimite `rowVersion: null` → SP-ul sare verificarea. Acceptabil pentru mutarea prin DnD (acțiune vizuală, imediată); nu extinde DTO-ul scheduler-ului doar pentru asta.

### F15 — Accesibilitate scheduler

```tsx
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`${apt.patientName}, ${formatTimeShort(apt.startTime)}–${formatTimeShort(apt.endTime)}, ${apt.statusName}`}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEventClick(e as never, apt) }
                          }}
                          onFocus={e => handleEventMouseEnter(e as never, apt)}
                          onBlur={handleEventMouseLeave}
                          /* … restul props */
                        >
```

Tooltip-ul primește `role="tooltip"` și un `id` referit prin `aria-describedby`. Butoanele de navigare (`goPrev`/`goNext`) primesc `aria-label` („Ziua anterioară" / „Ziua următoare", în funcție de `viewMode`). Celulele din overview sunt `div` cu `onClick` → devin `<button type="button">`.

### F16 — Stări de încărcare

```tsx
  const { data: appointmentsResp, isError, isLoading, isFetching, error } = useAppointments({ /* … */ })
  // …
          loading={isLoading || isFetching}
```

Și mesajul de eroare devine informativ:

```tsx
  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">
          {error instanceof Error ? error.message : 'Nu s-au putut încărca datele.'}
        </div>
      </div>
    )
  }
```

### F17 — Helperi de dată centralizați

`startsWith(dateStr)` și `slice(0, 10)` pe string-uri ISO apar în `AppointmentsSchedulerPage.tsx` (de 3 ori) și în `AppointmentFormModal.tsx`. Mută în `client/src/utils/format.ts` (sau un `utils/datetime.ts` nou):

```ts
/** Minutele de la miezul nopții, în ora locală, pentru un ISO fără offset. */
export const minutesOfLocal = (iso: string): number => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** Compară pe zi calendaristică locală, fără presupuneri despre formatul string-ului. */
export const isSameLocalDay = (iso: string, date: Date): boolean => {
  const d = new Date(iso)
  return d.getFullYear() === date.getFullYear()
      && d.getMonth()    === date.getMonth()
      && d.getDate()     === date.getDate()
}
```

Și în `AppointmentFormModal`, derivă `date` din `Date`, nu din string:

```tsx
        date: toLocalDateISO(startDate),   // nu editData.startTime.slice(0, 10)
```

### F18 — Zod: completări

```ts
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:  z.string().min(1, 'Doctorul este obligatoriu'),
  date:      z.string().min(1, 'Data este obligatorie'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Oră invalidă'),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Oră invalidă'),
  statusId:  z.string().optional().or(z.literal('')),
  notes:     z.string().trim().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
})
  .refine(d => toMinutes(d.endTime) > toMinutes(d.startTime), {
    message: 'Ora de sfârșit trebuie să fie după ora de început',
    path: ['endTime'],
  })
  .refine(d => toMinutes(d.endTime) - toMinutes(d.startTime) >= 5, {
    message: 'Programarea trebuie să dureze cel puțin 5 minute',
    path: ['endTime'],
  })
```

`toMinutes` înlocuiește comparația lexicografică de string-uri — funcționează azi doar pentru că formatul e mereu zero-padded.

---

## 6. Teste

### T1 — Validatoare (nou)

`tests/ValyanClinic.Tests/Validators/AppointmentValidatorTests.cs` — pattern `TestValidate` (R7, named arguments):

```csharp
public sealed class CreateAppointmentCommandValidatorTests
{
    private readonly CreateAppointmentCommandValidator _validator = new();

    private static CreateAppointmentCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId:  Guid.NewGuid(),
        StartTime: DateTime.Now.AddDays(1).Date.AddHours(10),
        EndTime:   DateTime.Now.AddDays(1).Date.AddHours(10).AddMinutes(30),
        StatusId:  null,
        Notes:     null);

    [Fact]
    public void MinimalValid_ShouldPassValidation() =>
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { PatientId = Guid.Empty })
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");

    [Fact]
    public void EndTime_WhenBeforeStart_ShouldHaveError()
    {
        var cmd = MinimalValid();
        _validator.TestValidate(cmd with { EndTime = cmd.StartTime.AddMinutes(-5) })
                  .ShouldHaveValidationErrorFor(x => x.EndTime);
    }

    [Fact]
    public void Duration_WhenUnder5Minutes_ShouldHaveError()
    {
        var cmd = MinimalValid();
        _validator.TestValidate(cmd with { EndTime = cmd.StartTime.AddMinutes(3) })
                  .ShouldHaveValidationErrorFor(x => x);
    }

    [Fact]
    public void Notes_WhenTooLong_ShouldHaveError() =>
        _validator.TestValidate(MinimalValid() with { Notes = new string('x', 2001) })
                  .ShouldHaveValidationErrorFor(x => x.Notes)
                  .WithErrorMessage("Observațiile nu pot depăși 2000 de caractere.");
}
```

Plus `UpdateAppointmentCommandValidatorTests`, `UpdateAppointmentStatusCommandValidatorTests`, `GetAppointmentsQueryValidatorTests` (`pageSize = 0` / `201`, `sortBy = "DROP TABLE"`, `dateTo < dateFrom`), `GetAppointmentsForSchedulerQueryValidatorTests` (interval 94 de zile → eroare).

### T2 — Handlere lipsă

`UpdateAppointmentCommandHandlerTests`, `DeleteAppointmentCommandHandlerTests`, `GetAppointmentByIdQueryHandlerTests`, `GetAppointmentsQueryHandlerTests`, `GetAppointmentsForSchedulerQueryHandlerTests`, `GetAppointmentStatusesQueryHandlerTests`.

Pentru fiecare, minim 4 cazuri: happy path, `NotFound` (50011), `Conflict` (50010), eroare generică (50999 → 400). Pentru Update în plus: `Concurrency` (50019 → 409) și tenancy (50012/50013 → **404**, nu 403). Verifică explicit că `ClinicId` și `ActorId` vin din `ICurrentUser`, nu din comandă:

```csharp
    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).UpdateAsync(
            AppointmentId,
            Arg.Any<byte[]?>(),
            Arg.Is<AppointmentWriteData>(d => d.ClinicId == ClinicId && d.ActorId == UserId),
            Arg.Any<CancellationToken>());
    }
```

### T3 — Integration tests pe SP-uri (cele mai valoroase)

`tests/ValyanClinic.IntegrationTests/Appointments/AppointmentProceduresTests.cs`. Regulile din SP-uri nu sunt acoperite de niciun test astăzi, iar sunt exact cele care protejează datele:

| Test | Aserțiune |
|---|---|
| `Create_PatientFromAnotherClinic_Throws50012` | Izolare tenant (S1) |
| `Create_DoctorFromAnotherClinic_Throws50013` | Izolare tenant (S1) |
| `Create_OverlappingSameDoctor_Throws50010` | Conflict |
| `Create_OverlappingButCancelled_Succeeds` | `BlocksSlot = 0` eliberează slotul (S3) |
| `Create_ConcurrentSameSlot_OnlyOneSucceeds` | Două conexiuni în paralel; exact un 50010 (S2) |
| `Create_OutsideClinicSchedule_Throws50016` | Program clinică |
| `Create_OutsideDoctorSchedule_Throws50016` | Program doctor |
| `Create_WithEnforceScheduleFalse_Succeeds` | Suprascriere explicită |
| `UpdateStatus_FinalizatToProgramat_Throws50017` | Status terminal (S16) |
| `UpdateStatus_CancelledToScheduled_WhenSlotTaken_Throws50010` | Reactivare cu slot ocupat |
| `UpdateStatus_WritesAuditLog` | R3 (S4) |
| `Update_StaleRowVersion_Throws50019` | Concurență optimistă |
| `Delete_WithActiveConsultation_Throws50015` | Integritate (S5) |
| `GetPaged_StatsRespectDateAndDoctorFilters` | S6 |
| `GetPaged_SearchWithPercentLiteral_MatchesLiterally` | Escape LIKE (S8) |
| `GetPaged_TiedStartTimes_PagesWithoutDuplicates` | Paginare stabilă (S7) |
| `GetByDoctor_AppointmentSpanningRangeStart_IsIncluded` | S13 |

Testul de concurență e cel care justifică toată munca de la S2:

```csharp
    [Fact]
    public async Task Create_ConcurrentSameSlot_OnlyOneSucceeds()
    {
        var start = DateTime.Today.AddDays(1).AddHours(10);
        var end   = start.AddMinutes(30);

        var tasks = Enumerable.Range(0, 2)
            .Select(_ => Task.Run(async () =>
            {
                try   { await CreateAppointmentAsync(_doctorId, start, end); return (int?)null; }
                catch (SqlException ex) { return ex.Number; }
            }))
            .ToArray();

        var results = await Task.WhenAll(tasks);

        Assert.Single(results, r => r is null);                                  // exact o inserare
        Assert.Single(results, r => r == SqlErrorCodes.AppointmentConflict);     // exact un conflict
    }
```

### T4 — Frontend (Vitest)

Extinde cele 3 fișiere existente:
- `AppointmentsListPage.test.tsx`: fără drept de scriere → butonul „Programare nouă" absent; cu `hasFull` → butonul de ștergere prezent; la eroare 409 → mesajul serverului apare în modal (nu textul generic); acțiunile rapide de status apelează `PATCH`, nu `DELETE`.
- `appointment.schema.test.ts`: durata minimă, formatul orei, `notes` cu 2001 caractere.
- Test nou `AppointmentStatusActions.test.tsx`: se afișează doar tranzițiile din `allowedNextCodes`.

Mock-urile trebuie să întoarcă forma reală: `{ success: true, data: { pagedResult: {…}, stats: {…} } }` (interceptorul axios a despachetat deja un nivel).

### T5 — Playwright

DnD-ul din scheduler nu poate fi testat în `jsdom` (fără layout). Spec nou `client/e2e/appointments-scheduler.spec.ts`: mută o bară de eveniment cu `page.mouse.move/down/up` în pași incrementali (nu `dragTo`), apoi verifică ora nouă în tooltip și că un drop pe zona blocată nu produce nicio cerere `PUT`.

---

## 7. Decizii de confirmat înainte de implementare

| # | Decizie | Recomandare |
|---|---|---|
| **D1** | Statisticile respectă filtrele? | Da, toate filtrele **cu excepția statusului** — cardurile rămân navigabile și consecvente cu grid-ul (§3.7) |
| **D2** | `GetById` returnează și programările șterse? | Nu (status quo). Se scoate `IsDeleted` din `AppointmentDetailDto` — e mereu `false` și induce în eroare |
| **D3** | `#Base` în `GetPaged` sau `ROW_NUMBER()`? | `#Base` acum (cod simplu, statistici corecte). Migrează la `ROW_NUMBER()` peste ~50k programări/clinică |
| **D4** | Se pot crea programări în trecut? | Da, cu fereastră de o zi (recepția înregistrează retroactiv). Fără limită = date murdare |
| **D5** | Export Excel complet sau limitat? | Limitat la 200 rânduri, cu avertisment explicit. Export server-side dedicat doar dacă se cere |
| **D6** | `EnforceSchedule = 0` expus în UI? | Da, ca checkbox „Programare în afara programului" vizibil doar cu `hasFull` — urgențele există |
| **D7** | `FINALIZAT` e terminal? | Da în matricea propusă. Dacă recepția greșește, corecția se face prin `hasFull` + un `Appointment_ForceStatus` separat, auditat distinct |

---

## 8. Plan de execuție (PR-uri)

Fiecare PR trebuie să treacă `dotnet build`, `dotnet test`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run check:api`.

### PR 1 — Securitate și integritate SQL 🔴

1. `0057_AppointmentsHardening.sql` (§3.1)
2. `SqlErrorCodes.cs` + `ErrorMessages.cs` (§3.2)
3. `Appointment_Create.sql`, `Appointment_Update.sql`, `Appointment_UpdateStatus.sql`, `Appointment_Delete.sql` (§3.3–3.6)
4. `IAppointmentRepository` + `AppointmentRepository`: `AppointmentWriteData`, `rowVersion`, `EnforceSchedule` (§B7)
5. Handlere: clauzele `catch` noi (§B8)
6. `GlobalExceptionHandlerMiddleware`: 547/2601/2627 → 400 (§B1)
7. **Actualizează `CreateAppointmentCommandHandlerTests` și `UpdateAppointmentStatusCommandHandlerTests`** (R8)
8. `.\migrate.ps1` local, apoi `.\generate-openapi.ps1` + `npm run gen:api`

**Verificare manuală obligatorie**: `POST /api/v1/Appointments` cu un `patientId` din altă clinică → 404, nu 201.

### PR 2 — Nomenclator statusuri + dehardcodare FE 🟠

1. `Appointment_GetStatuses.sql` (§3.10) + `AppointmentProcedures.GetStatuses`
2. Slice `GetAppointmentStatuses` + endpoint (§B5)
3. `npm run gen:api`
4. `useAppointmentStatuses` + `appointmentsApi.getStatuses` (§F3b)
5. Elimină `APPOINTMENT_STATUS_IDS` și `APPOINTMENT_STATUS_OPTIONS`; `statusFilter` devine GUID
6. Rescrie `appointment.types.ts` din `schema.d.ts` (§F9)

### PR 3 — Fluxul de status + feedback de eroare 🟠

1. `AppointmentStatusActions` (§F3)
2. „Anulează" → `PATCH status`; „Șterge definitiv" → `DELETE`, gated pe `hasFull` (§F4/F5)
3. `useHasAccess` în ambele pagini (§F2)
4. `err.message` în toate `onError` (§F1) + `showError` în `useFeedback`
5. `invalidateAppointments` unificat (§F6)
6. Bandă de eroare pentru DnD + pre-verificare locală de conflict (§F7)

### PR 4 — Performanță, paginare, statistici 🟡

1. `Appointment_GetPaged.sql` rescris (§3.7)
2. `Appointment_GetByDoctor.sql` — suprapunere + `BlocksSlot` (§3.8)
3. `AppointmentStatsDto.NoShowCount` + cardul din UI (§B3)
4. `GetAppointmentsQueryValidator` + completări Create/Update (§B2)
5. `computeFreeSlots` corect (§F12); export Excel pe set filtrat (§F11)
6. Grid: scoate `showFilterRow`/`showGroupPanel` (§F10)

### PR 5 — Conflict API, program de lucru în formular, polish 🔵

1. `Appointment_CheckConflict.sql` + endpoint `GET /conflicts` (§3.9, §B6)
2. `TimeSelect` bazat pe `ClinicSchedule` ∩ `DoctorSchedule`, robust la valori în afara ferestrei (§F8)
3. Avertisment live de conflict/program în formular
4. `Appointment_GetByPatient` expus în fișa pacientului sau șters (§3.12)
5. Indicator „acum" viu (§F13); accesibilitate scheduler (§F15); `isFetching` (§F16); helperi de dată (§F17); Zod (§F18)
6. Concurență optimistă în UI (§F14)

### PR 6 — Teste

1. T1 validatoare, T2 handlere (§6)
2. T3 integration tests pe SP-uri — **inclusiv testul de concurență**
3. T4 Vitest, T5 Playwright

---

## 9. Checklist de verificare finală

```
[ ] POST cu patientId din altă clinică → 404 (nu 201, nu 500)
[ ] POST cu statusId inexistent → 400 cu mesaj util (nu 500)
[ ] Două POST-uri concurente pe același slot → exact un 201 și un 409
[ ] Anularea unei programări (status ANULAT) eliberează slotul pentru o programare nouă
[ ] Cardul „Anulate" crește când se anulează o programare (nu rămâne 0)
[ ] Cardul „Neprezentare" există și se populează
[ ] Statisticile se schimbă când aplici filtrul de doctor/dată, dar NU când schimbi filtrul de status
[ ] Căutarea cu „100%" nu întoarce toate rândurile
[ ] pageSize=1000000 → 400
[ ] Paginare cu 30 de programări la exact aceeași oră → nicio duplicare între pagini
[ ] Programare 09:00–11:00 pe 27; scheduler pentru 27 → apare (nu doar în ziua de start)
[ ] UpdateStatus scrie un rând în AuditLogs
[ ] Tranziția FINALIZAT → PROGRAMAT e respinsă cu mesaj clar
[ ] Ștergerea unei programări cu consultație activă e respinsă cu mesaj clar
[ ] 409 la creare afișează „Există deja o programare în acest interval orar." în modal
[ ] Drag & drop eșuat afișează mesajul serverului, nu doar console.error
[ ] Utilizator cu doar Read: fără „Programare nouă", fără Editează, fără Șterge
[ ] Utilizator cu Write dar fără Full: are Anulează, nu are Șterge definitiv
[ ] Editarea unei programări la 06:30 afișează corect ora în TimeSelect
[ ] Editare simultană din două taburi → al doilea primește „modificată de alt utilizator"
[ ] Linia „acum" din scheduler se mișcă (verifică după 1 minut)
[ ] Tab + Enter pe o bară de eveniment deschide formularul de editare
[ ] npm run check:api trece (schema regenerată)
[ ] grep -rn "a1000000-0000" client/src → zero rezultate
```

---

## 10. Backlog (în afara acestui document)

| Temă | Notă |
|---|---|
| Notificări pacient (SMS/email confirmare + reminder 24h) | Necesită provider + tabel `AppointmentNotifications` + job. Fluxul de status din PR 3 este precondiția |
| Marcare automată `NEPREZENTARE` | Job zilnic pentru programările `PROGRAMAT`/`CONFIRMAT` cu `EndTime < acum - 2h` |
| Programări recurente (serii) | `RecurrenceRuleId` + `SeriesId`; decizie separată de model |
| Liste de așteptare pentru sloturi eliberate | Depinde de notificări |
| Pauze multiple în programul doctorului | `UQ_DoctorSchedule_Day (DoctorId, DayOfWeek)` permite un singur interval/zi — modificarea afectează și modulul Clinică |
| Suprarezervare controlată (overbooking) per doctor | Ar necesita un prag configurabil în locul verificării binare de conflict |
