# Plan — Ecran de administrare a politicilor de securitate

> Data: 16 Septembrie 2026
> Stare: **propus**, neînceput
> Vezi și: [DECIZII_ARHITECTURA_AUTH.md](DECIZII_ARHITECTURA_AUTH.md), [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md)

Un ecran unic din care administratorul configurează politica de parole, durata
sesiunii per rol și celelalte praguri de securitate — valori care azi sunt
constante în `appsettings.json` și se pot schimba doar prin redeploy.

---

## Decizii luate la pornire

| # | Întrebare | Decizie |
|---|---|---|
| 1 | Cum expiră sesiunea per rol | **Inactivitate.** Cronometrul se resetează la fiecare acțiune; după N minute fără activitate aplicația revine la login |
| 2 | Regulile de compoziție vs politica NIST actuală | **Se adaugă peste, cu praguri minime impuse.** Administratorul nu poate coborî sub pragurile de siguranță |
| 3 | Ce alte setări intră în ecran | Blocare cont · Istoric parole + expirare · Durata refresh token · Retenție jurnale |

### Nota despre regulile de compoziție

PR 4 a implementat deliberat NIST SP 800-63B: lungime plus listă de blocare, fără
reguli de compoziție, pentru că acestea împing utilizatorii spre tipare previzibile
(`Parola1!`) fără să adauge entropie reală.

Cererea de a configura numărul de cifre și de caractere speciale merge în sens opus.
Este o cerință legitimă — un auditor sau o normă internă o poate impune — și o
implementăm, dar cu două garanții:

- **Praguri minime neconfigurabile.** Lungimea minimă nu poate coborî sub 8, iar
  lista de blocare rămâne mereu activă. Un administrator nu poate transforma
  ecranul într-o cale de a slăbi securitatea sub nivelul de azi.
- **Reguli oprite implicit.** La migrare, cerințele de compoziție pornesc de la zero,
  deci comportamentul rămâne identic cu cel curent până când cineva le activează
  conștient.

---

## Miezul lucrării: configurație → bază de date

Aceasta este partea care determină efortul, nu ecranul.

Azi toate valorile sunt citite prin `IOptions<T>`, adică legate la pornirea
aplicației. Există **opt** locuri de consum:

| Fișier | Ce citește |
|---|---|
| `LoginCommandHandler` | `SecurityOptions`, `JwtOptions` |
| `RefreshTokenCommandHandler` | `JwtOptions` |
| `AuthController` | `JwtOptions` (durata cookie-ului) |
| `JwtTokenService` | `JwtOptions` (durata access token) |
| `BcryptPasswordHasher` | `SecurityOptions` (work factor) |
| `RefreshTokenCleanupHostedService` | `SecurityOptions` (retenție) |
| `DependencyInjection` | `JwtOptions` (parametri de validare) |
| `PasswordRules` | constante statice |

Ce **rămâne** în `appsettings.json`, intenționat: `Jwt:Secret`, `Jwt:Issuer`,
`Jwt:Audience`, connection string-ul și `BcryptWorkFactor`. Primele sunt secrete
sau identitatea criptografică a aplicației; work factor-ul schimbă costul fiecărei
autentificări și nu are ce căuta într-un formular.

### Serviciul de setări

Un `ISecuritySettingsProvider` cu cache invalidat prin versiune globală —
exact tiparul deja folosit de `PermissionCacheKeys`, care s-a dovedit funcțional:

```
securitysettings:version        → incrementată la orice salvare
securitysettings:global:v{N}    → politica de parole și pragurile globale
securitysettings:role:{id}:v{N} → setările de sesiune ale unui rol
```

Invalidarea prin incrementarea versiunii, nu prin ștergere de chei, pentru că
aplicația poate rula pe mai multe instanțe: o ștergere locală nu ajunge la celelalte,
iar o versiune citită din baza de date da. **Atenție:** `PermissionCacheKeys.Version`
se ține azi în `IMemoryCache`, deci are deja această limitare — o discutăm la
Etapa 1, nu o moștenim tacit.

---

## Model de date

### `SecuritySettings` — un singur rând, global

| Coloană | Tip | Implicit | Note |
|---|---|---|---|
| `PasswordMinLength` | `INT` | 12 | nu poate coborî sub 8 |
| `PasswordMaxLength` | `INT` | 100 | |
| `PasswordMinDigits` | `INT` | 0 | oprit implicit |
| `PasswordMinSpecial` | `INT` | 0 | oprit implicit |
| `PasswordMinUppercase` | `INT` | 0 | oprit implicit |
| `PasswordMinLowercase` | `INT` | 0 | oprit implicit |
| `PasswordBlocklistEnabled` | `BIT` | 1 | nu poate fi dezactivată |
| `PasswordForbidIdentityValues` | `BIT` | 1 | parola ≠ email/username/nume |
| `PasswordHistoryCount` | `INT` | 0 | 0 = fără istoric |
| `PasswordExpiryDays` | `INT` | 0 | 0 = fără expirare |
| `MaxFailedLoginAttempts` | `INT` | 5 | minim impus: 3 |
| `LockoutMinutes` | `INT` | 15 | |
| `SecurityEventRetentionDays` | `INT` | 730 | minim impus: 90 |
| `RefreshTokenRetentionDays` | `INT` | 30 | |
| `UpdatedAt`, `UpdatedBy` | | | pentru audit |

### `RoleSecuritySettings` — un rând per rol

| Coloană | Tip | Implicit | Note |
|---|---|---|---|
| `RoleId` | `UNIQUEIDENTIFIER` | | unic |
| `IdleTimeoutMinutes` | `INT` | 30 | ex. 10 pentru doctor |
| `RefreshTokenDays` | `INT` | 7 | cât poate fi reluată sesiunea |

Seed la migrare cu valorile de azi, ca nimic să nu se schimbe la deploy.

### `PasswordHistory`

`UserId`, `PasswordHash`, `CreatedAt`. Verificată la schimbarea parolei, curățată
de serviciul de retenție existent.

### `Users` — coloană nouă

`PasswordChangedAt DATETIME2 NULL` — baza pentru expirarea parolei. La migrare
primește `UpdatedAt`, sau `CreatedAt` unde lipsește.

---

## Cum se aplică efectiv expirarea pe inactivitate

Partea cea mai delicată: un cronometru doar în client e cosmetic, oricine poate
apela API-ul direct.

Soluția se sprijină pe rotația de refresh token deja existentă (PR 3):

1. **Durata access token-ului devine fereastra de inactivitate**, per rol. Pentru
   doctor cu 10 minute, token-ul trăiește 10 minute.
2. **Clientul nu reîmprospătează pe cronometru**, ci doar când o cerere primește 401
   — adică exact atunci când utilizatorul face ceva. Fără activitate nu există
   cerere, deci nici reîmprospătare.
3. **Serverul verifică la `/refresh`** vechimea token-ului curent de refresh. Pentru
   că fiecare reîmprospătare îl rotește, `CreatedAt` al token-ului activ *este*
   momentul ultimei activități. Dacă a trecut mai mult decât fereastra de
   inactivitate, refuzăm și cerem autentificare nouă.

Astfel aplicarea e pe server, fără nicio scriere suplimentară per cerere.

În client se adaugă doar experiența: un avertisment cu 60 de secunde înainte,
deconectare automată la expirare și sincronizare între tab-uri prin `BroadcastChannel`
— altfel un tab activ ar ține sesiunea vie în timp ce altul afișează avertismentul.

**Verificare obligatorie:** un test e2e care confirmă că, după fereastra de
inactivitate, o acțiune duce la ecranul de login — și un test care confirmă că
activitatea continuă **nu** deconectează. Al doilea e la fel de important: o
implementare prea agresivă ar deconecta medici în timpul consultației.

---

## Etape

### Etapa 1 — Fundația: setări în baza de date
- [ ] Migrare: `SecuritySettings`, `RoleSecuritySettings`, seed cu valorile actuale
- [ ] Migrare: modul de permisiuni `settings` + acordare rolului admin
      *(lecția din 0045: un `ModuleCode` fără rând în `Modules` produce 403 tăcut pentru toată lumea)*
- [ ] `ISecuritySettingsProvider` cu cache versionat + SP-uri de citire/scriere
- [ ] Înlocuirea celor opt locuri de consum `IOptions`
- [ ] Decizie: versiunea de cache rămâne în `IMemoryCache` sau trece în baza de date
- [ ] Teste: provider-ul respectă pragurile minime; invalidarea funcționează

**Nimic vizibil pentru utilizator.** Comportamentul trebuie să rămână identic —
suita existentă e plasa de siguranță.

### Etapa 2 — Politica de parole configurabilă
- [ ] `PasswordRules` devine dinamic, alimentat de provider, cu praguri minime impuse
- [ ] Reguli de compoziție: cifre, speciale, majuscule, minuscule
- [ ] Mesaje de eroare care spun exact ce lipsește, nu „parolă invalidă"
- [ ] `PasswordHistory` + verificare la schimbare
- [ ] `PasswordChangedAt` + expirare, prin `MustChangePassword` la login
- [ ] Teste: fiecare regulă separat, plus că pragurile minime nu pot fi coborâte

### Etapa 3 — Expirare pe inactivitate, per rol
- [ ] Durata access token per rol în `JwtTokenService` / `LoginCommandHandler`
- [ ] Verificarea ferestrei de inactivitate la `/refresh`
- [ ] Client: urmărirea activității, avertisment, deconectare, sincronizare între tab-uri
- [ ] Teste e2e: expiră la inactivitate **și** nu expiră la activitate continuă
- [ ] Eveniment nou în jurnal: `SessionExpiredIdle`

### Etapa 4 — Ecranul de administrare
- [ ] `GET` / `PUT /api/v1/SecuritySettings`, protejat cu `[HasAccess(settings, …)]`
- [ ] Pagină cu trei secțiuni: parole · sesiuni per rol · praguri și retenție
- [ ] Indicator de putere a parolei care reflectă politica activă
- [ ] Avertisment explicit înainte de salvare când o modificare deconectează utilizatori
- [ ] Fiecare salvare scrie în `SecurityEvents`: cine, ce a schimbat, din ce în ce
- [ ] Regenerare contract OpenAPI

### Etapa 5 — Ecranul jurnalului de securitate
- [ ] Interfață peste `GET /api/v1/SecurityEvents`, care există din PR 5 fără UI
- [ ] Filtre pe tip, utilizator, IP, interval; evidențierea `TokenReuseDetected`

---

## Riscuri

| Risc | Mitigare |
|---|---|
| O politică mai strictă blochează utilizatorii existenți la următoarea schimbare de parolă | Regulile se aplică doar la parole noi; cele existente rămân valide până la expirare |
| Fereastră de inactivitate prea mică deconectează medici în timpul consultației | Avertisment cu 60 s înainte; testul care confirmă că activitatea continuă nu deconectează; implicit generos (30 min), scăderea e o alegere conștientă |
| Setările în baza de date devin un punct unic de eșec | Provider-ul cade înapoi pe valorile din `appsettings.json` dacă tabela e inaccesibilă, și loghează |
| Un administrator slăbește politica din greșeală | Praguri minime impuse în cod, nu doar în formular; fiecare modificare e jurnalizată |
| Cache-ul de setări rămâne vechi pe alte instanțe | Decizia din Etapa 1 despre unde trăiește versiunea |

---

## De clarificat înainte de Etapa 3

- **Ferestrele implicite per rol.** Doctor 10 minute a fost exemplul din cerință.
  Pentru `nurse`, `receptionist`, `clinic_manager` și `admin` avem nevoie de valori,
  sau pornim toate de la 30 de minute și le ajustează administratorul.
- **Ce înseamnă activitate.** Doar interacțiunea cu aplicația, sau și mișcarea
  mouse-ului deasupra unei pagini deschise? A doua variantă e mai permisivă și
  slăbește scopul: o stație nesupravegheată cu mouse-ul atins accidental rămâne
  deschisă.

---

## Stare

| Etapă | Stare |
|---|---|
| 1 — Fundația | ⬜ neînceput |
| 2 — Politica de parole | ⬜ neînceput |
| 3 — Inactivitate per rol | ⬜ neînceput |
| 4 — Ecranul de administrare | ⬜ neînceput |
| 5 — Ecranul jurnalului | ⬜ neînceput |
