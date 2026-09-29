using FluentValidation.TestHelper;
using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Validation;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using ValyanClinic.Application.Features.Users.Commands.CreateUser;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru CreateUserCommandValidator.
/// Acoperă toate câmpurile: RoleId, Username, Email, Password (politica din Setări securitate),
/// FirstName, LastName și asocierea unică doctor / personal medical / personal administrativ.
/// </summary>
public sealed class CreateUserCommandValidatorTests
{
    private readonly ISecuritySettingsProvider _settings = Substitute.For<ISecuritySettingsProvider>();
    private readonly PolicyBackedValidator _validator;

    public CreateUserCommandValidatorTests()
    {
        _settings.GetAsync(Arg.Any<CancellationToken>()).Returns(new SecuritySettingsDto());
        _validator = new PolicyBackedValidator(
            new CreateUserCommandValidator(new PasswordPolicyChecker(_settings)));
    }

    /// Regula de parolă e asincronă (politica vine din setări), deci validarea sincronă ar arunca.
    /// Provider-ul substituit întoarce task-uri deja completate, așa că așteptarea nu blochează.
    private sealed class PolicyBackedValidator(CreateUserCommandValidator inner)
    {
        public TestValidationResult<CreateUserCommand> TestValidate(CreateUserCommand cmd)
            => inner.TestValidateAsync(cmd).GetAwaiter().GetResult();
    }

    /// Comandă validă care îndeplinește toate constrângerile — utilizată ca bază.
    /// Fără asociere explicită se folosește un doctor.
    private static CreateUserCommand ValidCommand(
        Guid? doctorId = null,
        Guid? medicalStaffId = null,
        Guid? administrativeStaffId = null)
    {
        var noAssociation = doctorId is null && medicalStaffId is null && administrativeStaffId is null;
        return new CreateUserCommand(
            RoleId: Guid.NewGuid(),
            DoctorId: noAssociation ? Guid.NewGuid() : doctorId,
            MedicalStaffId: medicalStaffId,
            AdministrativeStaffId: administrativeStaffId,
            Username: "ion.popescu",
            Email: "ion.popescu@valyan.ro",
            Password: "Ploaie-Verde-Munte",
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
    public void Password_WhenShorterThanDefaultPolicy_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Password = "abc12345" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password)
                  .WithErrorMessage("Parola trebuie să aibă minimum 12 caractere.");
    }

    [Fact]
    public void Password_UsesMinLengthFromSecuritySettings()
    {
        _settings.GetAsync(Arg.Any<CancellationToken>())
                 .Returns(new SecuritySettingsDto { PasswordMinLength = 20 });

        var cmd = ValidCommand() with { Password = "Ploaie-Verde-Munte" }; // 18 caractere
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password)
                  .WithErrorMessage("Parola trebuie să aibă minimum 20 caractere.");
    }

    [Fact]
    public void Password_WhenMissingRequiredDigit_ShouldHaveError()
    {
        _settings.GetAsync(Arg.Any<CancellationToken>())
                 .Returns(new SecuritySettingsDto { PasswordMinDigits = 1 });

        _validator.TestValidate(ValidCommand())
                  .ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_WhenEqualToUsername_ShouldHaveError()
    {
        var cmd = ValidCommand() with { Username = "ion.popescu.2026", Password = "ion.popescu.2026" };
        _validator.TestValidate(cmd)
                  .ShouldHaveValidationErrorFor(x => x.Password);
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

    // ── Asociere unică: doctor / personal medical / personal administrativ ─────────────────────────

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
    public void AdministrativeStaffId_WhenOnlyAdministrativeStaffIdSet_ShouldNotHaveError()
    {
        var cmd = ValidCommand(administrativeStaffId: Guid.NewGuid());
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
    public void DoctorAndAdministrative_WhenBothSet_ShouldHaveError()
    {
        var cmd = ValidCommand(doctorId: Guid.NewGuid(), administrativeStaffId: Guid.NewGuid());
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void AllIds_WhenAllNull_ShouldHaveError()
    {
        var cmd = ValidCommand() with { DoctorId = null };
        var result = _validator.TestValidate(cmd);
        Assert.NotEmpty(result.Errors);
    }
}
