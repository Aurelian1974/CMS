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

    private void RepoThrows(int sqlNumber) =>
        _repo.CreateAsync(Arg.Any<AppointmentWriteData>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(sqlNumber));

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsCreated()
    {
        _repo.CreateAsync(Arg.Any<AppointmentWriteData>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(NewId, result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.CreateAsync(Arg.Any<AppointmentWriteData>(), Arg.Any<CancellationToken>())
             .Returns(NewId);

        var command = ValidCommand();
        await CreateHandler().Handle(command, default);

        await _repo.Received(1).CreateAsync(
            Arg.Is<AppointmentWriteData>(d =>
                d.ClinicId == ClinicId &&
                d.ActorId == UserId &&
                d.PatientId == command.PatientId &&
                d.DoctorId == command.DoctorId &&
                d.EnforceSchedule),
            Arg.Any<CancellationToken>());
    }

    // ── Erori business ────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_OverrideSchedule_DisablesScheduleEnforcement()
    {
        await CreateHandler().Handle(ValidCommand() with { OverrideSchedule = true }, default);

        await _repo.Received(1).CreateAsync(
            Arg.Is<AppointmentWriteData>(d => !d.EnforceSchedule),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AppointmentConflict_ReturnsConflict()
    {
        RepoThrows(SqlErrorCodes.AppointmentConflict);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(409, result.StatusCode);
    }

    [Theory]
    [InlineData(SqlErrorCodes.AppointmentPatientNotInClinic)]
    [InlineData(SqlErrorCodes.AppointmentDoctorNotInClinic)]
    public async Task Handle_EntityFromAnotherClinic_ReturnsNotFound(int sqlNumber)
    {
        RepoThrows(sqlNumber);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Theory]
    [InlineData(SqlErrorCodes.AppointmentInvalidStatus)]
    [InlineData(SqlErrorCodes.AppointmentOutsideSchedule)]
    [InlineData(SqlErrorCodes.AppointmentInvalidTimeRange)]
    [InlineData(50999)]
    public async Task Handle_OtherBusinessSqlError_ReturnsFailure(int sqlNumber)
    {
        RepoThrows(sqlNumber);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
