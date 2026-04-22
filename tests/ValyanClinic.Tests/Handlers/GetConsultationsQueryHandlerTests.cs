using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;
using ValyanClinic.Application.Features.Consultations.Queries.GetConsultations;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru GetConsultationsQueryHandler.
/// </summary>
public sealed class GetConsultationsQueryHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A4000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public GetConsultationsQueryHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
    }

    private GetConsultationsQueryHandler CreateHandler() => new(_repo, _currentUser);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsSuccess_WithPagedData()
    {
        var items = new[]
        {
            new ConsultationListDto
            {
                Id = Guid.NewGuid(),
                PatientName = "Ion Popescu",
                DoctorName = "Dr. Maria",
                SpecialtyName = "Cardiologie",
                Date = DateTime.UtcNow,
                DiagnosticCodes = "Z00.0",
                StatusName = "În lucru",
                StatusCode = "INLUCRU",
            }
        };

        var pagedResult = new ConsultationPagedResult(
            Paged: new PagedResult<ConsultationListDto>(items, 1, 1, 20),
            Stats: new ConsultationStatsDto
            {
                TotalConsultations = 1,
                DraftCount = 1,
                CompletedCount = 0,
                LockedCount = 0,
            });

        _repo.GetPagedAsync(
                ClinicId,
                Arg.Any<string?>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(),
                Arg.Any<DateTime?>(), Arg.Any<DateTime?>(),
                Arg.Any<int>(), Arg.Any<int>(),
                Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<CancellationToken>())
             .Returns(pagedResult);

        var result = await CreateHandler().Handle(new GetConsultationsQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.PagedResult.Items);
        Assert.Equal(1, result.Value.Stats.TotalConsultations);
    }

    [Fact]
    public async Task Handle_EmptyList_ReturnsSuccess()
    {
        var pagedResult = new ConsultationPagedResult(
            Paged: new PagedResult<ConsultationListDto>([], 0, 1, 20),
            Stats: new ConsultationStatsDto
            {
                TotalConsultations = 0,
                DraftCount = 0,
                CompletedCount = 0,
                LockedCount = 0,
            });

        _repo.GetPagedAsync(
                ClinicId,
                Arg.Any<string?>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(),
                Arg.Any<DateTime?>(), Arg.Any<DateTime?>(),
                Arg.Any<int>(), Arg.Any<int>(),
                Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<CancellationToken>())
             .Returns(pagedResult);

        var result = await CreateHandler().Handle(new GetConsultationsQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.PagedResult.Items);
    }

    [Fact]
    public async Task Handle_UsesClinicIdFromCurrentUser()
    {
        var pagedResult = new ConsultationPagedResult(
            Paged: new PagedResult<ConsultationListDto>([], 0, 1, 20),
            Stats: new ConsultationStatsDto
            {
                TotalConsultations = 0,
                DraftCount = 0,
                CompletedCount = 0,
                LockedCount = 0,
            });

        _repo.GetPagedAsync(
                Arg.Any<Guid>(),
                Arg.Any<string?>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(),
                Arg.Any<DateTime?>(), Arg.Any<DateTime?>(),
                Arg.Any<int>(), Arg.Any<int>(),
                Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<CancellationToken>())
             .Returns(pagedResult);

        await CreateHandler().Handle(new GetConsultationsQuery(), default);

        await _repo.Received(1).GetPagedAsync(
            ClinicId,
            Arg.Any<string?>(), Arg.Any<Guid?>(), Arg.Any<Guid?>(),
            Arg.Any<DateTime?>(), Arg.Any<DateTime?>(),
            Arg.Any<int>(), Arg.Any<int>(),
            Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }
}
