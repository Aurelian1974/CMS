using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreateConsultationCommandValidator.
/// (Anamneza și Examenul Clinic au validatoare separate după refactor.)
/// </summary>
public sealed class CreateConsultationCommandValidatorTests
{
    private readonly CreateConsultationCommandValidator _validator = new();

    private static CreateConsultationCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddDays(1),
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
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.PatientId);
    }

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
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.DoctorId);
    }

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
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.Date);
    }

    [Fact]
    public void Diagnostic_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Diagnostic = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Diagnostic)
                  .WithErrorMessage("Diagnosticul nu poate depăși 4000 de caractere.");
    }

    [Fact]
    public void DiagnosticCodes_WhenExceeds2000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { DiagnosticCodes = new string('a', 2001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.DiagnosticCodes)
                  .WithErrorMessage("Codurile de diagnostic nu pot depăși 2000 de caractere.");
    }

    [Fact]
    public void Recomandari_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Recomandari = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Recomandari)
                  .WithErrorMessage("Recomandările nu pot depăși 4000 de caractere.");
    }

    [Fact]
    public void Observatii_WhenExceeds4000_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Observatii = new string('a', 4001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Observatii)
                  .WithErrorMessage("Observațiile nu pot depăși 4000 de caractere.");
    }

    [Fact]
    public void ValidCommand_ShouldHaveNoErrors()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }
}
