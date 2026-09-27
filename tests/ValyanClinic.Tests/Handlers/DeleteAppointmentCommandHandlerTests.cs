using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Appointments.Commands.DeleteAppointment;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class DeleteAppointmentCommandHandlerTests
{
    private static readonly Guid ClinicId      = Guid.Parse("A0000004-0000-0000-0000-000000000001");
    private static readonly Guid UserId        = Guid.Parse("B0000004-0000-0000-0000-000000000001");
    private static readonly Guid AppointmentId = Guid.Parse("C0000004-0000-0000-0000-000000000001");

    private readonly IAppointmentRepository _repo        = Substitute.For<IAppointmentRepository>();
    private readonly ICurrentUser           _currentUser = Substitute.For<ICurrentUser>();

    public DeleteAppointmentCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private DeleteAppointmentCommandHandler CreateHandler() => new(_repo, _currentUser);

    [Fact]
    public async Task Handle_ValidCommand_DeletesWithCurrentUserAndReturnsSuccess()
    {
        var result = await CreateHandler().Handle(new DeleteAppointmentCommand(AppointmentId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        await _repo.Received(1).DeleteAsync(AppointmentId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(SqlErrorCodes.AppointmentNotFound, 404)]
    [InlineData(SqlErrorCodes.AppointmentHasConsultation, 400)]
    [InlineData(50999, 400)]
    public async Task Handle_SqlError_MapsToExpectedStatus(int sqlNumber, int expectedStatus)
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(sqlNumber));

        var result = await CreateHandler().Handle(new DeleteAppointmentCommand(AppointmentId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(expectedStatus, result.StatusCode);
    }
}
