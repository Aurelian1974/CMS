using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;

/// <summary>Programări pentru vizualizarea scheduler (pe interval de date, opțional filtrat pe doctor).</summary>
public sealed record GetAppointmentsForSchedulerQuery(
    DateTime DateFrom,
    DateTime DateTo,
    Guid? DoctorId = null
) : IRequest<Result<IEnumerable<AppointmentSchedulerDto>>>;
