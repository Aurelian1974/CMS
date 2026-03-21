using MediatR;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Handlers;

/// <summary>
/// Teste end-to-end: Query → Handler → Repository → SP → DB.
/// Verifică că pipeline-ul MediatR funcționează corect pentru nomenclatoare.
/// Fără modificări pe baza de date — safe pe orice mediu.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class NomenclatureHandlerTests(IntegrationTestFixture fixture)
{
    private ISender Sender => fixture.CreateSender();

    // ── GetNomenclatureLookupQuery ────────────────────────────────────────────

    [Theory]
    [InlineData(NomenclatureLookupType.Genders)]
    [InlineData(NomenclatureLookupType.BloodTypes)]
    [InlineData(NomenclatureLookupType.AllergyTypes)]
    [InlineData(NomenclatureLookupType.AllergySeverities)]
    public async Task GetNomenclatureLookup_AllTypes_ReturnSuccess(NomenclatureLookupType type)
    {
        var result = await Sender.Send(new GetNomenclatureLookupQuery(type), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler a eșuat pentru {type}: {result.Error}");
        Assert.NotNull(result.Value);
        Assert.NotEmpty(result.Value);
    }

    [Fact]
    public async Task GetNomenclatureLookup_Genders_EachItemHasNameAndCode()
    {
        var result = await Sender.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.Genders),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        foreach (var item in result.Value!)
        {
            Assert.NotEqual(Guid.Empty, item.Id);
            Assert.False(string.IsNullOrWhiteSpace(item.Name));
            Assert.False(string.IsNullOrWhiteSpace(item.Code));
        }
    }

    [Fact]
    public async Task GetNomenclatureLookup_FilterActiveOnly_ReturnsOnlyActive()
    {
        var result = await Sender.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.BloodTypes, IsActive: true),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.All(result.Value!, item => Assert.True(item.IsActive));
    }

    // ── GetSpecialtyTreeQuery ─────────────────────────────────────────────────

    [Fact]
    public async Task GetSpecialtyTree_ReturnsSuccess()
    {
        var result = await Sender.Send(new GetSpecialtyTreeQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess, $"Handler a eșuat: {result.Error}");
        Assert.NotNull(result.Value);
    }

    [Fact]
    public async Task GetSpecialtyTree_FilterActive_ReturnsOnlyActiveNodes()
    {
        var result = await Sender.Send(new GetSpecialtyTreeQuery(IsActive: true), CancellationToken.None);

        Assert.True(result.IsSuccess);
        foreach (var node in result.Value ?? [])
            Assert.True(node.IsActive);
    }
}
