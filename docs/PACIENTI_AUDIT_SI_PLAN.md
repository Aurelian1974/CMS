# Pacienți — audit tehnic și plan de remediere

> **Destinatar:** agent de implementare (VS Code) pe repo `Aurelian1974/CMS`.
> **Scop:** livrabil auto-conținut. Fiecare secțiune are *simptom → cauză → fix concret → criteriu de acceptanță*.
> **Data auditului:** 2026-09-28 · **Branch de lucru:** `claude/fervent-albattani-chg580`
> **Număr de migrare alocat:** `0060_PatientsHardening.sql`.
> `0059` este rezervat de `docs/CONSULTATII_AUDIT_SI_PLAN.md`. Înainte de a crea fișierul,
> verifică: `ls src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/ | sort | tail -1`
> și folosește primul număr liber ≥ 0060.
> **Coduri SQL alocate acestui plan:** `50003`–`50007` (verificat: nefolosite azi).

---

## 0. Rezumat executiv

Modulul Pacienți este cel mai vechi din aplicație (migrări `0014`–`0016`) și **nu a fost
trecut prin hardening-ul aplicat ulterior la Programări** (`0057_AppointmentsHardening.sql`).
Consecința: un endpoint mort în producție, o breșă de multi-tenancy pe scriere, două
defecte de integritate în schemă și validare asimetrică între creare și editare.

| # | Titlu | Severitate | Zonă | Efort |
|---|---|---|---|---|
| P0-1 | `GET /api/v1/Patients/lookup` → **HTTP 500**: `dbo.Patient_GetLookup` nu există în repo | **Critic** | SQL | S |
| P0-2 | Cele 3 SP-uri `*_Sync` nu primesc `@ClinicId` → **scriere cross-tenant** pe pacientul altei clinici | **Critic** | SP + C# | M |
| P0-3 | `UQ_Patients_Cnp_Clinic` respinge **al doilea pacient fără CNP** și blochează reînregistrarea CNP-ului unui pacient șters | **Critic** | SQL | M |
| P0-4 | Validare CNP asimetrică: `Create` verifică cifra de control, `Update` doar regexul → CNP invalid intră prin editare | **Major** | BE | S |
| P1-1 | `RowVersion` există pe `Patients` dar nu e folosit → **lost update** silențios la editare concurentă | Major | SP + C# | M |
| P1-2 | `Create`/`Update` + cele 3 sync-uri = 4 tranzacții separate → pacient salvat cu alergii pierdute | Major | SP + C# | M |
| P1-3 | `Patient_GetPaged`: `FullName` afișat ≠ `FullName` sortat, `LIKE` fără escape, filtre duplicate, stats recalculate la fiecare pagină | Major | SP | M |
| P1-4 | `Patient_Delete` fără reguli de business și fără dezactivarea colecțiilor copil | Major | SP | S |
| P1-5 | `PatientDoctor_Sync`: `MERGE` fără `HOLDLOCK`/dedup, doctori din altă clinică, `IsPrimary` multiplu | Major | SP + SQL | M |
| P1-6 | `PatientAllergy_Sync`: dezactivare + reinserare la fiecare salvare → creștere nelimitată a tabelului | Mediu | SP | S |
| P1-7 | `@PageSize` nelimitat (API acceptă `pageSize=1000000`); export FE cere 5000 de rânduri | Mediu | BE + SP | S |
| P1-8 | `IPatientRepository.CreateAsync`/`UpdateAsync` = 22 parametri pozițional — anti-pattern explicit în `CLAUDE.md` §8 | Mediu | C# | M |
| P2-1 | Indecși: lipsă index acoperitor pentru sortarea implicită; 3 indecși redundanți | Mediu | SQL | S |
| P2-2 | `TotalVisits` hardcodat `0` în `Patient_GetById`, deși modulul Consultații există din `0031` | Mediu | SP | S |
| P2-3 | `GETDATE()` în loc de `SYSDATETIME()` în toate SP-urile de pacient (`CLAUDE.md` R3) | Mic | SP | S |
| P2-4 | Tipurile FE sunt scrise de mână, nu derivate din `schema.d.ts` → `npm run check:api` nu protejează modulul | Mediu | FE | M |
| P2-5 | CNP obligatoriu pe FE, opțional pe BE/DB → pacient străin / nou-născut nu poate fi înregistrat | Mediu | FE | S |
| P2-6 | `insuranceNumber` max 20 (FE) vs 50 (BE/DB); `relationship`/`phoneNumber` opționale pe FE, obligatorii pe BE → 400 inexplicabil | Mediu | FE | S |
| P2-7 | CNP complet afișat în grid și în exportul Excel — minimizare GDPR | Mediu | FE | M |
| P2-8 | `isPrimary` (medici) și `isDefault` (contacte) pot fi bifate de mai multe ori — nimic nu impune exclusivitatea | Mediu | FE + SQL | S |
| P2-9 | `Patient_ExistsByCnp` este SP orfan (niciun apel) — verificarea de unicitate live lipsește din formular | Mic | BE + FE | S |
| P2-10 | `PatientRepository.GetStatsAsync` nu e pe interfață și reapelează SP-ul greu de listare | Mic | C# | S |
| P2-11 | Zero teste de handler pentru Pacienți (există doar `CreatePatientCommandValidatorTests`) | Mediu | Teste | M |

**Ordine de execuție recomandată:**
P0-1 → P0-3 → P0-2 → P0-4 → P1-* (o singură migrare `0060` + rescrierea SP-urilor) → P1-8 → P2-*.

---

## 1. P0-1 — `/lookup` returnează 500

### Simptom
Orice ecran care populează un dropdown de pacienți (programări, facturi, rețete) primește
`500 — A apărut o eroare internă. Contactați administratorul.` Pe FE, `usePatientLookup`
are `staleTime: Infinity`, deci eroarea rămâne blocată în cache până la refresh complet.

### Cauză
`src/ValyanClinic.Infrastructure/Data/StoredProcedures/PatientProcedures.cs:12` declară:

```csharp
public const string GetLookup = "dbo.Patient_GetLookup";
```

dar **nu există niciun fișier** care să creeze acest SP:

```bash
$ grep -rn "Patient_GetLookup" --include=*.sql src/
# (niciun rezultat)
```

DbUp rulează `Scripts/StoredProcedures/` la fiecare pornire, deci SP-ul lipsește din orice bază.
SQL Server aruncă eroarea **2812** („Could not find stored procedure”), care **nu** e prinsă de
`GlobalExceptionHandlerMiddleware` (filtrul acoperă doar `547 or 2601 or 2627`) → catch-all → 500.

### Fix
Creează `src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/Patient_GetLookup.sql`.
Decizie: lookup-ul **nu** returnează toată baza (10.000+ pacienți într-un dropdown) — primește
un termen de căutare opțional și un plafon.

```sql
-- ============================================================
-- Patient_GetLookup — listare simplificată pentru dropdown-uri
-- Returnează maximum @Top rânduri; căutarea e obligatorie peste @Top pacienți.
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_GetLookup
    @ClinicId UNIQUEIDENTIFIER,
    @Search   NVARCHAR(200) = NULL,
    @Top      INT           = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Top IS NULL OR @Top < 1   SET @Top = 50;
    IF @Top > 500                 SET @Top = 500;

    DECLARE @Term NVARCHAR(210) =
        CASE WHEN NULLIF(LTRIM(RTRIM(@Search)), '') IS NULL
             THEN NULL
             ELSE '%' + dbo.fn_EscapeLike(LTRIM(RTRIM(@Search))) + '%' END;

    SELECT TOP (@Top)
        p.Id,
        p.LastName + ' ' + p.FirstName AS FullName,
        p.Cnp,
        p.PhoneNumber
    FROM dbo.Patients p
    WHERE p.ClinicId  = @ClinicId
      AND p.IsDeleted = 0
      AND p.IsActive  = 1
      AND (@Term IS NULL
           OR p.LastName    LIKE @Term ESCAPE '\'
           OR p.FirstName   LIKE @Term ESCAPE '\'
           OR p.Cnp         LIKE @Term ESCAPE '\'
           OR p.PatientCode LIKE @Term ESCAPE '\'
           OR p.PhoneNumber LIKE @Term ESCAPE '\')
    ORDER BY p.LastName, p.FirstName, p.Id;
END;
GO
```

`dbo.fn_EscapeLike` este creată în migrarea `0060` (§5.3). Propagă parametrii noi:

```csharp
// IPatientRepository.cs
Task<IEnumerable<PatientLookupDto>> GetLookupAsync(
    Guid clinicId, string? search, int top, CancellationToken ct);
```

```csharp
// PatientsController.cs
[HttpGet("lookup")]
[HasAccess(ModuleCodes.Patients, AccessLevel.Read)]
public async Task<IActionResult> GetLookup(
    [FromQuery] string? search, [FromQuery] int top = 50, CancellationToken ct = default)
    => HandleResult(await Mediator.Send(new GetPatientsLookupQuery(search, top), ct));
```

Pe FE, `usePatientLookup` devine parametrizat și pierde `staleTime: Infinity`
(un pacient nou trebuie să apară în dropdown fără refresh):

```ts
export const usePatientLookup = (search?: string) =>
  useQuery({
    queryKey: [...patientKeys.lookup(), search ?? ''],
    queryFn: () => patientsApi.getLookup(search),
    staleTime: 60_000,
  })
```

și `useCreatePatient.onSuccess` invalidează `patientKeys.all`, nu doar `lists()`.

### Acceptanță
- `GET /api/v1/Patients/lookup` → `200` cu maximum 50 de rânduri.
- `GET /api/v1/Patients/lookup?search=pop&top=10` → maximum 10 rânduri, toate conținând „pop”.
- `GET /api/v1/Patients/lookup?search=%25` (procent URL-encoded) → 0 sau puține rânduri, **nu** toată baza.
- Un pacient creat apare în dropdown fără reload de pagină.

---

## 2. P0-2 — Scriere cross-tenant prin SP-urile de sincronizare

### Simptom
Un utilizator autentificat în clinica A poate scrie alergii, medici și contacte de urgență
pe fișa unui pacient din clinica B, dacă îi cunoaște `Id`-ul (GUID). Datele apar în fișa
pacientului clinicii B fără urmă în `AuditLogs`.

### Cauză
Toate cele trei SP-uri filtrează **exclusiv** după `@PatientId`, fără `@ClinicId`:

```sql
-- PatientAllergy_Sync.sql (identic în PatientDoctor_Sync și PatientEmergencyContact_Sync)
CREATE OR ALTER PROCEDURE dbo.PatientAllergy_Sync
    @PatientId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Allergies dbo.PatientAllergyTableType READONLY
AS
BEGIN
    UPDATE PatientAllergies SET IsActive = 0 WHERE PatientId = @PatientId AND IsActive = 1;
    INSERT INTO PatientAllergies (...) SELECT @PatientId, ... FROM @Allergies;
END;
```

`UpdatePatientCommandHandler` apelează `repository.SyncAllergiesAsync(request.Id, currentUser.Id, ...)`
— `currentUser.ClinicId` **nu este transmis nicăieri**. `Patient_Update` verifică tenancy-ul, dar
handler-ul continuă cu sync-urile chiar dacă update-ul a eșuat? Nu — `THROW`-ul îl oprește.
**Însă** ruta de creare (`CreatePatientCommandHandler`) și orice viitor endpoint parțial rămân
expuse, iar contractul SP-ului nu oferă nicio garanție. Aceasta încalcă direct `CLAUDE.md` R1:
*„ORICE query pe date ale clinicii trece ClinicId din ICurrentUser”*.

### Fix
`@ClinicId` devine **parametru obligatoriu**, iar SP-ul validează apartenența înainte de orice scriere.
Cod nou `50005 = PatientNotInClinic`.

```sql
CREATE OR ALTER PROCEDURE dbo.PatientAllergy_Sync
    @PatientId UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Allergies dbo.PatientAllergyTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                   WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50005, N'Pacientul nu aparține clinicii curente.', 1;
    END;
    -- ... restul, vezi §5.6 pentru varianta MERGE
END;
```

Identic în `PatientDoctor_Sync` și `PatientEmergencyContact_Sync`.

Semnăturile C#:

```csharp
Task SyncAllergiesAsync(Guid patientId, Guid clinicId, Guid createdBy,
    IEnumerable<SyncAllergyItem> allergies, CancellationToken ct);
Task SyncDoctorsAsync(Guid patientId, Guid clinicId, Guid createdBy,
    IEnumerable<SyncDoctorItem> doctors, CancellationToken ct);
Task SyncEmergencyContactsAsync(Guid patientId, Guid clinicId, Guid createdBy,
    IEnumerable<SyncEmergencyContactItem> contacts, CancellationToken ct);
```

Handlerele trimit `currentUser.ClinicId`. Adaugă în `SqlErrorCodes.cs` și `ErrorMessages.cs`:

```csharp
// SqlErrorCodes.cs — secțiunea Pacienți
public const int PatientConcurrency         = 50003;
public const int PatientHasFutureAppointments = 50004;
public const int PatientNotInClinic         = 50005;
public const int PatientDoctorNotInClinic   = 50006;
public const int PatientMultiplePrimaryDoctors = 50007;
```

```csharp
// ErrorMessages.Patient
public const string Concurrency =
    "Pacientul a fost modificat de alt utilizator. Reîncarcă datele.";
public const string HasFutureAppointments =
    "Pacientul are programări viitoare și nu poate fi șters. Anulează-le mai întâi.";
public const string NotInClinic          = "Pacientul nu aparține clinicii curente.";
public const string DoctorNotInClinic    = "Medicul selectat nu aparține clinicii curente.";
public const string MultiplePrimaryDoctors = "Poate exista un singur medic primar per pacient.";
```

### Acceptanță
- Test de integrare: `SyncAllergiesAsync(patientDinClinicaB, clinicaA, ...)` aruncă `SqlException` cu `Number == 50005`.
- `PUT /api/v1/Patients/{idDinAltaClinica}` cu alergii → `404` (din `Patient_Update`), fără nicio scriere în `PatientAllergies`.
- `grep -rn "Sync.*Async(" src/ValyanClinic.Application/Features/Patients/` — fiecare apel conține `currentUser.ClinicId`.

---

## 3. P0-3 — Constrângerea de unicitate pe CNP este greșită

### Simptom
Două comportamente, ambele reproductibile azi:

1. **Al doilea pacient fără CNP** dintr-o clinică (nou-născut, pacient străin, urgență fără acte)
   eșuează cu `400 — Datele trimise fac referire la înregistrări inexistente sau duplicate.`
2. Ștergi un pacient (soft delete) și încerci să-l reînregistrezi cu **același CNP** →
   același `400` generic, deși SP-ul consideră operația validă.

### Cauză
`0014_CreatePatients.sql`:

```sql
CONSTRAINT UQ_Patients_Cnp_Clinic UNIQUE (Cnp, ClinicId)
```

Comentariul din migrare spune „*doar neșterse, doar dacă CNP e NOT NULL*”, dar o constrângere
`UNIQUE` nu poate fi filtrată. Concret, în SQL Server:

- `UNIQUE` tratează `NULL` ca valoare comparabilă → **o singură linie cu `Cnp = NULL` per `ClinicId`**;
- nu există filtru pe `IsDeleted` → rândurile soft-deleted continuă să ocupe CNP-ul.

`Patient_Create` verifică `EXISTS (... AND IsDeleted = 0)` — trece; `INSERT`-ul lovește apoi
constrângerea și aruncă **2627**, prins de `GlobalExceptionHandlerMiddleware` și transformat
într-un `400` generic. Utilizatorul nu află niciodată motivul real, iar `PatientCnpDuplicate`
(50001) nu se declanșează.

### Fix
Înlocuiește constrângerea cu un **index unic filtrat** (în migrarea `0060`), cu o verificare
prealabilă care refuză migrarea dacă baza conține deja duplicate reale:

```sql
-- ── Pre-check: duplicate CNP active care ar bloca indexul ────────────────────
IF EXISTS (
    SELECT 1 FROM dbo.Patients
    WHERE Cnp IS NOT NULL AND IsDeleted = 0
    GROUP BY ClinicId, Cnp HAVING COUNT(*) > 1)
BEGIN
    DECLARE @Dups NVARCHAR(MAX) = (
        SELECT STRING_AGG(CONVERT(NVARCHAR(50), Cnp), ', ')
        FROM (SELECT Cnp FROM dbo.Patients
              WHERE Cnp IS NOT NULL AND IsDeleted = 0
              GROUP BY ClinicId, Cnp HAVING COUNT(*) > 1) d);
    ;THROW 51000, N'Migrarea 0060 nu poate continua: CNP-uri duplicate active. Rezolvă manual.', 1;
END
GO

-- ── Constrângerea veche: NULL-uri unice + rânduri șterse care blochează CNP ──
IF EXISTS (SELECT 1 FROM sys.key_constraints
           WHERE name = 'UQ_Patients_Cnp_Clinic' AND parent_object_id = OBJECT_ID('dbo.Patients'))
BEGIN
    ALTER TABLE dbo.Patients DROP CONSTRAINT UQ_Patients_Cnp_Clinic;
    PRINT 'Constrangerea UQ_Patients_Cnp_Clinic a fost eliminata.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_Patients_Cnp_Clinic_Active' AND object_id = OBJECT_ID('dbo.Patients'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_Patients_Cnp_Clinic_Active
        ON dbo.Patients (ClinicId, Cnp)
        WHERE Cnp IS NOT NULL AND IsDeleted = 0;
GO

-- ── Format CNP garantat la nivel de schemă ───────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Patients_Cnp_Format')
    ALTER TABLE dbo.Patients WITH NOCHECK
        ADD CONSTRAINT CK_Patients_Cnp_Format CHECK (
            Cnp IS NULL
            OR (LEN(Cnp) = 13 AND Cnp NOT LIKE '%[^0-9]%' AND Cnp NOT LIKE '0%'));
GO
```

> `WITH NOCHECK` lasă rândurile istorice neatinse; constrângerea se aplică doar scrierilor noi.
> Dacă baza e curată, rulează după migrare `ALTER TABLE dbo.Patients WITH CHECK CHECK CONSTRAINT CK_Patients_Cnp_Format;`.

`Patient_Create` și `Patient_Update` trebuie să normalizeze CNP-ul **înainte** de verificarea de
duplicat, nu doar la `INSERT` (azi `EXISTS` compară `@Cnp` brut, iar `INSERT` scrie valoarea
normalizată — două semantici diferite în același SP):

```sql
SET @Cnp = NULLIF(LTRIM(RTRIM(@Cnp)), N'');

IF @Cnp IS NOT NULL AND EXISTS (
    SELECT 1 FROM dbo.Patients WITH (UPDLOCK, HOLDLOCK)
    WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0)
BEGIN
    ;THROW 50001, N'Un pacient cu acest CNP există deja.', 1;
END;
```

`WITH (UPDLOCK, HOLDLOCK)` închide fereastra TOCTOU dintre `EXISTS` și `INSERT` (două cereri
concurente cu același CNP trec azi amândouă de verificare; una pică apoi pe 2627 generic).

### Acceptanță
- Doi pacienți fără CNP în aceeași clinică → ambii creați, `201`.
- Pacient cu CNP `1900101221144` șters → recreat cu același CNP → `201`.
- Doi pacienți activi cu același CNP în aceeași clinică → `409` cu mesajul `ErrorMessages.Patient.CnpDuplicate` (nu `400` generic).
- `POST` cu `cnp: "1900101221144"` trimis de două ori în paralel → exact un `201` și un `409`.

---

## 4. P0-4 — Validarea CNP este asimetrică între creare și editare

### Simptom
Un CNP cu cifră de control greșită este respins la creare, dar acceptat la editare.
Pacientul ajunge în bază cu CNP invalid, care apoi rupe orice integrare CNAS.

### Cauză

```csharp
// CreatePatientCommandValidator.cs — corect
RuleFor(x => x.Cnp)
    .Must(cnp => Cnp.IsValid(cnp))
    .WithMessage("CNP-ul nu este valid (verificați formatul și cifra de control).")
    .When(x => !string.IsNullOrWhiteSpace(x.Cnp));

// UpdatePatientCommandValidator.cs — doar formatul
RuleFor(x => x.Cnp)
    .Matches(@"^[1-9]\d{12}$").WithMessage("CNP-ul trebuie să aibă 13 cifre valide.")
    .When(x => !string.IsNullOrWhiteSpace(x.Cnp));
```

`ValyanClinic.Domain.ValueObjects.Cnp.IsValid` verifică lungimea, cifrele, prima cifră ≠ 0
**și** cifra de control (ponderi `2,7,9,1,4,6,3,5,8,2,7,9`, mod 11). Regexul verifică doar primele trei.

### Fix
Extrage regulile comune într-o clasă de bază, ca să nu se mai poată diverge:

```csharp
// src/ValyanClinic.Application/Features/Patients/Commands/PatientRulesExtensions.cs
using FluentValidation;
using ValyanClinic.Domain.ValueObjects;

namespace ValyanClinic.Application.Features.Patients.Commands;

/// <summary>
/// Regulile partajate de Create și Update. Orice câmp validat în ambele comenzi
/// trăiește aici — două validatoare independente au divergat deja o dată (CNP).
/// </summary>
internal static class PatientRulesExtensions
{
    internal static IRuleBuilderOptions<T, string?> ValidCnp<T>(
        this IRuleBuilder<T, string?> rule) =>
        rule.Must(cnp => Cnp.IsValid(cnp))
            .WithMessage("CNP-ul nu este valid (verificați formatul și cifra de control).");

    internal static IRuleBuilderOptions<T, DateTime?> PlausibleBirthDate<T>(
        this IRuleBuilder<T, DateTime?> rule) =>
        rule.Must(d => d is null || (d.Value.Date <= DateTime.UtcNow.Date
                                     && d.Value.Year >= 1900))
            .WithMessage("Data nașterii nu este plauzibilă (nu poate fi în viitor sau înainte de 1900).");
}
```

Aplică în ambele validatoare:

```csharp
RuleFor(x => x.Cnp).ValidCnp().When(x => !string.IsNullOrWhiteSpace(x.Cnp));
RuleFor(x => x.BirthDate).PlausibleBirthDate();
```

Adaugă totodată validările absente azi din **ambele** validatoare:

```csharp
// Data expirării asigurării nu poate fi anterioară zilei curente la creare
RuleFor(x => x.InsuranceExpiry)
    .Must(d => d is null || d.Value.Date >= DateTime.UtcNow.Date)
    .WithMessage("Data de expirare a asigurării este în trecut.")
    .When(x => x.IsInsured);

// Coerență CNP ↔ data nașterii (CNP-ul codifică AALLZZ pe pozițiile 2-7)
RuleFor(x => x)
    .Must(x => CnpMatchesBirthDate(x.Cnp, x.BirthDate))
    .WithMessage("Data nașterii nu corespunde CNP-ului.")
    .When(x => !string.IsNullOrWhiteSpace(x.Cnp) && x.BirthDate.HasValue);

// Medicii asignați — lipsesc complet azi din ambele validatoare
RuleForEach(x => x.Doctors).ChildRules(d =>
{
    d.RuleFor(x => x.DoctorId).NotEmpty().WithMessage("Medicul este obligatoriu.");
    d.RuleFor(x => x.Notes).MaximumLength(500)
        .WithMessage("Notele medicului nu pot depăși 500 de caractere.");
});

RuleFor(x => x.Doctors)
    .Must(list => list is null || list.Count(d => d.IsPrimary) <= 1)
    .WithMessage("Poate exista un singur medic primar.")
    .Must(list => list is null || list.Select(d => d.DoctorId).Distinct().Count() == list.Count)
    .WithMessage("Același medic nu poate fi asignat de două ori.");

RuleFor(x => x.EmergencyContacts)
    .Must(list => list is null || list.Count(c => c.IsDefault) <= 1)
    .WithMessage("Poate exista un singur contact de urgență implicit.");
```

`CnpMatchesBirthDate` merge în `Cnp` ca metodă statică (`Cnp.TryGetBirthDate(string, out DateOnly)`),
ca să fie refolosită și de `parseCnp` din FE prin aceleași reguli.

### Acceptanță
- `PUT` cu `cnp: "1900101221145"` (cifră de control greșită) → `400` cu mesajul despre cifra de control.
- `POST`/`PUT` cu `birthDate` în viitor → `400`.
- `POST` cu doi medici `isPrimary: true` → `400`.
- `POST` cu același `doctorId` de două ori → `400`.
- Teste noi în `tests/ValyanClinic.Tests/Validators/UpdatePatientCommandValidatorTests.cs` (nu există azi).

---

## 5. P1 — SQL: schemă și stored procedures

Toate modificările de schemă intră în **o singură migrare** `0060_PatientsHardening.sql`.
SP-urile se rescriu în loc (`CREATE OR ALTER`, rulate de DbUp la fiecare pornire).

### 5.1 Concurență optimistă neutilizată (P1-1)

`dbo.Patients` are deja `RowVersion ROWVERSION NOT NULL` (migrarea `0014`), dar nimic nu o citește.
Doi utilizatori care editează același pacient: ultimul salvat câștigă, primul pierde datele fără avertisment.

Aplică **exact** modelul din `Appointment_Update.sql` (cod `50019` acolo, `50003` aici):

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_Update
    @Id         UNIQUEIDENTIFIER,
    @ClinicId   UNIQUEIDENTIFIER,
    -- ... restul parametrilor ...
    @RowVersion BINARY(8) = NULL,   -- NULL = fără verificare de concurență
    @UpdatedBy  UNIQUEIDENTIFIER
AS
BEGIN
    ...
    DECLARE @CurRowVer BINARY(8);
    SELECT @CurRowVer = RowVersion
    FROM dbo.Patients WITH (UPDLOCK)
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

    IF @CurRowVer IS NULL
        ;THROW 50002, N'Pacientul nu a fost găsit.', 1;

    IF @RowVersion IS NOT NULL AND @RowVersion <> @CurRowVer
        ;THROW 50003, N'Pacientul a fost modificat de alt utilizator. Reîncarcă datele.', 1;
    ...
END;
```

Expune `RowVersion` ca `byte[]` în `PatientDetailDto` (serializat base64 în JSON), propagă-l prin
`UpdatePatientRequest` → `UpdatePatientCommand` → `PatientUpdateData`, iar handler-ul prinde:

```csharp
catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientConcurrency)
{
    return Result<bool>.Conflict(ErrorMessages.Patient.Concurrency);  // 409
}
```

Pe FE, `PatientFormModal` preia `rowVersion` din detaliu și îl retrimite; la `409` afișează
mesajul și reîncarcă detaliul (`qc.invalidateQueries({ queryKey: patientKeys.detail(id) })`).

### 5.2 Patru tranzacții în loc de una (P1-2)

`CreatePatientCommandHandler` face patru apeluri consecutive, fiecare cu **propria conexiune și
propria tranzacție**:

```csharp
var patientId = await repository.CreateAsync(...);
if (request.Allergies is { Count: > 0 })  await repository.SyncAllergiesAsync(...);
if (request.Doctors is { Count: > 0 })    await repository.SyncDoctorsAsync(...);
if (request.EmergencyContacts is { Count: > 0 }) await repository.SyncEmergencyContactsAsync(...);
```

Dacă a doua eșuează, pacientul rămâne creat fără alergii, iar API-ul răspunde `400`. Utilizatorul
reîncearcă → `409 CNP duplicat`. Stare imposibil de reparat din UI.

**Decizie:** `Patient_Create` și `Patient_Update` primesc cele trei TVP-uri ca parametri opționali
și deleagă către SP-urile de sync **în interiorul propriei tranzacții** (SQL Server permite pasarea
unei variabile de tip tabel către un alt SP ca parametru `READONLY`):

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_Create
    @ClinicId  UNIQUEIDENTIFIER,
    -- ... câmpurile pacientului ...
    @CreatedBy UNIQUEIDENTIFIER,
    @Allergies dbo.PatientAllergyTableType          READONLY,
    @Doctors   dbo.PatientDoctorTableType           READONLY,
    @Contacts  dbo.PatientEmergencyContactTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- ... INSERT pacient + audit ...

        IF EXISTS (SELECT 1 FROM @Allergies)
            EXEC dbo.PatientAllergy_Sync @NewPatientId, @ClinicId, @CreatedBy, @Allergies;
        IF EXISTS (SELECT 1 FROM @Doctors)
            EXEC dbo.PatientDoctor_Sync  @NewPatientId, @ClinicId, @CreatedBy, @Doctors;
        IF EXISTS (SELECT 1 FROM @Contacts)
            EXEC dbo.PatientEmergencyContact_Sync @NewPatientId, @ClinicId, @CreatedBy, @Contacts;

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
```

> Tranzacțiile din SP-urile de sync devin imbricate (`@@TRANCOUNT > 1`); `BEGIN/COMMIT` interior
> doar incrementează contorul, iar `XACT_ABORT ON` + `ROLLBACK` exterior anulează totul. Corect,
> dar **înlocuiește `IF @@TRANCOUNT > 0 ROLLBACK`** din SP-urile de sync cu re-`THROW` simplu,
> altfel un rollback interior anulează și tranzacția exterioară cu eroare 266:
>
> ```sql
> BEGIN CATCH
>     IF @@TRANCOUNT > 0 AND XACT_STATE() = -1 ROLLBACK TRANSACTION;
>     ;THROW;
> END CATCH;
> ```

`PatientRepository` construiește cele trei `DataTable` (chiar goale) și le pasează în același
`CommandDefinition`. Handler-ele rămân cu **un singur** apel de repository.

TVP-ul gol trebuie totuși declarat cu coloanele corecte, altfel Dapper trimite `NULL`:

```csharp
private static DataTable BuildAllergyTable(IEnumerable<SyncAllergyItem>? items)
{
    var table = new DataTable();
    table.Columns.Add("AllergyTypeId", typeof(Guid));
    table.Columns.Add("AllergySeverityId", typeof(Guid));
    table.Columns.Add("AllergenName", typeof(string));
    table.Columns.Add("Reaction", typeof(string));
    table.Columns.Add("OnsetDate", typeof(DateTime));
    table.Columns.Add("Notes", typeof(string));

    foreach (var a in items ?? [])
        table.Rows.Add(a.AllergyTypeId, a.AllergySeverityId, a.AllergenName,
            (object?)a.Reaction ?? DBNull.Value,
            (object?)a.OnsetDate ?? DBNull.Value,
            (object?)a.Notes ?? DBNull.Value);

    return table;
}
```

### 5.3 `Patient_GetPaged` (P1-3)

Cinci probleme distincte în același SP.

**a) `FullName` afișat ≠ `FullName` sortat.** Rândurile returnează
`p.FirstName + ' ' + p.LastName`, dar `ORDER BY` pentru `fullName` folosește
`p.LastName + ' ' + p.FirstName`. Grid-ul pornește implicit cu `sortBy = 'fullName'`
(`PatientsListPage.tsx:93`), deci **lista arată dezordonată la prima încărcare**.
Restul aplicației (`Consultation_GetById`, `Appointment_*`) folosește `LastName FirstName`.
**Decizie:** aliniere la convenția existentă — `CONCAT(p.LastName, N' ', p.FirstName) AS FullName`
în ambele locuri, în `Patient_GetPaged`, `Patient_GetById` și `Patient_GetLookup`.

**b) `LIKE` fără escape.** `'%' + @Search + '%'` — o căutare care conține `%`, `_` sau `[`
schimbă semantica (un singur `%` returnează tot). Creează o funcție scalară în `0060`:

```sql
IF OBJECT_ID('dbo.fn_EscapeLike', 'FN') IS NOT NULL DROP FUNCTION dbo.fn_EscapeLike;
GO
CREATE FUNCTION dbo.fn_EscapeLike (@Input NVARCHAR(400))
RETURNS NVARCHAR(800)
WITH SCHEMABINDING
AS
BEGIN
    RETURN REPLACE(REPLACE(REPLACE(REPLACE(
        @Input, N'\', N'\\'), N'%', N'\%'), N'_', N'\_'), N'[', N'\[');
END;
GO
```

și folosește `LIKE @Term ESCAPE '\'` peste tot.

**c) Filtrele sunt scrise de două ori** (result set 1 și result set 2). Orice filtru adăugat
într-unul și uitat în celălalt produce un `totalCount` care nu corespunde rândurilor.
Înlocuiește al doilea `SELECT COUNT(*)` cu `COUNT(*) OVER () AS TotalCount` în primul set:

```sql
    SELECT
        COUNT(*) OVER () AS TotalCount,
        p.Id, p.ClinicId, p.PatientCode, ...
```

Repository-ul citește atunci un singur result set pentru rânduri + total:

```csharp
var items = (await multi.ReadAsync<PatientListRow>()).ToList();
var totalCount = items.Count > 0 ? items[0].TotalCount : 0;
```

> Alternativ, dacă preferi să nu schimbi forma DTO-ului: păstrează două result set-uri, dar
> extrage filtrul comun într-un CTE `FilteredPatients` folosit de ambele, ca în
> `Consultation_GetPaged`. Orice variantă, **nu lăsa predicatul duplicat textual**.

**d) Statisticile se recalculează la fiecare pagină.** Result set 3 face patru scanări complete
peste `Patients` de fiecare dată când utilizatorul dă „pagina următoare”. Două remedii cumulate:

```sql
    @IncludeStats BIT = 1   -- clientul cere stats doar când se schimbă filtrele
```

și o singură trecere cu agregare condiționată:

```sql
    IF @IncludeStats = 1
    BEGIN
        SELECT
            COUNT(*)                                                       AS TotalPatients,
            SUM(CASE WHEN p.IsActive = 1 THEN 1 ELSE 0 END)                AS ActivePatients,
            SUM(CASE WHEN a.PatientId IS NOT NULL THEN 1 ELSE 0 END)       AS PatientsWithAllergies,
            SUM(CASE WHEN p.CreatedAt >= DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1)
                     THEN 1 ELSE 0 END)                                    AS NewThisMonth
        FROM dbo.Patients p
        OUTER APPLY (SELECT TOP 1 pa.PatientId FROM dbo.PatientAllergies pa
                     WHERE pa.PatientId = p.Id AND pa.IsActive = 1) a
        WHERE p.ClinicId = @ClinicId AND p.IsDeleted = 0;
    END
    ELSE
        SELECT CAST(NULL AS INT) AS TotalPatients, CAST(NULL AS INT) AS ActivePatients,
               CAST(NULL AS INT) AS PatientsWithAllergies, CAST(NULL AS INT) AS NewThisMonth;
```

Result set-ul 3 rămâne mereu prezent (repository-ul face `ReadSingleAsync`), doar conținutul diferă.
Pe FE, `queryParams` trimite `includeStats: page === 1`, iar `stats` se păstrează din ultimul răspuns
care le-a conținut.

**e) Variabile locale + `OPTION (RECOMPILE)` se anulează reciproc.** Copierea parametrilor în
`@ClinicId_` etc. forțează estimări pe densitate medie *tocmai ca să evite* parameter sniffing;
`OPTION (RECOMPILE)` compilează oricum planul pentru valorile reale, ceea ce e strict mai bun
pentru un SP cu filtre opționale. **Decizie:** elimină cele 11 copii locale, păstrează
`OPTION (RECOMPILE)` pe ambele interogări. Codul scade cu ~15 linii și planurile se îmbunătățesc.

**f) Whitelist explicit pentru `@SortBy`.** Azi, un `sortBy` necunoscut cade tăcut pe tie-break.
Normalizează și validează:

```sql
    SET @SortBy = LOWER(ISNULL(NULLIF(LTRIM(RTRIM(@SortBy)), ''), 'lastname'));
    IF @SortBy NOT IN ('patientcode','firstname','lastname','fullname','email','cnp',
                       'gendername','bloodtypename','primarydoctorname','phonenumber',
                       'allergycount','isactive','birthdate','insuranceexpiry','createdat','age')
        SET @SortBy = 'lastname';
```

(comparațiile din blocurile `CASE` devin tot lowercase — elimină și normalizarea camelCase actuală).

### 5.4 `Patient_Delete` fără reguli de business (P1-4)

Azi SP-ul doar marchează `IsDeleted = 1`. Consecințe:
- un pacient cu programări viitoare dispare din listă, dar programările rămân în calendar;
- alergiile, medicii și contactele rămân `IsActive = 1`, deci reapar integral la o eventuală restaurare
  și continuă să fie numărate în `PatientsWithAllergies` din statistici (statistica face join cu
  `Patients` filtrat pe `IsDeleted = 0`, deci nu — dar `PatientDoctors` rămâne vizibil în rapoarte pe medic).

```sql
        -- 2. Regulă de business: programări viitoare care blochează slot-uri
        IF EXISTS (
            SELECT 1
            FROM dbo.Appointments a
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.PatientId = @Id AND a.ClinicId = @ClinicId
              AND a.IsDeleted = 0 AND s.BlocksSlot = 1
              AND a.StartTime >= SYSDATETIME())
        BEGIN
            ;THROW 50004, N'Pacientul are programări viitoare și nu poate fi șters.', 1;
        END;

        -- 4b. Dezactivare colecții copil, în aceeași tranzacție
        UPDATE dbo.PatientAllergies         SET IsActive = 0 WHERE PatientId = @Id AND IsActive = 1;
        UPDATE dbo.PatientDoctors           SET IsActive = 0 WHERE PatientId = @Id AND IsActive = 1;
        UPDATE dbo.PatientEmergencyContacts SET IsActive = 0 WHERE PatientId = @Id AND IsActive = 1;
```

> Coloanele folosite sunt verificate: `Appointments.StartTime DATETIME2(0)` (migrarea `0027`)
> și `AppointmentStatuses.BlocksSlot BIT` (migrarea `0057`). `Doctors.ClinicId` există din `0004`,
> deci validarea de tenancy a medicilor din §5.5 este aplicabilă ca atare.

`DeletePatientCommandHandler` prinde noul cod:

```csharp
catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientHasFutureAppointments)
{
    return Result<bool>.Conflict(ErrorMessages.Patient.HasFutureAppointments); // 409
}
```

### 5.5 `PatientDoctor_Sync` (P1-5)

Trei probleme:

1. **`MERGE` fără `HOLDLOCK`** — două salvări concurente pot insera ambele, lovind
   `UQ_PatientDoctors_Patient_Doctor` cu 2627 generic. Regula e aceeași ca la Consultații (P1-4 acolo).
2. **`@Doctors` poate conține același `DoctorId` de două ori** → eroare 8672
   („MERGE a încercat să actualizeze de mai multe ori același rând”), mesaj SQL brut către utilizator.
3. **Niciun doctor nu e validat ca aparținând clinicii** — se poate asigna un medic din altă clinică.

```sql
CREATE OR ALTER PROCEDURE dbo.PatientDoctor_Sync
    @PatientId UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Doctors   dbo.PatientDoctorTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                       WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
            ;THROW 50005, N'Pacientul nu aparține clinicii curente.', 1;

        -- Deduplicare defensivă: ultimul rând câștigă, IsPrimary are prioritate
        DECLARE @Src TABLE (DoctorId UNIQUEIDENTIFIER PRIMARY KEY,
                            IsPrimary BIT, Notes NVARCHAR(500));
        INSERT INTO @Src (DoctorId, IsPrimary, Notes)
        SELECT DoctorId, MAX(CAST(IsPrimary AS INT)), MAX(Notes)
        FROM @Doctors GROUP BY DoctorId;

        IF EXISTS (SELECT 1 FROM @Src s
                   WHERE NOT EXISTS (SELECT 1 FROM dbo.Doctors d
                                     WHERE d.Id = s.DoctorId AND d.ClinicId = @ClinicId
                                       AND d.IsDeleted = 0))
            ;THROW 50006, N'Medicul selectat nu aparține clinicii curente.', 1;

        IF (SELECT COUNT(*) FROM @Src WHERE IsPrimary = 1) > 1
            ;THROW 50007, N'Poate exista un singur medic primar per pacient.', 1;

        UPDATE dbo.PatientDoctors
        SET IsActive = 0, UpdatedAt = SYSDATETIME(), UpdatedBy = @CreatedBy
        WHERE PatientId = @PatientId AND IsActive = 1
          AND DoctorId NOT IN (SELECT DoctorId FROM @Src);

        MERGE dbo.PatientDoctors WITH (HOLDLOCK) AS target
        USING @Src AS source
           ON target.PatientId = @PatientId AND target.DoctorId = source.DoctorId
        WHEN MATCHED THEN UPDATE SET
            IsPrimary = source.IsPrimary, Notes = source.Notes, IsActive = 1,
            UpdatedAt = SYSDATETIME(), UpdatedBy = @CreatedBy
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (PatientId, DoctorId, IsPrimary, AssignedAt, Notes, IsActive, CreatedBy)
            VALUES (@PatientId, source.DoctorId, source.IsPrimary, SYSDATETIME(),
                    source.Notes, 1, @CreatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 AND XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
```

> Observă schimbarea semantică: azi SP-ul dezactivează **toate** asignările apoi le reactivează,
> ceea ce rescrie `AssignedAt` pentru medici nemodificați. Varianta de mai sus dezactivează doar
> ce a fost scos și păstrează `AssignedAt` pentru cei existenți — istoricul devine util.
> `UpdatedAt`/`UpdatedBy` pe tabelele copil se adaugă în `0060` (vezi §5.8).

Exclusivitatea `IsPrimary` primește și o garanție de schemă în `0060`:

```sql
-- Demovează primarii multipli existenți (păstrează cel mai vechi)
;WITH Ranked AS (
    SELECT Id, ROW_NUMBER() OVER (PARTITION BY PatientId ORDER BY AssignedAt, Id) AS rn
    FROM dbo.PatientDoctors WHERE IsPrimary = 1 AND IsActive = 1)
UPDATE pd SET pd.IsPrimary = 0
FROM dbo.PatientDoctors pd INNER JOIN Ranked r ON r.Id = pd.Id WHERE r.rn > 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_PatientDoctors_OnePrimary')
    CREATE UNIQUE NONCLUSTERED INDEX UX_PatientDoctors_OnePrimary
        ON dbo.PatientDoctors (PatientId) WHERE IsPrimary = 1 AND IsActive = 1;
GO
```

Identic pentru `PatientEmergencyContacts.IsDefault` → `UX_PatientEmergencyContacts_OneDefault`.

### 5.6 `PatientAllergy_Sync`: creștere nelimitată (P1-6)

Fiecare salvare a formularului dezactivează toate alergiile și inserează rânduri noi.
Un pacient cu 3 alergii, editat de 20 de ori, are 60 de rânduri din care 3 active.
`CreatedAt` devine data ultimei salvări, nu data înregistrării alergiei.

Înlocuiește cu `MERGE` pe cheia naturală `(PatientId, AllergyTypeId, AllergenName)`:

```sql
        DECLARE @Src TABLE (
            AllergyTypeId UNIQUEIDENTIFIER, AllergySeverityId UNIQUEIDENTIFIER,
            AllergenName NVARCHAR(200), Reaction NVARCHAR(500),
            OnsetDate DATE, Notes NVARCHAR(500),
            PRIMARY KEY (AllergyTypeId, AllergenName));

        INSERT INTO @Src
        SELECT AllergyTypeId, MAX(AllergySeverityId), AllergenName,
               MAX(Reaction), MAX(OnsetDate), MAX(Notes)
        FROM @Allergies GROUP BY AllergyTypeId, AllergenName;

        UPDATE pa SET IsActive = 0, UpdatedAt = SYSDATETIME(), UpdatedBy = @CreatedBy
        FROM dbo.PatientAllergies pa
        WHERE pa.PatientId = @PatientId AND pa.IsActive = 1
          AND NOT EXISTS (SELECT 1 FROM @Src s
                          WHERE s.AllergyTypeId = pa.AllergyTypeId
                            AND s.AllergenName  = pa.AllergenName);

        MERGE dbo.PatientAllergies WITH (HOLDLOCK) AS t
        USING @Src AS s
           ON t.PatientId = @PatientId
          AND t.AllergyTypeId = s.AllergyTypeId
          AND t.AllergenName  = s.AllergenName
        WHEN MATCHED THEN UPDATE SET
            AllergySeverityId = s.AllergySeverityId, Reaction = s.Reaction,
            OnsetDate = s.OnsetDate, Notes = s.Notes, IsActive = 1,
            UpdatedAt = SYSDATETIME(), UpdatedBy = @CreatedBy
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (PatientId, AllergyTypeId, AllergySeverityId, AllergenName,
                    Reaction, OnsetDate, Notes, IsActive, CreatedAt, CreatedBy)
            VALUES (@PatientId, s.AllergyTypeId, s.AllergySeverityId, s.AllergenName,
                    s.Reaction, s.OnsetDate, s.Notes, 1, SYSDATETIME(), @CreatedBy);
```

Necesită în `0060` un index unic care să susțină `MERGE`-ul (după o curățare a duplicatelor
istorice, păstrând cel mai recent rând activ):

```sql
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_PatientAllergies_Natural')
    CREATE UNIQUE NONCLUSTERED INDEX UX_PatientAllergies_Natural
        ON dbo.PatientAllergies (PatientId, AllergyTypeId, AllergenName)
        WHERE IsActive = 1;
GO
```

`PatientEmergencyContact_Sync` primește același tratament, cu cheia naturală
`(PatientId, FullName, PhoneNumber)`.

### 5.7 `@PageSize` nelimitat (P1-7)

`GetPatientsQuery` nu are validator, iar SP-ul nu limitează. `GET /api/v1/Patients?pageSize=1000000`
scanează și materializează întreaga clinică — vector de DoS pentru orice cont autentificat.
Exportul FE cere deja 5000 de rânduri (`EXPORT_MAX_ROWS`).

Două straturi:

```csharp
// src/ValyanClinic.Application/Features/Patients/Queries/GetPatients/GetPatientsQueryValidator.cs
public sealed class GetPatientsQueryValidator : AbstractValidator<GetPatientsQuery>
{
    public GetPatientsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 200);
        RuleFor(x => x.Search).MaximumLength(200);
        RuleFor(x => x.SortDir).Must(d => d is "asc" or "desc")
            .WithMessage("Direcția de sortare trebuie să fie 'asc' sau 'desc'.");
    }
}
```

```sql
    IF @Page     IS NULL OR @Page < 1      SET @Page = 1;
    IF @PageSize IS NULL OR @PageSize < 1  SET @PageSize = 20;
    IF @PageSize > 200                     SET @PageSize = 200;
```

Exportul FE devine paginat: buclă peste pagini de 200 până la `totalCount` sau `EXPORT_MAX_ROWS`,
cu progres afișat. Menține plafonul de 5000 și mesajul existent.

### 5.8 Audit și `SYSDATETIME()` pe tabelele copil (P2-3)

Toate SP-urile de pacient folosesc `GETDATE()` (precizie 3 ms, tip `DATETIME`), în timp ce
`CLAUDE.md` R3 și restul modulelor folosesc `SYSDATETIME()` (`DATETIME2`). Înlocuiește peste tot
în `Patient_*.sql` și `Patient*_Sync.sql`.

Tabelele copil nu au `UpdatedAt`/`UpdatedBy` (R3 le cere pe orice tabel principal; aceste tabele
sunt scrise direct de utilizatori, deci intră în regulă). Adaugă în `0060`:

```sql
-- Explicit, în linia migrării 0016: fiecare coloană cu propriul guard.
IF COL_LENGTH('dbo.PatientAllergies', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.PatientAllergies ADD UpdatedAt DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.PatientAllergies', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.PatientAllergies ADD UpdatedBy UNIQUEIDENTIFIER NULL;
GO
IF COL_LENGTH('dbo.PatientDoctors', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.PatientDoctors ADD UpdatedAt DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.PatientDoctors', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.PatientDoctors ADD UpdatedBy UNIQUEIDENTIFIER NULL;
GO
IF COL_LENGTH('dbo.PatientDoctors', 'CreatedAt') IS NULL
    ALTER TABLE dbo.PatientDoctors
        ADD CreatedAt DATETIME2(0) NOT NULL
            CONSTRAINT DF_PatientDoctors_CreatedAt DEFAULT SYSDATETIME();
GO
IF COL_LENGTH('dbo.PatientEmergencyContacts', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.PatientEmergencyContacts ADD UpdatedAt DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.PatientEmergencyContacts', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.PatientEmergencyContacts ADD UpdatedBy UNIQUEIDENTIFIER NULL;
GO
```

> Nu genera aceste `ALTER` dintr-un cursor cu `sp_executesql`: primul parametru al lui
> `sp_executesql` trebuie să fie o variabilă `NVARCHAR`, nu o concatenare, iar un `ALTER TABLE`
> generat dinamic ascunde exact genul de eroare pe care migrarea trebuie s-o facă vizibilă.

`PatientDoctors` nu are nici `CreatedAt` (doar `AssignedAt` și `CreatedBy`) — adaugă-l pentru consistență.

### 5.9 `TotalVisits` hardcodat (P2-2)

```sql
-- Patient_GetById.sql, linia curentă
0 AS TotalVisits,   -- „0 până la implementarea modulului Consultations”
```

Modulul Consultații există din migrarea `0031`. Fișa pacientului arată permanent „0 vizite”.

```sql
        (SELECT COUNT(*) FROM dbo.Consultations c
         WHERE c.PatientId = p.Id AND c.ClinicId = p.ClinicId AND c.IsDeleted = 0) AS TotalVisits,
        (SELECT MAX(c.Date) FROM dbo.Consultations c
         WHERE c.PatientId = p.Id AND c.ClinicId = p.ClinicId AND c.IsDeleted = 0) AS LastVisitDate,
```

Adaugă `LastVisitDate` în `PatientDetailDto` și afișează-l în `PatientDetailPage` — informația
cea mai cerută la deschiderea unei fișe.

### 5.10 Indecși (P2-1)

Sortarea implicită este `ClinicId` + `LastName` + `FirstName`, dar nu există index care s-o susțină:
`IX_Patients_ClinicId` (fără `INCLUDE`) forțează key lookup per rând, iar `IX_Patients_LastName`
nu conține `ClinicId`, deci e inutilizabil pentru un query multi-tenant.

```sql
-- Index acoperitor pentru listarea implicită
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_Clinic_Name_Covering')
    CREATE NONCLUSTERED INDEX IX_Patients_Clinic_Name_Covering
        ON dbo.Patients (ClinicId, LastName, FirstName, Id)
        INCLUDE (PatientCode, Cnp, BirthDate, GenderId, BloodTypeId, PhoneNumber,
                 Email, Address, InsuranceNumber, InsuranceExpiry, IsActive, CreatedAt)
        WHERE IsDeleted = 0;
GO

-- Redundanți: prefix al indexului de mai sus sau selectivitate prea mică
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_ClinicId' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_ClinicId ON dbo.Patients;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_LastName' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_LastName ON dbo.Patients;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_IsActive' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_IsActive ON dbo.Patients;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_GenderId' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_GenderId ON dbo.Patients;
GO

-- IX_Patients_Cnp nu conținea ClinicId; UX_Patients_Cnp_Clinic_Active îl înlocuiește
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_Cnp' AND object_id = OBJECT_ID('dbo.Patients'))
    DROP INDEX IX_Patients_Cnp ON dbo.Patients;
GO

-- Filtrul pe medic din GetPaged: EXISTS pe (DoctorId, PatientId)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PatientDoctors_Doctor_Patient')
    CREATE NONCLUSTERED INDEX IX_PatientDoctors_Doctor_Patient
        ON dbo.PatientDoctors (DoctorId, PatientId) INCLUDE (IsPrimary) WHERE IsActive = 1;
GO
```

**Verificare obligatorie înainte de `DROP`:** rulează
`SELECT * FROM sys.dm_db_index_usage_stats WHERE object_id = OBJECT_ID('dbo.Patients');`
pe o bază cu trafic real. Dacă un index are `user_seeks` semnificativ, păstrează-l și notează de ce.

---

## 6. P1-8 — Semnături de repository (record de date)

`CLAUDE.md` §8 e explicit: *„peste ~6 câmpuri de business, semnătura primește un
`{Entity}CreateData` / `{Entity}UpdateData`”*. `IPatientRepository` are azi **22 de parametri
poziționali**, dintre care 4 `Guid?` consecutivi (`GenderId`, `BloodTypeId`) și 9 `string?`
consecutivi — două valori inversate compilează perfect și produc date greșite tăcut.

```csharp
// src/ValyanClinic.Application/Common/Interfaces/IPatientRepository.cs
public interface IPatientRepository
{
    Task<PatientPagedResult> GetPagedAsync(PatientPagedQuery query, CancellationToken ct);

    Task<PatientFullResult?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(PatientCreateData data, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(PatientUpdateData data, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task<IEnumerable<PatientLookupDto>> GetLookupAsync(
        Guid clinicId, string? search, int top, CancellationToken ct);

    Task<bool> ExistsByCnpAsync(
        string cnp, Guid clinicId, Guid? excludeId, CancellationToken ct);
}

/// <summary>Datele de creare ale unui pacient, inclusiv colecțiile copil.</summary>
public sealed record PatientCreateData(
    Guid ClinicId,
    string FirstName,
    string LastName,
    string? Cnp,
    DateTime? BirthDate,
    Guid? GenderId,
    Guid? BloodTypeId,
    string? PhoneNumber,
    string? SecondaryPhone,
    string? Email,
    string? Address,
    string? City,
    string? County,
    string? PostalCode,
    string? InsuranceNumber,
    DateTime? InsuranceExpiry,
    bool IsInsured,
    string? ChronicDiseases,
    string? FamilyDoctorName,
    string? Notes,
    IReadOnlyList<SyncAllergyItem> Allergies,
    IReadOnlyList<SyncDoctorItem> Doctors,
    IReadOnlyList<SyncEmergencyContactItem> EmergencyContacts);

/// <summary>Datele de actualizare = PatientCreateData + Id, IsActive, RowVersion.</summary>
public sealed record PatientUpdateData(
    Guid Id,
    Guid ClinicId,
    /* ... aceleași câmpuri ... */
    bool IsActive,
    byte[]? RowVersion,
    IReadOnlyList<SyncAllergyItem> Allergies,
    IReadOnlyList<SyncDoctorItem> Doctors,
    IReadOnlyList<SyncEmergencyContactItem> EmergencyContacts);

/// <summary>Parametrii de listare paginată (11 argumente scalare devin un record).</summary>
public sealed record PatientPagedQuery(
    Guid ClinicId,
    string? Search,
    Guid? GenderId,
    Guid? BloodTypeId,
    Guid? DoctorId,
    bool? HasAllergies,
    bool? IsActive,
    int Page,
    int PageSize,
    string SortBy,
    string SortDir,
    bool IncludeStats);
```

Handler-ele fac traducerea cu **argumente numite** (`CLAUDE.md` R7), cu `ClinicId` din `ICurrentUser`:

```csharp
var data = new PatientCreateData(
    ClinicId: currentUser.ClinicId,
    FirstName: request.FirstName,
    LastName: request.LastName,
    Cnp: request.Cnp,
    // ...
    Allergies: request.Allergies ?? [],
    Doctors: request.Doctors ?? [],
    EmergencyContacts: request.EmergencyContacts ?? []);

var patientId = await repository.CreateAsync(data, currentUser.Id, cancellationToken);
return Result<Guid>.Created(patientId);
```

Elimină totodată `PatientRepository.GetStatsAsync` (P2-10): nu e pe interfață, nu e apelat nicăieri,
și reapelează SP-ul greu de listare doar ca să citească result set-ul 3.

### `Patient_ExistsByCnp` — SP orfan devine endpoint util (P2-9)

SP-ul există și e corect, dar nu e apelat de nimeni. Formularul nu poate avertiza despre un CNP
duplicat decât după `submit` (`409`). Adaugă `@ExcludeId` (altfel editarea propriului pacient
raportează fals duplicat):

```sql
CREATE OR ALTER PROCEDURE dbo.Patient_ExistsByCnp
    @Cnp       NCHAR(13),
    @ClinicId  UNIQUEIDENTIFIER,
    @ExcludeId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CAST(CASE WHEN EXISTS (
        SELECT 1 FROM dbo.Patients
        WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0
          AND (@ExcludeId IS NULL OR Id <> @ExcludeId)) THEN 1 ELSE 0 END AS BIT);
END;
GO
```

```csharp
[HttpGet("exists-by-cnp")]
[HasAccess(ModuleCodes.Patients, AccessLevel.Read)]
[ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
public async Task<IActionResult> ExistsByCnp(
    [FromQuery] string cnp, [FromQuery] Guid? excludeId, CancellationToken ct)
    => HandleResult(await Mediator.Send(new PatientExistsByCnpQuery(cnp, excludeId), ct));
```

Pe FE, un `useQuery` cu `enabled: isValidCnp(cnpValue)` și `useDebounce(cnpValue, 500)` afișează
imediat sub câmp „Există deja un pacient cu acest CNP”.

---

## 7. P2 — Frontend

### 7.1 Tipurile nu sunt derivate din contract (P2-4)

`client/src/features/patients/types/patient.types.ts` definește `PatientDto`, `PatientDetailDto`,
`PatientAllergyDto` etc. **ca interfețe scrise de mână**. Doar `PatientLookupDto` folosește
`components['schemas'][...]`. Efect: `npm run check:api` (job-ul `contract` din CI) nu detectează
nicio schimbare de contract pe acest modul, iar drift-ul e deja vizibil:

```ts
export interface PatientDto {
  cnp: string           // ← backend: string | null (PatientListDto.Cnp este string?)
```

Grid-ul randează `<AppBadge variant="primary" mono>{row.cnp}</AppBadge>` fără verificare de null →
badge gol pentru orice pacient fără CNP (posibil după P2-5).

**Fix:** derivă totul din schema generată, ca în Consultații:

```ts
import type { components } from '@/api/generated/schema'

export type PatientDto           = components['schemas']['PatientListDto']
export type PatientDetailDto     = components['schemas']['PatientDetailDto']
export type PatientAllergyDto    = components['schemas']['PatientAllergyDto']
export type PatientDoctorDto     = components['schemas']['PatientDoctorDto']
export type PatientEmergencyContactDto = components['schemas']['PatientEmergencyContactDto']
export type PatientFullDetailDto = components['schemas']['PatientFullDetailDto']
export type PatientsPagedResponse = components['schemas']['PatientsPagedResponse']
export type CreatePatientPayload = components['schemas']['CreatePatientCommand']
export type UpdatePatientPayload = { id: string } & components['schemas']['UpdatePatientRequest']
```

Rulează `./generate-openapi.ps1` apoi `cd client && npm run gen:api` (R9) și repară erorile
de compilare — fiecare eroare este un drift real care ar fi ajuns în producție.

### 7.2 CNP obligatoriu pe FE, opțional pe BE (P2-5)

```ts
cnp: z.string()
      .regex(cnpRegex, 'CNP-ul trebuie să aibă 13 cifre valide')
      .refine(isValidCnp, 'CNP invalid — cifra de control nu corespunde'),
```

Fără `.optional()` — recepția nu poate înregistra un pacient străin, un nou-născut sau o urgență
fără acte, deși baza, SP-urile și validatorul BE acceptă `NULL`.

**Decizie:** CNP opțional, validat doar dacă e completat (aliniere cu backend-ul, care e sursa
de adevăr a contractului):

```ts
cnp: z.string()
      .refine(v => !v || cnpRegex.test(v), 'CNP-ul trebuie să aibă 13 cifre valide')
      .refine(v => !v || isValidCnp(v), 'CNP invalid — cifra de control nu corespunde')
      .optional().or(z.literal('')),
```

`buildPatientPayload` trimite deja `formData.cnp` direct — schimbă în `toNull(formData.cnp)`.

### 7.3 Limite și obligativități desincronizate (P2-6)

| Câmp | FE (Zod) | BE (FluentValidation) | DB | Efect |
|---|---|---|---|---|
| `insuranceNumber` | max **20** | max 50 | `NVARCHAR(50)` | FE respinge valori pe care backendul le acceptă |
| `emergencyContacts[].relationship` | **opțional** | `NotEmpty()` | `NOT NULL` | Salvare → `400` „Relația este obligatorie”, câmpul nu e marcat în formular |
| `emergencyContacts[].phoneNumber` | opțional (`?? ''`) | `NotEmpty()` | `NOT NULL` | Idem |
| `chronicDiseases` / `notes` | max 2000 | max 2000 | `NVARCHAR(MAX)` | OK |
| `cnp` | obligatoriu | opțional | `NULL` | vezi P2-5 |

Fix: `insuranceNumber` → `.max(50, ...)`; `relationship` și `phoneNumber` devin `.min(1, ...)`
în `emergencyContactSchema`, iar câmpurile primesc marcajul `required` în `PatientFormModal`.

### 7.4 CNP complet în grid și în export (P2-7)

`cnpTemplate` afișează CNP-ul integral pe fiecare rând, iar `buildExportData` îl scrie
necenzurat în fișierul Excel, care pleacă apoi pe email. CNP-ul este identificator național —
principiul minimizării (GDPR art. 5(1)(c)) cere afișarea lui doar unde e necesar.

**Decizie:** mascare în listă și în export, valoare completă în modalul de detalii
(acțiune explicită a utilizatorului, deja protejată de `[HasAccess(Patients, Read)]`).

```ts
// client/src/utils/cnp.ts
/** `1900101221144` → `19••••••1144` — suficient pentru identificare vizuală, nu pentru copiere. */
export const maskCnp = (cnp?: string | null): string =>
  !cnp || cnp.length !== 13 ? '—' : `${cnp.slice(0, 2)}${'•'.repeat(7)}${cnp.slice(-4)}`
```

```tsx
const cnpTemplate = useCallback((row: PatientDto) =>
  row.cnp
    ? <AppBadge variant="primary" mono title="CNP mascat — deschide fișa pentru valoarea completă">
        {maskCnp(row.cnp)}
      </AppBadge>
    : <span className={styles.muted}>—</span>
, [])
```

și în `buildExportData`: `cnp: maskCnp(p.cnp)`.

> Dacă echipa decide că exportul trebuie să conțină CNP-ul complet (raportare CNAS), condiționează-l
> de `hasFull(MODULE.Patients)` și loghează acțiunea în `AuditLogs` cu `Action = 'ExportPii'`.
> Nu lăsa decizia implicită.

### 7.5 `isPrimary` / `isDefault` fără exclusivitate (P2-8)

`PatientFormModal` randează câte un checkbox independent per rând:

```tsx
{...register(`doctors.${idx}.isPrimary`)}
{...register(`emergencyContacts.${idx}.isDefault`)}
```

Nimic — nici FE, nici validatorul BE, nici schema — nu împiedică trei medici primari.
Fix pe toate cele trei niveluri: indexul unic filtrat (§5.5), regula FluentValidation (§4),
și pe FE transformă checkbox-ul în comportament de radio în cadrul array-ului:

```tsx
const handlePrimaryChange = (idx: number) => {
  const current = getValues('doctors') ?? []
  current.forEach((_, i) => setValue(`doctors.${i}.isPrimary`, i === idx, { shouldDirty: true }))
}
```

### 7.6 Invalidări incomplete în hooks

```ts
// useDeletePatient — invalidează doar lista
onSuccess: () => { qc.invalidateQueries({ queryKey: patientKeys.lists() }) }
```

Detaliul pacientului șters rămâne în cache; dacă un alt ecran îl citește, arată date moarte.
Aliniază toate cele trei mutații la `patientKeys.all` (ca `useUpdatePatient`), sau fii explicit:

```ts
export const useDeletePatient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: patientKeys.detail(id) })
      qc.invalidateQueries({ queryKey: patientKeys.lists() })
      qc.invalidateQueries({ queryKey: patientKeys.lookup() })
    },
  })
}
```

---

## 8. Teste

Modulul are azi **un singur fișier de test**: `tests/ValyanClinic.Tests/Validators/CreatePatientCommandValidatorTests.cs`.
Nu există niciun test de handler (Consultațiile au set complet — folosește-le ca șablon,
`CLAUDE.md` §Patterns de test).

### De adăugat în `tests/ValyanClinic.Tests/Handlers/`

| Fișier | Cazuri |
|---|---|
| `CreatePatientCommandHandlerTests.cs` | `ValidCommand → 201`; `UsesClinicIdAndUserIdFromCurrentUser` (`Arg.Is<PatientCreateData>(d => d.ClinicId == ClinicId)`); `CnpDuplicate (50001) → 409`; `GenericSqlError (50999) → 400`; `CollectionsPassedThrough` |
| `UpdatePatientCommandHandlerTests.cs` | `Valid → 200`; `NotFound (50002) → 404`; `CnpDuplicate → 409`; **`Concurrency (50003) → 409`**; `RowVersionForwarded` |
| `DeletePatientCommandHandlerTests.cs` | `Valid → 200`; `NotFound → 404`; **`HasFutureAppointments (50004) → 409`** |
| `GetPatientByIdQueryHandlerTests.cs` | `Exists → 200`; `Null → 404` |
| `GetPatientsQueryHandlerTests.cs` | `MapeazăPagedResult+Stats`; `TrimiteClinicIdCurent` |

### De adăugat în `tests/ValyanClinic.Tests/Validators/`

- `UpdatePatientCommandValidatorTests.cs` — **nu există**; obligatoriu după P0-4.
  Include `Cnp_CuCifraDeControlGresita_ShouldHaveError` (testul care ar fi prins defectul).
- Extinde `CreatePatientCommandValidatorTests.cs`: `BirthDate` în viitor, doi medici primari,
  `doctorId` duplicat, `InsuranceExpiry` în trecut cu `IsInsured = true`.
- `GetPatientsQueryValidatorTests.cs` — `pageSize = 0 / 201 / 1000000` → eroare.

### Frontend (`client/src/__tests__/features/patients/`)

- `patient.schema.test.ts`: CNP gol acceptat (P2-5); `insuranceNumber` de 50 caractere acceptat;
  `relationship` gol respins.
- `patientPayload.test.ts`: `cnp: ''` → `null`; colecțiile goale nu devin `undefined`.
- `PatientsListPage.test.tsx`: CNP randat mascat; coloana afișează `—` pentru `cnp: null`.
- `client/e2e/specs/patients.spec.ts`: adaugă scenariul „creează pacient fără CNP” și
  „șterge + recreează cu același CNP”.

---

## 9. Plan de execuție

Fiecare etapă e un commit separat, verificabil independent.

| # | Etapă | Fișiere | Verificare |
|---|---|---|---|
| 1 | **P0-1** `Patient_GetLookup` + parametri | 1 SQL nou, `IPatientRepository`, `PatientRepository`, query+handler, controller, `usePatients.ts`, `patients.api.ts` | `GET /lookup` → 200 |
| 2 | **Migrarea `0060`** (P0-3, §5.5, §5.6, §5.8, §5.10) | `0060_PatientsHardening.sql` | `.\migrate.ps1` rulează fără eroare pe o bază restaurată din producție |
| 3 | **P0-2** `@ClinicId` în sync-uri + coduri 50003–50007 | 3 SQL, `SqlErrorCodes.cs`, `ErrorMessages.cs`, repo, 2 handlere | test integrare cross-tenant → `50005` |
| 4 | **P0-4** validatoare + `PatientRulesExtensions` | 3 C#, teste noi | `dotnet test` verde |
| 5 | **§5.1–5.4, 5.7, 5.9** rescrierea SP-urilor | `Patient_Create/_Update/_Delete/_GetPaged/_GetById/_ExistsByCnp` | plan de execuție fără scan complet la sortarea implicită |
| 6 | **P1-8** record de date + `PatientPagedQuery` | `IPatientRepository`, `PatientRepository`, 5 handlere | `dotnet build` |
| 7 | **Contract** `./generate-openapi.ps1` + `npm run gen:api` | `openapi-v1.json`, `schema.d.ts` | `npm run check:api` verde |
| 8 | **P2-4, P2-5, P2-6** tipuri + schemă FE | `patient.types.ts`, `patient.schema.ts`, `patientPayload.ts`, `PatientFormModal.tsx` | `npm run lint && npm run build` |
| 9 | **P2-7, P2-8** mascare CNP + exclusivitate | `utils/cnp.ts`, `PatientsListPage.tsx`, `PatientFormModal.tsx` | teste FE |
| 10 | **P1-1 FE** `rowVersion` + tratare `409` | `PatientFormModal.tsx`, `usePatients.ts` | scenariu manual: două taburi, editare concurentă |
| 11 | **Teste** (§8) | `tests/**` | coverage pe `Features/Patients` ≥ nivelul Consultațiilor |

**Reguli pe tot parcursul:**
- Nu modifica migrări deja aplicate (`0014`–`0016`) — tot ce e nou intră în `0060` (R6).
- După orice schimbare de endpoint: `./generate-openapi.ps1` → `cd client && npm run gen:api` (R9).
- Orice cod `THROW` nou trebuie să existe în `SqlErrorCodes.cs` **înainte** de a fi folosit în SQL (R5).
- `ClinicId` vine exclusiv din `ICurrentUser`, niciodată din payload (R1).
- Import neutilizat pe FE = CI roșu (R10).

---

## 10. Ce este deja corect — a nu se „repara”

Aceste decizii sunt bune și trebuie păstrate la refactorizare:

- **Un singur apel SP pentru listă + total + statistici** (`QueryMultipleAsync` cu 3 result sets)
  — evită dublul round-trip; păstrează forma chiar dacă schimbi conținutul result set-ului 3.
- **Tie-break stabil în `ORDER BY`** (`p.LastName, p.FirstName, p.Id`) — fără el, `OFFSET/FETCH`
  poate repeta sau sări rânduri. Comentariul din SP explică de ce; păstrează-l.
- **`OUTER APPLY` pentru numărul de alergii și severitatea maximă** — mai eficient decât subquery
  corelat repetat; menține-l.
- **Blocuri `ORDER BY` separate per tip de date** — un singur `CASE` nu poate întoarce simultan
  `NVARCHAR`, `INT` și `DATE`. Soluția actuală e corectă, chiar dacă pare verbose.
- **`buildPatientPayload` ca implementare unică** pentru creare și editare — comentariul despre
  sub-colecții („nu trimite array-uri goale dacă formularul nu a fost populat”) descrie un pericol real.
- **`useEffect` care închide modalul dacă detaliile nu se încarcă** (`PatientsListPage.tsx`) —
  previne suprascrierea datelor cu valori goale. Corect și rar întâlnit; păstrează-l.
- **Export care refolosește `queryParams`** — exportă exact ce se vede filtrat, nu doar pagina.
- **`XACT_ABORT ON` + `TRY/CATCH` + `;THROW`** în SP-urile de scriere — modelul e corect,
  problema e doar granularitatea tranzacției (§5.2).
- **`[HasAccess(Patients, Full)]` pe `DELETE`** vs `Write` pe `POST`/`PUT` — conform convenției.
- **`PatientCodeSeq` + index unic filtrat pe `PatientCode`** — generarea codului e corectă.
