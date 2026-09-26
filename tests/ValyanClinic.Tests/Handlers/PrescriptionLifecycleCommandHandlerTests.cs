using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.DeletePrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.IssuePrescription;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>Tranzițiile de status ale rețetei: emitere, anulare, ștergere ciornă.</summary>
public sealed class PrescriptionLifecycleCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000003-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000003-0000-0000-0000-000000000001");
    private static readonly Guid PrescriptionId = Guid.Parse("C7000003-0000-0000-0000-000000000001");

    private readonly IPrescriptionRepository _repo        = Substitute.For<IPrescriptionRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public PrescriptionLifecycleCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    [Fact]
    public async Task Issue_ValidCommand_ReturnsSuccess()
    {
        var result = await new IssuePrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new IssuePrescriptionCommand(PrescriptionId), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).IssueAsync(PrescriptionId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Issue_NotFound_ReturnsNotFound()
    {
        _repo.IssueAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PrescriptionNotFound));

        var result = await new IssuePrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new IssuePrescriptionCommand(PrescriptionId), default);

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Issue_TreatmentDaysExceedCareType_ReturnsFailure()
    {
        _repo.IssueAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PrescriptionTreatmentInvalid));

        var result = await new IssuePrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new IssuePrescriptionCommand(PrescriptionId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Cancel_ValidCommand_TrimsReasonAndReturnsSuccess()
    {
        var result = await new CancelPrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new CancelPrescriptionCommand(PrescriptionId, "  Doză greșită  "), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).CancelAsync(PrescriptionId, ClinicId, "Doză greșită", UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Cancel_DraftPrescription_ReturnsFailure()
    {
        _repo.CancelAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PrescriptionCannotCancel));

        var result = await new CancelPrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new CancelPrescriptionCommand(PrescriptionId, "motiv"), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Delete_IssuedPrescription_ReturnsFailure()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.PrescriptionNotEditable));

        var result = await new DeletePrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new DeletePrescriptionCommand(PrescriptionId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Delete_Draft_ReturnsSuccess()
    {
        var result = await new DeletePrescriptionCommandHandler(_repo, _currentUser)
            .Handle(new DeletePrescriptionCommand(PrescriptionId), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).DeleteAsync(PrescriptionId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }
}
