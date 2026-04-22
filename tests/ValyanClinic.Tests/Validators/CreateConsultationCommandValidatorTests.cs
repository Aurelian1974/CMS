using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreateConsultationCommandValidator.
/// </summary>
public sealed class CreateConsultationCommandValidatorTests
{
    private readonly CreateConsultationCommandValidator _validator = new();

    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddDays(1),
        Motiv: "Consult",
        IstoricMedicalPersonal: null,
        TratamentAnterior: null,
        IstoricBoalaActuala: null,
        IstoricFamilial: null,
        FactoriDeRisc: null,
        AlergiiConsultatie: null,
        StareGenerala: null,
        Tegumente: null,
        Mucoase: null,
        Greutate: null,
        Inaltime: null,
        TensiuneSistolica: null,
        TensiuneDiastolica: null,
        Puls: null,
        FrecventaRespiratorie: null,
        Temperatura: null,
        SpO2: null,
        Edeme: null,
        Glicemie: null,
        GanglioniLimfatici: null,
        ExamenClinic: null,
        AlteObservatiiClinice: null,
        Investigatii: null,
        AnalizeMedicale: null,
        Diagnostic: null,
        DiagnosticCodes: null,
        Recomandari: null,
        Observatii: null,
        Concluzii: null,
        EsteAfectiuneOncologica: false,
        AreIndicatieInternare: false,
        SaEliberatPrescriptie: false,
        SeriePrescriptie: null,
        SaEliberatConcediuMedical: false,
        SerieConcediuMedical: null,
        SaEliberatIngrijiriDomiciliu: false,
        SaEliberatDispozitiveMedicale: false,
        DataUrmatoareiVizite: null,
        NoteUrmatoareaVizita: null,
        StatusId: null);

    // ── PatientId ─────────────────────────────────────────────────────────
    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PatientId)
                  .WithErrorMessage("Pacientul este obligatoriu.");
    }

    [Fact]
    public void PatientId_WhenValid_ShouldNotHaveError()
    {
        var cmd = MinimalValid();
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.PatientId);
    }

    // ── DoctorId ──────────────────────────────────────────────────────────
    [Fact]
    public void DoctorId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { DoctorId = Guid.Empty };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.DoctorId)
                  .WithErrorMessage("Doctorul este obligatoriu.");
    }

    [Fact]
    public void DoctorId_WhenValid_ShouldNotHaveError()
    {
        var cmd = MinimalValid();
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.DoctorId);
    }

    // ── Date ──────────────────────────────────────────────────────────────
    [Fact]
    public void Date_WhenDefault_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Date = default };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Date);
    }

    [Fact]
    public void Date_WhenValid_ShouldNotHaveError()
    {
        var cmd = MinimalValid();
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Date);
    }

    // ── Motiv max length ──────────────────────────────────────────────────
    [Fact]
    public void Motiv_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Motiv = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Motiv)
                  .WithErrorMessage("Motivul nu poate depăși 4000 de caractere.");
    }

    [Fact]
    public void Motiv_WhenExactly4000_ShouldNotHaveError()
    {
        var cmd = MinimalValid() with { Motiv = new string('a', 4000) };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Motiv);
    }

    // ── ExamenClinic max length ───────────────────────────────────────────
    [Fact]
    public void ExamenClinic_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { ExamenClinic = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.ExamenClinic)
                  .WithErrorMessage("Examenul clinic nu poate depăși 4000 de caractere.");
    }

    // ── Diagnostic max length ─────────────────────────────────────────────
    [Fact]
    public void Diagnostic_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Diagnostic = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Diagnostic)
                  .WithErrorMessage("Diagnosticul nu poate depăși 4000 de caractere.");
    }

    // ── DiagnosticCodes max length ────────────────────────────────────────
    [Fact]
    public void DiagnosticCodes_WhenExceeds2000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { DiagnosticCodes = new string('a', 2001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.DiagnosticCodes)
                  .WithErrorMessage("Codurile de diagnostic nu pot depăși 2000 de caractere.");
    }

    // ── Recomandari max length ────────────────────────────────────────────
    [Fact]
    public void Recomandari_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Recomandari = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Recomandari)
                  .WithErrorMessage("Recomandările nu pot depăși 4000 de caractere.");
    }

    // ── Observatii max length ─────────────────────────────────────────────
    [Fact]
    public void Observatii_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Observatii = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Observatii)
                  .WithErrorMessage("Observațiile nu pot depăși 4000 de caractere.");
    }

    // ── All valid ─────────────────────────────────────────────────────────
    [Fact]
    public void ValidCommand_ShouldHaveNoErrors()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }
}
