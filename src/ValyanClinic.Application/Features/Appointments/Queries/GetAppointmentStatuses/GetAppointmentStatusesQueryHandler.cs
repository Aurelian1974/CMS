using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentStatuses;

public sealed class GetAppointmentStatusesQueryHandler(IAppointmentRepository repository)
    : IRequestHandler<GetAppointmentStatusesQuery, Result<IEnumerable<AppointmentStatusDto>>>
{
    public async Task<Result<IEnumerable<AppointmentStatusDto>>> Handle(
        GetAppointmentStatusesQuery request, CancellationToken cancellationToken)
    {
        var statuses = await repository.GetStatusesAsync(cancellationToken);
        return Result<IEnumerable<AppointmentStatusDto>>.Success(statuses);
    }
}
