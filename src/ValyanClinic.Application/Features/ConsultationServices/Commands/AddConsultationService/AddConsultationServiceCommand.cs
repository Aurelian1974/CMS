using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;

/// <summary>Adaugă un serviciu din nomenclator; prețul în vigoare se copiază ca snapshot.</summary>
public sealed record AddConsultationServiceCommand(
    Guid ConsultationId,
    Guid MedicalServiceId,
    decimal Quantity = 1)
    : IRequest<Result<Guid>>;
