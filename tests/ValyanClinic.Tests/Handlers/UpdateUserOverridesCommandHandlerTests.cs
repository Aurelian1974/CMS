using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateUserOverrides;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru UpdateUserOverridesCommandHandler.
/// Folosim un MemoryCache real (nu mock) deoarece Get&lt;T&gt;() și Set() sunt metode de extensie
/// care nu pot fi substituite cu NSubstitute.
/// </summary>
public sealed class UpdateUserOverridesCommandHandlerTests
{
    private static readonly Guid TargetUserId = Guid.Parse("A0000003-0000-0000-0000-000000000001");
    private static readonly Guid AdminId      = Guid.Parse("B0000003-0000-0000-0000-000000000001");

    private readonly IPermissionRepository _repo        = Substitute.For<IPermissionRepository>();
    private readonly ICurrentUser          _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMemoryCache          _cache       = new MemoryCache(Options.Create(new MemoryCacheOptions()));

    public UpdateUserOverridesCommandHandlerTests()
    {
        _currentUser.Id.Returns(AdminId);
    }

    private UpdateUserOverridesCommandHandler CreateHandler() =>
        new(_repo, _currentUser, _cache);

    private static UpdateUserOverridesCommand CommandWithOverrides(int count = 2) =>
        new(UserId: TargetUserId, Overrides: Enumerable.Range(0, count)
            .Select(_ => new UserOverrideItemDto(Guid.NewGuid(), Guid.NewGuid()))
            .ToList()
            .AsReadOnly());

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        _repo.SyncUserOverridesAsync(
                TargetUserId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>())
             .Returns(2);

        var result = await CreateHandler().Handle(CommandWithOverrides(2), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value);
    }

    [Fact]
    public async Task Handle_Success_IncrementsPermissionCacheVersion()
    {
        _repo.SyncUserOverridesAsync(
                Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(1);

        // Setăm versiunea inițială la 5
        _cache.Set(UpdateRolePermissionsCommandHandler.CacheVersionKey, 5L);

        await CreateHandler().Handle(CommandWithOverrides(1), default);

        var version = _cache.Get<long>(UpdateRolePermissionsCommandHandler.CacheVersionKey);
        Assert.Equal(6L, version);
    }

    [Fact]
    public async Task Handle_EmptyOverrides_StillSucceeds()
    {
        _repo.SyncUserOverridesAsync(
                TargetUserId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>())
             .Returns(0);

        var result = await CreateHandler().Handle(CommandWithOverrides(0), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Value);
    }

    [Fact]
    public async Task Handle_PassesGrantedByFromCurrentUser()
    {
        _repo.SyncUserOverridesAsync(
                Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(1);

        await CreateHandler().Handle(CommandWithOverrides(1), default);

        await _repo.Received(1).SyncUserOverridesAsync(
            TargetUserId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>());
    }
}
