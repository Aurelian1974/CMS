using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru ChangeOwnPasswordCommandHandler (flux self-service).
///
/// Garanția centrală: contul vizat vine din token, nu din payload, iar parola
/// curentă este verificată. Anterior cele două cazuri de utilizare — schimbarea
/// proprie și resetul administrativ — împărțeau un singur endpoint, iar controller-ul
/// nu trimitea niciodată parola curentă, deci ramura self-service era cod mort.
/// </summary>
public sealed class ChangeOwnPasswordCommandHandlerTests
{
    private static readonly Guid CurrentUserId = Guid.Parse("A0000007-0000-0000-0000-000000000001");
    private static readonly Guid ClinicId      = Guid.Parse("C0000007-0000-0000-0000-000000000001");

    private const string CurrentPassword   = "ParolaVecheSigura1";
    private const string NewPassword       = "ParolaNouaSigura22";
    private const string HashedNewPassword = "hashed_new_password";
    private const string StoredHash        = "stored_hash";

    private readonly IUserRepository _userRepo       = Substitute.For<IUserRepository>();
    private readonly IAuthRepository _authRepo       = Substitute.For<IAuthRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly ICurrentUser    _currentUser    = Substitute.For<ICurrentUser>();
    private readonly ISecurityEventLogger _securityLog = Substitute.For<ISecurityEventLogger>();

    public ChangeOwnPasswordCommandHandlerTests()
    {
        _currentUser.Id.Returns(CurrentUserId);
        _currentUser.ClinicId.Returns(ClinicId);
        _passwordHasher.HashPassword(Arg.Any<string>()).Returns(HashedNewPassword);

        _authRepo.GetUserByIdForTokenAsync(CurrentUserId, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(new UserAuthDto
                 {
                     Id = CurrentUserId, ClinicId = ClinicId, RoleId = Guid.NewGuid(),
                     Username = "test", Email = "test@test.ro", PasswordHash = StoredHash,
                     FirstName = "Test", LastName = "User", IsActive = true
                 }));
    }

    private ChangeOwnPasswordCommandHandler CreateHandler() =>
        new(_userRepo, _authRepo, _passwordHasher, _currentUser, _securityLog);

    private void AcceptCurrentPassword()
        => _passwordHasher.VerifyPassword(CurrentPassword, StoredHash).Returns(true);

    // ── Parola curentă ────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WrongCurrentPassword_ReturnsUnauthorized_AndDoesNotUpdate()
    {
        _passwordHasher.VerifyPassword(Arg.Any<string>(), StoredHash).Returns(false);

        var result = await CreateHandler().Handle(
            new ChangeOwnPasswordCommand("gresita", NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        await _userRepo.DidNotReceive().UpdatePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NewPasswordSameAsCurrent_ReturnsFailure()
    {
        // VerifyPassword returnează true și pentru parola nouă → e aceeași parolă
        _passwordHasher.VerifyPassword(Arg.Any<string>(), StoredHash).Returns(true);

        var result = await CreateHandler().Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, CurrentPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.User.PasswordUnchanged, result.Error);
        await _userRepo.DidNotReceive().UpdatePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    // ── Cazul reușit ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CorrectCurrentPassword_UpdatesOwnAccount_AndClearsMustChangeFlag()
    {
        AcceptCurrentPassword();

        var result = await CreateHandler().Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, NewPassword), default);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");

        // Contul vizat e cel din token, iar flag-ul de schimbare forțată se stinge
        await _userRepo.Received(1).UpdatePasswordAsync(
            CurrentUserId, ClinicId, HashedNewPassword, CurrentUserId,
            false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_PasswordChanged_RevokesAllRefreshTokens()
    {
        AcceptCurrentPassword();

        await CreateHandler().Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, NewPassword), default);

        await _authRepo.Received(1).RevokeAllRefreshTokensAsync(
            CurrentUserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UpdateFails_DoesNotRevokeSessions()
    {
        AcceptCurrentPassword();
        _userRepo.UpdatePasswordAsync(
                     Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
                     Arg.Any<bool>(), Arg.Any<CancellationToken>())
                 .Throws(SqlExceptionHelper.Make(SqlErrorCodes.UserNotFound));

        var result = await CreateHandler().Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
        await _authRepo.DidNotReceive().RevokeAllRefreshTokensAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound()
    {
        _authRepo.GetUserByIdForTokenAsync(CurrentUserId, Arg.Any<CancellationToken>())
                 .Returns(Task.FromResult<UserAuthDto?>(null));

        var result = await CreateHandler().Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }
}
