# Plan — Ecran de administrare a politicilor de securitate

> Data: 16 Septembrie 2026
> Stare: **Etapa 1 finalizată**, restul neîncepute
> Revizie: v1.2 — Etapa 1 implementată
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
| 4 | Ferestre implicite per rol | **30 de minute pentru toate**, ajustate din ecran; rolul se alege dintr-un dropdown |
| 5 | Ce înseamnă activitate | **Schimbarea ecranului** — navigare, deschiderea unui ecran dintr-un meniu. Mișcarea mouse-ului și click-urile oarecare în pagină **nu** sunt activitate |

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

**Decizie luată la Etapa 1: TTL absolut de 60 de secunde, fără versiune.**

Tiparul cu versiune de la permisiuni a fost respins tocmai pentru că
`PermissionCacheKeys.Version` se ține în `IMemoryCache`: pe mai multe instanțe, o
modificare pe una nu ajunge la celelalte, deci versiunea nu rezolvă problema pentru
care există. Mutarea versiunii în baza de date ar însemna o citire la fiecare acces,
adică exact ce evită cache-ul.

Un TTL de 60 de secunde rezolvă problema fără nicio infrastructură: o setare
schimbată pe o instanță devine activă pe toate în cel mult un minut, iar setările se
schimbă rar. La salvare se face și invalidare locală, deci administratorul care
tocmai a salvat vede efectul imediat.

Chei: `securitysettings:global` și `securitysettings:roles`.

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
| `IdleTimeoutMinutes` | `INT` | 30 | toate rolurile pornesc de la 30; ex. 10 pentru doctor, setat din ecran |
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

### Corecție față de revizia v1.0

Prima versiune a acestui plan spunea că *durata access token-ului devine fereastra
de inactivitate*. **Este greșit**, iar scenariul care o arată e banal: cu o fereastră
de 30 de minute și un access token tot de 30 de minute, un utilizator activ la minutul
20 nu produce nicio reîmprospătare (token-ul e încă valid), așa că la minutul 31
serverul vede ultima rotație acum 31 de minute și îl deconectează — deși tocmai
lucrase. Mecanismul ar fi măsurat vechimea token-ului, nu inactivitatea.

### Mecanismul corect

Două durate distincte, nu una:

- **Access token scurt și fix: 5 minute.** Nu e o setare de business, ci granularitatea
  cu care serverul poate observa inactivitatea. Rotația frecventă face ca momentul
  ultimei rotații să aproximeze momentul ultimei activități în limita a 5 minute.
- **Fereastra de inactivitate, per rol**, verificată la `/refresh`: dacă token-ul de
  refresh curent e mai vechi decât fereastra rolului, refuzăm.

Cum funcționează:

1. Clientul **nu** reîmprospătează pe cronometru, ci doar când o cerere primește 401.
   Fără activitate nu există cereri, deci nici rotații.
2. Un utilizator activ produce cereri, deci token-ul se rotește la fiecare 5 minute,
   iar `CreatedAt` al token-ului activ urmărește activitatea.
3. La inactivitate, rotațiile se opresc. Prima acțiune de după fereastră găsește un
   token prea vechi și duce la ecranul de login.

Precizia server-side e deci fereastra ± 5 minute. Compromisul invers — un access token
și mai scurt — ar înmulți cererile de refresh fără câștig practic.

**Cost:** o cerere `/refresh` la 5 minute pentru fiecare tab activ, față de 15 azi.
Limita de refresh (60 la 15 minute, PR 5) acoperă confortabil, dar trebuie recalculată
dacă cineva coboară access token-ul sub 5 minute.

### Unde trăiește definiția exactă a activității

Serverul măsoară timp între rotații; nu poate distinge o navigare a utilizatorului de
o cerere automată. Definiția de business — *schimbarea ecranului*, nu mișcarea
mouse-ului — se aplică **în client**, care decide când reîmprospătează și când se
deconectează singur. Serverul rămâne plasa de siguranță pentru un apelant direct de API.

Semnalul de activitate în client:

| Contează ca activitate | Nu contează |
|---|---|
| Navigare între rute | Mișcarea mouse-ului |
| Deschiderea unui ecran dintr-un meniu | Scroll |
| Schimbarea unui ecran fără navigare — modal, tab, pagină de grilă | Click-uri oarecare în pagină |
| Trimiterea unui formular | Reîmprospătări automate în fundal |

Schimbările de ecran care nu produc navigare trebuie marcate explicit; nu există un
eveniment DOM care să le acopere.

**De verificat la implementare:** `useAnmSyncStatus` și `useCnasSyncStatus` fac polling
la 3 secunde cât timp un job de sincronizare rulează. Polling-ul e condiționat de un job
pornit manual, deci nu e un cronometru permanent — dar o sincronizare lungă ține sesiunea
vie. Probabil corect (utilizatorul a pornit jobul și îl așteaptă), însă merită o decizie
conștientă, nu un efect secundar.

În client se adaugă și experiența: un avertisment cu 60 de secunde înainte, deconectare
automată la expirare și sincronizare între tab-uri prin `BroadcastChannel` — altfel un
tab activ ar ține sesiunea vie în timp ce altul afișează avertismentul.

**Verificare obligatorie:** un test e2e care confirmă că, după fereastra de
inactivitate, o acțiune duce la ecranul de login — și un test care confirmă că
activitatea continuă **nu** deconectează. Al doilea e la fel de important: o
implementare prea agresivă ar deconecta medici în timpul consultației.

---

## Etape

### Etapa 1 — Fundația: setări în baza de date ✅
- [x] Migrarea 0046: `SecuritySettings`, `RoleSecuritySettings`, seed cu valorile actuale
- [x] Migrarea 0047: modul de permisiuni `settings` + acordare rolului admin
      *(lecția din 0045: un `ModuleCode` fără rând în `Modules` produce 403 tăcut pentru toată lumea)*
- [x] `ISecuritySettingsProvider` cu cache TTL + patru SP-uri de citire/scriere
- [x] `SecuritySettingsLimits` — pragurile minime impuse la fiecare citire
- [x] Înlocuirea locurilor de consum `IOptions` care trec în baza de date
- [x] Decizia despre cache: TTL de 60 s, nu versiune (vezi mai sus)
- [x] 25 de teste pe praguri și valori implicite

**Verificat live:** comportamentul e identic după migrare (login, refresh, parolă
greșită), iar schimbarea `RefreshTokenDays` de la 7 la 2 în baza de date a mutat
expirarea și în cookie, și în rândul din `RefreshTokens` — deci setările chiar
guvernează comportamentul, nu doar sunt stocate.

**Schimbare de contract internă:** `LoginResponseDto` poartă acum
`RefreshTokenExpiresAt`. Controller-ul folosește momentul calculat de handler în loc
să îl recalculeze dintr-o valoare globală — altfel cookie-ul și rândul din baza de
date ar fi putut diverge odată ce durata devine per rol.

### Etapa 2 — Politica de parole configurabilă
- [ ] `PasswordRules` devine dinamic, alimentat de provider, cu praguri minime impuse
- [ ] Reguli de compoziție: cifre, speciale, majuscule, minuscule
- [ ] Mesaje de eroare care spun exact ce lipsește, nu „parolă invalidă"
- [ ] `PasswordHistory` + verificare la schimbare
- [ ] `PasswordChangedAt` + expirare, prin `MustChangePassword` la login
- [ ] Teste: fiecare regulă separat, plus că pragurile minime nu pot fi coborâte

### Etapa 3 — Expirare pe inactivitate, per rol
- [ ] Access token scurtat la 5 minute (granularitatea observării inactivității)
- [ ] Verificarea ferestrei de inactivitate la `/refresh`, per rolul utilizatorului
- [ ] Client: semnal de activitate pe schimbarea ecranului, **nu** pe mouse sau click
- [ ] Marcarea explicită a schimbărilor de ecran fără navigare (modal, tab, pagină de grilă)
- [ ] Avertisment cu 60 s înainte, deconectare, sincronizare între tab-uri
- [ ] Decizie: polling-ul de sincronizare CNAS/ANM ține sau nu sesiunea vie
- [ ] Recalcularea limitei de refresh pentru noul ritm de rotație
- [ ] Teste e2e: expiră la inactivitate **și** nu expiră la activitate continuă
- [ ] Eveniment nou în jurnal: `SessionExpiredIdle`

### Etapa 4 — Ecranul de administrare
- [ ] `GET` / `PUT /api/v1/SecuritySettings`, protejat cu `[HasAccess(settings, …)]`
- [ ] Pagină cu trei secțiuni: parole · sesiuni per rol · praguri și retenție
- [ ] Secțiunea de sesiuni: dropdown de rol, apoi setările rolului selectat
      *(compromis acceptat: nu se văd toate rolurile deodată; un tabel ar arăta
      configurația completă dintr-o privire, dar dropdown-ul a fost cerut explicit)*
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

## Stare

| Etapă | Stare |
|---|---|
| 1 — Fundația | ✅ **finalizată** |
| 2 — Politica de parole | ⬜ neînceput |
| 3 — Inactivitate per rol | ⬜ neînceput |
| 4 — Ecranul de administrare | ⬜ neînceput |
| 5 — Ecranul jurnalului | ⬜ neînceput |
