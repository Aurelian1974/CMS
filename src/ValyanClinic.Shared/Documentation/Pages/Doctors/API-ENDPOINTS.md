# 🔌 API Reference - Pagina Medici

## 📍 Base URL

```
https://api.clinic.local/api
```

## 🔐 Authentication

```
Header: Authorization: Bearer {accessToken}
Token type: JWT
Format: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Token refresh:**
```
HttpOnly cookie: refreshToken (auto-renewed)
When access token expires: interceptor auto-refreshes
```

---

## 📊 1. List Doctors (Paginated)

### Request

```http
GET /api/doctors?page=1&pageSize=20&search=ion&departmentId=xxx&isActive=true
```

### Query Parameters

| Param | Type | Required | Default | Descriere |
|-------|------|----------|---------|-----------|
| `page` | int | ✓ | 1 | Pagina număr (1-indexed) |
| `pageSize` | int | - | 20 | Items per page (max 100) |
| `search` | string | - | null | Search: nume/email/medic code |
| `departmentId` | guid | - | null | Filter by department |
| `specialtyId` | guid | - | null | Filter by specialty |
| `isActive` | bool | - | null | Filter active (true/false/null=all) |
| `sortBy` | string | - | "FirstName" | Column to sort |
| `sortDir` | string | - | "asc" | asc or desc |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "pagedResult": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "clinicId": "12345678-1234-1234-1234-123456789012",
          "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          "departmentName": "Cardiologie",
          "supervisorDoctorId": null,
          "supervisorName": null,
          "specialtyId": "11111111-2222-3333-4444-555555555555",
          "specialtyName": "Interventional Cardiology",
          "subspecialtyId": "22222222-3333-4444-5555-666666666666",
          "subspecialtyName": "Sub-specialty Name",
          "medicalTitleId": "33333333-4444-5555-6666-777777777777",
          "medicalTitleName": "Doctor (MD)",
          "firstName": "Ion",
          "lastName": "Popescu",
          "fullName": "Ion Popescu",
          "email": "ion.popescu@clinic.local",
          "phoneNumber": "+40721234567",
          "medicalCode": "POPESCU.ION",
          "licenseNumber": "A-123456",
          "licenseExpiresAt": "2025-12-31",
          "isActive": true,
          "createdAt": "2024-01-15T10:30:00Z"
        },
        // ... more doctors
      ],
      "totalCount": 287,
      "pageSize": 20,
      "currentPage": 1,
      "totalPages": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "errors": []
}
```

### TypeScript Interface

```typescript
export interface DoctorsPagedResult {
  items: DoctorDto[]
  totalCount: number
  pageSize: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DoctorDto {
  id: string
  clinicId: string
  departmentId: string | null
  departmentName: string | null
  supervisorDoctorId: string | null
  supervisorName: string | null
  specialtyId: string | null
  specialtyName: string | null
  subspecialtyId: string | null
  subspecialtyName: string | null
  medicalTitleId: string | null
  medicalTitleName: string | null
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string | null
  medicalCode: string | null
  licenseNumber: string | null
  licenseExpiresAt: string | null
  isActive: boolean
  createdAt: string
}
```

### Examples

**cURL:**
```bash
curl -X GET "https://api.clinic.local/api/doctors?page=1&pageSize=20" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**JavaScript/Fetch:**
```javascript
const response = await fetch(
  'https://api.clinic.local/api/doctors?page=1&pageSize=20',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)
const data = await response.json()
```

**Axios:**
```typescript
const { data } = await api.get('/api/doctors', {
  params: { page: 1, pageSize: 20, search: 'ion' }
})
```

---

## 👁️ 2. Get Doctor Details

### Request

```http
GET /api/doctors/{id}
```

### URL Parameters

| Param | Type | Descriere |
|-------|------|-----------|
| `id` | guid | Doctor ID (UUID) |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clinicId": "12345678-1234-1234-1234-123456789012",
    "firstName": "Ion",
    "lastName": "Popescu",
    "email": "ion.popescu@clinic.local",
    "phoneNumber": "+40721234567",
    "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "departmentName": "Cardiologie",
    "specialtyId": "11111111-2222-3333-4444-555555555555",
    "specialtyName": "Interventional Cardiology",
    "subspecialtyId": "22222222-3333-4444-5555-666666666666",
    "subspecialtyName": "Sub-specialty",
    "medicalTitleId": "33333333-4444-5555-6666-777777777777",
    "medicalTitleName": "Doctor (MD)",
    "supervisorDoctorId": null,
    "supervisorName": null,
    "medicalCode": "POPESCU.ION",
    "licenseNumber": "A-123456",
    "licenseExpiresAt": "2025-12-31",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2025-03-08T14:30:00Z"
  },
  "errors": []
}
```

### Errors

| Code | Status | Descriere |
|------|--------|-----------|
| DOCTOR_NOT_FOUND | 404 | Doctor nu există |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | No access permission |

---

## 📋 3. Lookup Doctors (Dropdown)

### Request

```http
GET /api/doctors/lookup
```

### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Dr. Ion Popescu",
      "firstName": "Ion",
      "lastName": "Popescu",
      "email": "ion.popescu@clinic.local",
      "medicalCode": "POPESCU.ION",
      "specialtyId": "11111111-2222-3333-4444-555555555555",
      "specialtyName": "Interventional Cardiology",
      "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "departmentName": "Cardiologie"
    },
    // ... more doctors
  ],
  "errors": []
}
```

**Utilizare:** Supervisor doctor dropdown, any doctor selection field

---

## ➕ 4. Create Doctor

### Request

```http
POST /api/doctors
Content-Type: application/json
```

### Body

```json
{
  "firstName": "Andrei",
  "lastName": "Popescu",
  "email": "andrei.popescu@clinic.local",
  "phoneNumber": "+40721234567",
  "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "supervisorDoctorId": null,
  "specialtyId": "11111111-2222-3333-4444-555555555555",
  "subspecialtyId": "22222222-3333-4444-5555-666666666666",
  "medicalTitleId": "33333333-4444-5555-6666-777777777777",
  "medicalCode": "POPESCU.ANDREI",
  "licenseNumber": "A-654321",
  "licenseExpiresAt": "2026-12-31",
  "isActive": true
}
```

### Validări

```
✓ firstName: required, max 50
✓ lastName: required, max 50
✓ email: required, unique per clinic, valid format
✓ phoneNumber: optional, valid international format
✓ departmentId: optional, but must be valid if provided
✓ supervisorDoctorId: optional, must be valid doctor ID
✓ specialtyId: required, must exist
✓ subspecialtyId: required, must exist
✓ medicalTitleId: required, must exist
✓ medicalCode: optional, max 20 chars
✓ licenseNumber: optional, max 20 chars
✓ licenseExpiresAt: optional, valid date
```

### Response (201 Created)

```json
{
  "success": true,
  "data": "550e8400-e29b-41d4-a716-446655440000",
  "errors": []
}
```

Returns the new doctor **ID** (GUID).

### Errors

| Code | Status | Descriere | SQL Error |
|------|--------|-----------|-----------|
| EMAIL_DUPLICATE | 409 | Email deja exista în clinică | 50301 |
| INVALID_DEPARTMENT | 400 | DepartmentId nu există | 50302 |
| INVALID_SUPERVISOR | 400 | SupervisorId doctor invalid | 50303 |
| INVALID_SPECIALTY | 400 | SpecialtyId nu exista | 50304 |
| UNAUTHORIZED | 401 | No token | - |
| FORBIDDEN | 403 | No Level 2+ permission | - |

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "EMAIL_DUPLICATE",
      "message": "Email address already exists in clinic"
    }
  ]
}
```

### cURL Example

```bash
curl -X POST "https://api.clinic.local/api/doctors" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Andrei",
    "lastName": "Popescu",
    "email": "andrei.popescu@clinic.local",
    "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "specialtyId": "11111111-2222-3333-4444-555555555555",
    "subspecialtyId": "22222222-3333-4444-5555-666666666666",
    "medicalTitleId": "33333333-4444-5555-6666-777777777777",
    "licenseExpiresAt": "2026-12-31"
  }'
```

---

## ✏️ 5. Update Doctor

### Request

```http
PUT /api/doctors/{id}
Content-Type: application/json
```

### URL Parameters

| Param | Type | Descriere |
|-------|------|-----------|
| `id` | guid | Doctor ID |

### Body

```json
{
  "firstName": "Andrei",
  "lastName": "Popescu",
  "email": "andrei.new@clinic.local",
  "phoneNumber": "+40721234567",
  "departmentId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "supervisorDoctorId": "550e8400-e29b-41d4-a716-446655440001",
  "specialtyId": "11111111-2222-3333-4444-555555555555",
  "subspecialtyId": "22222222-3333-4444-5555-666666666666",
  "medicalTitleId": "33333333-4444-5555-6666-777777777777",
  "medicalCode": "POPESCU.ANDREI",
  "licenseNumber": "A-654321",
  "licenseExpiresAt": "2026-12-31",
  "isActive": true
}
```

### Immutable Fields

```
❌ Email - CANNOT change (primary key)
❌ MedicalCode - CANNOT change if doctor has consults
```

### Response (200 OK)

```json
{
  "success": true,
  "data": true,
  "errors": []
}
```

### Errors

| Code | Status | Descriere |
|------|--------|-----------|
| DOCTOR_NOT_FOUND | 404 | Doctor nu exista |
| EMAIL_DUPLICATE | 409 | Email deja folosit |
| EMAIL_IMMUTABLE | 400 | Nici email editat |
| UNAUTHORIZED | 401 | No token |
| FORBIDDEN | 403 | No Level 2+ permission |

---

## 🗑️ 6. Delete Doctor

### Request

```http
DELETE /api/doctors/{id}
```

### Response (200 OK - Soft Delete)

```json
{
  "success": true,
  "data": true,
  "errors": []
}
```

### Soft Delete Behavior

```
- Mark: isDeleted = true
- Preserve: audit trail, historical data
- Hidden: din list view, search results
- Reversible: possible data restore (admin only)
```

### Constraints to Delete

```
❌ Doctor has active consultations
   → Error: DOCTOR_HAS_CONSULTATIONS (code 50306)

❌ Doctor has active prescriptions
   → Error: DOCTOR_HAS_PRESCRIPTIONS (code 50307)

❌ Doctor supervises other doctors
   → Error: DOCTOR_IS_SUPERVISOR (code 50308)
   → Solution: Reassign supervised doctors first

✓ Otherwise: Soft delete succeeds
```

### Error Response

```json
{
  "success": false,
  "data": false,
  "errors": [
    {
      "code": "DOCTOR_HAS_CONSULTATIONS",
      "message": "Cannot delete doctor with active consultations. Move consultations to another doctor first."
    }
  ]
}
```

### cURL Example

```bash
curl -X DELETE "https://api.clinic.local/api/doctors/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}"
```

---

## 📊 Additional Endpoints

### Statistics (if available)

```http
GET /api/doctors/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalDoctors": 287,
    "activeDoctors": 245,
    "inactiveDoctors": 42,
    "licenseExpiringCount": 8,
    "doctorsBySpecialty": [
      { "specialtyName": "Cardiologie", "count": 45 },
      { "specialtyName": "Neurologie", "count": 32 }
    ]
  },
  "errors": []
}
```

---

## 🔄 Standard Response Format

```json
{
  "success": boolean,
  "data": T | null,
  "errors": [
    {
      "code": "string",
      "message": "string"
    }
  ]
}
```

---

## 📝 HTTP Status Codes

| Status | Meaning |
|--------|---------|
| **200** | OK - Request successful |
| **201** | Created - Resource created |
| **400** | Bad Request - Invalid params |
| **401** | Unauthorized - No/invalid token |
| **403** | Forbidden - No permission |
| **404** | Not Found - Resource not found |
| **409** | Conflict - Email duplicate |
| **422** | Unprocessable Entity - Validation error |
| **500** | Internal Server Error - Server error |

---

## 🔐 Permissions Required

| Endpoint | Method | Min Level | Role |
|----------|--------|-----------|------|
| /doctors | GET | 1 | Any authenticated |
| /doctors/{id} | GET | 1 | Any authenticated |
| /doctors/lookup | GET | 1 | Any authenticated |
| /doctors | POST | 2 | Receptionist+ |
| /doctors/{id} | PUT | 2 | Receptionist+ |
| /doctors/{id} | DELETE | 3 | Doctor+ |

---

## 🧪 Testing API with Postman/Insomnia

**1. Get Auth Token**
```
POST /api/auth/login
Body: { "username": "test", "password": "test" }
Copy: accessToken
```

**2. Set Bearer Token**
```
Headers:
Authorization: Bearer {accessToken}
```

**3. List Doctors**
```
GET /api/doctors?page=1
```

**4. Create Doctor**
```
POST /api/doctors
Body: { "firstName": "Test", ... }
```

---

**© 2025 ValyanClinic. API Reference confidențial.**

*Ultima actualizare: 2025-03-08*
