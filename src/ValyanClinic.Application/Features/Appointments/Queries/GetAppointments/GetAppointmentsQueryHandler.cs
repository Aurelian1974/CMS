using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;

public sealed class GetAppointmentsQueryHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAppointmentsQuery, Result<AppointmentsPagedResponse>>
{
    public async Task<Result<AppointmentsPagedResponse>> Handle(
        GetAppointmentsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.DoctorId,
            request.StatusId,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        var response = new AppointmentsPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        };

        return Result<AppointmentsPagedResponse>.Success(response);
    }
}
