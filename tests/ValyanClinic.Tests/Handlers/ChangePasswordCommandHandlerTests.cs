using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Users.Commands.ChangePassword;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru ChangePasswordCommandHandler.
/// Verifică logica de securitate: parola curentă obligatorie când utilizatorul
/// își schimbă propria parolă, și ignorată când un admin schimbă parola altcuiva.
/// </summary>
public sealed class ChangePasswordCommandHandlerTests
{
    private static readonly Guid CurrentUserId = Guid.Parse("A0000005-0000-0000-0000-000000000001");
    private static readonly Guid OtherUserId   = Guid.Parse("B0000005-0000-0000-0000-000000000001");
    private static readonly Guid ClinicId      = Guid.Parse("C0000005-0000-0000-0000-000000000001");

    private const string ValidCurrentPassword = "OldPassword123!";
    private const string ValidNewPassword     = "NewPassword456!";
    private const string HashedNewPassword    = "hashed_new_password";
    private const string StoredHash           = "stored_hash";

    private readonly IUserRepository  _userRepo        = Substitute.For<IUserRepository>();
    private readonly IAuthRepository  _authRepo        = Substitute.For<IAuthRepository>();
    private readonly IPasswordHasher  _passwordHasher  = Substitute.For<IPasswordHasher>();
    private readonly ICurrentUser     _currentUser     = Substitute.For<ICurrentUser>();

    public ChangePasswordCommandHandlerTests()
    {
        _currentUser.Id.Returns(CurrentUserId);
        _currentUser.ClinicId.Returns(ClinicId);
        _passwordHasher.HashPassword(Arg.Any<string>()).Returns(HashedNewPassword);
    }

    private ChangePasswordCommandHandler CreateHandler() =>
        new(_userRepo, _authRepo, _passwordHasher, _currentUser);

    private static UserAuthDto BuildUser(Guid id) => new()
    {
        Id = id, ClinicId = Guid.NewGuid(), RoleId = Guid.NewGuid(),
        Username = "test", Email = "test@test.ro", PasswordHash = StoredHash,
        FirstName = "Test", LastName = "User", IsActive = true
    };

    // ── Admin schimbă parola altui utilizator (fără CurrentPassword) ──────────

    [Fact]
    public async Task Handle_AdminChangesOtherUserPassword_NoCurrentPasswordRequired()
    {
        _userRepo.UpdatePasswordAsync(
                OtherUserId, ClinicId, HashedNewPassword, CurrentUserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var command = new ChangePasswordCommand(OtherUserId, ValidNewPassword, CurrentPassword: null);
        var result  = await CreateHandler().Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
        // Auth repo nu trebuie apelat — nu verificăm parola curentă
        await _authRepo.DidNotReceive().GetUserByIdForTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    // ── Utilizatorul își schimbă propria parolă fără CurrentPassword ──────────

    [Fact]
    public async Task Handle_UserChangesOwnPassword_WithoutCurrentPassword_ReturnsFailure()
    {
        var command = new ChangePasswordCommand(CurrentUserId, ValidNewPassword, CurrentPassword: null);
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        // Repository-ul nu trebuie apelat
        await _userRepo.DidNotReceive().UpdatePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UserChangesOwnPassword_WithEmptyCurrentPassword_ReturnsFailure()
    {
        var command = new ChangePasswordCommand(CurrentUserId, ValidNewPassword, CurrentPassword: "   ");
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    // ── Utilizatorul are parola curentă greșită ───────────────────────────────

    [Fact]
    public async Task Handle_UserChangesOwnPassword_WithWrongCurrentPassword_ReturnsUnauthorized()
    {
        var user = BuildUser(CurrentUserId);
        _authRepo.GetUserByIdForTokenAsync(CurrentUserId, Arg.Any<CancellationToken>()).Returns(user);
        _passwordHasher.VerifyPassword("WrongPass!", StoredHash).Returns(false);

        var command = new ChangePasswordCommand(CurrentUserId, ValidNewPassword, CurrentPassword: "WrongPass!");
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    // ── Utilizatorul are parola curentă corectă ───────────────────────────────

    [Fact]
    public async Task Handle_UserChangesOwnPassword_WithCorrectCurrentPassword_ReturnsSuccess()
    {
        var user = BuildUser(CurrentUserId);
        _authRepo.GetUserByIdForTokenAsync(CurrentUserId, Arg.Any<CancellationToken>()).Returns(user);
        _passwordHasher.VerifyPassword(ValidCurrentPassword, StoredHash).Returns(true);
        _userRepo.UpdatePasswordAsync(
                CurrentUserId, ClinicId, HashedNewPassword, CurrentUserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var command = new ChangePasswordCommand(CurrentUserId, ValidNewPassword, ValidCurrentPassword);
        var result  = await CreateHandler().Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    // ── Utilizatorul nu există în auth (GetUserByIdForTokenAsync returnează null) ─

    [Fact]
    public async Task Handle_UserNotFoundInAuth_ReturnsNotFound()
    {
        _authRepo.GetUserByIdForTokenAsync(CurrentUserId, Arg.Any<CancellationToken>())
                 .Returns((UserAuthDto?)null);

        var command = new ChangePasswordCommand(CurrentUserId, ValidNewPassword, ValidCurrentPassword);
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    // ── Utilizatorul nu există la update (SqlException 50507) ─────────────────

    [Fact]
    public async Task Handle_UserNotFoundOnUpdate_ReturnsNotFound()
    {
        _userRepo.UpdatePasswordAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.UserNotFound));

        // Admin schimbă parola altui user (fără verificare CurrentPassword)
        var command = new ChangePasswordCommand(OtherUserId, ValidNewPassword, CurrentPassword: null);
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    // ── Generic SQL error ─────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _userRepo.UpdatePasswordAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var command = new ChangePasswordCommand(OtherUserId, ValidNewPassword, CurrentPassword: null);
        var result  = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
