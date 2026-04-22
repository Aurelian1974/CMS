---
name: unit-tests
description: >
  USE WHEN: writing or fixing unit tests for backend C# code — command handlers,
  query handlers, validators, or domain logic. Covers: xunit + NSubstitute mocking,
  handler test structure with fixed Guid constants, Arg.Any<>() matching for repository
  calls with many parameters, validator tests with FluentValidation TestHelper,
  SqlExceptionHelper for SQL error simulation, Result<T> assertions, and test naming.
  AVOID for integration tests or frontend Vitest tests.
---

# Unit Tests Skill — ValyanClinic

## Test Projects

```
tests/ValyanClinic.Tests/
├── Handlers/           # Command & Query handler tests
├── Validators/         # FluentValidation tests
├── Domain/             # Entity / value object tests
└── TestHelpers/
    └── SqlExceptionHelper.cs   # Creates SqlException with specific Number
```

Frameworks: **xunit** + **NSubstitute** + **FluentValidation.TestHelper** + **coverlet.collector**

---

## Step 1 — Handler Test Structure

```csharp
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class CreateConsultationCommandHandlerTests
{
    // Fixed GUIDs — use distinct hex prefix per class for easy log tracing
    // VALID HEX ONLY: 0-9, A-F. Never G, H, S, etc.
    private static readonly Guid ClinicId = Guid.Parse("A1000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B1000001-0000-0000-0000-000000000001");
    private static readonly Guid NewId    = Guid.Parse("C1000001-0000-0000-0000-000000000001");

    // Mocks via NSubstitute
    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public CreateConsultationCommandHandlerTests()
    {
        // Wire up CurrentUser mock in constructor — used by all tests in class
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    // Factory method — creates handler with mocks
    private CreateConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    // Builder method — ALL parameters explicit with named args
    // CRITICAL: update this builder whenever Command record gains new parameters
    private static CreateConsultationCommand ValidCommand() => new(
        PatientId:                   Guid.NewGuid(),
        DoctorId:                    Guid.NewGuid(),
        AppointmentId:               null,
        Date:                        DateTime.UtcNow.AddHours(1),
        Motiv:                       "Durere de cap",
        IstoricMedicalPersonal:      null,
        TratamentAnterior:           null,
        IstoricBoalaActuala:         null,
        IstoricFamilial:             null,
        FactoriDeRisc:               null,
        AlergiiConsultatie:          null,
        StareGenerala:               null,
        Tegumente:                   null,
        Mucoase:                     null,
        Greutate:                    null,
        Inaltime:                    null,
        TensiuneSistolica:           null,
        TensiuneDiastolica:          null,
        Puls:                        null,
        FrecventaRespiratorie:       null,
        Temperatura:                 null,
        SpO2:                        null,
        Edeme:                       null,
        Glicemie:                    null,
        GanglioniLimfatici:          null,
        ExamenClinic:                null,
        AlteObservatiiClinice:       null,
        Investigatii:                null,
        AnalizeMedicale:             null,
        Diagnostic:                  null,
        DiagnosticCodes:             null,
        Recomandari:                 null,
        Observatii:                  null,
        Concluzii:                   null,
        EsteAfectiuneOncologica:     false,
        AreIndicatieInternare:       false,
        SaEliberatPrescriptie:       false,
        SeriePrescriptie:            null,
        SaEliberatConcediuMedical:   false,
        SerieConcediuMedical:        null,
        SaEliberatIngrijiriDomiciliu:false,
        SaEliberatDispozitiveMedicale:false,
        DataUrmatoareiVizite:        null,
        NoteUrmatoareaVizita:        null,
        StatusId:                    null);
```

---

## Step 2 — Mocking Repository Calls with Many Parameters

**The biggest trap:** repository interfaces have 40-50 parameters. NSubstitute WILL fail to match if you
provide fewer `Arg.Any<>()` than the method signature requires.

**Rule: Always use `Arg.Any<T>()` for every parameter. Never omit or hardcode fewer than the signature has.**

```csharp
// WRONG — only 14 args, but signature has 48 → compile error at arg count
_repo.CreateAsync(
    ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
    Arg.Any<Guid?>(), Arg.Any<DateTime>(),
    Arg.Any<string?>(), Arg.Any<string?>(),
    Arg.Any<Guid?>(), UserId,
    Arg.Any<CancellationToken>())
 .Returns(NewId);

// CORRECT — one Arg.Any<T>() per parameter in exact order
_repo.CreateAsync(
    Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
    Arg.Any<Guid?>(), Arg.Any<DateTime>(),
    // Tab 1: Anamneza (7 strings)
    Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    // Tab 2: Examen Clinic (string, string, string, decimal, int x5, decimal, int, string, decimal, string, string, string)
    Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    Arg.Any<decimal?>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<int?>(),
    Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<int?>(),
    Arg.Any<string?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    Arg.Any<string?>(),
    // Tab 3-6
    Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
    // Booleans + createdBy + CT
    Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<string?>(),
    Arg.Any<bool>(), Arg.Any<string?>(), Arg.Any<bool>(), Arg.Any<bool>(),
    Arg.Any<DateTime?>(), Arg.Any<string?>(), Arg.Any<Guid?>(),
    Arg.Any<Guid>(), Arg.Any<CancellationToken>())
 .Returns(NewId);
```

**Tip when writing mocks:** count the interface method parameters. If count differs from `Arg.Any<>()` count → compile error. Fix by checking `IConsultationRepository.cs`.

---

## Step 3 — Happy Path Test

```csharp
[Fact]
public async Task Handle_ValidCommand_ReturnsCreated()
{
    // Arrange
    _repo.CreateAsync(/* all Arg.Any<> */).Returns(NewId);

    // Act
    var result = await CreateHandler().Handle(ValidCommand(), default);

    // Assert
    Assert.True(result.IsSuccess);
    Assert.Equal(201, result.StatusCode);   // Created
    Assert.Equal(NewId, result.Value);
}
```

---

## Step 4 — CurrentUser Injection Test

```csharp
[Fact]
public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
{
    _repo.CreateAsync(/* all Arg.Any<> */).Returns(NewId);

    await CreateHandler().Handle(ValidCommand(), default);

    // Verify specific values were passed at specific positions
    await _repo.Received(1).CreateAsync(
        ClinicId,          // first arg must be ClinicId from CurrentUser
        Arg.Any<Guid>(), Arg.Any<Guid>(),
        /* ... all other Arg.Any<> ... */
        UserId,            // createdBy must be UserId from CurrentUser
        Arg.Any<CancellationToken>());
}
```

---

## Step 5 — SqlException Error Tests

```csharp
// TestHelpers/SqlExceptionHelper.cs — creates SqlException with specific Number
// Usage:
_repo.CreateAsync(/* all Arg.Any<> */)
     .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PatientCnpDuplicate));  // → 409 Conflict

_repo.CreateAsync(/* all Arg.Any<> */)
     .Throws(SqlExceptionHelper.Make(50999));  // generic → 400 Failure

// Assert:
Assert.False(result.IsSuccess);
Assert.Equal(409, result.StatusCode);  // or 404, 400 depending on mapping
```

---

## Step 6 — Validator Tests

```csharp
using FluentValidation.TestHelper;

public sealed class CreateConsultationCommandValidatorTests
{
    private readonly CreateConsultationCommandValidator _validator = new();

    // MUST include ALL command parameters — compiler error if any missing
    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId:  Guid.NewGuid(),
        Date:      DateTime.UtcNow.AddDays(1),
        Motiv:     "Consult",
        /* ... all other params null/false/0 ... */
        StatusId: null);

    // Test that error fires
    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");
    }

    // Test that no error fires
    [Fact]
    public void PatientId_WhenValid_ShouldNotHaveError()
    {
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.PatientId);
    }

    // Test all-valid scenario
    [Fact]
    public void ValidCommand_ShouldHaveNoErrors()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }
}
```

---

## Step 7 — Test Naming Convention

Pattern: `{MethodName}_{Scenario}_{ExpectedBehavior}`

| ✅ Good | ❌ Bad |
|---|---|
| `Handle_ValidCommand_ReturnsCreated` | `Test1` |
| `Handle_DuplicateCnp_ReturnsConflict` | `CreatePatientTest` |
| `PatientId_WhenEmpty_ShouldHaveError` | `ValidatesPatientId` |
| `Handle_ConsultationNotFound_ReturnsNotFound` | `HandleException` |

---

## Step 8 — UpdateAsync (Task, no return)

```csharp
// UpdateAsync returns Task (void) — use .Returns(Task.CompletedTask)
_repo.UpdateAsync(/* all Arg.Any<> */)
     .Returns(Task.CompletedTask);

// OR throws on not found:
_repo.UpdateAsync(/* all Arg.Any<> */)
     .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

var result = await CreateHandler().Handle(ValidCommand(), default);
Assert.False(result.IsSuccess);
Assert.Equal(404, result.StatusCode);
```

---

## Checklist Before Completing

- [ ] All `Arg.Any<T>()` count matches the interface method parameter count exactly
- [ ] `ValidCommand()` / `MinimalValid()` builder uses named args and includes every parameter
- [ ] Fixed Guid constants use valid hex prefixes (0-9, A-F only — not G, H, S)
- [ ] `CreateAsync` mock uses `.Returns(newId)`; `UpdateAsync` uses `.Returns(Task.CompletedTask)`
- [ ] SqlException tests use `SqlExceptionHelper.Make(number)` — never `new SqlException()`
- [ ] Test names follow `Method_Scenario_Expected` convention
- [ ] `ValidCommand_ShouldHaveNoErrors()` test present in every Validator test class
- [ ] Update `ValidCommand()` / `MinimalValid()` whenever command gains new parameters (CI will fail otherwise)
