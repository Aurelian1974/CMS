# 👨‍💻 Ghid Developer - Pagina Personal Medical

## 🎯 Scope

Documentație **arhitectură + implementare** pentru pagina Medical Staff - frontend + backend, tech stack, file structure, testing, deployment.

---

## 📂 Structura Fișierelor

### Frontend Structure

```
client/src/features/medicalStaff/
├── pages/
│   ├── MedicalStaffListPage.tsx     (~400 lines)
│   └── MedicalStaffListPage.module.scss
├── components/
│   ├── MedicalStaffFormModal/
│   │   ├── MedicalStaffFormModal.tsx (~200 lines)
│   │   └── MedicalStaffFormModal.module.scss
│   └── [other components if needed]
├── hooks/
│   └── useMedicalStaff.ts           (~50 lines)
├── types/
│   └── medicalStaff.types.ts        (~60 lines)
├── schemas/
│   └── medicalStaff.schema.ts       (~40 lines)
└── constants/
    └── medicalStaff.constants.ts    (optional)
```

### Backend Structure

```
src/ValyanClinic.Application/
├── Features/MedicalStaff/
│   ├── Commands/
│   │   ├── CreateMedicalStaff/
│   │   ├── UpdateMedicalStaff/
│   │   └── DeleteMedicalStaff/
│   ├── Queries/
│   │   ├── GetMedicalStaffList/
│   │   ├── GetMedicalStaffById/
│   │   └── GetMedicalStaffByClinic/
│   └── DTOs/
│       └── MedicalStaffListDto.cs
│       └── MedicalStaffDetailDto.cs

src/ValyanClinic.API/
├── Controllers/
│   └── MedicalStaffController.cs    (~100 lines, 6 endpoints)

src/ValyanClinic.Domain/
├── Entities/
│   └── MedicalStaffMember.cs        (domain model)

src/ValyanClinic.Infrastructure/
├── Data/
│   ├── Repositories/
│   │   └── MedicalStaffRepository.cs (Dapper-based)
│   └── StoredProcedures/
│       └── MedicalStaffProcedures.cs (SP names)
```

---

## 🔧 Tech Stack

### Frontend

| Tech | Versiune | Utilizare |
|------|----------|-----------|
| **React** | 18+ | Component framework |
| **TypeScript** | 5+ | Type safety |
| **TanStack Query** | v5 | Server-state + pagination |
| **React Hook Form** | 7+ | Form state management |
| **Zod** | Latest | Runtime validation |
| **Syncfusion Grid** | Latest | Data table |
| **SCSS Modules** | N/A | Styling |
| **Axios** | Latest | HTTP client |

### Backend

| Tech | Versiune | Utilizare |
|------|----------|-----------|
| **ASP.NET Core** | 8.0+ | Web framework |
| **MediatR** | Latest | CQRS |
| **Dapper** | Latest | Data access (SQL) |
| **SQL Server** | 2019+ | Database |
| **T-SQL** | N/A | Stored procedures |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│       React Frontend                        │
│  MedicalStaffListPage                      │
│  ├─ Syncfusion Grid (paginated)           │
│  ├─ useMedicalStaffList (TanStack Query)  │
│  ├─ MedicalStaffFormModal                 │
│  └─ Zod validation                        │
├─────────────────────────────────────────────┤
│       Axios + JWT Interceptors             │
├─────────────────────────────────────────────┤
│   /api/medicalStaff (6 endpoints)          │
│  GET, POST, PUT, DELETE                    │
├─────────────────────────────────────────────┤
│    MedicalStaffController                   │
│  REST endpoints + [HasAccess] attributes   │
├─────────────────────────────────────────────┤
│   CQRS Handlers (MediatR)                   │
│  Create, Update, Delete, GetList, GetById   │
├─────────────────────────────────────────────┤
│   IMedicalStaffRepository (Dapper)          │
│  Executes stored procedures                 │
├─────────────────────────────────────────────┤
│   Stored Procedures (T-SQL)                 │
│  sp_MedicalStaff_GetPaged                  │
│  sp_MedicalStaff_Create                    │
│  sp_MedicalStaff_Update                    │
│  sp_MedicalStaff_Delete                    │
├─────────────────────────────────────────────┤
│   SQL Server Database                       │
│  MedicalStaffMembers table                 │
│  + indexes + audit triggers                │
└─────────────────────────────────────────────┘
```

---

## 📝 Code Examples

### Frontend: useMedicalStaff Hook

```typescript
// client/src/features/medicalStaff/hooks/useMedicalStaff.ts

import { useQuery, useMutation, useQueryClient } 
  from '@tanstack/react-query'
import { medicalStaffApi } from '@/api/endpoints/medicalStaff.api'

export const medicalStaffKeys = {
  all: ['medicalStaff'] as const,
  lists: () => [...medicalStaffKeys.all, 'list'] as const,
  list: (params) => [...medicalStaffKeys.lists(), params] as const,
  lookup: () => [...medicalStaffKeys.all, 'lookup'] as const,
}

export const useMedicalStaffList = (params: GetMedicalStaffParams) =>
  useQuery({
    queryKey: medicalStaffKeys.list(params),
    queryFn: () => medicalStaffApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })

export const useCreateMedicalStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMedicalStaffPayload) => 
      medicalStaffApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ 
        queryKey: medicalStaffKeys.lists() 
      })
    },
  })
}
```

### Frontend: Form Validation (Zod)

```typescript
// client/src/features/medicalStaff/schemas/medicalStaff.schema.ts

import { z } from 'zod'

export const medicalStaffSchema = z.object({
  firstName: z.string().min(1, 'Prenume obligatoriu'),
  lastName: z.string().min(1, 'Nume obligatoriu'),
  email: z.string().email('Email invalid'),
  phoneNumber: z.string().optional(),
  departmentId: z.string().guid().optional(),
  supervisorDoctorId: z.string().guid().optional(),
  medicalTitleId: z.string().guid('Title obligatoriu'),
  isActive: z.boolean().default(true),
})

export type MedicalStaffFormData = z.infer<typeof medicalStaffSchema>
```

### Backend: CreateMedicalStaff Handler

```csharp
// CreateMedicalStaffCommandHandler.cs

public sealed class CreateMedicalStaffCommandHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateMedicalStaffCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateMedicalStaffCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,  // Multi-tenant
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.MedicalTitleId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                currentUser.Id,         // Audit
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50401)
        {
            return Result<Guid>.Conflict(
                ErrorMessages.MedicalStaffMember.EmailDuplicate);
        }
        // Handle other error codes...
    }
}
```

### Backend: Repository (Dapper)

```csharp
// MedicalStaffRepository.cs

public sealed class MedicalStaffRepository(DapperContext context) 
    : IMedicalStaffRepository
{
    public async Task<PagedResult<MedicalStaffListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? departmentId, 
        Guid? medicalTitleId, bool? isActive, int page, int pageSize, 
        string sortBy, string sortDir, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                MedicalStaffProcedures.GetPaged,
                new {
                    ClinicId = clinicId,
                    Search = search,
                    DepartmentId = departmentId,
                    MedicalTitleId = medicalTitleId,
                    IsActive = isActive,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<MedicalStaffListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<MedicalStaffListDto>(
            items, totalCount, page, pageSize);
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? medicalTitleId, string firstName, string lastName, 
        string email, string? phoneNumber, Guid createdBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                MedicalStaffProcedures.Create,
                new {
                    ClinicId = clinicId,
                    DepartmentId = departmentId,
                    SupervisorDoctorId = supervisorDoctorId,
                    MedicalTitleId = medicalTitleId,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
```

---

## 🧪 Testing

### Unit Tests - Frontend

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useMedicalStaffList } from '../hooks/useMedicalStaff'

describe('useMedicalStaffList hook', () => {
  it('should fetch staff list', async () => {
    const { result } = renderHook(() => 
      useMedicalStaffList({ page: 1, pageSize: 20 })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data.items.length).toBeGreaterThan(0)
  })
})
```

### Unit Tests - Backend

```csharp
[TestClass]
public class CreateMedicalStaffCommandHandlerTests
{
    [TestMethod]
    public async Task Handle_ValidCommand_ReturnsStaffId()
    {
        // Arrange
        var command = new CreateMedicalStaffCommand(
            firstName: "Ionela",
            lastName: "Pop",
            email: "ionela@example.com",
            medicalTitleId: titleId
        );

        // Act
        var result = await _handler.Handle(
            command, CancellationToken.None);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.IsNotNull(result.Value);
    }

    [TestMethod]
    public async Task Handle_DuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var command = new CreateMedicalStaffCommand(...);
        _repository.Setup(r => r.CreateAsync(...))
            .ThrowsAsync(new SqlException("Email duplicate"));

        // Act
        var result = await _handler.Handle(
            command, CancellationToken.None);

        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.AreEqual(ResultType.Conflict, result.Type);
    }
}
```

---

## 🚀 Development Workflow

### Setup Local

```bash
# Clone & install
git clone https://github.com/ValyanClinic/cms.git
cd cms

# Frontend
cd client && npm install && npm run dev
# Opens: http://localhost:5173

# Backend
cd ../src/ValyanClinic.API
dotnet restore && dotnet run
# Listen: https://localhost:5001
```

### Feature Development

```
1. Create branch: feature/medical-staff-xxx
2. Make changes (frontend + backend)
3. Run tests: npm test, dotnet test
4. Commit: git commit -m "feat(medical-staff): ..."
5. PR → review → merge
```

---

## 📈 Performance

### Database Optimization

```sql
-- Email unique per clinic
CREATE UNIQUE INDEX UX_MedicalStaff_Email
  ON MedicalStaffMembers(ClinicId, Email);

-- Filtering indexes
CREATE INDEX IX_MedicalStaff_Active
  ON MedicalStaffMembers(ClinicId, IsActive, IsDeleted);
```

### Caching Strategy

```typescript
list: 3 * 60 * 1000,        // 3 min
lookup: 5 * 60 * 1000,      // 5 min
detail: 10 * 60 * 1000,     // 10 min
```

---

## 🔒 Security

```
1. Input validation: Zod + FluentValidation
2. SQL injection: Parameterized queries (ALWAYS)
3. Authentication: JWT + refresh tokens
4. Authorization: [HasAccess(Module, Level)]
5. Clinic isolation: ICurrentUser.ClinicId
6. Data protection: HTTPS/TLS
```

---

## 🗺️ Roadmap

### v1.1.0 - Q2 2025
- [ ] Bulk import staff (CSV)
- [ ] Work schedule management
- [ ] Performance metrics

### v1.2.0 - Q3 2025
- [ ] Advanced analytics
- [ ] Mobile app sync
- [ ] Real-time updates

---

**© 2025 ValyanClinic. Developer guide confidențial.**

*Ultima actualizare: 2025-03-08*
