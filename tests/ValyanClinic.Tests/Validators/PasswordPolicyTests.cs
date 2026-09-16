using FluentValidation.TestHelper;
using ValyanClinic.Application.Common.Validation;
using ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;
using ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste pentru politica de parole, aplicată identic pe ambele fluxuri.
/// Politica anterioară cerea doar 8 caractere, fără listă de blocare.
/// </summary>
public sealed class PasswordPolicyTests
{
    private readonly ChangeOwnPasswordCommandValidator _ownValidator = new();
    private readonly ResetUserPasswordCommandValidator _resetValidator = new();

    private static ChangeOwnPasswordCommand Own(string newPassword)
        => new("ParolaCurenta123", newPassword);

    private static ResetUserPasswordCommand Reset(string newPassword)
        => new(Guid.NewGuid(), newPassword);

    // ── Lungime ───────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("scurt")]
    [InlineData("11caractere")]          // 11 — sub prag
    public void NewPassword_TooShort_HasError(string password)
    {
        _ownValidator.TestValidate(Own(password))
                     .ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public void NewPassword_AtMinimumLength_IsAccepted()
    {
        var password = new string('x', PasswordRules.MinimumLength);
        _ownValidator.TestValidate(Own(password))
                     .ShouldNotHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public void NewPassword_TooLong_HasError()
    {
        var password = new string('x', PasswordRules.MaximumLength + 1);
        _ownValidator.TestValidate(Own(password))
                     .ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    // ── Listă de blocare ──────────────────────────────────────────────────────

    [Theory]
    [InlineData("password123")]
    [InlineData("PASSWORD123")]          // comparația e case-insensitive
    [InlineData("parola123")]
    [InlineData("valyanclinic")]
    [InlineData("administrator")]
    [InlineData("1234567890")]
    public void NewPassword_CommonlyUsed_HasError(string password)
    {
        _ownValidator.TestValidate(Own(password))
                     .ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public void NewPassword_WhitespaceOnly_HasError()
    {
        _ownValidator.TestValidate(Own(new string(' ', 20)))
                     .ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    // ── Politica e identică pe ambele fluxuri ─────────────────────────────────

    [Theory]
    [InlineData("scurt")]
    [InlineData("password123")]
    public void ResetFlow_AppliesSamePolicy(string password)
    {
        _resetValidator.TestValidate(Reset(password))
                       .ShouldHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public void BothFlows_AcceptTheSameStrongPassword()
    {
        const string strong = "Ploaie-Verde-42-Munte";

        _ownValidator.TestValidate(Own(strong))
                     .ShouldNotHaveValidationErrorFor(x => x.NewPassword);
        _resetValidator.TestValidate(Reset(strong))
                       .ShouldNotHaveValidationErrorFor(x => x.NewPassword);
    }

    // ── Parola curentă ────────────────────────────────────────────────────────

    [Fact]
    public void CurrentPassword_Empty_HasError()
    {
        _ownValidator.TestValidate(new ChangeOwnPasswordCommand("", "Ploaie-Verde-42-Munte"))
                     .ShouldHaveValidationErrorFor(x => x.CurrentPassword);
    }
}
