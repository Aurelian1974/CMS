using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.DeleteAppointment;

/// <summary>Soft delete programare.</summary>
public sealed record DeleteAppointmentCommand(Guid Id) : IRequest<Result<bool>>;
