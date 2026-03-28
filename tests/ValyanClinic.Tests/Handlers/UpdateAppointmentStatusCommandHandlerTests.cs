using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru UpdateAppointmentStatusCommandHandler.
/// </summary>
public sealed class UpdateAppointmentStatusCommandHandlerTests
{
    private static readonly Guid ClinicId  = Guid.Parse("A0000002-0000-0000-0000-000000000001");
    private static readonly Guid UserId    = Guid.Parse("B0000002-0000-0000-0000-000000000001");
    private static readonly Guid ApptId   = Guid.Parse("C0000002-0000-0000-0000-000000000001");
    private static readonly Guid StatusId  = Guid.Parse("D0000002-0000-0000-0000-000000000001");

    private readonly IAppointmentRepository _repo        = Substitute.For<IAppointmentRepository>();
    private readonly ICurrentUser           _currentUser = Substitute.For<ICurrentUser>();

    public UpdateAppointmentStatusCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private UpdateAppointmentStatusCommandHandler CreateHandler() =>
        new(_repo, _currentUser);

    private static UpdateAppointmentStatusCommand ValidCommand() =>
        new(Id: ApptId, StatusId: StatusId);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        _repo.UpdateStatusAsync(
                ApptId, ClinicId, StatusId, UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.UpdateStatusAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).UpdateStatusAsync(
            ApptId, ClinicId, StatusId, UserId, Arg.Any<CancellationToken>());
    }

    // ── Not found ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_AppointmentNotFound_ReturnsNotFound()
    {
        _repo.UpdateStatusAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.AppointmentNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    // ── Generic SQL error ─────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.UpdateStatusAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
