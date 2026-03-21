using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Teste de integrare pentru UserRepository.
/// Se focusează pe operații read-only (GetPaged, GetAllRoles) și pe
/// AuthRepository (GetByEmailOrUsernameAsync) fără a modifica date de producție.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class UserRepositoryTests(IntegrationTestFixture fixture)
    : IntegrationTestBase(fixture)
{
    private IUserRepository   UserRepo   => Fixture.GetRepository<IUserRepository>();
    private IAuthRepository   AuthRepo   => Fixture.GetRepository<IAuthRepository>();

    // ─────────────────────────────────────────────────────────────────────────
    // Role_GetAll — date de referință, garantat non-empty
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllRoles_ReturnsNonEmptyList()
    {
        var roles = await UserRepo.GetAllRolesAsync(CancellationToken.None);

        Assert.NotNull(roles);
        Assert.NotEmpty(roles);
    }

    [Fact]
    public async Task GetAllRoles_EachRoleHasIdAndName()
    {
        var roles = await UserRepo.GetAllRolesAsync(CancellationToken.None);

        foreach (var role in roles)
        {
            Assert.NotEqual(Guid.Empty, role.Id);
            Assert.False(string.IsNullOrWhiteSpace(role.Name));
        }
    }

    [Fact]
    public async Task GetAllRoles_ContainsAdminRole()
    {
        var roles = await UserRepo.GetAllRolesAsync(CancellationToken.None);

        // Rolul admin are codul 'admin' (numele poate varia: Admin, Administrator etc.)
        Assert.Contains(roles, r => r.Code.Equals("admin", StringComparison.OrdinalIgnoreCase));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User_GetPaged — structura rezultatului (2 result sets)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPaged_ReturnsCorrectStructure()
    {
        var result = await UserRepo.GetPagedAsync(
            clinicId:  Fixture.TestClinicId,
            search:    null,
            roleId:    null,
            isActive:  null,
            page:      1,
            pageSize:  10,
            sortBy:    "LastName",
            sortDir:   "asc",
            ct:        CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(result.Items);
        Assert.True(result.TotalCount >= 0);
        Assert.True(result.Items.Count <= 10);
    }

    [Fact]
    public async Task GetPaged_WithRoleFilter_ReturnsOnlyMatchingRoles()
    {
        // Obținem primul rol available
        var roles = (await UserRepo.GetAllRolesAsync(CancellationToken.None)).ToList();
        if (!roles.Any()) return; // skip dacă nu există roluri

        var firstRoleId = roles.First().Id;

        var result = await UserRepo.GetPagedAsync(
            clinicId:  Fixture.TestClinicId,
            search:    null,
            roleId:    firstRoleId,
            isActive:  null,
            page:      1,
            pageSize:  50,
            sortBy:    "LastName",
            sortDir:   "asc",
            ct:        CancellationToken.None);

        Assert.NotNull(result);
        // Orice user returnat trebuie să aibă rolul filtrat
        Assert.All(result.Items, u => Assert.Equal(firstRoleId, u.RoleId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AuthRepository — utilizator inexistent returnează null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByEmailOrUsername_NonExistent_ReturnsNull()
    {
        var result = await AuthRepo.GetByEmailOrUsernameAsync(
            "nonexistent_user_xyz@valyan.test",
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByEmailOrUsername_EmptyEmail_ReturnsNull()
    {
        var result = await AuthRepo.GetByEmailOrUsernameAsync(
            "   ",
            CancellationToken.None);

        Assert.Null(result);
    }
}
