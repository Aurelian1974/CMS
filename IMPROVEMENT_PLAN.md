# ValyanClinic CMS — Audit Complet & Plan de Îmbunătățiri

> Data auditului: 28 Martie 2026  
> Revizie: v1.0  
> Stack: .NET 8 + Dapper + MediatR + FluentValidation | React 18 + Zustand + React-Query + TypeScript

---

## Cuprins

1. [Erori Critice (Bugs)](#1-erori-critice-bugs)
2. [Probleme de Securitate](#2-probleme-de-securitate)
3. [Inconsistențe Logice & de Implementare](#3-inconsistente-logice--de-implementare)
4. [Features Incomplete / Lipsă](#4-features-incomplete--lipsă)
5. [Îmbunătățiri de Arhitectură](#5-îmbunătățiri-de-arhitectură)
6. [Îmbunătățiri de Performanță](#6-îmbunătățiri-de-performanță)
7. [Testare & Acoperire](#7-testare--acoperire)
8. [Plan de Implementare (Roadmap)](#8-plan-de-implementare-roadmap)
9. [Rezumat Prioritizat](#9-rezumat-prioritizat)

---

## 1. Erori Critice (Bugs)

### 🔴 BUG-001 — Cache key mismatch pentru user permission overrides

**Fișier:** `UpdateUserOverridesCommandHandler.cs` + `ModuleAccessAuthorizationHandler.cs`

**Descriere:**  
Există o inconsistență critică între cheia de cache folosită la scriere și cea folosită la ștergere, care face ca invalidarea cache-ului de permisiuni pentru user overrides să nu funcționeze niciodată.

**În `UpdateUserOverridesCommandHandler`:**
```csharp
var cacheKey = $"permissions:{request.UserId}";
memoryCache.Remove(cacheKey);  // ← Încearcă să șteargă această cheie
```

**În `ModuleAccessAuthorizationHandler`:**
```csharp
var cacheKey = $"permissions:{userId}:v{currentVersion}";  // ← Cheia reală din cache
cache.Set(cacheKey, permissions, TimeSpan.FromMinutes(CacheMinutes));
```

**Impact:**  
Permisiunile individuale modificate prin "User Overrides" nu se aplică pentru până la **5 minute** (durata TTL). Un utilizator căruia i s-a revocat accesul va continua să aibă acces. Modificările de permisiuni pe rol funcționează corect (prin mecanismul de versiune), dar cele per-user NU funcționează.

**Fix recomandat:**
În `UpdateUserOverridesCommandHandler`, în loc de a șterge o cheie fixă, incrementați versiunea globală (la fel ca la role permissions):
```csharp
// Înlocuiți:
memoryCache.Remove(cacheKey);
// Cu:
var currentVersion = memoryCache.Get<long>(UpdateRolePermissionsCommandHandler.CacheVersionKey);
memoryCache.Set(UpdateRolePermissionsCommandHandler.CacheVersionKey, currentVersion + 1);
```
Sau, mai optim, adăugați un cache key per-utilizator cu versiune:
```csharp
var cacheVersionKey = $"permissions:version:{request.UserId}";
var currentVersion = memoryCache.Get<long>(cacheVersionKey);
memoryCache.Set(cacheVersionKey, currentVersion + 1);
```

---

### 🔴 BUG-002 — DevAuthBypassMiddleware lipsă claim `roleId`

**Fișier:** `DevAuthBypassMiddleware.cs`

**Descriere:**  
Middleware-ul de bypass dev injectează claims mock pentru autentificare, dar **nu include claim-ul `roleId`**, pe care `ModuleAccessAuthorizationHandler` îl verifică explicit:

```csharp
// DevAuthBypassMiddleware — LIPSĂ roleId:
var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, DevUserId),
    new Claim("clinicId", DevClinicId),
    new Claim(ClaimTypes.Email, "admin@valyanclinic.dev"),
    new Claim("fullName", "Admin Dev"),
    new Claim(ClaimTypes.Role, "Admin"),
    // ← "roleId" LIPSĂ
};

// ModuleAccessAuthorizationHandler — verifică roleId:
var roleIdClaim = context.User.FindFirst("roleId")?.Value;
if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleIdClaim))
    return; // FAIL — nu are claims necesare
```

**Impact:**  
În environment Development, **toate endpoint-urile cu `[HasAccess]` returnează 403 Forbidden**, deoarece handler-ul returnează fără a apela `context.Succeed(requirement)`. Bypassul de dev nu funcționează corect pentru autorizare.

**Fix recomandat:**
```csharp
// Adăugați în DevAuthBypassMiddleware:
new Claim("roleId", "00000001-0000-0000-0000-000000000001"), // GUID rol Admin din seed
```

---

### 🟠 BUG-003 — Raw SQL în AuthRepository (încălcarea principiului SP-only)

**Fișier:** `AuthRepository.cs` → `GetUserByIdForTokenAsync`

**Descriere:**  
Metoda `GetUserByIdForTokenAsync` conține un query SQL raw (în loc de stored procedure), contrazicând principiul declarat în întreaga infrastructură ("exclusiv prin Stored Procedures"):

```csharp
return await connection.QueryFirstOrDefaultAsync<UserAuthDto>(
    new CommandDefinition(
        "SELECT u.Id, u.ClinicId, u.RoleId, r.Name AS RoleName, r.Code AS RoleCode, " +
        "u.DoctorId, u.MedicalStaffId, u.Username, u.Email, u.PasswordHash, " +
        // ... query raw, nu SP
```

Chiar comentariul din cod recunoaște problema: *"O abordare practică: citim direct."*

**Impact:**  
- Schimbările de schemă (ex: redenumire coloană) nu vor fi prinse de SP-uri
- Inconsistență arhitecturală
- Potențial pentru SQL injection dacă parametrii se schimbă în viitor (risc scăzut momentan)

**Fix:** Creați un stored procedure `User_GetByIdForAuth` și înlocuiți query-ul raw.

---

### 🟠 BUG-004 — SqlErrorCodes inconsistente cu handler-ele

**Fișiere:** `SqlErrorCodes.cs` vs. `CreateUserCommandHandler.cs`

**Descriere:**  
Clasa `SqlErrorCodes.cs` definește:
```csharp
public const int UserEmailDuplicate = 50060;
public const int UserNotFound       = 50061;
```

Dar `CreateUserCommandHandler` interceptează:
```csharp
catch (SqlException ex) when (ex.Number == 50500)  // ← email duplicate
catch (SqlException ex) when (ex.Number == 50508)  // ← username duplicate
catch (SqlException ex) when (ex.Number == 50501)  // ← invalid association
// ... etc (50502, 50503, 50504, 50505, 50506)
```

Clasa `SqlErrorCodes` nu conține aceste constante pentru domeniul User (are 50060/50061 dar SP-urile aruncă 50500+). Același tip de problemă există probabil și în alte domenii.

**Fix:** Completați `SqlErrorCodes` cu toate constantele reale aruncate de SP-uri și înlocuiți numerele hardcodate cu constante.

---

### 🟡 BUG-005 — Dashboard fără date reale (date mock hardcodate)

**Fișier:** `DashboardPage.tsx`

**Descriere:**  
Pagina Dashboard afișează date mock hardcodate (`MOCK_APPOINTMENTS`, `MOCK_ACTIVITIES`, statistici fixe). Nu există nicio conexiune la API și nicio query/handler în backend pentru dashboard.

```typescript
// DashboardPage.tsx
const MOCK_APPOINTMENTS: MockAppointment[] = [
  { id: '1', time: '08:30', patientName: 'Andrei Popescu', ... },
  // ... date fictive
];
```

Backend: `Features/Dashboard/Queries/` — **folder gol**.

**Impact:** Utilizatorii văd date fictive pe pagina principală. Poate crea confuzie în producție.

---

## 2. Probleme de Securitate

### 🔴 SEC-001 — Politică parolă slabă (minim 6 caractere)

**Fișiere:** `CreateUserCommandValidator.cs`, `ChangePasswordCommandValidator.cs`

**Descriere:**  
Parola minimă acceptată este de 6 caractere, sub standardul NIST SP 800-63B care recomandă minimum 8 caractere. OWASP recomandă minimum 8, ideal 12+.

```csharp
RuleFor(x => x.Password)
    .MinimumLength(6)  // ← prea scurt
```

**Fix:**
```csharp
RuleFor(x => x.Password)
    .MinimumLength(8).WithMessage("Parola trebuie să aibă minimum 8 caractere.")
    .Must(ContainUpperOrNumber).WithMessage("Parola trebuie să conțină cel puțin o literă mare sau o cifră.");
```

---

### 🟠 SEC-002 — ChangePassword fără verificarea parolei vechi (pentru user propriu)

**Fișier:** `ChangePasswordCommandHandler.cs`, `ChangePasswordCommandValidator.cs`

**Descriere:**  
Comanda `ChangePassword` acceptă `UserId` + `NewPassword`, dar nu verifică parola curentă. Orice utilizator cu permisiuni de scriere pe modulul `Users` poate schimba parola oricărui alt utilizator fără să cunoască parola veche.

Aceasta poate fi comportament intenționat pentru admin-uri, dar nu există nicio distincție între:
- Admin care resetează parola altui utilizator (OK fără parolă veche)
- Utilizator care își schimbă propria parolă (ar trebui să ceară parola veche)

**Risc:** Escaladare de privilegii sau abuz dacă un cont cu permisiuni de scriere este compromis.

**Fix recomandat:** Adăugați câmp opțional `CurrentPassword` în command și validați-l dacă `UserId == currentUser.Id`.

---

### 🟠 SEC-003 — Rate limit login folosit și pe /refresh

**Fișier:** `AuthController.cs`

**Descriere:**  
Endpoint-ul `/refresh` are aplicat același rate limiter ca și `/login` (`[EnableRateLimiting("login")]`). Refresh token-urile sunt în HttpOnly cookies și sunt rotite automat — mai multe tab-uri simultane pot epuiza limita.

Limita de refresh ar trebui să fie mai generoasă sau separată de cea de login.

---

### 🟡 SEC-004 — Cookie SameSite=Strict poate cauza probleme cu navigare indirectă

**Fișier:** `AuthController.cs`

**Descriere:**  
`SameSite = SameSiteMode.Strict` previne trimiterea cookie-ului când utilizatorul vine din link extern (email, alt site). La un logout extern și re-autentificare via link din email, cookie-ul nu va fi trimis.

`SameSite.Lax` ar fi mai potrivit pentru scenariile medicale (ex: link din email cu cod de confirmare).

---

## 3. Inconsistențe Logice & de Implementare

### 🟠 LOGIC-001 — Validare email MaximumLength inconsistentă

**Fișiere:** Multiple validators

| Validator | MaxLength Email |
|-----------|----------------|
| `CreateUserCommandValidator` | 199 |
| `UpdateUserCommandValidator` | 200 |
| `CreateDoctorCommandValidator` | 199 |
| `UpdateDoctorCommandValidator` | 200 |
| `CreatePatientCommandValidator` | 199 |
| `CreateMedicalStaffCommandValidator` | 200 |
| `CreateClinicLocationCommandValidator` | 200 |

Dacă coloana DB are 200 de caractere, unii validators Create resping adrese de 200 de caractere care ar fi valide la Update.

**Fix:** Standardizați la 200 (valoarea coloanei DB) în toate validator-ele.

---

### 🟠 LOGIC-002 — GetAppointmentsForScheduler fără validare interval de date

**Fișiere:** `GetAppointmentsForSchedulerQuery.cs`, `AppointmentsController.cs`

**Descriere:**  
Query-ul de scheduler acceptă `DateFrom` și `DateTo` fără nicio validare:
- Nu se verifică că `DateTo > DateFrom`
- Nu există limită de interval (ex: maxim 3 luni)
- Un interval de câțiva ani ar putea returna mii de programări

**Fix:** Adăugați un validator:
```csharp
public sealed class GetAppointmentsForSchedulerQueryValidator : AbstractValidator<GetAppointmentsForSchedulerQuery>
{
    public GetAppointmentsForSchedulerQueryValidator()
    {
        RuleFor(x => x.DateTo)
            .GreaterThan(x => x.DateFrom).WithMessage("Data de sfârșit trebuie să fie după data de început.");
        
        RuleFor(x => x)
            .Must(x => (x.DateTo - x.DateFrom).TotalDays <= 93)
            .WithMessage("Intervalul scheduler nu poate depăși 3 luni.");
    }
}
```

---

### 🟠 LOGIC-003 — CreateAppointment permite programări în trecut

**Fișier:** `CreateAppointmentCommandValidator.cs`

**Descriere:**  
Validatorul verifică că `StartTime > DateTime.MinValue` dar nu că `StartTime >= DateTime.Now`. Programările pot fi create în trecut (ex: retroactiv).

Aceasta poate fi comportament intenționat (înregistrare retroactivă), dar dacă nu, adicați:
```csharp
RuleFor(x => x.StartTime)
    .GreaterThanOrEqualTo(DateTime.UtcNow.AddMinutes(-5))
    .WithMessage("Programarea nu poate fi creată în trecut.")
    .When(_ => /* nu e import retroactiv */);
```

---

### 🟡 LOGIC-004 — DayOfWeek în Schedule fără validare range

**Fișier:** `ScheduleCommands.cs`

**Descriere:**  
`UpsertClinicDayCommand` și `UpsertDoctorDayCommand` acceptă `byte DayOfWeek` fără validare. Valori invalide (7-255) vor ajunge la DB.

```csharp
// Niciun validator pentru aceste comenzi
public sealed record UpsertDoctorDayCommand(
    Guid DoctorId,
    byte DayOfWeek,  // ← nevalidat, poate fi 0-255
    string StartTime,
    string EndTime
) : IRequest<Result<bool>>;
```

**Fix:** Adăugați validators pentru comenzile de schedule:
```csharp
RuleFor(x => x.DayOfWeek)
    .InclusiveBetween((byte)0, (byte)6).WithMessage("Ziua săptămânii trebuie să fie între 0 (Luni) și 6 (Duminică).");
```

---

### 🟡 LOGIC-005 — Schedule StartTime/EndTime ca string fără validare format

**Fișier:** `ScheduleCommands.cs`

**Descriere:**  
`StartTime` și `EndTime` în comenzile de schedule sunt de tip `string` (ex: "08:00"), dar nu există validare a formatului. Un format invalid va eșua probabil la nivel de SP.

**Fix:**
```csharp
RuleFor(x => x.StartTime)
    .Matches(@"^([01]\d|2[0-3]):[0-5]\d$").WithMessage("Ora de început trebuie să fie în formatul HH:mm.");
```

---

### 🟡 LOGIC-006 — UpdateAppointmentStatus fără validator explicit

**Fișier:** `UpdateAppointmentStatusCommand.cs`

**Descriere:**  
Nu există o clasă `UpdateAppointmentStatusCommandValidator`. Singura validare implicită este că `StatusId` este un `Guid` ne-null (din tipul recordului). Dar nu se verifică explicit că nu e `Guid.Empty`.

**Fix:** Adăugați:
```csharp
public sealed class UpdateAppointmentStatusCommandValidator 
    : AbstractValidator<UpdateAppointmentStatusCommand>
{
    public UpdateAppointmentStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.StatusId).NotEmpty();
    }
}
```

---

### 🟡 LOGIC-007 — PatientStatsDto refolosind GetPaged SP (hack de performanță)

**Fișier:** `PatientRepository.cs` → `GetStatsAsync`

**Descriere:**  
Metoda `GetStatsAsync` apelează SP-ul `GetPaged` cu `Page=1, PageSize=1` doar pentru a extrage statisticile din result set 3, aruncând primele 2 result set-uri:

```csharp
// Trecem peste result set 1 (items) și 2 (count)
await multi.ReadAsync();
await multi.ReadSingleAsync<int>();
return await multi.ReadSingleAsync<PatientStatsDto>();
```

Aceasta execută o interogare SQL costisitoare (cu paginare, JOIN-uri) doar pentru statistici. Pare un workaround temporar care a rămas în producție.

**Fix:** Creați un SP dedicat `Patient_GetStats` sau includeți statisticile în responses existente (ele deja vin la GetPaged, deci nu mai e nevoie de apel separat).

---

## 4. Features Incomplete / Lipsă

### 🔴 FEAT-001 — Consultații, Rețete, Facturi, Plăți — "Coming Soon"

**Fișiere Frontend:**
- `ConsultationsListPage.tsx` → `<div>Consultations - coming soon</div>`
- `PrescriptionsListPage.tsx` → `<div>Prescriptions - coming soon</div>`
- `InvoicesListPage.tsx` → `<div>Invoices - coming soon</div>`

**Status Backend:**
- Stored Procedures definite (`ConsultationProcedures.cs`, `InvoiceProcedures.cs`, `PrescriptionProcedures.cs`)
- **Lipsă Controllers** pentru Consultations, Invoices, Prescriptions, Payments
- Features Application pentru Consultații/Prescripții/Facturi/Plăți → structura de foldere există dar implementare incompletă

**Aceste module sunt listate în sidebar ca accesibile dar nu funcționează.**

---

### 🔴 FEAT-002 — Dashboard fără backend real

Detaliat la **BUG-005**. Features/Dashboard/Queries/ este gol. Pagina folosește date mock.

Necesită:
1. Handler `GetDashboardStatsQuery` în backend
2. Repository method + SP pentru agregarea statisticilor de dashboard
3. Controller (sau extindere existentă) cu endpoint
4. Frontend hook `useDashboardStats` + conexiune la API

---

### 🟠 FEAT-003 — Nicio pagină de detalii pentru Programări

**Fișier:** `AppRoutes.tsx`

**Descriere:**  
Există ruta `/appointments` (list) și `/appointments/scheduler`, dar nu există ruta `/appointments/:id` pentru detalii. Backend-ul are `GetAppointmentByIdQuery` implementat.

---

### 🟠 FEAT-004 — Nicio pagină de detalii pentru Doctori

Similar cu FEAT-003: există `/doctors` (list) dar nu `/doctors/:id/edit`.

---

## 5. Îmbunătățiri de Arhitectură

### 🟠 ARCH-001 — Domain Entities fără logică de domeniu (Anemic Domain)

**Fișiere:** `Entities/*.cs`

**Descriere:**  
Toate entitățile din Domain sunt simple record/class POCO fără nicio logică de domeniu:

```csharp
public sealed class Appointment
{
    public Guid Id { get; init; }
    public DateTime StartTime { get; set; }  // ← setter public, oricine poate modifica
    // fără validare, fără comportament
}
```

Within CQRS/MediatR pattern, aceasta este acceptabilă dacă logica e în handlere. Totuși, reguli de business (ex: "o programare nu poate fi anulată dacă a depășit ora de start cu mai mult de 24h") ar beneficia de plasare în entitate sau value object.

**Recomandare:** Mutați validările cross-entitate în metode de domeniu sau creați structuri de validare în Domain layer.

---

### 🟠 ARCH-002 — Domain Interfaces/Enums/Exceptions/ValueObjects — toate goale

**Fișiere:** `Domain/Interfaces/`, `Domain/Enums/`, `Domain/Exceptions/`, `Domain/ValueObjects/`

**Descriere:**  
Aceste foldere sunt complet goale:
- Interfețele repository-urilor sunt în **Application** (nu în Domain)  
- Nu există enumerări specifice domeniului (ex: `AppointmentStatus`, `Gender`)
- Nu există excepții de domeniu (ex: `AppointmentConflictException`)
- Nu există Value Objects (ex: `CNP`, `Email`, `PhoneNumber`)

**Recomandare arhitecturală:**
- Mutați interfețele repository din Application → Domain (conform Clean Architecture)
- Adăugați `enum AppointmentStatus { Scheduled, Confirmed, Completed, Cancelled, NoShow }` în Domain
- Considerați Value Object `CNP` cu validare integrată

---

### 🟡 ARCH-003 — ValidationBehavior folosește reflection pentru Result<T>

**Fișier:** `ValidationBehavior.cs`

**Descriere:**  
Behavior-ul de validare folosește reflection pentru a apela metoda `Failure` pe `Result<T>`:

```csharp
var failureMethod = typeof(TResponse).GetMethod("Failure",
    new[] { typeof(string), typeof(int) });
if (failureMethod is not null)
    return (TResponse)failureMethod.Invoke(null, new object[] { errors, 400 })!;
```

Aceasta este fragilă (depinde de numele metodei), lentă și greu de urmărit. O interfață `IResult` sau un marker generic ar fi mai robust:

```csharp
// Alternativă fără reflection:
if (typeof(TResponse).IsAssignableTo(typeof(IResult)))
    return (TResponse)(object)Result.Failure(errors);
```

---

### 🟡 ARCH-004 — Features fără handler pentru GetAllModules (nu cachuit)

**Descriere:**  
`GetAllModulesQuery` face un apel la DB la fiecare request, deși lista de module este statică (se schimbă doar la deploy). Aceasta ar trebui cachuit la startup.

---

## 6. Îmbunătățiri de Performanță

### 🟠 PERF-001 — Permisiunile sunt încărcate la fiecare login

**Fișier:** `LoginCommandHandler.cs`, `RefreshTokenCommandHandler.cs`

**Descriere:**  
La fiecare login și refresh, se fac două DB calls: unul pentru token + unul pentru permisiuni (`GetEffectiveByUserAsync`). Permisiunile ar putea fi incluse direct în JWT claims (claims compacte) sau cachuite mai agresiv.

---

### 🟡 PERF-002 — Nicio compresie pentru răspunsuri mari (liste paginate)

API-ul are configurat compression middleware, dar trebuie verificat că este aplicat și pe endpoint-urile cu response mare (liste de pacienți, programări).

---

### 🟡 PERF-003 — Lazy loading în frontend fără preloading

**Descriere:**  
Toate paginile sunt lazy-loaded (`lazy(() => import(...))`), ceea ce este bun pentru bundle size inițial, dar nu există nicio strategie de preloading pentru rutele frecvente (ex: Dashboard, Patients). Navigarea va simți o mică întârziere prima oară.

---

## 7. Testare & Acoperire

### 🟠 TEST-001 — Acoperire insuficientă a handler-elor

**Teste unitare existente:**
- `LoginCommandHandlerTests.cs` ✅ (acoperire bună)
- `LoginCommandValidatorTests.cs` ✅
- `CreatePatientCommandValidatorTests.cs` ✅ 
- `CreateDoctorCommandValidatorTests.cs` ✅
- `CreateUserCommandValidatorTests.cs` ✅
- `LoggingBehaviorTests.cs` ✅
- `CnasHandlerTests.cs` ✅
- `ScheduleHandlerTests.cs` ✅

**Handler-e fără teste unitare:**
- `CreateAppointmentCommandHandler` ❌
- `UpdateAppointmentCommandHandler` ❌
- `UpdateAppointmentStatusCommandHandler` ❌
- `DeleteAppointmentCommandHandler` ❌
- `CreatePatientCommandHandler` ❌
- `CreateDoctorCommandHandler` ❌
- `UpdateUserOverridesCommandHandler` ❌ (ar fi prins BUG-001)
- `UpdateRolePermissionsCommandHandler` ❌
- `RefreshTokenCommandHandler` ❌
- `ChangePasswordCommandHandler` ❌

### 🟠 TEST-002 — Niciun test pentru ModuleAccessAuthorizationHandler

Cel mai complex component de securitate nu are niciun test. BUG-001 și BUG-002 ar fi fost prinse cu teste de integrare sau unitare pe acest handler.

### 🟡 TEST-003 — Teste de integrare limitate

Testele de integrare acoperă:
- Login ✅
- Nomenclatoare ✅
- Pacienți (parțial) ✅
- Schedule ✅
- Users ✅

**Lipsă:** Appointments, Permissions, Clinic management, CNAS sync integration.

---

## 8. Plan de Implementare (Roadmap)

### Sprint 1 — Bugfixing Critic (1-2 săptămâni)

| ID | Task | Effort | Impact |
|----|------|--------|--------|
| BUG-001 | Fix cache key mismatch pentru user overrides | S (1h) | Critic |
| BUG-002 | Adăugare `roleId` claim în DevAuthBypassMiddleware | XS (15min) | Critic (dev) |
| BUG-004 | Sincronizare SqlErrorCodes cu SP-urile reale | M (4h) | Înalt |
| SEC-001 | Mărire minim parolă la 8 caractere | XS (15min) | Mediu |
| LOGIC-006 | Adăugare validator UpdateAppointmentStatusCommand | XS (30min) | Scăzut |
| LOGIC-004 | Validare DayOfWeek și time format în Schedule | XS (30min) | Scăzut |

### Sprint 2 — Calitate & Consistență (1-2 săptămâni)

| ID | Task | Effort | Impact |
|----|------|--------|--------|
| BUG-003 | Înlocuire raw SQL cu SP `User_GetByIdForAuth` | M (3h) | Mediu |
| LOGIC-001 | Standardizare MaximumLength email (199→200) în toți validatorii | XS (30min) | Scăzut |
| LOGIC-002 | Adăugare validator pentru GetAppointmentsForSchedulerQuery | S (1h) | Mediu |
| LOGIC-005 | Validare format orar HH:mm în schedule | S (1h) | Scăzut |
| SEC-002 | Adăugare verificare parolă veche în ChangePassword | M (3h) | Mediu |
| TEST-001 | Teste unitare pentru handler-ele lipsă (Appointment, Permissions) | L (12h) | Înalt |

### Sprint 3 — Features Incomplete (3-4 săptămâni)

| ID | Task | Effort | Impact |
|----|------|--------|--------|
| FEAT-002 | Implementare Dashboard real (backend + frontend) | L (16h) | Înalt |
| FEAT-001a | Implementare Consultații (backend + frontend) | XL (40h) | Critic pentru produs |
| FEAT-001b | Implementare Rețete (backend + frontend) | XL (40h) | Critic pentru produs |
| FEAT-001c | Implementare Facturi & Plăți (backend + frontend) | XL (50h) | Critic pentru produs |
| FEAT-003 | Pagină detalii Programare `/appointments/:id` | M (8h) | Mediu |
| LOG-004 | Cachuing `GetAllModulesQuery` | S (2h) | Performanță |

### Sprint 4 — Arhitectură & Calitate pe termen lung (ongoing)

| ID | Task | Effort | Impact |
|----|------|--------|--------|
| ARCH-001 | Adăugare logică de domeniu în entități | L (20h) | Arhitectural |
| ARCH-002 | Value Objects pentru CNP, Email, PhoneNumber | L (16h) | Arhitectural |
| ARCH-003 | Eliminare reflection din ValidationBehavior | M (4h) | Mentenanță |
| TEST-002 | Teste pentru ModuleAccessAuthorizationHandler | M (6h) | Securitate |
| FEAT-004 | Pagini detalii Doctor/MedicalStaff | M (8h) | UX |
| PERF-001 | Optimizare încărcare permisiuni (caching avansat) | M (6h) | Performanță |

---

## 9. Rezumat Prioritizat

### 🔴 Trebuie fixat imediat (producție afectată)

1. **BUG-001** — User permission cache invalidation nu funcționează → overrides nu se aplică
2. **SEC-001** — Parola minimă prea slabă (6 caractere)
3. **FEAT-001** — 4 module principale (Consultații, Rețete, Facturi, Plăți) afișate "coming soon"

### 🟠 Trebuie fixat înainte de next release

4. **BUG-002** — DevAuthBypassMiddleware `roleId` lipsă (blochează dezvoltarea)
5. **BUG-003** — Raw SQL în AuthRepository
6. **BUG-004** — SqlErrorCodes inconsistente
7. **FEAT-002** — Dashboard cu date reale
8. **TEST-001** — Handler-e neacoperite de teste

### 🟡 Nice-to-have / Technical debt

9. **LOGIC-001 .. LOGIC-007** — Validări lipsă sau inconsistente
10. **ARCH-001, ARCH-002** — Curățare arhitecturală Domain layer
11. **PERF-001 .. PERF-003** — Optimizări de performanță
12. **SEC-002, SEC-003, SEC-004** — Securitate suplimentară

---

*Document generat prin audit automat de cod sursă. Verificați fiecare issue înainte de implementare, deoarece unele comportamente pot fi intenționate.*
