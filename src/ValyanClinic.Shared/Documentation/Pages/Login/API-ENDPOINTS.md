# 🔗 API Endpoints Reference - Login

## Endpoint Overview

Tabelul sumar al endpoint-urilor de autentificare:

| HTTP Method | Endpoint | Scop | Autentificare |
|-------------|----------|-----|---|
| `POST` | `/api/auth/login` | Autentificare cu email/parolă | ❌ NO |
| `POST` | `/api/auth/refresh` | Refresh access token | ✓ Refresh token |
| `POST` | `/api/auth/logout` | Delogare utilizator | ✓ Bearer token |
| `POST` | `/api/auth/change-password` | Schimbare parolă | ✓ Bearer token |
| `POST` | `/api/auth/reset-password` | Resetare parolă (forgot) | ❌ NO |
| `GET` | `/api/auth/me` | Datele utilizatorului curent | ✓ Bearer token |

---

## 1. LOGIN

### Request

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "doctor@valyan-clinic.ro",
  "password": "SecurePassword123!"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "doctor@valyan-clinic.ro",
      "fullName": "Dr. Ion Popescu",
      "role": "doctor",
      "roleId": "550e8400-e29b-41d4-a716-446655440001",
      "clinicId": "550e8400-e29b-41d4-a716-446655440002"
    },
    "permissions": [
      {
        "module": "patients",
        "level": 3,
        "isOverridden": false
      },
      {
        "module": "consultations",
        "level": 3,
        "isOverridden": false
      }
    ]
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
  "errors": [
    {
      "code": "INVALID_CREDENTIALS",
      "message": "Email-ul sau parola introduse sunt incorecte"
    }
  ],
  "message": "Autentificarea a eșuat"
}
```

### Other Error Responses

#### Account Locked (429 Too Many Requests)

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "ACCOUNT_LOCKED",
      "message": "Contul dumneavoastră a fost blocrat pentru 15 minute din cauza încercărilor multiple cu parolă greșită"
    }
  ],
  "message": "Cont blocat"
}
```

#### Account Inactive (401 Unauthorized)

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "ACCOUNT_INACTIVE",
      "message": "Contul dumneavoastră nu este activ. Contactați administratorul"
    }
  ],
  "message": "Autentificarea a eșuat"
}
```

### Headers Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

---

### TypeScript Types

```typescript
// Request
interface LoginRequest {
  email: string;    // Email sau username
  password: string; // Parolă
}

// Response
interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  permissions: ModulePermission[];
}

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'clinic_manager';
  roleId: string;
  clinicId: string;
}

interface ModulePermission {
  module: string;
  level: number;      // 0: No access, 1: Read, 2: Write, 3: Admin
  isOverridden: boolean;
}
```

---

## 2. REFRESH TOKEN

### Request

```http
POST /api/auth/refresh HTTP/1.1
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Refresh token este trimis automat ca HttpOnly cookie**

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { /* ... same as login */ },
    "permissions": [ /* ... */ ]
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
  "errors": [
    {
      "code": "INVALID_REFRESH_TOKEN",
      "message": "Refresh token-ul este invalid sau a expirat"
    }
  ],
  "message": "Autentificarea a eșuat"
}
```

---

## 3. LOGOUT

### Request

```http
POST /api/auth/logout HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Deconectare reușită"
  },
  "errors": null,
  "message": null
}
```

### Response Headers

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

---

## 4. CHANGE PASSWORD

### Request

```http
POST /api/auth/change-password HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Parola schimbată cu succes"
  },
  "errors": null,
  "message": null
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "INVALID_PASSWORD",
      "message": "Parola actuală este incorectă"
    }
  ],
  "message": "Schimbarea parolei a eșuat"
}
```

---

## 5. RESET PASSWORD (Forgot Password)

### Request (Step 1 - Request Reset)

```http
POST /api/auth/reset-password-request HTTP/1.1
Content-Type: application/json

{
  "email": "doctor@valyan-clinic.ro"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Link de resetare parolei a fost trimis pe email"
  },
  "errors": null,
  "message": null
}
```

---

### Request (Step 2 - Reset with Token)

```http
POST /api/auth/reset-password HTTP/1.1
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Parola a fost resetată cu succes"
  },
  "errors": null,
  "message": null
}
```

---

## 6. GET CURRENT USER

### Request

```http
GET /api/auth/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@valyan-clinic.ro",
    "fullName": "Dr. Ion Popescu",
    "role": "doctor",
    "roleId": "550e8400-e29b-41d4-a716-446655440001",
    "clinicId": "550e8400-e29b-41d4-a716-446655440002"
  },
  "errors": null,
  "message": null
}
```

---

## 🔐 Authentication

### Bearer Token (Access Token)

Totu request-urile care necesită autentificare trebuie să aibă header-ul:

```
Authorization: Bearer {accessToken}
```

**Token format:** JWT (JSON Web Token)

**Token expiration:** 8 ore (configurable)

**Token refresh:** Automat pe expirare (axios interceptor)

### HttpOnly Cookie (Refresh Token)

Refresh token-ul este trimis ca HttpOnly cookie și **nu poate fi accesat din JavaScript**:

```http
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

---

## Error Codes

| Code | HTTP Status | Descriere |
|------|-------------|-----------|
| `INVALID_CREDENTIALS` | 401 | Email/parolă incorecte |
| `ACCOUNT_LOCKED` | 429 | Cont blocat după prea multe încercări |
| `ACCOUNT_INACTIVE` | 401 | Cont dezactivat de administrator |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid sau expirat |
| `INVALID_PASSWORD` | 400 | Parolă actuală incorectă |
| `PASSWORD_RESET_EXPIRED` | 400 | Link resetare parolă expirat |
| `UNAUTHORIZED` | 401 | Lipsă bearer token |
| `FORBIDDEN` | 403 | Permisiuni insuficiente |
| `VALIDATION_ERROR` | 422 | Date invalidate (email, parolă, etc.) |
| `INTERNAL_ERROR` | 500 | Eroare server |

---

## Exemplu Axios Integration

```typescript
// axiosInstance.ts
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

const api: AxiosInstance = axios.create({
  baseURL: 'https://api.valyan-clinic.local',
  withCredentials: true, // Sendează cookies automat
});

// Request interceptor - Add authorization header
api.interceptors.request.use((config) => {
  const access Token = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token automat
        const response = await axios.post(
          'https://api.valyan-clinic.local/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        useAuthStore.getState().updateToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Postman Collection

```json
{
  "info": { "name": "ValyanClinic Auth API" },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "header": ["Content-Type: application/json"],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"doctor@valyan-clinic.ro\",\"password\":\"SecurePassword123!\"}"
        }
      }
    },
    {
      "name": "Refresh",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/refresh"
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/logout",
        "header": ["Authorization: Bearer {{accessToken}}"]
      }
    }
  ]
}
```

---

**© 2025 ValyanClinic. API Reference Documentation.**
