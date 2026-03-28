using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Doctors.Commands.CreateDoctor;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreateDoctorCommandValidator.
/// Acoperă: FirstName, LastName, Email, câmpuri opționale și regula
/// subspecialitate necesită specializare.
/// </summary>
public sealed class CreateDoctorCommandValidatorTests
{
    private readonly CreateDoctorCommandValidator _validator = new();

    /// Comandă minimă validă.
    private static CreateDoctorCommand MinimalValid(
        Guid? specialtyId = null,
        Guid? subspecialtyId = null) => new(
        DepartmentId: null,
        SupervisorDoctorId: null,
        SpecialtyId: specialtyId,
        SubspecialtyId: subspecialtyId,
        MedicalTitleId: null,
        FirstName: "Ion",
        LastName: "Popescu",
        Email: "ion.popescu@clinic.ro",
        PhoneNumber: null,
        MedicalCode: null,
        LicenseNumber: null,
        LicenseExpiresAt: null);

    // ── FirstName ─────────────────────────────────────────────────────────

    [Fact]
    public void FirstName_WhenEmpty_ShouldHaveRequiredError()
    {
        var cmd = MinimalValid() with { FirstName = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.FirstName)
                  .WithErrorMessage("Prenumele este obligatoriu.");
    }

    [Fact]
    public void FirstName_WhenExceeds100Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { FirstName = new string('a', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void FirstName_WhenValid_ShouldNotHaveError()
    {
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.FirstName);
    }

    // ── LastName ──────────────────────────────────────────────────────────

    [Fact]
    public void LastName_WhenEmpty_ShouldHaveRequiredError()
    {
        var cmd = MinimalValid() with { LastName = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.LastName)
                  .WithErrorMessage("Numele este obligatoriu.");
    }

    [Fact]
    public void LastName_WhenExceeds100Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { LastName = new string('z', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.LastName);
    }

    // ── Email ─────────────────────────────────────────────────────────────

    [Fact]
    public void Email_WhenEmpty_ShouldHaveRequiredError()
    {
        var cmd = MinimalValid() with { Email = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email)
                  .WithErrorMessage("Adresa de email este obligatorie.");
    }

    [Fact]
    public void Email_WhenInvalidFormat_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Email = "invalid-email" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email)
                  .WithErrorMessage("Adresa de email nu este validă.");
    }

    [Fact]
    public void Email_WhenExceeds200Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Email = new string('a', 193) + "@test.ro" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenValid_ShouldNotHaveError()
    {
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    // ── PhoneNumber (opțional) ────────────────────────────────────────────

    [Fact]
    public void PhoneNumber_WhenNull_ShouldNotHaveError()
    {
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Fact]
    public void PhoneNumber_WhenExceeds20Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PhoneNumber = new string('0', 21) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Fact]
    public void PhoneNumber_WhenExactly20Chars_ShouldNotHaveError()
    {
        var cmd = MinimalValid() with { PhoneNumber = new string('0', 20) };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }

    // ── MedicalCode (opțional) ────────────────────────────────────────────

    [Fact]
    public void MedicalCode_WhenExceeds20Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { MedicalCode = new string('X', 21) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.MedicalCode);
    }

    [Fact]
    public void MedicalCode_WhenNull_ShouldNotHaveError()
    {
        _validator.TestValidate(MinimalValid())
                  .ShouldNotHaveValidationErrorFor(x => x.MedicalCode);
    }

    // ── LicenseNumber (opțional) ──────────────────────────────────────────

    [Fact]
    public void LicenseNumber_WhenExceeds50Chars_ShouldHaveError()
    {
        var cmd = MinimalValid() with { LicenseNumber = new string('L', 51) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.LicenseNumber);
    }

    // ── Regula subspecialitate necesită specializare ───────────────────────

    [Fact]
    public void SubspecialtyId_WhenSetWithoutSpecialty_ShouldHaveError()
    {
        var cmd = MinimalValid(specialtyId: null, subspecialtyId: Guid.NewGuid());
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void SubspecialtyId_WhenSetWithSpecialty_ShouldNotHaveError()
    {
        var cmd = MinimalValid(specialtyId: Guid.NewGuid(), subspecialtyId: Guid.NewGuid());
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void SubspecialtyId_WhenNullWithoutSpecialty_ShouldNotHaveError()
    {
        var cmd = MinimalValid(specialtyId: null, subspecialtyId: null);
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ── Comandă validă completă ───────────────────────────────────────────

    [Fact]
    public void ValidCommand_ShouldHaveNoErrors()
    {
        var result = _validator.TestValidate(MinimalValid());
        result.ShouldNotHaveAnyValidationErrors();
    }
}
