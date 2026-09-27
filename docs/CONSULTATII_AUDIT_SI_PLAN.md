# Consultații — audit tehnic și plan de remediere

> **Destinatar:** agent de implementare (VS Code) pe repo `Aurelian1974/CMS`.
> **Scop:** livrabil auto-conținut. Fiecare secțiune are *simptom → cauză → fix concret → criteriu de acceptanță*.
> **Data auditului:** 2026-09-27 · **Branch de lucru:** `claude/clever-mendel-c73n47`
> **Următorul număr de migrare liber:** `0059` (ultima aplicată: `0058_DashboardIndexes.sql`).

---

## 0. Rezumat executiv

Modulul Consultații este funcțional, dar are **patru defecte de corectitudine** care produc
pierdere de date medicale sau erori nedeterministe, plus o serie de probleme de performanță,
securitate multi-tenant și întreținere.

| # | Titlu | Severitate | Zonă | Efort |
|---|---|---|---|---|
| P0-1 | Finalizarea consultației eșuează nedeterminist (3 scrieri paralele pe același agregat) | **Critic** | FE + SP | M |
| P0-2 | `Diagnostic` = `NVARCHAR(4000)` dar clientul scrie JSON cu rich-text → salvare respinsă/truncată | **Critic** | SQL + FE | M |
| P0-3 | `Consultation_Create` / `_Update` nu validează apartenența la clinică a `PatientId`/`DoctorId`/`AppointmentId` | **Critic** | SP | S |
| P0-4 | Pierdere silențioasă de date: schimbarea tabului salvează „best effort", fără avertisment la părăsirea paginii | **Major** | FE | M |
| P1-1 | Fără tranzacții / `XACT_ABORT` în SP-urile de scriere → audit log desincronizat | Major | SP | S |
| P1-2 | `Consultation_GetPaged`: sortare non-SARGable, `LIKE` fără escape, filtre duplicate, stats necachate | Major | SP | M |
| P1-3 | Coduri SQL duplicate: `50022` înseamnă două lucruri diferite | Major | C# + SP | S |
| P1-4 | `MERGE` fără `HOLDLOCK` în cele două upsert-uri → race la inserare concurentă | Major | SP | S |
| P1-5 | Fără constrângere de unicitate pe `AppointmentId` → 2 consultații pentru o programare | Major | SQL | S |
| P1-6 | Paginare/validare absente: `@Page`/`@PageSize` nelimitate; `GetByPatient` fără paginare | Mediu | SP | S |
| P2-1 | `ConsultationsListPage.tsx` = 1682 linii, cu `defaultValues` duplicat de 3 ori și payload duplicat de 2 ori | Mediu | FE | L |
| P2-2 | Cod mort: `ConsultationFormModal`, `ConsultationDetailModal` (+ SCSS) nefolosite | Mediu | FE | S |
| P2-3 | State mort (`search`, `page`) — pagina nu are căutare și nici paginare | Mediu | FE | M |
| P2-4 | Query irosit: 50 de consultații descărcate doar ca să rezolve ținta unui delete | Mediu | FE | S |
| P2-5 | Consultația selectată nu e în URL — fără deep-link, fără back, refresh = pierdere context | Mediu | FE | M |
| P2-6 | `useUpdateConsultation` nu invalidează `detail` — invalidarea e împrăștiată manual în pagină | Mediu | FE | S |
| P2-7 | Modale hand-rolled fără focus trap / Escape / `aria-modal` | Mediu | FE a11y | S |
| P2-8 | GUID-uri de status hardcodate în client; nomenclatoare clinice hardcodate în JSX | Mic | FE | S |
| P2-9 | Validări clinice absente (sistolică > diastolică, minime de plauzibilitate) | Mic | BE | S |
| P2-10 | Audit log pentru anamneză/examen scrie `OldValues=NULL, NewValues=NULL` | Mediu | SP | S |

**Ordine de execuție recomandată:** P0-3 → P0-2 → P0-1 → P1-* (într-o singură migrare `0059` + rescrierea SP-urilor) → P0-4 → P2-*.

---

## 1. P0-1 — Finalizarea eșuează nedeterminist

### Simptom
Utilizatorul apasă **Finalizează**. Uneori apare „Eroare la finalizare", deși consultația
*chiar a fost* finalizată (se vede la refresh). Alteori merge. Comportament nereproductibil.

### Cauză
`client/src/api/endpoints/consultations.api.ts` → `update()` lansează **trei scrieri HTTP în paralel**
pe același agregat:

```ts
const [resp] = await Promise.all([
  api.put(`/api/v1/Consultations/${id}`, headerPayload),   // poate seta StatusId = FINALIZATA
  api.put(`/api/v1/Consultations/${id}/anamnesis`, anamnesisPayload),
  api.put(`/api/v1/Consultations/${id}/exam`, examPayload),
])
```

`handleFinalize` (`ConsultationsListPage.tsx`) apelează exact acest `update()` cu
`statusId: CONSULTATION_STATUS_IDS.completed`. Pe server, ambele upsert-uri refuză o consultație
care nu mai e `INLUCRU`:

```sql
-- Consultation_UpsertAnamnesis.sql / Consultation_UpsertExam.sql
IF EXISTS (SELECT 1 FROM dbo.Consultations c
           INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
           WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code <> 'INLUCRU')
BEGIN ;THROW 50021, N'Consultația este finalizată și nu mai poate fi modificată.', 1; END;
```

Dacă PUT-ul de header se comite primul, celelalte două primesc 50021 → 400 → `Promise.all`
respinge → UI afișează eroare deși finalizarea a reușit. Ordinea depinde de scheduler/rețea.

**Efect secundar:** cele trei tranzacții ating simultan rândul din `Consultations`
(header `UPDATE` + cele două `UPDATE dbo.Consultations SET UpdatedAt` din upsert-uri) → risc de deadlock.

### Fix — decizie
Scrierile pe un agregat se **secvențializează**, iar finalizarea devine **o operație dedicată,
atomică pe server**, nu un `UPDATE` cu `statusId` strecurat în payload.

**1.a — `consultations.api.ts`: serializează update-ul, sub-resursele întâi.**

```ts
update: async ({ id, ...data }: UpdateConsultationPayload): Promise<ApiResponse<boolean>> => {
  const headerPayload    = omit(data, [...ANAMNESIS_FIELDS, ...EXAM_FIELDS])
  const anamnesisPayload = pick(data, ANAMNESIS_FIELDS)
  const examPayload      = pick(data, EXAM_FIELDS)

  // Sub-secțiunile se scriu ÎNAINTE de header: header-ul poate schimba statusul,
  // iar upsert-urile refuză orice status ≠ INLUCRU (THROW 50021).
  await api.put(`/api/v1/Consultations/${id}/anamnesis`, anamnesisPayload)
  await api.put(`/api/v1/Consultations/${id}/exam`, examPayload)
  return api.put(`/api/v1/Consultations/${id}`, headerPayload) as Promise<ApiResponse<boolean>>
},
```

**1.b — endpoint dedicat de finalizare** (elimină definitiv cursa și mută regula pe server):

- `POST /api/v1/Consultations/{id}/finalize` → `FinalizeConsultationCommand(Guid Id)`
- Handler nou în `Features/Consultations/Commands/FinalizeConsultation/`, după tiparul din §2c
  al `CLAUDE.md` (prinde `ConsultationNotFound` → 404, `ConsultationLocked` → **409**, restul → 400).
- SP nou `Consultation_Finalize.sql` (vezi §9.4): validează tranziția `INLUCRU → FINALIZATA`
  într-o singură tranzacție și verifică prezența câmpurilor obligatorii clinic.
- `[HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]`.

**1.c — `handleFinalize` în pagină** devine: salvează tot prin `update()` (fără `statusId`),
apoi apelează `consultationsApi.finalize(id)`. Elimină cele ~50 de linii de payload duplicat.

**1.d** — scoate `StatusId` din `UpdateConsultationRequest` / `UpdateConsultationCommand` /
`ConsultationUpdateData` / `Consultation_Update.sql`. Statusul se schimbă exclusiv prin fluxuri
dedicate (finalizare, facturare, blocare). Aliniază `ValidCommand()` / `MinimalValid()` din
`tests/ValyanClinic.Tests/Handlers/UpdateConsultationCommandHandlerTests.cs` și
`Validators/` (R8 din `CLAUDE.md`).

### Acceptanță
- Finalizare de 20 de ori consecutiv pe consultații diferite → 20/20 succes, zero „Eroare la finalizare".
- Test de handler: `Handle_ConsultationLocked_ReturnsConflict` → `StatusCode == 409`.
- Test: `Consultation_Finalize` pe o consultație `FINALIZATA` aruncă `50021`.

---

## 2. P0-2 — `Diagnostic` nu încape în coloană

### Simptom
La consultații cu diagnostic ICD-10 + detalii bogate, salvarea eșuează cu
„Diagnosticul nu poate depăși 4000 de caractere" — deși textul vizibil e scurt. În alte cazuri,
eroare 500 nemapată.

### Cauză
Clientul **serializează un obiect JSON întreg în câmpul text `diagnostic`**:

```ts
// ConsultationsListPage.tsx — handleSaveDraft și handleFinalize (duplicat)
const diagnosticData = primaryDiagCode
  ? JSON.stringify({ primaryCode: primaryDiagCode, primaryDetails: primaryDiagDetails, secondaryDiagnoses })
  : values.diagnostic || null
```

- `primaryCode` = obiect `ICD10SearchResult` complet (cod + descrieri);
- `primaryDetails` = **HTML** produs de editorul rich-text;
- `secondaryDiagnoses` = array de obiecte, fiecare cu propriul array `icd10Codes`.

Coloana, însă, a rămas la lățimea din `0031_CreateConsultations.sql` — nicio migrare nu a lărgit-o:

```sql
Diagnostic      NVARCHAR(4000)   NULL,
```

Două moduri de eșec: FluentValidation respinge la >4000 (mesaj derutant), iar dacă s-ar trece de
validator, SQL Server dă eroarea 8152 („String or binary data would be truncated") — în afara
intervalului 50000–59999, deci **neprinsă** de niciun `catch` din handler.

În plus, `zod` validează `diagnostic` (max 4000) pe *textul din formular*, nu pe blob-ul JSON
efectiv trimis — verificarea nu protejează nimic.

### Fix — decizie
Două straturi: reparație imediată (lățime), apoi normalizare (modelul corect).

**2.a — imediat (migrarea 0059):** lărgește coloana și aliniază validatoarele.

```sql
ALTER TABLE dbo.Consultations ALTER COLUMN Diagnostic NVARCHAR(MAX) NULL;
```

În `UpdateConsultationCommandValidator` și `CreateConsultationCommandValidator`, ridică limita
pentru `Diagnostic` la 100000 (protecție anti-abuz, nu anti-truncare) și adaugă aceeași regulă
în `consultation.schema.ts`. **Notă:** `Diagnostic` intră în indexul de căutare `LIKE` din
`GetPaged`; `NVARCHAR(MAX)` nu poate fi inclus într-un index nonclustered — vezi §9.2, unde
căutarea pe diagnostic trece pe coloana normalizată.

**2.b — normalizare (recomandat, aceeași migrare).** Un JSON într-o coloană de text înseamnă
zero raportare pe cod ICD-10, zero interogare pe diagnostic, zero export CNAS. Codurile
trebuie relaționale:

```sql
CREATE TABLE dbo.ConsultationDiagnoses (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ConsultationId  UNIQUEIDENTIFIER NOT NULL,
    ClinicId        UNIQUEIDENTIFIER NOT NULL,   -- denormalizat: filtrare directă (R1)
    Icd10Code       NVARCHAR(10)     NOT NULL,
    Icd10Description NVARCHAR(500)   NULL,       -- snapshot la momentul consultației
    IsPrimary       BIT              NOT NULL DEFAULT 0,
    Details         NVARCHAR(MAX)    NULL,       -- rich-text per diagnostic
    SortOrder       INT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy       UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_ConsultationDiagnoses PRIMARY KEY (Id),
    CONSTRAINT FK_ConsultationDiagnoses_Consultation
        FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE
);

-- Un singur diagnostic principal per consultație
CREATE UNIQUE INDEX UX_ConsultationDiagnoses_Primary
    ON dbo.ConsultationDiagnoses (ConsultationId) WHERE IsPrimary = 1;

CREATE NONCLUSTERED INDEX IX_ConsultationDiagnoses_ClinicId_Code
    ON dbo.ConsultationDiagnoses (ClinicId, Icd10Code) INCLUDE (ConsultationId, IsPrimary);
```

`Icd10Description` e **snapshot intenționat**: nomenclatorul ICD-10 se actualizează, dar un act
medical semnat trebuie să rămână citibil exact cum a fost emis.

Migrarea face și **backfill** din JSON-ul existent cu `OPENJSON` (vezi §9.1). Coloanele
`Diagnostic` / `DiagnosticCodes` rămân pe loc ca *fallback de citire* pentru rândurile vechi;
se marchează deprecate în comentariu și se elimină într-o migrare ulterioară, după ce FE nu le
mai scrie. `Diagnostic` păstrează rolul de rezumat text liber al diagnosticului.

### Acceptanță
- Salvare cu 1 diagnostic principal + 3 secundare, fiecare cu ~2000 caractere de detalii → succes.
- `SELECT` pe `ConsultationDiagnoses` returnează un rând per cod, `IsPrimary = 1` exact o dată.
- Backfill: numărul de consultații cu `Diagnostic` JSON valid == numărul de `ConsultationId` distincte în tabelul nou.

---

## 3. P0-3 — Lipsă validare de tenancy pe cheile străine

### Simptom
Un utilizator autentificat al clinicii A poate crea o consultație care referă un **pacient al
clinicii B**, trimițând un `patientId` arbitrar. Numele pacientului străin apare apoi în listele
clinicii A (join-urile din `GetPaged` / `GetById` nu filtrează `p.ClinicId`).

### Cauză
`ClinicId` vine corect din `ICurrentUser` (handler-ele sunt în regulă), dar SP-urile inserează
`@PatientId` / `@DoctorId` / `@AppointmentId` **fără să verifice că aparțin lui `@ClinicId`**.
Cheile străine garantează doar existența rândului, nu apartenența la tenant.

### Fix
În `Consultation_Create` și `Consultation_Update`, înainte de `INSERT`/`UPDATE`:

```sql
IF NOT EXISTS (SELECT 1 FROM dbo.Patients
               WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
BEGIN ;THROW 50002, N'Pacientul nu a fost găsit.', 1; END;

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
               WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
BEGIN ;THROW 50300, N'Medicul nu a fost găsit.', 1; END;

IF @AppointmentId IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM dbo.Appointments
       WHERE Id = @AppointmentId AND ClinicId = @ClinicId AND IsDeleted = 0
         AND PatientId = @PatientId)   -- programarea trebuie să fie a aceluiași pacient
BEGIN ;THROW 50011, N'Programarea nu a fost găsită.', 1; END;
```

Codurile `50002` / `50300` / `50011` există deja în `SqlErrorCodes.cs`
(`PatientNotFound`, `DoctorNotFound`, `AppointmentNotFound`). Adaugă în
`CreateConsultationCommandHandler` / `UpdateConsultationCommandHandler` clauze `catch` dedicate
care le mapează la **404**, înaintea clauzei generice.

Verifică dacă `Doctors` are coloană `ClinicId`; dacă medicii sunt legați prin
`Departments`/`ClinicLocations`, adaptează `EXISTS`-ul la acel lanț — **nu elimina verificarea**.

### Acceptanță
- Test de integrare: POST cu `patientId` dintr-o altă clinică → 404, zero rânduri inserate.
- Același test pentru `doctorId` și pentru `appointmentId`.

---

## 4. P0-4 — Pierdere silențioasă de date medicale

### Simptom
Medicul completează anamneza, apasă direct pe alt element din aplicație (sau închide tabul) →
textul e pierdut fără niciun avertisment. Dacă salvarea automată la schimbarea tabului eșuează,
se afișează o bandă de eroare, dar **navigarea continuă** și datele nescrise se pierd la
următorul refetch.

### Cauză
`handleTabChange` documentează explicit „Eșuarea NU blochează navigarea", iar pagina nu are
nicio protecție la părăsire. Salvarea se produce *doar* la schimbarea tabului — nu există
autosave pe interval și nici la `blur`.

### Fix — decizie
Trei măsuri, în ordinea raportului valoare/efort:

**4.a — blochează navigarea la eșec.** Dacă salvarea tabului anterior eșuează, rămâi pe tab și
afișează eroarea. Un eșec de scriere pe fișa medicală nu e un eveniment din care se navighează.

```ts
try {
  await saveTab(previousTab)
} catch (err) {
  setServerError(err instanceof Error ? err.message : 'Eroare la salvare automată.')
  return   // ← NU schimba tabul
}
setActiveTab(newTab)
```

**4.b — gardă la părăsirea paginii** cât timp `form.formState.isDirty`:

```ts
useEffect(() => {
  if (!isDirty) return
  const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
  window.addEventListener('beforeunload', onBeforeUnload)
  return () => window.removeEventListener('beforeunload', onBeforeUnload)
}, [isDirty])
```

Plus `useBlocker` (react-router 6.4+) pentru navigarea internă, cu modal de confirmare.

**4.c — autosave cu debounce** (30 s) pe consultațiile `INLUCRU`, reutilizând `useDebounce`
din `client/src/hooks/`, cu indicator vizibil „Salvat la HH:MM". Salvează doar dacă `isDirty`.

**4.d** — curăță cele trei `setTimeout(() => setSuccessMsg(null), 4000)` fără `clearTimeout`:
mută-le într-un `useEffect` cu cleanup, altfel se face `setState` după unmount.

### Acceptanță
- Salvare eșuată (mock 500) la schimbarea tabului → tabul **nu** se schimbă, eroarea e vizibilă.
- Cu modificări nesalvate, `beforeunload` declanșează dialogul nativ.
- Zero warning-uri React de tip „state update on unmounted component" în suita de teste.

---

## 5. P1 — Corectitudine și performanță SQL

### 5.1 Fără tranzacții (P1-1)
Fiecare SP de scriere face 2–3 `INSERT`/`UPDATE` (entitate + `AuditLogs` + sincronizare
`UpdatedAt`) **fără tranzacție explicită și fără `SET XACT_ABORT ON`**. Un eșec între ele lasă
entitatea modificată fără înregistrare de audit — inacceptabil pentru o fișă medicală.

**Fix:** șablon uniform pentru toate SP-urile de scriere (Create/Update/Delete/Upsert*/Finalize):

```sql
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;      -- orice eroare derulează tranzacția

    BEGIN TRY
        BEGIN TRANSACTION;
        /* validări + scrieri + audit */
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;              -- păstrează numărul original (SqlErrorCodes)
    END CATCH
END;
```

`THROW` fără argumente re-aruncă eroarea originală cu `ex.Number` intact — clauzele
`catch (SqlException ex) when (ex.Number == ...)` din handlere continuă să funcționeze.

### 5.2 `Consultation_GetPaged` (P1-2)
Patru probleme în același SP:

1. **Sortare non-SARGable.** Cele două blocuri `CASE WHEN @SortDir = ...` cu
   `CONVERT(NVARCHAR(30), Date, 126)` forțează conversia fiecărui rând la text și fac inutil
   `IX_Consultations_ClinicId_Date`. Rezultat: sortare completă a setului la fiecare pagină.
2. **`LIKE` fără escape.** `LIKE '%' + @Search + '%'` tratează `%`, `_`, `[` ca metacaractere.
   O căutare după `100_A` returnează rezultate greșite.
3. **Filtre duplicate.** Predicatele sunt scrise de două ori (CTE + `COUNT`), în forme diferite
   (`JOIN` vs `EXISTS`) — deja au început să divergă; orice filtru nou trebuie ținut sincron manual.
4. **Statistici la fiecare pagină.** Result set 3 scanează întreaga tabelă a clinicii, ignoră
   filtrele, și se recalculează la fiecare schimbare de pagină.

**Fix:** vezi SP-ul rescris în §9.2. Deciziile:
- sortare prin `ROW_NUMBER()` peste coloanele native (fără `CONVERT`), cu whitelist de `@SortBy`;
- `@Search` normalizat o singură dată, cu `ESCAPE`:
  `SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');`
  `SET @SearchPattern = N'%' + REPLACE(REPLACE(REPLACE(@Search, N'[', N'[[]'), N'%', N'[%]'), N'_', N'[_]') + N'%';`
- filtrele scrise **o singură dată** într-un `#Filtered` (tabelă temporară cu `Id`), reutilizat
  de toate cele trei result set-uri;
- `@PageSize` plafonat: `SET @PageSize = CASE WHEN @PageSize BETWEEN 1 AND 200 THEN @PageSize ELSE 20 END;`
  și `SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;` (altfel `OFFSET` negativ = eroare);
- `OPTION (RECOMPILE)` pe interogarea catch-all cu parametri opționali — evită reutilizarea unui
  plan generat pentru alt set de filtre;
- statisticile se calculează pe setul **filtrat** (coerent cu ce vede utilizatorul).

### 5.3 Coduri SQL duplicate (P1-3)
`SqlErrorCodes.InvestigationTypeInvalid = 50022`, dar `Consultation_Delete.sql` aruncă tot
`50022` pentru „consultația este blocată/facturată" și pentru „are încasări înregistrate".
Trei înțelesuri, un singur cod — capcană latentă pentru orice `catch` viitor.

**Fix:** alocă în `SqlErrorCodes.cs` (intervalul `500xx` are locuri libere după `50028`):

```csharp
public const int ConsultationHasPayments   = 50029;  // încasări → nu se poate șterge
public const int ConsultationDeleteBlocked = 50032;  // blocată/facturată → nu se poate șterge
```

Actualizează `Consultation_Delete.sql` să le folosească și adaugă în
`DeleteConsultationCommandHandler` mapare la **409 Conflict** (`Result<bool>.Conflict(...)`),
nu 400 — este un conflict de stare, nu o cerere invalidă. Același tratament pentru
`ConsultationLocked` (50021) în handlerele de Update/Anamnesis/Exam.

Adaugă mesajele în `ErrorMessages.Consultation`:
```csharp
public const string DeleteBlocked = "Consultația este blocată sau facturată și nu poate fi ștearsă.";
public const string HasPayments   = "Consultația are încasări înregistrate și nu poate fi ștearsă.";
public const string Locked        = "Consultația nu mai este în lucru și nu poate fi modificată.";
```

Mesajul actual al lui 50021 — „Consultația este finalizată și nu mai poate fi modificată" — e
inexact când statusul e `BLOCATA` sau `FACTURATA`. Înlocuiește-l cu `Locked` de mai sus.

### 5.4 `MERGE` fără `HOLDLOCK` (P1-4)
Ambele upsert-uri folosesc `MERGE ... ON t.ConsultationId = s.ConsultationId` fără hint de
blocare. Sub concurență, două sesiuni pot trece amândouă pe ramura `NOT MATCHED` → violare de
cheie primară. Scenariul e real aici: `update()` din client atinge ambele sub-resurse, iar
autosave-ul poate suprapune cereri.

**Fix:** `MERGE dbo.ConsultationAnamnesis WITH (HOLDLOCK) AS t` (idem pentru `ConsultationExam`).

### 5.5 Unicitate pe `AppointmentId` (P1-5)
`IX_Consultations_AppointmentId` este **nonunique**. Două taburi de browser care deschid aceeași
programare pot crea două consultații (`handleSelectAppointment` verifică existența, dar verificarea
și crearea nu sunt atomice). Apoi `Consultation_GetByAppointmentId` face:

```sql
SELECT @Id = Id FROM dbo.Consultations WHERE AppointmentId = @AppointmentId AND ClinicId = @ClinicId AND IsDeleted = 0;
```

— cu mai multe rânduri, `@Id` primește **arbitrar** unul dintre ele. Medicul poate ajunge, la
deschideri succesive, pe fișe diferite.

**Fix (migrarea 0059):**
```sql
CREATE UNIQUE NONCLUSTERED INDEX UX_Consultations_AppointmentId
    ON dbo.Consultations (AppointmentId)
    WHERE AppointmentId IS NOT NULL AND IsDeleted = 0;
```
Migrarea trebuie să **de-duplice întâi** (vezi §9.1): păstrează cea mai veche consultație pe
fiecare programare și pune `AppointmentId = NULL` pe restul, ca să nu pierzi acte medicale.
În `Consultation_Create`, adaugă verificarea explicită care returnează un mesaj lizibil în loc de
eroarea de index:

```sql
IF @AppointmentId IS NOT NULL AND EXISTS (
       SELECT 1 FROM dbo.Consultations
       WHERE AppointmentId = @AppointmentId AND ClinicId = @ClinicId AND IsDeleted = 0)
BEGIN ;THROW 50033, N'Există deja o consultație pentru această programare.', 1; END;
```
(`SqlErrorCodes.ConsultationAppointmentDuplicate = 50033` → **409 Conflict**.)

### 5.6 Paginare și limite (P1-6)
- `Consultation_GetByPatient` întoarce **tot** istoricul, fără paginare. Adaugă `@Page`/`@PageSize`
  (implicit 1/20) și un al doilea result set cu `COUNT`. Actualizează `IConsultationRepository`,
  handler-ul și apelanții.
- `Consultation_GetById` / `_GetByAppointmentId`: `INNER JOIN dbo.InvestigationTypeDefinitions`
  pe result set-ul 4 **ascunde investigațiile** al căror tip a fost redenumit sau șters.
  Schimbă în `LEFT JOIN` și `ISNULL(td.DisplayName, i.InvestigationType)`.
- `Consultation_GetById` filtrează `c.IsDeleted = 0`, în timp ce `CLAUDE.md` §GetById documentează
  că entitățile șterse *se întorc* pentru vizualizare. Codul e cel corect pentru acest modul
  (o fișă ștearsă nu trebuie deschisă); **actualizează documentul**, nu SP-ul.

### 5.7 Audit inutilizabil pentru anamneză/examen (P2-10)
```sql
INSERT INTO dbo.AuditLogs (..., OldValues, NewValues, ChangedBy)
VALUES (@ClinicId, N'ConsultationAnamnesis', @ConsultationId, N'Upsert', NULL, NULL, @UpdatedBy);
```
Un audit fără valori nu răspunde la „ce s-a schimbat în fișă și când" — exact întrebarea pentru
care există auditul într-un sistem medical. Capturează `@OldValues` înainte de `MERGE` și
`@NewValues` după, cu `FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`, ca în `Consultation_Update`.

---

## 6. P2 — Frontend: structură și UX

### 6.1 Descompunerea paginii (P2-1)
`ConsultationsListPage.tsx` are **1682 de linii**: layout, 7 taburi, 2 modale, helpers, iconuri
SVG inline și logica de salvare. Consecințe concrete deja vizibile: obiectul `defaultValues`
(~15 linii) apare **de trei ori** identic, iar payload-ul de salvare apare **de două ori**
(`handleSaveDraft` și `handleFinalize`) — orice câmp nou trebuie adăugat în cinci locuri.

**Structura țintă:**

```
features/consultations/
├── pages/ConsultationsWorkbenchPage.tsx        // ~200 linii: layout + orchestrare
├── components/
│   ├── AppointmentsSidebar/                    // programările zilei
│   ├── HistorySidebar/                         // istoric + grupare pe medic
│   ├── ConsultationTabs/
│   │   ├── AnamnezaTab.tsx
│   │   ├── ExamenClinicTab.tsx
│   │   ├── DiagnosticTab.tsx
│   │   └── ConcluziiTab.tsx
│   ├── ConsultationActionBar.tsx
│   └── ConfirmDialog.tsx                       // reutilizabil (finalizare + ștergere)
├── hooks/
│   ├── useConsultationForm.ts                  // useForm + reset + defaults (o singură dată)
│   ├── useConsultationAutosave.ts              // debounce + isDirty + indicator
│   └── useConsultationPayload.ts               // form → payload (o singură dată)
└── constants/consultationDefaults.ts           // EMPTY_CONSULTATION_FORM
```

Regulă de lucru: `EMPTY_CONSULTATION_FORM` definit o dată și importat; maparea
`ConsultationFormData → payload` într-o singură funcție pură, testabilă separat.

Redenumirea paginii e opțională, dar `ListPage` e un nume greșit — ecranul e un workbench
master-detail, nu o listă. Dacă o faci, actualizează `AppRoutes.tsx` și testele.

### 6.2 Cod mort (P2-2)
`components/ConsultationFormModal/` (268 linii + SCSS) și `components/ConsultationDetailModal/`
(196 linii + SCSS) **nu sunt importate nicăieri**. Șterge-le. Verifică înainte:
```bash
grep -rn "ConsultationFormModal\|ConsultationDetailModal" client/src --include=*.tsx --include=*.ts
```

### 6.3 State mort și query irosit (P2-3, P2-4)
```ts
const [search] = useState('')   // fără setter — niciodată ≠ ''
const [page]   = useState(1)    // fără setter — niciodată ≠ 1
```
Pagina nu are nici căutare, nici paginare, deși testul existent
(`ConsultationsListPage.test.tsx`) își documentează în antet verificarea „Sidebar: search,
status chips". **Decizie:** implementează căutarea (input debounced legat de `search`, propagat
la `useConsultations`) și paginarea istoricului (infinite scroll sau „Încarcă mai multe") —
o listă limitată la 50 de rânduri fără căutare devine inutilizabilă după câteva luni de
activitate. Actualizează apoi testul să reflecte realitatea.

Query-ul `consultations` (50 de rânduri) este folosit **într-un singur loc**, la linia 1567, ca
să găsească obiectul pentru dialogul de ștergere:
```ts
onClick={() => { const c = consultations.find(x => x.id === selectedId); if (c) setDeleteTarget(c) }}
```
`detail` conține deja tot ce trebuie. Elimină query-ul și tipizează `deleteTarget` ca
`{ id: string; patientName: string }`, construit din `detail`.

### 6.4 Routing (P2-5)
Ruta e `/consultations`, fără parametru. Consultația selectată trăiește doar în `useState`:
fără deep-link, fără back, refresh = pierdere de context. Adaugă
`/consultations/:id?` și sincronizează `selectedId` cu `useParams()` / `navigate()`.

### 6.5 Invalidări în hook, nu în pagină (P2-6)
`useUpdateConsultation.onSuccess` invalidează doar `lists()`, motiv pentru care pagina apelează
manual `qc.invalidateQueries({ queryKey: consultationKeys.detail(selectedId) })` în patru locuri.
Mută invalidarea în hook, după tiparul din `CLAUDE.md` §3:

```ts
export const useUpdateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateConsultationPayload) => consultationsApi.update(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
      qc.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) })
    },
  })
}
```
La `useDeleteConsultation`, adaugă `qc.removeQueries({ queryKey: consultationKeys.detail(id) })`.
Scoate apoi invalidările manuale din pagină.

### 6.6 Accesibilitate (P2-7)
Cele două modale (finalizare, ștergere) sunt `<div className="modal d-block" role="dialog">`
fără focus trap, fără închidere pe `Escape`, fără `aria-modal="true"` și fără
`aria-labelledby`. Extrage un `ConfirmDialog` comun care le implementează pe toate patru,
returnează focusul la elementul declanșator și e folosit de ambele fluxuri.

Adaugă și: `aria-live="polite"` pe banda de succes/eroare, `aria-current` pe tabul activ,
`role="tablist"`/`role="tab"`/`aria-selected` pe navigația de taburi.

### 6.7 Constante duplicate (P2-8)
```ts
const CONSULTATION_STATUS_IDS = {
  draft: 'c2000000-0000-0000-0000-000000000001', ...
}
```
Duplică `ConsultationStatusIds.cs` și **omite** `FACTURATA`. Filtrarea trebuie să se facă pe
`statusCode`, nu pe GUID: expune codurile prin API (sau un endpoint de nomenclator
`GET /api/v1/Consultations/statuses`) și elimină GUID-urile din client.

Vocabularele clinice sunt hardcodate inline în JSX, în cinci locuri
(`['Bună','Relativ bună','Satisfăcătoare',…]`, tegumente, mucoase, edeme, ganglioni). Mută-le
minimal într-un `constants/clinicalVocabularies.ts`; ideal, într-un nomenclator în BD, ca să fie
editabile fără redeploy.

### 6.8 Validări clinice (P2-9)
`UpdateConsultationExamCommandValidator` acceptă valori imposibile: `Puls = 0`,
`TensiuneSistolica = 0`, `Greutate = 0`. Limita inferioară `0` nu are sens clinic pentru un
pacient examinat. Propune:

```csharp
RuleFor(x => x.Puls).InclusiveBetween(20, 300).When(x => x.Puls.HasValue);
RuleFor(x => x.TensiuneSistolica).InclusiveBetween(40, 300).When(x => x.TensiuneSistolica.HasValue);
RuleFor(x => x.TensiuneDiastolica).InclusiveBetween(20, 200).When(x => x.TensiuneDiastolica.HasValue);
RuleFor(x => x.Greutate).InclusiveBetween(0.5m, 500m).When(x => x.Greutate.HasValue);
RuleFor(x => x.Inaltime).InclusiveBetween(20, 250).When(x => x.Inaltime.HasValue);
RuleFor(x => x.FrecventaRespiratorie).InclusiveBetween(5, 100).When(x => x.FrecventaRespiratorie.HasValue);

// Validare încrucișată — lipsește complet azi
RuleFor(x => x)
    .Must(x => x.TensiuneSistolica > x.TensiuneDiastolica)
    .WithMessage("Tensiunea sistolică trebuie să fie mai mare decât cea diastolică.")
    .When(x => x.TensiuneSistolica.HasValue && x.TensiuneDiastolica.HasValue);
```

Oglindește limitele în `consultation.schema.ts` (azi câmpurile numerice nu au **nicio** limită
în zod), ca utilizatorul să primească feedback înainte de round-trip.

---

## 7. Ce este deja corect (a nu se „repara")

- Separarea `ClinicId` din `ICurrentUser`, niciodată din payload — corectă în toate handlerele.
- `Consultation_Update` / upsert-urile impun read-only pe server pentru statusuri ≠ `INLUCRU`.
  Regula nu trăiește doar în UI — exact cum trebuie.
- `flattenDetail` / `pick` / `omit` în `consultations.api.ts` sunt documentate ca excepție de la
  pattern și chiar sunt justificate de split-ul din migrarea 0035.
- `syncedDetailIdRef` previne suprascrierea a ceea ce tastează utilizatorul la refetch —
  soluție corectă pentru o problemă reală.
- Soft delete, coloanele de audit și `THROW` (nu `RAISERROR`) sunt aplicate consecvent.
- Absența `dangerouslySetInnerHTML` pentru conținutul rich-text.

---

## 8. Plan de execuție

### Etapa 1 — securitate și integritate (blocant)
1. `0059_ConsultationsHardening.sql` (§9.1): de-duplicare `AppointmentId`, index unic,
   `Diagnostic → NVARCHAR(MAX)`, tabelul `ConsultationDiagnoses` + backfill, index de suport.
2. Validări de tenancy în `Consultation_Create` / `_Update` (§3).
3. `XACT_ABORT` + `TRY/CATCH/TRANSACTION` în toate SP-urile de scriere (§5.1).
4. `HOLDLOCK` pe cele două `MERGE` (§5.4).
5. Coduri noi în `SqlErrorCodes.cs` + `ErrorMessages.cs`, mapare la 409 (§5.3).

### Etapa 2 — corectitudinea fluxului
6. Endpoint + SP de finalizare; scoaterea lui `StatusId` din update (§1).
7. Serializarea scrierilor în `consultations.api.ts` (§1.a).
8. Blocarea navigării la eșec + `beforeunload` + autosave (§4).
9. `Consultation_GetPaged` rescris (§9.2).

### Etapa 3 — întreținere
10. Ștergerea codului mort (§6.2); eliminarea query-ului irosit (§6.3).
11. Descompunerea paginii (§6.1) — de făcut într-un PR separat, fără alte schimbări de comportament.
12. Căutare + paginare; rută cu `:id`; invalidări în hook; `ConfirmDialog` accesibil.
13. Validări clinice BE + FE (§6.8).

### După fiecare etapă
```bash
dotnet build && dotnet test tests/ValyanClinic.Tests
cd client && npm run lint && npm run test:unit && npm run build
# R9 — contractul OpenAPI, obligatoriu după orice schimbare de endpoint:
./generate-openapi.ps1 && cd client && npm run gen:api && npm run check:api
```
`npm run check:api` pică în CI dacă schema nu a fost regenerată după adăugarea endpoint-ului de
finalizare sau după scoaterea lui `StatusId` din `UpdateConsultationRequest`.

### Teste de adăugat
- `FinalizeConsultationCommandHandlerTests`: succes 200, `ConsultationNotFound` → 404,
  `ConsultationLocked` → 409.
- `UpdateConsultationCommandHandlerTests`: `PatientNotFound` → 404 (tenancy).
- `DeleteConsultationCommandHandlerTests`: `ConsultationHasPayments` → 409.
- `UpdateConsultationExamCommandValidatorTests`: sistolică ≤ diastolică → eroare.
- FE: `consultations.api.test.ts` — `update()` apelează anamnesis și exam **înainte** de header.
- FE: schimbarea tabului cu salvare eșuată nu schimbă tabul.

Conform R8: orice câmp adăugat/eliminat în `ConsultationCreateData`/`ConsultationUpdateData`
cere actualizarea builderelor `ValidCommand()` / `MinimalValid()` din teste — compilarea le cere,
dar mock-urile `Arg.Any<ConsultationCreateData>()` rămân valabile.

---

## 9. Artefacte SQL

### 9.1 `0059_ConsultationsHardening.sql`

```sql
-- ============================================================================
-- Migrare: 0059_ConsultationsHardening
-- 1) De-duplicare consultații pe aceeași programare + index unic
-- 2) Diagnostic → NVARCHAR(MAX)
-- 3) Tabel ConsultationDiagnoses (normalizare ICD-10) + backfill din JSON
-- ============================================================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ── 1. De-duplicare AppointmentId ───────────────────────────────────────────
-- Păstrăm cea mai veche consultație per programare; restul rămân ca acte
-- medicale valide, dar fără legătura la programare (nu ștergem nimic).
;WITH Ranked AS (
    SELECT Id,
           ROW_NUMBER() OVER (PARTITION BY ClinicId, AppointmentId
                              ORDER BY CreatedAt ASC, Id ASC) AS rn
    FROM dbo.Consultations
    WHERE AppointmentId IS NOT NULL AND IsDeleted = 0
)
UPDATE c SET AppointmentId = NULL
FROM dbo.Consultations c
INNER JOIN Ranked r ON r.Id = c.Id
WHERE r.rn > 1;
GO

IF EXISTS (SELECT 1 FROM sys.indexes
           WHERE name = 'IX_Consultations_AppointmentId'
             AND object_id = OBJECT_ID('dbo.Consultations'))
    DROP INDEX IX_Consultations_AppointmentId ON dbo.Consultations;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_Consultations_AppointmentId'
                 AND object_id = OBJECT_ID('dbo.Consultations'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_Consultations_AppointmentId
        ON dbo.Consultations (AppointmentId)
        WHERE AppointmentId IS NOT NULL AND IsDeleted = 0;
    PRINT 'Index unic UX_Consultations_AppointmentId creat.';
END
GO

-- ── 2. Diagnostic → NVARCHAR(MAX) ───────────────────────────────────────────
-- Clientul serializează un obiect ICD-10 (cu rich-text) în această coloană;
-- 4000 de caractere sunt insuficiente și produceau eroarea 8152.
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Consultations')
             AND name = 'Diagnostic' AND max_length <> -1)
BEGIN
    ALTER TABLE dbo.Consultations ALTER COLUMN Diagnostic NVARCHAR(MAX) NULL;
    PRINT 'Coloana Consultations.Diagnostic lărgită la NVARCHAR(MAX).';
END
GO

-- ── 3. Tabel ConsultationDiagnoses ──────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES
               WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ConsultationDiagnoses')
BEGIN
    CREATE TABLE dbo.ConsultationDiagnoses (
        Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        ConsultationId   UNIQUEIDENTIFIER NOT NULL,
        ClinicId         UNIQUEIDENTIFIER NOT NULL,
        Icd10Code        NVARCHAR(10)     NOT NULL,
        Icd10Description NVARCHAR(500)    NULL,
        IsPrimary        BIT              NOT NULL DEFAULT 0,
        Details          NVARCHAR(MAX)    NULL,
        SortOrder        INT              NOT NULL DEFAULT 0,
        CreatedAt        DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
        CreatedBy        UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_ConsultationDiagnoses PRIMARY KEY (Id),
        CONSTRAINT FK_ConsultationDiagnoses_Consultation
            FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ConsultationDiagnoses_Clinics
            FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_ConsultationDiagnoses_Primary
        ON dbo.ConsultationDiagnoses (ConsultationId) WHERE IsPrimary = 1;

    CREATE NONCLUSTERED INDEX IX_ConsultationDiagnoses_Consultation
        ON dbo.ConsultationDiagnoses (ConsultationId)
        INCLUDE (Icd10Code, IsPrimary, SortOrder);

    CREATE NONCLUSTERED INDEX IX_ConsultationDiagnoses_ClinicId_Code
        ON dbo.ConsultationDiagnoses (ClinicId, Icd10Code)
        INCLUDE (ConsultationId, IsPrimary);

    PRINT 'Tabel ConsultationDiagnoses creat.';
END
ELSE
    PRINT 'Tabel ConsultationDiagnoses există deja — ignorat.';
GO

-- ── 4. Backfill din JSON-ul existent ────────────────────────────────────────
-- Diagnostic principal
INSERT INTO dbo.ConsultationDiagnoses
    (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, Details, SortOrder, CreatedBy)
SELECT
    c.Id, c.ClinicId,
    JSON_VALUE(c.Diagnostic, '$.primaryCode.code'),
    JSON_VALUE(c.Diagnostic, '$.primaryCode.shortDescriptionRo'),
    1,
    JSON_VALUE(c.Diagnostic, '$.primaryDetails'),
    0,
    c.CreatedBy
FROM dbo.Consultations c
WHERE c.Diagnostic IS NOT NULL
  AND ISJSON(c.Diagnostic) = 1
  AND JSON_VALUE(c.Diagnostic, '$.primaryCode.code') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses d
                  WHERE d.ConsultationId = c.Id AND d.IsPrimary = 1);
GO

-- Diagnostice secundare (fiecare cu propriul array icd10Codes)
INSERT INTO dbo.ConsultationDiagnoses
    (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, Details, SortOrder, CreatedBy)
SELECT
    c.Id, c.ClinicId,
    codes.code, codes.descr, 0, sec.details,
    ROW_NUMBER() OVER (PARTITION BY c.Id ORDER BY sec.[key], codes.[key]),
    c.CreatedBy
FROM dbo.Consultations c
CROSS APPLY OPENJSON(c.Diagnostic, '$.secondaryDiagnoses')
    WITH ([key] INT '$.sortOrder', details NVARCHAR(MAX) '$.details' AS JSON,
          icd10Codes NVARCHAR(MAX) '$.icd10Codes' AS JSON) sec
CROSS APPLY OPENJSON(sec.icd10Codes)
    WITH ([key] INT '$.sortOrder', code NVARCHAR(10) '$.code',
          descr NVARCHAR(500) '$.shortDescriptionRo') codes
WHERE c.Diagnostic IS NOT NULL
  AND ISJSON(c.Diagnostic) = 1
  AND codes.code IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses d
                  WHERE d.ConsultationId = c.Id AND d.Icd10Code = codes.code AND d.IsPrimary = 0);
GO
```

> **Înainte de a rula backfill-ul în producție:** verifică forma reală a JSON-ului cu
> `SELECT TOP 20 Diagnostic FROM dbo.Consultations WHERE ISJSON(Diagnostic) = 1;`.
> Structura de mai sus reflectă ce scrie `handleSaveDraft` azi
> (`{ primaryCode, primaryDetails, secondaryDiagnoses }`), dar rânduri mai vechi pot avea altă
> formă. Rulează backfill-ul pe o restaurare a bazei de producție și compară numărătorile
> înainte de a-l include în migrare. Scrie și `Rollback/0059_Rollback_ConsultationsHardening.sql`,
> conform tiparului din `Scripts/Rollback/`.

### 9.2 `Consultation_GetPaged.sql` — rescris

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Consultation_GetPaged
-- Result sets: (1) pagina curentă, (2) totalCount, (3) statistici pe setul FILTRAT
-- Modificări față de versiunea anterioară:
--   · filtrele sunt scrise O SINGURĂ DATĂ (#Filtered), nu de trei ori
--   · sortare pe coloane native (fără CONVERT) → folosește IX_Consultations_ClinicId_Date
--   · @Search cu ESCAPE: %, _ și [ sunt tratate literal
--   · @Page/@PageSize plafonate
--   · statisticile reflectă filtrele active
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200)    = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0)     = NULL,
    @DateTo     DATETIME2(0)     = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 20,
    @SortBy     NVARCHAR(50)     = 'Date',
    @SortDir    NVARCHAR(4)      = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalizare parametri (OFFSET negativ = eroare de execuție)
    SET @Page     = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize BETWEEN 1 AND 200 THEN @PageSize ELSE 20 END;
    SET @SortDir  = CASE WHEN LOWER(@SortDir) = 'asc' THEN 'asc' ELSE 'desc' END;
    SET @SortBy   = CASE WHEN @SortBy IN ('Date','PatientName','DoctorName','StatusName','CreatedAt')
                         THEN @SortBy ELSE 'Date' END;
    SET @Search   = NULLIF(LTRIM(RTRIM(@Search)), N'');

    DECLARE @Pattern NVARCHAR(410) = NULL;
    IF @Search IS NOT NULL
        SET @Pattern = N'%' + REPLACE(REPLACE(REPLACE(@Search, N'[', N'[[]'),
                                              N'%', N'[%]'), N'_', N'[_]') + N'%';

    -- Interval de dată: @DateTo inclusiv ziua întreagă, indiferent de ora primită
    DECLARE @DateToExclusive DATETIME2(0) =
        CASE WHEN @DateTo IS NULL THEN NULL
             ELSE DATEADD(DAY, 1, CAST(CAST(@DateTo AS DATE) AS DATETIME2(0))) END;

    -- ── Filtrare: o singură dată, reutilizată de toate result set-urile ──────
    CREATE TABLE #Filtered (Id UNIQUEIDENTIFIER PRIMARY KEY, StatusId UNIQUEIDENTIFIER NOT NULL);

    INSERT INTO #Filtered (Id, StatusId)
    SELECT c.Id, c.StatusId
    FROM dbo.Consultations c
    INNER JOIN dbo.Patients p ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors  d ON d.Id = c.DoctorId
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
      AND (@StatusId IS NULL OR c.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR c.Date >= @DateFrom)
      AND (@DateToExclusive IS NULL OR c.Date < @DateToExclusive)
      AND (@Pattern IS NULL
           OR CONCAT(p.LastName, N' ', p.FirstName) LIKE @Pattern ESCAPE N'['
           OR CONCAT(d.LastName, N' ', d.FirstName) LIKE @Pattern ESCAPE N'['
           OR EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses dg
                      WHERE dg.ConsultationId = c.Id AND dg.Icd10Code LIKE @Pattern ESCAPE N'['));

    -- Result set 1: pagina curentă
    SELECT
        c.Id, c.ClinicId, c.PatientId, c.DoctorId,
        c.Date, c.Diagnostic, c.DiagnosticCodes,
        c.StatusId, c.IsDeleted, c.CreatedAt, c.CreatedBy,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        p.PhoneNumber                         AS PatientPhone,
        CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        s.Name  AS StatusName,
        s.Code  AS StatusCode,
        CONCAT(cu.LastName, N' ', cu.FirstName) AS CreatedByName,
        dg.Icd10Code        AS PrimaryIcd10Code,
        dg.Icd10Description AS PrimaryIcd10Description
    FROM #Filtered f
    INNER JOIN dbo.Consultations c        ON c.Id = f.Id
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors  d             ON d.Id = c.DoctorId
    LEFT  JOIN dbo.Specialties sp         ON sp.Id = d.SpecialtyId AND sp.IsDeleted = 0
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    LEFT  JOIN dbo.Users cu               ON cu.Id = c.CreatedBy
    LEFT  JOIN dbo.ConsultationDiagnoses dg ON dg.ConsultationId = c.Id AND dg.IsPrimary = 1
    ORDER BY
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'Date'        THEN c.Date        END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'Date'        THEN c.Date        END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'CreatedAt'   THEN c.CreatedAt   END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'CreatedAt'   THEN c.CreatedAt   END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'PatientName' THEN CONCAT(p.LastName, N' ', p.FirstName) END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'PatientName' THEN CONCAT(p.LastName, N' ', p.FirstName) END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'DoctorName'  THEN CONCAT(d.LastName, N' ', d.FirstName) END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'DoctorName'  THEN CONCAT(d.LastName, N' ', d.FirstName) END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'StatusName'  THEN s.Name        END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'StatusName'  THEN s.Name        END DESC,
        c.Id   -- departajare stabilă: fără ea, paginarea poate repeta/omite rânduri
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    OPTION (RECOMPILE);

    -- Result set 2: total count
    SELECT COUNT(*) FROM #Filtered;

    -- Result set 3: statistici pe setul filtrat
    SELECT
        COUNT(*)                                                    AS TotalConsultations,
        SUM(CASE WHEN s.Code = 'INLUCRU'    THEN 1 ELSE 0 END)      AS DraftCount,
        SUM(CASE WHEN s.Code = 'FINALIZATA' THEN 1 ELSE 0 END)      AS CompletedCount,
        SUM(CASE WHEN s.Code = 'BLOCATA'    THEN 1 ELSE 0 END)      AS LockedCount
    FROM #Filtered f
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = f.StatusId;

    DROP TABLE #Filtered;
END;
GO
```

> **Atenție la contract:** statisticile trec de la „globale pe clinică" la „pe setul filtrat".
> Dacă UI-ul le prezintă ca totaluri ale clinicii, ajustează etichetele — altfel cifrele par
> să scadă inexplicabil când utilizatorul filtrează. Decizia recomandată este cea de mai sus
> (coerență cu ce e afișat); dacă preferi totalurile globale, păstrează result set-ul 3 pe
> tabela completă și etichetează-l explicit „pe clinică".
>
> `ORDER BY ... , c.Id` nu e cosmetic: fără o departajare deterministă, două consultații cu
> aceeași dată pot apărea pe două pagini sau pe niciuna.

### 9.3 Șablon pentru SP-urile de scriere

Aplică-l la `Consultation_Create`, `_Update`, `_Delete`, `_UpsertAnamnesis`, `_UpsertExam`,
`_Finalize`:

```sql
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        /* 1. validări existență + tenancy (THROW cu cod din SqlErrorCodes.cs) */
        /* 2. validări de stare (blocat/facturat/finalizat)                     */
        /* 3. captare @OldValues (FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)         */
        /* 4. scrierea propriu-zisă                                             */
        /* 5. captare @NewValues                                                */
        /* 6. INSERT în dbo.AuditLogs                                           */

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;   -- re-aruncă păstrând ex.Number pentru catch-urile din handler
    END CATCH
END;
```

### 9.4 `Consultation_Finalize.sql` — nou

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Consultation_Finalize
-- Tranziție atomică INLUCRU → FINALIZATA. Singura cale de finalizare;
-- Consultation_Update nu mai primește @StatusId.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Finalize
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,
    @FinalizedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(50);

        -- UPDLOCK/HOLDLOCK: serializează două finalizări concurente pe același rând
        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN ;THROW 50020, N'Consultația nu a fost găsită.', 1; END;

        IF @StatusCode <> 'INLUCRU'
        BEGIN ;THROW 50021, N'Consultația nu mai este în lucru și nu poate fi modificată.', 1; END;

        -- Minim clinic obligatoriu la finalizare
        IF NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses
                       WHERE ConsultationId = @Id AND IsPrimary = 1)
        BEGIN ;THROW 50034, N'Diagnosticul principal este obligatoriu la finalizare.', 1; END;

        UPDATE dbo.Consultations
        SET StatusId  = 'C2000000-0000-0000-0000-000000000002',   -- FINALIZATA
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @FinalizedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Consultation', @Id, N'Finalize',
                (SELECT @StatusCode AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                (SELECT N'FINALIZATA' AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @FinalizedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
```

Coduri noi de adăugat în `SqlErrorCodes.cs`:

```csharp
public const int ConsultationHasPayments            = 50029;
public const int ConsultationDeleteBlocked          = 50032;
public const int ConsultationAppointmentDuplicate   = 50033;
public const int ConsultationMissingPrimaryDiagnosis = 50034;
```

> Verifică `SqlErrorCodes.cs` înainte de a le aloca — fișierul merge până la 50645 și e posibil
> ca intervalul `5003x` să fi fost ocupat între timp. Codurile trebuie să rămână unice pe întreg
> fișierul: colizionarea lui `50022` (§5.3) este exact problema pe care o evităm aici.

---

## 10. Riscuri și note de migrare

- **Backfill-ul ICD-10 este ireversibil în conținut** (nu în structură): rulează-l pe o copie a
  producției, compară `COUNT` înainte/după, păstrează `Diagnostic`/`DiagnosticCodes` intacte ca
  sursă de adevăr până la validare. Nu șterge coloanele în `0059`.
- **De-duplicarea `AppointmentId`** setează `NULL` pe consultațiile mai noi duplicate. Rulează
  întâi interogarea de inspecție și discută rezultatul cu beneficiarul dacă apar duplicate:
  ```sql
  SELECT ClinicId, AppointmentId, COUNT(*) AS Nr
  FROM dbo.Consultations
  WHERE AppointmentId IS NOT NULL AND IsDeleted = 0
  GROUP BY ClinicId, AppointmentId HAVING COUNT(*) > 1;
  ```
- **Scoaterea lui `StatusId` din `UpdateConsultationRequest`** este o schimbare de contract API.
  Regenerează OpenAPI (R9) și verifică `client/src/api/generated/schema.d.ts` — `npm run check:api`
  va semnala orice apelant rămas.
- **Statisticile filtrate** (§9.2) schimbă semantica result set-ului 3. Verifică
  `ConsultationStatsDto` și componenta care le afișează.
- SP-urile sunt `CREATE OR ALTER` și se rulează la fiecare pornire (DbUp, `NullJournal`), deci pot
  fi editate liber; migrarea `0059`, o dată aplicată, nu se mai modifică (R6).
