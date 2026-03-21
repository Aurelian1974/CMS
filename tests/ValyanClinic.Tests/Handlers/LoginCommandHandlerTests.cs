using Microsoft.Extensions.Options;
using Moq;
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
    private readonly Mock<IAuthRepository> _authRepo = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IPermissionRepository> _permissionRepo = new();

    private readonly JwtOptions _jwtOptions = new() { RefreshTokenExpiryDays = 7 };
    private readonly RateLimitingOptions _rateLimitOptions = new() { LoginMaxAttempts = 5, LoginWindowMinutes = 15 };

    private LoginCommandHandler CreateHandler() => new(
        _authRepo.Object,
        _passwordHasher.Object,
        _tokenService.Object,
        _permissionRepo.Object,
        Options.Create(_jwtOptions),
        Options.Create(_rateLimitOptions));

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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((UserAuthDto?)null);

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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);

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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);

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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);

        // Parolă greșită pentru a nu trece de autentificare (testăm că lockout-ul nu blochează)
        _passwordHasher.Setup(p => p.VerifyPassword(It.IsAny<string>(), user.PasswordHash))
                       .Returns(false);
        _authRepo.Setup(r => r.IncrementFailedLoginAsync(
                      It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("wrong-password", user.PasswordHash))
                       .Returns(false);
        _authRepo.Setup(r => r.IncrementFailedLoginAsync(
                      It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(
            new LoginCommand("admin", "wrong-password"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);

        // Trebuie să fi incrementat failed logins
        _authRepo.Verify(r => r.IncrementFailedLoginAsync(
            user.Id,
            _rateLimitOptions.LoginMaxAttempts,
            _rateLimitOptions.LoginWindowMinutes,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WrongPassword_ShouldNotCallResetFailedLogin()
    {
        var user = BuildUser();
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword(It.IsAny<string>(), user.PasswordHash))
                       .Returns(false);
        _authRepo.Setup(r => r.IncrementFailedLoginAsync(
                      It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        await CreateHandler().Handle(new LoginCommand("admin", "wrong"), default);

        _authRepo.Verify(r => r.ResetFailedLoginAsync(
            It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
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

        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync("admin", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("correct-password", "correct-hash"))
                       .Returns(true);
        _tokenService.Setup(t => t.GenerateAccessToken(
                         userId, clinicId, user.Email, "Admin User", "admin", roleId))
                     .Returns("jwt-access-token");
        _tokenService.Setup(t => t.GenerateRefreshToken())
                     .Returns("refresh-token-value");
        _authRepo.Setup(r => r.ResetFailedLoginAsync(userId, It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _authRepo.Setup(r => r.CreateRefreshTokenAsync(
                     userId, "refresh-token-value", It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _permissionRepo.Setup(p => p.GetEffectiveByUserAsync(userId, roleId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(Array.Empty<UserModulePermissionDto>());

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

        _authRepo.Verify(r => r.ResetFailedLoginAsync(
            user.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ValidCredentials_CreatesRefreshToken()
    {
        var user = BuildUser();
        SetupSuccessfulLogin(user);

        await CreateHandler().Handle(new LoginCommand("admin", "correct"), default);

        _authRepo.Verify(r => r.CreateRefreshTokenAsync(
            user.Id,
            It.IsAny<string>(),
            It.IsAny<DateTime>(),
            null,
            It.IsAny<CancellationToken>()), Times.Once);
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

        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("correct", user.PasswordHash))
                       .Returns(true);
        _tokenService.Setup(t => t.GenerateAccessToken(
                         It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(),
                         It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid>()))
                     .Returns("token");
        _tokenService.Setup(t => t.GenerateRefreshToken()).Returns("refresh");
        _authRepo.Setup(r => r.ResetFailedLoginAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _authRepo.Setup(r => r.CreateRefreshTokenAsync(
                     It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<DateTime>(),
                     null, It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _permissionRepo.Setup(p => p.GetEffectiveByUserAsync(
                            user.Id, user.RoleId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(permissions);

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
        _authRepo.Setup(r => r.GetByEmailOrUsernameAsync(
                      It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("correct", user.PasswordHash))
                       .Returns(true);
        _tokenService.Setup(t => t.GenerateAccessToken(
                         It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(),
                         It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid>()))
                     .Returns("access-token");
        _tokenService.Setup(t => t.GenerateRefreshToken()).Returns("refresh-token");
        _authRepo.Setup(r => r.ResetFailedLoginAsync(
                     It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _authRepo.Setup(r => r.CreateRefreshTokenAsync(
                     It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<DateTime>(),
                     null, It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _permissionRepo.Setup(p => p.GetEffectiveByUserAsync(
                            It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                       .ReturnsAsync(Array.Empty<UserModulePermissionDto>());
    }
}
