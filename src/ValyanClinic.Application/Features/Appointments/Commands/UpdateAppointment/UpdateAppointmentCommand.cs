using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointment;

/// <summary>Actualizare programare existentă.</summary>
public sealed record UpdateAppointmentCommand(
    Guid Id,
    Guid PatientId,
    Guid DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid? StatusId,
    string? Notes
) : IRequest<Result<bool>>;
