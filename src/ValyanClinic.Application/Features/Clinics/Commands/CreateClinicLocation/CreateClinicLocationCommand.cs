using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicLocation;

/// <summary>Creare locație fizică nouă pentru clinica curentă.</summary>
public sealed record CreateClinicLocationCommand(
    string Name,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary
) : IRequest<Result<Guid>>;
