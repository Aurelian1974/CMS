# 👨‍💻 Ghid Developer - Pagina Pacienți

## Prezentare tehnică

Pagina de pacienți este o componentă complexă care implementează listare paginată server-side, filtrare avansată, CRUD complet, validare multi-layer și export. Folosește React, TypeScript, Syncfusion Grid, backend C# cu MediatR și EF Core.

---

## 📁 Structura de fișiere

### Frontend

```
client/src/features/patients/
├── pages/
│   ├── PatientsListPage.tsx              # Pagina listare
│   ├── PatientsListPage.module.scss      # Dicționar stiluri
│   ├── PatientFormPage.tsx               # Placeholder
│   └── PatientDetailPage.tsx             # (Viitor) Detail view
├── components/
│   ├── PatientFormModal/
│   │   ├── PatientFormModal.tsx          # Modal creare/editare
│   │   └── PatientFormModal.module.scss
│   ├── PatientDetailModal/
│   │   ├── PatientDetailModal.tsx        # Modal read-only
│   │   └── PatientDetailModal.module.scss
│   ├── AddressAutocomplete/
│   │   └── AddressAutocomplete.tsx       # Autocomplete adresă
│   └── index.ts
├── hooks/
│   └── usePatients.ts                    # useQuery + mutations
├── schemas/
│   └── patient.schema.ts                 # Zod validation
├── types/
│   └── patient.types.ts                  # TypeScript types
├── api/ (legacy)
│   └── patients.api.ts                   # Axios calls
└── index.ts                              # Export public
```

### Backend

```
src/ValyanClinic.Application/Features/Patients/
├── Queries/
│   ├── GetPatients/
│   │   ├── GetPatientsQuery.cs           # Query definition
│   │   ├── GetPatientsQueryHandler.cs    # Handler
│   │   └── PatientsPagedResponse.cs      # Response DTO
│   └── GetPatientDetail/
│       └── GetPatientDetailQueryHandler.cs
├── Commands/
│   ├── CreatePatient/
│   │   ├── CreatePatientCommand.cs
│   │   └── CreatePatientCommandHandler.cs
│   ├── UpdatePatient/
│   │   ├── UpdatePatientCommand.cs
│   │   └── UpdatePatientCommandHandler.cs
│   └── DeletePatient/
│       ├── DeletePatientCommand.cs
│       └── DeletePatientCommandHandler.cs
├── DTOs/
│   ├── PatientListDto.cs                 # List response
│   ├── PatientDetailDto.cs               # Detail response
│   ├── PatientFormDto.cs                 # Create/Update payload
│   └── PatientStatsDto.cs                # Statistics
├── Specifications/
│   └── PatientsSpecification.cs          # Filtering logic
└── Interfaces/
    └── IPatientRepository.cs

src/ValyanClinic.Domain/Entities/
├── Patient.cs                            # Entity main
├── PatientAllergy.cs                     # Value object
└── PatientAudit.cs                       # Audit trail

src/ValyanClinic.Infrastructure/Data/
├── PatientRepository.cs                  # Data access
└── PatientConfiguration.cs               # EF Core mapping

src/ValyanClinic.API/Controllers/
└── PatientsController.cs                 # API endpoints
```

---

## 🔧 Tech Stack

### Frontend
| Tehnologie | Versiune | Scopul |
|-----------|----------|--------|
| **React** | 18+ | Components |
| **TypeScript** | 5+ | Type safety |
| **Zod** | Latest | Validare form |
| **React Hook Form** | Latest | Form state |
| **TanStack Query** | v5 | Data fetching |
| **Syncfusion Grid** | Latest | Tabel paginat |
| **Axios** | Latest | HTTP client |
| **SCSS Modules** | Built-in | CSS izolat |

### Backend
| Tehnologie | Scop |
|-----------|-----|
| **MediatR** | CQRS |
| **Entity Framework Core** | ORM |
| **FluentValidation** | DTO validation |
| **Specifications Pattern** | Advanced filtering |
| **AutoMapper** | DTO mapping |

---

## 📊 Data Flow arquitectură

```
┌─────────────────────────────────────────────────────────┐
│             FRONTEND - React                            │
├─────────────────────────────────────────────────────────┤
│ PatientsListPage                                        │
│ ├─ State: search, filters, gridState                   │
│ ├─ usePatients hook (TanStack Query)                   │
│ └─ Components: PatientFormModal, PatientDetailModal    │
├─────────────────────────────────────────────────────────┤
│             API LAYER - Axios                           │
│ POST /api/patients (GET/POST/PUT/DELETE)               │
├─────────────────────────────────────────────────────────┤
│           BACKEND - ASP.NET Core                        │
├─────────────────────────────────────────────────────────┤
│ PatientsController                                      │
│ ├─ GetAll[FromQuery]                                   │
│ └─ Mediator.Send(GetPatientsQuery)                      │
│                ↓                                         │
│ GetPatientsQueryHandler                                │
│ ├─ IPatientRepository.GetPagedAsync()                  │
│ ├─ IPatientRepository.GetStatsAsync()                  │
│ └─ Return PatientsPagedResponse                        │
│                ↓                                         │
│ PatientRepository (EF Core)                            │
│ ├─ DbContext.Patients.Where(...).Skip(...).Take(...)   │
│ └─ Include(p => p.Allergies)                           │
│                ↓                                         │
│          SQL Server Database                            │
│ ├─ Patients table                                       │
│ ├─ PatientAllergies junction                           │
│ └─ AllergyTypes + AllergySeverities lookups            │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Implementare Frontend

### 1. Hook: usePatients

**Fișier:** [client/src/features/patients/hooks/usePatients.ts](client/src/features/patients/hooks/usePatients.ts)

```typescript
// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  list: (params) => [...patientKeys.all, 'list', params] as const,
};

// List query (server-side paginare + filtrare)
export const usePatients = (params: GetPatientsParams) =>
  useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.getPatients(params),
    placeholderData: keepPreviousData,
  });

// Create mutation
export const useCreatePatient = () =>
  useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });

// Update mutation
export const useUpdatePatient = () =>
  useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePatientPayload }) =>
      patientsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });

// Delete mutation
export const useDeletePatient = () =>
  useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
```

### 2. Component: PatientsListPage

**Fișier:** [client/src/features/patients/pages/PatientsListPage.tsx](client/src/features/patients/pages/PatientsListPage.tsx)

```typescript
export const PatientsListPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('all');
  const [genderId, setGenderId] = useState<string | undefined>();
  const [bloodTypeId, setBloodTypeId] = useState<string | undefined>();
  const [gridState, setGridState] = useState<GridServerState>({ skip: 0, take: 20 });

  // Extract pagination from gridState
  const page = Math.floor(gridState.skip / gridState.take) + 1;
  const pageSize = gridState.take;

  // API query
  const { data: patientsResp } = usePatients({
    page,
    pageSize,
    search: search || undefined,
    genderId,
    bloodTypeId,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  // Mutations
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  // Extract data
  const patients = patientsResp?.data?.pagedResult?.items ?? [];
  const totalCount = patientsResp?.data?.pagedResult?.totalCount ?? 0;
  const stats = patientsResp?.data?.stats;

  // Handlers
  const handleFormSubmit = async (formData: PatientFormData) => {
    const payload: CreatePatientPayload = {
      fullName: formData.fullName,
      cnp: formData.cnp,
      birthDate: formData.birthDate,
      genderId: formData.genderId,
      bloodTypeId: formData.bloodTypeId,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      address: formData.address,
      // ... rest of mapping
    };

    if (editingPatient) {
      updatePatient.mutate(
        { id: editingPatient.id, payload },
        {
          onSuccess: () => {
            handleCloseModal();
            showSuccess('Pacientul a fost actualizat');
          },
        }
      );
    } else {
      createPatient.mutate(payload, {
        onSuccess: () => {
          handleCloseModal();
          showSuccess('Pacientul a fost adăugat');
        },
      });
    }
  };

  // Render: Header + Stats + Filters + Grid
  return (
    <div className={styles.page}>
      {/* Header cu titlu și action buttons */}
      {/* Stats card board */}
      {/* Filters (search, dropdown select, etc.) */}
      {/* Syncfusion DataGrid cu server-side pagination */}
    </div>
  );
};
```

### 3. Validare: Zod Schema

**Fișier:** [client/src/features/patients/schemas/patient.schema.ts](client/src/features/patients/schemas/patient.schema.ts)

```typescript
export const patientFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nume minim 2 caractere')
    .max(100, 'Nume maxim 100 caractere')
    .regex(/^[a-zA-Z\s'-]+$/, 'Doar litere și spații'),

  cnp: z
    .string()
    .length(13, 'CNP trebuie să aibă 13 cifre')
    .regex(/^\d+$/, 'CNP nu acceptă non-cilre'),
    
  birthDate: z
    .date()
    .refine(d => d < new Date(), 'Data trebuie în trecut')
    .refine(d => d > new Date('1900-01-01'), 'Data nu poate fi înainte de 1900'),

  genderId: z.string().uuid('Gen invalid'),
  bloodTypeId: z.string().uuid('Grupă sanguină invalidă'),

  phoneNumber: z
    .string()
    .optional()
    .refine(p => !p || /^[\d\s\-\(\)]+$/.test(p), 'Format telefon invalid'),

  email: z
    .string()
    .email('Email invalid')
    .optional()
    .or(z.literal('')),

  allergies: z
    .array(
      z.object({
        allergyTypeId: z.string().uuid(),
        allergySeverityId: z.string().uuid(),
        allergenName: z.string().min(1),
      })
    )
    .optional(),

  isActive: z.boolean().default(true),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
```

---

## 🔐 Implementare Backend

### 1. Query Handler

**Fișier:** [src/ValyanClinic.Application/Features/Patients/Queries/GetPatients/GetPatientsQueryHandler.cs](...)

```csharp
public sealed class GetPatientsQueryHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPatientsQuery, Result<PatientsPagedResponse>>
{
    public async Task<Result<PatientsPagedResponse>> Handle(
        GetPatientsQuery request, CancellationToken cancellationToken)
    {
        // Filter by clinic
        var spec = new PatientsSpecification(
            clinicId: currentUser.ClinicId,
            search: request.Search,
            genderId: request.GenderId,
            bloodTypeId: request.BloodTypeId,
            doctorId: request.DoctorId,
            hasAllergies: request.HasAllergies,
            isActive: request.IsActive,
            skip: (request.Page - 1) * request.PageSize,
            take: request.PageSize,
            sortBy: request.SortBy,
            sortDir: request.SortDir);

        // Get paged data
        var pagedResult = await repository.GetPagedAsync(spec, cancellationToken);

        // Get stats
        var stats = await repository.GetStatsAsync(currentUser.ClinicId, cancellationToken);

        return Result<PatientsPagedResponse>.Success(new PatientsPagedResponse
        {
            PagedResult = pagedResult,
            Stats = stats,
        });
    }
}
```

### 2. Repository Pattern

**Fișier:** [src/ValyanClinic.Infrastructure/Data/PatientRepository.cs](...)

```csharp
public sealed class PatientRepository : IPatientRepository
{
    public async Task<PagedResult<PatientListDto>> GetPagedAsync(
        PatientsSpecification spec,
        CancellationToken ct)
    {
        var query = _context.Patients
            .Where(p => p.ClinicId == spec.ClinicId)
            .Include(p => p.Allergies)
            .ThenInclude(a => a.AllergyType)
            .Include(p => p.PrimaryDoctor);

        // Apply specification filters
        if (!string.IsNullOrEmpty(spec.Search))
        {
            var search = spec.Search.ToLower();
            query = query.Where(p => 
                p.FullName.ToLower().Contains(search) ||
                p.Cnp.Contains(search) ||
                p.Email.ToLower().Contains(search));
        }

        if (spec.GenderId.HasValue)
            query = query.Where(p => p.GenderId == spec.GenderId);

        if (spec.BloodTypeId.HasValue)
            query = query.Where(p => p.BloodTypeId == spec.BloodTypeId);

        if (spec.HasAllergies.HasValue && spec.HasAllergies.Value)
            query = query.Where(p => p.Allergies.Any());

        if (spec.IsActive.HasValue)
            query = query.Where(p => p.IsActive == spec.IsActive);

        // Sorting
        var sortBy = spec.SortBy?.ToLower() ?? "lastname";
        query = sortBy switch
        {
            "fullname" => spec.SortDir == "asc"
                ? query.OrderBy(p => p.FullName)
                : query.OrderByDescending(p => p.FullName),
            "cnp" => spec.SortDir == "asc"
                ? query.OrderBy(p => p.Cnp)
                : query.OrderByDescending(p => p.Cnp),
            _ => query.OrderBy(p => p.FullName),
        };

        // Paging
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip(spec.Skip)
            .Take(spec.Take)
            .Select(p => new PatientListDto
            {
                Id = p.Id.ToString(),
                FullName = p.FullName,
                Cnp = p.Cnp,
                Age = DateTime.Now.Year - p.BirthDate.Year,
                GenderName = p.Gender.Name,
                BloodTypeName = p.BloodType.Name,
                AllergyCount = p.Allergies.Count,
                AllergyMaxSeverity = p.Allergies.Any()
                    ? p.Allergies.Max(a => a.AllergySeverity.Level).ToString()
                    : null,
                PrimaryDoctorName = p.PrimaryDoctor.FullName,
                Phone = p.PhoneNumber,
                Email = p.Email,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync(ct);

        return new PagedResult<PatientListDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = (spec.Skip / spec.Take) + 1,
            PageSize = spec.Take,
            HasPreviousPage = spec.Skip > 0,
            HasNextPage = (spec.Skip + spec.Take) < totalCount,
        };
    }
}
```

### 3. Controller Endpoints

**Fișier:** [src/ValyanClinic.API/Controllers/PatientsController.cs](...)

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : BaseApiController
{
    /// <summary>List pacienți paginat cu filtre.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? genderId,
        [FromQuery] Guid? bloodTypeId,
        [FromQuery] Guid? doctorId,
        [FromQuery] bool? hasAllergies,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "LastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetPatientsQuery(
            search, genderId, bloodTypeId, doctorId, hasAllergies, isActive,
            page, pageSize, sortBy, sortDir);

        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Creare pacient nou.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePatientRequest request, CancellationToken ct)
    {
        var command = new CreatePatientCommand(
            request.FullName, request.Cnp, request.BirthDate,
            request.GenderId, request.BloodTypeId,
            // ... rest of mapping);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result, statusCode: 201);
    }

    /// <summary>Actualizare pacient.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guild id, [FromBody] UpdatePatientRequest request, CancellationToken ct)
    {
        var command = new UpdatePatientCommand(id, ...);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Ștergere pacient.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var command = new DeletePatientCommand(id);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }
}
```

---

## 🧪 Testing

### Unit Tests

```csharp
[TestClass]
public class CreatePatientCommandHandlerTests
{
    [TestMethod]
    public async Task Handle_WithValidData_CreatesPatient()
    {
        // Arrange
        var command = new CreatePatientCommand(
            "Ion Popescu", "1850312123456", new DateTime(1985, 3, 12),
            genderId, bloodTypeId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.IsNotNull(result.Value?.Id);
    }

    [TestMethod]
    public async Task Handle_WithDuplicateCnp_ReturnsBadRequest()
    {
        // Arrange: Patient cu same CNP deja exists
        var command = new CreatePatientCommand(
            "Different Name", "1850312123456", ...);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.AreEqual(StatusCode.BadRequest, result.StatusCode);
    }
}
```

### Integration Tests

```csharp
[TestClass]
public class PatientsEndpointTests : IntegrationTest
{
    [TestMethod]
    public async Task Get_ListPatients_Returns200WithData()
    {
        // Act
        var response = await HttpClient.GetAsync("/api/patients?page=1&pageSize=20");

        // Assert
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsAsync<ApiResponse<PatientsPagedResponse>>();
        Assert.IsNotNull(content.Data?.PagedResult.Items);
    }

    [TestMethod]
    public async Task Post_CreatePatient_Returns201()
    {
        // Arrange
        var request = new CreatePatientRequest { FullName = "Test Patient", Cnp = "1850312123456" };

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/patients", request);

        // Assert
        Assert.AreEqual(HttpStatusCode.Created, response.StatusCode);
    }
}
```

---

## 🚀 Features viitoare

- ☐ Patient medical history timeline
- ☐ Document manager (scan-uri)
- ☐ Family relations tracking
- ☐ Genetic history predispositions
- ☐ Integration CNAS/SIUI export
- ☐ Multi-language forms

---

**© 2025 ValyanClinic. Developer Documentation.**
