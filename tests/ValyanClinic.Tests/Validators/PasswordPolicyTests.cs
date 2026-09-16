using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Validation;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using Xunit;

namespace ValyanClinic.Tests.Validators;

/// <summary>
/// Teste pentru politica de parole, acum citita din setări în loc de constante.
///
/// Verificatorul returnează lista de încălcări, nu un adevărat/fals: utilizatorul
/// trebuie să afle exact ce lipsește. Testele verifică și conținutul mesajelor unde
/// asta contează.
/// </summary>
public sealed class PasswordPolicyTests
{
    private readonly ISecuritySettingsProvider _provider =
        Substitute.For<ISecuritySettingsProvider>();

    /// <summary>Configurează politica activă pentru un test.</summary>
    private PasswordPolicyChecker WithSettings(SecuritySettingsDto settings)
    {
        _provider.GetAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(settings));
        return new PasswordPolicyChecker(_provider);
    }

    /// <summary>Politica implicită: exact comportamentul de dinainte de Etapa 2.</summary>
    private PasswordPolicyChecker WithDefaults() => WithSettings(new SecuritySettingsDto());

    // ── Comportamentul implicit nu se schimbă ─────────────────────────────────

    [Fact]
    public async Task Defaults_AcceptStrongPassword_WithoutCompositionRules()
    {
        // Regulile de compoziție pornesc oprite: o parolă lungă fără cifre trece,
        // exact ca înainte de a exista setările.
        var errors = await WithDefaults().ValidateAsync("Ploaie-Verde-Munte");

        Assert.Empty(errors);
    }

    [Theory]
    [InlineData("scurt")]
    [InlineData("11caractere")]
    public async Task Defaults_RejectTooShort(string password)
    {
        var errors = await WithDefaults().ValidateAsync(password);

        Assert.Contains(errors, e => e.Contains("minimum 12 caractere"));
    }

    [Theory]
    [InlineData("password123")]
    [InlineData("PAROLA123")]
    [InlineData("valyanclinic")]
    public async Task Defaults_RejectBlockedPasswords(string password)
    {
        var errors = await WithDefaults().ValidateAsync(password);

        Assert.Contains(errors, e => e.Contains("prea des folosită"));
    }

    [Fact]
    public async Task Defaults_RejectWhitespaceOnly()
    {
        var errors = await WithDefaults().ValidateAsync(new string(' ', 20));

        Assert.Contains(errors, e => e.Contains("doar spații"));
    }

    [Fact]
    public async Task Empty_IsRejectedWithSingleMessage()
    {
        var errors = await WithDefaults().ValidateAsync("");

        Assert.Single(errors);
        Assert.Contains("obligatorie", errors[0]);
    }

    // ── Reguli de compoziție, fiecare separat ─────────────────────────────────

    [Fact]
    public async Task MinDigits_IsEnforced_AndMessageSaysHowManyAreMissing()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinDigits = 3 });

        var errors = await checker.ValidateAsync("ParolaFaraCifre1");

        var message = Assert.Single(errors);
        Assert.Contains("cel puțin 3 cifre", message);
        Assert.Contains("(are 1)", message);
    }

    [Fact]
    public async Task MinSpecial_IsEnforced()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinSpecial = 2 });

        var errors = await checker.ValidateAsync("ParolaFaraSimboluri");

        Assert.Contains(errors, e => e.Contains("caractere speciale"));
    }

    [Fact]
    public async Task MinUppercase_IsEnforced()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinUppercase = 2 });

        var errors = await checker.ValidateAsync("parola-fara-majuscule");

        Assert.Contains(errors, e => e.Contains("litere mari"));
    }

    [Fact]
    public async Task MinLowercase_IsEnforced()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinLowercase = 2 });

        var errors = await checker.ValidateAsync("PAROLA-FARA-MINUSCULE");

        Assert.Contains(errors, e => e.Contains("litere mici"));
    }

    [Fact]
    public async Task SingularIsUsedForOne()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinDigits = 1 });

        var errors = await checker.ValidateAsync("ParolaFaraNiciUna");

        Assert.Contains(errors, e => e.Contains("1 cifră") && !e.Contains("cifre"));
    }

    [Fact]
    public async Task AllCompositionRules_AreReportedTogether()
    {
        // Utilizatorul trebuie să vadă tot ce lipsește dintr-o dată, nu regulă cu regulă.
        var checker = WithSettings(new SecuritySettingsDto
        {
            PasswordMinDigits    = 2,
            PasswordMinSpecial   = 2,
            PasswordMinUppercase = 2,
        });

        var errors = await checker.ValidateAsync("parolanumaicuminuscule");

        Assert.Equal(3, errors.Count);
    }

    [Fact]
    public async Task PasswordSatisfyingAllRules_IsAccepted()
    {
        var checker = WithSettings(new SecuritySettingsDto
        {
            PasswordMinDigits    = 2,
            PasswordMinSpecial   = 1,
            PasswordMinUppercase = 1,
            PasswordMinLowercase = 1,
        });

        var errors = await checker.ValidateAsync("Ploaie-Verde-42");

        Assert.Empty(errors);
    }

    // ── Caracterele speciale ──────────────────────────────────────────────────

    [Theory]
    [InlineData('!')]
    [InlineData('@')]
    [InlineData('-')]
    [InlineData(' ')]
    [InlineData('ș')]   // nu e special: e literă
    public void IsSpecial_ClassifiesByExclusion(char c)
    {
        // Definiția prin excludere evită o listă fixă de simboluri care ar respinge
        // caractere valide dintr-un layout de tastatură diferit.
        Assert.Equal(!char.IsLetterOrDigit(c), PasswordRules.IsSpecial(c));
    }

    // ── Parola egală cu identitatea contului ──────────────────────────────────

    [Fact]
    public async Task PasswordEqualToIdentityValue_IsRejected()
    {
        var checker = WithDefaults();

        var errors = await checker.ValidateAsync(
            "medic@valyanclinic.ro",
            ["medic@valyanclinic.ro", "medic"]);

        Assert.Contains(errors, e => e.Contains("identică cu emailul"));
    }

    [Fact]
    public async Task IdentityCheck_IsCaseInsensitive()
    {
        var checker = WithDefaults();

        var errors = await checker.ValidateAsync("Medic@Valyanclinic.Ro", ["medic@valyanclinic.ro"]);

        Assert.Contains(errors, e => e.Contains("identică cu emailul"));
    }

    [Fact]
    public async Task IdentityCheck_CanBeDisabled()
    {
        var checker = WithSettings(new SecuritySettingsDto { PasswordForbidIdentityValues = false });

        var errors = await checker.ValidateAsync("medic@valyanclinic.ro", ["medic@valyanclinic.ro"]);

        Assert.Empty(errors);
    }

    // ── Politica configurată nu poate coborî sub praguri ──────────────────────

    [Fact]
    public async Task ProviderGuaranteesFloors_SoCheckerNeverAcceptsShortPasswords()
    {
        // Provider-ul real trece setările prin SecuritySettingsLimits.Sanitize, deci
        // aici simulăm rezultatul acelei ridicări: 4 devine 8.
        var checker = WithSettings(new SecuritySettingsDto { PasswordMinLength = 8 });

        var errors = await checker.ValidateAsync("1234567");

        Assert.Contains(errors, e => e.Contains("minimum 8 caractere"));
    }
}
