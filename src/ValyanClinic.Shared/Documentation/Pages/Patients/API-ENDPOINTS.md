# 🔗 API Endpoints Reference - Pacienți

## Endpoint Overview

| HTTP Method | Endpoint | Scopul | Autentificare |
|-------------|----------|--------|---|
| `GET` | `/api/patients` | Listare paginată | ✓ Bearer |
| `POST` | `/api/patients` | Creare pacient | ✓ Bearer |
| `GET` | `/api/patients/{id}` | Detalii pacient | ✓ Bearer |
| `PUT` | `/api/patients/{id}` | Actualizare pacient | ✓ Bearer |
| `DELETE` | `/api/patients/{id}` | Ștergere pacient | ✓ Bearer |
| `GET` | `/api/patients/stats` | Statistici | ✓ Bearer |
| `POST` | `/api/patients/{id}/export-gdpr` | Export GDPR | ✓ Bearer |

---

## 1. GET /api/patients - List Patients

### Request

```http
GET /api/patients?page=1&pageSize=20&search=ion&genderId=...&sortBy=fullName&sortDir=asc HTTP/1.1
Authorization: Bearer {accessToken}
```

### Query Parameters

| Parameter | Type | Default | Descriere |
|-----------|------|---------|-----------|
| `page` | int | 1 | Pagina (1-indexed) |
| `pageSize` | int | 20 | Itemi pe pagina (max 1000) |
| `search` | string | null | Căutare (nume, CNP, email) |
| `genderId` | uuid | null | Filter gen |
| `bloodTypeId` | uuid | null | Filter grupa sanguina |
| `doctorId` | uuid | null | Filter medic primar |
| `hasAllergies` | bool | null | Doar cu alergii |
| `isActive` | bool | null | Status (true/false/null=all) |
| `sortBy` | string | "LastName" | Coloană sortare |
| `sortDir` | string | "asc" | Direcție (asc/desc) |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "pagedResult": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "fullName": "Ion Popescu",
          "cnp": "1850312123456",
          "age": 39,
          "genderName": "Masculin",
          "bloodTypeName": "O+",
          "allergyCount": 2,
          "allergyMaxSeverity": "High",
          "primaryDoctorName": "Dr. Maria Ionescu",
          "phoneNumber": "+40721234567",
          "email": "ion.popescu@email.com",
          "isInsured": true,
          "insuranceExpiry": "2025-12-31",
          "isActive": true,
          "createdAt": "2024-01-15T10:30:00Z"
        },
        // ... More patients
      ],
      "totalCount": 1234,
      "page": 1,
      "pageSize": 20,
      "totalPages": 62,
      "hasPreviousPage": false,
      "hasNextPage": true
    },
    "stats": {
      "totalPatients": 1234,
      "activePatients": 1200,
      "patientsWithAllergies": 340,
      "lastAddedCount": 15,
      "mostCommonBloodType": "O+",
      "genderDistribution": {
        "male": 650,
        "female": 584
      }
    }
  },
  "errors": null,
  "message": null
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "data": null,
  "errors": [{"code": "UNAUTHORIZED", "message": "Token invalid or expired"}],
  "message": "Autentificarea necesară"
}
```

---

## 2. POST /api/patients - Create Patient

### Request

```http
POST /api/patients HTTP/1.1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fullName": "Mariana Vasilescu",
  "cnp": "2850315654321",
  "birthDate": "1985-03-15T00:00:00Z",
  "genderId": "550e8400-e29b-41d4-a716-446655440100",
  "bloodTypeId": "550e8400-e29b-41d4-a716-446655440200",
  "phoneNumber": "+40721555666",
  "secondaryPhone": null,
  "email": "mariana.v@email.com",
  "address": "Str. Floreasca 123",
  "city": "București",
  "county": "București",
  "postalCode": "014125",
  "isInsured": true,
  "insuranceNumber": "1234567",
  "insuranceExpiry": "2026-12-31T00:00:00Z",
  "primaryDoctorId": "550e8400-e29b-41d4-a716-446655440300",
  "chronicDiseases": "Diabet tip 2",
  "allergies": [
    {
      "allergyTypeId": "550e8400-e29b-41d4-a716-446655440400",
      "allergySeverityId": "550e8400-e29b-41d4-a716-446655440500",
      "allergenName": "Penicilină"
    }
  ],
  "notes": "Fobic la seringi",
  "isActive": true
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440600",
    "fullName": "Mariana Vasilescu",
    "createdAt": "2025-03-08T14:30:00Z"
  },
  "errors": null,
  "message": "Pacientul a fost creat cu succes"
}
```

### Error Response (422 Unprocessable Entity)

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "CNP-ul este duplicat în sistem"
    },
    {
      "code": "VALIDATION_ERROR",
      "message": "Email format invalid"
    }
  ],
  "message": "Validare eșuată"
}
```

---

## 3. GET /api/patients/{id} - Get Patient Detail

### Request

```http
GET /api/patients/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer {accessToken}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Ion Popescu",
    "cnp": "1850312123456",
    "birthDate": "1985-03-12",
    "age": 39,
    "email": "ion.popescu@email.com",
    "phoneNumber": "+40721234567",
    "genderId": "550e8400-e29b-41d4-a716-446655440100",
    "genderName": "Masculin",
    "bloodTypeId": "550e8400-e29b-41d4-a716-446655440200",
    "bloodTypeName": "O+",
    "address": "Str. Dorobanți 45",
    "city": "București",
    "county": "București",
    "postalCode": "014010",
    "isInsured": true,
    "insuranceNumber": "123456",
    "insuranceExpiry": "2025-12-31",
    "primaryDoctorId": "550e8400-e29b-41d4-a716-446655440300",
    "primaryDoctorName": "Dr. Maria Ionescu",
    "chronicDiseases": "Hipertensiune",
    "allergies": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440700",
        "allergyTypeId": "550e8400-e29b-41d4-a716-446655440400",
        "allergyTypeName": "Medicamente",
        "allergenName": "Penicilină",
        "allergySeverityId": "550e8400-e29b-41d4-a716-446655440500",
        "allergySeverityName": "Critică"
      }
    ],
    "notes": "Preferă injecții fără ace",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastModifiedAt": "2025-02-20T15:45:00Z"
  },
  "errors": null,
  "message": null
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "data": null,
  "errors": [{"code": "NOT_FOUND", "message": "Pacientul nu a fost găsit"}],
  "message": "Pacient inexistent"
}
```

---

## 4. PUT /api/patients/{id} - Update Patient

### Request

```http
PUT /api/patients/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fullName": "Ion Popescu",
  "email": "ion.p@newemail.com",
  "phoneNumber": "+40722999888",
  "chronicDiseases": "Diabet tip 2, Hipertensiune",
  "isActive": true
  // ... other fields to update
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lastModifiedAt": "2025-03-08T15:30:00Z"
  },
  "errors": null,
  "message": "Pacientul a fost actualizat cu succes"
}
```

---

## 5. DELETE /api/patients/{id} - Delete Patient

### Request

```http
DELETE /api/patients/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer {accessToken}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2025-03-08T15:35:00Z"
  },
  "errors": null,
  "message": "Pacientul a fost șters cu succes"
}
```

### Error Response (409 Conflict)

```json
{
  "success": false,
  "data": null,
  "errors": [
    {"code": "CONFLICT", "message": "Pacientul are consultații active și nu poate fi șters"}
  ],
  "message": "Ștergere nu este posibilă"
}
```

---

## 6. GET /api/patients/stats - Get Statistics

### Request

```http
GET /api/patients/stats HTTP/1.1
Authorization: Bearer {accessToken}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalPatients": 1234,
    "activePatients": 1200,
    "patientsWithAllergies": 340,
    "lastAddedCount": 15,
    "mostCommonBloodType": "O+",
    "genderDistribution": {
      "male": 650,
      "female": 584
    }
  },
  "errors": null,
  "message": null
}
```

---

## Error Codes

| Code | HTTP | Descriere |
|------|------|-----------|
| `UNAUTHORIZED` | 401 | Token invalid/expirat |
| `FORBIDDEN` | 403 | Permisiuni insuficiente |
| `NOT_FOUND` | 404 | Pacient nu există |
| `VALIDATION_ERROR` | 422 | Date invalide/duplicate |
| `CONFLICT` | 409 | Ștergere imposibilă (reținere) |
| `INTERNAL_ERROR` | 500 | Eroare server |

---

## TypeScript Types

```typescript
interface PatientListDto {
  id: string;
  fullName: string;
  cnp: string;
  age: number;
  genderName: string;
  bloodTypeName: string;
  allergyCount: number;
  allergyMaxSeverity?: string;
  primaryDoctorName: string;
  phoneNumber: string;
  email?: string;
  isInsured: boolean;
  insuranceExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
}

interface CreatePatientRequest {
  fullName: string;
  cnp: string;
  birthDate: Date;
  genderId: string;
  bloodTypeId: string;
  phoneNumber: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  isInsured: boolean;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  primaryDoctorId: string;
  chronicDiseases?: string;
  allergies?: Array<{
    allergyTypeId: string;
    allergySeverityId: string;
    allergenName: string;
  }>;
  notes?: string;
  isActive: boolean;
}

interface PatientStatsDto {
  totalPatients: number;
  activePatients: number;
  patientsWithAllergies: number;
  lastAddedCount: number;
  mostCommonBloodType: string;
  genderDistribution: {
    male: number;
    female: number;
  };
}
```

---

**© 2025 ValyanClinic. API Reference.**
