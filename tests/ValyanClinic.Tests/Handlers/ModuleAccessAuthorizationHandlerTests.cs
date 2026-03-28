using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Authentication;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru ModuleAccessAuthorizationHandler.
/// Verifică: comportamentul cu claims lipsă, acordarea/refuzul accesului,
/// și caching-ul (cache miss → DB call; cache hit → fără DB call).
/// Folosim un MemoryCache real (nu mock) deoarece extension methods ca
/// Get&lt;T&gt; și Set() nu pot fi substituite cu NSubstitute.
/// </summary>
public sealed class ModuleAccessAuthorizationHandlerTests
{
    private static readonly Guid UserId = Guid.Parse("A0000006-0000-0000-0000-000000000001");
    private static readonly Guid RoleId = Guid.Parse("B0000006-0000-0000-0000-000000000001");

    private readonly IPermissionRepository _repo = Substitute.For<IPermissionRepository>();
    private readonly IMemoryCache _cache = new MemoryCache(Options.Create(new MemoryCacheOptions()));

    private ModuleAccessAuthorizationHandler CreateHandler()
        => new(_repo, _cache);

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ClaimsPrincipal MakeUser(string? userId = null, string? roleId = null)
    {
        var claims = new List<Claim>();
        if (userId is not null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (roleId is not null) claims.Add(new Claim("roleId", roleId));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }

    private static AuthorizationHandlerContext MakeContext(
        ClaimsPrincipal user,
        ModuleAccessRequirement requirement)
        => new([requirement], user, null);

    private static ModuleAccessRequirement Require(string module, AccessLevel level)
        => new(module, level);

    private void SetupRepo(params (string moduleCode, int accessLevel)[] perms)
    {
        IReadOnlyList<UserModulePermissionDto> dtos = perms
            .Select(p => new UserModulePermissionDto
            {
                ModuleCode = p.moduleCode,
                AccessLevel = p.accessLevel,
            })
            .ToList();

        _repo.GetEffectiveByUserAsync(UserId, RoleId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(dtos));
    }

    // ── Claims lipsă ─────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_MissingUserIdClaim_DoesNotSucceed()
    {
        var user = MakeUser(roleId: RoleId.ToString());
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
        await _repo.DidNotReceive().GetEffectiveByUserAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_MissingRoleIdClaim_DoesNotSucceed()
    {
        var user = MakeUser(userId: UserId.ToString());
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
        await _repo.DidNotReceive().GetEffectiveByUserAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_NoClaimsAtAll_DoesNotSucceed()
    {
        var user = MakeUser(); // fără userId sau roleId
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    // ── Verificare nivel acces ────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ExactLevelMatch_Succeeds()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.Read));
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleAsync_HigherLevelThanRequired_Succeeds()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.Full));
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleAsync_LowerLevelThanRequired_DoesNotSucceed()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.Read));
        var context = MakeContext(user, Require("patients", AccessLevel.Write));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleAsync_ModuleNotInPermissions_DoesNotSucceed()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("invoices", (int)AccessLevel.Full)); // alt modul
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleAsync_NoneLevel_DoesNotSucceed()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.None)); // None = 0
        var context = MakeContext(user, Require("patients", AccessLevel.Read));

        await CreateHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    // ── Comportament cache ────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_CacheMiss_CallsDbOnce_ThenUsesCache()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.Write));
        var req = Require("patients", AccessLevel.Write);
        var handler = CreateHandler();

        // Primul apel → cache miss → DB apelat
        await handler.HandleAsync(MakeContext(user, req));

        // Al doilea apel cu același handler/cache → hit → DB NU mai e apelat
        await handler.HandleAsync(MakeContext(user, req));

        await _repo.Received(1).GetEffectiveByUserAsync(
            UserId, RoleId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_CacheHit_DoesNotCallDb_AndSucceeds()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        var req = Require("patients", AccessLevel.Read);

        // Pre-populate cache manual (simulează login pre-warming)
        var version = _cache.Get<long>(PermissionCacheKeys.Version); // = 0
        _cache.Set(
            PermissionCacheKeys.ForUser(UserId, version),
            new Dictionary<string, int> { ["patients"] = (int)AccessLevel.Full });

        var context = MakeContext(user, req);
        await CreateHandler().HandleAsync(context);

        Assert.True(context.HasSucceeded);
        await _repo.DidNotReceive().GetEffectiveByUserAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_AfterCacheVersionBump_ReloadsFromDb()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(("patients", (int)AccessLevel.Full));
        var req = Require("patients", AccessLevel.Full);
        var handler = CreateHandler();

        // Primul apel → populează cache pentru versiunea 0
        await handler.HandleAsync(MakeContext(user, req));

        // Simulăm actualizare permisiuni (versiunea crește la 1)
        _cache.Set(PermissionCacheKeys.Version, 1L);

        // Al doilea apel → cheie cache diferită (v1) → DB apelat din nou
        await handler.HandleAsync(MakeContext(user, req));

        await _repo.Received(2).GetEffectiveByUserAsync(
            UserId, RoleId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_MultipleModules_OnlySucceedsForAuthorizedOne()
    {
        var user = MakeUser(UserId.ToString(), RoleId.ToString());
        SetupRepo(
            ("patients", (int)AccessLevel.Write),
            ("invoices", (int)AccessLevel.Read));
        var handler = CreateHandler();

        var ctxPatients = MakeContext(user, Require("patients", AccessLevel.Write));
        var ctxInvoices = MakeContext(user, Require("invoices", AccessLevel.Write)); // Write > Read
        var ctxUsers    = MakeContext(user, Require("users", AccessLevel.Read));     // lipsă

        await handler.HandleAsync(ctxPatients);
        await handler.HandleAsync(ctxInvoices);
        await handler.HandleAsync(ctxUsers);

        Assert.True(ctxPatients.HasSucceeded);
        Assert.False(ctxInvoices.HasSucceeded);
        Assert.False(ctxUsers.HasSucceeded);
    }
}
