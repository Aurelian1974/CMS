# Decizii de Arhitectură — Modulul de Autentificare

> Data: 16 Septembrie 2026
> Revizie: v1.0
> Context: plan de corecție a bug-urilor și problemelor de securitate din modulul auth
> Vezi și: [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) (audit general), [CLAUDE.md](CLAUDE.md) (convenții)

Fiecare decizie e blocantă pentru cel puțin un PR din planul de corecție. Formatul e ADR
redus: **Context → Decizie → Alternative respinse → Consecințe**.

| # | Decizie | Status | PR |
|---|---|---|---|
| [D1](#d1--path-ul-cookie-ului-de-refresh) | Path-ul cookie-ului de refresh | Propusă | 1 |
| [D2](#d2--hash-pe-refresh-tokens) | Hash pe refresh tokens | Propusă | 3b |
| [D3](#d3--tabel-separat-pentru-evenimente-de-securitate) | Tabel separat pentru evenimente de securitate | Propusă | 5 |
| [D4](#d4--separarea-schimbării-de-parolă-în-două-endpoint-uri) | Separarea schimbării de parolă în două endpoint-uri | Propusă | 4 |
| [D5](#d5--access-token-doar-în-memorie) | Access token doar în memorie | Propusă | 5 |

---

## D1 — Path-ul cookie-ului de refresh

**Context**
`AuthController.SetRefreshTokenCookie` setează `Path = "/api/auth"`, dar ruta reală moștenită
din `BaseApiController` (`api/v{version:apiVersion}/[controller]`) este `/api/v1/Auth/refresh`.
Per RFC 6265 path matching-ul e prefix exact și case-sensitive, deci browserul nu trimite
niciodată cookie-ul: refresh-ul e mort, iar sesiunea cade la 15 minute. Același mismatch în
`ClearRefreshTokenCookie` face cookie-ul imposibil de șters.

**Decizie**
Path-ul devine `/api/v1/Auth`, extras într-o constantă privată folosită de ambele helpere.

```csharp
private const string RefreshTokenCookieName = "refreshToken";
private const string RefreshTokenCookiePath = "/api/v1/Auth";
```

**Alternative respinse**
- `Path = "/api"` — cookie-ul ar fi trimis la *fiecare* request API, nu doar la `/refresh`.
  Suprafață de atac CSRF inutil de mare și trafic în plus pe fiecare cerere.
- `Path = "/"` — idem, mai rău; anulează beneficiul izolării pe endpoint.
- Derivare dinamică din `IUrlHelper` / rutare — complexitate disproporționată pentru o valoare
  care se schimbă o dată la câțiva ani.

**Consecințe**
- Constanta trebuie actualizată manual la introducerea unui `v2` al API-ului.
  Mitigare obligatorie: test e2e care validează supraviețuirea sesiunii după expirarea
  access token-ului. Fără el, regresia e din nou invizibilă — suita `auth.spec.ts` actuală
  testează doar login/logout, motiv pentru care bug-ul a trecut neobservat.
- `SameSite=Strict` rămâne neschimbat — SPA-ul e servit same-origin prin proxy-ul Vite.

**Fișiere:** `src/ValyanClinic.API/Controllers/AuthController.cs`, `client/e2e/specs/auth.spec.ts`

---

## D2 — Hash pe refresh tokens

**Context**
Tabela `RefreshTokens` stochează valoarea brută a token-ului. Un SQL injection, un backup
scurs sau accesul unui DBA înseamnă preluare directă de sesiuni active, fără a fi nevoie de
parole. Token-urile au durată de 7 zile.

**Decizie**
Stocăm `SHA-256(token)` în coloana `TokenHash CHAR(64)`, cu index unic. Căutarea la `/refresh`
se face după hash. Valoarea în clar există doar în cookie-ul HttpOnly al clientului.

**Alternative respinse**
- **BCrypt / Argon2 pe token** — costul de hashing (~250 ms la work factor 12) e justificat
  pentru parole cu entropie mică, nu pentru un token de 64 de bytes generat crypto-secure.
  Ar adăuga latență pe un endpoint apelat la fiecare 15 minute de fiecare tab deschis și ar
  face imposibil un index unic.
- **Criptare reversibilă (AES)** — nu avem nevoie să recuperăm valoarea; cheia de criptare
  devine un nou secret de gestionat, cu aceeași expunere ca datele pe care le protejează.
- **Always Encrypted pe coloană** — dependență de ediția SQL Server și de infrastructura de
  chei; hash-ul rezolvă problema fără ele.

**Consecințe**
- **Deploy-ul deloghează toți utilizatorii o dată.** Rândurile existente se șterg în migrare:
  hash-ul nu poate fi derivat retroactiv, iar valorile în clar trebuie oricum eliminate.
  Necesită fereastră de mentenanță anunțată.
- Performanța rămâne neschimbată — lookup pe index unic în loc de index nefiltrat.
- Toate SP-urile de refresh token își schimbă semnătura (`@Token` → `@TokenHash`).
  Hash-ul se calculează în `JwtTokenService`, nu în SQL, ca să rămână testabil unitar.

**Fișiere:** migrare `0041_HashRefreshTokens.sql`, `RefreshToken_Create/_GetByToken/_Revoke/_RevokeAll.sql`,
`JwtTokenService.cs`, `AuthRepository.cs`

---

## D3 — Tabel separat pentru evenimente de securitate

**Context**
Nu există niciun apel de audit în `Features/Auth` — login reușit/eșuat, lockout, logout,
schimbare de parolă și detecția de reutilizare a token-ului nu lasă nicio urmă. Pentru o
aplicație care procesează date medicale aceasta e o lipsă de conformitate (GDPR art. 32).

Tabela `AuditLogs` existentă **nu poate** prelua aceste evenimente: `ClinicId` și `ChangedBy`
sunt `NOT NULL`, iar `ClinicId` are FK către `Clinics`. Un login eșuat cu un email necunoscut
nu are nici user, nici clinică — exact cazul cel mai important de jurnalizat.

**Decizie**
Tabel nou `SecurityEvents`, independent de `AuditLogs`:

| Coloană | Tip | Note |
|---|---|---|
| `Id` | `UNIQUEIDENTIFIER` | `NEWSEQUENTIALID()` |
| `EventType` | `NVARCHAR(50)` | `LoginSucceeded`, `LoginFailed`, `AccountLocked`, `Logout`, `TokenRefreshed`, `TokenReuseDetected`, `PasswordChanged`, `PasswordReset` |
| `UserId` | `UNIQUEIDENTIFIER NULL` | NULL dacă userul nu a fost identificat |
| `ClinicId` | `UNIQUEIDENTIFIER NULL` | fără FK — evenimentul se scrie chiar dacă clinica e necunoscută |
| `EmailAttempted` | `NVARCHAR(200) NULL` | valoarea introdusă la login eșuat |
| `IpAddress` | `NVARCHAR(50) NULL` | |
| `UserAgent` | `NVARCHAR(500) NULL` | |
| `Succeeded` | `BIT` | |
| `Details` | `NVARCHAR(MAX) NULL` | JSON |
| `OccurredAt` | `DATETIME2` | `SYSUTCDATETIME()` |

**Alternative respinse**
- **Relaxarea constrângerilor din `AuditLogs`** — `AuditLogs` are o semantică clară: mutație
  pe o entitate, cu `OldValues`/`NewValues`, scrisă din SP-uri, izolată pe clinică.
  Evenimentele de auth nu sunt mutații de entități și nu au tenant garantat. Slăbirea schemei
  ar strica invariantele pe care se bazează interogările existente și modulul de vizualizare
  a jurnalului.
- **Doar Serilog, fără tabel** — log-urile pe fișier (`Logs/log-.txt`, retenție 30 de zile) nu
  sunt interogabile pentru un răspuns la o cerere GDPR și nu au retenție garantată. Serilog
  rămâne complementar, nu înlocuitor.

**Consecințe**
- Fără FK pe `ClinicId` — corectitudinea referențială se pierde intenționat, în schimbul
  garanției că evenimentul se scrie întotdeauna.
- Scrierea nu trebuie să blocheze autentificarea: eșecul jurnalizării se loghează, dar nu
  propagă excepție către utilizator.
- Necesită politică de retenție separată (propunere: 2 ani) și un index pe
  `(EmailAttempted, OccurredAt DESC)` pentru investigarea atacurilor de tip credential stuffing.

**Fișiere:** migrare `0044_CreateSecurityEvents.sql`, `ISecurityEventRepository` + implementare,
handlers din `Features/Auth`

---

## D4 — Separarea schimbării de parolă în două endpoint-uri

**Context**
`PATCH /api/v1/Users/{id}/password` acoperă azi două cazuri de utilizare incompatibile:
- **self-service** — utilizatorul își schimbă propria parolă; ar trebui să dovedească
  posesia parolei curente;
- **reset administrativ** — un admin resetează parola altcuiva; prin definiție nu cunoaște
  parola veche.

Rezultatul e un endpoint care nu funcționează corect în niciunul: `ChangePasswordRequest` nu
conține `CurrentPassword`, deci controller-ul construiește mereu comanda cu `null`, iar ramura
self-service a handler-ului returnează invariabil eroare — cod mort care nu poate reuși.
În paralel, gate-ul `[HasAccess(Users, Write)]` e prea larg pentru resetarea de credențiale:
orice rol cu scriere pe modulul `Users` (ex. Receptionist) poate reseta parola oricui **din
propria clinică**, inclusiv a unui Admin, și apoi se autentifica cu ea. (`User_UpdatePassword`
filtrează după `@ClinicId`, deci escaladarea nu e cross-tenant.)

**Decizie**
Două endpoint-uri cu autorizare și contract distincte:

| Endpoint | Autorizare | `CurrentPassword` | Efect suplimentar |
|---|---|---|---|
| `PATCH /api/v1/Users/me/password` | `[Authorize]` | obligatoriu, verificat | revocă toate refresh token-urile |
| `POST /api/v1/Users/{id}/password-reset` | `[HasAccess(Users, Write)]` + rol `Admin` | absent | setează `MustChangePassword = 1`, revocă toate refresh token-urile, scrie `SecurityEvent` |

**Alternative respinse**
- **Păstrarea unui endpoint cu ramificare pe `UserId`** — starea actuală. Autorizarea devine o
  funcție de payload, nu de rută, ceea ce o face imposibil de exprimat declarativ prin
  `[HasAccess]` și greu de auditat.
- **Restrângerea lui `[HasAccess(Users, Write)]` la Admin global** — ar rupe fluxuri legitime
  de administrare a utilizatorilor care nu au legătură cu parolele.

**Consecințe**
- **Breaking change pe API.** Necesită modificare în client (`ChangePasswordModal` primește un
  câmp de parolă curentă, afișat condiționat) și regenerare `openapi/openapi-v1.json` —
  altfel pasul `npm run check:api` din CI cade.
- Necesită migrare pentru `Users.MustChangePassword BIT NOT NULL DEFAULT 0` și un gate în
  `LoginCommandHandler` care forțează schimbarea la următorul login.
- Revocarea sesiunilor la schimbarea parolei devine comportament garantat pe ambele rute —
  azi `RevokeAllRefreshTokensAsync` există în repository și nu e apelată nicăieri.

**Fișiere:** `UsersController.cs`, `ChangePasswordCommand*`, migrare `0042_AddMustChangePassword.sql`,
`client/src/features/users/components/ChangePasswordModal/`, `openapi/openapi-v1.json`

---

## D5 — Access token doar în memorie

**Context**
`authStore` persistă `accessToken` în `sessionStorage`, accesibil oricărui XSS. `App.tsx`
compensează printr-un IIFE care decodează manual payload-ul JWT ca să detecteze token-urile
expirate la pornire — simptom al faptului că starea persistată poate fi inconsistentă.

**Decizie**
`accessToken` iese din `partialize` și trăiește doar în memorie. La reload, sesiunea se
reconstruiește printr-un apel `/refresh`; cookie-ul HttpOnly devine singura sursă de adevăr
pentru continuitatea sesiunii. `user` și `permissions` pot rămâne persistate — nu sunt
credențiale — pentru a evita un flash de UI gol.

**Alternative respinse**
- **Mutarea în `localStorage`** — expunere strict mai mare; supraviețuiește închiderii tab-ului.
- **Access token în cookie HttpOnly** — ar elimina complet expunerea la XSS, dar reintroduce
  CSRF pe toate endpoint-urile și necesită anti-forgery tokens pe fiecare cerere mutantă.
  Disproporționat față de câștig, având în vedere durata de 15 minute a token-ului.
- **Păstrarea status quo-ului** — acceptabilă doar dacă SPA-ul ar avea o politică CSP strictă;
  `Content-Security-Policy: default-src 'none'` e setat pe răspunsurile API, nu pe documentul
  care servește aplicația.

**Consecințe**
- **Depinde strict de D1.** Cât timp cookie-ul de refresh nu ajunge la server, eliminarea
  persistenței ar deconecta utilizatorul la fiecare reload de pagină. Nu se implementează
  înaintea PR 1.
- Apare un scurt „boot state" la încărcare (apelul `/refresh` în curs) — `ProtectedRoute`
  trebuie să distingă „neautentificat" de „încă nu știm", altfel redirecționează greșit
  către `/login`.
- IIFE-ul de validare din `App.tsx` devine cod mort și se elimină.

**Fișiere:** `client/src/store/authStore.ts`, `client/src/App.tsx`,
`client/src/routes/ProtectedRoute.tsx`, `client/src/api/axiosInstance.ts`

---

## Decizii adiacente, fără alternative reale

Enumerate pentru trasabilitate — nu necesită aprobare separată.

- **Standardizare pe UTC.** `DateTime.Now` (expirare refresh, lockout, `RefreshTokenDto.IsActive`)
  coexistă cu `DateTime.UtcNow` (expirare JWT) în același flux. Se trece pe `DateTime.UtcNow` +
  `SYSUTCDATETIME()` peste tot. Necesită migrare de date dacă serverul nu rulează pe UTC.
- **Durata lockout-ului se separă de fereastra rate-limiter-ului.** `LoginCommandHandler`
  pasează azi `RateLimitingOptions.LoginWindowMinutes` drept durată de blocare a contului —
  două concepte diferite care se vor desincroniza. Se mută în `Security:LockoutMinutes`.
- **`DevAuthBypassMiddleware` se elimină, nu se repară.** Nu e înregistrat în `Program.cs`,
  dar injectează un principal `Admin` pentru orice cerere neautentificată. BUG-002 din
  `IMPROVEMENT_PLAN.md`, care propune completarea lui cu claim-ul `roleId`, se marchează
  „won't fix — eliminat".
- **Secretul JWT iese din `appsettings.json`** — user-secrets în dev, variabile de mediu sau
  Key Vault în prod, cu `ValidateOnStart` care refuză valoarea de development și cheile sub
  32 de bytes. Valoarea actuală e compromisă permanent: e în istoricul git.
