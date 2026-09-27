using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Payments.Commands.CancelPayment;
using ValyanClinic.Application.Features.Payments.Commands.CreatePayment;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class PaymentHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000003-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000003-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C7000003-0000-0000-0000-000000000001");
    private static readonly Guid PaymentId      = Guid.Parse("C7000003-0000-0000-0000-000000000002");
    private static readonly Guid ReceiptId      = Guid.Parse("C7000003-0000-0000-0000-000000000003");
    private static readonly Guid Key            = Guid.Parse("C7000003-0000-0000-0000-000000000004");
    private static readonly Guid Cash           = Guid.Parse("F3000000-0000-0000-0000-000000000001");
    private static readonly Guid Card           = Guid.Parse("F3000000-0000-0000-0000-000000000002");

    private readonly IPaymentRepository _repo        = Substitute.For<IPaymentRepository>();
    private readonly ICurrentUser       _currentUser = Substitute.For<ICurrentUser>();

    public PaymentHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private static CreatePaymentCommand CashAndCard150() => new(
        ConsultationId: ConsultationId,
        IdempotencyKey: Key,
        Tenders: [new PaymentTenderInput(Cash, 100m), new PaymentTenderInput(Card, 50m)],
        Notes: null);

    private CreatePaymentCommandHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Create_NewPayment_ReturnsCreatedWithReceipt()
    {
        _repo.CreateAsync(ClinicId, ConsultationId, Key, Arg.Any<IReadOnlyList<PaymentTenderInput>>(),
                null, UserId, Arg.Any<CancellationToken>())
             .Returns(new CreatePaymentResult { PaymentId = PaymentId, FiscalReceiptId = ReceiptId, IsDuplicate = false });

        var result = await CreateHandler().Handle(CashAndCard150(), default);

        Assert.Equal(201, result.StatusCode);
        Assert.Equal(ReceiptId, result.Value!.FiscalReceiptId);
    }

    [Fact]
    public async Task Create_RetryWithSameKey_ReturnsExistingPaymentWith200()
    {
        _repo.CreateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Key, Arg.Any<IReadOnlyList<PaymentTenderInput>>(),
                Arg.Any<string?>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(new CreatePaymentResult { PaymentId = PaymentId, FiscalReceiptId = ReceiptId, IsDuplicate = true });

        var result = await CreateHandler().Handle(CashAndCard150(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(PaymentId, result.Value!.PaymentId);
    }

    [Fact]
    public async Task Create_AlreadyPaid_ReturnsConflict()
    {
        _repo.CreateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<IReadOnlyList<PaymentTenderInput>>(),
                Arg.Any<string?>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PaymentAlreadyPaid));

        var result = await CreateHandler().Handle(CashAndCard150(), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Theory]
    [InlineData(SqlErrorCodes.PaymentFiscalFullAmount)]
    [InlineData(SqlErrorCodes.PaymentExceedsBalance)]
    [InlineData(SqlErrorCodes.FiscalMappingMissing)]
    [InlineData(SqlErrorCodes.BillingConsultationNotFinalized)]
    public async Task Create_BusinessRuleViolation_ReturnsBadRequest(int sqlErrorCode)
    {
        _repo.CreateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<IReadOnlyList<PaymentTenderInput>>(),
                Arg.Any<string?>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(sqlErrorCode));

        var result = await CreateHandler().Handle(CashAndCard150(), default);

        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Cancel_PrintedReceipt_ReturnsConflict()
    {
        _repo.CancelAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PaymentCannotCancel));

        var result = await new CancelPaymentCommandHandler(_repo, _currentUser)
            .Handle(new CancelPaymentCommand(PaymentId, "Greșeală"), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Cancel_UnresolvedReceipt_ReturnsConflict()
    {
        _repo.CancelAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.FiscalReceiptUnresolved));

        var result = await new CancelPaymentCommandHandler(_repo, _currentUser)
            .Handle(new CancelPaymentCommand(PaymentId, "Greșeală"), default);

        Assert.Equal(409, result.StatusCode);
    }
}
