using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.UserMenuPreferences.Queries.GetUserMenuPreferences;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class GetUserMenuPreferencesQueryHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A9000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B9000001-0000-0000-0000-000000000001");

    private readonly IUserMenuPreferenceRepository _repo        = Substitute.For<IUserMenuPreferenceRepository>();
    private readonly ICurrentUser                  _currentUser = Substitute.For<ICurrentUser>();

    public GetUserMenuPreferencesQueryHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private GetUserMenuPreferencesQueryHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Handle_NoPreferencesSaved_ReturnsEmptyList()
    {
        _repo.GetFavoriteRoutesJsonAsync(UserId, ClinicId, Arg.Any<CancellationToken>())
             .Returns((string?)null);

        var result = await CreateHandler().Handle(new GetUserMenuPreferencesQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.FavoriteRoutes);
    }

    [Fact]
    public async Task Handle_PreferencesSaved_ReturnsDeserializedRoutes()
    {
        _repo.GetFavoriteRoutesJsonAsync(UserId, ClinicId, Arg.Any<CancellationToken>())
             .Returns("""["/patients","/consultations"]""");

        var result = await CreateHandler().Handle(new GetUserMenuPreferencesQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["/patients", "/consultations"], result.Value!.FavoriteRoutes);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.GetFavoriteRoutesJsonAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((string?)null);

        await CreateHandler().Handle(new GetUserMenuPreferencesQuery(), default);

        await _repo.Received(1).GetFavoriteRoutesJsonAsync(UserId, ClinicId, Arg.Any<CancellationToken>());
    }
}
