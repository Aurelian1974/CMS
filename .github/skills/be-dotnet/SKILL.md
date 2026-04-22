---
name: be-dotnet
description: >
  USE WHEN: creating or modifying backend C# .NET code — features, command/query handlers,
  repositories, validators, controllers, domain entities, DTOs, or any Infrastructure code.
  Covers: MediatR CQRS vertical slices, Dapper + Stored Procedures only (no EF, no inline SQL),
  Result pattern, FluentValidation, Clean Architecture layers, naming conventions,
  SqlException mapping, BaseApiController pattern, multi-tenancy (ClinicId on everything).
  AVOID using this skill for SQL script files — use sql-sqlserver skill instead.
---

# Backend .NET Skill — ValyanClinic

## Architecture

**Clean Architecture + Vertical Slices** organized in 4 projects:
- `ValyanClinic.Domain` — entities, interfaces, value objects, enums, exceptions
- `ValyanClinic.Application` — MediatR commands/queries/handlers, validators, DTOs, common behaviors
- `ValyanClinic.Infrastructure` — Dapper repositories, DapperContext, SP constants, DbUp migrator, auth
- `ValyanClinic.API` — controllers (thin), middleware, filters, DI registration

**No Entity Framework** — Dapper + Stored Procedures exclusively.

---

## Step 1 — File Organization

- **One file = one class/record/interface/enum.** File name = class name. No exceptions.
- **No diacritics in C# code** — classes, methods, variables, properties, namespaces in English without Romanian characters. Diacritics allowed ONLY in comments and user-facing strings (validation messages, THROW messages).
- Partial classes only for generated code.

**Feature folder structure (Vertical Slice):**
```
Application/Features/Patients/
├── Commands/
│   └── CreatePatient/
│       ├── CreatePatientCommand.cs          # sealed record : IRequest<Result<Guid>>
│       ├── CreatePatientCommandHandler.cs   # sealed class : IRequestHandler<...>
│       └── CreatePatientCommandValidator.cs # sealed class : AbstractValidator<...>
├── Queries/
│   └── GetPatients/
│       ├── GetPatientsQuery.cs
│       └── GetPatientsQueryHandler.cs
└── DTOs/
    ├── PatientListDto.cs
    └── PatientDetailDto.cs
```

---

## Step 2 — MediatR CQRS Pattern

```csharp
// Command — immutable record, in Commands/CreatePatient/
namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed record CreatePatientCommand(
    string FirstName,
    string LastName,
    string Cnp,
    string? PhoneNumber,
    string? Email
) : IRequest<Result<Guid>>;

// Handler — in same namespace folder
public sealed class CreatePatientCommandHandler(
    IPatientRepository patientRepository,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePatientCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreatePatientCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var patientId = await patientRepository.CreateAsync(
                new Patient
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Cnp = request.Cnp,
                    PhoneNumber = request.PhoneNumber,
                    Email = request.Email,
                    ClinicId = currentUser.ClinicId,
                    CreatedBy = currentUser.Id
                },
                cancellationToken);

            return Result<Guid>.Success(patientId);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientCnpDuplicate)
        {
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
        // Unexpected SqlException (connection, timeout) — let it propagate to GlobalExceptionHandler
    }
}
```

---

## Step 3 — Result Pattern (MANDATORY)

**All handlers return `Result<T>` — never throw for business errors.**

```csharp
// Application/Common/Models/Result.cs
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(bool isSuccess, T? value, string? error, int statusCode)
    {
        IsSuccess = isSuccess; Value = value; Error = error; StatusCode = statusCode;
    }

    public static Result<T> Success(T value)                      => new(true, value, null, 200);
    public static Result<T> Created(T value)                      => new(true, value, null, 201); // POST → 201
    public static Result<T> Failure(string error, int code = 400) => new(false, default, error, code);
    public static Result<T> NotFound(string error)                => new(false, default, error, 404);
    public static Result<T> Conflict(string error)                => new(false, default, error, 409);
}
```

**Factory selection:**
| Handler type | Factory | HTTP status |
|---|---|---|
| Create (returns new Id) | `Result<Guid>.Created(id)` | 201 |
| Get/Query | `Result<T>.Success(value)` | 200 |
| Update/Delete (bool) | `Result<bool>.Success(true)` | 200 |
| Not found | `Result<T>.NotFound(msg)` | 404 |
| Duplicate/conflict | `Result<T>.Conflict(msg)` | 409 |
| Business rule violation | `Result<T>.Failure(msg)` | 400 |

---

## Step 4 — FluentValidation

```csharp
// Validators stay in the same Command folder
public sealed class CreatePatientCommandValidator : AbstractValidator<CreatePatientCommand>
{
    public CreatePatientCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100);

        RuleFor(x => x.Cnp)
            .NotEmpty().WithMessage("CNP-ul este obligatoriu.")
            .Matches(@"^[1-9]\d{12}$").WithMessage("CNP-ul trebuie să aibă 13 cifre valide.");
    }
}
```

---

## Step 5 — Dapper + Stored Procedures Only

**STRICT RULE: No inline SQL in C# ever. All DB operations via Stored Procedures.**

### SP Constants (per entity)

```csharp
// Infrastructure/Data/StoredProcedures/PatientProcedures.cs
// Convention: dbo.[Entity]_[Action]
public static class PatientProcedures
{
    public const string GetById     = "dbo.Patient_GetById";
    public const string GetPaged    = "dbo.Patient_GetPaged";
    public const string Create      = "dbo.Patient_Create";
    public const string Update      = "dbo.Patient_Update";
    public const string Delete      = "dbo.Patient_Delete";      // Soft delete
    public const string ExistsByCnp = "dbo.Patient_ExistsByCnp";
}
```

### Repository Pattern

```csharp
// Infrastructure/Data/Repositories/PatientRepository.cs
public sealed class PatientRepository(DapperContext context) : IPatientRepository
{
    // Read: QueryFirstOrDefaultAsync with CommandDefinition
    public async Task<PatientDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<PatientDetailDto>(
            new CommandDefinition(
                PatientProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // Paged (2 result sets): items + total count
    public async Task<PagedResult<PatientListDto>> GetPagedAsync(
        GetPatientsQuery query, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PatientProcedures.GetPaged,
                new { ClinicId = clinicId, query.Search, query.Page, query.PageSize, query.SortBy, query.SortDir },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items      = (await multi.ReadAsync<PatientListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<PatientListDto>(items, totalCount, query.Page, query.PageSize);
    }

    // Paged with stats (3 result sets): items + count + stats DTO
    public async Task<ConsultationPagedResult> GetPagedAsync(
        Guid clinicId, GetPagedParams p, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(ConsultationProcedures.GetPaged,
                new { ClinicId = clinicId, p.Search, p.Page, p.PageSize },
                commandType: CommandType.StoredProcedure, cancellationToken: ct));

        var items      = (await multi.ReadAsync<ConsultationListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats      = await multi.ReadSingleAsync<ConsultationStatsDto>(); // 3rd result set

        return new ConsultationPagedResult(
            new PagedResult<ConsultationListDto>(items, totalCount, p.Page, p.PageSize),
            stats);
    }

    // Update: ExecuteAsync — returns Task (void), throws if not found
    public async Task UpdateAsync(Guid id, Guid clinicId, /* ... params */, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(ConsultationProcedures.Update,
                new { Id = id, ClinicId = clinicId, /* ... */, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure, cancellationToken: ct));
        // SP does THROW 5xxxx if not found — caught by handler → Result.NotFound
    }

    // Write: ExecuteScalarAsync<Guid> — returns new ID from OUTPUT clause
    public async Task<Guid> CreateAsync(Patient patient, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                PatientProcedures.Create,
                new { patient.ClinicId, patient.FirstName, patient.LastName, patient.Cnp,
                      patient.PhoneNumber, patient.Email, patient.CreatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
```

### DapperContext

```csharp
public sealed class DapperContext(IConfiguration configuration)
{
    private readonly string _connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
```

---

## Step 6 — SqlException Error Codes

SP throws in range 50000–59999. C# catches and maps to `Result.Failure/Conflict`:

```csharp
// Infrastructure/Data/SqlErrorCodes.cs
public static class SqlErrorCodes
{
    public const int PatientCnpDuplicate = 50001;
    public const int AppointmentConflict = 50010;
    public const int InvoiceAlreadyPaid  = 50020;
    public const int PrescriptionExpired = 50030;
}
```

**Never expose raw SqlException messages in API response.**

---

## Step 7 — API Controller Pattern

```csharp
// BaseApiController — shared by all controllers
[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;
    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult HandleResult<T>(Result<T> result) => result.StatusCode switch
    {
        200 => Ok(new ApiResponse<T>(true, result.Value, null, null)),
        201 => CreatedAtAction(null, new ApiResponse<T>(true, result.Value, null, null)),
        404 => NotFound(new ApiResponse<T>(false, default, result.Error, null)),
        409 => Conflict(new ApiResponse<T>(false, default, result.Error, null)),
        _   => BadRequest(new ApiResponse<T>(false, default, result.Error, null))
    };
}

// Controller — thin, delegates to MediatR
// IMPORTANT: Command IS the request body directly ([FromBody] command) — no separate Request DTO
[ApiController]
[ApiVersion("1")]
[Route("api/v{v:apiVersion}/[controller]")]
public sealed class ConsultationsController : BaseApiController
{
    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateConsultationCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateConsultationCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command with { Id = id }, ct));

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Delete)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteConsultationCommand(id), ct));
}
```

**Key rule:** The Command record IS the `[FromBody]` parameter — no separate DTO class needed.

---

## Step 8 — Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Namespace | PascalCase per folder | `ValyanClinic.Application.Features.Patients` |
| Class / Record | PascalCase | `PatientRepository`, `CreatePatientCommand` |
| Interface | I + PascalCase | `IPatientRepository` |
| Async method | PascalCase + Async | `GetByIdAsync()` |
| Property | PascalCase | `CreatedAt`, `IsActive` |
| Parameter | camelCase | `patientId`, `cancellationToken` |
| Private field | _camelCase | `_repository`, `_logger` |
| Constant | PascalCase | `MaxPageSize` |
| DTO | Noun + Dto | `PatientDetailDto` |
| Command | Verb + Noun + Command | `CreatePatientCommand` |
| Query | Get + Noun + Query | `GetPatientsQuery` |
| Handler | CommandName + Handler | `CreatePatientCommandHandler` |
| Validator | CommandName + Validator | `CreatePatientCommandValidator` |

---

## Step 9 — Domain Entities

```csharp
// Domain/Entities/Patient.cs
public sealed class Patient
{
    public Guid Id { get; init; }              // NEVER int — all PKs are Guid
    public Guid ClinicId { get; init; }        // Multi-tenancy — MANDATORY
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Cnp { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }       // FK to Users — also Guid
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

**Multi-tenancy rule: `ClinicId` is MANDATORY on every entity and every SP call. `ICurrentUser.ClinicId` is the tenant filter.**

---

## Step 10 — Nomenclature Constants (no magic GUIDs inline)

```csharp
// Application/Common/Constants/AppointmentStatusIds.cs
// GUIDs match seed rows in 0002_SeedNomenclature.sql
public static class AppointmentStatusIds
{
    public static readonly Guid Scheduled = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid Confirmed = Guid.Parse("a1000000-0000-0000-0000-000000000002");
    public static readonly Guid Completed = Guid.Parse("a1000000-0000-0000-0000-000000000003");
    public static readonly Guid Cancelled = Guid.Parse("a1000000-0000-0000-0000-000000000004");
    public static readonly Guid NoShow    = Guid.Parse("a1000000-0000-0000-0000-000000000005");
}
// Use: new { StatusId = AppointmentStatusIds.Confirmed }
// NEVER: new { StatusId = Guid.Parse("...") } inline in code
```

---

## Checklist Before Completing

- [ ] One class per file, file name matches class name
- [ ] All C# identifiers in English without diacritics
- [ ] Handler returns `Result<T>`, no uncaught business exceptions
- [ ] POST handler returns `Result<T>.Created(id)` (201), GET returns `Success`, UPDATE/DELETE returns `Success(true)`
- [ ] Repository uses SP constants, `CommandDefinition`, `CommandType.StoredProcedure`
- [ ] No inline SQL anywhere in C#
- [ ] `ClinicId` passed on every repository call
- [ ] SqlException from SP (50000–59999) caught and mapped to `Result.Conflict/Failure/NotFound`
- [ ] FluentValidation validator registered (via assembly scan in DI)
- [ ] Controller extends `BaseApiController`, calls `HandleResult(result)`
- [ ] Command IS the `[FromBody]` parameter — no separate Request DTO
- [ ] UpdateAsync returns `Task` (void) — errors via SP THROW, not return value
- [ ] CreateAsync returns `Task<Guid>` via `ExecuteScalarAsync<Guid>`
- [ ] All PKs and FKs are `Guid`, never `int`
- [ ] New repository registered in `DependencyInjection.cs` as `services.AddScoped<IXxxRepo, XxxRepo>()`
