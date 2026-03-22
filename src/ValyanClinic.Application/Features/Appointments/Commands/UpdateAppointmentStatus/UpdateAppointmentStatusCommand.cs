using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;

/// <summary>Actualizare doar status programare (confirmare, finalizare, anulare).</summary>
public sealed record UpdateAppointmentStatusCommand(
    Guid Id,
    Guid StatusId
) : IRequest<Result<bool>>;
