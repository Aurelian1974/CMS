using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentById;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentConflicts;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;
using ValyanClinic.Application.Features.Appointments.Queries.GetPatientAppointments;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>Query handlers Appointments — tenancy din ICurrentUser + maparea rezultatului.</summary>
public sealed class AppointmentQueryHandlerTests
{
    private static readonly Guid ClinicId      = Guid.Parse("A0000005-0000-0000-0000-000000000001");
    private static readonly Guid AppointmentId = Guid.Parse("C0000005-0000-0000-0000-000000000001");
    private static readonly Guid DoctorId      = Guid.Parse("D0000005-0000-0000-0000-000000000001");
    private static readonly Guid PatientId     = Guid.Parse("E0000005-0000-0000-0000-000000000001");

    private readonly IAppointmentRepository _repo        = Substitute.For<IAppointmentRepository>();
    private readonly ICurrentUser           _currentUser = Substitute.For<ICurrentUser>();

    public AppointmentQueryHandlerTests() => _currentUser.ClinicId.Returns(ClinicId);

    // ── GetById ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Exists_ReturnsSuccess()
    {
        var dto = new AppointmentDetailDto { Id = AppointmentId };
        _repo.GetByIdAsync(AppointmentId, ClinicId, Arg.Any<CancellationToken>()).Returns(dto);

        var result = await new GetAppointmentByIdQueryHandler(_repo, _currentUser)
            .Handle(new GetAppointmentByIdQuery(AppointmentId), default);

        Assert.True(result.IsSuccess);
        Assert.Same(dto, result.Value);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((AppointmentDetailDto?)null);

        var result = await new GetAppointmentByIdQueryHandler(_repo, _currentUser)
            .Handle(new GetAppointmentByIdQuery(AppointmentId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    // ── GetPaged ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAppointments_WrapsPagedResultAndStats()
    {
        var stats = new AppointmentStatsDto { TotalAppointments = 3, NoShowCount = 1 };
        var paged = new PagedResult<AppointmentListDto>([new AppointmentListDto { Id = AppointmentId }], 1, 1, 20);
        _repo.GetPagedAsync(ClinicId, "Pop", DoctorId, null, null, null, 1, 20, "StartTime", "desc", Arg.Any<CancellationToken>())
             .Returns(new AppointmentPagedResult(paged, stats));

        var result = await new GetAppointmentsQueryHandler(_repo, _currentUser)
            .Handle(new GetAppointmentsQuery(Search: "Pop", DoctorId: DoctorId), default);

        Assert.True(result.IsSuccess);
        Assert.Same(paged, result.Value!.PagedResult);
        Assert.Equal(1, result.Value.Stats.NoShowCount);
    }

    // ── Scheduler / conflicte / pacient ─────────────────────────────────────

    [Fact]
    public async Task GetForScheduler_UsesClinicIdFromCurrentUser()
    {
        var from = DateTime.Today;
        var to = from.AddDays(6);
        _repo.GetForSchedulerAsync(ClinicId, from, to, DoctorId, Arg.Any<CancellationToken>())
             .Returns([new AppointmentSchedulerDto { Id = AppointmentId, BlocksSlot = true }]);

        var result = await new GetAppointmentsForSchedulerQueryHandler(_repo, _currentUser)
            .Handle(new GetAppointmentsForSchedulerQuery(from, to, DoctorId), default);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
    }

    [Fact]
    public async Task GetConflicts_PassesIntervalAndExcludeId()
    {
        var start = DateTime.Today.AddHours(9);
        var end = start.AddMinutes(30);
        _repo.GetConflictsAsync(ClinicId, DoctorId, start, end, AppointmentId, Arg.Any<CancellationToken>())
             .Returns([new AppointmentConflictDto { Id = Guid.NewGuid(), PatientName = "Pop Ion" }]);

        var result = await new GetAppointmentConflictsQueryHandler(_repo, _currentUser)
            .Handle(new GetAppointmentConflictsQuery(DoctorId, start, end, AppointmentId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal("Pop Ion", Assert.Single(result.Value!).PatientName);
    }

    [Fact]
    public async Task GetPatientAppointments_UsesClinicIdFromCurrentUser()
    {
        _repo.GetByPatientAsync(ClinicId, PatientId, Arg.Any<CancellationToken>())
             .Returns([new AppointmentSchedulerDto { Id = AppointmentId }]);

        var result = await new GetPatientAppointmentsQueryHandler(_repo, _currentUser)
            .Handle(new GetPatientAppointmentsQuery(PatientId), default);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        await _repo.DidNotReceive().GetByPatientAsync(
            Arg.Is<Guid>(g => g != ClinicId), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }
}
