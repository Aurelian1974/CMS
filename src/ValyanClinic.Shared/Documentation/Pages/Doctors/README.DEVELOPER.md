# 👨‍💻 Ghid Developer - Pagina Medici

## 🎯 Scope

Documentație **arhitectură + implementare** pentru pagina Doctors (medici) - frontend + backend, tech stack, file structure, testing, deployment.

---

## 📂 Structura Fișierelor

### Frontend Structure

```
client/src/features/doctors/
├── pages/
│   ├── DoctorsListPage.tsx          (680+ lines)
│   └── DoctorsListPage.module.scss
├── components/
│   ├── DoctorFormModal/
│   │   ├── DoctorFormModal.tsx      (300+ lines)
│   │   └── DoctorFormModal.module.scss
│   └── [other modals if needed]
├── hooks/
│   └── useDoctors.ts                (60+ lines)
├── types/
│   └── doctor.types.ts              (80+ lines)
├── schemas/
│   └── doctor.schema.ts             (50+ lines)
└── constants/
    └── doctor.constants.ts          (optional)
```

### Backend Structure

```
src/ValyanClinic.Application/
├── Features/Doctors/
│   ├── Commands/
│   │   ├── CreateDoctor/
│   │   │   ├── CreateDoctorCommand.cs      (request)
│   │   │   └── CreateDoctorCommandHandler.cs (200+ lines)
│   │   ├── UpdateDoctor/
│   │   │   ├── UpdateDoctorCommand.cs
│   │   │   └── UpdateDoctorCommandHandler.cs
│   │   └── DeleteDoctor/
│   │       ├── DeleteDoctorCommand.cs
│   │       └── DeleteDoctorCommandHandler.cs
│   └── Queries/
│       ├── GetDoctors/
│       │   ├── GetDoctorsQuery.cs
│       │   └── GetDoctorsQueryHandler.cs
│       ├── GetDoctorById/
│       │   └── GetDoctorByIdQueryHandler.cs
│       └── GetDoctorsByClinic/
│           └── GetDoctorsByClinicQueryHandler.cs

src/ValyanClinic.API/
├── Controllers/
│   └── DoctorsController.cs         (90+ lines, 6 endpoints)
└── ValyanClinic.http               (REST test file)

src/ValyanClinic.Domain/
├── Entities/
│   └── Doctor.cs                    (entity model)
└── ValueObjects/
    └── [if needed for complex types]
```

---

## 🔧 Tech Stack

### Frontend

| Tech | Versiune | Utilizare |
|------|----------|-----------|
| **React** | 18+ | Component framework |
| **TypeScript** | 5+ | Type safety |
| **TanStack Query** | v5 | Server-state management + pagination |
| **React Hook Form** | 7+ | Form state management |
| **Zod** | Latest | Runtime schema validation |
| **Syncfusion Grid** | Latest | Data grid component |
| **SCSS Modules** | N/A | Component styling |
| **Axios** | Latest | HTTP client |
| **Zustand** | Latest | Global state (auth) |

### Backend

| Tech | Versiune | Utilizare |
|------|----------|-----------|
| **ASP.NET Core** | 8.0+ | Web framework |
| **MediatR** | Latest | CQRS implementation |
| **EF Core** | 8.0+ | Database ORM |
| **FluentValidation** | Latest | DTO validation |
| **SQL Server** | 2019+ | Database |
| **AutoMapper** | N/A | (if DTO mapping) |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
├─────────────────────────────────────────────────────────────┤
│ DoctorsListPage                                             │
│ ├─ State: [search, filters, pagination]                    │
│ ├─ Refs: GridRef (Syncfusion Grid)                         │
│ ├─ Hooks:                                                   │
│ │  ├─ useDoctors(params)                                   │
│ │  ├─ useCreateDoctor()                                     │
│ │  ├─ useUpdateDoctor()                                     │
│ │  ├─ useDeleteDoctor()                                     │
│ │  ├─ useDoctorLookup() [for supervisor dropdown]          │
│ │  ├─ useSpecialties()  [nomenclature]                     │
│ │  ├─ useMedicalTitles() [nomenclature]                    │
│ │  ├─ useDepartments()   [departments]                     │
│ │  └─ useGridExport()    [Excel export]                    │
│ ├─ Renders:                                                 │
│ │  ├─ AppDataGrid (Syncfusion Grid)                        │
│ │  │  ├─ Paginated server-side                             │
│ │  │  └─ Columns: name, email, dept, spec, CMR, status    │
│ │  └─ DoctorFormModal (create/edit)                        │
│ │     ├─ useForm + Zod validation                          │
│ │     ├─ Cascading: specialty → subspecialty              │
│ │     ├─ Supervisor dropdown (useDoctorLookup)            │
│ │     └─ Medical titles filtered (MEDIC* codes)           │
│ └─ Event handlers:                                          │
│    ├─ onAddClick → DoctorFormModal open                    │
│    ├─ onRowClick → view details                            │
│    ├─ onEditClick → DoctorFormModal populate               │
│    ├─ onDeleteClick → confirm → execute                    │
│    └─ onExportClick → export modal                         │
├─────────────────────────────────────────────────────────────┤
│            Axios Instance (with JWT interceptors)           │
├─────────────────────────────────────────────────────────────┤
│                 /api/doctors (6 endpoints)                   │
│  GET    /api/doctors              (list paginated)          │
│  POST   /api/doctors              (create)                  │
│  GET    /api/doctors/{id}         (detail)                  │
│  PUT    /api/doctors/{id}         (update)                  │
│  DELETE /api/doctors/{id}         (soft delete)            │
│  GET    /api/doctors/lookup       (dropdown list)          │
├─────────────────────────────────────────────────────────────┤
│           DoctorsController (ASP.NET Core)                   │
│  - HasAccess attribute (permission checks)                  │
│  - ICurrentUser injection (clinic isolation)                │
│  - Mediator.Send(query/command)                             │
├─────────────────────────────────────────────────────────────┤
│     CQRS Handlers (MediatR pipelines)                        │
│  CreateDoctorCommandHandler                                 │
│  ├─ Validate: email unique, FK references                  │
│  ├─ Catch SqlException (custom error codes 50301-50305)     │
│  └─ Create entity + save + return ID                        │
│                                                              │
│  UpdateDoctorCommandHandler                                 │
│  ├─ Verify clinic isolation                                │
│  ├─ Update: all fields except email, CNP                   │
│  └─ Audit log the changes                                  │
│                                                              │
│  DeleteDoctorCommandHandler                                 │
│  ├─ Soft delete: set isDeleted = true                      │
│  ├─ Check constraints:                                      │
│  │  ├─ No active consultations                             │
│  │  ├─ No active prescriptions                             │
│  │  └─ No patients under supervision                       │
│  └─ Hard delete: only if constraints OK                    │
│                                                              │
│  GetDoctorsQueryHandler                                     │
│  ├─ Build specification (filters + search)                 │
│  ├─ Include: Department, Specialty, MedicalTitle relations │
│  ├─ Pagination: (page-1)*pageSize, pageSize                │
│  └─ Return: DoctorsPagedResult<DoctorDto>                  │
│                                                              │
│  GetDoctorByIdQueryHandler                                  │
│  ├─ Find by ID + clinic isolation                          │
│  └─ Include all relations for detail view                  │
│                                                              │
│  GetDoctorsByClinicQueryHandler (Lookup)                    │
│  ├─ Simple query: all doctors current clinic               │
│  └─ Cached: 5 min validity                                 │
├─────────────────────────────────────────────────────────────┤
│  IDoctorRepository (abstract data access)                    │
│  ├─ GetAllAsync(params, spec)   (specification pattern)    │
│  ├─ GetByIdAsync(id)                                        │
│  ├─ CreateAsync(...)            (bulk params)              │
│  ├─ UpdateAsync(...)            (bulk params)              │
│  ├─ DeleteAsync(id, soft=true)                             │
│  └─ [Count, Exists methods]                                │
├─────────────────────────────────────────────────────────────┤
│          Entity Framework Core DbContext                     │
│  DbSet<Doctor> Doctors                                      │
│  ├─ Configuration: HasIndex(d => d.Email)                  │
│  ├─ Relationships: FK to Department, Specialty, etc.       │
│  ├─ Soft delete filter: .Where(d => !d.IsDeleted)          │
│  └─ Shadow properties: CreatedAt, UpdatedAt, CreatedBy     │
├─────────────────────────────────────────────────────────────┤
│              SQL Server Database                             │
│  Table: Doctors                                             │
│  ├─ Columns: Id, ClinicId, DepartmentId, ...              │
│  ├─ Indexes: [ClinicId, IsActive, IsDeleted] compound     │
│  ├─ FK constraints: Department, Specialty, etc.            │
│  ├─ Unique constraint: [ClinicId, Email]                   │
│  └─ Audit trigger: log changes to DoctorAudit table        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Code Examples

### Frontend: useDoctors Hook

```typescript
// client/src/features/doctors/hooks/useDoctors.ts

import { useQuery, useMutation, useQueryClient, keepPreviousData } 
  from '@tanstack/react-query'
import { doctorsApi } from '@/api/endpoints/doctors.api'

// Query keys for cache invalidation
export const doctorKeys = {
  all: ['doctors'] as const,
  lists: () => [...doctorKeys.all, 'list'] as const,
  list: (params) => [...doctorKeys.lists(), params] as const,
  lookup: () => [...doctorKeys.all, 'lookup'] as const,
}

// List doctors (server-side pagination)
export const useDoctors = (params: GetDoctorsParams) =>
  useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => doctorsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })

// Create doctor
export const useCreateDoctor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDoctorPayload) => 
      doctorsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: doctorKeys.lists() 
      })
    },
  })
}

// Update doctor
export const useUpdateDoctor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDoctorPayload) => 
      doctorsApi.update(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ 
        queryKey: doctorKeys.lists() 
      })
      queryClient.invalidateQueries({
        queryKey: doctorKeys.detail(payload.id)
      })
    },
  })
}

// Lookup (cached for dropdowns)
export const useDoctorLookup = () =>
  useQuery({
    queryKey: doctorKeys.lookup(),
    queryFn: () => doctorsApi.getLookup(),
    staleTime: 5 * 60 * 1000,
  })
```

### Frontend: Form Validation (Zod)

```typescript
// client/src/features/doctors/schemas/doctor.schema.ts

import { z } from 'zod'

export const doctorSchema = z.object({
  firstName: z.string().min(1, 'Prenume obligatoriu'),
  lastName: z.string().min(1, 'Nume obligatoriu'),
  email: z.string().email('Email invalid'),
  phoneNumber: z.string().optional(),
  departmentId: z.string().guid('Invalid department').optional(),
  supervisorDoctorId: z.string().guid('Invalid supervisor').optional(),
  specialtyId: z.string().guid('Specialty obligatoriu'),
  subspecialtyId: z.string().guid('Subspecialty obligatoriu'),
  medicalTitleId: z.string().guid('Title obligatoriu'),
  medicalCode: z.string().max(20).optional(),
  licenseNumber: z.string().max(20).optional(),
  licenseExpiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
})

export type DoctorFormData = z.infer<typeof doctorSchema>
```

### Frontend: Cascading Dropdowns

```typescript
// client/src/features/doctors/components/DoctorFormModal/DoctorFormModal.tsx

export const DoctorFormModal = ({
  specialties,
  ...props
}: Props) => {
  const { watch, setValue } = useForm<DoctorFormData>(...)
  
  const selectedSpecialtyId = watch('specialtyId')

  // L1: All specialties
  const level1Specialties = useMemo(
    () => specialties.filter(s => s.level === 1 && s.isActive),
    [specialties],
  )

  // L2: Filtered by selected L1
  const filteredSubspecialties = useMemo(
    () =>
      selectedSpecialtyId
        ? specialties.filter(
            s => s.level === 2 && 
                 s.parentId === selectedSpecialtyId && 
                 s.isActive
          )
        : [],
    [specialties, selectedSpecialtyId],
  )

  return (
    <FormSelect
      name="specialtyId"
      label="Specialitate (L1)"
      options={level1Specialties}
    />
  )
  // ... subspecialty follows
}
```

### Backend: CreateDoctor Handler

```csharp
// src/ValyanClinic.Application/Features/Doctors/Commands/CreateDoctor/
//     CreateDoctorCommandHandler.cs

public sealed class CreateDoctorCommandHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateDoctorCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateDoctorCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,      // Clinic isolation
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.SpecialtyId,
                request.SubspecialtyId,
                request.MedicalTitleId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                request.MedicalCode,
                request.LicenseNumber,
                request.LicenseExpiresAt,
                currentUser.Id,             // Audit: created by user
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        // Error handling with SQL-level validation
        catch (SqlException ex) when (ex.Number == 50301)
        {
            return Result<Guid>.Conflict(
                ErrorMessages.Doctor.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50302)
        {
            return Result<Guid>.Failure(
                ErrorMessages.Doctor.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == 50303)
        {
            return Result<Guid>.Failure(
                ErrorMessages.Doctor.InvalidSupervisor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating doctor");
            return Result<Guid>.Failure("Unexpected error");
        }
    }
}
```

### Backend: Repository Pattern

```csharp
// src/ValyanClinic.Infrastructure/Data/DoctorRepository.cs

public class DoctorRepository : IDoctorRepository
{
    private readonly IDbContext _context;

    public async Task<DoctorsPagedResult> GetAllAsync(
        GetDoctorsParams @params,
        CancellationToken ct = default)
    {
        // Build specification for complex filtering
        var spec = new DoctorListSpecification(@params);
        
        // EF Core query with eager loading
        var query = _context.Doctors
            .Including(spec.Includes)
            .Where(spec.Criteria)
            .OrderBy(spec.OrderBy)
            .AsNoTracking();

        // Get total count (before pagination)
        var totalCount = await query.CountAsync(ct);

        // Paginate
        var doctors = await query
            .Skip((@params.Page - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .Select(d => new DoctorDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                FullName = $"{d.FirstName} {d.LastName}",
                Email = d.Email,
                DepartmentName = d.Department.Name,
                SpecialtyName = d.Specialty.Name,
                // ... map other fields
            })
            .ToListAsync(ct);

        return new DoctorsPagedResult
        {
            Items = doctors,
            TotalCount = totalCount,
            PageSize = @params.PageSize,
            CurrentPage = @params.Page,
        };
    }
}
```

---

## 🧪 Testing

### Unit Tests - Frontend

```typescript
// client/src/features/doctors/__tests__/useDoctors.test.ts

import { renderHook, waitFor } from '@testing-library/react'
import { useDoctors } from '../hooks/useDoctors'

describe('useDoctors hook', () => {
  it('should fetch doctors list', async () => {
    const { result } = renderHook(() => 
      useDoctors({ page: 1, pageSize: 20 })
    )

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Data loaded
    expect(result.current.data).toBeDefined()
    expect(result.current.data.items.length).toBeGreaterThan(0)
  })

  it('should handle search', async () => {
    const { result } = renderHook(() => 
      useDoctors({ page: 1, search: 'Ion' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Results filtered
    expect(result.current.data.items.every(
      d => d.firstName.includes('Ion')
    )).toBe(true)
  })
})
```

### Unit Tests - Backend

```csharp
// src/ValyanClinic.Application.Tests/
//     Features/Doctors/CreateDoctorCommandHandlerTests.cs

[TestClass]
public class CreateDoctorCommandHandlerTests
{
    private IDoctorRepository _repository;
    private CreateDoctorCommandHandler _handler;

    [TestInitialize]
    public void Setup()
    {
        _repository = new Mock<IDoctorRepository>().Object;
        _handler = new CreateDoctorCommandHandler(_repository);
    }

    [TestMethod]
    public async Task Handle_ValidCommand_ReturnsDoctorId()
    {
        // Arrange
        var command = new CreateDoctorCommand(
            firstName: "Ioan",
            lastName: "Pop",
            email: "ioan@example.com",
            // ... other fields
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.IsNotNull(result.Value);
    }

    [TestMethod]
    public async Task Handle_DuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var command = new CreateDoctorCommand(...);
        _repository.Setup(r => r.CreateAsync(...))
            .ThrowsAsync(new SqlException("Email duplicate"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.AreEqual(ResultType.Conflict, result.Type);
    }
}
```

### Integration Tests

```csharp
// src/ValyanClinic.API.Tests/Controllers/DoctorsControllerTests.cs

[TestClass]
public class DoctorsControllerTests : IClassFixture<WebApplicationFactory>
{
    private readonly HttpClient _client;

    [TestMethod]
    public async Task GetAll_ReturnsOkWithDoctors()
    {
        // Act
        var response = await _client.GetAsync("/api/doctors?page=1");

        // Assert
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsJson<DoctorsPagedResult>();
        Assert.IsNotNull(content);
        Assert.IsTrue(content.Items.Count > 0);
    }

    [TestMethod]
    public async Task Create_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var createRequest = new CreateDoctorCommand(...)

        // Act
        var response = await _client.PostAsJsonAsync(
            "/api/doctors", createRequest);

        // Assert
        Assert.AreEqual(HttpStatusCode.Created, response.StatusCode);
    }
}
```

---

## 🚀 Development Workflow

### 1. Setup Local

```bash
# Clone & install
git clone https://github.com/ValyanClinic/cms.git
cd cms

# Frontend setup
cd client
npm install
npm run dev
# Open: http://localhost:5173

# Backend setup (separate terminal)
cd ../src/ValyanClinic.API
dotnet restore
dotnet run
# Listens on: https://localhost:5001
```

### 2. Feature Development

**Branch naming:**
```
feature/doctors-export
feature/doctors-supervisor-hierarchy
bugfix/doctors-email-validation
```

**Workflow:**
```
1. git checkout -b feature/doctors-xxx
2. Make changes (frontend + backend together)
3. Run tests: npm test (frontend), dotnet test (backend)
4. Commit: git commit -m "feat(doctors): ..."
5. Push: git push origin feature/doctors-xxx
6. PR review + merge
```

### 3. Testing Locally

```bash
# Frontend tests
cd client
npm run test
npm run test:coverage

# Backend tests
cd src/ValyanClinic.API
dotnet test
dotnet test --logger "console;verbosity=detailed"
```

### 4. Debugging

**Frontend:**
```
F12 → DevTools
Network: watch API calls
Console: check errors
React tab: inspect components state
```

**Backend:**
```
Visual Studio Debug Mode
Breakpoints in handlers
Watch variables
Check SQL queries in EF Core logs
```

---

## 📈 Performance Considerations

### Database Optimizations

```sql
-- Create indexes on frequently queried columns
CREATE INDEX IX_Doctor_ClinicId_IsActive_IsDeleted 
  ON Doctors(ClinicId, IsActive, IsDeleted);

CREATE UNIQUE INDEX UX_Doctor_ClinicId_Email 
  ON Doctors(ClinicId, Email);

-- For filtering
CREATE INDEX IX_Doctor_DepartmentId 
  ON Doctors(DepartmentId);
```

### Caching Strategy

```typescript
// TanStack Query stale times
const STALE_TIMES = {
  list: 3 * 60 * 1000,        // 3 min
  lookup: 5 * 60 * 1000,      // 5 min (supervisor dropdown)
  detail: 10 * 60 * 1000,     // 10 min
};

// Invalidation on mutations
queryClient.invalidateQueries({ 
  queryKey: doctorKeys.lists() 
})
```

### Query Optimization

```csharp
// Use specifications for complex queries
var spec = new DoctorListSpecification(parameters);
var doctors = await _context.Doctors
    .Where(spec.Criteria)
    .Including(spec.Includes)      // Eager load
    .OrderBy(spec.OrderBy)
    .AsNoTracking()                 // Read-only
    .ToListAsync();
```

---

## 🔒 Security Best Practices

```
1. InputValidation:
   - Zod on frontend
   - FluentValidation on backend
   - Re-validate server-side always

2. SQLInjection:
   - Use parameterized queries (ALWAYS)
   - EF Core handles this
   - Never string concatenation in SQL

3. Authentication:
   - JWT token in Authorization header
   - HttpOnly cookies for refresh
   - Token refresh pipeline

4. Authorization:
   - [HasAccess(ModuleCodes.Users, AccessLevel.X)]
   - ICurrentUser for clinic isolation
   - Permission checks per endpoint

5. Data Protection:
   - HTTPS/TLS for transport
   - Sensitive data: never log
   - Soft delete: preserve audit trail
   - GDPR: right to erasure process

6. CORS:
   - Only allow clinic domain
   - Credentials included
   - Methods: GET, POST, PUT, DELETE
```

---

## 🔄 CI/CD Pipeline

```yaml
# .github/workflows/doctors-test.yml

name: Doctors Module Tests

on: [push, pull_request]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd client && npm install && npm run test

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
      - run: dotnet test src/ValyanClinic.Application.Tests/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd client && npm run lint
      - run: dotnet format --verify-no-changes src/
```

---

## 🗺️ Roadmap

### v1.1.0 - Q3 2025
- [ ] Bulk import doctors (CSV)
- [ ] Doctor specialization verification
- [ ] Work schedule management
- [ ] On-call rotation system

### v1.2.0 - Q4 2025
- [ ] License auto-renewal workflow
- [ ] Doctor performance metrics
- [ ] Patient-doctor relationship history
- [ ] Doctor availability calendar

### v2.0.0 - Q1 2026
- [ ] Mobile app sync
- [ ] Advanced analytics
- [ ] AI-powered scheduling
- [ ] Real-time availability updates

---

**© 2025 ValyanClinic. Developer guide confidențial.**

*Ultima actualizare: 2025-03-08*
