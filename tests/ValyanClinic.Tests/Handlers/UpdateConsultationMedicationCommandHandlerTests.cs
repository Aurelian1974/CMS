using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.UpdateConsultationMedication;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class UpdateConsultationMedicationCommandHandlerTests
{
    private static readonly Guid ClinicId     = Guid.Parse("A6000002-0000-0000-0000-000000000001");
    private static readonly Guid UserId       = Guid.Parse("B6000002-0000-0000-0000-000000000001");
    private static readonly Guid MedicationId = Guid.Parse("C6000002-0000-0000-0000-000000000001");

    private readonly IConsultationMedicationRepository _repo        = Substitute.For<IConsultationMedicationRepository>();
    private readonly ICurrentUser                      _currentUser = Substitute.For<ICurrentUser>();

    public UpdateConsultationMedicationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private UpdateConsultationMedicationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static UpdateConsultationMedicationCommand ValidCommand() => new(
        Id: MedicationId,
        CopaymentListType: null,
        DoseMorning: null,
        DoseAfternoon: null,
        DoseEvening: 0.5m,
        DurationDays: 10,
        Notes: "După masă");

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        await _repo.Received(1).UpdateAsync(
            Arg.Is<ConsultationMedicationUpdateData>(d => d.Id == MedicationId && d.ClinicId == ClinicId && d.CopaymentListType == null),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NotFound_ReturnsNotFound()
    {
        _repo.UpdateAsync(Arg.Any<ConsultationMedicationUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationMedicationNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.UpdateAsync(Arg.Any<ConsultationMedicationUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
