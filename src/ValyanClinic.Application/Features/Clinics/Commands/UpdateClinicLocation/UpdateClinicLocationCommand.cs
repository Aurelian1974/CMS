using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicLocation;

/// <summary>Actualizare locație fizică existentă a clinicii.</summary>
public sealed record UpdateClinicLocationCommand(
    Guid Id,
    string Name,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary
) : IRequest<Result<bool>>;
