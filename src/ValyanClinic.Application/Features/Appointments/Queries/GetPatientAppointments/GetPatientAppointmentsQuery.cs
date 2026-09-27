using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetPatientAppointments;

/// <summary>Istoricul programărilor unui pacient (fișa pacientului).</summary>
public sealed record GetPatientAppointmentsQuery(Guid PatientId)
    : IRequest<Result<IEnumerable<AppointmentSchedulerDto>>>;
