using FluentValidation.TestHelper;
using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Validation;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;
using ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;
using ValyanClinic.Application.Features.Users.DTOs;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Reset și schimbare proprie: parola nu poate fi egală cu emailul, username-ul sau numele
/// contului vizat, când politica din Setări securitate o interzice.
/// </summary>
public sealed class PasswordIdentityValidatorTests
{
    private static readonly Guid ClinicId = Guid.Parse("A8000001-0000-0000-0000-000000000001");
    private static readonly Guid AdminId  = Guid.Parse("B8000001-0000-0000-0000-000000000001");
    private static readonly Guid TargetId = Guid.Parse("C8000001-0000-0000-0000-000000000001");

    private readonly ISecuritySettingsProvider _settings    = Substitute.For<ISecuritySettingsProvider>();
    private readonly IUserRepository           _users       = Substitute.For<IUserRepository>();
    private readonly ICurrentUser              _currentUser = Substitute.For<ICurrentUser>();

    public PasswordIdentityValidatorTests()
    {
        _settings.GetAsync(Arg.Any<CancellationToken>()).Returns(new SecuritySettingsDto());
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(AdminId);
    }

    private static UserDetailDto Account(Guid id) => new()
    {
        Id = id,
        Email = "ana.ionescu@clinica.ro",
        Username = "ana.ionescu.2026",
        FirstName = "Ana",
        LastName = "Ionescu",
    };

    private ResetUserPasswordCommandValidator ResetValidator()
        => new(new PasswordPolicyChecker(_settings), _users, _currentUser);

    private ChangeOwnPasswordCommandValidator ChangeOwnValidator()
        => new(new PasswordPolicyChecker(_settings), _users, _currentUser);

    [Fact]
    public async Task Reset_PasswordEqualToTargetUsername_HasError()
    {
        _users.GetByIdAsync(TargetId, ClinicId, Arg.Any<CancellationToken>()).Returns(Account(TargetId));

        var result = await ResetValidator().TestValidateAsync(
            new ResetUserPasswordCommand(TargetId, "ANA.IONESCU.2026"));

        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
              .WithErrorMessage("Parola nu poate fi identică cu emailul, username-ul sau numele contului.");
    }

    [Fact]
    public async Task Reset_IdentityRuleDisabled_NoError()
    {
        _settings.GetAsync(Arg.Any<CancellationToken>())
                 .Returns(new SecuritySettingsDto { PasswordForbidIdentityValues = false });
        _users.GetByIdAsync(TargetId, ClinicId, Arg.Any<CancellationToken>()).Returns(Account(TargetId));

        var result = await ResetValidator().TestValidateAsync(
            new ResetUserPasswordCommand(TargetId, "ana.ionescu.2026"));

        result.ShouldNotHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public async Task Reset_UnknownTarget_ValidatesPolicyWithoutIdentity()
    {
        _users.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
              .Returns((UserDetailDto?)null);

        var result = await ResetValidator().TestValidateAsync(
            new ResetUserPasswordCommand(TargetId, "Ploaie-Verde-Munte"));

        result.ShouldNotHaveValidationErrorFor(x => x.NewPassword);
    }

    [Fact]
    public async Task ChangeOwn_PasswordEqualToOwnEmail_HasError()
    {
        _users.GetByIdAsync(AdminId, ClinicId, Arg.Any<CancellationToken>()).Returns(Account(AdminId));

        var result = await ChangeOwnValidator().TestValidateAsync(
            new ChangeOwnPasswordCommand("parola-veche-123", "ana.ionescu@clinica.ro"));

        result.ShouldHaveValidationErrorFor(x => x.NewPassword)
              .WithErrorMessage("Parola nu poate fi identică cu emailul, username-ul sau numele contului.");
    }

    [Fact]
    public async Task ChangeOwn_ValidPassword_NoError()
    {
        _users.GetByIdAsync(AdminId, ClinicId, Arg.Any<CancellationToken>()).Returns(Account(AdminId));

        var result = await ChangeOwnValidator().TestValidateAsync(
            new ChangeOwnPasswordCommand("parola-veche-123", "Ploaie-Verde-Munte"));

        result.ShouldNotHaveAnyValidationErrors();
    }
}
