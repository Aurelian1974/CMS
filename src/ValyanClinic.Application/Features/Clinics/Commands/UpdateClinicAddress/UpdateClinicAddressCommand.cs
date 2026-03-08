using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicAddress;

public sealed record UpdateClinicAddressCommand(
    Guid Id,
    string AddressType,
    string Street,
    string City,
    string County,
    string? PostalCode,
    string Country,
    bool IsMain
) : IRequest<Result<bool>>;
