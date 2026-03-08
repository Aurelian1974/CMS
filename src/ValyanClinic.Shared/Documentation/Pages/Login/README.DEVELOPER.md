# 👨‍💻 Ghid Developer - Pagina de Login

## Prezentare tehnică

Pagina de login este o componentă core TypeScript/React care gestionează autentificarea utilizatorilor prin API backend-ului ASP.NET Core. Implementează validare client-side (Zod), state management (Zustand), și pattern-uri de securitate moderne.

---

## 📁 Structura fișierelor

```
client/src/features/auth/
├── pages/
│   ├── LoginPage.tsx          # Componenta principală
│   └── LoginPage.module.scss  # Stiluri (SCSS modules)
├── hooks/
│   └── useLogin.ts            # Custom hook pentru mutare login
├── types/
│   └── auth.types.ts          # Tipuri TypeScript
├── schemas/
│   └── auth.schema.ts         # Validare cu Zod
└── index.ts                   # Export public
```

**Backend:**

```
src/ValyanClinic.Application/Features/Auth/
├── Commands/
│   └── Login/
│       ├── LoginCommand.cs
│       ├── LoginCommandHandler.cs
│       └── LoginResponseDto.cs
├── Queries/
│   └── (refresh token, etc.)
└── Interfaces/
    └── IAuthRepository.cs
```

---

## 🔧 Tech Stack

### Frontend
| Tehnologie | Versiune | Scop |
|-----------|----------|------|
| **React** | 18+ | Componentă UI |
| **TypeScript** | 5+ | Type safety |
| **Zod** | Latest | Validare schema |
| **React Hook Form** | Latest | Form state management |
| **TanStack Query** | v5 | Mutare async (login) |
| **Zustand** | 4+ | Global auth store |
| **Axios** | Latest | HTTP client |
| **SCSS Modules** | Built-in | Stiluri izolate |

### Backend
| Tehnologie | Scop |
|-----------|------|
| **MediatR** | CQRS pattern |
| **JWT (HS256)** | Token generation |
| **BCrypt/Argon2** | Password hashing |
| **Entity Framework Core** | Data persistence |
| **FluentValidation** | DTO validation |

---

## 📊 Flow autentificare

```
┌─────────────────────┐
│   LoginPage.tsx     │
│  (React Component)  │
└──────────┬──────────┘
           │
           │ (Form submit)
           ▼
┌──────────────────────┐
│   useLogin.ts        │
│  (Custom hook)       │
└──────────┬───────────┘
           │
           │ (useMutation)
           ▼
┌──────────────────────┐
│   auth.api.ts        │
│  (Axios POST)        │
└──────────┬───────────┘
           │
           │ /api/auth/login
           ▼
┌──────────────────────────────┐
│ AuthController.Login()       │
│ (Backend: ASP.NET Core)      │
└──────────┬───────────────────┘
           │
           │ Mediator.Send(LoginCommand)
           ▼
┌──────────────────────────────┐
│ LoginCommandHandler          │
│ - Validate user             │
│ - Hash password             │
│ - Generate tokens           │
└──────────┬───────────────────┘
           │
           │ LoginResponseDto
           ▼
┌──────────────────────────────┐
│ Client: authStore.setAuth()  │
│ - Save user info             │
│ - Save accessToken           │
│ - Save permissions           │
└──────────┬───────────────────┘
           │
           ▼
    Navigate to Dashboard
```

---

## 💡 Implementare frontend

### 1. **Componenta LoginPage**

**Fișier:** [client/src/features/auth/pages/LoginPage.tsx](client/src/features/auth/pages/LoginPage.tsx)

**Logică principală:**

```typescript
export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    login({ email: data.email, password: data.password });
  };

  return (
    <div className={styles.wrap}>
      {/* Left panel styling */}
      {/* Right panel with form */}
    </div>
  );
};
```

**Componentă stateles (pure):**
- ✓ Hook-uri React (useState, useForm, useLogin)
- ✓ Passar errori pe component
- ✓ Validare reactivă

### 2. **Validare cu Zod**

**Fișier:** [client/src/features/auth/schemas/auth.schema.ts](client/src/features/auth/schemas/auth.schema.ts)

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email-ul sau username-ul este obligatoriu.'),
  password: z
    .string()
    .min(1, 'Parola este obligatorie.'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

**Avantaje:**
- ✓ Validare TypeScript-first
- ✓ Error messages în română
- ✓ Type inference automat

### 3. **Custom Hook - useLogin**

**Fișier:** [client/src/features/auth/hooks/useLogin.ts](client/src/features/auth/hooks/useLogin.ts)

```typescript
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      // Save auth data to store
      setAuth(data.user, data.accessToken, data.permissions ?? []);
      // Navigate to dashboard
      navigate('/', { replace: true });
    },
  });
};
```

**Responsabilități:**
- ✓ Apel API async
- ✓ Salvare state global (Zustand store)
- ✓ Redirectare post-login
- ✓ Error handling

### 4. **API Gateway**

**Fișier:** [client/src/api/endpoints/auth.api.ts](client/src/api/endpoints/auth.api.ts)

```typescript
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>(
      '/api/auth/login',
      payload
    );
    return response.data!;
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>(
      '/api/auth/refresh'
    );
    return response.data!;
  },

  logout: (): Promise<void> =>
    api.post('/api/auth/logout'),
};
```

### 5. **Zustand Store**

**Fișier:** [client/src/store/authStore.ts](client/src/store/authStore.ts)

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,

      setAuth: (user, accessToken, permissions) =>
        set({ user, accessToken, permissions, isAuthenticated: true }),

      updateToken: (accessToken) =>
        set({ accessToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, permissions: [], isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Doar sessionStorage - NU localStorage din motive de securitate
    },
  ),
);
```

**Securitate:**
- ✓ AccessToken în **sessionStorage** (nu localStorage)
- ✓ RefreshToken în **HttpOnly cookie** (protejat de XSS)
- ✓ Clar pe reîncărcare pagină

---

## 🔐 Implementare backend

### 1. **LoginCommand & Handler**

**Fișier:** [src/ValyanClinic.Application/Features/Auth/Commands/Login/LoginCommandHandler.cs](src/ValyanClinic.Application/Features/Auth/Commands/Login/LoginCommandHandler.cs)

```csharp
public sealed class LoginCommandHandler(
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IPermissionRepository permissionRepository,
    IOptions<JwtOptions> jwtOptions,
    IOptions<RateLimitingOptions> rateLimitingOptions)
    : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    public async Task<Result<LoginResponseDto>> Handle(
        LoginCommand request, CancellationToken ct)
    {
        // 1. Căutare utilizator (email sau username)
        var user = await authRepository.GetByEmailOrUsernameAsync(request.Email, ct);
        
        if (user is null)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);

        // 2. Verificare cont activ
        if (!user.IsActive)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.AccountInactive);

        // 3. Verificare lockout
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.Now)
        {
            var minutesLeft = (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.Now).TotalMinutes);
            return Result<LoginResponseDto>.Unauthorized(
                string.Format(ErrorMessages.Auth.AccountLocked, minutesLeft));
        }

        // 4. Verificare parolă
        if (!passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 3)
                user.LockoutEnd = DateTime.Now.AddMinutes(15);
            
            await authRepository.UpdateAsync(user, ct);
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);
        }

        // 5. Reset failed attempts
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        // 6. Generate tokens
        var (accessToken, refreshToken, refreshExpiry) = 
            tokenService.GenerateTokens(user.Id);

        // 7. Save refresh token
        await authRepository.SaveRefreshTokenAsync(
            user.Id, refreshToken, refreshExpiry, null, ct);

        // 8. Load effective permissions
        var effectivePermissions = await permissionRepository.GetEffectiveByUserAsync(
            user.Id, user.RoleId, ct);

        // 9. Return response
        return Result<LoginResponseDto>.Success(new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new AuthUserDto { /* ... */ },
            Permissions = permissions
        });
    }
}
```

### 2. **AuthController**

**Fișier:** [src/ValyanClinic.API/Controllers/AuthController.cs](src/ValyanClinic.API/Controllers/AuthController.cs)

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController(IOptions<JwtOptions> jwtOptions) : BaseApiController
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command, ct);

        if (!result.IsSuccess)
            return HandleResult(result);

        // HttpOnly cookie pentru refresh token
        SetRefreshTokenCookie(result.Value!.RefreshToken);

        var response = new
        {
            accessToken = result.Value.AccessToken,
            user = result.Value.User,
            permissions = result.Value.Permissions
        };

        return Ok(new ApiResponse<object>(true, response, null, null));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized();

        var command = new RefreshTokenCommand(refreshToken);
        var result = await Mediator.Send(command, ct);

        if (!result.IsSuccess)
            return HandleResult(result);

        SetRefreshTokenCookie(result.Value!.RefreshToken);

        return Ok(new ApiResponse<object>(true, new
        {
            accessToken = result.Value.AccessToken,
            user = result.Value.User,
            permissions = result.Value.Permissions
        }, null, null));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        // Invalidate refresh token
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(new ApiResponse<object>(true, new { message = "Logout successful" }, null, null));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.Now.AddDays(7)
        });
    }
}
```

---

## 🧪 Testing

### Unit Tests

**Fișier exemplu:** `Tests/Features/Auth/LoginCommandHandlerTests.cs`

```csharp
[TestClass]
public class LoginCommandHandlerTests
{
    [TestMethod]
    public async Task Handle_WithValidCredentials_ReturnsSuccess()
    {
        // Arrange
        var user = new User { Email = "test@clinic.ro", PasswordHash = hash };
        var command = new LoginCommand("test@clinic.ro", "password");
        
        // Act
        var result = await handler.Handle(command, CancellationToken.None);
        
        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.IsNotNull(result.Value?.AccessToken);
    }

    [TestMethod]
    public async Task Handle_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var command = new LoginCommand("test@clinic.ro", "wrong_password");
        
        // Act
        var result = await handler.Handle(command, CancellationToken.None);
        
        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.AreEqual(StatusCode.Unauthorized, result.StatusCode);
    }
}
```

### Integration Tests

```csharp
[TestClass]
public class LoginEndpointTests : IntegrationTest
{
    [TestMethod]
    public async Task Post_Login_WithValidCredentials_Returns200AndTokens()
    {
        // Arrange
        var request = new LoginRequest { Email = "doctor@clinic.ro", Password = "SecurePass123!" };
        
        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/auth/login", request);
        
        // Assert
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsAsync<ApiResponse<LoginResponse>>();
        Assert.IsNotNull(content.Data?.AccessToken);
    }
}
```

---

## 🔄 State Management Flow

```typescript
// 1. User submits form
onSubmit(data) → login({ email, password })

// 2. Hook triggered
useLogin() → mutationFn(payload)

// 3. API call
authApi.login(payload) → POST /api/auth/login

// 4. Backend processing
LoginCommandHandler.Handle() → Generate tokens

// 5. Success response
onSuccess(data) → setAuth(user, token, permissions)

// 6. Zustand update
useAuthStore.setAuth() → Update global state

// 7. Redirect
navigate('/', { replace: true })
```

---

## 🚀 Features și extensii

### ✅ Implementate
- ✓ Email/username login
- ✓ JWT token generation
- ✓ RefreshToken (HttpOnly cookie)
- ✓ Lockout protecție
- ✓ Route protection (ProtectedRoute)
- ✓ Permission-based access control

### 📋 Planificare viitoare
- ☐ 2-Factor Authentication (2FA/MFA)
- ☐ Social login (Google, Microsoft, etc.)
- ☐ Remember device option
- ☐ IP-based device recognition
- ☐ Biometric authentication (WebAuthn)
- ☐ Session timeout warning
- ☐ Passwordless login (magic links)

---

## 🐛 Debugging

### Browser DevTools

```javascript
// Verifică auth store
console.log(localStorage.getItem('auth-storage'))

// Verifica tokenul
const store = JSON.parse(sessionStorage.getItem('auth-storage'));
console.log(store.state.accessToken)

// Decode JWT
import jwtDecode from 'jwt-decode';
const decoded = jwtDecode(token);
console.log(decoded)
```

### Network Inspector
1. F12 → Network tab
2. Cauta `POST /api/auth/login`
3. Verifica response headers pentru `Set-Cookie` (refreshToken)
4. Verifica response body pentru accessToken

### API Testing cu Postman/Insomnia

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@clinic.ro",
  "password": "SecurePass123!"
}

# Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": { ... },
    "permissions": [ ... ]
  }
}

# Header: Set-Cookie: refreshToken=...; HttpOnly; Secure
```

---

## 📚 Resurse și referințe

### Documentation
- JWT.io - Token specification
- OWASP Authentication Cheat Sheet
- Microsoft: Secure authentication patterns

### Codul sursă
- [LoginPage.tsx](client/src/features/auth/pages/LoginPage.tsx)
- [LoginCommandHandler.cs](src/ValyanClinic.Application/Features/Auth/Commands/Login/LoginCommandHandler.cs)
- [AuthController.cs](src/ValyanClinic.API/Controllers/AuthController.cs)

### Configurare
- `appsettings.json` - JWT options
- `appsettings.Development.json` - Dev overrides

---

## 🔗 Componente conexe

- **ProtectedRoute** - Route guarding
- **authStore** - Global auth state
- **useAuthStore** - Hook pentru store
- **Axios interceptors** - Token refresh automat
- **AuthController** - API endpoints

---

## 📞 Support și contact

- **GitHub:** Issues cu tag `auth`
- **PR Process:** Feature branch → code review → merge
- **Code style:** ESLint + Prettier (frontend), StyleCop (backend)

---

**© 2025 ValyanClinic. Documentație tehnică pentru developeri.**
