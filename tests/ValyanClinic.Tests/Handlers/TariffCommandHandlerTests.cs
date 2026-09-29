using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Tariffs.Commands.AddMedicalServicePrice;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;
using ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;
using ValyanClinic.Application.Features.Tariffs.Commands.UpdateMedicalService;
using ValyanClinic.Application.Features.Tariffs.DTOs;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class TariffCommandHandlerTests
{
    private static readonly Guid ClinicId   = Guid.Parse("A7000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId     = Guid.Parse("B7000001-0000-0000-0000-000000000001");
    private static readonly Guid ServiceId  = Guid.Parse("C7000001-0000-0000-0000-000000000001");
    private static readonly Guid CategoryId = Guid.Parse("F2000000-0000-0000-0000-000000000001");
    private static readonly Guid VatRateId  = Guid.Parse("F1000000-0000-0000-0000-000000000001");

    private readonly ITariffRepository _repo        = Substitute.For<ITariffRepository>();
    private readonly ICurrentUser      _currentUser = Substitute.For<ICurrentUser>();

    public TariffCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private static CreateMedicalServiceCommand ValidCreate() => new(
        Code: " SPIRO ",
        Name: "Spirometrie",
        CategoryId: CategoryId,
        DurationMinutes: 20,
        InvestigationTypeCode: "Spirometry",
        Price: 50m,
        VatRateId: VatRateId,
        ValidFrom: null);

    [Fact]
    public async Task Create_ValidCommand_ReturnsCreatedAndPassesTenantAndTrimmedCode()
    {
        _repo.CreateAsync(Arg.Any<MedicalServiceCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(ServiceId);

        var result = await new CreateMedicalServiceCommandHandler(_repo, _currentUser).Handle(ValidCreate(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(ServiceId, result.Value);
        await _repo.Received(1).CreateAsync(
            Arg.Is<MedicalServiceCreateData>(d => d.ClinicId == ClinicId && d.Code == "SPIRO" && d.Price == 50m),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_DuplicateCode_ReturnsConflict()
    {
        _repo.CreateAsync(Arg.Any<MedicalServiceCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.MedicalServiceCodeDuplicate));

        var result = await new CreateMedicalServiceCommandHandler(_repo, _currentUser).Handle(ValidCreate(), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Update_ConcurrentModification_ReturnsConflict()
    {
        _repo.UpdateAsync(Arg.Any<MedicalServiceUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.MedicalServiceConcurrency));

        var command = new UpdateMedicalServiceCommand(
            Id: ServiceId, Code: "SPIRO", Name: "Spirometrie", CategoryId: CategoryId,
            DurationMinutes: null, InvestigationTypeCode: null, RowVersion: new byte[8]);

        var result = await new UpdateMedicalServiceCommandHandler(_repo, _currentUser).Handle(command, default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Update_NotFound_ReturnsNotFound()
    {
        _repo.UpdateAsync(Arg.Any<MedicalServiceUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.MedicalServiceNotFound));

        var command = new UpdateMedicalServiceCommand(
            Id: ServiceId, Code: "SPIRO", Name: "Spirometrie", CategoryId: CategoryId,
            DurationMinutes: null, InvestigationTypeCode: null, RowVersion: new byte[8]);

        var result = await new UpdateMedicalServiceCommandHandler(_repo, _currentUser).Handle(command, default);

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task AddPrice_ValidCommand_ReturnsCreated()
    {
        var priceId = Guid.NewGuid();
        var validFrom = DateOnly.FromDateTime(DateTime.Today);
        _repo.AddPriceAsync(ClinicId, ServiceId, 120m, VatRateId, validFrom, UserId, Arg.Any<CancellationToken>())
             .Returns(priceId);

        var result = await new AddMedicalServicePriceCommandHandler(_repo, _currentUser)
            .Handle(new AddMedicalServicePriceCommand(ServiceId, 120m, VatRateId, validFrom), default);

        Assert.Equal(201, result.StatusCode);
        Assert.Equal(priceId, result.Value);
    }

    [Fact]
    public async Task AddPrice_PastDate_ReturnsFailure()
    {
        _repo.AddPriceAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<decimal>(), Arg.Any<Guid>(),
                Arg.Any<DateOnly>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.MedicalServicePriceInvalid));

        var result = await new AddMedicalServicePriceCommandHandler(_repo, _currentUser)
            .Handle(new AddMedicalServicePriceCommand(ServiceId, 120m, VatRateId, new DateOnly(2020, 1, 1)), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    private static ImportInvestigationServicesCommand ValidImport() => new(
        Items:
        [
            new InvestigationServiceImportItem(InvestigationTypeCode: " ECG ", Name: " Electrocardiogramă ", Price: 80m),
            new InvestigationServiceImportItem(InvestigationTypeCode: "Spirometry", Name: "Spirometrie", Price: null),
        ],
        VatRateId: VatRateId,
        ValidFrom: null);

    [Fact]
    public async Task Import_ValidCommand_ReturnsCountAndPassesTenantAndTrimmedItems()
    {
        _repo.ImportInvestigationServicesAsync(Arg.Any<InvestigationServicesImportData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(2);

        var result = await new ImportInvestigationServicesCommandHandler(_repo, _currentUser).Handle(ValidImport(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(2, result.Value);
        await _repo.Received(1).ImportInvestigationServicesAsync(
            Arg.Is<InvestigationServicesImportData>(d =>
                d.ClinicId == ClinicId
                && d.Items.Count == 2
                && d.Items[0].InvestigationTypeCode == "ECG"
                && d.Items[0].Name == "Electrocardiogramă"
                && d.Items[1].Price == null),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Import_AlreadyLinked_ReturnsConflict()
    {
        _repo.ImportInvestigationServicesAsync(Arg.Any<InvestigationServicesImportData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.InvestigationServiceAlreadyExists));

        var result = await new ImportInvestigationServicesCommandHandler(_repo, _currentUser).Handle(ValidImport(), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Import_NotBillableType_ReturnsFailure()
    {
        _repo.ImportInvestigationServicesAsync(Arg.Any<InvestigationServicesImportData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.InvestigationTypeNotBillable));

        var result = await new ImportInvestigationServicesCommandHandler(_repo, _currentUser).Handle(ValidImport(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
