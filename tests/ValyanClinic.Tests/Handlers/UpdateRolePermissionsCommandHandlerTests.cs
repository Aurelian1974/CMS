using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru UpdateRolePermissionsCommandHandler.
/// Folosim un MemoryCache real (nu mock) deoarece Get&lt;T&gt;() și Set() sunt metode de extensie
/// care nu pot fi substituite cu NSubstitute.
/// </summary>
public sealed class UpdateRolePermissionsCommandHandlerTests
{
    private static readonly Guid RoleId  = Guid.Parse("A0000004-0000-0000-0000-000000000001");
    private static readonly Guid AdminId = Guid.Parse("B0000004-0000-0000-0000-000000000001");

    private readonly IPermissionRepository _repo        = Substitute.For<IPermissionRepository>();
    private readonly ICurrentUser          _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMemoryCache          _cache       = new MemoryCache(Options.Create(new MemoryCacheOptions()));

    public UpdateRolePermissionsCommandHandlerTests()
    {
        _currentUser.Id.Returns(AdminId);
    }

    private UpdateRolePermissionsCommandHandler CreateHandler() =>
        new(_repo, _currentUser, _cache);

    private static UpdateRolePermissionsCommand CommandWithPermissions(int count = 2) =>
        new(RoleId: RoleId, Permissions: Enumerable.Range(0, count)
            .Select(_ => new RolePermissionItemDto(Guid.NewGuid(), Guid.NewGuid()))
            .ToList()
            .AsReadOnly());

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        _repo.SyncRolePermissionsAsync(
                RoleId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>())
             .Returns(3);

        var result = await CreateHandler().Handle(CommandWithPermissions(3), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(3, result.Value);
    }

    [Fact]
    public async Task Handle_Success_IncrementsGlobalCacheVersion()
    {
        _repo.SyncRolePermissionsAsync(
                Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(1);

        // Setăm versiunea inițială la 10
        _cache.Set(UpdateRolePermissionsCommandHandler.CacheVersionKey, 10L);

        await CreateHandler().Handle(CommandWithPermissions(1), default);

        var version = _cache.Get<long>(UpdateRolePermissionsCommandHandler.CacheVersionKey);
        Assert.Equal(11L, version);
    }

    [Fact]
    public async Task Handle_EmptyPermissions_StillSucceeds()
    {
        _repo.SyncRolePermissionsAsync(
                RoleId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>())
             .Returns(0);

        var result = await CreateHandler().Handle(CommandWithPermissions(0), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Value);
    }

    [Fact]
    public async Task Handle_PassesUpdatedByFromCurrentUser()
    {
        _repo.SyncRolePermissionsAsync(
                Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(2);

        await CreateHandler().Handle(CommandWithPermissions(2), default);

        await _repo.Received(1).SyncRolePermissionsAsync(
            RoleId, Arg.Any<string>(), AdminId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CacheVersionKey_HasCorrectValue()
    {
        Assert.Equal("permissions:version", UpdateRolePermissionsCommandHandler.CacheVersionKey);
    }
}
