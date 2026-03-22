using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;

/// <summary>Creare programare nouă pentru clinica curentă.</summary>
public sealed record CreateAppointmentCommand(
    Guid PatientId,
    Guid DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid? StatusId,
    string? Notes
) : IRequest<Result<Guid>>;
