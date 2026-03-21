using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Teste de integrare pentru nomenclatoare (lookup-uri fără ClinicId).
/// Aceste SP-uri returnează date de referință statice — nu modifică baza de date.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class NomenclatureRepositoryTests(IntegrationTestFixture fixture)
{
    private INomenclatureLookupRepository Repo =>
        fixture.GetRepository<INomenclatureLookupRepository>();

    // ── Genders ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGenders_ReturnsNonEmptyList()
    {
        var result = await Repo.GetGendersAsync(isActive: null, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task GetGenders_EachItemHasIdAndName()
    {
        var result = await Repo.GetGendersAsync(isActive: null, CancellationToken.None);

        foreach (var item in result)
        {
            Assert.NotEqual(Guid.Empty, item.Id);
            Assert.False(string.IsNullOrWhiteSpace(item.Name));
        }
    }

    [Fact]
    public async Task GetGenders_FilterActive_ReturnsOnlyActiveItems()
    {
        var result = (await Repo.GetGendersAsync(isActive: true, CancellationToken.None)).ToList();

        // Dacă SP-ul filtrează corect — toți cei returnați trebuie să fie activi
        Assert.All(result, item => Assert.True(item.IsActive));
    }

    // ── BloodTypes ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBloodTypes_ReturnsNonEmptyList()
    {
        var result = await Repo.GetBloodTypesAsync(isActive: null, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task GetBloodTypes_EachItemHasIdAndName()
    {
        var result = await Repo.GetBloodTypesAsync(isActive: null, CancellationToken.None);

        foreach (var item in result)
        {
            Assert.NotEqual(Guid.Empty, item.Id);
            Assert.False(string.IsNullOrWhiteSpace(item.Name));
        }
    }

    // ── AllergyTypes ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllergyTypes_ReturnsNonEmptyList()
    {
        var result = await Repo.GetAllergyTypesAsync(isActive: null, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    // ── AllergySeverities ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllergySeverities_ReturnsNonEmptyList()
    {
        var result = await Repo.GetAllergySeveritiesAsync(isActive: null, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task GetAllergySeverities_EachItemHasCode()
    {
        var result = await Repo.GetAllergySeveritiesAsync(isActive: null, CancellationToken.None);

        foreach (var item in result)
            Assert.False(string.IsNullOrWhiteSpace(item.Code));
    }
}
