using FluentValidation.TestHelper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class PrescriptionValidatorTests
{
    private readonly CreatePrescriptionsCommandValidator _createValidator = new();
    private readonly CancelPrescriptionCommandValidator  _cancelValidator = new();

    private static PrescriptionItemData Item(string? drugCode = "W66595005", string? drugName = null, string? list = null) =>
        new(null, drugCode, drugName, list, null, 1, null, null, 10, null, null);

    private static CreatePrescriptionsCommand MinimalValid() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        ConsultationId: null,
        CareTypeId: null,
        InsuredCategoryId: null,
        TreatmentDays: null,
        Diagnostic: null,
        DiagnosticCodes: null,
        RegistryNumber: null,
        IsContinuation: false,
        ReferralLetterNumber: null,
        Notes: null,
        Items: [Item()]);

    [Fact]
    public void MinimalValid_ShouldPassValidation()
    {
        _createValidator.TestValidate(MinimalValid()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Items_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Items = [] };
        _createValidator.TestValidate(cmd)
                        .ShouldHaveValidationErrorFor(x => x.Items)
                        .WithErrorMessage("Adăugați cel puțin un medicament.");
    }

    [Fact]
    public void Item_FreeTextName_ShouldPass()
    {
        var cmd = MinimalValid() with { Items = [Item(drugCode: null, drugName: "Unguent magistral")] };
        _createValidator.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Item_WithoutCodeAndName_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Items = [Item(drugCode: null, drugName: null)] };
        Assert.NotEmpty(_createValidator.TestValidate(cmd).Errors);
    }

    [Fact]
    public void Item_CompensatedWithoutDrugCode_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Items = [Item(drugCode: null, drugName: "Ceva", list: "B")] };
        Assert.Contains(_createValidator.TestValidate(cmd).Errors,
            e => e.ErrorMessage == "Medicamentele compensate trebuie selectate din nomenclatorul CNAS.");
    }

    [Fact]
    public void PatientId_WhenEmpty_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PatientId = Guid.Empty };
        _createValidator.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.PatientId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(366)]
    public void TreatmentDays_OutOfRange_ShouldHaveError(int days)
    {
        var cmd = MinimalValid() with { TreatmentDays = days };
        _createValidator.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.TreatmentDays);
    }

    [Fact]
    public void Cancel_WithoutReason_ShouldHaveError()
    {
        _cancelValidator.TestValidate(new CancelPrescriptionCommand(Guid.NewGuid(), " "))
                        .ShouldHaveValidationErrorFor(x => x.Reason)
                        .WithErrorMessage("Motivul anulării este obligatoriu.");
    }
}
