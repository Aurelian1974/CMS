using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste unitare pentru LoginCommandValidator.
/// Verifică toate regulile de validare: email, parolă, lungimi maxime.
/// </summary>
public sealed class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    // ── Email ──────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("admin")]
    [InlineData("user@example.com")]
    [InlineData("a")]
    public void Email_WhenProvided_ShouldNotHaveError(string email)
    {
        var result = _validator.TestValidate(new LoginCommand(email, "password123"));
        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenEmpty_ShouldHaveRequiredError()
    {
        var result = _validator.TestValidate(new LoginCommand("", "password123"));
        result.ShouldHaveValidationErrorFor(x => x.Email)
              .WithErrorMessage("Email-ul sau username-ul este obligatoriu.");
    }

    [Fact]
    public void Email_WhenExceeds200Characters_ShouldHaveError()
    {
        var longEmail = new string('a', 201);
        var result = _validator.TestValidate(new LoginCommand(longEmail, "password123"));
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Email_WhenExactly200Characters_ShouldNotHaveError()
    {
        var maxEmail = new string('a', 200);
        var result = _validator.TestValidate(new LoginCommand(maxEmail, "password123"));
        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    // ── Password ───────────────────────────────────────────────────────────

    [Fact]
    public void Password_WhenEmpty_ShouldHaveRequiredError()
    {
        var result = _validator.TestValidate(new LoginCommand("admin", ""));
        result.ShouldHaveValidationErrorFor(x => x.Password)
              .WithErrorMessage("Parola este obligatorie.");
    }

    [Fact]
    public void Password_WhenProvided_ShouldNotHaveError()
    {
        var result = _validator.TestValidate(new LoginCommand("admin", "any_password"));
        result.ShouldNotHaveValidationErrorFor(x => x.Password);
    }

    // ── Comandă validă completă ────────────────────────────────────────────

    [Fact]
    public void ValidCommand_ShouldHaveNoErrors()
    {
        var result = _validator.TestValidate(new LoginCommand("admin@valyan.ro", "secure123"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ValidCommand_WithUsername_ShouldHaveNoErrors()
    {
        var result = _validator.TestValidate(new LoginCommand("admin", "admini"));
        result.ShouldNotHaveAnyValidationErrors();
    }
}
