using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.CreateConsultationMedication;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class CreateConsultationMedicationCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A6000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B6000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C6000001-0000-0000-0000-000000000001");
    private static readonly Guid NewId          = Guid.Parse("D6000001-0000-0000-0000-000000000001");

    private readonly IConsultationMedicationRepository _repo        = Substitute.For<IConsultationMedicationRepository>();
    private readonly ICurrentUser                      _currentUser = Substitute.For<ICurrentUser>();

    public CreateConsultationMedicationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private CreateConsultationMedicationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static CreateConsultationMedicationCommand ValidCommand() => new(
        ConsultationId: ConsultationId,
        DrugCode: "W61038001",
        CopaymentListType: "C1",
        DoseMorning: 1m,
        DoseAfternoon: null,
        DoseEvening: 1m,
        DurationDays: 30,
        Notes: null);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(NewId, result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).CreateAsync(
            Arg.Is<ConsultationMedicationCreateData>(d =>
                d.ClinicId == ClinicId &&
                d.ConsultationId == ConsultationId &&
                d.DrugCode == "W61038001" &&
                d.CopaymentListType == "C1"),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_DrugNotFound_ReturnsNotFound()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.CnasDrugNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal(ErrorMessages.ConsultationMedication.DrugNotFound, result.Error);
    }

    [Fact]
    public async Task Handle_InvalidCopaymentList_ReturnsFailure()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.CopaymentListInvalid));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(ErrorMessages.ConsultationMedication.CopaymentListInvalid, result.Error);
    }

    [Fact]
    public async Task Handle_ConsultationLocked_ReturnsFailure()
    {
        _repo.CreateAsync(Arg.Any<ConsultationMedicationCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationLocked));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(ErrorMessages.Consultation.Locked, result.Error);
    }
}
