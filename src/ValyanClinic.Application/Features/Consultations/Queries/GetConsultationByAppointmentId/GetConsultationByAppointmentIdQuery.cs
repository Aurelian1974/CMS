using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultationByAppointmentId;

/// <summary>Obținere consultație după AppointmentId (dacă există).</summary>
public sealed record GetConsultationByAppointmentIdQuery(Guid AppointmentId) : IRequest<Result<ConsultationDetailDto?>>;
