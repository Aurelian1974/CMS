using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru CreateAppointmentCommandHandler.
/// </summary>
public sealed class CreateAppointmentCommandHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A0000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B0000001-0000-0000-0000-000000000001");
    private static readonly Guid NewId    = Guid.Parse("C0000001-0000-0000-0000-000000000001");

    private readonly IAppointmentRepository _repo        = Substitute.For<IAppointmentRepository>();
    private readonly ICurrentUser           _currentUser = Substitute.For<ICurrentUser>();

    public CreateAppointmentCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private CreateAppointmentCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static CreateAppointmentCommand ValidCommand() => new(
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        StartTime: DateTime.UtcNow.AddHours(1),
        EndTime: DateTime.UtcNow.AddHours(2),
        StatusId: null,
        Notes: null);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        _repo.CreateAsync(
                ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<DateTime>(), Arg.Any<DateTime>(),
                Arg.Any<Guid?>(), Arg.Any<string?>(),
                UserId, Arg.Any<CancellationToken>())
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
                Arg.Any<DateTime>(), Arg.Any<DateTime>(),
                Arg.Any<Guid?>(), Arg.Any<string?>(),
                UserId, Arg.Any<CancellationToken>())
             .Returns(NewId);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).CreateAsync(
            ClinicId, Arg.Any<Guid>(), Arg.Any<Guid>(),
            Arg.Any<DateTime>(), Arg.Any<DateTime>(),
            Arg.Any<Guid?>(), Arg.Any<string?>(),
            UserId, Arg.Any<CancellationToken>());
    }

    // ── Conflict ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_AppointmentConflict_ReturnsConflict()
    {
        _repo.CreateAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<DateTime>(), Arg.Any<DateTime>(),
                Arg.Any<Guid?>(), Arg.Any<string?>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(MakeSqlException(SqlErrorCodes.AppointmentConflict));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(409, result.StatusCode);
    }

    // ── Generic SQL error ─────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.CreateAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<DateTime>(), Arg.Any<DateTime>(),
                Arg.Any<Guid?>(), Arg.Any<string?>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(MakeSqlException(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static Microsoft.Data.SqlClient.SqlException MakeSqlException(int number)
        => SqlExceptionHelper.Make(number);
}
