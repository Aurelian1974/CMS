using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentConflicts;

/// <summary>Verifică disponibilitatea unui interval înainte de submit.</summary>
public sealed record GetAppointmentConflictsQuery(
    Guid DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid? ExcludeId
) : IRequest<Result<IEnumerable<AppointmentConflictDto>>>;
