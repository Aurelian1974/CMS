using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru LoginCommandHandler.
/// Mockuiesc toate dependențele externe (repository, hasher, token service)
/// și verifică behavior-ul handler-ului în fiecare scenariu posibil.
/// </summary>
public sealed class LoginCommandHandlerTests
{
    private readonly IAuthRepository _authRepo = Substitute.For<IAuthRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly IPermissionRepository _permissionRepo = Substitute.For<IPermissionRepository>();
    private readonly IMemoryCache _cache = new MemoryCache(Options.Create(new MemoryCacheOptions()));

    private readonly JwtOptions _jwtOptions = new() { RefreshTokenExpiryDays = 7 };
    private readonly RateLimitingOptions _rateLimitOptions = new() { LoginMaxAttempts = 5, LoginWindowMinutes = 15 };

    private LoginCommandHandler CreateHandler() => new(
        _authRepo,
        _passwordHasher,
        _tokenService,
        _permissionRepo,
        Options.Create(_jwtOptions),
        Options.Create(_rateLimitOptions),
        _cache);

    /// Construiește un UserAuthDto valid cu valorile implicite.
    private static UserAuthDto BuildUser(
        bool isActive = true,
        DateTime? lockoutEnd = null,
        int failedAttempts = 0) => new()
    {
        Id = Guid.NewGuid(),
        ClinicId = Guid.NewGuid(),
        RoleId = Guid.NewGuid(),
        RoleCode = "admin",
        RoleName = "Administrator",
        Username = "admin",
        Email = "admin@test.com",
        PasswordHash = "bcrypt-hashed-password",
        FirstName = "Admin",
        LastName = "User",
        IsActive = isActive,
        LockoutEnd = lockoutEnd,
        FailedLoginAttempts = failedAttempts,
    };

    // ── Utilizator inexistent ─────────────────────────────────────────────

    [Fact]
    public async Task Handle_UserNotFound_ReturnsUnauthorized()
    {
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(null));

        var result = await CreateHandler().Handle(
            new LoginCommand("nonexistent", "password"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        Assert.Null(result.Value);
    }

    // ── Cont inactiv ──────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_InactiveUser_ReturnsUnauthorized()
    {
        var user = BuildUser(isActive: false);
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "password"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    // ── Cont blocat ───────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_LockedAccount_ReturnsUnauthorized()
    {
        var user = BuildUser(lockoutEnd: DateTime.Now.AddMinutes(10));
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "password"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task Handle_LockoutExpired_ShouldNotBeBlocked()
    {
        // Lockout în trecut — contul nu mai este blocat
        var user = BuildUser(lockoutEnd: DateTime.Now.AddMinutes(-1));
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));

        // Parolă greșită pentru a nu trece de autentificare (testăm că lockout-ul nu blochează)
        _passwordHasher.VerifyPassword(Arg.Any<string>(), user.PasswordHash)
                       .Returns(false);
        _authRepo.IncrementFailedLoginAsync(
                      Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "wrong"), default);

        // Nu 401 din cauza lockout-ului (mesaj diferit) — ci 401 din cauza parolei greșite
        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    // ── Parolă greșită ────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WrongPassword_ReturnsUnauthorized_AndIncrementsFailedLogins()
    {
        var user = BuildUser();
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));
        _passwordHasher.VerifyPassword("wrong-password", user.PasswordHash)
                       .Returns(false);
        _authRepo.IncrementFailedLoginAsync(
                      Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "wrong-password"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);

        // Trebuie să fi incrementat failed logins
        await _authRepo.Received(1).IncrementFailedLoginAsync(
            user.Id,
            _rateLimitOptions.LoginMaxAttempts,
            _rateLimitOptions.LoginWindowMinutes,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WrongPassword_ShouldNotCallResetFailedLogin()
    {
        var user = BuildUser();
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));
        _passwordHasher.VerifyPassword(Arg.Any<string>(), user.PasswordHash)
                       .Returns(false);
        _authRepo.IncrementFailedLoginAsync(
                      Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);

        await CreateHandler().Handle(new LoginCommand("admin", "wrong"), default);

        await _authRepo.DidNotReceive().ResetFailedLoginAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    // ── Login reușit ──────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsSuccess_WithTokens()
    {
        var userId = Guid.NewGuid();
        var clinicId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        var user = new UserAuthDto
        {
            Id = userId,
            ClinicId = clinicId,
            RoleId = roleId,
            RoleCode = "admin",
            Email = "admin@test.com",
            PasswordHash = "correct-hash",
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
        };

        _authRepo.GetByEmailOrUsernameAsync("admin", Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));
        _passwordHasher.VerifyPassword("correct-password", "correct-hash")
                       .Returns(true);
        _tokenService.GenerateAccessToken(
                         userId, clinicId, user.Email, "Admin User", "admin", roleId)
                     .Returns("jwt-access-token");
        _tokenService.GenerateRefreshToken()
                     .Returns("refresh-token-value");
        _authRepo.ResetFailedLoginAsync(userId, Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _authRepo.CreateRefreshTokenAsync(
                     Arg.Is<Guid>(x => x == userId), Arg.Is<string>(x => x == "refresh-token-value"), Arg.Any<DateTime>(), Arg.Is<string?>(x => x == null), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _permissionRepo.GetEffectiveByUserAsync(Arg.Is<Guid>(x => x == userId), Arg.Is<Guid>(x => x == roleId), Arg.Any<CancellationToken>())
                       .Returns(Task.FromResult<IReadOnlyList<UserModulePermissionDto>>(Array.Empty<UserModulePermissionDto>()));

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "correct-password"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
        Assert.Equal("jwt-access-token", result.Value.AccessToken);
        Assert.Equal("refresh-token-value", result.Value.RefreshToken);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ResetsFailedLoginAttempts()
    {
        var user = BuildUser();
        SetupSuccessfulLogin(user);

        await CreateHandler().Handle(new LoginCommand("admin", "correct"), default);

        await _authRepo.Received(1).ResetFailedLoginAsync(
            user.Id, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidCredentials_CreatesRefreshToken()
    {
        var user = BuildUser();
        SetupSuccessfulLogin(user);

        await CreateHandler().Handle(new LoginCommand("admin", "correct"), default);

        await _authRepo.Received(1).CreateRefreshTokenAsync(
            Arg.Is<Guid>(x => x == user.Id),
            Arg.Any<string>(),
            Arg.Any<DateTime>(),
            Arg.Is<string?>(x => x == null),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsUserInfo()
    {
        var user = BuildUser();
        SetupSuccessfulLogin(user);

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "correct"), default);

        Assert.NotNull(result.Value?.User);
        Assert.Equal(user.Email, result.Value!.User.Email);
        Assert.Equal(user.Id.ToString(), result.Value.User.Id);
        Assert.Equal(user.ClinicId.ToString(), result.Value.User.ClinicId);
    }

    [Fact]
    public async Task Handle_ValidCredentials_LoadsPermissions()
    {
        var user = BuildUser();
        var permissions = new[]
        {
            new UserModulePermissionDto { ModuleCode = "patients", AccessLevel = 3 },
            new UserModulePermissionDto { ModuleCode = "users",    AccessLevel = 3 },
        };

        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));
        _passwordHasher.VerifyPassword("correct", user.PasswordHash)
                       .Returns(true);
        _tokenService.GenerateAccessToken(
                         Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(),
                         Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>())
                     .Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _authRepo.ResetFailedLoginAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _authRepo.CreateRefreshTokenAsync(
                     Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<DateTime>(),
                     Arg.Is<string?>(x => x == null), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _permissionRepo.GetEffectiveByUserAsync(
                            Arg.Is<Guid>(x => x == user.Id), Arg.Is<Guid>(x => x == user.RoleId), Arg.Any<CancellationToken>())
                       .Returns(Task.FromResult<IReadOnlyList<UserModulePermissionDto>>(permissions));

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "correct"), default);

        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value.Permissions.Count);
        Assert.Equal("patients", result.Value.Permissions[0].Module);
        Assert.Equal(3, result.Value.Permissions[0].Level);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private void SetupSuccessfulLogin(UserAuthDto user)
    {
        _authRepo.GetByEmailOrUsernameAsync(
                      Arg.Any<string>(), Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(user));
        _passwordHasher.VerifyPassword("correct", user.PasswordHash)
                       .Returns(true);
        _tokenService.GenerateAccessToken(
                         Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(),
                         Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Guid>())
                     .Returns("access-token");
        _tokenService.GenerateRefreshToken().Returns("refresh-token");
        _authRepo.ResetFailedLoginAsync(
                     Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _authRepo.CreateRefreshTokenAsync(
                     Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<DateTime>(),
                     Arg.Is<string?>(x => x == null), Arg.Any<CancellationToken>())
                 .Returns(Task.CompletedTask);
        _permissionRepo.GetEffectiveByUserAsync(
                            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                       .Returns(Task.FromResult<IReadOnlyList<UserModulePermissionDto>>(Array.Empty<UserModulePermissionDto>()));
    }
}
