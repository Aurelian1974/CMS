using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Schedule.Commands;
using ValyanClinic.Application.Features.Schedule.DTOs;
using ValyanClinic.Application.Features.Schedule.Queries;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru handler-ele Schedule.
/// Mockuiesc IScheduleRepository și ICurrentUser.
/// </summary>
public sealed class ScheduleHandlerTests
{
    private static readonly Guid ClinicId  = Guid.Parse("A0000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId    = Guid.Parse("2C0780A7-8612-F111-BBB2-20235109A3A2");
    private static readonly Guid DoctorId  = Guid.Parse("8B59494B-1012-F111-BBB1-20235109A3A2");

    private readonly IScheduleRepository _repo        = Substitute.For<IScheduleRepository>();
    private readonly ICurrentUser        _currentUser = Substitute.For<ICurrentUser>();

    public ScheduleHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    // ── GetClinicScheduleQuery ────────────────────────────────────────────────

    [Fact]
    public async Task GetClinicScheduleQuery_ReturnsSuccess()
    {
        var data = new List<ClinicScheduleDto>
        {
            new(Guid.NewGuid(), ClinicId, 1, true, "08:00", "17:00"),
            new(Guid.NewGuid(), ClinicId, 2, true, "08:00", "17:00"),
        };
        _repo.GetClinicScheduleAsync(ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<ClinicScheduleDto>>(data));

        var handler = new GetClinicScheduleQueryHandler(_repo, _currentUser);
        var result  = await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(2, result.Value!.Count());
    }

    [Fact]
    public async Task GetClinicScheduleQuery_EmptyList_ReturnsSuccess()
    {
        _repo.GetClinicScheduleAsync(ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<ClinicScheduleDto>>([]));

        var handler = new GetClinicScheduleQueryHandler(_repo, _currentUser);
        var result  = await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetClinicScheduleQuery_UsesClinicIdFromCurrentUser()
    {
        _repo.GetClinicScheduleAsync(ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<ClinicScheduleDto>>([]));

        var handler = new GetClinicScheduleQueryHandler(_repo, _currentUser);
        await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        await _repo.Received(1).GetClinicScheduleAsync(ClinicId, Arg.Any<CancellationToken>());
    }

    // ── GetDoctorScheduleByClinicQuery ────────────────────────────────────────

    [Fact]
    public async Task GetDoctorScheduleByClinicQuery_ReturnsSuccess()
    {
        var data = new List<DoctorScheduleDto>
        {
            new(Guid.NewGuid(), ClinicId, DoctorId, "Dr. Ionescu", "Cardiologie", 1, "08:00", "16:00"),
            new(Guid.NewGuid(), ClinicId, DoctorId, "Dr. Ionescu", "Cardiologie", 2, "08:00", "16:00"),
        };
        _repo.GetDoctorScheduleByClinicAsync(ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<DoctorScheduleDto>>(data));

        var handler = new GetDoctorScheduleByClinicQueryHandler(_repo, _currentUser);
        var result  = await handler.Handle(new GetDoctorScheduleByClinicQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count());
    }

    // ── GetDoctorScheduleQuery ────────────────────────────────────────────────

    [Fact]
    public async Task GetDoctorScheduleQuery_ReturnsDayDtos()
    {
        var data = new List<DoctorDayDto>
        {
            new(Guid.NewGuid(), DoctorId, 1, "09:00", "17:00"),
            new(Guid.NewGuid(), DoctorId, 3, "09:00", "17:00"),
        };
        _repo.GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<DoctorDayDto>>(data));

        var handler = new GetDoctorScheduleQueryHandler(_repo, _currentUser);
        var result  = await handler.Handle(new GetDoctorScheduleQuery(DoctorId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count());
    }

    [Fact]
    public async Task GetDoctorScheduleQuery_PassesDoctorIdToRepo()
    {
        _repo.GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.FromResult<IEnumerable<DoctorDayDto>>([]));

        var handler = new GetDoctorScheduleQueryHandler(_repo, _currentUser);
        await handler.Handle(new GetDoctorScheduleQuery(DoctorId), CancellationToken.None);

        await _repo.Received(1).GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, Arg.Any<CancellationToken>());
    }

    // ── UpsertClinicDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task UpsertClinicDayCommand_IsOpen_CallsRepoWithTimes()
    {
        _repo.UpsertClinicDayAsync(
            ClinicId, 1, true, "08:00", "17:00", UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new UpsertClinicDayCommandHandler(_repo, _currentUser);
        var result  = await handler.Handle(
            new UpsertClinicDayCommand(1, true, "08:00", "17:00"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).UpsertClinicDayAsync(
            ClinicId, 1, true, "08:00", "17:00", UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpsertClinicDayCommand_Closed_PassesNullTimes()
    {
        _repo.UpsertClinicDayAsync(
            ClinicId, 7, false, null, null, UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new UpsertClinicDayCommandHandler(_repo, _currentUser);
        var result  = await handler.Handle(
            new UpsertClinicDayCommand(7, false, null, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).UpsertClinicDayAsync(
            ClinicId, 7, false, null, null, UserId, Arg.Any<CancellationToken>());
    }

    // ── UpsertDoctorDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task UpsertDoctorDayCommand_ReturnsSuccess()
    {
        _repo.UpsertDoctorDayAsync(
            ClinicId, DoctorId, 1, "08:00", "16:00", UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new UpsertDoctorDayCommandHandler(_repo, _currentUser);
        var result  = await handler.Handle(
            new UpsertDoctorDayCommand(DoctorId, 1, "08:00", "16:00"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task UpsertDoctorDayCommand_PassesAllArgsToRepo()
    {
        _repo.UpsertDoctorDayAsync(
            ClinicId, DoctorId, 3, "09:30", "17:30", UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new UpsertDoctorDayCommandHandler(_repo, _currentUser);
        await handler.Handle(
            new UpsertDoctorDayCommand(DoctorId, 3, "09:30", "17:30"), CancellationToken.None);

        await _repo.Received(1).UpsertDoctorDayAsync(
            ClinicId, DoctorId, 3, "09:30", "17:30", UserId, Arg.Any<CancellationToken>());
    }

    // ── DeleteDoctorDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task DeleteDoctorDayCommand_ReturnsSuccess()
    {
        _repo.DeleteDoctorDayAsync(
            DoctorId, 1, ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new DeleteDoctorDayCommandHandler(_repo, _currentUser);
        var result  = await handler.Handle(
            new DeleteDoctorDayCommand(DoctorId, 1), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).DeleteDoctorDayAsync(
            DoctorId, 1, ClinicId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteDoctorDayCommand_UsesClinicIdFromCurrentUser()
    {
        var otherDoctorId = Guid.NewGuid();
        _repo.DeleteDoctorDayAsync(
            otherDoctorId, 5, ClinicId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var handler = new DeleteDoctorDayCommandHandler(_repo, _currentUser);
        await handler.Handle(new DeleteDoctorDayCommand(otherDoctorId, 5), CancellationToken.None);

        // ClinicId vine din currentUser, nu din command
        await _repo.Received(1).DeleteDoctorDayAsync(
            otherDoctorId, 5, ClinicId, Arg.Any<CancellationToken>());
    }
}
