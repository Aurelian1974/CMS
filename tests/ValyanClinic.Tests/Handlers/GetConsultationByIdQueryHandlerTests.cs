using NSubstitute;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.DTOs;
using ValyanClinic.Application.Features.Consultations.Queries.GetConsultationById;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru GetConsultationByIdQueryHandler.
/// </summary>
public sealed class GetConsultationByIdQueryHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A5000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C5000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public GetConsultationByIdQueryHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
    }

    private GetConsultationByIdQueryHandler CreateHandler() => new(_repo, _currentUser);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingConsultation_ReturnsSuccess()
    {
        var detail = new ConsultationDetailDto
        {
            Id = ConsultationId,
            PatientId = Guid.NewGuid(),
            PatientName = "Ion Popescu",
            DoctorId = Guid.NewGuid(),
            DoctorName = "Dr. Maria",
            SpecialtyName = "Cardiologie",
            AppointmentId = null,
            Date = DateTime.UtcNow,
            Motiv = "Durere de cap",
            ExamenClinic = null,
            Diagnostic = null,
            DiagnosticCodes = null,
            Recomandari = null,
            Observatii = null,
            StatusId = Guid.NewGuid(),
            StatusName = "În lucru",
            StatusCode = "INLUCRU",
            CreatedAt = DateTime.UtcNow,
            CreatedByName = "admin",
            UpdatedAt = null,
            UpdatedBy = null,
        };

        _repo.GetByIdAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>())
             .Returns(detail);

        var result = await CreateHandler().Handle(new GetConsultationByIdQuery(ConsultationId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(ConsultationId, result.Value!.Id);
    }

    // ── Not found ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NonExistingConsultation_ReturnsNotFound()
    {
        _repo.GetByIdAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>())
             .Returns((ConsultationDetailDto?)null);

        var result = await CreateHandler().Handle(new GetConsultationByIdQuery(ConsultationId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
        Assert.Contains(ErrorMessages.Consultation.NotFound, result.Error);
    }

    [Fact]
    public async Task Handle_UsesClinicIdFromCurrentUser()
    {
        _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((ConsultationDetailDto?)null);

        await CreateHandler().Handle(new GetConsultationByIdQuery(ConsultationId), default);

        await _repo.Received(1).GetByIdAsync(
            ConsultationId, ClinicId, Arg.Any<CancellationToken>());
    }
}
