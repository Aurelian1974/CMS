using MediatR;
using ValyanClinic.Application.Features.Users.Queries.GetUserById;
using ValyanClinic.Application.Features.Users.Queries.GetUsers;
using ValyanClinic.Application.Features.Users.Queries.GetRoles;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Handlers;

/// <summary>
/// Teste end-to-end pentru pipeline-ul utilizatorilor:
/// Query → Handler → UserRepository → SP → DB.
/// Read-only — fără modificări pe baza de date.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class UserHandlerTests(IntegrationTestFixture fixture)
{
    private ISender Sender => fixture.CreateSender();

    // ── GetUsersQuery ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetUsers_DefaultQuery_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetUsersQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
        Assert.NotNull(result.Value.Items);
    }

    [Fact]
    public async Task GetUsers_PaginationStructureIsCorrect()
    {
        var result = await Sender.Send(new GetUsersQuery(Page: 1, PageSize: 5), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var paged = result.Value!;
        Assert.Equal(1,  paged.Page);
        Assert.Equal(5,  paged.PageSize);
        Assert.True(paged.Items.Count <= 5);
        Assert.True(paged.TotalCount >= 0);
    }

    [Fact]
    public async Task GetUsers_FilterActiveOnly_ReturnsOnlyActiveUsers()
    {
        var result = await Sender.Send(
            new GetUsersQuery(IsActive: true, PageSize: 50),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.All(result.Value!.Items, u => Assert.True(u.IsActive));
    }

    // ── GetRolesQuery ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetRoles_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetRolesQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler eșuat: {result.Error}");
        Assert.NotNull(result.Value);
        Assert.NotEmpty(result.Value);
    }

    [Fact]
    public async Task GetRoles_EachRoleHasValidData()
    {
        var result = await Sender.Send(new GetRolesQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        foreach (var role in result.Value!)
        {
            Assert.NotEqual(Guid.Empty, role.Id);
            Assert.False(string.IsNullOrWhiteSpace(role.Name));
        }
    }

    // ── GetUserByIdQuery — utilizator inexistent → NotFound ──────────────────

    [Fact]
    public async Task GetUserById_NonExistentId_ReturnsNotFound()
    {
        var result = await Sender.Send(new GetUserByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }
}
