# CLAUDE.md — ValyanClinic CMS Reference

Fișier de referință pentru Claude (AI assistant). Conține tot ce e necesar ca să lucrez eficient în acest proiect fără explorare repetitivă.

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

## Pattern-uri backend

### 1. Command + Handler

```csharp
// Command record — colocat în Features/{Feature}/Commands/{Verb}{Entity}/
public sealed record CreateConsultationCommand(
    Guid PatientId,
    Guid DoctorId,
    // ...toți parametrii
) : IRequest<Result<Guid>>;

// Handler — același folder
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
                // ...
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
```

### 2. Validator

```csharp
public sealed class CreateConsultationCommandValidator : AbstractValidator<CreateConsultationCommand>
{
    public CreateConsultationCommandValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Pacientul este obligatoriu.");
        RuleFor(x => x.Motiv)
            .MaximumLength(4000).WithMessage("Motivul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Motiv));
    }
}
```

### 3. Result<T>

```csharp
Result<Guid>.Created(id)          // 201
Result<T>.Success(value)          // 200
Result<T>.Failure("mesaj")        // 400
Result<T>.NotFound("mesaj")       // 404
Result<T>.Conflict("mesaj")       // 409
```

### 4. ICurrentUser

```csharp
currentUser.ClinicId  // multi-tenancy — ÎNTOTDEAUNA filtrat după ClinicId
currentUser.Id        // userId pentru audit (CreatedBy / UpdatedBy)
```

### 5. Dapper — un rezultat scalar

```csharp
using var connection = context.CreateConnection();
return await connection.ExecuteScalarAsync<Guid>(
    new CommandDefinition(
        ConsultationProcedures.Create,
        new { ClinicId = clinicId, PatientId = patientId, /* ... */ },
        commandType: CommandType.StoredProcedure,
        cancellationToken: ct));
```

### 6. Dapper — multiple result sets (GetPaged)

```csharp
using var multi = await connection.QueryMultipleAsync(
    new CommandDefinition(ConsultationProcedures.GetPaged, params,
        commandType: CommandType.StoredProcedure, cancellationToken: ct));

var items      = (await multi.ReadAsync<ConsultationListDto>()).ToList();
var totalCount = await multi.ReadSingleAsync<int>();
var stats      = await multi.ReadSingleAsync<ConsultationStatsDto>();

return new ConsultationPagedResult(
    new PagedResult<ConsultationListDto>(items, totalCount, page, pageSize),
    stats);
```

### 7. Controller

```csharp
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

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationByIdQuery(id), ct));
}
```

### 8. DependencyInjection — înregistrare repository

```csharp
// src/ValyanClinic.Infrastructure/DependencyInjection.cs
services.AddScoped<IConsultationRepository, ConsultationRepository>();
```

---

## Pattern-uri bază de date

### Migration SQL

```sql
-- src/ValyanClinic.Infrastructure/Data/Scripts/Migrations/0031_CreateConsultations.sql
CREATE TABLE dbo.Consultations (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ClinicId        UNIQUEIDENTIFIER NOT NULL,   -- multi-tenancy obligatoriu
    PatientId       UNIQUEIDENTIFIER NOT NULL,
    -- coloane business
    Motiv           NVARCHAR(4000)   NULL,
    -- audit standard
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy       UNIQUEIDENTIFIER NOT NULL,
    UpdatedAt       DATETIME2(0)     NULL,
    UpdatedBy       UNIQUEIDENTIFIER NULL,
    CONSTRAINT PK_Consultations PRIMARY KEY (Id),
    CONSTRAINT FK_Consultations_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id),
);
-- Index principal: ClinicId + coloana de sort frecventă
CREATE NONCLUSTERED INDEX IX_Consultations_ClinicId_Date
    ON dbo.Consultations (ClinicId, Date DESC)
    INCLUDE (PatientId, DoctorId, StatusId, IsDeleted);
```

### StoredProcedure — Create (returnează ID)

```sql
-- src/ValyanClinic.Infrastructure/Data/Scripts/StoredProcedures/Consultation_Create.sql
CREATE OR ALTER PROCEDURE dbo.Consultation_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @PatientId   UNIQUEIDENTIFIER,
    @Motiv       NVARCHAR(4000) = NULL,
    -- ...
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Consultations (Id, ClinicId, PatientId, Motiv, CreatedBy, CreatedAt)
    VALUES (@NewId, @ClinicId, @PatientId, @Motiv, @CreatedBy, SYSDATETIME());

    SELECT @NewId;  -- returnează ID
END
```

### StoredProcedure — GetPaged (3 result sets)

```sql
CREATE OR ALTER PROCEDURE dbo.Consultation_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200) = NULL,
    @Page       INT = 1,
    @PageSize   INT = 20
AS
BEGIN
    -- Result set 1: rânduri paginate
    SELECT ... FROM dbo.Consultations WHERE ClinicId = @ClinicId AND IsDeleted = 0
    ORDER BY Date DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*) FROM dbo.Consultations WHERE ClinicId = @ClinicId AND IsDeleted = 0;

    -- Result set 3: stats (opțional)
    SELECT COUNT(*) AS Total, ... FROM dbo.Consultations WHERE ClinicId = @ClinicId;
END
```

### Erori SQL custom (RAISERROR)

```sql
-- Coduri 50000-59999 → prinse în handler ca Result.Failure
IF NOT EXISTS (SELECT 1 FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId)
    RAISERROR('Consultația nu a fost găsită.', 16, 1) WITH SETERROR;
    -- sau THROW 50404, 'Consultația nu a fost găsită.', 1;
```

Coduri uzuale: `SqlErrorCodes.ConsultationNotFound`, `SqlErrorCodes.AppointmentConflict`, etc.

### Referințe SP în C#

```csharp
// src/ValyanClinic.Infrastructure/Data/StoredProcedures/ConsultationProcedures.cs
public static class ConsultationProcedures
{
    public const string Create         = "dbo.Consultation_Create";
    public const string Update         = "dbo.Consultation_Update";
    public const string Delete         = "dbo.Consultation_Delete";
    public const string GetById        = "dbo.Consultation_GetById";
    public const string GetPaged       = "dbo.Consultation_GetPaged";
    public const string GetByPatient   = "dbo.Consultation_GetByPatient";
}
```

---

## Pattern-uri frontend

### 1. Query keys

```typescript
export const consultationKeys = {
  all:     ['consultations'] as const,
  lists:   () => [...consultationKeys.all, 'list'] as const,
  list:    (params: GetConsultationsParams) => [...consultationKeys.lists(), params] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail:  (id: string) => [...consultationKeys.details(), id] as const,
}
```

### 2. Hook pattern

```typescript
export const useConsultations = (params: GetConsultationsParams) =>
  useQuery({
    queryKey: consultationKeys.list(params),
    queryFn: () => consultationsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1 * 60 * 1000,
  })

export const useCreateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateConsultationPayload) => consultationsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}
```

### 3. API client

```typescript
// client/src/api/endpoints/consultations.api.ts
export const consultationsApi = {
  getAll:    (params: GetConsultationsParams) =>
               api.get('/api/v1/Consultations', { params }),
  getById:   (id: string) =>
               api.get(`/api/v1/Consultations/${id}`),
  create:    (payload: CreateConsultationPayload) =>
               api.post('/api/v1/Consultations', payload),
  update:    ({ id, ...data }: UpdateConsultationPayload) =>
               api.put(`/api/v1/Consultations/${id}`, data),
  delete:    (id: string) =>
               api.delete(`/api/v1/Consultations/${id}`),
}
```

### 4. Zod schema

```typescript
export const consultationSchema = z.object({
  patientId:  z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:   z.string().min(1, 'Doctorul este obligatoriu'),
  date:       z.string().min(1, 'Data consultației este obligatorie'),
  motiv:      z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  greutate:   z.number().nullable().optional(),
  esteAfectiuneOncologica: z.boolean().optional(),
})
export type ConsultationFormData = z.infer<typeof consultationSchema>
```

### 5. react-hook-form

```typescript
const { handleSubmit, reset, control, register, formState: { errors } } =
  useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: { patientId: '', date: '', motiv: '' },
  })

// Controller pentru componente custom
<Controller
  name="date"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <FormDatePicker field={field} error={error?.message} />
  )}
/>
```

### 6. Zustand store

```typescript
// sessionStorage (nu localStorage) — sters la inchiderea tab-ului
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token, perms) => set({ user, accessToken: token, isAuthenticated: true }),
      updateToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-store', storage: createJSONStorage(() => sessionStorage) },
  ),
)
```

---

## Patterns de test (backend)

### Handler test — structură standard

```csharp
public sealed class CreateConsultationCommandHandlerTests
{
    // Guid-uri fixe cu prefix distinctiv pentru debugging
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

    // Builder pentru date valide — toți parametrii expliciți cu named args
    private static CreateConsultationCommand ValidCommand() => new(
        PatientId: Guid.NewGuid(),
        DoctorId:  Guid.NewGuid(),
        Date:      DateTime.UtcNow.AddHours(1),
        Motiv:     "Durere de cap",
        // ...toți parametrii
        StatusId: null);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        _repo.CreateAsync(Arg.Any<Guid>(), /* ...Arg.Any pentru fiecare param... */
                          Arg.Any<CancellationToken>())
             .Returns(NewId);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(NewId, result.Value);
    }
}
```

### Validator test — structură standard

```csharp
public sealed class CreateConsultationCommandValidatorTests
{
    private readonly CreateConsultationCommandValidator _validator = new();

    // Builder cu date valide
    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(), DoctorId: Guid.NewGuid(),
        Date: DateTime.UtcNow.AddDays(1), Motiv: "Consult",
        /* ...restul null/false... */ StatusId: null);

    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");
    }
}
```

### SqlExceptionHelper

```csharp
// TestHelpers/SqlExceptionHelper.cs — creează SqlException cu Number specific
.Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound))
.Throws(SqlExceptionHelper.Make(50999))  // generic
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

1. **Multi-tenancy obligatoriu** — orice query la DB filtrează după `ClinicId` din `ICurrentUser`
2. **Soft delete** — toate entitățile principale au `IsDeleted BIT` + filtru în SP
3. **Audit** — toate tabelele principale au `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`
4. **SP-uri** — logica de business stă în StoredProcedures, nu în C#; erori business = RAISERROR 5000x
5. **Migration order** — numerele de migrare sunt secvențiale; nu reutiliza sau sări numere
6. **OpenAPI contract** — după orice modificare la endpoint, regenera `openapi-v1.json` (ci job `contract` va pica altfel)
7. **Named arguments** — la constructori de record cu mulți parametri, ÎNTOTDEAUNA `Name: value`
8. **Interfața repository** — ORICE modificare a semnăturii `IConsultationRepository` trebuie reflectată și în testele care fac mock

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
