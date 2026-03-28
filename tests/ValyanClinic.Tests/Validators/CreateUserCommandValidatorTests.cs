using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Users.Commands.CreateUser;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreateUserCommandValidator.
/// Acoperă toate câmpurile: RoleId, Username, Email, Password, FirstName, LastName,
/// și regula mutuală DoctorId/MedicalStaffId.
/// </summary>
public sealed class CreateUserCommandValidatorTests
{
    private readonly CreateUserCommandValidator _validator = new();

    /// Comandă validă care îndeplinește toate constrângerile — utilizată ca bază.
    private static CreateUserCommand ValidCommand(
        Guid? doctorId = null,
        Guid? medicalStaffId = null)
    {
        return new CreateUserCommand(
            RoleId: Guid.NewGuid(),
            DoctorId: doctorId,
            MedicalStaffId: medicalStaffId,
            Username: "ion.popescu",
            Email: "ion.popescu@valyan.ro",
            Password: "Parola1!",
            FirstName: "Ion",
            LastName: "Popescu",
            IsActive: true);
    }

    // ── RoleId ────────────────────────────────────────────────────────────

    [Fact]
    public void RoleId_WhenEmpty_ShouldHaveError()
    {
        var cmd = ValidCommand() with { RoleId = Guid.Empty };
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.RoleId);
    }

    [Fact]
    public void RoleId_WhenValid_ShouldNotHaveError()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveValidationErrorFor(x => x.RoleId);
    }

    // ── Username ──────────────────────────────────────────────────────────

    [Fact]
    public void Username_WhenEmpty_ShouldHaveRequiredError()
    {
        var cmd = ValidCommand() with { Username = "" };
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Username)
              .WithErrorMessage("Username-ul este obligatoriu.");
    }

    [Fact]
    public void Username_WhenExceeds100Characters_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Username = new string('a', 101) };
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Username);
    }

    [Theory]
    [InlineData("validUser")]
    [InlineData("user.name")]
    [InlineData("user-name")]
    [InlineData("user_name")]
    [InlineData("user123")]
    public void Username_WhenValidFormat_ShouldNotHaveError(string username)
    {
        var cmd = ValidCommand() with { Username = username };
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveValidationErrorFor(x => x.Username);
    }

    [Theory]
    [InlineData("user name")]      // spațiu
    [InlineData("user@name")]      // @
    [InlineData("user/name")]      // /
    public void Username_WhenInvalidFormat_ShouldHaveError(string username)
    {
        var cmd = ValidCommand() with { Username = username };
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Username);
    }

    // ── Email ─────────────────────────────────────────────────────────────

    [Fact]
    public void Email_WhenEmpty_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Email = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenInvalidFormat_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Email = "not-an-email" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenExceeds200Characters_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Email = new string('a', 193) + "@test.ro" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenValid_ShouldNotHaveError()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    // ── Password ──────────────────────────────────────────────────────────

    [Fact]
    public void Password_WhenEmpty_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Password = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_WhenTooShort_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Password = "ab123" }; // 5 chars
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password)
                  .WithErrorMessage("Parola trebuie să aibă minimum 8 caractere.");
    }

    [Fact]
    public void Password_WhenExactly8Characters_ShouldNotHaveError()
    {
        var cmd = ValidCommand() with { Password = "abc12345" };
        _validator.TestValidate(cmd)
                  .ShouldNotHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_WhenExceeds100Characters_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Password = new string('a', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password);
    }

    // ── FirstName / LastName ───────────────────────────────────────────────

    [Fact]
    public void FirstName_WhenEmpty_ShouldHaveError()
    {
        var cmd = ValidCommand() with { FirstName = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void FirstName_WhenExceeds100Characters_ShouldHaveError()
    {
        var cmd = ValidCommand() with { FirstName = new string('a', 101) };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void LastName_WhenEmpty_ShouldHaveError()
    {
        var cmd = ValidCommand() with { LastName = "" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.LastName);
    }

    // ── Regula mutuală DoctorId / MedicalStaffId ─────────────────────────

    [Fact]
    public void DoctorId_WhenOnlyDoctorIdSet_ShouldNotHaveError()
    {
        var cmd = ValidCommand(doctorId: Guid.NewGuid(), medicalStaffId: null);
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void MedicalStaffId_WhenOnlyMedicalStaffIdSet_ShouldNotHaveError()
    {
        var cmd = ValidCommand(doctorId: null, medicalStaffId: Guid.NewGuid());
        var result = _validator.TestValidate(cmd);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void BothIds_WhenBothSet_ShouldHaveError()
    {
        var cmd = ValidCommand(doctorId: Guid.NewGuid(), medicalStaffId: Guid.NewGuid());
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void BothIds_WhenBothNull_ShouldHaveError()
    {
        var cmd = ValidCommand(doctorId: null, medicalStaffId: null);
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }
}
