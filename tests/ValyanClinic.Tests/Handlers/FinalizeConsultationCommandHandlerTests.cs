using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.Commands.FinalizeConsultation;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class FinalizeConsultationCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A4000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B4000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C4000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public FinalizeConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private FinalizeConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static FinalizeConsultationCommand ValidCommand() => new(Id: ConsultationId);

    private void RepoThrows(int number) =>
        _repo.FinalizeAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(number));

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).FinalizeAsync(ConsultationId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        RepoThrows(SqlErrorCodes.ConsultationNotFound);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_ConsultationLocked_ReturnsConflict()
    {
        RepoThrows(SqlErrorCodes.ConsultationLocked);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.Equal(409, result.StatusCode);
        Assert.Equal(ErrorMessages.Consultation.Locked, result.Error);
    }

    [Fact]
    public async Task Handle_MissingPrimaryDiagnosis_ReturnsBadRequest()
    {
        RepoThrows(SqlErrorCodes.ConsultationMissingPrimaryDiagnosis);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.Equal(400, result.StatusCode);
        Assert.Equal(ErrorMessages.Consultation.MissingPrimaryDiagnosis, result.Error);
    }
}
