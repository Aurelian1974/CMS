using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru CreateConsultationCommandHandler.
/// </summary>
public sealed class CreateConsultationCommandHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A1000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B1000001-0000-0000-0000-000000000001");
    private static readonly Guid NewId    = Guid.Parse("C1000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public CreateConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private CreateConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static CreateConsultationCommand ValidCommand() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddHours(1),
        Motiv: "Durere de cap",
        ExamenClinic: null,
        Diagnostic: null,
        DiagnosticCodes: null,
        Recomandari: null,
        Observatii: null,
        StatusId: null);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        _repo.CreateAsync(
                ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid?>(), Arg.Any<DateTime>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<Guid?>(), UserId,
                Arg.Any<CancellationToken>())
             .Returns(NewId);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(NewId, result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.CreateAsync(
                ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid?>(), Arg.Any<DateTime>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<Guid?>(), UserId,
                Arg.Any<CancellationToken>())
             .Returns(NewId);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).CreateAsync(
            ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
            Arg.Any<Guid?>(), Arg.Any<DateTime>(),
            Arg.Any<string?>(), Arg.Any<string?>(),
            Arg.Any<string?>(), Arg.Any<string?>(),
            Arg.Any<string?>(), Arg.Any<string?>(),
            Arg.Any<Guid?>(), UserId,
            Arg.Any<CancellationToken>());
    }

    // ── Generic SQL error ─────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.CreateAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid?>(), Arg.Any<DateTime>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<Guid?>(), Arg.Any<Guid>(),
                Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
