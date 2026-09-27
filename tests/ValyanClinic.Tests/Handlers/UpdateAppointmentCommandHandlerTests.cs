using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointment;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru UpdateAppointmentCommandHandler.
/// </summary>
public sealed class UpdateAppointmentCommandHandlerTests
{
    private static readonly Guid ClinicId      = Guid.Parse("A0000003-0000-0000-0000-000000000001");
    private static readonly Guid UserId        = Guid.Parse("B0000003-0000-0000-0000-000000000001");
    private static readonly Guid AppointmentId = Guid.Parse("C0000003-0000-0000-0000-000000000001");
    private static readonly byte[] RowVersion  = [0, 0, 0, 0, 0, 0, 7, 209];

    private readonly IAppointmentRepository _repo        = Substitute.For<IAppointmentRepository>();
    private readonly ICurrentUser           _currentUser = Substitute.For<ICurrentUser>();

    public UpdateAppointmentCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private UpdateAppointmentCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static UpdateAppointmentCommand ValidCommand() => new(
        Id: AppointmentId,
        PatientId: Guid.NewGuid(),
        DoctorId: Guid.NewGuid(),
        StartTime: DateTime.Today.AddDays(1).AddHours(10),
        EndTime: DateTime.Today.AddDays(1).AddHours(10).AddMinutes(30),
        StatusId: null,
        Notes: null,
        RowVersion: RowVersion);

    private void RepoThrows(int sqlNumber) =>
        _repo.UpdateAsync(Arg.Any<Guid>(), Arg.Any<byte[]?>(), Arg.Any<AppointmentWriteData>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(sqlNumber));

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
    }

    [Fact]
    public async Task Handle_PassesRowVersionAndCurrentUserToRepository()
    {
        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).UpdateAsync(
            AppointmentId,
            RowVersion,
            Arg.Is<AppointmentWriteData>(d => d.ClinicId == ClinicId && d.ActorId == UserId),
            Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(SqlErrorCodes.AppointmentNotFound, 404)]
    [InlineData(SqlErrorCodes.AppointmentPatientNotInClinic, 404)]
    [InlineData(SqlErrorCodes.AppointmentDoctorNotInClinic, 404)]
    [InlineData(SqlErrorCodes.AppointmentConflict, 409)]
    [InlineData(SqlErrorCodes.AppointmentConcurrency, 409)]
    [InlineData(SqlErrorCodes.AppointmentInvalidTransition, 400)]
    [InlineData(SqlErrorCodes.AppointmentHasConsultation, 400)]
    [InlineData(50999, 400)]
    public async Task Handle_SqlError_MapsToExpectedStatus(int sqlNumber, int expectedStatus)
    {
        RepoThrows(sqlNumber);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(expectedStatus, result.StatusCode);
    }
}
