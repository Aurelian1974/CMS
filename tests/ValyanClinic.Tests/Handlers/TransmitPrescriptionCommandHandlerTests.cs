using NSubstitute;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.Commands.TransmitPrescription;
using ValyanClinic.Application.Features.Prescriptions.DTOs;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class TransmitPrescriptionCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000004-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000004-0000-0000-0000-000000000001");
    private static readonly Guid PrescriptionId = Guid.Parse("C7000004-0000-0000-0000-000000000001");

    private readonly IPrescriptionRepository _repo        = Substitute.For<IPrescriptionRepository>();
    private readonly ISipeClient             _sipe        = Substitute.For<ISipeClient>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public TransmitPrescriptionCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
        _sipe.IsEnabled.Returns(true);
    }

    private TransmitPrescriptionCommandHandler CreateHandler() => new(_repo, _sipe, _currentUser);

    private static PrescriptionDetailDto IssuedCompensated() => new()
    {
        Id = PrescriptionId,
        IsCnas = true,
        StatusCode = PrescriptionStatusCodes.Issued,
    };

    private void SetupPrescription(PrescriptionDetailDto dto) =>
        _repo.GetByIdAsync(PrescriptionId, ClinicId, Arg.Any<CancellationToken>()).Returns(dto);

    [Fact]
    public async Task Handle_SipeDisabled_ReturnsFailureWithoutTouchingRepository()
    {
        _sipe.IsEnabled.Returns(false);

        var result = await CreateHandler().Handle(new TransmitPrescriptionCommand(PrescriptionId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Prescription.SipeNotConfigured, result.Error);
        await _repo.DidNotReceiveWithAnyArgs().GetByIdAsync(default, default, default);
    }

    [Fact]
    public async Task Handle_SimplePrescription_ReturnsFailure()
    {
        SetupPrescription(IssuedCompensated() with { IsCnas = false });

        var result = await CreateHandler().Handle(new TransmitPrescriptionCommand(PrescriptionId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorMessages.Prescription.NotTransmittable, result.Error);
        await _sipe.DidNotReceiveWithAnyArgs().TransmitAsync(default!, default);
    }

    [Fact]
    public async Task Handle_SipeSuccess_StoresElectronicId()
    {
        SetupPrescription(IssuedCompensated());
        _sipe.TransmitAsync(Arg.Any<PrescriptionDetailDto>(), Arg.Any<CancellationToken>())
             .Returns(new SipeTransmissionResult(true, "E123", false, null));

        var result = await CreateHandler().Handle(new TransmitPrescriptionCommand(PrescriptionId), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).SetTransmissionAsync(
            PrescriptionId, ClinicId, "E123", false, null, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SipeError_StoresErrorAndReturnsFailure()
    {
        SetupPrescription(IssuedCompensated());
        _sipe.TransmitAsync(Arg.Any<PrescriptionDetailDto>(), Arg.Any<CancellationToken>())
             .Returns(new SipeTransmissionResult(false, null, false, "Asigurat invalid"));

        var result = await CreateHandler().Handle(new TransmitPrescriptionCommand(PrescriptionId), default);

        Assert.False(result.IsSuccess);
        await _repo.Received(1).SetTransmissionAsync(
            PrescriptionId, ClinicId, null, false, "Asigurat invalid", UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NotFound_ReturnsNotFound()
    {
        _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((PrescriptionDetailDto?)null);

        var result = await CreateHandler().Handle(new TransmitPrescriptionCommand(PrescriptionId), default);

        Assert.Equal(404, result.StatusCode);
    }
}
