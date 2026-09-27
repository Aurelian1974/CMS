using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentStatuses;

/// <summary>Nomenclator statusuri programări.</summary>
public sealed record GetAppointmentStatusesQuery : IRequest<Result<IEnumerable<AppointmentStatusDto>>>;
