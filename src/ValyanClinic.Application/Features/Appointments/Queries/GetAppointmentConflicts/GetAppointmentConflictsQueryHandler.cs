using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentConflicts;

public sealed class GetAppointmentConflictsQueryHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAppointmentConflictsQuery, Result<IEnumerable<AppointmentConflictDto>>>
{
    public async Task<Result<IEnumerable<AppointmentConflictDto>>> Handle(
        GetAppointmentConflictsQuery request, CancellationToken cancellationToken)
    {
        var conflicts = await repository.GetConflictsAsync(
            currentUser.ClinicId,
            request.DoctorId,
            request.StartTime,
            request.EndTime,
            request.ExcludeId,
            cancellationToken);

        return Result<IEnumerable<AppointmentConflictDto>>.Success(conflicts);
    }
}
