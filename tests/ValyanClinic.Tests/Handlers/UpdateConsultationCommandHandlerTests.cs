using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru UpdateConsultationCommandHandler.
/// </summary>
public sealed class UpdateConsultationCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A2000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B2000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C2000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public UpdateConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private UpdateConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static UpdateConsultationCommand ValidCommand() => new(
        Id: ConsultationId,
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        AppointmentId: null,
        Date: DateTime.UtcNow.AddHours(1),
        Investigatii: null,
        AnalizeMedicale: null,
        Diagnostic: "Sănătos",
        DiagnosticCodes: "Z00.0",
        Recomandari: "Repaus",
        Observatii: null,
        Concluzii: null,
        EsteAfectiuneOncologica: false,
        AreIndicatieInternare: false,
        SaEliberatPrescriptie: false,
        SeriePrescriptie: null,
        SaEliberatConcediuMedical: false,
        SerieConcediuMedical: null,
        SaEliberatIngrijiriDomiciliu: false,
        SaEliberatDispozitiveMedicale: false,
        DataUrmatoareiVizite: null,
        NoteUrmatoareaVizita: null,
        StatusId: null);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<ConsultationUpdateData>(d => d.Id == ConsultationId && d.ClinicId == ClinicId),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        _repo.UpdateAsync(Arg.Any<ConsultationUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.UpdateAsync(Arg.Any<ConsultationUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
