using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.Commands.TriggerSync;
using ValyanClinic.Application.Features.Cnas.DTOs;
using ValyanClinic.Application.Features.Cnas.Queries.GetActiveSubstancesPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetCompensatedDrugsPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetCurrentStats;
using ValyanClinic.Application.Features.Cnas.Queries.GetDrugsPaged;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru handler-ele CNAS.
/// Mockuiesc ICnasSyncRepository și ICnasNomenclatorService.
/// </summary>
public sealed class CnasHandlerTests
{
    private readonly ICnasSyncRepository     _repo    = Substitute.For<ICnasSyncRepository>();
    private readonly ICnasNomenclatorService _service = Substitute.For<ICnasNomenclatorService>();
    private readonly ICurrentUser            _user    = Substitute.For<ICurrentUser>();

    public CnasHandlerTests()
    {
        _user.Email.Returns("admin@test.ro");
    }

    // ── Helper factory ────────────────────────────────────────────────────────

    private static CnasDrugDto MakeDrug(string code = "TST001") => new(
        Code: code,
        Name: $"Medicament {code}",
        ActiveSubstanceCode: "ACT01",
        PharmaceuticalForm: "COMPRIMATE",
        PresentationMode: "CUTIE X 10 COMPR.",
        Concentration: "500 MG",
        PrescriptionMode: "P-RF",
        AtcCode: "A01AB01",
        PricePerPackage: 25.50m,
        IsNarcotic: false,
        IsBrand: false,
        IsActive: true,
        IsCompensated: false,
        Company: "Laborator SRL"
    );

    private static CnasCompensatedDrugDto MakeCompDrug(int id = 1) => new(
        Id: id,
        DrugCode: "TST001",
        DrugName: "Medicament TST001",
        CopaymentListType: "A",
        NhpCode: null,
        DiseaseCode: null,
        MaxPrice: 50m,
        CopaymentValue: 10m,
        ValidFrom: new DateTime(2026, 1, 1),
        ValidTo: new DateTime(2026, 12, 31),
        IsActive: true
    );

    private static PagedResult<T> MakePaged<T>(IEnumerable<T> items, int total = -1)
    {
        var list = items.ToList();
        return new PagedResult<T>(list, total < 0 ? list.Count : total, 1, 20);
    }

    // ── GetCnasDrugsPagedQueryHandler ─────────────────────────────────────────

    [Fact]
    public async Task GetDrugs_ReturnsSuccess_WithItems()
    {
        var drugs = new[] { MakeDrug("TST001"), MakeDrug("TST002") };
        _repo.GetDrugsPagedAsync(null, true, null, 1, 20, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(drugs)));

        var handler = new GetCnasDrugsPagedQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasDrugsPagedQuery(null, true, null, 1, 20), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(2, result.Value!.Items.Count());
    }

    [Fact]
    public async Task GetDrugs_EmptyResult_ReturnsEmptyPage()
    {
        _repo.GetDrugsPagedAsync(Arg.Any<string?>(), Arg.Any<bool?>(), Arg.Any<bool?>(),
                     Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(Array.Empty<CnasDrugDto>(), 0)));

        var handler = new GetCnasDrugsPagedQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasDrugsPagedQuery("inexistent", null, null, 1, 20), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    [Fact]
    public async Task GetDrugs_ClampsBadPage_ToMin1()
    {
        _repo.GetDrugsPagedAsync(null, null, null, 1, 20, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(Array.Empty<CnasDrugDto>(), 0)));

        var handler = new GetCnasDrugsPagedQueryHandler(_repo);
        await handler.Handle(new GetCnasDrugsPagedQuery(null, null, null, -5, 20), default);

        await _repo.Received(1).GetDrugsPagedAsync(null, null, null, 1, 20, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetDrugs_ClampsPageSize_ToMax100()
    {
        _repo.GetDrugsPagedAsync(null, null, null, 1, 100, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(Array.Empty<CnasDrugDto>(), 0)));

        var handler = new GetCnasDrugsPagedQueryHandler(_repo);
        await handler.Handle(new GetCnasDrugsPagedQuery(null, null, null, 1, 999), default);

        await _repo.Received(1).GetDrugsPagedAsync(null, null, null, 1, 100, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetDrugs_PassesAllFiltersToRepo()
    {
        _repo.GetDrugsPagedAsync("amox", true, true, 2, 10, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(new[] { MakeDrug() })));

        var handler = new GetCnasDrugsPagedQueryHandler(_repo);
        await handler.Handle(new GetCnasDrugsPagedQuery("amox", true, true, 2, 10), default);

        await _repo.Received(1).GetDrugsPagedAsync("amox", true, true, 2, 10, Arg.Any<CancellationToken>());
    }

    // ── GetCnasCompensatedDrugsPagedQueryHandler ──────────────────────────────

    [Fact]
    public async Task GetCompensated_ReturnsSuccess_WithItems()
    {
        var items = new[] { MakeCompDrug(1), MakeCompDrug(2) };
        _repo.GetCompensatedDrugsPagedAsync(null, null, 1, 20, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(items)));

        var handler = new GetCnasCompensatedDrugsPagedQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasCompensatedDrugsPagedQuery(null, null, 1, 20), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count());
    }

    [Fact]
    public async Task GetCompensated_FilterByListType_PassesToRepo()
    {
        _repo.GetCompensatedDrugsPagedAsync(null, "A", 1, 20, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(new[] { MakeCompDrug() })));

        var handler = new GetCnasCompensatedDrugsPagedQueryHandler(_repo);
        await handler.Handle(new GetCnasCompensatedDrugsPagedQuery(null, "A", 1, 20), default);

        await _repo.Received(1).GetCompensatedDrugsPagedAsync(null, "A", 1, 20, Arg.Any<CancellationToken>());
    }

    // ── GetCnasActiveSubstancesPagedQueryHandler ──────────────────────────────

    [Fact]
    public async Task GetActiveSubstances_ReturnsSuccess()
    {
        var items = new[]
        {
            new CnasActiveSubstanceDto("ACT001", new DateTime(2020, 1, 1)),
            new CnasActiveSubstanceDto("ACT002", null),
        };
        _repo.GetActiveSubstancesPagedAsync(null, 1, 20, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(MakePaged(items)));

        var handler = new GetCnasActiveSubstancesPagedQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasActiveSubstancesPagedQuery(null, 1, 20), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count());
    }

    // ── GetCnasCurrentStatsQueryHandler ───────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsSuccess_WithCounts()
    {
        var stats = new CnasSyncStatsDto(
            LastSyncAt: DateTime.UtcNow.AddHours(-1),
            LastSyncVersion: "2026-02-27",
            LastSyncStatus: "Success",
            TotalDrugs: 115712,
            ActiveDrugs: 115000,
            CompensatedDrugs: 7564
        );
        _repo.GetCurrentStatsAsync(Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(stats));

        var handler = new GetCnasCurrentStatsQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasCurrentStatsQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(115712, result.Value!.TotalDrugs);
        Assert.Equal("2026-02-27", result.Value.LastSyncVersion);
        Assert.Equal("Success", result.Value.LastSyncStatus);
    }

    [Fact]
    public async Task GetStats_NeverSynced_ReturnsNullDates()
    {
        var stats = new CnasSyncStatsDto(null, null, null, 0, 0, 0);
        _repo.GetCurrentStatsAsync(Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(stats));

        var handler = new GetCnasCurrentStatsQueryHandler(_repo);
        var result  = await handler.Handle(new GetCnasCurrentStatsQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value!.LastSyncAt);
        Assert.Equal(0, result.Value.TotalDrugs);
    }

    // ── TriggerCnasSyncCommandHandler ─────────────────────────────────────────

    [Fact]
    public async Task TriggerSync_ReturnsJobId()
    {
        var expectedJobId = Guid.NewGuid();
        _service.StartSyncAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                .Returns(Task.FromResult(expectedJobId));

        var handler = new TriggerCnasSyncCommandHandler(_service, _user);
        var result  = await handler.Handle(new TriggerCnasSyncCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(expectedJobId, result.Value);
    }

    [Fact]
    public async Task TriggerSync_UsesCurrentUserEmail_InTriggeredBy()
    {
        _user.Email.Returns("doctor@clinica.ro");
        _service.StartSyncAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                .Returns(Task.FromResult(Guid.NewGuid()));

        var handler = new TriggerCnasSyncCommandHandler(_service, _user);
        await handler.Handle(new TriggerCnasSyncCommand(), default);

        await _service.Received(1).StartSyncAsync("manual:doctor@clinica.ro", Arg.Any<CancellationToken>());
    }

    // ── CnasDrugDto — câmpuri noi ─────────────────────────────────────────────

    [Fact]
    public void CnasDrugDto_ContainsNewFields_PresentationModeAndCompany()
    {
        var dto = MakeDrug("W001");

        Assert.Equal("CUTIE X 10 COMPR.", dto.PresentationMode);
        Assert.Equal("500 MG", dto.Concentration);
        Assert.Equal("P-RF", dto.PrescriptionMode);
        Assert.Equal("COMPRIMATE", dto.PharmaceuticalForm);
        Assert.Equal("Laborator SRL", dto.Company);
    }

    [Fact]
    public void CnasDrugDto_AllowsNullOptionalFields()
    {
        var dto = new CnasDrugDto(
            Code: "MIN001",
            Name: "Medicament minim",
            ActiveSubstanceCode: null,
            PharmaceuticalForm: null,
            PresentationMode: null,
            Concentration: null,
            PrescriptionMode: null,
            AtcCode: null,
            PricePerPackage: null,
            IsNarcotic: false,
            IsBrand: false,
            IsActive: true,
            IsCompensated: false,
            Company: null
        );

        Assert.Null(dto.PresentationMode);
        Assert.Null(dto.Company);
        Assert.Null(dto.Concentration);
        Assert.True(dto.IsActive);
    }
}
