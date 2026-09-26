using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.DeleteConsultationMedication;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class DeleteConsultationMedicationCommandHandlerTests
{
    private static readonly Guid ClinicId     = Guid.Parse("A6000003-0000-0000-0000-000000000001");
    private static readonly Guid UserId       = Guid.Parse("B6000003-0000-0000-0000-000000000001");
    private static readonly Guid MedicationId = Guid.Parse("C6000003-0000-0000-0000-000000000001");

    private readonly IConsultationMedicationRepository _repo        = Substitute.For<IConsultationMedicationRepository>();
    private readonly ICurrentUser                      _currentUser = Substitute.For<ICurrentUser>();

    public DeleteConsultationMedicationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private DeleteConsultationMedicationCommandHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        var result = await CreateHandler().Handle(new DeleteConsultationMedicationCommand(MedicationId), default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
        await _repo.Received(1).DeleteAsync(MedicationId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NotFound_ReturnsNotFound()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationMedicationNotFound));

        var result = await CreateHandler().Handle(new DeleteConsultationMedicationCommand(MedicationId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_ConsultationLocked_ReturnsFailure()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationLocked));

        var result = await CreateHandler().Handle(new DeleteConsultationMedicationCommand(MedicationId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
