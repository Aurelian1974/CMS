using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.Commands.GenerateConsultationPrescriptions;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class GenerateConsultationPrescriptionsCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000002-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000002-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C7000002-0000-0000-0000-000000000001");
    private static readonly Guid CareTypeId     = Guid.Parse("D5200000-0000-0000-0000-000000000003");
    private static readonly Guid NewId          = Guid.Parse("D7000002-0000-0000-0000-000000000001");

    private readonly IPrescriptionRepository _repo        = Substitute.For<IPrescriptionRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public GenerateConsultationPrescriptionsCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private GenerateConsultationPrescriptionsCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static GenerateConsultationPrescriptionsCommand ValidCommand() =>
        new(ConsultationId: ConsultationId, CareTypeId: CareTypeId, InsuredCategoryId: null, TreatmentDays: 30);

    private void SetupThrows(int number) =>
        _repo.GenerateFromConsultationAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<int?>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(number));

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreatedAndPassesCurrentUser()
    {
        _repo.GenerateFromConsultationAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<int?>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns([NewId]);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal([NewId], result.Value);
        await _repo.Received(1).GenerateFromConsultationAsync(
            ConsultationId, ClinicId, CareTypeId, null, 30, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        SetupThrows(SqlErrorCodes.ConsultationNotFound);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_NothingToGenerate_ReturnsFailure()
    {
        SetupThrows(SqlErrorCodes.PrescriptionNothingToGenerate);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
