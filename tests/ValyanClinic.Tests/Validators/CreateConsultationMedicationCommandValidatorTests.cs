using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.CreateConsultationMedication;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class CreateConsultationMedicationCommandValidatorTests
{
    private readonly CreateConsultationMedicationCommandValidator _validator = new();

    private static CreateConsultationMedicationCommand MinimalValid() => new(
        ConsultationId: Guid.NewGuid(),
        DrugCode: "W61038001",
        CopaymentListType: null,
        DoseMorning: null,
        DoseAfternoon: null,
        DoseEvening: null,
        DurationDays: null,
        Notes: null);

    [Fact]
    public void MinimalValid_ShouldPassValidation()
    {
        _validator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void DrugCode_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { DrugCode = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.DrugCode)
                  .WithErrorMessage("Medicamentul este obligatoriu.");
    }

    [Fact]
    public void ConsultationId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { ConsultationId = Guid.Empty };
        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.ConsultationId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(366)]
    public void DurationDays_OutOfRange_ShouldHaveError(int days)
    {
        var cmd = MinimalValid() with { DurationDays = days };
        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.DurationDays);
    }

    [Theory]
    [InlineData(0.25)]
    [InlineData(0.5)]
    [InlineData(1)]
    [InlineData(20)]
    public void Dose_ValidValue_ShouldPass(double dose)
    {
        var cmd = MinimalValid() with { DoseMorning = (decimal)dose, DoseAfternoon = (decimal)dose, DoseEvening = (decimal)dose };
        _validator.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(0.3)]
    [InlineData(20.25)]
    public void Dose_InvalidValue_ShouldHaveError(double dose)
    {
        var cmd = MinimalValid() with { DoseEvening = (decimal)dose };
        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.DoseEvening);
    }
}
