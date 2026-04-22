# CLAUDE.md — ValyanClinic CMS Reference

Fișier de referință pentru Claude (AI assistant). Conține tot ce e necesar ca să lucrez eficient în acest proiect fără explorare repetitivă.

> **Principiu**: Niciun exemplu din acest document nu conține placeholder `// ...` — tot codul este real și copiat din codebase.

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
| State | Zustand 4.x (sessionStorage persist) |
| Server state | TanStack React Query 5.x |
| Forms | react-hook-form 7.x + Zod 4.x |
| HTTP client | Axios (cu interceptori pentru JWT + refresh) |
| UI components | Bootstrap 5 + Syncfusion EJ2 + module.scss |
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
│       │   ├── hooks/                  # use{Feature}s.ts
│       │   ├── pages/                  # {Feature}ListPage.tsx + .module.scss
│       │   ├── schemas/                # {feature}.schema.ts
│       │   └── types/                  # {feature}.types.ts
│       ├── components/
│       │   ├── forms/                  # FormInput, FormSelect, FormRichText, etc.
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
├── hooks/{feature}.hooks.ts                     ← queries + mutations
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
// Create — câmpuri din record TREBUIE SĂ COINCIDĂ EXACT cu parametrii IConsultationRepository.CreateAsync
// (nu se modifică unul fără celălalt!)
public sealed record CreateConsultationCommand(
    Guid     PatientId,
    Guid     DoctorId,
    Guid?    AppointmentId,
    DateTime Date,
    string?  Motiv,
    string?  IstoricMedicalPersonal,
    string?  TratamentAnterior,
    string?  IstoricBoalaActuala,
    string?  IstoricFamilial,
    string?  FactoriDeRisc,
    string?  AlergiiConsultatie,
    string?  StareGenerala,
    string?  Tegumente,
    string?  Mucoase,
    decimal? Greutate,
    int?     Inaltime,
    int?     TensiuneSistolica,
    int?     TensiuneDiastolica,
    int?     Puls,
    int?     FrecventaRespiratorie,
    decimal? Temperatura,
    int?     SpO2,
    string?  Edeme,
    decimal? Glicemie,
    string?  GanglioniLimfatici,
    string?  ExamenClinic,
    string?  AlteObservatiiClinice,
    string?  Investigatii,
    string?  AnalizeMedicale,
    string?  Diagnostic,
    string?  DiagnosticCodes,
    string?  Recomandari,
    string?  Observatii,
    string?  Concluzii,
    bool     EsteAfectiuneOncologica,
    bool     AreIndicatieInternare,
    bool     SaEliberatPrescriptie,
    string?  SeriePrescriptie,
    bool     SaEliberatConcediuMedical,
    string?  SerieConcediuMedical,
    bool     SaEliberatIngrijiriDomiciliu,
    bool     SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string?  NoteUrmatoareaVizita,
    Guid?    StatusId)
    : IRequest<Result<Guid>>;
```

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
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.PatientId,
                request.DoctorId,
                request.AppointmentId,
                request.Date,
                request.Motiv,
                request.IstoricMedicalPersonal,
                request.TratamentAnterior,
                request.IstoricBoalaActuala,
                request.IstoricFamilial,
                request.FactoriDeRisc,
                request.AlergiiConsultatie,
                request.StareGenerala,
                request.Tegumente,
                request.Mucoase,
                request.Greutate,
                request.Inaltime,
                request.TensiuneSistolica,
                request.TensiuneDiastolica,
                request.Puls,
                request.FrecventaRespiratorie,
                request.Temperatura,
                request.SpO2,
                request.Edeme,
                request.Glicemie,
                request.GanglioniLimfatici,
                request.ExamenClinic,
                request.AlteObservatiiClinice,
                request.Investigatii,
                request.AnalizeMedicale,
                request.Diagnostic,
                request.DiagnosticCodes,
                request.Recomandari,
                request.Observatii,
                request.Concluzii,
                request.EsteAfectiuneOncologica,
                request.AreIndicatieInternare,
                request.SaEliberatPrescriptie,
                request.SeriePrescriptie,
                request.SaEliberatConcediuMedical,
                request.SerieConcediuMedical,
                request.SaEliberatIngrijiriDomiciliu,
                request.SaEliberatDispozitiveMedicale,
                request.DataUrmatoareiVizite,
                request.NoteUrmatoareaVizita,
                request.StatusId,
                currentUser.Id,              // ← audit: createdBy = ultimul arg
                cancellationToken);

            return Result<Guid>.Created(id); // 201
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message); // 400
        }
    }
}
```

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
            await repository.UpdateAsync(   // ← void Task, nu returnează nimic
                request.Id,
                currentUser.ClinicId,
                request.PatientId,
                // ... toți parametrii în exact aceeași ordine ca IConsultationRepository.UpdateAsync
                request.StatusId,
                currentUser.Id,             // ← audit: updatedBy
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
        RuleFor(x => x.Motiv)
            .MaximumLength(4000).WithMessage("Motivul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Motiv));

        RuleFor(x => x.ExamenClinic)
            .MaximumLength(4000).WithMessage("Examenul clinic nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.ExamenClinic));

        RuleFor(x => x.Diagnostic)
            .MaximumLength(4000).WithMessage("Diagnosticul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Diagnostic));

        RuleFor(x => x.DiagnosticCodes)
            .MaximumLength(2000).WithMessage("Codurile de diagnostic nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DiagnosticCodes));

        // Numeric cu range
        RuleFor(x => x.TensiuneSistolica)
            .InclusiveBetween(40, 300).WithMessage("Tensiunea sistolică trebuie să fie între 40 și 300.")
            .When(x => x.TensiuneSistolica.HasValue);

        RuleFor(x => x.SpO2)
            .InclusiveBetween(50, 100).WithMessage("SpO2 trebuie să fie între 50 și 100.")
            .When(x => x.SpO2.HasValue);
    }
}
```

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
// Implementat din JWT claims în Infrastructure

currentUser.ClinicId   // Guid — multi-tenancy: ORICE query la DB filtrează după acesta
currentUser.Id         // Guid — userId pentru audit: CreatedBy, UpdatedBy, DeletedBy
currentUser.Role       // string
currentUser.IsAdmin    // bool
```

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
// Consultations use QueryFirstOrDefault on INSERT+SELECT path, dar pattern generic:
public async Task<Guid> CreateAsync(Guid clinicId, ..., CancellationToken ct)
{
    using var connection = context.CreateConnection();
    return await connection.ExecuteScalarAsync<Guid>(
        new CommandDefinition(
            ConsultationProcedures.Create,
            new
            {
                ClinicId  = clinicId,
                PatientId = patientId,
                DoctorId  = doctorId,
                // ... câmpuri rând cu rând, fără scurtături
                CreatedBy = createdBy
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
}
```

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
    // Paginate + filtre + stats → returnează wrapper custom (nu PagedResult<T> direct)
    Task<ConsultationPagedResult> GetPagedAsync(
        Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
        DateTime? dateFrom, DateTime? dateTo,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    // GetById returnează T? (null dacă negăsit) — nu aruncă excepție
    Task<ConsultationDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    // Create returnează Guid (id-ul entității create)
    Task<Guid> CreateAsync(Guid clinicId, Guid patientId, Guid doctorId, /* ... */ CancellationToken ct);

    // Update returnează Task (void) — SP aruncă THROW dacă negăsit
    Task UpdateAsync(Guid id, Guid clinicId, /* ... */ Guid updatedBy, CancellationToken ct);

    // Delete returnează Task (void) — SP aruncă THROW dacă negăsit
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
}
```

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
}

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
    -- NU filtrăm IsDeleted = 0 în GetById — returnăm și entitățile șterse (pentru vizualizare)
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
// client/src/features/consultations/hooks/consultations.hooks.ts

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

```typescript
// client/src/api/endpoints/consultations.api.ts
export const consultationsApi = {
  getAll:  (params: GetConsultationsParams) =>
             api.get('/api/v1/Consultations', { params })
                .then(r => r.data.data),

  getById: (id: string) =>
             api.get(`/api/v1/Consultations/${id}`)
                .then(r => r.data.data),

  create:  (payload: CreateConsultationPayload) =>
             api.post('/api/v1/Consultations', payload)
                .then(r => r.data.data),

  update:  ({ id, ...data }: UpdateConsultationPayload) =>
             api.put(`/api/v1/Consultations/${id}`, data)
                .then(r => r.data.data),

  delete:  (id: string) =>
             api.delete(`/api/v1/Consultations/${id}`)
                .then(r => r.data.data),
}
```

### 5. Zod schema

```typescript
// client/src/features/consultations/schemas/consultation.schema.ts
export const consultationSchema = z.object({
  patientId:  z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:   z.string().min(1, 'Doctorul este obligatoriu'),
  date:       z.string().min(1, 'Data consultației este obligatorie'),
  motiv:      z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  greutate:   z.number({ invalid_type_error: 'Valoare numerică' })
               .min(1).max(500).nullable().optional(),
  spO2:       z.number().int().min(50).max(100).nullable().optional(),
  esteAfectiuneOncologica: z.boolean().optional(),
  // câmpuri boolean simple — default false
  saEliberatPrescriptie:   z.boolean().default(false),
})
export type ConsultationFormData = z.infer<typeof consultationSchema>
```

### 6. react-hook-form cu Controller

```typescript
const { handleSubmit, reset, control, register, formState: { errors } } =
  useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId:               '',
      doctorId:                '',
      date:                    '',
      motiv:                   '',
      esteAfectiuneOncologica: false,
      saEliberatPrescriptie:   false,
    },
  })

// Wrappers pentru form fields — toate acceptă field + error props:
// FormInput, FormSelect, FormTextArea, FormDatePicker,
// FormRichText (Syncfusion RTE), FormCheckbox, FormSwitch

<Controller
  name="date"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <FormDatePicker field={field} error={error?.message} label="Data consultației" />
  )}
/>

<Controller
  name="motiv"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <FormRichText field={field} error={error?.message} label="Motivul consultației" />
  )}
/>
```

### 7. Zustand store (auth)

```typescript
// sessionStorage (nu localStorage) — sters la inchiderea tab-ului
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      setAuth:    (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      updateToken: (token)      => set({ accessToken: token }),
      clearAuth:   ()           => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-store', storage: createJSONStorage(() => sessionStorage) },
  ),
)
```

### 8. useHasAccess — guard pentru permisiuni în UI

```typescript
// client/src/hooks/useHasAccess.ts
export const useHasAccess = (module: string, level: AccessLevel): boolean => {
  const { user } = useAuthStore()
  return user?.permissions?.[module] >= level ?? false
}

// Folosire în component:
const canDelete = useHasAccess('consultations', AccessLevel.Full)
{canDelete && <AppButton onClick={handleDelete}>Șterge</AppButton>}
```

---

## Patterns de test (backend)

### Handler test — structură și reguli critice

```csharp
// REGULĂ CRITICĂ: numărul de Arg.Any<>() în mock TREBUIE SĂ COINCIDĂ EXACT
// cu numărul de parametri din IConsultationRepository.CreateAsync / UpdateAsync / DeleteAsync.
// Orice discrepanță → NSubstitute nu recunoaște apelul → testul pică.

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

    // Builder cu TOȚI parametrii expliciți folosind named args
    // Câmpurile opționale = null/false — aceasta este forma canonică
    private static CreateConsultationCommand ValidCommand() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddHours(1),
        Motiv: "Durere de cap",
        IstoricMedicalPersonal: null,
        TratamentAnterior: null,
        IstoricBoalaActuala: null,
        IstoricFamilial: null,
        FactoriDeRisc: null,
        AlergiiConsultatie: null,
        StareGenerala: null,
        Tegumente: null,
        Mucoase: null,
        Greutate: null,
        Inaltime: null,
        TensiuneSistolica: null,
        TensiuneDiastolica: null,
        Puls: null,
        FrecventaRespiratorie: null,
        Temperatura: null,
        SpO2: null,
        Edeme: null,
        Glicemie: null,
        GanglioniLimfatici: null,
        ExamenClinic: null,
        AlteObservatiiClinice: null,
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
        // Arrange — Arg.Any<>() pentru FIECARE parametru din IConsultationRepository.CreateAsync
        // (47 params business + CancellationToken = 48 total în acest caz)
        _repo.CreateAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),       // clinicId, patientId, doctorId
                Arg.Any<Guid?>(), Arg.Any<DateTime>(),                    // appointmentId, date
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),                   // stareGenerala, tegumente, mucoase
                Arg.Any<decimal?>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<int?>(),
                Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<int?>(),
                Arg.Any<string?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(),
                Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<string?>(),
                Arg.Any<bool>(), Arg.Any<string?>(), Arg.Any<bool>(), Arg.Any<bool>(),
                Arg.Any<DateTime?>(), Arg.Any<string?>(), Arg.Any<Guid?>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())            // createdBy, ct
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
        // Verifică că handler injectează valorile din ICurrentUser (nu din command)
        _repo.CreateAsync(
                Arg.Any<Guid>(), /* ... toate */ Arg.Any<CancellationToken>())
             .Returns(NewId);

        await CreateHandler().Handle(ValidCommand(), default);

        // Verificare: clinicId și createdBy vin din _currentUser
        await _repo.Received(1).CreateAsync(
            ClinicId,            // ← currentUser.ClinicId
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid?>(), Arg.Any<DateTime>(),
            /* ... */ Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SqlError_ReturnsFailure()
    {
        _repo.CreateAsync(
                Arg.Any<Guid>(), /* ... toate */ Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
```

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

    // Builder cu date minime valide
    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId:  Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddDays(1),
        Motiv: "Consult",
        IstoricMedicalPersonal: null,
        TratamentAnterior: null,
        IstoricBoalaActuala: null,
        IstoricFamilial: null,
        FactoriDeRisc: null,
        AlergiiConsultatie: null,
        StareGenerala: null, Tegumente: null, Mucoase: null,
        Greutate: null, Inaltime: null,
        TensiuneSistolica: null, TensiuneDiastolica: null,
        Puls: null, FrecventaRespiratorie: null,
        Temperatura: null, SpO2: null, Edeme: null, Glicemie: null,
        GanglioniLimfatici: null, ExamenClinic: null, AlteObservatiiClinice: null,
        Investigatii: null, AnalizeMedicale: null,
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
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");
    }

    [Fact]
    public void Motiv_WhenTooLong_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Motiv = new string('x', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Motiv)
                  .WithErrorMessage("Motivul nu poate depăși 4000 de caractere.");
    }
}
```

### SqlExceptionHelper — crearea SqlException cu Number custom

```csharp
// tests/ValyanClinic.Tests/TestHelpers/SqlExceptionHelper.cs
// SqlException nu are constructor public — creat prin reflection
public static class SqlExceptionHelper
{
    public static SqlException Make(int number, string message = "Test SQL Error")
    {
        var exception = (SqlException)FormatterServices
            .GetUninitializedObject(typeof(SqlException));
        // ... setează Number prin reflection
        return exception;
    }
}

// Folosire:
.Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound))
.Throws(SqlExceptionHelper.Make(50999))  // cod generic
```

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

## Reguli de lucru (IMPORTANT)

### R1 — Multi-tenancy obligatoriu

```csharp
// ORICE query la DB trece ClinicId din ICurrentUser
var result = await repository.GetPagedAsync(currentUser.ClinicId, ...);

// SP: WHERE c.ClinicId = @ClinicId — OBLIGATORIU, fără excepție
```

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
0031_CreateConsultations.sql    ← corect
0033_CreateConsultations.sql    ← greșit (a sărit 0032)
```

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
// Dacă adaugi un parametru la IConsultationRepository.CreateAsync:
// 1. Adaugi câmpul în CreateConsultationCommand (record)
// 2. Adaugi parametrul în IConsultationRepository.CreateAsync (interfață)
// 3. Adaugi parametrul în ConsultationRepository.CreateAsync (implementare)
// 4. Actualizezi SP-ul SQL
// 5. Actualizezi TOȚI mock-ii din teste:
//    - CreateConsultationCommandHandlerTests → mock .Returns + mock .Received
//    - ValidCommand() builder → adaugi noul câmp
//    - MinimalValid() builder → adaugi noul câmp
// Dacă omit pasul 5 → CI pică cu "number of args mismatch from NSubstitute"

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
| Axios | 1.x |
| Syncfusion EJ2 | 32.x |
