using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;

/// <summary>Listare paginată programări cu căutare, filtre și statistici.</summary>
public sealed record GetAppointmentsQuery(
    string? Search = null,
    Guid? DoctorId = null,
    Guid? StatusId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "StartTime",
    string SortDir = "desc"
) : IRequest<Result<AppointmentsPagedResponse>>;

/// <summary>Răspunsul paginat include și statisticile globale.</summary>
public sealed class AppointmentsPagedResponse
{
    public required PagedResult<AppointmentListDto> PagedResult { get; init; }
    public required AppointmentStatsDto Stats { get; init; }
}
