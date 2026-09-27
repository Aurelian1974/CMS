using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Appointments.DTOs;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentStatuses;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class GetAppointmentStatusesQueryHandlerTests
{
    private readonly IAppointmentRepository _repo = Substitute.For<IAppointmentRepository>();

    [Fact]
    public async Task Handle_ReturnsStatusesFromRepository()
    {
        var statuses = new[]
        {
            new AppointmentStatusDto { Id = Guid.NewGuid(), Code = "PROGRAMAT", Name = "Programat", SortOrder = 1, BlocksSlot = true, AllowedNextCodes = "CONFIRMAT,ANULAT" },
            new AppointmentStatusDto { Id = Guid.NewGuid(), Code = "FINALIZAT", Name = "Finalizat", SortOrder = 3, BlocksSlot = true },
        };
        _repo.GetStatusesAsync(Arg.Any<CancellationToken>()).Returns(statuses);

        var result = await new GetAppointmentStatusesQueryHandler(_repo).Handle(new GetAppointmentStatusesQuery(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Same(statuses, result.Value);
    }
}
