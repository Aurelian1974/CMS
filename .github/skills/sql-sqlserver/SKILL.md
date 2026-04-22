---
name: sql-sqlserver
description: >
  USE WHEN: creating or modifying SQL Server objects — stored procedures, migration scripts,
  schema changes, table definitions, indexes, or seed data. Covers: DbUp migration naming
  (0001_Name.sql), SP naming convention ([Entity]_[Action]), mandatory @ClinicId on all SPs,
  TRY-CATCH + explicit transaction on DML, CREATE OR ALTER for SPs, NEWSEQUENTIALID() for PKs
  (never INT IDENTITY), soft delete with IsDeleted on every joined table, OFFSET-FETCH paging,
  GETDATE() (never GETUTCDATE()), no diacritics in identifiers, valid hex GUIDs only,
  no-hardcode rule (nomenclature tables for all lookup values), and THROW 50000-59999 for
  business errors. Also covers the full DB schema reference for ValyanClinic.
  AVOID this skill for C# or TypeScript code.
---

# SQL Server Skill — ValyanClinic

## Step 1 — Stored Procedure Naming Convention

Pattern: `dbo.[Entity]_[Action]`

| Pattern | Example |
|---------|---------|
| `[Entity]_GetById` | `dbo.Patient_GetById` |
| `[Entity]_GetPaged` | `dbo.Patient_GetPaged` |
| `[Entity]_GetBy*` | `dbo.Appointment_GetByDoctor` |
| `[Entity]_Create` | `dbo.Patient_Create` — returns new Id |
| `[Entity]_Update` | `dbo.Patient_Update` |
| `[Entity]_Delete` | `dbo.Patient_Delete` — soft delete |
| `[Entity]_ExistsBy*` | `dbo.Patient_ExistsByCnp` |

**No diacritics** in SP names, table names, column names, parameter names — English only. Diacritics allowed only in string values (messages, seed data).

---

## Step 2 — Mandatory SP Header

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER        -- MANDATORY on EVERY SP
AS
BEGIN
    SET NOCOUNT ON;      -- Always
    SET XACT_ABORT ON;   -- Always
    ...
END;
GO
```

**Rules:**
- `CREATE OR ALTER PROCEDURE` — enables re-deploy without DROP
- `SET NOCOUNT ON` + `SET XACT_ABORT ON` — on every SP, no exceptions
- `@ClinicId UNIQUEIDENTIFIER` — mandatory parameter on every SP (multi-tenancy)
- One file per SP: `Scripts/StoredProcedures/[Entity]_[Action].sql`

---

## Step 3 — Read-Only SP (SELECT)

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT p.Id, p.FirstName, p.LastName, p.Cnp, p.BirthDate,
           p.GenderId, p.PhoneNumber, p.Email, p.CreatedAt
    FROM Patients p
    WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;
END;
GO
```

---

## Step 4 — DML SP (INSERT/UPDATE/DELETE) — TRY-CATCH + Transaction MANDATORY

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @FirstName   NVARCHAR(100),
    @LastName    NVARCHAR(100),
    @Cnp         NCHAR(13),
    @PhoneNumber NVARCHAR(20)  = NULL,
    @Email       NVARCHAR(200) = NULL,
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Business rule check before insert
        IF EXISTS (SELECT 1 FROM Patients WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50001, 'Un pacient cu acest CNP există deja.', 1;
        END;

        -- OUTPUT clause to get generated GUID back to C#
        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Patients (ClinicId, FirstName, LastName, Cnp, PhoneNumber, Email,
                              CreatedBy, CreatedAt, IsDeleted)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @FirstName, @LastName, @Cnp, @PhoneNumber, @Email,
                @CreatedBy, GETDATE(), 0);          -- GETDATE() not GETUTCDATE()

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;    -- Return new ID to C#
        -- ALTERNATIVE (simpler, used in most SPs): skip OUTPUT table, use local variable
        -- DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
        -- INSERT INTO ... VALUES (@NewId, ...);
        -- SELECT @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;    -- Re-throw without parameters
    END CATCH;
END;
GO
```

---

## Step 5 — Paged SELECT SP

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_GetPaged
    @ClinicId  UNIQUEIDENTIFIER,
    @Search    NVARCHAR(100) = NULL,
    @Page      INT           = 1,
    @PageSize  INT           = 10,
    @SortBy    NVARCHAR(50)  = 'LastName',
    @SortDir   NVARCHAR(4)   = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Result set 1: data rows
    SELECT p.Id, p.FirstName, p.LastName, p.Cnp, p.PhoneNumber, p.Email, p.CreatedAt
    FROM Patients p
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND (@Search IS NULL OR p.LastName LIKE '%' + @Search + '%'
                           OR p.FirstName LIKE '%' + @Search + '%'
                           OR p.Cnp LIKE '%' + @Search + '%')
    ORDER BY
        CASE WHEN @SortBy = 'LastName'  AND @SortDir = 'ASC'  THEN p.LastName  END ASC,
        CASE WHEN @SortBy = 'LastName'  AND @SortDir = 'DESC' THEN p.LastName  END DESC,
        CASE WHEN @SortBy = 'CreatedAt' AND @SortDir = 'ASC'  THEN p.CreatedAt END ASC,
        CASE WHEN @SortBy = 'CreatedAt' AND @SortDir = 'DESC' THEN p.CreatedAt END DESC,
        p.LastName ASC    -- tie-breaker
    OFFSET (@Page - 1) * @PageSize ROWS    -- OFFSET-FETCH, never TOP or ROW_NUMBER
    FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count (for pagination)
    SELECT COUNT(*)
    FROM Patients p
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND (@Search IS NULL OR p.LastName LIKE '%' + @Search + '%'
                           OR p.FirstName LIKE '%' + @Search + '%'
                           OR p.Cnp LIKE '%' + @Search + '%');
END;
GO
```

---

## Step 6 — Business Error Codes (THROW range 50000–59999)

```sql
-- Error ranges by domain:
-- 50000-50099: Patients
-- 50100-50199: Doctors / Users
-- 50200-50299: Appointments
-- 50300-50399: Invoices / Payments
-- 50400-50499: Prescriptions / Consultations

-- Syntax: ;THROW errorNumber, 'message', 1;
;THROW 50001, 'Un pacient cu acest CNP există deja.', 1;
;THROW 50010, 'Medicul are deja o programare în intervalul selectat.', 1;
;THROW 50020, 'Factura a fost deja achitată.', 1;
```

C# catches these in SqlException (ex.Number) and maps to `Result.Conflict/Failure`.

---

## Step 7 — IsDeleted Soft Delete — CORRECT Pattern

**Filter `IsDeleted = 0` on EVERY table in a JOIN — not only the main table.**

```sql
-- WRONG: IsDeleted only on main table
SELECT p.Id, a.StartTime
FROM Patients p
INNER JOIN Appointments a ON a.PatientId = p.Id
WHERE p.IsDeleted = 0

-- CORRECT: IsDeleted on every joined table
SELECT p.Id, a.StartTime
FROM Patients p
INNER JOIN Appointments a ON a.PatientId = p.Id AND a.IsDeleted = 0
WHERE p.IsDeleted = 0
```

**Soft delete SP:**
```sql
CREATE OR ALTER PROCEDURE dbo.Patient_Delete
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE Patients
        SET IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @@ROWCOUNT = 0
        BEGIN
            ;THROW 50003, 'Pacientul nu a fost găsit sau a fost deja șters.', 1;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
```

---

## Step 8 — Primary Keys: NEWSEQUENTIALID() Always

```sql
-- WRONG
Id INT IDENTITY(1,1) PRIMARY KEY

-- CORRECT
Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY
```

**Why NEWSEQUENTIALID() over NEWID():**
- `NEWID()` generates random GUIDs → massive clustered index fragmentation
- `NEWSEQUENTIALID()` generates sequential GUIDs → behaves like IDENTITY, no fragmentation
- Restriction: `NEWSEQUENTIALID()` works only as DEFAULT constraint on a column, not in T-SQL ad-hoc

**Valid GUID hex characters:** `0-9`, `A-F` only. Letters like `G`, `H`, `S` are NOT hex and cause `Conversion failed`.

```sql
-- WRONG — 'S' is not valid hex
'S0000001-0000-0000-0000-000000000001'

-- CORRECT — use A-F for prefix
'A0000001-0000-0000-0000-000000000001'
'B1000000-0000-0000-0000-000000000001'
```

---

## Step 9 — Table Structure Template

```sql
CREATE TABLE Patients (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    ClinicId    UNIQUEIDENTIFIER NOT NULL,              -- Multi-tenancy FK
    FirstName   NVARCHAR(100)    NOT NULL,
    LastName    NVARCHAR(100)    NOT NULL,
    Cnp         NCHAR(13)        NOT NULL,
    BirthDate   DATE             NULL,
    GenderId    UNIQUEIDENTIFIER NULL,
    PhoneNumber NVARCHAR(20)     NULL,
    Email       NVARCHAR(200)    NULL,
    IsDeleted   BIT              NOT NULL DEFAULT 0,    -- Soft delete
    RowVersion  ROWVERSION       NOT NULL,              -- Concurrency control
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),  -- GETDATE() not GETUTCDATE()
    CreatedBy   UNIQUEIDENTIFIER NOT NULL,
    UpdatedAt   DATETIME2        NULL,
    UpdatedBy   UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Patients_Clinics  FOREIGN KEY (ClinicId) REFERENCES Clinics(Id),
    CONSTRAINT UQ_Patients_Cnp_Clinic UNIQUE (Cnp, ClinicId)
);
GO
```

---

## Step 10 — DbUp Migration Scripts

**Location:** `Infrastructure/Data/Scripts/Migrations/`

**Naming:** `NNNN_DescriptiveName.sql` — four-digit sequential prefix, never changed after deployment.

```
Migrations/
├── 0001_InitialSchema.sql          # CREATE TABLE for all tables
├── 0002_SeedNomenclature.sql       # Seed data: roles, statuses, genders, blood types
├── 0003_AddAuditColumns.sql        # ALTER TABLE ADD COLUMN
└── 0004_Indexes.sql                # CREATE INDEX on frequently filtered columns
```

**Rules:**
- Script files are **never modified** after running in production — add a new numbered script
- Use `IF NOT EXISTS` / `IF COL_LENGTH` for idempotency where possible
- `CREATE OR ALTER PROCEDURE` for SPs (they're re-ran every deploy, not tracked as migrations)
- UTF-8 encoding for `.sql` files; use `sqlcmd -f 65001` to preserve Romanian diacritics in seed data

```sql
-- 0001_InitialSchema.sql — idempotent pattern
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Clinics')
BEGIN
    CREATE TABLE Clinics (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name        NVARCHAR(200)    NOT NULL,
        Code        NVARCHAR(20)     NOT NULL,
        IsActive    BIT              NOT NULL DEFAULT 1,
        CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt   DATETIME2        NULL
    );
END;
GO
```

---

## Step 11 — Nomenclature Tables (No-Hardcode Rule)

**Never hardcode lookup values in application code or SQL.** All configurable lists live in nomenclature tables.

| ❌ Hardcoded — wrong | ✅ Nomenclature table — correct |
|---------------------|--------------------------------|
| `Gender TINYINT` (1/2 in code) | `Genders (Id, Name, Code)` |
| `Status TINYINT` (1=Draft etc.) | `AppointmentStatuses (Id, Name, Code)` |
| `PaymentMethod TINYINT` | `PaymentMethods (Id, Name, Code)` |

**Standard nomenclature table structure:**
```sql
CREATE TABLE AppointmentStatuses (
    Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    Name     NVARCHAR(50)     NOT NULL,   -- 'Programat', 'Confirmat', 'Finalizat'
    Code     NVARCHAR(20)     NOT NULL,   -- 'scheduled', 'confirmed', 'completed'
    IsActive BIT              NOT NULL DEFAULT 1
);
```

**In C# — constants for IDs, never inline `Guid.Parse()`:**
```csharp
// Application/Common/Constants/AppointmentStatusIds.cs
public static class AppointmentStatusIds
{
    public static readonly Guid Scheduled = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid Confirmed = Guid.Parse("a1000000-0000-0000-0000-000000000002");
}
```

---

## Step 12 — SQL Rules Reference

| Rule | Detail |
|------|--------|
| `SET NOCOUNT ON` + `SET XACT_ABORT ON` | Every SP — no exceptions |
| TRY-CATCH + transaction | Every SP with INSERT/UPDATE/DELETE |
| `;THROW` | Business errors (50000–59999); `;THROW;` (no args) in CATCH for re-throw |
| `CREATE OR ALTER PROCEDURE` | Allows re-deploy without DROP |
| Typed parameters | `NVARCHAR(200)` not `NVARCHAR(MAX)` |
| `EXPLICIT JOIN` | `INNER JOIN`, `LEFT JOIN` — never implicit comma-joins |
| `UPPERCASE` keywords | `SELECT`, `FROM`, `WHERE`, `ORDER BY` |
| Paging | `OFFSET-FETCH` — never `TOP` or `ROW_NUMBER()` |
| `WHERE IsDeleted = 0` | Every table in the query — including each JOIN |
| `GUID PKs` | `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` — never `INT IDENTITY` |
| `GETDATE()` | Not `GETUTCDATE()` — timestamps stored as local clinic time |
| No diacritics in identifiers | Identifiers in English; diacritics only in string values |
| Valid hex GUIDs | `0-9`, `A-F` only — `G`, `H`, `S` etc. cause `Conversion failed` |
| One SP per file | `Scripts/StoredProcedures/[Entity]_[Action].sql` |
| sqlcmd encoding | `sqlcmd -f 65001` for UTF-8 when running scripts with Romanian characters |

---

## Step 13 — Database Schema Reference

Key tables with their column types (all IDs are `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`):

**Clinics** — multi-tenancy root
`Id, Name(200), Code(20), Address(500), PhoneNumber(20), Email(200), CUI(20), CaenCode(10), ContractCNAS(50), IsActive, CreatedAt, UpdatedAt`

**Users**
`Id, ClinicId(FK→Clinics), Email(200 unique), PasswordHash(500), FirstName(100), LastName(100), RoleId(FK→Roles), IsActive, IsDeleted, LastLoginAt, FailedLoginAttempts, LockoutEnd, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**Patients**
`Id, ClinicId(FK→Clinics), FirstName(100), LastName(100), Cnp(NCHAR 13 unique per clinic), BirthDate(DATE), GenderId(FK→Genders), BloodTypeId(FK→BloodTypes), PhoneNumber(20), Email(200), Address(500), IsDeleted, RowVersion, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**Doctors**
`Id, ClinicId(FK→Clinics), FirstName(100), LastName(100), Email, PhoneNumber, MedicalCode(20 — parafa), SpecialtyId(FK→Specialties), UserId(FK→Users), IsDeleted, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**DoctorSchedules** — weekly schedule
`Id, ClinicId, DoctorId, DayOfWeek(TINYINT 0=Mon..6=Sun), StartTime(TIME), EndTime(TIME), SlotDurationMinutes(INT DEFAULT 30), IsActive`

**Appointments**
`Id, ClinicId, PatientId, DoctorId, StartTime(DATETIME2), EndTime(DATETIME2), StatusId(FK→AppointmentStatuses), Notes(MAX), IsDeleted, RowVersion, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**Consultations**
`Id, ClinicId, AppointmentId(NULL=walk-in), PatientId, DoctorId, ConsultationDate(DATETIME2), ChiefComplaint(500), ClinicalExam(MAX), Diagnosis(500), ICD10Code(10), Treatment(MAX), Recommendations(MAX), IsDeleted, RowVersion, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**Invoices**
`Id, ClinicId, PatientId, ConsultationId, InvoiceNumber(20 unique per clinic), InvoiceDate(DATE), DueDate(DATE), TotalAmount(DECIMAL 10,2), StatusId(FK→InvoiceStatuses), PaymentTypeId(FK→PaymentMethods), IsDeleted, RowVersion, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`

**InvoiceItems**
`Id, InvoiceId, ServiceId(FK→MedicalServices), Description(200), Quantity(INT), UnitPrice(DECIMAL 10,2), TotalPrice(DECIMAL 10,2)`

**RefreshTokens**
`Id, UserId(FK→Users), Token(500), ExpiresAt, CreatedAt, RevokedAt, ReplacedByToken(500), CreatedByIp(50)`

**AuditLog**
`Id, ClinicId, EntityName(100), EntityId(50), Action(10 INSERT/UPDATE/DELETE), OldValues(MAX JSON), NewValues(MAX JSON), UserId, UserEmail(200), CreatedAt, CorrelationId(50)`

**Nomenclature tables** (all: `Id, Name, Code, IsActive`):
`Roles, Genders, BloodTypes, AppointmentStatuses, InvoiceStatuses, PaymentMethods, DocumentTypes, Specialties, ServiceCategories, CnasReportStatuses`

**Medications** — `Id, Name(200), ActiveSubstance(200), Form(50), Concentration(50), IsCnasDeductible, IsActive`

**ICD10Codes** — `Id, Code(10), Name(500), Category(200), IsActive`

**MedicalServices** — `Id, ClinicId, Name(200), Code(20), Price(DECIMAL 10,2), SpecialtyId, IsCnasDeductible, IsActive, CreatedAt`

---

## Checklist Before Completing

- [ ] SP named `dbo.[Entity]_[Action]` in English without diacritics
- [ ] `CREATE OR ALTER PROCEDURE` (not CREATE)
- [ ] `SET NOCOUNT ON` + `SET XACT_ABORT ON` at top
- [ ] `@ClinicId UNIQUEIDENTIFIER` parameter present
- [ ] DML SP has `BEGIN TRY / BEGIN TRANSACTION ... COMMIT / END TRY BEGIN CATCH ROLLBACK THROW END CATCH`
- [ ] Business errors use `;THROW 5XXXX, 'message', 1;` (range 50000–59999)
- [ ] `WHERE IsDeleted = 0` on every table in JOINs
- [ ] All new tables use `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` for PK
- [ ] `GETDATE()` used (not `GETUTCDATE()`)
- [ ] `OFFSET-FETCH` for paging (not TOP/ROW_NUMBER)
- [ ] CREATE SP uses `OUTPUT INSERTED.Id INTO @OutputIds` to return new GUID
- [ ] Migration file named `NNNN_DescriptiveName.sql`, idempotent with `IF NOT EXISTS`
- [ ] No hardcoded enum values — nomenclature tables for all lookups
- [ ] All seed GUIDs use only hex characters (0-9, A-F)
