using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste pentru pragurile pe care administratorul nu le poate cobori.
///
/// Sanitize e ultimul strat de aparare: ruleaza la fiecare citire, deci garanteaza
/// ca aplicatia nu aplica niciodata o politica mai slaba decat minimul, indiferent
/// cum a ajuns valoarea in tabela — prin formular, prin stored procedure sau printr-un
/// UPDATE direct in baza de date.
/// </summary>
public sealed class SecuritySettingsLimitsTests
{
    // ── Lungimea parolei ──────────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(-5)]
    public void PasswordMinLength_BelowFloor_IsRaisedToFloor(int configured)
    {
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { PasswordMinLength = configured });

        Assert.Equal(SecuritySettingsLimits.MinPasswordLength, result.PasswordMinLength);
    }

    [Theory]
    [InlineData(8)]
    [InlineData(12)]
    [InlineData(20)]
    public void PasswordMinLength_AtOrAboveFloor_IsKept(int configured)
    {
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { PasswordMinLength = configured });

        Assert.Equal(configured, result.PasswordMinLength);
    }

    // ── Lista de blocare ──────────────────────────────────────────────────────

    [Fact]
    public void PasswordBlocklist_CannotBeDisabled()
    {
        // Chiar daca randul din baza de date spune 0, lista ramane activa.
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { PasswordBlocklistEnabled = false });

        Assert.True(result.PasswordBlocklistEnabled);
    }

    // ── Blocarea contului ─────────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void MaxFailedLoginAttempts_BelowFloor_IsRaised(int configured)
    {
        // Sub trei incercari, o greseala de tastare ar bloca contul.
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { MaxFailedLoginAttempts = configured });

        Assert.Equal(SecuritySettingsLimits.MinFailedLoginAttempts, result.MaxFailedLoginAttempts);
    }

    [Fact]
    public void LockoutMinutes_Zero_IsRaisedToOne()
    {
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { LockoutMinutes = 0 });

        Assert.Equal(SecuritySettingsLimits.MinLockoutMinutes, result.LockoutMinutes);
    }

    // ── Retentia jurnalului ───────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(30)]
    [InlineData(89)]
    public void SecurityEventRetention_BelowFloor_IsRaised(int configured)
    {
        // Sub 90 de zile jurnalul nu ar acoperi o investigatie tarzie.
        var result = SecuritySettingsLimits.Sanitize(
            new SecuritySettingsDto { SecurityEventRetentionDays = configured });

        Assert.Equal(
            SecuritySettingsLimits.MinSecurityEventRetentionDays,
            result.SecurityEventRetentionDays);
    }

    // ── Valori negative pe reguli optionale ───────────────────────────────────

    [Fact]
    public void NegativeCompositionRequirements_BecomeZero()
    {
        var result = SecuritySettingsLimits.Sanitize(new SecuritySettingsDto
        {
            PasswordMinDigits    = -1,
            PasswordMinSpecial   = -3,
            PasswordMinUppercase = -2,
            PasswordMinLowercase = -7,
            PasswordHistoryCount = -1,
            PasswordExpiryDays   = -10,
        });

        Assert.Equal(0, result.PasswordMinDigits);
        Assert.Equal(0, result.PasswordMinSpecial);
        Assert.Equal(0, result.PasswordMinUppercase);
        Assert.Equal(0, result.PasswordMinLowercase);
        Assert.Equal(0, result.PasswordHistoryCount);
        Assert.Equal(0, result.PasswordExpiryDays);
    }

    // ── Valorile implicite reproduc comportamentul de dinainte de migrare ─────

    [Fact]
    public void Defaults_MatchPreviousAppSettings()
    {
        // Aplicarea migrarii nu trebuie sa schimbe niciun comportament.
        var result = SecuritySettingsLimits.Sanitize(new SecuritySettingsDto());

        Assert.Equal(12,  result.PasswordMinLength);
        Assert.Equal(100, result.PasswordMaxLength);
        Assert.Equal(5,   result.MaxFailedLoginAttempts);
        Assert.Equal(15,  result.LockoutMinutes);
        Assert.Equal(730, result.SecurityEventRetentionDays);
        Assert.Equal(30,  result.RefreshTokenRetentionDays);

        // Regulile de compozitie pornesc oprite: politica ramane cea de azi
        // pana cand cineva le activeaza constient.
        Assert.Equal(0, result.PasswordMinDigits);
        Assert.Equal(0, result.PasswordMinSpecial);
    }

    // ── Setarile de rol ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(30, 30)]
    [InlineData(5000, 1440)]
    public void IdleTimeout_IsClampedToUsableRange(int configured, int expected)
    {
        var result = SecuritySettingsLimits.Sanitize(
            new RoleSecuritySettingsDto { IdleTimeoutMinutes = configured });

        Assert.Equal(expected, result.IdleTimeoutMinutes);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(7, 7)]
    [InlineData(400, 365)]
    public void RefreshTokenDays_IsClampedToUsableRange(int configured, int expected)
    {
        var result = SecuritySettingsLimits.Sanitize(
            new RoleSecuritySettingsDto { RefreshTokenDays = configured });

        Assert.Equal(expected, result.RefreshTokenDays);
    }

    [Fact]
    public void RoleDefaults_Are30MinutesAnd7Days()
    {
        var result = SecuritySettingsLimits.Sanitize(new RoleSecuritySettingsDto());

        Assert.Equal(30, result.IdleTimeoutMinutes);
        Assert.Equal(7,  result.RefreshTokenDays);
    }
}
