using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;
using ValyanClinic.Application.Features.Invoices.Commands.StornoInvoice;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class InvoiceHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000004-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000004-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C7000004-0000-0000-0000-000000000001");
    private static readonly Guid InvoiceId      = Guid.Parse("C7000004-0000-0000-0000-000000000002");
    private static readonly Guid Key            = Guid.Parse("C7000004-0000-0000-0000-000000000003");

    private readonly IInvoiceRepository _repo        = Substitute.For<IInvoiceRepository>();
    private readonly ICurrentUser       _currentUser = Substitute.For<ICurrentUser>();

    public InvoiceHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private static CreateInvoiceCommand PersonInvoice(bool includeCnp = false) => new(
        ConsultationId: ConsultationId,
        IdempotencyKey: Key,
        SeriesId: null,
        CustomerIsLegalEntity: false,
        CustomerName: " Popescu Ion ",
        IncludeCnp: includeCnp,
        CustomerFiscalCode: "  ",
        CustomerTradeRegisterNumber: null,
        CustomerAddress: null,
        CustomerCity: null,
        CustomerCounty: null,
        Lines: null);

    private CreateInvoiceCommandHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Create_NewInvoice_ReturnsCreatedAndUsesConsultationLines()
    {
        _repo.CreateAsync(Arg.Any<InvoiceCreateData>(), UserId, Arg.Any<CancellationToken>())
             .Returns(new CreateInvoiceResult { InvoiceId = InvoiceId, IsDuplicate = false });

        var result = await CreateHandler().Handle(PersonInvoice(), default);

        Assert.Equal(201, result.StatusCode);
        await _repo.Received(1).CreateAsync(
            Arg.Is<InvoiceCreateData>(d => d.ClinicId == ClinicId && d.Lines.Count == 0
                                          && d.CustomerName == "Popescu Ion" && d.CustomerFiscalCode == null),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_DoubleSubmitWithSameKey_ReturnsExistingInvoiceWith200()
    {
        _repo.CreateAsync(Arg.Any<InvoiceCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(new CreateInvoiceResult { InvoiceId = InvoiceId, IsDuplicate = true });

        var result = await CreateHandler().Handle(PersonInvoice(), default);

        Assert.Equal(200, result.StatusCode);
        Assert.Equal(InvoiceId, result.Value!.InvoiceId);
    }

    [Fact]
    public async Task Create_ConsultationAlreadyInvoiced_ReturnsConflict()
    {
        _repo.CreateAsync(Arg.Any<InvoiceCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.InvoiceAlreadyExists));

        var result = await CreateHandler().Handle(PersonInvoice(), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Create_LegalEntity_NeverSendsCnpFlag()
    {
        _repo.CreateAsync(Arg.Any<InvoiceCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(new CreateInvoiceResult { InvoiceId = InvoiceId });

        await CreateHandler().Handle(
            PersonInvoice(includeCnp: true) with { CustomerIsLegalEntity = true, CustomerFiscalCode = "RO123" }, default);

        await _repo.Received(1).CreateAsync(
            Arg.Is<InvoiceCreateData>(d => !d.IncludeCnp && d.CustomerFiscalCode == "RO123"),
            Arg.Any<Guid>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Storno_ValidInvoice_ReturnsCreated()
    {
        var stornoId = Guid.NewGuid();
        _repo.StornoAsync(InvoiceId, ClinicId, Key, "Date client greșite", UserId, Arg.Any<CancellationToken>())
             .Returns(new CreateInvoiceResult { InvoiceId = stornoId });

        var result = await new StornoInvoiceCommandHandler(_repo, _currentUser)
            .Handle(new StornoInvoiceCommand(InvoiceId, Key, " Date client greșite "), default);

        Assert.Equal(201, result.StatusCode);
        Assert.Equal(stornoId, result.Value!.InvoiceId);
    }

    [Fact]
    public async Task Storno_AlreadyReversed_ReturnsConflict()
    {
        _repo.StornoAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.InvoiceCannotStorno));

        var result = await new StornoInvoiceCommandHandler(_repo, _currentUser)
            .Handle(new StornoInvoiceCommand(InvoiceId, Key, "Motiv"), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Storno_NotFound_ReturnsNotFound()
    {
        _repo.StornoAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.InvoiceNotFound));

        var result = await new StornoInvoiceCommandHandler(_repo, _currentUser)
            .Handle(new StornoInvoiceCommand(InvoiceId, Key, "Motiv"), default);

        Assert.Equal(404, result.StatusCode);
    }
}
