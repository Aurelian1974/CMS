# CLAUDE.md — ValyanClinic CMS Reference

Fișier de referință pentru Claude (AI assistant). Conține tot ce e necesar ca să lucrez eficient în acest proiect fără explorare repetitivă.

> **Principiu**: Niciun exemplu din acest document nu conține placeholder `// ...` — tot codul
> este real și copiat din codebase.
>
> **Ultima verificare a exemplelor împotriva codului: 2026-09-27.** Documentul e o referință
> normativă: dacă un exemplu de aici nu compilează, exemplul e greșit, nu codul. Când
> refactorizezi un pattern (semnătură de repository, props de wrapper, formă de răspuns API),
> actualizează secțiunea corespunzătoare în același PR.
>
> Repere care se învechesc cel mai repede, de verificat înainte de a te baza pe ele:
> ultima migrare (`ls src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/ | sort | tail -1`),
> codurile din `SqlErrorCodes.cs`, lista de module din `ModuleCodes.cs` ↔ `useHasAccess.ts`.

---

## Stack

| Layer | Tehnologie |
|---|---|
| Backend runtime | .NET 10.0 |
| API | ASP.NET Core + MediatR 14.x |
| ORM | Dapper + SQL Server StoredProcedures |
| Migrations | DbUp (rulează la startup) |
| Validation | FluentValidation 12.x |
| Mapping | Mapster 7.x |
| Auth | JWT Bearer + Refresh Token |
| Frontend | React 19 + TypeScript 5.9 + Vite |
| State | Zustand 4.x (sessionStorage persist — FĂRĂ access token, vezi §7) |
| Server state | TanStack React Query 5.x |
| Forms | react-hook-form 7.x + Zod 4.x |
| HTTP client | Axios (cu interceptori pentru JWT + refresh) |
| UI components | Bootstrap 5 + Syncfusion EJ2 + module.scss |
| Rich text | TipTap 3.x (`FormRichText`) · Syncfusion RTE doar în `components/icd10/` |
| Icoane | lucide-react |
| Testing BE | xunit + NSubstitute + coverlet |
| Testing FE | Vitest + Playwright |

---

## Structura proiectului

```
CMS/
├── src/
│   ├── ValyanClinic.API/               # Controllers, Middleware, Filters, Program.cs
│   ├── ValyanClinic.Application/       # Commands, Queries, Validators, DTOs, Interfaces
│   ├── ValyanClinic.Domain/            # Entities, ValueObjects, Exceptions
│   ├── ValyanClinic.Infrastructure/    # Repositories, DependencyInjection, Auth, Data
│   └── ValyanClinic.Shared/            # Constants, Documentation
├── tests/
│   ├── ValyanClinic.Tests/             # Handlers/, Validators/, Domain/, TestHelpers/
│   └── ValyanClinic.IntegrationTests/
├── client/
│   └── src/
│       ├── api/endpoints/              # {feature}.api.ts
│       ├── api/generated/schema.d.ts  # auto-generat din openapi-v1.json
│       ├── features/{feature}/
│       │   ├── components/             # modale/sub-componente specifice
│       │   ├── hooks/                  # use{Feature}s.ts (useConsultations.ts, usePatients.ts)
│       │   ├── pages/                  # {Feature}ListPage.tsx + .module.scss
│       │   ├── schemas/                # {feature}.schema.ts
│       │   └── types/                  # {feature}.types.ts
│       ├── components/
│       │   ├── forms/                  # FormInput, FormSelect, FormDatePicker,
│       │   │                            # FormPhoneInput, FormRichText (TipTap),
│       │   │                            # AddressAutocomplete, AddressFields,
│       │   │                            # CaenCodeMultiSelect
│       │   ├── ui/                     # AppButton, AppBadge, ErrorBoundary, etc.
│       │   └── icd10/                  # ICD10SearchBox, PrimaryDiagnosisSelector, etc.
│       ├── store/                      # authStore.ts, uiStore.ts
│       ├── routes/
│       ├── hooks/                      # useDebounce.ts, useHasAccess.ts
│       └── utils/
├── openapi/openapi-v1.json
├── .github/workflows/ci.yml
├── Directory.Build.props               # Version globală
└── migrate.ps1                         # Rulează DbUp manual
```

---

## Convenții de naming

### C#

| Ce | Pattern | Exemplu |
|---|---|---|
| Command/Query record | `{Verb}{Entity}Command` | `CreateConsultationCommand` |
| Handler | `{Verb}{Entity}CommandHandler` | `CreateConsultationCommandHandler` |
| Validator | `{Verb}{Entity}CommandValidator` | `CreateConsultationCommandValidator` |
| Interface repo | `I{Entity}Repository` | `IConsultationRepository` |
| Repository impl | `{Entity}Repository` | `ConsultationRepository` |
| DTO list | `{Entity}ListDto` | `ConsultationListDto` |
| DTO detaliu | `{Entity}DetailDto` | `ConsultationDetailDto` |
| Controller | `{Entity}sController` | `ConsultationsController` |
| Migration SQL | `{NNNN}_{Description}.sql` | `0031_CreateConsultations.sql` |
| StoredProc SQL | `{Entity}_{Operation}.sql` | `Consultation_Create.sql` |
| StoredProc C# ref | `{Entity}Procedures.{Op}` | `ConsultationProcedures.Create` |

### TypeScript/React

| Ce | Pattern | Exemplu |
|---|---|---|
| Page component | `{Entity}ListPage.tsx` | `ConsultationsListPage.tsx` |
| Modal component | `{Entity}FormModal.tsx` | `ConsultationFormModal.tsx` |
| Hook | `use{Entity}s.ts` | `useConsultations.ts` |
| API file | `{feature}.api.ts` | `consultations.api.ts` |
| Types file | `{feature}.types.ts` | `consultation.types.ts` |
| Schema file | `{feature}.schema.ts` | `consultation.schema.ts` |
| Store file | `{name}Store.ts` | `authStore.ts` |
| Colocated SCSS | `{Component}.module.scss` | `ConsultationsListPage.module.scss` |

---

## Adăugare feature nou — checklist fișiere

```
src/ValyanClinic.Application/Features/{Feature}/
├── Commands/
│   ├── Create{Entity}/
│   │   ├── Create{Entity}Command.cs             ← IRequest<Result<Guid>>
│   │   ├── Create{Entity}CommandHandler.cs
│   │   └── Create{Entity}CommandValidator.cs
│   ├── Update{Entity}/
│   │   ├── Update{Entity}Command.cs             ← IRequest<Result<bool>>
│   │   ├── Update{Entity}CommandHandler.cs
│   │   └── Update{Entity}CommandValidator.cs
│   └── Delete{Entity}/
│       ├── Delete{Entity}Command.cs             ← IRequest<Result<bool>>
│       └── Delete{Entity}CommandHandler.cs
├── Queries/
│   ├── Get{Entity}ById/
│   │   ├── Get{Entity}ByIdQuery.cs              ← IRequest<Result<{Entity}DetailDto>>
│   │   └── Get{Entity}ByIdQueryHandler.cs
│   └── Get{Entity}sPaged/
│       ├── Get{Entity}sPagedQuery.cs            ← IRequest<Result<{Entity}PagedResponse>>
│       └── Get{Entity}sPagedQueryHandler.cs
└── DTOs/
    ├── {Entity}ListDto.cs
    ├── {Entity}DetailDto.cs
    └── {Entity}PagedResponse.cs                 ← wrappează PagedResult + Stats

src/ValyanClinic.Application/Common/
├── Interfaces/I{Entity}Repository.cs
└── Constants/
    ├── SqlErrorCodes.cs                         ← adaugă noile constante
    └── ErrorMessages.cs                         ← adaugă noile mesaje

src/ValyanClinic.Infrastructure/
├── Data/Repositories/{Entity}Repository.cs
└── Data/StoredProcedures/{Entity}Procedures.cs

src/ValyanClinic.Infrastructure/DependencyInjection.cs   ← AddScoped<>

src/ValyanClinic.API/Controllers/{Entity}sController.cs

src/ValyanClinic.Infrastructure/Data/Scripts/
├── Migrations/{NNNN}_Create{Entity}s.sql
└── StoredProcedures/
    ├── {Entity}_Create.sql
    ├── {Entity}_Update.sql
    ├── {Entity}_Delete.sql
    ├── {Entity}_GetById.sql
    └── {Entity}_GetPaged.sql

client/src/features/{feature}/
├── components/{Entity}FormModal.tsx
├── hooks/use{Entity}s.ts                        ← queries + mutations (useConsultations.ts)
├── pages/{Entity}ListPage.tsx + .module.scss
├── schemas/{feature}.schema.ts
└── types/{feature}.types.ts
client/src/api/endpoints/{feature}.api.ts
```

---

## Pattern-uri backend

### 1. Command / Query records

```csharp
// Fișier: Features/Consultations/Commands/DeleteConsultation/DeleteConsultationCommand.cs
// Delete — simplu, un singur parametru
public sealed record DeleteConsultationCommand(Guid Id)
    : IRequest<Result<bool>>;

// Fișier: Features/Consultations/Queries/GetConsultationById/GetConsultationByIdQuery.cs
// Get by id — simplu
public sealed record GetConsultationByIdQuery(Guid Id)
    : IRequest<Result<ConsultationDetailDto>>;

// Fișier: Features/Consultations/Queries/GetConsultations/GetConsultationsQuery.cs
// Paged query — parametri de filtrare + paginare
public sealed record GetConsultationsQuery(
    string? Search,
    Guid?   DoctorId,
    Guid?   StatusId,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page         = 1,
    int PageSize     = 20,
    string SortBy    = "Date",
    string SortDir   = "desc")
    : IRequest<Result<ConsultationsPagedResponse>>;

// Fișier: Features/Consultations/Commands/CreateConsultation/CreateConsultationCommand.cs
// Create — comandă cu mulți parametri. Anamneza și Examenul Clinic NU sunt aici:
// migrarea 0035 le-a mutat în tabele proprii, iar clientul le trimite după creare
// prin PUT /{id}/anamnesis și PUT /{id}/exam (vezi §4 Pattern-uri frontend).
public sealed record CreateConsultationCommand(
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    // Tab 3: Investigații
    string? Investigatii,
    // Tab 4: Analize Medicale
    string? AnalizeMedicale,
    // Tab 5: Diagnostic & Tratament
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    // Tab 6: Concluzii
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId
) : IRequest<Result<Guid>>;
```

> **Comenzile cu mulți parametri NU se propagă în semnătura repository-ului.**
> `IConsultationRepository.CreateAsync` primește un singur record de date
> (`ConsultationCreateData`) — vezi §8. Handler-ul face traducerea. Motivul e în §2a.

### 2a. Handler — CreateAsync → `Result<Guid>.Created(id)`

```csharp
public sealed class CreateConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateConsultationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Traducere comandă → record de date. ClinicId vine din ICurrentUser,
            // niciodată din comandă: clientul nu-și alege tenantul.
            var data = new ConsultationCreateData(
                ClinicId: currentUser.ClinicId,
                PatientId: request.PatientId,
                DoctorId: request.DoctorId,
                AppointmentId: request.AppointmentId,
                Date: request.Date,
                Investigatii: request.Investigatii,
                AnalizeMedicale: request.AnalizeMedicale,
                Diagnostic: request.Diagnostic,
                DiagnosticCodes: request.DiagnosticCodes,
                Recomandari: request.Recomandari,
                Observatii: request.Observatii,
                Concluzii: request.Concluzii,
                EsteAfectiuneOncologica: request.EsteAfectiuneOncologica,
                AreIndicatieInternare: request.AreIndicatieInternare,
                SaEliberatPrescriptie: request.SaEliberatPrescriptie,
                SeriePrescriptie: request.SeriePrescriptie,
                SaEliberatConcediuMedical: request.SaEliberatConcediuMedical,
                SerieConcediuMedical: request.SerieConcediuMedical,
                SaEliberatIngrijiriDomiciliu: request.SaEliberatIngrijiriDomiciliu,
                SaEliberatDispozitiveMedicale: request.SaEliberatDispozitiveMedicale,
                DataUrmatoareiVizite: request.DataUrmatoareiVizite,
                NoteUrmatoareaVizita: request.NoteUrmatoareaVizita,
                StatusId: request.StatusId);

            var id = await repository.CreateAsync(data, currentUser.Id, cancellationToken);

            return Result<Guid>.Created(id); // 201
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message); // 400
        }
    }
}
```

> **De ce record de date și nu 47 de parametri?** Semnătura
> `CreateAsync(data, createdBy, ct)` are 3 parametri indiferent câte câmpuri
> adaugi în `ConsultationCreateData`. Consecințele practice:
> - mock-urile din teste rămân `Arg.Any<ConsultationCreateData>()` — un câmp nou
>   nu rupe niciun test care nu-l verifică (vezi §Patterns de test);
> - argumentele sunt numite, deci două `Guid?` consecutive nu se pot inversa tăcut;
> - `record` e imutabil, deci se poate loga sau compara ca un tot.
>
> Aceeași formă pentru `UpdateAsync(ConsultationUpdateData, updatedBy, ct)`.
> `DeleteAsync` rămâne pozițional — are 3 argumente, un record ar fi ceremonie inutilă.

### 2b. Handler — UpdateAsync → `Result<bool>.Success(true)`

> `UpdateAsync` returnează `Task` (void) — nu există valoare de returnat din SP.
> `await` se pune ÎNAINTE de `return Result<bool>.Success(true)`.

```csharp
public sealed class UpdateConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new ConsultationUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,   // din ICurrentUser, nu din comandă
                PatientId: request.PatientId,
                // ... restul câmpurilor, toate cu argumente numite
                StatusId: request.StatusId);

            await repository.UpdateAsync(       // ← void Task, nu returnează nimic
                data,
                currentUser.Id,                 // ← audit: updatedBy
                cancellationToken);

            return Result<bool>.Success(true); // 200
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message); // 400
        }
    }
}
```

### 2c. Handler — DeleteAsync → `Result<bool>.Success(true)` + prinde NotFound specific

> Delete prinde separat `SqlErrorCodes.XxxNotFound` → `Result.NotFound` (404),
> restul erorilor de business → `Result.Failure` (400).

```csharp
public sealed class DeleteConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteConsultationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
                currentUser.Id,              // ← deletedBy pentru audit
                cancellationToken);

            return Result<bool>.Success(true); // 200
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Consultation.NotFound); // 404
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message); // 400
        }
    }
}
```

### 2d. Handler — GetById → null check → NotFound sau Success

```csharp
public sealed class GetConsultationByIdQueryHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationByIdQuery, Result<ConsultationDetailDto>>
{
    public async Task<Result<ConsultationDetailDto>> Handle(
        GetConsultationByIdQuery request, CancellationToken cancellationToken)
    {
        var consultation = await repository.GetByIdAsync(
            request.Id, currentUser.ClinicId, cancellationToken);

        return consultation is null
            ? Result<ConsultationDetailDto>.NotFound(ErrorMessages.Consultation.NotFound) // 404
            : Result<ConsultationDetailDto>.Success(consultation);                         // 200
        // Nu există try/catch — GetById nu aruncă SqlException (returnează null dacă nu găsit)
    }
}
```

### 2e. Handler — GetPaged → wrappează în response DTO

```csharp
public sealed class GetConsultationsQueryHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationsQuery, Result<ConsultationsPagedResponse>>
{
    public async Task<Result<ConsultationsPagedResponse>> Handle(
        GetConsultationsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.DoctorId,
            request.StatusId,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        var response = new ConsultationsPagedResponse
        {
            PagedResult = result.Paged,
            Stats       = result.Stats,
        };

        return Result<ConsultationsPagedResponse>.Success(response); // 200
    }
}
```

### 3. Validator — tipuri de reguli

```csharp
public sealed class CreateConsultationCommandValidator : AbstractValidator<CreateConsultationCommand>
{
    public CreateConsultationCommandValidator()
    {
        // Câmp obligatoriu (GUID)
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Pacientul este obligatoriu.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Doctorul este obligatoriu.");

        // DateTime validă
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Data consultației este obligatorie.")
            .GreaterThan(DateTime.MinValue).WithMessage("Data consultației nu este validă.");

        // String opțional cu MaximumLength — folosiți When() pentru nullable
        RuleFor(x => x.Diagnostic)
            .MaximumLength(4000).WithMessage("Diagnosticul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Diagnostic));

        RuleFor(x => x.DiagnosticCodes)
            .MaximumLength(2000).WithMessage("Codurile de diagnostic nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DiagnosticCodes));

        RuleFor(x => x.Recomandari)
            .MaximumLength(4000).WithMessage("Recomandările nu pot depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Recomandari));

        RuleFor(x => x.Observatii)
            .MaximumLength(4000).WithMessage("Observațiile nu pot depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Observatii));
    }
}
```

> Regulă cu range numeric — nu există pe `CreateConsultationCommand` (valorile vitale au
> trecut la `UpdateConsultationExamCommand` în 0035). Forma reală, din
> `UpdateConsultationExamCommandValidator`:
>
> ```csharp
> RuleFor(x => x.SpO2).InclusiveBetween(0, 100).When(x => x.SpO2.HasValue);
> ```
>
> Acolo `WithMessage` lipsește intenționat pe regulile de range: mesajul implicit al
> FluentValidation e suficient de explicit pentru un interval numeric.

### 4. Result\<T\> și PagedResult\<T\>

```csharp
// Toate factory methods din Result<T>:
Result<Guid>.Created(id)           // 201 — după Create
Result<T>.Success(value)           // 200 — după Get/Update/Delete
Result<T>.Failure("mesaj")         // 400 — eroare de business
Result<T>.Failure("mesaj", 422)    // custom HTTP code
Result<T>.NotFound("mesaj")        // 404 — entitate negăsită
Result<T>.Conflict("mesaj")        // 409 — duplicat/conflict
Result<T>.Unauthorized("mesaj")    // 401
Result<T>.Forbidden("mesaj")       // 403 — autentificat, dar fără drept

// PagedResult<T> — structura returnată de GetPaged
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items      { get; }
    public int TotalCount              { get; }
    public int Page                    { get; }
    public int PageSize                { get; }
    public int TotalPages              => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage        => Page > 1;
    public bool HasNextPage            => Page < TotalPages;
}
// Construcție: new PagedResult<ConsultationListDto>(items, totalCount, page, pageSize)
```

### 5. ICurrentUser

```csharp
// src/ValyanClinic.Application/Common/Interfaces/ICurrentUser.cs
// Setul COMPLET al interfeței. Implementat în Infrastructure/Authentication/CurrentUser.cs,
// care citește JWT claims și ARUNCĂ UnauthorizedAccessException dacă un claim lipsește.

currentUser.Id         // Guid   — userId pentru audit: CreatedBy, UpdatedBy, DeletedBy
currentUser.ClinicId   // Guid   — multi-tenancy: ORICE query la DB filtrează după acesta
currentUser.RoleId     // Guid   — claim "roleId"; folosit la citirea permisiunilor efective
currentUser.Email      // string
currentUser.FullName   // string — claim "fullName"
currentUser.Role       // string — CODUL rolului (lowercase), vezi Roles.cs
currentUser.IsInRole(Roles.Admin)   // bool — comparare ordinală, case-sensitive
```

**Nu există `IsAdmin`.** Verificarea de rol se face cu `IsInRole(Roles.Admin)`, iar
constantele din `Roles.cs` sunt obligatorii: claim-ul poartă codul lowercase, iar
`IsInRole` compară ordinal — un `"Admin"` scris cu majusculă dă 403 fără niciun mesaj.

**Nu există `DoctorId`.** Nici interfața, nici JWT-ul nu au legătura user→doctor
(`JwtTokenService` emite doar `sub`, `jti`, `email`, `clinicId`, `fullName`, `role`,
`roleId`). Pentru a filtra după medicul curent, SP-ul rezolvă `Users.DoctorId` din
`@UserId` — o valoare de `doctorId` primită de la client nu poate fi folosită la
filtrare, pentru că ar permite citirea datelor altui medic.

**Permisiunile efective nu se citesc din `ICurrentUser`.** Vin din
`IPermissionRepository.GetEffectiveByUserAsync(userId, roleId, ct)`, care combină
`RoleModulePermissions` cu `UserModuleOverrides`. `ModuleAccessAuthorizationHandler`
le ține în `IMemoryCache` sub cheile din `PermissionCacheKeys` (TTL 5 min, pre-populat
la login/refresh), deci după orice `[HasAccess]` cache-ul e deja cald.

### 6. DapperContext — implementare completă

```csharp
// src/ValyanClinic.Infrastructure/Data/DapperContext.cs
public sealed class DapperContext(IConfiguration configuration)
{
    private readonly string _connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException(
            "Connection string 'DefaultConnection' nu a fost găsit în configurație.");

    // Creează o nouă conexiune ADO.NET — Dapper gestionează connection pooling
    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
// Înregistrat ca Singleton: services.AddSingleton<DapperContext>();
```

### 7a. Dapper — ExecuteScalarAsync (Create returnează ID)

```csharp
public async Task<Guid> CreateAsync(
    ConsultationCreateData data, Guid createdBy, CancellationToken ct)
{
    using var connection = context.CreateConnection();
    return await connection.ExecuteScalarAsync<Guid>(
        new CommandDefinition(
            ConsultationProcedures.Create,
            new
            {
                data.ClinicId,          // numele parametrului SP se deduce din numele
                data.PatientId,         // proprietății — @ClinicId, @PatientId, ...
                data.DoctorId,
                data.AppointmentId,
                data.Date,
                // ... câmpuri rând cu rând, fără scurtături
                CreatedBy = createdBy   // singurul cu nume explicit: nu vine din `data`
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
}
```

> `new { data.ClinicId, ... }` folosește proiecția de membru din C#: numele
> parametrului Dapper e numele proprietății. Nu scrie `ClinicId = data.ClinicId` —
> e redundant și deschide ușa la o nepotrivire între nume și valoare.

### 7b. Dapper — QueryFirstOrDefaultAsync (GetById)

```csharp
public async Task<ConsultationDetailDto?> GetByIdAsync(
    Guid id, Guid clinicId, CancellationToken ct)
{
    using var connection = context.CreateConnection();
    return await connection.QueryFirstOrDefaultAsync<ConsultationDetailDto>(
        new CommandDefinition(
            ConsultationProcedures.GetById,
            new { Id = id, ClinicId = clinicId },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
}
```

### 7c. Dapper — QueryMultipleAsync (GetPaged — 3 result sets)

```csharp
public async Task<ConsultationPagedResult> GetPagedAsync(
    Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
    DateTime? dateFrom, DateTime? dateTo,
    int page, int pageSize, string sortBy, string sortDir,
    CancellationToken ct)
{
    using var connection = context.CreateConnection();
    using var multi = await connection.QueryMultipleAsync(
        new CommandDefinition(
            ConsultationProcedures.GetPaged,
            new
            {
                ClinicId  = clinicId,
                Search    = search,
                DoctorId  = doctorId,
                StatusId  = statusId,
                DateFrom  = dateFrom,
                DateTo    = dateTo,
                Page      = page,
                PageSize  = pageSize,
                SortBy    = sortBy,
                SortDir   = sortDir
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));

    var items      = (await multi.ReadAsync<ConsultationListDto>()).ToList();   // Result set 1
    var totalCount = await multi.ReadSingleAsync<int>();                        // Result set 2
    var stats      = await multi.ReadSingleAsync<ConsultationStatsDto>();       // Result set 3

    return new ConsultationPagedResult(
        new PagedResult<ConsultationListDto>(items, totalCount, page, pageSize),
        stats);
}
```

### 8. Repository interface — pattern

```csharp
// src/ValyanClinic.Application/Common/Interfaces/IConsultationRepository.cs
public interface IConsultationRepository
{
    // Paginate + filtre + stats → returnează wrapper custom (nu PagedResult<T> direct).
    // Filtrele rămân parametri: sunt puține, toate scalare, niciunul obligatoriu.
    Task<ConsultationPagedResult> GetPagedAsync(
        Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
        DateTime? dateFrom, DateTime? dateTo,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    // GetById returnează T? (null dacă negăsit) — nu aruncă excepție
    Task<ConsultationDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<ConsultationDetailDto?> GetByAppointmentIdAsync(
        Guid appointmentId, Guid clinicId, CancellationToken ct);

    Task<IEnumerable<ConsultationListDto>> GetByPatientAsync(
        Guid patientId, Guid clinicId, CancellationToken ct);

    // Create/Update: RECORD DE DATE + audit, nu zeci de parametri poziționali.
    // Create returnează Guid (id-ul entității create).
    Task<Guid> CreateAsync(ConsultationCreateData data, Guid createdBy, CancellationToken ct);

    // Update returnează Task (void) — SP aruncă THROW dacă negăsit
    Task UpdateAsync(ConsultationUpdateData data, Guid updatedBy, CancellationToken ct);

    // Delete rămâne pozițional — 3 argumente, un record ar fi ceremonie inutilă
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    // Sub-entități cu tabel propriu (0035) — upsert dedicat, DTO ca payload
    Task UpsertAnamnesisAsync(
        Guid consultationId, Guid clinicId, ConsultationAnamnesisDto data,
        Guid updatedBy, CancellationToken ct);

    Task UpsertExamAsync(
        Guid consultationId, Guid clinicId, ConsultationExamDto data,
        Guid updatedBy, CancellationToken ct);
}

// Wrapper-ul pentru GetPaged (rânduri + statistici)
public sealed record ConsultationPagedResult(
    PagedResult<ConsultationListDto> Paged,
    ConsultationStatsDto Stats);

// Record-ul de date pentru Create. Definit în ACELAȘI fișier cu interfața.
public sealed record ConsultationCreateData(
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    string? Investigatii,
    string? AnalizeMedicale,
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId);

// ConsultationUpdateData = același set + Id, tot în acest fișier.
```

**Regula de formă:** peste ~6 câmpuri de business, semnătura primește un
`{Entity}CreateData` / `{Entity}UpdateData` — `record` imutabil, definit lângă
interfață, cu `ClinicId` inclus. Argumentele de audit (`createdBy` / `updatedBy` /
`deletedBy`) și `CancellationToken` rămân pe semnătură, în afara record-ului: vin din
`ICurrentUser`, nu din payload-ul cererii, iar separarea face vizibil acest lucru.

### 9. BaseApiController — implementare completă

```csharp
// src/ValyanClinic.API/Controllers/BaseApiController.cs
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
[Authorize]                                      // toate endpoint-urile necesită auth
[ProducesResponseType<ApiResponse<string>>(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ApiResponse<string>>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ApiResponse<string>>(StatusCodes.Status409Conflict)]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult HandleResult<T>(Result<T> result) => result.StatusCode switch
    {
        200 => Ok(new ApiResponse<T>(true, result.Value, null, null)),
        201 => StatusCode(201, new ApiResponse<T>(true, result.Value, null, null)),
        204 => NoContent(),
        400 => BadRequest(new ApiResponse<T>(false, default, result.Error, null)),
        401 => Unauthorized(new ApiResponse<T>(false, default, result.Error, null)),
        404 => NotFound(new ApiResponse<T>(false, default, result.Error, null)),
        409 => Conflict(new ApiResponse<T>(false, default, result.Error, null)),
        _   => BadRequest(new ApiResponse<T>(false, default, result.Error, null))
    };
}
```

### 10. Controller — template complet

> PUT cu `[FromBody]` necesită un `{Entity}Request` record separat (nu Command direct).
> DELETE folosește `AccessLevel.Full` (nu Write).
> GET folosește `[FromQuery]` cu default values inline.

```csharp
// src/ValyanClinic.API/Controllers/ConsultationsController.cs
public class ConsultationsController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationsPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? doctorId,
        [FromQuery] Guid? statusId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page         = 1,
        [FromQuery] int pageSize     = 20,
        [FromQuery] string sortBy    = "Date",
        [FromQuery] string sortDir   = "desc",
        CancellationToken ct         = default)
    {
        var query = new GetConsultationsQuery(
            search, doctorId, statusId, dateFrom, dateTo,
            page, pageSize, sortBy, sortDir);
        return HandleResult(await Mediator.Send(query, ct));
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationByIdQuery(id), ct));

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateConsultationCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    // PUT: body vine ca {Entity}Request (nu Command direct — Command adaugă Id din route)
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateConsultationRequest request, CancellationToken ct)
    {
        var command = new UpdateConsultationCommand(id, request.PatientId, /* ... */);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Full)]  // ← Full, nu Write
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteConsultationCommand(id), ct));
}

// Record separat pentru body-ul PUT (fără Id — vine din route)
public sealed record UpdateConsultationRequest(Guid PatientId, /* ... */);
```

### 11. DependencyInjection — înregistrare repository

```csharp
// src/ValyanClinic.Infrastructure/DependencyInjection.cs
services.AddSingleton<DapperContext>();                                   // DB factory
services.AddScoped<IConsultationRepository, ConsultationRepository>();   // nou feature
```

---

## Constante și enumerări

### SqlErrorCodes.cs — coduri complete

```csharp
// src/ValyanClinic.Application/Common/Constants/SqlErrorCodes.cs
// Coduri aruncate din SP prin THROW (nu RAISERROR). Range: 50000–59999.
//
// EXTRAS, nu lista completă — fișierul real merge până la 50645. Înainte de a aloca
// un cod nou, citește fișierul; range-urile ocupate azi:
//   500xx pacienți/programări/consultații/facturi/rețete/auth
//   501xx specialități · 502xx clinică, locații, departamente, bănci, adrese, contacte
//   503xx doctori ȘI titluri medicale (vezi nota de mai jos) · 504xx personal medical
//   505xx utilizatori · 506xx financiar (tarife, servicii, plăți, facturi, bonuri)
public static class SqlErrorCodes
{
    public const int PatientCnpDuplicate             = 50001;
    public const int PatientNotFound                 = 50002;

    public const int AppointmentConflict             = 50010;
    public const int AppointmentNotFound             = 50011;

    public const int ConsultationNotFound            = 50020;   // THROW 50020

    public const int InvoiceAlreadyPaid              = 50030;
    public const int InvoiceNotFound                 = 50031;

    public const int PrescriptionExpired             = 50040;
    public const int PrescriptionNotFound            = 50041;

    public const int AuthInvalidCredentials          = 50050;
    public const int AuthAccountLocked               = 50051;

    public const int SpecialtyCodeDuplicate          = 50100;
    public const int SpecialtyParentNotFound         = 50101;
    public const int SpecialtyNotFound               = 50102;

    public const int ClinicFiscalCodeDuplicate       = 50200;
    public const int ClinicNotFound                  = 50201;
    public const int ClinicLocationNotFound          = 50210;
    public const int DepartmentNotFound              = 50220;
    public const int DepartmentCodeDuplicate         = 50221;

    // DoctorNotFound și MedicalTitleNotFound partajează același range 50300-50301
    // (se interpretează exclusiv în contextul SP-ului care le aruncă)
    public const int DoctorNotFound                  = 50300;
    public const int DoctorEmailDuplicate            = 50301;
    public const int DoctorInvalidDepartment         = 50302;
    public const int DoctorAlreadyLinkedToUser       = 50305;

    public const int MedicalStaffNotFound            = 50400;
    public const int MedicalStaffEmailDuplicate      = 50401;

    // Utilizatori: range 50500-50508
    public const int UserEmailDuplicate              = 50500;
    public const int UserInvalidAssociation          = 50501;
    public const int UserNotFound                    = 50507;
    public const int UserUsernameDuplicate           = 50508;
}
```

### ErrorMessages.cs — structura

```csharp
// src/ValyanClinic.Application/Common/Constants/ErrorMessages.cs
public static class ErrorMessages
{
    public static class Patient
    {
        public const string CnpDuplicate = "Un pacient cu acest CNP există deja.";
        public const string NotFound     = "Pacientul nu a fost găsit.";
    }
    public static class Appointment
    {
        public const string Conflict = "Există deja o programare în acest interval orar.";
        public const string NotFound = "Programarea nu a fost găsită.";
    }
    public static class Consultation
    {
        public const string NotFound = "Consultația nu a fost găsită.";
    }
    public static class Auth
    {
        public const string InvalidCredentials = "Email/username sau parola incorectă.";
        public const string AccountLocked      =
            "Contul este blocat temporar. Încercați din nou după {0} minute.";
        public const string InvalidToken       =
            "Token-ul de autentificare este invalid sau expirat.";
    }
    public static class User
    {
        public const string EmailDuplicate      = "Un utilizator cu această adresă de email există deja.";
        public const string NotFound            = "Utilizatorul nu a fost găsit.";
        public const string InvalidAssociation  =
            "Utilizatorul trebuie asociat fie unui doctor, fie unui membru al personalului medical.";
    }
    // ... restul urmează același pattern
}
// Folosire: ErrorMessages.Consultation.NotFound
```

### ModuleCodes.cs + AccessLevel.cs

```csharp
// src/ValyanClinic.Application/Common/Constants/ModuleCodes.cs
// Corespund coloanei Code din tabelul Modules din BD
public static class ModuleCodes
{
    public const string Dashboard     = "dashboard";
    public const string Patients      = "patients";
    public const string Appointments  = "appointments";
    public const string Consultations = "consultations";
    public const string Prescriptions = "prescriptions";
    public const string Documents     = "documents";
    public const string Invoices      = "invoices";
    public const string Payments      = "payments";
    public const string Reports       = "reports";
    public const string Nomenclature  = "nomenclature";
    public const string Users         = "users";
    public const string Clinic        = "clinic";
    public const string Cnas          = "cnas";
    public const string Anm           = "anm";
    public const string Audit         = "audit";
    public const string Settings      = "settings";
    public const string Tariffs       = "tariffs";   // seed în 0053
}

// Modulele NU sunt toate în migrarea 0011: `anm` vine din 0030, `audit` din 0045,
// `settings` din 0047, `tariffs` din 0053 — fiecare cu propriile granturi pe roluri.
// `audit` și `settings` sunt acordate DOAR rolului admin.
//
// `reports` și `documents` sunt seed-uite în 0011, dar nu au nicio rută sau controller
// aliniat pe ele (DocumentsController e protejat pe `consultations`). Nu le folosi ca
// modul de acces pentru un feature nou fără să rezolvi mai întâi acea discrepanță.
//
// MODULE din client/src/hooks/useHasAccess.ts trebuie să rămână sincron cu acest fișier.

// src/ValyanClinic.Application/Common/Enums/AccessLevel.cs
public enum AccessLevel
{
    None  = 0,   // modulul nu e vizibil
    Read  = 1,   // vizualizare — liste și detalii
    Write = 2,   // Read + creare + editare
    Full  = 3    // Write + ștergere + acțiuni speciale
}
```

### {Entity}Procedures.cs — referințe SP

```csharp
// src/ValyanClinic.Infrastructure/Data/StoredProcedures/ConsultationProcedures.cs
public static class ConsultationProcedures
{
    public const string GetById            = "dbo.Consultation_GetById";
    public const string GetByAppointmentId = "dbo.Consultation_GetByAppointmentId";
    public const string GetPaged           = "dbo.Consultation_GetPaged";
    public const string GetByPatient       = "dbo.Consultation_GetByPatient";
    public const string Create             = "dbo.Consultation_Create";
    public const string Update             = "dbo.Consultation_Update";
    public const string Delete             = "dbo.Consultation_Delete";
}
```

---

## Pattern-uri bază de date

### Migration SQL — structura unui tabel

```sql
-- Fișier: src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0031_CreateConsultations.sql
-- Numărul e secvențial — NICIODATĂ nu se reutilizează sau se sare

CREATE TABLE dbo.Consultations (
    -- PK: NEWSEQUENTIALID() — mai eficient pentru index clustered decât NEWID()
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    -- Multi-tenancy obligatoriu pe ORICE tabel principal
    ClinicId        UNIQUEIDENTIFIER NOT NULL,
    -- Chei externe
    PatientId       UNIQUEIDENTIFIER NOT NULL,
    DoctorId        UNIQUEIDENTIFIER NOT NULL,
    AppointmentId   UNIQUEIDENTIFIER NULL,
    -- Câmpuri business
    Date            DATETIME2(0)     NOT NULL,
    Motiv           NVARCHAR(MAX)    NULL,
    Diagnostic      NVARCHAR(MAX)    NULL,
    StatusId        UNIQUEIDENTIFIER NULL,
    -- Audit standard — OBLIGATORIU pe orice tabel principal
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy       UNIQUEIDENTIFIER NOT NULL,
    UpdatedAt       DATETIME2(0)     NULL,
    UpdatedBy       UNIQUEIDENTIFIER NULL,

    CONSTRAINT PK_Consultations             PRIMARY KEY (Id),
    CONSTRAINT FK_Consultations_Clinics     FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id),
    CONSTRAINT FK_Consultations_Patients    FOREIGN KEY (PatientId) REFERENCES dbo.Patients(Id),
    CONSTRAINT FK_Consultations_Doctors     FOREIGN KEY (DoctorId) REFERENCES dbo.Doctors(Id),
);

-- Index principal: ClinicId + coloana de sort frecventă + IsDeleted în INCLUDE
CREATE NONCLUSTERED INDEX IX_Consultations_ClinicId_Date
    ON dbo.Consultations (ClinicId, Date DESC)
    INCLUDE (PatientId, DoctorId, StatusId, IsDeleted);
```

### SP — Create (DECLARE + INSERT + SELECT @NewId)

```sql
-- Fișier: StoredProcedures/Consultation_Create.sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE dbo.Consultation_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @PatientId   UNIQUEIDENTIFIER,
    @DoctorId    UNIQUEIDENTIFIER,
    @Motiv       NVARCHAR(MAX) = NULL,
    -- ... restul params cu = NULL pentru opționale
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Default pentru valori opționale
    IF @StatusId IS NULL
        SET @StatusId = 'C2000000-0000-0000-0000-000000000001';  -- seeded constant

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();   -- ← NEWID() în SP, nu NEWSEQUENTIALID()

    INSERT INTO dbo.Consultations
        (Id, ClinicId, PatientId, DoctorId, Motiv, StatusId, CreatedBy, CreatedAt)
    VALUES
        (@NewId, @ClinicId, @PatientId, @DoctorId, @Motiv, @StatusId, @CreatedBy, SYSDATETIME());

    SELECT @NewId;   -- ← returnează ID-ul — citit în C# cu ExecuteScalarAsync<Guid>
END;
GO
```

### SP — Update (THROW dacă negăsit + UPDATE cu SYSDATETIME)

```sql
-- Fișier: StoredProcedures/Consultation_Update.sql
CREATE OR ALTER PROCEDURE dbo.Consultation_Update
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,   -- ← multi-tenancy: verificare ClinicId OBLIGATORIE
    @PatientId   UNIQUEIDENTIFIER,
    @Motiv       NVARCHAR(MAX) = NULL,
    -- ... restul câmpurilor
    @UpdatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificare existență + tenancy (un singur IF)
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Consultations
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
    )
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        -- ← THROW (nu RAISERROR); codul trebuie să fie în SqlErrorCodes.cs
    END;

    UPDATE dbo.Consultations SET
        PatientId  = @PatientId,
        Motiv      = @Motiv,
        -- ... toate câmpuri business
        UpdatedAt  = SYSDATETIME(),
        UpdatedBy  = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;
END;
GO
```

### SP — Delete (soft delete + audit log + THROW dacă blocat)

```sql
-- Fișier: StoredProcedures/Consultation_Delete.sql
CREATE OR ALTER PROCEDURE dbo.Consultation_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Verificare existență
    IF NOT EXISTS (SELECT 1 FROM dbo.Consultations
                   WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    -- 2. Verificare reguli business (blocat = nu se poate șterge)
    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50022, N'Consultația este blocată și nu poate fi ștearsă.', 1;
    END;

    -- 3. Captare valori vechi pentru audit (JSON)
    DECLARE @OldValues NVARCHAR(MAX);
    SELECT @OldValues = (
        SELECT PatientId, DoctorId, Date, Motiv, Diagnostic, StatusId
        FROM dbo.Consultations WHERE Id = @Id
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- 4. Soft delete
    UPDATE dbo.Consultations SET
        IsDeleted = 1,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @DeletedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    -- 5. Audit log
    INSERT INTO dbo.AuditLogs
        (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES
        (@ClinicId, N'Consultation', @Id, N'Delete', @OldValues, NULL, @DeletedBy);
END;
GO
```

### SP — GetById (JOIN-uri cu IsDeleted pe toate tabelele join-uite)

```sql
-- Fișier: StoredProcedures/Consultation_GetById.sql
CREATE OR ALTER PROCEDURE dbo.Consultation_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Id, c.ClinicId, c.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        p.PhoneNumber AS PatientPhone,
        p.Cnp AS PatientCnp,
        c.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        c.Date, c.Motiv, c.ExamenClinic, c.Diagnostic, c.DiagnosticCodes,
        c.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        c.IsDeleted, c.CreatedAt, c.UpdatedAt
    FROM dbo.Consultations c
    -- INNER JOIN pe entități obligatorii
    INNER JOIN dbo.Patients p            ON p.Id = c.PatientId   -- AND p.IsDeleted = 0 NU e necesar
    INNER JOIN dbo.Doctors d             ON d.Id = c.DoctorId    -- pentru FK-uri active
    LEFT  JOIN dbo.Specialties sp        ON sp.Id = d.SpecialtyId AND sp.IsDeleted = 0
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    -- LEFT JOIN pe opționale
    LEFT  JOIN dbo.Users cu              ON cu.Id = c.CreatedBy
    WHERE c.Id = @Id
      AND c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
    -- Consultațiile șterse NU se returnează: o fișă medicală ștearsă nu se mai deschide.
    -- Alte entități pot alege altfel; decizia se documentează în SP.
END;
GO
```

### SP — GetPaged (CTE + filtre + OFFSET/FETCH + 3 result sets)

```sql
-- Fișier: StoredProcedures/Consultation_GetPaged.sql
CREATE OR ALTER PROCEDURE dbo.Consultation_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200) = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0) = NULL,
    @DateTo     DATETIME2(0) = NULL,
    @Page       INT = 1,
    @PageSize   INT = 20,
    @SortBy     NVARCHAR(50) = 'Date',
    @SortDir    NVARCHAR(4) = 'desc'  -- 'asc' sau 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH FilteredConsultations AS (
        SELECT
            c.Id, c.Date, c.Diagnostic, c.DiagnosticCodes, c.StatusId, c.IsDeleted, c.CreatedAt,
            CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
            CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
            s.Name AS StatusName, s.Code AS StatusCode
        FROM dbo.Consultations c
        INNER JOIN dbo.Patients p              ON p.Id = c.PatientId
        INNER JOIN dbo.Doctors d               ON d.Id = c.DoctorId
        INNER JOIN dbo.ConsultationStatuses s   ON s.Id = c.StatusId
        WHERE c.ClinicId = @ClinicId
          AND c.IsDeleted = 0                  -- ← IsDeleted pe tabelul principal
          AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
          AND (@StatusId IS NULL OR c.StatusId = @StatusId)
          AND (@DateFrom IS NULL OR c.Date >= @DateFrom)
          AND (@DateTo   IS NULL OR c.Date <  DATEADD(DAY, 1, @DateTo))
          AND (@Search IS NULL OR @Search = ''
               OR CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%'
               OR c.Diagnostic LIKE '%' + @Search + '%')
    )

    -- Result set 1: rânduri paginate cu ORDER BY dinamic
    SELECT * FROM FilteredConsultations
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy WHEN 'Date' THEN CONVERT(NVARCHAR(30), Date, 126)
                         WHEN 'PatientName' THEN PatientName
                         ELSE CONVERT(NVARCHAR(30), Date, 126) END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy WHEN 'Date' THEN CONVERT(NVARCHAR(30), Date, 126)
                         WHEN 'PatientName' THEN PatientName
                         ELSE CONVERT(NVARCHAR(30), Date, 126) END
        END DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count (refac filtrele, fără JOIN-uri la Display columns)
    SELECT COUNT(*)
    FROM dbo.Consultations c
    INNER JOIN dbo.Patients p ON p.Id = c.PatientId
    WHERE c.ClinicId = @ClinicId AND c.IsDeleted = 0
      AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId);

    -- Result set 3: statistici (opțional — specifice featurului)
    SELECT
        COUNT(*) AS TotalConsultations,
        SUM(CASE WHEN s.Code = 'INLUCRU' THEN 1 ELSE 0 END) AS DraftCount,
        SUM(CASE WHEN s.Code = 'FINALA'  THEN 1 ELSE 0 END) AS FinalCount
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    WHERE c.ClinicId = @ClinicId AND c.IsDeleted = 0;
END;
GO
```

### Erori SQL custom — THROW (nu RAISERROR)

```sql
-- THROW syntax corect (codul trebuie să existe în SqlErrorCodes.cs)
;THROW 50020, N'Consultația nu a fost găsită.', 1;
-- NU: RAISERROR('...', 16, 1)

-- Prindere în C# handler:
catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound) { ... }
catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000) { ... }  // catch-all
```

---

## Pattern-uri frontend

### 1. Types — structura fișierului

```typescript
// client/src/features/consultations/types/consultation.types.ts
// Importă din schema.d.ts (auto-generat) — NU se scrie manual
import type { components } from '@/api/generated/schema'

export type ConsultationListDto    = components['schemas']['ConsultationListDto']
export type ConsultationDetailDto  = components['schemas']['ConsultationDetailDto']
export type CreateConsultationPayload = components['schemas']['CreateConsultationCommand']
export type UpdateConsultationPayload = { id: string } & components['schemas']['UpdateConsultationRequest']

// Params pentru hook-urile de query
export interface GetConsultationsParams {
  search?:   string
  doctorId?: string
  statusId?: string
  dateFrom?: string
  dateTo?:   string
  page?:     number
  pageSize?: number
  sortBy?:   string
  sortDir?:  'asc' | 'desc'
}
```

### 2. Query keys

```typescript
export const consultationKeys = {
  all:     ['consultations'] as const,
  lists:   () => [...consultationKeys.all, 'list'] as const,
  list:    (params: GetConsultationsParams) =>
             [...consultationKeys.lists(), params] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail:  (id: string) => [...consultationKeys.details(), id] as const,
}
```

### 3. Hooks — query + mutations (inclusiv delete)

```typescript
// client/src/features/consultations/hooks/useConsultations.ts

// ─── Queries ───────────────────────────────────────────────────────────────
export const useConsultations = (params: GetConsultationsParams) =>
  useQuery({
    queryKey: consultationKeys.list(params),
    queryFn:  () => consultationsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1 * 60 * 1000, // 1 min
  })

export const useConsultation = (id: string) =>
  useQuery({
    queryKey: consultationKeys.detail(id),
    queryFn:  () => consultationsApi.getById(id),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  })

// ─── Mutations ─────────────────────────────────────────────────────────────
export const useCreateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateConsultationPayload) =>
                  consultationsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}

export const useUpdateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateConsultationPayload) =>
                  consultationsApi.update(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
      qc.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) })
    },
  })
}

// DELETE — invalidează lista după ștergere
export const useDeleteConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => consultationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}
```

### 4. API client

**Interceptorul de răspuns din `axiosInstance.ts` face deja `(response) => response.data`.**
Deci `api.get(...)` întoarce `ApiResponse<T>`, nu `AxiosResponse`. Fișierele `*.api.ts`
declară asta în tipul de retur și **nu** mai despachetează nimic; consumatorul (hook-ul
sau componenta) citește `.data`.

```typescript
// client/src/api/endpoints/consultations.api.ts
import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'

export const consultationsApi = {
  getAll: (params: GetConsultationsParams): Promise<ApiResponse<ConsultationsPagedResponse>> =>
    api.get('/api/v1/Consultations', { params }),

  getById: (id: string): Promise<ApiResponse<ConsultationDetailDto>> =>
    api.get(`/api/v1/Consultations/${id}`),

  create: (payload: CreateConsultationPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Consultations', payload),

  update: ({ id, ...data }: UpdateConsultationPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Consultations/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Consultations/${id}`),
}
```

`ApiResponse<T>` = `{ success, data: T | null, message, errors }` (`types/common.types.ts`).

> **Nu scrie `.then(r => r.data.data)`** — cu interceptorul de mai sus ai deja
> `ApiResponse<T>` în mână, deci `r.data` e valoarea, iar `r.data.data` e `undefined`.
>
> `consultations.api.ts` e cazul special în care fișierul de API face și transformare:
> `getById` primește de la server un DTO ierarhic (`anamnesis` / `exam` ca sub-obiecte,
> după 0035) și îl aplatizează pentru formular, iar `create` sparge payload-ul în
> POST header + PUT `/anamnesis` + PUT `/exam`. E o excepție documentată în fișier,
> nu un pattern de copiat.

### 5. Zod schema

```typescript
// client/src/features/consultations/schemas/consultation.schema.ts
export const consultationSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:  z.string().min(1, 'Doctorul este obligatoriu'),
  date:      z.string().min(1, 'Data consultației este obligatorie'),
  // Text opțional: `.optional().or(z.literal(''))` — un input golit trimite '',
  // nu undefined, deci ambele forme trebuie acceptate.
  motiv:     z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Numeric opțional: `.nullable().optional()` — inputul Syncfusion dă null la golire.
  greutate:  z.number().nullable().optional(),
  spO2:      z.number().int().nullable().optional(),
  esteAfectiuneOncologica: z.boolean().optional(),
})
export type ConsultationFormData = z.infer<typeof consultationSchema>
```

> **Zod 4** — `z.number({ invalid_type_error: '...' })` nu mai există; parametrul se
> numește `error`. Schemele din proiect nu personalizează mesajul de tip: pe un câmp
> numeric opțional, mesajul implicit nu ajunge la utilizator.
>
> Evită `.default(false)` pe boolean-uri: face câmpul opțional la intrare dar obligatoriu
> în `z.infer`, ceea ce desincronizează tipul formularului de payload-ul API. Folosește
> `.optional()` în schemă și `defaultValues` în `useForm`.

### 6. react-hook-form — `name` + `control`, fără `<Controller>`

Wrapper-ele de formular apelează `useController` **în interior**. Primesc `name` +
`control` direct și afișează singure mesajul de eroare din `fieldState`. Nu le
împachetezi în `<Controller>` — ar fi două `useController` pe același câmp.

```typescript
const { handleSubmit, reset, control, formState: { errors } } =
  useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId:               '',
      doctorId:                '',
      date:                    '',
      motiv:                   '',
      esteAfectiuneOncologica: false,
    },
  })

// Parametrul generic e obligatoriu: dă type-safety pe `name` (o cheie inexistentă
// în ConsultationFormData e eroare de compilare, nu un câmp care nu se leagă).
<FormInput<ConsultationFormData>
  name="motiv"
  control={control}
  label="Motivul consultației"
  multiline
  rows={4}
  maxLength={4000}
/>

<FormDatePicker<ConsultationFormData>
  name="date"
  control={control}
  label="Data consultației"
  required
/>

<FormSelect<ConsultationFormData>
  name="doctorId"
  control={control}
  label="Doctor"
  dataSource={doctorOptions}
  fields={{ text: 'label', value: 'value' }}
  allowFiltering
/>
```

Wrapper-ele care EXISTĂ în `client/src/components/forms/`:

| Component | Bază | Note |
|---|---|---|
| `FormInput` | Syncfusion `TextBoxComponent` | `multiline` + `rows` acoperă cazul textarea |
| `FormSelect` | Syncfusion `DropDownListComponent` | `allowFiltering`, `showClearButton` |
| `FormDatePicker` | Syncfusion `DatePickerComponent` | format `dd.MM.yyyy`, `locale='ro'` |
| `FormPhoneInput` | `react-phone-number-input` | nu Syncfusion |
| `FormRichText` | **TipTap** (`@tiptap/react` + StarterKit) | toolbar cu icoane `lucide-react` |
| `AddressAutocomplete`, `AddressFields`, `CaenCodeMultiSelect` | compuse | specifice domeniului |

**Nu există `FormTextArea`, `FormCheckbox`, `FormSwitch`.** Pentru textarea →
`FormInput` cu `multiline`. Pentru boolean → `<input type="checkbox">` cu `register()`,
ca în formularele existente.

### 7. Zustand store (auth)

```typescript
// Access token-ul traieste DOAR in memorie — nu e persistat nicaieri, deci un XSS
// nu il poate citi din storage. La reload, sesiunea se reconstruieste prin
// /api/v1/Auth/refresh; cookie-ul HttpOnly e singura sursa de adevar.
// `user` si `permissions` raman persistate: nu sunt credentiale.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,   // in memorie, exclus din partialize
      permissions:     [],     // ModulePermission[] = { module, level, isOverridden }
      isAuthenticated: false,
      isBootstrapping: true,   // "inca nu stim" != "neautentificat"
      // Fereastra de inactivitate a ROLULUI, in minute. Vine de la server la fiecare
      // login si refresh, deci o modificare din ecranul de administrare a securitatii
      // se aplica la urmatoarea reimprospatare, fara redeploy.
      idleTimeoutMinutes: 0,
      setAuth: (user, accessToken, permissions, idleTimeoutMinutes) =>
        set((state) => ({
          user, accessToken, permissions, isAuthenticated: true,
          // Pastram valoarea anterioara daca raspunsul nu o contine, ca sa nu
          // dezactivam accidental cronometrul.
          idleTimeoutMinutes: idleTimeoutMinutes ?? state.idleTimeoutMinutes,
        })),
      // + updateToken, updatePermissions, clearMustChangePassword,
      //   finishBootstrap, clearAuth
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // accessToken lipseste intentionat
      partialize: (s) => ({
        user: s.user, permissions: s.permissions,
        isAuthenticated: s.isAuthenticated, idleTimeoutMinutes: s.idleTimeoutMinutes,
      }),
    },
  ),
)
```

`AuthUser` (definit o singura data, in `features/auth/types/auth.types.ts`, importat de
store) are `id`, `email`, `fullName`, `role` (`UserRole` = codul lowercase), `roleId`,
`clinicId`, `doctorId: string | null`, `mustChangePassword?`.

> `user.doctorId` exista pe CLIENT, dar nu e o sursa de autoritate: serverul nu are
> claim-ul si nu accepta un `doctorId` trimis de client ca filtru (vezi §5 ICurrentUser).
> Foloseste-l doar pentru afisare si pentru pre-selectarea medicului in formulare.

Reconstruirea sesiunii la incarcarea paginii se face in `useSessionBootstrap`, cu
apelul de refresh deduplicat la nivel de modul — rotatia e atomica pe server, deci
doua cereri concurente cu acelasi token inseamna ca una primeste 401.

### 8. useHasAccess — guard pentru permisiuni în UI

Hook-ul se apelează **fără argumente** și întoarce un set de verificatori. Sursa
permisiunilor este `authStore.permissions` (listă `{ module, level, isOverridden }`
venită de la `/login` și `/refresh`), nu `user.permissions`.

```typescript
// client/src/hooks/useHasAccess.ts
export const useHasAccess = () => {
  const permissions = useAuthStore((s) => s.permissions)
  // ... permMap: Map<string, number> memoizat
  return { hasAccess, getLevel, canRead, canWrite, hasFull }
}

// Folosire în component:
const { canRead, canWrite, hasFull } = useHasAccess()
const canDelete = hasFull(MODULE.Consultations)
{canDelete && <AppButton onClick={handleDelete}>Șterge</AppButton>}

// Verificare pe mai multe module — semantica e AND (vezi Sidebar.tsx):
// o pagină care citește din două module e inutilizabilă fără unul dintre ele.
const canOpenMedicamente = [MODULE.Anm, MODULE.Cnas].every(canRead)
```

`MODULE` (client) trebuie să rămână sincron cu `ModuleCodes` (backend). Un cod
folosit în client dar absent din `MODULE` este eroare de tip și **rupe
`npm run build`**, chiar dacă în `npm run dev` pare că funcționează.

---

## Patterns de test (backend)

### Handler test — structură și reguli

```csharp
// Fișier real: tests/ValyanClinic.Tests/Handlers/CreateConsultationCommandHandlerTests.cs
public sealed class CreateConsultationCommandHandlerTests
{
    // Guid-uri fixe cu prefix distinctiv pentru debugging (A=ClinicId, B=UserId, C=new)
    private static readonly Guid ClinicId = Guid.Parse("A1000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B1000001-0000-0000-0000-000000000001");
    private static readonly Guid NewId    = Guid.Parse("C1000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public CreateConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private CreateConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    // Builder cu TOȚI parametrii expliciți, argumente numite (R7).
    // Câmpurile opționale = null/false — forma canonică.
    private static CreateConsultationCommand ValidCommand() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddHours(1),
        Investigatii: null,
        AnalizeMedicale: null,
        Diagnostic: null,
        DiagnosticCodes: null,
        Recomandari: null,
        Observatii: null,
        Concluzii: null,
        EsteAfectiuneOncologica: false,
        AreIndicatieInternare: false,
        SaEliberatPrescriptie: false,
        SeriePrescriptie: null,
        SaEliberatConcediuMedical: false,
        SerieConcediuMedical: null,
        SaEliberatIngrijiriDomiciliu: false,
        SaEliberatDispozitiveMedicale: false,
        DataUrmatoareiVizite: null,
        NoteUrmatoareaVizita: null,
        StatusId: null);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        // Arrange — un Arg.Any<>() per parametru al semnăturii: data, createdBy, ct.
        // Record-ul de date (§8) e UN singur argument, deci mock-ul nu se schimbă
        // când se adaugă un câmp în ConsultationCreateData.
        _repo.CreateAsync(Arg.Any<ConsultationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        // Act
        var result = await CreateHandler().Handle(ValidCommand(), default);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(NewId, result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.CreateAsync(Arg.Any<ConsultationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        await CreateHandler().Handle(ValidCommand(), default);

        // Arg.Is<T>(predicat) pentru a inspecta un câmp din record — testul verifică
        // exact ce contează (tenantul și autorul), fără să enumere restul câmpurilor.
        await _repo.Received(1).CreateAsync(
            Arg.Is<ConsultationCreateData>(d => d.ClinicId == ClinicId),
            UserId,                              // ← currentUser.Id, valoare exactă
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.CreateAsync(Arg.Any<ConsultationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
```

**Reguli care se aplică oricărui test de handler:**

1. **Numărul de `Arg.Any<>()` = numărul de parametri ai semnăturii, nu numărul de
   câmpuri.** Cu record de date (§8) sunt 3: `Arg.Any<{Entity}CreateData>()`,
   `Arg.Any<Guid>()`, `Arg.Any<CancellationToken>()`. O discrepanță → NSubstitute nu
   recunoaște apelul, `.Returns()` nu se aplică, iar testul pică pe `null`/`default`.
2. **`Arg.Is<T>(predicat)` peste enumerarea tuturor argumentelor.** Verifică doar câmpul
   pe care testul îl afirmă. Așa un câmp nou nu rupe testele existente.
3. **Valoare exactă pentru ce vine din `ICurrentUser`** (`UserId`, nu `Arg.Any<Guid>()`) —
   e chiar afirmația testului.
4. **Un `Guid` fix per rol semantic**, cu prefix distinctiv, ca un mesaj de eșec să spună
   ce s-a inversat.

### Delete handler test — prindere specifică NotFound (404)

```csharp
public sealed class DeleteConsultationCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A3000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B3000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C3000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public DeleteConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private DeleteConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);
    private static DeleteConsultationCommand ValidCommand()  => new(Id: ConsultationId);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        // DeleteAsync returnează Task (void) → .Returns(Task.CompletedTask)
        _repo.DeleteAsync(ConsultationId, ClinicId, UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
        Assert.Equal(200, result.StatusCode);
    }

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        // Codul specific → 404
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        // Alt cod din range → 400
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
```

### GetById query test — null check → NotFound

```csharp
[Fact]
public async Task Handle_ConsultationExists_ReturnsSuccess()
{
    var dto = new ConsultationDetailDto { Id = ConsultationId };
    _repo.GetByIdAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>()).Returns(dto);

    var result = await CreateHandler().Handle(new GetConsultationByIdQuery(ConsultationId), default);

    Assert.True(result.IsSuccess);
    Assert.Equal(200, result.StatusCode);
    Assert.Equal(dto, result.Value);
}

[Fact]
public async Task Handle_ConsultationNotFound_ReturnsNotFound()
{
    _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
         .Returns((ConsultationDetailDto?)null);

    var result = await CreateHandler().Handle(new GetConsultationByIdQuery(ConsultationId), default);

    Assert.False(result.IsSuccess);
    Assert.Equal(404, result.StatusCode);
}
```

### Validator test — TestValidate pattern

```csharp
public sealed class CreateConsultationCommandValidatorTests
{
    private readonly CreateConsultationCommandValidator _validator = new();

    // Builder cu date minime valide, argumente numite (R7)
    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId:  Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddDays(1),
        Investigatii: null,
        AnalizeMedicale: null,
        Diagnostic: null, DiagnosticCodes: null,
        Recomandari: null, Observatii: null, Concluzii: null,
        EsteAfectiuneOncologica: false, AreIndicatieInternare: false,
        SaEliberatPrescriptie: false, SeriePrescriptie: null,
        SaEliberatConcediuMedical: false, SerieConcediuMedical: null,
        SaEliberatIngrijiriDomiciliu: false, SaEliberatDispozitiveMedicale: false,
        DataUrmatoareiVizite: null, NoteUrmatoareaVizita: null,
        StatusId: null);

    [Fact]
    public void MinimalValid_ShouldPassValidation()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError()
    {
        // `with` pe record: un singur câmp schimbat, restul rămâne forma canonică
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");
    }

    [Fact]
    public void Diagnostic_WhenTooLong_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Diagnostic = new string('x', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Diagnostic)
                  .WithErrorMessage("Diagnosticul nu poate depăși 4000 de caractere.");
    }
}
```

> `WithErrorMessage` compară textul exact. Dacă schimbi un mesaj în validator, testul
> pică — intenționat: mesajul ajunge la utilizator, deci e parte din contract.

### SqlExceptionHelper — crearea SqlException cu Number custom

```csharp
// tests/ValyanClinic.Tests/TestHelpers/SqlExceptionHelper.cs
// SqlException nu poate fi instanțiată direct (constructor intern) → reflection:
// se construiește un SqlErrorCollection, în el un SqlError cu infoNumber = number,
// apoi excepția din colecție.
internal static class SqlExceptionHelper
{
    internal static SqlException Make(int number) { /* reflection peste Microsoft.Data.SqlClient */ }
}

// Folosire:
.Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound))
.Throws(SqlExceptionHelper.Make(50999))  // cod generic din range
```

> **Semnătura are UN singur parametru** — `Make(int number)`. Nu există parametru de
> mesaj: handler-ele se ramifică pe `ex.Number`, nu pe text. Helper-ul e `internal`,
> deci vizibil doar în `ValyanClinic.Tests`.

---

## NU face (anti-patterns)

### Backend

| Greșeală | De ce e greșit | Alternativă corectă |
|---|---|---|
| `using Microsoft.EntityFrameworkCore` | Proiectul nu folosește EF Core — **ZERO** DbContext | Dapper + StoredProcedures |
| `Add-Migration` / `dotnet ef migrations add` | Nu există EF în proiect | Fișier SQL în `Scripts/Migrations/` + DbUp |
| `RAISERROR('...', 16, 1)` în SP | RAISERROR e sintaxă veche; nu populează `.Number` corect pentru catch-uri | `;THROW 50020, N'...', 1;` |
| Validare cu `await repository.ExistsAsync()` în handler | Double round-trip la BD pentru ceva ce SP-ul verific oricum | Lasă SP-ul să arunce THROW; prinde în handler |
| `if (result == null) throw new NotFoundException()` | Excepțiile ca flow control nu sunt folosite în acest proiect | `return Result<T>.NotFound(ErrorMessages.X.NotFound)` |
| `services.AddTransient<DapperContext>()` | DapperContext este Singleton (o instanță per aplicație) | `services.AddSingleton<DapperContext>()` |
| Constructor public pe `Result<T>` | Constructorul e `private` — există doar factory methods | `Result<T>.Success()`, `.Created()`, `.NotFound()`, etc. |
| `Task<Guid> CreateAsync(Guid clinicId, Guid patientId, /* +45 */)` | Semnătură pozițională lungă: două `Guid?` vecine se pot inversa tăcut, iar fiecare câmp nou rupe toate mock-urile | `Task<Guid> CreateAsync({Entity}CreateData data, Guid createdBy, CancellationToken ct)` — vezi §8 |
| `currentUser.IsAdmin` | Membrul nu există pe `ICurrentUser` | `currentUser.IsInRole(Roles.Admin)` |
| `currentUser.DoctorId` | Nu există nici pe interfață, nici ca claim în JWT | SP-ul rezolvă `Users.DoctorId` din `@UserId` |

### Frontend

| Greșeală | De ce e greșit | Alternativă corectă |
|---|---|---|
| `localStorage.setItem('token', ...)` sau persistarea access token-ului în `sessionStorage` | Orice storage citibil din JS e expus la XSS | Token DOAR în memorie (Zustand fără persist pe câmp); sesiunea se reface din cookie-ul HttpOnly de refresh |
| Import neutilizat (`useCallback`, `useState`, etc.) | ESLint `no-unused-vars = error` → CI pică la lint | Șterge imediat importul dacă nu îl folosești |
| `import { GridComponent } from '@syncfusion/ej2-react-grids'` | Nu folosim GridComponent direct — avem wrapper `AppDataGrid` | `import { AppDataGrid } from '@/components/data-display/AppDataGrid'` |
| Scriere manuală în `schema.d.ts` | Fișierul e auto-generat — orice editare manuală va fi suprascrisă | Modifică API-ul, regenerează cu `npm run gen:api` |
| `api.get(...).then(r => r.data.data)` | Interceptorul din `axiosInstance.ts` returnează deja `response.data`, deci `r` **este** `ApiResponse<T>`; `r.data.data` e `undefined` | `api.get(...)` tipizat `Promise<ApiResponse<T>>`; consumatorul citește `.data` |
| `<Controller render={({ field }) => <FormInput field={field} />} />` | Wrapper-ele apelează `useController` intern — ai două controllere pe același câmp | `<FormInput<FormData> name="x" control={control} />` |
| `<FormTextArea>`, `<FormCheckbox>`, `<FormSwitch>` | Nu există în `components/forms/` | `FormInput` cu `multiline`; checkbox nativ cu `register()` |
| `useQuery` cu `queryKey: ['consultations']` (static) | Invalidarea nu va funcționa corect pentru filtre diferite | Folosește `consultationKeys.list(params)` din fișierul de keys |

---

## CI/CD (.github/workflows/ci.yml)

Trei job-uri paralele:

| Job | Ce face |
|---|---|
| `backend` | `dotnet restore` → `build` → `test` cu coverage → upload artifact |
| `frontend` | `npm ci` → `lint` → `test:unit:coverage` → `build` → upload artifact |
| `contract` | `npm run check:api` (gen types din openapi + `tsc --noEmit`) |

Node.js: 22 | .NET: 10.0.x | `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`

---

## Frontend routing — cum se adaugă o rută nouă

Fișier: `client/src/routes/AppRoutes.tsx`. Toate rutele protejate sunt sub `<ProtectedRoute>` → `<MainLayout>`.

```typescript
// Pasul 1: Lazy import în capul fișierului AppRoutes.tsx
const DocumentsPage = lazy(() => import('../features/documents/pages/DocumentsListPage'))

// Pasul 2: Adaugă ruta în blocul protejat
<Route path="/documents" element={<DocumentsPage />} />

// Rute cu parametru de ID:
const DocumentDetailPage = lazy(() => import('../features/documents/pages/DocumentDetailPage'))
<Route path="/documents/:id" element={<DocumentDetailPage />} />

// Structura completă (pentru referință):
export const AppRoutes = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Public — fără auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protejat — necesită auth */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<DashboardPage />} />
          {/* ... toate rutele existente ... */}
          <Route path="/documents"     element={<DocumentsPage />} />    {/* ← NOU */}
          <Route path="/documents/:id" element={<DocumentDetailPage />} /> {/* ← NOU */}
        </Route>
      </Route>

      {/* Fallback — orice rută necunoscută → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
)
```

**Navigare din cod:**
```typescript
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/documents')           // go to list
navigate(`/documents/${id}`)     // go to detail
navigate(-1)                     // back
```

**Link în JSX:**
```typescript
import { Link } from 'react-router-dom'
<Link to={`/documents/${id}`}>Deschide</Link>
```

---

## Syncfusion EJ2 — cheatsheet import-uri

> Syncfusion are import paths complexe. Folosim doar componentele de mai jos — **nu instala** alte pachete `@syncfusion/ej2-react-*` fără discuție.

### CSS — importat o singură dată în `main.tsx`

```typescript
// Aceste CSS-uri sunt deja importate în main.tsx — NU le reimporta în componente
import '@syncfusion/ej2-base/styles/bootstrap5.css'
import '@syncfusion/ej2-buttons/styles/bootstrap5.css'
import '@syncfusion/ej2-inputs/styles/bootstrap5.css'
import '@syncfusion/ej2-lists/styles/bootstrap5.css'
import '@syncfusion/ej2-popups/styles/bootstrap5.css'
import '@syncfusion/ej2-navigations/styles/bootstrap5.css'
import '@syncfusion/ej2-calendars/styles/bootstrap5.css'
import '@syncfusion/ej2-dropdowns/styles/bootstrap5.css'
import '@syncfusion/ej2-splitbuttons/styles/bootstrap5.css'
import '@syncfusion/ej2-grids/styles/bootstrap5.css'
import '@syncfusion/ej2-richtexteditor/styles/bootstrap5.css'
```

`main.tsx` configurează și localizarea: `registerLicense`, `L10n`, `loadCldr`,
`setCulture`, `setCurrencyCode`. Nu le duplica în componente.

### Componente folosite — import-uri corecte

```typescript
// ─── Text input ────────────────────────────────────────────────────────────
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs'
// Wrapper existent: FormInput — FOLSEȘTE FormInput, nu TextBoxComponent direct

// ─── Dropdown ──────────────────────────────────────────────────────────────
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns'
// Wrapper existent: FormSelect — FOLOSEȘTE FormSelect
// Props uzuale:
// dataSource={options}           — array de { label: string, value: string }
// fields={{ text: 'label', value: 'value' }}
// allowFiltering={true}          — search în dropdown
// showClearButton={true}         — buton X
// sortOrder='Ascending'          — sortare

// ─── Date picker ───────────────────────────────────────────────────────────
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars'
// Wrapper existent: FormDatePicker — FOLOSEȘTE FormDatePicker
// Props uzuale:
// format='dd.MM.yyyy'            — format românesc (default)
// locale='ro'
// firstDayOfWeek={1}             — luni prima zi
// min={new Date()}               — data minimă
// max={new Date(2099, 11, 31)}   — data maximă
// showTodayButton={true}
// strictMode={false}             — permite editare manuală
// Returnează Date object în args.value → convertit la string cu toLocalDateISO()

// ─── Rich Text Editor — ATENȚIE: DOUĂ editoare diferite în proiect ─────────
// 1. FormRichText (components/forms/FormRichText) = TipTap, NU Syncfusion.
//    Pentru orice câmp de text bogat dintr-un formular → FOLOSEȘTE FormRichText.
//
// 2. Syncfusion RTE apare DOAR în components/icd10/ (PrimaryDiagnosisSelector,
//    SecondaryDiagnosesList), unde editorul e împletit cu selecția de coduri ICD-10.
//    Nu extinde acest uz la componente noi.
import {
  RichTextEditorComponent, Inject,
  Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize, ToolbarType
} from '@syncfusion/ej2-react-richtexteditor'
// OBLIGATORIU în interiorul componentei:
// <Inject services={[Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize]} />
// Fără <Inject> → toolbar-ul nu apare, fără nicio eroare în consolă.
// `Image` NU e injectat: încărcarea de imagini nu e activată nicăieri.
const TOOLBAR_ITEMS = [
  'Bold', 'Italic', 'Underline', 'StrikeThrough', '|',
  'OrderedList', 'UnorderedList', '|',
  'Indent', 'Outdent', '|',
  'CreateLink', '|',
  'Undo', 'Redo',
]
// toolbarSettings={{ items: TOOLBAR_ITEMS, enableFloating: false, type: ToolbarType.Expand }}
// value + change: ref pentru citire, nu prop controlat
const rteRef = useRef<RichTextEditorComponent | null>(null)
const handleChange = useCallback(() => {
  onChange(rteRef.current?.value ?? '')
}, [onChange])
<RichTextEditorComponent ref={rteRef} value={value ?? ''} change={handleChange} />
```

### Ce NU există / NU folosim din Syncfusion

```typescript
// NU folosim GridComponent direct — avem AppDataGrid custom
// import { GridComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-grids'  ← NU
import { AppDataGrid } from '@/components/data-display/AppDataGrid'  // ← DA

// NU avem MultiSelectComponent, AutoCompleteComponent,
// DateRangePickerComponent, DateTimePickerComponent,
// ScheduleComponent, ChartComponent — nu sunt instalate
// Dacă ai nevoie → discuție înainte de instalare
```

### License registration — deja configurat în `main.tsx`

```typescript
// Deja setat în client/src/main.tsx — NU duplica în componente
import { registerLicense } from '@syncfusion/ej2-base'
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY)
// Fără licență → watermark în producție
```

---

## @dnd-kit — drag-and-drop (reordonare favorite sidebar)

Singurul loc din client unde se folosește drag-and-drop azi e reordonarea
favoritelor din `Sidebar.tsx` (`client/src/features/sidebar/components/SortableFavoriteItem.tsx`).
Nu instala alte biblioteci DnD fără discuție — `@dnd-kit` acoperă orice caz nou de
reordonare listă.

```typescript
// Sidebar.tsx — context + senzori (mouse/touch + tastatură)
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

const dndSensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), // prag anti drag-accidental la click
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIndex = favoriteRoutes.indexOf(active.id as string)
  const newIndex = favoriteRoutes.indexOf(over.id as string)
  if (oldIndex === -1 || newIndex === -1) return
  upsertFavorites.mutate(arrayMove(favoriteRoutes, oldIndex, newIndex)) // ordinea array-ului = ordinea de afișare
}

<DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={isSearching}>
    {items.map((item) => <SortableFavoriteItem key={item.to} {...item} />)}
  </SortableContext>
</DndContext>
```

```typescript
// SortableFavoriteItem.tsx — fiecare item sortabil
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: to })
const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

<div ref={setNodeRef} style={style}>
  <button {...attributes} {...listeners} aria-label={`Reordonează ${label}`}>{/* grip icon */}</button>
  {/* link + restul conținutului */}
</div>
```

**Reguli:**
- `SortableContext` primește `disabled` când lista vizibilă e un subset filtrat (ex: căutare activă) —
  reordonarea unui subset ar produce o ordine incorectă față de lista completă.
- `arrayMove` operează pe array-ul complet (`favoriteRoutes`), nu pe subsetul filtrat afișat —
  `indexOf` pe id-uri găsește poziția corectă indiferent de itemii ascunși din
  array între ei.
- Grip-ul de drag e buton separat (`aria-label="Reordonează {label}"`), niciodată
  imbricat într-un `<a>` — `<button>` în `<a>` e semantic invalid.
- **Testare:** simularea unui drag real necesită layout (bounding boxes) pe care
  `jsdom` nu-l calculează — testele unitare verifică doar prezența/vizibilitatea
  grip-ului; reordonarea efectivă se verifică manual în browser sau printr-un
  spec Playwright (folosind `page.mouse.move/down/up` cu pași incrementali, nu
  `dragTo` HTML5 — `@dnd-kit` răspunde la evenimente de pointer, nu la API-ul
  nativ de drag).

---

## Feature autoservire fără `[HasAccess]` (ex: `UserMenuPreferences`)

Nu orice controller are nevoie de o gardă de modul. Când o resursă aparține
strict utilizatorului curent — propriile preferințe de sidebar, propria parolă
(`UsersController.ChangeOwnPassword`) — controller-ul rămâne protejat doar de
`[Authorize]`-ul moștenit din `BaseApiController`, fără `[HasAccess(Modul, Nivel)]`.

```csharp
// UserMenuPreferencesController.cs — orice cont autentificat își administrează
// propriul meniu, indiferent de rol; nu există un modul "dashboard preferences"
public class UserMenuPreferencesController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetUserMenuPreferencesQuery(), ct));

    [HttpPut]
    public async Task<IActionResult> Upsert(
        [FromBody] UpsertUserMenuPreferencesCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));
}
```

Handler-ul citește `currentUser.Id` și `currentUser.ClinicId` direct din `ICurrentUser`
— nu din body/query — exact ca la `ChangeOwnPasswordCommandHandler`. Nu există risc
de escaladare: userul nu poate niciodată specifica alt `UserId` decât al lui.

**Preferințe de sidebar — coloane dedicate, nu EAV.** `UserMenuPreferences` are o
singură coloană `FavoriteRoutes NVARCHAR(MAX)` (JSON, array ordonat de rute) —
ordinea array-ului E ordinea de afișare, deci reordonarea e doar o nouă valoare
pentru aceeași coloană. Preferințele pur locale (ex: secțiuni colapsate) rămân
în `localStorage` prin `uiStore`, nu ajung în BD.

---

## Reguli de lucru (IMPORTANT)

### R1 — Multi-tenancy obligatoriu

```csharp
// ORICE query pe date ale clinicii trece ClinicId din ICurrentUser
var result = await repository.GetPagedAsync(currentUser.ClinicId, ...);

// SP: WHERE c.ClinicId = @ClinicId — obligatoriu pe orice tabel cu coloana ClinicId
```

**Singura excepție: nomenclatoarele naționale.** `Anm_Drug`, `Anm_SyncLog`, `Cnas_*`
(inclusiv `Cnas_ICD10`), `NomenclatorSyncLog`, tabelele geografice (`Counties`, `Localities`,
`LocationTypes`) și `CaenCodes` sunt date de referință comune tuturor clinicilor și **nu au
coloană `ClinicId`** — un filtru pe clinică acolo n-ar compila. Legăturile per clinică
(`ClinicCaenCodes`, `ClinicLocations`) au `ClinicId` și se filtrează normal.

Regula rămâne: *dacă tabelul are `ClinicId`, filtrul e obligatoriu.*

**Atenție la `SecurityEvents`:** are `ClinicId`, dar **NULL-abil** — un login eșuat cu un
email necunoscut nu are clinică de atribuit. Un `WHERE ClinicId = @ClinicId` simplu ascunde
exact rândurile care interesează. Forma corectă:
`WHERE (ClinicId = @ClinicId OR ClinicId IS NULL)`.

### R2 — Soft delete pentru toate entitățile principale

```sql
-- Câmpul IsDeleted pe fiecare tabel principal
IsDeleted  BIT  NOT NULL DEFAULT 0

-- SP: filtru în ORICE SELECT
WHERE c.IsDeleted = 0

-- SP: Update care face delete
UPDATE dbo.Consultations SET IsDeleted = 1, UpdatedAt = SYSDATETIME(), UpdatedBy = @DeletedBy
```

### R3 — Audit obligatoriu

```sql
-- Coloane audit standard pe ORICE tabel principal
CreatedAt  DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME()
CreatedBy  UNIQUEIDENTIFIER NOT NULL
UpdatedAt  DATETIME2(0)     NULL
UpdatedBy  UNIQUEIDENTIFIER NULL
-- (și IsDeleted din R2)
```

### R4 — Logica business EXCLUSIV în SP-uri

```csharp
// CORECT: handler apelează SP, SP aruncă THROW la eroare
await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, ct);
// Dacă regula business nu e respectată, SP face THROW → SqlException → prinsă în handler

// GREȘIT: validare în C# pentru datele care există în BD
if (await repository.ExistsAsync(request.Id))  // ← NU face asta
    return Result.NotFound(...)
```

### R5 — THROW în SP, nu RAISERROR

```sql
-- CORECT: THROW cu cod din SqlErrorCodes.cs
;THROW 50020, N'Consultația nu a fost găsită.', 1;

-- GREȘIT: RAISERROR
RAISERROR('Nu s-a găsit.', 16, 1)  -- ← nu folosi
```

### R6 — Migration order secvențial

```
# Ultima migrare din repo: 0059_ConsultationsHardening.sql
# Următoarea migrare pornește de la 0060 — verifică întotdeauna cu:
#   ls src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/ | sort | tail -1

0060_NumeDescriptiv.sql    ← corect
0062_NumeDescriptiv.sql    ← greșit (a sărit 0061)
```

DbUp rulează în două faze (`DatabaseMigrator.cs`): `Scripts/Migrations/` o singură dată,
cu journal în `SchemaVersions`, apoi `Scripts/StoredProcedures/` la **fiecare** execuție,
cu `NullJournal` — de aceea SP-urile sunt `CREATE OR ALTER` și pot fi editate liber, în
timp ce o migrare deja aplicată nu se mai modifică niciodată.

### R7 — Named arguments la record constructors cu mulți parametri

```csharp
// CORECT — named args, fiecare pe linie proprie
private static CreateConsultationCommand ValidCommand() => new(
    PatientId: Guid.NewGuid(),
    DoctorId:  Guid.NewGuid(),
    Date:      DateTime.UtcNow,
    StatusId:  null);

// GREȘIT — pozițional, imposibil de întreținut
private static CreateConsultationCommand ValidCommand() => new(
    Guid.NewGuid(), Guid.NewGuid(), null, DateTime.UtcNow, null, null, ...);
```

### R8 — Orice modificare la IRepository → actualizează TOȚI mock-ii din teste

```csharp
// Ca să adaugi un câmp la crearea unei consultații:
// 1. Câmp nou în CreateConsultationCommand (record)
// 2. Câmp nou în ConsultationCreateData (record de date, lângă interfață)
// 3. Maparea în CreateConsultationCommandHandler (argument numit)
// 4. Parametrul Dapper în ConsultationRepository.CreateAsync (`new { data.CampNou }`)
// 5. Parametrul @CampNou în SP + coloana în migrare
// 6. Builder-ele din teste: ValidCommand() și MinimalValid() — compilarea le cere,
//    pentru că record-ul n-are constructor implicit
// 7. Regenerezi contractul: generate-openapi.ps1 → npm run gen:api (R9)
//
// Pasul care NU mai e necesar: mock-urile. `Arg.Any<ConsultationCreateData>()` rămâne
// valid indiferent câte câmpuri are record-ul. De aceea semnătura primește un record
// și nu parametri poziționali.
//
// ATENȚIE la repository-urile care ÎNCĂ au semnături poziționale lungi: acolo pasul 6
// include și fiecare `Arg.Any<>()` din fiecare mock, altfel NSubstitute nu recunoaște
// apelul și testul pică pe o valoare default, nu cu un mesaj clar.
```

### R9 — OpenAPI contract — regenerare după orice schimbare de endpoint

```powershell
# Frontend CI rulează: npm run check:api
# Dacă API-ul s-a schimbat fără regenerare → contract job pică

# Regenerare manuală:
cd client && npm run gen:api   # rescrie schema.d.ts din openapi-v1.json
```

### R10 — Import-uri neutilizate în frontend = eroare CI

```typescript
// ESLint no-unused-vars = error → CI pică la lint
// GREȘIT:
import { useCallback, useEffect } from 'react'  // useCallback nefolosit → ← CI pică
// CORECT:
import { useEffect } from 'react'
```

---

## Comenzi utile

```powershell
# Backend
dotnet build                                    # build soluție
dotnet test tests/ValyanClinic.Tests            # rulează testele
.\migrate.ps1                                   # aplică migrări (dev)
.\migrate.ps1 -Env Production                  # aplică migrări (prod)

# Frontend
cd client
npm run lint                                    # ESLint
npm run test:unit                               # Vitest
npm run test:unit:coverage                      # cu coverage
npm run gen:api                                 # regenerează schema.d.ts din openapi
npm run check:api                               # validează contractul API
npm run build                                   # build producție

# Git
git add -A ; git commit -m "feat: ..." ; git push origin main
```

---

## Packages cheie & versiuni

| Package | Versiune |
|---|---|
| .NET | 10.0 |
| MediatR | 14.x |
| FluentValidation | 12.x |
| Dapper | (ultima) |
| Mapster | 7.4.0 |
| Serilog.AspNetCore | 9.x |
| Swashbuckle | 7.x |
| React | 19.2.0 |
| TanStack Query | 5.x |
| Zustand | 4.x |
| Zod | 4.x |
| react-hook-form | 7.x |
| Axios | `^1.13.5` în package.json · **1.13.5** în package-lock.json |
| Syncfusion EJ2 | 32.x |
| TipTap | 3.x (`@tiptap/react`, `starter-kit`, `extension-link/underline/placeholder`) |
| lucide-react | 0.577.x |
| @dnd-kit/core | 6.3.1 |
| @dnd-kit/sortable | 10.0.0 |
| @dnd-kit/utilities | 3.2.2 |

> ⚠️ **Axios — NU face upgrade fără verificare manuală.**
> Pe 31 martie 2025 pachetul `axios@1.14.1` a conținut malware (supply chain attack).
> Versiunea sigură confirmată: `1.13.5`. Verifică înainte de orice `npm update axios`.
>
> **Versiunea NU e blocată în `package.json`** — acolo e `^1.13.5`, un interval caret care
> acceptă orice `1.x` ulterior. Ce ține azi versiunea la 1.13.5 e **`package-lock.json`**,
> respectat de `npm ci` (folosit în CI). Un `npm install axios` sau `npm update axios` local
> poate ridica versiunea în interval. Dacă intenția e blocare reală, scrie `"axios": "1.13.5"`
> fără caret.
