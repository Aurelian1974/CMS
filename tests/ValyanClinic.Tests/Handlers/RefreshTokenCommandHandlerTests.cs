using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using ValyanClinic.Application.Features.Auth.Commands.RefreshToken;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru RefreshTokenCommandHandler.
///
/// Acoperă în special garanțiile adăugate în PR 3:
///   - detecția de reutilizare (token revocat prezentat din nou → revocare în lanț);
///   - ordinea operațiilor (starea contului verificată ÎNAINTE de rotație);
///   - rotația atomică și pierderea cursei cu o cerere concurentă.
/// </summary>
public sealed class RefreshTokenCommandHandlerTests
{
    private const string OldToken = "token-vechi";
    private const string NewToken = "token-nou";

    private readonly IAuthRepository _authRepo = Substitute.For<IAuthRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly IPermissionRepository _permissionRepo = Substitute.For<IPermissionRepository>();
    private readonly IMemoryCache _cache = new MemoryCache(Options.Create(new MemoryCacheOptions()));
    private readonly ISecurityEventLogger _securityLog = Substitute.For<ISecurityEventLogger>();

    private readonly ISecuritySettingsProvider _settingsProvider =
        Substitute.For<ISecuritySettingsProvider>();

    private readonly JwtOptions _jwtOptions = new() { AccessTokenExpiryMinutes = 5 };

    /// <summary>Fereastra de inactivitate a rolului din test.</summary>
    private RoleSecuritySettingsDto _roleSettings =
        new() { RefreshTokenDays = 7, IdleTimeoutMinutes = 30 };

    private RefreshTokenCommandHandler CreateHandler() => new(
        _authRepo,
        _tokenService,
        _permissionRepo,
        _settingsProvider,
        _securityLog,
        Options.Create(_jwtOptions),
        _cache);

    public RefreshTokenCommandHandlerTests()
    {
        _settingsProvider.GetForRoleAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                         .Returns(_ => Task.FromResult(_roleSettings));
    }

    private static RefreshTokenDto BuildToken(
        Guid userId,
        DateTime? revokedAt = null,
        DateTime? expiresAt = null,
        bool wasReplaced = false,
        DateTime? createdAt = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        ExpiresAt = expiresAt ?? DateTime.Now.AddDays(7),
        CreatedAt = createdAt ?? DateTime.Now.AddMinutes(-1),
        RevokedAt = revokedAt,
        WasReplaced = wasReplaced,
    };

    private static UserAuthDto BuildUser(Guid id, bool isActive = true) => new()
    {
        Id = id,
        ClinicId = Guid.NewGuid(),
        RoleId = Guid.NewGuid(),
        RoleCode = "admin",
        Email = "admin@test.com",
        PasswordHash = "hash",
        FirstName = "Admin",
        LastName = "User",
        IsActive = isActive,
    };

    private void SetupHappyPath(Guid userId)
    {
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(BuildToken(userId)));
        _authRepo.GetUserByIdForTokenAsync(userId, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(BuildUser(userId)));
        _tokenService.GenerateRefreshToken().Returns(NewToken);
        _tokenService.GenerateAccessToken(
                         Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(),
                         Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>())
                     .Returns("access-token");
        _authRepo.RotateRefreshTokenAsync(
                     OldToken, NewToken, userId, Arg.Any<DateTime>(),
                     Arg.Any<string?>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult(true));
        _permissionRepo.GetEffectiveByUserAsync(
                            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                       .Returns(Task.FromResult<IReadOnlyList<UserModulePermissionDto>>(
                           Array.Empty<UserModulePermissionDto>()));
    }

    // ── Token necunoscut ──────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_UnknownToken_ReturnsUnauthorized_WithoutRevokingAnything()
    {
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(null));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        await _authRepo.DidNotReceive().RevokeAllRefreshTokensAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    // ── Detecție de reutilizare ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_RevokedToken_RevokesEntireTokenChain()
    {
        var userId = Guid.NewGuid();
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, revokedAt: DateTime.Now.AddMinutes(-5), wasReplaced: true)));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal(ErrorMessages.Auth.TokenReuseDetected, result.Error);

        // Esențialul: sesiunea atacatorului nu supraviețuiește
        await _authRepo.Received(1).RevokeAllRefreshTokensAsync(
            userId, Arg.Any<CancellationToken>());
        await _authRepo.DidNotReceive().RotateRefreshTokenAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<DateTime>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());

        await _securityLog.Received(1).LogAsync(
            SecurityEventTypes.TokenReuseDetected, false, userId,
            Arg.Any<Guid?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TerminallyRevokedToken_IsRefusedWithoutRaisingAlarm()
    {
        // Logout, schimbare de parolă și dezactivare revocă token-ul FĂRĂ înlocuitor.
        // Un tab rămas deschis care reîncearcă nu e un atac: trebuie refuzat simplu,
        // fără revocare în lanț și fără eveniment de furt în jurnal — altfel alarma
        // care contează se îneacă în fals pozitivi.
        var userId = Guid.NewGuid();
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, revokedAt: DateTime.Now.AddMinutes(-5), wasReplaced: false)));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal(ErrorMessages.Auth.InvalidToken, result.Error);

        await _authRepo.DidNotReceive().RevokeAllRefreshTokensAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _securityLog.DidNotReceive().LogAsync(
            SecurityEventTypes.TokenReuseDetected, Arg.Any<bool>(), Arg.Any<Guid?>(),
            Arg.Any<Guid?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ExpiredToken_ReturnsUnauthorized_WithoutChainRevocation()
    {
        // Expirarea e un eveniment normal, nu semnal de furt — nu revocăm tot lanțul.
        var userId = Guid.NewGuid();
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, expiresAt: DateTime.Now.AddMinutes(-1))));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Auth.InvalidToken, result.Error);
        await _authRepo.DidNotReceive().RevokeAllRefreshTokensAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    // ── Ordinea operațiilor ───────────────────────────────────────────────────

    [Fact]
    public async Task Handle_InactiveUser_DoesNotRotate()
    {
        // Anterior rotația se făcea înaintea verificării contului, deci un cont
        // dezactivat primea totuși un token nou în baza de date.
        var userId = Guid.NewGuid();
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(BuildToken(userId)));
        _authRepo.GetUserByIdForTokenAsync(userId, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(BuildUser(userId, isActive: false)));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Auth.AccountInactive, result.Error);

        await _authRepo.DidNotReceive().RotateRefreshTokenAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<DateTime>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());

        // Contul fiind dezactivat, sesiunile rămase se sting
        await _authRepo.Received(1).RevokeAllRefreshTokensAsync(
            userId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DeletedUser_DoesNotRotate()
    {
        var userId = Guid.NewGuid();
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(BuildToken(userId)));
        _authRepo.GetUserByIdForTokenAsync(userId, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(null));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        await _authRepo.DidNotReceive().RotateRefreshTokenAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<DateTime>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    // ── Fereastra de inactivitate ─────────────────────────────────────────────

    [Fact]
    public async Task Handle_IdleBeyondRoleWindow_ExpiresSession()
    {
        // Token vechi de 40 de minute, fereastra 30 + marja de 5 = 35.
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, createdAt: DateTime.Now.AddMinutes(-40))));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Auth.SessionExpiredIdle, result.Error);

        await _authRepo.Received(1).RevokeAllRefreshTokensAsync(userId, Arg.Any<CancellationToken>());
        await _securityLog.Received(1).LogAsync(
            SecurityEventTypes.SessionExpiredIdle, false, userId,
            Arg.Any<Guid?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_IdleWithinWindow_IsAllowed()
    {
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, createdAt: DateTime.Now.AddMinutes(-25))));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
    }

    [Fact]
    public async Task Handle_TokenAgedWithinAccessTokenMargin_IsAllowed()
    {
        // Exact la limita ferestrei: marja de un access token evită deconectarea unui
        // utilizator care a fost activ la finalul ultimului interval de 5 minute.
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, createdAt: DateTime.Now.AddMinutes(-33))));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.True(result.IsSuccess, "marja de un access token trebuie respectată");
    }

    [Fact]
    public async Task Handle_ShorterRoleWindow_ExpiresSooner()
    {
        // Rol cu fereastră de 10 minute: un token de 20 de minute depășește 10 + 5.
        _roleSettings = new RoleSecuritySettingsDto { RefreshTokenDays = 7, IdleTimeoutMinutes = 10 };
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);
        _authRepo.GetRefreshTokenAsync(OldToken, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<RefreshTokenDto?>(
                     BuildToken(userId, createdAt: DateTime.Now.AddMinutes(-20))));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Auth.SessionExpiredIdle, result.Error);
    }

    // ── Rotație ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidToken_RotatesAtomically_AndReturnsNewPair()
    {
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);

        var result = await CreateHandler().Handle(
            new RefreshTokenCommand(OldToken, "10.0.0.1"), default);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.Equal("access-token", result.Value!.AccessToken);
        Assert.Equal(NewToken, result.Value.RefreshToken);

        await _authRepo.Received(1).RotateRefreshTokenAsync(
            OldToken, NewToken, userId, Arg.Any<DateTime>(),
            "10.0.0.1", Arg.Any<CancellationToken>());

        // Rotația e o singură operație — nu mai există Revoke + Create separate
        await _authRepo.DidNotReceive().RevokeRefreshTokenAsync(
            Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
        await _authRepo.DidNotReceive().CreateRefreshTokenAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<DateTime>(),
            Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_LostRotationRace_ReturnsUnauthorized()
    {
        // Două tab-uri fac refresh simultan cu același token: SP-ul lasă doar o
        // rotație să reușească, iar cealaltă primește false.
        var userId = Guid.NewGuid();
        SetupHappyPath(userId);
        _authRepo.RotateRefreshTokenAsync(
                     OldToken, NewToken, userId, Arg.Any<DateTime>(),
                     Arg.Any<string?>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult(false));

        var result = await CreateHandler().Handle(new RefreshTokenCommand(OldToken, null), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal(ErrorMessages.Auth.InvalidToken, result.Error);
    }
}
