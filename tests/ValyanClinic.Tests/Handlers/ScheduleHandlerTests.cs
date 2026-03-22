using Moq;
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

    private readonly Mock<IScheduleRepository> _repo        = new();
    private readonly Mock<ICurrentUser>        _currentUser = new();

    public ScheduleHandlerTests()
    {
        _currentUser.Setup(u => u.ClinicId).Returns(ClinicId);
        _currentUser.Setup(u => u.Id).Returns(UserId);
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
        _repo.Setup(r => r.GetClinicScheduleAsync(ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(data);

        var handler = new GetClinicScheduleQueryHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(2, result.Value!.Count());
    }

    [Fact]
    public async Task GetClinicScheduleQuery_EmptyList_ReturnsSuccess()
    {
        _repo.Setup(r => r.GetClinicScheduleAsync(ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var handler = new GetClinicScheduleQueryHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetClinicScheduleQuery_UsesClinicIdFromCurrentUser()
    {
        _repo.Setup(r => r.GetClinicScheduleAsync(ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var handler = new GetClinicScheduleQueryHandler(_repo.Object, _currentUser.Object);
        await handler.Handle(new GetClinicScheduleQuery(), CancellationToken.None);

        _repo.Verify(r => r.GetClinicScheduleAsync(ClinicId, It.IsAny<CancellationToken>()), Times.Once);
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
        _repo.Setup(r => r.GetDoctorScheduleByClinicAsync(ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(data);

        var handler = new GetDoctorScheduleByClinicQueryHandler(_repo.Object, _currentUser.Object);
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
        _repo.Setup(r => r.GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync(data);

        var handler = new GetDoctorScheduleQueryHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(new GetDoctorScheduleQuery(DoctorId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count());
    }

    [Fact]
    public async Task GetDoctorScheduleQuery_PassesDoctorIdToRepo()
    {
        _repo.Setup(r => r.GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var handler = new GetDoctorScheduleQueryHandler(_repo.Object, _currentUser.Object);
        await handler.Handle(new GetDoctorScheduleQuery(DoctorId), CancellationToken.None);

        _repo.Verify(r => r.GetDoctorScheduleByDoctorAsync(DoctorId, ClinicId, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UpsertClinicDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task UpsertClinicDayCommand_IsOpen_CallsRepoWithTimes()
    {
        _repo.Setup(r => r.UpsertClinicDayAsync(
            ClinicId, 1, true, "08:00", "17:00", UserId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new UpsertClinicDayCommandHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(
            new UpsertClinicDayCommand(1, true, "08:00", "17:00"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _repo.Verify(r => r.UpsertClinicDayAsync(
            ClinicId, 1, true, "08:00", "17:00", UserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpsertClinicDayCommand_Closed_PassesNullTimes()
    {
        _repo.Setup(r => r.UpsertClinicDayAsync(
            ClinicId, 7, false, null, null, UserId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new UpsertClinicDayCommandHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(
            new UpsertClinicDayCommand(7, false, null, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _repo.Verify(r => r.UpsertClinicDayAsync(
            ClinicId, 7, false, null, null, UserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UpsertDoctorDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task UpsertDoctorDayCommand_ReturnsSuccess()
    {
        _repo.Setup(r => r.UpsertDoctorDayAsync(
            ClinicId, DoctorId, 1, "08:00", "16:00", UserId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new UpsertDoctorDayCommandHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(
            new UpsertDoctorDayCommand(DoctorId, 1, "08:00", "16:00"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task UpsertDoctorDayCommand_PassesAllArgsToRepo()
    {
        _repo.Setup(r => r.UpsertDoctorDayAsync(
            ClinicId, DoctorId, 3, "09:30", "17:30", UserId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new UpsertDoctorDayCommandHandler(_repo.Object, _currentUser.Object);
        await handler.Handle(
            new UpsertDoctorDayCommand(DoctorId, 3, "09:30", "17:30"), CancellationToken.None);

        _repo.Verify(r => r.UpsertDoctorDayAsync(
            ClinicId, DoctorId, 3, "09:30", "17:30", UserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── DeleteDoctorDayCommand ────────────────────────────────────────────────

    [Fact]
    public async Task DeleteDoctorDayCommand_ReturnsSuccess()
    {
        _repo.Setup(r => r.DeleteDoctorDayAsync(
            DoctorId, 1, ClinicId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new DeleteDoctorDayCommandHandler(_repo.Object, _currentUser.Object);
        var result  = await handler.Handle(
            new DeleteDoctorDayCommand(DoctorId, 1), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _repo.Verify(r => r.DeleteDoctorDayAsync(
            DoctorId, 1, ClinicId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteDoctorDayCommand_UsesClinicIdFromCurrentUser()
    {
        var otherDoctorId = Guid.NewGuid();
        _repo.Setup(r => r.DeleteDoctorDayAsync(
            otherDoctorId, 5, ClinicId, It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        var handler = new DeleteDoctorDayCommandHandler(_repo.Object, _currentUser.Object);
        await handler.Handle(new DeleteDoctorDayCommand(otherDoctorId, 5), CancellationToken.None);

        // ClinicId vine din currentUser, nu din command
        _repo.Verify(r => r.DeleteDoctorDayAsync(
            otherDoctorId, 5, ClinicId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
