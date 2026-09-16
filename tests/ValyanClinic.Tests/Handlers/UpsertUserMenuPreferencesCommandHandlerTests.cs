using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class UpsertUserMenuPreferencesCommandHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A9000002-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B9000002-0000-0000-0000-000000000001");

    private readonly IUserMenuPreferenceRepository _repo        = Substitute.For<IUserMenuPreferenceRepository>();
    private readonly ICurrentUser                  _currentUser = Substitute.For<ICurrentUser>();

    public UpsertUserMenuPreferencesCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private UpsertUserMenuPreferencesCommandHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        _repo.UpsertFavoriteRoutesAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var command = new UpsertUserMenuPreferencesCommand(["/patients", "/consultations"]);
        var result = await CreateHandler().Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task Handle_SerializesRoutesAsJsonAndUsesCurrentUser()
    {
        _repo.UpsertFavoriteRoutesAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var command = new UpsertUserMenuPreferencesCommand(["/patients", "/consultations"]);
        await CreateHandler().Handle(command, default);

        await _repo.Received(1).UpsertFavoriteRoutesAsync(
            UserId, ClinicId, """["/patients","/consultations"]""", UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SqlError_ReturnsFailure()
    {
        _repo.UpsertFavoriteRoutesAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var command = new UpsertUserMenuPreferencesCommand(["/patients"]);
        var result = await CreateHandler().Handle(command, default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
