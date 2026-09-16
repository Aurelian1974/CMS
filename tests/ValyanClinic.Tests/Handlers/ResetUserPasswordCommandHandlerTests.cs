using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru ResetUserPasswordCommandHandler (reset administrativ).
/// Autorizarea (rol Admin) e impusă de atributele de pe controller; aici verificăm
/// efectele: flag de schimbare forțată, revocarea sesiunilor și refuzul de a folosi
/// acest flux pentru propria parolă.
/// </summary>
public sealed class ResetUserPasswordCommandHandlerTests
{
    private static readonly Guid AdminId     = Guid.Parse("A0000008-0000-0000-0000-000000000001");
    private static readonly Guid TargetUserId = Guid.Parse("B0000008-0000-0000-0000-000000000001");
    private static readonly Guid ClinicId    = Guid.Parse("C0000008-0000-0000-0000-000000000001");

    private const string NewPassword       = "ParolaResetata123";
    private const string HashedNewPassword = "hashed_new_password";

    private readonly IUserRepository _userRepo       = Substitute.For<IUserRepository>();
    private readonly IAuthRepository _authRepo       = Substitute.For<IAuthRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly ICurrentUser    _currentUser    = Substitute.For<ICurrentUser>();
    private readonly ISecurityEventLogger _securityLog = Substitute.For<ISecurityEventLogger>();

    public ResetUserPasswordCommandHandlerTests()
    {
        _currentUser.Id.Returns(AdminId);
        _currentUser.ClinicId.Returns(ClinicId);
        // Claim-ul de rol poartă codul din baza de date, care e lowercase.
        _currentUser.Role.Returns(Roles.Admin);
        _passwordHasher.HashPassword(Arg.Any<string>()).Returns(HashedNewPassword);
    }

    private ResetUserPasswordCommandHandler CreateHandler() =>
        new(_userRepo, _authRepo, _passwordHasher, _currentUser, _securityLog);

    // ── Restricția de rol ─────────────────────────────────────────────────────

    [Theory]
    [InlineData("doctor")]
    [InlineData("nurse")]
    [InlineData("receptionist")]
    [InlineData("clinic_manager")]
    public async Task Handle_NonAdminRole_IsForbidden(string role)
    {
        // [HasAccess(Users, Write)] singur nu e suficient: ar permite unui Receptionist
        // să reseteze parola unui administrator din propria clinică.
        _currentUser.Role.Returns(role);

        var result = await CreateHandler().Handle(
            new ResetUserPasswordCommand(TargetUserId, NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.StatusCode);
        await _userRepo.DidNotReceive().UpdatePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("Admin")]
    [InlineData("ADMIN")]
    public async Task Handle_AdminRole_AnyCasing_IsAllowed(string role)
    {
        // Compararea valorii unui claim e ordinală și case-sensitive, deci o politică
        // RequireRole("Admin") pe un claim „admin" ar da un 403 permanent și tăcut.
        // Verificarea din handler este intenționat case-insensitive.
        _currentUser.Role.Returns(role);

        var result = await CreateHandler().Handle(
            new ResetUserPasswordCommand(TargetUserId, NewPassword), default);

        Assert.True(result.IsSuccess, $"Reset refuzat pentru rolul {role}: {result.Error}");
    }

    [Fact]
    public async Task Handle_ResetsOtherUser_SetsMustChangePasswordFlag()
    {
        var result = await CreateHandler().Handle(
            new ResetUserPasswordCommand(TargetUserId, NewPassword), default);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");

        // Parola e cunoscută de administrator → utilizatorul trebuie să o schimbe
        await _userRepo.Received(1).UpdatePasswordAsync(
            TargetUserId, ClinicId, HashedNewPassword, AdminId,
            true, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ResetsOtherUser_RevokesTheirSessions()
    {
        await CreateHandler().Handle(
            new ResetUserPasswordCommand(TargetUserId, NewPassword), default);

        await _authRepo.Received(1).RevokeAllRefreshTokensAsync(
            TargetUserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TargetIsSelf_IsRejected()
    {
        // Altfel un admin și-ar putea schimba propria parolă ocolind verificarea
        // parolei curente, golind de sens fluxul self-service.
        var result = await CreateHandler().Handle(
            new ResetUserPasswordCommand(AdminId, NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.User.UseSelfServiceForOwnPassword, result.Error);

        await _userRepo.DidNotReceive().UpdatePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
            Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound_AndDoesNotRevoke()
    {
        _userRepo.UpdatePasswordAsync(
                     Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(),
                     Arg.Any<bool>(), Arg.Any<CancellationToken>())
                 .Throws(SqlExceptionHelper.Make(SqlErrorCodes.UserNotFound));

        var result = await CreateHandler().Handle(
            new ResetUserPasswordCommand(TargetUserId, NewPassword), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
        await _authRepo.DidNotReceive().RevokeAllRefreshTokensAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }
}
