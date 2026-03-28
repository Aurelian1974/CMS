# ValyanClinic — Claude Copilot Instructions

> **Ecosistem AI**: Claude (Opus pentru arhitectură/decizii complexe, Sonnet pentru implementare zilnică, Haiku pentru review rapid/generare boilerplate)
> **Stil comunicare**: Direct și la obiect — fără introduceri inutile, fără padding diplomatic. Dacă codul e greșit, spune direct. Dacă abordarea e proastă, spune și de ce. Dacă întrebarea e vagă, cere clarificări imediat în loc să presupui. Răspunsurile scurte sunt preferate celor lungi și generale.
> **IDE**: Visual Studio Code
> **Limba cod**: Engleză (variabile, clase, metode, namespace-uri) | **Comentarii & documentație**: Română
> **Diacritice**: În cod C#/TS — **doar în comentarii și string-uri afișate utilizatorului**. În SQL — **doar în valori date** (string literals din INSERT/seed), **niciodată** în nume tabele, coloane, variabile, SP-uri.

> **Domeniu**: Aplicație medicală universală — suportă toate specializările medicale (medicină de familie, cardiologie, pneumologie, neurologie, pediatrie, dermatologie, ortopedie, ginecologie etc.). Gestionează pacienți, programări, consultații, diagnostice, rețete, documente medicale, facturi și rapoarte.

> **Multi-specialitate**: Fiecare doctor are o specializare configurabilă. Nomenclatoarele (servicii medicale, proceduri, ICD-10) sunt filtrate/extinse per specialitate. Aplicația nu e hardcodată pentru nicio specialitate anume.

---

## CUPRINS

1. [Context Medical — Domeniu & Entități](#1-context-medical)
2. [Stiva Tehnologică](#2-stiva-tehnologică)
3. [Arhitectură — Clean Architecture + Vertical Slices](#3-arhitectură)
4. [Tema Aplicației — Albastru Pastel](#4-tema-aplicației)
5. [Convenții Backend C#](#5-convenții-backend-c)
6. [Convenții Frontend React + TypeScript](#6-convenții-frontend-react--typescript)
7. [Autentificare & Autorizare — JWT + Refresh Tokens](#7-autentificare--autorizare)
8. [Migrări Bază de Date — DbUp](#8-migrări-bază-de-date--dbup)
9. [Schema Bază de Date — Tabele Principale](#9-schema-bază-de-date)
10. [Stocare Fișiere Medicale](#10-stocare-fișiere-medicale)
11. [Generare Documente PDF — QuestPDF](#11-generare-documente-pdf--questpdf)
12. [Correlation ID & Request Tracing](#12-correlation-id--request-tracing)
13. [Management Erori](#13-management-erori)
14. [Performanță & Securitate](#14-performanță--securitate)
15. [Testare](#15-testare)
16. [Reguli Generale de Generare Cod](#16-reguli-generale-de-generare-cod)
17. [Instrucțiuni Specifice pentru Claude](#17-instrucțiuni-specifice-pentru-claude)
18. [CNAS / SIUI — Integrare Casa de Asigurări](#18-cnas--siui)
19. [Model Selection](#19-model-selection)
20. [Health Checks](#20-health-checks)
21. [Structură API Endpoints](#21-structură-api-endpoints)
22. [Configurare Aplicație — appsettings.json](#22-configurare-aplicație)
23. [Biblioteca de Referință — Fișiere Model](#23-biblioteca-de-referință)
24. [Consistență UI — Reguli Obligatorii](#24-consistență-ui)
25. [Rutina de Final de Zi — EOD & GitHub](#25-rutina-de-final-de-zi)

---

## 1. CONTEXT MEDICAL

### 1.1 Module funcționale

| Modul | Descriere | Entități principale |
|-------|-----------|--------------------|
| **Pacienți** | Registru pacienți, fișe medicale, istoric | `Patient`, `PatientFile`, `MedicalHistory` |
| **Programări** | Calendar, programări, liste de așteptare | `Appointment`, `Schedule`, `WaitingList` |
| **Consultații** | Consultații curente, examen clinic, diagnostic | `Consultation`, `ClinicalExam`, `Diagnosis` |
| **Rețete** | Prescripții medicale, medicamente | `Prescription`, `PrescriptionItem`, `Medication` |
| **Documente** | Scrisori medicale, trimiteri, concedii medicale | `MedicalDocument`, `Referral`, `MedicalLeave` |
| **Facturi & Plăți** | Facturare servicii, încasări, rapoarte financiare | `Invoice`, `InvoiceItem`, `Payment` |
| **Rapoarte** | Rapoarte medicale, statistici, export CNAS | `Report`, `Statistic` |
| **Nomenclatoare** | ICD-10, proceduri, servicii medicale | `Icd10Code`, `MedicalService`, `Procedure` |

### 1.2 Roluri utilizatori

| Rol | Permisiuni |
|-----|------------|
| `Admin` | Acces complet, configurare sistem, gestiune utilizatori |
| `Doctor` | Consultații, prescripții, documente, vizualizare programări proprii |
| `Nurse` | Triaj, semne vitale, asistență consultații |
| `Receptionist` | Programări, registru pacienți, documente administrative |
| `ClinicManager` | Rapoarte, statistici, configurare clinică |

### 1.3 Reguli de business medicale
- **Multi-tenancy** — `ClinicId (UNIQUEIDENTIFIER)` există pe TOATE tabelele principale. Fiecare SP filtrează implicit `AND t.ClinicId = @ClinicId`. Niciodată date dintr-o clinică nu sunt vizibile altei clinici. `ClinicId` vine din JWT claim și e injectat automat prin `ICurrentUser`
- **Multi-specialitate** — Specialty este o entitate configurabilă; niciun comportament nu e hardcodat pentru o specialitate anume
- **CNP** — validare format 13 cifre, extracție dată naștere și sex
- **CID** — codul de identificare doctor / parafa medicală
- **ICD-10** — coduri internaționale pentru diagnostice
- **Reținere date** — datele medicale se păstrează minim 10 ani (legislație RO)
- **Soft delete obligatoriu** — datele medicale nu se șterg niciodată fizic
- **Concurrency control** — `RowVersion (ROWVERSION / TIMESTAMP)` pe tabelele critice (Patients, Consultations, Appointments, Invoices). SP-urile de UPDATE verifică `RowVersion` și aruncă eroare dacă altcineva a modificat între timp
- **Audit complet** — orice modificare pe date medicale e logată (cine, când, ce s-a schimbat)
- **Confidențialitate** — date cu caracter personal special (GDPR Art. 9) — acces strict pe bază de rol
- **Nu se logează date sensibile** — niciodată CNP, diagnostic, date pacient în loguri

---

## 2. STIVA TEHNOLOGICĂ

### Backend
- **.NET 10** (C# latest, implicit usings, file-scoped namespaces, primary constructors)
- **ASP.NET Core** — Controllers pentru API (Minimal APIs opțional pentru endpoints simple)
- **Dapper** (micro ORM) — fără Entity Framework; **exclusiv Stored Procedures**
- **SQL Server** — toate operațiile DB prin SP-uri, fără SQL inline în C#
- **FluentValidation** pentru validare comenzi/query-uri
- **MediatR** pentru CQRS / vertical slices
- **Mapster** sau **Mapperly** pentru mapping (source-generated, zero reflection)
- **Serilog** pentru logging structurat (cu Correlation ID)
- **JWT + Refresh Tokens** pentru autentificare/autorizare
- **DbUp** pentru migrări/versionare scripturi SQL
- **QuestPDF** pentru generare documente PDF (rețete, trimiteri, concedii)

### Frontend
- **React 18+** cu **TypeScript** strict (`strict: true` în tsconfig)
- **Vite** ca build tool
- **Syncfusion React Components** — tema **Bootstrap 5** a Syncfusion
- **Bootstrap 5** pentru layout și utilități CSS
- **SCSS** cu CSS Modules per componentă
- **TanStack Query v5** pentru server state (fetch, cache, invalidare)
- **Zustand** pentru client state global (auth, UI preferences)
- **React Hook Form** + **Zod** pentru formulare și validare client-side
- **React Router v6+** pentru rutare cu lazy loading
- **Axios** pentru HTTP client (interceptori pentru JWT + refresh + Correlation ID)

### Stack Versiuni

```
.NET 10
ASP.NET Core 10
Dapper 2.1+
MediatR 12+
FluentValidation 11+
DbUp 5+
QuestPDF 2024+
Serilog 3+

React 18+
TypeScript 5+
Vite 5+
TanStack Query 5+
React Router 6+
React Hook Form 7+
Zod 3+
Axios 1.6+
Bootstrap 5+
Syncfusion EJ2 React (Bootstrap 5 theme)
Zustand 4+
```

---

## 3. ARHITECTURĂ

### 3.1 Structură Backend (Solution)

```
src/
├── ValyanClinic.Domain/
│   ├── Entities/              # Patient, Appointment, Consultation, Invoice, etc.
│   ├── ValueObjects/          # Cnp, PhoneNumber, Email, Address, Money
│   ├── Enums/                 # AppointmentStatus, Gender, BloodType, InvoiceStatus
│   ├── Exceptions/
│   └── Interfaces/            # Contracte repository (IRepository<T>)
│
├── ValyanClinic.Application/
│   ├── Common/
│   │   ├── Behaviors/         # MediatR pipeline: ValidationBehavior, LoggingBehavior, AuditBehavior
│   │   ├── Interfaces/        # ICurrentUser, IDateTimeProvider, IAuditService, IPdfGenerator
│   │   ├── Models/            # Result<T>, PagedResult<T>, ApiResponse<T>
│   │   └── Mappings/          # Profile-uri Mapster/Mapperly
│   │
│   └── Features/              # ← VERTICAL SLICES
│       ├── Patients/
│       │   ├── Commands/
│       │   │   ├── CreatePatient/
│       │   │   │   ├── CreatePatientCommand.cs
│       │   │   │   ├── CreatePatientCommandHandler.cs
│       │   │   │   └── CreatePatientCommandValidator.cs
│       │   │   └── UpdatePatient/
│       │   │       ├── UpdatePatientCommand.cs
│       │   │       ├── UpdatePatientCommandHandler.cs
│       │   │       └── UpdatePatientCommandValidator.cs
│       │   ├── Queries/
│       │   │   ├── GetPatientById/
│       │   │   │   ├── GetPatientByIdQuery.cs
│       │   │   │   ├── GetPatientByIdQueryHandler.cs
│       │   │   │   └── PatientDetailDto.cs
│       │   │   └── GetPatients/
│       │   │       ├── GetPatientsQuery.cs
│       │   │       ├── GetPatientsQueryHandler.cs
│       │   │       └── PatientListDto.cs
│       │   └── EventHandlers/
│       │
│       ├── Appointments/
│       ├── Consultations/
│       ├── Prescriptions/
│       ├── MedicalDocuments/
│       ├── Invoices/
│       ├── Payments/
│       └── Auth/
│           ├── Commands/      # Login, RefreshToken, Logout
│           └── Queries/
│
├── ValyanClinic.Infrastructure/
│   ├── Data/
│   │   ├── DapperContext.cs           # IDbConnection factory
│   │   ├── Repositories/             # Implementări cu Dapper (apel SP-uri)
│   │   ├── StoredProcedures/         # Constante cu numele SP-urilor per entitate
│   │   └── Scripts/                  # Scripturi SQL gestionate de DbUp
│   │       ├── 0001_InitialSchema.sql
│   │       ├── 0002_SeedNomenclature.sql
│   │       └── StoredProcedures/     # CREATE OR ALTER PROCEDURE scripts
│   ├── Authentication/               # JWT, TokenService, RefreshTokenService
│   ├── Services/                     # PdfGeneratorService (QuestPDF), EmailService
│   ├── Audit/                        # AuditTrail — logare modificări date medicale
│   └── DependencyInjection.cs
│
├── ValyanClinic.API/
│   ├── Controllers/
│   ├── Middleware/            # ExceptionHandler, CorrelationId
│   ├── Filters/
│   └── Program.cs
│
└── ValyanClinic.Shared/
    ├── Constants/
    └── Extensions/
```

### 3.2 Structură Frontend

```
client/
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts           # Axios + interceptori JWT + CorrelationId
│   │   └── endpoints/
│   │       ├── patients.api.ts
│   │       ├── appointments.api.ts
│   │       ├── consultations.api.ts
│   │       ├── invoices.api.ts
│   │       ├── payments.api.ts
│   │       ├── prescriptions.api.ts
│   │       └── auth.api.ts
│   │
│   ├── assets/
│   │
│   ├── components/                    # Componente REUTILIZABILE globale
│   │   ├── ui/                        # AppButton, AppCard, AppModal, AppBadge
│   │   ├── layout/                    # Header, Sidebar, MainLayout, PageHeader
│   │   ├── forms/                     # FormInput, FormSelect, FormDatePicker (wrappere Syncfusion)
│   │   └── data-display/             # AppDataGrid, AppPivotGrid, AppSchedule, Pagination
│   │
│   ├── features/                      # Feature modules (vertical slices)
│   │   ├── patients/
│   │   │   ├── components/           # PatientCard, PatientHistory
│   │   │   ├── hooks/                # usePatients, usePatient, useCreatePatient
│   │   │   ├── pages/                # PatientsListPage, PatientDetailPage
│   │   │   ├── schemas/              # patient.schema.ts (Zod)
│   │   │   ├── types/                # patient.types.ts
│   │   │   └── index.ts
│   │   ├── appointments/
│   │   │   ├── components/           # AppointmentCalendar, TimeSlotPicker
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── consultations/
│   │   ├── prescriptions/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── dashboard/
│   │       ├── components/           # Widgeturi: programări azi, pacienți noi, statistici
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── index.ts
│   │
│   ├── hooks/                        # useAuth, useDebounce, useLocalStorage
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── styles/
│   │   ├── _variables.scss           # Variabile SCSS (culori, spațiere, tipografie)
│   │   ├── _theme.scss               # Override-uri Bootstrap 5
│   │   ├── _mixins.scss
│   │   ├── _typography.scss
│   │   ├── _utilities.scss
│   │   ├── _syncfusion.scss          # Override-uri globale Syncfusion
│   │   └── main.scss                 # Entry point
│   │
│   ├── utils/                        # formatDate, formatCurrency, cn(), cnpUtils
│   ├── types/                        # Tipuri TypeScript globale
│   ├── constants/
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 3.3 Principii arhitectură — Reguli stricte
- **Domain** nu referențiază nimic din Application sau Infrastructure
- **Application** referențiază doar Domain și Shared
- **Infrastructure** referențiază Application (interfaces) și Domain
- **API** referențiază Application și Infrastructure (doar în DI registration)
- Niciodată Infrastructure în Controllers — totul prin MediatR
- Un handler = o responsabilitate — nu combina comenzi în același handler
- Queries returnează DTOs, **nu entități Domain**
- Commands returnează `Result<T>` — nu throw exceptions pentru business logic

---

## 4. TEMA APLICAȚIEI — Albastru Pastel

### 4.0 Locale & Formatare — România

**Toate datele și sumele se formatează conform standardului românesc:**

```ts
// utils/format.ts — utilitare globale de formatare

// Dată: dd.MM.yyyy
export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

// Dată + oră: dd.MM.yyyy HH:mm
export const formatDateTime = (date: string | Date) =>
  new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

// Monedă RON: 1.234,56 RON
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(amount);

// Număr: 1.234,56
export const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
```

```tsx
// Syncfusion locale — setat global în main.tsx
import { loadCldr, L10n, setCulture, setCurrencyCode } from '@syncfusion/ej2-base';
setCulture('ro');
setCurrencyCode('RON');
// Syncfusion DataGrid, DatePicker, NumericTextBox vor folosi automat formatul românesc
```

```csharp
// C# — CultureInfo Romania pentru formatare server-side (PDF-uri, rapoarte)
// Program.cs
var roCulture = new CultureInfo("ro-RO");
CultureInfo.DefaultThreadCurrentCulture = roCulture;
CultureInfo.DefaultThreadCurrentUICulture = roCulture;

// Formatare explicită în cod când e nevoie
amount.ToString("C", roCulture);           // 1.234,56 RON
date.ToString("dd.MM.yyyy", roCulture);    // 15.03.2025
```

---

### 4.1 Paleta de culori

```scss
// src/styles/_variables.scss
// Notă: Albastru pastel principal — contrast bun, aspect medical profesional

// Culori primare
$primary:          #5B8DB8;    // Albastru pastel — butoane, accente
$primary-light:    #7DA8CC;    // Hover, fundal subtil
$primary-lighter:  #A8C8E0;    // Fundal carduri, secțiuni
$primary-dark:     #3A6F99;    // Text pe fundal deschis, active states
$primary-darker:   #2A5578;    // Headere, emphasis

// Culori secundare
$secondary:        #6C8EAD;    // Albastru-gri complementar
$accent:           #E8A87C;    // Accent cald — CTA, notificări importante
$success:          #7BC8A4;    // Verde pastel
$warning:          #F0C76E;    // Galben pastel
$danger:           #D98B8B;    // Roșu pastel
$info:             #7CB8D4;    // Albastru info

// Neutrale
$gray-50:          #F8FAFB;
$gray-100:         #F0F4F7;
$gray-200:         #E2E8ED;    // Borduri
$gray-300:         #C9D3DC;    // Borduri active
$gray-400:         #9EADB9;    // Text placeholder
$gray-500:         #6E8090;    // Text secundar
$gray-600:         #4A5E6D;    // Text normal
$gray-700:         #2D3E4A;    // Text headere
$gray-800:         #1A2A35;    // Text emphasis

// Fundaluri
$body-bg:          #F4F7FA;
$card-bg:          #FFFFFF;
$sidebar-bg:       #2A3F52;    // Sidebar întunecat pentru contrast

// Override-uri Bootstrap 5
$theme-colors: (
  "primary":   $primary,
  "secondary": $secondary,
  "success":   $success,
  "info":      $info,
  "warning":   $warning,
  "danger":    $danger
);
```

### 4.2 Configurare Bootstrap 5

```scss
// src/styles/_theme.scss
@import "variables";

$enable-rounded: true;
$border-radius:    0.5rem;
$border-radius-sm: 0.375rem;
$border-radius-lg: 0.75rem;

$font-family-sans-serif: 'Inter', 'Segoe UI', system-ui, sans-serif;
$font-size-base: 0.9375rem;
$line-height-base: 1.5;

$box-shadow-sm: 0 1px 3px rgba(42, 63, 82, 0.08);
$box-shadow:    0 2px 8px rgba(42, 63, 82, 0.1);
$box-shadow-lg: 0 8px 24px rgba(42, 63, 82, 0.12);

@import "~bootstrap/scss/bootstrap";
```

### 4.3 Override Syncfusion Bootstrap 5 Theme

```scss
// src/styles/_syncfusion.scss
@import "variables";

:root {
  --color-sf-primary: #{$primary};
  --color-sf-primary-light: #{$primary-light};
}

.e-grid {
  border-radius: $border-radius;
  box-shadow: $box-shadow-sm;

  .e-headercell {
    background-color: $primary-darker;
    color: #fff;
  }

  .e-row:hover {
    background-color: rgba($primary-lighter, 0.3);
  }

  // Frozen right column — fundal solid (altfel e transparent la scroll)
  // Clasele Syncfusion pe celulele frozen right: e-rowcell e-templatecell e-rightfreeze e-freezerightborder
  td.e-rowcell.e-rightfreeze.e-freezerightborder {
    background-color: $card-bg !important;
  }

  .e-row:hover td.e-rowcell.e-rightfreeze.e-freezerightborder {
    background-color: rgba($primary-lighter, 0.3) !important;
  }

  .e-altrow td.e-rowcell.e-rightfreeze.e-freezerightborder {
    background-color: #f8f9fa !important;
  }

  .e-altrow:hover td.e-rowcell.e-rightfreeze.e-freezerightborder {
    background-color: rgba($primary-lighter, 0.3) !important;
  }
}

.e-btn.e-primary {
  background-color: $primary;
  border-color: $primary;
  &:hover { background-color: $primary-dark; border-color: $primary-dark; }
}
```

---

## 5. CONVENȚII BACKEND C#

> **Skill complet**: `.github/skills/be-dotnet/SKILL.md` — se încarcă automat când lucrezi la cod BE C#.

**Principii cheie:**
- Un fișier `.cs` = o singură clasă. Fără diacritice în identificatori C# (permise doar în comentarii și string-uri UI)
- **MediatR CQRS** — Commands/Queries/Handlers în `Features/[Entity]/Commands|Queries/[Action]/`
- **Result<T> pattern** — toate handler-ele returnează `Result<T>`, niciodată throw pentru erori business
- **Dapper + Stored Procedures exclusiv** — fără EF, fără SQL inline. SP constants în `Infrastructure/Data/StoredProcedures/`
- **FluentValidation** — validator în același folder cu Command-ul; înregistrat prin assembly scan
- **SqlException mapping** — erori SP din range 50000–59999 prinse în handler → `Result.Conflict` / `Result.Failure`
- **BaseApiController** + `HandleResult(result)` → mapează automat `Result<T>` la HTTP status codes
- **Multi-tenancy obligatoriu** — `ClinicId` pe orice entitate și orice apel repository; vine din `ICurrentUser`
- **Toate PKs sunt Guid** — `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`, niciodată `int`

---
## 6. CONVENȚII FRONTEND REACT + TYPESCRIPT

> **Skill complet**: `.github/skills/fe-react/SKILL.md` — se încarcă automat când lucrezi la cod FE React/TS.

**Principii cheie:**
- Componentă complexă = director propriu cu `Component.tsx` + `Component.module.scss` + `Component.types.ts` + `index.ts`
- **CSS**: Bootstrap 5 pentru layout/spațiere; CSS Modules pentru stiluri specifice componentei
- **Syncfusion** — întotdeauna wrapped; niciodată `<GridComponent>` direct → obligatoriu `<AppDataGrid>`
- **AppDataGrid**: `toolbar={['ColumnChooser']}` nativ, 13 servicii injectate, coloane ca children, sort prin prop `sortSettings`
- **headerText**: Prima literă mare, rest mici (`"Pacient"`, nu `"PACIENT"`). Excepții: acronime (`CNP`, `CUI`, `Nr. CMR`)
- **React Hook Form + Zod**: Schema în `features/[feature]/schemas/`; tipuri derivate cu `z.infer<>`, niciodată duplicate manual
- **TanStack Query v5**: Tot server state prin hooks; query keys ierarhice în factory object `[entity]Keys`
- **Zustand**: Auth token în `sessionStorage` (nu `localStorage`). Nomenclatoare din API, niciodată hardcodate în FE
- **Scroll**: Fiecare pagină cu scroll declară propriul `height: 100%; overflow-y: auto` în SCSS

---
## 7. AUTENTIFICARE & AUTORIZARE

- **Access Token** — JWT, expiră în 15 minute, stocat în Zustand (sessionStorage)
- **Refresh Token** — expiră în 7 zile, stocat în **HttpOnly Secure Cookie**
- Rotație automată a refresh token-urilor la fiecare reînnoire
- Claims JWT standard: `sub`, `email`, `role`, `jti`, `clinicId`
- **Password hashing** — **BCrypt.Net-Next** (NuGet: `BCrypt.Net-Next`) cu work factor configurat din `appsettings.json` (`Security:BcryptWorkFactor`). Folosire: `BCrypt.Net.BCrypt.EnhancedHashPassword(password, workFactor)` / `BCrypt.Net.BCrypt.EnhancedVerify(password, hash)`

### ICurrentUser — contract obligatoriu în Application layer

```csharp
// Application/Common/Interfaces/ICurrentUser.cs
public interface ICurrentUser
{
    Guid Id { get; }
    Guid ClinicId { get; }
    string Email { get; }
    string FullName { get; }
    string Role { get; }
    bool IsInRole(string role);
}

// Infrastructure/Authentication/CurrentUser.cs
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal User => httpContextAccessor.HttpContext?.User
        ?? throw new UnauthorizedAccessException("Utilizator neautentificat.");

    public Guid Id => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public Guid ClinicId => Guid.Parse(User.FindFirstValue("clinicId")!);
    public string Email => User.FindFirstValue(ClaimTypes.Email)!;
    public string FullName => User.FindFirstValue("fullName")!;
    public string Role => User.FindFirstValue(ClaimTypes.Role)!;
    public bool IsInRole(string role) => User.IsInRole(role);
}
```

### Authorization Policies

```csharp
// Program.cs — politici de autorizare bazate pe roluri
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Admin));
    options.AddPolicy("DoctorOrAdmin", policy => policy.RequireRole(Roles.Admin, Roles.Doctor));
    options.AddPolicy("MedicalStaff", policy => policy.RequireRole(Roles.Admin, Roles.Doctor, Roles.Nurse));
    options.AddPolicy("CanManagePatients", policy =>
        policy.RequireRole(Roles.Admin, Roles.Doctor, Roles.Nurse, Roles.Receptionist));
});

// Folosire pe controller/endpoint
[Authorize(Policy = "DoctorOrAdmin")]
[HttpPost]
public async Task<IActionResult> CreateConsultation(...) { ... }

[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id:guid}")]
public async Task<IActionResult> DeleteUser(...) { ... }
```

### Axios Interceptori — Request + Response + 401 Retry

```ts
// api/axiosInstance.ts
import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,   // Trimite HttpOnly cookie cu refresh token
});

// Request interceptor — adaugă Bearer token + Correlation ID
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Correlation ID pentru tracing (dacă nu vine din upstream)
  if (!config.headers['X-Correlation-Id']) {
    config.headers['X-Correlation-Id'] = uuidv4();
  }
  return config;
});

// Response interceptor — refresh automat la 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response.data,  // Returnează direct data, nu AxiosResponse
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Pune requestul în coadă până se termină refresh-ul
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token vine din HttpOnly cookie automat (withCredentials: true)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        useAuthStore.getState().setAuth(data.user, data.accessToken);

        // Reia toate requesturile din coadă
        refreshQueue.forEach((callback) => callback(data.accessToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        refreshQueue = [];
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Parsare eroare API pentru afișare în UI
    const apiError = (error.response?.data as any)?.message ?? 'A apărut o eroare neașteptată.';
    return Promise.reject(new Error(apiError));
  }
);

export default api;
```

---

## 8. MIGRĂRI BAZĂ DE DATE — DbUp

> **Skill complet**: `.github/skills/sql-sqlserver/SKILL.md` (Step 10) — detalii despre migrări, SP-uri, reguli SQL.

**DbUp** rulează scripturi SQL în ordine, le trackează în `SchemaVersions`, idempotent by design (fără EF Migrations).

**Structura:**
- `Scripts/Migrations/` — fișiere `NNNN_Descriere.sql` — rulează o singură dată, **nu se modifică** după deploy în producție
- `Scripts/StoredProcedures/` — `CREATE OR ALTER PROCEDURE` — re-rulate la fiecare deploy

**Reguli:** `IF NOT EXISTS` pentru idempotență; fișiere UTF-8; `sqlcmd -f 65001` pentru diacritice în seed data.

---
## 9. SCHEMA BAZĂ DE DATE

> **Skill complet**: `.github/skills/sql-sqlserver/SKILL.md` (Step 13) — schema completă cu toate tabelele și tipurile de coloane.

**Reguli globale:** Toate PKs = `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`. Toate tabelele principale au:
`ClinicId` (multi-tenancy), `IsDeleted BIT DEFAULT 0` (soft delete), `RowVersion ROWVERSION` (entități critice),
`CreatedAt DATETIME2 DEFAULT GETDATE()`, `CreatedBy UNIQUEIDENTIFIER`.

**Tabele principale:** Clinics, Users, Roles, RefreshTokens, Patients, Doctors, DoctorSchedules,
Appointments, Consultations, Prescriptions, PrescriptionItems, MedicalDocuments,
Invoices, InvoiceItems, Payments, MedicalFiles, AuditLog, CnasReports.

**Nomenclatoare** (Id, Name, Code, IsActive): Genders, BloodTypes, AppointmentStatuses, InvoiceStatuses,
PaymentMethods, DocumentTypes, Specialties, ServiceCategories, Medications, ICD10Codes,
MedicalServices, CnasReportStatuses.

---
## 10. STOCARE FIȘIERE MEDICALE

Documente scanate, rezultate analize, imagini medicale — stocate pe **filesystem local** (dev + producție single-server). Arhitectura e abstractizată prin interfață — poate fi înlocuită cu Azure Blob Storage fără modificări în Application layer.

```csharp
// Application/Common/Interfaces/IFileStorageService.cs
public interface IFileStorageService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string folder, CancellationToken ct);
    Task<Stream> GetAsync(string filePath, CancellationToken ct);
    Task DeleteAsync(string filePath, CancellationToken ct);
    string GetPublicUrl(string filePath);
}

// Infrastructure/Services/LocalFileStorageService.cs
public sealed class LocalFileStorageService(IOptions<StorageOptions> options) : IFileStorageService
{
    private readonly string _basePath = options.Value.BasePath;  // din appsettings.json

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string folder, CancellationToken ct)
    {
        // Organizare: /storage/{clinicId}/{folder}/{year}/{month}/{guid}_{fileName}
        var relativePath = Path.Combine(folder, DateTime.UtcNow.Year.ToString(),
            DateTime.UtcNow.Month.ToString("D2"), $"{Guid.NewGuid()}_{fileName}");
        var fullPath = Path.Combine(_basePath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs, ct);

        return relativePath;  // stocat în DB, nu path-ul absolut
    }
}

// Configurare Storage → vezi Secțiunea 22.1 (appsettings.json complet)
```

```sql
-- MedicalFiles — fișiere atașate la consultații, pacienți, documente
CREATE TABLE MedicalFiles (
    Id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    ClinicId       UNIQUEIDENTIFIER NOT NULL,
    EntityType     NVARCHAR(50)     NOT NULL,   -- 'Consultation', 'Patient', 'Prescription'
    EntityId       UNIQUEIDENTIFIER NOT NULL,
    FileName       NVARCHAR(255)    NOT NULL,   -- numele original
    StoragePath    NVARCHAR(500)    NOT NULL,   -- calea relativă în storage
    ContentType    NVARCHAR(100)    NOT NULL,   -- 'application/pdf', 'image/jpeg'
    FileSizeBytes  BIGINT           NOT NULL,
    IsDeleted      BIT              NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2        NOT NULL DEFAULT GETDATE(),
    CreatedBy      UNIQUEIDENTIFIER NOT NULL
);
```

---

## 11. GENERARE DOCUMENTE PDF — QuestPDF

**QuestPDF** pentru generare rețete, trimiteri medicale, concedii, facturi.

```csharp
// Application/Common/Interfaces/IPdfGenerator.cs
public interface IPdfGenerator
{
    byte[] GeneratePrescription(PrescriptionPdfModel model);
    byte[] GenerateReferral(ReferralPdfModel model);
    byte[] GenerateInvoice(InvoicePdfModel model);
    byte[] GenerateMedicalLeave(MedicalLeavePdfModel model);
}

// Infrastructure/Services/PdfGeneratorService.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public sealed class PdfGeneratorService : IPdfGenerator
{
    public byte[] GeneratePrescription(PrescriptionPdfModel model)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("REȚETĂ MEDICALĂ")
                        .Bold().FontSize(16).AlignCenter();
                    col.Item().PaddingTop(4).LineHorizontal(1);
                });

                page.Content().PaddingTop(16).Column(col =>
                {
                    // Date medic
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text($"Dr. {model.DoctorName}").Bold();
                        row.RelativeItem().Text($"Parafa: {model.DoctorCode}").AlignRight();
                    });

                    col.Item().PaddingTop(8).Text($"Pacient: {model.PatientName}");
                    col.Item().Text($"CNP: {model.PatientCnp}");
                    col.Item().Text($"Data: {model.PrescriptionDate:dd.MM.yyyy}");

                    col.Item().PaddingTop(12).Text("Medicamente prescrise:").Bold();

                    foreach (var item in model.Items)
                    {
                        col.Item().PaddingTop(4).Text($"• {item.MedicationName}");
                        col.Item().PaddingLeft(12).Text($"  {item.Dosage} — {item.Frequency} — {item.Duration}");
                    }
                });

                page.Footer().AlignRight()
                    .Text($"Pagina {page.CurrentPageNumber}/{page.TotalPages}");
            });
        }).GeneratePdf();
    }

    public byte[] GenerateInvoice(InvoicePdfModel model)
    {
        // Implementare similară pentru factură
        throw new NotImplementedException();
    }
}

// Controller — returnează PDF pentru download/print
[HttpGet("{id:guid}/pdf")]
public async Task<IActionResult> GetPrescriptionPdf(Guid id, CancellationToken ct)
{
    var query = new GetPrescriptionPdfQuery(id);
    var result = await Mediator.Send(query, ct);

    if (!result.IsSuccess)
        return NotFound();

    return File(result.Value!, "application/pdf", $"reteta_{id}.pdf");
}
```

---

## 12. CORRELATION ID & REQUEST TRACING

Fiecare request primește un `X-Correlation-Id` propagat de la React → Axios → ASP.NET → Serilog → AuditLog.

### Backend — Middleware

```csharp
// API/Middleware/CorrelationIdMiddleware.cs
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        // Push în Serilog LogContext pentru toate log-urile din request
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}

// Program.cs
app.UseMiddleware<CorrelationIdMiddleware>();

// Serilog output template — include CorrelationId
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}")
    .CreateLogger();
```

### Frontend — Axios

```ts
// api/axiosInstance.ts — adaugă CorrelationId la fiecare request
import { v4 as uuidv4 } from 'uuid';

api.interceptors.request.use((config) => {
  config.headers['X-Correlation-Id'] = uuidv4();
  return config;
});
```

### AuditLog — include CorrelationId

```csharp
// Infrastructure/Audit/AuditService.cs
public sealed class AuditService(DapperContext context, IHttpContextAccessor httpContextAccessor)
    : IAuditService
{
    public async Task LogAsync(AuditEntry entry, CancellationToken ct)
    {
        var correlationId = httpContextAccessor.HttpContext?.Items["CorrelationId"]?.ToString();

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.AuditLog_Create",
                new
                {
                    entry.EntityName, entry.EntityId, entry.Action,
                    entry.OldValues, entry.NewValues,
                    entry.UserId, entry.UserEmail,
                    CorrelationId = correlationId
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
```

---

## 13. MANAGEMENT ERORI

### Backend — Global Exception Handler

```csharp
// API/Middleware/GlobalExceptionHandlerMiddleware.cs
public sealed class GlobalExceptionHandlerMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "N/A";
            logger.LogError(ex, "Eroare neașteptată. CorrelationId: {CorrelationId}", correlationId);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiResponse<object>(
                Success: false,
                Data: null,
                Message: "A apărut o eroare internă. Contactați administratorul.",
                Errors: null));
        }
    }
}
```

### Frontend — Error Boundary + Toast

```tsx
// App.tsx — Error boundary la nivel global
// Erori API → Toast notification Syncfusion (eroarea vine din Axios interceptor)
// Erori React → ErrorBoundary cu fallback UI
// Erori rețea → TanStack Query retry: 3 (default)

// hooks/useApiError.ts
import { useCallback } from 'react';
import { ToastUtility } from '@syncfusion/ej2-notifications';

export const useApiError = () => {
  const showError = useCallback((message: string) => {
    ToastUtility.show({
      title: 'Eroare',
      content: message,
      cssClass: 'e-toast-danger',
      position: { X: 'Right', Y: 'Top' },
      timeOut: 5000,
    });
  }, []);

  return { showError };
};
```

---

## 14. PERFORMANȚĂ & SECURITATE

### Performanță
- **React.lazy** + code splitting per rută — obligatoriu
- **TanStack Query** — `staleTime: 5min` default, `placeholderData: keepPreviousData` pe liste paginate
- **Paginare server-side** — niciodată `SELECT *` fără LIMIT în SP
- **Dapper** — `QueryMultiple` pentru SP-uri cu multiple result sets, evită N+1
- **Virtual scrolling** Syncfusion DataGrid — activat pentru > 100 rânduri
- **Response compression** activat în ASP.NET Core
- **Indecși SQL** — pe toate coloanele din WHERE, JOIN, ORDER BY

### Securitate
- **CORS** configurat strict — doar originea frontend-ului
- **Rate limiting** pe endpoints sensibile (`/api/auth/login`, `/api/auth/register`)
- **HTTPS only** în producție
- **Refresh Token** — HttpOnly Secure Cookie (nu accesibil din JavaScript)
- **Access Token** — sessionStorage via Zustand (nu localStorage)
- **Niciodată** date sensibile (CNP, diagnostic, token) în URL parameters
- **GDPR Art. 9** — date medicale = acces strict pe bază de rol
- **Nu se logează** CNP, diagnostic, date pacient în Serilog
- **Audit obligatoriu** — orice INSERT/UPDATE/DELETE pe date medicale

---

## 15. TESTARE

### Backend
- **xUnit** + **FluentAssertions** + **NSubstitute**
- Teste unitare pentru: Handlers, Validators, Services
- Teste integrare pentru: Repository-uri (cu DB de test), Endpoints
- Naming: `MetodaTestata_ScenariuTestat_RezultatAsteptat`
- Exemplu: `Handle_ValidCommand_ReturnsSuccessWithPatientId`
- Exemplu: `Handle_DuplicateCnp_ReturnsConflictResult`

### Frontend
- **Vitest** + **React Testing Library**
- Teste pentru: componente reutilizabile, custom hooks, Zod schemas, utils
- Naming: `should [verb] when [condiție]`
- Exemplu: `"should display error message when CNP is invalid"`
- Exemplu: `"should invalidate patient list cache after successful create"`

---

## 16. REGULI GENERALE DE GENERARE COD

### Backend
1. O clasă per fișier — întotdeauna
2. `sealed class` / `sealed record` by default (performanță + intenție)
3. Primary constructors pentru DI
4. Records pentru DTOs — imutabile
5. File-scoped namespaces
6. Nullable reference types activat
7. `CancellationToken` propagat în toate metodele async
8. Exclusiv Stored Procedures — `CommandType.StoredProcedure` obligatoriu
9. Nu se aruncă excepții ca flow control — `Result<T>` mereu
10. Soft delete — `IsDeleted` flag, nu DELETE fizic
11. Audit columns pe toate entitățile — `CreatedAt, CreatedBy, UpdatedAt, UpdatedBy`
12. Paginare server-side — niciodată `SELECT *` fără LIMIT
13. Nu se expune niciodată entitatea Domain direct — mereu DTO

### Frontend
1. TypeScript strict — niciodată `any` (folosim `unknown` + type guards)
2. Functional components — niciodată class components
3. Named exports — nu default exports
4. Barrel exports în fiecare director major (`index.ts`)
5. Lazy loading pentru pagini
6. `useMemo`/`useCallback` — doar când e nevoie demonstrată, nu prematur
7. Error boundaries la nivel de feature și global
8. Loading states — skeleton screens sau Syncfusion Spinner
9. Prefix `App` pentru componente UI custom — `AppButton`, `AppDataGrid`
10. Hook custom per operație API — `usePatients()`, `useCreatePatient()`
11. Formular = React Hook Form + Zod schema — mereu
12. CSS: Bootstrap 5 utilities pentru layout, CSS Modules pentru stiluri specifice
13. Niciodată CSS inline (excepție: valori dinamice calculate)
14. Variabilele temei din `_variables.scss` — niciodată culori hardcodate
15. **Consistență UI obligatorie** — toate paginile de același tip arată identic (vezi secțiunea 24)

---

## 17. INSTRUCȚIUNI SPECIFICE PENTRU CLAUDE

### Rutina Post-Modificare — OBLIGATORIE (execută automat după ORICE schimbare de cod)

După orice modificare de cod (backend C# sau frontend TypeScript/React), execuți **automat și în ordine** pașii următori, fără a aștepta instrucțiuni suplimentare de la utilizator:

**Pasul 1 — Oprire procese (ÎNTOTDEAUNA primul pas)**
```powershell
# Oprire API
Get-Process -Name "ValyanClinic.API" -ErrorAction SilentlyContinue | Stop-Process -Force
# Oprire dev server Vite (dacă rulează)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "vite" -or $_.CommandLine -match "vite" } | Stop-Process -Force -ErrorAction SilentlyContinue
```

**Pasul 2 — Verificare build .NET (dacă s-au modificat fișiere backend)**
```powershell
cd "d:\Lucru\CMS\CMS"
dotnet build --no-restore -q 2>&1 | Select-Object -Last 20
```

**Pasul 3 — Verificare erori TypeScript (dacă s-au modificat fișiere frontend)**
```powershell
cd "d:\Lucru\CMS\CMS\client"
npm run build 2>&1 | Select-Object -Last 20
```

**Pasul 4 — Rulare teste (unit + integration BE + unit FE + E2E)**
```powershell
# Backend — unit tests (145)
cd "d:\Lucru\CMS\CMS"
dotnet test tests/ValyanClinic.Tests/ValyanClinic.Tests.csproj -q 2>&1 | Select-Object -Last 3
# Backend — integration tests (62)
dotnet test tests/ValyanClinic.IntegrationTests/ValyanClinic.IntegrationTests.csproj -q 2>&1 | Select-Object -Last 3
# Frontend — unit tests Vitest (202)
cd "d:\Lucru\CMS\CMS\client"
npm run test:unit 2>&1 | Select-Object -Last 5
# E2E — Playwright (necesită BE pornit)
# Pornire API în background pentru E2E
Start-Process -FilePath "dotnet" -ArgumentList "run --project d:\Lucru\CMS\CMS\src\ValyanClinic.API\ValyanClinic.API.csproj --urls http://localhost:5008" -WindowStyle Minimized
Start-Sleep -Seconds 12   # așteaptă pornirea API (~10-12s)
# Playwright pornește FE automat (webServer în config), rulează spec-urile
npm run test:e2e 2>&1 | Select-Object -Last 10
# Total așteptat: 145 + 62 BE + 202 FE unit + E2E specs
```
> Dacă API-ul e deja pornit (pasul 6 anterior), omite Start-Process și Start-Sleep.

**Pasul 5 — Commit și push pe GitHub**
```powershell
cd "d:\Lucru\CMS\CMS"
git add -A
git commit -m "<tip>: <descriere concisă în engleză>"
git push origin main
```

**Pasul 6 — Repornire aplicație (când modificările o necesită)**

> **Când repornești BE (API)?** — la orice modificare C# (repository, handler, controller, DI, configurare, migrare SQL)
> **Când repornești FE (dev server)?** — când rulează în mod dev (`vite`); dacă utilizatorul testează în browser cu `npm run dev`
> **Când NU repornești?** — modificări doar de CSS/SCSS/fișiere statice cu HMR activ (Vite le aplică live fără restart)

```powershell
# Repornire API (backend) — rulează în background
cd "d:\Lucru\CMS\CMS\src\ValyanClinic.API"
Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls http://localhost:5008" -WindowStyle Minimized

# Repornire FE dev server (doar dacă utilizatorul lucrează în modul dev)
cd "d:\Lucru\CMS\CMS\client"
Start-Process -FilePath "cmd" -ArgumentList "/c npm run dev" -WindowStyle Minimized
```

**Reguli pentru mesajul de commit:**
- Tip: `fix` (bugfix), `feat` (funcționalitate nouă), `refactor`, `style`, `chore`, `docs`
- Descriere: **engleză**, concisă, imperativ (ex: `fix: correct UTC datetime display for CNAS sync`)
- Dacă se modifică și DB (SQL/SP): include `(db)` în mesaj (ex: `fix(db): use GETDATE instead of GETUTCDATE`)

**Excepții (NU rulezi automat pașii de mai sus):**
- Utilizatorul cere explicit să NU commiteze (`nu pusha`, `fără push`, etc.)
- Există fișiere intermediare / lucru incomplet și utilizatorul indică explicit
- Schimbare SQL migrare care necesită verificare manuală în DB înainte de push

---

### Plan înainte de implementare — OBLIGATORIU
**Înainte de a crea tabele, stored procedures, migrări SQL sau alte obiecte de bază de date:**
1. **Prezintă planul** — listează toate obiectele care urmează a fi create (tabele, SP-uri, indecși, seed data, constante C#, DTOs etc.)
2. **Revizuire împreună** — așteaptă confirmarea / feedback-ul utilizatorului înainte de a genera cod
3. **Implementare** — doar după aprobare, generează codul efectiv

Aceeași regulă se aplică și la:
- Refactoring major (restructurare directoare, redenumire entități, schimbare arhitectură)
- Adăugare feature complet nou (prezintă lista fișierelor care vor fi create/modificate)
- Migrări destructive (DROP, ALTER cu pierdere date, redenumire coloane)

**Nu se aplică** la modificări mici și evidente (fix bug, adaugă o coloană, corectează un validator).

### La generare cod:
1. Generează fișiere separate — nu combina clase/componente în același fișier
2. Respectă structura de directoare definită mai sus
3. Include comentarii în română pentru logica complexă de business
4. Generează tipurile TypeScript corespunzătoare DTO-urilor din backend
5. Include validarea: FluentValidation BE + Zod schema FE la fiecare feature
6. Generează hook-uri TanStack Query pentru fiecare endpoint
7. Wrap componente Syncfusion — nu le folosi direct în feature components
8. Folosește Bootstrap 5 utilities pentru layout, CSS Modules pentru stiluri specifice
9. Include `CancellationToken ct` în toate metodele repository
10. **Consistență UI obligatorie** — înainte de a genera o pagină nouă, consultă paginile existente de același tip și replică exact structura, layout-ul, spacing-ul și stilurile (vezi secțiunea 24)
11. Generează constante SP în clasa statică corespunzătoare, nu string-uri inline
11. **No hardcode în SQL sau cod C#** — regula se aplică la toate nivelurile:
    - Niciodată magic numbers: `new { StatusId = 2 }` → `new { StatusId = AppointmentStatusIds.Confirmed }`
    - Niciodată magic strings: `if (role == "Admin")` → `if (role == Roles.Admin)`
    - Niciodată valori de configurare inline în cod: connection strings, URL-uri, timeouts, limits → `appsettings.json` + strongly-typed options (`IOptions<T>`)
    - Niciodată mesaje de eroare inline în handler — extrase în constante sau în validator
    - Niciodată dimensiuni/limite hardcodate: `pageSize = 20`, `tokenExpiry = 15` → configurabile din `appsettings.json`
    - Constante organizate în clase statice dedicate: `AppointmentStatusIds`, `Roles`, `AppConstants`
    - În React: nomenclatoarele vin exclusiv din API, nu sunt definite în frontend

```csharp
// GREȘIT — hardcodat
if (appointment.StatusId == 2) { ... }
if (user.Role == "Admin") { ... }
var pageSize = 20;
return Result.Failure("Un pacient cu acest CNP există deja.");

// CORECT — constante + configurație externă
if (appointment.StatusId == AppointmentStatusIds.Confirmed) { ... }
if (user.Role == Roles.Admin) { ... }
var pageSize = _options.Value.DefaultPageSize;
return Result.Failure(ErrorMessages.Patient.CnpDuplicate);
```

```csharp
// Application/Common/Constants/AppointmentStatusIds.cs
// Valorile GUID corespund rândurilor din tabela AppointmentStatuses (seed la migrare)
public static class AppointmentStatusIds
{
    public static readonly Guid Scheduled = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid Confirmed = Guid.Parse("a1000000-0000-0000-0000-000000000002");
    public static readonly Guid Completed = Guid.Parse("a1000000-0000-0000-0000-000000000003");
    public static readonly Guid Cancelled = Guid.Parse("a1000000-0000-0000-0000-000000000004");
    public static readonly Guid NoShow    = Guid.Parse("a1000000-0000-0000-0000-000000000005");
}
// Aceste GUID-uri sunt fixe și seed-uite în migrarea 0002_SeedNomenclature.sql
// INSERT INTO AppointmentStatuses (Id, Name, Code) VALUES
//   ('a1000000-0000-0000-0000-000000000001', 'Programat',  'scheduled'),
//   ('a1000000-0000-0000-0000-000000000002', 'Confirmat',  'confirmed'), ...

// Application/Common/Constants/Roles.cs
public static class Roles
{
    public const string Admin         = "Admin";
    public const string Doctor        = "Doctor";
    public const string Nurse         = "Nurse";
    public const string Receptionist  = "Receptionist";
    public const string ClinicManager = "ClinicManager";
}

// Application/Common/Constants/ErrorMessages.cs
public static class ErrorMessages
{
    public static class Patient
    {
        public const string CnpDuplicate = "Un pacient cu acest CNP există deja.";
        public const string NotFound     = "Pacientul nu a fost găsit.";
    }
    public static class Appointment
    {
        public const string Conflict  = "Există deja o programare în acest interval.";
        public const string NotFound  = "Programarea nu a fost găsită.";
    }
    public static class Invoice
    {
        public const string AlreadyPaid = "Factura este deja achitată.";
    }
}

// Strongly-typed Options → vezi Secțiunea 22.2 pentru definițiile complete
// Folosire: IOptions<JwtOptions>, IOptions<PaginationOptions>, IOptions<StorageOptions> etc.
```

### La debugging:
1. Verifică FluentValidation — eroarea e o validare ratată?
2. Verifică Zod schema — frontend-ul trimite datele în formatul așteptat?
3. Verifică SqlException.Number — eroarea vine din SP cu THROW custom?
4. Verifică query-ul SQL în isolation cu parametrii reali
5. Verifică TanStack Query keys — invalidarea cache-ului e corectă?
6. Verifică tipurile TypeScript — `strict: true` prinde multe probleme
7. Verifică Correlation ID în loguri Serilog pentru a urmări request-ul

### La review cod:
1. Verifică separarea responsabilităților (SRP)
2. Verifică că nu se expun entități Domain direct din API
3. Verifică `CommandType.StoredProcedure` la toate apelurile Dapper
4. Verifică CancellationToken propagat până la Dapper
5. Verifică `sealed` pe clase care nu trebuie extinse
6. Verifică că nu există `any` în TypeScript
7. Verifică că stilurile folosesc variabilele temei, nu culori hardcodate
8. Verifică că SqlException cu coduri custom sunt prinse și transformate în `Result.Failure`

### La generare SP-uri:
1. Verifică schema tabelelor din Secțiunea 9 înainte de a scrie SP
2. `SET NOCOUNT ON; SET XACT_ABORT ON;` — pe orice SP
3. TRY-CATCH + tranzacție pe SP cu INSERT/UPDATE/DELETE
4. `WHERE IsDeleted = 0` implicit pe toate query-urile
5. `CREATE OR ALTER PROCEDURE` — niciodată `CREATE PROCEDURE` singur
6. **GUID-uri seed** — doar caractere hex valide (0-9, A-F). `S`, `G`, `H` etc. NU sunt hex. Folosește `A0000001-...`, `B0000001-...`, `C0000001-...` etc.
7. **Execuție manuală** — `sqlcmd -f 65001` obligatoriu pentru preservare diacritice. Verificare post-insert: `SELECT UNICODE(SUBSTRING(col, pos, 1))` — ă=259, â=226, î=238, ș=537, ț=539

---

## 18. CNAS / SIUI — Integrare Casa de Asigurări

Raportarea serviciilor medicale decontate de CNAS se face prin **SIUI** (Sistemul Informatic Unic Integrat).

```
Arhitectură integrare:
- Export fișiere XML în format SIUI din aplicație
- Import răspunsuri SIUI (aprobare/respingere servicii)
- Reconciliere plăți CNAS cu facturile din aplicație
```

```csharp
// Application/Features/CNAS/Commands/ExportSiuiReport/
// ExportSiuiReportCommand.cs — generează XML SIUI pentru o perioadă
public sealed record ExportSiuiReportCommand(
    Guid ClinicId,
    DateOnly PeriodFrom,
    DateOnly PeriodTo
) : IRequest<Result<byte[]>>;  // returnează fișier XML ca byte array

// Application/Common/Interfaces/ISiuiExportService.cs
public interface ISiuiExportService
{
    byte[] GenerateConsultationsXml(IEnumerable<SiuiConsultationDto> consultations, SiuiHeaderDto header);
    byte[] GeneratePrescriptionsXml(IEnumerable<SiuiPrescriptionDto> prescriptions, SiuiHeaderDto header);
}
```

```sql
-- Tabel pentru tracking rapoarte CNAS
CREATE TABLE CnasReports (
    Id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    ClinicId       UNIQUEIDENTIFIER NOT NULL,
    PeriodFrom     DATE             NOT NULL,
    PeriodTo       DATE             NOT NULL,
    ReportType     NVARCHAR(50)     NOT NULL,  -- 'Consultations', 'Prescriptions'
    StatusId       UNIQUEIDENTIFIER NOT NULL FK→CnasReportStatuses,
    XmlFilePath    NVARCHAR(500)    NULL,
    SubmittedAt    DATETIME2        NULL,
    ResponseXml    NVARCHAR(MAX)    NULL,
    CreatedAt      DATETIME2        NOT NULL DEFAULT GETDATE(),
    CreatedBy      UNIQUEIDENTIFIER NOT NULL
);
```

**Reguli CNAS:**
- Serviciile decontabile sunt marcate în `MedicalServices.IsCnasDeductible BIT`
- Fiecare consultație are `PaymentTypeId` — dacă e CNAS, intră în raportare
- Codul de parafă doctor (`MedicalCode`) e obligatoriu în XML SIUI
- Formatul XML SIUI se schimbă periodic — versiunea schemei e configurabilă în `appsettings.json`

---

## 19. MODEL SELECTION

| Task | Model recomandat |
|------|-----------------|
| Cod de rutină, CRUD, componente simple | **Sonnet** |
| Debugging rapid, întrebări scurte | **Haiku** |
| Generare boilerplate, DTOs, constants | **Haiku** |
| Arhitectură complexă, refactoring major | **Opus** |
| Review cod, securitate, optimizare SQL | **Opus** |
| Probleme multi-layer sau multi-fișier | **Opus** |
| Scriere SP-uri cu logică business complexă | **Sonnet** |
| Generare Zod schemas + FluentValidation pair | **Sonnet** |

---

## 20. HEALTH CHECKS

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "sql-server",
        tags: ["db", "ready"])
    .AddCheck("storage", () =>
    {
        var path = builder.Configuration["Storage:BasePath"]!;
        return Directory.Exists(path)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy($"Storage path not found: {path}");
    }, tags: ["storage", "ready"]);

// Endpoint-uri health
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false   // liveness — dacă răspunde, e alive
});
```

```
GET /health        → status complet (DB + storage)
GET /health/ready  → aplicația e gata să servească trafic
GET /health/live   → aplicația rulează (fără checks)
```

---

## 21. STRUCTURĂ API ENDPOINTS

```
GET    /api/patients                      → Listare paginată
GET    /api/patients/{id}                 → Detalii pacient
POST   /api/patients                      → Creare pacient nou
PUT    /api/patients/{id}                 → Actualizare
DELETE /api/patients/{id}                 → Soft delete

GET    /api/doctors                       → Listare doctori
GET    /api/doctors/{id}
POST   /api/doctors
PUT    /api/doctors/{id}

GET    /api/appointments                  → Lista (filtrat per dată/doctor)
GET    /api/appointments/{id}
POST   /api/appointments
PUT    /api/appointments/{id}
PATCH  /api/appointments/{id}/status      → Confirmare/Anulare/Finalizare

GET    /api/consultations
GET    /api/consultations/{id}
POST   /api/consultations
PUT    /api/consultations/{id}

GET    /api/prescriptions/{id}
GET    /api/prescriptions/{id}/pdf        → Download PDF
POST   /api/prescriptions

GET    /api/medical-documents             → Trimiteri, scrisori, concedii
GET    /api/medical-documents/{id}
GET    /api/medical-documents/{id}/pdf
POST   /api/medical-documents

GET    /api/invoices
GET    /api/invoices/{id}
GET    /api/invoices/{id}/pdf
POST   /api/invoices
PATCH  /api/invoices/{id}/status

POST   /api/payments

GET    /api/nomenclature/specialties
GET    /api/nomenclature/genders
GET    /api/nomenclature/blood-types
GET    /api/nomenclature/appointment-statuses
GET    /api/nomenclature/invoice-statuses
GET    /api/nomenclature/payment-methods
GET    /api/nomenclature/document-types
GET    /api/nomenclature/icd10-codes      → Suportă ?search= pentru autocomplete
GET    /api/nomenclature/medications      → Suportă ?search= pentru autocomplete

GET    /api/medical-services              → Servicii medicale per clinică

POST   /api/files/upload                  → Upload fișier medical (multipart/form-data)
GET    /api/files/{id}                    → Download fișier
DELETE /api/files/{id}                    → Soft delete fișier

GET    /api/users                         → [Admin] Listare utilizatori clinică
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}

GET    /api/dashboard/summary             → Statistici: programări azi, pacienți noi, venituri

POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

Query params standard pentru listare:
```
?page=1&pageSize=20&search=text&sortBy=lastName&sortDir=asc&from=2024-01-01&to=2024-12-31
```

---

## 22. CONFIGURARE APLICAȚIE

### 22.1 appsettings.json — Structură completă

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=VALYAN\\MED_ERP;Database=ValyanClinic;Trusted_Connection=True;Encrypt=False;MultipleActiveResultSets=True"
  },

  "Jwt": {
    "Secret": "CHANGE_ME_IN_PRODUCTION_MIN_64_CHARS_LONG_SECRET_KEY_HERE_12345",
    "Issuer": "ValyanClinic.API",
    "Audience": "ValyanClinic.Client",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },

  "Syncfusion": {
    "LicenseKey": "Ngo9BigBOggjHTQxAR8/V1JFaF5cXGRCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXZfcXRUR2xcVUV2V0BWYEg="
  },

  "Storage": {
    "BasePath": "C:\\ValyanClinicStorage",
    "MaxFileSizeBytes": 10485760,
    "AllowedExtensions": [ ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx" ]
  },

  "Pagination": {
    "DefaultPageSize": 20,
    "MaxPageSize": 100
  },

  "Cors": {
    "AllowedOrigins": [ "https://localhost:5173" ]
  },

  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "Logs/log-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}"
        }
      }
    ],
    "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ]
  },

  "Cnas": {
    "SiuiSchemaVersion": "3.0",
    "ExportPath": "C:\\ValyanClinicStorage\\CNAS\\Export"
  },

  "Security": {
    "BcryptWorkFactor": 12
  },

  "RateLimiting": {
    "LoginMaxAttempts": 5,
    "LoginWindowMinutes": 15,
    "GeneralMaxRequests": 100,
    "GeneralWindowSeconds": 60
  }
}
```

### 22.2 Strongly-Typed Options — Pattern complet

Fiecare secțiune din `appsettings.json` are o clasă Options corespunzătoare:

```csharp
// Infrastructure/Configuration/JwtOptions.cs
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Secret                  { get; init; } = string.Empty;
    public string Issuer                  { get; init; } = string.Empty;
    public string Audience                { get; init; } = string.Empty;
    public int AccessTokenExpiryMinutes   { get; init; } = 15;
    public int RefreshTokenExpiryDays     { get; init; } = 7;
}

// Infrastructure/Configuration/StorageOptions.cs
public sealed class StorageOptions
{
    public const string SectionName = "Storage";
    public string BasePath              { get; init; } = string.Empty;
    public long MaxFileSizeBytes        { get; init; } = 10_485_760;
    public string[] AllowedExtensions   { get; init; } = [".pdf", ".jpg", ".jpeg", ".png"];
}

// Infrastructure/Configuration/PaginationOptions.cs
public sealed class PaginationOptions
{
    public const string SectionName = "Pagination";
    public int DefaultPageSize { get; init; } = 20;
    public int MaxPageSize     { get; init; } = 100;
}

// Infrastructure/Configuration/CorsOptions.cs
public sealed class CorsOptions
{
    public const string SectionName = "Cors";
    public string[] AllowedOrigins { get; init; } = [];
}

// Infrastructure/Configuration/RateLimitingOptions.cs
public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";
    public int LoginMaxAttempts       { get; init; } = 5;
    public int LoginWindowMinutes     { get; init; } = 15;
    public int GeneralMaxRequests     { get; init; } = 100;
    public int GeneralWindowSeconds   { get; init; } = 60;
}

// Infrastructure/Configuration/SecurityOptions.cs
public sealed class SecurityOptions
{
    public const string SectionName = "Security";
    public int BcryptWorkFactor { get; init; } = 12;
}

// Infrastructure/Configuration/CnasOptions.cs
public sealed class CnasOptions
{
    public const string SectionName = "Cnas";
    public string SiuiSchemaVersion { get; init; } = "3.0";
    public string ExportPath        { get; init; } = string.Empty;
}
```

### 22.3 Înregistrare Options în DI — Program.cs

```csharp
// Program.cs — bind options din appsettings.json
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.Configure<PaginationOptions>(builder.Configuration.GetSection(PaginationOptions.SectionName));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));
builder.Services.Configure<SecurityOptions>(builder.Configuration.GetSection(SecurityOptions.SectionName));
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection(RateLimitingOptions.SectionName));
builder.Services.Configure<CnasOptions>(builder.Configuration.GetSection(CnasOptions.SectionName));

// Syncfusion — licență activată la startup
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(
    builder.Configuration["Syncfusion:LicenseKey"]);
```

### 22.4 Frontend — .env

```env
# client/.env.development
VITE_API_URL=https://localhost:7001
VITE_APP_NAME=ValyanClinic
VITE_SYNCFUSION_LICENSE=Ngo9BigBOggjHTQxAR8/V1JFaF5cXGRCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXZfcXRUR2xcVUV2V0BWYEg=

# client/.env.production
VITE_API_URL=https://api.valyanclinic.ro
VITE_APP_NAME=ValyanClinic
VITE_SYNCFUSION_LICENSE=PRODUCTION_KEY_HERE
```

```ts
// main.tsx — activare licență Syncfusion
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE);
```

---

## 23. BIBLIOTECA DE REFERINȚĂ — Fișiere Model

Fișiere de referință cu pattern-uri complete, folosite de Claude ca inspirație la generare cod. Localizate în `.github/reference/`.

| Fișier | Conținut |
|--------|----------|
| [sp-templates.md](.github/reference/sp-templates.md) | SP-uri model CRUD complet per entitate (GetById, GetPaged, Create, Update, Delete) |
| [page-templates.md](.github/reference/page-templates.md) | Modele pagini React: ListPage, DetailPage, FormPage, DashboardPage |
| [mediatr-patterns.md](.github/reference/mediatr-patterns.md) | Pattern-uri MediatR complete: Command + Handler + Validator + DTO |
| [pdf-templates.md](.github/reference/pdf-templates.md) | Template-uri QuestPDF: rețetă, factură, trimitere, scrisoare medicală |
| [syncfusion-patterns.md](.github/reference/syncfusion-patterns.md) | Componente Syncfusion avansate: DataGrid, Scheduler, PivotGrid, Charts |

**Regulă**: Când Claude generează cod pentru un feature nou, consultă mai întâi fișierele de referință relevante și urmează aceleași pattern-uri.

---

## 24. CONSISTENȚĂ UI — Reguli Obligatorii

**Principiu fundamental**: Toate paginile de același tip trebuie să fie **vizual și structural identice**. Utilizatorul trebuie să simtă aceeași experiență indiferent de feature. Zero devieri de la pattern-ul stabilit.

### 24.1 ListPage — Pagini cu DataGrid (identice peste tot)

**Fiecare pagină de tip listă respectă exact această structură — fără excepții:**

| Element | Implementare | Obligatoriu |
|---------|-------------|-------------|
| **Container** | `div.page` cu `padding: 1.5rem` | DA |
| **PageHeader** | `<PageHeader title="..." subtitle="N entități">` cu buton acțiune dreapta | DA |
| **Card conținut** | `div.content` cu `background: $card-bg`, `border-radius: $border-radius-lg`, `padding: 1.5rem`, `box-shadow: $box-shadow-sm` | DA |
| **Bară căutare** | `<input>` cu `className="form-control"`, `placeholder` descriptiv, `mb-3` deasupra grid-ului | DA |
| **DataGrid** | `<AppDataGrid>` — wraperul din `components/data-display/` | DA |
| **Paginare** | `<Pagination>` centrat cu `d-flex justify-content-center mt-3`, vizibil doar dacă `totalPages > 1` | DA |
| **State management** | `useState` pentru `params` (page, pageSize, search, sortBy, sortDir) | DA |
| **Hook date** | `use[Feature]s(params)` cu TanStack Query | DA |
| **Click rând** | `handleRowSelected` → `navigate('/[feature]/${id}')` | DA |

**CSS Module standard ListPage** — copiat identic pe fiecare feature:
```scss
@import '@/styles/variables';

.page {
  padding: 1.5rem;
}

.content {
  background: $card-bg;
  border-radius: $border-radius-lg;
  padding: 1.5rem;
  box-shadow: $box-shadow-sm;
}
```

**Verificare înainte de generare**: Dacă există deja `PatientsListPage`, noul `AppointmentsListPage` trebuie să aibă **exact** aceeași structură JSX, aceleași clase CSS module, aceleași pattern-uri de state. Singurele diferențe permise: titlul, coloanele grid, hook-ul de date, ruta de navigare.

### 24.2 DetailPage — Pagini detalii (identice peste tot)

| Element | Implementare | Obligatoriu |
|---------|-------------|-------------|
| **Container** | `div.page` cu `padding: 1.5rem` | DA |
| **PageHeader** | `<PageHeader title="..." subtitle="..." onBack={...}>` cu buton Editează dreapta | DA |
| **Card conținut** | `div.content` cu aceleași stiluri ca ListPage | DA |
| **Info card** | `<[Feature]InfoCard>` — date principale ale entității | DA |
| **Tab-uri** | `<TabComponent>` Syncfusion pentru secțiuni (istoric, documente etc.) | DA (dacă > 1 secțiune) |
| **Loading** | `<LoadingSpinner />` cât se încarcă | DA |
| **Error state** | `alert alert-danger` dacă entitatea nu e găsită | DA |

### 24.3 FormPage — Pagini creare/editare (identice peste tot)

| Element | Implementare | Obligatoriu |
|---------|-------------|-------------|
| **Container** | `div.page` cu `padding: 1.5rem` | DA |
| **PageHeader** | Titlu dinamic: `'Editează X'` / `'X Nou'`, `onBack` mereu prezent | DA |
| **Card conținut** | `div.content` cu `max-width: 900px`, padding `2rem` | DA |
| **Formular** | `<[Feature]Form>` — componentă separată cu React Hook Form + Zod | DA |
| **Mod edit/create** | Detectat prin `useParams().id` — `isEdit = !!id` | DA |
| **Submit** | `handleSubmit` cu try/catch, `showError` pe eșec, `navigate` pe succes | DA |
| **Butoane** | `<AppButton type="submit">Salvează</AppButton>` aliniat dreapta cu `d-flex justify-content-end mt-3` | DA |

**CSS Module standard FormPage:**
```scss
@import '@/styles/variables';

.page {
  padding: 1.5rem;
}

.content {
  background: $card-bg;
  border-radius: $border-radius-lg;
  padding: 2rem;
  box-shadow: $box-shadow-sm;
  max-width: 900px;
}
```

### 24.4 DashboardPage — Dashboard-uri (identice ca structură)

| Element | Implementare | Obligatoriu |
|---------|-------------|-------------|
| **Container** | `div.page` cu `padding: 1.5rem` | DA |
| **PageHeader** | `<PageHeader title="Dashboard" subtitle="Rezumatul zilei" />` | DA |
| **Stat cards** | Rând cu `row g-3 mb-4`, coloane `col-md-3`, componenta `<StatCard>` | DA |
| **Conținut principal** | `row g-3` cu `col-lg-8` + `col-lg-4` | DA |
| **Carduri widget** | `div.card` cu titlu `h5.cardTitle` (separator `border-bottom: 1px solid $gray-200`) | DA |
| **Grafice** | Rând separat `row mt-3` cu `col-12` | DA (dacă există date grafice) |

**CSS Module standard DashboardPage:**
```scss
@import '@/styles/variables';

.page {
  padding: 1.5rem;
}

.card {
  background: $card-bg;
  border-radius: $border-radius-lg;
  padding: 1.5rem;
  box-shadow: $box-shadow-sm;
  height: 100%;
}

.cardTitle {
  font-size: 1rem;
  font-weight: 600;
  color: $gray-700;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid $gray-200;
}
```

### 24.5 Reguli transversale — TOATE tipurile de pagini

1. **PageHeader prezent mereu** — pe orice pagină, prima componentă e `<PageHeader>` cu titlu + subtitle opțional + acțiuni dreapta
2. **Spacing identic** — `padding: 1.5rem` pe container, `gap: 1.5rem` implicit prin Bootstrap `g-3`
3. **Card design identic** — `$card-bg`, `$border-radius-lg`, `$box-shadow-sm` — niciodată variații
4. **Loading identic** — `<LoadingSpinner />` full-page (nu schelet diferit per pagină)
5. **Error identic** — `<div className="alert alert-danger">` cu mesaj descriptiv
6. **Acțiuni identice** — butoanele de acțiune mereu în `<PageHeader>` dreapta, niciodată sub grid sau în altă poziție
7. **Navigare identică** — click pe rând în grid → detail page, buton "Editează" → form page, buton "Înapoi" → list page
8. **Toast notificări** — succes/eroare mereu prin `ToastUtility` Syncfusion, niciodată alert inline pentru operații CRUD

### 24.6 Checklist înainte de generare pagină nouă

Înainte de a genera orice pagină pentru un feature nou, Claude **trebuie**:

1. **Identifică tipul paginii** — ListPage / DetailPage / FormPage / Dashboard
2. **Consultă o pagină existentă de același tip** (dacă există) — copiază structura exactă
3. **Consultă template-ul din `.github/reference/page-templates.md`** (dacă nu există pagini anterioare)
4. **Verifică consistența** — aceeași clasă CSS module, aceeași ordine elemente, același pattern de hooks
5. **NU adăuga elemente extra** — dacă ListPage existentă nu are filtru avansat, noul ListPage nu adaugă filtru avansat (doar la cerere explicită)
6. **NU schimba layout-ul** — dacă paginile existente au search bar deasupra grid-ului, noua pagină nu mută search bar-ul în altă parte

---

## 25. RUTINA DE FINAL DE ZI — EOD & GitHub

La finalul fiecărei zile de lucru se execută obligatoriu rutina de versionare și push pe GitHub. Aceasta asigură că tot codul e salvat, versiunea e incrementată și changelog-ul SQL e actualizat.

### 25.1 Pași obligatorii EOD

**Pasul 1 — Commit tot ce e neterminat (dacă există fișiere unstaged)**
```powershell
git add -A
# Verifică ce s-a adăugat:
git status --short
```
> **IMPORTANT**: `bump-version.ps1 -Eod` detectează automat fișierele staged (dar necommise) și le commitează înainte de a colecta commit-urile pentru SQL. TOTUȘI, cel mai bun flux e să faci commit-urile logice manual înainte de a rula EOD.

**Pasul 2 — Rulează scriptul EOD**
```powershell
Set-Location "d:\Lucru\CMS\CMS"
.\bump-version.ps1 -Eod
```

Scriptul face automat:
- Bumpează versiunea **patch** (`0.1.1 → 0.1.2`)
- Actualizează `Directory.Build.props` și `client/package.json`
- Dacă există fișiere staged necommise → le commitează automat ca `feat: session work YYYY-MM-DD`
- Colectează toate commit-urile de la ultimul tag până la HEAD
- Salvează în SQL: tabelele `dbo.VersionReleases` + `dbo.VersionCommits`
- Creează commit Git: `chore: release vX.Y.Z`
- Creează tag Git: `vX.Y.Z`
- Afișează comanda de push

**Pasul 3 — Push pe GitHub**
```powershell
git push && git push --tags
```

### 25.2 Flux complet recomandat

```powershell
# 1. Oprire servere (opțional)
Stop-Process -Name "ValyanClinic.API" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Verificare stare git
Set-Location "d:\Lucru\CMS\CMS"
git status --short
git log --oneline -5

# 3. Commit orice cod neterminat (dacă există)
git add -A
git commit -m "feat: [descriere scurtă a ce s-a lucrat azi]"

# 4. Rulare EOD
.\bump-version.ps1 -Eod

# 5. Push
git push && git push --tags
```

### 25.3 Alte moduri de versioning

| Comandă | Când se folosește |
|---------|-------------------|
| `.\bump-version.ps1 -Eod` | **Daily** — final de zi, bump patch automat |
| `.\bump-version.ps1 -Part minor -Tag` | Feature major livrat — bump minor (0.1.x → 0.2.0) |
| `.\bump-version.ps1 -Part major -Tag` | Lansare nouă — bump major (0.x.y → 1.0.0) |
| `.\bump-version.ps1 -Part patch` | Bump fișiere fără commit/tag (rar) |

### 25.4 Structura SQL — Changelog versiuni

```sql
-- dbo.VersionReleases — câte un rând per versiune
Id          UNIQUEIDENTIFIER PK
Version     NVARCHAR(20)      -- '0.1.2'
ReleasedAt  DATETIME2         -- data release-ului (UTC)
Notes       NVARCHAR(500)     -- descriere automată: 'N commit(uri) — dd.MM.yyyy'

-- dbo.VersionCommits — commit-urile incluse în fiecare release
Id            UNIQUEIDENTIFIER PK
ReleaseId     UNIQUEIDENTIFIER FK→VersionReleases
CommitHash    NVARCHAR(40)      -- SHA complet
CommitMessage NVARCHAR(500)     -- mesajul de commit
CommitDate    DATETIME2         -- data commit-ului (UTC)
```

**Verificare SQL după EOD:**
```sql
SELECT r.Version, r.ReleasedAt, r.Notes,
       c.CommitHash, c.CommitMessage, c.CommitDate
FROM dbo.VersionReleases r
JOIN dbo.VersionCommits c ON c.ReleaseId = r.Id
ORDER BY r.ReleasedAt DESC, c.CommitDate DESC;
```

### 25.5 Reguli pentru mesajele de commit

Convenție **Conventional Commits** — obligatorie:

| Prefix | Când | Exemple |
|--------|------|---------|
| `feat:` | Feature nou | `feat: add FormPhoneInput component` |
| `fix:` | Bug fix | `fix: phone border not removed on input` |
| `feat(scope):` | Feature în modul specific | `feat(patients): add emergency contact tab` |
| `fix(scope):` | Bug în modul specific | `fix(auth): refresh token not rotating` |
| `chore:` | Task tehnic, config | `chore: update dependencies` |
| `refactor:` | Refactoring fără feature | `refactor: extract PhoneCell component` |
| `docs:` | Documentație | `docs: update copilot instructions EOD` |
| `style:` | CSS/SCSS, fără logică | `style: fix sidebar active indicator` |
| `perf:` | Îmbunătățire performanță | `perf: add index on Appointments.DoctorId` |

**Reguli:**
- Mesaj în **engleză**
- Fără punct la final
- Imperativ prezent: `add`, `fix`, `update` — nu `added`, `fixed`, `updated`
- Max 72 caractere pe prima linie
- Dacă sunt mai multe modificări logice → **commit-uri separate**, nu un singur commit mare

### 25.6 Ce face Claude la cererea de EOD

Când utilizatorul spune **"hai să facem EOD"**, **"punem pe GitHub"**, **"terminăm ziua"** sau similar, Claude:

1. **Verifică starea git**: `git status --short` și `git log --oneline -5`
2. **Verifică versiunea curentă**: din `Directory.Build.props`
3. **Dacă există fișiere unstaged sau staged necommise** → face `git add -A` și un commit descriptiv
4. **Rulează** `.\bump-version.ps1 -Eod` din directorul `d:\Lucru\CMS\CMS`
5. **Verifică output-ul** — numărul de commit-uri colectate, versiunea nouă
6. **Rulează** `git push && git push --tags`
7. **Confirmă** versiunea publicată și URL-ul tag-ului pe GitHub

> **NOTĂ IMPORTANTĂ**: Anterior s-a întâmplat că `git add -A` s-a rulat fără un commit anterior, iar scriptul EOD a văzut fișierele staged și le-a pus în release commit fără descriere proprie. Scriptul a fost actualizat să detecteze și să committeze automat fișierele staged — dar e mai curat să faci commit-urile logice **înainte** de a chema EOD.

### 25.7 Documentație — README, CHANGELOG per feature

Fiecare pagină/feature are un director de documentație în:
```
src/ValyanClinic.Shared/Documentation/Pages/[Feature]/
├── README.md              # Hub index cu linkuri la ghiduri
├── README.USER.md         # Ghid utilizator (doctor, asistentă, recepționistă)
├── README.ADMIN.md        # Ghid administrator (IT, manager clinică)
├── README.DEVELOPER.md    # Ghid developer (implementare, arhitectură)
├── CHANGELOG.md           # Istoricul modificărilor feature-ului
├── FAQ.md                 # Întrebări frecvente
├── TROUBLESHOOTING.md     # Probleme comune + soluții
└── API-ENDPOINTS.md       # Documentație endpoints API
```

**Reguli documentație la EOD:**

| Situație | Ce trebuie actualizat |
|----------|-----------------------|
| Feature nou adăugat | Creare director nou + toate fișierele de bază |
| Funcționalitate modificată | `CHANGELOG.md` + secția relevantă din `README.USER.md` / `README.DEVELOPER.md` |
| Bug fix vizibil utilizatorului | `CHANGELOG.md` + `TROUBLESHOOTING.md` (dacă e o problemă frecventă) |
| API endpoint nou/modificat | `API-ENDPOINTS.md` |
| Comportament intern schimbat | `README.DEVELOPER.md` |

**CHANGELOG.md — format obligatoriu:**
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Descriere funcționalitate nouă

### Changed
- Descriere modificare existentă

### Fixed
- Descriere bug fix
```

**Prioritate la EOD**: Documentația nu blochează commit-ul — dacă nu e timp, se commitează codul și se adaugă `docs: update [Feature] documentation` ca task pentru a doua zi. **Nu lăsa niciodată documentația să întârzie push-ul pe GitHub.**
