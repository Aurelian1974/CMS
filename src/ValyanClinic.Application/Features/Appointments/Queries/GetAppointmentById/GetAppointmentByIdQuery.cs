using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentById;

/// <summary>Obținere detalii complete programare după Id.</summary>
public sealed record GetAppointmentByIdQuery(Guid Id) : IRequest<Result<AppointmentDetailDto>>;
