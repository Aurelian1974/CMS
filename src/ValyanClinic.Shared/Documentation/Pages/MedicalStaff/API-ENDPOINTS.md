# 🔌 API Reference - Pagina Personal Medical

## 📍 Base URL
```
https://api.clinic.local/api/medicalStaff
```

## 🔐 Authentication
```
Header: Authorization: Bearer {accessToken}
Token type: JWT (8 hour expiry)
Refresh: HttpOnly cookie (7 day expiry)
```

---

## 📊 1. List Medical Staff (Paginated)

### Request
```http
GET /api/medicalStaff?page=1&pageSize=20&search=ionela&departmentId=xxx&isActive=true
```

### Query Parameters

| Param | Type | Required | Default | Descriere |
|-------|------|----------|---------|-----------|
| `page` | int | ✓ | 1 | Page number (1-indexed) |
| `pageSize` | int | - | 20 | Items per page (max 100) |
| `search` | string | - | null | Search: name/email |
| `departmentId` | guid | - | null | Filter by department |
| `medicalTitleId` | guid | - | null | Filter by job title |
| `isActive` | bool | - | null | Filter active |
| `sortBy` | string | - | "LastName" | Column to sort |
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
          "clinicId": "clinic-guid",
          "departmentId": "dept-guid",
          "departmentName": "Urgență",
          "supervisorDoctorId": null,
          "supervisorName": null,
          "medicalTitleId": "title-guid",
          "medicalTitleName": "Infirmieră",
          "firstName": "Ionela",
          "lastName": "Popescu",
          "fullName": "Ionela Popescu",
          "email": "ionela@clinic.local",
          "phoneNumber": "+40721234567",
          "isActive": true,
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "totalCount": 156,
      "pageSize": 20,
      "currentPage": 1,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "errors": []
}
```

---

## 👁️ 2. Get Staff Details

### Request
```http
GET /api/medicalStaff/{id}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Ionela",
    "lastName": "Popescu",
    "email": "ionela@clinic.local",
    "phoneNumber": "+40721234567",
    "departmentId": "dept-guid",
    "departmentName": "Urgență",
    "medicalTitleId": "title-guid",
    "medicalTitleName": "Infirmieră",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2025-03-08T14:30:00Z"
  },
  "errors": []
}
```

---

## 📋 3. Lookup Staff (Dropdown)

### Request
```http
GET /api/medicalStaff/lookup
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Ionela",
      "lastName": "Popescu",
      "fullName": "Ionela Popescu",
      "email": "ionela@clinic.local",
      "medicalTitleId": "title-guid",
      "medicalTitleName": "Infirmieră",
      "departmentId": "dept-guid",
      "departmentName": "Urgență"
    }
  ],
  "errors": []
}
```

---

## ➕ 4. Create Medical Staff

### Request
```http
POST /api/medicalStaff
Content-Type: application/json
```

### Body
```json
{
  "firstName": "Mihaela",
  "lastName": "Ionesco",
  "email": "mihaela@clinic.local",
  "phoneNumber": "+40721234567",
  "departmentId": "dept-guid",
  "supervisorDoctorId": null,
  "medicalTitleId": "title-guid",
  "isActive": true
}
```

### Validări
```
✓ firstName: required, max 50
✓ lastName: required, max 50
✓ email: required, unique per clinic, valid format
✓ phoneNumber: optional
✓ departmentId: optional, must be valid if provided
✓ supervisorDoctorId: optional, must be valid doctor
✓ medicalTitleId: required, must exist
✓ isActive: required, boolean
```

### Response (201 Created)
```json
{
  "success": true,
  "data": "550e8400-e29b-41d4-a716-446655440000",
  "errors": []
}
```

### Errors
| Code | Status | Error | SQL Code |
|------|--------|-------|----------|
| EMAIL_DUPLICATE | 409 | Email deja exista | 50401 |
| INVALID_DEPARTMENT | 400 | Department invalid | 50402 |
| INVALID_SUPERVISOR | 400 | Doctor invalid | 50403 |
| INVALID_TITLE | 400 | Title invalid | 50404 |

---

## ✏️ 5. Update Medical Staff

### Request
```http
PUT /api/medicalStaff/{id}
Content-Type: application/json
```

### Body
```json
{
  "firstName": "Mihaela",
  "lastName": "Ionesco",
  "email": "mihaela.new@clinic.local",
  "phoneNumber": "+40721234567",
  "departmentId": "dept-guid",
  "supervisorDoctorId": null,
  "medicalTitleId": "title-guid",
  "isActive": true
}
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
| NOT_FOUND | 404 | Staff nu exista |
| EMAIL_DUPLICATE | 409 | Email deja folosit |
| UNAUTHORIZED | 401 | No token |
| FORBIDDEN | 403 | No permission |

---

## 🗑️ 6. Delete Medical Staff

### Request
```http
DELETE /api/medicalStaff/{id}
```

### Response (200 OK - Soft Delete)
```json
{
  "success": true,
  "data": true,
  "errors": []
}
```

### Behavior
```
- Mark: isDeleted = true
- Preserve: audit trail
- Hidden: din list view
- Reversible: restore (admin only)
```

### Errors
| Code | Status | Descriere |
|------|--------|-----------|
| NOT_FOUND | 404 | Staff nu exista |
| HAS_CONSULTATIONS | 409 | Has active consults |
| UNAUTHORIZED | 401 | No token |
| FORBIDDEN | 403 | Level 3+ required |

---

## 📝 Standard Response Format

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

## 📊 HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid params |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Email duplicate |
| 500 | Server Error - Unexpected error |

---

## 🔐 Permissions Required

| Endpoint | Method | Min Level |
|----------|--------|-----------|
| /medicalStaff | GET | 1 |
| /medicalStaff/{id} | GET | 1 |
| /medicalStaff/lookup | GET | 1 |
| /medicalStaff | POST | 2 |
| /medicalStaff/{id} | PUT | 2 |
| /medicalStaff/{id} | DELETE | 3 |

---

**© 2025 ValyanClinic. API Reference confidențial.**

*Ultima actualizare: 2025-03-08*
