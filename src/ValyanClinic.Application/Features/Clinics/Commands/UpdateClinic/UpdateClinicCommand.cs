using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;

/// <summary>Actualizare date clinică (societate comercială) + sincronizare coduri CAEN.</summary>
public sealed record UpdateClinicCommand(
    string Name,
    string FiscalCode,
    string? TradeRegisterNumber,
    IEnumerable<Guid> CaenCodeIds,
    string? LegalRepresentative,
    string? ContractCNAS,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? BankName,
    string? BankAccount,
    string? Email,
    string? PhoneNumber,
    string? Website
) : IRequest<Result<bool>>;
