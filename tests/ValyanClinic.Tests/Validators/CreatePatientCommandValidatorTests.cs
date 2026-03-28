using FluentValidation.TestHelper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Patients.Commands.CreatePatient;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreatePatientCommandValidator.
/// Acoperă: FirstName, LastName, CNP, Email, câmpuri opționale și sub-colecțiile
/// de alergii și contacte de urgență cu child rules.
/// </summary>
public sealed class CreatePatientCommandValidatorTests
{
    private readonly CreatePatientCommandValidator _validator = new();

    /// Comandă minimă validă — câmpuri opționale null, IsInsured=false.
    private static CreatePatientCommand MinimalValid() => new(
        FirstName: "Ion",
        LastName: "Popescu",
        Cnp: "1900101123457",
        BirthDate: null,
        GenderId: null,
        BloodTypeId: null,
        PhoneNumber: null,
        SecondaryPhone: null,
        Email: null,
        Address: null,
        City: null,
        County: null,
        PostalCode: null,
        InsuranceNumber: null,
        InsuranceExpiry: null,
        IsInsured: false,
        ChronicDiseases: null,
        FamilyDoctorName: null,
        Notes: null,
        Allergies: null,
        Doctors: null,
        EmergencyContacts: null);

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
    public void FirstName_WhenExceeds100Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { FirstName = new string('a', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void FirstName_WhenExactly100Characters_ShouldNotHaveError()
    {
        var cmd = MinimalValid() with { FirstName = new string('a', 100) };
        _validator.TestValidate(cmd)
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
    public void LastName_WhenExceeds100Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { LastName = new string('z', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.LastName);
    }

    // ── CNP ───────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("1900101123457")]   // valid — starts with 1
    [InlineData("2850202234568")]   // valid — starts with 2 (F)
    [InlineData("9010101999995")]   // valid — starts with 9
    public void Cnp_WhenValidFormat_ShouldNotHaveError(string cnp)
    {
        var cmd = MinimalValid() with { Cnp = cnp };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Cnp);
    }

    [Theory]
    [InlineData("0900101123456")]   // starts with 0 — invalid
    [InlineData("190010112345")]    // 12 digits — too short
    [InlineData("19001011234567")]  // 14 digits — too long
    [InlineData("1900101A23456")]   // contains letter
    public void Cnp_WhenInvalidFormat_ShouldHaveError(string cnp)
    {
        var cmd = MinimalValid() with { Cnp = cnp };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Cnp)
                  .WithErrorMessage("CNP-ul nu este valid (verificați formatul și cifra de control)."); 
    }

    [Fact]
    public void Cnp_WhenNull_ShouldNotHaveError()
    {
        // CNP este opțional în backend — validarea se aplică Când e completat
        var cmd = MinimalValid() with { Cnp = null };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Cnp);
    }

    // ── Email (opțional) ──────────────────────────────────────────────────

    [Fact]
    public void Email_WhenNull_ShouldNotHaveError()
    {
        var result = _validator.TestValidate(MinimalValid());
        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenValidEmail_ShouldNotHaveError()
    {
        var cmd = MinimalValid() with { Email = "pacient@test.ro" };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenInvalidFormat_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Email = "not-an-email" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email)
                  .WithErrorMessage("Adresa de email nu este validă.");
    }

    [Fact]
    public void Email_WhenExceeds200Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Email = new string('a', 193) + "@test.ro" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email);
    }

    // ── Câmpuri opționale cu MaxLength ────────────────────────────────────

    [Fact]
    public void PhoneNumber_WhenExceeds20Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { PhoneNumber = new string('1', 21) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Fact]
    public void Address_WhenExceeds500Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Address = new string('a', 501) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Address);
    }

    [Fact]
    public void Notes_WhenExceeds2000Characters_ShouldHaveError()
    {
        var cmd = MinimalValid() with { Notes = new string('n', 2001) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Notes);
    }

    // ── Alergii (child rules) ─────────────────────────────────────────────

    [Fact]
    public void Allergies_WhenAllergenNameEmpty_ShouldHaveChildError()
    {
        var allergy = new SyncAllergyItem(
            AllergyTypeId: Guid.NewGuid(),
            AllergySeverityId: Guid.NewGuid(),
            AllergenName: "",        // invalid
            Reaction: null,
            OnsetDate: null,
            Notes: null);

        var cmd = MinimalValid() with { Allergies = [allergy] };
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void Allergies_WhenValid_ShouldNotHaveError()
    {
        var allergy = new SyncAllergyItem(
            AllergyTypeId: Guid.NewGuid(),
            AllergySeverityId: Guid.NewGuid(),
            AllergenName: "Penicillin",
            Reaction: null,
            OnsetDate: null,
            Notes: null);

        var cmd = MinimalValid() with { Allergies = [allergy] };
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ── Contacte urgență (child rules) ────────────────────────────────────

    [Fact]
    public void EmergencyContacts_WhenFullNameEmpty_ShouldHaveChildError()
    {
        var contact = new SyncEmergencyContactItem(
            FullName: "",            // invalid
            Relationship: "Soț",
            PhoneNumber: "+40722123456",
            IsDefault: true,
            Notes: null);

        var cmd = MinimalValid() with { EmergencyContacts = [contact] };
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }

    // ── Comandă validă completă ───────────────────────────────────────────

    [Fact]
    public void ValidMinimalCommand_ShouldHaveNoErrors()
    {
        var result = _validator.TestValidate(MinimalValid());
        result.ShouldNotHaveAnyValidationErrors();
    }
}
