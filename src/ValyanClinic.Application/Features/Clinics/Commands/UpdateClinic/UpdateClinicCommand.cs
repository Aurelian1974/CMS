using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;

/// <summary>Actualizare date generale clinică (societate comercială) + sincronizare coduri CAEN.
/// Adresele, conturile bancare și datele de contact se gestionează separat prin endpoint-uri dedicate.</summary>
public sealed record UpdateClinicCommand(
    string Name,
    string FiscalCode,
    string? TradeRegisterNumber,
    IEnumerable<Guid> CaenCodeIds,
    string? LegalRepresentative,
    string? ContractCNAS
) : IRequest<Result<bool>>;
