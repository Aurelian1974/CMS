using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Handlers;

/// <summary>
/// Teste end-to-end pentru pipeline-ul de autentificare:
/// LoginCommand → LoginCommandHandler → AuthRepository → SP → BCrypt → JwtTokenService → DB.
///
/// Testele de login cu succes necesită:
/// - Integration:TestUserEmail și Integration:TestUserPassword în testsettings.json.
/// Testele de eșec rulează fără configurare suplimentară.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class LoginHandlerTests(IntegrationTestFixture fixture)
{
    private ISender        Sender   => fixture.CreateSender();
    private IAuthRepository AuthRepo => fixture.GetRepository<IAuthRepository>();

    private string? TestEmail    => fixture.Configuration["Integration:TestUserEmail"];
    private string? TestPassword => fixture.Configuration["Integration:TestUserPassword"];
    private bool    HasTestUser  => !string.IsNullOrWhiteSpace(TestEmail) && !string.IsNullOrWhiteSpace(TestPassword);

    // ─────────────────────────────────────────────────────────────────────────
    // Utilizator inexistent → 401
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_NonExistentUser_ReturnsUnauthorized()
    {
        var result = await Sender.Send(
            new LoginCommand("nosuchuser_xyz@valyan.test", "SomePassword1!"),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task Login_EmptyEmail_ReturnsUnauthorized()
    {
        // Trim/empty → SP returnează null → 401
        var result = await Sender.Send(
            new LoginCommand("", "Password1!"),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login cu credențiale valide (necesită Integration:TestUserEmail/Password)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokensAndPermissions()
    {
        if (!HasTestUser)
        {
            // Sărim testul dacă nu există un utilizator de test configurat
            return;
        }

        var result = await Sender.Send(
            new LoginCommand(TestEmail!, TestPassword!),
            CancellationToken.None);

        Assert.True(result.IsSuccess, $"Login a eșuat: {result.Error}");
        Assert.Equal(200, result.StatusCode);

        var dto = result.Value!;
        Assert.False(string.IsNullOrWhiteSpace(dto.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(dto.RefreshToken));
        Assert.NotNull(dto.User);
        Assert.False(string.IsNullOrWhiteSpace(dto.User.Id));
        Assert.False(string.IsNullOrWhiteSpace(dto.User.ClinicId));
        Assert.NotNull(dto.Permissions);
    }

    [Fact]
    public async Task Login_ValidCredentials_AccessTokenIsJwt()
    {
        if (!HasTestUser) return;

        var result = await Sender.Send(
            new LoginCommand(TestEmail!, TestPassword!),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        var token = result.Value!.AccessToken;

        // Un JWT valid are exact 3 segmente Base64 separate prin '.'
        Assert.Equal(3, token.Split('.').Length);
    }

    [Fact]
    public async Task Login_ValidCredentials_PermissionsListIsPopulated()
    {
        if (!HasTestUser) return;

        var result = await Sender.Send(
            new LoginCommand(TestEmail!, TestPassword!),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        // Admin-ul trebuie să aibă permisiuni definite
        Assert.NotEmpty(result.Value!.Permissions);
    }

    [Fact]
    public async Task Login_ValidCredentials_UserEmailMatchesInput()
    {
        if (!HasTestUser) return;

        var result = await Sender.Send(
            new LoginCommand(TestEmail!, TestPassword!),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(TestEmail, result.Value!.User.Email, StringComparer.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parolă greșită → 401
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        if (!HasTestUser) return;

        var result = await Sender.Send(
            new LoginCommand(TestEmail!, "WrongPassword999!"),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_FailedLoginCountIncremented()
    {
        if (!HasTestUser) return;

        // Stare înainte
        var userBefore = await AuthRepo.GetByEmailOrUsernameAsync(TestEmail!, CancellationToken.None);
        if (userBefore is null) return;

        var countBefore = userBefore.FailedLoginAttempts;

        await Sender.Send(
            new LoginCommand(TestEmail!, "WrongPassword_ForTest!"),
            CancellationToken.None);

        // Stare după — verificăm direct prin AuthRepository
        var userAfter = await AuthRepo.GetByEmailOrUsernameAsync(TestEmail!, CancellationToken.None);
        Assert.NotNull(userAfter);
        Assert.True(userAfter.FailedLoginAttempts > countBefore,
            "FailedLoginAttempts trebuie incrementat după o parolă greșită.");

        // Cleanup: resetăm contorul — login cu parola corectă
        if (!string.IsNullOrWhiteSpace(TestPassword))
        {
            await Sender.Send(new LoginCommand(TestEmail!, TestPassword!), CancellationToken.None);
        }
    }
}
