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

### 5.1 Separare cod — Principiu strict
- Un fișier `.cs` = o singură clasă/record/interface/enum
- Numele fișierului = numele clasei — întotdeauna
- Nu se combină mai multe clase în același fișier
- Partial classes doar pentru generated code
- **Fără diacritice în cod C#** — clase, metode, variabile, proprietăți, namespace-uri se scriu în engleză fără diacritice. Diacriticele sunt permise **doar** în comentarii (`//`, `///`, `/* */`) și în string-uri afișate utilizatorului (mesaje validare, erori, constante text UI)

```csharp
// CreatePatientCommand.cs
namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed record CreatePatientCommand(
    string FirstName,
    string LastName,
    string Cnp,
    string? PhoneNumber,
    string? Email
) : IRequest<Result<Guid>>;

// CreatePatientCommandHandler.cs
namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed class CreatePatientCommandHandler(
    IPatientRepository patientRepository,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePatientCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreatePatientCommand request,
        CancellationToken cancellationToken)
    {
        var exists = await patientRepository.ExistsByCnpAsync(
            request.Cnp, currentUser.ClinicId, cancellationToken);
        if (exists)
            return Result<Guid>.Failure(ErrorMessages.Patient.CnpDuplicate);

        var patientId = await patientRepository.CreateAsync(
            new Patient
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Cnp = request.Cnp,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,
                ClinicId = currentUser.ClinicId,
                CreatedBy = currentUser.Id
            },
            cancellationToken);

        return Result<Guid>.Success(patientId);
    }
}

// CreatePatientCommandValidator.cs
namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed class CreatePatientCommandValidator : AbstractValidator<CreatePatientCommand>
{
    public CreatePatientCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100);

        RuleFor(x => x.Cnp)
            .NotEmpty().WithMessage("CNP-ul este obligatoriu.")
            .Matches(@"^[1-9]\d{12}$").WithMessage("CNP-ul trebuie să aibă 13 cifre valide.");
    }
}
```

### 5.2 Result Pattern — Obligatoriu

```csharp
// Application/Common/Models/Result.cs
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(bool isSuccess, T? value, string? error, int statusCode)
    {
        IsSuccess = isSuccess; Value = value; Error = error; StatusCode = statusCode;
    }

    public static Result<T> Success(T value)                    => new(true, value, null, 200);
    public static Result<T> Failure(string error, int code = 400) => new(false, default, error, code);
    public static Result<T> NotFound(string error)              => new(false, default, error, 404);
    public static Result<T> Conflict(string error)              => new(false, default, error, 409);
}

// ApiResponse — wrapper consistent pentru toate response-urile API
public sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    string? Message,
    IDictionary<string, string[]>? Errors);
```

### 5.3 Dapper — Exclusiv Stored Procedures

**REGULĂ STRICTĂ**: Nu se scrie niciodată SQL inline în C#. Toate operațiile pe DB se fac prin Stored Procedures, inclusiv un simplu SELECT.

#### Constante SP — organizate per entitate

```csharp
// Infrastructure/Data/StoredProcedures/PatientProcedures.cs
namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Patient. Convenție: dbo.[Entitate]_[Acțiune]</summary>
public static class PatientProcedures
{
    public const string GetById      = "dbo.Patient_GetById";
    public const string GetPaged     = "dbo.Patient_GetPaged";
    public const string Create       = "dbo.Patient_Create";
    public const string Update       = "dbo.Patient_Update";
    public const string Delete       = "dbo.Patient_Delete";        // Soft delete
    public const string ExistsByCnp  = "dbo.Patient_ExistsByCnp";
}
```

#### Repository — implementare standard

```csharp
// Infrastructure/Data/Repositories/PatientRepository.cs
public sealed class PatientRepository(DapperContext context) : IPatientRepository
{
    public async Task<PatientDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<PatientDetailDto>(
            new CommandDefinition(
                PatientProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<PagedResult<PatientListDto>> GetPagedAsync(
        GetPatientsQuery query, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PatientProcedures.GetPaged,
                new { ClinicId = clinicId, query.Search, query.Page, query.PageSize, query.SortBy, query.SortDir },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<PatientListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<PatientListDto>(items, totalCount, query.Page, query.PageSize);
    }

    public async Task<Guid> CreateAsync(Patient patient, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                PatientProcedures.Create,
                new
                {
                    patient.ClinicId, patient.FirstName, patient.LastName, patient.Cnp,
                    patient.PhoneNumber, patient.Email, patient.CreatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
```

#### DapperContext

```csharp
public sealed class DapperContext(IConfiguration configuration)
{
    private readonly string _connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
```

### 5.4 SqlException → Result mapping pentru erori din SP

SP-urile aruncă erori custom cu THROW în range 50000–59999. C# le prinde și le transformă în `Result.Failure` cu mesaj curat — **niciodată expune SqlException raw în response**.

```csharp
// Application/Common/Behaviors/SqlExceptionBehavior.cs
// SAU în fiecare handler — pattern recomandat: Try-Catch în handler

public sealed class CreatePatientCommandHandler(
    IPatientRepository repo,
    ICurrentUser currentUser) 
    : IRequestHandler<CreatePatientCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreatePatientCommand request, CancellationToken ct)
    {
        try
        {
            var id = await repo.CreateAsync(request, ct);
            return Result<Guid>.Success(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientCnpDuplicate)
        {
            // SP aruncat: THROW 50001, 'Un pacient cu acest CNP există deja.', 1
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            // Alte erori business din SP
            return Result<Guid>.Failure(ex.Message);
        }
        // SqlException neașteptată (conexiune, timeout etc.) — nu se prinde, urcă la GlobalExceptionHandler
    }
}
```

```csharp
// Infrastructure/Data/SqlErrorCodes.cs — constante pentru coduri eroare custom SP
public static class SqlErrorCodes
{
    public const int PatientCnpDuplicate    = 50001;
    public const int AppointmentConflict    = 50010;
    public const int InvoiceAlreadyPaid     = 50020;
    public const int PrescriptionExpired    = 50030;
    // Adaugă pe măsură ce crești aplicația
}
```

### 5.5 Stored Procedures — Convenții SQL Server

```sql
-- Exemplu SP cu SELECT (read-only) — @ClinicId OBLIGATORIU pe toate SP-urile
CREATE OR ALTER PROCEDURE dbo.Patient_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT p.Id, p.FirstName, p.LastName, p.Cnp, p.BirthDate,
           p.GenderId, p.PhoneNumber, p.Email, p.CreatedAt
    FROM Patients p
    WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;
END;
GO

-- Exemplu SP cu INSERT (modifică date — TRY-CATCH + tranzacție obligatorie)
CREATE OR ALTER PROCEDURE dbo.Patient_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @FirstName   NVARCHAR(100),
    @LastName    NVARCHAR(100),
    @Cnp         NCHAR(13),
    @PhoneNumber NVARCHAR(20)  = NULL,
    @Email       NVARCHAR(200) = NULL,
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Patients WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50001, 'Un pacient cu acest CNP există deja.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Patients (ClinicId, FirstName, LastName, Cnp, PhoneNumber, Email,
                              CreatedBy, CreatedAt, IsDeleted)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @FirstName, @LastName, @Cnp, @PhoneNumber, @Email,
                @CreatedBy, GETDATE(), 0);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
```

#### Naming Convention SP-uri

| Pattern | Exemplu |
|---------|---------|
| `[Entitate]_GetById` | `dbo.Patient_GetById` |
| `[Entitate]_GetPaged` | `dbo.Patient_GetPaged` |
| `[Entitate]_GetBy*` | `dbo.Appointment_GetByDoctor` |
| `[Entitate]_Create` | `dbo.Patient_Create` — returnează Id |
| `[Entitate]_Update` | `dbo.Patient_Update` |
| `[Entitate]_Delete` | `dbo.Patient_Delete` — soft delete |
| `[Entitate]_ExistsBy*` | `dbo.Patient_ExistsByCnp` |

#### Regula No-Hardcode — Obligatorie

**Niciodată valori hardcodate în tabele SQL sau în logică aplicație.** Orice listă de valori configurabile trăiește într-un tabel de nomenclator.

| ❌ Hardcodat — greșit | ✅ Tabel nomenclator — corect |
|----------------------|------------------------------|
| `Gender TINYINT` (1/2 în cod) | `Genders (Id, Name, Code)` |
| `Status TINYINT` (1=Draft etc.) | `AppointmentStatuses (Id, Name, Code)` |
| `PaymentMethod TINYINT` | `PaymentMethods (Id, Name, Code)` |
| `BloodType TINYINT` | `BloodTypes (Id, Name, Code)` |
| `DocumentType TINYINT` | `DocumentTypes (Id, Name, Code)` |
| Specializare string în cod | `Specialties (Id, Name, Code)` |
| Tip serviciu medical | `ServiceCategories (Id, Name, Code)` |

**Structură standard pentru tabele nomenclator:**
```sql
CREATE TABLE AppointmentStatuses (
    Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    Name     NVARCHAR(50)     NOT NULL,   -- 'Programat', 'Confirmat', 'Finalizat'
    Code     NVARCHAR(20)     NOT NULL,   -- 'scheduled', 'confirmed', 'completed'
    IsActive BIT              NOT NULL DEFAULT 1
);
```

**În C# — constante pentru Id-urile din nomenclatoare (nu magic numbers):**
```csharp
// Application/Common/Constants/AppointmentStatusIds.cs
// Valorile GUID corespund rândurilor seed-uite în migrarea 0002_SeedNomenclature.sql
public static class AppointmentStatusIds
{
    public static readonly Guid Scheduled = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid Confirmed = Guid.Parse("a1000000-0000-0000-0000-000000000002");
    public static readonly Guid Completed = Guid.Parse("a1000000-0000-0000-0000-000000000003");
    public static readonly Guid Cancelled = Guid.Parse("a1000000-0000-0000-0000-000000000004");
    public static readonly Guid NoShow    = Guid.Parse("a1000000-0000-0000-0000-000000000005");
}
// Folosire: new { StatusId = AppointmentStatusIds.Confirmed }
// NICIODATĂ: new { StatusId = Guid.Parse("...") } inline
```

**Frontend — nomenclatoarele se încarcă din API, nu se definesc în cod:**
```ts
// Nomenclatoarele vin din backend, nu sunt hardcodate în frontend
// features/nomenclature/hooks/useNomenclature.ts
export const useAppointmentStatuses  = () => useQuery({ queryKey: ['nomenclature', 'appointment-statuses'],  queryFn: () => nomenclatureApi.getAppointmentStatuses() });
export const usePaymentMethods       = () => useQuery({ queryKey: ['nomenclature', 'payment-methods'],       queryFn: () => nomenclatureApi.getPaymentMethods() });
export const useSpecialties          = () => useQuery({ queryKey: ['nomenclature', 'specialties'],           queryFn: () => nomenclatureApi.getSpecialties() });
export const useBloodTypes           = () => useQuery({ queryKey: ['nomenclature', 'blood-types'],           queryFn: () => nomenclatureApi.getBloodTypes() });
// etc.
```

#### Reguli SQL obligatorii
1. `SET NOCOUNT ON;` + `SET XACT_ABORT ON;` — pe toate SP-urile
2. `TRY-CATCH` + tranzacție explicită — pe orice SP cu INSERT/UPDATE/DELETE
3. `;THROW` pentru erori business (range 50000–59999); `;THROW;` fără parametri în CATCH pentru re-throw
4. `CREATE OR ALTER PROCEDURE` — permite re-deploy fără DROP
5. Parametri tipizați explicit — `NVARCHAR(200)` nu `NVARCHAR(MAX)`
6. `EXPLICIT JOIN` — `INNER JOIN`, `LEFT JOIN` (nu JOIN implicit)
7. `UPPERCASE keywords` — `SELECT`, `FROM`, `WHERE`, `ORDER BY`
8. `OFFSET-FETCH` pentru paginare — nu `TOP` / `ROW_NUMBER()`
9. `WHERE IsDeleted = 0` — implicit pe toate query-urile
10. `AND t.IsDeleted = 0` — obligatoriu pe **fiecare tabel joined**, nu doar pe tabelul principal

```sql
-- GREȘIT — IsDeleted filtrat doar pe tabelul principal
SELECT p.Id, a.StartTime
FROM Patients p
INNER JOIN Appointments a ON a.PatientId = p.Id
WHERE p.IsDeleted = 0

-- CORECT — IsDeleted filtrat pe fiecare tabel din JOIN
SELECT p.Id, a.StartTime
FROM Patients p
INNER JOIN Appointments a ON a.PatientId = p.Id AND a.IsDeleted = 0
WHERE p.IsDeleted = 0
```
11. Un fișier SQL per SP în `Scripts/StoredProcedures/[Entitate]_[Actiune].sql`
12. **GUID cu NEWSEQUENTIALID()** — toate PK-urile sunt `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`, niciodată `INT IDENTITY`
13. **Fără diacritice în codul SQL** — nume tabele, coloane, variabile, SP-uri, parametri se scriu **fără** ă/â/î/ș/ț. Diacriticele apar **doar** în valori string (seed data, mesaje THROW). Exemplu: coloana `FirstName` nu `PrenumePacient`, SP `Patient_Create` nu `Pacient_Creare`, dar `';THROW 50001, ''Un pacient cu acest CNP există deja.'', 1;'` conține diacritice în mesaj
14. **Verificare diacritice la execuție manuală** — când se rulează scripturi SQL manual prin `sqlcmd`, **obligatoriu** se folosește `-f 65001` (UTF-8 codepage) pentru a preserva diacriticele românești (ă, â, î, ș, ț) din valorile `NVARCHAR`. Fără acest flag, `sqlcmd` citește fișierele UTF-8 ca ANSI/Windows-1252 și corupe caracterele (ex: `ă` → `Ä\x83`, `ț` → mojibake). Comandă corectă: `sqlcmd -S "server" -d DB -E -C -f 65001 -i "script.sql"`. **După inserare seed data cu diacritice**, verifică cu: `SELECT UNICODE(SUBSTRING(Name, pos, 1))` — valorile corecte: ă=259, â=226, î=238, ș=537, ț=539
15. **GUID-uri — doar caractere hex valide (0-9, A-F)** — `UNIQUEIDENTIFIER` acceptă exclusiv cifre hexazecimale. Litere ca `S`, `G`, `H` etc. NU sunt hex valide și provoacă `Conversion failed`. Exemplu: `S0000001-0000-0000-0000-000000000001` → **INVALID** ('S' nu e hex). Corect: `A0000001-...`, `B0000001-...`, `C0000001-...`, `D0000001-...`, `E0000001-...`, `F0000001-...`. Caractere hex valide: `0 1 2 3 4 5 6 7 8 9 A B C D E F`

```sql
-- GREȘIT
Id INT IDENTITY(1,1) PRIMARY KEY

-- CORECT
Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY

-- Exemplu tabel complet
CREATE TABLE Patients (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    FirstName   NVARCHAR(100)    NOT NULL,
    LastName    NVARCHAR(100)    NOT NULL,
    Cnp         NCHAR(13)        NOT NULL,
    -- ...
    CreatedBy   UNIQUEIDENTIFIER NOT NULL,   -- FK → Users.Id (tot GUID)
    UpdatedBy   UNIQUEIDENTIFIER NULL
);
```

**De ce NEWSEQUENTIALID() și nu NEWID():**
- `NEWID()` generează GUID-uri random → fragmentare masivă index clustered → performanță slabă
- `NEWSEQUENTIALID()` generează GUID-uri secvențiale → comportament similar cu IDENTITY → fără fragmentare
- **Restricție SQL Server**: `NEWSEQUENTIALID()` funcționează doar ca DEFAULT pe coloană, nu poate fi apelat în T-SQL ad-hoc

**FK-urile și parametrii SP-urilor** devin `UNIQUEIDENTIFIER`:
```sql
CREATE OR ALTER PROCEDURE dbo.Patient_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS ...

CREATE OR ALTER PROCEDURE dbo.Patient_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @FirstName   NVARCHAR(100),
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    -- ID-ul e generat de DEFAULT NEWSEQUENTIALID(), nu se trimite din C#
    DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

    INSERT INTO Patients (ClinicId, FirstName, ..., CreatedBy)
    OUTPUT INSERTED.Id INTO @OutputIds(Id)
    VALUES (@ClinicId, @FirstName, ..., @CreatedBy);

    SELECT Id FROM @OutputIds;
END;
```

**În C# — tipul devine `Guid`:**
```csharp
// Entitate Domain
public sealed class Patient
{
    public Guid Id { get; init; }           // NICIODATĂ int
    public Guid ClinicId { get; init; }     // Multi-tenancy obligatoriu
    public string FirstName { get; set; } = string.Empty;
    public Guid CreatedBy { get; init; }    // FK tot Guid
}

// Command returnează Guid, nu int
public sealed record CreatePatientCommand(...) : IRequest<Result<Guid>>;

// Repository — OUTPUT clause pentru a obține ID-ul generat de SQL Server
public async Task<Guid> CreateAsync(Patient patient, CancellationToken ct)
{
    using var connection = context.CreateConnection();
    return await connection.ExecuteScalarAsync<Guid>(
        new CommandDefinition(
            PatientProcedures.Create,
            new { patient.ClinicId, patient.FirstName, patient.LastName, patient.Cnp, patient.CreatedBy },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
}
```

### 5.6 Naming Conventions C#

| Element | Convenție | Exemplu |
|---------|-----------|---------|
| Namespace | PascalCase după folder | `ValyanClinic.Application.Features.Patients` |
| Clasă / Record | PascalCase | `PatientRepository`, `CreatePatientCommand` |
| Interface | I + PascalCase | `IPatientRepository` |
| Metodă async | PascalCase + Async | `GetByIdAsync()` |
| Property | PascalCase | `CreatedAt`, `IsActive` |
| Parametru | camelCase | `patientId`, `cancellationToken` |
| Private field | _camelCase | `_repository`, `_logger` |
| Constantă | PascalCase | `MaxPageSize` |
| DTO | Noun + Dto | `PatientDetailDto` |
| Command | Verb + Noun + Command | `CreatePatientCommand` |
| Query | Get + Noun + By + Key + Query | `GetPatientByIdQuery` |
| Handler | CommandName + Handler | `CreatePatientCommandHandler` |
| Validator | CommandName + Validator | `CreatePatientCommandValidator` |

### 5.7 API Controllers — Pattern standard

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;
    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult HandleResult<T>(Result<T> result) => result.StatusCode switch
    {
        200 => Ok(new ApiResponse<T>(true, result.Value, null, null)),
        201 => CreatedAtAction(null, new ApiResponse<T>(true, result.Value, null, null)),
        404 => NotFound(new ApiResponse<T>(false, default, result.Error, null)),
        409 => Conflict(new ApiResponse<T>(false, default, result.Error, null)),
        _   => BadRequest(new ApiResponse<T>(false, default, result.Error, null))
    };
}

// Exemplu controller
[HttpPost]
public async Task<IActionResult> Create(CreatePatientRequest request, CancellationToken ct)
{
    var command = new CreatePatientCommand(
        request.FirstName, request.LastName, request.Cnp,
        request.PhoneNumber, request.Email);

    var result = await Mediator.Send(command, ct);
    return HandleResult(result);
}
```

---

## 6. CONVENȚII FRONTEND REACT + TYPESCRIPT

### 6.1 Separare fișiere — Markup / Logică / Stil

Fiecare componentă complexă are director propriu cu fișiere separate:

```
components/ui/AppButton/
├── AppButton.tsx           # JSX markup — logică minimă
├── AppButton.module.scss   # Stiluri CSS izolate (CSS Modules)
├── AppButton.types.ts      # Tipuri/interfețe TypeScript
├── useAppButton.ts         # Hook custom cu logica (dacă e nevoie)
├── AppButton.test.tsx      # Teste
└── index.ts                # Barrel export: export { AppButton } from './AppButton'
```

Pentru componente simple (< 40 linii) poți combina markup + types în același fișier.

```tsx
// AppButton.types.ts
export interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

// AppButton.tsx
import type { AppButtonProps } from './AppButton.types';
import styles from './AppButton.module.scss';
import { clsx } from 'clsx';

export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  children,
  className,
  ...rest
}) => (
  <button
    className={clsx(
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      isLoading && styles['button--loading'],
      className
    )}
    disabled={isLoading || rest.disabled}
    {...rest}
  >
    {isLoading ? (
      <span className={styles.spinner} />
    ) : (
      <>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        {children}
      </>
    )}
  </button>
);
```

```scss
// AppButton.module.scss
@import '@/styles/variables';

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: $border-radius;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &--primary {
    background-color: $primary;
    color: #fff;
    &:hover:not(:disabled) { background-color: $primary-dark; }
  }

  &--secondary {
    background-color: transparent;
    color: $primary;
    border: 1px solid $primary;
    &:hover:not(:disabled) { background-color: rgba($primary, 0.08); }
  }

  &--sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
  &--md { padding: 0.5rem 1.25rem; font-size: 0.9375rem; }
  &--lg { padding: 0.625rem 1.75rem; font-size: 1.0625rem; }

  &--loading { opacity: 0.7; cursor: not-allowed; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
```

### 6.2 CSS Global vs CSS Module

| Tip | Locație | Utilizare |
|-----|---------|-----------|
| **CSS Global** | `src/styles/*.scss` | Variabile, reset, tipografie, override Bootstrap/Syncfusion |
| **CSS Module** | `*.module.scss` lângă componentă | Stiluri specifice, izolate automat |
| **Bootstrap utility** | inline `className` | Layout rapid: `d-flex`, `gap-3`, `mb-4`, `text-center` |

Bootstrap 5 se folosește pentru **layout și spațiere**. Culorile și stilul vizual specific → variabile SCSS + CSS Modules.

### 6.3 Wrappere Syncfusion — Obligatoriu

Niciodată componente Syncfusion folosite direct în feature components. Întotdeauna wrapped în `components/`:

```tsx
// components/forms/FormInput/FormInput.tsx
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import styles from './FormInput.module.scss';

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  disabled?: boolean;
}

export const FormInput = <T extends FieldValues>({
  name, control, label, placeholder, type = 'text', required, disabled
}: FormInputProps<T>) => {
  const { field, fieldState: { error } } = useController({ name, control });

  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <TextBoxComponent
        {...field}
        placeholder={placeholder}
        type={type}
        enabled={!disabled}
        cssClass={error ? 'e-error' : ''}
        value={field.value ?? ''}
        input={(e) => field.onChange(e.value)}
      />
      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  );
};
```

#### AppDataGrid — Grid reutilizabil (componenta reală)

`AppDataGrid` centralizează TOATE configurările comune ale Syncfusion GridComponent.
Fiecare pagină de tip listă folosește `<AppDataGrid>` — **niciodată** `<GridComponent>` direct.

**Fișiere componente:**
```
components/data-display/AppDataGrid/
├── AppDataGrid.tsx           # Wrapper — include sort/filter/group/page/export/columnChooser
├── AppDataGrid.types.ts      # Props: dataSource, children, sortSettings, gridRef, height, rowHeight
├── AppDataGrid.module.scss   # Stiluri container + override-uri Syncfusion (:global)
├── useGridExport.ts          # Hook reutilizabil pentru Excel/PDF export cu template save/restore
└── index.ts                  # Barrel export
```

**Reguli stricte AppDataGrid:**
- **Column Chooser nativ** — `toolbar={['ColumnChooser']}` + serviciul `Toolbar` injectat. Syncfusion gestionează butonul și poziționarea dialogului. **Niciodată** butoane custom pentru Column Chooser
- **13 servicii injectate**: Page, Sort, Filter, Group, Reorder, Resize, Freeze, ExcelExport, PdfExport, ColumnChooser, Toolbar
- **Setări baked-in**: filterSettings (Menu), groupSettings (showDropArea), pageSettings (10 rows, pageSizes [5,10,20,50])
- **Sort settings** — override per pagină prin prop `sortSettings`; default: `fullName` Ascending
- **Coloane ca children** — `<ColumnsDirective>` + `<ColumnDirective>` se pasează ca `children`
- **Export** — prin `useGridExport(gridRef, config)` hook; gestionează save/restore template-uri JSX

```tsx
// Folosire în pagini — exemplu complet:
import { useRef } from 'react'
import type { GridComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-grids'
import { AppDataGrid, useGridExport } from '@/components/data-display/AppDataGrid'

const SORT_SETTINGS = { columns: [{ field: 'fullName', direction: 'Ascending' as const }] }

export const PatientsListPage = () => {
  const gridRef = useRef<GridComponent>(null)

  const { handleExcelExport, handlePdfExport } = useGridExport(gridRef, {
    fileNamePrefix: 'pacienti',
    buildExportData: () => filteredData.map(p => ({ /* plain object fără JSX */ })),
  })

  return (
    <AppDataGrid gridRef={gridRef} dataSource={filteredData} sortSettings={SORT_SETTINGS}>
      <ColumnsDirective>
        <ColumnDirective field="fullName" headerText="Pacient" width="230" />
        <ColumnDirective field="cnp" headerText="CNP" width="150" />
        {/* ... alte coloane ... */}
      </ColumnsDirective>
    </AppDataGrid>
  )
}
```

**useGridExport — Template save/restore pattern:**
Syncfusion nu poate serializa template-uri JSX la export Excel/PDF. Hook-ul:
1. Salvează template-urile JSX de pe coloane într-un `Map`
2. Le setează pe `null` temporar
3. Apelează `grid.excelExport()` / `grid.pdfExport()` cu `dataSource` plain-object
4. Restaurează template-urile JSX după export
5. Returnează `{ handleExcelExport, handlePdfExport }`

### 6.3.1 Documentație Syncfusion — Resurse & Reguli Obligatorii

**REGULĂ STRICTĂ**: Înainte de a crea, modifica sau stiliza orice componentă Syncfusion, **consultă obligatoriu documentația oficială** pentru a folosi API-ul corect, clasele CSS actualizate și pattern-urile recomandate. Nu presupune nume de clase sau proprietăți — verifică documentația.

#### Resurse documentare — linkuri de referință

| Categorie | URL | Folosire |
|-----------|-----|----------|
| **Grid — General** | https://ej2.syncfusion.com/react/documentation/grid/getting-started | Setup, proprietăți, evenimente |
| **Grid — Column Chooser** | https://ej2.syncfusion.com/react/documentation/grid/columns/column-chooser | `showColumnChooser`, dialog CSS (`.e-ccdlg`), search, template |
| **Grid — Toolbar Items** | https://ej2.syncfusion.com/react/documentation/grid/tool-bar/tool-bar-items | Built-in items, custom items, `ItemModel`, `align`, `toolbarClick` |
| **Grid — Toolbar Styling** | https://ej2.syncfusion.com/react/documentation/grid/tool-bar/tool-bar-styling | CSS classes toolbar, ascundere text (`.e-tbar-btn-text`) |
| **Grid — Excel/PDF Export** | https://ej2.syncfusion.com/react/documentation/grid/excel-export/excel-exporting | Export configurare, custom data source |
| **Grid — Filtering** | https://ej2.syncfusion.com/react/documentation/grid/filtering/filtering | FilterSettings, Menu/CheckBox/Excel filter |
| **Grid — Paging** | https://ej2.syncfusion.com/react/documentation/grid/paging | PageSettings, pageSizes |
| **Grid — Sorting** | https://ej2.syncfusion.com/react/documentation/grid/sorting | SortSettings, multi-sort |
| **Grid — Grouping** | https://ej2.syncfusion.com/react/documentation/grid/grouping/grouping | GroupSettings, collapse/expand |
| **Grid — Frozen Columns** | https://ej2.syncfusion.com/react/documentation/grid/scrolling/frozen-column | freeze, isFrozen, freeze direction |
| **Theme Studio** | https://ej2.syncfusion.com/themestudio/?theme=bootstrap5 | Customizare teme vizuală |
| **Appearance — Theme** | https://ej2.syncfusion.com/react/documentation/appearance/theme | Variabile SCSS comune per temă |
| **Appearance — CSS Overrides** | https://ej2.syncfusion.com/react/documentation/common/how-to/customize-the-component-style | Pattern-uri override CSS cu `:global` |
| **API Reference — Grid** | https://ej2.syncfusion.com/react/documentation/api/grid | Toate proprietățile, metodele, evenimentele Grid |
| **Scheduler** | https://ej2.syncfusion.com/react/documentation/schedule/getting-started | Calendar programări |
| **DatePicker** | https://ej2.syncfusion.com/react/documentation/datepicker/getting-started | Date input |
| **NumericTextBox** | https://ej2.syncfusion.com/react/documentation/numerictextbox/getting-started | Numeric input |
| **Dialog** | https://ej2.syncfusion.com/react/documentation/dialog/getting-started | Modal dialogs |

#### Reguli de customizare CSS Syncfusion

1. **Verifică clasele din documentație** — nu presupune numele claselor CSS. Syncfusion le poate schimba între versiuni
2. **Folosește `:global` în CSS Modules** — clasele Syncfusion nu sunt module-scoped, trebuie `:global { .e-grid { ... } }`
3. **`!important` e necesar** — stilurile Syncfusion au specificitate mare; override-urile necesită `!important`
4. **Ascundere text toolbar** — `display: none !important` pe `.e-tbar-btn-text` (documentat oficial)
5. **Resetare containere wrapper** — `.e-toolbar-item` și `.e-tbar-btn` au stiluri proprii care pot crea efecte vizuale nedorite (background, border, shadow) — resetează-le explicit
6. **Dialog Column Chooser** — clasa corectă e `.e-dialog.e-ccdlg` sau `.e-ccdlg`; dialog size custom prin CSS (documentat oficial)
7. **Nu adăuga `::after` / `::before`** pe elemente Syncfusion fără verificare — unele componente le folosesc intern

#### Lecții învățate (din experiența proiectului)

| Problemă | Cauză | Soluție |
|----------|-------|---------|
| Column Chooser dialog apare în poziție greșită | Buton custom **în afara** grid-ului — Syncfusion nu poate calcula poziția | Folosește `toolbar={['ColumnChooser']}` nativ, nu buton extern |
| Text "Columns" apare lângă textul custom | `.e-tbar-btn-text` nu era ascuns | `.e-tbar-btn-text { display: none !important }` la nivel de toolbar |
| Buton invizibil sub header grid | Toolbar cu `background: transparent` și `border: none` | Toolbar cu `background: $card-bg` și `min-height: 44px` |
| Efect de "dublare" buton (shadow/border dublu) | `.e-toolbar-item` și `.e-tbar-btn` au stiluri proprii Syncfusion | Resetează: `background: transparent`, `border: none`, `box-shadow: none` pe ambele |
| Export Excel corupe template-uri JSX | Syncfusion nu serializează JSX la export | Pattern save/restore: salvează template → null → export → restaurează |

### 6.4 React Hook Form + Zod — Pattern standard

Fiecare feature cu formular are schema Zod separată în `features/[feature]/schemas/`:

```ts
// features/patients/schemas/patient.schema.ts
import { z } from 'zod';

// Validator CNP simplu (extensibil cu logică completă)
const cnpRegex = /^[1-9]\d{12}$/;

export const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Prenumele este obligatoriu')
    .max(100, 'Prenumele nu poate depăși 100 de caractere'),
  lastName: z
    .string()
    .min(1, 'Numele este obligatoriu')
    .max(100, 'Numele nu poate depăși 100 de caractere'),
  cnp: z
    .string()
    .regex(cnpRegex, 'CNP-ul trebuie să aibă 13 cifre valide'),
  phoneNumber: z
    .string()
    .regex(/^(\+40|0)[0-9]{9}$/, 'Numărul de telefon nu este valid')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Adresa de email nu este validă')
    .optional()
    .or(z.literal('')),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  id: z.string().uuid(),
});

// Tipuri derivate din schema — nu se duplică tipuri manual
export type CreatePatientFormData = z.infer<typeof createPatientSchema>;
export type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;
```

```tsx
// features/patients/components/PatientForm/PatientForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientSchema, type CreatePatientFormData } from '../../schemas/patient.schema';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface PatientFormProps {
  onSubmit: (data: CreatePatientFormData) => void;
  isLoading?: boolean;
}

export const PatientForm = ({ onSubmit, isLoading }: PatientFormProps) => {
  const { control, handleSubmit } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: { firstName: '', lastName: '', cnp: '', phoneNumber: '', email: '' }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="row g-3">
        <div className="col-md-6">
          <FormInput name="lastName" control={control} label="Nume" required />
        </div>
        <div className="col-md-6">
          <FormInput name="firstName" control={control} label="Prenume" required />
        </div>
        <div className="col-md-4">
          <FormInput name="cnp" control={control} label="CNP" required />
        </div>
        <div className="col-md-4">
          <FormInput name="phoneNumber" control={control} label="Telefon" type="text" />
        </div>
        <div className="col-md-4">
          <FormInput name="email" control={control} label="Email" type="email" />
        </div>
      </div>
      <div className="d-flex justify-content-end mt-3">
        <AppButton type="submit" isLoading={isLoading}>Salvează Pacient</AppButton>
      </div>
    </form>
  );
};
```

### 6.5 TanStack Query — Pattern standard

```ts
// features/patients/hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { patientsApi } from '@/api/endpoints/patients.api';
import type { GetPatientsParams, CreatePatientPayload } from '../types/patient.types';

// Query keys — organizate ierarhic
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params: GetPatientsParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

export const usePatients = (params: GetPatientsParams) =>
  useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

export const usePatient = (id: string) =>
  useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.getById(id),
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.lists() }),
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientPayload> }) =>
      patientsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) });
    },
  });
};
```

### 6.6 Zustand — Pattern store

```ts
// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'ClinicManager';
  clinicId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateToken: (token: string) => void;
  clearAuth: () => void;
}

// Access token în memorie (sessionStorage) — NU localStorage pentru securitate
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      updateToken: (accessToken) =>
        set({ accessToken }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage, nu localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// store/uiStore.ts
interface UiState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  activeNotifications: number;
  toggleSidebar: () => void;
  setNotificationCount: (count: number) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  activeNotifications: 0,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setNotificationCount: (count) => set({ activeNotifications: count }),
}));
```

### 6.7 Naming Conventions Frontend

| Element | Convenție | Exemplu |
|---------|-----------|---------|
| Component file | PascalCase | `AppButton.tsx` |
| CSS Module | PascalCase.module.scss | `AppButton.module.scss` |
| Hook file | use + camelCase | `usePatients.ts` |
| Store file | camelCase + Store | `authStore.ts` |
| API file | camelCase + .api | `patients.api.ts` |
| Schema file | camelCase + .schema | `patient.schema.ts` |
| Types file | camelCase + .types | `patient.types.ts` |
| Constantă | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Interface/Type | PascalCase, fără prefix `I` | `PatientDetailDto` |
| Directory shared | kebab-case | `data-display/` |
| Directory feature | camelCase | `patients/` |
| Prefix componente UI | App + PascalCase | `AppButton`, `AppDataGrid` |
| Event handler | handle + Action | `handleRowSelected` |

### 6.8 Reguli headerText în DataGrid

**Textele coloanelor (`headerText`) se scriu cu prima literă mare și restul litere mici** — nu UPPERCASE.

| ❌ Greșit (UPPERCASE) | ✅ Corect (Normal case) |
|----------------------|------------------------|
| `headerText="PACIENT"` | `headerText="Pacient"` |
| `headerText="GRUPĂ SANGUINĂ"` | `headerText="Grupă sanguină"` |
| `headerText="MEDIC PRIMAR"` | `headerText="Medic primar"` |
| `headerText="ULTIMA AUTENTIFICARE"` | `headerText="Ultima autentificare"` |

**Excepții — UPPERCASE permis doar pentru acronime și abrevieri consacrate:**
- `CNP` — acronim standard
- `Nr. CMR` — abreviere Colegiul Medicilor
- `CUI` — cod unic de identificare

**Nu se folosește `text-transform: uppercase` pe headerele grid-ului.**

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

**DbUp** rulează scripturi SQL în ordine, le trackează în tabelul `SchemaVersions`, idempotent by design. Perfect pentru setup-ul fără EF Migrations.

### Configurare DbUp

```csharp
// Infrastructure/Data/DatabaseMigrator.cs
using DbUp;

public static class DatabaseMigrator
{
    public static void MigrateDatabase(string connectionString)
    {
        // Asigură că baza de date există
        EnsureDatabase.For.SqlDatabase(connectionString);

        var upgrader = DeployChanges.To
            .SqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(
                Assembly.GetExecutingAssembly(),
                scriptName => scriptName.Contains("Scripts.Migrations"))
            .WithTransaction()
            .LogToConsole()
            .Build();

        var result = upgrader.PerformUpgrade();

        if (!result.Successful)
        {
            throw new InvalidOperationException(
                $"Migrare bază de date eșuată: {result.Error.Message}");
        }
    }
}

// Program.cs — apelat la startup
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
DatabaseMigrator.MigrateDatabase(connectionString);
```

### Structura scripturilor SQL

```
Infrastructure/Data/Scripts/
├── Migrations/                        # Scripturi numerotate — rulează o singură dată
│   ├── 0001_InitialSchema.sql         # CREATE TABLE pentru toate tabelele
│   ├── 0002_SeedNomenclature.sql      # Date inițiale: ICD-10, servicii, medicamente
│   ├── 0003_AddAuditColumns.sql       # Adaugă coloane audit unde lipsesc
│   └── 0004_Indexes.sql               # CREATE INDEX pe coloane frecvent filtrate
└── StoredProcedures/                  # SP-uri — CREATE OR ALTER, re-rulate la fiecare deploy
    ├── Patient_GetById.sql
    ├── Patient_GetPaged.sql
    ├── Patient_Create.sql
    └── ...
```

### Convenții fișiere migrare
- **Numerotare secvențială** — `0001`, `0002`, `0003` — niciodată schimbate după deploy
- **Numele descriptiv** — `0005_AddPaymentTable.sql`
- **Idempotente** unde posibil — `IF NOT EXISTS` pentru CREATE TABLE, `IF COL_LENGTH` pentru ADD COLUMN
- **SP-urile** nu sunt migrări — se re-rulează la fiecare deploy cu `CREATE OR ALTER`
- **Fișierele de migrare** nu se modifică niciodată după ce au rulat în producție — se adaugă un nou fișier
- **Encoding UTF-8 obligatoriu** — toate fișierele `.sql` se salvează în **UTF-8 with BOM** sau **UTF-8** și se execută cu `sqlcmd -f 65001` pentru a preserva diacriticele românești din seed data. Fără `-f 65001`, `sqlcmd` corupe caracterele non-ASCII din `NVARCHAR` (mojibake). **Verificare post-insert**: `SELECT UNICODE(SUBSTRING(col, pos, 1))` — ă=259, â=226, î=238, ș=537, ț=539

```sql
-- Exemplu 0001_InitialSchema.sql
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Clinics')
BEGIN
    CREATE TABLE Clinics (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name        NVARCHAR(200)    NOT NULL,
        Code        NVARCHAR(20)     NOT NULL,
        Address     NVARCHAR(500)    NULL,
        PhoneNumber NVARCHAR(20)     NULL,
        Email       NVARCHAR(200)    NULL,
        CUI         NVARCHAR(20)     NULL,
        IsActive    BIT              NOT NULL DEFAULT 1,
        CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt   DATETIME2        NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Patients')
BEGIN
    CREATE TABLE Patients (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        FirstName   NVARCHAR(100)    NOT NULL,
        LastName    NVARCHAR(100)    NOT NULL,
        Cnp         NCHAR(13)        NOT NULL,
        BirthDate   DATE             NULL,
        GenderId    UNIQUEIDENTIFIER NULL,
        PhoneNumber NVARCHAR(20)     NULL,
        Email       NVARCHAR(200)    NULL,
        IsDeleted   BIT              NOT NULL DEFAULT 0,
        RowVersion  ROWVERSION       NOT NULL,
        CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy   UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt   DATETIME2        NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Patients_Clinics FOREIGN KEY (ClinicId) REFERENCES Clinics(Id),
        CONSTRAINT UQ_Patients_Cnp_Clinic UNIQUE (Cnp, ClinicId)
    );
END;
GO
```

---

## 9. SCHEMA BAZĂ DE DATE

Referință pentru structura principalelor tabele. Claude folosește aceasta când generează SP-uri sau queries.

```sql
-- Tabele principale cu coloanele relevante
-- TOATE Id-urile sunt UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()
-- TOATE FK-urile sunt UNIQUEIDENTIFIER
-- NICIODATĂ INT IDENTITY

-- ==================== IDENTITATE & MULTI-TENANCY ====================

-- Clinics (multi-tenancy root)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 200), Code (NVARCHAR 20),
Address (NVARCHAR 500), PhoneNumber (NVARCHAR 20), Email (NVARCHAR 200),
CUI (NVARCHAR 20 — cod unic identificare fiscală),
CaenCode (NVARCHAR 10 NULL),
ContractCNAS (NVARCHAR 50 NULL — număr contract CNAS),
IsActive (BIT DEFAULT 1),
CreatedAt (DATETIME2), UpdatedAt (DATETIME2 NULL)

-- Users
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
Email (NVARCHAR 200 unic), PasswordHash (NVARCHAR 500),
FirstName (NVARCHAR 100), LastName (NVARCHAR 100),
RoleId (UNIQUEIDENTIFIER FK→Roles),
IsActive (BIT DEFAULT 1), IsDeleted (BIT DEFAULT 0),
LastLoginAt (DATETIME2 NULL), FailedLoginAttempts (INT DEFAULT 0), LockoutEnd (DATETIME2 NULL),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER NULL FK→Users),
UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL FK→Users)

-- Roles (nomenclator)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Admin, Doctor, Nurse, Receptionist, ClinicManager

-- RefreshTokens
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
UserId (UNIQUEIDENTIFIER NOT NULL FK→Users),
Token (NVARCHAR 500 NOT NULL),
ExpiresAt (DATETIME2 NOT NULL),
CreatedAt (DATETIME2 NOT NULL),
RevokedAt (DATETIME2 NULL),
ReplacedByToken (NVARCHAR 500 NULL — rotație refresh token),
CreatedByIp (NVARCHAR 50 NULL)

-- ==================== ENTITĂȚI MEDICALE ====================

-- Patients
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
FirstName, LastName, Cnp (NCHAR 13 unic per clinică), BirthDate,
GenderId (UNIQUEIDENTIFIER FK→Genders),
BloodTypeId (UNIQUEIDENTIFIER NULL FK→BloodTypes),
PhoneNumber, Email, Address (NVARCHAR 500 NULL),
IsDeleted (BIT DEFAULT 0),
RowVersion (ROWVERSION) — concurrency control,
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER FK→Users),
UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL FK→Users)

-- Doctors
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
FirstName, LastName, Email, PhoneNumber,
MedicalCode (NVARCHAR 20 — parafa),
SpecialtyId (UNIQUEIDENTIFIER FK→Specialties),
UserId (UNIQUEIDENTIFIER FK→Users),
IsDeleted (BIT DEFAULT 0),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER FK→Users),
UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL)

-- DoctorSchedules (program de lucru doctor)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
DoctorId (UNIQUEIDENTIFIER FK→Doctors),
DayOfWeek (TINYINT — 0=Luni..6=Duminică),
StartTime (TIME), EndTime (TIME),
SlotDurationMinutes (INT DEFAULT 30),
IsActive (BIT DEFAULT 1)

-- Appointments
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
PatientId (UNIQUEIDENTIFIER FK→Patients), DoctorId (UNIQUEIDENTIFIER FK→Doctors),
StartTime (DATETIME2), EndTime (DATETIME2),
StatusId (UNIQUEIDENTIFIER FK→AppointmentStatuses),
Notes (NVARCHAR MAX NULL),
IsDeleted (BIT DEFAULT 0),
RowVersion (ROWVERSION) — concurrency control,
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER), UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL)

-- Consultations
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
AppointmentId (UNIQUEIDENTIFIER NULL FK→Appointments — NULL=walk-in),
PatientId (UNIQUEIDENTIFIER FK→Patients), DoctorId (UNIQUEIDENTIFIER FK→Doctors),
ConsultationDate (DATETIME2),
ChiefComplaint (NVARCHAR 500), ClinicalExam (NVARCHAR MAX),
Diagnosis (NVARCHAR 500), ICD10Code (NVARCHAR 10),
Treatment (NVARCHAR MAX), Recommendations (NVARCHAR MAX),
IsDeleted (BIT DEFAULT 0),
RowVersion (ROWVERSION) — concurrency control,
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER), UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL)

-- Prescriptions
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
ConsultationId (UNIQUEIDENTIFIER FK→Consultations),
PatientId (UNIQUEIDENTIFIER FK→Patients), DoctorId (UNIQUEIDENTIFIER FK→Doctors),
PrescriptionDate (DATE),
IsDeleted (BIT DEFAULT 0),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER)

-- PrescriptionItems
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
PrescriptionId (UNIQUEIDENTIFIER FK→Prescriptions),
MedicationId (UNIQUEIDENTIFIER NULL FK→Medications — NULL=medicament nestandard),
MedicationName (NVARCHAR 200 — denormalizat pentru istoric),
Dosage (NVARCHAR 100), Frequency (NVARCHAR 100), Duration (NVARCHAR 100),
Notes (NVARCHAR 500 NULL)

-- MedicalDocuments (trimiteri, scrisori medicale, concedii)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
PatientId (UNIQUEIDENTIFIER FK→Patients), DoctorId (UNIQUEIDENTIFIER FK→Doctors),
ConsultationId (UNIQUEIDENTIFIER NULL FK→Consultations),
DocumentTypeId (UNIQUEIDENTIFIER FK→DocumentTypes),
DocumentNumber (NVARCHAR 50 NULL), DocumentDate (DATE),
Content (NVARCHAR MAX — conținut document),
IsDeleted (BIT DEFAULT 0),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER)

-- ==================== FACTURARE ====================

-- Invoices
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
PatientId (UNIQUEIDENTIFIER FK→Patients),
ConsultationId (UNIQUEIDENTIFIER NULL FK→Consultations),
InvoiceNumber (NVARCHAR 20 unic per clinică), InvoiceDate (DATE), DueDate (DATE),
TotalAmount (DECIMAL 10,2),
StatusId (UNIQUEIDENTIFIER FK→InvoiceStatuses),
PaymentTypeId (UNIQUEIDENTIFIER NULL FK→PaymentMethods),
IsDeleted (BIT DEFAULT 0),
RowVersion (ROWVERSION) — concurrency control,
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER), UpdatedAt (DATETIME2 NULL), UpdatedBy (UNIQUEIDENTIFIER NULL)

-- InvoiceItems
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
InvoiceId (UNIQUEIDENTIFIER FK→Invoices),
ServiceId (UNIQUEIDENTIFIER NULL FK→MedicalServices),
Description (NVARCHAR 200), Quantity (INT),
UnitPrice (DECIMAL 10,2), TotalPrice (DECIMAL 10,2)

-- Payments
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
InvoiceId (UNIQUEIDENTIFIER FK→Invoices), PaymentDate (DATETIME2),
Amount (DECIMAL 10,2),
PaymentMethodId (UNIQUEIDENTIFIER FK→PaymentMethods),
Reference (NVARCHAR 100 NULL), Notes (NVARCHAR 500 NULL),
IsDeleted (BIT DEFAULT 0),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER)

-- ==================== NOMENCLATOARE ====================

-- Specialties
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 100), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)

-- Genders
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 10), IsActive (BIT DEFAULT 1)

-- BloodTypes
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 10), Code (NVARCHAR 10), IsActive (BIT DEFAULT 1)
-- Seed: A+, A-, B+, B-, AB+, AB-, O+, O-

-- AppointmentStatuses
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Programat, Confirmat, Finalizat, Anulat, Neprezentare

-- InvoiceStatuses
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Draft, Emisă, Achitată, Anulată

-- PaymentMethods
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Numerar, Card, Transfer bancar, CNAS

-- DocumentTypes
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 100), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Trimitere, Scrisoare medicală, Concediu medical, Adeverință

-- Medications (nomenclator medicamente)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 200), ActiveSubstance (NVARCHAR 200 NULL),
Form (NVARCHAR 50 NULL — comprimat, sirop, injecție etc.),
Concentration (NVARCHAR 50 NULL),
IsCnasDeductible (BIT DEFAULT 0),
IsActive (BIT DEFAULT 1)

-- ICD10Codes (nomenclator diagnostice)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Code (NVARCHAR 10 — ex: J06.9), Name (NVARCHAR 500),
Category (NVARCHAR 200 NULL),
IsActive (BIT DEFAULT 1)

-- MedicalServices
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
Name (NVARCHAR 200), Code (NVARCHAR 20), Price (DECIMAL 10,2),
SpecialtyId (UNIQUEIDENTIFIER NULL FK→Specialties),
IsCnasDeductible (BIT DEFAULT 0),
IsActive (BIT DEFAULT 1), CreatedAt (DATETIME2)

-- ServiceCategories
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 100), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)

-- ==================== FIȘIERE & AUDIT ====================

-- MedicalFiles
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
EntityType (NVARCHAR 50 — 'Consultation', 'Patient', 'Prescription'),
EntityId (UNIQUEIDENTIFIER NOT NULL),
FileName (NVARCHAR 255), StoragePath (NVARCHAR 500),
ContentType (NVARCHAR 100), FileSizeBytes (BIGINT),
IsDeleted (BIT DEFAULT 0),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER)

-- AuditLog
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
EntityName (NVARCHAR 100), EntityId (NVARCHAR 50),
Action (NVARCHAR 10 — INSERT/UPDATE/DELETE),
OldValues (NVARCHAR MAX — JSON NULL), NewValues (NVARCHAR MAX — JSON NULL),
UserId (UNIQUEIDENTIFIER), UserEmail (NVARCHAR 200),
CreatedAt (DATETIME2), CorrelationId (NVARCHAR 50 NULL)

-- ==================== CNAS ====================

-- CnasReports
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
ClinicId (UNIQUEIDENTIFIER NOT NULL FK→Clinics),
PeriodFrom (DATE), PeriodTo (DATE),
ReportType (NVARCHAR 50 — 'Consultations', 'Prescriptions'),
StatusId (UNIQUEIDENTIFIER FK→CnasReportStatuses),
XmlFilePath (NVARCHAR 500 NULL),
SubmittedAt (DATETIME2 NULL), ResponseXml (NVARCHAR MAX NULL),
CreatedAt (DATETIME2), CreatedBy (UNIQUEIDENTIFIER)

-- CnasReportStatuses (nomenclator)
Id (UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()),
Name (NVARCHAR 50), Code (NVARCHAR 20), IsActive (BIT DEFAULT 1)
-- Seed: Draft, Generat, Trimis, Acceptat, Respins
```

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